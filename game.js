import * as THREE from 'three';

(() => {
  const canvas = document.getElementById('game');
  const loading = document.getElementById('loading');
  const finish = document.getElementById('finish');
  const hud = document.getElementById('hud');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const notes = document.getElementById('notes');
  const bootStatus = document.getElementById('bootStatus');
  const objectiveEl = document.getElementById('objective');
  const regionEl = document.getElementById('region');
  const choiceHint = document.getElementById('choiceHint');

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xa7b5c0, 0.017);

  const clock = new THREE.Clock();
  const textureLoader = new THREE.TextureLoader();

  const state = {
    running:false,
    keys:{},
    mouseDown:false,
    camYaw:0,
    camPitch:0.42,
    route1:null,
    route2:null,
    crossedFirst:false,
    crossedSecond:false,
    finished:false,
    session:null
  };

  const PATHS_2D = {
    intro:[[0,26],[0,21],[0,16],[0,12]],
    bridge:[[0,12],[-4.5,11],[-8.5,8],[-12,4],[-11,-2],[-7,-9],[0,-14]],
    ford:[[0,12],[4.5,10.5],[9,7],[12.5,2],[9.5,-4],[5,-9],[0,-14]],
    ridge:[[0,-14],[3,-17],[6,-21],[8.2,-25],[9.2,-31]],
    meadow:[[0,-14],[-4,-18],[-2,-23],[3,-27],[9.2,-31]]
  };

  const ROUTE_WIDTH = {intro:3.5, bridge:3.4, ford:3.6, ridge:3.1, meadow:3.3};

  const blockers = [];
  const grassPatches = [];
  const deerActors = [];
  let waterMaterial;
  let waterfallMaterial;
  let terrainMesh;
  let traveller;
  let outpostGroup;
  let merSign;

  const world = {
    player:new THREE.Vector3(0, groundHeight(0,26)+0.02, 26),
    velocity:new THREE.Vector3(),
    lastMoveDir:new THREE.Vector3(0,0,-1)
  };

  const followTarget = new THREE.Vector3();
  const camera = new THREE.PerspectiveCamera(56, innerWidth/innerHeight, 0.1, 500);
  camera.position.set(0,3.5,33);

  bindUI();
  startSession();
  updateRegion();

  try {
    buildScene();
    renderer.render(scene, camera);
    bootStatus.textContent = '3D landscape ready.';
    startBtn.disabled = false;
    startBtn.textContent = 'Enter the valley';
    animate();
  } catch (err) {
    console.error('MERA scene initialization failed:', err);
    bootStatus.classList.add('error');
    bootStatus.textContent = 'The 3D landscape could not initialize: ' + (err && err.message ? err.message : String(err));
    startBtn.disabled = true;
    startBtn.textContent = '3D scene failed to load';
  }

  function bindUI(){
    startBtn.addEventListener('click', () => {
      loading.classList.add('hidden');
      hud.classList.remove('hidden');
      state.running = true;
      startSession();
    });
    restartBtn.addEventListener('click', () => {
      finish.classList.add('hidden');
      hud.classList.remove('hidden');
      resetGame();
      state.running = true;
    });
    downloadBtn.addEventListener('click', downloadSession);

    window.addEventListener('keydown', e => state.keys[e.code]=true);
    window.addEventListener('keyup', e => state.keys[e.code]=false);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousedown', () => state.mouseDown=true);
    window.addEventListener('mouseup', () => state.mouseDown=false);
    window.addEventListener('mousemove', e => {
      if(!state.mouseDown || !state.running) return;
      state.camYaw -= e.movementX * 0.0045;
      state.camPitch = clamp(state.camPitch + e.movementY * 0.0035, 0.16, 0.7);
    });
  }

  function startSession(){
    state.session = {
      build:'MERA_AUTHORED3D_ATTEMPT3',
      startedAt:new Date().toISOString(),
      route1:null,
      route2:null,
      finishedAt:null,
      notes:''
    };
  }

  function resetGame(){
    state.finished=false;
    state.route1=null;
    state.route2=null;
    state.crossedFirst=false;
    state.crossedSecond=false;
    choiceHint.textContent='Trail choice ahead';
    objectiveEl.textContent='Reach the outpost.';
    world.player.set(0, groundHeight(0,26)+0.02, 26);
    world.velocity.set(0,0,0);
    world.lastMoveDir.set(0,0,-1);
    state.camYaw=0; state.camPitch=0.42;
    startSession();
    updateRegion();
  }

  function downloadSession(){
    state.session.notes = notes.value.trim();
    const blob = new Blob([JSON.stringify(state.session,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mera_3d_session_${Date.now()}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 800);
  }

  function onResize(){
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  function buildScene(){
    makeSky();
    makeLights();
    terrainMesh = makeTerrain();
    scene.add(terrainMesh);

    const dirtTex = makeGroundTexture('#7b6650','#8e765b','#6a5644');
    const waterTex = makeWaterTexture();
    const barkTex = makeGroundTexture('#5e4733','#6d533c','#473625');
    const pathTex = makeGroundTexture('#8f7a62','#7c6854','#a28a70');

    addRiver(waterTex);
    addBridge();
    addPath(PATHS_2D.intro, 3.4, pathTex);
    addPath(PATHS_2D.bridge, 3.1, pathTex);
    addPath(PATHS_2D.ford, 3.2, pathTex);
    addPath(PATHS_2D.ridge, 2.8, pathTex);
    addPath(PATHS_2D.meadow, 3.0, pathTex);
    addFencesAndSigns();
    addOutpost();
    addWaterfall();
    addVegetation(barkTex);
    addRocks();
    addDeer();
    addTraveller();
  }

  function makeSky(){
    const geo = new THREE.SphereGeometry(220, 40, 20);
    const mat = new THREE.ShaderMaterial({
      side:THREE.BackSide,
      uniforms:{ top:{value:new THREE.Color(0x93b9d8)}, bottom:{value:new THREE.Color(0xe6e0c5)}, horizon:{value:new THREE.Color(0xc6d4d8)}},
      vertexShader:`varying vec3 vPos; void main(){vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`uniform vec3 top; uniform vec3 bottom; uniform vec3 horizon; varying vec3 vPos; void main(){ float h = normalize(vPos).y*0.5+0.5; vec3 c = mix(bottom,horizon,smoothstep(0.0,0.35,h)); c = mix(c,top,smoothstep(0.35,1.0,h)); gl_FragColor = vec4(c,1.0);}`
    });
    scene.add(new THREE.Mesh(geo, mat));
  }

  function makeLights(){
    const hemi = new THREE.HemisphereLight(0xd9edf9, 0x506247, 1.05);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff2db, 2.2);
    sun.position.set(-26, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-55;
    sun.shadow.camera.right=55;
    sun.shadow.camera.top=55;
    sun.shadow.camera.bottom=-55;
    sun.shadow.camera.near=5;
    sun.shadow.camera.far=130;
    sun.shadow.bias = -0.00015;
    scene.add(sun);

    const warm = new THREE.DirectionalLight(0xffddaa, 0.45);
    warm.position.set(18,10,34);
    scene.add(warm);
  }

  function groundHeight(x,z){
    const valley = -0.8*Math.exp(-(x*x)/110) * Math.exp(-((z-4)*(z-4))/500);
    const meadow = 0.55*Math.exp(-((x-11)*(x-11))/180 - ((z-2)*(z-2))/170);
    const westRise = 1.2*Math.exp(-((x+16)*(x+16))/130 - ((z+2)*(z+2))/300);
    const ridge = 2.2*Math.exp(-((x-9)*(x-9))/80 - ((z+29)*(z+29))/90);
    const mountainBack = 3.0*Math.exp(-((z+38)*(z+38))/170)*(0.35+0.65*Math.exp(-((x-5)*(x-5))/650));
    const mountainLeft = 2.6*Math.exp(-((x+18)*(x+18))/120 - ((z+18)*(z+18))/420);
    const noise = (Math.sin(x*0.38)+Math.sin(z*0.31))*0.09 + Math.sin((x+z)*0.17)*0.12;
    return valley + meadow + westRise + ridge + mountainBack + mountainLeft + noise;
  }

  function makeTerrain(){
    const g = new THREE.PlaneGeometry(86, 86, 170, 170);
    g.rotateX(-Math.PI/2);
    const pos = g.attributes.position;
    const colors = [];
    for(let i=0;i<pos.count;i++){
      const x = pos.getX(i), z = pos.getZ(i);
      const y = groundHeight(x,z);
      pos.setY(i,y);
      const slopeX = (groundHeight(x+0.2,z)-groundHeight(x-0.2,z))*2.5;
      const slopeZ = (groundHeight(x,z+0.2)-groundHeight(x,z-0.2))*2.5;
      const slope = Math.min(1, Math.sqrt(slopeX*slopeX+slopeZ*slopeZ));
      const h = y;
      let c = new THREE.Color(0x6d845a);
      if(h > 2.0) c.lerp(new THREE.Color(0x9ea0a4), 0.7);
      if(h > 3.2) c.lerp(new THREE.Color(0xe8edf3), 0.55);
      c.lerp(new THREE.Color(0x70796a), slope*0.35);
      if(Math.abs(x)<4 && z>10) c.lerp(new THREE.Color(0x748463),0.25);
      colors.push(c.r,c.g,c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const grassTex = makeGroundTexture('#78925f','#6b8157','#849e68');
    const m = new THREE.MeshStandardMaterial({map:grassTex, vertexColors:true, roughness:0.98, metalness:0});
    const mesh = new THREE.Mesh(g,m);
    mesh.receiveShadow = true;
    return mesh;
  }

  function makeGroundTexture(a,b,c){
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 256;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = a; ctx.fillRect(0,0,256,256);
    for(let i=0;i<1400;i++){
      const x=Math.random()*256, y=Math.random()*256, r=Math.random()*2.2+0.3;
      ctx.fillStyle = Math.random()>0.5?b:c;
      ctx.globalAlpha = Math.random()*0.45;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    for(let i=0;i<260;i++){
      ctx.strokeStyle = Math.random()>0.5?b:c;
      ctx.globalAlpha = .12;
      ctx.beginPath();
      const x=Math.random()*256, y=Math.random()*256;
      ctx.moveTo(x,y);
      ctx.lineTo(x+Math.random()*18-9, y+Math.random()*18-9);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10,10);
    tex.anisotropy = 8;
    return tex;
  }

  function makeWaterTexture(){
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 256;
    const ctx = cvs.getContext('2d');
    const grd = ctx.createLinearGradient(0,0,256,256);
    grd.addColorStop(0,'#5ca1b6'); grd.addColorStop(.5,'#6fc2cf'); grd.addColorStop(1,'#3e7f96');
    ctx.fillStyle = grd; ctx.fillRect(0,0,256,256);
    for(let i=0;i<500;i++){
      ctx.strokeStyle = `rgba(255,255,255,${Math.random()*0.2})`;
      ctx.beginPath();
      const x=Math.random()*256, y=Math.random()*256;
      ctx.moveTo(x,y); ctx.lineTo(x+Math.random()*14, y+Math.random()*5);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6,2);
    return tex;
  }

  function polyToVec(points){
    return points.map(([x,z]) => new THREE.Vector3(x, groundHeight(x,z)+0.08, z));
  }

  function makeStripGeometry(points, width){
    const curve = new THREE.CatmullRomCurve3(points);
    const steps = Math.max(40, points.length*16);
    const positions = [];
    const uvs = [];
    const indices = [];
    for(let i=0;i<=steps;i++){
      const t = i/steps;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const side = new THREE.Vector3(-tan.z,0,tan.x).normalize();
      const left = p.clone().addScaledVector(side, width/2);
      const right = p.clone().addScaledVector(side, -width/2);
      left.y = groundHeight(left.x,left.z)+0.05;
      right.y = groundHeight(right.x,right.z)+0.05;
      positions.push(left.x,left.y,left.z, right.x,right.y,right.z);
      uvs.push(0, t*6, 1, t*6);
      if(i<steps){
        const a=i*2,b=i*2+1,c=i*2+2,d=i*2+3;
        indices.push(a,b,c, b,d,c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }

  function addPath(points2d, width, tex){
    const pts = polyToVec(points2d);
    const g = makeStripGeometry(pts, width);
    const m = new THREE.MeshStandardMaterial({map:tex, roughness:1, metalness:0});
    const mesh = new THREE.Mesh(g,m);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addRiver(tex){
    const points = [[-26,12],[-18,11],[-11,9],[-4,7],[4,5],[12,2],[21,0],[28,-1]].map(([x,z])=> new THREE.Vector3(x, groundHeight(x,z)-0.18, z));
    const g = makeStripGeometry(points, 4.5);
    waterMaterial = new THREE.MeshStandardMaterial({map:tex, color:0xb7eef2, transparent:true, opacity:0.82, roughness:0.15, metalness:0.02});
    const river = new THREE.Mesh(g,waterMaterial);
    river.receiveShadow = true;
    river.position.y += 0.02;
    scene.add(river);

    // stones in ford
    const ford = [[10,6.2],[11,5.2],[12.2,4.1],[13,3.0],[12.2,2.1],[11.3,1.1]];
    ford.forEach(([x,z],i)=>{
      const rock = makeRock(0.45+((i%2)*0.1), 0x9b8b7a);
      rock.position.set(x, groundHeight(x,z)-0.05, z);
      scene.add(rock);
    });
  }

  function addWaterfall(){
    const g = new THREE.PlaneGeometry(4.2, 11.5, 1, 1);
    const tex = makeWaterTexture(); tex.repeat.set(1,4);
    waterfallMaterial = new THREE.MeshStandardMaterial({map:tex, color:0xe8fdff, transparent:true, opacity:.72, side:THREE.DoubleSide});
    const m = new THREE.Mesh(g, waterfallMaterial);
    m.position.set(-10.5, 8.5, -18.5);
    m.rotation.y = 0.2;
    scene.add(m);

    const cliff = new THREE.Mesh(new THREE.BoxGeometry(9,12,6), new THREE.MeshStandardMaterial({color:0x6d665f, roughness:1}));
    cliff.position.set(-10.5, 4.2, -21.8);
    cliff.castShadow = cliff.receiveShadow = true;
    scene.add(cliff);
  }

  function addBridge(){
    const bridge = new THREE.Group();
    const start = new THREE.Vector3(-8.6, groundHeight(-8.6,8.3)+0.18, 8.3);
    const end   = new THREE.Vector3(-10.6, groundHeight(-10.6,5.4)+0.18, 5.4);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    bridge.position.copy(mid);
    bridge.rotation.y = Math.atan2(dir.x, dir.z);

    const deckMat = new THREE.MeshStandardMaterial({color:0x8d6c4c, roughness:0.95});
    const railMat = new THREE.MeshStandardMaterial({color:0x755539, roughness:1});
    for(let i=0;i<13;i++){
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.5,0.1,0.34), deckMat);
      plank.position.set(0,0,(i/12-.5)*len);
      plank.castShadow = plank.receiveShadow = true;
      bridge.add(plank);
    }
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.85,len), railMat);
    beam1.position.set(1.05,0.45,0); beam1.castShadow = beam1.receiveShadow = true;
    const beam2 = beam1.clone(); beam2.position.x = -1.05;
    bridge.add(beam1,beam2);
    for(let i=0;i<6;i++){
      const z=(i/5-.5)*len;
      [-1.05,1.05].forEach(x=>{
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.78,0.16), railMat);
        post.position.set(x,0.35,z); post.castShadow = post.receiveShadow = true; bridge.add(post);
      });
    }
    scene.add(bridge);
  }

  function addFencesAndSigns(){
    // route posts
    [[2.4,13.6,0.2],[-2,11.6,-0.3],[7,-11,0.1],[-4,-15,0.4]].forEach(([x,z,r])=>{
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,1.2,6), new THREE.MeshStandardMaterial({color:0x6f5539, roughness:1}));
      post.position.y=0.6;
      post.castShadow = post.receiveShadow = true;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.12,0.22), new THREE.MeshStandardMaterial({color:0x7f6344, roughness:1}));
      plank.position.set(0.35,0.95,0); plank.rotation.z = 0.08;
      plank.castShadow = plank.receiveShadow = true;
      g.add(post,plank); g.position.set(x, groundHeight(x,z), z); g.rotation.y = r; scene.add(g);
    });

    // MERA sign with text texture
    const signGroup = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.18,4.6,8), new THREE.MeshStandardMaterial({color:0x5b4330, roughness:1}));
    pole.position.y = 2.3; pole.castShadow = pole.receiveShadow = true;
    signGroup.add(pole);
    const signTex = makeSignTexture();
    const board = new THREE.Mesh(new THREE.BoxGeometry(3.4,2.6,0.26), [
      new THREE.MeshStandardMaterial({color:0x5d4632}),
      new THREE.MeshStandardMaterial({color:0x5d4632}),
      new THREE.MeshStandardMaterial({color:0x5d4632}),
      new THREE.MeshStandardMaterial({color:0x5d4632}),
      new THREE.MeshStandardMaterial({map:signTex, roughness:1}),
      new THREE.MeshStandardMaterial({color:0x5d4632})
    ]);
    board.position.set(1.2, 3.55, 0);
    board.rotation.y = Math.PI*0.5;
    board.castShadow = board.receiveShadow = true;
    signGroup.add(board);
    signGroup.position.set(-19.8, groundHeight(-19.8,13.6), 13.6);
    signGroup.rotation.y = 0.35;
    merSign = signGroup;
    scene.add(signGroup);

    // short fence beyond bridge
    [[-13.2,0.8,5,3.5],[9.5,6.2,2.9,4.2]].forEach(([x,z,rot,len])=>{
      const group = new THREE.Group();
      for(let i=0;i<4;i++){
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.9,0.14), new THREE.MeshStandardMaterial({color:0x74583c, roughness:1}));
        post.position.set(0,0.45,(i/3-.5)*len); post.castShadow = post.receiveShadow = true; group.add(post);
      }
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,len), new THREE.MeshStandardMaterial({color:0x816345, roughness:1}));
      rail1.position.set(0,0.62,0); rail1.castShadow = rail1.receiveShadow = true;
      const rail2 = rail1.clone(); rail2.position.y = 0.35;
      group.add(rail1,rail2);
      group.position.set(x,groundHeight(x,z),z); group.rotation.y = rot;
      scene.add(group);
    });
  }

  function makeSignTexture(){
    const c = document.createElement('canvas'); c.width=512; c.height=384;
    const ctx = c.getContext('2d');
    ctx.fillStyle='#4c3628'; ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<1600;i++){
      ctx.fillStyle = Math.random()>0.5 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.05)';
      ctx.fillRect(Math.random()*512, Math.random()*384, Math.random()*8+1, Math.random()*2+1);
    }
    ctx.fillStyle='#e5cda7';
    ctx.font='700 64px Georgia, serif';
    ctx.fillText('MERA', 110, 90);
    ctx.strokeStyle='#e5cda7'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.moveTo(114,40); ctx.lineTo(140,14); ctx.lineTo(165,40); ctx.moveTo(156,40); ctx.lineTo(180,12); ctx.lineTo(204,40); ctx.stroke();
    ctx.font='600 38px Georgia, serif';
    ctx.fillText('Rivermere  →', 62, 180);
    ctx.fillText('Pinewood   →', 62, 245);
    ctx.fillText('Eastfall   →', 62, 310);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function addOutpost(){
    outpostGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({color:0x8a8682, roughness:1});
    const tower = new THREE.Mesh(new THREE.BoxGeometry(4.2,4.8,4.2), stoneMat);
    tower.position.set(0,2.4,0); tower.castShadow = tower.receiveShadow = true; outpostGroup.add(tower);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(2.4,5.4,2.4), stoneMat);
    keep.position.set(2.4,2.7,-1.2); keep.castShadow = keep.receiveShadow = true; outpostGroup.add(keep);
    for(let i=0;i<4;i++){
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,0.6), stoneMat);
      merlon.position.set(-1.4 + i*0.95, 5.05, 1.8); merlon.castShadow = merlon.receiveShadow = true; outpostGroup.add(merlon);
    }
    for(let i=0;i<3;i++){
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.45,0.5), stoneMat);
      merlon.position.set(2.4, 5.65, -2 + i*1.0); merlon.castShadow = merlon.receiveShadow = true; outpostGroup.add(merlon);
    }
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.7,0.25), new THREE.MeshStandardMaterial({color:0x4e3523, roughness:1}));
    gate.position.set(-0.2,0.85,2.13); gate.castShadow = gate.receiveShadow = true; outpostGroup.add(gate);
    const cliffBase = new THREE.Mesh(new THREE.CylinderGeometry(5.2,7.4,5.2,7), new THREE.MeshStandardMaterial({color:0x6e665f, roughness:1}));
    cliffBase.position.set(0, -0.1, 0.4); cliffBase.castShadow = cliffBase.receiveShadow = true; outpostGroup.add(cliffBase);
    outpostGroup.position.set(9.5, groundHeight(9.5,-31)+1.7, -31);
    outpostGroup.rotation.y = -0.35;
    scene.add(outpostGroup);
  }

  function addVegetation(barkTex){
    // distant mountains
    for(let i=0;i<10;i++){
      const x = -28 + i*6.4;
      const h = 6 + Math.sin(i*0.8)*2 + (i>5?2:0);
      const peak = makeMountain(h, i%2?0x8a97a1:0x95a2ac);
      peak.position.set(x, groundHeight(x,-39)-0.4, -39 + Math.random()*2);
      peak.scale.set(1.2+Math.random()*0.55,1,1.5+Math.random()*0.4);
      scene.add(peak);
    }

    // tree placement guided by clear corridors
    const spots = [];
    for(let x=-30;x<=30;x+=2.7){
      for(let z=-34;z<=30;z+=2.7){
        if(Math.random() > 0.32) continue;
        if(isNearAnyPath(x,z, 3.0)) continue;
        if(Math.hypot(x+19.8,z-13.6)<3.6) continue;
        spots.push([x,z]);
      }
    }
    spots.forEach(([x,z],i)=>{
      const t = (i%4===0 || z<-15) ? makePineTree() : (i%5===0 ? makeBroadTree() : makePineTree());
      const s = 0.8 + Math.random()*0.9;
      t.scale.setScalar(s);
      t.position.set(x, groundHeight(x,z), z);
      t.rotation.y = Math.random()*Math.PI*2;
      scene.add(t);
      blockers.push({x,z,r:1.0*s + 0.4});
    });

    // grass patches near routes and meadows
    for(let i=0;i<540;i++){
      let x = (Math.random()-0.5)*54;
      let z = (Math.random()-0.5)*62 - 2;
      if(!isNearAnyPath(x,z, 6.0) && Math.random() > 0.12) continue;
      if(Math.random() > 0.65 && isNearAnyPath(x,z, 1.4)) continue;
      const patch = makeGrassPatch();
      patch.position.set(x, groundHeight(x,z)+0.02, z);
      patch.rotation.y = Math.random()*Math.PI;
      const s = 0.65 + Math.random()*0.95;
      patch.scale.setScalar(s);
      scene.add(patch);
      grassPatches.push(patch);
    }

    // flowers/reeds along river
    for(let i=0;i<130;i++){
      const x = -18 + Math.random()*42;
      const z = 10 - x*0.18 + (Math.random()*4-2);
      const patch = makeFlowerPatch(i%5===0);
      patch.position.set(x, groundHeight(x,z)+0.03, z);
      patch.rotation.y = Math.random()*Math.PI;
      scene.add(patch);
    }
  }

  function makeGrassPatch(){
    const tex = grassTexture();
    const group = new THREE.Group();
    for(let i=0;i<3;i++){
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.8,1.25), new THREE.MeshStandardMaterial({map:tex, alphaMap:tex, transparent:true, side:THREE.DoubleSide, color:0xf0fff0, roughness:1}));
      plane.position.y = 0.55;
      plane.rotation.y = i*Math.PI/3;
      group.add(plane);
    }
    return group;
  }

  let _grassTex;
  function grassTexture(){
    if(_grassTex) return _grassTex;
    const c = document.createElement('canvas'); c.width=128; c.height=256;
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,128,256);
    for(let i=0;i<48;i++){
      ctx.strokeStyle = i%6===0 ? 'rgba(228,235,165,.95)' : (i%3===0 ? 'rgba(110,150,72,.95)' : 'rgba(74,112,50,.95)');
      ctx.lineWidth = 1 + Math.random()*2;
      ctx.beginPath();
      const x=14+Math.random()*100, y=250;
      ctx.moveTo(x,y);
      ctx.quadraticCurveTo(x+Math.random()*18-9, 140+Math.random()*55, x+Math.random()*22-11, 26+Math.random()*45);
      ctx.stroke();
    }
    _grassTex = new THREE.CanvasTexture(c);
    _grassTex.colorSpace = THREE.SRGBColorSpace;
    return _grassTex;
  }

  function makeFlowerPatch(withFlowers){
    const g = makeGrassPatch();
    if(withFlowers){
      for(let i=0;i<4;i++){
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.06,6,6), new THREE.MeshStandardMaterial({color:0xffffff, roughness:1}));
        f.position.set((Math.random()-0.5)*0.5, 0.85+Math.random()*0.25, (Math.random()-0.5)*0.5);
        g.add(f);
        const y = new THREE.Mesh(new THREE.SphereGeometry(0.02,4,4), new THREE.MeshStandardMaterial({color:0xf4d768, roughness:1}));
        y.position.copy(f.position); g.add(y);
      }
    }
    return g;
  }

  function makePineTree(){
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,2.5,8), new THREE.MeshStandardMaterial({color:0x5b4632, roughness:1}));
    trunk.position.y = 1.25; trunk.castShadow = trunk.receiveShadow = true; g.add(trunk);
    const colors = [0x355c38,0x2b5030,0x416845];
    [[1.55,0.95],[2.35,0.75],[3.1,0.5]].forEach(([y,s],i)=>{
      const fol = new THREE.Mesh(new THREE.ConeGeometry(1.2*s, 2.2*s, 8), new THREE.MeshStandardMaterial({color:colors[i], roughness:1}));
      fol.position.y = y+1.2; fol.castShadow = fol.receiveShadow = true; g.add(fol);
    });
    return g;
  }

  function makeBroadTree(){
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,2.6,8), new THREE.MeshStandardMaterial({color:0x65503a, roughness:1}));
    trunk.position.y = 1.3; trunk.castShadow = trunk.receiveShadow = true; g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({color:0x4f6f3d, roughness:1});
    [[0,0,0,1.1],[0.55,0.35,0.2,0.9],[-0.45,0.45,-0.1,0.85],[0.1,0.75,-0.35,0.82]].forEach(([x,y,z,s])=>{
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0*s, 1), leafMat);
      leaf.position.set(x, 2.8+y, z); leaf.castShadow = leaf.receiveShadow = true; g.add(leaf);
    });
    return g;
  }

  function addRocks(){
    const placements = [];
    for(let i=0;i<180;i++){
      const x=(Math.random()-0.5)*56, z=(Math.random()-0.5)*62-2;
      if(isNearAnyPath(x,z, 1.9)) continue;
      if(Math.random()>0.34 && z>-6) continue;
      placements.push([x,z]);
    }
    placements.forEach(([x,z])=>{
      const r = makeRock(0.45+Math.random()*1.2, Math.random()>0.5?0x8d877f:0x74706c);
      r.position.set(x, groundHeight(x,z), z);
      scene.add(r);
      blockers.push({x,z,r:0.5});
    });
  }

  function makeRock(scale, color){
    const g = new THREE.IcosahedronGeometry(1, 1);
    const pos = g.attributes.position;
    for(let i=0;i<pos.count;i++){
      pos.setXYZ(i,
        pos.getX(i)*(0.85+Math.random()*0.3),
        pos.getY(i)*(0.7+Math.random()*0.45),
        pos.getZ(i)*(0.85+Math.random()*0.3)
      );
    }
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({color, roughness:1});
    const mesh = new THREE.Mesh(g,m);
    mesh.scale.set(scale, scale*0.75, scale*0.9);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }

  function makeMountain(h,color){
    const g = new THREE.ConeGeometry(4.6, h, 7, 3, true);
    g.translate(0,h/2,0);
    const pos = g.attributes.position;
    const cols=[];
    for(let i=0;i<pos.count;i++){
      const y = pos.getY(i);
      const c = new THREE.Color(color);
      if(y > h*0.58) c.lerp(new THREE.Color(0xf4f7fb), 0.75);
      cols.push(c.r,c.g,c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols,3));
    const m = new THREE.MeshStandardMaterial({vertexColors:true, roughness:1, side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(g,m);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }

  function addDeer(){
    [[16,5,Math.PI*0.8],[19,2.5,Math.PI*0.95]].forEach(([x,z,rot],i)=>{
      const d = makeDeer(i===0);
      d.position.set(x, groundHeight(x,z)+0.05, z);
      d.rotation.y = rot;
      scene.add(d);
      deerActors.push(d);
    });
  }

  function makeDeer(withAntlers){
    const g = new THREE.Group();
    const fur = new THREE.MeshStandardMaterial({color:0x8a5c36, roughness:1});
    const dark = new THREE.MeshStandardMaterial({color:0x5a3c23, roughness:1});
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.8,0.52), fur); body.position.y=.95; body.castShadow=body.receiveShadow=true; g.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.34,0.68,0.28), fur); neck.position.set(.72,1.25,0); neck.rotation.z=-0.42; neck.castShadow=neck.receiveShadow=true; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.58,0.35,0.23), fur); head.position.set(1.1,1.55,0); head.rotation.z=0.12; head.castShadow=head.receiveShadow=true; g.add(head);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.08,0.18), dark); nose.position.set(1.39,1.5,0); g.add(nose);
    for(let lx of [-0.45,-0.1,0.3,0.62]){
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.9,0.12), dark); leg.position.set(lx,0.45,0); leg.castShadow=leg.receiveShadow=true; g.add(leg);
    }
    if(withAntlers){
      for(let s of [-1,1]){
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.04,0.6,5), new THREE.MeshStandardMaterial({color:0xbfa37c, roughness:1}));
        ant.position.set(0.98,1.92,0.06*s); ant.rotation.z=-0.2*s; ant.rotation.x=-0.15; g.add(ant);
        const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.03,0.25,4), ant.material); tine.position.set(1.08,2.08,0.11*s); tine.rotation.z=0.45*s; g.add(tine);
      }
    }
    return g;
  }

  function addTraveller(){
    traveller = new THREE.Group();
    const jacket = new THREE.MeshStandardMaterial({color:0x57583c, roughness:1});
    const cloth = new THREE.MeshStandardMaterial({color:0x3a3b34, roughness:1});
    const skin = new THREE.MeshStandardMaterial({color:0xd2b59b, roughness:1});
    const leather = new THREE.MeshStandardMaterial({color:0x6b523b, roughness:1});
    const bootMat = new THREE.MeshStandardMaterial({color:0x4d3727, roughness:1});
    const hair = new THREE.MeshStandardMaterial({color:0x4e372d, roughness:1});

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.62,1.45,12), jacket);
    body.position.y=1.55; body.castShadow=body.receiveShadow=true; traveller.add(body);
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.28,0.07,8,18), new THREE.MeshStandardMaterial({color:0x6b6e5a, roughness:1}));
    hood.position.set(0,2.12,0.05); hood.rotation.x=Math.PI/2; traveller.add(hood);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22,18,16), skin); head.position.set(0,2.34,-0.02); head.castShadow=head.receiveShadow=true; traveller.add(head);
    const haircap = new THREE.Mesh(new THREE.SphereGeometry(0.23,14,12,0,Math.PI*2,0,Math.PI/2), hair); haircap.position.set(0,2.4,-0.02); traveller.add(haircap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09,10,10), hair); bun.position.set(0,2.43,0.19); traveller.add(bun);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.7,0.25), leather); backpack.position.set(0,1.63,0.38); backpack.castShadow=backpack.receiveShadow=true; traveller.add(backpack);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.36,0.15,0.1), new THREE.MeshStandardMaterial({color:0x755b41, roughness:1})); flap.position.set(0,1.85,0.55); traveller.add(flap);

    const armL = new THREE.Group(), armR = new THREE.Group();
    armL.position.set(-0.48,2.0,0); armR.position.set(0.48,2.0,0);
    const upperGeom = new THREE.CylinderGeometry(0.10,0.11,0.62,8);
    const lowerGeom = new THREE.CylinderGeometry(0.08,0.09,0.56,8);
    const handGeom = new THREE.SphereGeometry(0.08,8,8);
    const upperL = new THREE.Mesh(upperGeom, jacket), lowerL = new THREE.Mesh(lowerGeom, skin), handL = new THREE.Mesh(handGeom, skin);
    upperL.position.y=-0.31; lowerL.position.y=-0.83; handL.position.y=-1.12;
    upperL.castShadow=lowerL.castShadow=handL.castShadow=true;
    armL.add(upperL,lowerL,handL);
    const upperR = upperL.clone(), lowerR = lowerL.clone(), handR = handL.clone();
    armR.add(upperR,lowerR,handR);
    traveller.add(armL,armR);
    traveller.userData.arms=[armL,armR];

    const hip = new THREE.Group(); hip.position.y=0.92; traveller.add(hip);
    const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.x=-0.18; legR.position.x=0.18;
    const thighGeom = new THREE.CylinderGeometry(0.12,0.14,0.74,9);
    const calfGeom = new THREE.CylinderGeometry(0.10,0.11,0.72,9);
    const bootGeom = new THREE.BoxGeometry(0.18,0.12,0.36);
    function buildLeg(group){
      const thigh = new THREE.Mesh(thighGeom, cloth); thigh.position.y=-0.37;
      const calf = new THREE.Mesh(calfGeom, cloth); calf.position.y=-0.95;
      const boot = new THREE.Mesh(bootGeom, bootMat); boot.position.set(0,-1.33,0.08);
      thigh.castShadow=calf.castShadow=boot.castShadow=true;
      group.add(thigh,calf,boot);
    }
    buildLeg(legL); buildLeg(legR); hip.add(legL,legR);
    traveller.userData.legs=[legL,legR];

    traveller.position.copy(world.player);
    traveller.castShadow = true;
    scene.add(traveller);
  }

  function isNearAnyPath(x,z, extra){
    const all = Object.keys(PATHS_2D);
    for(const key of all){
      if(distanceToPolyline2D(x,z, PATHS_2D[key]) < ROUTE_WIDTH[key] + extra) return true;
    }
    return false;
  }

  function distanceToPolyline2D(x,z, points){
    let best = 1e9;
    for(let i=0;i<points.length-1;i++){
      const [x1,z1] = points[i];
      const [x2,z2] = points[i+1];
      const vx=x2-x1, vz=z2-z1;
      const wx=x-x1, wz=z-z1;
      const t = clamp((wx*vx + wz*vz) / (vx*vx + vz*vz), 0, 1);
      const px = x1 + vx*t, pz = z1 + vz*t;
      best = Math.min(best, Math.hypot(x-px,z-pz));
    }
    return best;
  }

  function currentAllowedPaths(){
    const keys=['intro'];
    if(state.route1){ keys.push(state.route1); } else { keys.push('bridge','ford'); }
    if(state.route2){ keys.push(state.route2); } else if(world.player.z < -10.5) { keys.push('ridge','meadow'); }
    return keys;
  }

  function insidePlayable(x,z){
    const keys = currentAllowedPaths();
    let min = 1e9;
    for(const k of keys){
      min = Math.min(min, distanceToPolyline2D(x,z, PATHS_2D[k]) - ROUTE_WIDTH[k]);
    }
    // small clearings around start and end
    if(Math.hypot(x, z-26)<4.5) return true;
    if(Math.hypot(x-9.2, z+31)<5.2) return true;
    return min <= 0;
  }

  function update(dt){
    if(!state.running || state.finished) return;

    const move = new THREE.Vector3();
    const camForward = new THREE.Vector3(Math.sin(state.camYaw),0,-Math.cos(state.camYaw));
    const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0,1,0)).negate();
    if(state.keys['KeyW'] || state.keys['ArrowUp']) move.add(camForward);
    if(state.keys['KeyS'] || state.keys['ArrowDown']) move.addScaledVector(camForward, -1);
    if(state.keys['KeyA'] || state.keys['ArrowLeft']) move.addScaledVector(camRight, -1);
    if(state.keys['KeyD'] || state.keys['ArrowRight']) move.add(camRight);
    const running = state.keys['ShiftLeft'] || state.keys['ShiftRight'];
    const speed = running ? 5.8 : 3.45;
    if(move.lengthSq()>0){
      move.normalize().multiplyScalar(speed*dt);
      world.lastMoveDir.lerp(move.clone().normalize(), 0.18);
      const tryPos = world.player.clone().add(move);
      if(insidePlayable(tryPos.x, tryPos.z) && !collidesBlocker(tryPos.x, tryPos.z)){
        world.player.copy(tryPos);
      } else {
        const tryX = world.player.clone().add(new THREE.Vector3(move.x,0,0));
        const tryZ = world.player.clone().add(new THREE.Vector3(0,0,move.z));
        if(insidePlayable(tryX.x, tryX.z) && !collidesBlocker(tryX.x, tryX.z)) world.player.copy(tryX);
        if(insidePlayable(tryZ.x, tryZ.z) && !collidesBlocker(tryZ.x, tryZ.z)) world.player.copy(tryZ);
      }
    }
    world.player.y = groundHeight(world.player.x, world.player.z)+0.02;

    detectChoices();
    updateRegion();
    animateTraveller(clock.getElapsedTime(), move.lengthSq()>0);
    updateCamera(dt);
    updateAtmosphere(clock.getElapsedTime());
    if(Math.hypot(world.player.x-9.2, world.player.z+31) < 2.4) completeRun();
  }

  function collidesBlocker(x,z){
    for(const b of blockers){
      if(Math.hypot(x-b.x, z-b.z) < b.r) return true;
    }
    return false;
  }

  function detectChoices(){
    if(!state.route1 && world.player.z < 11.2){
      if(world.player.x < -2.8){ state.route1='bridge'; state.session.route1='bridge'; choiceHint.textContent='Bridge route chosen'; }
      else if(world.player.x > 2.8){ state.route1='ford'; state.session.route1='ford'; choiceHint.textContent='Ford route chosen'; }
      else choiceHint.textContent='Choose bridge or ford';
    }
    if(!state.route2 && world.player.z < -15.0){
      if(world.player.x > 1.6){ state.route2='ridge'; state.session.route2='ridge'; choiceHint.textContent='Ridge ascent chosen'; }
      else if(world.player.x < -1.6){ state.route2='meadow'; state.session.route2='meadow'; choiceHint.textContent='Meadow curve chosen'; }
      else choiceHint.textContent='Choose upper trail';
    }
    if(state.route1 && state.route2) choiceHint.textContent='Outpost ahead';
  }

  function updateRegion(){
    const z = world.player.z, x = world.player.x;
    if(z > 14) regionEl.textContent = 'Southern trail';
    else if(z > 7) regionEl.textContent = 'Stream approach';
    else if(z > -8) regionEl.textContent = state.route1 === 'ford' ? 'Eastern meadow route' : state.route1 === 'bridge' ? 'Western bridge route' : 'Crossing routes';
    else if(z > -20) regionEl.textContent = state.route2 === 'ridge' ? 'Ridge ascent' : state.route2 === 'meadow' ? 'Meadow curve' : 'Upper trail';
    else regionEl.textContent = 'Northern outpost';
  }

  function animateTraveller(t, moving){
    traveller.position.copy(world.player);
    const ang = Math.atan2(world.lastMoveDir.x, world.lastMoveDir.z);
    traveller.rotation.y = ang + Math.PI;
    if(moving){
      const swing = Math.sin(t*7.5)*0.55;
      traveller.userData.arms[0].rotation.x = swing*0.6;
      traveller.userData.arms[1].rotation.x = -swing*0.6;
      traveller.userData.legs[0].rotation.x = -swing*0.7;
      traveller.userData.legs[1].rotation.x = swing*0.7;
      traveller.position.y += Math.abs(Math.sin(t*15))*0.03;
    } else {
      traveller.userData.arms[0].rotation.x *= 0.75;
      traveller.userData.arms[1].rotation.x *= 0.75;
      traveller.userData.legs[0].rotation.x *= 0.75;
      traveller.userData.legs[1].rotation.x *= 0.75;
    }
  }

  function updateCamera(dt){
    const dir = world.lastMoveDir.clone().normalize();
    if(dir.lengthSq() === 0) dir.set(0,0,-1);
    const yaw = state.camYaw;
    const back = new THREE.Vector3(-Math.sin(yaw),0,Math.cos(yaw));
    const side = new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));
    const offset = back.multiplyScalar(6.5).addScaledVector(side, 1.2).setY(3.2 + state.camPitch*2.1);
    followTarget.copy(world.player).add(offset);
    camera.position.lerp(followTarget, 1-Math.exp(-dt*4.3));
    const lookAt = world.player.clone().add(new THREE.Vector3(0,1.75,0)).addScaledVector(dir, 1.6);
    camera.lookAt(lookAt);
  }

  function updateAtmosphere(t){
    if(waterMaterial && waterMaterial.map){
      waterMaterial.map.offset.x = t*0.025;
      waterMaterial.map.offset.y = t*0.01;
    }
    if(waterfallMaterial && waterfallMaterial.map){
      waterfallMaterial.map.offset.y = -(t*0.16 % 1);
    }
    deerActors.forEach((d,i)=>{
      d.children[1].rotation.z = -0.42 + Math.sin(t*1.25 + i)*0.08;
    });
    grassPatches.forEach((g,i)=>{ g.rotation.z = Math.sin(t*1.6 + i)*0.012; });
  }

  function completeRun(){
    if(state.finished) return;
    state.finished = true;
    state.running = false;
    state.session.finishedAt = new Date().toISOString();
    finish.classList.remove('hidden');
    hud.classList.add('hidden');
  }

  function animate(){
    requestAnimationFrame(animate);
    const dt = Math.min(0.033, clock.getDelta());
    update(dt);
    renderer.render(scene,camera);
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
})();
