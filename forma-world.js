import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

/* ФОРМА / Архитектурный 3D-мир.
 * Local GLB, physical PBR light, responsive walk-through, screenshots and bookmarks.
 * The geometry of imported files is NEVER AI-replaced, re-scaled or rotated.
 * No model data is transferred to any remote API.
 */
const $=s=>document.querySelector(s);
const viewport=$('#fwCanvas'),waiting=$('#fwWait'),message=$('#fwStatus');
const input=$('#fwFile'),lightControl=$('#fwLight');
const orbitButton=$('#fwOrbit'),walkButton=$('#fwWalk'),help=$('#fwHelp');
const modelGroup=new THREE.Group(),landscape=new THREE.Group();
const scene=new THREE.Scene();
scene.add(modelGroup,landscape);
let renderer;
try {
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.2;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.domElement.tabIndex=0;
 renderer.domElement.setAttribute('aria-label','Интерактивный 3D-мир — вращайте модель, либо выберите прогулку');
 viewport.append(renderer.domElement);
 waiting.hidden=true;
 waiting.style.display='none';
} catch(error) {
 waiting.textContent='Трёхмерная графика недоступна. Нужен браузер с поддержкой WebGL.';
 throw error;
}
const camera=new THREE.PerspectiveCamera(60,1,.07,5000);
camera.position.set(21,12,24);
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.enableDamping=true;orbit.dampingFactor=.075;
orbit.maxPolarAngle=Math.PI*.495;
orbit.minDistance=.5;orbit.maxDistance=1100;
orbit.target.set(0,2.5,0);orbit.update();
const hemisphere=new THREE.HemisphereLight(0xe2f2ff,0x4b554e,2.1);
scene.add(hemisphere);
const sun=new THREE.DirectionalLight(0xffead0,3.6);
sun.position.set(-24,36,28);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.near=.1;sun.shadow.camera.far=220;
sun.shadow.bias=-.00012;sun.shadow.normalBias=.02;
scene.add(sun);
const pmrem=new THREE.PMREMGenerator(renderer);
const env=pmrem.fromScene(new RoomEnvironment(),.04);
scene.environment=env.texture;
scene.environmentIntensity=.28;
const materials={
 facade:new THREE.MeshStandardMaterial({color:'#c8c5ba',roughness:.87}),
 concrete:new THREE.MeshStandardMaterial({color:'#969b97',roughness:.91}),
 wood:new THREE.MeshStandardMaterial({color:'#71513b',roughness:.84}),
 dark:new THREE.MeshStandardMaterial({color:'#21292a',roughness:.53,metalness:.18}),
 glass:new THREE.MeshPhysicalMaterial({color:'#668b90',metalness:.04,roughness:.13,transmission:.13,transparent:true,opacity:.83}),
 road:new THREE.MeshStandardMaterial({color:'#aaa89c',roughness:.97}),
 soil:new THREE.MeshStandardMaterial({color:'#756e5c',roughness:1}),
 trunk:new THREE.MeshStandardMaterial({color:'#453d32',roughness:1}),
 leaf:new THREE.MeshStandardMaterial({color:'#496448',roughness:.95}),
 fir:new THREE.MeshStandardMaterial({color:'#29433b',roughness:1})
};
const skyColors={
 day:{sky:'#a6c0ca',fog:'#adbec0',hem:2.1,sun:3.6,exposure:1.25,tint:0xffead0,from:[-24,36,28],ground:'#909b84'},
 golden:{sky:'#c9a98a',fog:'#bba994',hem:1.7,sun:4.0,exposure:1.17,tint:0xffca82,from:[-28,12,21],ground:'#857e69'},
 blue:{sky:'#3c566d',fog:'#425b6b',hem:.88,sun:1.1,exposure:1.33,tint:0x93b5d5,from:[-20,6,31],ground:'#66776f'},
 night:{sky:'#141e33',fog:'#202a3d',hem:.35,sun:.22,exposure:1.7,tint:0x7894ca,from:[-17,18,22],ground:'#384b48'}
};
let ground,source=null,mode='orbit',bounds=new THREE.Box3(),sceneCenter=new THREE.Vector3(),baseY=0,walkHeight=1.68;
const walkKeys=new Set(),walkClock=new THREE.Clock();
let yaw=0,pitch=0,movingTouch=null,dragging=false,lastMouse=null,bookmark=null,objectURL=null;
function info(text){message.textContent=text}
function seeded(i){let x=Math.sin(i*127.1+78.233)*43918.835;return x-Math.floor(x)}
function mkBox(w,h,d,material,x,y,z,parent=modelGroup){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
 o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function mkPlane(w,d,material,x,y,z,parent=landscape){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
 m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;
}
function grassTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#7a8e73';ctx.fillRect(0,0,256,256);
 for(let i=0;i<9500;i++){
  const x=seeded(i*19)*256,y=seeded(i*19+2)*256;
  const v=Math.round(53+seeded(i*19+4)*90);
  ctx.fillStyle=i%6===0?'rgba(42,57,41,.26)':('rgba('+v+','+(v+9)+','+(v-7)+',.20)');
  ctx.fillRect(x,y,1,1+seeded(i+3)*3);
 }
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(30,30);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 return t;
}
const grassMat=new THREE.MeshStandardMaterial({color:'#d7dfcf',roughness:1,map:grassTexture()});
function terrain(centerX=0,centerZ=0,width=180){
 if(ground){scene.remove(ground);ground.geometry.dispose()}
 const geometry=new THREE.PlaneGeometry(width,width,1,1);
 ground=new THREE.Mesh(geometry,grassMat);ground.rotation.x=-Math.PI/2;
 ground.position.set(centerX,baseY-.035,centerZ);
 ground.receiveShadow=true;scene.add(ground);
}
function clearGroup(group){
 group.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose?.(); /* Material shared intentionally */ }});
 group.clear();
}
function makeTree(x,z,scale,kind){
 const grp=new THREE.Group();grp.position.set(x,baseY,z);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.10*scale,.20*scale,4.2*scale,7),materials.trunk);
 trunk.position.y=2.1*scale;trunk.castShadow=true;grp.add(trunk);
 if(kind==='fir'){
  for(let j=0;j<5;j++){
   const radius=(2.1-j*.31)*scale, h=(2.25-j*.2)*scale;
   const c=new THREE.Mesh(new THREE.ConeGeometry(radius,h,9,1),materials.fir);
   c.position.y=(2.5+j*.91)*scale;c.castShadow=true;c.receiveShadow=true;grp.add(c);
  }
 }else{
  const foliage=new THREE.Group();foliage.position.y=4.5*scale;
  for(let k=0;k<6;k++){
   const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((1.4+seeded(k+x)*.45)*scale,1),materials.leaf);
   crown.position.set((seeded(k*4+x)-.5)*1.6*scale,(seeded(k*8+z)-.4)*1.1*scale,(seeded(k*6+z)-.5)*1.5*scale);
   crown.castShadow=true;foliage.add(crown);
  }
  grp.add(foliage);
 }
 landscape.add(grp);
}
function plants(centerX,centerZ,avoid=14){
 clearGroup(landscape);
 const pathMat=materials.road;
 mkPlane(Math.max(9,avoid*1.3),Math.max(8,avoid*.85),pathMat,centerX,baseY+.005,centerZ+avoid*.67);
 for(let i=0;i<32;i++){
  const ang=seeded(i*6+1)*Math.PI*2;
  const dist=avoid+6+seeded(i*21+3)*35;
  const x=centerX+Math.cos(ang)*dist,z=centerZ+Math.sin(ang)*dist;
  const s=.55+seeded(i*12+6)*.88;
  makeTree(x,z,s,i%3===0?'round':'fir');
 }
 for(let i=0;i<18;i++){
  const ang=seeded(i*14+7)*Math.PI*2,dist=avoid+2+seeded(i*31+2)*10;
  const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.45+seeded(i*4)*.35,1),materials.leaf);
  bush.position.set(centerX+Math.cos(ang)*dist,baseY+.35,centerZ+Math.sin(ang)*dist);
  bush.castShadow=true;landscape.add(bush);
 }
}
function demoHouse(){
 clearGroup(modelGroup);
 const foundation=mkBox(18,.65,12,materials.concrete,0,.25,0);
 const shell=mkBox(15,5.8,9.8,materials.facade,-.4,3.4,0);
 const upper=mkBox(16.2,3.1,10,materials.facade,-.5,7.9,-.25);
 const roof=mkBox(18,.28,12,materials.dark,-.5,9.5,-.25);
 const porch=mkBox(9,.28,3.3,materials.wood,2.4,.55,6.2);
 mkBox(3.4,4,2.3,materials.concrete,-5.9,2.2,-1.3);
 // Window reveals, mullions and muted blue glass.
 for(let floor=0;floor<2;floor++){
  const y=floor===0?3.0:7.85,winH=floor===0?4.1:2.25;
  for(let i=0;i<4;i++){
   const x=-5.7+i*3.75;
   mkBox(2.95,winH,.10,materials.dark,x,y,4.98);
   mkBox(2.77,winH-.2,.11,materials.glass,x,y,5.055);
   mkBox(.075,winH,.15,materials.dark,x,y,5.11);
   mkBox(2.95,.065,.15,materials.dark,x,y+.35,5.12);
  }
 }
 for(let i=0;i<30;i++){
  const z=-4.9+i*.335;
  mkBox(.082,5.72,.14,materials.wood,7.18,3.43,z);
 }
 for(let i=0;i<18;i++){
  const x=-7.5+i*.85;
  mkBox(.06,1.2,.06,materials.dark,x,1.25,7.62);
 }
 mkBox(16,.07,.08,materials.dark,0,1.82,7.62);
 const lamp=new THREE.SpotLight(0xffd4a4,32,18,Math.PI/4,.55,2);
 lamp.position.set(-4,5.8,5.5);lamp.target.position.set(-3,0,8);
 modelGroup.add(lamp,lamp.target);
 const landscapeBase=0;
 baseY=landscapeBase;sceneCenter.set(0,4.3,0);
 bounds.setFromObject(modelGroup);
 terrain(0,0,170);plants(0,0,17);
 camera.position.set(23,13,26);orbit.target.set(0,4.3,0);orbit.update();
 $('#fwSceneName').textContent='Демонстрационный дом · условная геометрия';
 info('Демонстрационная сцена. Для точной геометрии загрузите собственную CAD-модель в GLB.');
 source=null;
}
async function loadFile(file){
 if(!file)return;
 if(!/\.glb$/i.test(file.name)||file.size>120*1024*1024||file.size<32){
  info('Допускается один файл .glb до 120 МБ с встроенными текстурами.');return;
 }
 waiting.hidden=false;waiting.style.display='grid';waiting.textContent='Загружаем модель в браузере…';
 let root;
 try{
  const data=await file.arrayBuffer();
  const loader=new GLTFLoader();
  const decoder=new DRACOLoader();
  decoder.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/libs/draco/');
  loader.setDRACOLoader(decoder);
  const gltf=await loader.parseAsync(data,'');
  root=gltf.scene;
  const box=new THREE.Box3().setFromObject(root);
  if(box.isEmpty())throw Error('В файле нет геометрии.');
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  if(Math.max(size.x,size.y,size.z)>100000||Math.min(size.x,size.y,size.z)<0)throw Error('Некорректные размеры модели.');
  let meshCount=0;
  root.traverse(obj=>{if(obj.isMesh){meshCount++;obj.castShadow=true;obj.receiveShadow=true}});
  if(meshCount>16000)throw Error('Слишком сложная модель: оптимизируйте GLB для браузера.');
  clearGroup(modelGroup);
  modelGroup.add(root);
  // Preserve the original GLB coordinate system and scale; move the viewing camera instead of rewriting geometry.
  bounds.copy(box);
  sceneCenter.copy(center);
  baseY=box.min.y;
  const radius=Math.max(size.x,size.z)/2,span=Math.max(radius*2.5,75);
  terrain(center.x,center.z,Math.max(span*2.2,150));
  plants(center.x,center.z,Math.max(radius+7,13));
  orbit.target.copy(center);camera.position.set(center.x+span*.45,center.y+Math.max(size.y,3)*.65,center.z+span*.48);
  orbit.minDistance=Math.max(.15,radius*.02);orbit.maxDistance=span*15;orbit.update();
  walkHeight=Math.max(.6,Math.min(2,Math.max(size.y*.25,1.68)));
  source={name:file.name,bytes:file.size,meshes:meshCount};
  $('#fwSceneName').textContent=file.name;
  info('Модель загружена: '+meshCount+' объектов. Геометрия и масштаб не изменялись. Прогулка использует условную высоту пола — без коллизий.');
  decoder.dispose();
 }catch(e){info('Не удалось открыть GLB: '+(e.message||'ошибка формата')+'. Модель в проекте не изменена.')}
 finally{waiting.hidden=true;waiting.style.display='none'}
}
function setLight(key){
 const s=skyColors[key]||skyColors.day;
 scene.background=new THREE.Color(s.sky);
 scene.fog=new THREE.FogExp2(new THREE.Color(s.fog),key==='night'?.007:.005);
 hemisphere.intensity=s.hem;sun.intensity=s.sun;sun.color.setHex(s.tint);
 sun.position.set(...s.from);renderer.toneMappingExposure=s.exposure;
 ground.material.color.set(s.ground);
}
function enterMode(next){
 if(next===mode)return;
 mode=next;orbit.enabled=mode==='orbit';
 orbitButton.classList.toggle('active',mode==='orbit');walkButton.classList.toggle('active',mode==='walk');
 orbitButton.setAttribute('aria-pressed',String(mode==='orbit'));walkButton.setAttribute('aria-pressed',String(mode==='walk'));
 $('#fwModeLabel').textContent=mode==='orbit'?'ОБЗОР':'ПРОГУЛКА';
 $('#fwTouchMove').hidden=mode!=='walk';
 if(mode==='walk'){
  const direction=new THREE.Vector3();camera.getWorldDirection(direction);
  yaw=Math.atan2(-direction.x,-direction.z);pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-.98,.98));
  camera.position.y=Math.max(baseY+walkHeight,camera.position.y);
  help.textContent='WASD — ходить; мышь/палец — смотреть; Shift — быстрее. На телефоне используйте стрелки.';
  info('Прогулка включена. Физические столкновения с моделью пока не рассчитываются.');
 }else{
  walkKeys.clear();orbit.target.set(sceneCenter.x,sceneCenter.y,sceneCenter.z);
  orbit.update();help.textContent='Поверните мышью или пальцем. Колесо или два пальца — приближение.';
 }
}
function renderWalk(dt){
 const v=new THREE.Vector3();
 if(walkKeys.has('forward')||walkKeys.has('w')||walkKeys.has('arrowup'))v.z-=1;
 if(walkKeys.has('back')||walkKeys.has('s')||walkKeys.has('arrowdown'))v.z+=1;
 if(walkKeys.has('left')||walkKeys.has('a')||walkKeys.has('arrowleft'))v.x-=1;
 if(walkKeys.has('right')||walkKeys.has('d')||walkKeys.has('arrowright'))v.x+=1;
 if(v.lengthSq()>0){
  v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const fast=walkKeys.has('shift')?11:4;
  camera.position.addScaledVector(v,Math.min(dt,.05)*fast);
  const bound=220;camera.position.x=THREE.MathUtils.clamp(camera.position.x,sceneCenter.x-bound,sceneCenter.x+bound);
  camera.position.z=THREE.MathUtils.clamp(camera.position.z,sceneCenter.z-bound,sceneCenter.z+bound);
  camera.position.y=Math.max(baseY+walkHeight,camera.position.y);
 }
 camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
}
const resize=()=>{
 const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);
 camera.aspect=w/h;camera.updateProjectionMatrix();
 renderer.setSize(w,h,false);
};
new ResizeObserver(resize).observe(viewport);
function frame(){
 requestAnimationFrame(frame);
 const dt=walkClock.getDelta();
 if(mode==='walk')renderWalk(dt);else orbit.update();
 renderer.render(scene,camera);
}
function saveShot(){
 const w=renderer.domElement.width,h=renderer.domElement.height;
 try{
  renderer.render(scene,camera);
  const url=renderer.domElement.toDataURL('image/png');
  if(!url||url.length<1000)throw Error('Пустой кадр');
  const a=document.createElement('a');a.href=url;
  a.download='FORMA-3D-'+new Date().toISOString().slice(0,10)+'-'+w+'x'+h+'.png';
  document.body.append(a);a.click();a.remove();
  info('Кадр сохранён: '+w+'×'+h+' PNG. Это реальный кадр WebGL, не AI-фотография.');
 }catch(e){info('Сохранение кадра не удалось: '+e.message)}
}
function bookmarkCamera(){
 bookmark={pos:camera.position.toArray(),target:orbit.target.toArray(),yaw,pitch,mode};
 try{localStorage.setItem('forma-world-camera-v1',JSON.stringify(bookmark))}catch{}
 info('Ракурс сохранён в текущем браузере.');
}
function restoreCamera(){
 if(!bookmark){try{bookmark=JSON.parse(localStorage.getItem('forma-world-camera-v1')||'null')}catch{}}
 if(!bookmark){info('Сохранённый ракурс не найден.');return}
 enterMode(bookmark.mode==='walk'?'walk':'orbit');
 camera.position.fromArray(bookmark.pos);orbit.target.fromArray(bookmark.target);
 yaw=bookmark.yaw;pitch=bookmark.pitch;orbit.update();
 info('Ракурс восстановлен.');
}
renderer.domElement.addEventListener('pointerdown',event=>{
 if(mode!=='walk')return;
 dragging=true;lastMouse={x:event.clientX,y:event.clientY};
 renderer.domElement.setPointerCapture(event.pointerId);
});
renderer.domElement.addEventListener('pointermove',event=>{
 if(mode!=='walk'||!dragging||!lastMouse)return;
 const dx=event.clientX-lastMouse.x,dy=event.clientY-lastMouse.y;
 yaw-=dx*.003;pitch=THREE.MathUtils.clamp(pitch-dy*.003,-1.35,1.35);
 lastMouse={x:event.clientX,y:event.clientY};
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>{dragging=false;lastMouse=null});
window.addEventListener('keydown',e=>{
 if(mode!=='walk'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
 const key=e.key.toLowerCase();
 if(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){walkKeys.add(key);e.preventDefault()}
});
window.addEventListener('keyup',e=>walkKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>walkKeys.clear());
$('#fwTouchMove').addEventListener('pointerdown',e=>{
 const key=e.target.closest('[data-move]')?.dataset.move;if(!key)return;
 movingTouch=key;walkKeys.add(key);e.target.setPointerCapture(e.pointerId);e.preventDefault();
});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('#fwTouchMove').addEventListener(ev,()=>{if(movingTouch)walkKeys.delete(movingTouch);movingTouch=null});
$('#fwFile').addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';loadFile(f)});
$('#fwDemo').addEventListener('click',demoHouse);
walkButton.addEventListener('click',()=>enterMode('walk'));
orbitButton.addEventListener('click',()=>enterMode('orbit'));
lightControl.addEventListener('change',()=>setLight(lightControl.value));
$('#fwFov').addEventListener('input',e=>{camera.fov=Number(e.target.value);camera.updateProjectionMatrix();$('#fwFovValue').textContent=camera.fov+'°'});
$('#fwShot').addEventListener('click',saveShot);
$('#fwBookmark').addEventListener('click',bookmarkCamera);
$('#fwReturn').addEventListener('click',restoreCamera);
window.FORMA_WORLD={loadFile,demoHouse,setLight,enterMode,get scene(){return scene},get loadedFile(){return source},get mode(){return mode}};
setLight('day');demoHouse();resize();frame();
