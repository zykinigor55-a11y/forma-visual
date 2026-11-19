/* FORMA | Silver birch (Betula pendula) crown refinement.
 * Turn the bundled, original CC0 GLB into a more pendulous native tree:
 * only the original vertices are moved. No billboards, new leaf meshes,
 * extra trunks, material recoloring or loss of UVs/PBR/alpha masks.
 * The adjusted source is cached once and its geometries are shared by all
 * planted birches. The loader's original source remains unmodified.
 */
const refinedSources=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/Math.max(1e-9,b-a),0,1);return t*t*(3-2*t)};

export function birchCrownDisplacement({height=1,radius=1,relativeY=0,relativeRadius=0,azimuth=0}={}){
 const h=Math.max(.001,Number(height)||1);
 const r=clamp(Number(relativeRadius)||0,0,1.5);
 const t=clamp(Number(relativeY)||0,0,1);
 // Preserve the white basal stem and top leader; droop starts on lateral
 // crown branches and increases gradually toward their terminal leaf sprays.
 const crown=smooth(.20,.44,t)*(1-smooth(.86,1,t));
 const lateral=smooth(.14,.72,r);
 const asymmetry=1+.085*Math.sin((Number(azimuth)||0)*2.7+t*8.2);
 return h*.052*crown*lateral*asymmetry;
}

/** Natural, bounded irregularity of a silver-birch crown.
 * Offset *native* leaf/branch vertices together, keeping both geometry and
 * KTX2 PBR leaf cutouts; no second sprite or crown volume is created.
 * The field vanishes at the stem, at the roots and at the central leader.
 */
export function birchCrownSpread({relativeY=0,relativeRadius=0,azimuth=0}={}){
 const t=clamp(Number(relativeY)||0,0,1);
 const r=clamp(Number(relativeRadius)||0,0,1.5);
 const crown=smooth(.22,.43,t)*(1-smooth(.90,1,t));
 const outer=smooth(.18,.70,r);
 const az=Number(azimuth)||0;
 const lobes=.64*Math.sin(3.07*az+5.8*t)+.36*Math.sin(5.79*az-7.3*t);
 return 1+.085*crown*outer*lobes;
}

export function refineNativeBirch(T,source){
 if(!source?.isObject3D)return source;
 const already=refinedSources.get(source);
 if(already)return already;
 const clone=source.clone(true);
 clone.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(clone);
 if(bounds.isEmpty()){refinedSources.set(source,clone);return clone}
 const size=new T.Vector3(),center=new T.Vector3();
 bounds.getSize(size);bounds.getCenter(center);
 const height=Math.max(.001,size.y);
 const worldPoint=new T.Vector3(),nativePoint=new T.Vector3();
 // An open-grown birch often has a lop-sided crown: its bounding-box centre
 // is NOT the trunk axis. Derive the real stem axis from basal mesh vertices
 // so the white trunk does not drift or bow when the crown is reshaped.
 let baseX=0,baseZ=0,baseCount=0;
 clone.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.getAttribute)return;
  const a=mesh.geometry.getAttribute('position');
  if(!a)return;
  mesh.updateWorldMatrix(true,false);
  for(let i=0;i<a.count;i++){
   worldPoint.set(a.getX(i),a.getY(i),a.getZ(i)).applyMatrix4(mesh.matrixWorld);
   if(worldPoint.y<=bounds.min.y+height*.14){
    baseX+=worldPoint.x;baseZ+=worldPoint.z;baseCount++;
   }
  }
 });
 const axisX=baseCount?baseX/baseCount:center.x;
 const axisZ=baseCount?baseZ/baseCount:center.z;
 const radius=Math.max(.001,Math.abs(bounds.max.x-axisX),Math.abs(bounds.min.x-axisX),
  Math.abs(bounds.max.z-axisZ),Math.abs(bounds.min.z-axisZ));
 let changed=0;
 clone.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.getAttribute)return;
  const current=mesh.geometry.getAttribute('position');
  if(!current||current.count<3)return;
  // The original GLB is also used by other scene consumers. Never edit it.
  const geometry=mesh.geometry.clone();
  const positions=geometry.getAttribute('position');
  mesh.updateWorldMatrix(true,false);
  const inverse=mesh.matrixWorld.clone().invert();
  for(let i=0;i<positions.count;i++){
   nativePoint.set(positions.getX(i),positions.getY(i),positions.getZ(i));
   worldPoint.copy(nativePoint).applyMatrix4(mesh.matrixWorld);
   const dx=worldPoint.x-axisX,dz=worldPoint.z-axisZ;
   const radial=Math.hypot(dx,dz),t=(worldPoint.y-bounds.min.y)/height;
   const azimuth=Math.atan2(dz,dx),relativeRadius=radial/radius;
   const drop=birchCrownDisplacement({
    height,radius,relativeY:t,relativeRadius,azimuth
   });
   const spread=birchCrownSpread({relativeY:t,relativeRadius,azimuth});
   if(drop<=0&&spread===1)continue;
   worldPoint.x=axisX+dx*spread;
   worldPoint.z=axisZ+dz*spread;
   worldPoint.y=Math.max(bounds.min.y+height*.005,worldPoint.y-drop);
   nativePoint.copy(worldPoint).applyMatrix4(inverse);
   positions.setXYZ(i,nativePoint.x,nativePoint.y,nativePoint.z);
  }
  positions.needsUpdate=true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  mesh.geometry=geometry;
  mesh.userData={...mesh.userData,birchNativeRefined:true,bundledSharedGeometry:true};
  changed++;
 });
 clone.userData={...clone.userData,birchNativeRefinement:{
  name:'Betula pendula · native hanging twigs',modifiedMeshes:changed
 }};
 refinedSources.set(source,clone);
 return clone;
}
