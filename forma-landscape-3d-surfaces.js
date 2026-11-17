/* FORMA real-world surface materials. Photo JPGs are first-party
   landscape assets in this repo. Source geometry remains measured and editable. */
const textureCache=new Map();
export const SURFACE_PHOTO_IDS=Object.freeze([
 'concrete-pavers','granite-setts','clinker-herringbone','slate-pavers','radial-setts','grass-grid',
 'marble-chips','granite-chips','river-pebble','slate-chips','pine-bark',
 'formal','universal','shade','meadow'
]);
export function surfaceTexture(T,id){
 if(!SURFACE_PHOTO_IDS.includes(id))return null;
 if(textureCache.has(id))return textureCache.get(id);
 const t=new T.TextureLoader().load('/assets/landscape-photo/'+id+'.jpg');
 t.colorSpace=T.SRGBColorSpace;t.wrapS=T.RepeatWrapping;t.wrapT=T.RepeatWrapping;
 t.repeat.set(id==='concrete-pavers'?.58:id==='granite-setts'?1.1:
  id==='pine-bark'||id==='river-pebble'?1.5:
  ['formal','universal','shade','meadow'].includes(id)?1.35:.86,
  id==='concrete-pavers'?.58:id==='granite-setts'?1.1:1.3);
 t.anisotropy=8;
 textureCache.set(id,t);return t;
}
export function surfaceMaterial(T,id,color='#888888'){
 const tex=surfaceTexture(T,id);
 if(!tex)return new T.MeshStandardMaterial({color,roughness:.96,metalness:0,side:T.DoubleSide});
 // Preserve natural photographic surface colour. Avoid tinting a photograph
 // dark gray, which made lawns and stone look like painted boxes.
 const mat=new T.MeshStandardMaterial({map:tex,color:'#ffffff',roughness:.92,metalness:0,side:T.DoubleSide});
 return mat;
}
