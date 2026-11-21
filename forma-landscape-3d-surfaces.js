/* FORMA · measured outdoor ground materials.
 * Legacy surface JPGs stay fully local. New CC0 Poly Haven materials use
 * photographed albedo, OpenGL normal and roughness at an honest metre scale.
 * Loader falls back to the proven local palette if network access is blocked.
 */
const textureCache=new Map();
const terrainCache=new Map();
export const SURFACE_PHOTO_IDS=Object.freeze([
 'concrete-pavers','granite-setts','clinker-herringbone','slate-pavers','radial-setts','grass-grid',
 'marble-chips','granite-chips','river-pebble','slate-chips','pine-bark',
 'formal','universal','shade','meadow'
]);
export const GROUND_PBR_SOURCES=Object.freeze({
 'sand-fine':{name:'Песок природный',slug:'sand_01',scale:.58,fallback:'marble-chips',roughness:.98},
 'gravel-natural':{name:'Гравий природный',slug:'gravel',scale:.52,fallback:'river-pebble',roughness:.95},
 'crushed-stone':{name:'Щебень мелкой фракции',slug:'gravel_ground_01',scale:.61,fallback:'granite-chips',roughness:.98},
 'sandy-gravel':{name:'Песчано-гравийная смесь',slug:'sandy_gravel',scale:.55,fallback:'granite-chips',roughness:.96}
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pbrAsset=(slug,channel)=>'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/'+slug+'/'+slug+'_'+channel+'_1k.jpg';
export function surfacePreviewURL(id){
 const source=GROUND_PBR_SOURCES[id];
 return source?'https://cdn.polyhaven.com/asset_img/thumbs/'+source.slug+'.png':'/assets/landscape-photo/'+id+'.jpg';
}
export function surfaceTexture(T,id){
 if(GROUND_PBR_SOURCES[id])return terrainPBR(T,id).diffuse;
 if(!SURFACE_PHOTO_IDS.includes(id))return null;
 if(textureCache.has(id))return textureCache.get(id);
 const t=new T.TextureLoader().load('/assets/landscape-photo/'+id+'.jpg');
 t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
 t.repeat.set(id==='concrete-pavers'?.58:id==='granite-setts'?1.1:
  id==='pine-bark'||id==='river-pebble'?1.5:
  ['formal','universal','shade','meadow'].includes(id)?1.35:.86,
  id==='concrete-pavers'?.58:id==='granite-setts'?1.1:1.3);
 t.anisotropy=8;
 textureCache.set(id,t);return t;
}
function terrainPBR(T,id){
 if(terrainCache.has(id))return terrainCache.get(id);
 const data=GROUND_PBR_SOURCES[id];
 if(!data)return null;
 const loader=new T.TextureLoader();
 const make=(channel,rgba)=>{
  // Valid 1x1 texel until the photograph finishes downloading; even a
  // blocked CDN never leaves the 3D editor with a black / invalid material.
  // CanvasTexture accepts an HTMLImageElement later without using the
  // DataTexture upload path (which requires image.data and would fail).
  const pixel=document.createElement('canvas');pixel.width=pixel.height=1;
  const ctx=pixel.getContext('2d');
  ctx.fillStyle='rgba('+rgba[0]+','+rgba[1]+','+rgba[2]+','+(rgba[3]/255)+')';
  ctx.fillRect(0,0,1,1);
  const out=new T.CanvasTexture(pixel);
  out.wrapS=out.wrapT=T.RepeatWrapping;
  out.repeat.set(data.scale,data.scale);
  out.anisotropy=8;
  if(channel==='diff')out.colorSpace=T.SRGBColorSpace;
  out.needsUpdate=true;
  loader.load(pbrAsset(data.slug,channel),image=>{
   out.image=image.image;out.needsUpdate=true;
   if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('forma-surface-texture-ready',{detail:{id,channel}}));
  },undefined,()=>{
   if(channel!=='diff')return; // Neutral normal and white roughness survive.
   loader.load('/assets/landscape-photo/'+data.fallback+'.jpg',image=>{
    out.image=image.image;out.needsUpdate=true;
    if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('forma-surface-texture-ready',{detail:{id,channel:'fallback'}}));
   },undefined,()=>console.warn('FORMA surface image unavailable:',id));
  });
  return out;
 };
 const maps={
  diffuse:make('diff',[255,255,255,255]),
  normal:make('nor_gl',[128,128,255,255]),
  roughness:make('rough',[255,255,255,255])
 };
 terrainCache.set(id,maps);
 return maps;
}
export function surfaceMaterial(T,id,color='#888888'){
 const data=GROUND_PBR_SOURCES[id];
 if(data){
  const maps=terrainPBR(T,id);
  return new T.MeshStandardMaterial({
   color:'#ffffff',map:maps.diffuse,
   normalMap:maps.normal,normalScale:new T.Vector2(.72,.72),
   roughnessMap:maps.roughness,roughness:clamp(data.roughness,.8,1),
   metalness:0,side:T.DoubleSide
  });
 }
 const tex=surfaceTexture(T,id);
 if(!tex)return new T.MeshStandardMaterial({color,roughness:.96,metalness:0,side:T.DoubleSide});
 return new T.MeshStandardMaterial({map:tex,color:'#ffffff',roughness:.92,metalness:0,side:T.DoubleSide});
}
