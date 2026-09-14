import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = (s)=>document.querySelector(s);
const canvas=$('#game'), loading=$('#loading'), enterBtn=$('#enterBtn'), hud=$('#hud'), finish=$('#finish');
const loadLabel=$('#loadLabel'), loadPct=$('#loadPct'), barFill=$('#barFill'), loadDetail=$('#loadDetail'), fatal=$('#fatal');
const regionEl=$('#region'), notice=$('#routeNotice'), noticeTitle=$('#noticeTitle'), noticeCopy=$('#noticeCopy');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xaec4ca);
scene.fog=new THREE.Fog(0xb9c7c5,31,90);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,220);

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const ssao=new SSAOPass(scene,camera,innerWidth,innerHeight);
ssao.kernelRadius=10; ssao.minDistance=.0015; ssao.maxDistance=.11;
composer.addPass(ssao); composer.addPass(new OutputPass());

const texLoader=new THREE.TextureLoader();
const gltfLoader=new GLTFLoader();
const clock=new THREE.Clock();
let worldTime=0;

const ASSET={
  forest:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_nor_gl_1k.jpg',
    rough:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_rough_1k.jpg'
  },
  path:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_nor_gl_1k.jpg',
    rough:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_rough_1k.jpg'
  },
  wood:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_nor_gl_1k.jpg',
    rough:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_rough_1k.jpg'
  },
  rock:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_nor_gl_1k.jpg',
    rough:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_rough_1k.jpg'
  },
  hdri:'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/nature_reserve_forest_1k.hdr',
  michelle:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Michelle.glb',
  soldier:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Soldier.glb'
};

const MATERIALS={};
const roots={trees:[],grass:[],rocks:[],deer:[],water:null};
let terrain,pathMeshes=[],traveller=null,humanRoot=null,mixer=null,actions={},currentAction=null;
let backpack=null,coat=null,sleeves=[],spineBone=null;

const state={
  started:false,finished:false,route:null,startTime:0,
  pos:new THREE.Vector3(0,0,24),heading:new THREE.Vector3(0,0,-1),
  keys:{},drag:false,yaw:0,pitch:.30,lastMouseX:0,lastMouseY:0,meters:0
};

const routeLines={
  south:[[0,24],[0,19],[0,14]],
  bridge:[[0,14],[-3,12],[-6,9],[-7.8,5.2],[-7.7,1],[-5,-3],[-1,-6]],
  ford:[[0,14],[3.4,12],[6.8,9],[9.4,5.8],[9.1,2.2],[6,-2],[-1,-6]],
  north:[[-1,-6],[1,-10],[3,-14],[5,-18],[7,-22]]
};

boot().catch(err=>failBoot(err));

async function boot(){
  setProgress(4,'Creating authored terrain','Generating the real 3D valley.');
  setupLights();
  setupSkyBackdrop();
  terrain=makeTerrain(); scene.add(terrain);
  setProgress(14,'Loading CC0 surface materials','Forest ground, path, timber and mossy rock.');
  await loadMaterials();
  applyTerrainMaterial();
  setProgress(34,'Authoring trail and stream','Building traversable route geometry and water.');
  makeTrailNetwork();
  makeRiver();
  setProgress(45,'Building bridge and outpost','Detailed timber crossing and stone landmark.');
  makeBridge();
  makeOutpost();
  makeWaterfallAndMountains();
  setProgress(57,'Dressing the valley','Trees, grass, rocks, reeds and small details.');
  dressLandscape();
  setProgress(72,'Loading the traveller','Rigged human base plus custom traveller gear.');
  await loadTraveller();
  setProgress(91,'Lighting and atmosphere','Finishing shadows, fog and environment light.');
  await loadHDRI();
  state.pos.y=surfaceHeightAt(state.pos.x,state.pos.z)+.02;
  updateTraveller(0,false,false);
  updateCamera(1);
  setProgress(100,'3D valley ready','The scene initialized successfully.');
  enterBtn.disabled=false;
  enterBtn.textContent='ENTER THE VALLEY';
}

function setProgress(p,label,detail=''){
  loadPct.textContent=`${p}%`;barFill.style.width=`${p}%`;loadLabel.textContent=label;loadDetail.textContent=detail;
}
function failBoot(err){
  console.error(err); enterBtn.disabled=true; enterBtn.textContent='3D SCENE FAILED TO LOAD'; fatal.classList.remove('hidden'); fatal.textContent=`Initialization error: ${err?.message||err}`;
}

function setupLights(){
  scene.add(new THREE.HemisphereLight(0xdfeff3,0x43543e,1.5));
  const sun=new THREE.DirectionalLight(0xfff0cf,3.0); sun.position.set(-24,38,24); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.bias=-.00012; scene.add(sun);
  const fill=new THREE.DirectionalLight(0xaccfe7,.55);fill.position.set(24,12,-16);scene.add(fill);
}
function setupSkyBackdrop(){
  const sky=new THREE.Mesh(new THREE.SphereGeometry(130,28,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{top:{value:new THREE.Color(0x8db5d0)},mid:{value:new THREE.Color(0xc7d8d7)},low:{value:new THREE.Color(0xe6ddc4)}},vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec3 top,mid,low;varying vec3 vP;void main(){float h=normalize(vP).y*.5+.5;vec3 c=mix(low,mid,smoothstep(.05,.48,h));c=mix(c,top,smoothstep(.48,1.,h));gl_FragColor=vec4(c,1.);}`}));
  scene.add(sky);
}

function heightAt(x,z){
  let h=-.23*Math.exp(-(x*x)/90)*Math.exp(-((z-5)*(z-5))/230);
  h+=.38*Math.sin(x*.12)*Math.cos(z*.095)+.11*Math.sin((x+z)*.31);
  h+=1.0*Math.exp(-((x+18)*(x+18))/145-((z+8)*(z+8))/380);
  h+=1.8*Math.exp(-((x-12)*(x-12))/150-((z+18)*(z+18))/165);
  h+=2.8*Math.exp(-((x-7)*(x-7))/90-((z+26)*(z+26))/95);
  h+=1.2*Math.exp(-((x+10)*(x+10))/130-((z+21)*(z+21))/125);
  return h;
}
function surfaceHeightAt(x,z){
  const base=heightAt(x,z);
  if(Math.abs(x+7.75)<1.35 && z>-0.1 && z<8.1){
    return heightAt(-7.75,4.0)+.39;
  }
  if(Math.abs(x-9.25)<1.35 && z>.6 && z<7.4){
    return base+.10;
  }
  return base;
}
function makeTerrain(){
  const g=new THREE.PlaneGeometry(70,78,150,165);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,cols=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);let y=heightAt(x,z);
    const stream=Math.abs(z-(4+.035*x)); if(stream<2.8)y-=Math.cos(stream/2.8*Math.PI/2)*.48;
    p.setY(i,y);
    const c=new THREE.Color(0x657a51); c.offsetHSL((Math.sin(x*.4+z*.22)*.01),0,(Math.random()-.5)*.035); if(y>1.7)c.lerp(new THREE.Color(0x74756d),.26); cols.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1});
  const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;return mesh;
}

function loadTexture(url,{repeat=1,srgb=false}={}){
  return new Promise((resolve)=>texLoader.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);if(srgb)t.colorSpace=THREE.SRGBColorSpace;resolve(t);},undefined,()=>resolve(null)));
}
async function pbr(set,repeat){
  const [map,normalMap,roughnessMap]=await Promise.all([loadTexture(set.diff,{repeat,srgb:true}),loadTexture(set.norm,{repeat}),loadTexture(set.rough,{repeat})]);
  return {map,normalMap,roughnessMap};
}
async function loadMaterials(){
  const [forest,path,wood,rock]=await Promise.all([pbr(ASSET.forest,9),pbr(ASSET.path,2.4),pbr(ASSET.wood,1.25),pbr(ASSET.rock,2)]);
  MATERIALS.forest=new THREE.MeshStandardMaterial({...forest,color:0xe2e2db,roughness:1,vertexColors:true});
  MATERIALS.path=new THREE.MeshStandardMaterial({...path,color:0xf2e8d7,roughness:.98});
  MATERIALS.wood=new THREE.MeshStandardMaterial({...wood,color:0xd5b18b,roughness:.92});
  MATERIALS.rock=new THREE.MeshStandardMaterial({...rock,color:0xc3c2b5,roughness:.98});
  MATERIALS.stone=new THREE.MeshStandardMaterial({...rock,color:0x9b9a90,roughness:1});
}
function applyTerrainMaterial(){ terrain.material=MATERIALS.forest; }

function pointOnGround(x,z,offset=.055){return new THREE.Vector3(x,heightAt(x,z)+offset,z)}
function makeStrip(points2,width,material,offset=.05){
  const pts=points2.map(([x,z])=>pointOnGround(x,z,offset));
  const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.35);const segs=90;const pos=[],uv=[],idx=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const jitter=.08*Math.sin(i*.9)+.04*Math.sin(i*2.1);const w=width*(1+jitter);
    const l=p.clone().addScaledVector(side,w*.5),r=p.clone().addScaledVector(side,-w*.5);l.y=heightAt(l.x,l.z)+offset;r.y=heightAt(r.x,r.z)+offset;
    pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,t*9,1,t*9);
    if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.receiveShadow=true;scene.add(m);return m;
}
function makeTrailNetwork(){
  pathMeshes=[makeStrip(routeLines.south,2.7,MATERIALS.path),makeStrip(routeLines.bridge,2.45,MATERIALS.path),makeStrip(routeLines.ford,2.65,MATERIALS.path),makeStrip(routeLines.north,2.55,MATERIALS.path)];
  const stoneMat=new THREE.MeshStandardMaterial({color:0x7a7569,roughness:1});
  for(const line of Object.values(routeLines)){
    for(let i=1;i<line.length-1;i++){
      const [x,z]=line[i]; if(Math.random()<.75){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.08+Math.random()*.09,1),stoneMat);s.position.set(x+(Math.random()-.5)*1.4,heightAt(x,z)+.12,z+(Math.random()-.5)*1.2);s.scale.y=.5;s.castShadow=true;scene.add(s)}
    }
  }
}

function makeRiver(){
  const segments=110,width=4.8,pos=[],uv=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,x=-34+t*68,z=4+.035*x+.35*Math.sin(x*.12),center=pointOnGround(x,z,-.24),dz=.035+.042*Math.cos(x*.12);const side=new THREE.Vector3(-dz,0,1).normalize();
    for(const s of [-1,1]){const p=center.clone().addScaledVector(side,s*width*.5);pos.push(p.x,p.y,p.z);uv.push(t,(s+1)/2)}
    if(i<segments){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},deep:{value:new THREE.Color(0x2d7080)},shallow:{value:new THREE.Color(0x82c9c6)},sun:{value:new THREE.Color(0xf3f1d3)}},vertexShader:`uniform float time;varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.85+time*2.)*.025+sin(p.z*2.3-time*1.6)*.018;vec4 w=modelMatrix*vec4(p,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:`uniform float time;uniform vec3 deep,shallow,sun;varying vec2 vUv;varying vec3 vWorld;void main(){float f=.5+.5*sin(vUv.x*75.+time*3.+sin(vUv.y*11.)*2.);float edge=smoothstep(0.,.26,vUv.y)*smoothstep(1.,.74,vUv.y);vec3 c=mix(shallow,deep,.42+vUv.y*.18);c+=sun*f*.08;float a=.72+.08*f;a*=.76+.24*edge;gl_FragColor=vec4(c,a);}`});
  roots.water=new THREE.Mesh(g,mat); roots.water.receiveShadow=true; scene.add(roots.water);
  // bank stones + reeds
  for(let i=0;i<85;i++){
    const x=-31+Math.random()*62,z=4+.035*x+(Math.random()<.5?-1:1)*(2.2+Math.random()*1.1),s=.18+Math.random()*.45;
    const r=makeRock(s);r.position.set(x,heightAt(x,z)+.08,z);scene.add(r);
  }
  for(let i=0;i<110;i++){
    const x=-28+Math.random()*56,z=4+.035*x+(Math.random()<.5?-1:1)*(2.35+Math.random()*.9);addReed(x,z,.6+Math.random()*.75);
  }
  // authored shallow ford: broad, flat stepping stones aligned with the eastern trail
  const fordZ=[7.0,6.15,5.25,4.35,3.45,2.55,1.65,.85];
  fordZ.forEach((zz,i)=>{const xx=9.15+Math.sin(i*.9)*.32;const r=makeRock(.48+((i%3)*.06));r.scale.y*=.42;r.scale.x*=1.25;r.position.set(xx,heightAt(xx,zz)-.02,zz);r.rotation.y=i*.31;scene.add(r)});
}

function makeBridge(){
  const group=new THREE.Group();const x=-7.75,z=4.0;group.position.set(x,heightAt(x,z)+.32,z);
  const deckMat=MATERIALS.wood,logMat=new THREE.MeshStandardMaterial({color:0x5f452f,roughness:1,map:MATERIALS.wood.map,normalMap:MATERIALS.wood.normalMap,roughnessMap:MATERIALS.wood.roughnessMap});
  const length=6.7,width=2.55;
  for(let i=0;i<17;i++){
    const plank=new THREE.Mesh(new THREE.BoxGeometry(width,.12,.36),deckMat);plank.position.set((Math.random()-.5)*.05,(Math.random()-.5)*.035,-length/2+.2+i*.39);plank.rotation.y=(Math.random()-.5)*.012;plank.castShadow=plank.receiveShadow=true;group.add(plank);
  }
  for(const sx of [-.93,.93]){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,length,9),logMat);beam.rotation.x=Math.PI/2;beam.position.set(sx,-.22,0);beam.castShadow=true;group.add(beam);
    const posts=[];
    for(let i=0;i<5;i++){
      const zz=-length/2+.15+i*(length-.3)/4;const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.105,1.05,8),logMat);p.position.set(sx*1.23,.48,zz);p.castShadow=true;group.add(p);posts.push(p.position.clone());
    }
    for(let i=0;i<posts.length-1;i++){
      const a=posts[i].clone().add(new THREE.Vector3(0,.33,0)),b=posts[i+1].clone().add(new THREE.Vector3(0,.33,0));const mid=a.clone().lerp(b,.5);mid.y-=.10;const curve=new THREE.CatmullRomCurve3([a,mid,b]);const rope=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.025,5,false),new THREE.MeshStandardMaterial({color:0x63513e,roughness:1}));rope.castShadow=true;group.add(rope);
    }
  }
  // end support stones
  for(const zz of [-3.25,3.25])for(const xx of [-1.05,1.05]){const r=makeRock(.48);r.position.set(xx,-.1,zz);group.add(r)}
  scene.add(group);
}

function makeOutpost(){
  const g=new THREE.Group(),stone=MATERIALS.stone,wood=MATERIALS.wood;
  const cliff=makeRock(4.5);cliff.scale.set(1.45,1.0,1.25);cliff.position.set(0,-1.2,0);g.add(cliff);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.7,3.15,5.2,16),stone);base.position.y=2.6;base.castShadow=base.receiveShadow=true;g.add(base);
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.75,2.05,6.2,14),stone);tower.position.set(.65,6.0,-.3);tower.castShadow=tower.receiveShadow=true;g.add(tower);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.15,1.5,14),new THREE.MeshStandardMaterial({color:0x514038,roughness:1}));roof.position.set(.65,9.85,-.3);roof.castShadow=true;g.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.05,1.9,.18),wood);door.position.set(0,1.05,2.73);door.castShadow=true;g.add(door);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.48,.62,.5),stone);m.position.set(.65+Math.cos(a)*1.74,9.2,-.3+Math.sin(a)*1.74);m.rotation.y=-a;m.castShadow=true;g.add(m)}
  g.position.set(7.1,heightAt(7.1,-25.8)+1.0,-25.8);g.rotation.y=-.28;scene.add(g);
}

function makeWaterfallAndMountains(){
  // cliff and waterfall left of the outpost
  const cliff=new THREE.Mesh(new THREE.BoxGeometry(10,14,7),MATERIALS.rock);cliff.position.set(-14,5.8,-31);cliff.rotation.y=.13;cliff.castShadow=cliff.receiveShadow=true;scene.add(cliff);
  const fallMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 vUv;void main(){float streak=.55+.45*sin(vUv.x*40.+vUv.y*15.+time*5.);float foam=smoothstep(.83,1.,vUv.y);vec3 c=mix(vec3(.60,.82,.88),vec3(.94,.98,1.),streak*.45+foam*.3);gl_FragColor=vec4(c,.53+.25*streak);}`});
  const fall=new THREE.Mesh(new THREE.PlaneGeometry(3.2,10.5,1,18),fallMat);fall.position.set(-13.6,7.1,-27.4);fall.rotation.y=.13;scene.add(fall);roots.waterfall=fall;
  // distant mountain set
  for(let i=0;i<9;i++){
    const h=16+Math.random()*15,rad=6+Math.random()*6;const geo=new THREE.ConeGeometry(rad,h,7,5);geo.translate(0,h/2,0);const p=geo.attributes.position,cols=[];
    for(let j=0;j<p.count;j++){const yy=p.getY(j);const c=new THREE.Color(0x77848b);if(yy>h*.60)c.lerp(new THREE.Color(0xe8eef2),Math.min(1,(yy-h*.60)/(h*.28)));cols.push(c.r,c.g,c.b)}
    geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));mesh.position.set(-30+i*8+Math.random()*4,-2,-58-Math.random()*7);mesh.scale.z=1.2+Math.random()*.8;mesh.castShadow=true;scene.add(mesh);
  }
}

function makeRock(s=1){
  const geo=new THREE.IcosahedronGeometry(1,2),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const k=.82+Math.random()*.32;p.setXYZ(i,p.getX(i)*k,p.getY(i)*(.58+Math.random()*.18),p.getZ(i)*(.78+Math.random()*.3))}
  geo.computeVertexNormals();const m=new THREE.Mesh(geo,MATERIALS.rock||new THREE.MeshStandardMaterial({color:0x817d73,roughness:1}));m.scale.setScalar(s);m.castShadow=m.receiveShadow=true;return m;
}

function makePine(h=7){
  const group=new THREE.Group();const bark=new THREE.MeshStandardMaterial({color:0x514333,roughness:1}),leafMat=new THREE.MeshStandardMaterial({map:getPineTexture(),alphaTest:.28,transparent:true,side:THREE.DoubleSide,color:0xdce8d2,roughness:1});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.32,h*.72,9),bark);trunk.position.y=h*.36;trunk.castShadow=true;group.add(trunk);
  const layers=8;
  for(let l=0;l<layers;l++){
    const y=h*(.25+l*.075),radius=(1-l/(layers+2))*h*.19,branches=5+(l%2);
    for(let b=0;b<branches;b++){
      const a=(b/branches)*Math.PI*2+l*.56,len=radius*(.65+Math.random()*.35);const start=new THREE.Vector3(0,y,0),end=new THREE.Vector3(Math.cos(a)*len,y+(Math.random()*.18-.06),Math.sin(a)*len);const branch=makeCylinderBetween(start,end,.035+.045*(1-l/layers),bark);branch.castShadow=true;group.add(branch);
      const foliage=new THREE.Group();for(let q=0;q<3;q++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(radius*.85,radius*.48),leafMat);pl.rotation.y=q*Math.PI/3;pl.rotation.z=(Math.random()-.5)*.3;pl.position.y=.04;foliage.add(pl)}foliage.position.copy(end);foliage.lookAt(new THREE.Vector3(0,end.y,0));group.add(foliage);
    }
  }
  const tip=new THREE.Group();for(let q=0;q<3;q++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(h*.22,h*.26),leafMat);pl.rotation.y=q*Math.PI/3;tip.add(pl)}tip.position.y=h*.83;group.add(tip);return group;
}
let pineTex;
function getPineTexture(){
  if(pineTex)return pineTex;const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,256,128);
  for(let i=0;i<260;i++){const xx=20+Math.random()*216,yy=20+Math.random()*90,len=7+Math.random()*24;x.strokeStyle=`rgba(${35+Math.random()*35|0},${75+Math.random()*55|0},${35+Math.random()*30|0},${.32+Math.random()*.55})`;x.lineWidth=.7+Math.random()*1.7;x.beginPath();x.moveTo(128,64);x.lineTo(xx,yy);x.stroke();if(i%5===0){x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+(Math.random()-.5)*len,yy+(Math.random()-.5)*len);x.stroke()}}
  pineTex=new THREE.CanvasTexture(c);pineTex.colorSpace=THREE.SRGBColorSpace;return pineTex;
}
function makeCylinderBetween(a,b,r,mat){const d=b.clone().sub(a),len=d.length(),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.82,len,7),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return m}
function makeBroadleaf(h=6.2){
  const g=new THREE.Group(),bark=new THREE.MeshStandardMaterial({color:0x68523d,roughness:1}),leaf=new THREE.MeshStandardMaterial({color:0x4b6f42,roughness:1,flatShading:false});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,h*.56,10),bark);trunk.position.y=h*.28;trunk.castShadow=true;g.add(trunk);
  const limbs=[[0,2.8,0,.9,4.7,.2],[-.2,3.2,.1,-1,4.5,.5],[.1,3.7,-.1,.5,5.1,-.8]];for(const [x,y,z,x2,y2,z2] of limbs){const a=new THREE.Vector3(x,y,z),b=new THREE.Vector3(x2,y2,z2);const m=makeCylinderBetween(a,b,.09,bark);m.castShadow=true;g.add(m)}
  for(let i=0;i<9;i++){const s=.75+Math.random()*.75,m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,2),leaf);m.position.set((Math.random()-.5)*3,3.8+Math.random()*2.0,(Math.random()-.5)*2.4);m.scale.y=.7;m.castShadow=true;g.add(m)}return g;
}
function addGrassPatch(x,z,scale=1){
  const mat=getGrassMaterial();for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.PlaneGeometry(.13*scale,.65*scale),mat);blade.position.set(x+(Math.random()-.5)*.55,heightAt(x,z)+.3*scale,z+(Math.random()-.5)*.55);blade.rotation.y=Math.random()*Math.PI;blade.rotation.z=(Math.random()-.5)*.17;scene.add(blade);roots.grass.push(blade)}
}
let grassMat;
function getGrassMaterial(){if(grassMat)return grassMat;const c=document.createElement('canvas');c.width=64;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,64,256);const grad=ctx.createLinearGradient(0,256,0,0);grad.addColorStop(0,'rgba(55,86,38,1)');grad.addColorStop(.65,'rgba(103,132,64,.93)');grad.addColorStop(1,'rgba(175,174,105,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(24,255);ctx.quadraticCurveTo(25,120,31,5);ctx.quadraticCurveTo(39,125,40,255);ctx.closePath();ctx.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;grassMat=new THREE.MeshStandardMaterial({map:t,alphaTest:.18,transparent:true,side:THREE.DoubleSide,roughness:1});return grassMat}
function addReed(x,z,s){const mat=getGrassMaterial();for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.PlaneGeometry(.10*s,1.4*s),mat);b.position.set(x+(Math.random()-.5)*.25,heightAt(x,z)+.65*s,z+(Math.random()-.5)*.25);b.rotation.y=Math.random()*Math.PI;scene.add(b)}}

function dressLandscape(){
  // Clear authored corridors, dense edges — everything is intentionally placed around the routes.
  const treeSpots=[];
  for(let i=0;i<82;i++){
    const x=-28+Math.random()*56,z=-30+Math.random()*58;if(distanceToAnyPath(x,z)<3.6)continue;if(Math.abs(z-(4+.035*x))<3.4)continue;treeSpots.push([x,z]);
  }
  treeSpots.forEach(([x,z],i)=>{const t=i%5===0?makeBroadleaf(5.7+Math.random()*2):makePine(5.6+Math.random()*4.8);t.position.set(x,heightAt(x,z),z);t.rotation.y=Math.random()*Math.PI*2;t.scale.setScalar(.82+Math.random()*.45);scene.add(t);roots.trees.push(t)});
  for(let i=0;i<370;i++){const x=-25+Math.random()*50,z=-27+Math.random()*54;if(distanceToAnyPath(x,z)<.65)continue;if(Math.abs(z-(4+.035*x))<2.35)continue;addGrassPatch(x,z,.55+Math.random()*.8)}
  for(let i=0;i<72;i++){const x=-25+Math.random()*50,z=-26+Math.random()*52;if(distanceToAnyPath(x,z)<1.2)continue;const r=makeRock(.18+Math.random()*.6);r.position.set(x,heightAt(x,z)+.05,z);r.rotation.y=Math.random()*Math.PI;scene.add(r);roots.rocks.push(r)}
  // flowers along meadow / trail edge
  const flowerMat=new THREE.MeshStandardMaterial({color:0xf1efdf,roughness:1});for(let i=0;i<90;i++){const x=-15+Math.random()*34,z=-8+Math.random()*26;if(distanceToAnyPath(x,z)>4.7||distanceToAnyPath(x,z)<1.1)continue;const f=new THREE.Mesh(new THREE.SphereGeometry(.035+Math.random()*.018,6,5),flowerMat);f.position.set(x,heightAt(x,z)+.28+Math.random()*.22,z);scene.add(f)}
}
function distanceToAnyPath(x,z){let d=999;for(const line of Object.values(routeLines))d=Math.min(d,distancePolyline(x,z,line));return d}
function distancePolyline(x,z,line){let d=999;for(let i=0;i<line.length-1;i++){const [ax,az]=line[i],[bx,bz]=line[i+1],vx=bx-ax,vz=bz-az,wx=x-ax,wz=z-az,t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));d=Math.min(d,Math.hypot(x-(ax+vx*t),z-(az+vz*t)))}return d}

async function loadTraveller(){
  const [human,animSrc]=await Promise.all([loadGLB(ASSET.michelle),loadGLB(ASSET.soldier)]);
  traveller=new THREE.Group();
  humanRoot=human.scene;
  humanRoot.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(humanRoot), size=new THREE.Vector3(); box.getSize(size);
  const humanScale=1.72/Math.max(.001,size.y);
  humanRoot.scale.setScalar(humanScale);
  humanRoot.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(humanRoot);
  const center=new THREE.Vector3();box.getCenter(center);
  humanRoot.position.x-=center.x;
  humanRoot.position.z-=center.z;
  humanRoot.position.y-=box.min.y;
  humanRoot.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material=o.material.clone();o.material.roughness=.82;if(o.material.color){const hsl={};o.material.color.getHSL(hsl);if(hsl.h>.10&&hsl.h<.22&&hsl.s>.25)o.material.color.multiply(new THREE.Color(0x404239));else o.material.color.multiply(new THREE.Color(0xaaa69c));}}}});
  traveller.add(humanRoot);
  scene.add(traveller);
  // Custom traveller silhouette over the rigged human base.
  buildTravellerGear();
  mixer=new THREE.AnimationMixer(humanRoot);
  const targetMap=makeNodeMap(humanRoot);
  for(const src of animSrc.animations){if(!['Idle','Walk','Run'].includes(src.name))continue;const clip=retargetClip(src,targetMap,true);if(clip.tracks.length){const act=mixer.clipAction(clip);act.enabled=true;act.setLoop(THREE.LoopRepeat);actions[src.name.toLowerCase()]=act}}
  if(!actions.idle||!actions.walk){throw new Error('Traveller loaded, but compatible walk/idle animations could not be mapped.')}
  setAction('idle',0);
}
function loadGLB(url){return new Promise((resolve,reject)=>gltfLoader.load(url,resolve,undefined,reject))}
function canon(n){return n.toLowerCase().replace(/mixamorig\d*:?/g,'').replace(/[^a-z0-9]/g,'')}
function makeNodeMap(root){const m=new Map();root.traverse(o=>{m.set(canon(o.name),o.name);if(o.isBone&&canon(o.name).includes('spine2'))spineBone=o});return m}
function retargetClip(src,targetMap,stripRootXZ){const tracks=[];for(const tr of src.tracks){const dot=tr.name.indexOf('.');if(dot<0)continue;const node=tr.name.slice(0,dot),prop=tr.name.slice(dot+1),target=targetMap.get(canon(node));if(!target)continue;const nt=tr.clone();nt.name=`${target}.${prop}`;if(stripRootXZ&&prop==='position'&&canon(node).includes('hips')&&nt.values.length%3===0){for(let i=0;i<nt.values.length;i+=3){nt.values[i]=0;nt.values[i+2]=0}}tracks.push(nt)}return new THREE.AnimationClip(src.name,src.duration,tracks)}
function buildTravellerGear(){
  const olive=new THREE.MeshStandardMaterial({color:0x4b503d,roughness:.95}),olive2=new THREE.MeshStandardMaterial({color:0x626653,roughness:.96}),leather=new THREE.MeshStandardMaterial({color:0x5d4634,roughness:.93}),dark=new THREE.MeshStandardMaterial({color:0x2e302d,roughness:.95});
  coat=new THREE.Group();const torso=new THREE.Mesh(new THREE.CylinderGeometry(.36,.48,.92,16),olive);torso.scale.z=.72;torso.position.y=1.27;torso.castShadow=true;coat.add(torso);const hem=new THREE.Mesh(new THREE.CylinderGeometry(.46,.56,.48,16),olive);hem.scale.z=.75;hem.position.y=.70;hem.castShadow=true;coat.add(hem);coat.scale.setScalar(1.02);traveller.add(coat);
  backpack=new THREE.Group();const bag=new THREE.Mesh(new THREE.BoxGeometry(.55,.76,.27,3,4,2),leather);bag.position.set(0,1.23,.36);bag.castShadow=true;backpack.add(bag);const flap=new THREE.Mesh(new THREE.BoxGeometry(.46,.18,.08),new THREE.MeshStandardMaterial({color:0x73563e,roughness:.95}));flap.position.set(0,1.47,.525);backpack.add(flap);for(const sx of [-1,1]){const strap=new THREE.Mesh(new THREE.TorusGeometry(.20,.028,6,18,Math.PI*1.10),leather);strap.position.set(sx*.23,1.32,.18);strap.rotation.set(Math.PI/2,0,sx*.28);backpack.add(strap)}traveller.add(backpack);
  // loose neck hood/scarf to make the back silhouette read as a traveller
  const hood=new THREE.Mesh(new THREE.TorusGeometry(.27,.09,8,22,Math.PI*1.62),olive2);hood.position.set(0,1.78,.06);hood.rotation.set(Math.PI/2,0,.22);hood.castShadow=true;traveller.add(hood);
  // dark overlay at hips softens the source character's bright trousers
  const hipWrap=new THREE.Mesh(new THREE.CylinderGeometry(.43,.42,.40,14),dark);hipWrap.position.y=.51;hipWrap.scale.z=.75;hipWrap.castShadow=true;traveller.add(hipWrap);
}
function setAction(name,fade=.25){const next=actions[name]||actions.idle;if(next===currentAction)return;if(currentAction)currentAction.fadeOut(fade);next.reset().fadeIn(fade).play();currentAction=next}

async function loadHDRI(){
  try{const tex=await new RGBELoader().loadAsync(ASSET.hdri);tex.mapping=THREE.EquirectangularReflectionMapping;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(tex).texture;tex.dispose();pmrem.dispose();}catch(e){console.warn('HDRI unavailable; procedural lighting remains active.',e)}
}

function allowedAt(x,z){
  const widths={south:2.05,bridge:1.85,ford:2.1,north:2.0};let ok=false;
  for(const [k,line] of Object.entries(routeLines)){if(state.route==='bridge'&&k==='ford')continue;if(state.route==='ford'&&k==='bridge')continue;if(distancePolyline(x,z,line)<=widths[k]){ok=true;break}}
  if(Math.hypot(x,z-24)<3.0)ok=true;if(Math.hypot(x-7,z+22)<3.2)ok=true;return ok;
}
function detectRoute(){
  if(state.route)return; if(state.pos.z<10.8){if(state.pos.x<-2.5){state.route='bridge';showNotice('Old bridge selected','Continue over the timber crossing.')}else if(state.pos.x>2.7){state.route='ford';showNotice('Shallow ford selected','Follow the stones across the stream.')}}
}
function showNotice(title,copy,d=2600){noticeTitle.textContent=title;noticeCopy.textContent=copy;notice.classList.remove('hidden');clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>notice.classList.add('hidden'),d)}
function updateRegion(){const z=state.pos.z;if(z>15)regionEl.textContent='SOUTHERN TRAIL';else if(z>8)regionEl.textContent='STREAM APPROACH';else if(z>-3)regionEl.textContent=state.route==='ford'?'SHALLOW FORD':state.route==='bridge'?'OLD BRIDGE':'RIVER CROSSING';else if(z>-15)regionEl.textContent='NORTHERN TRAIL';else regionEl.textContent='OUTPOST RISE'}

function update(dt){
  if(!state.started||state.finished)return;const fwd=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw)),right=new THREE.Vector3(Math.cos(state.yaw),0,Math.sin(state.yaw));let move=new THREE.Vector3();
  if(state.keys.KeyW||state.keys.ArrowUp)move.add(fwd);if(state.keys.KeyS||state.keys.ArrowDown)move.sub(fwd);if(state.keys.KeyD||state.keys.ArrowRight)move.add(right);if(state.keys.KeyA||state.keys.ArrowLeft)move.sub(right);
  const running=!!(state.keys.ShiftLeft||state.keys.ShiftRight),moving=move.lengthSq()>.001;
  if(moving){move.normalize();const dist=(running?4.9:2.9)*dt;const next=state.pos.clone().addScaledVector(move,dist);if(allowedAt(next.x,next.z)){state.pos.copy(next);state.meters+=dist;state.heading.lerp(move,.18).normalize()}detectRoute();setAction(running?'run':'walk');}else setAction('idle');
  state.pos.y=surfaceHeightAt(state.pos.x,state.pos.z)+.02;updateTraveller(dt,moving,running);updateCamera(dt);updateRegion();
  if(state.pos.z<-19.8&&Math.hypot(state.pos.x-7,state.pos.z+22)<4.5)complete();
}
function updateTraveller(dt,moving,running){if(!traveller)return;traveller.position.set(state.pos.x,surfaceHeightAt(state.pos.x,state.pos.z)+.02,state.pos.z);traveller.rotation.y=Math.atan2(state.heading.x,state.heading.z)+Math.PI;if(mixer)mixer.update(dt*(running?1.08:1));if(coat&&moving)coat.children[1].rotation.z=Math.sin(worldTime*(running?10:7))*.025;if(backpack&&moving)backpack.rotation.z=Math.sin(worldTime*7)*.008}
function updateCamera(dt){const back=new THREE.Vector3(-Math.sin(state.yaw),0,Math.cos(state.yaw));const desired=state.pos.clone().add(back.multiplyScalar(6.2)).add(new THREE.Vector3(0,2.95+state.pitch*2.2,0));camera.position.lerp(desired,1-Math.exp(-dt*5));const look=state.pos.clone().add(new THREE.Vector3(0,1.45,0)).addScaledVector(state.heading,1.7);camera.lookAt(look)}
function animate(){requestAnimationFrame(animate);const dt=Math.min(.033,clock.getDelta());worldTime+=dt;if(roots.water)roots.water.material.uniforms.time.value=worldTime;if(roots.waterfall)roots.waterfall.material.uniforms.time.value=worldTime;for(let i=0;i<roots.grass.length;i+=5)roots.grass[i].rotation.z=Math.sin(worldTime*1.5+i)*.015;update(dt);composer.render()}
animate();

function complete(){state.finished=true;state.started=false;hud.classList.add('hidden');finish.classList.remove('hidden');const sec=(performance.now()-state.startTime)/1000;$('#stats').innerHTML=`Route: <strong>${state.route||'undecided'}</strong><br>Walking time: <strong>${sec.toFixed(1)} s</strong><br>Distance moved: <strong>${state.meters.toFixed(0)} m</strong>`}
function reset(){state.finished=false;state.route=null;state.pos.set(0,surfaceHeightAt(0,24)+.02,24);state.heading.set(0,0,-1);state.yaw=0;state.pitch=.30;state.meters=0;state.startTime=performance.now();finish.classList.add('hidden');hud.classList.remove('hidden');state.started=true;showNotice('The outpost is visible ahead','Follow the trail. The stream offers two crossings.',3100)}

enterBtn.addEventListener('click',()=>{loading.classList.add('hidden');hud.classList.remove('hidden');state.started=true;state.startTime=performance.now();showNotice('The outpost is visible ahead','Follow the trail. The stream offers two crossings.',3100)});
$('#againBtn').addEventListener('click',reset);
window.addEventListener('keydown',e=>state.keys[e.code]=true);window.addEventListener('keyup',e=>state.keys[e.code]=false);
window.addEventListener('pointerdown',e=>{state.drag=true;state.lastMouseX=e.clientX;state.lastMouseY=e.clientY});window.addEventListener('pointerup',()=>state.drag=false);window.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-state.lastMouseX,dy=e.clientY-state.lastMouseY;state.lastMouseX=e.clientX;state.lastMouseY=e.clientY;state.yaw-=dx*.0042;state.pitch=Math.max(.08,Math.min(.72,state.pitch+dy*.0028))});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight)});
