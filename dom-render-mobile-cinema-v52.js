/* DOM.RENDER Mobile Cinema v52
 * Touch preview / illustrated preset cards / lifecycle. All behavior is
 * strictly gated to phone width. Desktop controls are unchanged.
 */
(function(){
 'use strict';
 const mq=window.matchMedia('(max-width:700px)');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const ATLAS='/assets/cinema/forma-cinema-atlas.webp?v=approved-v45';
 const byId=id=>document.getElementById(id);
 let artTest=null;
 let hasPlayedOnce=false;
 let initialized=false;
 function mobile(){return mq.matches}
 function setAtlasReady(){
  if(!mobile())return;
  if(artTest)return;
  const img=new Image();
  artTest=img;
  img.onload=()=>{document.documentElement.classList.add('mobile-cinema-atlas-ready')};
  img.onerror=()=>{document.documentElement.classList.remove('mobile-cinema-atlas-ready');artTest=null};
  img.src=ATLAS;
 }
 function play(){
  if(!mobile()||reduced.matches)return;
  const screen=byId('animPreviewScreen');
  const button=byId('animPlayPreview');
  const panel=byId('animationPanel');
  if(!screen||!button||!panel?.classList.contains('active'))return;
  button.click(); // Reuse the existing image-motion controller; no second animation engine.
 }
 function onNavigate(event){
  if(!mobile())return;
  const target=event.target.closest('[data-mobile="animation"],[data-tab="animation"],[data-nav="animation"]');
  if(!target)return;
  window.setTimeout(()=>{
   if(!mobile())return;
   const panel=byId('animationPanel');
   if(!panel?.classList.contains('active'))return;
   panel.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
   // The first visit plays a single 6s motion preview, demonstrating the
   // selected camera movement without creating a video or using an AI credit.
   if(!hasPlayedOnce&&!reduced.matches){
    hasPlayedOnce=true;
    window.setTimeout(()=>{
     if(mobile()&&panel.classList.contains('active'))play();
    },420);
   }
  },70);
 }
 function onPreviewTap(event){
  if(!mobile())return;
  if(event.target.closest('button,a,input,select,[role="button"]'))return;
  play();
 }
 function init(){
  if(!mobile()||initialized)return;
  initialized=true;
  setAtlasReady();
  const screen=byId('animPreviewScreen');
  screen?.addEventListener('click',onPreviewTap);
  // Visual feedback during the existing browser image-transform preview.
  if(screen){
   const update=()=>{
    if(!mobile())return;
    const playing=screen.classList.contains('cinema-playing');
    screen.setAttribute('aria-label',playing?'Воспроизводится пример движения камеры':'Коснитесь изображения, чтобы увидеть движение камеры');
    const button=byId('animPlayPreview');
    if(button)button.setAttribute('aria-label',playing?'Повторить движение камеры':'Воспроизвести движение камеры');
   };
   new MutationObserver(update).observe(screen,{attributes:true,attributeFilter:['class']});
   update();
  }
  document.addEventListener('click',onNavigate);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 mq.addEventListener?.('change',event=>{
  if(event.matches)init();
  else document.documentElement.classList.remove('mobile-cinema-atlas-ready');
 });
})();
