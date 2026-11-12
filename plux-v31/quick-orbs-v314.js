/* PLUX V31.4 · exact glass-shell color sync for original three quick buttons.
   The original V30 crystal orb asset is filtered independently, so the V30
   silver microphone and white camera/keyboard glyphs never turn red/blue.
   No change to touch handlers, microdust placement or mascot source.
*/
(()=>{
 'use strict';
 if(window.PLUXOrbsV314)return;
 const keys=['open-chat-quick','open-voice-quick','open-create-quick'];
 const rgb={
   emerald:'27,210,147',azure:'35,99,251',ruby:'243,35,56',
   solar:'255,202,14',turquoise:'0,199,202',violet:'130,82,232',
   rose:'235,104,171',silver:'186,214,220'
 };
 let current='emerald';
 function mount(){
   for(const id of keys){
     const button=document.getElementById(id);
     if(!button)continue;
     let shell=button.querySelector('img.plux314-orb-art');
     if(!shell){
       shell=document.createElement('img');
       shell.className='plux314-orb-art';
       shell.alt='';
       shell.draggable=false;
       shell.setAttribute('aria-hidden','true');
       shell.src='/assets/crystal-orb-v124.svg';
       button.insertBefore(shell,button.firstChild);
     }
     button.classList.add('plux314-themed-orb');
     button.style.setProperty('background-image','none','important');
     button.style.setProperty('--plux314-orb-rgb',rgb[current]);
     // Reuse the SAME original pigment filter as the drop. Every pixel of
     // the emerald orb is remapped to actual chosen pigment, whites stay white.
     shell.style.setProperty('filter',current==='emerald'?'none':
       'url("#plux31-pigment-'+current+'")','important');
   }
 }
 function apply(theme){
   const next=Object.hasOwn(rgb,theme)?theme:'emerald';
   current=next;
   mount();
 }
 apply(document.documentElement.dataset.pluxTheme||'emerald');
 window.addEventListener('plux:themechange',event=>apply(event.detail?.theme));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(current),{once:true});
 const observer=new MutationObserver(records=>{
   // Only repair recreated V30 quick buttons; ignore ordinary DOM changes.
   if(records.some(r=>r.addedNodes.length)&&
     keys.some(id=>{const button=document.getElementById(id);return button&&!button.querySelector('img.plux314-orb-art')}))mount();
 });
 if(document.body)observer.observe(document.body,{subtree:true,childList:true});
 window.PLUXOrbsV314={get:()=>current,update:apply,ids:keys};
})();