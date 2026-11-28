/* Original FORMA young fir: tiered woody branches and individually folded
 * flat needles. No billboard, external dependency, or change of saved dimensions. */
const cache=new Map(),firCache=new Map();
let firAtlas=null,firBarkSource=null;
function redraw(){window.dispatchEvent(new Event('forma-foliage-texture-ready'))}
function needleAtlas(T){
 if(firAtlas)return firAtlas;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const c=canvas.getContext('2d'),r=rng('abies-alpha-v28');
 c.lineCap='round';c.strokeStyle='#665c46';c.lineWidth=4;c.beginPath();c.moveTo(256,485);c.quadraticCurveTo(246,255,256,24);c.stroke();
 for(let i=0;i<60;i++){
  const t=(i+.5)/60,y=478-t*438,x=256+Math.sin(t*5)*7;
  for(const side of [-1,1]){
   const len=(42+95*Math.pow(Math.sin(Math.PI*t),.65))*(.75+r()*.25);
   const dx=side*len,dy=-len*(.24+r()*.26);
   const green=75+Math.round(r()*28),grad=c.createLinearGradient(x,y,x+dx,y+dy);
   grad.addColorStop(0,'#354d35');grad.addColorStop(.65,'rgb('+Math.round(green*.73)+','+green+','+Math.round(green*.68)+')');grad.addColorStop(1,'#71865a');
   c.fillStyle=grad;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dx*.48,y+dy*.42-4,x+dx,y+dy);
   c.quadraticCurveTo(x+dx*.53,y+dy*.52+4,x,y+3);c.fill();
  }
 }
 firAtlas=new T.CanvasTexture(canvas);firAtlas.colorSpace=T.SRGBColorSpace;firAtlas.anisotropy=4;
 firAtlas.userData.source='local drawn Abies needle alpha';return firAtlas;
}
// Recover original photographic alpha and bark from the existing local CC0 GLB.
// Readable RGBA images only: compressed or unsuitable atlases retain safe local texture.
export function adoptFirPhotoMaps(T,source){
 const atlas=needleAtlas(T),canvas=atlas.image;
 let foliage=null,bark=null;
 source.traverse(n=>{if(!n.isMesh)return;for(const m of Array.isArray(n.material)?n.material:[n.material]){
  if(!m?.map)continue;if(m.alphaTest>0&&!foliage)foliage=m;
  else if(!m.alphaTest&&!m.transparent&&/bark|branch|trunk|wood/i.test((m.name||'')+' '+(n.name||'')))bark=m;
 }});
 if(bark){const image=bark.map.image;try{const dst=woodTexture(T,'fir').image,ctx=dst.getContext('2d');ctx.drawImage(image,0,0,dst.width,dst.height);woodTexture(T,'fir').needsUpdate=true;firBarkSource='Poly Haven fir GLB';}catch{}}
 if(foliage){try{
  const src=foliage.map.image,w=src.width,h=src.height;if(!w||!h)throw Error('no readable photo');
  const tmp=document.createElement('canvas');tmp.width=tmp.height=512;const cx=tmp.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,512,512);
  if(foliage.alphaMap?.image){const mask=document.createElement('canvas');mask.width=mask.height=512;const mc=mask.getContext('2d');mc.drawImage(foliage.alphaMap.image,0,0,512,512);const a=mc.getImageData(0,0,512,512),p=cx.getImageData(0,0,512,512);for(let i=0;i<p.data.length;i+=4)p.data[i+3]=Math.round(p.data[i+3]*a.data[i+1]/255);cx.putImageData(p,0,0)}
  const p=cx.getImageData(0,0,512,512).data;let transparent=0,opaque=0;for(let i=3;i<p.length;i+=4){if(p[i]<40)transparent++;if(p[i]>180)opaque++;}
  if(transparent<512*512*.08||opaque<512*512*.04)throw Error('no usable alpha');
  // Only use the original atlas when it actually contains transparency.
  canvas.getContext('2d').clearRect(0,0,512,512);canvas.getContext('2d').drawImage(tmp,0,0);atlas.needsUpdate=true;atlas.userData.source='Poly Haven fir GLB alpha';
 }catch{}}
 for(const [age,tex] of ageBarkCache)paintAgeBark(T,age,tex);
 redraw();
}

function rng(s){let x=2166136261;for(const c of String(s)){x=Math.imul(x^c.charCodeAt(0),16777619)}return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function clamp(x,a,b){return Math.min(b,Math.max(a,x))}
export function woodTexture(T,type='fir'){
 if(cache.has(type))return cache.get(type);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const c=canvas.getContext('2d'),r=rng(type),bark=type==='fir';
 c.fillStyle=bark?'#77736a':'#a48a6b';c.fillRect(0,0,512,1024);
 for(let i=0;i<6500;i++){const x=r()*512,y=r()*1024,l=7+r()*(bark?80:240);
  c.strokeStyle=r()<.48?(bark?'rgba(42,39,34,.23)':'rgba(65,42,23,.22)'):'rgba(236,221,195,.16)';
  c.lineWidth=.4+r()*1.8;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(r()-.5)*5,y+l*.3,x+(r()-.5)*7,y+l*.7,x+(r()-.5)*4,y+l);c.stroke();
 }
 if(bark)for(let i=0;i<340;i++){const x=r()*512,y=r()*1024;c.fillStyle='rgba(40,35,30,.24)';c.beginPath();c.ellipse(x,y,1+r()*2,2+r()*6,.3,0,Math.PI*2);c.fill()}
 else for(let i=0;i<5;i++){const x=30+r()*196,y=r()*512;for(let j=1;j<8;j++){c.strokeStyle='rgba(74,49,29,.12)';c.beginPath();c.ellipse(x,y,j*1.8,j*6,.04,0,Math.PI*2);c.stroke()}}
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;cache.set(type,t);return t;
}
export function firStage(age){const a=Number(age);return a===10?{age:10,height:3.5,diameter:2.5,tiers:19,base:.045,top:.96,trunk:.012,spread:.75}:a===100?{age:100,height:27,diameter:10.5,tiers:39,base:.15,top:.94,trunk:.016,spread:.48}:{age:45,height:15,diameter:6.8,tiers:34,base:.065,top:.96,trunk:.012,spread:.60};}
function firLight(T,m){
 m.onBeforeCompile=shader=>{
  const physical=T.ShaderChunk.lights_physical_pars_fragment;
  const needle=/reflectedLight\.directDiffuse\s*\+=\s*irradiance\s*\*\s*BRDF_Lambert\(\s*material\.diffuseColor\s*\)\s*;/;
  if(physical&&needle.test(physical))shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',physical.replace(needle,a=>a+`
   float firBack=max(0.0,dot(-geometryNormal,directLight.direction));
   reflectedLight.directDiffuse+=directLight.color*BRDF_Lambert(material.diffuseColor)*firBack*.30*vec3(.91,1.,.82);
  `));
 };m.customProgramCacheKey=()=> 'forma-fir-transmission-r106';
}
function cloneFirMaterial(m){const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;return copy;}

// Continuous tapered woody tubes. Every path has shared rings, continuous UVs
// and smooth normals; branch starts penetrate their supporting parent.
function woodyBuilder(T){
 const p=[],uv=[],idx=[],V=(x,y,z)=>new T.Vector3(x,y,z);
 function tube(points,radii,sides,seed,rough=0,uvScale=1){
  const first=p.length/3;let length=0;
  for(let j=0;j<points.length;j++){
   const point=points[j],tangent=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
   const helper=Math.abs(tangent.y)>.93?V(1,0,0):V(0,1,0),u=helper.clone().cross(tangent).normalize(),v=tangent.clone().cross(u).normalize();
   if(j)length+=point.distanceTo(points[j-1]);
   for(let k=0;k<=sides;k++){
    const a=(k%sides)/sides*Math.PI*2,rr=radii[j]*(1+rough*(.55*Math.sin(a*5+seed+j*.19)+.30*Math.sin(a*9-seed+j*.33)));
    const q=point.clone().addScaledVector(u,Math.cos(a)*rr).addScaledVector(v,Math.sin(a)*rr);
    p.push(q.x,q.y,q.z);uv.push(k/sides*Math.max(.25,radii[0]*6),length*uvScale);
   }
   if(j)for(let k=0;k<sides;k++){const a=first+(j-1)*(sides+1)+k,b=a+sides+1;idx.push(a,a+1,b,a+1,b+1,b);}
  }
  // close tiny terminal cross section
  const tip=p.length/3,last=points[points.length-1];p.push(last.x,last.y,last.z);uv.push(.5,length*uvScale);
  const ring=first+(points.length-1)*(sides+1);for(let k=0;k<sides;k++)idx.push(ring+k,ring+k+1,tip);
 }
 function geometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;}
 return {tube,geometry};
}
const ageBarkCache=new Map();
function ageBark(T,age){
 if(ageBarkCache.has(age))return ageBarkCache.get(age);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;
 ageBarkCache.set(age,t);paintAgeBark(T,age,t);return t;
}
function paintAgeBark(T,age,t){
 const c=t.image.getContext('2d'),r=rng('fir-bark-'+age),old=age===100;
 c.fillStyle=old?'#777369':age===10?'#9b998a':'#858174';c.fillRect(0,0,512,1024);
 c.globalAlpha=.65;c.drawImage(woodTexture(T,'fir').image,0,0,512,1024);c.globalAlpha=1;
 if(age!==10)for(let k=0;k<(old?80:36);k++){
  const x=r()*512,y=r()*1024,L=35+r()*(old?240:95),w=(old?1.6:.65)+r()*(old?3.8:1.1);
  const path=()=>{c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+(r()-.5)*12,y+L*.27,x+(r()-.5)*18,y+L*.7,x+(r()-.5)*10,y+L);};
  path();c.strokeStyle='rgba(48,43,37,.58)';c.lineWidth=w;c.stroke();c.save();c.translate(w*.75,0);c.strokeStyle='rgba(190,180,158,.32)';c.lineWidth=w*.6;c.stroke();c.restore();
 }
 if(age===10)for(let i=0;i<180;i++){c.fillStyle='rgba(76,74,63,.22)';c.beginPath();c.ellipse(r()*512,r()*1024,1+r()*4,.7+r()*1.6,0,0,Math.PI*2);c.fill();}
 t.needsUpdate=true;
}


// Matching colour and height textures for actual overlapping fir-cone scales.
const coneMaps=new Map();
function coneScaleMaps(T,young){
 const key=young?'green':'brown';if(coneMaps.has(key))return coneMaps.get(key);
 const W=512,H=1024,base=document.createElement('canvas'),bump=document.createElement('canvas');base.width=bump.width=W;base.height=bump.height=H;
 const c=base.getContext('2d'),h=bump.getContext('2d'),r=rng('fir-cone-scales-r106-'+key);
 c.fillStyle=young?'#465b32':'#59422d';c.fillRect(0,0,W,H);h.fillStyle='#454545';h.fillRect(0,0,W,H);
 const dx=W/12,dy=H/21;
 function shape(ctx,x,y){ctx.beginPath();ctx.moveTo(x-dx*.53,y-dy*.30);ctx.quadraticCurveTo(x,y-dy*.85,x+dx*.53,y-dy*.30);ctx.quadraticCurveTo(x+dx*.49,y+dy*.22,x,y+dy*.67);ctx.quadraticCurveTo(x-dx*.49,y+dy*.22,x-dx*.53,y-dy*.30);ctx.closePath();}
 for(let j=-1;j<23;j++)for(let i=-1;i<13;i++){
  const x=(i+(j%2)*.5)*dx,y=j*dy,v=r();
  shape(c,x,y);const g=c.createLinearGradient(x,y-dy*.5,x,y+dy*.7);
  g.addColorStop(0,young?'#526b36':'#684c32');g.addColorStop(.55,young?(v>.5?'#83964e':'#708844'):(v>.5?'#b09464':'#9a794e'));g.addColorStop(1,young?'#b0b579':'#c2a67b');c.fillStyle=g;c.fill();c.strokeStyle=young?'#4b6037':'#62452e';c.lineWidth=1.6;c.stroke();
  shape(h,x,y);const hg=h.createLinearGradient(x,y-dy*.5,x,y+dy*.7);hg.addColorStop(0,'#555');hg.addColorStop(.65,'#ccc');hg.addColorStop(1,'#f1f1f1');h.fillStyle=hg;h.fill();h.strokeStyle='#4b4b4b';h.lineWidth=2;h.stroke();
  for(let k=0;k<6;k++){const xx=x+(r()-.5)*dx*.55,yy=y+(r()-.5)*dy*.55;c.fillStyle='rgba(45,41,28,.18)';c.fillRect(xx,yy,1.2,2+r()*3);}
 }
 const map=new T.CanvasTexture(base),relief=new T.CanvasTexture(bump);map.colorSpace=T.SRGBColorSpace;for(const t of [map,relief]){t.wrapS=T.RepeatWrapping;t.anisotropy=4;}
 const result={map,relief};coneMaps.set(key,result);return result;
}
// Each scale is also raised geometrically, with a staggered spiral arrangement.
function coneGeometry(T){
 const pos=[],uv=[],idx=[],rows=63,sides=48;
 for(let j=0;j<=rows;j++){const t=j/rows,y=t*.135,env=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.40)*(1-.16*t);
  for(let k=0;k<=sides;k++){const u=k/sides,a=u*2*Math.PI,v=t*21,band=Math.floor(v),local=v-band,cell=(u*12+(band%2)*.5)%1;
   const lip=Math.pow(Math.max(0,Math.sin(Math.PI*local)),.7)*Math.pow(Math.max(0,Math.sin(Math.PI*cell)),.6);
   const radius=(.027+.0038*lip)*env;pos.push(Math.cos(a)*radius,y,Math.sin(a)*radius);uv.push(u,1-t);}
  if(j)for(let k=0;k<sides;k++){const a=(j-1)*(sides+1)+k,b=a+sides+1;idx.push(a,b,a+1,a+1,b,b+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
// A real branched shoot, with separate narrow needle meshes and no foliage cards.
// A low-cost folded needle has 4 triangles; the long side twigs add natural volume.
function firShootGeometry(T,variant,mobile,detail=0,age=45){
 const lite=mobile&&detail===2;
 const r=rng('fir-real-spray-r106-'+variant),p=[],c=[],ix=[],acrossOffsets=[];const compact=age===10;
 const shades=['#345638','#466b40','#537649','#294a32','#759058'].map(x=>new T.Color(x));
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 let count=0;
 function vert(v,col,k=1,offset=null){p.push(v.x,v.y,v.z);c.push(col.r*k,col.g*k,col.b*k);acrossOffsets.push(offset?.x??0,offset?.y??0,offset?.z??0);}
 function needle(root,dir,side,length,width,col){
  const mid=root.clone().addScaledVector(dir,length*.48),tip=root.clone().addScaledVector(dir,length),normal=dir.clone().cross(side).normalize(),i=p.length/3;
  tip.addScaledVector(normal,length*.09);
  vert(root,col,.86);vert(mid.clone().addScaledVector(side,width),col,.97,side.clone().multiplyScalar(width));vert(mid.clone().addScaledVector(normal,width*.30),col,1.04);vert(mid.clone().addScaledVector(side,-width),col,.94,side.clone().multiplyScalar(-width));vert(tip,col,1.03);
  if(detail===2)ix.push(i,i+1,i+3,i+1,i+4,i+3);
  else if(mobile||detail>0)ix.push(i,i+1,i+4,i,i+4,i+3);
  else ix.push(i,i+1,i+2,i+1,i+4,i+2,i,i+2,i+3,i+2,i+4,i+3);
  count++;
 }
 function twig(a,b,n,seed){
  const axis=b.clone().sub(a).normalize(),lateral=V(Math.abs(axis.x)>.90?0:1,Math.abs(axis.x)>.90?1:0,0).cross(axis).normalize(),other=axis.clone().cross(lateral).normalize();
  const wood=new T.Color('#586441'),first=p.length/3;
  if(detail!==2){for(const [point,radius] of [[a,.00115],[b,.00020]])for(let k=0;k<4;k++){const q=k*Math.PI*.5;vert(point.clone().addScaledVector(lateral,Math.cos(q)*radius).addScaledVector(other,Math.sin(q)*radius),wood);}
  for(let k=0;k<4;k++){const j=(k+1)%4;ix.push(first+k,first+j,first+4+k,first+j,first+4+j,first+4+k);}}
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,base=a.clone().lerp(b,t);
   for(const sign of [-1,1]){
    const phase=seed+(j%3-1)*.22+r()*.28;
    const side=lateral.clone().multiplyScalar(Math.cos(phase)*sign).addScaledVector(other,Math.sin(phase)*sign);
    const dir=axis.clone().multiplyScalar(.32+r()*.30).addScaledVector(side,.70+r()*.23).addScaledVector(other,.12+r()*.21).normalize();
    const across=axis.clone().cross(dir).normalize();
    needle(base,dir,across,.014+r()*.008,(.00095+r()*.00028)*(detail===2?(lite?(compact?3.1:5.1):compact?2.15:4.2):detail===1?(compact?1.15:1.85):1),shades[Math.floor(r()*shades.length)]);
    if(detail===0||(detail===1&&j%2===0)){const upper=dir.clone().addScaledVector(other,.65).normalize(),ac=axis.clone().cross(upper).normalize();needle(base.clone().addScaledVector(axis,.001),upper,ac,.012+r()*.008,.00085+r()*.00025,shades[(j+variant)%shades.length]);}
   }
  }
 }
 const base=V(0,-.092,0),tip=V(.006,.092,.008);
 twig(base,tip,detail===2?(lite?6:11):detail===1?(mobile?10:22):mobile?17:34,variant*.8);
 const lateralCount=lite?4:mobile?6:detail===2?8:9;
 for(let j=0;j<lateralCount;j++){
  const t=.08+j*.88/lateralCount,root=base.clone().lerp(tip,t),a=(j%2?Math.PI:0)+j*.28+variant*.75,len=(.060+r()*.035)*(1-t*.38);
  const end=root.clone().add(V(Math.cos(a)*len,.020+r()*.028,Math.sin(a)*len));
  twig(root,end,detail===2?(lite?3:5):detail===1?(mobile?5:10):mobile?7:15,a);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setAttribute('firAcross',new T.Float32BufferAttribute(acrossOffsets,3));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();geo.userData.needleCount=count;return geo;
}
// Spatially local LOD: the full crown keeps its shoots at every distance.
// Near chunks show individual folded needles; distant chunks use fewer
// needles per shoot with conservative screen-space coverage compensation.
function addVolumetricTwigs(T,group,sites,age){
 const quality=typeof window!=='undefined'?window.FORMA_GRAPHICS_R105:null;
 const mobile=quality?['eco','standard'].includes(quality):typeof window!=='undefined'&&window.innerWidth<=850;
 const baseCap=mobile?(age===10?5200:age===100?32000:24000):(age===10?7500:age===100?45000:34000);
 const cap=mobile?(quality==='eco'?(age===10?1800:age===100?6400:4800):(age===10?3000:age===100?10500:8000)):Math.floor(baseCap*(quality==='ultra'?1.22:1));
 const n=Math.min(cap,sites.length),stride=sites.length/Math.max(1,n),r=rng('fir-real-instances-r106'),o=new T.Object3D(),up=new T.Vector3(0,1,0),tint=new T.Color();
 const cell=mobile?(age===10?3.2:age===100?6.8:5.4):age===10?1.6:age===100?3.4:2.7,bins=new Map();
 for(let j=0;j<n;j++){const a=sites[Math.min(sites.length-1,Math.floor((j+.5)*stride))],x=Math.floor(a.p.x/cell),y=Math.floor(a.p.y/cell),z=Math.floor(a.p.z/cell),key=x+':'+y+':'+z;let bin=bins.get(key);if(!bin){bin={center:new T.Vector3((x+.5)*cell,(y+.5)*cell,(z+.5)*cell),sites:[]};bins.set(key,bin);}bin.sites.push({...a,scale:(mobile?(age===10?1.05:1.23):.94)+r()*.15,color:a.young?['#f1f6df','#d8e8c1'][j%2]:['#e2edda','#f0f3e7','#cbdcc7'][Math.floor(r()*3)]});}
 const baseMat=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.69,metalness:0,envMapIntensity:.38});firLight(T,baseMat);
 const prior=baseMat.onBeforeCompile;
 baseMat.onBeforeCompile=function(shader,renderer){prior.call(this,shader,renderer);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 firAcross;').replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec3 firAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
 float firDist=distance(cameraPosition,firAnchor);
 // Maintain the projected coverage of subpixel needles, rather than scaling needle length.
 float firPixelFloor=clamp(firDist*.042,0.0,2.7);
 transformed+=firAcross*firPixelFloor;
 #endif`);};
 baseMat.customProgramCacheKey=()=> 'forma-fir-r106-coverage';
 const geos=Array.from({length:3},(_,level)=>Array.from({length:3},(_,variant)=>firShootGeometry(T,variant,mobile,level,age)));
 let total=0,farTriangles=0,nearTriangles=0;
 for(const bin of bins.values()){
  const lod=new T.LOD();lod.name='fir-spatial-lod';lod.position.copy(bin.center);
  for(let level=0;level<3;level++){
   const layer=new T.Group();layer.name='fir-needle-lod-'+level;
   const variants=mobile?1:3;
   for(let k=0;k<variants;k++){
    const geo=geos[level][k],num=Math.max(0,Math.ceil((bin.sites.length-k)/variants));if(!num)continue;
    const mesh=new T.InstancedMesh(geo,cloneFirMaterial(baseMat),num);
    for(let j=0;j<num;j++){const a=bin.sites[j*variants+k];o.position.copy(a.p).sub(bin.center);o.quaternion.setFromUnitVectors(up,a.dir);o.rotateY(a.roll);o.scale.setScalar(a.scale);o.updateMatrix();mesh.setMatrixAt(j,o.matrix);mesh.setColorAt(j,tint.set(a.color));}
    mesh.name='fir-real-needle-leaves-'+level+'-'+k;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=false;layer.add(mesh);
    if(level===0){total+=num*geo.userData.needleCount;nearTriangles+=num*geo.index.count/3;}if(level===2)farTriangles+=num*geo.index.count/3;
   }
   lod.addLevel(layer,level===0?0:level===1?(mobile?1.3:5.5):(mobile?3.6:15.0),.12);layer.visible=level===2;
  }
  group.add(lod);
 }
 baseMat.dispose();group.userData.firLod={sites:sites.length,displayedShoots:n,chunks:bins.size,nearTriangles,farTriangles};return total;
}
export function createDetailedFir(T,instance){
 const stage=firStage(instance.fir?.age??(Number(instance.height)<6?10:45)),old=stage.age===100,youngTree=stage.age===10;
 const h=clamp(Number(instance.height)||3,.25,40),d=clamp(Number(instance.diameter)||2,.2,30),rad=d/2;
 const variant=clamp(Math.round(Number(instance.variant)||1),1,3),key=h.toFixed(3)+'|'+d.toFixed(3)+'|'+variant+'|'+stage.age+'|'+(typeof window!=='undefined'?window.FORMA_GRAPHICS_R105||'auto':'auto');
 const cached=firCache.get(key);if(cached){const copy=cached.clone(true);copy.traverse(n=>{if(n.isMesh)n.material=cloneFirMaterial(n.material)});return copy;}
 const r=rng('fir-r102|'+variant+'|'+stage.age),g=new T.Group(),detailR=rng('fir-fine-detail-r102|'+variant+'|'+stage.age);
 const branches=[],coneSites=[],twigSites=[],snowBoughsR245=[];const woodMesh=woodyBuilder(T),trunkMesh=woodyBuilder(T);
 
 const V=(x,y,z)=>new T.Vector3(x,y,z);
 function branch(a,b,w){if(a.distanceTo(b)>.0001)branches.push([a,b,w]);}
 function trunkAt(t){return V(h*.003*Math.sin(t*4.4)*t,h*t,h*.0027*Math.sin(t*6.2)*t);}
 const trunkPoints=[],trunkRadii=[];
 for(let j=0;j<=64;j++){const t=j/64;trunkPoints.push(trunkAt(t));trunkRadii.push(Math.max(.002,h*stage.trunk*Math.pow(1-t,.83))*(1+(old?.55:.22)*Math.exp(-t*45)));}
 trunkMesh.tube(trunkPoints,trunkRadii,old?28:24,variant,old?.11:.045,1.4);
 for(let k=0;k<(old?6:4);k++){const a=k*2.399963+(k%2)*.18,rr=trunkRadii[0],len=rr*(1.35+.14*Math.sin(k*2.1));const p0=V(Math.cos(a)*rr*.48,rr*.38,Math.sin(a)*rr*.48),p1=V(Math.cos(a)*rr*.92,rr*.05,Math.sin(a)*rr*.92),p2=V(Math.cos(a)*len,-rr*.18,Math.sin(a)*len);trunkMesh.tube([p0,p1,p2],[rr*.24,rr*.14,.003],12,k,.10,1.4);}
 function shoot(a,b,angle,young,extra=false){
  const axis=b.clone().sub(a),len=axis.length();if(len<.007)return;axis.normalize();
  branch(a,b,Math.max(.00065,Math.min(.005,len*.012)));
  const n=Math.max(1,Math.ceil(len/(youngTree?.071:old?.058:.064)));
  for(let j=0;j<n;j++){
   const t=(j+.5)/n,point=a.clone().lerp(b,t);
   twigSites.push({p:point,dir:axis.clone(),roll:detailR()*6.283185,young:young&&t>.45});
  }
 }
 // One living leader, layered asymmetrical radial branches, naturally open gaps.
 const tiers=stage.tiers;
 // Trunk built as a single indexed surface above.
 for(let i=0;i<tiers;i++){
  const t=i/(tiers-1),y=h*(stage.base+t*(stage.top-stage.base)+(r()-.5)*.025),a0=i*2.399+r()*.65;
  const envelope=Math.pow(Math.max(.012,1-t),stage.spread)*(.93+.07*Math.sin(i*2.1))*(old?(.75+.25*Math.sin(Math.PI*Math.min(1,t+.16))):1);
  const arms=t>.83?4+Math.floor(r()*2):(old?5:6)+Math.floor(r()*4);
  for(let j=0;j<arms;j++){
   const a=a0+j*Math.PI*2/arms+(r()-.5)*.40,L=rad*envelope*(.74+r()*.26);
   const droop=(old?.020:youngTree?.006:.008)*(1-t),lift=(old?-.014+.020*t:.002)+r()*.008;const start=trunkAt(clamp(y/h+(r()-.5)*(youngTree?.034:.046),0,1)),mid=V(start.x+Math.cos(a)*L*.53,start.y-h*droop,start.z+Math.sin(a)*L*.53),tip=V(start.x+Math.cos(a)*L,start.y+h*(lift-droop*.45),start.z+Math.sin(a)*L);
   const curve=new T.QuadraticBezierCurve3(start,mid.clone().multiplyScalar(2).addScaledVector(start,-.5).addScaledVector(tip,-.5),tip);const path=curve.getPoints(8),baseW=h*.0032*(1-t*.72);woodMesh.tube(path,path.map((_,k)=>Math.max(.0006,baseW*Math.pow(1-k/8,.83))*(k===0?1.32:1)),10,i+j,.045,1.7);
   snowBoughsR245.push({length:L,t,points:path.map(p=>[p.x,p.y,p.z])});
   const count=t>.83?9:youngTree?13:old?20:18;
   // Additional oblique shoots bridge the gap to the next whorl.
   for(let k=0;k<(t>.83?2:4);k++){const q=.25+k*.16,p=curve.getPoint(q),az=a+(k%2?1:-1)*(.35+r()*.6),reach=L*(.18+r()*.14);const b=p.clone().add(V(Math.cos(az)*reach,Math.min(h*.035,L*.30)*(.65+r()*.45),Math.sin(az)*reach));shoot(p,b,az,t>.67,true);if(k%2===0){const mid=p.clone().lerp(b,.55),az2=az+(k%2?1:-1)*.9;shoot(mid,mid.clone().add(V(Math.cos(az2)*reach*.45,-reach*.12,Math.sin(az2)*reach*.45)),az2,t>.67,true);}}
   for(let k=0;k<count;k++){
    const q=(k+.6)/count,p=curve.getPoint(q);
    for(const sign of [-1,1]){
     const angle=a+sign*(.66+r()*.54),sl=L*(.36*(1-q)+.14)*(.85+r()*.32);
     const b=p.clone().add(V(Math.cos(angle)*sl,Math.min(L*.16,h*(.003+r()*.018))+(r()-.48)*L*.15,Math.sin(angle)*sl));
     const bz=Math.hypot(b.x,b.z),limit=rad*envelope*1.02;if(bz>limit&&bz>0){b.x*=limit/bz;b.z*=limit/bz;}
     shoot(p,b,angle,t>.72||r()<.18);if(t>(youngTree?.50:.58)&&t<.94&&q>(youngTree?.55:.30)&&q<.96&&k%3===0){const site=p.clone().lerp(b,youngTree?.90:.78);coneSites.push(site);}
     // Secondary branchlets grow from the outer half of real lateral shoots,
     // staggered vertically to prevent sparse, flat ladder-like foliage.
     if(t<.92&&(k%2===0||r()<.48)){const base=p.clone().lerp(b,.48+r()*.2);const a2=angle+sign*(.57+r()*.35),l2=sl*(.4+r()*.3);const end=base.clone().add(V(Math.cos(a2)*l2,Math.min(L*.13,h*(.003+r()*.011))+(r()-.5)*L*.15,Math.sin(a2)*l2));const rr=Math.hypot(end.x,end.z);if(rr>limit&&rr>0){end.x*=limit/rr;end.z*=limit/rr;}shoot(base,end,a2,t>.72,true);if(!youngTree){for(let u=0;u<(old?3:2);u++){const v=.35+u*.23,root=base.clone().lerp(end,v),az=a2+(u%2?1:-1)*(.55+r()*.5),reach=l2*(.33+r()*.22);const tip=root.clone().add(V(Math.cos(az)*reach,old?-reach*(.28+r()*.30):reach*(r()-.38),Math.sin(az)*reach));shoot(root,tip,az,t>.70,true);if(old&&u%2===0){const hang=tip.clone().add(V(Math.cos(az)*reach*.42,-reach*(.55+r()*.30),Math.sin(az)*reach*.42));shoot(tip,hang,az,t>.70,true);}}}if(k%4===0){const pp=p.clone().lerp(b,.68),aa=a2+sign*.8,ee=pp.clone().add(V(Math.cos(aa)*l2*.65,l2*.55,Math.sin(aa)*l2*.65));shoot(pp,ee,aa,t>.65,true);}}
    }
   }
   // Fill inter-whorl gaps with attached, asymmetrical smaller shoots, not floating foliage.
   for(let z=0;z<(t>.84?2:5);z++){const q=.20+z*.135,base=curve.getPoint(q),ang=a+(z%2?1:-1)*(.25+r()*.9),reach=L*(.12+r()*.12);const end=base.clone().add(V(Math.cos(ang)*reach,Math.min(h*.035,L*.18)*(.48+r()*.52),Math.sin(ang)*reach));shoot(base,end,ang,t>.72,true);}
   for(let k=0;k<Math.max(2,Math.ceil(L/.22));k++){const n=Math.max(2,Math.ceil(L/.22)),q=.24+.73*(k+.5)/n;const p=curve.getPoint(q),dir=curve.getTangent(q).normalize();twigSites.push({p,dir,roll:detailR()*6.283185,young:t>.75&&q>.60});}
   if(!youngTree){for(let qn=0;qn<(old?9:7);qn++){const q=.25+.65*(qn+.5)/(old?9:7),p=curve.getPoint(q),az=a+(qn%2?1:-1)*(.75+r()*.45),reach=L*(.13+r()*.10)*(1-q*.32);const b=p.clone().add(V(Math.cos(az)*reach,(old?-.35:.40)*reach+(r()-.5)*reach*.65,Math.sin(az)*reach));shoot(p,b,az,t>.75,true);}}
   shoot(curve.getPoint(.84),tip,a,t>.72);
  }
 }
 for(let j=0;j<(old?7:5);j++){const a=j*2.399;shoot(trunkAt(old?.89:.92),V(Math.cos(a)*rad*(old?.15:.065),h*(old?.96+r()*.035:.99),Math.sin(a)*rad*(old?.15:.065)),a,true)}
 const wood=ageBark(T,stage.age),bm=new T.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:old?.056:youngTree?.005:.025,roughness:.93,metalness:0,envMapIntensity:.30});
 branches.forEach(([a,b,w],i)=>{const mid=a.clone().lerp(b,.5);mid.y-=a.distanceTo(b)*.035;woodMesh.tube([a,mid,b],[w,w*.57,Math.max(.00015,w*.06)],5,i,0,2);});
 const trunk=new T.Mesh(trunkMesh.geometry(),bm);trunk.name='fir-continuous-trunk';trunk.castShadow=true;trunk.receiveShadow=true;g.add(trunk);
 const stem=new T.Mesh(woodMesh.geometry(),bm.clone());stem.name='fir-curved-branches';stem.castShadow=true;stem.receiveShadow=true;g.add(stem);
 const detailedNeedles=addVolumetricTwigs(T,g,twigSites,stage.age);
 // Compact numeric branch/needle anchors survive cached Object3D cloning.
 g.userData.formaFirBoughsR245=snowBoughsR245;
 const snowStep=Math.max(1,Math.ceil(twigSites.length/4800));g.userData.formaFirSnowAnchorsR244=twigSites.filter((_,i)=>i%snowStep===0).map(q=>[q.p.x,q.p.y,q.p.z,q.dir.x,q.dir.y,q.dir.z]);
 if(coneSites.length){
  const coneCount=Math.min(coneSites.length,youngTree?22:old?112:72),coneGeo=coneGeometry(T),maps=coneScaleMaps(T,youngTree);
  const coneMat=new T.MeshStandardMaterial({color:'#ffffff',map:maps.map,bumpMap:maps.relief,bumpScale:.0017,roughness:.88,metalness:0});
  const cones=new T.InstancedMesh(coneGeo,coneMat,coneCount),p=new T.Object3D();
  for(let k=0;k<coneCount;k++){const q=coneSites.splice(Math.floor(r()*coneSites.length),1)[0];p.position.copy(q);p.rotation.set((r()-.5)*.09,r()*6.283185,(r()-.5)*.09);p.scale.setScalar(youngTree?.56+r()*.208:.68+r()*.48);p.updateMatrix();cones.setMatrixAt(k,p.matrix);cones.setColorAt(k,new T.Color(k%3===0?'#e5e8d4':'#ffffff'));}
  cones.name='fir-upright-cones';cones.instanceMatrix.needsUpdate=true;if(cones.instanceColor)cones.instanceColor.needsUpdate=true;g.userData.coneCount=coneCount;cones.computeBoundingSphere();g.add(cones);
 }
 // Measure complete generated crown; keep saved footprint without scaling needles
 // by a wildly different factor when a sparse geometry sample misses the tips.
 g.updateMatrixWorld(true);const box=new T.Box3().setFromObject(g),size=box.getSize(new T.Vector3()),actual=Math.max(size.x,size.z);if(actual>0)g.scale.set(d/actual,1,d/actual);
 g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=true;});
 g.userData.species='ph-fir-sapling';g.userData.physicalHeight=h;g.userData.crownDiameter=d;g.userData.firNativeR25=true;g.userData.firNativeR26=true;g.userData.firHybridR28=true;g.userData.firAge=stage.age;g.userData.firR93=true;g.userData.firR94=true;g.userData.firR96=true;g.userData.firR98=true;g.userData.firR99=true;g.userData.firR100=true;g.userData.firR101=true;g.userData.firR102=true;g.userData.firR103=true;g.userData.firR104=true;g.userData.firR105=true;g.userData.firR106=true;g.userData.foliageCards=0;g.userData.needleCount=detailedNeedles;g.userData.realNeedleInstances=detailedNeedles;g.userData.firAdaptiveLOD=true;g.userData.continuousTrunk=true;g.name='FORMA fir · '+stage.age;
 if(firCache.size<2){const template=g.clone(true);template.traverse(n=>{if(n.isMesh)n.material=cloneFirMaterial(n.material)});firCache.set(key,template);}else g.traverse(n=>{if(n.isMesh)n.userData.bundledSharedGeometry=false;});
 return g;
}
