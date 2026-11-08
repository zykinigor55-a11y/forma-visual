/** PLUX V10.8: the liquid light is a real DOM layer inside the existing mic buttons.
 * No videos replaced. Existing click and voice handlers are preserved. */
(()=>{
 'use strict';
 function enhance(){
  for(const id of ['open-voice-quick','voice-toggle']){
   const button=document.getElementById(id);
   if(!button||button.querySelector('.cv108-liquid'))continue;
   const liquid=document.createElement('span');
   liquid.className='cv108-liquid';
   liquid.setAttribute('aria-hidden','true');
   button.insertBefore(liquid,button.firstChild);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});
 else enhance();
})();
