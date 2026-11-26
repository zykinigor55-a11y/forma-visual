/* FORMA PBR ENGINE R63 — shared, conservative WebGL material calibration.
 * Retains authored geometry, maps, alpha masks, and existing weather effects.
 * Indirect illumination is IBL + sky/ground bounce approximation, not ray tracing.
 */
const applied=new WeakSet();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function leafTransmission(T,m,amount){
 if(applied.has(m))return;applied.add(m);
 const chunk=T.ShaderChunk?.lights_fragment_begin;
 // Inject into the actual Three.js directional-light loop after its shadow
 // attenuation. Never use an unshadowed emissive leaf as a substitute.
 const marker=chunk?.match(/#if\s*\(\s*NUM_DIR_LIGHTS\s*>\s*0\s*\)[^\n]*/);
 if(!marker)return;
 const at=marker.index+marker[0].length,tail=chunk.slice(at),call=tail.match(/RE_Direct\s*\([^;]*\);/);
 if(!call||!call[0].includes('directLight')||!call[0].includes('geometryNormal'))return;
 const i=at+call.index+call[0].length;
 const addition=`
   // FORMA thin diffuse transmission, energy-limited and shadow-aware.
   reflectedLight.directDiffuse += diffuseColor.rgb * vec3(0.94,1.0,0.71) * directLight.color * (pow(max(0.0,-dot(geometryNormal,directLight.direction)),0.80) * ${amount.toFixed(3)} * 0.318309886);
 `;
 const patched=chunk.slice(0,i)+addition+chunk.slice(i);
 const prior=m.onBeforeCompile,previousKey=m.customProgramCacheKey?.()||'';
 m.onBeforeCompile=function(shader,renderer){prior?.call(this,shader,renderer);
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  if(!gl_FrontFacing){float luma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(luma),.14)*vec3(1.12,1.13,1.08);}
 `).replace('#include <lights_fragment_begin>',patched);};
 m.customProgramCacheKey=()=>previousKey+'|forma-pbr-r67-'+amount.toFixed(3);
 m.needsUpdate=true;m.userData.formaThinTransmissionR63=amount;
}
function roleOf(mesh,m,kind){
 const tag=[mesh.name,m.name,mesh.userData?.architecturePart,m.map?.name].filter(Boolean).join(' ').toLowerCase();
 if(mesh.userData?.selectionProxy||mesh.userData?.formaWeatherPreview)return 'skip';
 if(mesh.userData?.formaWater||/\bwater\b|\bpond\b|вода/.test(tag))return 'water';
 if(/glass|glaz|ig-unit-.*pane|стекл/.test(tag)||(kind==='architecture'&&m.isMeshPhysicalMaterial&&m.transparent&&m.roughness<.22))return 'glass';
 const plant=kind==='trees'||kind==='shrubs'||kind==='plants'||/leaf|leav|folia|needle|bark|twig|trunk|turf-detail/.test(tag);
 if(plant){
  if(/bark|trunk|fissur|\bwood\b|\btwigs?\b|ствол|кор[аы]/.test(tag)&&!/leaf|leav|folia|needle/.test(tag))return 'bark';
  if(/needle|conifer|хво/.test(tag))return 'needle';
  if(/leaf|leav|folia|canop|turf-detail|лист/.test(tag)||m.alphaTest>0||(!m.map&&m.color&&m.color.g>m.color.r*1.12&&m.color.g>m.color.b*1.12))return kind==='needle'?'needle':'leaf';
  return 'plant-other';
 }
 if(mesh.userData?.ground)return 'ground';
 if(/metal|steel|aluminium|aluminum|сталь|металл/.test(tag)||m.metalness>.65)return 'metal';
 if(kind==='boulders'||/stone|rock|brick|concrete|камень|кирпич|бетон/.test(tag))return 'mineral';
 return 'surface';
}
export function calibrateScenePBR(T,root,{classify=()=>'',enabled=true}={}){
 const stats={revision:'R67',enabled,materials:0,roles:{},leafTransmission:0};
 if(!enabled||!root)return stats;const seen=new Set();
 const visit=(node,kind)=>{
  kind=classify(node)||kind;
  if(node.isMesh&&!node.userData?.selectionProxy&&!node.userData?.formaWeatherPreview){
   for(const m of Array.isArray(node.material)?node.material:[node.material]){
    if(!m?.isMeshStandardMaterial||seen.has(m))continue;seen.add(m);
    const role=roleOf(node,m,kind);if(role==='skip')continue;
    stats.materials++;stats.roles[role]=(stats.roles[role]||0)+1;
    m.userData=m.userData||{};m.userData.formaPBRRoleR63=role;
    // Never replace albedo, normal, UVs, maps or authored alpha.
    if(role==='leaf'||role==='needle'){
     m.metalness=0;m.roughness=clamp(m.roughness,role==='needle'?.58:.48,role==='needle'?.78:.73);
     m.envMapIntensity=clamp(m.envMapIntensity??1,.30,.68);
     if(m.alphaTest>0){m.side=T.DoubleSide;m.depthWrite=true;node.castShadow=true;node.receiveShadow=true;}
     if(m.emissiveIntensity>0&&m.emissive&&m.emissive.getHex()!==0)m.emissiveIntensity=Math.min(m.emissiveIntensity,.025);
     leafTransmission(T,m,role==='needle'?.20:.54);
     if(m.userData.formaThinTransmissionR63)stats.leafTransmission++;
    }else if(role==='bark'){
     m.metalness=0;m.roughness=clamp(m.roughness,.78,1);m.envMapIntensity=clamp(m.envMapIntensity??1,.15,.48);
    }else if(role==='water'){
     m.metalness=0;m.roughness=clamp(m.roughness,.045,.24);
     if(m.isMeshPhysicalMaterial){m.ior=1.333;m.clearcoat=0;}
     m.envMapIntensity=clamp(m.envMapIntensity??1,.8,1.35);
    }else if(role==='glass'){
     m.metalness=0;m.roughness=clamp(m.roughness,.035,.24);
     if(m.isMeshPhysicalMaterial)m.ior=1.50;
     // Retain authored transparency and night-light state, especially stacked panes.
     m.envMapIntensity=clamp(m.envMapIntensity??1,.75,1.4);
    }else if(role==='ground'||role==='mineral'){
     m.metalness=0;m.roughness=clamp(m.roughness,.65,1);
    }
    m.needsUpdate=true;
   }
  }
  for(const child of node.children||[])visit(child,kind);
 };
 visit(root,'');return stats;
}
export function balanceOutdoorPBR(T,{scene,sun,sky,bounce,weather,time,modelling=false,enabled=true}){
 if(!enabled||!scene||modelling)return;
 const day=['day','morning','evening'].includes(time);
 if(day){
  const overcast=['overcast','rain','fog','snow'].includes(weather);
  // The editor's dynamic sky panorama is filtered by Three.js for IBL.
  // Avoid double-counting diffuse sky light and avoid flat, lifted shadows.
  scene.environmentIntensity*=overcast?1.14:1.22;
  if(sky){sky.intensity*=overcast?.93:.83;sky.groundColor.set(time==='evening'?'#625544':'#53564a');}
  if(bounce){bounce.intensity*=.82;bounce.color.set(time==='evening'?'#dfc49e':'#bfc6af');bounce.position.set(20,12,-26);}
 }else{scene.environmentIntensity*=1.08;}
}
