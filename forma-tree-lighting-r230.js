/* R230: shared foliage volume lighting; no topology changes, no extra draws.
 * Stock PBR foliage only. Existing material hooks and textures are preserved. */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const profiles={
 sakura:{depth:.58,contrast:.62,rim:.10},birch:{depth:.24,contrast:.24,rim:.06},
 pine:{depth:.38,contrast:.30,rim:.025},spruce:{depth:.39,contrast:.30,rim:.025},
 fir:{depth:.36,contrast:.28,rim:.025},willow:{depth:.29,contrast:.25,rim:.06},
 oak:{depth:.34,contrast:.30,rim:.05},maple:{depth:.30,contrast:.27,rim:.06},
 rowan:{depth:.28,contrast:.26,rim:.06},shrub:{depth:.23,contrast:.22,rim:.04},
 default:{depth:.34,contrast:.32,rim:.05}
};
export function treeLightingProfileR230(species=''){
 const id=String(species).toLowerCase();
 const k=Object.keys(profiles).find(k=>k!=='default'&&id.includes(k))||(/cedar|thuja|juniper/.test(id)?'pine':'default');
 return {...profiles[k]};
}
export function canopyFactorsR230(radius,facing,profile=profiles.default,weight=1){
 const t=clamp((radius-.35)/.68,0,1),outer=t*t*(3-2*t);
 const sunSide=clamp(facing*.5+.5,0,1);const direct=1+profile.contrast*weight*(sunSide-.50)*(1-.12*outer);
 return {outer,indirect:1-profile.depth*(1-outer)*(.72+.22*(1-sunSide*weight))-.18*weight*(1-sunSide)*(1-outer*.25),direct};
}
function isFoliage(node,mat){
 if(!mat?.isMeshStandardMaterial||node.isBatchedMesh||node.userData?.selectionProxy)return false;
 const name=(node.name+' '+mat.name+' '+(mat.map?.name||'')).toLowerCase();
 if(/bark|trunk|wood|branch|stem|snow|fruit|calyx|root|proxy/.test(name))return false;
 return ['leaf','needle'].includes(mat.userData?.formaPBRRoleR63)||/foliage|leaf|leaves|needle|blossom|crown|petal|canopy/.test(name)||mat.alphaTest>.05||!!mat.alphaMap;
}
export function installTreeLightingR230(T,group,{species='',height=3,diameter=3}={}){
 if(!group||group.userData.treeLightingR230)return 0;
 const p=treeLightingProfileR230(species),h=Math.max(.5,Number(height)||3),r=Math.max(.25,(Number(diameter)||3)/2);
 const center={value:new T.Vector3()},extent={value:new T.Vector3(r,h*.40,r)},sun={value:new T.Vector3(-.65,.65,.39).normalize()},params={value:new T.Vector3(p.depth,p.contrast,p.rim)},enabled={value:1},weight={value:1};
 const mats=new Map();let count=0;const crownBox=new T.Box3();group.updateWorldMatrix(true,true);
 group.traverse(node=>{
  if(!node.isMesh||!node.material)return;
  const candidates=Array.isArray(node.material)?node.material:[node.material];
  if(candidates.some(m=>isFoliage(node,m))){if(node.isInstancedMesh&&!node.boundingBox)node.computeBoundingBox();else if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();const b=node.isInstancedMesh?node.boundingBox:node.geometry.boundingBox;if(b&&!b.isEmpty())crownBox.union(b.clone().applyMatrix4(node.matrixWorld));}
  const replace=original=>{
   if(!isFoliage(node,original))return original;
   if(mats.has(original))return mats.get(original);
   // Native and imported assets may share materials; a clone keeps per-tree uniforms isolated.
   let mat;try{mat=original.clone();}catch(e){console.warn('FORMA R230: unsupported shared material',e);return original;}const prior=original.onBeforeCompile,key=original.customProgramCacheKey?.()||'';
   mat.onBeforeCompile=function(shader,renderer){
    prior?.call(this,shader,renderer);
    Object.assign(shader.uniforms,{formaTreeCenter:center,formaTreeExtent:extent,formaTreeSun:sun,formaTreeParams:params,formaTreeEnabled:enabled,formaTreeWeight:weight});
    shader.vertexShader='uniform vec3 formaTreeCenter,formaTreeExtent; varying vec3 vFormaTreeVolume;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
     vec4 formaTreeP=vec4(transformed,1.);
     #ifdef USE_INSTANCING
     formaTreeP=instanceMatrix*formaTreeP;
     #endif
     vFormaTreeVolume=((modelMatrix*formaTreeP).xyz-formaTreeCenter)/max(formaTreeExtent,vec3(.01));
    `);
    shader.fragmentShader='uniform vec3 formaTreeSun,formaTreeParams; uniform float formaTreeEnabled,formaTreeWeight; varying vec3 vFormaTreeVolume;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
     float ftRadius=length(vFormaTreeVolume);
     float ftOuter=smoothstep(.35,1.03,ftRadius);
     vec3 ftDir=vFormaTreeVolume/max(.15,ftRadius);
     float ftFacing=clamp(dot(ftDir,formaTreeSun)*.5+.5,0.,1.);
     float ftIndirect=1.-formaTreeParams.x*(1.-ftOuter)*(.72+.22*(1.-ftFacing*formaTreeWeight))-.18*formaTreeWeight*(1.-ftFacing)*(1.-ftOuter*.25);
     float ftDirect=1.+formaTreeParams.y*formaTreeWeight*(ftFacing-.50)*(1.-.12*ftOuter);
     float ftEdge=formaTreeParams.z*ftOuter*formaTreeWeight*ftFacing*pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),2.);
     reflectedLight.indirectDiffuse*=mix(1.,ftIndirect,formaTreeEnabled);
     reflectedLight.directDiffuse*=mix(1.,ftDirect+ftEdge,formaTreeEnabled);
     reflectedLight.directSpecular*=mix(1.,ftDirect,formaTreeEnabled);
     reflectedLight.indirectSpecular*=mix(1.,mix(1.,ftIndirect,.65),formaTreeEnabled);
    `);
   };
   mat.customProgramCacheKey=()=>key+'|forma-tree-volume-r235';mat.needsUpdate=true;mats.set(original,mat);count++;return mat;
  };
  node.material=Array.isArray(node.material)?node.material.map(replace):replace(node.material);
 });
 if(count){const localCenter=new T.Vector3(0,h*.60,0);if(!crownBox.isEmpty()){crownBox.getCenter(center.value);localCenter.copy(group.worldToLocal(center.value.clone()));crownBox.getSize(extent.value).multiplyScalar(.5);extent.value.x=Math.max(.25,extent.value.x);extent.value.y=Math.max(.25,extent.value.y);extent.value.z=Math.max(.25,extent.value.z);}group.userData.treeLightingR230={center,extent,sun,params,enabled,weight,profile:p,height:h,count,localCenter};}
 return count;
}
export function updateTreeLightingR230(T,group,sunDirection,{enabled=true,weight=1,depth=1,contrast=1,rim=1}={}){
 const u=group?.userData?.treeLightingR230;if(!u)return;
 u.center.value.copy(u.localCenter||new T.Vector3(0,u.height*.60,0));group.localToWorld(u.center.value);
 u.sun.value.copy(sunDirection).normalize();u.enabled.value=enabled?1:0;u.weight.value=clamp(weight,0,1);
 u.params.value.set(clamp(u.profile.depth*depth,0,.60),clamp(u.profile.contrast*contrast,0,.65),clamp(u.profile.rim*rim,0,.16));
}
