
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const $ = s => document.querySelector(s);
const coarse = matchMedia('(pointer:coarse)').matches;

// -----------------------------------------------------------------------------
// Renderer / scene
// -----------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x96bece);
scene.fog = new THREE.FogExp2(0xa9c9cf, .0074);
const camera = new THREE.PerspectiveCamera(49, innerWidth/innerHeight, .1, 420);

// lighting
scene.add(new THREE.HemisphereLight(0xeafcff, 0x4b5539, 1.52));
const sun = new THREE.DirectionalLight(0xffdfaa, 3.45);
sun.position.set(-48, 68, 32);
sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
sun.shadow.camera.left=-78; sun.shadow.camera.right=78;
sun.shadow.camera.top=92; sun.shadow.camera.bottom=-92;
sun.shadow.bias=-.00035;
scene.add(sun);

// deterministic scene composition
let seed=824917;
const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const clamp=THREE.MathUtils.clamp;

const palette={
  grass:0x799f5d, grass2:0x91b66a, dry:0xb6a36d,
  dirt:0xb99b6d, dirt2:0x947a55, stone:0x727369,
  stoneWarm:0x8a806d, wood:0x74543c, bark:0x624a35,
  leaf:0x4f7650, leaf2:0x678e54, water:0x3c9bb2
};
const std=(color,rough=.92)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0});
const mats={
  dirt:std(palette.dirt), dirt2:std(palette.dirt2), stone:std(palette.stone),
  stoneW:std(palette.stoneWarm), wood:std(palette.wood), bark:std(palette.bark),
  leaf:std(palette.leaf), leaf2:std(palette.leaf2)
};

// -----------------------------------------------------------------------------
// Authored landscape geometry
// -----------------------------------------------------------------------------
const streamZ = x => 7.0 + Math.sin(x*.075)*1.15 + Math.sin(x*.022)*.55;

function terrainH(x,z){
  let y=.72*Math.sin(z*.042)+.42*Math.sin(x*.057)+.26*Math.sin((x-z)*.082);
  y+=5.7*Math.exp(-Math.pow((x+36)/18,2));
  y+=7.0*Math.exp(-Math.pow((x-37)/20,2));
  y+=4.3*Math.exp(-Math.pow((z+64)/32,2));
  // river valley follows the actual stream instead of an unrelated straight band
  const dz=z-streamZ(x);
  y-=2.75*Math.exp(-Math.pow(dz/6.6,2))*Math.exp(-Math.pow(x/55,2));
  y*=1-.22*Math.exp(-Math.pow(x/19,2));
  return y;
}

const terrainG=new THREE.PlaneGeometry(138,228,128,168);
terrainG.rotateX(-Math.PI/2);
const tp=terrainG.attributes.position, terrainColors=[];
for(let i=0;i<tp.count;i++){
  const x=tp.getX(i), z=tp.getZ(i), y=terrainH(x,z);
  tp.setY(i,y);
  const slopeTint=clamp((y+2)/12,0,1);
  const c=new THREE.Color().setHSL(.26+(rnd()-.5)*.008,.28,.43+slopeTint*.055+(rnd()-.5)*.024);
  terrainColors.push(c.r,c.g,c.b);
}
terrainG.setAttribute('color',new THREE.Float32BufferAttribute(terrainColors,3));
terrainG.computeVertexNormals();
const terrain=new THREE.Mesh(terrainG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
terrain.receiveShadow=true;
scene.add(terrain);

// distant ocean
const sea=new THREE.Mesh(
  new THREE.PlaneGeometry(650,650).rotateX(-Math.PI/2),
  new THREE.MeshPhysicalMaterial({color:0x4b9fb0,roughness:.24,clearcoat:.25,transparent:true,opacity:.93})
);
sea.position.y=-7.8;
scene.add(sea);

// distant silhouettes
for(let i=0;i<18;i++){
  const a=i/18*Math.PI*2, r=118+rnd()*75;
  const m=new THREE.Mesh(new THREE.ConeGeometry(13+rnd()*18,25+rnd()*38,9),mats.stoneW);
  m.position.set(Math.sin(a)*r,-5,Math.cos(a)*r);
  m.scale.x=1.35+rnd()*2.1;
  m.rotation.y=rnd()*Math.PI;
  scene.add(m);
}

// smooth ground-hugging path ribbons (no floating Minecraft slabs)
function buildRibbon(points,width,material,yOffset=.035,samples=80){
  const control=points.map(([x,z])=>new THREE.Vector3(x,0,z));
  const curve=new THREE.CatmullRomCurve3(control,false,'centripetal',.4);
  const verts=[], uvs=[], idx=[];
  for(let i=0;i<=samples;i++){
    const t=i/samples, p=curve.getPoint(t), ta=curve.getTangent(t);
    const side=new THREE.Vector3(-ta.z,0,ta.x).normalize();
    const jitter=(Math.sin(t*37.0)+Math.sin(t*13.0)*.5)*.04;
    for(const s of [-1,1]){
      const x=p.x+side.x*(width*.5+jitter)*s;
      const z=p.z+side.z*(width*.5+jitter)*s;
      verts.push(x,terrainH(x,z)+yOffset,z);
      uvs.push(s<0?0:1,t*8);
    }
    if(i<samples){
      const a=i*2,b=a+1,c=a+2,d=a+3;
      idx.push(a,c,b,b,c,d);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,material); mesh.receiveShadow=true; scene.add(mesh);
  return {mesh,curve};
}

const southPts=[[0,86],[2,75],[-2,64],[1,53],[-2,42],[0,31],[0,21]];
const westPts=[[0,21],[-5,17],[-9,13],[-11.6,8],[-12,2],[-17,-8],[-22,-18],[-20,-30],[-12,-41],[0,-49]];
const eastPts=[[0,21],[5,17],[9,13],[11.7,8],[13,2],[18,-8],[22,-18],[19,-30],[11,-41],[0,-49]];
const northPts=[[0,-49],[-2,-59],[2,-70],[0,-84]];
buildRibbon(southPts,4.7,mats.dirt);
buildRibbon(westPts,3.6,mats.dirt);
buildRibbon(eastPts,3.6,mats.dirt);
buildRibbon(northPts,4.7,mats.dirt);

// stream ribbon actually follows river valley
const streamPoints=[];
for(let x=-68;x<=68;x+=8) streamPoints.push([x,streamZ(x)]);
const streamCurve=new THREE.CatmullRomCurve3(streamPoints.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');

const streamUniforms={
  uTime:{value:0},
  uDeep:{value:new THREE.Color(0x2e849e)},
  uLight:{value:new THREE.Color(0x7acbd4)}
};
const streamMat=new THREE.ShaderMaterial({
  transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:streamUniforms,
  vertexShader:`varying vec2 vUv;uniform float uTime;
  void main(){vUv=uv;vec3 p=position;p.y+=sin((p.x+p.z)*1.5+uTime*1.7)*.025+sin(p.z*4.2-uTime*2.1)*.018;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec3 uDeep;uniform vec3 uLight;
  void main(){float n=.5+.5*sin(vUv.y*49.0+sin(vUv.x*17.0)+uTime*2.0);
  float bank=smoothstep(0.,.14,vUv.x)*smoothstep(0.,.14,1.-vUv.x);
  vec3 col=mix(uDeep,uLight,.34+.22*n);float foam=smoothstep(.92,1.,n)*.13;
  gl_FragColor=vec4(col+foam,.70+.18*bank);}`
});
function makeStreamRibbon(){
  const verts=[],uvs=[],idx=[],samples=110,width=7.0;
  for(let i=0;i<=samples;i++){
    const t=i/samples,p=streamCurve.getPoint(t),ta=streamCurve.getTangent(t),side=new THREE.Vector3(-ta.z,0,ta.x).normalize();
    for(const s of [-1,1]){
      const x=p.x+side.x*width*.5*s,z=p.z+side.z*width*.5*s;
      const waterY=terrainH(p.x,p.z)+.28;
      verts.push(x,waterY,z);uvs.push(s<0?0:1,t*12);
    }
    if(i<samples){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,c,b,b,c,d)}
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,streamMat);scene.add(m);return m;
}
const stream=makeStreamRibbon();

// -----------------------------------------------------------------------------
// Bridge / ford, built against the same terrain / river coordinates
// -----------------------------------------------------------------------------
const BRIDGE_X=-11.6, BRIDGE_Z=streamZ(BRIDGE_X), FORD_X=11.7, FORD_Z=streamZ(FORD_X);
const bridgeBankSouth=terrainH(BRIDGE_X,BRIDGE_Z+5.2);
const bridgeBankNorth=terrainH(BRIDGE_X,BRIDGE_Z-5.2);
const BRIDGE_Y=Math.max(bridgeBankSouth,bridgeBankNorth)+.42;
const BRIDGE_LEN=11.6, BRIDGE_W=3.0;

const bridge=new THREE.Group();
for(let i=0;i<17;i++){
  const plank=new THREE.Mesh(new THREE.BoxGeometry(BRIDGE_W,.14,.58),mats.wood);
  plank.position.z=-BRIDGE_LEN/2+.55+i*.67;
  plank.rotation.y=(rnd()-.5)*.025;
  plank.castShadow=true;plank.receiveShadow=true;bridge.add(plank);
}
for(const sx of [-BRIDGE_W*.52,BRIDGE_W*.52]){
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,BRIDGE_LEN,8),mats.wood);
  rail.rotation.x=Math.PI/2;rail.position.set(sx,.72,0);bridge.add(rail);
  for(let z=-BRIDGE_LEN*.43;z<=BRIDGE_LEN*.43;z+=2.0){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.075,1.38,8),mats.wood);
    post.position.set(sx,.51,z);bridge.add(post);
  }
}
for(const sx of [-1.25,1.25]){
  for(const sz of [-4.8,4.8]){
    const ground=terrainH(BRIDGE_X+sx,BRIDGE_Z+sz);
    const hgt=Math.max(.8,BRIDGE_Y-ground);
    const support=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,hgt,8),mats.wood);
    support.position.set(sx,-(BRIDGE_Y-ground)/2+.02,sz);
    bridge.add(support);
  }
}
bridge.position.set(BRIDGE_X,BRIDGE_Y,BRIDGE_Z);
bridge.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
scene.add(bridge);

// ford stones sit exactly on stream bed
const fordStones=[];
for(let i=-5;i<=5;i++){
  const z=FORD_Z-i*.72,x=FORD_X+Math.sin(i*.6)*.35;
  const s=new THREE.Mesh(new THREE.CylinderGeometry(.48+rnd()*.18,.60+rnd()*.18,.20+rnd()*.08,10),mats.stone);
  s.position.set(x,terrainH(x,z)+.14,z); s.rotation.y=rnd()*6.2;
  s.castShadow=true;s.receiveShadow=true;scene.add(s);fordStones.push(s);
}

// bridge surface used by player grounding
function bridgeSurfaceY(x,z){
  if(Math.abs(x-BRIDGE_X)<=BRIDGE_W*.62 && Math.abs(z-BRIDGE_Z)<=BRIDGE_LEN*.52) return BRIDGE_Y+.08;
  return null;
}
function groundY(x,z){
  const by=bridgeSurfaceY(x,z);
  return by===null ? terrainH(x,z) : by;
}

// -----------------------------------------------------------------------------
// Obstacles + collision
// -----------------------------------------------------------------------------
const colliders=[]; // simple XZ circular colliders are fast and robust for this slice
function addCollider(x,z,r,type='rock'){colliders.push({x,z,r,type})}

function addFallbackRock(x,z,s=1,material=mats.stone,collide=true){
  const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,2),material);
  r.position.set(x,terrainH(x,z)+s*.52,z);
  r.scale.set(1.18,.76+rnd()*.42,1.02);
  r.rotation.set(rnd()*.3,rnd()*6.2,rnd()*.25);
  r.castShadow=true;r.receiveShadow=true;scene.add(r);
  if(collide)addCollider(x,z,s*.86,'rock');
  return r;
}
function addFallbackTree(x,z,s=1,collide=true){
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.34*s,3.0*s,10),mats.bark);
  trunk.position.y=1.5*s;trunk.castShadow=true;g.add(trunk);
  // overlapping rounded canopies, no box foliage
  for(let k=0;k<4;k++){
    const c=new THREE.Mesh(new THREE.IcosahedronGeometry((1.25-k*.10)*s,2),k%2?mats.leaf2:mats.leaf);
    c.scale.set(1,.82,1);c.position.set((k-1.5)*.28*s,(3.1+k*.55)*s,(k%2?.16:-.12)*s);
    c.castShadow=true;g.add(c);
  }
  g.position.set(x,terrainH(x,z),z);g.rotation.y=rnd()*6.2;scene.add(g);
  if(collide)addCollider(x,z,.52*s,'tree');
  return g;
}

// central rock spine = real obstacle, not just a visual line
for(let i=0;i<30;i++){
  const z=11-i*1.95,x=(rnd()-.5)*4.6;
  addFallbackRock(x,z,1.55+rnd()*1.25,i%3?mats.stone:mats.stoneW,true);
}

// banks get larger collision boulders
for(let i=0;i<26;i++){
  const x=(rnd()<.5?-1:1)*(18+rnd()*34),z=-35+rnd()*80;
  addFallbackRock(x,z,.55+rnd()*1.25,rnd()<.25?mats.stoneW:mats.stone,true);
}

// vegetation placement slots; external CC0 models will replace fallback visuals
const vegetationSlots=[];
function safeFromPaths(x,z){
  const center=Math.abs(x);
  if(z<84&&z>-86 && center<6.0) return false;
  if(Math.hypot(x-BRIDGE_X,z-BRIDGE_Z)<7) return false;
  if(Math.hypot(x-FORD_X,z-FORD_Z)<7) return false;
  return true;
}
for(let i=0;i<118;i++){
  let x=(rnd()-.5)*112,z=(rnd()-.5)*190;
  if(!safeFromPaths(x,z)){i--;continue}
  vegetationSlots.push({x,z,s:.75+rnd()*1.10,type:rnd()<.70?'tree':'rock'});
}

// fallback objects appear immediately and are replaced after GLB loads
const fallbackSlotObjects=[];
vegetationSlots.forEach(v=>{
  const o=v.type==='tree'?addFallbackTree(v.x,v.z,v.s,true):addFallbackRock(v.x,v.z,.55*v.s,mats.stone,true);
  fallbackSlotObjects.push(o);
});

// grass meadow using instancing
const bladeMat=new THREE.MeshStandardMaterial({color:0x718e55,roughness:1,side:THREE.DoubleSide});
const bladeGeo=new THREE.PlaneGeometry(.12,.68,1,3);
bladeGeo.translate(0,.34,0);
const grassCount=900;
const grass=new THREE.InstancedMesh(bladeGeo,bladeMat,grassCount);
const dummy=new THREE.Object3D();
for(let i=0;i<grassCount;i++){
  let x=(rnd()-.5)*112,z=(rnd()-.5)*185;
  if(Math.abs(x)<4.5&&z<86&&z>-84){i--;continue}
  dummy.position.set(x,terrainH(x,z)+.02,z);
  dummy.rotation.y=rnd()*Math.PI;
  const sc=.55+rnd()*1.25;dummy.scale.set(sc,sc,sc);
  dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
}
grass.instanceMatrix.needsUpdate=true;grass.receiveShadow=true;scene.add(grass);

// soft cloud masses
const clouds=[];
for(let i=0;i<11;i++){
  const g=new THREE.Group();
  const cloudMat=new THREE.MeshStandardMaterial({color:0xf1f0e5,roughness:1,transparent:true,opacity:.72,depthWrite:false});
  for(let k=0;k<5;k++){
    const m=new THREE.Mesh(new THREE.IcosahedronGeometry(3.5+rnd()*2.8,2),cloudMat);
    m.scale.set(1.5,.55,1);m.position.set((k-2)*3.6+rnd()*1.8,rnd()*1.2,rnd()*2);g.add(m);
  }
  g.position.set((rnd()-.5)*150,34+rnd()*20,(rnd()-.5)*185);scene.add(g);clouds.push(g);
}

// -----------------------------------------------------------------------------
// External assets: proper character, deer, trees/rocks
// -----------------------------------------------------------------------------
const loader=new GLTFLoader();
function loadFirst(urls){
  return new Promise((resolve,reject)=>{
    let i=0;
    const tryNext=()=>{ if(i>=urls.length){reject(new Error('all asset URLs failed'));return}
      loader.load(urls[i++],resolve,undefined,tryNext);
    };
    tryNext();
  });
}
function normalizeHeight(obj,targetHeight){
  obj.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(obj), size=b.getSize(new THREE.Vector3());
  const scale=targetHeight/Math.max(.001,size.y);
  obj.scale.multiplyScalar(scale);obj.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(obj);
  obj.position.y-=b2.min.y;
  return scale;
}
function improveMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh)return;
    o.castShadow=true;o.receiveShadow=true;
    if(o.material){
      const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{ if('roughness' in m)m.roughness=Math.max(.68,m.roughness??.8); if('metalness' in m)m.metalness=0; });
    }
  });
}

let criticalDone=0;
const criticalTotal=2;
function progress(msg){
  criticalDone++;
  $('#loadfill').style.width=`${Math.min(100,10+criticalDone/criticalTotal*88)}%`;
  $('#asset-status').textContent=msg;
  if(criticalDone>=criticalTotal){
    $('#loading-copy').textContent='The island is ready.';
    $('#asset-status').textContent='Character, wildlife and landscape systems ready';
    $('#start-btn').disabled=false;
    $('#loadfill').style.width='100%';
  }
}

// Character
const player=new THREE.Group();
player.position.set(0,terrainH(0,86),86);
scene.add(player);
let char=null,charMixer=null,currentAction=null,charClips={},charFallback=false;

const CHARACTER_URLS=[
  'https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/rogue.glb',
  'https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/knight.glb',
  'https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/human.glb',
  'https://cdn.jsdelivr.net/gh/UMRAM-Bilkent/supine-human-model@main/assets/human.glb'
];

loadFirst(CHARACTER_URLS).then(gltf=>{
  char=gltf.scene;
  improveMaterials(char);
  normalizeHeight(char,1.78);
  char.rotation.y=Math.PI;
  player.add(char);
  charMixer=new THREE.AnimationMixer(char);
  gltf.animations.forEach(c=>charClips[c.name.toLowerCase()]=c);
  progress('Explorer loaded · preparing wildlife');
}).catch(()=>{
  // smooth fallback only, never box-limbed
  charFallback=true;
  const g=new THREE.Group(),skin=std(0xe1b18d),cloth=std(0x657e72),dark=std(0x293c42),hair=std(0x594231);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.33,.68,8,16),cloth);torso.position.y=1.12;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,20,16),skin);head.position.y=1.78;g.add(head);
  const haircap=new THREE.Mesh(new THREE.SphereGeometry(.265,18,12,0,Math.PI*2,0,Math.PI*.62),hair);haircap.position.y=1.88;g.add(haircap);
  for(const sx of [-1,1]){
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.60,6,12),dark);leg.position.set(sx*.16,.42,0);g.add(leg);
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.52,6,12),skin);arm.position.set(sx*.40,1.11,0);g.add(arm);
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});char=g;player.add(char);progress('Explorer fallback ready · preparing wildlife');
});

function findClip(...patterns){
  const entries=Object.entries(charClips);
  for(const rx of patterns){const hit=entries.find(([n])=>rx.test(n));if(hit)return hit[1]}
  return entries[0]?.[1];
}
function setAnim(kind,fade=.20){
  if(!charMixer)return;
  const clip=kind==='run'?findClip(/run|sprint|jog/):
             kind==='walk'?findClip(/walk|jog/):
             findClip(/idle|stand|breath/);
  if(!clip)return;
  const next=charMixer.clipAction(clip);
  if(next===currentAction)return;
  next.reset().setEffectiveTimeScale(kind==='run'&&/walk/.test(clip.name.toLowerCase())?1.55:1).fadeIn(fade).play();
  if(currentAction)currentAction.fadeOut(fade);
  currentAction=next;
}

// Deer: first use vsim's proper stylised animal mesh; then Quaternius-hosted candidate path fallback.
let deerTemplate=null,deerAnimations=[],herd=[];
const DEER_URLS=[
  'https://cdn.jsdelivr.net/gh/kunalkushwaha/vsim@main/packages/assets/library/deer.glb',
  'https://cdn.jsdelivr.net/gh/danwahl/animasim@main/assets/generated/glb/deer.glb'
];
loadFirst(DEER_URLS).then(gltf=>{
  deerTemplate=gltf.scene;deerAnimations=gltf.animations;improveMaterials(deerTemplate);
  spawnHerdModel();progress('Wildlife loaded · finishing scene');
}).catch(()=>{
  spawnFallbackHerd();progress('Wildlife fallback ready · finishing scene');
});

function deerClip(...rxs){
  for(const r of rxs){const c=deerAnimations.find(c=>r.test(c.name.toLowerCase()));if(c)return c}
  return deerAnimations[0];
}
function spawnHerdModel(){
  const positions=[[-29,-14],[-32,-18],[-27,-22],[-35,-25],[-24,-27]];
  positions.forEach((p,i)=>{
    const root=new THREE.Group();
    const d=SkeletonUtils.clone(deerTemplate);root.add(d);scene.add(root);
    normalizeHeight(d,1.45+(i%2)*.12);d.rotation.y=Math.PI/2;
    root.position.set(p[0],terrainH(p[0],p[1]),p[1]);root.rotation.y=.45+rnd()*.55;
    const mixer=new THREE.AnimationMixer(d);
    const clip=i%3===0?deerClip(/eat|graze|feed/,/idle/):deerClip(/idle|stand/,/walk/);
    if(clip)mixer.clipAction(clip).play();
    herd.push({root,mixer,state:'idle',speed:0,angle:root.rotation.y,phase:rnd()*Math.PI*2});
  });
}
function spawnFallbackHerd(){
  // Anatomical smooth-shape fallback: torso, haunches, chest, tapered neck/head, slim legs.
  for(let i=0;i<5;i++){
    const root=new THREE.Group();
    const brown=std(i%2?0x8d6543:0x986e49),dark=std(0x49362a),cream=std(0xd0b58d);
    const torso=new THREE.Mesh(new THREE.SphereGeometry(.62,22,16),brown);torso.scale.set(1.45,.72,.58);torso.position.y=1.02;root.add(torso);
    const chest=new THREE.Mesh(new THREE.SphereGeometry(.42,18,14),brown);chest.scale.set(.72,1.06,.72);chest.position.set(.63,1.22,0);root.add(chest);
    const neck=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.62,8,12),brown);neck.position.set(.82,1.66,0);neck.rotation.z=-.38;root.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.20,18,14),brown);head.scale.set(1.35,.72,.78);head.position.set(1.05,2.00,0);root.add(head);
    const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.12,14,10),dark);muzzle.scale.set(1.3,.65,.72);muzzle.position.set(1.24,1.94,0);root.add(muzzle);
    for(const sz of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.075,.28,8),brown);ear.position.set(.98,2.20,sz*.14);ear.rotation.z=-.2;root.add(ear)}
    for(const xx of [-.35,.38])for(const zz of [-.22,.22]){
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.70,6,10),brown);leg.position.set(xx,.43,zz);root.add(leg);
    }
    // modest antlers so silhouette reads as deer, not a generic quadruped
    if(i<3)for(const zz of [-.10,.10]){
      const ant=new THREE.Mesh(new THREE.CylinderGeometry(.015,.024,.43,6),cream);ant.position.set(.99,2.29,zz);ant.rotation.z=-.22;root.add(ant);
      const tine=new THREE.Mesh(new THREE.CylinderGeometry(.010,.016,.19,6),cream);tine.position.set(1.06,2.40,zz);tine.rotation.z=.62;root.add(tine);
    }
    root.traverse(o=>{if(o.isMesh)o.castShadow=true});
    const x=-28-i*2.1,z=-14-i*2.8;root.position.set(x,terrainH(x,z),z);root.scale.setScalar(.92+rnd()*.08);
    scene.add(root);herd.push({root,mixer:null,state:'idle',speed:0,angle:.5,phase:rnd()*Math.PI*2});
  }
}

// Replace generic fallback scenery with CC0 Kenney GLBs when network permits.
const ENV_URLS={
  oak:'https://cdn.jsdelivr.net/gh/syuhei176/ai-game-assets@v1/models/environment/tree_oak.glb',
  pine:'https://cdn.jsdelivr.net/gh/syuhei176/ai-game-assets@v1/models/environment/tree_pine.glb',
  rockL:'https://cdn.jsdelivr.net/gh/syuhei176/ai-game-assets@v1/models/environment/rock_large.glb',
  rockM:'https://cdn.jsdelivr.net/gh/syuhei176/ai-game-assets@v1/models/environment/rock_medium.glb'
};
Promise.allSettled(Object.entries(ENV_URLS).map(([k,u])=>new Promise((res,rej)=>loader.load(u,g=>res([k,g.scene]),undefined,rej))))
.then(results=>{
  const assets=Object.fromEntries(results.filter(r=>r.status==='fulfilled').map(r=>r.value));
  if(!Object.keys(assets).length)return;
  vegetationSlots.forEach((v,i)=>{
    const key=v.type==='tree'?(rnd()<.72?'oak':'pine'):(rnd()<.55?'rockM':'rockL');
    const src=assets[key]; if(!src)return;
    const obj=src.clone(true); improveMaterials(obj);
    normalizeHeight(obj,v.type==='tree'?4.7*v.s:1.35*v.s);
    obj.position.set(v.x,terrainH(v.x,v.z),v.z);obj.rotation.y=rnd()*Math.PI*2;scene.add(obj);
    const fb=fallbackSlotObjects[i]; if(fb)fb.visible=false;
  });
});

// -----------------------------------------------------------------------------
// Physics-lite character controller: collision, slope, stream gating
// -----------------------------------------------------------------------------
const PLAYER_RADIUS=.34;
function insideCircle(x,z,c,pad=PLAYER_RADIUS){const dx=x-c.x,dz=z-c.z;return dx*dx+dz*dz<(c.r+pad)*(c.r+pad)}

function routeWaterAllowed(x,z){
  const dz=Math.abs(z-streamZ(x));
  if(dz>4.0)return true; // not in river
  if(!state.route)return false;
  if(state.route==='bridge')return Math.abs(x-BRIDGE_X)<BRIDGE_W*.70;
  if(state.route==='ford')return Math.abs(x-FORD_X)<3.1;
  return false;
}
function routeBranchAllowed(x,z){
  if(z<12&&z>-47){
    if(state.route==='bridge'&&x>1.2)return false;
    if(state.route==='ford'&&x<-1.2)return false;
  }
  return true;
}
function slopeAllowed(x0,z0,x1,z1){
  const dy=groundY(x1,z1)-groundY(x0,z0),dist=Math.hypot(x1-x0,z1-z0)||.001;
  return Math.abs(Math.atan2(dy,dist))<THREE.MathUtils.degToRad(38);
}
function canOccupy(x,z){
  if(x<-59||x>59||z<-90||z>91)return false;
  if(!routeBranchAllowed(x,z)||!routeWaterAllowed(x,z))return false;
  for(const c of colliders)if(insideCircle(x,z,c))return false;
  return true;
}

// -----------------------------------------------------------------------------
// Game state / controls
// -----------------------------------------------------------------------------
const state={started:false,locked:true,route:null,streamChoice:false,phase:'south',complete:false,cinematic:false};
const keys={};
addEventListener('keydown',e=>keys[e.code]=true);
addEventListener('keyup',e=>keys[e.code]=false);

let yaw=0,pitch=-.12,drag=false,mx=0,my=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){drag=true;mx=e.clientX;my=e.clientY}});
addEventListener('pointerup',()=>drag=false);
addEventListener('pointermove',e=>{
  if(drag&&!state.locked){
    yaw-=(e.clientX-mx)*.0042; pitch-=(e.clientY-my)*.0032;
    pitch=clamp(pitch,-.43,.20);mx=e.clientX;my=e.clientY;
  }
});

// mobile controls
let joy={x:0,y:0},runTouch=false,jid=null;
const joyEl=$('#joystick'),stick=$('#stick');
function jmove(e){
  const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy,max=36,d=Math.hypot(dx,dy)||1;
  if(d>max){dx=dx/d*max;dy=dy/d*max}
  joy={x:dx/max,y:dy/max};stick.style.transform=`translate(${dx}px,${dy}px)`;
}
joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jmove(e)});
joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jmove(e)});
joyEl.addEventListener('pointerup',e=>{if(e.pointerId===jid){jid=null;joy={x:0,y:0};stick.style.transform='translate(0,0)'}});
let lookId=null,lx=0,ly=0;
$('#lookpad').addEventListener('pointerdown',e=>{lookId=e.pointerId;lx=e.clientX;ly=e.clientY;$('#lookpad').setPointerCapture(lookId)});
$('#lookpad').addEventListener('pointermove',e=>{if(e.pointerId===lookId&&!state.locked){yaw-=(e.clientX-lx)*.005;pitch-=(e.clientY-ly)*.004;pitch=clamp(pitch,-.43,.20);lx=e.clientX;ly=e.clientY}});
$('#lookpad').addEventListener('pointerup',()=>lookId=null);
$('#runbtn').addEventListener('pointerdown',()=>runTouch=true);
$('#runbtn').addEventListener('pointerup',()=>runTouch=false);
$('#runbtn').addEventListener('pointercancel',()=>runTouch=false);

let velocity=new THREE.Vector3(),targetVel=new THREE.Vector3(),speedNow=0;

function updateMovement(dt){
  if(!state.started||state.locked||state.cinematic||state.complete)return;
  let f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
  let s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
  let mag=Math.hypot(f,s);if(mag>1){f/=mag;s/=mag;mag=1}
  const running=keys.ShiftLeft||keys.ShiftRight||runTouch,max=running?7.05:4.15;
  const F=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)),R=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));
  targetVel.copy(F).multiplyScalar(f).add(R.multiplyScalar(s));
  if(targetVel.lengthSq()>1)targetVel.normalize();targetVel.multiplyScalar(max);
  const accel=targetVel.lengthSq()>velocity.lengthSq()?1-Math.exp(-dt*8.5):1-Math.exp(-dt*11.5);
  velocity.lerp(targetVel,accel);
  if(mag<.025)velocity.multiplyScalar(Math.exp(-dt*8));

  const nx=player.position.x+velocity.x*dt,nz=player.position.z+velocity.z*dt;
  if(canOccupy(nx,nz)&&slopeAllowed(player.position.x,player.position.z,nx,nz)){
    player.position.x=nx;player.position.z=nz;
  }else{
    // slide along obstacles instead of a hard stop
    const tryX=player.position.x+velocity.x*dt;
    const tryZ=player.position.z+velocity.z*dt;
    let moved=false;
    if(canOccupy(tryX,player.position.z)&&slopeAllowed(player.position.x,player.position.z,tryX,player.position.z)){player.position.x=tryX;moved=true}
    if(canOccupy(player.position.x,tryZ)&&slopeAllowed(player.position.x,player.position.z,player.position.x,tryZ)){player.position.z=tryZ;moved=true}
    if(!moved)velocity.multiplyScalar(.16);
  }

  player.position.y=groundY(player.position.x,player.position.z);
  speedNow=velocity.length();
  if(speedNow>.12){
    const desired=Math.atan2(velocity.x,velocity.z)+Math.PI;
    const delta=Math.atan2(Math.sin(desired-player.rotation.y),Math.cos(desired-player.rotation.y));
    player.rotation.y+=delta*(1-Math.exp(-dt*10.5));
  }
  setAnim(speedNow>5.15?'run':speedNow>.32?'walk':'idle');

  // game choice trigger is geography, not research UI timing
  if(!state.streamChoice&&player.position.z<23){
    state.streamChoice=true;state.locked=true;velocity.set(0,0,0);setAnim('idle');
    $('#choice').classList.remove('hidden');
  }
  if(state.route==='bridge'&&state.phase==='west'&&player.position.z<-11){state.phase='west2';$('#region').textContent='ANIMAL TRAIL'}
  if(state.route==='ford'&&state.phase==='east'&&player.position.z<-11){state.phase='east2';$('#region').textContent='BIRCH HOLLOW'}
  if(state.route&&!state.complete&&player.position.z<-76){
    state.complete=true;state.locked=true;velocity.set(0,0,0);setAnim('idle');
    setTimeout(()=>$('#complete').classList.remove('hidden'),500);
  }
}

// cinematic traversal follows exact bridge / ford ground
function cinematicMove(points,duration,route){
  state.cinematic=true;state.locked=true;document.body.classList.add('cinematic');velocity.set(0,0,0);setAnim('walk');
  const ps=points.map(([x,z])=>new THREE.Vector3(x,groundY(x,z),z));
  const start=performance.now();
  const step=now=>{
    const u=Math.min(1,(now-start)/(duration*1000)),q=u*(ps.length-1),i=Math.min(ps.length-2,Math.floor(q)),t=q-i;
    player.position.lerpVectors(ps[i],ps[i+1],t);
    player.position.y=groundY(player.position.x,player.position.z);
    const d=ps[i+1].clone().sub(ps[i]);
    if(d.lengthSq())player.rotation.y=Math.atan2(d.x,d.z)+Math.PI;
    if(route==='ford')spawnSplash(player.position.x,terrainH(player.position.x,player.position.z)+.20,player.position.z);
    if(u<1)requestAnimationFrame(step);
    else{
      document.body.classList.remove('cinematic');state.cinematic=false;state.locked=false;
      state.phase=route==='bridge'?'west':'east';setAnim('idle');
    }
  };
  requestAnimationFrame(step);
}
function chooseRoute(route){
  state.route=route;$('#choice').classList.add('hidden');
  $('#region').textContent=route==='bridge'?'WESTERN BANK':'EASTERN HOLLOW';
  if(route==='bridge'){
    cinematicMove([[0,21],[-4,18],[-8,14],[BRIDGE_X,BRIDGE_Z+5.2],[BRIDGE_X,BRIDGE_Z],[BRIDGE_X,BRIDGE_Z-5.2],[-13,1]],5.8,'bridge');
  }else{
    cinematicMove([[0,21],[4,18],[8,14],[FORD_X,FORD_Z+4.7],[FORD_X,FORD_Z],[FORD_X,FORD_Z-4.7],[13,1]],6.2,'ford');
  }
}
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>chooseRoute(b.dataset.route)));

// water splashes
const splashes=[];
function spawnSplash(x,y,z){
  if(Math.random()>.18)return;
  const m=new THREE.Mesh(new THREE.RingGeometry(.04,.13,14),new THREE.MeshBasicMaterial({color:0xd8f4f4,transparent:true,opacity:.7,side:THREE.DoubleSide}));
  m.rotation.x=-Math.PI/2;m.position.set(x+(Math.random()-.5)*.5,y,z+(Math.random()-.5)*.5);m.userData.life=1;scene.add(m);splashes.push(m);
}

// wildlife
function updateHerd(dt){
  for(const h of herd){
    h.mixer?.update(dt);
    const dist=h.root.position.distanceTo(player.position);
    if(dist<13&&h.state!=='flee'){
      h.state='flee';h.speed=5.3+rnd()*1.0;
      const away=h.root.position.clone().sub(player.position);h.angle=Math.atan2(away.x,away.z);
      if(h.mixer){h.mixer.stopAllAction();const c=deerClip(/gallop|run|sprint/,/walk/);if(c)h.mixer.clipAction(c).play()}
    }
    if(h.state==='flee'){
      h.root.position.x+=Math.sin(h.angle)*h.speed*dt;
      h.root.position.z+=Math.cos(h.angle)*h.speed*dt;
      h.root.position.y=terrainH(h.root.position.x,h.root.position.z);
      h.root.rotation.y=h.angle;
      h.speed*=Math.exp(-dt*.18);
      if(h.speed<1.1&&dist>32)h.state='idle';
    }else if(!h.mixer){
      // believable fallback idle: tiny head/body rhythm, no sliding
      h.root.rotation.y+=Math.sin(performance.now()*.00045+h.phase)*dt*.018;
    }
  }
}

// camera with terrain collision and shoulder offset
const camRay=new THREE.Raycaster(),camLook=new THREE.Vector3();
function updateCamera(dt){
  const target=player.position.clone().add(new THREE.Vector3(0,1.42,0));
  const dist=5.55;
  const baseOffset=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch)*dist,1.85+Math.sin(-pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist);
  // subtle shoulder composition, not exact centred chase camera
  const shoulder=new THREE.Vector3(Math.cos(yaw)*.34,0,Math.sin(yaw)*.34);
  let desired=target.clone().add(baseOffset).add(shoulder);

  // keep camera above terrain
  const minY=terrainH(desired.x,desired.z)+.55;
  if(desired.y<minY)desired.y=minY;

  camera.position.lerp(desired,1-Math.exp(-dt*9.5));
  camLook.lerp(target,1-Math.exp(-dt*12));
  camera.lookAt(camLook);
}

// procedural ambience
let audioCtx=null,windGain=null,waterGain=null;
function startAudio(){
  try{
    audioCtx=new (AudioContext||webkitAudioContext)();
    const seconds=2,buf=audioCtx.createBuffer(1,audioCtx.sampleRate*seconds,audioCtx.sampleRate),data=buf.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const noise=(freq,q,gain)=>{
      const src=audioCtx.createBufferSource();src.buffer=buf;src.loop=true;
      const f=audioCtx.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;
      const g=audioCtx.createGain();g.gain.value=gain;src.connect(f).connect(g).connect(audioCtx.destination);src.start();return g;
    };
    windGain=noise(430,.45,.019);waterGain=noise(1550,.75,.006);birdLoop();
  }catch(e){}
}
function birdLoop(){
  if(!audioCtx)return;
  setTimeout(()=>{
    if(!audioCtx)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';
    o.frequency.setValueAtTime(1450+Math.random()*400,audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(2200+Math.random()*500,audioCtx.currentTime+.10);
    g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(.011,audioCtx.currentTime+.018);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.17);
    o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.19);birdLoop();
  },2200+Math.random()*5200);
}
function updateAudio(){
  if(!audioCtx)return;
  const d=Math.abs(player.position.z-streamZ(player.position.x));
  waterGain.gain.setTargetAtTime(.005+.033*Math.max(0,1-d/22),audioCtx.currentTime,.18);
  windGain.gain.setTargetAtTime(.017+.006*Math.max(0,player.position.y/8),audioCtx.currentTime,.22);
}

// start button
$('#start-btn').addEventListener('click',()=>{
  $('#loading').classList.add('hidden');$('#hud').classList.remove('hidden');
  if(coarse)$('#mobile').classList.remove('hidden');
  state.started=true;state.locked=false;setAnim('idle');startAudio();
});

// -----------------------------------------------------------------------------
// Main loop
// -----------------------------------------------------------------------------
const clock=new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt=Math.min(clock.getDelta(),.033);
  streamUniforms.uTime.value+=dt;
  clouds.forEach((c,i)=>{c.position.x+=dt*(.42+i*.015);if(c.position.x>95)c.position.x=-95});
  if(charMixer)charMixer.update(dt);
  updateMovement(dt);updateHerd(dt);updateCamera(dt);updateAudio();
  for(let i=splashes.length-1;i>=0;i--){
    const s=splashes[i];s.userData.life-=dt*1.7;s.scale.multiplyScalar(1+dt*2.5);s.material.opacity=Math.max(0,s.userData.life*.7);
    if(s.userData.life<=0){scene.remove(s);splashes.splice(i,1)}
  }
  renderer.render(scene,camera);
}
loop();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
