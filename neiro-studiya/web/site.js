// NEIRO STUDIO | Interactive titanium spiral. No external model files required.
const video = document.getElementById('quantum-video');
const sound = document.getElementById('sound-toggle');
const soundText = sound.querySelector('.sound-label');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let audioEnabled = false;
const updateSound = () => {
  video.muted = !audioEnabled;
  sound.setAttribute('aria-pressed', String(audioEnabled));
  sound.setAttribute('aria-label', audioEnabled ? 'Выключить звук реактора' : 'Включить звук реактора');
  soundText.textContent = audioEnabled ? 'Звук вкл.' : 'Звук выкл.';
};
updateSound();
sound.addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  updateSound();
  try { if(video.paused) await video.play(); }
  catch(e) { audioEnabled = false; updateSound(); console.warn('Видео заблокировано браузером:',e); }
});
video.addEventListener('error', () => {
  document.getElementById('video-error').hidden=false;
  sound.disabled=true;
  sound.title='Видеофайл не загружен';
});
video.addEventListener('canplay', ()=>{ document.getElementById('video-error').hidden=true; });
if (reduceMotion.matches) { video.pause(); video.controls=true; }
else {
  const watcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) video.pause();
      else video.play().catch(()=>{});
    }
  }, {threshold:.06});
  watcher.observe(video);
}

const visual = document.getElementById('spiral-visual');
const canvas = document.getElementById('spiral-canvas');
const motionDisabled=reduceMotion.matches;

async function initSpiral() {
  let THREE,RoomEnvironment;
  try {
    THREE=await import('three');
    ({RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js'));
  } catch(e) { console.info('3D библиотека недоступна; показан статичный эскиз спирали.',e);return; }
  if(!visual.isConnected) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
  } catch(e) {console.info('WebGL недоступен, используется статичный вариант.',e);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.28;
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.1,100);
  camera.position.set(0,.20,11.7);camera.lookAt(0,0,0);
  const group=new THREE.Group(); scene.add(group);
  const key=new THREE.DirectionalLight(0xe5efff,3.5);key.position.set(-3,5,7);scene.add(key);
  const kicker=new THREE.DirectionalLight(0xaac5d9,2.7);kicker.position.set(5,0,-3);scene.add(kicker);
  const fill=new THREE.PointLight(0x6eb2d8,15,20);fill.position.set(-5,-3,4);scene.add(fill);
  scene.add(new THREE.AmbientLight(0xc4d0dc,.38));
  let env;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    env = pmrem.fromScene(new RoomEnvironment(),.06).texture;
    scene.environment=env;
    pmrem.dispose();
  } catch (e) { console.warn('Студийные отражения недоступны.',e); }
  const ti=new THREE.MeshPhysicalMaterial({color:0xa6b0be,metalness:.93,roughness:.22,clearcoat:.18,clearcoatRoughness:.13,envMapIntensity:1.6,side:THREE.DoubleSide});
  const darkTi=new THREE.MeshPhysicalMaterial({color:0x657381,metalness:.9,roughness:.3,envMapIntensity:1.4,side:THREE.DoubleSide});
  const edgeTi=new THREE.MeshPhysicalMaterial({color:0xd5e1ec,metalness:.88,roughness:.18,envMapIntensity:2});
  const cyan=new THREE.MeshBasicMaterial({color:0x75bdd5,transparent:true,opacity:.79,blending:THREE.AdditiveBlending,depthWrite:false});
  const gold=new THREE.MeshBasicMaterial({color:0xb9a789,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});
  // Closed, elliptical-section 3D metal ribbons. Each vertex uses its real surface normal.
  function ribbon(phase, material) {
    const S=310,C=16; const verts=[], indices=[];
    const left=[],right=[];
    for(let i=0;i<=S;i++) {
      const u=i/S;
      const theta=2*Math.PI*2.15*u+phase;
      const radius=1.03+.085*Math.cos(u*2*Math.PI);
      const y=(u-.5)*4.9;
      const center=new THREE.Vector3(radius*Math.cos(theta),y,radius*Math.sin(theta));
      const radial=new THREE.Vector3(Math.cos(theta),0,Math.sin(theta));
      const tang=new THREE.Vector3(-radius*Math.sin(theta)*2*Math.PI*2.15,4.9,radius*Math.cos(theta)*2*Math.PI*2.15).normalize();
      const widthAxis=radial.clone().addScaledVector(tang,.21).normalize();
      const thicknessAxis = new THREE.Vector3().crossVectors(tang,widthAxis).normalize();
      for(let j=0;j<C;j++){
        const a=2*Math.PI*j/C;
        const p=center.clone().addScaledVector(widthAxis,.235*Math.cos(a)).addScaledVector(thicknessAxis,.053*Math.sin(a));
        verts.push(p.x,p.y,p.z);
      }
      const l=center.clone().addScaledVector(widthAxis,.236);
      left.push(l);
      const r=center.clone().addScaledVector(widthAxis,-.236);
      right.push(r);
    }
    for(let i=0;i<S;i++)for(let j=0;j<C;j++){
      const a=i*C+j,b=i*C+(j+1)%C,c=(i+1)*C+j,d=(i+1)*C+(j+1)%C;
      indices.push(a,c,b,b,c,d);
    }
    for(const cap of [0,S]){const a=cap*C;for(let j=1;j<C-1;j++)indices.push(a,a+j,a+j+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo,material));
    for(const path of [left,right]){
       const curve=new THREE.CatmullRomCurve3(path);
       group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,280,.011,5,false),edgeTi));
    }
    return {left,right};
  }
  ribbon(0,ti);ribbon(Math.PI,darkTi);
  function trace(phase,r,mat,thick){
    const pts=[];
    for(let i=0;i<=320;i++){
       const u=i/320,angle=2*Math.PI*2.15*u+phase;
       pts.push(new THREE.Vector3(r*Math.cos(angle),(u-.5)*4.9,r*Math.sin(angle)));
    }
    const curve=new THREE.CatmullRomCurve3(pts);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,320,thick,5,false),mat));
  }
  trace(.17,1.28,cyan,.012);trace(Math.PI+.17,1.29,gold,.009);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.26,36,20),new THREE.MeshPhysicalMaterial({color:0x91d4ef,metalness:.55,roughness:.13,transparent:true,opacity:.35,transmission:.5,thickness:1,envMapIntensity:1.3}));
  group.add(core);
  const lightCore=new THREE.PointLight(0x7dcaff,2.4,5);group.add(lightCore);
  const particles=[];
  const gDot=new THREE.SphereGeometry(.012,5,4);
  for(let i=0;i<42;i++){
    const ang=i*2.39996,rad=(.35+((i*17)%42)/42*1.18),height=((i*7)%41/40-.5)*4.9;
    const m=new THREE.Mesh(gDot,i%5===0?gold:cyan);
    m.position.set(rad*Math.cos(ang),height,rad*Math.sin(ang));group.add(m);particles.push(m);
  }
  visual.classList.add('loaded');
  let inView=false,raf=0,scrollTarget=0,pointerX=0,pointerY=0,step=0;
  const onResize=()=>{
    const w=visual.clientWidth,h=visual.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=w<500?43:34;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(onResize).observe(visual);onResize();
  const updateScroll=()=>{
    const rect=visual.getBoundingClientRect();
    scrollTarget=(window.innerHeight*.7-rect.top)/(window.innerHeight+rect.height);
  };updateScroll();window.addEventListener('scroll',updateScroll,{passive:true});
  visual.addEventListener('pointermove',e=>{
    const r=visual.getBoundingClientRect();
    pointerX=((e.clientX-r.left)/r.width-.5)*2;
    pointerY=((e.clientY-r.top)/r.height-.5)*2;
  });
  visual.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0});
  const render=()=>{
    if(!inView)return;
    if(!motionDisabled)step++;
    const time=step/60;
    const targetY=.3+scrollTarget*1.5+(motionDisabled?0:time*.065);
    group.rotation.y+=(targetY+pointerX*.1-group.rotation.y)*.045;
    group.rotation.x+=(-.18-pointerY*.09-group.rotation.x)*.045;
    group.rotation.z+=(Math.sin(time*.25)*.022-group.rotation.z)*.045;
    if(!motionDisabled){
      core.scale.setScalar(1+.09*Math.sin(time*1.15));
      lightCore.intensity=2.4+.65*Math.sin(time*1.15);
      for(let i=0;i<particles.length;i++)particles[i].scale.setScalar(.6+.45*Math.sin(time*1.2+i*.74));
    }
    renderer.render(scene,camera);
    if(!motionDisabled) raf=requestAnimationFrame(render);
  };
  const visibility=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){inView=true;render()}
    else{inView=false;cancelAnimationFrame(raf)}
  },{rootMargin:'150px'});
  visibility.observe(visual);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)cancelAnimationFrame(raf);
    else if(inView)render();
  });
}
initSpiral();