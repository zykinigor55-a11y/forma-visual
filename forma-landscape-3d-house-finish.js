/* FORMA architecture finishing. Real-world UVs and optional local CC0
 * photographed surface maps. Source maps are hosted on the FORMA domain,
 * so homes render without any third-party request or VPN.
 */
export const HOUSE_PHOTO_PBR=Object.freeze({
 brick:Object.freeze({slug:'brick_wall_003',source:'https://polyhaven.com/a/brick_wall_003'}),
 wood:Object.freeze({slug:'wooden_planks',source:'https://polyhaven.com/a/wooden_planks'}),
 stucco:Object.freeze({slug:'white_stucco_02',source:'https://polyhaven.com/a/white_stucco_02'}),
 tile:Object.freeze({slug:'roof_tiles',source:'https://polyhaven.com/a/roof_tiles'})
});
export function facadeUV({x=0,y=0},span=8,tileMetres=1.8){
 const tile=Math.max(.2,Number(tileMetres)||1.8);
 return {u:(x+span*.5)/tile,v:y/tile};
}
// A photo should not restart at each wall patch, window lintel, or jamb.
// UV coordinates follow the surveyed facade rather than each mesh's width.
export function measuredFacadePatchGeometry(T,patch,span,tileMetres=1.8){
 const geometry=new T.BoxGeometry(patch.width,patch.height,.19);
 const position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
 for(let i=0;i<position.count;i++){
  const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
  const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
  let u,v;
  if(Math.abs(nz)>.5){({u,v}=facadeUV({x:patch.x+x,y:patch.y+y},span,tileMetres))}
  else if(Math.abs(nx)>.5){({u,v}=facadeUV({x:patch.x+z,y:patch.y+y},span,tileMetres))}
  else {({u,v}=facadeUV({x:patch.x+x,y:patch.y+z},span,tileMetres))}
  uv.setXY(i,u,v);
 }
 uv.needsUpdate=true;
 return geometry;
}
const photos=new Map();
function originalPhoto(T,name,channel){
 const key=name+':'+channel;
 if(photos.has(key))return photos.get(key);
 const path='/assets/house-pbr/'+name+'-'+channel+'-1k.jpg';
 const task=new Promise(resolve=>{
  new T.TextureLoader().load(path,texture=>{
   texture.wrapS=texture.wrapT=T.RepeatWrapping;
   texture.anisotropy=8;
   if(channel==='diff')texture.colorSpace=T.SRGBColorSpace;
   resolve(texture);
  },undefined,()=>resolve(null));
 });
 photos.set(key,task);
 return task;
}
function materialReady(){
 if(typeof window==='undefined')return;
 window.dispatchEvent(new Event('forma-house-pbr-ready'));
}
function applyPhotoChannel(material,channel,photo,owned,T,scale,photoColor=false){
 if(!photo||!material)return;
 // Each building owns its UV scaling, never mutating the shared cached photo.
 const texture=photo.clone();
 texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.repeat.set(Math.max(.2,scale[0]),Math.max(.2,scale[1]));
 texture.anisotropy=8;
 if(channel==='diff')texture.colorSpace=T.SRGBColorSpace;
 texture.needsUpdate=true;
 owned.push(texture);
 if(channel==='diff'&&photoColor){
  material.map=texture;
  material.color.set('#FFFFFF');
 }else if(channel==='nor_gl'){
  material.normalMap=texture;
  material.normalScale=new T.Vector2(.52,.52);
  material.bumpScale*=.35; // keep the tested original bump map, reduce double relief
 }else if(channel==='rough'){
  material.roughnessMap=texture;
  material.roughness=Math.max(.76,material.roughness||0);
 }
 material.needsUpdate=true;
 materialReady();
}
// Painting style/preset remains authoritative: wood colors and user roof color
// are preserved. Genuine stone/brick/stucco color is restored from photo maps.
export function applyArchitecturalPBR(T,{wall,roofFinish,wallMaterial,roofMaterial,roofScale=[1,1],ownedTextures=[]}){
 const wallKey=wall==='brick'?'brick':wall==='plaster'?'stucco':
  wall==='stone'?'stucco':['darkwood','lightwood','walnut','cedar'].includes(wall)?'wood':null;
 const isPhotoColor=wall==='brick'||wall==='plaster';
 if(wallKey)for(const channel of ['diff','nor_gl','rough']){
  if(channel==='diff'&&!isPhotoColor)continue;
  originalPhoto(T,wallKey,channel).then(photo=>{
   applyPhotoChannel(wallMaterial,channel,photo,ownedTextures,T,[1,1],isPhotoColor);
  });
 }
 if(roofFinish==='tile')for(const channel of ['nor_gl','rough']){
  originalPhoto(T,'tile',channel).then(photo=>{
   applyPhotoChannel(roofMaterial,channel,photo,ownedTextures,T,roofScale);
  });
 }
}
