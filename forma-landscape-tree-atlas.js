/* FORMA TREE CROWNS / ten actual generated photographic overhead canopies.
 * Packed as a transparent 5x2 webp atlas for network economy; on load each
 * species is extracted with Canvas to an independent transparent PNG data URL.
 * The editable plan draws tree shadows separately, according to sun & height.
 */
export const TREE_ATLAS_URL='/assets/landscape/trees/canopy-atlas-v1.webp?v=20261117';
export const TREE_SPECIES=Object.freeze(['pine','spruce','birch','oak','maple','linden','willow','rowan','apple','sakura']);
const cache=new Map();
let pending=null;
export const treeCanopyPNG=(id)=>cache.get(id)||null;
export const treeCanopyCount=()=>cache.size;
export const treeCanopyReady=()=>cache.size===TREE_SPECIES.length;
export async function prepareTreeAtlas(){
 if(treeCanopyReady())return true;
 if(pending)return pending;
 pending=(async()=>{
  if(typeof document==='undefined')return false;
  const img=new Image();
  img.decoding='async';
  img.src=TREE_ATLAS_URL;
  try{await img.decode();}catch{return false}
  if(img.naturalWidth<400||img.naturalHeight<170)return false;
  const sw=img.naturalWidth/5,sh=img.naturalHeight/2;
  const canvas=document.createElement('canvas'),size=Math.floor(Math.min(sw,sh));
  canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d',{willReadFrequently:false});
  if(!ctx)return false;
  for(let i=0;i<TREE_SPECIES.length;i++){
   try{
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(img,(i%5)*sw,Math.floor(i/5)*sh,sw,sh,0,0,size,size);
    const png=canvas.toDataURL('image/png');
    if(png.startsWith('data:image/png;base64,'))cache.set(TREE_SPECIES[i],png);
   }catch{/* A missing sprite must not prevent editing other species. */}
  }
  return treeCanopyReady();
 })();
 try{return await pending}finally{pending=null}
}
