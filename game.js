import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $=(s)=>document.querySelector(s);
const canvas=$('#game'), loading=$('#loading'), enterBtn=$('#enterBtn'), hud=$('#hud'), finish=$('#finish');
const loadLabel=$('#loadLabel'), loadPct=$('#loadPct'), barFill=$('#barFill'), loadDetail=$('#loadDetail'), fatal=$('#fatal');
const regionEl=$('#region'), notice=$('#routeNotice'), noticeTitle=$('#noticeTitle'), noticeCopy=$('#noticeCopy');
const perfChip=$('#perfChip');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
let renderPixelRatio=Math.min(devicePixelRatio,1.18);
renderer.setPixelRatio(renderPixelRatio);
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

const texLoader=new THREE.TextureLoader();
const gltfLoader=new GLTFLoader();
const clock=new THREE.Clock();
let worldTime=0;

const ASSET={
  forest:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_nor_gl_1k.jpg'
  },
  path:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_nor_gl_1k.jpg'
  },
  wood:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_nor_gl_1k.jpg'
  },
  rock:{
    diff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_diff_1k.jpg',
    norm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_nor_gl_1k.jpg'
  },
  traveller:'https://cdn.jsdelivr.net/gh/programasweights/avatar@main/public/assets/character.glb',
  michelle:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Michelle.glb'
};

const MATERIALS={};
let terrain, pathMeshes=[], traveller=null, humanRoot=null;
let backpack=null, blobShadow=null, travellerSource='', travellerFacingOffset=Math.PI;
let travellerRig=null, travellerRest=null;
let pineTex=null, grassMat=null, rockGeo=null;
const root={water:null,waterfall:null,trees:[],grass:null,reeds:null,rocks:null,flowers:null};

const queues={
  pine:[], broad:[], grass:[], reeds:[], rocks:[], flowers:[]
};

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

let perfElapsed=0, perfFrames=0, lastFps=60, qualityStep=0;

boot().catch(failBoot);

async function boot(){
  setProgress(4,'Creating authored terrain','Generating the valley and starting the traveller download in parallel.');
  setupLights();
  setupSkyBackdrop();
  terrain=makeTerrain(); scene.add(terrain);

  const travellerPromise=loadTraveller();
  setProgress(12,'Loading lightweight PBR materials','Eight 1K maps replace the previous twelve-map material load.');
  const materialsPromise=loadMaterials();
  await materialsPromise;
  applyTerrainMaterial();

  setProgress(34,'Building the authored route','Trail, stream, bridge, ford and outpost.');
  makeTrailNetwork();
  makeRiver();
  makeBridge();
  makeOutpost();
  makeWaterfallAndMountains();

  setProgress(55,'Optimizing the landscape','Vegetation and stones are now GPU-instanced rather than thousands of individual meshes.');
  dressLandscape();
  buildInstanceBatches();

  setProgress(76,'Building the traveller','Loading a stable CC0 humanoid, grounding the feet, then fitting traveller clothing and a backpack.');
  await travellerPromise;
  makeBlobShadow();

  state.pos.y=surfaceHeightAt(state.pos.x,state.pos.z)+.02;
  updateTraveller(0,false,false);
  updateCamera(1);

  // Build the static shadow map once. Moving character uses a cheap contact/blob shadow.
  renderer.shadowMap.needsUpdate=true;
  renderer.render(scene,camera);
  renderer.shadowMap.autoUpdate=false;

  setProgress(100,'Valley ready','Milestones 1B, 1C and 1D initialized.');
  enterBtn.disabled=false;
  enterBtn.textContent='ENTER THE VALLEY';
}

function setProgress(p,label,detail=''){
  loadPct.textContent=`${p}%`; barFill.style.width=`${p}%`; loadLabel.textContent=label; loadDetail.textContent=detail;
}
function failBoot(err){
  console.error(err); enterBtn.disabled=true; enterBtn.textContent='3D SCENE FAILED TO LOAD'; fatal.classList.remove('hidden'); fatal.textContent=`Initialization error: ${err?.message||err}`;
}

function setupLights(){
  scene.add(new THREE.HemisphereLight(0xdfeff3,0x43543e,1.55));
  const sun=new THREE.DirectionalLight(0xfff0cf,3.0);
  sun.position.set(-24,38,24); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-38; sun.shadow.camera.right=38; sun.shadow.camera.top=38; sun.shadow.camera.bottom=-38;
  sun.shadow.camera.near=3; sun.shadow.camera.far=88; sun.shadow.bias=-.00016;
  scene.add(sun);
  const fill=new THREE.DirectionalLight(0xaccfe7,.52); fill.position.set(24,12,-16); scene.add(fill);
}
function setupSkyBackdrop(){
  const sky=new THREE.Mesh(
    new THREE.SphereGeometry(130,28,16),
    new THREE.ShaderMaterial({
      side:THREE.BackSide,
      uniforms:{top:{value:new THREE.Color(0x8db5d0)},mid:{value:new THREE.Color(0xc7d8d7)},low:{value:new THREE.Color(0xe6ddc4)}},
      vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 top,mid,low;varying vec3 vP;void main(){float h=normalize(vP).y*.5+.5;vec3 c=mix(low,mid,smoothstep(.05,.48,h));c=mix(c,top,smoothstep(.48,1.,h));gl_FragColor=vec4(c,1.);}`
    })
  );
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
  if(Math.abs(x+7.75)<1.35 && z>-0.1 && z<8.1) return heightAt(-7.75,4.0)+.39;
  if(Math.abs(x-9.25)<1.35 && z>.6 && z<7.4) return base+.10;
  return base;
}
function makeTerrain(){
  const g=new THREE.PlaneGeometry(70,78,130,142); g.rotateX(-Math.PI/2);
  const p=g.attributes.position, cols=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i), z=p.getZ(i); let y=heightAt(x,z);
    const stream=Math.abs(z-(4+.035*x)); if(stream<2.8)y-=Math.cos(stream/2.8*Math.PI/2)*.48;
    p.setY(i,y);
    const c=new THREE.Color(0x657a51); c.offsetHSL(Math.sin(x*.4+z*.22)*.01,0,Math.sin(i*.77)*.015); if(y>1.7)c.lerp(new THREE.Color(0x74756d),.26); cols.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1}));
  mesh.receiveShadow=true; return mesh;
}

function loadTexture(url,{repeat=1,srgb=false}={}){
  return new Promise((resolve)=>texLoader.load(url,t=>{
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat,repeat);
    t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
    if(srgb)t.colorSpace=THREE.SRGBColorSpace;
    resolve(t);
  },undefined,()=>resolve(null)));
}
async function pbr(set,repeat){
  const [map,normalMap]=await Promise.all([
    loadTexture(set.diff,{repeat,srgb:true}),
    loadTexture(set.norm,{repeat})
  ]);
  return {map,normalMap};
}
async function loadMaterials(){
  const [forest,path,wood,rock]=await Promise.all([
    pbr(ASSET.forest,9),pbr(ASSET.path,2.4),pbr(ASSET.wood,1.25),pbr(ASSET.rock,2)
  ]);
  MATERIALS.forest=new THREE.MeshStandardMaterial({...forest,color:0xe2e2db,roughness:.98,vertexColors:true});
  MATERIALS.path=new THREE.MeshStandardMaterial({...path,color:0xf2e8d7,roughness:.96});
  MATERIALS.wood=new THREE.MeshStandardMaterial({...wood,color:0xd5b18b,roughness:.90});
  MATERIALS.rock=new THREE.MeshStandardMaterial({...rock,color:0xc3c2b5,roughness:.98});
  MATERIALS.stone=new THREE.MeshStandardMaterial({...rock,color:0x9b9a90,roughness:1});
}
function applyTerrainMaterial(){terrain.material=MATERIALS.forest;}

function pointOnGround(x,z,offset=.055){return new THREE.Vector3(x,heightAt(x,z)+offset,z)}
function makeStrip(points2,width,material,offset=.05){
  const pts=points2.map(([x,z])=>pointOnGround(x,z,offset));
  const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.35); const segs=80; const pos=[],uv=[],idx=[];
  for(let i=0;i<=segs;i++){
    const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
    const jitter=.08*Math.sin(i*.9)+.04*Math.sin(i*2.1),w=width*(1+jitter);
    const l=p.clone().addScaledVector(side,w*.5),r=p.clone().addScaledVector(side,-w*.5); l.y=heightAt(l.x,l.z)+offset; r.y=heightAt(r.x,r.z)+offset;
    pos.push(l.x,l.y,l.z,r.x,r.y,r.z); uv.push(0,t*9,1,t*9);
    if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,material); m.receiveShadow=true; scene.add(m); return m;
}
function makeTrailNetwork(){
  pathMeshes=[
    makeStrip(routeLines.south,2.7,MATERIALS.path),
    makeStrip(routeLines.bridge,2.45,MATERIALS.path),
    makeStrip(routeLines.ford,2.65,MATERIALS.path),
    makeStrip(routeLines.north,2.55,MATERIALS.path)
  ];
  for(const line of Object.values(routeLines)){
    for(let i=1;i<line.length-1;i++){
      const [x,z]=line[i];
      if(Math.random()<.75) queueRock(x+(Math.random()-.5)*1.4,z+(Math.random()-.5)*1.2,.09+Math.random()*.09,.45,1,Math.random()*Math.PI);
    }
  }
}

function makeRiver(){
  const segments=100,width=4.8,pos=[],uv=[],idx=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,x=-34+t*68,z=4+.035*x+.35*Math.sin(x*.12),center=pointOnGround(x,z,-.24),dz=.035+.042*Math.cos(x*.12),side=new THREE.Vector3(-dz,0,1).normalize();
    for(const s of [-1,1]){const p=center.clone().addScaledVector(side,s*width*.5);pos.push(p.x,p.y,p.z);uv.push(t,(s+1)/2)}
    if(i<segments){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c)}
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const mat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:{value:0},deep:{value:new THREE.Color(0x2d7080)},shallow:{value:new THREE.Color(0x82c9c6)},sun:{value:new THREE.Color(0xf3f1d3)}},
    vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.85+time*2.)*.025+sin(p.z*2.3-time*1.6)*.018;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float time;uniform vec3 deep,shallow,sun;varying vec2 vUv;void main(){float f=.5+.5*sin(vUv.x*75.+time*3.+sin(vUv.y*11.)*2.);float edge=smoothstep(0.,.26,vUv.y)*smoothstep(1.,.74,vUv.y);vec3 c=mix(shallow,deep,.42+vUv.y*.18);c+=sun*f*.08;float a=.72+.08*f;a*=.76+.24*edge;gl_FragColor=vec4(c,a);}`
  });
  root.water=new THREE.Mesh(g,mat); root.water.receiveShadow=true; scene.add(root.water);

  for(let i=0;i<85;i++){
    const x=-31+Math.random()*62,z=4+.035*x+(Math.random()<.5?-1:1)*(2.2+Math.random()*1.1),s=.18+Math.random()*.45;
    queueRock(x,z,s,.7,1,Math.random()*Math.PI);
  }
  for(let i=0;i<110;i++){
    const x=-28+Math.random()*56,z=4+.035*x+(Math.random()<.5?-1:1)*(2.35+Math.random()*.9);
    queueReed(x,z,.6+Math.random()*.75);
  }
  const fordZ=[7.0,6.15,5.25,4.35,3.45,2.55,1.65,.85];
  fordZ.forEach((zz,i)=>{
    const xx=9.15+Math.sin(i*.9)*.32;
    queueRock(xx,zz,.48+((i%3)*.06),.42,1.25,i*.31,-.02);
  });
}

function makeBridge(){
  const group=new THREE.Group(),x=-7.75,z=4.0; group.position.set(x,heightAt(x,z)+.32,z);
  const deckMat=MATERIALS.wood,logMat=new THREE.MeshStandardMaterial({color:0x5f452f,roughness:.98,map:MATERIALS.wood.map,normalMap:MATERIALS.wood.normalMap});
  const length=6.7,width=2.55;
  for(let i=0;i<17;i++){
    const plank=new THREE.Mesh(new THREE.BoxGeometry(width,.12,.36),deckMat);
    plank.position.set((Math.random()-.5)*.05,(Math.random()-.5)*.035,-length/2+.2+i*.39); plank.rotation.y=(Math.random()-.5)*.012; plank.castShadow=plank.receiveShadow=true; group.add(plank);
  }
  for(const sx of [-.93,.93]){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,length,8),logMat); beam.rotation.x=Math.PI/2; beam.position.set(sx,-.22,0); beam.castShadow=true; group.add(beam);
    const posts=[];
    for(let i=0;i<5;i++){
      const zz=-length/2+.15+i*(length-.3)/4,p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.105,1.05,7),logMat); p.position.set(sx*1.23,.48,zz); p.castShadow=true; group.add(p); posts.push(p.position.clone());
    }
    for(let i=0;i<posts.length-1;i++){
      const a=posts[i].clone().add(new THREE.Vector3(0,.33,0)),b=posts[i+1].clone().add(new THREE.Vector3(0,.33,0)),mid=a.clone().lerp(b,.5); mid.y-=.10;
      const rope=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,mid,b]),10,.025,5,false),new THREE.MeshStandardMaterial({color:0x63513e,roughness:1})); rope.castShadow=true; group.add(rope);
    }
  }
  for(const zz of [-3.25,3.25])for(const xx of [-1.05,1.05]){const r=makeRockMesh(.48);r.position.set(xx,-.1,zz);group.add(r)}
  scene.add(group);
}

function makeOutpost(){
  const g=new THREE.Group(),stone=MATERIALS.stone,wood=MATERIALS.wood;
  const ox=7.1,oz=-25.8,ground=heightAt(ox,oz);

  // A deliberately broad, irregular rock plinth intersects the terrain rather than hovering above it.
  const foundation=new THREE.Group();
  const rockLayout=[
    [0,-.25,0,4.2,1.55,3.7,0.15],[-2.3,.05,.65,2.8,1.2,2.5,-.35],[2.35,.10,-.55,2.6,1.25,2.35,.48],
    [-.55,.48,-2.3,2.4,1.05,2.2,.18],[1.25,.34,2.05,2.25,1.05,2.0,-.2]
  ];
  rockLayout.forEach(([x,y,z,sx,sy,sz,r])=>{const m=makeRockMesh(1);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.y=r;m.castShadow=m.receiveShadow=true;foundation.add(m)});
  g.add(foundation);

  // Terrace slab sits visibly on the rock foundation.
  const terrace=new THREE.Mesh(new THREE.CylinderGeometry(3.35,3.65,.48,14),stone);
  terrace.position.y=1.05;terrace.castShadow=terrace.receiveShadow=true;g.add(terrace);

  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.85,4.35,14),stone);
  base.position.y=3.45;base.castShadow=base.receiveShadow=true;g.add(base);
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.65,1.92,5.25,12),stone);
  tower.position.set(.58,7.9,-.25);tower.castShadow=tower.receiveShadow=true;g.add(tower);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.05,1.45,12),new THREE.MeshStandardMaterial({color:0x514038,roughness:1}));
  roof.position.set(.58,11.25,-.25);roof.castShadow=true;g.add(roof);
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.85,.18),wood);door.position.set(0,2.12,2.78);door.castShadow=true;g.add(door);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,m=new THREE.Mesh(new THREE.BoxGeometry(.46,.60,.46),stone);m.position.set(.58+Math.cos(a)*1.65,10.52,-.25+Math.sin(a)*1.65);m.rotation.y=-a;m.castShadow=true;g.add(m)}

  // Grounding rule: the group's y is the actual terrain height. Foundation geometry sinks into the hill.
  g.position.set(ox,ground-.18,oz);g.rotation.y=-.28;scene.add(g);

  // Small foreground boulders visually stitch the authored tower base into the landscape.
  [[-4.1,1.0,1.2],[3.9,.7,1.0],[-2.9,-2.6,.9],[3.2,-2.8,.85]].forEach(([dx,dz,sc])=>{
    const r=makeRockMesh(sc);r.position.set(ox+dx,heightAt(ox+dx,oz+dz)+.02,oz+dz);r.rotation.y=Math.random()*Math.PI;r.castShadow=r.receiveShadow=true;scene.add(r);
  });
}

function makeWaterfallAndMountains(){
  const wx=-14.0,wz=-28.3,baseY=heightAt(wx,wz)-.05,topY=baseY+8.7;

  // Rock escarpment: several overlapping boulders instead of one impossible rectangular cliff.
  const cliffGroup=new THREE.Group();
  const cliffParts=[
    [-3.1,3.4,-1.3,3.6,4.5,2.7,.2],[.1,4.0,-1.6,3.9,5.2,2.9,-.12],[3.2,3.0,-1.25,3.2,4.1,2.5,.28],
    [-2.0,7.1,-2.0,2.7,3.1,2.3,-.25],[1.2,7.4,-2.2,2.9,3.0,2.4,.18]
  ];
  cliffParts.forEach(([x,y,z,sx,sy,sz,r])=>{const rock=makeRockMesh(1);rock.position.set(x,y,z);rock.scale.set(sx,sy,sz);rock.rotation.y=r;rock.castShadow=rock.receiveShadow=true;cliffGroup.add(rock)});
  cliffGroup.position.set(wx,baseY,wz);scene.add(cliffGroup);

  // Upper feeder pool/stream makes the waterfall originate from visible water.
  const upperMat=new THREE.MeshStandardMaterial({color:0x5fa1ad,transparent:true,opacity:.82,roughness:.22,metalness:.02,side:THREE.DoubleSide});
  const upper=new THREE.Mesh(new THREE.PlaneGeometry(2.6,5.0),upperMat);upper.rotation.x=-Math.PI/2;upper.rotation.z=.05;upper.position.set(wx+.05,topY+.12,wz-3.25);scene.add(upper);

  const fallMat=new THREE.ShaderMaterial({
    transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0}},
    vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=sin(uv.y*13.+time*1.7)*.035*(1.-uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float time;varying vec2 vUv;void main(){float s=.5+.5*sin(vUv.x*34.-vUv.y*24.+time*6.);float s2=.5+.5*sin(vUv.x*77.+vUv.y*10.-time*8.);float foam=smoothstep(.0,.16,vUv.y)+smoothstep(.82,1.,1.-vUv.y);vec3 c=mix(vec3(.48,.72,.80),vec3(.94,.98,1.),.30+s*.34+s2*.12+foam*.22);float edge=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);gl_FragColor=vec4(c,(.56+.25*s)*edge);}`
  });
  const fallHeight=8.25;
  const fall=new THREE.Mesh(new THREE.PlaneGeometry(2.25,fallHeight,8,24),fallMat);
  fall.position.set(wx+.15,baseY+4.45,wz+.05);fall.rotation.y=.04;scene.add(fall);root.waterfall=fall;

  // Lower plunge pool and bank stones make the water visibly land somewhere.
  const pool=new THREE.Mesh(new THREE.CircleGeometry(2.8,32),new THREE.MeshStandardMaterial({color:0x4e8f9b,transparent:true,opacity:.78,roughness:.18,side:THREE.DoubleSide}));
  pool.rotation.x=-Math.PI/2;pool.scale.set(1.45,.82,1);pool.position.set(wx+.1,baseY+.08,wz+.7);scene.add(pool);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rad=2.8+Math.sin(i*1.7)*.45,r=makeRockMesh(.45+Math.random()*.35);const x=wx+Math.cos(a)*rad*1.35,z=wz+.7+Math.sin(a)*rad*.78;r.position.set(x,heightAt(x,z)+.02,z);r.rotation.y=a;r.castShadow=r.receiveShadow=true;scene.add(r)}

  // Distant alpine silhouettes remain scenery only.
  for(let i=0;i<9;i++){
    const h=16+Math.random()*15,rad=6+Math.random()*6,geo=new THREE.ConeGeometry(rad,h,7,4);geo.translate(0,h/2,0);const p=geo.attributes.position,cols=[];
    for(let j=0;j<p.count;j++){const yy=p.getY(j),c=new THREE.Color(0x77848b);if(yy>h*.60)c.lerp(new THREE.Color(0xe8eef2),Math.min(1,(yy-h*.60)/(h*.28)));cols.push(c.r,c.g,c.b)}
    geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));mesh.position.set(-30+i*8+Math.random()*4,-2,-58-Math.random()*7);mesh.scale.z=1.2+Math.random()*.8;scene.add(mesh);
  }
}

function getRockGeometry(){
  if(rockGeo)return rockGeo;
  rockGeo=new THREE.IcosahedronGeometry(1,1); const p=rockGeo.attributes.position;
  for(let i=0;i<p.count;i++){
    const k=.84+.28*(.5+.5*Math.sin(i*12.9898));
    p.setXYZ(i,p.getX(i)*k,p.getY(i)*(.62+.14*(.5+.5*Math.sin(i*4.13))),p.getZ(i)*(.82+.22*(.5+.5*Math.cos(i*8.7))));
  }
  rockGeo.computeVertexNormals(); return rockGeo;
}
function makeRockMesh(s=1){
  const m=new THREE.Mesh(getRockGeometry(),MATERIALS.rock||new THREE.MeshStandardMaterial({color:0x817d73,roughness:1})); m.scale.setScalar(s);m.castShadow=m.receiveShadow=true;return m;
}
function queueRock(x,z,s=.4,sy=.7,sx=1,rot=0,yOffset=.05){queues.rocks.push({x,z,y:heightAt(x,z)+yOffset,sx:s*sx,sy:s*sy,sz:s*(.88+Math.random()*.2),rot})}

function getPineTexture(){
  if(pineTex)return pineTex;
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.clearRect(0,0,256,128);
  for(let i=0;i<260;i++){
    const xx=20+Math.random()*216,yy=20+Math.random()*90,len=7+Math.random()*24;
    x.strokeStyle=`rgba(${35+Math.random()*35|0},${75+Math.random()*55|0},${35+Math.random()*30|0},${.32+Math.random()*.55})`;x.lineWidth=.7+Math.random()*1.7;
    x.beginPath();x.moveTo(128,64);x.lineTo(xx,yy);x.stroke();
    if(i%5===0){x.beginPath();x.moveTo(xx,yy);x.lineTo(xx+(Math.random()-.5)*len,yy+(Math.random()-.5)*len);x.stroke()}
  }
  pineTex=new THREE.CanvasTexture(c);pineTex.colorSpace=THREE.SRGBColorSpace;return pineTex;
}
function getGrassMaterial(){
  if(grassMat)return grassMat;
  const c=document.createElement('canvas');c.width=64;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,64,256);
  const grad=ctx.createLinearGradient(0,256,0,0);grad.addColorStop(0,'rgba(55,86,38,1)');grad.addColorStop(.65,'rgba(103,132,64,.93)');grad.addColorStop(1,'rgba(175,174,105,0)');
  ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(24,255);ctx.quadraticCurveTo(25,120,31,5);ctx.quadraticCurveTo(39,125,40,255);ctx.closePath();ctx.fill();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  grassMat=new THREE.MeshStandardMaterial({map:t,alphaTest:.16,side:THREE.DoubleSide,roughness:1,transparent:false});
  return grassMat;
}
function makeCylinderGeometryBetween(a,b,r,segments=6){
  const d=b.clone().sub(a),len=d.length(),geo=new THREE.CylinderGeometry(r,r*.82,len,segments);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
  const mid=a.clone().add(b).multiplyScalar(.5),mat=new THREE.Matrix4().compose(mid,q,new THREE.Vector3(1,1,1)); geo.applyMatrix4(mat); return geo;
}
function makePinePrototype(h=7.5){
  const barkGeos=[],folGeos=[];
  const trunk=new THREE.CylinderGeometry(.18,.32,h*.72,8); trunk.translate(0,h*.36,0); barkGeos.push(trunk);
  const layers=8;
  for(let l=0;l<layers;l++){
    const y=h*(.25+l*.075),radius=(1-l/(layers+2))*h*.19,branches=5+(l%2);
    for(let b=0;b<branches;b++){
      const a=(b/branches)*Math.PI*2+l*.56,len=radius*(.68+.22*(.5+.5*Math.sin((l+1)*(b+2)*1.77)));
      const start=new THREE.Vector3(0,y,0),end=new THREE.Vector3(Math.cos(a)*len,y+.06*Math.sin(b*2.1+l),Math.sin(a)*len);
      barkGeos.push(makeCylinderGeometryBetween(start,end,.035+.045*(1-l/layers),6));
      for(let q=0;q<3;q++){
        const plane=new THREE.PlaneGeometry(h*.18,h*.12),mat=new THREE.Matrix4(),quat=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a+q*Math.PI/3,.06*Math.sin(l+b), 'XYZ'));
        mat.compose(end.clone().add(new THREE.Vector3(0,.04,0)),quat,new THREE.Vector3(1,1,1));plane.applyMatrix4(mat);folGeos.push(plane);
      }
    }
  }
  for(let q=0;q<3;q++){
    const plane=new THREE.PlaneGeometry(h*.22,h*.26),mat=new THREE.Matrix4(),quat=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,q*Math.PI/3,0));
    mat.compose(new THREE.Vector3(0,h*.83,0),quat,new THREE.Vector3(1,1,1));plane.applyMatrix4(mat);folGeos.push(plane);
  }
  return {bark:mergeGeometries(barkGeos,false),foliage:mergeGeometries(folGeos,false)};
}
function makeBroadPrototype(h=6.2){
  const barkGeos=[],leafGeos=[];
  const trunk=new THREE.CylinderGeometry(.22,.34,h*.56,9);trunk.translate(0,h*.28,0);barkGeos.push(trunk);
  const limbs=[[0,2.8,0,.9,4.7,.2],[-.2,3.2,.1,-1,4.5,.5],[.1,3.7,-.1,.5,5.1,-.8]];
  for(const [x,y,z,x2,y2,z2] of limbs)barkGeos.push(makeCylinderGeometryBetween(new THREE.Vector3(x,y,z),new THREE.Vector3(x2,y2,z2),.09,7));
  for(let i=0;i<9;i++){
    const s=.75+(.5+.5*Math.sin(i*2.37))*.7,geo=new THREE.IcosahedronGeometry(s,1),mat=new THREE.Matrix4();
    const pos=new THREE.Vector3(Math.sin(i*1.91)*1.45,3.9+(.5+.5*Math.cos(i*1.31))*1.8,Math.cos(i*2.17)*1.05);
    mat.compose(pos,new THREE.Quaternion(),new THREE.Vector3(1,.7,1));geo.applyMatrix4(mat);leafGeos.push(geo);
  }
  return {bark:mergeGeometries(barkGeos,false),foliage:mergeGeometries(leafGeos,false)};
}
function queueGrass(x,z,scale=1){
  for(let i=0;i<4;i++)queues.grass.push({x:x+(Math.random()-.5)*.55,z:z+(Math.random()-.5)*.55,y:heightAt(x,z),sx:.13*scale,sy:.65*scale,rot:Math.random()*Math.PI,tilt:(Math.random()-.5)*.15});
}
function queueReed(x,z,s){
  for(let i=0;i<3;i++)queues.reeds.push({x:x+(Math.random()-.5)*.25,z:z+(Math.random()-.5)*.25,y:heightAt(x,z),sx:.10*s,sy:1.4*s,rot:Math.random()*Math.PI,tilt:(Math.random()-.5)*.08});
}

function dressLandscape(){
  for(let i=0;i<82;i++){
    const x=-28+Math.random()*56,z=-30+Math.random()*58;if(distanceToAnyPath(x,z)<3.6)continue;if(Math.abs(z-(4+.035*x))<3.4)continue;
    const s=(.82+Math.random()*.45)*(i%5===0?.92:1.0);
    (i%5===0?queues.broad:queues.pine).push({x,z,y:heightAt(x,z),scale:s,rot:Math.random()*Math.PI*2});
  }
  for(let i=0;i<370;i++){
    const x=-25+Math.random()*50,z=-27+Math.random()*54;if(distanceToAnyPath(x,z)<.65)continue;if(Math.abs(z-(4+.035*x))<2.35)continue;queueGrass(x,z,.55+Math.random()*.8);
  }
  for(let i=0;i<72;i++){
    const x=-25+Math.random()*50,z=-26+Math.random()*52;if(distanceToAnyPath(x,z)<1.2)continue;queueRock(x,z,.18+Math.random()*.6,.7,1,Math.random()*Math.PI);
  }
  for(let i=0;i<90;i++){
    const x=-15+Math.random()*34,z=-8+Math.random()*26,d=distanceToAnyPath(x,z);if(d>4.7||d<1.1)continue;queues.flowers.push({x,z,y:heightAt(x,z)+.28+Math.random()*.22,s:.035+Math.random()*.018});
  }
}
function distanceToAnyPath(x,z){let d=999;for(const line of Object.values(routeLines))d=Math.min(d,distancePolyline(x,z,line));return d}
function distancePolyline(x,z,line){let d=999;for(let i=0;i<line.length-1;i++){const [ax,az]=line[i],[bx,bz]=line[i+1],vx=bx-ax,vz=bz-az,wx=x-ax,wz=z-az,t=Math.max(0,Math.min(1,(wx*vx+wz*vz)/(vx*vx+vz*vz)));d=Math.min(d,Math.hypot(x-(ax+vx*t),z-(az+vz*t)))}return d}

function buildInstanceBatches(){
  const dummy=new THREE.Object3D();

  // Pine: visually detailed template, but all pines render in just two instanced draw calls.
  if(queues.pine.length){
    const proto=makePinePrototype(7.4),barkMat=new THREE.MeshStandardMaterial({color:0x514333,roughness:1}),leafMat=new THREE.MeshStandardMaterial({map:getPineTexture(),alphaTest:.24,side:THREE.DoubleSide,color:0xdce8d2,roughness:1});
    const bark=new THREE.InstancedMesh(proto.bark,barkMat,queues.pine.length),fol=new THREE.InstancedMesh(proto.foliage,leafMat,queues.pine.length);
    queues.pine.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.setScalar(t.scale);dummy.updateMatrix();bark.setMatrixAt(i,dummy.matrix);fol.setMatrixAt(i,dummy.matrix)});
    bark.instanceMatrix.needsUpdate=fol.instanceMatrix.needsUpdate=true;bark.castShadow=true;bark.receiveShadow=true;fol.castShadow=false;fol.receiveShadow=true;scene.add(bark,fol);root.trees.push(bark,fol);
  }

  if(queues.broad.length){
    const proto=makeBroadPrototype(6.2),barkMat=new THREE.MeshStandardMaterial({color:0x68523d,roughness:1}),leafMat=new THREE.MeshStandardMaterial({color:0x4b6f42,roughness:1});
    const bark=new THREE.InstancedMesh(proto.bark,barkMat,queues.broad.length),fol=new THREE.InstancedMesh(proto.foliage,leafMat,queues.broad.length);
    queues.broad.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.setScalar(t.scale);dummy.updateMatrix();bark.setMatrixAt(i,dummy.matrix);fol.setMatrixAt(i,dummy.matrix)});
    bark.instanceMatrix.needsUpdate=fol.instanceMatrix.needsUpdate=true;bark.castShadow=true;bark.receiveShadow=true;fol.castShadow=false;fol.receiveShadow=true;scene.add(bark,fol);root.trees.push(bark,fol);
  }

  const grassMaterial=getGrassMaterial();
  if(queues.grass.length){
    const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);const mesh=new THREE.InstancedMesh(geo,grassMaterial,queues.grass.length);
    queues.grass.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,t.rot,t.tilt);dummy.scale.set(t.sx,t.sy,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;scene.add(mesh);root.grass=mesh;
  }
  if(queues.reeds.length){
    const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);const mesh=new THREE.InstancedMesh(geo,grassMaterial,queues.reeds.length);
    queues.reeds.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,t.rot,t.tilt);dummy.scale.set(t.sx,t.sy,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);root.reeds=mesh;
  }
  if(queues.rocks.length){
    const mesh=new THREE.InstancedMesh(getRockGeometry(),MATERIALS.rock,queues.rocks.length);
    queues.rocks.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.set(t.sx,t.sy,t.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);root.rocks=mesh;
  }
  if(queues.flowers.length){
    const geo=new THREE.SphereGeometry(1,5,4),mat=new THREE.MeshStandardMaterial({color:0xf1efdf,roughness:1}),mesh=new THREE.InstancedMesh(geo,mat,queues.flowers.length);
    queues.flowers.forEach((t,i)=>{dummy.position.set(t.x,t.y,t.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(t.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);root.flowers=mesh;
  }
}

async function loadTraveller(){
  let gltf=null,kind='quaternius-cc0';
  try{
    gltf=await loadGLBWithTimeout(ASSET.traveller,11000);
  }catch(e){
    console.warn('CC0 traveller unavailable; using Michelle fallback.',e);kind='michelle';gltf=await loadGLBWithTimeout(ASSET.michelle,10000);
  }
  travellerSource=kind;
  traveller=new THREE.Group();
  humanRoot=gltf.scene;

  // Never rotate the imported skeleton around X/Z. First make it upright, centred and foot-grounded from its actual bounds.
  humanRoot.rotation.set(0,0,0);
  humanRoot.scale.set(1,1,1);
  humanRoot.position.set(0,0,0);
  humanRoot.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(humanRoot),size=new THREE.Vector3();box.getSize(size);
  const targetHeight=1.73,scale=targetHeight/Math.max(.001,size.y);
  humanRoot.scale.setScalar(scale);humanRoot.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(humanRoot);const center=new THREE.Vector3();box.getCenter(center);
  humanRoot.position.set(-center.x,-box.min.y,-center.z);
  humanRoot.updateMatrixWorld(true);

  // Quaternius reference pose faces +Z; Michelle is treated the same at the parent level.
  travellerFacingOffset=Math.PI;
  styleTravellerBase(humanRoot,kind);
  traveller.add(humanRoot);
  scene.add(traveller);

  travellerRig=mapHumanoidRig(humanRoot);
  travellerRest=captureRestPose(travellerRig);
  buildTravellerClothing(travellerRig);
  buildBackpackRigged(travellerRig);
}
function loadGLBWithTimeout(url,ms){
  return Promise.race([
    new Promise((resolve,reject)=>gltfLoader.load(url,resolve,undefined,reject)),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error(`Timed out loading ${url}`)),ms))
  ]);
}
function styleTravellerBase(rootNode,kind){
  rootNode.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=false;o.receiveShadow=true;
    const wasArray=Array.isArray(o.material),mats=wasArray?o.material:[o.material];
    const styled=mats.map(m=>{if(!m)return m;const c=m.clone();c.roughness=.86;c.metalness=0;
      // The CC0 base is treated as skin/underlayer; fitted traveller garments are separate and follow bones.
      if(c.color)c.color.set(kind==='quaternius-cc0'?0xc6a78d:0xa18c7a);return c;});
    o.material=wasArray?styled:styled[0];
  });
}
function cleanBoneName(n){return (n||'').toLowerCase().replace(/mixamorig\d*:?/g,'').replace(/[^a-z0-9]/g,'')}
function findBone(rootNode,patterns){
  let found=null;rootNode.traverse(o=>{if(found||!o.isBone)return;const n=cleanBoneName(o.name);if(patterns.some(p=>p.test(n)))found=o});return found;
}
function mapHumanoidRig(rootNode){
  const rig={
    hips:findBone(rootNode,[/^hips?$/, /pelvis/, /^hip$/]),
    spine:findBone(rootNode,[/^spine$/, /spine0/, /lowerchest/]),
    chest:findBone(rootNode,[/^chest$/, /spine1/, /upperchest/]),
    head:findBone(rootNode,[/^head$/, /headbase/]),
    neck:findBone(rootNode,[/^neck$/]),
    lUpperArm:findBone(rootNode,[/leftupperarm/,/leftarm$/, /upperarml/, /armleft/]),
    rUpperArm:findBone(rootNode,[/rightupperarm/,/rightarm$/, /upperarmr/, /armright/]),
    lLowerArm:findBone(rootNode,[/leftlowerarm/,/leftforearm/,/forearml/]),
    rLowerArm:findBone(rootNode,[/rightlowerarm/,/rightforearm/,/forearmr/]),
    lHand:findBone(rootNode,[/^lefthand$/, /handl$/]),
    rHand:findBone(rootNode,[/^righthand$/, /handr$/]),
    lUpperLeg:findBone(rootNode,[/leftupperleg/,/leftupleg/,/thighl/,/legleft/]),
    rUpperLeg:findBone(rootNode,[/rightupperleg/,/rightupleg/,/thighr/,/legright/]),
    lLowerLeg:findBone(rootNode,[/leftlowerleg/,/^leftleg$/, /calfl/,/shinl/]),
    rLowerLeg:findBone(rootNode,[/rightlowerleg/,/^rightleg$/, /calfr/,/shinr/]),
    lFoot:findBone(rootNode,[/^leftfoot$/, /footl$/]),
    rFoot:findBone(rootNode,[/^rightfoot$/, /footr$/])
  };
  const essential=['hips','head','lUpperLeg','rUpperLeg','lUpperArm','rUpperArm'];
  const missing=essential.filter(k=>!rig[k]);
  if(missing.length)console.warn('Traveller rig: some optional/procedural bones not found:',missing);
  return rig;
}
function captureRestPose(rig){
  const rest={};for(const [k,b] of Object.entries(rig||{}))if(b)rest[k]={q:b.quaternion.clone(),p:b.position.clone()};return rest;
}
function restoreBone(k){const b=travellerRig?.[k],r=travellerRest?.[k];if(b&&r){b.quaternion.copy(r.q);b.position.copy(r.p)}}
function poseBone(k,euler){const b=travellerRig?.[k],r=travellerRest?.[k];if(!b||!r)return;b.quaternion.copy(r.q);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(euler[0],euler[1],euler[2],'XYZ'));b.quaternion.multiply(q)}
function makeSegmentCover(bone,child,radius,material,scaleRadius=1){
  if(!bone||!child)return null;const end=child.position.clone();if(end.length()<.02)return null;
  const geo=makeCylinderGeometryBetween(new THREE.Vector3(),end,radius*scaleRadius,10);const mesh=new THREE.Mesh(geo,material);mesh.castShadow=false;mesh.receiveShadow=true;bone.add(mesh);return mesh;
}
function buildTravellerClothing(rig){
  const olive=new THREE.MeshStandardMaterial({color:0x545b43,roughness:.96,metalness:0});
  const oliveDark=new THREE.MeshStandardMaterial({color:0x444a37,roughness:.98,metalness:0});
  const charcoal=new THREE.MeshStandardMaterial({color:0x30332f,roughness:.98,metalness:0});
  const boot=new THREE.MeshStandardMaterial({color:0x4a3526,roughness:1,metalness:0});
  const hair=new THREE.MeshStandardMaterial({color:0x433027,roughness:1,metalness:0});

  // Sleeves/trousers are attached to the actual limb bones, so they cannot become detached or inverted by animation.
  makeSegmentCover(rig.lUpperArm,rig.lLowerArm,.105,olive,1.12);makeSegmentCover(rig.rUpperArm,rig.rLowerArm,.105,olive,1.12);
  makeSegmentCover(rig.lLowerArm,rig.lHand,.085,oliveDark,1.08);makeSegmentCover(rig.rLowerArm,rig.rHand,.085,oliveDark,1.08);
  makeSegmentCover(rig.lUpperLeg,rig.lLowerLeg,.145,charcoal,1.08);makeSegmentCover(rig.rUpperLeg,rig.rLowerLeg,.145,charcoal,1.08);
  makeSegmentCover(rig.lLowerLeg,rig.lFoot,.11,charcoal,1.06);makeSegmentCover(rig.rLowerLeg,rig.rFoot,.11,charcoal,1.06);

  const torsoAnchor=rig.chest||rig.spine||rig.hips;
  if(torsoAnchor){
    const coat=new THREE.Mesh(new THREE.CapsuleGeometry(.30,.46,5,12),olive);coat.scale.set(1.12,1.12,.74);coat.position.set(0,-.22,0);coat.castShadow=false;coat.receiveShadow=true;torsoAnchor.add(coat);
    const hem=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.42,12,1,true),oliveDark);hem.position.set(0,-.60,.015);hem.castShadow=false;hem.receiveShadow=true;torsoAnchor.add(hem);
    const hood=new THREE.Mesh(new THREE.TorusGeometry(.19,.055,7,18,Math.PI*1.4),oliveDark);hood.position.set(0,.23,.05);hood.rotation.set(Math.PI/2,0,.3);torsoAnchor.add(hood);
  }
  if(rig.head){
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.145,14,10,0,Math.PI*2,0,Math.PI*.62),hair);cap.position.set(0,.105,0);cap.rotation.x=.08;rig.head.add(cap);
    const bun=new THREE.Mesh(new THREE.SphereGeometry(.065,12,10),hair);bun.position.set(0,.13,.13);rig.head.add(bun);
  }
  for(const foot of [rig.lFoot,rig.rFoot])if(foot){const b=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.31),boot);b.position.set(0,-.035,.10);b.castShadow=false;b.receiveShadow=true;foot.add(b)}
}
function buildBackpackRigged(rig){
  const anchor=rig.chest||rig.spine||rig.hips;if(!anchor)return;
  backpack=new THREE.Group();
  const leather=new THREE.MeshStandardMaterial({color:0x5a4434,roughness:.98}),leather2=new THREE.MeshStandardMaterial({color:0x74573f,roughness:.96});
  const bag=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.27,5,12),leather);bag.scale.set(1.08,1.22,.58);bag.position.set(0,-.18,.31);backpack.add(bag);
  const flap=new THREE.Mesh(new THREE.BoxGeometry(.34,.13,.07),leather2);flap.position.set(0,.02,.46);flap.rotation.x=-.10;backpack.add(flap);
  const roll=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.40,10),new THREE.MeshStandardMaterial({color:0x696755,roughness:1}));roll.rotation.z=Math.PI/2;roll.position.set(0,-.52,.34);backpack.add(roll);
  for(const sx of [-1,1]){const strap=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,5,14,Math.PI*1.05),leather2);strap.position.set(sx*.16,-.20,.18);strap.rotation.set(Math.PI/2,0,sx*.18);backpack.add(strap)}
  backpack.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true}});anchor.add(backpack);
}
function animateTravellerRig(t,moving,running){
  if(!travellerRig||!travellerRest)return;
  const amp=moving?(running?.62:.42):.035,freq=running?9.2:6.4,s=Math.sin(t*freq),c=Math.cos(t*freq);
  // Restore all controlled bones before applying offsets, preventing cumulative twisting.
  for(const k of Object.keys(travellerRest))restoreBone(k);
  poseBone('lUpperLeg',[s*amp,0,.015]);poseBone('rUpperLeg',[-s*amp,0,-.015]);
  poseBone('lLowerLeg',[Math.max(0,-s)*amp*.55,0,0]);poseBone('rLowerLeg',[Math.max(0,s)*amp*.55,0,0]);
  poseBone('lUpperArm',[-s*amp*.72,0,-.04]);poseBone('rUpperArm',[s*amp*.72,0,.04]);
  poseBone('lLowerArm',[-.12-Math.max(0,s)*.18,0,0]);poseBone('rLowerArm',[-.12-Math.max(0,-s)*.18,0,0]);
  if(!moving){poseBone('spine',[.015*Math.sin(t*1.7),.018*Math.sin(t*.75),0]);poseBone('head',[.01*Math.sin(t*1.3),-.012*Math.sin(t*.8),0]);}
  if(rigHas('hips')){const b=travellerRig.hips,r=travellerRest.hips;b.position.copy(r.p);b.position.y+=moving?Math.abs(c)*.018:Math.sin(t*1.5)*.006;}
}
function rigHas(k){return !!travellerRig?.[k]}
function makeBlobShadow(){
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'rgba(0,0,0,.48)');g.addColorStop(.55,'rgba(0,0,0,.22)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const tex=new THREE.CanvasTexture(c),mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.58}),geo=new THREE.PlaneGeometry(1.15,.72);blobShadow=new THREE.Mesh(geo,mat);blobShadow.rotation.x=-Math.PI/2;scene.add(blobShadow);
}

function allowedAt(x,z){
  const widths={south:2.05,bridge:1.85,ford:2.1,north:2.0};let ok=false;
  for(const [k,line] of Object.entries(routeLines)){if(state.route==='bridge'&&k==='ford')continue;if(state.route==='ford'&&k==='bridge')continue;if(distancePolyline(x,z,line)<=widths[k]){ok=true;break}}
  if(Math.hypot(x,z-24)<3.0)ok=true;if(Math.hypot(x-7,z+22)<3.2)ok=true;return ok;
}
function detectRoute(){
  if(state.route)return;
  if(state.pos.z<10.8){
    if(state.pos.x<-2.5){state.route='bridge';showNotice('Old bridge selected','Continue over the timber crossing.');}
    else if(state.pos.x>2.7){state.route='ford';showNotice('Shallow ford selected','Follow the stones across the stream.');}
  }
}
function showNotice(title,copy,d=2600){noticeTitle.textContent=title;noticeCopy.textContent=copy;notice.classList.remove('hidden');clearTimeout(showNotice.t);showNotice.t=setTimeout(()=>notice.classList.add('hidden'),d)}
function updateRegion(){const z=state.pos.z;if(z>15)regionEl.textContent='SOUTHERN TRAIL';else if(z>8)regionEl.textContent='STREAM APPROACH';else if(z>-3)regionEl.textContent=state.route==='ford'?'SHALLOW FORD':state.route==='bridge'?'OLD BRIDGE':'RIVER CROSSING';else if(z>-15)regionEl.textContent='NORTHERN TRAIL';else regionEl.textContent='OUTPOST RISE'}

function update(dt){
  if(!state.started||state.finished)return;
  const fwd=new THREE.Vector3(Math.sin(state.yaw),0,-Math.cos(state.yaw)),right=new THREE.Vector3(Math.cos(state.yaw),0,Math.sin(state.yaw)),move=new THREE.Vector3();
  if(state.keys.KeyW||state.keys.ArrowUp)move.add(fwd);if(state.keys.KeyS||state.keys.ArrowDown)move.sub(fwd);if(state.keys.KeyD||state.keys.ArrowRight)move.add(right);if(state.keys.KeyA||state.keys.ArrowLeft)move.sub(right);
  const running=!!(state.keys.ShiftLeft||state.keys.ShiftRight),moving=move.lengthSq()>.001;
  if(moving){
    move.normalize();const dist=(running?4.9:2.9)*dt,next=state.pos.clone().addScaledVector(move,dist);
    if(allowedAt(next.x,next.z)){state.pos.copy(next);state.meters+=dist;state.heading.lerp(move,.18).normalize()}
    detectRoute();
  }
  state.pos.y=surfaceHeightAt(state.pos.x,state.pos.z)+.02;
  updateTraveller(dt,moving,running);updateCamera(dt);updateRegion();
  if(state.pos.z<-19.8&&Math.hypot(state.pos.x-7,state.pos.z+22)<4.5)complete();
}
function updateTraveller(dt,moving,running){
  if(!traveller)return;
  const y=surfaceHeightAt(state.pos.x,state.pos.z)+.02;
  traveller.position.set(state.pos.x,y,state.pos.z);
  traveller.rotation.y=Math.atan2(state.heading.x,state.heading.z)+travellerFacingOffset;
  animateTravellerRig(worldTime,moving,running);
  if(blobShadow){blobShadow.position.set(state.pos.x,y+.035,state.pos.z);blobShadow.rotation.z=-traveller.rotation.y;}
}

function updateCamera(dt){
  const back=new THREE.Vector3(-Math.sin(state.yaw),0,Math.cos(state.yaw)),desired=state.pos.clone().add(back.multiplyScalar(6.2)).add(new THREE.Vector3(0,2.95+state.pitch*2.2,0));
  camera.position.lerp(desired,1-Math.exp(-dt*5));const look=state.pos.clone().add(new THREE.Vector3(0,1.45,0)).addScaledVector(state.heading,1.7);camera.lookAt(look);
}
function adaptivePerformance(dt){
  if(!state.started)return;
  perfElapsed+=dt;perfFrames++;
  if(perfElapsed<2.0)return;
  lastFps=Math.round(perfFrames/perfElapsed);perfFrames=0;perfElapsed=0;
  if(perfChip)perfChip.textContent=`${lastFps} FPS`;
  if(lastFps<42&&qualityStep<2){
    qualityStep++;
    renderPixelRatio=qualityStep===1?Math.min(renderPixelRatio,1.0):Math.min(renderPixelRatio,.85);
    renderer.setPixelRatio(renderPixelRatio);renderer.setSize(innerWidth,innerHeight,false);
    if(perfChip)perfChip.textContent=`${lastFps} FPS · adaptive`;
  }
}
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(.033,clock.getDelta());worldTime+=dt;
  if(root.water)root.water.material.uniforms.time.value=worldTime;if(root.waterfall)root.waterfall.material.uniforms.time.value=worldTime;
  update(dt);adaptivePerformance(dt);renderer.render(scene,camera);
}
animate();

function complete(){
  state.finished=true;state.started=false;hud.classList.add('hidden');finish.classList.remove('hidden');const sec=(performance.now()-state.startTime)/1000;
  $('#stats').innerHTML=`Route: <strong>${state.route||'undecided'}</strong><br>Walking time: <strong>${sec.toFixed(1)} s</strong><br>Distance moved: <strong>${state.meters.toFixed(0)} m</strong><br>Traveller: <strong>${travellerSource}</strong><br>Last measured performance: <strong>${lastFps} FPS</strong>`;
}
function reset(){
  state.finished=false;state.route=null;state.pos.set(0,surfaceHeightAt(0,24)+.02,24);state.heading.set(0,0,-1);state.yaw=0;state.pitch=.30;state.meters=0;state.startTime=performance.now();finish.classList.add('hidden');hud.classList.remove('hidden');state.started=true;showNotice('The outpost is visible ahead','Follow the trail. The stream offers two crossings.',3100);
}

enterBtn.addEventListener('click',()=>{loading.classList.add('hidden');hud.classList.remove('hidden');state.started=true;state.startTime=performance.now();showNotice('The outpost is visible ahead','Follow the trail. The stream offers two crossings.',3100)});
$('#againBtn').addEventListener('click',reset);
window.addEventListener('keydown',e=>state.keys[e.code]=true);window.addEventListener('keyup',e=>state.keys[e.code]=false);
window.addEventListener('pointerdown',e=>{state.drag=true;state.lastMouseX=e.clientX;state.lastMouseY=e.clientY});window.addEventListener('pointerup',()=>state.drag=false);
window.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-state.lastMouseX,dy=e.clientY-state.lastMouseY;state.lastMouseX=e.clientX;state.lastMouseY=e.clientY;state.yaw-=dx*.0042;state.pitch=Math.max(.08,Math.min(.72,state.pitch+dy*.0028))});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(renderPixelRatio);renderer.setSize(innerWidth,innerHeight)});
