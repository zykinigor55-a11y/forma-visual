/* FORMA / SIGNATURE V5
   Explicit wall -> FA -> title -> descriptor sequence. No logo is visible
   until its dedicated timer fires, even when CSS and images are cached. */
(() => {
 'use strict';
 const SESSION_KEY='forma-opening-seen-v5';
 const STAGES={fa:1800,name:3380,descriptor:3830,minimum:5000};
 const root=document.documentElement;
 const overlay=document.getElementById('forma-intro');
 const skip=document.getElementById('formaIntroSkip');
 const status=document.getElementById('formaIntroProgressStatus');
 if(!overlay)return;
 const reduceMotion=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const previewHold=new URLSearchParams(location.search).get('previewIntro')==='1';
 const timers=new Set();
 let active=false,closing=false,previousFocus=null,startedAt=0,runId=0,loadReady=document.readyState==='complete';
 const label=value=>{if(status)status.textContent=value};
 function schedule(fn,delay){
  const id=runId;
  const timer=setTimeout(()=>{timers.delete(timer);if(active&&!closing&&runId===id)fn()},delay);
  timers.add(timer);
 }
 function cancelSchedules(){for(const t of timers)clearTimeout(t);timers.clear()}
 function inertWorkspace(locked){
  for(const element of [document.getElementById('app'),document.querySelector('.mobile-header'),document.querySelector('.mobile-nav')]){
   if(!element)continue;
   if(locked){
    if(!element.hasAttribute('inert')){element.setAttribute('inert','');element.dataset.formaIntroInert='1'}
   }else if(element.dataset.formaIntroInert==='1'){
    element.removeAttribute('inert');delete element.dataset.formaIntroInert
   }
  }
 }
 function finish(immediate=false){
  if(!active||closing)return;
  active=false;closing=true;cancelSchedules();
  try{sessionStorage.setItem(SESSION_KEY,'1')}catch{}
  overlay.classList.add('is-leaving');
  if(immediate)overlay.style.transition='none';
  const done=()=>{
   overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
   overlay.classList.remove('is-leaving','is-ready','is-revealed','is-fa-visible','is-name-visible','is-descriptor-visible');
   root.classList.remove('forma-intro-pending');inertWorkspace(false);closing=false;
   overlay.style.removeProperty('transition');
   if(overlay.contains(document.activeElement)){
    if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
    else document.querySelector('.forma-hero-primary')?.focus({preventScroll:true});
   }
  };
  if(immediate)done();
  else setTimeout(done,590);
 }
 function scheduleExit(){
  if(!active||previewHold||!loadReady)return;
  const remain=Math.max(0,STAGES.minimum-(performance.now()-startedAt));
  // A loaded page may be available early, but logo introduction must finish first.
  schedule(()=>{label('Рабочая студия готова');overlay.classList.add('is-ready');finish()},remain);
 }
 function play(force=false){
  if(active||closing)return;
  if(!root.classList.contains('forma-intro-pending')&&!force&&!previewHold){overlay.hidden=true;return}
  if(reduceMotion&&!force&&!previewHold){
   try{sessionStorage.setItem(SESSION_KEY,'1')}catch{}
   overlay.hidden=true;root.classList.remove('forma-intro-pending');inertWorkspace(false);return
  }
  runId++;cancelSchedules();previousFocus=document.activeElement;
  active=true;startedAt=performance.now();
  // Reset BEFORE making the overlay visible to prevent a stale replay frame.
  overlay.classList.remove('is-leaving','is-ready','is-revealed','is-fa-visible','is-name-visible','is-descriptor-visible');
  overlay.hidden=false;overlay.setAttribute('aria-hidden','false');
  root.classList.add('forma-intro-pending');inertWorkspace(true);
  label('Открываем рабочую студию');
  // Force a style/layout calculation while FA and title are fully hidden.
  overlay.getBoundingClientRect();
  // The real wall-only pause comes from JS timers, not transition-delay.
  schedule(()=>overlay.classList.add('is-fa-visible'),STAGES.fa);
  schedule(()=>overlay.classList.add('is-name-visible'),STAGES.name);
  schedule(()=>overlay.classList.add('is-descriptor-visible'),STAGES.descriptor);
  if(!previewHold){
   if(document.readyState==='complete'){loadReady=true;scheduleExit()}
   else {
    const id=runId;
    window.addEventListener('load',()=>{
     if(id!==runId||!active)return;
     loadReady=true;scheduleExit();
    },{once:true});
   }
  }
 }
 skip?.addEventListener('click',()=>finish(true));
 document.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'||(event.key==='Enter'&&document.activeElement===skip)){
   event.preventDefault();finish(true);
  }else if(event.key==='Tab'){
   event.preventDefault();skip?.focus({preventScroll:true});
  }
 });
 window.FORMA_INTRO={replay:()=>play(true),skip:()=>finish(true),get active(){return active}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>play(),{once:true});
 else play();
})();