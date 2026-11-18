/* FORMA VISUAL — premium icon wiring on the main website.
 * Landscape Project is the art-direction source of truth.
 * Upgrade only icon slots. Never replace buttons, change IDs or event handlers.
 */
import {premiumIcon} from './forma-premium-icons.js';
const NAV_IDS={
 project:'project',environment:'build',materials:'materials',
 animation:'animation',variants:'gallery',parameters:'settings'
};
function upgradeToolbar(selector,attribute){
 document.querySelectorAll(selector).forEach(button=>{
  const key=NAV_IDS[button.getAttribute(attribute)];
  if(!key||button.querySelector('svg.forma-premium-icon'))return;
  const old=button.querySelector('svg.ico');
  if(old)old.outerHTML=premiumIcon(key);
 });
}
export function applyPremiumSiteIcons(){
 // Keep the same premium visual vocabulary in both navigation and the
 // interactive material-mask tools without changing their click handlers.
 const editorTools={brush:'brush',erase:'eraser',polygon:'polygon',wand:'wand'};
 document.querySelectorAll('.tool-btn[data-tool]').forEach(button=>{
  const key=editorTools[button.dataset.tool];
  if(!key||button.querySelector('svg.forma-premium-icon'))return;
  const old=button.querySelector('svg.ico');
  if(old)old.outerHTML=premiumIcon(key);
 });
 upgradeToolbar('.rail-nav [data-nav]','data-nav');
 upgradeToolbar('.mobile-nav [data-mobile]','data-mobile');
 document.querySelectorAll('.fa-home-tool[data-tool-id]').forEach(button=>{
  const slot=button.querySelector('.fa-home-tool-icon');
  if(slot&&!slot.querySelector('svg.forma-premium-icon')){
   slot.innerHTML=premiumIcon(button.dataset.toolId);
  }
 });
}
if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',applyPremiumSiteIcons,{once:true});
}else applyPremiumSiteIcons();
document.addEventListener('forma:home-tools-ready',applyPremiumSiteIcons);
