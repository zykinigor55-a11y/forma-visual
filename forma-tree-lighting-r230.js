/* R230: shared foliage volume lighting; no topology changes, no extra draws.
 * Stock PBR foliage only. Existing material hooks and textures are preserved. */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const profiles={
 sakura:{depth:.36,contrast:.32,rim:.09},birch:{depth:.24,contrast:.24,rim:.06},
 pine:{depth:.38,contrast:.30,rim:.025},spruce:{depth:.39,contrast:.30,rim:.025},
 fir:{depth:.36,contrast:.28,rim:.025},willow:{depth:.29,contrast:.25,rim:.06},
 oak:{depth:.34,contrast:.30,rim:.05},maple:{depth:.30,contrast:.27,rim:.06},
 rowan:{depth:.28,contrast:.26,rim:.06},shrub:{depth:.23,contrast:.22,rim:.04},
 default:{depth:.27,contrast:.24,rim:.04}
};
export function treeLightingProfileR230(species=''){
 const id=String(species).toLowerCase();
 const k=Object.keys(profiles).find(k=>k!=='default'&&id.includes(k))||(/cedar|thuja|juniper/.test(id)?'pine':'default');
 return {...profiles[k]};
}
export function canopyFactorsR230(radius,facing,profile=profiles.default,weight=1){
 const t=clamp((radius-.35)/.68,0,1),outer=t*t*(3-2*t);
 const direct=1-profile.contrast*weight*(1-clamp(facing*.5+.5,0,1))*(1-.35*outer);
 return {outer,indirect:1-profile.depth*(1-outer),direct};
}
function isFoliage(node,mat){
 if(!mat?.isMeshStandardMaterial||node.isBatchedMesh||node.userData?.selectionProxy)return false;
 const name=(node.name+' '+mat.name+' '+(mat.map?.name||'')).toLowerCase();
 if(/bark|trunk|wood|branch|stem|snow|fruit|calyx|root|proxy/.test(name))return false;
 return /foliage|leaf|leaves|needle|blossom|crown|petal|canopy/.test(name)||mat.alphaTest>.05||!!mat.alphaMap;
}
export function installTreeLightingR230(T,group,{species='',height=3,diameter=3}={}){
 if(!group||group.userData.treeLightingR230)return 0;
 const p=treeLightingProfileR230(species),h=Math.max(.5,Number(height)||3),r=Math.max(.25,(Number(diameter)||3)/2);
 const center={value:new T.Vector3()},extent={value:new T.Vector3(r,h*.40,r)},sun={value:new T.Vector3(-.65,.65,.39).normalize()},params={value:new T.Vector3(p.depth,p.contrast,p.rim)},enabled={value:1},weight={value:1};
 const mats=new Map();let count=0;
 group.traverse(node=>{
  if(!node.isMesh||!node.material)return;
  const replace=original=>{
   if(!isFoliage(node,original))return original;
   if(mats.has(original))return mats.get(original);
   // Native and imported assets may share materials; a clone keeps per-tree uniforms isolated.
   const mat=original.clone(),prior=original.onBeforeCompile,key=original.customProgramCacheKey?.()||'';
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
     float ftIndirect=1.-formaTreeParams.x*(1.-ftOuter);
     float ftDirect=1.-formaTreeParams.y*formaTreeWeight*(1.-ftFacing)*(1.-.35*ftOuter);
     float ftEdge=formaTreeParams.z*ftOuter*formaTreeWeight*pow(1.-abs(dot(normalize(normal),normalize(vViewPosition))),2.);
     reflectedLight.indirectDiffuse*=mix(1.,ftIndirect,formaTreeEnabled);
     reflectedLight.directDiffuse*=mix(1.,ftDirect+ftEdge,formaTreeEnabled);
     reflectedLight.directSpecular*=mix(1.,ftDirect,formaTreeEnabled);
    `);
   };
   mat.customProgramCacheKey=()=>key+'|forma-tree-volume-r230';mat.needsUpdate=true;mats.set(original,mat);count++;return mat;
  };
  node.material=Array.isArray(node.material)?node.material.map(replace):replace(node.material);
 });
 if(count)group.userData.treeLightingR230={center,extent,sun,params,enabled,weight,profile:p,height:h,count};
 return count;
}
export function updateTreeLightingR230(T,group,sunDirection,{enabled=true,weight=1,depth=1,contrast=1,rim=1}={}){
 const u=group?.userData?.treeLightingR230;if(!u)return;
 group.getWorldPosition(u.center.value);u.center.value.y+=u.height*.60;
 u.sun.value.copy(sunDirection).normalize();u.enabled.value=enabled?1:0;u.weight.value=clamp(weight,0,1);
 u.params.value.set(clamp(u.profile.depth*depth,0,.55),clamp(u.profile.contrast*contrast,0,.55),clamp(u.profile.rim*rim,0,.16));
}
