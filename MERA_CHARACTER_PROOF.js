const boot = document.getElementById('boot');
const enterBtn = document.getElementById('enter');
const bootStatus = document.getElementById('boot-status');
const loadfill = document.getElementById('loadfill');
const bootError = document.getElementById('boot-error');
const hud = document.getElementById('hud');
const help = document.getElementById('help');
const checklist = document.getElementById('checklist');

window.addEventListener('error', (event) => {
  if (!boot.classList.contains('hidden')) showBootError(event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  if (!boot.classList.contains('hidden')) showBootError(event.reason);
});

function showBootError(err) {
  const message = err?.stack || err?.message || String(err);
  bootStatus.textContent = 'E1 failed to initialize.';
  bootError.textContent = message;
  bootError.classList.remove('hidden');
  enterBtn.disabled = true;
}

async function bootApp() {
  try {
    loadfill.style.width = '18%';
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const THREE = await import('three');
    loadfill.style.width = '34%';

    const fiber = await import('@react-three/fiber');
    const drei = await import('@react-three/drei');
    const rapier = await import('@react-three/rapier');
    loadfill.style.width = '56%';

    const { Ecctrl } = await import('ecctrl');
    const animPkg = await import('ecctrl/animation');
    const cameraPkg = await import('ecctrl/camera');
    loadfill.style.width = '72%';

    const { Canvas, useFrame, useThree } = fiber;
    const { useGLTF, useAnimations, ContactShadows } = drei;
    const { Physics, RigidBody } = rapier;
    const { EcctrlAnimationStateController, useEcctrlAnimationStore } = animPkg;
    const { EcctrlCameraControls } = cameraPkg;
    const h = React.createElement;
    const { Suspense, useEffect, useMemo, useRef, useState } = React;


    const TEST_CHARACTER_URL = 'https://threejs.org/examples/models/gltf/Soldier.glb';

    class ModelBoundary extends React.Component {
      constructor(props){ super(props); this.state={error:null}; }
      static getDerivedStateFromError(error){ return {error}; }
      componentDidCatch(error){ showBootError(error); }
      render(){
        if(this.state.error) return h(ProceduralFallback, null);
        return this.props.children;
      }
    }

    function ProceduralFallback(){
      const mat = '#6f7654';
      return h('group', {position:[0,-0.88,0]},
        h('mesh',{position:[0,1.35,0],castShadow:true},h('capsuleGeometry',{args:[0.34,0.85,8,16]}),h('meshStandardMaterial',{color:mat,roughness:.9})),
        h('mesh',{position:[0,2.12,0],castShadow:true},h('sphereGeometry',{args:[0.23,20,16]}),h('meshStandardMaterial',{color:'#caa98b',roughness:.9})),
        h('mesh',{position:[-.17,.55,0],castShadow:true},h('capsuleGeometry',{args:[.10,.72,6,10]}),h('meshStandardMaterial',{color:'#31342e'})),
        h('mesh',{position:[.17,.55,0],castShadow:true},h('capsuleGeometry',{args:[.10,.72,6,10]}),h('meshStandardMaterial',{color:'#31342e'}))
      );
    }

    function AnimatedCharacter({onReady}){
      const group = useRef();
      const { scene, animations } = useGLTF(TEST_CHARACTER_URL);
      const { actions } = useAnimations(animations, group);
      const animState = useEcctrlAnimationStore(s => s.animationState);
      const shellParts = useRef([]);
      const originalParts = useRef([]);
      const built = useRef(false);

      useEffect(() => {
        if (built.current) return;
        built.current = true;

        // Keep the proven Soldier skeleton and its embedded clips, but hide the
        // actual armour meshes.  Physics never depends on any of these visuals.
        scene.traverse(obj => {
          if(obj.isSkinnedMesh || (obj.isMesh && /vanguard/i.test(obj.name || ''))){
            originalParts.current.push(obj);
            obj.visible = false;
          }
        });

        const jacket = new THREE.MeshStandardMaterial({color:'#6f7350',roughness:.96,metalness:0});
        const jacketDark = new THREE.MeshStandardMaterial({color:'#51563e',roughness:.98,metalness:0});
        const trousers = new THREE.MeshStandardMaterial({color:'#292c2a',roughness:.98,metalness:0});
        const boots = new THREE.MeshStandardMaterial({color:'#3b2e26',roughness:1,metalness:0});
        const skin = new THREE.MeshStandardMaterial({color:'#c79b7b',roughness:.92,metalness:0});
        const hair = new THREE.MeshStandardMaterial({color:'#2a211d',roughness:1,metalness:0});
        const packMat = new THREE.MeshStandardMaterial({color:'#8a6b43',roughness:1,metalness:0});
        const packDark = new THREE.MeshStandardMaterial({color:'#59452f',roughness:1,metalness:0});

        const addPart = (parent, geometry, material, position=[0,0,0], rotation=[0,0,0], scale=[1,1,1]) => {
          if(!parent) return null;
          const m = new THREE.Mesh(geometry, material);
          m.position.set(...position);
          m.rotation.set(...rotation);
          m.scale.set(...scale);
          m.castShadow = true;
          m.receiveShadow = true;
          parent.add(m);
          shellParts.current.push(m);
          return m;
        };

        const bone = (...names) => names.map(n=>scene.getObjectByName(n)).find(Boolean);

        // A limb segment is generated from the actual local vector to its child
        // bone, so its orientation comes from the proven rig rather than guesses.
        const addSegment = (aNames, bNames, radius, material, taper=1) => {
          const a=bone(...aNames), b=bone(...bNames);
          if(!a || !b) return;
          const v=b.position.clone();
          const len=v.length();
          if(len < .03) return;
          const r=Math.min(radius, len*.28);
          const g=new THREE.CapsuleGeometry(r, Math.max(.015,len-2*r), 5, 10);
          const m=new THREE.Mesh(g,material);
          m.position.copy(v).multiplyScalar(.5);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());
          m.scale.x=taper; m.scale.z=taper;
          m.castShadow=true; m.receiveShadow=true;
          a.add(m); shellParts.current.push(m);
        };

        const hips=bone('mixamorigHips');
        const spine=bone('mixamorigSpine');
        const spine1=bone('mixamorigSpine1','mixamorigSpine01');
        const spine2=bone('mixamorigSpine2','mixamorigSpine02', 'mixamorigSpine1');
        const neck=bone('mixamorigNeck');
        const head=bone('mixamorigHead');

        // Jacket/torso. These are intentionally simple, low-risk rigid garments
        // mounted on spine bones rather than a new skinned mesh.
        addPart(spine1 || spine,
          new THREE.CapsuleGeometry(.245,.31,6,12), jacket,
          [0,.10,0],[0,0,0],[1.16,1.0,.72]);
        addPart(spine2 || spine1 || spine,
          new THREE.CylinderGeometry(.27,.245,.20,12), jacketDark,
          [0,.035,0],[0,0,0],[1.02,1,.72]);
        addPart(hips,
          new THREE.CapsuleGeometry(.235,.12,5,10), trousers,
          [0,.02,0],[0,0,0],[1.08,1,.72]);

        // Sleeves, trousers and exposed hands.
        addSegment(['mixamorigLeftArm'],['mixamorigLeftForeArm'],.105,jacket,1.0);
        addSegment(['mixamorigLeftForeArm'],['mixamorigLeftHand'],.088,jacketDark,.96);
        addSegment(['mixamorigRightArm'],['mixamorigRightForeArm'],.105,jacket,1.0);
        addSegment(['mixamorigRightForeArm'],['mixamorigRightHand'],.088,jacketDark,.96);
        addSegment(['mixamorigLeftUpLeg'],['mixamorigLeftLeg'],.13,trousers,1.02);
        addSegment(['mixamorigLeftLeg'],['mixamorigLeftFoot'],.105,trousers,.96);
        addSegment(['mixamorigRightUpLeg'],['mixamorigRightLeg'],.13,trousers,1.02);
        addSegment(['mixamorigRightLeg'],['mixamorigRightFoot'],.105,trousers,.96);

        const lHand=bone('mixamorigLeftHand'), rHand=bone('mixamorigRightHand');
        addPart(lHand,new THREE.SphereGeometry(.095,12,10),skin,[0,.015,0],[0,0,0],[.82,1.05,.72]);
        addPart(rHand,new THREE.SphereGeometry(.095,12,10),skin,[0,.015,0],[0,0,0],[.82,1.05,.72]);

        // Head and short hair: intentionally civilian and unhelmeted.
        addPart(head,new THREE.SphereGeometry(.185,18,14),skin,[0,.115,0],[0,0,0],[.90,1.10,.86]);
        addPart(head,new THREE.SphereGeometry(.19,18,12,0,Math.PI*2,0,Math.PI*.58),hair,[0,.15,0],[0,0,0],[.93,.78,.90]);
        addPart(neck,new THREE.CylinderGeometry(.085,.095,.13,10),skin,[0,.05,0]);

        // Hiking boots follow the animated feet but remain render-only.
        const lFoot=bone('mixamorigLeftFoot'), rFoot=bone('mixamorigRightFoot');
        addPart(lFoot,new THREE.BoxGeometry(.18,.15,.36),boots,[0,.025,.11],[0,0,0],[1,1,1]);
        addPart(rFoot,new THREE.BoxGeometry(.18,.15,.36),boots,[0,.025,.11],[0,0,0],[1,1,1]);

        // Infer which local Z side is the back from the visor location. If the
        // inference is ambiguous the conservative Mixamo fallback is -Z.
        let backZ=-.23;
        try{
          scene.updateMatrixWorld(true);
          const visor=scene.getObjectByName('vanguard_visor');
          if(visor && spine2){
            const vb=new THREE.Box3().setFromObject(visor).getCenter(new THREE.Vector3());
            const sb=spine2.getWorldPosition(new THREE.Vector3());
            const frontSign=Math.sign(vb.z-sb.z) || 1;
            backZ=-frontSign*.23;
          }
        }catch(_e){}

        if(spine2){
          const pack=new THREE.Group();
          pack.position.set(0,.02,backZ);
          const body=new THREE.Mesh(new THREE.BoxGeometry(.34,.46,.19),packMat);
          body.position.y=.02; body.castShadow=true; pack.add(body); shellParts.current.push(body);
          const flap=new THREE.Mesh(new THREE.BoxGeometry(.32,.13,.205),packDark);
          flap.position.set(0,.16,0); flap.castShadow=true; pack.add(flap); shellParts.current.push(flap);
          const roll=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.38,10),jacketDark);
          roll.rotation.z=Math.PI/2; roll.position.set(0,.28,0); roll.castShadow=true; pack.add(roll); shellParts.current.push(roll);
          const strapL=new THREE.Mesh(new THREE.BoxGeometry(.035,.43,.025),packDark);
          const strapR=strapL.clone(); strapL.position.set(-.13,.015,-backZ*.64); strapR.position.set(.13,.015,-backZ*.64);
          pack.add(strapL,strapR); shellParts.current.push(strapL,strapR);
          spine2.add(pack); shellParts.current.push(pack);
        }

        // Compare key: V toggles the hidden original armour on/off. This is only
        // for the proof page and will not be part of MERA if the shell passes.
        let original=false;
        const applyMode=()=>{
          for(const m of originalParts.current) m.visible=original;
          for(const m of shellParts.current) m.visible=!original;
          const el=document.getElementById('body-mode');
          if(el) el.textContent=original?'ORIGINAL':'FIELD';
        };
        applyMode();
        const onKey=(e)=>{ if(e.code==='KeyV'){ original=!original; applyMode(); } };
        window.addEventListener('keydown',onKey);
        scene.userData.meraCharacterCleanup=()=>window.removeEventListener('keydown',onKey);
        return ()=>{ scene.userData.meraCharacterCleanup?.(); };
      }, [scene]);

      useEffect(() => {
        if(actions?.Idle && actions?.Walk && actions?.Run) onReady?.();
      }, [actions, onReady]);

      useEffect(() => {
        const map = {
          IDLE:'Idle', WALK:'Walk', RUN:'Run',
          JUMP_START:'Idle', JUMP_IDLE:'Idle', JUMP_FALL:'Idle', JUMP_LAND:'Idle'
        };
        const next = actions?.[map[animState]] || actions?.Idle;
        if(!next) return;
        next.reset().fadeIn(.16).play();
        return () => next.fadeOut(.16);
      }, [actions, animState]);

      return h('group',{ref:group,position:[0,-.88,0],rotation:[0,Math.PI,0],scale:.92},
        h('primitive',{object:scene})
      );
    }

    function TestWorld(){
      const groundMat = h('meshStandardMaterial',{color:'#6f8065',roughness:1});
      const pathMat = h('meshStandardMaterial',{color:'#83735f',roughness:1});
      return h(React.Fragment,null,
        h(RigidBody,{type:'fixed',colliders:'cuboid',friction:1},
          h('mesh',{position:[0,-.25,0],receiveShadow:true},
            h('boxGeometry',{args:[30,.5,34]}),groundMat
          )
        ),
        h(RigidBody,{type:'fixed',colliders:'cuboid',friction:1,position:[5,.63,-3],rotation:[-.20,0,0]},
          h('mesh',{receiveShadow:true,castShadow:true},
            h('boxGeometry',{args:[4,.35,8]}),pathMat
          )
        ),
        h(RigidBody,{type:'fixed',colliders:'cuboid',friction:1,position:[-5,.22,-2]},
          h('mesh',{receiveShadow:true,castShadow:true},
            h('boxGeometry',{args:[3,.44,3]}),pathMat
          )
        ),
        h(RigidBody,{type:'fixed',colliders:'cuboid',friction:1,position:[-5,.52,-5]},
          h('mesh',{receiveShadow:true,castShadow:true},
            h('boxGeometry',{args:[3,1.04,3]}),pathMat
          )
        ),
        h('gridHelper',{args:[30,30,'#39463a','#556356'],position:[0,.012,0]}),
        h('group',{position:[5,0,-7]},
          h('mesh',{position:[0,.06,0],rotation:[-Math.PI/2,0,0]},h('ringGeometry',{args:[.65,.85,32]}),h('meshBasicMaterial',{color:'#d8c784',side:THREE.DoubleSide}))
        )
      );
    }

    function FollowCamera({controllerRef}){
      const controls = useRef();
      const { camera } = useThree();
      const up = useMemo(() => new THREE.Vector3(0,1,0), []);
      const started = useRef(false);
      useFrame(() => {
        const c = controllerRef.current;
        const cc = controls.current;
        if(!c || !cc) return;
        const p = c.currPos;
        if(!p) return;
        if(!started.current){
          camera.position.set(p.x+4.8,p.y+3.2,p.z+6.2);
          cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+1.0,p.z,false);
          started.current=true;
        } else {
          cc.moveTo(p.x,p.y+1.0,p.z,true);
        }
        if(c.upAxis){ up.copy(c.upAxis); camera.up.lerp(up,.12); cc.setUp(camera.up); }
      });
      return h(cameraPkg.EcctrlCameraControls,{
        ref:controls,makeDefault:true,smoothTime:.12,
        minDistance:3.2,maxDistance:8.0,
        minPolarAngle:.45,maxPolarAngle:1.35,
        dollyToCursor:false,truckSpeed:0,
        azimuthRotateSpeed:.8,polarRotateSpeed:.8
      });
    }


    function DirectKeyboardInput({controllerRef}){
      const pressed = useRef({
        forward:false, backward:false, leftward:false, rightward:false,
        run:false, jump:false
      });

      useEffect(() => {
        const keyToField = {
          KeyW:'forward', ArrowUp:'forward',
          KeyS:'backward', ArrowDown:'backward',
          KeyA:'leftward', ArrowLeft:'leftward',
          KeyD:'rightward', ArrowRight:'rightward',
          ShiftLeft:'run', ShiftRight:'run',
          Space:'jump'
        };

        const sync = () => {
          const c = controllerRef.current;
          const activeScene = boot.classList.contains('hidden');
          if(c) c.setMovement(activeScene ? {...pressed.current} : {forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
          const el = document.getElementById('input-state');
          if(el){
            const p=pressed.current;
            const active=[];
            if(p.forward) active.push('W');
            if(p.backward) active.push('S');
            if(p.leftward) active.push('A');
            if(p.rightward) active.push('D');
            if(p.run) active.push('RUN');
            if(p.jump) active.push('JUMP');
            el.textContent = active.length ? active.join(' + ') : '—';
          }
        };

        const onKeyDown = (e) => {
          const field = keyToField[e.code];
          if(!field) return;
          e.preventDefault();
          if(!pressed.current[field]){
            pressed.current[field] = true;
            sync();
          }
        };
        const onKeyUp = (e) => {
          const field = keyToField[e.code];
          if(!field) return;
          e.preventDefault();
          if(pressed.current[field]){
            pressed.current[field] = false;
            sync();
          }
        };
        const clear = () => {
          for(const k of Object.keys(pressed.current)) pressed.current[k]=false;
          sync();
        };
        window.addEventListener('keydown', onKeyDown, {passive:false});
        window.addEventListener('keyup', onKeyUp, {passive:false});
        window.addEventListener('blur', clear);
        return () => {
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('keyup', onKeyUp);
          window.removeEventListener('blur', clear);
        };
      }, [controllerRef]);

      useFrame(() => {
        const c=controllerRef.current;
        if(!c) return;
        if(boot.classList.contains('hidden')) c.setMovement({...pressed.current});
        else c.setMovement({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
      });
      return null;
    }

    function Diagnostics({controllerRef}){
      const animState = useEcctrlAnimationStore(s=>s.animationState);
      const frames = useRef(0), last = useRef(performance.now());
      useEffect(()=>{ document.getElementById('anim-state').textContent=animState; },[animState]);
      useFrame(() => {
        const c=controllerRef.current;
        if(c){
          document.getElementById('grounded').textContent = c.isOnGround ? 'YES' : 'NO';
          document.getElementById('speed').textContent = Number(c.moveSpeed || 0).toFixed(2);
        }
        frames.current++;
        const now=performance.now();
        if(now-last.current>500){
          const fps=Math.round(frames.current*1000/(now-last.current));
          document.getElementById('fps').textContent=String(fps);
          frames.current=0;last.current=now;
        }
      });
      return null;
    }

    function Player({onCharacterReady}){
      const controllerRef = useRef();
      return h(React.Fragment,null,
        h(EcctrlAnimationStateController,{ecctrl:controllerRef}),
        h(DirectKeyboardInput,{controllerRef}),
        h(Ecctrl,{
          ref:controllerRef,
          position:[0,2,6],
          capsuleHalfHeight:.55,
          capsuleRadius:.32,
          floatHeight:.20,
          maxWalkVel:2.25,
          maxRunVel:4.8,
          jumpVel:4.8,
          slopeMaxAngle:.9,
          enableToggleRun:false,
          groundDetection:'shapeCast',
          friction:0,
          linearDamping:.15,
          angularDamping:1.0
        },
          h(ModelBoundary,null,h(AnimatedCharacter,{onReady:onCharacterReady}))
        ),
        h(FollowCamera,{controllerRef}),
        h(Diagnostics,{controllerRef})
      );
    }

    function Scene({onCharacterReady}){
      return h(React.Fragment,null,
        h('color',{attach:'background',args:['#90a99b']}),
        h('fog',{attach:'fog',args:['#90a99b',20,52]}),
        h('hemisphereLight',{intensity:1.15,color:'#e6f2ed',groundColor:'#4a5848'}),
        h('directionalLight',{position:[-7,13,8],intensity:2.2,castShadow:true,'shadow-mapSize-width':1024,'shadow-mapSize-height':1024,'shadow-camera-left':-16,'shadow-camera-right':16,'shadow-camera-top':16,'shadow-camera-bottom':-16}),
        h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},
          h(TestWorld,null),
          h(Player,{onCharacterReady})
        ),
        h(ContactShadows,{position:[0,.02,0],opacity:.35,scale:22,blur:2.5,far:10,resolution:512})
      );
    }

    function App(){
      const [ready,setReady]=useState(false);
      const once=useRef(false);
      const onCharacterReady=React.useCallback(()=>{
        if(once.current) return;
        once.current=true;
        setReady(true);
        bootStatus.textContent='Ecctrl, Rapier and animated character ready.';
        loadfill.style.width='100%';
        enterBtn.disabled=false;
      },[]);

      useEffect(()=>{
        if(!ready) return;
        enterBtn.onclick=()=>{
          boot.classList.add('hidden');
          hud.classList.remove('hidden');
          help.classList.remove('hidden');
          checklist.classList.remove('hidden');
        };
      },[ready]);

      return h(Canvas,{
          shadows:true,
          dpr:[1,1.35],
          camera:{position:[4.8,3.2,12],fov:53,near:.1,far:100},
          gl:{antialias:true,powerPreference:'high-performance'},
          onCreated:({gl})=>{
            gl.outputColorSpace=THREE.SRGBColorSpace;
            gl.toneMapping=THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure=1.05;
            loadfill.style.width='82%';
          }
        },
          h(Suspense,{fallback:null},h(Scene,{onCharacterReady}))
      );
    }

    const root=createRoot(document.getElementById('root'));
    root.render(h(App));

    // If the character/model host never resolves, make that explicit rather than leaving a dead screen.
    setTimeout(()=>{
      if(enterBtn.disabled && bootError.classList.contains('hidden')){
        bootStatus.textContent='Still loading the external test character. If this persists, check network/CDN access.';
      }
    },12000);
  } catch(err){
    showBootError(err);
  }
}

bootApp();
