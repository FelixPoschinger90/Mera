import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const $=s=>document.querySelector(s);
const coarse=matchMedia('(pointer:coarse)').matches;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.35:1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bc9dc);scene.fog=new THREE.FogExp2(0xa8ced8,.0085);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,350);

// ---------- world lighting ----------
scene.add(new THREE.HemisphereLight(0xe8fbff,0x4b5938,1.45));
const sun=new THREE.DirectionalLight(0xffe2aa,3.1);sun.position.set(-45,62,28);sun.castShadow=true;sun.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;sun.shadow.bias=-.0003;scene.add(sun);

// ---------- deterministic composition ----------
let seed=43191;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const palette={grass:0x78a861,grassLight:0x91bd72,dirt:0xc1a474,stone:0x78796b,stoneWarm:0x8d8068,wood:0x765238,leaf:0x527c4f,leaf2:0x6b9658,water:0x3f9eb4};
const mat=(c,rough=.92)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:0});
const mats={grass:mat(palette.grass),dirt:mat(palette.dirt),stone:mat(palette.stone),stoneW:mat(palette.stoneWarm),wood:mat(palette.wood),leaf:mat(palette.leaf),leaf2:mat(palette.leaf2)};

function terrainH(x,z){
  let y=.8*Math.sin(z*.045)+.5*Math.sin(x*.06)+.35*Math.sin((x-z)*.09);
  y+=6.0*Math.exp(-Math.pow((x+35)/18,2)); y+=7.4*Math.exp(-Math.pow((x-36)/19,2));
  y+=4.0*Math.exp(-Math.pow((z+62)/31,2));
  y-=2.5*Math.exp(-Math.pow((z-7)/8,2))*Math.exp(-Math.pow(x/46,2));
  y*=1-.24*Math.exp(-Math.pow(x/18,2));
  return y;
}
const terrainG=new THREE.PlaneGeometry(132,220,110,150);terrainG.rotateX(-Math.PI/2);const tp=terrainG.attributes.position;const cols=[];
for(let i=0;i<tp.count;i++){const x=tp.getX(i),z=tp.getZ(i),y=terrainH(x,z);tp.setY(i,y);let c=new THREE.Color(y>8?0x87976b:y<-1?0x709568:0x7da967);c.offsetHSL((rnd()-.5)*.008,0,(rnd()-.5)*.035);cols.push(c.r,c.g,c.b)}
terrainG.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));terrainG.computeVertexNormals();const terrain=new THREE.Mesh(terrainG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);

// Distant sea and islands
const sea=new THREE.Mesh(new THREE.PlaneGeometry(500,500).rotateX(-Math.PI/2),new THREE.MeshPhysicalMaterial({color:0x4ca3b6,roughness:.22,metalness:0,transparent:true,opacity:.94,clearcoat:.3}));sea.position.y=-7;scene.add(sea);
for(let i=0;i<15;i++){const a=i/15*Math.PI*2,r=105+rnd()*55;const m=new THREE.Mesh(new THREE.ConeGeometry(12+rnd()*15,22+rnd()*30,9),mats.stoneW);m.position.set(Math.sin(a)*r,-3,Math.cos(a)*r);m.scale.x=1.3+rnd()*1.7;scene.add(m)}

// Stream: custom animated shader
const streamUniforms={uTime:{value:0},uLight:{value:new THREE.Color(0x78d0dc)},uDeep:{value:new THREE.Color(0x297f98)}};
const streamMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:streamUniforms,vertexShader:`varying vec2 vUv;varying vec3 vW;uniform float uTime;void main(){vUv=uv;vec3 p=position;p.y+=sin((p.x+p.z)*1.8+uTime*1.8)*.035+sin(p.z*4.0-uTime*2.3)*.025;vec4 w=modelMatrix*vec4(p,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`varying vec2 vUv;varying vec3 vW;uniform float uTime;uniform vec3 uLight;uniform vec3 uDeep;void main(){float streak=.5+.5*sin(vUv.y*36.0+sin(vUv.x*13.0)+uTime*2.2);float edge=smoothstep(0.0,.18,vUv.x)*smoothstep(0.0,.18,1.0-vUv.x);vec3 c=mix(uDeep,uLight,.34+.24*streak);float foam=smoothstep(.88,1.0,streak)*.14;gl_FragColor=vec4(c+foam,0.74+.14*edge);}`});
const stream=new THREE.Mesh(new THREE.PlaneGeometry(94,13,80,8).rotateX(-Math.PI/2),streamMat);stream.position.set(0,terrainH(0,7)+.12,7);stream.rotation.y=Math.PI/2;scene.add(stream);

// Paths
function path(points,width=3.4){const g=new THREE.Group();for(let i=0;i<points.length-1;i++){let [x1,z1]=points[i],[x2,z2]=points[i+1],dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),x=(x1+x2)/2,z=(z1+z2)/2;let s=new THREE.Mesh(new THREE.BoxGeometry(width,.07,len),mats.dirt);s.position.set(x,terrainH(x,z)+.055,z);s.rotation.y=Math.atan2(dx,dz);s.receiveShadow=true;g.add(s)}scene.add(g);return g}
const south=[[0,83],[1,71],[-2,61],[1,50],[-1,39],[0,28],[0,20]];
const west=[[0,20],[-6,15],[-10,9],[-12,2],[-17,-7],[-22,-17],[-20,-29],[-11,-40],[0,-48]];
const east=[[0,20],[6,15],[10,9],[13,2],[18,-7],[22,-17],[19,-29],[11,-40],[0,-48]];
const north=[[0,-48],[-2,-59],[1,-70],[0,-83]];path(south,4.6);path(west);path(east);path(north,4.6);

// Bridge
const bridge=new THREE.Group();for(let i=-6;i<=6;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(3.0,.16,.62),mats.wood);p.position.z=i*.62;p.rotation.y=(rnd()-.5)*.035;p.castShadow=true;p.receiveShadow=true;bridge.add(p)}for(const sx of [-1.55,1.55]){const rail=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,8.5,8),mats.wood);rail.rotation.x=Math.PI/2;rail.position.set(sx,.72,0);bridge.add(rail);for(let i=-5;i<=5;i+=2){const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,1.35,8),mats.wood);post.position.set(sx,.55,i*.62);bridge.add(post)}}bridge.position.set(-9.5,terrainH(-9.5,8)+.95,8);bridge.rotation.y=-.12;scene.add(bridge);

// Ford stones
for(let i=-5;i<=5;i++){const x=9.2+i*.74,z=8-i*.56;const s=new THREE.Mesh(new THREE.CylinderGeometry(.5+rnd()*.25,.62+rnd()*.18,.24+rnd()*.1,9),mats.stone);s.position.set(x,terrainH(x,z)+.20,z);s.rotation.y=rnd()*6.2;s.receiveShadow=true;scene.add(s)}

// Central cliff barrier keeps alternate route visible but inaccessible.
function addRock(x,z,s=1,material=mats.stone){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),material);r.position.set(x,terrainH(x,z)+s*.55,z);r.scale.set(1.1,.75+rnd()*.55,1);r.rotation.set(rnd(),rnd()*6.2,rnd());r.castShadow=true;r.receiveShadow=true;scene.add(r);return r}
for(let i=0;i<26;i++){const z=10-i*1.9,x=(rnd()-.5)*5.0;addRock(x,z,1.6+rnd()*1.4,i%3?mats.stone:mats.stoneW)}

// Procedural fallback trees and plants; imported CC0 nature assets replace many when available.
const treeRoots=[];
function fallbackTree(x,z,s=1){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.32*s,2.4*s,8),mats.wood);trunk.position.y=1.2*s;trunk.castShadow=true;g.add(trunk);for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry((1.05-.08*k)*s,2),k%2?mats.leaf2:mats.leaf);c.scale.set(1,.84,1);c.position.set((k-1)*.25*s,(2.6+k*.58)*s,(k%2?.12:-.08)*s);c.castShadow=true;g.add(c)}g.position.set(x,terrainH(x,z),z);g.rotation.y=rnd()*6.2;scene.add(g);treeRoots.push(g);return g}
function tuft(x,z,s=.6){const g=new THREE.Group();for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.PlaneGeometry(.14*s,.75*s),new THREE.MeshStandardMaterial({color:i%2?0x769e5c:0x8bb269,roughness:1,side:THREE.DoubleSide}));blade.position.y=.35*s;blade.rotation.y=i*Math.PI/2+(rnd()-.5)*.25;g.add(blade)}g.position.set(x,terrainH(x,z)+.02,z);g.rotation.y=rnd()*6.2;scene.add(g);return g}
function scatter(cx,cz,rx,rz,n){for(let i=0;i<n;i++){let x=cx+(rnd()-.5)*rx,z=cz+(rnd()-.5)*rz;if(Math.abs(x)<7&&z<82&&z>-86){i--;continue}if(rnd()<.38)fallbackTree(x,z,.65+rnd()*.75);else if(rnd()<.7)addRock(x,z,.35+rnd()*.8);else tuft(x,z,.65+rnd()*.55)}}
scatter(-38,42,42,90,65);scatter(39,40,42,94,70);scatter(-34,-48,42,80,58);scatter(36,-48,42,78,60);for(let i=0;i<330;i++){let x=(rnd()-.5)*95,z=(rnd()-.5)*174;if(Math.abs(x)<5&&z<80&&z>-85)continue;tuft(x,z,.5+rnd()*.7)}

// subtle floating pollen / atmosphere
const pollenN=220,pollenPos=new Float32Array(pollenN*3);for(let i=0;i<pollenN;i++){pollenPos[i*3]=(rnd()-.5)*100;pollenPos[i*3+1]=.4+rnd()*11;pollenPos[i*3+2]=(rnd()-.5)*170}const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pollenPos,3));const pollen=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffe8b5,size:.045,transparent:true,opacity:.46,depthWrite:false}));scene.add(pollen);

// Loading helpers
const loader=new GLTFLoader();let loadedCount=0;const totalCritical=2;function markLoaded(msg){loadedCount++;$('#loadfill').style.width=`${Math.min(100,20+loadedCount/totalCritical*75)}%`;$('#asset-status').textContent=msg;if(loadedCount>=totalCritical){$('#loading-copy').textContent='The island is ready.';$('#asset-status').textContent='Character and wildlife loaded · click to begin';$('#start-btn').disabled=false;$('#loadfill').style.width='100%'}}
function loadFirst(urls){return new Promise((resolve,reject)=>{let i=0;const go=()=>{if(i>=urls.length){reject(new Error('all urls failed'));return}loader.load(urls[i++],resolve,undefined,go)};go()})}

// Player root + animation controller
const player=new THREE.Group();player.position.set(0,terrainH(0,82),82);scene.add(player);let char=null,charMixer=null,currentAction=null,clips={},charReady=false;
const HUMAN_URLS=['https://cdn.jsdelivr.net/gh/UMRAM-Bilkent/supine-human-model@main/assets/human.glb','https://raw.githubusercontent.com/UMRAM-Bilkent/supine-human-model/main/assets/human.glb'];
loadFirst(HUMAN_URLS).then(gltf=>{
  char=gltf.scene;char.scale.setScalar(.32);char.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const old=o.material;if(old){const nm=new THREE.MeshStandardMaterial({map:old.map||null,color:old.color?old.color.clone():new THREE.Color(0xffffff),roughness:.86,metalness:0});o.material=nm}}});
  const box=new THREE.Box3().setFromObject(char);char.position.y-=box.min.y;char.rotation.y=Math.PI;player.add(char);
  charMixer=new THREE.AnimationMixer(char);gltf.animations.forEach(c=>clips[c.name.toLowerCase()]=c);
  charReady=true;markLoaded('Character rig loaded · preparing wildlife');
}).catch(()=>{ // smooth non-box fallback only if remote model unavailable
  const body=new THREE.Group();const skin=mat(0xe5b28c),cloth=mat(0x698e79),dark=mat(0x2c4146),hair=mat(0x634735);const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.9,8,16),cloth);torso.position.y=1.22;body.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.31,20,14),skin);head.position.y=2.08;body.add(head);const h=new THREE.Mesh(new THREE.SphereGeometry(.325,16,10,0,Math.PI*2,0,Math.PI*.58),hair);h.position.set(0,2.19,.02);body.add(h);for(const sx of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.76,5,10),dark);leg.position.set(sx*.18,.48,0);body.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.65,5,10),skin);arm.position.set(sx*.5,1.28,0);body.add(arm)}body.traverse(o=>{if(o.isMesh)o.castShadow=true});char=body;player.add(char);charReady=true;markLoaded('Character fallback ready · preparing wildlife');
});

function findClip(...patterns){const arr=Object.entries(clips);for(const p of patterns){const hit=arr.find(([n])=>p.test(n));if(hit)return hit[1]}return arr[0]?.[1]}
function setAnim(kind,fade=.22){if(!charMixer)return;let clip=kind==='run'?findClip(/run/,/jog/):kind==='walk'?findClip(/walk/,/jog/):findClip(/idle/,/stand/);if(!clip)return;const next=charMixer.clipAction(clip);if(next===currentAction)return;next.reset().fadeIn(fade).play();if(currentAction)currentAction.fadeOut(fade);currentAction=next}

// Deer herd
let deerTemplate=null,deerClips=[],deerReady=false;const herd=[];const DEER_URLS=['https://cdn.jsdelivr.net/gh/danwahl/animasim@main/assets/generated/glb/deer.glb','https://media.githubusercontent.com/media/danwahl/animasim/main/assets/generated/glb/deer.glb','https://raw.githubusercontent.com/danwahl/animasim/main/assets/generated/glb/deer.glb'];
loadFirst(DEER_URLS).then(gltf=>{deerTemplate=gltf.scene;deerClips=gltf.animations;spawnHerd();deerReady=true;markLoaded('Wildlife loaded · finishing island');}).catch(()=>{spawnFallbackHerd();deerReady=true;markLoaded('Wildlife fallback ready · finishing island');});
function pickDeerClip(...rxs){for(const r of rxs){const c=deerClips.find(c=>r.test(c.name.toLowerCase()));if(c)return c}return deerClips[0]}
function spawnHerd(){const pos=[[-29,-14],[-31,-18],[-26,-22],[-34,-24]];pos.forEach((p,i)=>{const root=new THREE.Group();const d=SkeletonUtils.clone(deerTemplate);root.add(d);scene.add(root);root.position.set(p[0],terrainH(...p),p[1]);root.scale.setScalar(.9+rnd()*.12);root.rotation.y=.4+rnd()*.55;d.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});const mixer=new THREE.AnimationMixer(d);const idle=pickDeerClip(i%2?/eat|graze/:/idle/,/walk/);if(idle)mixer.clipAction(idle).play();herd.push({root,mixer,state:'idle',speed:0,angle:root.rotation.y})})}
function spawnFallbackHerd(){for(let i=0;i<4;i++){const root=new THREE.Group(),brown=mat(0x936941),cream=mat(0xd7c39f);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.85,6,12),brown);body.rotation.z=Math.PI/2;body.position.y=1.02;root.add(body);const neck=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.55,5,10),brown);neck.position.set(.48,1.48,0);neck.rotation.z=-.45;root.add(neck);const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,2),brown);head.position.set(.7,1.78,0);root.add(head);for(const x of [-.33,.28])for(const z of [-.17,.17]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.62,4,8),brown);leg.position.set(x,.48,z);root.add(leg)}for(const z of [-.12,.12]){const ant=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,.42,6),cream);ant.position.set(.77,2.03,z);ant.rotation.z=-.22;root.add(ant)}root.traverse(o=>{if(o.isMesh)o.castShadow=true});root.position.set(-27-i*2.2,terrainH(-27-i*2.2,-14-i*2.8),-14-i*2.8);scene.add(root);herd.push({root,mixer:null,state:'idle',speed:0,angle:.6})}}

// Optional CC0 environment models; failures are harmless because fallback world is complete.
const NATURE_BASE='https://cdn.jsdelivr.net/gh/agentkaerf/FreeModels@main/Stylized%20Nature%20MegaKit%5BStandard%5D/glTF/';
Promise.allSettled(['CommonTree_3.gltf','CommonTree_5.gltf','Pine_2.gltf','Bush_Common.gltf','Rock_Medium_2.gltf'].map(n=>new Promise((res,rej)=>loader.load(NATURE_BASE+n,res,undefined,rej)))).then(results=>{
 const goods=results.filter(r=>r.status==='fulfilled').map(r=>r.value.scene);if(!goods.length)return;
 for(let i=0;i<55;i++){const src=goods[Math.floor(rnd()*goods.length)];const obj=src.clone(true);let x=(rnd()-.5)*105,z=(rnd()-.5)*185;if(Math.abs(x)<10&&z<82&&z>-86){i--;continue}obj.position.set(x,terrainH(x,z),z);obj.scale.setScalar(.65+rnd()*1.25);obj.rotation.y=rnd()*6.2;obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(obj)}
});

// ---------- gameplay state ----------
const state={started:false,locked:true,route:null,streamChoice:false,phase:'south',complete:false,cinematic:false};
const keys={};addEventListener('keydown',e=>keys[e.code]=true);addEventListener('keyup',e=>keys[e.code]=false);
let yaw=0,pitch=-.12,drag=false,mx=0,my=0;renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){drag=true;mx=e.clientX;my=e.clientY}});addEventListener('pointerup',()=>drag=false);addEventListener('pointermove',e=>{if(drag&&!state.locked){yaw-=(e.clientX-mx)*.0042;pitch-=(e.clientY-my)*.0032;pitch=THREE.MathUtils.clamp(pitch,-.42,.18);mx=e.clientX;my=e.clientY}});
let joy={x:0,y:0},runTouch=false;const joyEl=$('#joystick'),stick=$('#stick');let jid=null;function jmove(e){const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,max=36,d=Math.hypot(dx,dy)||1;if(d>max){dx=dx/d*max;dy=dy/d*max}joy={x:dx/max,y:dy/max};stick.style.transform=`translate(${dx}px,${dy}px)`}joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jmove(e)});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jmove(e)});joyEl.addEventListener('pointerup',e=>{if(e.pointerId===jid){jid=null;joy={x:0,y:0};stick.style.transform='translate(0,0)'}});
let lookId=null,lx=0,ly=0;$('#lookpad').addEventListener('pointerdown',e=>{lookId=e.pointerId;lx=e.clientX;ly=e.clientY;$('#lookpad').setPointerCapture(lookId)});$('#lookpad').addEventListener('pointermove',e=>{if(e.pointerId===lookId&&!state.locked){yaw-=(e.clientX-lx)*.005;pitch-=(e.clientY-ly)*.004;pitch=THREE.MathUtils.clamp(pitch,-.42,.18);lx=e.clientX;ly=e.clientY}});$('#lookpad').addEventListener('pointerup',()=>lookId=null);$('#runbtn').addEventListener('pointerdown',()=>runTouch=true);$('#runbtn').addEventListener('pointerup',()=>runTouch=false);$('#runbtn').addEventListener('pointercancel',()=>runTouch=false);

let velocity=new THREE.Vector3(),targetVel=new THREE.Vector3(),speedNow=0;
function routeAllowed(x,z){if(z<13&&z>-46){if(state.route==='bridge'&&x>1.6)return false;if(state.route==='ford'&&x<-1.6)return false}return x>-56&&x<56&&z>-88&&z<87}
function updateMovement(dt){if(!state.started||state.locked||state.cinematic||state.complete)return;let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y,s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;let mag=Math.hypot(f,s);if(mag>1){f/=mag;s/=mag;mag=1}const running=keys.ShiftLeft||keys.ShiftRight||runTouch,max=running?7.2:4.25;const F=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)),R=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));targetVel.copy(F).multiplyScalar(f).add(R.multiplyScalar(s));if(targetVel.lengthSq()>1)targetVel.normalize();targetVel.multiplyScalar(max);const accel=targetVel.lengthSq()>velocity.lengthSq()?1-Math.exp(-dt*9):1-Math.exp(-dt*12);velocity.lerp(targetVel,accel);if(mag<.03)velocity.multiplyScalar(Math.exp(-dt*7.5));const nx=player.position.x+velocity.x*dt,nz=player.position.z+velocity.z*dt;if(routeAllowed(nx,nz)){player.position.x=nx;player.position.z=nz}else velocity.multiplyScalar(.1);player.position.y=terrainH(player.position.x,player.position.z);speedNow=velocity.length();if(speedNow>.15){const desired=Math.atan2(velocity.x,velocity.z)+Math.PI;let delta=Math.atan2(Math.sin(desired-player.rotation.y),Math.cos(desired-player.rotation.y));player.rotation.y+=delta*(1-Math.exp(-dt*11))}setAnim(speedNow>5.3?'run':speedNow>.35?'walk':'idle');
 if(!state.streamChoice&&player.position.z<23){state.streamChoice=true;state.locked=true;velocity.set(0,0,0);setAnim('idle');$('#choice').classList.remove('hidden')}
 if(state.route==='bridge'&&state.phase==='west'&&player.position.z<-10){state.phase='west2';$('#region').textContent='ANIMAL TRAIL';}
 if(state.route==='ford'&&state.phase==='east'&&player.position.z<-10){state.phase='east2';$('#region').textContent='BIRCH HOLLOW';}
 if(state.route&&!state.complete&&player.position.z<-75){state.complete=true;state.locked=true;velocity.set(0,0,0);setAnim('idle');setTimeout(()=>$('#complete').classList.remove('hidden'),500)}
}

// ---------- cinematic route crossing ----------
function chooseRoute(route){state.route=route;state.locked=false;$('#choice').classList.add('hidden');$('#region').textContent=route==='bridge'?'WESTERN BANK':'EASTERN HOLLOW';const pts=route==='bridge'?[[0,20],[-4,16],[-8,12],[-10,8],[-12,3]]:[[0,20],[4,16],[7,12],[10,8],[12,3]];cinematicMove(pts,route==='bridge'?5.2:5.8,route)}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>chooseRoute(b.dataset.route)));
function cinematicMove(points,duration,route){state.cinematic=true;state.locked=true;document.body.classList.add('cinematic');velocity.set(0,0,0);let start=performance.now(),ps=points.map(([x,z])=>new THREE.Vector3(x,terrainH(x,z)+(route==='bridge'?.72:0),z));if(route==='bridge')setAnim('walk');else setAnim('walk');const step=now=>{let u=Math.min(1,(now-start)/(duration*1000)),q=u*(ps.length-1),i=Math.min(ps.length-2,Math.floor(q)),t=q-i;player.position.lerpVectors(ps[i],ps[i+1],t);const d=ps[i+1].clone().sub(ps[i]);if(d.lengthSq())player.rotation.y=Math.atan2(d.x,d.z)+Math.PI;if(route==='ford'){player.position.y-=Math.sin(u*Math.PI)*.28;spawnSplash(player.position.x,terrainH(player.position.x,player.position.z)+.15,player.position.z,u)}if(u<1)requestAnimationFrame(step);else{document.body.classList.remove('cinematic');state.cinematic=false;state.locked=false;state.phase=route==='bridge'?'west':'east';setAnim('idle')}};requestAnimationFrame(step)}
const splashes=[];function spawnSplash(x,y,z,u){if(Math.random()>.22)return;const m=new THREE.Mesh(new THREE.RingGeometry(.04,.11,12),new THREE.MeshBasicMaterial({color:0xcceef1,transparent:true,opacity:.75,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x+(Math.random()-.5)*.55,y,z+(Math.random()-.5)*.55);m.userData.life=1;scene.add(m);splashes.push(m)}

// ---------- deer behaviour ----------
function updateHerd(dt){for(const h of herd){h.mixer?.update(dt);const dist=h.root.position.distanceTo(player.position);if(dist<13&&h.state!=='flee'){h.state='flee';h.speed=5.8+rnd()*1.3;const away=h.root.position.clone().sub(player.position);h.angle=Math.atan2(away.x,away.z);if(h.mixer){h.mixer.stopAllAction();const c=pickDeerClip(/gallop/,/run/,/walk/);if(c)h.mixer.clipAction(c).play()}}if(h.state==='flee'){h.root.position.x+=Math.sin(h.angle)*h.speed*dt;h.root.position.z+=Math.cos(h.angle)*h.speed*dt;h.root.position.y=terrainH(h.root.position.x,h.root.position.z);h.root.rotation.y=h.angle;if(dist>35){h.speed*=Math.exp(-dt*1.4);if(h.speed<.2)h.state='idle'}}else if(!h.mixer){h.root.rotation.y+=Math.sin(performance.now()*.0007+h.root.position.x)*dt*.03}}}

// ---------- camera ----------
const camRay=new THREE.Raycaster();const camLook=new THREE.Vector3();function updateCamera(dt){const target=player.position.clone().add(new THREE.Vector3(0,1.45,0));const dist=5.8,desired=target.clone().add(new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch)*dist,2.0+Math.sin(-pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist));const dir=desired.clone().sub(target),len=dir.length();camRay.set(target,dir.normalize());const hits=camRay.intersectObject(terrain,false);let final=desired;if(hits.length&&hits[0].distance<len)final=target.clone().add(dir.multiplyScalar(Math.max(1.7,hits[0].distance-.25)));camera.position.lerp(final,1-Math.exp(-dt*10));camLook.lerp(target,1-Math.exp(-dt*12));camera.lookAt(camLook)}

// ---------- procedural ambient audio ----------
let audioCtx=null,windGain=null,waterGain=null;function startAudio(){try{audioCtx=new (AudioContext||webkitAudioContext)();const seconds=2,buf=audioCtx.createBuffer(1,audioCtx.sampleRate*seconds,audioCtx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const makeNoise=(freq,q,gain)=>{const src=audioCtx.createBufferSource();src.buffer=buf;src.loop=true;const f=audioCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=audioCtx.createGain();g.gain.value=gain;src.connect(f).connect(g).connect(audioCtx.destination);src.start();return g};windGain=makeNoise(420,.45,.022);waterGain=makeNoise(1600,.8,.008);birdLoop()}catch(e){}}
function birdLoop(){if(!audioCtx)return;setTimeout(()=>{if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(1400+Math.random()*500,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(2100+Math.random()*600,audioCtx.currentTime+.11);g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(.015,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.18);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2);birdLoop()},1900+Math.random()*4800)}
function updateAudio(){if(!audioCtx)return;const dz=Math.abs(player.position.z-7);waterGain.gain.setTargetAtTime(.008+.035*Math.max(0,1-dz/24),audioCtx.currentTime,.15);windGain.gain.setTargetAtTime(.018+.006*Math.max(0,player.position.y/8),audioCtx.currentTime,.2)}

// Start
$('#start-btn').addEventListener('click',()=>{$('#loading').classList.add('hidden');$('#hud').classList.remove('hidden');if(coarse)$('#mobile').classList.remove('hidden');state.started=true;state.locked=false;setAnim('idle');startAudio()});

// ---------- loop ----------
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.033);streamUniforms.uTime.value+=dt;pollen.rotation.y+=dt*.012;treeRoots.forEach((t,i)=>t.rotation.z=Math.sin(performance.now()*.0005+i)*.0025);if(charMixer)charMixer.update(dt);updateMovement(dt);updateHerd(dt);updateCamera(dt);updateAudio();for(let i=splashes.length-1;i>=0;i--){const s=splashes[i];s.userData.life-=dt*1.6;s.scale.multiplyScalar(1+dt*2.3);s.material.opacity=s.userData.life*.65;if(s.userData.life<=0){scene.remove(s);splashes.splice(i,1)}}renderer.render(scene,camera)}loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
