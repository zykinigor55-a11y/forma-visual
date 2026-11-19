/* FORMA VISUAL — resilient self-contained premium icons on the MAIN site.
 * Existing buttons and all their listeners remain intact. Rendered pictograms
 * are same graphite/bronze SVG system as Landscape Project.
 */
import {premiumIcon} from './forma-premium-icons.js';
const NAV_IDS=Object.freeze({
 project:'project',environment:'build',materials:'materials',
 animation:'animation',variants:'gallery',parameters:'settings'
});
const TASK_ICONS=Object.freeze({
 render:'build',interior:'interior',materials:'materials',landscape:'trees',
 'landscape-project':'plan',atmosphere:'atmosphere',animation:'animation',
 plan:'plan',frames:'gallery'
});
const TOOLS=Object.freeze({brush:'brush',erase:'eraser',polygon:'polygon',wand:'wand'});
function safeIcon(id){
 try {
  const value=premiumIcon(id);
  return typeof value==='string'&&value.includes('<svg')&&value.includes('</svg>')?value:null;
 }catch(e){console.warn('FORMA premium icon fallback',id,e);return null}
}
function upgradeButton(button,id){
 if(!button||!id)return;
 const current=button.querySelector('svg.forma-premium-icon');
 if(current?.dataset.formaRev==='main-atelier-v2')return;
 const markup=safeIcon(id)?.replace('class="lp-3d-icon forma-premium-icon"',
  'class="lp-3d-icon forma-premium-icon" data-forma-rev="main-atelier-v2"');
 if(!markup)return; // preserve a working legacy icon if enhancement unavailable
 const legacy=current||button.querySelector('svg.ico');
 if(legacy)legacy.outerHTML=markup;
 else button.insertAdjacentHTML('afterbegin',markup);
}
export function applyPremiumSiteIcons(){
 // Rail includes buttons injected AFTER boot by Interior, Landscape,
 // Atmosphere and Scenarios. They have no data-nav attribute, so the old
 // selector silently left their thin placeholder icons unchanged.
 document.querySelectorAll('.rail-nav .rail-btn').forEach(button=>{
  const icon=button.dataset.nav?NAV_IDS[button.dataset.nav]:
   button.dataset.artOpen?TASK_ICONS[button.dataset.artOpen]:
   button.classList.contains('fa-interior-nav')?'interior':
   button.classList.contains('fa-flow-rail')?'nodes':
   button.classList.contains('fa-pro-nav-launch')?'settings':null;
  upgradeButton(button,icon);
 });
 document.querySelectorAll('.mobile-nav button').forEach(button=>{
  const icon=button.dataset.mobile?NAV_IDS[button.dataset.mobile]:
   button.classList.contains('fa-interior-mobile')?'interior':
   button.classList.contains('fa-flow-mobile')?'nodes':null;
  upgradeButton(button,icon);
 });
 document.querySelectorAll('.tool-btn[data-tool]').forEach(button=>
  upgradeButton(button,TOOLS[button.dataset.tool]));
 // Main screen tools are created asynchronously by forma-studio-shell.js.
 // Never rely on their being present at DOMContentLoaded.
 document.querySelectorAll('#formaStudioHome .fa-studio-task[data-studio-tool]').forEach(button=>
  upgradeButton(button,TASK_ICONS[button.dataset.studioTool]||button.dataset.studioTool));
 document.querySelectorAll('#formaStudioHome .fa-studio-utilities button[data-studio-tool]').forEach(button=>
  upgradeButton(button,button.dataset.studioTool));
 document.querySelectorAll('.fa-home-tool[data-tool-id]').forEach(button=>{
  const slot=button.querySelector('.fa-home-tool-icon');
  if(slot&&!slot.querySelector('svg.forma-premium-icon[data-forma-rev="main-atelier-v2"]')){
   const icon=safeIcon(button.dataset.toolId)?.replace('class="lp-3d-icon forma-premium-icon"',
    'class="lp-3d-icon forma-premium-icon" data-forma-rev="main-atelier-v2"');
   if(icon)slot.innerHTML=icon;
  }
 });
}
const relevant='.rail-nav,.mobile-nav,#formaStudioHome,.fa-home-tool,.tool-btn';
let scheduled=false;
function scheduleUpgrade(){
 if(scheduled)return;
 scheduled=true;
 queueMicrotask(()=>{scheduled=false;applyPremiumSiteIcons()});
}
function watchDynamicHome(){
 if(!document.body)return;
 // A new homepage task is injected after the intro. Recheck only relevant
 // DOM mutations, rather than polling every frame of the WebGL editor.
 const observer=new MutationObserver(changes=>{
  if(changes.some(change=>{
   const element=change.target?.nodeType===1?change.target:change.target?.parentElement;
   if(element?.closest?.(relevant)||element?.matches?.(relevant))return true;
   return [...change.addedNodes].some(node=>node.nodeType===1&&
    (node.matches?.(relevant)||node.querySelector?.(relevant)));
  }))scheduleUpgrade();
 });
 observer.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',()=>{applyPremiumSiteIcons();watchDynamicHome()},{once:true});
}else{applyPremiumSiteIcons();watchDynamicHome()}
document.addEventListener('forma:home-tools-ready',scheduleUpgrade);
document.addEventListener('forma:studio-home-ready',scheduleUpgrade);
