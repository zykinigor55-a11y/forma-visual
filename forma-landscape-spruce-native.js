/* FORMA · deform the original glTF Norway spruce meshes for three life stages.
 * No new foliage or extra tree is spawned. Meshes keep their own source
 * roughness, PBR maps, KTX2 needles, cutout alpha and UV coordinates.
 */
import {spruceStage,normalizeSpruceGrowth} from './forma-landscape-spruce-growth.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/Math.max(1e-9,b-a),0,1);return t*t*(3-2*t)};
// A Norwegian spruce's lower horizontal branches end in hanging secondary
// twigs. Apply the same smooth drop to ALL supporting branch/needle vertices:
// moving cutout needles alone leaves floating green patches detached from wood.
export function spruceTipDrop({height=1,relativeY=0,relativeRadius=0,amount=0}={}){
 const t=clamp(Number(relativeY)||0,0,1);
 const radial=smooth(.12,.84,Number(relativeRadius)||0);
 return Math.max(0,Number(height)||0)*Math.max(0,Number(amount)||0)*
  Math.pow(1-t,.72)*smooth(.015,.24,t)*radial;
}
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
 const crownSize=new T.Vector3();bounds.getSize(crownSize);
 const crownRadius=Math.max(.001,Math.max(crownSize.x,crownSize.z)*.5);
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
   // Droop wood and foliage together at the same world-space branch tips,
   // leaving the leader, near-axis trunk and root flare in their original
   // positions. Keep all branches above terrain even for a young low spruce.
   const radial=Math.hypot(worldPoint.x-center.x,worldPoint.z-center.z)/crownRadius;
   const drop=spruceTipDrop({height,relativeY:t,relativeRadius:radial,amount:profile.lowerDrop});
   if(drop>0)worldPoint.y=Math.max(bounds.min.y+height*.005,worldPoint.y-drop);
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
