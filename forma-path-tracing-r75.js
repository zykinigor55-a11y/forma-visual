/* FORMA R73 — optional actual WebGL GPU path tracing snapshot.
 * three-gpu-pathtracer 0.0.23 + three-mesh-bvh 0.8.3; no mutation of editor scene.
 * Shader-only effects are not representable by the physical tracer.
 */
const isMobile=()=>/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nextFrame=()=>new Promise(r=>requestAnimationFrame(r));
function makeSky(T,source,atmosphere={}){
 const w=512,h=256,data=new Float32Array(w*h*4);
 const sun=source.getObjectByName('sun'),time=atmosphere.time||'day',weather=atmosphere.weather||'sunny';
 const day=!['night','blue-hour'].includes(time),cloudy=['overcast','rain','fog','snow'].includes(weather);
 const zen=new T.Color(!day?'#26374f':cloudy?'#a2adb6':'#7297bf'),hor=new T.Color(!day?'#586a80':cloudy?'#c0c5c7':time==='evening'?'#e1c5a9':'#d3e0e7'),ground=new T.Color(day?'#777b67':'#303b32');
 const c=new T.Color();
 for(let y=0;y<h;y++){const a=Math.sin(((y+.5)/h-.5)*Math.PI);c.copy(hor).lerp(a>0?zen:ground,Math.pow(Math.abs(a),.55));for(let x=0;x<w;x++){const k=(y*w+x)*4;data[k]=c.r;data[k+1]=c.g;data[k+2]=c.b;data[k+3]=1;}}
 const t=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;return t;
}
async function loadSkyR73(T,source,atmosphere={}){
 const sun=source.getObjectByName('sun'),time=atmosphere.time||'day',weather=atmosphere.weather||'sunny';
 const diffuse=['overcast','rain','fog','snow'].includes(weather);
 if(!sun||sun.intensity<.3||time!=='day'||diffuse)return {texture:makeSky(T,source,atmosphere),label:'Небо по времени суток и погоде',photographic:false};
 const id='kloppenheim_03_puresky',res=isMobile()?'1k':'2k',file=id+'_'+res+'.hdr';
 try{
  const {RGBELoader}=await import('three/addons/loaders/RGBELoader.js');
  const loader=new RGBELoader().setDataType(T.FloatType);
  let t;try{t=await loader.loadAsync(new URL('./assets/landscape-photo/r67/'+file,document.baseURI).href);}catch{t=await loader.loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/'+res+'/'+file);}
  const d=t.image.data;let avg=0,count=0;
  for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];if(Number.isFinite(y)&&y>0&&y<25){avg+=y;count++;}}
  if(!count)throw Error('HDRI has no valid radiance');
  const gain=.76/Math.max(.04,avg/count);
  // Preserve cloud radiance contrast; limit direct solar hotspots because a separate area light supplies direct sunlight.
  for(let i=0;i<d.length;i+=4){const y=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])*gain;const scale=gain*Math.min(1,2.4/Math.max(.00001,y));for(let j=0;j<3;j++)d[i+j]=Math.max(0,Number.isFinite(d[i+j])?d[i+j]*scale:0);d[i+3]=1;}
  t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;
  return {texture:t,label:'Poly Haven HDRI '+res,photographic:true};
 }catch(e){console.warn('R73 HDRI fallback',e);return {texture:makeSky(T,source,atmosphere),label:'Процедурное HDRI (резерв)',photographic:false};}
}
function bakeInstances(T,o,keep=o.count,src=o.geometry){
 const p=src.attributes.position,n=src.attributes.normal,uv=src.attributes.uv,col=src.attributes.color;
 const count=p.count,N=count*keep,index=src.index,ic=index?.count||count;
 const pos=new Float32Array(N*3),normal=new Float32Array(N*3),tex=new Float32Array(N*2),colors=new Float32Array(N*4),idx=new Uint32Array(ic*keep);
 const M=new T.Matrix4(),NM=new T.Matrix3(),v=new T.Vector3(),c=new T.Color();
 for(let i=0;i<keep;i++){
  const sourceIndex=Math.min(o.count-1,Math.floor((i+.5)*o.count/keep));o.getMatrixAt(sourceIndex,M);NM.getNormalMatrix(M);c.setRGB(1,1,1);if(o.instanceColor)o.getColorAt(sourceIndex,c);
  for(let j=0;j<count;j++){let k=i*count+j;v.fromBufferAttribute(p,j).applyMatrix4(M);pos.set([v.x,v.y,v.z],k*3);if(n){v.fromBufferAttribute(n,j).applyNormalMatrix(NM);normal.set([v.x,v.y,v.z],k*3);}if(uv)tex.set([uv.getX(j),uv.getY(j)],k*2);
   colors.set([c.r*(col?col.getX(j):1),c.g*(col?col.getY(j):1),c.b*(col?col.getZ(j):1),col?.itemSize===4?col.getW(j):1],k*4);
  }
  for(let j=0;j<ic;j++)idx[i*ic+j]=i*count+(index?index.getX(j):j);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(normal,3));g.setAttribute('uv',new T.BufferAttribute(tex,2));g.setAttribute('color',new T.BufferAttribute(colors,4));g.setIndex(new T.BufferAttribute(idx,1));if(!n)g.computeVertexNormals();
 return g;
}
// R125: a render-only proxy for the exact R121/R122 compound leaf layout.
 // Preserve every instance and the alpha silhouette; replace dense leaflet
 // tessellation with four gently folded triangles per leaflet.
function rowanLeafProxy(T,src){
 const p=src.attributes.position,uv=src.attributes.uv,c=src.attributes.color;
 if(!p||!uv||p.count!==13*21+4)return null;
 const pos=[],tex=[],col=[],idx=[],V=i=>new T.Vector3().fromBufferAttribute(p,i);
 const add=(v,u,t,ci)=>{pos.push(v.x,v.y,v.z);tex.push(u,t);col.push(c?c.getX(ci):1,c?c.getY(ci):1,c?c.getZ(ci):1);};
 for(let k=0;k<13;k++){
  const o=k*21,a=V(o+1),b=V(o+19),mid=V(o+10),span=V(o+11).sub(V(o+9)).multiplyScalar(.5),base=pos.length/3;
  add(a.clone().sub(span),0,0,o+1);add(a.clone().add(span),1,0,o+1);
  add(b.clone().sub(span),0,1,o+19);add(b.clone().add(span),1,1,o+19);add(mid,.5,.5,o+10);
  idx.push(base,base+4,base+1,base+1,base+4,base+3,base+3,base+4,base+2,base+2,base+4,base);
 }
 const q=pos.length/3;for(let i=p.count-4;i<p.count;i++)add(V(i),uv.getX(i),uv.getY(i),i);idx.push(q,q+1,q+2,q+1,q+3,q+2);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(tex,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
// Render-only lawn: deterministic, terrain-aware, budgeted blade geometry.
// Preserve paths, water, buildings and authored grass height.
function renderLawn(T,cfg,budget){
 if(!cfg||budget<3000)return null;
 const {bounds:b,contains,terrainAt,focus,profile:p}=cfg;
 const width=b.x1-b.x0,depth=b.z1-b.z0,area=width*depth;
 if(!(area>0))return null;
 const pal=(p.palette||['#626e43','#778254','#81905f','#4f613b']).map(x=>new T.Color(x));
 let seed=1987,count=0,tufts=0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const density=Math.max(.35,Math.min(2.7,p.density||1));
 const h0=Math.max(.015,p.height||.055),w0=p.width||.0024;
 // Shared alpha-cutout atlas: many curved, individually shaded blades per card.
 // Canvas-backed texture is directly supported by the path tracer's texture atlas.
 const atlas=document.createElement('canvas');atlas.width=256;atlas.height=128;
 const ctx=atlas.getContext('2d');
 if(!ctx)throw Error('Не удалось создать текстуру травы');
 const perCard=20;
 for(let i=0;i<perCard;i++){
  const x=9+(i+.3+rand()*.4)*(238/perCard),top=8+rand()*47,lean=(rand()-.5)*40,w=2.5+rand()*3;
  const g=ctx.createLinearGradient(x,126,x+lean,top);
  g.addColorStop(0,'rgb(145,145,141)');g.addColorStop(.5,'rgb(214,216,206)');g.addColorStop(1,'rgb(250,250,240)');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-w,127);ctx.quadraticCurveTo(x+lean*.15-w,65,x+lean,top);ctx.quadraticCurveTo(x+lean*.25+w,77,x+w,127);ctx.closePath();ctx.fill();
 }
 const map=new T.CanvasTexture(atlas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 const cp=[],cc=[],cu=[],ci=[],bp=[],bc=[],bi=[];
 const addCard=(x,y,z,a,h,half,c)=>{
  const dx=Math.cos(a)*half,dz=Math.sin(a)*half,k=cp.length/3;
  cp.push(x-dx,y,z-dz,x+dx,y,z+dz,x-dx,y+h,z-dz,x+dx,y+h,z+dz);cu.push(0,0,1,0,0,1,1,1);
  for(let j=0;j<4;j++)cc.push(c.r,c.g,c.b,1);
  ci.push(k,k+1,k+2,k+1,k+3,k+2);
 };
 const addTuft=(x,z)=>{
  if(!contains(x,z))return;const y=terrainAt(x,z);if(!Number.isFinite(y))return;
  const patch=.82+.18*Math.sin(x*1.9+Math.sin(z*.72))*Math.cos(z*1.5);
  const h=h0*(.75+.60*rand())*patch,a=rand()*Math.PI,c=pal[Math.floor(rand()*pal.length)].clone().multiplyScalar(.93+.16*rand());
  const half=Math.max(.045,Math.min(.14,h*.92+Math.sqrt(area/Math.max(1,desired))*.27));
  addCard(x,y+.001,z,a,h,half,c);addCard(x,y+.001,z,a+Math.PI/2,h*.94,half,c);tufts++;
 };
 const addBlade=(x,z)=>{
  if(!contains(x,z))return;const y=terrainAt(x,z);if(!Number.isFinite(y))return;
  const a=rand()*Math.PI*2,h=h0*(.72+.58*rand()),w=w0*(.8+.65*rand()),dx=Math.cos(a)*w,dz=Math.sin(a)*w;
  const lean=h*(p.lean||.3)*(.5+rand()),lx=-Math.sin(a)*lean,lz=Math.cos(a)*lean,c=pal[Math.floor(rand()*pal.length)],k=bp.length/3;
  const v=(xx,yy,zz,t)=>{bp.push(xx,yy,zz);bc.push(c.r*t,c.g*t,c.b*t,1);};
  v(x-dx,y+.002,z-dz,.78);v(x+dx,y+.002,z+dz,.83);v(x+lx*.32-dx*.55,y+h*.55,z+lz*.32-dz*.55,.98);v(x+lx*.32+dx*.55,y+h*.55,z+lz*.32+dz*.55,1);v(x+lx,y+h,z+lz,1.08);
  bi.push(k,k+1,k+2,k+1,k+3,k+2,k+2,k+3,k+4);count++;
 };
 const desired=Math.max(1,Math.floor(budget*.78/4*Math.min(1,density/1.25)));
 const nx=Math.max(1,Math.floor(Math.sqrt(desired*width/depth))),nz=Math.max(1,Math.floor(desired/nx));
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)addTuft(b.x0+(i+rand())*width/nx,b.z0+(j+rand())*depth/nz);
 const radius=Math.min(7,Math.sqrt(area)*.36),near=Math.max(0,Math.floor((budget-ci.length/3)/3*Math.min(1,density/1.15)));
 for(let i=0;i<near;i++){const a=rand()*Math.PI*2,r=radius*Math.sqrt(rand()),x=focus.x+Math.cos(a)*r,z=focus.z+Math.sin(a)*r;if(x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1)addBlade(x,z);}
 const meshes=[];
 const build=(pos,col,idx,uv,mat,name)=>{
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,4));g.setAttribute('uv',new T.Float32BufferAttribute(uv||new Float32Array(pos.length/3*2),2));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new T.Mesh(g,mat);mesh.name=name;meshes.push(mesh);
 };
 if(tufts)build(cp,cc,ci,cu,new T.MeshStandardMaterial({map,alphaTest:.42,vertexColors:true,side:T.DoubleSide,roughness:.9,metalness:0}),'forma-render-turf-cards-r128');else map.dispose();
 if(count)build(bp,bc,bi,null,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.87,metalness:0}),'forma-render-grass-blades-r128');
 return meshes.length?{meshes,count,tufts,triangles:(ci.length+bi.length)/3,textures:tufts?[map]:[]}:null;
}
function snapshot(T,source,root,camera,sky,profile,atmosphere={},lawn=null){
 source.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const scene=new T.Scene(),geometries=[],materials=[],ownedTextures=[],materialCache=new Map();
 let triangles=0,skipped=0,instances=0,reduced=0;
 const meshes=[];root.traverseVisible(o=>{
  if(!o.isMesh||!o.geometry?.attributes.position)return;
  if(o.userData?.selectionProxy||o.userData?.formaWeatherPreview||/selection|preview.*cursor|brush|gizmo|underlay/i.test(o.name))return;
  const ms=Array.isArray(o.material)?o.material:[o.material];
  if(ms.some(m=>!m?.isMeshStandardMaterial&&!m?.isMeshBasicMaterial)){skipped++;return;}
  if(o.isSkinnedMesh){skipped++;return;}
  if(lawn&&/forma-(?:close-turf-detail|grass-blades|basal-turf|parcel-distant-turf)/i.test(o.name))return;
  if(o.isInstancedMesh&&ms.length>1){skipped++;return;}
  const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
  meshes.push(o);
 });
 // Keep all trees and fruit instances. Budget reduction first replaces
 // costly repeated meshes with coverage-preserving proxies, then reduces grass.
 const limit=isMobile()?650000:profile==='high'?4000000:2500000;
 const proxies=new Map(),ownedProxies=[],keepCounts=new Map();
 const grass=o=>o.isInstancedMesh&&/grass|turf|lawn|dry-ears|forma-flower/i.test(o.name+' '+(o.parent?.name||''));
 const costs=o=>{const g=proxies.get(o)||o.geometry;return (g.index?.count||g.attributes.position.count)/3;};
 let simplified=0,used=0,grassCost=0;
 for(const o of meshes){
  if(o.isInstancedMesh&&o.name==='rowan-pinnate-foliage'){
   const g=rowanLeafProxy(T,o.geometry);if(g){proxies.set(o,g);ownedProxies.push(g);simplified+=o.count;}
  }else if(o.isInstancedMesh&&o.name==='rowan-fruit-berries'&&o.geometry.attributes.position.count>50){
   const g=new T.SphereGeometry(1,6,4);proxies.set(o,g);ownedProxies.push(g);simplified+=o.count;
  }
  const cost=costs(o)*(o.isInstancedMesh?o.count:1);if(grass(o))grassCost+=cost;else used+=cost;
 }
 if(used>limit){for(const g of ownedProxies)g.dispose();throw Error('Для сохранения всей кроны и объектов нужно '+Math.round(used/1000)+' тыс. треугольников. Лимит режима '+Math.round(limit/1000)+' тыс. Выберите высокое качество или уменьшите число деревьев.');}
 const lawnBudget=lawn?Math.min(profile==='high'?780000:360000,Math.floor(Math.max(0,limit-used)*.82)):0;
 const existingBudget=limit-lawnBudget;
 const factor=Math.min(1,Math.max(0,(existingBudget-used)/Math.max(1,grassCost)));
 for(const o of meshes){if(!grass(o))continue;const keep=Math.min(o.count,Math.floor(o.count*factor),Math.floor(Math.max(0,existingBudget-used)/costs(o)));keepCounts.set(o,keep);used+=keep*costs(o);reduced+=o.count-keep;}
 triangles=used;
 const cloneMat=(m,instanced)=>{
  const key=m.uuid+'|'+instanced;if(materialCache.has(key))return materialCache.get(key);
  let p=m.isMeshStandardMaterial?m.clone():new T.MeshStandardMaterial({color:m.color,map:m.map,roughness:1,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,side:m.side});
  if(instanced)p.vertexColors=true;p.onBeforeCompile=()=>{};p.customProgramCacheKey=()=>'';materials.push(p);materialCache.set(key,p);return p;
 };
 try{
 for(const o of meshes){
  const keep=keepCounts.get(o)??(o.isInstancedMesh?o.count:1);if(!keep)continue;
  const g=o.isInstancedMesh?bakeInstances(T,o,keep,proxies.get(o)||o.geometry):o.geometry.clone();geometries.push(g);
  if(o.isInstancedMesh)instances+=keep;
  const c=g.attributes.color;
  if(c&&c.itemSize===3){const a=new Float32Array(c.count*4);for(let i=0;i<c.count;i++)a.set([c.getX(i),c.getY(i),c.getZ(i),1],i*4);g.setAttribute('color',new T.BufferAttribute(a,4));}
  const m=Array.isArray(o.material)?o.material.map(x=>cloneMat(x,!!o.isInstancedMesh)):cloneMat(o.material,!!o.isInstancedMesh);
  const mesh=new T.Mesh(g,m);mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);mesh.name=o.name;scene.add(mesh);
 }
 let lawnBlades=0,lawnTufts=0;
 if(lawnBudget){const detail=renderLawn(T,lawn,lawnBudget);if(detail){for(const mesh of detail.meshes){scene.add(mesh);geometries.push(mesh.geometry);materials.push(mesh.material);}ownedTextures.push(...detail.textures);triangles+=detail.triangles;lawnBlades=detail.count;lawnTufts=detail.tufts;}}
 // An isolated specimen should sit in a continuous meadow, not a floating tile.
 if(lawn?.horizon){
  const ground=meshes.find(o=>o.userData?.ground);
  if(ground&&!Array.isArray(ground.material)){
   const box=new T.Box3().setFromObject(ground),size=box.getSize(new T.Vector3()),span=Math.max(300,size.x*10,size.z*10);
   const g=new T.PlaneGeometry(span,span);g.rotateX(-Math.PI/2);const uv=g.attributes.uv;
   for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)-.5)*span/Math.max(1,size.x)+.5,(uv.getY(i)-.5)*span/Math.max(1,size.z)+.5);
   const m=cloneMat(ground.material,false).clone();m.aoMap=null;m.bumpMap=null;m.side=T.DoubleSide;materials.push(m);geometries.push(g);
   const meadow=new T.Mesh(g,m);meadow.position.y=box.min.y-.12;scene.add(meadow);triangles+=2;
  }
 }
 // Use the authored world-space sun direction. The tracer supports directional
 // lights directly, so there is no arbitrary finite-distance area-light surrogate.
 // Do not duplicate viewport fill: GI and the environment already provide bounce.
 const time=atmosphere.time||'day',weather=atmosphere.weather||'sunny';
 const cloudy=['overcast','rain','fog','snow'].includes(weather),night=['night','blue-hour'].includes(time);
 source.traverseVisible(o=>{
  if(!o.isDirectionalLight&&!o.isPointLight&&!o.isSpotLight&&!o.isRectAreaLight)return;
  if(/forma-(sky|bounced)-fill/i.test(o.name))return;
  if(o.name==='sun'&&o.isDirectionalLight&&night)return;
  if(o.name==='sun'&&o.isDirectionalLight&&!cloudy&&o.intensity>0){
   const target=o.target.getWorldPosition(new T.Vector3()),dir=o.getWorldPosition(new T.Vector3()).sub(target).normalize();
   const u=new T.Vector3(0,1,0).cross(dir);if(u.lengthSq()<1e-6)u.set(1,0,0);else u.normalize();const v=dir.clone().cross(u).normalize();
   const radius=Math.tan(T.MathUtils.degToRad(Math.max(.27,Math.min(.9,(atmosphere.solarSoftness||3)*.14))));
   const n=9;for(let i=0;i<n;i++){const a=i*2.399963,r=radius*Math.sqrt((i+.5)/n),d=dir.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r).normalize();const l=new T.DirectionalLight(o.color,o.intensity/n);l.position.copy(target).addScaledVector(d,100);l.target.position.copy(target);scene.add(l,l.target);}return;
  }
  const l=o.clone();l.position.setFromMatrixPosition(o.matrixWorld);l.quaternion.copy(o.getWorldQuaternion(new T.Quaternion()));
  if(o.target){l.target=new T.Object3D();l.target.position.setFromMatrixPosition(o.target.matrixWorld);scene.add(l.target);}
  // Retain the user's solar strength and colour; cloudy weather already lowers
  // editor sun intensity. Further attenuate the direct component for diffuse sky.
  if(o.name==='sun'&&o.isDirectionalLight)l.intensity*=cloudy?.35:1.0;
  scene.add(l);
 });
 const env=sky.texture;scene.environment=env;scene.background=env;
 // Decouple visible sky brightness from irradiance to avoid washing out surfaces.
 scene.environmentIntensity=night?(time==='night'?.32:.62):cloudy?1.0:sky.photographic?.95:1.04;
 scene.backgroundIntensity=sky.photographic?.87:night?.85:1.0;
 scene.updateMatrixWorld(true);
 const cam=camera.clone();cam.updateMatrixWorld(true);
 for(const g of ownedProxies)g.dispose();ownedProxies.length=0;
 return {scene,cam,triangles,instances,skipped,reduced,simplified,lawnBlades,lawnTufts,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of ownedTextures)t.dispose();env.dispose();}};
 }catch(e){for(const g of ownedProxies)g.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of ownedTextures)t.dispose();throw e;}
}
export function createPathTraceMode(T,{renderer,scene,root,camera,canvas,profile='balanced',atmosphere={},lawn=null,onClose=()=>{},onFailure=()=>{}}){
 let alive=true,pt=null,snap=null,sky=null,denoise=null,denoiseQuad=null,raf=0,loading=true,finished=false,building=false,cleaned=false,resultBlob=null;
 const oldRatio=renderer.getPixelRatio(),oldTone=renderer.toneMapping,oldExposure=renderer.toneMappingExposure;
 const ui=document.createElement('div');ui.style.cssText='position:fixed;inset:0;z-index:100000;background:transparent;touch-action:none;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:auto;';
 const panel=document.createElement('div');panel.style.cssText='width:min(440px,96vw);background:#22262df5;color:#eee;border:1px solid #777;border-radius:12px;padding:12px;font:13px system-ui;box-shadow:0 10px 45px #0005;';
 panel.innerHTML='<strong style="font-size:15px">FORMA · РЕНДЕР ВИДЕОКАРТОЙ</strong><div data-msg style="margin:8px 0">Подготовка сцены…</div><progress value="0" max="64" style="width:100%;height:8px"></progress><div style="display:flex;gap:8px;margin-top:10px"><button data-close style="flex:1;padding:12px">В редактор</button><button data-save disabled style="flex:1;padding:12px">Сохранить PNG</button></div><small style="display:block;margin-top:8px;color:#bbb">Накопительный GPU-рендер · адаптивное качество</small>';
 ui.append(panel);document.body.append(ui);const msg=panel.querySelector('[data-msg]'),bar=panel.querySelector('progress'),save=panel.querySelector('[data-save]');
 const target=profile==='high'?128:48;bar.max=target;
 function cleanup(){if(cleaned)return;cleaned=true;
  // v0.0.23 public dispose has a legacy quad name; release the real resources.
  if(pt){try{pt.dispose()}catch{try{pt._quad?.material?.dispose();pt._quad?.dispose();pt._pathTracer?.dispose();}catch{}}try{pt._lowResPathTracer?.dispose();}catch{}}
  denoise?.dispose();denoiseQuad?.dispose();if(snap)snap.dispose();else sky?.texture?.dispose();
 }
 function close(){if(!alive)return;alive=false;cancelAnimationFrame(raf);ui.remove();if(!building)cleanup();renderer.toneMapping=oldTone;renderer.toneMappingExposure=oldExposure;if(!renderer.getContext().isContextLost())renderer.setPixelRatio(oldRatio);onClose();}
 panel.querySelector('[data-close]').onclick=close;
 save.onclick=()=>{const download=b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='FORMA-GPU-R128.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);};if(resultBlob)download(resultBlob);else if(pt?.samples>=1&&!renderer.getContext().isContextLost())canvas.toBlob(download,'image/png');};
 function error(e){loading=false;finished=true;console.error('FORMA GPU R128',e);const reason=e?.message||String(e);close();onFailure(reason);}
 const handle={close,get active(){return alive;},get samples(){return pt?.samples||0;}};
 (async()=>{try{
  if(!renderer.capabilities.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float'))throw Error('GPU не поддерживает необходимые WebGL2 HDR-буферы');
  const {WebGLPathTracer,DenoiseMaterial}=await import('three-gpu-pathtracer');const {FullScreenQuad}=await import('three/addons/postprocessing/Pass.js');if(!alive)return;
  msg.textContent='Загрузка фотографического HDRI…';sky=await loadSkyR73(T,scene,atmosphere);if(!alive){sky.texture.dispose();return;}
  msg.textContent='Подготовка полигонов и материалов…';await nextFrame();if(!alive)return;
  snap=snapshot(T,scene,root,camera,sky,profile,atmosphere,lawn);
  msg.textContent='Построение BVH: '+Math.round(snap.triangles/1000)+' тыс. треугольников…';await nextFrame();if(!alive)return;
  building=true;
  pt=new WebGLPathTracer(renderer);pt.bounces=profile==='high'?6:4;pt.transmissiveBounces=profile==='high'?12:8;pt.multipleImportanceSampling=true;pt.tiles.set(2,2);pt.renderScale=profile==='high'?1:.55;pt.textureSize.set(profile==='high'?1024:512,profile==='high'?1024:512);pt.minSamples=1;pt.renderDelay=0;pt.fadeDuration=0;pt.rasterizeScene=false;pt.filterGlossyFactor=.25;
  renderer.setPixelRatio(Math.min(oldRatio,profile==='high'?1:0.85));pt.setScene(snap.scene,snap.cam);denoise=new DenoiseMaterial({sigma:1.25,threshold:.035,kSigma:1.5});denoiseQuad=new FullScreenQuad(denoise);building=false;
  if(!alive){cleanup();return;}
  renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=Math.max(.75,Math.min(1.45,(oldExposure||1)*(['night','blue-hour'].includes(atmosphere.time)?1:1.10)));loading=false;
  function tick(){if(!alive||finished)return;try{
   if(renderer.getContext().isContextLost())throw Error('WebGL отключён');pt.renderSample();const n=Math.floor(pt.samples);bar.value=n;save.disabled=n<1;
   msg.textContent=pt.isCompiling?'Компиляция GPU-шейдера…':'Сэмплы '+n+' / '+target+' · '+Math.round(snap.triangles/1000)+' тыс. треуг. · '+snap.instances+' инстансов · '+sky.label+(snap.skipped?' · пропущено спец. объектов: '+snap.skipped:'')+(snap.simplified?' · сохранено листьев/ягод с LOD: '+snap.simplified:'')+(snap.lawnTufts?' · пучков травы: '+snap.lawnTufts.toLocaleString('ru-RU'):'')+(snap.lawnBlades?' · объёмных травинок: '+snap.lawnBlades.toLocaleString('ru-RU'):'')+(snap.reduced?' · сокращено инстансов газона: '+snap.reduced:'');
   if(n>=target){if(profile==='high'){denoise.map=pt.target.texture;denoiseQuad.render(renderer);}finished=true;save.disabled=true;canvas.toBlob(b=>{if(!alive)return;if(!b||renderer.getContext().isContextLost()){error(Error('Не удалось сохранить кадр GPU'));return;}resultBlob=b;cleanup();pt=null;snap=null;save.disabled=false;msg.textContent+=' · готово, память освобождена';},'image/png');return;}raf=requestAnimationFrame(tick);
  }catch(e){error(e);}}
  raf=requestAnimationFrame(tick);
 }catch(e){building=false;if(!alive){cleanup();return;}error(e);}})();
 return handle;
}
