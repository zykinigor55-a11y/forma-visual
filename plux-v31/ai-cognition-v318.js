/* PLUX V31.8 — precision AI cognition emblem instead of oversized green wordmark. */
(()=>{
"use strict";
const root=document.querySelector("#screen-home .home-head");
if(!root||document.getElementById("plux318-cognition"))return;
/* Hide only brand art, NEVER hide profile/theme/action buttons. */
const nodes=[...root.querySelectorAll("img,svg,h1,h2,strong,span,div")];
for(const node of nodes){
 if(node.closest("button,[role=button],#plux-theme-trigger"))continue;
 const attr=((node.id||"")+" "+(node.className?.baseVal||node.className||"")+" "+(node.getAttribute("alt")||"")+" "+(node.getAttribute("src")||"")).toLowerCase();
 const exact=/^(plux|плюх)$/i.test((node.textContent||"").trim());
 const branded=/(^|\s|[-_])(brand|logo|wordmark)(\s|[-_]|$)/i.test(attr);
 if((exact||branded) && node.querySelectorAll("button").length===0){
  node.classList.add("plux318-retired-logo");
  /* On structural wrappers, avoid blanking sibling controls */
  if(node.children.length===0||node.tagName==="IMG"||node.tagName==="SVG"||node.tagName==="H1")node.style.setProperty("visibility","hidden","important");
 }
}
const center=document.createElement("div");
center.id="plux318-cognition";center.className="plux318-cognition";center.setAttribute("role","img");
center.setAttribute("aria-label","ПЛЮХ — работающий искусственный интеллект");
center.innerHTML='<span class="plux318-orbital" aria-hidden="true"><i class="plux318-orbit oa"></i><i class="plux318-orbit ob"></i><i class="plux318-orbit oc"></i><i class="plux318-heart"></i><i class="plux318-signal one"></i><i class="plux318-signal two"></i></span><span class="plux318-identity"><b>PLUX</b><small>INTELLIGENCE</small></span>';
root.append(center);
const observer=new MutationObserver(()=>{
 const active=!!document.querySelector('#screen-home [aria-busy="true"],#screen-home .thinking,#screen-home .is-thinking');
 center.classList.toggle("is-thinking",active);
});
observer.observe(document.getElementById("screen-home"),{attributes:true,childList:true,subtree:true,attributeFilter:["aria-busy","class"]});
window.addEventListener("plux:thinking",e=>center.classList.toggle("is-thinking",!!e.detail?.active));
window.PLUXCognitionV318={element:center};
})();