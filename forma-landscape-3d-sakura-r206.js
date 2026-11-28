// FORMA R206 · Prunus serrulata, single five-petal flowering form.
// Deterministic real 3D branch topology, instanced blossoms and leaves.
// Generated sakura bark: local compact source plus optional original 4K import.
let barkImagePromise=null,barkOverride=null;
const barkURL=new URL('./assets/sakura/bark-generated-192.webp',import.meta.url).href;
function barkDB(){return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(Error('IndexedDB unavailable'));return;}const req=indexedDB.open('forma-sakura-material-r204',1);req.onupgradeneeded=()=>req.result.createObjectStore('textures');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function readBark(){let db;try{db=await barkDB();return await new Promise((resolve,reject)=>{const req=db.transaction('textures','readonly').objectStore('textures').get('bark');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}catch{return null;}finally{db?.close();}}
function decodeBark(source){return new Promise((resolve,reject)=>{const im=new Image(),url=source instanceof Blob?URL.createObjectURL(source):source;im.onload=()=>{if(source instanceof Blob)URL.revokeObjectURL(url);resolve(im)};im.onerror=()=>{if(source instanceof Blob)URL.revokeObjectURL(url);reject(Error('Не удалось открыть текстуру коры'));};im.src=url;});}
export async function importSakuraBark(file){
 if(!(file instanceof Blob))throw Error('Выберите изображение коры');
 const image=await decodeBark(file);if(image.width<128||image.height<128)throw Error('Минимальный размер 128 × 128');
 barkOverride=image;barkImagePromise=Promise.resolve(image);let saved=false,db;
 try{db=await barkDB();await new Promise((resolve,reject)=>{const tx=db.transaction('textures','readwrite');tx.objectStore('textures').put(file,'bark');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});saved=true;}catch{}finally{db?.close();}
 return {width:image.width,height:image.height,saved};
}
function loadBark(){if(barkOverride)return Promise.resolve(barkOverride);if(!barkImagePromise)barkImagePromise=readBark().then(blob=>decodeBark(blob||barkURL)).catch(()=>decodeBark(barkURL));return barkImagePromise;}
function applyBarkMaps(T,mat,wood,mobile,onReady,adaptivePreview=false){
 if(typeof document==='undefined'||typeof Image==='undefined')return;
 let disposed=false;mat.addEventListener('dispose',()=>{disposed=true});
 loadBark().then(image=>{
  if(disposed)return;
  const size=Math.min(mobile?2048:4096,Math.max(128,Math.min(image.width,image.height)));
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);if(adaptivePreview){const img=ctx.getImageData(0,0,size,size),d=img.data;for(let i=0;i<d.length;i+=4){const l=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];const soft=.78*l+29;d[i]=.75*d[i]+.25*soft+5;d[i+1]=.75*d[i+1]+.25*soft+1;d[i+2]=.75*d[i+2]+.25*soft-2;}ctx.putImageData(img,0,0);}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.anisotropy=4;
  const d=Math.min(size,mobile?512:1024),aux=document.createElement('canvas');aux.width=aux.height=d;const ac=aux.getContext('2d',{willReadFrequently:true});ac.drawImage(canvas,0,0,d,d);
  const raw=ac.getImageData(0,0,d,d).data,lum=new Float32Array(d*d),normal=new Uint8Array(d*d*4),rough=new Uint8Array(d*d*4);
  for(let i=0;i<lum.length;i++)lum[i]=(.2126*raw[i*4]+.7152*raw[i*4+1]+.0722*raw[i*4+2])/255;
  const height=(x,y)=>lum[((y+d)%d)*d+((x+d)%d)];
  for(let y=0;y<d;y++)for(let x=0;x<d;x++){const i=(y*d+x)*4;const dx=(height(x+1,y)-height(x-1,y))*2.8,dy=(height(x,y+1)-height(x,y-1))*2.8,inv=1/Math.hypot(dx,dy,1);
   normal.set([128-dx*127*inv,128+dy*127*inv,128+127*inv,255],i);const r=Math.max(158,Math.min(228,208-34*height(x,y)+18*Math.min(1,Math.hypot(dx,dy))));rough.set([r,r,r,255],i);}
  const dataTexture=bytes=>{const t=new T.DataTexture(bytes,d,d,T.RGBAFormat);t.colorSpace=T.NoColorSpace;t.flipY=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.needsUpdate=true;return t;};
  mat.map?.dispose();mat.bumpMap?.dispose();mat.normalMap?.dispose();mat.roughnessMap?.dispose();mat.map=tex;mat.bumpMap=null;mat.normalMap=dataTexture(normal);mat.normalScale.set(.46,.46);mat.roughnessMap=dataTexture(rough);mat.roughness=.87;mat.vertexColors=false;mat.color.set('#f1ece7');mat.needsUpdate=true;
  wood.userData.barkResolution=size;wood.userData.barkSourceResolution=image.width;onReady?.();
 }).catch(e=>console.warn('Sakura bark texture:',e.message));
}

export function sakuraStage(age=35){
 return age<=15?{age:10,height:3.2,diameter:2.6}:age<=50?{age:35,height:6.5,diameter:6.8}:{age:75,height:8.8,diameter:10.5};
}
export function createNaturalSakura(T,o,{season='spring',mobile=false,onReady=()=>{},adaptivePreview=false}={}){
 const root=new T.Group();root.name='forma-sakura-r206';const previewDetail={value:1};root.userData.sakuraPreviewDetail=previewDetail;const sunLocal={value:new T.Vector3(-.65,.65,.39).normalize()},sunWeight={value:1};if(adaptivePreview){root.userData.sakuraSunLocalR229=sunLocal;root.userData.sakuraSunWeightR229=sunWeight;}
 const h=Math.max(.8,Number(o.height)||6.5),r=Math.max(.4,Number(o.diameter)||6.8)/2;
 const age=sakuraStage(o.sakura?.age||(h<4?10:h>8?75:35)).age,young=age===10,old=age===75;
 let seed=(Number(o.variant)||1)*51283+age*7919;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),tau=Math.PI*2,up=V(0,1,0);
 const bp=[],bc=[],uv=[],idx=[],youth=[],barkAO=[],flowers=[],leaves=[];
 // R225: same seeded branch/flower topology on phone and desktop in comparison mode.
 const compactTopology=adaptivePreview||mobile;
 const bark=new T.Color(old?'#62504a':young?'#795e50':'#6b554a'),shade=new T.Color('#463b37');
 const lerp=(a,b,t)=>a.clone().lerp(b,t);
 function tube(pts,radii,sides){
  const base=bp.length/3,stride=sides+1;let length=0,prevX=null;const circumference=tau*radii[0];const wraps=Math.max(1,Math.round(circumference/.43));const offset=(Math.sin(pts[0].x*13.37+pts[0].y*8.13+pts[0].z*19.91)*.5+.5);
  for(let i=0;i<pts.length;i++){
   if(i)length+=pts[i].distanceTo(pts[i-1]);
   const p=pts[i],d=pts[Math.min(i+1,pts.length-1)].clone().sub(pts[Math.max(0,i-1)]).normalize();
   let x=prevX?prevX.clone().addScaledVector(d,-prevX.dot(d)):V(1,0,0).cross(d);if(x.lengthSq()<.01)x=V(0,0,1).cross(d);x.normalize();prevX=x.clone();const z=d.clone().cross(x);
   for(let j=0;j<=sides;j++){
    const a=j*tau/sides,rr=radii[i]*(1+.045*Math.sin(a*5+length*.82)+.035*Math.sin(a*3-length*1.3)+.035*Math.sin(length*6.4+a*2));
    const q=p.clone().addScaledVector(x,Math.cos(a)*rr).addScaledVector(z,Math.sin(a)*rr);
    bp.push(q.x,q.y,q.z);uv.push(j/sides*wraps+offset,length*2.3+offset);youth.push(1-T.MathUtils.smoothstep(radii[i],.008,.065));const join=1-T.MathUtils.smoothstep(i/Math.max(1,pts.length-1),0,.22);const foot=1-T.MathUtils.smoothstep(p.y,0,Math.max(.12,baseR*.95));barkAO.push(1-.13*join*T.MathUtils.smoothstep(radii[i],.005,.045)-.09*foot);
    const c=bark.clone().lerp(shade,.04+.10*(.5+.5*Math.sin(a*3+length*.67)));bc.push(c.r,c.g,c.b);
   }
  }
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<sides;j++){const a=base+i*stride+j,b=a+1;idx.push(a,b,a+stride,b,b+stride,a+stride)}
 }
 function curved(a,b,bend,n=7){
  const pts=[],dir=b.clone().sub(a),len=dir.length(),cross=dir.clone().cross(up);if(cross.lengthSq()<1e-8)cross.set(1,0,0);cross.normalize();const skew=bend.dot(cross)*.36+len*.024;for(let i=0;i<=n;i++){const t=i/n;pts.push(lerp(a,b,t).addScaledVector(bend,Math.sin(Math.PI*t)).addScaledVector(cross,skew*Math.sin(t*2*Math.PI)*Math.sin(t*Math.PI)))}return pts;
 }
 // Major limbs start more vertically, sweep outward, and turn upward near their ends.
 // All subsidiary branches attach to these same curved centreline samples.
 function majorCurve(a,b,bend,n){
  const delta=b.clone().sub(a),horizontal=V(delta.x,0,delta.z),distance=horizontal.length(),out=horizontal.clone().normalize(),side=V(-out.z,0,out.x);
  const lift=Math.max(.10,Math.abs(delta.y)),sign=Math.sin(a.x*5.17+a.y*3.79+b.z*2.83)>=0?1:-1;
  const p1=a.clone().addScaledVector(out,distance*.12).addScaledVector(up,lift*.58).addScaledVector(side,sign*distance*.10);
  const p2=b.clone().addScaledVector(out,-distance*.19).addScaledVector(up,-lift*.48).addScaledVector(side,-sign*distance*.13);
  const pts=[];
  for(let i=0;i<=n;i++){
   const t=i/n,q=1-t;
   const p=a.clone().multiplyScalar(q*q*q).addScaledVector(p1,3*q*q*t).addScaledVector(p2,3*q*t*t).addScaledVector(b,t*t*t);
   p.addScaledVector(side,sign*distance*.065*Math.sin(t*2*Math.PI)*Math.sin(t*Math.PI));
   pts.push(p);
  }
  return pts;
 }
 function branch(a,b,rad,bend,n=7,sides=7,major=false){const pts=major?majorCurve(a,b,bend,n):curved(a,b,bend,n);tube(pts,pts.map((p,i)=>{const t=i/(pts.length-1),collar=1+.22*Math.exp(-Math.pow((t-.08)/.15,2));return Math.max(.0007,rad*Math.pow(Math.max(.005,1-t),1.04)*collar);}),sides);return pts}
 const baseR=h*(young?.020:old?.039:.027),trunkTop=V(r*(rnd()-.5)*.23,h*.65,r*(rnd()-.5)*.18);
 const trunk=curved(V(),trunkTop,V(-r*.10,h*.035,r*.05),28);
 tube(trunk,trunk.map((p,i)=>Math.max(.012,baseR*(.22+.78*Math.pow(1-i/(trunk.length-1),1.2))*(1+.28*Math.exp(-i*.7))*(1+.035*Math.sin(i*.64)+.022*Math.sin(i*1.31)))),mobile?24:36);
 for(let k=0;k<(old?7:4);k++){
  const a=k*tau/(old?7:4),d=baseR*(1.6+rnd()*1.2);
  branch(V(0,baseR*1.4,0),V(Math.cos(a)*d,.015,Math.sin(a)*d),baseR*.34,V(0,baseR*.12,0),7,8);
 }
 const isFlower=season==='spring',hasLeaves=season!=='winter';
 function terminal(a,b,scale,makeTwig=true,path=null){
  if(makeTwig)path=branch(a,b,Math.max(.0018,h*.00043*scale),V((rnd()-.5)*.18,h*.009,(rnd()-.5)*.18),8,5);
  if(!hasLeaves)return;
  const axis=b.clone().sub(a).normalize();
  const u=V(0,1,0).cross(axis);if(u.lengthSq()<.001)u.set(1,0,0);u.normalize();const v=axis.clone().cross(u).normalize();
  const clusters=isFlower?(compactTopology?8:10):(compactTopology?6:8);
  for(let i=0;i<clusters;i++){
   const t=.08+.89*(i+rnd()*.75)/clusters,step=path?t*(path.length-1):0,center=path?lerp(path[Math.floor(step)],path[Math.min(path.length-1,Math.floor(step)+1)],step%1):lerp(a,b,t);const attach=center.clone();
   const angle=rnd()*tau,spur=(.017+rnd()*.043)*Math.min(1.4,scale);
   center.addScaledVector(u,Math.cos(angle)*spur).addScaledVector(v,Math.sin(angle)*spur);
   const count=isFlower?(compactTopology?4+Math.floor(rnd()*4):5+Math.floor(rnd()*4)):2;
   if(isFlower&&i%2===0)branch(attach,center,Math.max(.00065,h*.00017),V(0,.006,0),2,3);
   for(let j=0;j<count;j++){
    const phi=angle+j*2.399963+rnd()*.65,rr=(.011+rnd()*.035)*scale;
    const p=center.clone().addScaledVector(u,Math.cos(phi)*rr).addScaledVector(v,Math.sin(phi)*rr).addScaledVector(axis,(rnd()-.5)*.055);
    const normal=u.clone().multiplyScalar(Math.cos(phi)).addScaledVector(v,Math.sin(phi)).addScaledVector(axis,(rnd()-.45)*1.2).normalize();
    const size=isFlower?.021+rnd()*.015:.039+rnd()*.034;
    (isFlower?flowers:leaves).push({p,s:size,normal,roll:rnd()*tau,t:rnd()});
   }
   if(isFlower&&rnd()<.075)leaves.push({p:center.clone(),s:.033+rnd()*.02,normal:u.clone(),roll:rnd()*tau,t:rnd()});
  }
 }
 const mains=young?8:old?15:12,secondary=young?6:old?10:9;
 for(let i=0;i<mains;i++){
  const a=i*2.399963+(rnd()-.5)*.62,dx=Math.cos(a),dz=Math.sin(a);
  const t=Math.max(.29,Math.min(.91,.32+.54*(i+.4)/mains+(rnd()-.5)*.11)),from=trunk[Math.floor(t*(trunk.length-1))];
  const reach=r*(.68+.27*rnd())*(young?.87:1)*(1-.24*Math.pow(i/mains,2))*(.94+.06*Math.sin(a*3+.7));
  const top=h*(.47+.39*(i/mains)+rnd()*.105+.025*Math.sin(a*2));
  const end=V(dx*reach,Math.min(h*.95,top),dz*reach);
  const main=branch(from,end,baseR*(.40-.20*i/mains),V(dx*r*.055,h*.075,-dz*r*.065),30,mobile?16:22,true);
  for(let k=0;k<secondary;k++){
   const f=.22+.73*(k+.25)/secondary,at=main[Math.min(main.length-2,Math.floor(f*(main.length-1)))];
   const side=a+(k%2?1:-1)*(.45+rnd()*1.12),reach2=r*(.16+rnd()*.15)*(1-.29*f);
   const tip=at.clone().add(V(Math.cos(side)*reach2,h*(.015+rnd()*.115),Math.sin(side)*reach2));
   const d=Math.hypot(tip.x,tip.z);if(d>r*.99){tip.x*=r*.99/d;tip.z*=r*.99/d}tip.y=Math.min(h*.97,tip.y);
   const sub=branch(at,tip,baseR*(.065+.035*rnd())*(1-.4*f),V((rnd()-.5)*r*.25,h*.065,(rnd()-.5)*r*.25),16,8);
   const shoots=compactTopology?8:10;
   for(let m=0;m<shoots;m++){
    const p=sub[Math.min(sub.length-1,Math.floor((.25+.72*(m+.5)/shoots)*(sub.length-1)))];
    const ang=side+(m%2?1:-1)*(.35+rnd()*1.5),len=r*(.065+rnd()*.085);
    const e=p.clone().add(V(Math.cos(ang)*len,h*(.026+rnd()*.06),Math.sin(ang)*len));
    const rd=Math.hypot(e.x,e.z);if(rd>r){e.x*=r/rd;e.z*=r/rd}e.y=Math.min(h*.99,e.y);
    const shoot=branch(p,e,Math.max(.003,baseR*.021),V((rnd()-.5)*len*.36,h*.019,(rnd()-.5)*len*.36),7,5);
    terminal(shoot[0],e,1,false,shoot);
    if(!compactTopology||m%3!==1){
     const q=shoot[4],ang2=ang+(m%2?1:-1)*(.7+rnd()*.8);
     const e2=q.clone().add(V(Math.cos(ang2)*len*.65,h*(.012+rnd()*.036),Math.sin(ang2)*len*.65));
     const rr=Math.hypot(e2.x,e2.z);if(rr>r){e2.x*=r/rr;e2.z*=r/rr}e2.y=Math.min(h,e2.y);
     terminal(q,e2,.9);
     if(m%3===0){const q2=shoot[2],a3=ang2+(m%2?-.95:.95),e3=q2.clone().add(V(Math.cos(a3)*len*.42,h*.026,Math.sin(a3)*len*.42));const rad=Math.hypot(e3.x,e3.z);if(rad>r){e3.x*=r/rad;e3.z*=r/rad}e3.y=Math.min(h*.995,e3.y);terminal(q2,e3,.8);}
    }
   }
  }
 }
 const woodGeo=new T.BufferGeometry();woodGeo.setAttribute('position',new T.Float32BufferAttribute(bp,3));woodGeo.setAttribute('color',new T.Float32BufferAttribute(bc,3));woodGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));woodGeo.setAttribute('barkYouth',new T.Float32BufferAttribute(youth,1));if(adaptivePreview)woodGeo.setAttribute('barkContactAO',new T.Float32BufferAttribute(barkAO,1));woodGeo.setIndex(idx);woodGeo.computeVertexNormals();
 // Horizontal lenticels are characteristic of cherry bark.
 const w=512,ht=512,al=new Uint8Array(w*ht*4),bm=new Uint8Array(w*ht*4);
 for(let y=0;y<ht;y++)for(let x=0;x<w;x++){
  const mott=.5+.5*Math.sin(x*.085+y*.045)*Math.cos(x*.03-y*.055);
  let lent=0;
  const cx=Math.floor(x/64),cy=Math.floor(y/46);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const X=cx+dx,Y=cy+dy,hash=((Math.imul(X+37,73856093)^Math.imul(Y+71,19349663))>>>0);
   const xx=X*64+8+(hash%48),yy=Y*46+6+((hash>>>8)%34),rx=7+(hash%22),ry=1.2+((hash>>>20)%4)*.45;
   const d=((x-xx)/rx)**2+((y-yy)/ry)**2;lent=Math.max(lent,Math.exp(-d*2));
  }
  const n=rnd(),ridges=.5+.5*Math.sin(x*.13+Math.sin(y*.021)*2.4),c=Math.max(70,Math.min(255,238-57*lent-16*mott-8*n-9*ridges)),i=(y*w+x)*4,bb=158-55*lent+13*mott+6*n-13*ridges;
  al.set([c,c*.97,c*.94,255],i);bm.set([bb,bb,bb,255],i);
 }
 const tex=(data,srgb)=>{const t=new T.DataTexture(data,w,ht,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t};
 const wood=new T.Mesh(woodGeo,new T.MeshStandardMaterial({vertexColors:true,map:tex(al,true),bumpMap:tex(bm,false),bumpScale:.005,roughness:.79}));wood.name='sakura-bark-branches';wood.material.onBeforeCompile=shader=>{shader.vertexShader='attribute float barkYouth; varying float vBarkYouth;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBarkYouth=barkYouth;');shader.fragmentShader='varying float vBarkYouth;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.10+vec3(.035,.024,.016),vBarkYouth*.75);');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.73,vBarkYouth*.65);');shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize(mix(normal,nonPerturbedNormal,vBarkYouth*.72));');};if(adaptivePreview){const prior=wood.material.onBeforeCompile;wood.material.onBeforeCompile=shader=>{prior(shader);shader.uniforms.sakuraDetail=previewDetail;shader.vertexShader='attribute float barkContactAO; varying float vBarkContactAO;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBarkContactAO=barkContactAO;');shader.fragmentShader='uniform float sakuraDetail; varying float vBarkContactAO;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.indirectDiffuse*=mix(1.,vBarkContactAO,sakuraDetail);');};}wood.material.customProgramCacheKey=()=> 'sakura-bark-youth-r205'+(adaptivePreview?'-r232':'');wood.castShadow=wood.receiveShadow=true;root.add(wood);applyBarkMaps(T,wood.material,wood,mobile,onReady,adaptivePreview);
 // A whole flower atlas contains the real five-lobed outline, radial veins,
 // notched tips and minute pollen-bearing stamens. Cupped geometry supplies volume.
 const tw=256,petals=new Uint8Array(tw*tw*4),leafPixels=new Uint8Array(tw*tw*4),petalRelief=adaptivePreview?new Float32Array(tw*tw):null;
 const dots=Array.from({length:21},(_,i)=>{const a=i*2.399963,r=.075+.13*Math.sqrt((i+.5)/21);return [Math.cos(a)*r,Math.sin(a)*r,.010+rnd()*.009];});
 for(let y=0;y<tw;y++)for(let x=0;x<tw;x++){
  const u=x/(tw-1),v=y/(tw-1),xx=(u-.5)*2,zz=(v-.5)*2,rho=Math.hypot(xx,zz),a=Math.atan2(zz,xx),theta=((a+Math.PI*2+.6283185)%1.256637)-.6283185;
  const edge=.70+.28*Math.pow(Math.max(0,Math.cos(theta*2.5)),.70)-.045*Math.exp(-theta*theta*280);
  const alpha=Math.max(0,Math.min(1,(edge-rho)*tw*.48+.5));
  const vein=Math.pow(.5+.5*Math.cos(theta*31/(.35+rho)+rho*5),17)*Math.max(0,Math.sin(Math.PI*Math.min(1,rho)));
  const heart=Math.exp(-rho*rho*13),noise=(rnd()-.5)*4,i=(y*tw+x)*4;
  let R=237-5*vein+noise,G=200-32*heart-11*vein+noise,B=212-23*heart-7*vein+noise;
  if(adaptivePreview){R=239-7*vein-3*heart+noise;G=192-34*heart-7*vein+noise;B=207-25*heart-5*vein+noise;}
  if(rho<.25){let pollen=0,filament=0;for(const [dx,dz,dr] of dots){pollen=Math.max(pollen,Math.exp(-((xx-dx)**2+(zz-dz)**2)/(dr*dr)));const t=Math.max(0,Math.min(1,(xx*dx+zz*dz)/(dx*dx+dz*dz)));filament=Math.max(filament,Math.exp(-((xx-t*dx)**2+(zz-t*dz)**2)/.000045));}R=R*(1-pollen)+186*pollen;G=G*(1-pollen)+140*pollen;B=B*(1-pollen)+77*pollen;R-=filament*7;G-=filament*12;B-=filament*8;}
  if(petalRelief)petalRelief[y*tw+x]=alpha*(.32+.19*Math.sin(Math.PI*Math.min(1,rho))+.075*vein+.11*heart+.045*Math.cos(theta*5));
  petals.set([Math.max(0,Math.min(255,R)),Math.max(0,Math.min(255,G)),Math.max(0,Math.min(255,B)),Math.round(alpha*255)],i);
  const d=Math.abs(u-.5),mid=Math.exp(-d*d*1600),lv=Math.pow(.5+.5*Math.cos(v*65-d*43),15)*Math.min(1,d*7);
  const g=Math.max(0,Math.min(255,231+14*mid+9*lv-9*d+noise));
  leafPixels.set([g*.98,g,g*.91,255],i);
 }
 function surfaceTex(data){const t=new T.DataTexture(data,tw,tw,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
 function blossomGeo(){
  // R226: scalloped physical petal rim and recessed centre; keep all instance locations.
  const p=[0,0,0],ix=[],uvs=[.5,.5],segments=adaptivePreview?(mobile?15:25):(mobile?10:20);
  // Single cupped blossom mesh: mobile 10 triangles; desktop 60.
  const rings=adaptivePreview?(mobile?[1]:[.46,1]):(mobile?[1.02]:[.47,1.02]);
  for(const rr of rings){for(let j=0;j<segments;j++){const a=j*tau/segments,theta=((a+tau+.6283185)%1.256637)-.6283185;const rim=adaptivePreview?(.70+.28*Math.pow(Math.max(0,Math.cos(theta*2.5)),.70)-.045*Math.exp(-theta*theta*280)):1.;const x=Math.cos(a)*rr*rim,z=Math.sin(a)*rr*rim,y=adaptivePreview?(.22+.07*Math.cos(a*5))*rr*rr:(.115+.04*Math.cos(a*5))*rr*rr;p.push(x,y,z);uvs.push(.5+x*.5,.5+z*.5);}}
  for(let j=0;j<segments;j++){const next=(j+1)%segments;ix.push(0,1+next,1+j);if(rings.length>1){const a=1+j,b=1+next,c=1+segments+j,d=1+segments+next;ix.push(a,b,c,b,d,c);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function leafGeo(){
  const pts=[0,0,0,-.34,.04,.32,-.42,.07,.58,-.24,.04,.84,0,0,1,.24,.04,.84,.42,.07,.58,.34,.04,.32,0,.11,.52],uvs=[];
  for(let i=0;i<pts.length;i+=3)uvs.push(.5+pts[i],pts[i+2]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));const ix=[];for(let i=0;i<8;i++)ix.push(8,i,(i+1)%8);g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function petalNormal(){if(!petalRelief)return null;const data=new Uint8Array(tw*tw*4);const sample=(x,y)=>petalRelief[Math.max(0,Math.min(tw-1,y))*tw+Math.max(0,Math.min(tw-1,x))];for(let y=0;y<tw;y++)for(let x=0;x<tw;x++){const i=(y*tw+x)*4,dx=(sample(x+1,y)-sample(x-1,y))*3.2,dy=(sample(x,y+1)-sample(x,y-1))*3.2,n=1/Math.hypot(dx,dy,1);data.set([Math.round(128-dx*127*n),Math.round(128-dy*127*n),Math.round(128+127*n),255],i);}const t=new T.DataTexture(data,tw,tw,T.RGBAFormat);t.colorSpace=T.NoColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
 function translucentMat(isPetal){
  const map=surfaceTex(isPetal?petals:leafPixels);
  const mat=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:isPetal?.83:.76,map,metalness:0,alphaTest:isPetal?.35:0});
  if(adaptivePreview&&isPetal){mat.normalMap=petalNormal();mat.normalScale.set(.38,.38);mat.alphaToCoverage=true;map.anisotropy=4;}
  mat.userData.sakuraPreviewMaterial=adaptivePreview;mat.userData.formaAuthoredTransmissionR232=adaptivePreview;mat.onBeforeCompile=shader=>{
   if(adaptivePreview){shader.uniforms.sakuraDetail=previewDetail;shader.uniforms.sakuraSunLocal=sunLocal;shader.uniforms.sakuraSunWeight=sunWeight;shader.vertexShader='attribute float sakuraCanopyAO; attribute vec3 sakuraPathPos; attribute vec3 sakuraPathNeg; uniform vec3 sakuraSunLocal; varying float vSakuraCanopyAO; varying float vSakuraSunPath;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vSakuraCanopyAO=sakuraCanopyAO;
    vec3 sw=abs(sakuraSunLocal);sw/=max(.001,sw.x+sw.y+sw.z);
    vec3 path=mix(sakuraPathNeg,sakuraPathPos,step(vec3(0.),sakuraSunLocal));
    vSakuraSunPath=dot(sw,path);
    `);shader.fragmentShader='uniform float sakuraDetail; uniform float sakuraSunWeight; varying float vSakuraCanopyAO; varying float vSakuraSunPath;\n'+shader.fragmentShader;
    if(isPetal){shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     #ifdef USE_MAP
     float petalRadius=length(vMapUv-vec2(.5))*2.;
     float petalOuter=smoothstep(.28,.93,petalRadius);
     float petalCore=1.-smoothstep(.10,.46,petalRadius);
     vec3 rose=diffuseColor.rgb*vec3(1.,1.,.98);
     diffuseColor.rgb=mix(diffuseColor.rgb,rose*(1.+.045*petalOuter-.12*petalCore),sakuraDetail);
     #endif
    `);shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
     #ifdef USE_MAP
     roughnessFactor=mix(roughnessFactor,mix(.88,.67,smoothstep(.18,.85,length(vMapUv-vec2(.5))*2.)),sakuraDetail);
     #endif
    `);}
   }
   if(adaptivePreview){
    const chunk=T.ShaderChunk.lights_fragment_begin,marker=chunk?.match(/#if\s*\(\s*NUM_DIR_LIGHTS\s*>\s*0\s*\)[^\n]*/);
    if(marker){const at=marker.index+marker[0].length,call=chunk.slice(at).match(/RE_Direct\s*\([^;]*\);/);
     if(call&&call[0].includes('geometryNormal')&&call[0].includes('directLight')){
      const i=at+call.index+call[0].length;
      const addition='\n reflectedLight.directDiffuse+=diffuseColor.rgb*directLight.color*vec3('+(isPetal?'1.,.93,.92':'.88,1.,.70')+')*pow(max(0.,-dot(geometryNormal,directLight.direction)),.85)*'+(isPetal?'.17':'.14')+'*.318309886;\n';
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',chunk.slice(0,i)+addition+chunk.slice(i));
     }
    }
   }
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`
    #include <lights_fragment_end>
    #if NUM_DIR_LIGHTS > 0
    vec3 flN=normalize(normal);
    vec3 flL=normalize(directionalLights[0].direction);
    float flBack=max(0.,-dot(flN,flL));
    float flRim=pow(1.-abs(dot(flN,normalize(vViewPosition))),2.);
    float flStrength=${isPetal?'.10':'.13'}*(flBack*.87+flRim*.13);${adaptivePreview?`\n    float transmitted=pow(max(0.,dot(normalize(vViewPosition),-flL)),2.);\n    float thin=1.-.45*abs(dot(flN,flL));\n    flStrength=mix(flStrength,${isPetal?'.16':'.14'}*(flBack*.49+transmitted*.37+flRim*.14)*thin,sakuraDetail);`:''}
    vec3 flTint=vec3(${isPetal?'.96,.83,.80':'.79,1.0,.55'});
    ${adaptivePreview?'':'reflectedLight.indirectDiffuse+=diffuseColor.rgb*flTint*min(directionalLights[0].color,vec3(1.25))*flStrength;'}
    ${adaptivePreview?`float occ=mix(1.,clamp(vSakuraCanopyAO,.62,1.),.65); float sunVis=mix(1.,clamp(vSakuraSunPath,.60,1.),sakuraDetail*sakuraSunWeight); reflectedLight.indirectDiffuse*=mix(1.,occ,sakuraDetail); reflectedLight.directDiffuse*=sunVis; reflectedLight.directSpecular*=sunVis;`:''}
    #endif
   `);
  };
  mat.customProgramCacheKey=()=> (isPetal?'sakura-petal-transmission-r205':'sakura-leaf-transmission-r205')+(adaptivePreview?'-r229':'');
  return mat;
 }
 // Local density-based canopy occlusion: precomputed once, no extra lighting pass.
 function canopyOcclusion(rows){const cells=new Map(),step=.20,key=(x,y,z)=>x+','+y+','+z;for(const row of rows){const x=Math.floor(row.p.x/step),y=Math.floor(row.p.y/step),z=Math.floor(row.p.z/step),k=key(x,y,z);cells.set(k,(cells.get(k)||0)+1);}const result=new Float32Array(rows.length);rows.forEach((row,i)=>{const x=Math.floor(row.p.x/step),y=Math.floor(row.p.y/step),z=Math.floor(row.p.z/step);let sum=0;for(let dz=-1;dz<=1;dz++)for(let dy=0;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const count=cells.get(key(x+dx,y+dy,z+dz))||0;sum+=count*(dy===0?.55:.85)/(1+Math.abs(dx)+Math.abs(dz));}result[i]=1-.32*(1-Math.exp(-Math.max(0,sum-1)/35));});return result;}
 // R229: six-axis optical depth per occupied cell; rotate/interpolate by current sun
 // direction in the vertex shader. No raymarching per pixel and no added instances.
 function canopyDirectionalPaths(rows){
  const cell=.28,key=(x,y,z)=>x+','+y+','+z,cells=new Map(),coords=[];
  for(const row of rows){const q=[Math.floor(row.p.x/cell),Math.floor(row.p.y/cell),Math.floor(row.p.z/cell)];coords.push(q);const k=key(...q);cells.set(k,(cells.get(k)||0)+1);}
  const cache=new Map(),pos=new Float32Array(rows.length*3),neg=new Float32Array(rows.length*3);
  for(let i=0;i<coords.length;i++){const q=coords[i],k=key(...q);let v=cache.get(k);
   if(!v){v=[];for(const sign of [1,-1])for(let axis=0;axis<3;axis++){let density=Math.max(0,(cells.get(k)||1)-1)*.14;for(let d=1;d<=7;d++){const p=q.slice();p[axis]+=d*sign;const count=cells.get(key(...p))||0;density+=count*Math.exp(-d*.16);}v.push(.60+.40*Math.exp(-density/34));}cache.set(k,v);}
   pos.set(v.slice(0,3),i*3);neg.set(v.slice(3),i*3);
  }return {pos,neg};
 }
 function inst(rows,geo,palette,name){
  if(!rows.length)return;const isPetal=name==='sakura-blossoms',mat=translucentMat(isPetal),m=new T.InstancedMesh(geo,mat,rows.length),d=new T.Object3D(),spin=new T.Quaternion(),col=new T.Color();
  m.name=name;const cs=palette.map(v=>new T.Color(v));if(adaptivePreview){const ao=isPetal?canopyOcclusion(rows):new Float32Array(rows.length).fill(.92);geo.setAttribute('sakuraCanopyAO',new T.InstancedBufferAttribute(ao,1));const paths=isPetal?canopyDirectionalPaths(rows):{pos:new Float32Array(rows.length*3).fill(1),neg:new Float32Array(rows.length*3).fill(1)};geo.setAttribute('sakuraPathPos',new T.InstancedBufferAttribute(paths.pos,3));geo.setAttribute('sakuraPathNeg',new T.InstancedBufferAttribute(paths.neg,3));}
  rows.forEach((row,i)=>{d.position.copy(row.p);d.quaternion.setFromUnitVectors(up,row.normal);spin.setFromAxisAngle(up,row.roll);d.quaternion.multiply(spin);d.scale.setScalar(row.s);d.updateMatrix();m.setMatrixAt(i,d.matrix);col.copy(cs[Math.min(cs.length-1,Math.floor(row.t*cs.length))]);if(isPetal)col.offsetHSL(0,-.02,Math.sin(i*12.9898)*.02);m.setColorAt(i,col)});
  m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;m.computeBoundingSphere();m.castShadow=m.receiveShadow=true;if(adaptivePreview&&isPetal){m.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:mat.map,alphaTest:mat.alphaTest,side:T.DoubleSide});m.addEventListener('dispose',()=>m.customDepthMaterial?.dispose());}root.add(m);
 }
 // Bounded instance budgets keep older mobile GPUs usable. Preserve even spatial distribution.
 const limit=compactTopology?(old?59000:47000):(old?76000:60000);
 const sample=(rows,n)=>rows.length<=n?rows:Array.from({length:n},(_,i)=>rows[Math.floor(i*rows.length/n)]);
 const visibleFlowers=sample(flowers,limit);
 inst(visibleFlowers,blossomGeo(),adaptivePreview?['#f3dce4','#efd2dc','#ecc6d4','#dfb6c7','#f3d9e2','#e8c5d2']:['#f3e3e7','#e9c9d2','#e4bcc8','#ddb0bf','#f0d4da','#e6bec9'],'sakura-blossoms');
 inst(leaves,leafGeo(),season==='autumn'?['#a77944','#b58c53','#946345','#ab8a51']:['#607d48','#789253','#527340','#8a9e60'],'sakura-leaves');
 root.userData.formaSakuraStats={age,season,mobile,adaptivePreview,unifiedTopology:adaptivePreview,canopyOcclusion:adaptivePreview,petalNormal:adaptivePreview,flowers:visibleFlowers.length,generatedFlowers:flowers.length,petalTexture:256,leafTexture:256,flowerTriangles:adaptivePreview?(mobile?15:75):(mobile?10:60),translucency:true,barkVerticalRepeatPerM:2.3,barkPhysicalTileWidthM:.43,barkNormalStrength:.46,curvedMajorLimbs:true,branchCollars:true,leaves:leaves.length,woodTriangles:idx.length/3};
 return root;
}
