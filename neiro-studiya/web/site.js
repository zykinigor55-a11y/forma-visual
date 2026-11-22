// FORMA AI Black Cinema — retained original V14 video and new two-band Möbius kinetic study.
const video = document.getElementById('quantum-video');
const sound = document.getElementById('sound-toggle');
let audioEnabled = false;
function syncSound() {
  video.muted = !audioEnabled;
  sound.setAttribute('aria-pressed', String(audioEnabled));
  sound.querySelector('.sound-label').textContent = audioEnabled ? 'Звук вкл.' : 'Звук выкл.';
}
syncSound();
sound.addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  syncSound();
  try { await video.play(); } catch (e) { audioEnabled = false; syncSound(); }
});
video.addEventListener('error', () => { document.getElementById('video-error').hidden = false; });
video.addEventListener('canplay', () => { document.getElementById('video-error').hidden = true; });

const visual = document.getElementById('spiral-visual');
const canvas = document.getElementById('spiral-canvas');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
async function initMobius() {
  if (!visual || !canvas) return;
  let THREE, RoomEnvironment;
  try {
    THREE = await import('three');
    ({RoomEnvironment} = await import('three/addons/environments/RoomEnvironment.js'));
  } catch (error) { return; }
  let renderer;
  try {renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
  catch(e){return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.setClearColor(0,0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.1,70);
  camera.position.set(0,.04,10.1);
  const sculpture = new THREE.Group();scene.add(sculpture);
  scene.add(new THREE.HemisphereLight(0xcdd6e4,0x12151c,1));
  const key = new THREE.DirectionalLight(0xf0f3f8,3);key.position.set(-3,4.5,6);scene.add(key);
  const rim = new THREE.DirectionalLight(0xb3cada,2.9);rim.position.set(4,-1,-5);scene.add(rim);
  const warm = new THREE.PointLight(0xe3a46b,14,7);warm.position.set(2,-3,2);scene.add(warm);
  try {const pmrem = new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.05);scene.environment=env.texture;pmrem.dispose();} catch(e){}
  const polished = new THREE.MeshPhysicalMaterial({color:0xd4d9df,metalness:.95,roughness:.19,envMapIntensity:1.6,side:THREE.DoubleSide});
  const dark = new THREE.MeshPhysicalMaterial({color:0x78818c,metalness:.95,roughness:.29,envMapIntensity:1.6,side:THREE.DoubleSide});
  const edge = new THREE.MeshStandardMaterial({color:0xcad9e4,metalness:.86,roughness:.15});
  const energy = [new THREE.MeshBasicMaterial({color:0x80baca,transparent:true,opacity:.68,blending:THREE.AdditiveBlending,depthWrite:false}),new THREE.MeshBasicMaterial({color:0xd29d66,transparent:true,opacity:.56,blending:THREE.AdditiveBlending,depthWrite:false})];
  const TAU=2*Math.PI,seg=240,sides=20,radius=1.23,width=.39,thick=.051;
  const paths=[];
  function band(height,rot,material,light) {
    const group=new THREE.Group();group.position.y=height;group.rotation.set(.2,rot,.18);sculpture.add(group);
    const positions=[],uvs=[],indices=[];
    const frame=u=>{const r=new THREE.Vector3(Math.cos(u),Math.sin(u),0), c=r.clone().multiplyScalar(radius),a=r.clone().multiplyScalar(Math.cos(u/2)).add(new THREE.Vector3(0,0,Math.sin(u/2))),n=r.clone().multiplyScalar(-Math.sin(u/2)).add(new THREE.Vector3(0,0,Math.cos(u/2)));return {c,a,n};};
    for(let i=0;i<seg;i++){const u=i/seg*TAU,{c,a,n}=frame(u);for(let j=0;j<sides;j++){const q=j/sides*TAU;const p=c.clone().addScaledVector(a,width*Math.sign(Math.cos(q))*Math.pow(Math.abs(Math.cos(q)),.36)).addScaledVector(n,thick*Math.sign(Math.sin(q))*Math.pow(Math.abs(Math.sin(q)),.36));positions.push(...p.toArray());uvs.push(i/seg,j/sides);}}
    for(let i=0;i<seg;i++)for(let j=0;j<sides;j++){const flip=i===seg-1?sides/2:0,ni=(i+1)%seg,nj=(j+1)%sides;const a=i*sides+j,b=i*sides+nj,c=ni*sides+(j+flip)%sides,d=ni*sides+(nj+flip)%sides;indices.push(a,c,b,b,c,d);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();group.add(new THREE.Mesh(geo,material));
    const points=[],lights=[];for(let k=0;k<440;k++){const u=k/440*TAU*2,{c,a,n}=frame(u);points.push(c.clone().addScaledVector(a,width+.008));lights.push(c.clone().addScaledVector(a,width+.025).addScaledVector(n,.011));}
    const path=new THREE.CatmullRomCurve3(points,true),strip=new THREE.CatmullRomCurve3(lights,true);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(path,520,.011,6,true),edge));group.add(new THREE.Mesh(new THREE.TubeGeometry(strip,520,.012,6,true),light));paths.push({group,strip,light});
  }
  band(.98,.18,polished,energy[0]);band(-.98,-.28,dark,energy[1]);
  const coreMat=new THREE.MeshPhysicalMaterial({color:0x7d8995,metalness:.95,roughness:.26,envMapIntensity:1.7});
  sculpture.add(new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,4.6,24),coreMat));
  const rotor=new THREE.Group();sculpture.add(rotor);
  for(const y of [-2,-1.4,-.65,.65,1.4,2]){const hub=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.048,24),polished);hub.position.y=y;sculpture.add(hub);}
  for(const y of [-.19,.19]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.37,.025,8,64),polished);ring.rotation.x=Math.PI/2;ring.position.y=y;rotor.add(ring);}
  const nucleus=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,2),new THREE.MeshPhysicalMaterial({color:0x98cbd4,metalness:.5,roughness:.13}));rotor.add(nucleus);
  const pulseLight=new THREE.PointLight(0x8acbda,1.2,3);sculpture.add(pulseLight);
  const dotGeo=new THREE.SphereGeometry(.021,6,6),dummy=new THREE.Object3D();
  const dots=paths.map((path,i)=>{const m=new THREE.InstancedMesh(dotGeo,energy[i].clone(),8);m.frustumCulled=false;path.group.add(m);return m;});
  let running=false,visible=false,frameId=0,last=0,time=0,drag=0,dragStart=0,dragPointer=-1,scroll=0,px=0,py=0,tx=0,ty=0;
  function draw(dt){const moving=!motion.matches;if(moving)time+=dt;px+=(tx-px)*.06;py+=(ty-py)*.06;const goal=.26+drag+scroll*.68+px*.18+(moving?time*.05:0);sculpture.rotation.y+=(goal-sculpture.rotation.y)*.052;sculpture.rotation.x+=(-.08-py*.08-sculpture.rotation.x)*.052;rotor.rotation.y=moving?-time*.25:0;pulseLight.intensity=1.1+(moving?Math.pow(Math.max(0,Math.sin(time*4.3)),10)*.75:0);
   paths.forEach((path,j)=>{for(let i=0;i<8;i++){const u=((i/8+time*(j?-.056:.07))%1+1)%1;dummy.position.copy(path.strip.getPointAt(u));dummy.scale.setScalar(.72+.2*Math.sin(time*1.4+i));dummy.updateMatrix();dots[j].setMatrixAt(i,dummy.matrix);}dots[j].instanceMatrix.needsUpdate=true;});renderer.render(scene,camera);
  }
  function frame(t){if(!running)return;const dt=last?Math.min((t-last)/1000,.05):0;last=t;draw(dt);frameId=requestAnimationFrame(frame);}
  const stop=()=>{running=false;cancelAnimationFrame(frameId);last=0;};
  const start=()=>{if(!visible||document.hidden||running)return;if(motion.matches){draw(0);return;}running=true;frameId=requestAnimationFrame(frame);};
  const resize=()=>{const w=Math.max(1,visual.clientWidth),h=Math.max(1,visual.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<540?1.25:1.6));renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<480?43:34;camera.updateProjectionMatrix();draw(0);visual.classList.add('loaded');};
  new ResizeObserver(resize).observe(visual);resize();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();},{rootMargin:'100px'});observer.observe(visual);
  window.addEventListener('scroll',()=>{const r=visual.getBoundingClientRect();scroll=Math.max(0,Math.min(1,(innerHeight*.65-r.top)/(innerHeight+r.height)));},{passive:true});
  visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect();tx=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)*2));ty=Math.max(-1,Math.min(1,((e.clientY-r.top)/r.height-.5)*2));if(dragPointer===e.pointerId){drag+=(e.clientX-dragStart)*.008;dragStart=e.clientX;}});
  visual.addEventListener('pointerleave',()=>{tx=ty=0;});
  visual.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;dragPointer=e.pointerId;dragStart=e.clientX;visual.setPointerCapture(e.pointerId);visual.classList.add('dragging');});
  const release=()=>{dragPointer=-1;visual.classList.remove('dragging');};visual.addEventListener('pointerup',release);visual.addEventListener('pointercancel',release);
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')drag-=.22;else if(e.key==='ArrowRight')drag+=.22;else if(e.key==='Home')drag=0;else return;e.preventDefault();if(motion.matches)draw(0);});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  motion.addEventListener('change',()=>{stop();start();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();observer.disconnect();visual.classList.remove('loaded');});
}
initMobius();
