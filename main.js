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
    const { KeyboardControls, useGLTF, useAnimations, Environment, ContactShadows } = drei;
    const { Physics, RigidBody } = rapier;
    const { EcctrlAnimationStateController, useEcctrlAnimationStore } = animPkg;
    const { EcctrlCameraControls } = cameraPkg;
    const h = React.createElement;
    const { Suspense, useEffect, useMemo, useRef, useState } = React;

    const keyboardMap = [
      { name:'forward', keys:['ArrowUp','KeyW'] },
      { name:'backward', keys:['ArrowDown','KeyS'] },
      { name:'leftward', keys:['ArrowLeft','KeyA'] },
      { name:'rightward', keys:['ArrowRight','KeyD'] },
      { name:'jump', keys:['Space'] },
      { name:'run', keys:['ShiftLeft','ShiftRight'] }
    ];

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
      const cloned = useMemo(() => scene.clone(true), [scene]);
      const { actions } = useAnimations(animations, group);
      const animState = useEcctrlAnimationStore(s => s.animationState);

      useEffect(() => {
        cloned.traverse(obj => {
          if(obj.isMesh){
            obj.castShadow = true;
            obj.receiveShadow = true;
            if(obj.material){
              const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
              for(const m of materials){
                m.roughness = Math.max(.55, m.roughness ?? .7);
              }
            }
          }
        });
        onReady?.();
      }, [cloned, onReady]);

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
        h('primitive',{object:cloned})
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

      return h(KeyboardControls,{map:keyboardMap},
        h(Canvas,{
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
        )
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
