/* ФОРМА · Opening sequence with a calm moving shadow and delayed identity
   Runs once per browser tab session; user can replay from command search. */
(() => {
 'use strict';
 const SESSION_KEY='forma-opening-seen-v2';
 const root=document.documentElement;
 const get=(id)=>document.getElementById(id);
 const overlay=get('forma-intro');
 if(!overlay)return;
 const skip=get('formaIntroSkip');
 const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 // Optional still-open preview for capturing the two visual phases without the 5.2s automatic outro.
 const previewHold=new URLSearchParams(window.location.search).get('previewIntro')==='1';
 const timers=new Set();
 let active=false,closing=false,previousFocus=null;
 const scheduled=(fn,delay)=>{const timer=setTimeout(()=>{timers.delete(timer);fn()},delay);timers.add(timer)};
 function clearSchedule(){for(const id of timers)clearTimeout(id);timers.clear()}
 function markSeen(){try{sessionStorage.setItem(SESSION_KEY,'1')}catch{}}
 function lockWorkspace(locked){
  for(const el of [get('app'),document.querySelector('.mobile-header'),document.querySelector('.mobile-nav')]){
   if(!el)continue;
   if(locked){if(!el.hasAttribute('inert')){el.setAttribute('inert','');el.dataset.formaIntroInert='1'}}
   else if(el.dataset.formaIntroInert==='1'){el.removeAttribute('inert');delete el.dataset.formaIntroInert}
  }
 }
 function finish(immediate=false){
  if(!active)return;
  clearSchedule();markSeen();active=false;closing=true;
  overlay.classList.add('is-leaving');
  const clean=()=>{
   overlay.hidden=true;
   overlay.setAttribute('aria-hidden','true');
   overlay.classList.remove('is-leaving','is-revealed');
   root.classList.remove('forma-intro-pending');
   lockWorkspace(false);
   closing=false;
   if(document.activeElement===skip || overlay.contains(document.activeElement)){
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    else document.querySelector('.forma-hero-primary')?.focus({preventScroll:true});
   }
  };
  if(immediate)clean();else scheduled(clean,920);
 }
 function play(force=false){
  if(active||closing)return;
  const needsIntro=root.classList.contains('forma-intro-pending');
  if(!needsIntro&&!force){overlay.hidden=true;return}
  if(reduceMotion){markSeen();overlay.hidden=true;root.classList.remove('forma-intro-pending');lockWorkspace(false);return}
  if(force)root.classList.add('forma-intro-pending');
  previousFocus=document.activeElement;
  active=true;
  overlay.hidden=false;
  overlay.setAttribute('aria-hidden','false');
  overlay.classList.remove('is-leaving','is-revealed');
  lockWorkspace(true);
  // First the graphite wall and moving foliage; only after their gentle entrance do we reveal the logotype.
  scheduled(()=>{if(active)overlay.classList.add('is-revealed')},1250);
  if(!previewHold)scheduled(()=>finish(),5200);
 }
 function onKeydown(e){
  if(!active)return;
  if(e.key==='Escape'||e.key==='Enter'&&document.activeElement===skip){
   e.preventDefault();finish();
  }
  if(e.key==='Tab'){
   // Keep keyboard navigation in the cinematic dialog until it closes.
   e.preventDefault();skip?.focus({preventScroll:true});
  }
 }
 skip?.addEventListener('click',()=>finish());
 document.addEventListener('keydown',onKeydown);
 window.FORMA_INTRO={replay:()=>play(true),skip:()=>finish(),get active(){return active}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>play(),{once:true});else play();
})();
