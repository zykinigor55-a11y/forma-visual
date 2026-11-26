import {bakeCloudEnvironment} from './forma-photographic-environment-r71.js?v=R131';
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
 const half=new Uint16Array(data.length);for(let i=0;i<data.length;i++)half[i]=T.DataUtils.toHalfFloat(data[i]);const t=new T.DataTexture(half,w,h,T.RGBAFormat,T.HalfFloatType);t.mapping=T.EquirectangularReflectionMapping;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.wrapS=T.RepeatWrapping;t.colorSpace=T.LinearSRGBColorSpace;t.needsUpdate=true;return t;
}
async function loadSkyR73(T,source,atmosphere={},renderer,profile,isAlive,onProgress){
 if(renderer&&atmosphere.cloudSettings&&atmosphere.renderClouds==='volume'){try{return await bakeCloudEnvironment(T,renderer,{sun:source.getObjectByName('sun'),time:atmosphere.time,weather:atmosphere.weather,settings:atmosphere.cloudSettings,high:profile==='high'&&!isMobile(),mobile:isMobile(),isAlive,onProgress});}catch(e){if(!isAlive()||renderer.getContext().isContextLost())throw e;console.warn('FORMA cloud HDR fallback',e);}}
 const sun=source.getObjectByName('sun'),time=atmosphere.time||'day',weather=atmosphere.weather||'sunny';
 if(atmosphere.renderClouds!=='photo-hdri')return {texture:makeSky(T,source,atmosphere),label:'Небо FORMA · рассеянный свет',photographic:false};
 const diffuse=['overcast','rain','fog','snow'].includes(weather);
 if(!sun||sun.intensity<.3||time!=='day'||diffuse)return {texture:makeSky(T,source,atmosphere),label:'Небо по времени суток и погоде',photographic:false};
 const id='kloppenheim_03_puresky',res=isMobile()?'1k':'2k',file=id+'_'+res+'.hdr';
 try{
  const {HDRLoader}=await import('three/addons/loaders/HDRLoader.js');
  const loader=new HDRLoader().setDataType(T.FloatType);
  let t;try{t=await loader.loadAsync(new URL('./assets/landscape-photo/r67/'+file,document.baseURI).href);}catch{t=await loader.loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/'+res+'/'+file);}
  const d=t.image.data;let avg=0,count=0;
  for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];if(Number.isFinite(y)&&y>0&&y<25){avg+=y;count++;}}
  if(!count)throw Error('HDRI has no valid radiance');
  const gain=.76/Math.max(.04,avg/count);
  // Preserve cloud radiance contrast; limit direct solar hotspots because a separate area light supplies direct sunlight.
  for(let i=0;i<d.length;i+=4){const y=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])*gain;const scale=gain*Math.min(1,2.4/Math.max(.00001,y));for(let j=0;j<3;j++)d[i+j]=Math.max(0,Number.isFinite(d[i+j])?d[i+j]*scale:0);d[i+3]=1;}
  const half=new Uint16Array(d.length);for(let i=0;i<d.length;i++)half[i]=T.DataUtils.toHalfFloat(d[i]);const filtered=new T.DataTexture(half,t.image.width,t.image.height,T.RGBAFormat,T.HalfFloatType);filtered.flipY=t.flipY;filtered.mapping=T.EquirectangularReflectionMapping;filtered.minFilter=T.LinearFilter;filtered.magFilter=T.LinearFilter;filtered.wrapS=T.RepeatWrapping;filtered.colorSpace=T.LinearSRGBColorSpace;filtered.needsUpdate=true;t.dispose();
  return {texture:filtered,label:'Poly Haven HDRI '+res,photographic:true};
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
function rowanLeafProxy(T,src,curved=false){
 const p=src.attributes.position,uv=src.attributes.uv,c=src.attributes.color;
 if(!p||!uv||p.count!==13*21+4)return null;
 const pos=[],tex=[],col=[],idx=[],V=i=>new T.Vector3().fromBufferAttribute(p,i);
 const add=(v,u,t,ci)=>{pos.push(v.x,v.y,v.z);tex.push(u,t);col.push(c?c.getX(ci):1,c?c.getY(ci):1,c?c.getZ(ci):1);};
 for(let k=0;k<13;k++){
  const o=k*21,a=V(o+1),b=V(o+19),mid=V(o+10),span=V(o+11).sub(V(o+9)).multiplyScalar(.5),base=pos.length/3;
  add(a.clone().sub(span),0,0,o+1);add(a.clone().add(span),1,0,o+1);
  add(b.clone().sub(span),0,1,o+19);add(b.clone().add(span),1,1,o+19);add(mid,.5,.5,o+10);
  if(curved){add(V(o+9),uv.getX(o+9),.5,o+9);add(V(o+11),uv.getX(o+11),.5,o+11);idx.push(base,base+4,base+1,base,base+5,base+4,base+1,base+4,base+6,base+5,base+2,base+4,base+4,base+2,base+3,base+4,base+3,base+6);}else idx.push(base,base+4,base+1,base+1,base+4,base+3,base+3,base+4,base+2,base+2,base+4,base);
 }
 const q=pos.length/3;for(let i=p.count-4;i<p.count;i++)add(V(i),uv.getX(i),uv.getY(i),i);idx.push(q,q+1,q+2,q+1,q+3,q+2);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(tex,2));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
// Render-only lawn: deterministic, terrain-aware, budgeted blade geometry.
// Preserve paths, water, buildings and authored grass height.
function renderLawn(T,cfg,budget){
 if(!cfg||budget<3000)return null;
 const {bounds:b,contains,terrainAt,focus,profile:p,visible=()=>true}=cfg;
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
 const desired=Math.max(1,Math.floor(budget*.78/4*Math.min(1,density/1.85)));
 const probe=16;let hits=0;for(let j=0;j<probe;j++)for(let i=0;i<probe;i++)if(visible(b.x0+(i+.5)*width/probe,b.z0+(j+.5)*depth/probe))hits++;
 const share=Math.max(.12,hits/(probe*probe));
 const grid=Math.ceil(desired/(share+(1-share)*.12));
 const nx=Math.max(1,Math.floor(Math.sqrt(grid*width/depth))),nz=Math.max(1,Math.floor(grid/nx));
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=b.x0+(i+rand())*width/nx,z=b.z0+(j+rand())*depth/nz;if(tufts>=desired)break;if(visible(x,z)||rand()<.12)addTuft(x,z);}
 const radius=Math.min(7,Math.sqrt(area)*.36),near=Math.max(0,Math.floor((budget-ci.length/3)/3*Math.min(1,density/1.85)));
 for(let i=0;i<near*5&&count<near;i++){const a=rand()*Math.PI*2,r=radius*Math.sqrt(rand()),x=focus.x+Math.cos(a)*r,z=focus.z+Math.sin(a)*r;if(x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&visible(x,z))addBlade(x,z);}
 const meshes=[];
 const build=(pos,col,idx,uv,mat,name)=>{
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,4));g.setAttribute('uv',new T.Float32BufferAttribute(uv||new Float32Array(pos.length/3*2),2));g.setIndex(idx);g.computeVertexNormals();
  const mesh=new T.Mesh(g,mat);mesh.name=name;meshes.push(mesh);
 };
 if(tufts)build(cp,cc,ci,cu,new T.MeshStandardMaterial({map,alphaTest:.42,vertexColors:true,side:T.DoubleSide,roughness:.9,metalness:0}),'forma-render-turf-cards-r128');else map.dispose();
 if(count)build(bp,bc,bi,null,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.87,metalness:0}),'forma-render-grass-blades-r128');
 return meshes.length?{meshes,count,tufts,triangles:(ci.length+bi.length)/3,textures:tufts?[map]:[]}:null;
}
// Bake displacement into actual triangles before BVH construction. Only
// authored thick wood tubes are tessellated; small twigs remain untouched.
function barkDisplacement(T,o,subdiv){
 const g=o.geometry,m=o.material,meta=m?.userData?.formaDisplacement,ranges=g.userData?.formaWoodRanges;
 const image=m?.displacementMap?.image;
 if(!meta||!ranges?.length||!image?.data||!g.index||!g.attributes.uv||!g.attributes.normal)return null;
 const {data,width:w,height:h}=image,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,c=g.attributes.color,index=g.index;
 const mod=(x,k)=>((x%k)+k)%k;
 const sample=(u,v)=>{
  const x=mod(u,1)*w-.5,y=mod(v,1)*h-.5,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;
  const get=(x,y)=>data[(mod(y,h)*w+mod(x,w))*4]/255;
  return (get(i,j)*(1-a)+get(i+1,j)*a)*(1-b)+(get(i,j+1)*(1-a)+get(i+1,j+1)*a)*b;
 };
 const pos=Array.from(p.array),nor=Array.from(n.array),tex=Array.from(uv.array),col=c?Array.from(c.array):Array(p.count*3).fill(1),idx=[];
 let ri=0,displaced=0;
 const normal=new T.Vector3(),point=new T.Vector3();
 for(let k=0;k<index.count;k+=3){
  while(ri<ranges.length&&k>=ranges[ri].end)ri++;
  const range=ranges[ri],ids=[index.getX(k),index.getX(k+1),index.getX(k+2)];
  if(!range||k<range.start){idx.push(...ids);continue;}
  const level=range.stride>=20?subdiv:Math.max(2,Math.floor(subdiv/2));
  const rad=ids.map(id=>range.radii[Math.floor((id-range.base)/range.stride)]||0);
  const rows=[];
  for(let i=0;i<=level;i++){
   const row=[];for(let j=0;j<=level-i;j++){
    const b=i/level,d=j/level,a=1-b-d,weights=[a,b,d];
    const blend=(attr,channel)=>ids.reduce((sum,id,q)=>sum+weights[q]*attr.array[id*attr.itemSize+channel],0);
    const u=blend(uv,0),v=blend(uv,1),radius=rad[0]*a+rad[1]*b+rad[2]*d;
    normal.set(blend(n,0),blend(n,1),blend(n,2)).normalize();
    point.set(blend(p,0),blend(p,1),blend(p,2));
    const amount=(sample(u,v)-(meta.mid??.5))*Math.min(meta.scale,radius*.12);
    point.addScaledVector(normal,amount);
    const id=pos.length/3;pos.push(point.x,point.y,point.z);nor.push(normal.x,normal.y,normal.z);tex.push(u,v);col.push(c?blend(c,0):1,c?blend(c,1):1,c?blend(c,2):1);row.push(id);
   }rows.push(row);
  }
  for(let i=0;i<level;i++)for(let j=0;j<level-i;j++){idx.push(rows[i][j],rows[i+1][j],rows[i][j+1]);if(j<level-i-1)idx.push(rows[i+1][j],rows[i+1][j+1],rows[i][j+1]);}
  displaced+=level*level;
 }
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));out.setAttribute('uv',new T.Float32BufferAttribute(tex,2));out.setAttribute('color',new T.Float32BufferAttribute(col,3));out.setIndex(idx);out.computeBoundingSphere();return {geometry:out,displaced};
}
// The tracer reads normal maps but not Three.js bump maps. Convert readable
// height textures to tangent-space normals, retaining the original UV transform.
function bumpToNormal(T,source,strength){
 const im=source?.image;if(!im)return null;
 const w=Math.min(1024,im.width||im.videoWidth||0),h=Math.min(1024,im.height||im.videoHeight||0);if(w<2||h<2)return null;
 let d;
 if(im.data&&im.width===w&&im.height===h&&im.data.length===w*h*4&&im.data instanceof Uint8Array)d=im.data;
 else{try{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0,w,h);d=ctx.getImageData(0,0,w,h).data;}catch{return null;}}
 const rgba=new Uint8Array(w*h*4),get=(x,y)=>{const i=(((y+h)%h)*w+(x+w)%w)*4;return (.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(get(x+1,y)-get(x-1,y))*strength,dy=(get(x,y+1)-get(x,y-1))*strength,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;rgba.set([128-127*dx/l,128+(source.flipY?-1:1)*127*dy/l,128+127/l,255],i);}
 const t=new T.DataTexture(rgba,w,h,T.RGBAFormat);t.colorSpace=T.NoColorSpace;t.wrapS=source.wrapS;t.wrapT=source.wrapT;t.repeat.copy(source.repeat);t.offset.copy(source.offset);t.center.copy(source.center);t.rotation=source.rotation;t.matrixAutoUpdate=source.matrixAutoUpdate;t.matrix.copy(source.matrix);t.flipY=source.flipY;t.channel=source.channel;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
// General height-map displacement for suitable opaque, single-material meshes.
 // Respect the triangle budget and existing UV mapping; leave transparent sheets,
 // instanced assets and unsupported image formats to their normal maps.
function surfaceDisplacement(T,o,level){
 const g=o.geometry,m=o.material,role=m?.userData?.formaPBRRoleR63||'';
 if(Array.isArray(m)||!m||o.userData?.ground||m.transparent||m.alphaTest>0||m.transmission>0||/leaf|needle|water|glass|metal|plant-other/.test(role))return null;
 const map=m.displacementMap||m.bumpMap,explicit=!!m.displacementMap;
 const scale=explicit?Number(m.displacementScale):Math.min(.018,Math.abs(m.bumpScale||0));
 if(!map||!scale||!g.attributes.uv||!g.attributes.normal||g.groups.length>1)return null;
 const im=map.image,w=im?.width,h=im?.height;if(!w||!h||w*h>16777216)return null;
 let data=im.data;
 if(!data){try{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');ctx.drawImage(im,0,0,w,h);data=ctx.getImageData(0,0,w,h).data;}catch{return null;}}
 if(data.length!==w*h*4||!(data instanceof Uint8Array||data instanceof Uint8ClampedArray))return null;
 map.updateMatrix();const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,c=g.attributes.color,ix=g.index;
 const pos=[],norm=[],tex=[],col=[],idx=[],vec=new T.Vector3(),v2=new T.Vector2(),localScale=o.getWorldScale(new T.Vector3()),maxScale=Math.max(.001,Math.abs(localScale.x),Math.abs(localScale.y),Math.abs(localScale.z));
 const amount=Math.min(Math.abs(scale),.025/maxScale)*Math.sign(scale);
 const sample=(u,v)=>{v2.set(u,v);map.transformUv(v2);const x=Math.min(w-1,Math.max(0,Math.round(v2.x*(w-1)))),y=Math.min(h-1,Math.max(0,Math.round(v2.y*(h-1))));return data[(y*w+x)*4]/255;};
 const total=(ix?.count||p.count);
 for(let k=0;k<total;k+=3){
  const ids=[0,1,2].map(i=>ix?ix.getX(k+i):k+i),rows=[];
  const nn=ids.map(i=>new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));
  // Do not shift triangle borders: adjacent UV islands and hard corners
  // stay welded visually; small texture features remain in normal maps.
  for(let i=0;i<=level;i++){const row=[];for(let j=0;j<=level-i;j++){
   const b=i/level,d=j/level,a=1-b-d,weights=[a,b,d],blend=(at,ch)=>ids.reduce((v,id,q)=>v+weights[q]*at.array[id*at.itemSize+ch],0);
   const u=blend(uv,0),v=blend(uv,1);vec.set(blend(n,0),blend(n,1),blend(n,2)).normalize();
   const edge=Math.min(1,Math.min(a,b,d)*level*1.5),height=(sample(u,v)-.5)*amount*edge;
   const id=pos.length/3;pos.push(blend(p,0)+vec.x*height,blend(p,1)+vec.y*height,blend(p,2)+vec.z*height);norm.push(vec.x,vec.y,vec.z);tex.push(u,v);if(c)for(let ch=0;ch<c.itemSize;ch++)col.push(blend(c,ch));row.push(id);
  }rows.push(row);}
  for(let i=0;i<level;i++)for(let j=0;j<level-i;j++){idx.push(rows[i][j],rows[i+1][j],rows[i][j+1]);if(j<level-i-1)idx.push(rows[i+1][j],rows[i+1][j+1],rows[i][j+1]);}
 }
 const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(norm,3));out.setAttribute('uv',new T.Float32BufferAttribute(tex,2));if(c)out.setAttribute('color',new T.Float32BufferAttribute(col,c.itemSize));out.setIndex(idx);out.computeBoundingSphere();return out;
}
async function snapshot(T,source,root,camera,sky,profile,atmosphere={},lawn=null,isAlive=()=>true,onProgress=()=>{}){
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
 const full=atmosphere.geometryMode==='full';
 const softLimit=isMobile()?650000:profile==='high'?4000000:2500000;
 let limit=softLimit;
 const proxies=new Map(),ownedProxies=[],keepCounts=new Map();
 const grass=o=>o.isInstancedMesh&&/grass|turf|lawn|dry-ears|forma-flower/i.test(o.name+' '+(o.parent?.name||''));
 const costs=o=>{const g=proxies.get(o)||o.geometry;return (g.index?.count||g.attributes.position.count)/3;};
 let simplified=0,used=0,grassCost=0,displacedWood=0,displacedSurfaces=0;
 for(const o of meshes){
  if(!full&&o.isInstancedMesh&&o.name==='rowan-pinnate-foliage'){
   const g=rowanLeafProxy(T,o.geometry);if(g){proxies.set(o,g);ownedProxies.push(g);simplified+=o.count;}
  }else if(!full&&o.isInstancedMesh&&o.name==='rowan-fruit-berries'&&o.geometry.attributes.position.count>50){
   const g=new T.SphereGeometry(1,6,4);proxies.set(o,g);ownedProxies.push(g);simplified+=o.count;
  }
  if(!full&&o.isInstancedMesh&&/^Oak .*botanical leaf maps/i.test(o.name)){
   const g=new T.PlaneGeometry(1,1,1,2),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,.035-.14*y*y);}
   g.computeVertexNormals();proxies.set(o,g);ownedProxies.push(g);simplified+=o.count;
  }
  const cost=costs(o)*(o.isInstancedMesh?o.count:1);if(grass(o))grassCost+=cost;else used+=cost;
 }
 // The base scene is never rejected due to an arbitrary triangle count.
 // Increase the working budget to include all existing objects, leaving
 // a separate allowance for render-only turf and optional microgeometry.
 // Estimate memory for expanded instances before allocating geometry and BVH.
 // deviceMemory reports system RAM, not VRAM; use a conservative heuristic.
 const ram=Number(navigator.deviceMemory)||8;
 const recovery=atmosphere.traceRecovery===true;
 const budget=(isMobile()?128:recovery?192:ram<=4?384:768)*1024*1024;
 const bytesPer=o=>{const g=proxies.get(o)||o.geometry;return g.attributes.position.count*112+(g.index?.count||g.attributes.position.count)*20;};
 const foliage=o=>o.isInstancedMesh&&(grass(o)||/leaf|leaves|foliage|needle|berry|berries|petal|blossom|flower/i.test(o.name+' '+(o.parent?.name||''))||['leaf','needle'].includes(o.material?.userData?.formaPBRRoleR63));
 let estimate=meshes.reduce((sum,o)=>sum+bytesPer(o)*(o.isInstancedMesh?o.count:1),0);
 let reducedFoliage=0;
 if(!full&&(estimate>budget*.72||recovery)){
  const adjustable=meshes.filter(foliage);
  const adjustableBytes=adjustable.reduce((sum,o)=>sum+bytesPer(o)*o.count,0);
  const baseBytes=estimate-adjustableBytes;
  const fraction=Math.min(recovery?.38:1,Math.max(.015,(budget*.72-baseBytes)/Math.max(1,adjustableBytes)));
  for(const o of adjustable){
   const keep=Math.min(o.count,Math.max(1,Math.floor(o.count*fraction)));
   keepCounts.set(o,keep);const cut=o.count-keep;
   if(grass(o))grassCost-=cut*costs(o);else{used-=cut*costs(o);reducedFoliage+=cut;}
   estimate-=cut*bytesPer(o);
  }
 }
 // No triangle-count rejection. Try actual path tracing with the resulting geometry.
 const lawnReserve=lawn?(isMobile()||recovery?35000:estimate>budget*.55?60000:profile==='high'?450000:220000):0;
 limit=Math.max(Math.min(softLimit,used+grassCost+lawnReserve+180000),used+grassCost+lawnReserve+(isMobile()||estimate>budget*.55?0:90000));
 if(!isMobile()&&profile==='high'&&estimate<budget*.55)for(const o of meshes){if(o.name!=='rowan-pinnate-foliage'||!proxies.has(o))continue;const g=rowanLeafProxy(T,o.geometry,true);if(!g)continue;const extra=(g.index.count/3-costs(o))*o.count;if(used+extra+(lawn?360000:0)>limit){g.dispose();continue;}proxies.set(o,g);ownedProxies.push(g);used+=extra;}
 if(!full&&!isMobile()&&estimate<budget*.55)for(const o of meshes){if(o.isInstancedMesh||o.name!=='rowan-bark-trunk-branches')continue;const available=limit-used-(lawn?260000:0);if(available<15000)continue;for(const level of (profile==='high'?[6,4,2]:[3,2])){const result=barkDisplacement(T,o,level);if(!result)break;const extra=result.geometry.index.count/3-costs(o);if(extra>available){result.geometry.dispose();continue;}proxies.set(o,result.geometry);ownedProxies.push(result.geometry);used+=extra;displacedWood+=result.displaced;break;}}
 if(!full&&!isMobile()&&estimate<budget*.55)for(const o of meshes){if(o.isInstancedMesh||proxies.has(o))continue;const base=costs(o),available=Math.min(120000,limit-used-(lawn?280000:0));if(available<base*8||base>12000)continue;const level=profile==='high'&&base*35<=available?6:3;const g=surfaceDisplacement(T,o,level);if(!g)continue;const extra=g.index.count/3-base;if(extra>available){g.dispose();continue;}proxies.set(o,g);ownedProxies.push(g);used+=extra;displacedSurfaces++;}
 const reducedOak=0;
 // No leaf-instance deletion or abort for heavy scenes. Optional grass and
 // micro-displacement budgets remain adaptive; actual device limits still apply.
 limit=Math.max(limit,used+grassCost+lawnReserve);
 const lawnBudget=lawn?Math.min(lawnReserve,Math.floor(Math.max(0,limit-used)*.82)):0;
 const existingBudget=limit-lawnBudget;
 const factor=Math.min(1,Math.max(0,(existingBudget-used)/Math.max(1,grassCost)));
 for(const o of meshes){if(!grass(o))continue;const maxKeep=keepCounts.get(o)??o.count;const keep=Math.min(maxKeep,Math.floor(maxKeep*factor),Math.floor(Math.max(0,existingBudget-used)/costs(o)));keepCounts.set(o,keep);used+=keep*costs(o);reduced+=o.count-keep;}
 triangles=used;
 const bumpCache=new Map();
 const cloneMat=(m,instanced)=>{
  const key=m.uuid+'|'+instanced;if(materialCache.has(key))return materialCache.get(key);
  let p=m.isMeshStandardMaterial?m.clone():new T.MeshStandardMaterial({color:m.color,map:m.map,roughness:1,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,side:m.side});
  const role=m.userData?.formaPBRRoleR63||'';
  if(['leaf','needle','glass','water'].includes(role)&&!p.isMeshPhysicalMaterial){const physical=new T.MeshPhysicalMaterial();for(const k of ['color','map','normalMap','normalScale','roughness','roughnessMap','metalness','metalnessMap','alphaMap','alphaTest','opacity','transparent','side','vertexColors','bumpMap','bumpScale','emissive','emissiveMap','emissiveIntensity','userData']){const v=p[k];if(v!==undefined){if(v?.isColor||v?.isVector2)physical[k].copy(v);else physical[k]=v;}}p.dispose();p=physical;}
  if(instanced)p.vertexColors=true;
  if(p.isMeshPhysicalMaterial){if(role==='leaf'||role==='needle'){p.transmission=role==='needle'?.15:.27;p.thickness=0;p.ior=1.43;p.specularIntensity=.35;p.clearcoat=0;p.metalness=0;}else if(role==='water'||role==='glass'){p.transmission=role==='water'?.94:.92;p.thickness=0;p.ior=role==='water'?1.333:1.5;p.metalness=0;p.transparent=false;p.opacity=1;p.roughness=Math.max(.025,Math.min(.20,p.roughness));}else if(['bark','ground','mineral','metal'].includes(role)){p.transmission=0;}}
  // Thin-film BSDF is a colored transmission approximation, not full botanical SSS.
  if(m.userData?.formaRowanPBR&&p.isMeshPhysicalMaterial){p.transmission=m.userData.formaRowanPBR.pathTransmission??.34;p.thickness=0;p.attenuationDistance=Infinity;p.ior=1.43;p.roughness=.88;p.specularIntensity=.30;p.clearcoat=0;p.normalScale.multiplyScalar(.82);}
  if(!p.normalMap&&p.bumpMap&&p.bumpScale){const strength=Math.min(8,Math.max(.5,Math.abs(p.bumpScale)*250)),key=p.bumpMap.uuid+'|'+strength;let t=bumpCache.get(key);if(!t){t=bumpToNormal(T,p.bumpMap,strength);if(t){bumpCache.set(key,t);ownedTextures.push(t);}}if(t){p.normalMap=t;p.normalScale.set(.75,.75);}}
  p.displacementMap=null;p.displacementScale=0;p.onBeforeCompile=()=>{};p.customProgramCacheKey=()=>'';materials.push(p);materialCache.set(key,p);return p;
 };
 try{
 let processed=0;
 for(const o of meshes){
  if(!isAlive())throw Error('Подготовка сцены отменена');
  if(processed++%4===0){onProgress(processed,meshes.length);await nextFrame();if(!isAlive())throw Error('Подготовка сцены отменена');}
  const keep=keepCounts.get(o)??(o.isInstancedMesh?o.count:1);if(!keep)continue;
  const g=o.isInstancedMesh?bakeInstances(T,o,keep,proxies.get(o)||o.geometry):(proxies.get(o)||o.geometry).clone();geometries.push(g);
  if(o.isInstancedMesh)instances+=keep;
  const c=g.attributes.color;
  if(c&&c.itemSize===3){const a=new Float32Array(c.count*4);for(let i=0;i<c.count;i++)a.set([c.getX(i),c.getY(i),c.getZ(i),1],i*4);g.setAttribute('color',new T.BufferAttribute(a,4));}
  const m=Array.isArray(o.material)?o.material.map(x=>cloneMat(x,!!o.isInstancedMesh)):cloneMat(o.material,!!o.isInstancedMesh);
  const mesh=new T.Mesh(g,m);mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);mesh.name=o.name;scene.add(mesh);
 }
 let lawnBlades=0,lawnTufts=0;
 if(lawnBudget){const detail=renderLawn(T,lawn,lawnBudget);if(detail){for(const mesh of detail.meshes){scene.add(mesh);geometries.push(mesh.geometry);materials.push(mesh.material);}ownedTextures.push(...detail.textures);triangles+=detail.triangles;lawnBlades=detail.count;lawnTufts=detail.tufts;}}
 // An isolated specimen should sit in a continuous meadow, not a floating tile.
 if(lawn?.horizon&&!meshes.some(o=>o.name==='forma-preview-horizon-meadow-r66')){
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
   const radius=Math.tan(T.MathUtils.degToRad(.13+1.65*Math.pow(T.MathUtils.clamp(((atmosphere.solarSoftness||3)-1)/4,0,1),1.5)));
   const n=(atmosphere.solarSoftness||3)<1.5?1:5;for(let i=0;i<n;i++){const a=i*2.399963,r=n===1?0:radius*Math.sqrt((i+.5)/n),d=dir.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r).normalize();const l=new T.DirectionalLight(o.color,(o.userData.formaUncloudedIntensity??o.intensity)*(sky.solarTransmission??1)/n);l.position.copy(target).addScaledVector(d,100);l.target.position.copy(target);scene.add(l,l.target);}return;
  }
  const l=o.clone();l.position.setFromMatrixPosition(o.matrixWorld);l.quaternion.copy(o.getWorldQuaternion(new T.Quaternion()));
  if(o.target){l.target=new T.Object3D();l.target.position.setFromMatrixPosition(o.target.matrixWorld);scene.add(l.target);}
  // Retain the user's solar strength and colour; cloudy weather already lowers
  // editor sun intensity. Further attenuate the direct component for diffuse sky.
  if(o.name==='sun'&&o.isDirectionalLight)l.intensity=(o.userData.formaUncloudedIntensity??o.intensity)*(cloudy?.55:1.0)*(sky.solarTransmission??1);
  scene.add(l);
 });
 const env=sky.texture;scene.environment=env;scene.background=atmosphere.traceSceneTest==='sky'||atmosphere.traceSceneTest==='clay'?new T.Color(night?0x26374f:0x9bb7d0):env;
 // Decouple visible sky brightness from irradiance to avoid washing out surfaces.
 scene.environmentIntensity=night?(time==='night'?.32:.62):cloudy?1:sky.photographic?.95:1.04;
 scene.backgroundIntensity=sky.photographic?.87:night?.85:1.0;
 scene.updateMatrixWorld(true);
 if(atmosphere.traceSceneTest==='clay'){const clay=new T.MeshStandardMaterial({color:0xbababa,roughness:.8,metalness:0,side:T.DoubleSide});materials.push(clay);scene.traverse(o=>{if(o.isMesh)o.material=clay;});}
 const cam=camera.clone();camera.updateWorldMatrix(true,false);camera.matrixWorld.decompose(cam.position,cam.quaternion,cam.scale);cam.updateMatrixWorld(true);
 for(const g of ownedProxies)g.dispose();ownedProxies.length=0;
 return {scene,cam,triangles,instances,skipped,reduced,reducedFoliage,simplified,lawnBlades,lawnTufts,displacedWood,displacedSurfaces,reducedOak,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of ownedTextures)t.dispose();env.dispose();}};
 }catch(e){for(const g of ownedProxies)g.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of ownedTextures)t.dispose();throw e;}
}
export function createPathTraceMode(T,{renderer,scene,root,camera,canvas,profile='balanced',atmosphere={},lawn=null,onClose=()=>{},onFailure=()=>{}}){
 let stage='Инициализация',alive=true,pt=null,snap=null,sky=null,denoise=null,denoiseQuad=null,raf=0,loading=true,finished=false,building=false,cleaned=false,resultBlob=null,backupSky=null,retriedSky=false,lastChecked=0,traceStart=0,displayMat=null,displayQuad=null,exposureEV=0,darkWarning=false,shaderError='',lastShown=-1,finalImageUrl='',lastDrawAt=0;
 const oldSize=renderer.getSize(new T.Vector2());
 const oldRatio=renderer.getPixelRatio(),oldTone=renderer.toneMapping,oldExposure=renderer.toneMappingExposure,oldAutoClear=renderer.autoClear,oldShaderError=renderer.debug.onShaderError,oldCheckShader=renderer.debug.checkShaderErrors;
 let previewUrl='';try{previewUrl=canvas.toDataURL('image/jpeg',.82)}catch{}
 const ui=document.createElement('div');ui.style.cssText='position:fixed;inset:0;z-index:100000;background:transparent;touch-action:none;display:flex;align-items:flex-end;justify-content:center;padding:12px;pointer-events:auto;';
 const panel=document.createElement('div');panel.style.cssText='width:min(440px,96vw);background:#22262df5;color:#eee;border:1px solid #777;border-radius:12px;padding:12px;font:13px system-ui;box-shadow:0 10px 45px #0005;';
 panel.innerHTML='<strong style="font-size:15px">FORMA · РЕНДЕР ВИДЕОКАРТОЙ</strong><div data-msg style="margin:8px 0">Подготовка сцены…</div><progress value="0" max="64" style="width:100%;height:8px"></progress><div style="display:flex;gap:8px;margin-top:10px"><button data-close style="flex:1;padding:12px">В редактор</button><button data-save disabled style="flex:1;padding:12px">Сохранить PNG</button></div><small style="display:block;margin-top:8px;color:#bbb">Настоящая трассировка лучей · накопление сэмплов</small>';
 const preview=document.createElement('div');preview.style.cssText='position:absolute;inset:0;display:grid;place-items:center;background:#14171b;pointer-events:none;z-index:-1';
 if(previewUrl){const image=document.createElement('img');image.src=previewUrl;image.style.cssText='width:100%;height:100%;object-fit:contain;opacity:.86';preview.append(image);}
 const previewLabel=document.createElement('span');previewLabel.textContent='Предпросмотр сцены · подготовка трассировки';previewLabel.style.cssText='position:absolute;top:60px;left:50%;transform:translateX(-50%);padding:8px 14px;background:#22262de8;color:white;border-radius:8px;font:13px system-ui';preview.append(previewLabel);ui.style.isolation='isolate';ui.append(preview,panel);document.body.append(ui);const msg=panel.querySelector('[data-msg]'),bar=panel.querySelector('progress'),save=panel.querySelector('[data-save]');
 const details=document.createElement('small');details.style.cssText='display:block;color:#bfc5ce;margin:5px 0 0';bar.after(details);
 const warning=document.createElement('small');warning.style.cssText='display:block;color:#e4cba1;margin:5px 0';details.after(warning);
 const expRow=document.createElement('label');expRow.style.cssText='display:flex;gap:8px;align-items:center;margin:8px 0';expRow.innerHTML='Экспозиция <input type="range" min="-3" max="8" value="0" step=".25" style="flex:1"><output>0 EV</output>';warning.after(expRow);
 const evInput=expRow.querySelector('input'),evOut=expRow.querySelector('output');
 evInput.oninput=()=>{exposureEV=Number(evInput.value);evOut.textContent=exposureEV.toFixed(2)+' EV';if(pt&&displayQuad&&pt.samples>=1&&!renderer.getContext().isContextLost())showTrace();};
 const diagnostic=atmosphere.traceDiagnostic===true;const sizes={hd:[1280,720],fhd:[1920,1080],qhd:[2560,1440],uhd:[3840,2160]};const [frameW,frameH]=diagnostic?[640,360]:(sizes[atmosphere.traceResolution]||sizes.fhd);const requestedSamples=[16,32,64,128,256].includes(Number(atmosphere.traceSamples))?Number(atmosphere.traceSamples):64;let target=diagnostic?8:requestedSamples;bar.max=target;
 const started=performance.now(),probe=document.createElement('canvas');probe.width=32;probe.height=18;const probeCtx=probe.getContext('2d',{willReadFrequently:true});
 function daylightDark(){if(!probeCtx||!['day','morning','evening'].includes(atmosphere.time||'day'))return false;try{probeCtx.drawImage(canvas,0,0,32,18);const d=probeCtx.getImageData(0,0,32,18).data;let mean=0,bright=0;for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];mean+=y;if(y>25)bright++;}return mean/(d.length/4)<8&&bright/(d.length/4)<.08;}catch{return false;}}
 function showTrace(texture=pt?.target?.texture){if(!texture||!displayQuad)return;renderer.setRenderTarget(null);renderer.setScissorTest(false);const size=renderer.getSize(new T.Vector2());renderer.setViewport(0,0,size.x,size.y);displayMat.uniforms.frame.value=texture;displayMat.uniforms.gain.value=Math.pow(2,exposureEV);displayMat.uniforms.tileGrid.value.copy(pt.tiles);displayMat.uniforms.coverage.value=Math.min(1,pt.samples);displayMat.uniforms.bufferSize.value.set(pt.target.width,pt.target.height);renderer.clear(true,true,true);displayQuad.render(renderer);}
 function fmtTime(ms){const n=Math.max(0,Math.floor(ms/1000));return Math.floor(n/60)+' мин '+String(n%60).padStart(2,'0')+' с';}
 function cleanup(){if(cleaned)return;cleaned=true;
  // v0.0.23 public dispose has a legacy quad name; release the real resources.
  if(pt){try{pt.dispose()}catch{try{pt._quad?.material?.dispose();pt._quad?.dispose();pt._pathTracer?.dispose();}catch{}}try{pt._lowResPathTracer?.dispose();}catch{}}
  denoise?.dispose();denoiseQuad?.dispose();displayMat?.dispose();displayQuad?.dispose();backupSky?.dispose();if(snap)snap.dispose();else sky?.texture?.dispose();
 }
 function close(){if(!alive)return;alive=false;cancelAnimationFrame(raf);ui.remove();if(!building){try{cleanup()}catch(e){console.warn('GPU cleanup',e)}}renderer.toneMapping=oldTone;renderer.toneMappingExposure=oldExposure;renderer.autoClear=oldAutoClear;renderer.debug.onShaderError=oldShaderError;renderer.debug.checkShaderErrors=oldCheckShader;if(finalImageUrl)URL.revokeObjectURL(finalImageUrl);if(!renderer.getContext().isContextLost()){renderer.setPixelRatio(oldRatio);renderer.setSize(oldSize.x,oldSize.y,false);}onClose();}
 panel.querySelector('[data-close]').onclick=close;
 save.onclick=()=>{const download=b=>{if(!b)return;const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='FORMA-GPU-'+frameW+'x'+frameH+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);};if(resultBlob)download(resultBlob);else if(pt?.samples>=1&&!renderer.getContext().isContextLost())canvas.toBlob(download,'image/png');};
 function error(e){if(!alive)return;loading=false;finished=true;console.error('FORMA GPU R134',e);const reason=stage+': '+(e?.message||String(e));try{sessionStorage.setItem('forma-gpu-last-error',reason);}catch{}close();onFailure(reason);}
 const handle={close,get active(){return alive;},get samples(){return pt?.samples||0;}};
 (async()=>{try{
  if(!renderer.capabilities.isWebGL2||!renderer.extensions.has('EXT_color_buffer_float'))throw Error('GPU не поддерживает необходимые WebGL2 HDR-буферы');
  stage='Загрузка библиотеки трассировки';msg.textContent=stage+'…';const {WebGLPathTracer}=await import('three-gpu-pathtracer');const {FullScreenQuad}=await import('three/addons/postprocessing/Pass.js');if(!alive)return;
  stage='Подготовка HDR неба';msg.textContent=stage+'…';await nextFrame();if(!alive)return;sky=await loadSkyR73(T,scene,atmosphere,renderer,profile,()=>alive,p=>{msg.textContent='Подготовка облаков: '+p+'%';});if(!alive){sky.texture.dispose();return;}
  stage='Подготовка полигонов и материалов';msg.textContent=stage+'…';await nextFrame();if(!alive)return;
  if(diagnostic){const test=new T.Scene(),geos=[],mats=[];const add=(g,m,x,y,z)=>{geos.push(g);mats.push(m);const o=new T.Mesh(g,m);o.position.set(x,y,z);test.add(o);return o;};const floor=add(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:0x9c9c9c,roughness:.8}),0,0,0);floor.rotation.x=-Math.PI/2;add(new T.SphereGeometry(1,32,24),new T.MeshStandardMaterial({color:0xb45f36,roughness:.35}),-1.3,1,0);add(new T.BoxGeometry(1.5,1.5,1.5),new T.MeshStandardMaterial({color:0xe3e3e3,roughness:.7}),1.2,.75,0);const sun=new T.DirectionalLight(0xffefd9,3);sun.position.set(-4,7,3);test.add(sun,sun.target);test.background=new T.Color(0x9bb7d0);test.environment=sky.texture;test.environmentIntensity=1;const cam=new T.PerspectiveCamera(46,camera.aspect||16/9,.1,100);cam.position.set(5,3.2,7);cam.lookAt(0,.8,0);cam.updateMatrixWorld(true);test.updateMatrixWorld(true);snap={scene:test,cam,triangles:1560,instances:0,dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());sky.texture.dispose();}};}else snap=await snapshot(T,scene,root,camera,sky,profile,atmosphere,lawn,()=>alive,(n,total)=>{msg.textContent='Подготовка геометрии: '+n+' / '+total+' объектов';});if(!alive){snap.dispose();return;}
  msg.textContent='Построение BVH: '+Math.round(snap.triangles/1000)+' тыс. треугольников…';await nextFrame();if(!alive)return;
  stage='Построение BVH и загрузка текстур';building=true;
  renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.autoClear=true;renderer.debug.checkShaderErrors=true;renderer.debug.onShaderError=(gl,program,vertex,fragment)=>{shaderError=[gl.getProgramInfoLog(program),gl.getShaderInfoLog(vertex),gl.getShaderInfoLog(fragment)].filter(Boolean).join('\n').slice(0,1500)||'Ошибка компиляции GPU-шейдера';console.error('FORMA shader:',shaderError);};
  pt=new WebGLPathTracer(renderer);const heavy=snap.triangles>2000000,veryHeavy=snap.triangles>5000000;const recover=atmosphere.traceRecovery===true;
  target=diagnostic?8:requestedSamples;bar.max=target;
  pt.bounces=diagnostic?4:profile==='high'?8:5;pt.transmissiveBounces=diagnostic?8:profile==='high'?24:16;pt.multipleImportanceSampling=true;
  const tile=diagnostic?2:Math.max(4,Math.ceil(frameW/320),heavy||recover?6:4);pt.tiles.set(tile,Math.max(3,Math.ceil(frameH/240)));pt.renderScale=1;const atlas=diagnostic?128:recover?256:profile==='high'?1024:512;pt.textureSize.set(atlas,atlas);pt.minSamples=1;pt.renderDelay=0;pt.fadeDuration=0;pt.rasterizeScene=false;pt.renderToCanvas=false;pt.filterGlossyFactor=.4;
  if(Math.max(frameW,frameH)>renderer.capabilities.maxTextureSize)throw Error('Выбранное разрешение превышает максимальный размер GPU-текстуры');renderer.setPixelRatio(1);renderer.setSize(frameW,frameH,false);if(snap.cam.isPerspectiveCamera){snap.cam.aspect=frameW/frameH;snap.cam.updateProjectionMatrix();}else if(snap.cam.isOrthographicCamera){const center=(snap.cam.left+snap.cam.right)/2,half=(snap.cam.top-snap.cam.bottom)*frameW/frameH/2;snap.cam.left=center-half;snap.cam.right=center+half;snap.cam.updateProjectionMatrix();}renderer.toneMapping=T.NoToneMapping;renderer.toneMappingExposure=1;
  const textureSources=new Set(),materialIds=new Set();snap.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){materialIds.add(m.uuid);for(const v of Object.values(m))if(v?.isTexture)textureSources.add(v.source.uuid+'|'+v.colorSpace);}});const gl=renderer.getContext(),maxLayers=gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);if(textureSources.size>maxLayers)throw Error('Текстурных слоёв '+textureSources.size+' больше аппаратного лимита '+maxLayers);console.info('FORMA R150 scene',{textures:textureSources.size,maxLayers,materials:materialIds.size,lights:snap.scene.children.filter(o=>o.isLight).map(o=>({name:o.name,intensity:o.intensity})),mode:atmosphere.traceSceneTest||'normal'});pt.setScene(snap.scene,snap.cam);
  displayMat=new T.ShaderMaterial({uniforms:{frame:{value:null},gain:{value:1},tileGrid:{value:new T.Vector2(1,1)},bufferSize:{value:new T.Vector2(1,1)},coverage:{value:0}},depthTest:false,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D frame;uniform float gain;uniform vec2 tileGrid;uniform vec2 bufferSize;uniform float coverage;varying vec2 vUv;void main(){vec2 tileSize=ceil(bufferSize/tileGrid);vec2 tile=min(floor(vUv*bufferSize/tileSize),tileGrid-1.);float order=(tileGrid.y-1.-tile.y)*tileGrid.x+tile.x;if(coverage<.99999&&order>=floor(coverage*tileGrid.x*tileGrid.y+.01)){gl_FragColor=vec4(.075,.082,.095,1.);return;}vec3 c=max(texture2D(frame,vUv).rgb*gain,vec3(0.));c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);c=mix(12.92*c,1.055*pow(c,vec3(1.0/2.4))-.055,step(vec3(.0031308),c));gl_FragColor=vec4(c,1.);}'});
  displayQuad=new FullScreenQuad(displayMat);
  building=false;
  if(!alive){cleanup();return;}
  stage='Трассировка GPU';renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=Math.max(.75,Math.min(1.8,(oldExposure||1)*(['night','blue-hour'].includes(atmosphere.time)?1:1.18)));loading=false;traceStart=performance.now();
  function tick(){if(!alive||finished)return;try{
   if(renderer.getContext().isContextLost())throw Error('WebGL отключён');if(shaderError)throw Error(shaderError);renderer.setRenderTarget(null);renderer.setScissorTest(false);pt.renderSample();if(shaderError)throw Error(shaderError);const n=Math.floor(pt.samples+1e-6);bar.value=pt.samples;
   const elapsed=performance.now()-traceStart;const percent=Math.min(100,100*pt.samples/target);
   details.textContent=pt.target.width+' × '+pt.target.height+' px · '+percent.toFixed(1)+'% · прошло '+fmtTime(performance.now()-started)+(pt.samples>=1?' · осталось ≈ '+fmtTime(elapsed*Math.max(0,target-pt.samples)/pt.samples):'');
   if(pt.samples>0&&(pt.samples<1||n!==lastShown||performance.now()-lastDrawAt>180)){lastShown=n;lastDrawAt=performance.now();showTrace();preview.hidden=true;preview.style.display='none';}
   if(n>=1&&n!==lastChecked&&n<=3){lastChecked=n;let stats='';try{const rt=pt.target,px=new Float32Array(4);let max=0,mean=0,valid=0;for(let j=1;j<=3;j++)for(let i=1;i<=3;i++){renderer.readRenderTargetPixels(rt,Math.floor(rt.width*i/4),Math.floor(rt.height*j/4),1,1,px);if([px[0],px[1],px[2]].every(Number.isFinite)){const y=.2126*px[0]+.7152*px[1]+.0722*px[2];max=Math.max(max,y);mean+=y;valid++;}}stats=' · HDR среднее '+(mean/Math.max(1,valid)).toFixed(4)+' · макс '+max.toFixed(4)+' · '+valid+'/9 валидных · текстур '+textureSources.size+'/'+maxLayers+' · материалов '+materialIds.size;}catch(e){stats=' · HDR-буфер не прочитан';}if(daylightDark()){darkWarning=true;warning.textContent='Кадр тёмный'+stats+' · трассировка продолжается.';}else{darkWarning=false;warning.textContent=diagnostic?'Контрольный кадр'+stats:stats.slice(3);}}
   save.disabled=n<1;
   msg.textContent=pt.isCompiling?'Компиляция GPU-шейдера…':pt.samples<1?'Первый проход · '+Math.round(pt.samples*100)+'% участков · трассировка лучей':'GPU · Сэмплы '+n+' / '+target+' · '+Math.round(snap.triangles/1000)+' тыс. треуг. · '+snap.instances+' инстансов · '+sky.label+(snap.skipped?' · пропущено спец. объектов: '+snap.skipped:'')+(snap.simplified?' · сохранено листьев/ягод с LOD: '+snap.simplified:'')+(snap.reducedOak?' · упрощено листьев дуба: '+snap.reducedOak.toLocaleString('ru-RU'):'')+(snap.displacedSurfaces?' · рельеф поверхностей: '+snap.displacedSurfaces:'')+(snap.displacedWood?' · рельеф коры: '+snap.displacedWood.toLocaleString('ru-RU')+' треуг.':'')+(snap.lawnTufts?' · пучков травы: '+snap.lawnTufts.toLocaleString('ru-RU'):'')+(snap.lawnBlades?' · объёмных травинок: '+snap.lawnBlades.toLocaleString('ru-RU'):'')+(snap.reduced?' · сокращено инстансов газона: '+snap.reduced:'')+(snap.reducedFoliage?' · адаптивный LOD листвы: '+snap.reducedFoliage.toLocaleString('ru-RU'):'');
   if(n>=target){showTrace();finished=true;save.disabled=true;canvas.toBlob(b=>{if(!alive)return;if(!b||renderer.getContext().isContextLost()){error(Error('Не удалось сохранить кадр GPU'));return;}resultBlob=b;finalImageUrl=URL.createObjectURL(b);const image=document.createElement('img');image.src=finalImageUrl;image.style.cssText='width:100%;height:100%;object-fit:contain';preview.replaceChildren(image);preview.style.display='grid';preview.hidden=false;cleanup();pt=null;snap=null;save.disabled=false;details.textContent=frameW+' × '+frameH+' px · 100% · готово за '+fmtTime(performance.now()-started);msg.textContent+=' · готово, память освобождена';evInput.disabled=true;},'image/png');return;}raf=requestAnimationFrame(tick);
  }catch(e){error(e);}}
  raf=requestAnimationFrame(tick);
 }catch(e){building=false;if(!alive){cleanup();return;}error(e);}})();
 return handle;
}
