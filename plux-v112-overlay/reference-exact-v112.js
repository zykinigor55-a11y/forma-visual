/* PLUX 11.2: no extra wrappers. Native accessible touch targets preserved. */
(()=>{
 'use strict';
 const init=()=>{
   const home=document.getElementById('screen-home');
   if(!home)return;
   for(const extra of home.querySelectorAll('.cd109-optics,.cd109-energy,.cv108-liquid'))extra.remove();
   const labels=['Главная','Чат','Создать','Инструменты'];
   home.querySelectorAll('.bottom-nav>.nav-button').forEach((el,i)=>{
     if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',labels[i]);
   });
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
