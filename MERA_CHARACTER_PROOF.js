// MERA isolated character proof C3 — Quaternius Adventurer.
// This page deliberately does not import or modify MERA's main game code.
// The model is a CC0 Quaternius asset mirrored in a public GitHub repository
// and served through jsDelivr for this disposable proof page.
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/FreePeak/opencombat@master/assets/characters/adventurer.glb';

function fail(err){
  const el=document.getElementById('error');
  el.textContent=err?.stack||err?.message||String(err);
  el.classList.remove('hidden');
  console.error(err);
}
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

 function chooseClip(clips,state){
   const names=clips.map(c=>c.name);
   const find=(patterns)=>{
     for(const rx of patterns){const hit=names.find(n=>rx.test(n));if(hit)return hit;}
     return null;
   };
   if(state==='IDLE') return find([/^idle$/i,/idle.*loop/i,/idle/i]);
   if(state==='WALK') return find([/^walk$/i,/walk.*loop/i,/walk/i]);
   if(state==='RUN') return find([/^run$/i,/run.*loop/i,/running/i,/jog/i,/sprint/i]);
   if(state==='JUMP_START') return find([/jump.*start/i,/jump.*up/i,/jump/i]);
   if(state==='JUMP_IDLE'||state==='JUMP_FALL') return find([/jump.*loop/i,/fall/i,/air/i,/jump/i]);
   if(state==='JUMP_LAND') return find([/jump.*land/i,/land/i,/jump/i]);
   return find([/^idle$/i,/idle/i]) || names[0] || null;
 }

 function Character(){
   const root=useRef();
   const model=useGLTF(MODEL_URL);
   const {actions}=useAnimations(model.animations,root);
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
     obj.traverse(o=>{
       if(o.isMesh||o.isSkinnedMesh){
         o.frustumCulled=false;
         o.castShadow=false;
         o.receiveShadow=false;
         const mats=Array.isArray(o.material)?o.material:[o.material];
         for(const m of mats){
           if(!m)continue;
           if('roughness' in m)m.roughness=Math.max(.58,m.roughness??.72);
         }
       }
     });
   },[model.scene]);

   useEffect(()=>{
     const names=model.animations.map(a=>a.name);
     document.getElementById('clip-list').textContent='Clips: '+(names.join(' · ')||'none reported');
     document.getElementById('model-state').textContent='READY · ADVENTURER';
   },[model.animations]);

   useEffect(()=>{
     const name=chooseClip(model.animations,animState);
     const next=(name&&actions?.[name]) || Object.values(actions||{})[0];
     if(!next)return;
     if(current.current===next){document.getElementById('anim-state').textContent=name||'—';return;}
     const prev=current.current;
     current.current=next;
     next.reset().fadeIn(.16).play();
     if(prev&&prev!==next)prev.fadeOut(.16);
     document.getElementById('anim-state').textContent=name||'—';
   },[actions,animState,model.animations]);

   // The preceding Quaternius proof faced correctly with zero additional yaw.
   // Keep the same convention here; this isolates the model swap from controls.
   return h('group',{ref:root,position:[0,-.88,0],rotation:[0,0,0]},
     h('group',{position:[0,norm.offset,0]},h('primitive',{object:model.scene}))
   );
 }

 function Input({controllerRef}){
   const pressed=useRef({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
   useEffect(()=>{
     const map={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'leftward',ArrowLeft:'leftward',KeyD:'rightward',ArrowRight:'rightward',ShiftLeft:'run',ShiftRight:'run',Space:'jump'};
     const sync=()=>{
       const c=controllerRef.current;if(c)c.setMovement({...pressed.current});
       const p=pressed.current,a=[];
       if(p.forward)a.push('W');if(p.backward)a.push('S');if(p.leftward)a.push('A');if(p.rightward)a.push('D');if(p.run)a.push('RUN');if(p.jump)a.push('JUMP');
       document.getElementById('input-state').textContent=a.length?a.join('+'):'—';
     };
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
   useFrame(()=>{
     const c=controllerRef.current,cc=controls.current;if(!c?.currPos||!cc)return;const p=c.currPos;
     if(!started.current){camera.position.set(p.x+4.2,p.y+2.8,p.z+6.2);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+.9,p.z,false);started.current=true;}
     else cc.moveTo(p.x,p.y+.9,p.z,true);
   });
   return h(EcctrlCameraControls,{ref:controls,makeDefault:true,smoothTime:.1,minDistance:2.7,maxDistance:6.5,minPolarAngle:.45,maxPolarAngle:1.34,dollyToCursor:false,truckSpeed:0});
 }

 function Diagnostics({controllerRef}){
   const n=useRef(0),t=useRef(performance.now());
   useFrame(()=>{
     const c=controllerRef.current;if(c)document.getElementById('ground-state').textContent=c.isFalling?'NO':'YES';
     n.current++;const now=performance.now();if(now-t.current>700){document.getElementById('fps').textContent=String(Math.round(n.current*1000/(now-t.current)));n.current=0;t.current=now;}
   });
   return null;
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

 function Player(){
   const ref=useRef();
   return h(React.Fragment,null,
     h(EcctrlAnimationStateController,{ecctrl:ref}),
     h(Input,{controllerRef:ref}),
     h(Ecctrl,{ref,position:[0,2,5],capsuleHalfHeight:.55,capsuleRadius:.32,floatHeight:.20,maxWalkVel:1.9,maxRunVel:3.3,accDeltaTime:.20,decDeltaTime:.20,jumpVel:4.8,slopeMaxAngle:.9,enableToggleRun:false,groundDetection:'shapeCast',friction:0,linearDamping:.15,angularDamping:1},h(Character,{})),
     h(Camera,{controllerRef:ref}),
     h(Diagnostics,{controllerRef:ref})
   );
 }

 function Scene(){
   return h(React.Fragment,null,
     h('color',{attach:'background',args:['#8b9a91']}),
     h('fog',{attach:'fog',args:['#8b9a91',18,46]}),
     h('hemisphereLight',{intensity:1.15,color:'#eaf2ed',groundColor:'#4a5447'}),
     h('directionalLight',{position:[6,12,8],intensity:1.25,color:'#ffffff'}),
     h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},h(Course),h(Player))
   );
 }

 createRoot(document.getElementById('root')).render(
   h(Suspense,{fallback:null},h(Canvas,{camera:{fov:48,near:.1,far:100},dpr:[1,1.35],gl:{antialias:true}},h(Scene)))
 );
}catch(err){fail(err);}
})();
