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
   const model=useGLTF(MODEL_URL);
   const animLib=useGLTF(ANIM_URL);
   const {actions}=useAnimations(animLib.animations,root);
   const animState=useEcctrlAnimationStore(s=>s.animationState);
   const [norm,setNorm]=useState({scale:1,offset:0});
   const current=useRef(null);
   const dressed=useRef(false);

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
         if(o.material){
           for(const m of (Array.isArray(o.material)?o.material:[o.material])){
             if('roughness' in m)m.roughness=Math.max(.62,m.roughness??.75);
           }
         }
       }
     });

     // Dress the existing Quaternius skeleton rather than replacing the rig.
     // These meshes are render-only children of the animated bones: no physics,
     // controller or animation data is changed.
     if(!dressed.current){
       dressed.current=true;
       const jacket=new THREE.MeshStandardMaterial({color:'#677052',roughness:.96,metalness:0});
       const jacketDark=new THREE.MeshStandardMaterial({color:'#4f5740',roughness:.98,metalness:0});
       const trousers=new THREE.MeshStandardMaterial({color:'#303330',roughness:.98,metalness:0});
       const boots=new THREE.MeshStandardMaterial({color:'#49392c',roughness:1,metalness:0});
       const strap=new THREE.MeshStandardMaterial({color:'#786047',roughness:1,metalness:0});

       const bone=(...names)=>names.map(n=>obj.getObjectByName(n)).find(Boolean);
       const add=(parent,geo,mat,pos=[0,0,0],rot=[0,0,0],sc=[1,1,1])=>{
         if(!parent)return null;
         const m=new THREE.Mesh(geo,mat);
         m.position.set(...pos);m.rotation.set(...rot);m.scale.set(...sc);
         m.castShadow=false;m.receiveShadow=false;
         parent.add(m);return m;
       };
       const seg=(aName,bName,r,mat,thickness=1)=>{
         const a=bone(aName),b=bone(bName); if(!a||!b)return;
         const v=b.position.clone(); const len=v.length(); if(len<.025)return;
         const rr=Math.min(r,len*.30);
         const g=new THREE.CapsuleGeometry(rr,Math.max(.012,len-2*rr),5,9);
         const m=new THREE.Mesh(g,mat);
         m.position.copy(v).multiplyScalar(.5);
         m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());
         m.scale.x=thickness;m.scale.z=thickness;
         m.castShadow=false;m.receiveShadow=false;a.add(m);
       };

       const pelvis=bone('pelvis'), s1=bone('spine_01'), s2=bone('spine_02'), s3=bone('spine_03');
       // Jacket body: deliberately slightly loose to sit outside the base mesh.
       add(s2||s1,new THREE.CapsuleGeometry(.235,.30,6,12),jacket,[0,.06,0],[0,0,0],[1.20,1.02,.80]);
       add(s3||s2,new THREE.CylinderGeometry(.255,.235,.20,12),jacketDark,[0,.025,0],[0,0,0],[1.10,1,.82]);
       add(pelvis,new THREE.CylinderGeometry(.245,.225,.20,12),trousers,[0,.00,0],[0,0,0],[1.08,1,.82]);

       // Sleeves and full-length trousers follow the actual animated limb bones.
       seg('upperarm_l','lowerarm_l',.105,jacket,1.04);
       seg('lowerarm_l','hand_l',.090,jacketDark,1.02);
       seg('upperarm_r','lowerarm_r',.105,jacket,1.04);
       seg('lowerarm_r','hand_r',.090,jacketDark,1.02);
       seg('thigh_l','calf_l',.135,trousers,1.05);
       seg('calf_l','foot_l',.112,trousers,1.02);
       seg('thigh_r','calf_r',.135,trousers,1.05);
       seg('calf_r','foot_r',.112,trousers,1.02);

       // Simple hiking boots, attached to the feet.
       add(bone('foot_l'),new THREE.BoxGeometry(.19,.17,.37),boots,[0,.035,.10],[0,0,0],[1,1,1]);
       add(bone('foot_r'),new THREE.BoxGeometry(.19,.17,.37),boots,[0,.035,.10],[0,0,0],[1,1,1]);

       // Small chest/shoulder webbing makes the torso read as clothing rather than recoloured skin.
       add(s3||s2,new THREE.BoxGeometry(.035,.44,.025),strap,[-.15,.01,-.205],[0,0,.10]);
       add(s3||s2,new THREE.BoxGeometry(.035,.44,.025),strap,[ .15,.01,-.205],[0,0,-.10]);
     }
   },[model.scene]);

   useEffect(()=>{
     const names=animLib.animations.map(a=>a.name);
     document.getElementById('clip-list').textContent='Clips: '+names.filter(n=>/idle|walk|jog|sprint|jump/i.test(n)).join(' · ');
     document.getElementById('model-state').textContent='READY · FIELD OUTFIT';
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

   // The previous proof applied PI yaw and the model presented its back while
   // moving forward under Ecctrl.  Leave the imported +Z-facing visual unflipped
   // in this proof; Ecctrl supplies the gameplay-facing transform.
   return h('group',{ref:root,position:[0,-.88,0],rotation:[0,0,0]},
     h('group',{position:[0,norm.offset,0]},h('primitive',{object:model.scene}))
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
