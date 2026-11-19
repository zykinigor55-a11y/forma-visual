import {reshapeNativePine} from './forma-landscape-pine-native.js';
import {reshapeNativeSpruce} from './forma-landscape-spruce-native.js';
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
/** Respect source-authored PBR material settings. Double-sided stone and
 * furniture faces cost extra fill-rate and produce unrealistic shading.
 * Thin botanical leaf cards may need double-sided lighting, but only when
 * their source material explicitly marks them as double-sided.
 */
export function prepareRealMaterial(material){
 if(!material)return material;
 if(material.transparent&&material.opacity===1&&material.alphaTest>0){
  material.depthWrite=true;
 }
 // Keep glTF side, roughness, metalness, normal maps, alpha mode and cutoff.
 return material;
}
const boundsCache=new WeakMap();
export function makeRealVegetation(T,source,instance,{shareGeometry=false,canopyCopies=0,pineGrowth=null,spruceGrowth=null}={}){
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
 // Preserve the original PBR leaf and bark materials, but do not create
 // hundreds of equivalent GPU materials for 625-mesh oak/maple/linden GLBs.
 // Clone each distinct source material ONCE PER TREE. All leaves in one tree
 // share the exact same cloned roughness, normal/alpha textures and draw state.
 // Different planted trees still have independently disposable materials.
 const materialCache=new Map();
 const copyMaterial=material=>{
  if(!material)return material;
  let copy=materialCache.get(material);
  if(!copy){
   copy=prepareRealMaterial(material.clone());
   materialCache.set(material,copy);
  }
  return copy;
 };
 clone.traverse(node=>{
  if(!node.isMesh)return;
  if(shareGeometry){node.userData.bundledSharedGeometry=true;}else{node.geometry=node.geometry?.clone();}
  node.material=Array.isArray(node.material)?node.material.map(copyMaterial):copyMaterial(node.material);
  node.castShadow=true;node.receiveShadow=true;
 });
 if(instance.catalogId==='pine'&&pineGrowth)reshapeNativePine(T,clone,pineGrowth);
 if(instance.catalogId==='spruce'&&spruceGrowth)reshapeNativeSpruce(T,clone,spruceGrowth);
 const group=new T.Group();
 clone.scale.set(fit.scaleXZ,fit.scaleY,fit.scaleXZ);
 clone.position.set(-centre.x*fit.scaleXZ,-bounds.min.y*fit.scaleY,-centre.z*fit.scaleXZ);
 group.add(clone);
 // The CC0 adult Scots pine has authentic bark and PBR needle cutouts, but
 // only three very thin foliage tiers. Reuse the same original needle meshes
 // with rotated offsets around the trunk: natural crown volume without
 // textures downloaded twice or fake metre-wide flat green billboards.
 // Never replicate branches or the trunk, which should remain botanically
 // continuous; only alpha-masked foliage geometry is shared.
 if(instance.catalogId==='pine'&&!pineGrowth&&Number.isFinite(canopyCopies)&&canopyCopies>0){
  group.updateMatrixWorld(true);
  const foliage=[];
  clone.traverse(node=>{
   if(!node.isMesh)return;
   const materials=Array.isArray(node.material)?node.material:[node.material];
   if(materials.some(m=>m&&(m.alphaTest>0||m.transparent)))foliage.push(node);
  });
  const angles=[Math.PI*.27,-Math.PI*.42,Math.PI*.71];
  for(let i=0;i<Math.min(angles.length,Math.max(0,Math.floor(canopyCopies)));i++){
   const turn=new T.Group();
   turn.name='pine-needle-density-'+(i+1);
   turn.rotation.y=angles[i];
   // The source Scots pine concentrates foliage at three discrete heights.
   // Stagger secondary needles between those branch tiers while keeping
   // the root and natural leader at their measured location.
   const verticalOffsets=[-.045,-.095,-.065];
   const crownWidths=[.94,.87,.91];
   turn.position.y=fit.physicalHeight*verticalOffsets[i];
   turn.scale.set(crownWidths[i],1,crownWidths[i]);
   for(const mesh of foliage){
    // Copy relative transform including the native glTF node hierarchy.
    const copy=mesh.clone(false);
    copy.matrix.copy(mesh.matrixWorld);
    copy.matrix.decompose(copy.position,copy.quaternion,copy.scale);
    copy.geometry=mesh.geometry;
    copy.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material?.clone();
    copy.userData={...copy.userData,bundledSharedGeometry:true,pineNeedleReplica:true};
    copy.castShadow=i===0;copy.receiveShadow=true;
    turn.add(copy);
   }
   group.add(turn);
  }
  group.userData.pineCanopyCopies=Math.min(angles.length,Math.floor(canopyCopies));
 }
 group.userData.species=instance.catalogId;
 group.userData.realGlb=true;
 group.userData.bundledModel=shareGeometry;
 group.userData.uniquePbrMaterials=materialCache.size;
 group.userData.physicalHeight=fit.physicalHeight;
 group.userData.crownDiameter=fit.crownDiameter;
 return group;
}

/* Furniture and groundcover must NOT be independently stretched vertically.
 * A single metric scale preserves the designer's authored proportions.
 * Source buffers are shared; each instance gets its own material and shadows.
 */
export function makeRealProp(T,source,{width=2.5}={}){
 if(!source?.isObject3D)throw Error('A valid glTF scene is required.');
 let bounds=boundsCache.get(source);
 if(!bounds){bounds=new T.Box3().setFromObject(source);if(bounds.isEmpty())throw Error('GLB has no geometry.');boundsCache.set(source,bounds.clone())}
 const size=new T.Vector3(),center=new T.Vector3();bounds.getSize(size);bounds.getCenter(center);
 const breadth=Math.max(size.x,size.z);
 if(!Number.isFinite(breadth)||breadth<.00001||size.y<.00001)throw Error('Non-measurable GLB.');
 const uniform=Math.max(.01,Math.min(100,Number(width)||2.5))/breadth;
 const clone=source.clone(true);
 clone.traverse(node=>{
  if(!node.isMesh)return;
  node.userData.bundledSharedGeometry=true;
  node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material?.clone();
  node.castShadow=true;node.receiveShadow=true;
  for(const material of Array.isArray(node.material)?node.material:[node.material]){
   if(!material)continue;
   prepareRealMaterial(material);
  }
 });
 clone.scale.setScalar(uniform);
 clone.position.set(-center.x*uniform,-bounds.min.y*uniform,-center.z*uniform);
 const group=new T.Group();group.add(clone);
 group.userData.realGlb=true;group.userData.bundledModel=true;
 group.userData.physicalHeight=size.y*uniform;
 group.userData.physicalWidth=breadth*uniform;
 return group;
}
