const MODEL_URL='https://cdn.jsdelivr.net/gh/Seyamalam/blood-league-kickoff@main/public/assets/vendor/quaternius/night-striker.glb';
const ANIM_URL='https://cdn.jsdelivr.net/gh/Seyamalam/blood-league-kickoff@main/public/assets/vendor/quaternius/universal-animation-library.glb';

function fail(err){const el=document.getElementById('error');el.textContent=err?.stack||err?.message||String(err);el.classList.remove('hidden');console.error(err);}
window.addEventListener('error',e=>fail(e.error||e.message));
window.addEventListener('unhandledrejection',e=>fail(e.reason));

(async()=>{
try{
 const React=await import('react');
 const {createRoot}=await import('react-dom/client');
 const THREE=await import('three');
 const {Canvas,useFrame,useThree}=await import('@react-three/fiber');
 const {useGLTF,useAnimations}=await import('@react-three/drei');
 const {Physics,RigidBody,CuboidCollider}=await import('@react-three/rapier');
 const {Ecctrl}=await import('ecctrl');
 const {EcctrlAnimationStateController,useEcctrlAnimationStore}=await import('ecctrl/animation');
 const {EcctrlCameraControls}=await import('ecctrl/camera');
 const h=React.createElement;
 const {useEffect,useLayoutEffect,useMemo,useRef,useState,Suspense}=React;

 function Character({onReady}){
   const root=useRef();
   const visual=useRef();
   const model=useGLTF(MODEL_URL);
   const animLib=useGLTF(ANIM_URL);
   const {actions}=useAnimations(animLib.animations,root);
   const animState=useEcctrlAnimationStore(s=>s.animationState);
   const [norm,setNorm]=useState({scale:1,offset:0});
   const current=useRef(null);

   useLayoutEffect(()=>{
     const obj=model.scene;
     obj.updateMatrixWorld(true);
     const box=new THREE.Box3().setFromObject(obj);
     const height=Math.max(.001,box.max.y-box.min.y);
     const scale=1.76/height;
     obj.scale.setScalar(scale);
     obj.updateMatrixWorld(true);
     const b2=new THREE.Box3().setFromObject(obj);
     setNorm({scale,offset:-b2.min.y});
     obj.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.frustumCulled=false;if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material])){if('roughness' in m)m.roughness=Math.max(.58,m.roughness??.7);}}}});
   },[model.scene]);

   useEffect(()=>{
     const names=animLib.animations.map(a=>a.name);
     document.getElementById('clip-list').textContent='Clips: '+names.filter(n=>/idle|walk|jog|sprint|jump/i.test(n)).join(' · ');
     document.getElementById('model-state').textContent='READY';
     onReady?.();
   },[animLib.animations,onReady]);

   useEffect(()=>{
     const map={IDLE:'Idle_Loop',WALK:'Walk_Loop',RUN:'Jog_Fwd_Loop',JUMP_START:'Jump_Start',JUMP_IDLE:'Jump_Loop',JUMP_FALL:'Jump_Loop',JUMP_LAND:'Jump_Land'};
     let name=map[animState]||'Idle_Loop';
     let next=actions?.[name];
     if(!next && animState==='RUN') {name='Sprint_Loop';next=actions?.[name];}
     if(!next && /JUMP/.test(animState)) {name='Idle_Loop';next=actions?.[name];}
     if(!next) next=actions?.Idle_Loop || Object.values(actions||{})[0];
     if(!next)return;
     if(current.current===next){document.getElementById('anim-state').textContent=name;return;}
     const prev=current.current; current.current=next;
     next.reset().fadeIn(.16).play();
     if(prev&&prev!==next)prev.fadeOut(.16);
     document.getElementById('anim-state').textContent=name;
   },[actions,animState]);

   return h('group',{ref:root,position:[0,-.88,0],rotation:[0,Math.PI,0]},
     h('group',{ref:visual,position:[0,norm.offset,0]},h('primitive',{object:model.scene}))
   );
 }

 function Input({controllerRef}){
   const pressed=useRef({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
   useEffect(()=>{
     const map={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'leftward',ArrowLeft:'leftward',KeyD:'rightward',ArrowRight:'rightward',ShiftLeft:'run',ShiftRight:'run',Space:'jump'};
     const sync=()=>{const c=controllerRef.current;if(c)c.setMovement({...pressed.current});const p=pressed.current,a=[];if(p.forward)a.push('W');if(p.backward)a.push('S');if(p.leftward)a.push('A');if(p.rightward)a.push('D');if(p.run)a.push('RUN');if(p.jump)a.push('JUMP');document.getElementById('input-state').textContent=a.length?a.join('+'):'—';};
     const dn=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=true;sync();};
     const up=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=false;sync();};
     const clear=()=>{Object.keys(pressed.current).forEach(k=>pressed.current[k]=false);sync();};
     addEventListener('keydown',dn,{passive:false});addEventListener('keyup',up,{passive:false});addEventListener('blur',clear);
     return()=>{removeEventListener('keydown',dn);removeEventListener('keyup',up);removeEventListener('blur',clear);};
   },[controllerRef]);
   useFrame(()=>controllerRef.current?.setMovement({...pressed.current}));
   return null;
 }

 function Camera({controllerRef}){
   const controls=useRef();const {camera}=useThree();const started=useRef(false);
   useFrame(()=>{const c=controllerRef.current,cc=controls.current;if(!c?.currPos||!cc)return;const p=c.currPos;if(!started.current){camera.position.set(p.x+4.2,p.y+2.8,p.z+6.2);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+.9,p.z,false);started.current=true;}else cc.moveTo(p.x,p.y+.9,p.z,true);});
   return h(EcctrlCameraControls,{ref:controls,makeDefault:true,smoothTime:.1,minDistance:2.7,maxDistance:6.5,minPolarAngle:.45,maxPolarAngle:1.34,dollyToCursor:false,truckSpeed:0});
 }

 function Diagnostics({controllerRef}){
   const n=useRef(0),t=useRef(performance.now());
   useFrame(()=>{const c=controllerRef.current;if(c){document.getElementById('ground-state').textContent=c.isFalling?'NO':'YES';}n.current++;const now=performance.now();if(now-t.current>700){document.getElementById('fps').textContent=String(Math.round(n.current*1000/(now-t.current)));n.current=0;t.current=now;}});return null;
 }

 function Course(){
   const groundMat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#72866e',roughness:1}),[]);
   const stepMat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#786a55',roughness:.95}),[]);
   const rampMat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#66735f',roughness:1}),[]);
   return h(React.Fragment,null,
     h(RigidBody,{type:'fixed',colliders:false},h('mesh',{position:[0,-.25,0],material:groundMat},h('boxGeometry',{args:[50,.5,50]})),h(CuboidCollider,{args:[25,.25,25],position:[0,-.25,0]})),
     h(RigidBody,{type:'fixed',colliders:false,position:[-5,.15,-4]},h('mesh',{material:rampMat,rotation:[0,0,-.20]},h('boxGeometry',{args:[6,.35,10]})),h(CuboidCollider,{args:[3,.175,5],rotation:[0,0,-.20]})),
     ...[0,1,2].map(i=>h(RigidBody,{key:'s'+i,type:'fixed',colliders:false,position:[5,.18+i*.18,-2-i*1.35]},h('mesh',{material:stepMat},h('boxGeometry',{args:[3,.36,1.4]})),h(CuboidCollider,{args:[1.5,.18,.7]})))
   );
 }

 function Player(){const ref=useRef();return h(React.Fragment,null,
   h(EcctrlAnimationStateController,{ecctrl:ref}),h(Input,{controllerRef:ref}),
   h(Ecctrl,{ref,position:[0,2,5],capsuleHalfHeight:.55,capsuleRadius:.32,floatHeight:.20,maxWalkVel:1.9,maxRunVel:3.3,accDeltaTime:.20,decDeltaTime:.20,jumpVel:4.8,slopeMaxAngle:.9,enableToggleRun:false,groundDetection:'shapeCast',friction:0,linearDamping:.15,angularDamping:1},h(Character,{})),
   h(Camera,{controllerRef:ref}),h(Diagnostics,{controllerRef:ref})
 );}

 function Scene(){return h(React.Fragment,null,
   h('color',{attach:'background',args:['#8b9a91']}),h('fog',{attach:'fog',args:['#8b9a91',18,46]}),h('hemisphereLight',{intensity:1.15,color:'#eaf2ed',groundColor:'#4a5447'}),h('directionalLight',{position:[6,12,8],intensity:1.25,color:'#ffffff'}),
   h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},h(Course),h(Player))
 );}

 createRoot(document.getElementById('root')).render(h(Suspense,{fallback:null},h(Canvas,{camera:{fov:48,near:.1,far:100},dpr:[1,1.35],gl:{antialias:true}},h(Scene))));
}catch(err){fail(err);}
})();
