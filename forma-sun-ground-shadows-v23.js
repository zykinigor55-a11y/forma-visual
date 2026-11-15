/* FORMA / SUN STUDIO: schematic ground shadows.
 * A 2D directional indication, not physically accurate ray tracing.
 * Uses a generic adjustable-to-image architectural contact profile.
 * This layer is never sent as part of the input to the AI renderer.
 */
(()=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const VECTORS=Object.freeze({
  'back-left':{x:.65,y:1},back:{x:0,y:1},'back-right':{x:-.65,y:1},
  left:{x:1,y:.13},right:{x:-1,y:.13},
  'front-left':{x:.65,y:-1},front:{x:0,y:-1},'front-right':{x:-.65,y:-1}
 });
 const ALTITUDE=Object.freeze({low:350,medium:213,high:103});
 const CHARACTER=Object.freeze({
  soft:{opacity:.24,blur:14,edge:.14},
  natural:{opacity:.36,blur:6,edge:.23},
  defined:{opacity:.58,blur:1.8,edge:.32},
  cinematic:{opacity:.64,blur:3,edge:.35}
 });
 const BASES=Object.freeze([
  {a:{x:168,y:443},b:{x:418,y:459},factor:.80},
  {a:{x:528,y:458},b:{x:822,y:472},factor:1}
 ]);
 const byId=id=>document.getElementById(id);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const blend=(from,to,t)=>from+(to-from)*t;
 let raf=0,current=null,target=null,element=null;
 function geometry({direction='front-left',elevation='medium',shadow='natural'}={}){
  const vector=VECTORS[direction]||VECTORS['front-left'];
  const length=ALTITUDE[elevation]||ALTITUDE.medium;
  const mag=Math.hypot(vector.x,vector.y)||1;
  // Strong lateral displacement, perspective-shortened vertical displacement.
  const dx=vector.x/mag*length*1.22,dy=vector.y/mag*length*.77;
  const style=CHARACTER[shadow]||CHARACTER.natural;
  return {dx,dy,opacity:style.opacity,blur:style.blur,edge:style.edge};
 }
 function ensure(){
  const area=byId('formaSunStudioImageArea');
  if(!area)return null;
  let svg=byId('formaSunGroundShadowOverlay');
  if(svg&&svg.parentNode===area){element=svg;return svg}
  svg=document.createElementNS(NS,'svg');
  svg.id='formaSunGroundShadowOverlay';
  svg.setAttribute('class','forma-sun-ground-shadows');
  svg.setAttribute('viewBox','0 0 1000 600');
  svg.setAttribute('preserveAspectRatio','none');
  svg.setAttribute('aria-hidden','true');
  svg.innerHTML=
   '<defs><linearGradient id="formaSunCastFade" gradientUnits="userSpaceOnUse" x1="500" y1="455" x2="500" y2="600">'+
   '<stop offset="0%" stop-color="#071313" stop-opacity="1"/>'+
   '<stop offset="75%" stop-color="#071313" stop-opacity=".72"/>'+
   '<stop offset="100%" stop-color="#071313" stop-opacity=".15"/></linearGradient></defs>'+
   '<g id="formaSunShadowShapes">'+
   '<path id="formaSunShadowSoftA" class="forma-sun-shadow-soft"/>'+
   '<path id="formaSunShadowSoftB" class="forma-sun-shadow-soft"/>'+
   '<path id="formaSunShadowCoreA" class="forma-sun-shadow-core"/>'+
   '<path id="formaSunShadowCoreB" class="forma-sun-shadow-core"/>'+
   '<path id="formaSunShadowEdgeA" class="forma-sun-shadow-edge"/>'+
   '<path id="formaSunShadowEdgeB" class="forma-sun-shadow-edge"/>'+
   '<path id="formaSunShadowGroundContact" class="forma-sun-shadow-contact"/>'+
   '</g>';
  const next=area.querySelector('.forma-sunstudio-orbit');
  if(next)area.insertBefore(svg,next);else area.appendChild(svg);
  element=svg;return svg;
 }
 function pathFor(base,dx,dy,soft=false){
  const {a,b,factor}=base;
  const expand=soft?13:0;
  const ext=soft?1.04:1;
  const originA={x:a.x-expand,y:a.y-expand*.18};
  const originB={x:b.x+expand,y:b.y+expand*.18};
  // A tapered graphic shadow, consistent with the sun-to-ground projection.
  const tipA={x:a.x+dx*factor*ext-expand*.62,y:a.y+dy*factor*ext};
  const tipB={x:b.x+dx*factor*ext+expand*.62,y:b.y+dy*factor*ext};
  return 'M '+originA.x.toFixed(1)+' '+originA.y.toFixed(1)+
   ' L '+originB.x.toFixed(1)+' '+originB.y.toFixed(1)+
   ' L '+tipB.x.toFixed(1)+' '+tipB.y.toFixed(1)+
   ' L '+tipA.x.toFixed(1)+' '+tipA.y.toFixed(1)+' Z';
 }
 function edgeFor(base,dx,dy){
  const {a,b,factor}=base;
  return 'M '+a.x+' '+a.y+' L '+(a.x+dx*factor).toFixed(1)+' '+(a.y+dy*factor).toFixed(1)+
   ' M '+b.x+' '+b.y+' L '+(b.x+dx*factor).toFixed(1)+' '+(b.y+dy*factor).toFixed(1);
 }
 function draw(properties){
  const svg=ensure();if(!svg)return;
  const root=svg.querySelector('#formaSunShadowShapes');
  if(!root)return;
  const {dx,dy,opacity,blur,edge}=properties;
  root.style.opacity='1';
  for(let i=0;i<BASES.length;i++){
   const tag=i===0?'A':'B',base=BASES[i];
   const soft=svg.querySelector('#formaSunShadowSoft'+tag);
   const core=svg.querySelector('#formaSunShadowCore'+tag);
   const outline=svg.querySelector('#formaSunShadowEdge'+tag);
   soft.setAttribute('d',pathFor(base,dx,dy,true));
   soft.style.opacity=String(clamp(opacity*.84,.1,.9));
   soft.style.filter='blur('+blur.toFixed(2)+'px)';
   core.setAttribute('d',pathFor(base,dx,dy,false));
   core.style.opacity=String(clamp(opacity,.12,.9));
   outline.setAttribute('d',edgeFor(base,dx,dy));
   outline.style.opacity=String(edge);
  }
  svg.querySelector('#formaSunShadowGroundContact')
   .setAttribute('d','M '+BASES[0].a.x+' '+BASES[0].a.y+
    ' L '+BASES[0].b.x+' '+BASES[0].b.y+
    ' M '+BASES[1].a.x+' '+BASES[1].a.y+
    ' L '+BASES[1].b.x+' '+BASES[1].b.y);
  const gradient=svg.querySelector('#formaSunCastFade');
  const groundY=459;
  gradient.setAttribute('x1','500');gradient.setAttribute('y1',String(groundY));
  gradient.setAttribute('x2',String(500+dx));gradient.setAttribute('y2',String(groundY+dy));
 }
 function frame(){
  if(!target){raf=0;return}
  if(!current){current={...target};draw(current);raf=0;return}
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const factor=reduced?1:.19;
  let maxDelta=0;
  for(const key of ['dx','dy','opacity','blur','edge']){
   const diff=target[key]-current[key];maxDelta=Math.max(maxDelta,Math.abs(diff));
   current[key]=Math.abs(diff)<.06?target[key]:blend(current[key],target[key],factor);
  }
  draw(current);
  if(maxDelta>.06)raf=requestAnimationFrame(frame);else{current={...target};draw(current);raf=0}
 }
 function render(scene={}){
  const svg=ensure();if(!svg)return null;
  const container=byId('formaSunStudio');
  const interior=!!container?.classList.contains('is-interior');
  svg.style.display=interior?'none':'';
  const properties=geometry(scene);
  target=properties;
  if(!raf)raf=requestAnimationFrame(frame);
  const anchor={x:500,y:460};
  const end={x:clamp(anchor.x+properties.dx,30,970),y:clamp(anchor.y+properties.dy,30,580)};
  return {origin:anchor,marker:end,angleDegrees:Math.round(Math.atan2(properties.dy,properties.dx)*180/Math.PI)};
 }
 window.FORMA_SUN_GROUND_SHADOWS={render,compute:geometry};
})();
