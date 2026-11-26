import {reshapeNativePine} from './forma-landscape-pine-native.js';
import {reshapeNativeSpruce} from './forma-landscape-spruce-native.js';
import {refineNativeBirch} from './forma-landscape-birch-native.js';
import {optimizeNativeLinden,enhanceLindenBark} from './forma-landscape-linden-pbr.js';
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
/** Make source glTF needle and leaf cards visible from below and sideways.
 * The color, albedo/normal textures, UVs and native PBR response are NEVER
 * replaced. Tevy masks previously discarded too much dark-green foliage
 * because the default 0.5 alpha cut hid the fine edges of 2K needles.
 * Only alpha-masked botanical meshes use this visibility adjustment.
 */
export function prepareRealFoliageMaterial(T,material,species){
 const m=prepareRealMaterial(material);
 // The licensed Betula pendula has its own tuned alpha/side PBR authoring.
 // The generic conifer visibility override turned its open leaf sprays into
 // a dark, solid cone. Restore its original glTF MASK cutoff and single-sided
 // leaf shading without touching spruce, pine or any other species.
 if(species==='birch')return m;
 if(!m||!['pine','spruce','aspen'].includes(species))return m;
 if(m.alphaTest>0){
  m.side=T.DoubleSide;
  // Birches need light between terminal leaves, not a solid green clump.
  // The spruce and pine fine-needle cutouts retain their audited thresholds.
  m.alphaTest=Math.min(m.alphaTest,species==='birch'?.44:species==='spruce'?.34:.36);
  m.depthWrite=true;
  m.needsUpdate=true;
 }
 return m;
}
// Restrained real-time material calibration for bundled broadleaf assets.
// Never modify user-imported geometry, UVs, alpha masks or original textures.
const visualBroadleaves=new Set(['ash','maple','oak','linden','rowan','aspen','apple','poplar']);
export function calibrateBroadleafMaterial(T,m,species){
 if(!m||!visualBroadleaves.has(species)||!m.isMeshStandardMaterial)return m;
 const name=String(m.name||'').toLowerCase(),color=m.color;
 const leaf=/leaf|leav|folia|canop|blat|лист/.test(name)||m.alphaTest>0||(color&&color.g>color.r*1.12&&color.g>color.b*1.12);
 const bark=!leaf&&(/bark|trunk|branch|wood|ствол|кор[аы]/.test(name)||(!m.map&&color&&color.r>color.g*1.12&&color.g>color.b*1.10));
 if(!leaf&&!bark)return m;
 if(leaf){
  m.roughness=Math.max(.72,m.roughness??.8);m.metalness=0;
  if(m.alphaTest>0){m.side=T.DoubleSide;m.depthWrite=true;m.alphaToCoverage=true;}
 }else{m.roughness=Math.max(.84,m.roughness??.9);m.metalness=0;}
 const prior=m.onBeforeCompile,priorKey=m.customProgramCacheKey.bind(m),microBark=bark&&!m.normalMap&&!m.bumpMap;
 m.onBeforeCompile=function(shader,renderer){
  prior?.call(this,shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFormaBotanicalWorld;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvFormaBotanicalWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vFormaBotanicalWorld;
   float formaBotHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float formaBotNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(formaBotHash(i),formaBotHash(i+vec3(1,0,0)),f.x),mix(formaBotHash(i+vec3(0,1,0)),formaBotHash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(formaBotHash(i+vec3(0,0,1)),formaBotHash(i+vec3(1,0,1)),f.x),mix(formaBotHash(i+vec3(0,1,1)),formaBotHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   `);
  if(leaf){
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float formaLeafTone=formaBotNoise(vFormaBotanicalWorld*2.8);
    float formaLeafLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(formaLeafLuma),.17)*mix(.79,.99,formaLeafTone);
   `);
   // A limited back-side diffuse lift, not physical subsurface scattering.
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    float formaLeafBack=gl_FrontFacing ? 0.0 : 1.0;
    reflectedLight.indirectDiffuse+=reflectedLight.indirectDiffuse*vec3(.10,.15,.07)*formaLeafBack;
   `);
  }else{
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float formaBarkGrain=formaBotNoise(vFormaBotanicalWorld*vec3(28.0,3.0,28.0));
    float formaBarkFine=formaBotNoise(vFormaBotanicalWorld*vec3(73.0,13.0,73.0));
    float formaBarkLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(formaBarkLuma),.19)*mix(.75,1.05,formaBarkGrain*.75+formaBarkFine*.25);
   `);
   if(microBark)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float formaBarkHeight=(formaBarkGrain*.75+formaBarkFine*.25)*.012;
    vec3 formaBarkDx=dFdx(-vViewPosition),formaBarkDy=dFdy(-vViewPosition);
    vec3 formaBarkR1=cross(formaBarkDy,normal),formaBarkR2=cross(normal,formaBarkDx);
    float formaBarkDet=dot(formaBarkDx,formaBarkR1);
    vec3 formaBarkGrad=sign(formaBarkDet)*(dFdx(formaBarkHeight)*formaBarkR1+dFdy(formaBarkHeight)*formaBarkR2);
    normal=normalize(max(abs(formaBarkDet),1e-8)*normal-formaBarkGrad);
   `);
  }
 };
 m.customProgramCacheKey=()=>priorKey()+'|forma-broadleaf-r19-'+(leaf?'leaf':microBark?'bark-micro':'bark');
 m.needsUpdate=true;return m;
}
const boundsCache=new WeakMap();
export function makeRealVegetation(T,source,instance,{shareGeometry=false,canopyCopies=0,pineGrowth=null,spruceGrowth=null,birchRefinement='original'}={}){
 if(!source?.isObject3D)throw Error('The GLB does not contain a valid 3D scene.');
 // Refine the *bundled* Betula pendula once, then reuse its original
 // three-mesh PBR geometry across all planted instances. Imported user GLBs
 // remain strictly untouched. Never replace the real birch with a proxy.
 // The original FORMA dogwood GLB contains 3 independently modelled crowns.
 // Select the actual subtree BEFORE fitting bounds; this is not a rotation of
 // the same model and preserves accurate dimensions for each landscape object.
 if(['fern','fern-02','fern-03','fern-04'].includes(instance.catalogId)&&shareGeometry){
  // The Poly Haven GLB contains FOUR genuinely different PBR mesh parts;
  // pick by catalogue key, not by the old 3-age variant spinner.
  // Bounds fitting below re-centers its original [0/1,0/1] source-space positions
  // without changing the user's plant x/y or nearby landscape objects.
  const meshNames={fern:'fern_02_a','fern-02':'fern_02_b','fern-03':'fern_02_c','fern-04':'fern_02_d'};
  const part=source.getObjectByName(meshNames[instance.catalogId]);
  if(!part||!part.isMesh)throw Error('Missing independent Fern 02 mesh: '+meshNames[instance.catalogId]);
  source=part;
 }else if(['dogwood','thuja-globe','lavender','boxwood','pennisetum'].includes(instance.catalogId)&&shareGeometry){
  const variants=instance.catalogId==='thuja-globe'
   ?['THUJA_DANICA_NATURAL','THUJA_DANICA_COMPACT','THUJA_DANICA_MATURE']
   :instance.catalogId==='lavender'
   ?['LAVENDER_NATURAL','LAVENDER_COMPACT','LAVENDER_MATURE']
   :instance.catalogId==='boxwood'
   ?['BOXWOOD_NATURAL','BOXWOOD_SPHERE','BOXWOOD_HEDGE']
   :instance.catalogId==='pennisetum'
   ?['PENNISETUM_NATURAL','PENNISETUM_COMPACT','PENNISETUM_MATURE']
   :['DOGWOOD_NATURAL','DOGWOOD_SPHERE','DOGWOOD_BOX'];
  const variant=Math.max(1,Math.min(3,Math.round(Number(instance.variant)||1)));
  const selected=source.getObjectByName(variants[variant-1]);
  if(selected)source=selected;
 }
 if(instance.catalogId==='birch'&&shareGeometry&&birchRefinement==='soft')source=refineNativeBirch(T,source);
 if(instance.catalogId==='linden'&&shareGeometry)source=optimizeNativeLinden(T,source);
 let bounds=boundsCache.get(source);
 if(!bounds){
  bounds=new T.Box3().setFromObject(source);
  if(bounds.isEmpty())throw Error('3D model has no measurable geometry.');
  boundsCache.set(source,bounds.clone());
 }
 const clone=source.clone(true);
 const size=new T.Vector3(),centre=new T.Vector3();bounds.getSize(size);bounds.getCenter(centre);
 if(!Number.isFinite(size.y)||size.y<1e-5||Math.max(size.x,size.z)<1e-5)throw Error('GLB has zero height or crown width.');
 let fit=vegetationFit({width:size.x,height:size.y,depth:size.z},instance);
 let placementBounds=bounds;
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
   copy=prepareRealFoliageMaterial(T,material.clone(),instance.catalogId);
   if(instance.catalogId==='linden'&&String(material.name||'').toLowerCase()==='bark')
    enhanceLindenBark(T,copy);
   if(shareGeometry)calibrateBroadleafMaterial(T,copy,instance.catalogId);
   materialCache.set(material,copy);
  }
  return copy;
 };
 clone.traverse(node=>{
  if(!node.isMesh)return;
  if(shareGeometry){node.userData.bundledSharedGeometry=true;}else{node.geometry=node.geometry?.clone();}
  node.material=Array.isArray(node.material)?node.material.map(copyMaterial):copyMaterial(node.material);
  node.castShadow=true;
  // The alpha needle cards still cast realistic tree shadows onto the ground.
  // Avoid dark, incorrect self-shadow from crossed paper-thin spruce/birch
  // foliage: both sides retain the ORIGINAL Tevy leaf color.
  const materials=Array.isArray(node.material)?node.material:[node.material];
  const masked=materials.some(m=>m&&m.alphaTest>0);
  node.receiveShadow=!(masked&&['pine','spruce','birch','aspen'].includes(instance.catalogId));
 });
 if(instance.catalogId==='pine'&&pineGrowth)reshapeNativePine(T,clone,pineGrowth);
 if(instance.catalogId==='spruce'&&spruceGrowth){
  const morph=reshapeNativeSpruce(T,clone,spruceGrowth);
  if(morph.changed){
   // Recompute final fitted bounding box: century-old lower branches become
   // broader, but the user's numeric crown diameter must remain EXACT.
   placementBounds=new T.Box3().setFromObject(clone);
   const sculptedSize=new T.Vector3();
   placementBounds.getSize(sculptedSize);
   placementBounds.getCenter(centre);
   fit=vegetationFit({width:sculptedSize.x,height:sculptedSize.y,depth:sculptedSize.z},instance);
  }
 }
 const group=new T.Group();
 clone.scale.set(fit.scaleXZ,fit.scaleY,fit.scaleXZ);
 // Three visible rotations of the original low-poly GLB preserve real dimensions
 // and materials while creating less repetitive planting groups.
 if(['spirea','barberry'].includes(instance.catalogId)){
  const variant=Math.max(1,Math.min(3,Math.round(Number(instance.variant)||1)));
  clone.rotation.y=[.12,1.47,2.80][variant-1];
 }
 clone.position.set(-centre.x*fit.scaleXZ,-placementBounds.min.y*fit.scaleY,-centre.z*fit.scaleXZ);
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
 if(instance.catalogId==='linden'&&shareGeometry)group.userData.lindenNativePbr=true;
 if(instance.catalogId==='birch'&&shareGeometry&&birchRefinement==='soft')group.userData.nativeBirchRefined=true;
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
