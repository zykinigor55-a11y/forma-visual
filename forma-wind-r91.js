/* R91: shared wind field for real-time plants and water. Static geometry and survey coordinates are untouched. */
const installed=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hook(T,m,u,leaf){
 const prior=m.onBeforeCompile,key=m.customProgramCacheKey?.()||'';
 m.onBeforeCompile=function(shader,renderer){
  prior?.call(this,shader,renderer);
  Object.assign(shader.uniforms,u);
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   uniform float formaWindTime,formaWindStrength,formaWindBase,formaWindHeight,formaWindX,formaWindZ;
  `).replace('#include <project_vertex>',`
   mat4 fwMatrix=modelMatrix;
   #ifdef USE_INSTANCING
    fwMatrix=modelMatrix*instanceMatrix;
   #endif
   vec3 fwP=(fwMatrix*vec4(transformed,1.0)).xyz;
   float fwH=clamp((fwP.y-formaWindBase)/max(.2,formaWindHeight),0.,1.15);
   float fwR=length(fwP.xz-vec2(formaWindX,formaWindZ));
   // Coherent branch motion, fading out near the central trunk. No whole-crown wobble.
   float fwFlex=smoothstep(max(.10,formaWindHeight*.035),max(.35,formaWindHeight*.17),fwR)*smoothstep(.08,.52,fwH);
   float fwGust=.78+.22*sin(formaWindTime*.29+fwP.x*.07+fwP.z*.06);
   float fwBend=fwFlex*min(formaWindHeight*.023,.31)*formaWindStrength*fwGust;
   float fwWave=sin(formaWindTime*.78+fwP.y*.15+fwP.x*.31+fwP.z*.27);
   vec3 fwDelta=vec3(fwBend*(.55+fwWave*.45),0.,fwBend*.30*sin(formaWindTime*.61+fwP.z*.33));
   ${leaf?'fwDelta+=vec3(sin(formaWindTime*3.4+fwP.x*2.1+fwP.z*1.9),sin(formaWindTime*4.1+fwP.y*2.2),cos(formaWindTime*3.1+fwP.z*2.1))*.019*formaWindStrength*max(fwFlex,smoothstep(.14,.65,fwH)*.45);':''}
   mat3 fwLinear=mat3(fwMatrix);
   transformed+=inverse(fwLinear)*fwDelta;
   #include <project_vertex>
  `);
 };
 m.customProgramCacheKey=()=>key+'|forma-wind-r91-'+Number(leaf);m.needsUpdate=true;
}
export function createWindSystem(T){
 let plants=[],depths=[],owners=new WeakMap(),time=0,last=0;
 function clear(){last=0;for(const m of depths)m.dispose();depths=[];plants=[];owners=new WeakMap();}
 function add(group,height){
  const u={formaWindTime:{value:time},formaWindStrength:{value:0},formaWindBase:{value:group.position.y},formaWindX:{value:group.position.x},formaWindZ:{value:group.position.z},formaWindHeight:{value:Math.max(.2,Number(height)||2)}};
  let count=0;const replacements=new Map();
  group.traverse(n=>{
   if(!n.isMesh||n.userData?.selectionProxy||n.userData?.formaWeatherPreview||/selection|ring|proxy|snow/i.test(n.name))return;
   const arr=Array.isArray(n.material)?n.material:[n.material];if(!arr.every(m=>m?.isMeshStandardMaterial))return;
   const mats=arr.map(m=>{
    if(replacements.has(m))return replacements.get(m);
    let p=m;if(owners.has(m)&&owners.get(m)!==group){p=m.clone();p.onBeforeCompile=m.onBeforeCompile;p.customProgramCacheKey=m.customProgramCacheKey;}
    // Store original hooks before adding wind, so shared materials are not patched twice.
    const old=installed.get(m);if(old){p.onBeforeCompile=old.compile;p.customProgramCacheKey=old.key;}
    const leaf=/leaf|leav|folia|needle|grass|canop|turf|crown|blat|лист/i.test(n.name+' '+m.name)||m.alphaTest>0||!!(m.color&&m.color.g>m.color.r*1.10&&m.color.g>m.color.b*1.10);
    installed.set(p,{compile:p.onBeforeCompile,key:p.customProgramCacheKey});hook(T,p,u,leaf);owners.set(p,group);replacements.set(m,p);return p;
   });
   n.material=Array.isArray(n.material)?mats:mats[0];count++;
   // Depth pass must use the same deformation for moving shadow silhouettes.
   if(!n.customDepthMaterial&&(mats.length===1||mats.every(m=>!m.alphaTest))){
    const m=mats[0],leaf=/leaf|leav|folia|needle|grass|canop|crown|blat|лист/i.test(n.name+' '+m.name)||m.alphaTest>0||!!(m.color&&m.color.g>m.color.r*1.10&&m.color.g>m.color.b*1.10);
    const d=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:m.map,alphaMap:m.alphaMap,alphaTest:m.alphaTest,side:m.side});
    hook(T,d,u,leaf);n.customDepthMaterial=d;depths.push(d);
   }
  });
  if(count)plants.push({group,u,count});
 }
 function tick(now,strength,active=true){if(!active)return false;const dt=last?Math.min(.075,Math.max(0,(now-last)*.001)):0;last=now;time+=dt;
  for(const {group,u} of plants){u.formaWindTime.value=time;u.formaWindStrength.value=clamp(strength,0,1.6);u.formaWindBase.value=group.position.y;u.formaWindX.value=group.position.x;u.formaWindZ.value=group.position.z;}
  return plants.length>0;
 }
 return {add,clear,tick,get count(){return plants.length;}};
}
export function windRipple(T,surfaces,texture,now,ripples,wind){
 if(!texture)return false;
 const a=clamp(Number(ripples)||0,0,100)/100,w=clamp(wind,0,1.6),t=now*.001;
 // Ripples move along two axes; the shoreline and actual water elevation stay fixed.
 if(a>0)texture.offset.set((t*(.017+.040*w))%1,(t*(.011+.023*w))%1);
 for(const n of surfaces){const m=n.material;if(!m)continue;m.bumpScale=a*(.075+.10*w);m.roughness=clamp(.075+a*.07+w*.045,.075,.24);if(m.isMeshPhysicalMaterial){m.clearcoatRoughness=clamp(.06+a*.08+w*.04,.06,.25);}}
 return surfaces.length>0;
}
