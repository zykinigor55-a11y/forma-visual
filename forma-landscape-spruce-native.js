/* FORMA · deform the original glTF Norway spruce meshes for three life stages.
 * No new foliage or extra tree is spawned. Meshes keep their own source
 * roughness, PBR maps, KTX2 needles, cutout alpha and UV coordinates.
 */
import {spruceStage,normalizeSpruceGrowth} from './forma-landscape-spruce-growth.js';
export function spruceNativeProfile(growth){
 const g=normalizeSpruceGrowth(growth),p=spruceStage(g.type);
 if(p.id==='young')return {stage:'young',lowerCrown:.91,upperCrown:.90,trunk:.91,lowerDrop:.02};
 if(p.id==='century')return {stage:'century',lowerCrown:1.24,upperCrown:1.02,trunk:1.14,lowerDrop:.04};
 return {stage:'ordinary',lowerCrown:1,upperCrown:1,trunk:1,lowerDrop:0};
}
export function reshapeNativeSpruce(T,root,growth){
 if(!root?.isObject3D)return {changed:0};
 const profile=spruceNativeProfile(growth);
 if(profile.stage==='ordinary'){root.userData.spruceNativeProfile={...profile,changed:0};return {changed:0}}
 root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(root);
 if(bounds.isEmpty())return {changed:0};
 const height=Math.max(.00001,bounds.max.y-bounds.min.y);
 const center=new T.Vector3();bounds.getCenter(center);
 const originalPoint=new T.Vector3(),worldPoint=new T.Vector3(),backPoint=new T.Vector3();
 let changed=0;
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const position=mesh.geometry?.getAttribute?.('position');
  if(!position||position.count<3)return;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const leaf=materials.some(m=>m&&(m.alphaTest>0||m.transparent));
  const trunk=materials.some(m=>/bark|trunk/i.test(m?.name||''))&&!leaf;
  const edited=mesh.geometry.clone(),attr=edited.getAttribute('position');
  // The new BufferGeometry belongs to this selected tree only. Nothing is
  // written to the cached glTF, so neighbouring ordinary spruces never change.
  mesh.updateWorldMatrix(true,false);
  const inv=mesh.matrixWorld.clone().invert();
  for(let i=0;i<attr.count;i++){
   originalPoint.set(attr.getX(i),attr.getY(i),attr.getZ(i));
   worldPoint.copy(originalPoint).applyMatrix4(mesh.matrixWorld);
   const t=Math.max(0,Math.min(1,(worldPoint.y-bounds.min.y)/height));
   const factor=trunk?profile.trunk*(1-.05*t):
    profile.lowerCrown+(profile.upperCrown-profile.lowerCrown)*Math.pow(t,1.15);
   worldPoint.x=center.x+(worldPoint.x-center.x)*factor;
   worldPoint.z=center.z+(worldPoint.z-center.z)*factor;
   if(leaf&&profile.lowerDrop>0)worldPoint.y-=height*profile.lowerDrop*(1-t)*(.2+.8*Math.sin(t*Math.PI));
   backPoint.copy(worldPoint).applyMatrix4(inv);
   attr.setXYZ(i,backPoint.x,backPoint.y,backPoint.z);
  }
  attr.needsUpdate=true;
  edited.computeBoundingBox();
  edited.computeBoundingSphere();
  mesh.geometry=edited;
  mesh.userData.bundledSharedGeometry=false;
  mesh.userData.spruceNativeSculpted=true;
  changed++;
 });
 root.userData.spruceNativeProfile={...profile,changed};
 return {changed};
}
