/* DOM.RENDER — transparent 3D camera trajectory over a single photo (v42)
   Three.js renders ONLY the illustrative camera prop. The house remains a flat
   original photo; SVG path stays available if WebGL/CDN is unavailable. */
(function(root){
 'use strict';
 const paths={
  dolly:[[62,286],[155,272],[272,236],[371,188]],
  orbit:[[88,271],[142,181],[293,147],[443,241]],
  slider:[[72,292],[178,282],[317,275],[456,268]],
  crane:[[103,310],[114,256],[131,169],[158,94]],
  drone:[[70,94],[126,108],[245,167],[372,226]],
  walk:[[84,303],[159,271],[241,279],[345,229]],
  tilt:[[119,290],[104,242],[98,178],[121,106]],
  macro:[[178,274],[221,260],[294,239],[381,219]]
 };
 const ns='http://www.w3.org/2000/svg';
 let element=null,svg=null,base=null,trail=null,marker=null,renderer=null,scene=null,
   model=null,THREE=null,path='dolly',duration=6,visible=false,playing=false,
   t0=0,request=0,loadStarted=false,loaded=false,loadError=false,resizeObs=null;
 function point(arr,t){
  t=Math.min(1,Math.max(0,t));const v=1-t;
  const x=v*v*v*arr[0][0]+3*v*v*t*arr[1][0]+3*v*t*t*arr[2][0]+t*t*t*arr[3][0];
  const y=v*v*v*arr[0][1]+3*v*v*t*arr[1][1]+3*v*t*t*arr[2][1]+t*t*t*arr[3][1];
  return [x,y];
 }
 function curveD(arr){const p=arr;return 'M '+p[0].join(' ')+' C '+p[1].join(' ')+', '+p[2].join(' ')+', '+p[3].join(' ')}
 function svgMarkup(){
  return '<svg class="anim-camera-path-svg" viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">'+
  '<defs><filter id="animPathGlow" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="5"/></filter></defs>'+
  '<path data-path-glow fill="none" stroke="#70e2a2" stroke-width="10" stroke-linecap="round" opacity=".28" filter="url(#animPathGlow)"/>'+
  '<path data-path-base fill="none" stroke="#f2fff6" stroke-width="2" stroke-dasharray="8 8" stroke-linecap="round" opacity=".55"/>'+
  '<path data-path-trail fill="none" stroke="#b2f6cb" stroke-width="3.8" stroke-linecap="round"/>'+
  '<g data-camera-symbol><ellipse cx="0" cy="24" rx="25" ry="7" fill="#061810" opacity=".23"/>'+
  '<rect x="-24" y="-15" width="44" height="31" rx="7" fill="#142522" stroke="#deffe8" stroke-width="2"/>'+
  '<rect x="-13" y="-23" width="22" height="8" rx="2" fill="#364e47" stroke="#d5f6e2" stroke-width="1"/>'+
  '<circle cx="4" cy="0" r="12" fill="#435e56" stroke="#d0ffe2" stroke-width="2"/>'+
  '<circle cx="4" cy="0" r="7" fill="#0c2322" stroke="#67ce9b" stroke-width="1.5"/>'+
  '<path d="M-17 9h6" stroke="#a4e5b9" stroke-width="2" stroke-linecap="round"/>'+
  '<circle cx="-16" cy="-8" r="2" fill="#7beaab"/></g></svg>';
 }
 function createModel(){
  const group=new THREE.Group();
  const body=new THREE.MeshStandardMaterial({color:0x23332f,metalness:.78,roughness:.3});
  const dark=new THREE.MeshStandardMaterial({color:0x0c1d1d,metalness:.58,roughness:.21});
  const metal=new THREE.MeshStandardMaterial({color:0x82978b,metalness:.86,roughness:.23});
  const glass=new THREE.MeshPhysicalMaterial({color:0x143e35,metalness:.25,roughness:.1,clearcoat:1,clearcoatRoughness:.08});
  const green=new THREE.MeshBasicMaterial({color:0x83f5ac});
  function cube(w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);group.add(m);return m}
  cube(45,27,19,0,0,0,body);
  cube(24,7,17,-3,18,0,metal);
  cube(10,8,13,21,6,0,dark);
  cube(5,9,6,-23,-1,0,metal);
  cube(17,12,4,-12,-1,11,dark);
  const mount=new THREE.Mesh(new THREE.CylinderGeometry(10,10,13,28),metal);
  mount.rotation.x=Math.PI/2;mount.position.set(9,-1,12);group.add(mount);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(8.5,8.5,17,32),dark);
  lens.rotation.x=Math.PI/2;lens.position.set(9,-1,22);group.add(lens);
  const front=new THREE.Mesh(new THREE.CylinderGeometry(7,7,2,32),glass);
  front.rotation.x=Math.PI/2;front.position.set(9,-1,32);group.add(front);
  const lensRing=new THREE.Mesh(new THREE.TorusGeometry(7.3,1.2,8,32),metal);
  lensRing.position.set(9,-1,33);group.add(lensRing);
  const led=new THREE.Mesh(new THREE.SphereGeometry(2.1,10,8),green);
  led.position.set(-16,6,11);group.add(led);
  const grip=cube(10,8,9,-23,15,-3,dark);
  grip.rotation.z=-.25;
  group.scale.setScalar(.88);
  group.rotation.x=-.14;group.rotation.y=.18;
  return group;
 }
 async function loadThree(){
  if(loadStarted||!element||!('WebGLRenderingContext' in root))return;
  loadStarted=true;
  try{
   let lib;
   try{lib=await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js')}
   catch(e){lib=await import('https://unpkg.com/three@0.164.1/build/three.module.js')}
   if(!element)return;
   THREE=lib;
   const canvas=root.document.createElement('canvas');
   canvas.className='anim-camera-three-canvas';
   canvas.setAttribute('aria-hidden','true');
   element.appendChild(canvas);
   renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});
   renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,1.4));
   scene=new THREE.Scene();
   const camera=new THREE.OrthographicCamera(-320,320,180,-180,1,200);
   camera.position.set(0,0,100);camera.lookAt(0,0,0);
   scene.userData.camera=camera;
   scene.add(new THREE.AmbientLight(0xe6fff2,2.0));
   const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-170,100,130);scene.add(key);
   const rim=new THREE.DirectionalLight(0x73edaa,2);rim.position.set(120,-60,80);scene.add(rim);
   model=createModel();scene.add(model);
   const rect=element.getBoundingClientRect();
   renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);
   loaded=true;
   element.classList.add('has-three-camera');
   if('ResizeObserver' in root){resizeObs=new ResizeObserver(entries=>{
    if(!renderer)return;
    const box=entries[0]?.contentRect||element.getBoundingClientRect();
    renderer.setSize(Math.max(1,box.width),Math.max(1,box.height),false);
    renderThree();
   });resizeObs.observe(element)}
   renderAt(0);
  }catch(err){loadError=true;loaded=false;renderer?.dispose();renderer=null}
 }
 function renderThree(){if(visible&&renderer&&scene)renderer.render(scene,scene.userData.camera)}
 function renderAt(t){
  if(!element)return;
  const pts=paths[path]||paths.dolly;
  // Tilt is a fixed-position tripod rotation, unlike an actual crane movement.
  const [x,y]=point(pts,path==='tilt'?0:t);
  const [bx,by]=point(pts,Math.min(1,t+.015));
  const radians=Math.atan2(by-y,bx-x);
  if(marker)marker.setAttribute('transform','translate('+x.toFixed(2)+' '+y.toFixed(2)+') rotate('+(path==='tilt'?-30*t:radians*180/Math.PI*.13).toFixed(1)+')');
  if(trail){
   let len=0;
   try{len=trail.getTotalLength()}catch(e){}
   if(len>0){trail.style.strokeDasharray=String(len);trail.style.strokeDashoffset=String(len*(1-t))}
  }
  if(model){model.position.set(x-320,180-y,12);model.rotation.z=path==='tilt'?0:-radians*.12;model.rotation.x=path==='tilt'?-0.14-.48*t:-0.14;model.rotation.y=.12+Math.sin(t*Math.PI)*.14}
  renderThree();
 }
 function setMotion(id){
  path=paths[id]?id:'dolly';
  if(!element)return;
  if(request){cancelAnimationFrame(request);request=0}
  playing=false;
  const d=curveD(paths[path]);
  if(svg){for(const sel of ['[data-path-base]','[data-path-glow]','[data-path-trail]'])svg.querySelector(sel)?.setAttribute('d',d)}
  renderAt(0);
 }
 function tick(now){
  if(!playing||!visible)return;
  const k=Math.max(0,Math.min(1,(now-t0)/(duration*1000)));
  const eased=k*k*(3-2*k);
  renderAt(eased);
  if(k<1)request=root.requestAnimationFrame(tick);else{playing=false;request=0}
 }
 function play(seconds){
  if(!element)return;
  duration=Math.min(20,Math.max(2,Number(seconds)||6));
  if(request){root.cancelAnimationFrame(request);request=0}
  if(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches){renderAt(.5);return}
  visible=true;playing=true;t0=root.performance.now();
  renderAt(0);request=root.requestAnimationFrame(tick);
 }
 function setVisible(value){
  visible=!!value;
  if(!visible){playing=false;if(request)root.cancelAnimationFrame(request);request=0}
  else renderAt(0);
 }
 function mount(host){
  if(!host)return;
  if(element===host){setVisible(true);return}
  element=host;element.innerHTML=svgMarkup();
  svg=element.querySelector('svg');
  base=svg.querySelector('[data-path-base]');
  trail=svg.querySelector('[data-path-trail]');
  marker=svg.querySelector('[data-camera-symbol]');
  visible=true;
  setMotion(path);
  loadThree();
 }
 function destroy(){
  if(request)root.cancelAnimationFrame(request);request=0;
  if(resizeObs)resizeObs.disconnect();
  if(scene){scene.traverse(obj=>{obj.geometry?.dispose?.();if(obj.material){if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material.dispose?.()}})}
  renderer?.dispose();renderer=null;model=null;scene=null;
  if(element)element.innerHTML='';
  element=null;svg=null;trail=null;marker=null;visible=false;playing=false;loaded=false;loadStarted=false;
 }
 root.DOM_RENDER_CAMERA_PATH={mount,setMotion,play,setVisible,destroy,get status(){return loaded?'3D Three.js':loadError?'SVG fallback':'Loading'}};
})(window);
