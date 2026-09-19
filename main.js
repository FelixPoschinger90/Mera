const boot = document.getElementById('boot');
const enterBtn = document.getElementById('enter');
const bootStatus = document.getElementById('boot-status');
const loadfill = document.getElementById('loadfill');
const bootError = document.getElementById('boot-error');
const hud = document.getElementById('hud');
const help = document.getElementById('help');
const checklist = document.getElementById('checklist');
const finish = document.getElementById('finish');
const replayBtn = document.getElementById('replay');

window.addEventListener('error', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.error || event.message);
});
window.addEventListener('unhandledrejection', event => {
  if (!boot.classList.contains('hidden')) showBootError(event.reason);
});

function showBootError(err) {
  const message = err?.stack || err?.message || String(err);
  bootStatus.textContent = 'E2 failed to initialize.';
  bootError.textContent = message;
  bootError.classList.remove('hidden');
  enterBtn.disabled = true;
}

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

    // Keep the exact working E1 character for E2.
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

    const PATHS = {
      south:[[0,25],[0,20],[0,15],[0,11]],
      bridge:[[0,11],[-3,9],[-6,7],[-8.4,4],[-8.3,0],[-5,-4],[-1,-7]],
      ford:[[0,11],[4,10],[7.3,8],[10.5,5.2],[10.3,1.5],[6,-3],[-1,-7]],
      west:[[-1,-7],[-5,-11],[-6,-16],[-2,-21],[4,-24],[8,-27]],
      east:[[-1,-7],[4,-10],[8,-14],[10,-19],[9,-24],[8,-27]]
    };

    const OUTPOST = {x:8,z:-27};

    function rand(seed=1234567){
      let s=seed>>>0;
      return ()=>{ s=(1664525*s+1013904223)>>>0; return s/4294967296; };
    }
    const rng=rand(291884);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};

    function baseHeight(x,z){
      let y=.22*Math.sin(x*.14)*Math.cos(z*.10)+.10*Math.sin((x+z)*.34);
      y += .65*Math.exp(-((x+16)*(x+16))/150-((z+8)*(z+8))/310);
      y += 1.05*Math.exp(-((x-13)*(x-13))/180-((z+12)*(z+12))/240);
      y += 2.65*Math.exp(-((x-8)*(x-8))/105-((z+27)*(z+27))/95);
      y += .85*Math.exp(-((x+8)*(x+8))/180-((z+22)*(z+22))/150);
      return y;
    }
    function riverCenterZ(x){ return 4 + .032*x + .28*Math.sin(x*.14); }
    function waterSurfaceAt(x){ return baseHeight(x,riverCenterZ(x))-.42; }
    function edgeRise(x,z){
      let rise=0;
      const ax=Math.abs(x);
      if(ax>27){ const t=(ax-27)/7; rise += t*t*11.5; }
      if(z>31){ const t=(z-31)/6; rise += t*t*9.5; }
      if(z<-34){ const t=(-z-34)/4.5; rise += t*t*13; }
      return rise;
    }
    function terrainHeight(x,z){
      let y=baseHeight(x,z)+edgeRise(x,z);
      const rz=riverCenterZ(x), d=Math.abs(z-rz);
      if(d<3.0){
        const q=1-smooth01(d/3.0);
        let depth=1.35*q;
        // The ford is genuinely shallow terrain, not a scripted path.
        const ford=Math.exp(-((x-10.5)*(x-10.5))/12-((z-4.3)*(z-4.3))/24);
        depth*=1-.72*ford;
        y-=depth;
      }
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
    function nearTrail(x,z,d=2.6){ return Object.values(PATHS).some(p=>distancePolyline(x,z,p)<d); }

    function configureTexture(tex,repeat,srgb=false){
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(repeat,repeat);
      tex.anisotropy=4;
      if(srgb) tex.colorSpace=THREE.SRGBColorSpace;
      return tex;
    }

    function useLandscapeMaterials(){
      const textures=useTexture([
        ASSET.forestDiff,ASSET.forestNorm,ASSET.pathDiff,ASSET.pathNorm,
        ASSET.rockDiff,ASSET.rockNorm,ASSET.woodDiff,ASSET.woodNorm
      ]);
      useMemo(()=>{
        configureTexture(textures[0],9,true); configureTexture(textures[1],9,false);
        configureTexture(textures[2],2.7,true); configureTexture(textures[3],2.7,false);
        configureTexture(textures[4],2.0,true); configureTexture(textures[5],2.0,false);
        configureTexture(textures[6],1.4,true); configureTexture(textures[7],1.4,false);
      },textures);
      return useMemo(()=>({
        forest:new THREE.MeshStandardMaterial({map:textures[0],normalMap:textures[1],roughness:.98,color:0xdbe2d2,vertexColors:true}),
        path:new THREE.MeshStandardMaterial({map:textures[2],normalMap:textures[3],roughness:.95,color:0xf0e5d3}),
        rock:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:.97,color:0xc1c0b7}),
        wood:new THREE.MeshStandardMaterial({map:textures[6],normalMap:textures[7],roughness:.92,color:0xc6a57f}),
        bark:new THREE.MeshStandardMaterial({color:0x5a4632,roughness:1}),
        pine:new THREE.MeshStandardMaterial({color:0x315436,roughness:1}),
        broad:new THREE.MeshStandardMaterial({color:0x4c6c3d,roughness:1}),
        grass:new THREE.MeshStandardMaterial({color:0x68894b,roughness:1,side:THREE.DoubleSide}),
        reed:new THREE.MeshStandardMaterial({color:0x6c7c3b,roughness:1}),
        stone:new THREE.MeshStandardMaterial({map:textures[4],normalMap:textures[5],roughness:1,color:0x9b9990})
      }),textures);
    }

    function makeTerrainGeometry(){
      const g=new THREE.PlaneGeometry(70,78,72,80);
      g.rotateX(-Math.PI/2);
      const p=g.attributes.position, cols=[];
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);
        p.setY(i,y);
        const c=new THREE.Color(0x71845c);
        if(y>2.0)c.lerp(new THREE.Color(0x7f806f),.28);
        if(y>5.0)c.lerp(new THREE.Color(0x8e8c83),.5);
        c.offsetHSL((Math.sin(x*.31+z*.17))*0.006,0,(Math.sin(i*1.77))*0.008);
        cols.push(c.r,c.g,c.b);
      }
      g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
      g.computeVertexNormals();
      return g;
    }

    function makeStripGeometry(points2,width,yOffset=.045){
      const pts=points2.map(([x,z])=>new THREE.Vector3(x,terrainHeight(x,z)+yOffset,z));
      const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal',.35);
      const segs=64,pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t).normalize(),side=new THREE.Vector3(-tan.z,0,tan.x).normalize();
        const w=width*(1+.045*Math.sin(i*.9)+.025*Math.sin(i*2.13));
        const l=p.clone().addScaledVector(side,w*.5),r=p.clone().addScaledVector(side,-w*.5);
        l.y=terrainHeight(l.x,l.z)+yOffset; r.y=terrainHeight(r.x,r.z)+yOffset;
        pos.push(l.x,l.y,l.z,r.x,r.y,r.z);uv.push(0,t*8,1,t*8);
        if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      g.setIndex(idx);g.computeVertexNormals();return g;
    }

    function makeRiverGeometry(){
      const segs=90,width=4.9,pos=[],uv=[],idx=[];
      for(let i=0;i<=segs;i++){
        const t=i/segs,x=-32+t*64,z=riverCenterZ(x),y=waterSurfaceAt(x),dz=.032+.039*Math.cos(x*.14),side=new THREE.Vector3(-dz,0,1).normalize();
        for(const s of [-1,1]){const q=new THREE.Vector3(x,y,z).addScaledVector(side,s*width*.5);pos.push(q.x,q.y,q.z);uv.push(t,(s+1)/2);}
        if(i<segs){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    }

    function makeRockGeometry(seed=1){
      const g=new THREE.DodecahedronGeometry(1,1);
      const p=g.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        const n=.90+.13*Math.sin((i+seed)*2.17)+.055*Math.cos((x*3.1+z*5.4+seed));
        p.setXYZ(i,x*n*(1+.10*Math.sin(seed)),y*n*(.62+.08*Math.cos(seed*1.4)),z*n*(.90+.08*Math.sin(seed*2.1)));
      }
      g.computeVertexNormals();return g;
    }

    function makePineGeometries(){
      const trunk=new THREE.CylinderGeometry(.19,.31,4.4,7);trunk.translate(0,2.2,0);
      const foliage=[];
      [[2.1,1.65,2.5],[3.05,1.42,2.35],[3.95,1.15,2.0],[4.75,.78,1.55]].forEach(([y,r,hh],i)=>{
        const c=new THREE.ConeGeometry(r,hh,8);c.translate(0,y,0);c.rotateY(i*.31);foliage.push(c);
      });
      return {trunk,foliage:mergeGeometries(foliage,false)};
    }
    function makeBroadGeometries(){
      const trunk=new THREE.CylinderGeometry(.24,.38,4.0,8);trunk.translate(0,2.0,0);
      const leaves=[];
      [[0,4.1,0,1.35],[.8,4.5,.2,1.05],[-.85,4.45,-.15,1.0],[.1,5.25,-.55,.92]].forEach(([x,y,z,s])=>{
        const q=new THREE.IcosahedronGeometry(s,1);q.scale(1,.78,1);q.translate(x,y,z);leaves.push(q);
      });
      return {trunk,foliage:mergeGeometries(leaves,false)};
    }
    function makeGrassGeometry(){
      const a=new THREE.PlaneGeometry(.26,.9);a.translate(0,.45,0);
      const b=a.clone();b.rotateY(Math.PI/2);
      const c=a.clone();c.rotateY(Math.PI/4);
      return mergeGeometries([a,b,c],false);
    }

    function generateLandscapeLayout(){
      const trees=[],grass=[],rocks=[],reeds=[];
      // Interior forest and meadow structure. Paths are suggestions, not movement rails.
      for(let i=0;i<84;i++){
        let x,z,attempt=0;
        do{ x=-29+rng()*58; z=-31+rng()*60; attempt++; }while((nearTrail(x,z,2.4)||Math.abs(z-riverCenterZ(x))<3.4||Math.hypot(x,z-25)<4.2||Math.hypot(x-8,z+27)<4.5)&&attempt<20);
        const s=.75+rng()*.85;
        trees.push({x,z,s,type:rng()<.74?'pine':'broad',rot:rng()*Math.PI*2,collision:s>.95 && Math.abs(x)<26 && z<28});
      }
      // Boundary trees disguise the compact map; steep terrain does the actual limiting.
      for(let i=0;i<44;i++){
        const side=i%2?-1:1,x=side*(27.5+rng()*3.2),z=-30+rng()*60;
        trees.push({x,z,s:1.0+rng()*.75,type:'pine',rot:rng()*6.28,collision:false});
      }
      for(let i=0;i<44;i++){
        const z=i%2?31.5:-33.0,x=-27+rng()*54;
        trees.push({x,z,s:1.0+rng()*.7,type:'pine',rot:rng()*6.28,collision:false});
      }

      for(let i=0;i<1050;i++){
        const x=-29+rng()*58,z=-30+rng()*59;
        if(Math.abs(z-riverCenterZ(x))<2.7 || nearTrail(x,z,.85))continue;
        grass.push({x,z,s:.55+rng()*1.0,rot:rng()*Math.PI});
      }
      for(let i=0;i<260;i++){
        const x=-29+rng()*58,z=riverCenterZ(x)+(rng()<.5?-1:1)*(2.15+rng()*1.25);
        reeds.push({x,z,s:.65+rng()*.9,rot:rng()*Math.PI});
      }
      // More believable rock vocabulary: four variants, clustered and partly sunk.
      for(let i=0;i<108;i++){
        let x=-29+rng()*58,z=-30+rng()*60;
        if(nearTrail(x,z,1.45) && rng()<.72){i--;continue;}
        const s=.32+rng()*1.25;
        rocks.push({x,z,s,sy:.55+rng()*.35,rot:rng()*Math.PI*2,variant:i%4,collision:s>.82 && Math.abs(x)<27 && z<29});
      }
      // riverbank clusters
      for(let i=0;i<52;i++){
        const x=-29+rng()*58,z=riverCenterZ(x)+(rng()<.5?-1:1)*(2.1+rng()*.95),s=.38+rng()*.78;
        rocks.push({x,z,s,sy:.55+rng()*.25,rot:rng()*Math.PI*2,variant:i%4,collision:s>.72});
      }
      return {trees,grass,rocks,reeds};
    }
    const layout=generateLandscapeLayout();

    function Terrain({mat}){
      const geometry=useMemo(makeTerrainGeometry,[]);
      return h(RigidBody,{type:'fixed',colliders:'trimesh',friction:1,restitution:0},
        h('mesh',{geometry,material:mat,receiveShadow:true})
      );
    }

    function Paths({mat}){
      const geos=useMemo(()=>Object.values(PATHS).map((p,i)=>makeStripGeometry(p,i===0?2.9:2.55)),[]);
      return h(React.Fragment,null,...geos.map((geometry,i)=>h('mesh',{key:i,geometry,material:mat,receiveShadow:true})));
    }

    function River(){
      const geometry=useMemo(makeRiverGeometry,[]), mat=useMemo(()=>new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,side:THREE.DoubleSide,
        uniforms:{time:{value:0},deep:{value:new THREE.Color(0x2d7182)},shallow:{value:new THREE.Color(0x79c2c0)},sun:{value:new THREE.Color(0xece8c9)}},
        vertexShader:`uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.y+=sin(p.x*.75+time*2.)*.025+sin(p.z*2.1-time*1.5)*.017;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
        fragmentShader:`uniform float time;uniform vec3 deep,shallow,sun;varying vec2 vUv;void main(){float f=.5+.5*sin(vUv.x*72.+time*3.+sin(vUv.y*11.)*2.);float edge=smoothstep(0.,.22,vUv.y)*smoothstep(1.,.78,vUv.y);vec3 c=mix(shallow,deep,.40+vUv.y*.18);c+=sun*f*.07;gl_FragColor=vec4(c,.72+.08*f+.05*edge);}`
      }),[]);
      useFrame((_,dt)=>mat.uniforms.time.value+=dt);
      return h('mesh',{geometry,material:mat,receiveShadow:true});
    }

    function InstancedBatch({geometry,material,items,kind,castShadow=false}){
      const ref=useRef();
      useLayoutEffect(()=>{
        if(!ref.current)return;
        const dummy=new THREE.Object3D();
        items.forEach((it,i)=>{
          dummy.position.set(it.x,terrainHeight(it.x,it.z)+(kind==='rock'?-it.s*.18:0),it.z);
          dummy.rotation.set(0,it.rot||0,0);
          if(kind==='tree') dummy.scale.setScalar(it.s);
          else if(kind==='grass') dummy.scale.set(it.s,it.s,it.s);
          else if(kind==='reed') dummy.scale.set(.65*it.s,it.s,.65*it.s);
          else dummy.scale.set(it.s,it.s*it.sy,it.s*(.9+.08*(i%3)));
          dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate=true;
      },[items,kind]);
      return h('instancedMesh',{ref,args:[geometry,material,items.length],castShadow,receiveShadow:kind==='rock'});
    }

    function Forest({mats}){
      const pine=useMemo(makePineGeometries,[]),broad=useMemo(makeBroadGeometries,[]);
      const pineItems=layout.trees.filter(t=>t.type==='pine'),broadItems=layout.trees.filter(t=>t.type==='broad');
      const colliderTrees=layout.trees.filter(t=>t.collision).slice(0,58);
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:pine.trunk,material:mats.bark,items:pineItems,kind:'tree'}),
        h(InstancedBatch,{geometry:pine.foliage,material:mats.pine,items:pineItems,kind:'tree'}),
        h(InstancedBatch,{geometry:broad.trunk,material:mats.bark,items:broadItems,kind:'tree'}),
        h(InstancedBatch,{geometry:broad.foliage,material:mats.broad,items:broadItems,kind:'tree'}),
        h(RigidBody,{type:'fixed',colliders:false},...colliderTrees.map((t,i)=>
          h(CuboidCollider,{key:i,args:[.28*t.s,1.85*t.s,.28*t.s],position:[t.x,terrainHeight(t.x,t.z)+1.85*t.s,t.z]})
        ))
      );
    }

    function GroundCover({mats}){
      const grassGeo=useMemo(makeGrassGeometry,[]),reedGeo=useMemo(()=>{const g=new THREE.CylinderGeometry(.035,.055,1.35,5);g.translate(0,.675,0);return g;},[]);
      return h(React.Fragment,null,
        h(InstancedBatch,{geometry:grassGeo,material:mats.grass,items:layout.grass,kind:'grass'}),
        h(InstancedBatch,{geometry:reedGeo,material:mats.reed,items:layout.reeds,kind:'reed'})
      );
    }

    function RockField({mats}){
      const variants=useMemo(()=>[1,2,3,4].map(makeRockGeometry),[]);
      const batches=[0,1,2,3].map(v=>layout.rocks.filter(r=>r.variant===v));
      const colliders=layout.rocks.filter(r=>r.collision).slice(0,52);
      return h(React.Fragment,null,
        ...batches.map((items,v)=>h(InstancedBatch,{key:v,geometry:variants[v],material:mats.rock,items,kind:'rock',castShadow:false})),
        h(RigidBody,{type:'fixed',colliders:false},...colliders.map((r,i)=>h(BallCollider,{key:i,args:[r.s*.58],position:[r.x,terrainHeight(r.x,r.z)+r.s*.28,r.z]})))
      );
    }

    function Bridge({mats}){
      const x=-8.45,z=riverCenterZ(x),deckY=waterSurfaceAt(x)+.92,length=7.0,width=2.85;
      const pieces=[];
      for(let i=0;i<18;i++)pieces.push(h('mesh',{key:'p'+i,position:[0,.04,-length/2+.2+i*.39],castShadow:true,receiveShadow:true},
        h('boxGeometry',{args:[width,.13,.36]}),h('primitive',{object:mats.wood,attach:'material'})));
      for(const sx of [-1,1]){
        pieces.push(h('mesh',{key:'rail'+sx,position:[sx*1.28,.82,0],rotation:[Math.PI/2,0,0],castShadow:true},h('cylinderGeometry',{args:[.07,.08,length,7]}),h('meshStandardMaterial',{color:'#6d5138',roughness:1})));
        for(let i=0;i<5;i++)pieces.push(h('mesh',{key:`post${sx}${i}`,position:[sx*1.28,.52,-length/2+.2+i*(length-.4)/4],castShadow:true},h('cylinderGeometry',{args:[.09,.11,1.08,7]}),h('meshStandardMaterial',{color:'#6b4f35',roughness:1})));
      }
      return h(RigidBody,{type:'fixed',colliders:false,position:[x,deckY,z],friction:1},
        h(CuboidCollider,{args:[width/2,.14,length/2]}),
        h(CuboidCollider,{args:[width/2,.10,.9],position:[0,-.14,length/2+.65],rotation:[-.10,0,0]}),
        h(CuboidCollider,{args:[width/2,.10,.9],position:[0,-.14,-length/2-.65],rotation:[.10,0,0]}),
        h('group',null,...pieces,
          h('mesh',{position:[0,-.17,length/2+.65],rotation:[-.10,0,0],receiveShadow:true},h('boxGeometry',{args:[width,.16,1.8]}),h('primitive',{object:mats.wood,attach:'material'})),
          h('mesh',{position:[0,-.17,-length/2-.65],rotation:[.10,0,0],receiveShadow:true},h('boxGeometry',{args:[width,.16,1.8]}),h('primitive',{object:mats.wood,attach:'material'}))
        )
      );
    }

    function Ford({mats}){
      const stones=[];
      for(let i=0;i<9;i++){
        const z=7.1-i*.78,x=10.45+Math.sin(i*.92)*.32,y=waterSurfaceAt(x)+.05;
        stones.push(h('mesh',{key:i,position:[x,y,z],rotation:[0,i*.39,0],scale:[.58,.22,.82],receiveShadow:true},h('primitive',{object:makeRockGeometry((i%4)+1)}),h('primitive',{object:mats.rock,attach:'material'})));
      }
      return h('group',null,...stones);
    }

    function Outpost({mats}){
      const y=terrainHeight(OUTPOST.x,OUTPOST.z);
      const rockA=useMemo(()=>makeRockGeometry(9),[]),rockB=useMemo(()=>makeRockGeometry(11),[]),rockC=useMemo(()=>makeRockGeometry(13),[]);
      return h(RigidBody,{type:'fixed',colliders:false},
        h(BallCollider,{args:[2.6],position:[OUTPOST.x,y+1.35,OUTPOST.z]}),
        h(CuboidCollider,{args:[1.85,3.4,1.85],position:[OUTPOST.x+.35,y+5.6,OUTPOST.z-.1]}),
        h('group',{position:[OUTPOST.x,y,OUTPOST.z],rotation:[0,-.22,0]},
          h('mesh',{geometry:rockA,material:mats.rock,scale:[3.4,1.8,3.2],position:[0,.8,0],castShadow:true,receiveShadow:true}),
          h('mesh',{geometry:rockB,material:mats.rock,scale:[2.2,1.2,2.4],position:[-1.7,1.0,1.0],castShadow:true,receiveShadow:true}),
          h('mesh',{geometry:rockC,material:mats.rock,scale:[1.8,1.0,2.0],position:[1.8,.85,.8],castShadow:true,receiveShadow:true}),
          h('mesh',{position:[.2,4.3,0],castShadow:true,receiveShadow:true},h('cylinderGeometry',{args:[2.0,2.35,5.8,12]}),h('primitive',{object:mats.stone,attach:'material'})),
          h('mesh',{position:[.2,7.75,0],castShadow:true},h('coneGeometry',{args:[2.25,1.5,12]}),h('meshStandardMaterial',{color:'#4c4037',roughness:1})),
          h('mesh',{position:[0,2.1,2.2],castShadow:true},h('boxGeometry',{args:[1.0,1.8,.18]}),h('primitive',{object:mats.wood,attach:'material'}))
        )
      );
    }

    function Waterfall({mats}){
      const fallMat=useMemo(()=>new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 vUv;void main(){float s=.55+.45*sin(vUv.x*38.+vUv.y*18.+time*5.);vec3 c=mix(vec3(.55,.77,.83),vec3(.94,.98,1.),s*.52);gl_FragColor=vec4(c,.52+.24*s);}`}),[]);
      useFrame((_,dt)=>fallMat.uniforms.time.value+=dt);
      const x=-18,z=-23,base=terrainHeight(x,z),top=base+8.4;
      const creek=useMemo(()=>makeStripGeometry([[-18,-20],[-15,-15],[-12,-9],[-8,-2],[-5,2]],1.05,-.06),[]);
      return h('group',null,
        h('mesh',{position:[x,base+3.6,z-2.7],scale:[5.0,6.2,3.0],castShadow:true,receiveShadow:true},h('boxGeometry',{args:[1,1,1]}),h('primitive',{object:mats.rock,attach:'material'})),
        h('mesh',{position:[x,top-.7,z+.45],rotation:[-Math.PI/2,0,0]},h('planeGeometry',{args:[3.2,5.8]}),h('meshStandardMaterial',{color:'#5c9eab',transparent:true,opacity:.76,roughness:.18,side:THREE.DoubleSide})),
        h('mesh',{position:[x,base+4.2,z+.1],material:fallMat},h('planeGeometry',{args:[3.0,8.1,1,10]})),
        h('mesh',{position:[x,base+.18,z+1.4],rotation:[-Math.PI/2,0,0]},h('circleGeometry',{args:[3.0,32]}),h('meshStandardMaterial',{color:'#4d96a5',transparent:true,opacity:.76,roughness:.16,side:THREE.DoubleSide})),
        h('mesh',{geometry:creek,position:[0,0,0]},h('meshStandardMaterial',{color:'#4e98a8',transparent:true,opacity:.64,roughness:.16,side:THREE.DoubleSide}))
      );
    }

    function Mountains(){
      const items=useMemo(()=>Array.from({length:9},(_,i)=>({x:-33+i*8.2,z:-55-rng()*6,h:16+rng()*14,r:5+rng()*4})),[]);
      return h('group',null,...items.map((m,i)=>h('mesh',{key:i,position:[m.x,-2,m.z],scale:[1,1,1.45]},h('coneGeometry',{args:[m.r,m.h,7,3]}),h('meshStandardMaterial',{color:i%2?'#87939a':'#929ea4',roughness:1,flatShading:true}))));
    }

    function Valley({materials}){
      return h(React.Fragment,null,
        h(Terrain,{mat:materials.forest}),
        h(Paths,{mat:materials.path}),
        h(River,null),
        h(Bridge,{mats:materials}),
        h(Ford,{mats:materials}),
        h(Forest,{mats:materials}),
        h(GroundCover,{mats:materials}),
        h(RockField,{mats:materials}),
        h(Outpost,{mats:materials}),
        h(Waterfall,{mats:materials}),
        h(Mountains,null)
      );
    }

    class ModelBoundary extends React.Component {
      constructor(props){ super(props); this.state={error:null}; }
      static getDerivedStateFromError(error){ return {error}; }
      componentDidCatch(error){ showBootError(error); }
      render(){ return this.state.error ? null : this.props.children; }
    }

    function AnimatedCharacter({onReady}){
      const group=useRef();
      const {scene,animations}=useGLTF(TEST_CHARACTER_URL);
      const {actions}=useAnimations(animations,group);
      const animState=useEcctrlAnimationStore(s=>s.animationState);
      useEffect(()=>{
        scene.traverse(obj=>{if(obj.isMesh||obj.isSkinnedMesh){obj.castShadow=true;obj.receiveShadow=true;if(obj.material){const ms=Array.isArray(obj.material)?obj.material:[obj.material];for(const m of ms)if('roughness'in m)m.roughness=Math.max(.55,m.roughness??.7);}}});
      },[scene]);
      useEffect(()=>{if(actions?.Idle&&actions?.Walk&&actions?.Run)onReady?.();},[actions,onReady]);
      useEffect(()=>{
        const map={IDLE:'Idle',WALK:'Walk',RUN:'Run',JUMP_START:'Idle',JUMP_IDLE:'Idle',JUMP_FALL:'Idle',JUMP_LAND:'Idle'};
        const next=actions?.[map[animState]]||actions?.Idle;if(!next)return;
        next.reset().fadeIn(.16).play();return()=>next.fadeOut(.16);
      },[actions,animState]);
      return h('group',{ref:group,position:[0,-.88,0],rotation:[0,Math.PI,0],scale:.92},h('primitive',{object:scene}));
    }

    function DirectKeyboardInput({controllerRef}){
      const pressed=useRef({forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});
      useEffect(()=>{
        const map={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'leftward',ArrowLeft:'leftward',KeyD:'rightward',ArrowRight:'rightward',ShiftLeft:'run',ShiftRight:'run',Space:'jump'};
        const sync=()=>{const c=controllerRef.current,active=boot.classList.contains('hidden');if(c)c.setMovement(active?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});const el=document.getElementById('input-state');if(el){const p=pressed.current,a=[];if(p.forward)a.push('W');if(p.backward)a.push('S');if(p.leftward)a.push('A');if(p.rightward)a.push('D');if(p.run)a.push('RUN');if(p.jump)a.push('JUMP');el.textContent=a.length?a.join(' + '):'—';}};
        const down=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=true;sync();};
        const up=e=>{const f=map[e.code];if(!f)return;e.preventDefault();pressed.current[f]=false;sync();};
        const clear=()=>{Object.keys(pressed.current).forEach(k=>pressed.current[k]=false);sync();};
        window.addEventListener('keydown',down,{passive:false});window.addEventListener('keyup',up,{passive:false});window.addEventListener('blur',clear);
        return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
      },[controllerRef]);
      useFrame(()=>{const c=controllerRef.current;if(c)c.setMovement(boot.classList.contains('hidden')?{...pressed.current}:{forward:false,backward:false,leftward:false,rightward:false,run:false,jump:false});});
      return null;
    }

    function FollowCamera({controllerRef}){
      const controls=useRef(),{camera}=useThree(),started=useRef(false),up=useMemo(()=>new THREE.Vector3(0,1,0),[]);
      useFrame(()=>{
        const c=controllerRef.current,cc=controls.current;if(!c||!cc||!c.currPos)return;const p=c.currPos;
        if(!started.current){camera.position.set(p.x+4.6,p.y+3.0,p.z+6.0);cc.setLookAt(camera.position.x,camera.position.y,camera.position.z,p.x,p.y+1.0,p.z,false);started.current=true;}
        else cc.moveTo(p.x,p.y+1.0,p.z,true);
        if(c.upAxis){up.copy(c.upAxis);camera.up.lerp(up,.12);cc.setUp(camera.up);}
      });
      return h(EcctrlCameraControls,{ref:controls,makeDefault:true,smoothTime:.12,minDistance:3.0,maxDistance:6.8,minPolarAngle:.50,maxPolarAngle:1.28,dollyToCursor:false,truckSpeed:0,azimuthRotateSpeed:.8,polarRotateSpeed:.75});
    }

    function Diagnostics({controllerRef,onReachOutpost}){
      const animState=useEcctrlAnimationStore(s=>s.animationState),frames=useRef(0),last=useRef(performance.now()),done=useRef(false),{gl}=useThree();
      useFrame(()=>{
        const c=controllerRef.current;if(c){
          document.getElementById('anim-state').textContent=animState||'—';
          document.getElementById('grounded').textContent=c.isOnGround?'YES':'NO';
          document.getElementById('speed').textContent=Number(c.moveSpeed||0).toFixed(2);
          const p=c.currPos;if(p){
            const region=document.getElementById('region');
            if(p.z>12)region.textContent='SOUTHERN BASIN';else if(p.z>6)region.textContent='STREAM APPROACH';else if(p.z>-6)region.textContent='RIVER VALLEY';else if(p.z>-19)region.textContent='NORTHERN MEADOW';else region.textContent='OUTPOST RISE';
            if(!done.current&&Math.hypot(p.x-OUTPOST.x,p.z-OUTPOST.z)<4.0){done.current=true;onReachOutpost?.();}
          }
        }
        frames.current++;const now=performance.now();if(now-last.current>650){const fps=Math.round(frames.current*1000/(now-last.current));document.getElementById('fps').textContent=String(fps);document.getElementById('draws').textContent=String(gl.info.render.calls);frames.current=0;last.current=now;}
      });
      return null;
    }

    function Player({onCharacterReady,onReachOutpost}){
      const controllerRef=useRef();
      return h(React.Fragment,null,
        h(EcctrlAnimationStateController,{ecctrl:controllerRef}),
        h(DirectKeyboardInput,{controllerRef}),
        h(Ecctrl,{ref:controllerRef,position:[0,3,24],capsuleHalfHeight:.55,capsuleRadius:.32,floatHeight:.20,maxWalkVel:2.25,maxRunVel:4.8,jumpVel:4.8,slopeMaxAngle:.90,enableToggleRun:false,groundDetection:'shapeCast',friction:0,linearDamping:.15,angularDamping:1.0},
          h(ModelBoundary,null,h(AnimatedCharacter,{onReady:onCharacterReady}))
        ),
        h(FollowCamera,{controllerRef}),
        h(Diagnostics,{controllerRef,onReachOutpost})
      );
    }

    function Scene({onCharacterReady,onReachOutpost}){
      const materials=useLandscapeMaterials();
      return h(React.Fragment,null,
        h('color',{attach:'background',args:['#a6bcc0']}),
        h('fog',{attach:'fog',args:['#b7c6c5',32,88]}),
        h('hemisphereLight',{intensity:1.45,color:'#e2f1f5',groundColor:'#47533e'}),
        h('directionalLight',{position:[-24,34,22],intensity:2.75,castShadow:true,'shadow-mapSize-width':1024,'shadow-mapSize-height':1024,'shadow-camera-left':-34,'shadow-camera-right':34,'shadow-camera-top':34,'shadow-camera-bottom':-34,'shadow-camera-near':4,'shadow-camera-far':82,'shadow-bias':-.00012}),
        h('directionalLight',{position:[21,10,-17],intensity:.42,color:'#afd0e6'}),
        h(Physics,{gravity:[0,-9.81,0],timeStep:'vary'},h(Valley,{materials}),h(Player,{onCharacterReady,onReachOutpost}))
      );
    }

    function App(){
      const [ready,setReady]=useState(false),once=useRef(false),completed=useRef(false);
      const onCharacterReady=React.useCallback(()=>{if(once.current)return;once.current=true;setReady(true);bootStatus.textContent='Ecctrl, Rapier and the MERA valley are ready.';loadfill.style.width='100%';enterBtn.disabled=false;},[]);
      const onReachOutpost=React.useCallback(()=>{if(completed.current)return;completed.current=true;finish.classList.remove('hidden');hud.classList.add('hidden');help.classList.add('hidden');},[]);
      useEffect(()=>{if(!ready)return;enterBtn.onclick=()=>{boot.classList.add('hidden');hud.classList.remove('hidden');help.classList.remove('hidden');checklist.classList.remove('hidden');};},[ready]);
      useEffect(()=>{if(!replayBtn)return;replayBtn.onclick=()=>location.reload();},[]);
      return h(Canvas,{shadows:true,dpr:[1,1.2],camera:{position:[4.8,3.2,31],fov:54,near:.1,far:150},gl:{antialias:true,powerPreference:'high-performance'},onCreated:({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.07;loadfill.style.width='78%';}},h(Suspense,{fallback:null},h(Scene,{onCharacterReady,onReachOutpost})));
    }

    const root=createRoot(document.getElementById('root'));root.render(h(App));
    setTimeout(()=>{if(enterBtn.disabled&&bootError.classList.contains('hidden'))bootStatus.textContent='Still loading the landscape or test character. If this persists, check network/CDN access.';},15000);
  } catch(err){ showBootError(err); }
}

bootApp();
