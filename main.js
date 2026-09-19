const boot = document.getElementById('boot');
const enterBtn = document.getElementById('enter');
const bootStatus = document.getElementById('boot-status');
const loadfill = document.getElementById('loadfill');
const bootError = document.getElementById('boot-error');
const hud = document.getElementById('hud');
const help = document.getElementById('help');
const routeStatus = document.getElementById('route-status');
const finish = document.getElementById('finish');
const replayBtn = document.getElementById('replay');
const saveGuideBtn = document.getElementById('save-guide');
const downloadSessionBtn = document.getElementById('download-session');
const guideText = document.getElementById('guide-text');
const saveNote = document.getElementById('save-note');
const navPanel = document.getElementById('nav-panel');
const navCopy = document.getElementById('nav-copy');
const navState = document.getElementById('nav-state');

window.addEventListener('error', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.error || event.message);
});
window.addEventListener('unhandledrejection', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.reason);
});

function showBootError(err) {
  const message = err?.stack || err?.message || String(err);
  bootStatus.textContent = 'E3 failed to initialize.';
  bootError.textContent = message;
  bootError.classList.remove('hidden');
  enterBtn.disabled = true;
}

const STUDY = {
  items: {
    crossing: {form:'menic', meaning:'narrow, one-person-wide'},
    shelter: {form:'silar', meaning:'sheltered or enclosed'},
    ascent: {form:'valen', meaning:'steeply rising'}
  }
};

const session = {
  build: 'MERA_E3_STUDY_VALLEY',
  startedAt: null,
  finishedAt: null,
  routes: {river:null, woodland:null, ascent:null},
  exposures: {menic:0, silar:0, valen:0},
  events: [],
  guide: ''
};
const fired = new Set();
let navTimer = null;
let gameStarted = false;

function nowMs(){ return performance.now(); }
function logEvent(type, data={}) {
  session.events.push({
    type,
    t: session.startedAt ? Math.round((Date.now() - new Date(session.startedAt).getTime())/10)/100 : 0,
    ...data
  });
}
function showNav(id, text, {target=null, exposure=null, duration=6800}={}) {
  if (fired.has(id)) return;
  fired.add(id);
  if (target && session.exposures[target] !== undefined) session.exposures[target]++;
  logEvent('nav_message', {id, target, exposure, text});
  navCopy.textContent = text;
  navState.textContent = 'ONLINE';
  navPanel.classList.remove('hidden');
  clearTimeout(navTimer);
  navTimer = setTimeout(() => navPanel.classList.add('hidden'), duration);
}
function setRoute(kind, value) {
  if (session.routes[kind]) return;
  session.routes[kind] = value;
  logEvent('route_choice', {kind, value});
  const id = kind === 'river' ? 'river-choice' : kind === 'woodland' ? 'wood-choice' : 'ascent-choice';
  const el = document.getElementById(id);
  if (el) el.textContent = value.toUpperCase();
}
function updateElapsed() {
  if (!session.startedAt) return;
  const ms = Date.now() - new Date(session.startedAt).getTime();
  const sec = Math.max(0, Math.floor(ms/1000));
  const m = String(Math.floor(sec/60)).padStart(2,'0');
  const s = String(sec%60).padStart(2,'0');
  document.getElementById('elapsed').textContent = `${m}:${s}`;
}
function finishStudy() {
  if (session.finishedAt) return;
  session.finishedAt = new Date().toISOString();
  logEvent('outpost_reached', {routes:{...session.routes}});
  navState.textContent = 'OFFLINE';
  navPanel.classList.add('hidden');
  hud.classList.add('hidden');
  help.classList.add('hidden');
  routeStatus.classList.add('hidden');
  finish.classList.remove('hidden');
}
function downloadSession() {
  const blob = new Blob([JSON.stringify(session, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mera_e3_session_${Date.now()}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),900);
}

saveGuideBtn.addEventListener('click', () => {
  const text = guideText.value.trim();
  if (!text) { saveNote.textContent = 'Please write a short route guide first.'; return; }
  session.guide = text;
  logEvent('guide_saved', {length:text.length});
  saveNote.textContent = 'Guide saved locally in this session. You can download the pilot JSON.';
  downloadSessionBtn.classList.remove('hidden');
});
downloadSessionBtn.addEventListener('click', downloadSession);
replayBtn.addEventListener('click', () => location.reload());

async function bootApp() {
  try {
    loadfill.style.width = '10%';
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const THREE = await import('three');
    const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
    loadfill.style.width = '26%';

    const fiber = await import('@react-three/fiber');
    const drei = await import('@react-three/drei');
    const rapier = await import('@react-three/rapier');
    loadfill.style.width = '45%';

    const { Ecctrl } = await import('ecctrl');
    const animPkg = await import('ecctrl/animation');
    const cameraPkg = await import('ecctrl/camera');
    loadfill.style.width = '60%';

    const { Canvas, useFrame, useThree } = fiber;
    const { useGLTF, useAnimations, useTexture } = drei;
    const { Physics, RigidBody, CuboidCollider, BallCollider } = rapier;
    const { EcctrlAnimationStateController, useEcctrlAnimationStore } = animPkg;
    const { EcctrlCameraControls } = cameraPkg;
    const h = React.createElement;
    const { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } = React;

    // Intentionally unchanged from the proven E1/E2 chassis.
    const TEST_CHARACTER_URL = 'https://threejs.org/examples/models/gltf/Soldier.glb';

    const ASSET = {
      forestDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_diff_1k.jpg',
      forestNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/forrest_ground_01/forrest_ground_01_nor_gl_1k.jpg',
      pathDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_diff_1k.jpg',
      pathNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_path_2/grass_path_2_nor_gl_1k.jpg',
      rockDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_diff_1k.jpg',
      rockNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/mossy_rock/mossy_rock_nor_gl_1k.jpg',
      woodDiff:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_diff_1k.jpg',
      woodNorm:'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/weathered_planks/weathered_planks_nor_gl_1k.jpg'
    };

    // Three physically different decisions. Paths are visual guidance, not movement rails.
    const PATHS = {
      south:[[0,218],[2,202],[-4,184],[2,164],[0,145]],
      bridge:[[0,145],[-12,140],[-23,134],[-31,127],[-31,119],[-25,108],[-11,98],[0,90]],
      ford:[[0,145],[13,140],[24,134],[31,128],[31,119],[25,109],[13,99],[0,90]],
      central:[[0,90],[5,74],[-3,58],[0,40]],
      pine:[[0,40],[-14,34],[-27,23],[-34,8],[-32,-10],[-24,-26],[-12,-41],[0,-52]],
      birch:[[0,40],[15,34],[29,23],[36,7],[33,-10],[25,-27],[12,-42],[0,-52]],
      upper:[[0,-52],[4,-68],[-2,-84],[0,-91]],
      switchback:[[0,-91],[-15,-98],[-29,-109],[-35,-123],[-34,-139],[-25,-153],[-11,-169],[8,-181]],
      ridge:[[0,-91],[15,-98],[26,-110],[32,-125],[31,-141],[25,-156],[17,-170],[8,-181]],
      final:[[8,-181],[10,-196],[10,-216]]
    };
    const OUTPOST = {x:10,z:-218};

    function rand(seed=1234567){
      let s=seed>>>0;
      return ()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; };
    }
    const rng=rand(553911);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};

    function baseHeight(x,z){
      let y=.25*Math.sin(x*.12)*Math.cos(z*.042)+.12*Math.sin((x+z)*.18);
      // Start shelf and broad valley undulation.
      y += 1.2*Math.exp(-((x)*(x))/400-((z-207)*(z-207))/430);
      y += .7*Math.exp(-((x+28)*(x+28))/700-((z-6)*(z-6))/900);
      y += .65*Math.exp(-((x-30)*(x-30))/750-((z-5)*(z-5))/900);
      // Final outpost hill.
      y += 5.4*Math.exp(-((x-OUTPOST.x)*(x-OUTPOST.x))/260-((z-OUTPOST.z)*(z-OUTPOST.z))/360);
      // Western waterfall cliff and eastern rocky ridge.
      y += 8.6*Math.exp(-((x+58)*(x+58))/210-((z+28)*(z+28))/520);
      y += 3.2*Math.exp(-((x-49)*(x-49))/290-((z+125)*(z+125))/800);
      return y;
    }
    function riverCenterZ(x){ return 124 + .035*x + 1.15*Math.sin(x*.075); }
    function waterSurfaceAt(x){ return baseHeight(x,riverCenterZ(x))-.45; }
    function edgeRise(x,z){
      let rise=0;
      const ax=Math.abs(x);
      if(ax>67){ const t=(ax-67)/10; rise += t*t*18; }
      if(z>229){ const t=(z-229)/10; rise += t*t*16; }
      if(z<-229){ const t=(-z-229)/9; rise += t*t*19; }
      return rise;
    }
    function terrainHeight(x,z){
      let y=baseHeight(x,z)+edgeRise(x,z);
      const rz=riverCenterZ(x), d=Math.abs(z-rz);
      if(d<5.2){
        const q=1-smooth01(d/5.2);
        let depth=2.2*q;
        const ford=Math.exp(-((x-31)*(x-31))/30-((z-123)*(z-123))/55);
        depth*=1-.72*ford;
        y-=depth;
      }
      // Birch hollow is lower/sheltered; ridge path subtly higher.
      y -= .65*Math.exp(-((x-29)*(x-29))/210-((z-2)*(z-2))/650);
      y += .75*Math.exp(-((x-29)*(x-29))/230-((z+128)*(z+128))/800);
      return y;
    }

    function distancePolyline(x,z,pts){
      let best=1e9;
      for(let i=0;i<pts.length-1;i++){
        const [x1,z1]=pts[i],[x2,z2]=pts[i+1];
        const vx=x2-x1,vz=z2-z1,wx=x-x1,wz=z-z1;
        const t=clamp((wx*vx+wz*vz)/(vx*vx+vz*vz),0,1);
        const px=x1+vx*t,pz=z1+vz*t;
        best=Math.min(best,Math.hypot(x-px,z-pz));
      }
      return best;
    }
    function nearTrail(x,z,d=3.2){ return Object.values(PATHS).some(p=>distancePolyline(x,z,p)<d); }

    function configureTexture(tex,repeat,srgb=false){
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(repeat,repeat);
      tex.anisotropy=4;
      if(srgb) tex.colorSpace=THREE.SRGBColorSpace;
      return tex;
    }

    function makeFoliageTexture(type='grass'){
      const c=document.createElement('canvas');c.width=128;c.height=256;
      const ctx=c.getContext('2d');ctx.clearRect(0,0,128,256);
      const n=type==='reed'?22:46;
      for(let i=0;i<n;i++){
        const x=10+rng()*108,base=250;
        const height=(type==='reed'?125:72)+rng()*(type==='reed'?105:115);
        const sway=(rng()-.5)*(type==='reed'?12:28);
        ctx.strokeStyle= type==='reed' ? `rgba(${88+Math.floor(rng()*35)},${116+Math.floor(rng()*45)},${54+Math.floor(rng()*25)},${.72+rng()*.25})` : `rgba(${78+Math.floor(rng()*48)},${118+Math.floor(rng()*58)},${52+Math.floor(rng()*34)},${.72+rng()*.25})`;
        ctx.lineWidth=(type==='reed'?2.2:1.2)+rng()*2.0;
        ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+sway*.35,base-height*.55,x+sway,base-height);ctx.stroke();
        if(type==='grass'&&rng()<.16){ctx.fillStyle='rgba(236,230,193,.8)';ctx.beginPath();ctx.arc(x+sway,base-height,1.3+rng()*1.6,0,Math.PI*2);ctx.fill();}
      }
      const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
    }

    function useLandscapeMaterials(){
      const textures=useTexture([
        ASSET.forestDiff,ASSET.forestNorm,ASSET.pathDiff,ASSET.pathNorm,
        ASSET.rockDiff,ASSET.rockNorm,ASSET.woodDiff,ASSET.woodNorm
      ]);
      const foliageTextures=useMemo(()=>({grass:makeFoliageTexture('grass'),reed:makeFoliageTexture('reed')}),[]);
      useMemo(()=>{
        configureTexture(textures[0],18,true); configureTexture(textures[1],18,false);
        configureTexture(textures[2],3.1,true); configureTexture(textures[3],3.1,false);
        configureTexture(textures[4],2.0,true); configureTexture(textures[5],2.0,false);
        configureTexture(textures[6],1.4,true); configureTexture(textures[7],1.4,false);
      },textures);
      return useMemo(()=>({
        forest:new THREE.MeshStandardMaterial({map:textures[0],normalMap:textures[1],roughness:.98,color:0xd9e0d1,vertexColors:true}),
        path:new THREE.MeshStandardMaterial({map:textures[2],normalMap:textures[3],roughness:.95,color:0xeadfcf}),
        rock:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:.97,color:0xbebdb5}),
        wood:new THREE.MeshStandardMaterial({map:textures[6],normalMap:textures[7],roughness:.92,color:0xc09d76}),
        bark:new THREE.MeshStandardMaterial({color:0x5a4632,roughness:1}),
        birchBark:new THREE.MeshStandardMaterial({color:0xc6c0ad,roughness:.95}),
        pine:new THREE.MeshStandardMaterial({color:0x315436,roughness:1}),
        broad:new THREE.MeshStandardMaterial({color:0x4c6c3d,roughness:1}),
        birchLeaf:new THREE.MeshStandardMaterial({color:0x668555,roughness:1}),
        grass:new THREE.MeshStandardMaterial({map:foliageTextures.grass,transparent:true,alphaTest:.28,side:THREE.DoubleSide,roughness:1,color:0xdce8c8}),
        reed:new THREE.MeshStandardMaterial({map:foliageTextures.reed,transparent:true,alphaTest:.28,side:THREE.DoubleSide,roughness:1,color:0xd4dfb9}),
        stone:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:1,color:0x9b9990})
      }),[textures,foliageTextures]);
    }

    function makeTerrainGeometry(){
      const g=new THREE.PlaneGeometry(160,500,94,220);g.rotateX(-Math.PI/2);
      const p=g.attributes.position,cols=[];
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);p.setY(i,y);
        const c=new THREE.Color(0x71845c);
        if(y>2.8)c.lerp(new THREE.Color(0x777a67),.25);
        if(y>7)c.lerp(new THREE.Color(0x89877f),.52);
        c.offsetHSL(Math.sin(x*.17+z*.07)*.006,0,Math.sin(i*1.77)*.008);cols.push(c.r,c.g,c.b);
      }
      g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.computeVertexNormals();return g;
    }
    function makeStripGeometry(points2,width,yOffset=.045){
      const pts=points2.map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+yOffset,z));
      const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.35),segs=Math.max(72,points2.length*20),pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
        const w=width*(1+.04*Math.sin(i*.9)+.024*Math.sin(i*2.13));
        const l=p.clone().addScaledVector(side,w*.5),r=p.clone().addScaledVector(side,-w*.5);
        l.y=terrainHeight(l.x,l.z)+yOffset;r.y=terrainHeight(r.x,r.z)+yOffset;
        pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,t*12,1,t*12);if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    function makeRiverGeometry(){
      const segs=110,width=8.2,pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,x=-75+t*150,z=riverCenterZ(x),y=waterSurfaceAt(x),dz=.035+.086*Math.cos(x*.075),side=new THREE.Vector3(-dz,0,1).normalize();
        for(const s of [-1,1]){const q=new THREE.Vector3(x,y,z).addScaledVector(side,s*width*.5);pos.push(q.x,q.y,q.z);uv.push(t,(s+1)/2);}if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }
    function makeRockGeometry(seed=1){
      const g=new THREE.DodecahedronGeometry(1,1),p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.90+.13*Math.sin((i+seed)*2.17)+.055*Math.cos(x*3.1+z*5.4+seed);p.setXYZ(i,x*n*(1+.10*Math.sin(seed)),y*n*(.62+.08*Math.cos(seed*1.4)),z*n*(.90+.08*Math.sin(seed*2.1)));}
      g.computeVertexNormals();return g;
    }
    function makePineGeometries(){
      const trunk=new THREE.CylinderGeometry(.19,.31,4.5,7);trunk.translate(0,2.25,0);const foliage=[];
      [[2.1,1.65,2.5],[3.05,1.42,2.35],[3.95,1.15,2.0],[4.75,.78,1.55]].forEach(([y,r,hh],i)=>{const c=new THREE.ConeGeometry(r,hh,8);c.translate(0,y,0);c.rotateY(i*.31);foliage.push(c);});
      return {trunk,foliage:mergeGeometries(foliage,false)};
    }
    function makeBroadGeometries(){
      const trunk=new THREE.CylinderGeometry(.24,.38,4.0,8);trunk.translate(0,2.0,0);const leaves=[];
      [[0,4.1,0,1.35],[.8,4.5,.2,1.05],[-.85,4.45,-.15,1.0],[.1,5.25,-.55,.92]].forEach(([x,y,z,s])=>{const q=new THREE.IcosahedronGeometry(s,1);q.scale(1,.78,1);q.translate(x,y,z);leaves.push(q);});
      return {trunk,foliage:mergeGeometries(leaves,false)};
    }
    function makeBirchGeometries(){
      const trunk=new THREE.CylinderGeometry(.15,.23,4.7,8);trunk.translate(0,2.35,0);const leaves=[];
      [[0,4.5,0,1.2],[.65,4.9,.2,.88],[-.7,4.85,-.1,.9],[.1,5.6,-.35,.78]].forEach(([x,y,z,s])=>{const q=new THREE.IcosahedronGeometry(s,1);q.scale(.9,.75,.9);q.translate(x,y,z);leaves.push(q);});
      return {trunk,foliage:mergeGeometries(leaves,false)};
    }
    function makeGrassGeometry(type='grass'){
      const h=type==='reed'?1.65:1.05,w=type==='reed'?.52:.72;
      const a=new THREE.PlaneGeometry(w,h);a.translate(0,h*.5,0);const b=a.clone();b.rotateY(Math.PI/2);const c=a.clone();c.rotateY(Math.PI/4);return mergeGeometries([a,b,c],false);
    }

    function generateLandscapeLayout(){
      const trees=[],grass=[],rocks=[],reeds=[];
      // General interior trees; maintain open central sightline to the outpost.
      for(let i=0;i<175;i++){
        let x,z,attempt=0;
        do{x=-66+rng()*132;z=-215+rng()*430;attempt++;}
        while((nearTrail(x,z,4.0)||Math.abs(z-riverCenterZ(x))<6.5||Math.hypot(x,z-215)<8||Math.hypot(x-OUTPOST.x,z-OUTPOST.z)<10||(Math.abs(x)<7&&z<190&&z>-185))&&attempt<30);
        let type='pine';
        if(x>10&&z<45&&z>-50)type=rng()<.68?'birch':'broad';
        else if(rng()<.20)type='broad';
        const s=.85+rng()*.95;
        trees.push({x,z,s,type,rot:rng()*Math.PI*2,collision:s>.98&&Math.abs(x)<62&&z<210&&z>-210});
      }
      // Pine branch denser, birch branch lighter.
      for(let i=0;i<42;i++){const x=-42+rng()*24,z=-34+rng()*72;if(!nearTrail(x,z,2.8))trees.push({x,z,s:.8+rng()*.8,type:'pine',rot:rng()*6.28,collision:true});}
      for(let i=0;i<34;i++){const x=18+rng()*27,z=-34+rng()*72;if(!nearTrail(x,z,2.8))trees.push({x,z,s:.72+rng()*.65,type:'birch',rot:rng()*6.28,collision:true});}
      // Outer tree belt disguises compact map; terrain walls enforce limits.
      for(let i=0;i<86;i++){const side=i%2?-1:1,x=side*(66+rng()*7),z=-220+rng()*440;trees.push({x,z,s:1.0+rng()*.75,type:'pine',rot:rng()*6.28,collision:false});}
      for(let i=0;i<74;i++){const z=i%2?226:-227,x=-65+rng()*130;trees.push({x,z,s:1.0+rng()*.7,type:'pine',rot:rng()*6.28,collision:false});}

      for(let i=0;i<1650;i++){
        const x=-66+rng()*132,z=-215+rng()*430;
        if(Math.abs(z-riverCenterZ(x))<5.6||nearTrail(x,z,1.0))continue;
        grass.push({x,z,s:.55+rng()*1.05,rot:rng()*Math.PI});
      }
      for(let i=0;i<330;i++){
        const x=-70+rng()*140,z=riverCenterZ(x)+(rng()<.5?-1:1)*(3.7+rng()*2.3);
        reeds.push({x,z,s:.65+rng()*.9,rot:rng()*Math.PI});
      }
      for(let i=0;i<185;i++){
        let x=-66+rng()*132,z=-215+rng()*430;
        if(nearTrail(x,z,1.8)&&rng()<.78){i--;continue;}
        const s=.36+rng()*1.45;
        rocks.push({x,z,s,sy:.55+rng()*.35,rot:rng()*Math.PI*2,variant:i%5,collision:s>.95&&Math.abs(x)<64&&z<210&&z>-210});
      }
      // Rock vocabulary around banks and final ridge.
      for(let i=0;i<72;i++){const x=-66+rng()*132,z=riverCenterZ(x)+(rng()<.5?-1:1)*(3.5+rng()*1.8),s=.4+rng()*.9;rocks.push({x,z,s,sy:.55+rng()*.25,rot:rng()*6.28,variant:i%5,collision:s>.8});}
      for(let i=0;i<34;i++){const x=18+rng()*30,z=-105-rng()*70,s=.55+rng()*1.35;if(!nearTrail(x,z,2.2))rocks.push({x,z,s,sy:.5+rng()*.28,rot:rng()*6.28,variant:i%5,collision:s>.9});}
      return {trees,grass,rocks,reeds};
    }
    const layout=generateLandscapeLayout();

    function Terrain({mat}){
      const geometry=useMemo(makeTerrainGeometry,[]);
      return h(RigidBody,{type:'fixed',colliders:'trimesh',friction:1,restitution:0},h('mesh',{geometry,material:mat,receiveShadow:true}));
    }
    function Paths({mat}){
      const geos=useMemo(()=>Object.entries(PATHS).map(([k,p])=>makeStripGeometry(p,k==='south'||k==='central'||k==='upper'||k==='final'?3.25:2.8)),[]);
      return h(React.Fragment,null,...geos.map((geometry,i)=>h('mesh',{key:i,geometry,material:mat,receiveShadow:true})));
    }
    function River(){
      const geometry=useMemo(makeRiverGeometry,[]),mat=useMemo(()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},deep:{value:new THREE.Color(0x2d7182)},shallow:{value:new THREE.Color(0x79c2c0)},sun:{value:new THREE.Color(0xece8c9)}},vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.45+time*2.)*.035+sin(p.z*1.7-time*1.5)*.022;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float time;uniform vec3 deep,shallow,sun;varying vec2 vUv;void main(){float f=.5+.5*sin(vUv.x*88.+time*3.+sin(vUv.y*11.)*2.);float edge=smoothstep(0.,.2,vUv.y)*smoothstep(1.,.8,vUv.y);vec3 c=mix(shallow,deep,.40+vUv.y*.18);c+=sun*f*.07;gl_FragColor=vec4(c,.72+.08*f+.05*edge);}`}),[]);
      useFrame((_,dt)=>mat.uniforms.time.value+=dt);
      return h('mesh',{geometry,material:mat,receiveShadow:true});
    }
    function RiverBarriers(){
      // Deep water is treated as non-traversable except at the bridge and ford openings.
      const y=waterSurfaceAt(0)+.65;
      return h(RigidBody,{type:'fixed',colliders:false},
        h(CuboidCollider,{args:[19,1.3,4.1],position:[-55,y,riverCenterZ(-55)]}),
        h(CuboidCollider,{args:[10.5,1.3,4.1],position:[-10.5,y,riverCenterZ(-10.5)]}),
        h(CuboidCollider,{args:[10,1.3,4.1],position:[11,y,riverCenterZ(11)]}),
        h(CuboidCollider,{args:[18,1.3,4.1],position:[56,y,riverCenterZ(56)]})
      );
    }

    function InstancedBatch({geometry,material,items,kind,castShadow=false}){
      const ref=useRef();
      useLayoutEffect(()=>{
        if(!ref.current)return;const dummy=new THREE.Object3D();
        items.forEach((it,i)=>{
          dummy.position.set(it.x,terrainHeight(it.x,it.z)+(kind==='rock'?-it.s*.18:0),it.z);dummy.rotation.set(0,it.rot||0,0);
          if(kind==='tree')dummy.scale.setScalar(it.s);else if(kind==='grass')dummy.scale.set(it.s,it.s,it.s);else if(kind==='reed')dummy.scale.set(.85*it.s,it.s,.85*it.s);else dummy.scale.set(it.s,it.s*it.sy,it.s*(.9+.08*(i%3)));
          dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);
        });ref.current.instanceMatrix.needsUpdate=true;
      },[items,kind]);
      return h('instancedMesh',{ref,args:[geometry,material,items.length],castShadow,receiveShadow:kind==='rock'});
    }
    function Forest({mats}){
      const pine=useMemo(makePineGeometries,[]),broad=useMemo(makeBroadGeometries,[]),birch=useMemo(makeBirchGeometries,[]);
      const p=layout.trees.filter(t=>t.type==='pine'),b=layout.trees.filter(t=>t.type==='broad'),bi=layout.trees.filter(t=>t.type==='birch');
      const colliderTrees=layout.trees.filter(t=>t.collision).slice(0,95);
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:pine.trunk,material:mats.bark,items:p,kind:'tree'}),h(InstancedBatch,{geometry:pine.foliage,material:mats.pine,items:p,kind:'tree'}),
        h(InstancedBatch,{geometry:broad.trunk,material:mats.bark,items:b,kind:'tree'}),h(InstancedBatch,{geometry:broad.foliage,material:mats.broad,items:b,kind:'tree'}),
        h(InstancedBatch,{geometry:birch.trunk,material:mats.birchBark,items:bi,kind:'tree'}),h(InstancedBatch,{geometry:birch.foliage,material:mats.birchLeaf,items:bi,kind:'tree'}),
        h(RigidBody,{type:'fixed',colliders:false},...colliderTrees.map((t,i)=>h(CuboidCollider,{key:i,args:[.28*t.s,1.9*t.s,.28*t.s],position:[t.x,terrainHeight(t.x,t.z)+1.9*t.s,t.z]})))
      );
    }
    function GroundCover({mats}){
      const grassGeo=useMemo(()=>makeGrassGeometry('grass'),[]),reedGeo=useMemo(()=>makeGrassGeometry('reed'),[]);
      return h(React.Fragment,null,h(InstancedBatch,{geometry:grassGeo,material:mats.grass,items:layout.grass,kind:'grass'}),h(InstancedBatch,{geometry:reedGeo,material:mats.reed,items:layout.reeds,kind:'reed'}));
    }
    function RockField({mats}){
      const variants=useMemo(()=>[1,2,3,4,5].map(makeRockGeometry),[]),batches=[0,1,2,3,4].map(v=>layout.rocks.filter(r=>r.variant===v)),colliders=layout.rocks.filter(r=>r.collision).slice(0,80);
      return h(React.Fragment,null,...batches.map((items,v)=>h(InstancedBatch,{key:v,geometry:variants[v],material:mats.rock,items,kind:'rock'})),h(RigidBody,{type:'fixed',colliders:false},...colliders.map((r,i)=>h(BallCollider,{key:i,args:[r.s*.58],position:[r.x,terrainHeight(r.x,r.z)+r.s*.28,r.z]}))));
    }

    function Bridge({mats}){
      const x=-31,z=riverCenterZ(x),deckY=waterSurfaceAt(x)+1.0,length=10.0,width=3.1,pieces=[];
      for(let i=0;i<25;i++)pieces.push(h('mesh',{key:'p'+i,position:[0,.04,-length/2+.2+i*.4],castShadow:true,receiveShadow:true},h('boxGeometry',{args:[width,.14,.37]}),h('primitive',{object:mats.wood,attach:'material'})));
      for(const sx of [-1,1]){
        pieces.push(h('mesh',{key:'rail'+sx,position:[sx*1.38,.86,0],rotation:[Math.PI/2,0,0],castShadow:true},h('cylinderGeometry',{args:[.07,.08,length,7]}),h('meshStandardMaterial',{color:'#6d5138',roughness:1})));
        for(let i=0;i<6;i++)pieces.push(h('mesh',{key:`post${sx}${i}`,position:[sx*1.38,.54,-length/2+.25+i*(length-.5)/5],castShadow:true},h('cylinderGeometry',{args:[.09,.11,1.12,7]}),h('meshStandardMaterial',{color:'#6b4f35',roughness:1})));
      }
      return h(RigidBody,{type:'fixed',colliders:false,position:[x,deckY,z],friction:1},h(CuboidCollider,{args:[width/2,.15,length/2]}),h(CuboidCollider,{args:[width/2,.10,1.3],position:[0,-.18,length/2+1],rotation:[-.11,0,0]}),h(CuboidCollider,{args:[width/2,.10,1.3],position:[0,-.18,-length/2-1],rotation:[.11,0,0]}),h('group',null,...pieces,h('mesh',{position:[0,-.18,length/2+1],rotation:[-.11,0,0],receiveShadow:true},h('boxGeometry',{args:[width,.16,2.6]}),h('primitive',{object:mats.wood,attach:'material'})),h('mesh',{position:[0,-.18,-length/2-1],rotation:[.11,0,0],receiveShadow:true},h('boxGeometry',{args:[width,.16,2.6]}),h('primitive',{object:mats.wood,attach:'material'}))));
    }
    function Ford({mats}){
      const stones=[];for(let i=0;i<13;i++){const z=130-i*1.15,x=31+Math.sin(i*.84)*.45,y=waterSurfaceAt(x)+.08;stones.push(h('mesh',{key:i,position:[x,y,z],rotation:[0,i*.39,0],scale:[.72,.25,.95],receiveShadow:true},h('primitive',{object:makeRockGeometry((i%5)+1)}),h('primitive',{object:mats.rock,attach:'material'})));}
      return h('group',null,...stones);
    }

    function makeTextTexture(lines){
      const c=document.createElement('canvas');c.width=768;c.height=280;const ctx=c.getContext('2d');ctx.fillStyle='#4c3628';ctx.fillRect(0,0,c.width,c.height);
      for(let i=0;i<800;i++){ctx.fillStyle=Math.random()>.5?'rgba(255,255,255,.025)':'rgba(0,0,0,.05)';ctx.fillRect(Math.random()*768,Math.random()*280,Math.random()*12+1,Math.random()*2+1);}
      ctx.fillStyle='#ead7b1';ctx.textAlign='center';ctx.font='700 47px Georgia, serif';lines.forEach((line,i)=>ctx.fillText(line,384,85+i*70));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
    }
    function Signpost({position,rotation=0,lines,mats}){
      const tex=useMemo(()=>makeTextTexture(lines),[]);const mat=useMemo(()=>new THREE.MeshStandardMaterial({map:tex,roughness:1}),[tex]);
      return h('group',{position:[position[0],terrainHeight(position[0],position[2]),position[2]],rotation:[0,rotation,0]},h('mesh',{position:[0,1.6,0],castShadow:true},h('cylinderGeometry',{args:[.10,.14,3.2,7]}),h('primitive',{object:mats.bark,attach:'material'})),h('mesh',{position:[0,2.45,.02],castShadow:true},h('boxGeometry',{args:[3.5,1.28,.16]}),h('primitive',{object:mat,attach:'material'})));
    }

    function DecisionLandforms({mats}){
      const geo=useMemo(()=>makeRockGeometry(31),[]);
      const crags=useMemo(()=>{
        const a=[];
        // Central woodland crag: creates a genuine west/east choice without fencing the player onto a path.
        for(let i=0;i<9;i++)a.push({x:-1.2+Math.sin(i*1.4)*2.1,z:24-i*6.2,s:2.1+(i%3)*.32,sy:.72+(i%2)*.18,rot:i*.52});
        // Upper crag / broken ridge: divides the final switchback and ridge approaches.
        for(let i=0;i<11;i++)a.push({x:1.0+Math.sin(i*1.15)*2.5,z:-101-i*6.0,s:2.25+(i%4)*.26,sy:.78+(i%3)*.12,rot:i*.43});
        return a;
      },[]);
      return h(RigidBody,{type:'fixed',colliders:false},...crags.flatMap((r,i)=>{
        const y=terrainHeight(r.x,r.z);
        return [
          h('mesh',{key:'m'+i,geometry:geo,material:mats.rock,position:[r.x,y+r.s*.42,r.z],rotation:[0,r.rot,0],scale:[r.s,r.s*r.sy,r.s*.95],castShadow:i<8,receiveShadow:true}),
          h(BallCollider,{key:'c'+i,args:[r.s*.72],position:[r.x,y+r.s*.48,r.z]})
        ];
      }));
    }

    function Outpost({mats}){
      const y=terrainHeight(OUTPOST.x,OUTPOST.z),rockA=useMemo(()=>makeRockGeometry(9),[]),rockB=useMemo(()=>makeRockGeometry(11),[]),rockC=useMemo(()=>makeRockGeometry(13),[]);
      return h(RigidBody,{type:'fixed',colliders:false},h(BallCollider,{args:[3.4],position:[OUTPOST.x,y+1.7,OUTPOST.z]}),h(CuboidCollider,{args:[2.2,4.5,2.2],position:[OUTPOST.x+.35,y+7.2,OUTPOST.z-.1]}),h('group',{position:[OUTPOST.x,y,OUTPOST.z],rotation:[0,-.22,0]},h('mesh',{geometry:rockA,material:mats.rock,scale:[4.4,2.1,4.0],position:[0,1.1,0],castShadow:true,receiveShadow:true}),h('mesh',{geometry:rockB,material:mats.rock,scale:[2.7,1.3,2.9],position:[-2.4,1.4,1.4],receiveShadow:true}),h('mesh',{geometry:rockC,material:mats.rock,scale:[2.1,1.1,2.4],position:[2.4,1.2,1.1],receiveShadow:true}),h('mesh',{position:[.2,5.6,0],castShadow:true,receiveShadow:true},h('cylinderGeometry',{args:[2.45,2.9,7.7,12]}),h('primitive',{object:mats.stone,attach:'material'})),h('mesh',{position:[.2,10.1,0],castShadow:true},h('coneGeometry',{args:[2.75,2.0,12]}),h('meshStandardMaterial',{color:'#4c4037',roughness:1})),h('mesh',{position:[0,2.75,2.72],castShadow:true},h('boxGeometry',{args:[1.15,2.1,.2]}),h('primitive',{object:mats.wood,attach:'material'}))));
    }
    function Waterfall({mats}){
      const fallMat=useMemo(()=>new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 vUv;void main(){float s=.55+.45*sin(vUv.x*38.+vUv.y*18.+time*5.);vec3 c=mix(vec3(.55,.77,.83),vec3(.94,.98,1.),s*.52);gl_FragColor=vec4(c,.52+.24*s);}`}),[]);useFrame((_,dt)=>fallMat.uniforms.time.value+=dt);
      const x=-57,z=-30,base=terrainHeight(x,z),creek=useMemo(()=>makeStripGeometry([[-57,-20],[-50,-8],[-43,6],[-38,22],[-35,41]],1.6,-.06),[]);
      return h('group',null,h('mesh',{position:[x,base+5.1,z-3.4],scale:[6.5,8.2,4],castShadow:true,receiveShadow:true},h('primitive',{object:makeRockGeometry(21)}),h('primitive',{object:mats.rock,attach:'material'})),h('mesh',{position:[x,base+10.4,z-1.8],rotation:[-Math.PI/2,0,0]},h('circleGeometry',{args:[3.2,32]}),h('meshStandardMaterial',{color:'#4e98a8',transparent:true,opacity:.76,roughness:.18,side:THREE.DoubleSide})),h('mesh',{position:[x,base+5.4,z+.1],material:fallMat},h('planeGeometry',{args:[3.2,10.0,1,10]})),h('mesh',{position:[x,base+.2,z+1.6],rotation:[-Math.PI/2,0,0]},h('circleGeometry',{args:[3.4,32]}),h('meshStandardMaterial',{color:'#4d96a5',transparent:true,opacity:.76,roughness:.16,side:THREE.DoubleSide})),h('mesh',{geometry:creek},h('meshStandardMaterial',{color:'#4e98a8',transparent:true,opacity:.64,roughness:.16,side:THREE.DoubleSide})));
    }
    function Mountains(){
      const items=useMemo(()=>Array.from({length:11},(_,i)=>({x:-76+i*15,z:-260-rng()*15,h:26+rng()*25,r:8+rng()*6})),[]);
      return h('group',null,...items.map((m,i)=>h('mesh',{key:i,position:[m.x,-4,m.z],scale:[1,1,1.45]},h('coneGeometry',{args:[m.r,m.h,7,3]}),h('meshStandardMaterial',{color:i%2?'#87939a':'#929ea4',roughness:1,flatShading:true}))));
    }

    function Valley({materials}){
      return h(React.Fragment,null,
        h(Terrain,{mat:materials.forest}),h(Paths,{mat:materials.path}),h(River,null),h(RiverBarriers,null),h(Bridge,{mats:materials}),h(Ford,{mats:materials}),h(Forest,{mats:materials}),h(GroundCover,{mats:materials}),h(RockField,{mats:materials}),
        h(Signpost,{position:[0,0,151],rotation:0,lines:['BRIDGE  ←','FORD  →'],mats:materials}),
        h(Signpost,{position:[0,0,48],rotation:0,lines:['PINE TRAIL  ←','BIRCH HOLLOW  →'],mats:materials}),
        h(Signpost,{position:[0,0,-84],rotation:0,lines:['SWITCHBACK  ←','RIDGE  →'],mats:materials}),
        h(DecisionLandforms,{mats:materials}),
        h(Outpost,{mats:materials}),h(Waterfall,{mats:materials}),h(Mountains,null)
      );
    }

    class ModelBoundary extends React.Component {constructor(props){super(props);this.state={error:null};}static getDerivedStateFromError(error){return{error};}componentDidCatch(error){showBootError(error);}render(){return this.state.error?null:this.props.children;}}
    function AnimatedCharacter({onReady}){
      const group=useRef(),{scene,animations}=useGLTF(TEST_CHARACTER_URL),{actions}=useAnimations(animations,group),animState=useEcctrlAnimationStore(s=>s.animationState);
      useEffect(()=>{scene.traverse(obj=>{if(obj.isMesh||obj.isSkinnedMesh){obj.castShadow=true;obj.receiveShadow=true;if(obj.material){const ms=Array.isArray(obj.material)?obj.material:[obj.material];for(const m of ms)if('roughness'in m)m.roughness=Math.max(.55,m.roughness??.7);}}});},[scene]);
      useEffect(()=>{if(actions?.Idle&&actions?.Walk&&actions?.Run)onReady?.();},[actions,onReady]);
      useEffect(()=>{const map={IDLE:'Idle',WALK:'Walk',RUN:'Run',JUMP_START:'Idle',JUMP_IDLE:'Idle',JUMP_FALL:'Idle',JUMP_LAND:'Idle'},next=actions?.[map[animState]]||actions?.Idle;if(!next)return;next.reset().fadeIn(.16).play();return()=>next.fadeOut(.16);},[actions,animState]);
      return h('group',{ref:group,position:[0,-.88,0],rotation:[0,Math.PI,0],scale:.92},h('primitive',{object:scene}));
    }
    function DirectKeyboardInput({controllerRef}){
      const pressed=useRef({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
      useEffect(()=>{const map={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'leftward',ArrowLeft:'leftward',KeyD:'rightward',ArrowRight:'rightward',ShiftLeft:'run',ShiftRight:'run',Space:'jump'};const sync=()=>{const c=controllerRef.current,active=boot.classList.contains('hidden')&&!session.finishedAt;if(c)c.setMovement(active?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});const el=document.getElementById('input-state');if(el){const p=pressed.current,a=[];if(p.forward)a.push('W');if(p.backward)a.push('S');if(p.leftward)a.push('A');if(p.rightward)a.push('D');if(p.run)a.push('RUN');if(p.jump)a.push('JUMP');el.textContent=a.length?a.join(' + '):'—';}};const down=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=true;sync();};const up=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=false;sync();};const clear=()=>{Object.keys(pressed.current).forEach(k=>pressed.current[k]=false);sync();};window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up,{passive:false});window.addEventListener('blur',clear);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};},[controllerRef]);
      useFrame(()=>{const c=controllerRef.current;if(c)c.setMovement(boot.classList.contains('hidden')&&!session.finishedAt?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});});return null;
    }
    function FollowCamera({controllerRef}){
      const controls=useRef(),{camera}=useThree(),started=useRef(false),up=useMemo(()=>new THREE.Vector3(0,1,0),[]);
      useFrame(()=>{const c=controllerRef.current,cc=controls.current;if(!c||!cc||!c.currPos)return;const p=c.currPos;if(!started.current){camera.position.set(p.x+4.8,p.y+3.1,p.z+6.2);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+1,p.z,false);started.current=true;}else cc.moveTo(p.x,p.y+1,p.z,true);if(c.upAxis){up.copy(c.upAxis);camera.up.lerp(up,.12);cc.setUp(camera.up);}});
      return h(EcctrlCameraControls,{ref:controls,makeDefault:true,smoothTime:.12,minDistance:3.0,maxDistance:7.0,minPolarAngle:.50,maxPolarAngle:1.28,dollyToCursor:false,truckSpeed:0,azimuthRotateSpeed:.8,polarRotateSpeed:.75});
    }

    function updateStudyFromPosition(p){
      if(!gameStarted||session.finishedAt)return;
      updateElapsed();
      if(!fired.has('intro')&&p.z<212)showNav('intro','MERA NAV online. The northern outpost is your destination. You are free to choose your route.');

      if(p.z<168)showNav('river_gloss',`The river blocks the valley ahead. Both crossings contain a short ${STUDY.items.crossing.form} section — a narrow, one-person passage. The old bridge is west; the shallow ford is east.`,{target:'menic',exposure:'gloss'});
      if(p.z<151)showNav('river_neutral','Choose whichever crossing you prefer. Both routes continue north.',{duration:5200});
      if(!session.routes.river && p.z<134){
        if(p.x<-14)setRoute('river','bridge');else if(p.x>14)setRoute('river','ford');
      }
      if(session.routes.river && p.z<132)showNav('river_partial',`You are entering the narrow ${STUDY.items.crossing.form} section now. Keep moving until the far bank.`,{target:'menic',exposure:'partial'});
      if(p.z<108)showNav('river_bare',`The ${STUDY.items.crossing.form} section is behind you. Continue toward the central valley.`,{target:'menic',exposure:'bare'});
      if(p.z<88)showNav('river_after','The trails meet again ahead. Stay generally north.',{duration:5200});

      if(p.z<67)showNav('wood_gloss',`The woodland divides ahead. Each route has a ${STUDY.items.shelter.form} stretch — a sheltered, enclosed section. The pine trail is west; the birch hollow is east.`,{target:'silar',exposure:'gloss'});
      if(p.z<48)showNav('wood_neutral','Both woodland routes reconnect farther north. Choose by terrain, not distance.',{duration:5400});
      if(!session.routes.woodland && p.z<30){
        if(p.x<-9)setRoute('woodland','pine');else if(p.x>9)setRoute('woodland','birch');
      }
      if(session.routes.woodland && p.z<18)showNav('wood_partial',`Stay with this sheltered ${STUDY.items.shelter.form} trail until you reach the marker stones.`,{target:'silar',exposure:'partial'});
      if(p.z<-30)showNav('wood_bare',`The ${STUDY.items.shelter.form} section ends as the trees open out.`,{target:'silar',exposure:'bare'});
      if(p.z<-51)showNav('wood_after','You are entering the upper basin. The outpost should become visible again soon.',{duration:5600});

      if(p.z<-72)showNav('ascent_gloss',`The last ascent contains a ${STUDY.items.ascent.form} section — a steeply rising stretch. The rocky ridge is east; the longer switchback is west.`,{target:'valen',exposure:'gloss'});
      if(p.z<-88)showNav('ascent_neutral','Either route reaches the same final approach. Pick the climb you prefer.',{duration:5200});
      if(!session.routes.ascent && p.z<-102){
        if(p.x>8)setRoute('ascent','ridge');else if(p.x<-8)setRoute('ascent','switchback');
      }
      if(session.routes.ascent && p.z<-116)showNav('ascent_partial',`Continue through the steep ${STUDY.items.ascent.form} section. The ground levels beyond the next rise.`,{target:'valen',exposure:'partial'});
      if(p.z<-166)showNav('ascent_bare',`Past the ${STUDY.items.ascent.form} stretch, follow the final trail to the outpost.`,{target:'valen',exposure:'bare'});
      if(p.z<-188)showNav('final_neutral','Almost there. Continue to the stone tower.',{duration:5000});
      if(Math.hypot(p.x-OUTPOST.x,p.z-OUTPOST.z)<6.5) finishStudy();
    }

    function Diagnostics({controllerRef}){
      const animState=useEcctrlAnimationStore(s=>s.animationState),frames=useRef(0),last=useRef(performance.now()),{gl}=useThree();
      useFrame(()=>{
        const c=controllerRef.current;if(c){
          document.getElementById('anim-state').textContent=animState||'—';document.getElementById('grounded').textContent=c.isOnGround?'YES':'NO';const p=c.currPos;
          if(p){
            const region=document.getElementById('region');
            if(p.z>155)region.textContent='SOUTHERN APPROACH';else if(p.z>106)region.textContent='RIVER CROSSING';else if(p.z>45)region.textContent='CENTRAL VALLEY';else if(p.z>-48)region.textContent='WOODLAND';else if(p.z>-88)region.textContent='UPPER BASIN';else if(p.z>-181)region.textContent='FINAL ASCENT';else region.textContent='OUTPOST APPROACH';
            updateStudyFromPosition(p);
          }
        }
        frames.current++;const now=performance.now();if(now-last.current>650){const fps=Math.round(frames.current*1000/(now-last.current));document.getElementById('fps').textContent=String(fps);document.getElementById('draws').textContent=String(gl.info.render.calls);frames.current=0;last.current=now;}
      });return null;
    }
    function Player({onCharacterReady}){
      const controllerRef=useRef();
      return h(React.Fragment,null,h(EcctrlAnimationStateController,{ecctrl:controllerRef}),h(DirectKeyboardInput,{controllerRef}),h(Ecctrl,{ref:controllerRef,position:[0,4,216],capsuleHalfHeight:.55,capsuleRadius:.32,floatHeight:.20,maxWalkVel:1.95,maxRunVel:3.35,jumpVel:4.8,slopeMaxAngle:.90,enableToggleRun:false,groundDetection:'shapeCast',friction:0,linearDamping:.15,angularDamping:1.0},h(ModelBoundary,null,h(AnimatedCharacter,{onReady:onCharacterReady}))),h(FollowCamera,{controllerRef}),h(Diagnostics,{controllerRef}));
    }
    function Scene({onCharacterReady}){
      const materials=useLandscapeMaterials();
      return h(React.Fragment,null,h('color',{attach:'background',args:['#a8bdc2']}),h('fog',{attach:'fog',args:['#b5c5c6',80,520]}),h('hemisphereLight',{intensity:1.46,color:'#e2f1f5',groundColor:'#47533e'}),h('directionalLight',{position:[-40,55,40],intensity:2.65,castShadow:true,'shadow-mapSize-width':1024,'shadow-mapSize-height':1024,'shadow-camera-left':-55,'shadow-camera-right':55,'shadow-camera-top':55,'shadow-camera-bottom':-55,'shadow-camera-near':4,'shadow-camera-far':115,'shadow-bias':-.00012}),h('directionalLight',{position:[30,12,-25],intensity:.38,color:'#afd0e6'}),h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},h(Valley,{materials}),h(Player,{onCharacterReady})));
    }
    function App(){
      const [ready,setReady]=useState(false),once=useRef(false);
      const onCharacterReady=React.useCallback(()=>{if(once.current)return;once.current=true;setReady(true);bootStatus.textContent='Ecctrl, Rapier and the expanded study valley are ready.';loadfill.style.width='100%';enterBtn.disabled=false;},[]);
      useEffect(()=>{if(!ready)return;enterBtn.onclick=()=>{boot.classList.add('hidden');hud.classList.remove('hidden');help.classList.remove('hidden');routeStatus.classList.remove('hidden');gameStarted=true;session.startedAt=new Date().toISOString();logEvent('game_start');};},[ready]);
      return h(Canvas,{shadows:true,dpr:[1,1.18],camera:{position:[4.8,3.2,224],fov:54,near:.1,far:650},gl:{antialias:true,powerPreference:'high-performance'},onCreated:({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.07;loadfill.style.width='78%';}},h(Suspense,{fallback:null},h(Scene,{onCharacterReady})));
    }

    const root=createRoot(document.getElementById('root'));root.render(h(App));
    setTimeout(()=>{if(enterBtn.disabled&&bootError.classList.contains('hidden'))bootStatus.textContent='Still loading the valley or test character. If this persists, check network/CDN access.';},18000);
  } catch(err){ showBootError(err); }
}

bootApp();
