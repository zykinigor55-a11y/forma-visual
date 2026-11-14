/* FORMA / ARCHITECTURAL SIGNATURE · actual-load opening, no fake progress.
   Shows once per tab and dismisses as soon as the browser has loaded all critical page resources. */
(() => {
 'use strict';
 const SESSION_KEY='forma-opening-seen-v2';
 const root=document.documentElement;
 const overlay=document.getElementById('forma-intro');
 const skip=document.getElementById('formaIntroSkip');
 const status=document.getElementById('formaIntroProgressStatus');
 if(!overlay)return;
 const reduceMotion=matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const previewHold=new URLSearchParams(location.search).get('previewIntro')==='1';
 let active=false,closing=false,previousFocus=null,finishTimer=0;
 const text=value=>{if(status)status.textContent=value};
 function inertWorkspace(locked){
  for(const element of [document.getElementById('app'),document.querySelector('.mobile-header'),document.querySelector('.mobile-nav')]){
   if(!element)continue;
   if(locked){if(!element.hasAttribute('inert')){element.setAttribute('inert','');element.dataset.formaIntroInert='1'}}
   else if(element.dataset.formaIntroInert==='1'){element.removeAttribute('inert');delete element.dataset.formaIntroInert}
  }
 }
 function finish(immediate=false){
  if(!active||closing)return;
  active=false;closing=true;
  try{sessionStorage.setItem(SESSION_KEY,'1')}catch{}
  overlay.classList.add('is-leaving');
  if(immediate){overlay.style.transition='none'}
  const done=()=>{
   clearTimeout(finishTimer);finishTimer=0;
   overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
   overlay.classList.remove('is-leaving','is-revealed','is-ready');
   root.classList.remove('forma-intro-pending');
   inertWorkspace(false);closing=false;
   if(overlay.contains(document.activeElement)){
    if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
    else document.querySelector('.forma-hero-primary')?.focus({preventScroll:true})
   }
   overlay.style.removeProperty('transition');
  };
  if(immediate)done();else finishTimer=setTimeout(done,590);
 }
 function play(force=false){
  if(active||closing)return;
  const firstVisit=root.classList.contains('forma-intro-pending');
  if(!firstVisit&&!force){overlay.hidden=true;return}
  if(reduceMotion&&!force){
   try{sessionStorage.setItem(SESSION_KEY,'1')}catch{}
   overlay.hidden=true;root.classList.remove('forma-intro-pending');inertWorkspace(false);return
  }
  previousFocus=document.activeElement;active=true;
  overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
  overlay.classList.remove('is-leaving','is-ready','is-revealed');
  root.classList.add('forma-intro-pending');inertWorkspace(true);
  text('Открываем рабочую студию');
  // Two animation frames ensure the FA identity is painted, not hidden behind a waiting timer.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(active)overlay.classList.add('is-revealed')}));
  if(force){
   // Replay is an optional visual presentation, never a mandatory wait on normal visits.
   if(!previewHold)setTimeout(()=>{if(active)finish()},1750);
   return;
  }
  if(previewHold)return;
  const started=performance.now();
  const maybeClose=()=>{
   if(!active)return;
   // Short optical buffer prevents a one-frame flash on fast loads; no 5s hold.
   const buffer=Math.max(0,420-(performance.now()-started));
   setTimeout(()=>{if(active){text('Рабочая студия готова');overlay.classList.add('is-ready');finish()}},buffer);
  };
  if(document.readyState==='complete')maybeClose();
  else window.addEventListener('load',maybeClose,{once:true});
 }
 skip?.addEventListener('click',()=>finish(true));
 document.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'||(event.key==='Enter'&&document.activeElement===skip)){event.preventDefault();finish(true)}
  else if(event.key==='Tab'){event.preventDefault();skip?.focus({preventScroll:true})}
 });
 window.FORMA_INTRO={replay:()=>play(true),skip:()=>finish(true),get active(){return active}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>play(),{once:true});
 else play();
})();