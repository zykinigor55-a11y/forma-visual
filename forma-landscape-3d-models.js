/* Real 3D botanical asset adapter for FORMA.
 * Geometry never supplies measured project dimensions: a catalogue object does.
 * Imports are user-controlled binary GLB files with local IndexedDB storage.
 */
export function vegetationFit({width,height,depth},instance){
 const srcW=Math.max(.0001,Number(width)||1),srcD=Math.max(.0001,Number(depth)||1),srcH=Math.max(.0001,Number(height)||1);
 const crown=Math.max(.2,Math.min(30,Number(instance?.diameter)||2));
 const plantHeight=Math.max(.25,Math.min(40,Number(instance?.height)||3));
 // Exact crown width/height are authoritative; proportions within each axis
 // remain intact and geometry is never edited destructively.
 return {scaleXZ:crown/Math.max(srcW,srcD),scaleY:plantHeight/srcH,
         physicalHeight:plantHeight,crownDiameter:crown};
}
const boundsCache=new WeakMap();
export function makeRealVegetation(T,source,instance,{shareGeometry=false}={}){
 if(!source?.isObject3D)throw Error('The GLB does not contain a valid 3D scene.');
 let bounds=boundsCache.get(source);
 if(!bounds){
  bounds=new T.Box3().setFromObject(source);
  if(bounds.isEmpty())throw Error('3D model has no measurable geometry.');
  boundsCache.set(source,bounds.clone());
 }
 const clone=source.clone(true);
 const size=new T.Vector3(),centre=new T.Vector3();bounds.getSize(size);bounds.getCenter(centre);
 if(!Number.isFinite(size.y)||size.y<1e-5||Math.max(size.x,size.z)<1e-5)throw Error('GLB has zero height or crown width.');
 const fit=vegetationFit({width:size.x,height:size.y,depth:size.z},instance);
 // Meshes are independent of the source cache, making scene rebuild disposal
 // safe. Textures can stay shared with imported source until browser reload.
 clone.traverse(node=>{
  if(!node.isMesh)return;
  if(shareGeometry){node.userData.bundledSharedGeometry=true;}else{node.geometry=node.geometry?.clone();}
  node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material?.clone();
  node.castShadow=true;node.receiveShadow=true;
  if(node.material){
   for(const material of Array.isArray(node.material)?node.material:[node.material]){
    if(material?.transparent&&material.opacity===1)material.alphaTest=Math.max(.2,material.alphaTest||0);
    material.side=T.DoubleSide;
   }
  }
 });
 const group=new T.Group();
 clone.scale.set(fit.scaleXZ,fit.scaleY,fit.scaleXZ);
 clone.position.set(-centre.x*fit.scaleXZ,-bounds.min.y*fit.scaleY,-centre.z*fit.scaleXZ);
 group.add(clone);
 group.userData.species=instance.catalogId;
 group.userData.realGlb=true;
 group.userData.bundledModel=shareGeometry;
 group.userData.physicalHeight=fit.physicalHeight;
 group.userData.crownDiameter=fit.crownDiameter;
 return group;
}
