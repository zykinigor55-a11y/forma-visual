/* PLUX V31 · preserve all six V30 Tools buttons and actual handlers.
 * The video generator added a separate launch card outside the original grid.
 * Reconnect it to the original "Создать видео" tile rather than showing a 7th card.
 */
(()=>{
 'use strict';
 if(window.PLUXToolsV31)return;
 const grid=document.querySelector('#screen-modes .mode-grid');
 if(!grid)return;
 const cards=[...grid.querySelectorAll('button.mode-card')];
 const video=cards.find(b=>
   (b.dataset.action||b.dataset.go)==='video'||
   b.textContent.includes('Создать видео'));
 const launch=document.querySelector('#screen-modes .plux16-open');
 if(video&&launch){
   video.addEventListener('click',event=>{
     event.preventDefault();event.stopImmediatePropagation();
     launch.click();
   },true);
   // Keep it in the DOM because it owns the real generation dialog,
   // but do not duplicate the 6-card Tools panel visible in V30.
   launch.hidden=true;
   launch.style.setProperty('display','none','important');
 }
 window.PLUXToolsV31={cards:cards.length,videoLinked:!!(video&&launch)};
})();