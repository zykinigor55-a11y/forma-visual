/* PLUX V31: one V30 theme selector, one exact pigment tint for all character states.
 * Does not create a second color picker; the original top-right V30 button controls
 * the character videos, their posters, six Tools cards, and app accent together.
 * No camera/photo content is recolored.
 */
(()=>{
 "use strict";
 if(window.PLUXColorsV31)return;
 const COLORS={
   emerald:[0.02,.80,.39],azure:[.055,.23,.98],ruby:[.98,.035,.075],
   solar:[1,.73,.01],turquoise:[.02,.83,.85],violet:[.52,.15,.87],
   rose:[.97,.30,.60],silver:[.77,.84,.88]
 };
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('aria-hidden','true');
 svg.style.cssText='position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
 const defs=document.createElementNS(ns,'defs');
 for(const [id,color] of Object.entries(COLORS)){
   const filter=document.createElementNS(ns,'filter');
   filter.id='plux31-pigment-'+id;
   filter.setAttribute('x','-5%');filter.setAttribute('y','-5%');
   filter.setAttribute('width','110%');filter.setAttribute('height','110%');
   filter.setAttribute('color-interpolation-filters','sRGB');
   const monochrome=document.createElementNS(ns,'feColorMatrix');
   monochrome.setAttribute('type','saturate');
   monochrome.setAttribute('values','0');
   monochrome.setAttribute('in','SourceGraphic');
   monochrome.setAttribute('result','luma');filter.append(monochrome);
   const transfer=document.createElementNS(ns,'feComponentTransfer');
   transfer.setAttribute('in','luma');
   for(let i=0;i<3;i++){
     const fn=document.createElementNS(ns,['feFuncR','feFuncG','feFuncB'][i]);
     fn.setAttribute('type','table');
     // Four points map dark green pixels into the chosen true pigment,
     // while retaining black shadows and neutral near-white reflections.
     fn.setAttribute('tableValues','0 '+(color[i]*.54).toFixed(3)+' '+color[i]+' 1');
     transfer.append(fn);
   }
   const alpha=document.createElementNS(ns,'feFuncA');
   alpha.setAttribute('type','identity');transfer.append(alpha);
   filter.append(transfer);defs.append(filter);
 }
 svg.append(defs);
 (document.body||document.documentElement).append(svg);
 const selector=[
   '#home-mascot img','#home-mascot video','#home-mascot-image',
   '#home-state-video','#voice-image','#state-video',
   '#screen-voice .voice-image-layer img','#screen-voice .voice-image-layer video',
   '#screen-onboard video','#plux127-intro video',
   '#screen-home .scene-home .mascot-hit img',
   '#screen-home .scene-home .mascot-hit video',
   'video[src*="/assets/videos-v106/"]',
   '#screen-chat .chat-mini','#screen-chat .chat-avatar'
 ].join(',');
 const valid=new Set(Object.keys(COLORS));
 let active='emerald';
 const local=()=>document.documentElement.dataset.pluxTheme||window.PLUXThemes?.get?.()||'emerald';
 let busy=false;
 function apply(){
   busy=false;
   const next=local();
   active=valid.has(next)?next:'emerald';
   const effect=active==='emerald'?'none':'url("#plux31-pigment-'+active+'")';
   document.querySelectorAll(selector).forEach(node=>{
     if(node.dataset.plux31Pigment===active)return;
     node.dataset.plux31Pigment=active;
     if(active==='emerald'){node.style.removeProperty('filter');node.style.removeProperty('-webkit-filter')}
     else{
       node.style.setProperty('filter',effect,'important');
       node.style.setProperty('-webkit-filter',effect,'important');
     }
   });
 }
 const schedule=()=>{if(!busy){busy=true;queueMicrotask(apply)}};
 window.addEventListener('plux:themechange',schedule);
 const observer=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'&&r.addedNodes.length))schedule();
 });
 if(document.body)observer.observe(document.body,{subtree:true,childList:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
 window.PLUXColorsV31={
   get:()=>active,
   choose:(id)=>{if(!valid.has(id)||!window.PLUXThemes?.set)return false;window.PLUXThemes.set(id);return true},
   all:()=>Object.keys(COLORS)
 };
})();