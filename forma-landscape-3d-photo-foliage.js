/* FORMA | Photograph-derived foliage cutouts for every existing tree and shrub.
 * Photographs come only from local assets already in the FORMA project.
 * Native 3D trunks, petioles and true measured plant shapes are retained.
 * Fallback remains procedural when a local photograph has no isolatable alpha.
 * Textures are one per species and loaded lazily, never per instance.
 */
export const FOLIAGE_PHOTO_SOURCE=Object.freeze({
 pine:'pine',spruce:'spruce',birch:'birch',oak:'oak',
 maple:'maple',linden:'linden',willow:'willow',rowan:'rowan',
 apple:'apple',sakura:'sakura',ash:'rowan',aspen:'birch',
 // Ash is retained in the legacy source table for catalogue compatibility,
 // but its real-time crown uses a dedicated native 11-leaflet atlas below.
 juniper:'juniper',hydrangea:'hydrangea',spirea:'spirea',
 barberry:'barberry',dogwood:'dogwood','thuja-globe':'thuja-globe',
 lavender:'lavender',boxwood:'boxwood',ninebark:'dogwood',
 hosta:'hydrangea','ornamental-grass':'lavender',fern:'spirea',
 periwinkle:'boxwood','wild-shrub':'spirea'
});
export const exactPhotoSpecies=Object.freeze(
 Object.keys(FOLIAGE_PHOTO_SOURCE).filter(id=>FOLIAGE_PHOTO_SOURCE[id]===id)
);
// Side-view branch textures replace the former top-view landscape icons,
// which looked like solid green clumps when attached to vertical branches.
export const FOLIAGE_SIDE_REFERENCE=Object.freeze({
 pine:'/assets/landscape/items/pine-branch.webp',
 spruce:'/assets/landscape/items/spruce-tall.webp'
});
const cache=new Map();
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function fallbackSpray(canvas,sourceCanvas){
 const ctx=canvas.getContext('2d');
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(sourceCanvas){
  ctx.drawImage(sourceCanvas,0,0,canvas.width,canvas.height);return;
 }
 // Local masks remain available for understory even before an image loads.
 const w=canvas.width,h=canvas.height;
 ctx.strokeStyle='rgba(130,147,118,.75)';ctx.lineWidth=w*.008;
 for(let arm=-2;arm<=2;arm++){
  ctx.beginPath();ctx.moveTo(w*.5,h*.85);
  ctx.quadraticCurveTo(w*(.52+arm*.10),h*.5,w*(.5+arm*.14),h*.20);ctx.stroke();
  for(let i=0;i<6;i++){
   const t=(i+1)/7,x=w*(.5+arm*.14*t),y=h*(.85-.65*t);
   for(const sign of [-1,1]){
    ctx.fillStyle='rgba(227,236,209,.95)';
    ctx.beginPath();ctx.ellipse(x+sign*w*.025,y-h*.014,w*.024,w*.060,sign*.75,0,Math.PI*2);ctx.fill();
   }
  }
 }
}
function photoMask(image){
 // Work in a small scratch canvas; verify alpha before using a source photo.
 const doc=image.ownerDocument||document,scratch=doc.createElement('canvas');
 scratch.width=384;scratch.height=384;
 const cx=scratch.getContext('2d',{willReadFrequently:true});
 cx.clearRect(0,0,384,384);cx.drawImage(image,0,0,384,384);
 const pic=cx.getImageData(0,0,384,384),p=pic.data;
 let transparent=0,nearWhite=0;
 for(let i=0;i<p.length;i+=4){
  if(p[i+3]<210)transparent++;
  if(p[i]>237&&p[i+1]>237&&p[i+2]>237)nearWhite++;
 }
 const count=p.length/4;
 // Supplied PNGs may be already cut out; preserve their real alpha edges.
 if(transparent/count<.045){
  // White photographic studio backdrop: key only its neutral highlights.
  // Complex photographs with scenery are NOT flattened onto foliage cards.
  if(nearWhite/count<.38)return null;
  for(let i=0;i<p.length;i+=4){
   const brightness=Math.min(p[i],p[i+1],p[i+2]);
   const chroma=Math.max(p[i],p[i+1],p[i+2])-brightness;
   if(brightness>222&&chroma<28)
    p[i+3]=Math.round(p[i+3]*(1-clamp((brightness-222)/32,0,1)));
  }
 }else if(transparent/count>.96)return null;
 // Keep photographic leaf veins and shading; use neutral luminance so the
 // species palette can still respond to seasons and per-instance sunlight.
 let opaque=0;
 for(let i=0;i<p.length;i+=4){
  if(p[i+3]<18)continue;
  opaque++;
  const lum=p[i]*.24+p[i+1]*.64+p[i+2]*.12;
  const grey=Math.round(clamp(171+lum*.29,175,245));
  p[i]=grey;p[i+1]=Math.min(255,grey+3);p[i+2]=Math.max(0,grey-4);
 }
 if(opaque/count<.045)return null;
 cx.putImageData(pic,0,0);
 return scratch;
}
function stampPhotographicTwigs(canvas,scratch,id){
 const ctx=canvas.getContext('2d');
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);
 // Use multiple independent photo regions, not a duplicated whole-tree
 // billboard. The upper canopy avoids tree trunks in reference cutouts.
 const sourceSites=id==='pine'?[
  [.06,.17,.33,.19,-.29,.28,.33,.56,.40],
  [.37,.08,.31,.20,.36,.62,.28,.61,.42],
  [.60,.20,.29,.19,-.14,.73,.48,.55,.40],
  [.10,.35,.30,.18,.24,.32,.65,.56,.39],
  [.48,.36,.33,.18,-.30,.66,.69,.59,.40],
  [.22,.49,.32,.15,.15,.49,.50,.53,.34]
 ]:id==='spruce'?[
  [.23,.10,.31,.20,-.34,.36,.26,.55,.47],
  [.46,.20,.28,.19,.37,.65,.29,.53,.46],
  [.24,.34,.31,.19,-.20,.33,.55,.58,.42],
  [.46,.40,.28,.19,.34,.67,.57,.57,.42],
  [.26,.57,.31,.19,-.18,.47,.75,.64,.45],
  [.44,.61,.27,.18,.19,.60,.73,.51,.44]
 ]:[
  [.18,.06,.35,.33,-.53,.32,.34,.70,.60],
  [.48,.09,.33,.38,.42,.68,.35,.72,.66],
  [.28,.29,.36,.31,-.14,.46,.60,.70,.57],
  [.57,.23,.31,.37,.16,.60,.58,.61,.66],
  [.07,.30,.31,.35,-.80,.26,.60,.49,.46],
  [.63,.35,.31,.32,.66,.78,.61,.45,.49]
 ];
 // Trim individual SOURCE patches, not only the final atlas boundary.
 // Avoid the square-edged clumps formerly visible in the pine silhouette.
 const patch=document.createElement('canvas');
 patch.width=patch.height=192;
 const pctx=patch.getContext('2d',{willReadFrequently:true});
 for(const [sx,sy,sw,sh,rot,tx,ty,dw,dh] of sourceSites){
  pctx.clearRect(0,0,192,192);
  pctx.drawImage(scratch,sx*384,sy*384,sw*384,sh*384,0,0,192,192);
  const pix=pctx.getImageData(0,0,192,192),mask=pix.data;
  for(let y=0;y<192;y++)for(let x=0;x<192;x++){
   const edge=Math.min(x,y,191-x,191-y);
   const i=(y*192+x)*4+3;
   mask[i]=Math.round(mask[i]*clamp(edge/24,0,1));
  }
  pctx.putImageData(pix,0,0);
  ctx.save();ctx.translate(tx*w,ty*h);ctx.rotate(rot);
  ctx.drawImage(patch,-dw*w/2,-dh*h/2,dw*w,dh*h);
  ctx.restore();
 }
 // Cutout's perimeter must be transparent so mipmaps do not show a square.
 const data=ctx.getImageData(0,0,w,h),p=data.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const distance=Math.min(x,y,w-1-x,h-1-y);
  if(distance>20)continue;
  const idx=(y*w+x)*4;
  p[idx+3]=Math.round(p[idx+3]*clamp(distance/20,0,1));
 }
 ctx.putImageData(data,0,0);
}
// Real CC0 maple leaf cutout, kept as a complete leaf, not chopped into
// arbitrary rectangular fragments. The canvas is shared by all trees.
let mapleLeaf=null;
export function mapleLeafMask(T){
 if(mapleLeaf)return mapleLeaf;
 const c=document.createElement('canvas');c.width=c.height=256;
 const ctx=c.getContext('2d');const outline=[[128,20],[145,78],[177,48],[171,101],[226,80],[199,136],[236,158],[163,182],[138,174],[128,220],[118,174],[93,182],[20,158],[57,136],[30,80],[85,101],[79,48],[111,78]];
 const grad=ctx.createLinearGradient(20,40,220,200);grad.addColorStop(0,'#7b9554');grad.addColorStop(.55,'#4d703c');grad.addColorStop(1,'#375739');ctx.fillStyle=grad;ctx.beginPath();outline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
 ctx.save();ctx.clip();ctx.strokeStyle='rgba(190,203,142,.55)';ctx.lineWidth=1.5;
 for(const [x,y] of [[128,20],[177,48],[226,80],[236,158],[20,158],[30,80],[79,48]]){ctx.beginPath();ctx.moveTo(128,180);ctx.quadraticCurveTo(128+(x-128)*.5,y+42,x,y);ctx.stroke();}ctx.restore();
 // Secondary fine venation and leaf surface granularity within the cutout.
 ctx.save();ctx.beginPath();outline.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
 let seed=41621;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<11;i++){const y=58+i*11;for(const sign of [-1,1]){
  ctx.strokeStyle='rgba(194,211,155,.30)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(128,y+22);ctx.quadraticCurveTo(128+sign*21,y+3,128+sign*(36+rand()*37),y-13);ctx.stroke();
 }}
 for(let i=0;i<9000;i++){ctx.fillStyle=rand()>.5?'rgba(234,235,205,.08)':'rgba(23,39,19,.07)';ctx.fillRect(rand()*256,rand()*256,1,1);}
 ctx.restore();
 mapleLeaf=new T.CanvasTexture(c);mapleLeaf.colorSpace=T.SRGBColorSpace;mapleLeaf.anisotropy=4;mapleLeaf.userData.source='local botanical fallback';
 const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
 img.onload=()=>{try{
  const temp=document.createElement('canvas');temp.width=temp.height=256;const t=temp.getContext('2d',{willReadFrequently:true});
  const scale=240/Math.max(img.width,img.height),w=img.width*scale,h=img.height*scale;t.drawImage(img,(256-w)/2,(256-h)/2,w,h);
  const data=t.getImageData(0,0,256,256).data;let visible=0,clear=0;for(let i=3;i<data.length;i+=4){if(data[i]>180)visible++;if(data[i]<40)clear++;}
  if(visible<2000||clear<3000)return;
  ctx.clearRect(0,0,256,256);ctx.drawImage(temp,0,0);mapleLeaf.needsUpdate=true;mapleLeaf.userData.source='OpenGameArt CC0 vegetation_leaf_maple_01.png';mapleLeaf.userData.photoState='ready';window.dispatchEvent(new Event('forma-foliage-texture-ready'));
 }catch{}};
 const remote='https://opengameart.org/sites/default/files/vegetation_leaf_maple_01.png';
 img.onerror=()=>{if(img.src!==remote)img.src=remote;else mapleLeaf.userData.photoState='unavailable';};
 img.src=new URL('./assets/landscape-photo/maple-r33/leaf.png',import.meta.url).href;
 return mapleLeaf;
}
export function createPhotoFoliageTexture(T,id,{fallback=null}={}){
 if(cache.has(id))return cache.get(id);
 const dom=typeof document==='undefined'?null:document;
 if(!dom)return fallback;
 const canvas=dom.createElement('canvas');canvas.width=canvas.height=512;
 fallbackSpray(canvas,fallback?.image||null);
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=4;
 texture.minFilter=T.LinearMipmapLinearFilter;
 texture.magFilter=T.LinearFilter;
 texture.userData={photographicFoliage:true,photoState:'loading',source:FOLIAGE_PHOTO_SOURCE[id]||null};
 cache.set(id,texture);
 // Rowan is a different species. Do not paint its leaf photo on common ash.
 // Use the already-created species-correct local compound-leaf atlas instead.
 if(id==='ash'){
  texture.userData.source='native-fraxinus-excelsior';
  texture.userData.photoState='native';
  return texture;
 }
 const source=FOLIAGE_PHOTO_SOURCE[id];if(!source){texture.userData.photoState='fallback';return texture}
 const img=new Image();
 img.decoding='async';
 img.onload=()=>{
  try{
   const cutout=photoMask(img);
   if(!cutout){texture.userData.photoState='fallback';return}
   stampPhotographicTwigs(canvas,cutout,id);
   texture.needsUpdate=true;texture.userData.photoState='ready';
   if(typeof window!=='undefined')window.dispatchEvent(new Event('forma-foliage-texture-ready'));
  }catch(err){
   texture.userData.photoState='fallback';
   console.warn('FORMA photo foliage fallback:',id,err?.message||err);
  }
 };
 img.onerror=()=>{texture.userData.photoState='fallback'};
 img.src=new URL((FOLIAGE_SIDE_REFERENCE[id]||'/assets/landscape-photo/'+source+'.png').replace(/^\//,'./'),import.meta.url).href;
 return texture;
}
