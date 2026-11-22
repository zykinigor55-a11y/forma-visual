// FORMA AI / V24 — REAL MÖBIUS KINETIC HERO
// One continuous, thickened, half-twisted infinity-shaped titanium ribbon.
// Actual 3D geometry, independently animated mechanical details and studio lighting.
// Static artwork remains as a fallback for unsupported, data-saving or context-lost devices.
(async () => {
  const hero = document.getElementById('hero');
  const art = hero?.querySelector('.hero-art');
  const canvas = document.getElementById('hero-three-canvas');
  if (!hero || !art || !canvas || !window.WebGLRenderingContext) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = matchMedia('(max-width: 900px)');
  if (navigator.connection?.saveData) return;

  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (error) {
    console.info('FORMA AI: 3D library unavailable, using approved image', error);
    return;
  }

  const isMobile = () => mobileQuery.matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: !isMobile(), depth: true,
      stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false
    });
  } catch (error) {
    console.info('FORMA AI: WebGL unavailable, using approved image', error);
    return;
  }
  renderer.setClearColor(0x06080a, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 16/9, .1, 45);
  const sculpture = new THREE.Group();
  scene.add(sculpture);

  const ambient = new THREE.HemisphereLight(0xd3dfed, 0x11151b, 1.45);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xe1eaf1, 3.0);
  key.position.set(-4.5, 4.2, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6b879b, 1.6);
  fill.position.set(2.0, -3.2, -5.5);
  scene.add(fill);
  const sweep = new THREE.DirectionalLight(0xf3f5f5, 1.35);
  sweep.position.set(5.0, 1.4, 6.0);
  scene.add(sweep);
  const amber = new THREE.PointLight(0xe6a164, 2.1, 5.8);
  amber.position.set(1.3, -.6, 1.1);
  scene.add(amber);

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), .055);
    scene.environment = env.texture;
    pmrem.dispose();
  } catch (e) { /* physically lit without an environment on constrained devices */ }

  // Brushed roughness tracks follow the length of the ribbon, not the viewport.
  const brush = document.createElement('canvas');
  brush.width = 256; brush.height = 128;
  const ctx = brush.getContext('2d');
  if (ctx) {
    for (let y=0;y<brush.height;y++) {
      const v = Math.max(85, Math.min(232, Math.round(
        180+22*Math.sin(y*.72)+10*Math.sin(y*2.31)+8*Math.sin(y*.12)
      )));
      ctx.fillStyle = 'rgb('+v+','+v+','+v+')';
      ctx.fillRect(0,y,brush.width,1);
    }
  }
  const brushed = new THREE.CanvasTexture(brush);
  brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;
  brushed.repeat.set(5,1);
  brushed.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy());

  const titanium = new THREE.MeshPhysicalMaterial({
    color:0xaeb8c0, metalness:.97, roughness:.35, roughnessMap:brushed,
    clearcoat:.10, clearcoatRoughness:.31, envMapIntensity:1.6,
    side:THREE.DoubleSide
  });
  const blackTitanium = new THREE.MeshPhysicalMaterial({
    color:0x3e4650, metalness:.98, roughness:.28,
    envMapIntensity:1.4, side:THREE.DoubleSide
  });
  const polished = new THREE.MeshStandardMaterial({
    color:0xb9c3ca, metalness:.92, roughness:.20
  });
  const smokedGold = new THREE.MeshStandardMaterial({
    color:0xa97a4d, metalness:.86, roughness:.28
  });
  const amberPulseMaterial = new THREE.MeshBasicMaterial({
    color:0xf3b476, transparent:true, opacity:.48,
    depthWrite:false, blending:THREE.AdditiveBlending
  });

  // Planar figure-eight centreline with a small controlled depth offset at the crossover.
  // The transverse frame rotates PI across the full orbit: a true half-twist.
  const TAU = 2*Math.PI;
  const bandWidth=.46, bandThickness=.041, ringSteps=isMobile()?220:320, sides=20;
  const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
  function frameAt(t) {
    const c=v3(2.32*Math.sin(t),1.11*Math.sin(2*t),.38*Math.cos(t));
    const tangent=v3(2.32*Math.cos(t),2.22*Math.cos(2*t),-.38*Math.sin(t)).normalize();
    const side=v3(-tangent.y,tangent.x,0).normalize();
    const normal=new THREE.Vector3().crossVectors(tangent,side).normalize();
    const ct=Math.cos(t/2),st=Math.sin(t/2);
    const across=side.clone().multiplyScalar(ct).addScaledVector(normal,st);
    const depth=side.clone().multiplyScalar(-st).addScaledVector(normal,ct);
    return {c,tangent,across,depth};
  }
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<ringSteps;i++){
    const t=TAU*i/ringSteps, f=frameAt(t);
    for(let j=0;j<sides;j++){
      const angle=TAU*j/sides,ca=Math.cos(angle),sa=Math.sin(angle);
      const w=bandWidth*Math.sign(ca)*Math.pow(Math.abs(ca),.68);
      const h=bandThickness*Math.sign(sa)*Math.pow(Math.abs(sa),.68);
      const p=f.c.clone().addScaledVector(f.across,w).addScaledVector(f.depth,h);
      positions.push(p.x,p.y,p.z);
      uvs.push(i/ringSteps*5,j/sides);
    }
  }
  // The Möbius seam attaches the last cross-section with a 180° index offset.
  for(let i=0;i<ringSteps;i++){
    const next=(i+1)%ringSteps,shift=i===ringSteps-1?sides/2:0;
    for(let j=0;j<sides;j++){
      const j1=(j+1)%sides;
      const a=i*sides+j, b=i*sides+j1;
      const c=next*sides+(j+shift)%sides;
      const d=next*sides+(j1+shift)%sides;
      indices.push(a,c,b,b,c,d);
    }
  }
  const bandGeo=new THREE.BufferGeometry();
  bandGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  bandGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  bandGeo.setIndex(indices);
  bandGeo.computeVertexNormals();
  const band=new THREE.Mesh(bandGeo,titanium);
  sculpture.add(band);

  // One Möbius surface has one continuous physical boundary (two orbits).
  function rimCurve(offset) {
    const pts=[];
    for(let i=0;i<600;i++){
      const t=TAU*2*i/600, f=frameAt(t);
      pts.push(f.c.clone().addScaledVector(f.across,bandWidth+offset)
        .addScaledVector(f.depth,.009));
    }
    return new THREE.CatmullRomCurve3(pts,true);
  }
  const rim=new THREE.Mesh(new THREE.TubeGeometry(rimCurve(.001),680,.013,6,true),polished);
  sculpture.add(rim);
  const inlay=new THREE.Mesh(new THREE.TubeGeometry(rimCurve(-.055),680,.004,5,true),smokedGold);
  sculpture.add(inlay);

  // Small rivets and fitted mechanical inserts sit on the real ribbon geometry.
  const pinGeo=new THREE.SphereGeometry(.024,8,6);
  const pinMat=new THREE.MeshStandardMaterial({color:0x26313b,metalness:.94,roughness:.25});
  const pins=new THREE.InstancedMesh(pinGeo,pinMat,isMobile()?32:64);
  const dummy=new THREE.Object3D(),pinCount=pins.count;
  for(let i=0;i<pinCount;i++){
    const t=TAU*i/pinCount;
    const f=frameAt(t), side=i%2?1:-1;
    dummy.position.copy(f.c).addScaledVector(f.across,side*bandWidth*.89)
      .addScaledVector(f.depth,bandThickness+.008);
    dummy.scale.setScalar(i%4===0?1.18:.85);
    dummy.updateMatrix();pins.setMatrixAt(i,dummy.matrix);
  }
  pins.instanceMatrix.needsUpdate=true;sculpture.add(pins);

  // Independent heart mechanism, built from small mechanical rings and radial spokes.
  const mechanism=new THREE.Group();
  mechanism.position.set(0,0,.49);sculpture.add(mechanism);
  const coreRotor=new THREE.Group();mechanism.add(coreRotor);
  for(const [radius,tube,material] of [
    [.38,.045,blackTitanium],[.29,.017,polished],[.21,.014,smokedGold]
  ]){
    coreRotor.add(new THREE.Mesh(new THREE.TorusGeometry(radius,tube,9,64),material));
  }
  const spokeGeo=new THREE.BoxGeometry(.51,.023,.035);
  for(let i=0;i<8;i++){
    const spoke=new THREE.Mesh(spokeGeo,i%2===0?polished:blackTitanium);
    spoke.rotation.z=i*Math.PI/4;
    coreRotor.add(spoke);
  }
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.11,32),smokedGold);
  hub.rotation.x=Math.PI/2;coreRotor.add(hub);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.074,16,12),
    new THREE.MeshPhysicalMaterial({color:0xaeb7be,metalness:.65,roughness:.13,clearcoat:.6}));
  lens.position.z=.079;coreRotor.add(lens);

  const sideGears=[];
  for(const [x,y,z,scale] of [[-1.68,.63,.34,.70],[1.74,-.62,.24,.85]]){
    const group=new THREE.Group();
    group.position.set(x,y,z);group.scale.setScalar(scale);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.20,.035,8,40),blackTitanium);group.add(ring);
    const axle=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.08,16),smokedGold);
    axle.rotation.x=Math.PI/2;group.add(axle);
    for(let j=0;j<12;j++){
      const tooth=new THREE.Mesh(new THREE.BoxGeometry(.075,.065,.045),polished);
      const t=TAU*j/12;tooth.position.set(.22*Math.cos(t),.22*Math.sin(t),0);
      tooth.rotation.z=t;group.add(tooth);
    }
    sculpture.add(group);sideGears.push(group);
  }

  const traces=[];
  for(let i=0;i<3;i++){
    const trace=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),amberPulseMaterial.clone());
    sculpture.add(trace);traces.push(trace);
  }
  const baseFog=new THREE.Group();
  const glowMaterial=new THREE.MeshBasicMaterial({
    color:0x9b7255,transparent:true,opacity:.07,depthWrite:false,
    blending:THREE.AdditiveBlending
  });
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(5.6,.6),glowMaterial);
  glow.position.set(0,-1.7,-.7);
  baseFog.add(glow);sculpture.add(baseFog);

  let active=true, visible=false,frameId=0,last=0,lastPaint=0,time=0;
  let px=0,py=0,targetX=0,targetY=0;
  const duration=18;
  const frameInterval=isMobile()?1000/24:1000/30;
  function setupSize(){
    if(!active)return;
    const rect=art.getBoundingClientRect();
    if(rect.width<2||rect.height<2)return;
    const aspect=rect.width/rect.height;
    camera.aspect=aspect;
    camera.fov=33;
    camera.position.set(0,.10,isMobile()?8.5:9.4);
    camera.lookAt(0,0,0);
    camera.updateProjectionMatrix();
    sculpture.position.set(isMobile()?0:1.18,.07,0);
    const dpr=Math.min(devicePixelRatio||1,isMobile()?1.15:1.5);
    const maxPixels=isMobile()?750000:1800000;
    const scale=Math.min(1,Math.sqrt(maxPixels/(rect.width*rect.height*dpr*dpr)));
    const w=Math.max(2,Math.round(rect.width*dpr*scale));
    const h=Math.max(2,Math.round(rect.height*dpr*scale));
    renderer.setSize(w,h,false);
    canvas.style.width=rect.width+'px';
    canvas.style.height=rect.height+'px';
    camera.aspect=w/h;camera.updateProjectionMatrix();
    paint(0);
    if(!art.classList.contains('hero-three-ready')){
      art.classList.add('hero-three-ready','kinetic-ready');
    }
  }

  function paint(dt){
    if(!active)return;
    if(!reduced.matches)time=(time+dt)%duration;
    const phase=time/duration*TAU;
    const response=Math.min(1,dt*3.1+.035);
    px+=(targetX-px)*response;py+=(targetY-py)*response;
    const rotationY=.21+.14*Math.sin(phase-.5)+px*.105;
    const rotationX=.09+.055*Math.sin(phase+.3)-py*.058;
    const rotationZ=.035*Math.sin(phase-.9);
    sculpture.rotation.y+=(rotationY-sculpture.rotation.y)*.065;
    sculpture.rotation.x+=(rotationX-sculpture.rotation.x)*.065;
    sculpture.rotation.z+=(rotationZ-sculpture.rotation.z)*.065;
    coreRotor.rotation.z=-TAU*time/duration;
    sideGears[0].rotation.z=TAU*time/duration*2;
    sideGears[1].rotation.z=-TAU*time/duration*2;
    sweep.position.set(5*Math.sin(phase-.9),1.6+.9*Math.cos(phase),6.4);
    sweep.intensity=1.22+.25*Math.max(0,Math.sin(phase+.15));
    const p1=Math.exp(-Math.pow((time-8.1)/.15,2));
    const p2=.53*Math.exp(-Math.pow((time-8.54)/.19,2));
    amber.intensity=2.05+.80*(p1+p2);
    amberPulseMaterial.opacity=.32+.13*(p1+p2);
    for(let i=0;i<traces.length;i++){
      const t=((time/duration*(i%2===0?1:-1)+i/3)%1+1)%1*TAU*2;
      const f=frameAt(t);
      traces[i].position.copy(f.c).addScaledVector(f.across,bandWidth+.012);
      traces[i].material.opacity=.18+.16*(p1+p2);
      traces[i].scale.setScalar(.62+.17*Math.sin(phase*2+i));
    }
    renderer.render(scene,camera);
  }
  function animate(now){
    if(!active||!visible||document.hidden){frameId=0;return;}
    if(!lastPaint||now-lastPaint>=frameInterval){
      const dt=lastPaint?Math.min(.12,(now-lastPaint)/1000):0;
      paint(dt);lastPaint=now;
    }
    frameId=requestAnimationFrame(animate);
  }
  function stop(){cancelAnimationFrame(frameId);frameId=0;last=lastPaint=0;}
  function start(){
    if(!active||!visible||document.hidden||frameId)return;
    if(reduced.matches){paint(0);return;}
    frameId=requestAnimationFrame(animate);
  }
  const resizer=new ResizeObserver(()=>setupSize());
  const observer=new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible)start();else stop();
  },{rootMargin:'80px'});
  resizer.observe(art);setupSize();
  observer.observe(hero);

  if(matchMedia('(pointer:fine)').matches){
    hero.addEventListener('pointermove',e=>{
      const r=hero.getBoundingClientRect();
      targetX=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));
      targetY=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));
    },{passive:true});
    hero.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  }
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  reduced.addEventListener('change',()=>{stop();start();});
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();active=false;stop();resizer.disconnect();observer.disconnect();
    art.classList.remove('hero-three-ready','kinetic-ready');
  },{once:true});
})();