/* R68: calibrated matte oak bark. Never bind raw brown/glossy maps directly.
 * The photographic image contributes fine luminance detail; the existing
 * longitudinal relief controls the bark structure. All maps remain periodic.
 */
const started=new WeakSet();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const path='bark_brown_01_diff_1k.jpg';
const remote='https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/bark_brown_01/'+path;
function smoothPeriodic(src,n,r){
 const tmp=new Float32Array(n*n),out=new Float32Array(n*n),wrap=x=>(x+n)%n,d=r*2+1;
 for(let y=0;y<n;y++){let s=0;for(let j=-r;j<=r;j++)s+=src[y*n+wrap(j)];for(let x=0;x<n;x++){tmp[y*n+x]=s/d;s+=src[y*n+wrap(x+r+1)]-src[y*n+wrap(x-r)];}}
 for(let x=0;x<n;x++){let s=0;for(let j=-r;j<=r;j++)s+=tmp[wrap(j)*n+x];for(let y=0;y<n;y++){out[y*n+x]=s/d;s+=tmp[wrap(y+r+1)*n+x]-tmp[wrap(y-r)*n+x];}}
 return out;
}
function lumaImage(image,n){
 const c=document.createElement('canvas');c.width=c.height=n;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,n,n);
 const p=ctx.getImageData(0,0,n,n).data,a=new Float32Array(n*n);
 for(let i=0;i<a.length;i++)a[i]=.2126*p[i*4]+.7152*p[i*4+1]+.0722*p[i*4+2];
 // A narrow edge blend eliminates discontinuities on both texture axes.
 const edge=24;
 for(let y=0;y<n;y++)for(let x=0;x<edge;x++){const l=y*n+x,r=y*n+n-1-x,t=.5*(1-x/edge),v=a[l],w=a[r];a[l]=v*(1-t)+w*t;a[r]=w*(1-t)+v*t;}
 for(let x=0;x<n;x++)for(let y=0;y<edge;y++){const l=y*n+x,r=(n-1-y)*n+x,t=.5*(1-y/edge),v=a[l],w=a[r];a[l]=v*(1-t)+w*t;a[r]=w*(1-t)+v*t;}
 return a;
}
function calibrate(maps,source){
 const n=maps.bark.image.width;
 const base=lumaImage(maps.bark.image,n),photo=source?lumaImage(source,n):base;
 const low=smoothPeriodic(photo,n,24),medium=smoothPeriodic(photo,n,4);
 const output=maps.bark.image.getContext('2d'),nc=maps.normal.image.getContext('2d'),rc=maps.rough.image.getContext('2d');
 const b=output.createImageData(n,n),normal=nc.createImageData(n,n),rough=rc.createImageData(n,n),h=new Float32Array(n*n);
 let mean=0;for(const v of base)mean+=v;mean/=base.length;
 for(let i=0;i<base.length;i++){
  const micro=photo[i]-medium[i],grain=medium[i]-low[i];
  const structure=(base[i]-mean)*1.05;
  const value=clamp(119+structure+grain*.73+micro*.90,51,172),k=i*4;
  // Neutral grey-brown oak, not amber or glossy exposed wood.
  b.data.set([value*1.045,value*.995,value*.925,255],k);
  h[i]=clamp(.5+structure/125+grain/160+micro/220,0,1);
  const r=clamp(247-Math.max(0,micro)*.14,235,252);rough.data.set([r,r,r,255],k);
 }
 const wrap=x=>(x+n)%n;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=(y*n+x)*4,dx=(h[y*n+wrap(x+1)]-h[y*n+wrap(x-1)])*3.1,dy=(h[wrap(y+1)*n+x]-h[wrap(y-1)*n+x])*3.1,l=Math.hypot(dx,dy,1);normal.data.set([128-127*dx/l,128+127*dy/l,128+127/l,255],k);}
 output.putImageData(b,0,0);nc.putImageData(normal,0,0);rc.putImageData(rough,0,0);
 for(const map of [maps.bark,maps.normal,maps.rough])map.needsUpdate=true;
}
export function installMatteOakMaps(T,maps){
 if(started.has(maps))return;started.add(maps);
 // Capture original structural maps before the synchronous initial calibration.
 const original=maps.bark.image.getContext('2d').getImageData(0,0,maps.bark.image.width,maps.bark.image.height);
 calibrate(maps,null);
 window.FORMA_OAK_BARK_R67='R68 matte procedural';
 const loader=new T.TextureLoader();
 (async()=>{
  let image=null,source='photo';
  try{let texture;try{texture=await loader.loadAsync(new URL('./assets/landscape-photo/r67/'+path,document.baseURI).href);}catch{texture=await loader.loadAsync(remote);}image=texture.image;texture.dispose();}
  catch{try{const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const gltf=await new GLTFLoader().loadAsync(new URL('./assets/landscape-models/oak-terraintale-cc0.glb',document.baseURI).href);const a=[];gltf.scene.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.map&&!m.transparent&&!(m.alphaTest>0))a.push(m)});const m=a.find(m=>/bark|trunk|wood/i.test(m.name||''))||(a.length===1?a[0]:null);image=m?.map?.image;source='bundled';}catch{}}
  if(!image)return;
  try{
   // Read and validate all image pixels before altering the displayed material.
   lumaImage(image,64);maps.bark.image.getContext('2d').putImageData(original,0,0);
   calibrate(maps,image);
   window.FORMA_OAK_BARK_R67='R68 matte '+source;
   window.dispatchEvent(new Event('forma-foliage-texture-ready'));
  }catch(e){maps.bark.image.getContext('2d').putImageData(original,0,0);calibrate(maps,null);console.warn('R68 matte bark fallback',e);}
 })();
}
