/* Apply the exact icon component used by the 2D and 3D landscape editors
 * to the permanent site navigation. Purely presentational: keep buttons,
 * navigation events, labels and tabindexes unchanged. */
import {premiumIcon} from './forma-premium-icons.js';

export function decoratePremiumNavigation(root=document){
 let count=0;
 const selector='.rail-nav button[data-nav],.mobile-nav button[data-nav]';
 for(const button of root.querySelectorAll(selector)){
  if(button.querySelector('.fa-nav-premium'))continue;
  const original=button.querySelector('svg.ico');
  if(!original)continue;
  const tile=document.createElement('span');
  tile.className='fa-nav-premium';
  tile.setAttribute('aria-hidden','true');
  tile.innerHTML=premiumIcon(button.dataset.nav);
  original.replaceWith(tile);
  count++;
 }
 return count;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>decoratePremiumNavigation(),{once:true});
else decoratePremiumNavigation();
