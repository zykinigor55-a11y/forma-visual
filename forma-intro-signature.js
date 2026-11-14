/* FORMA / ARCHITECTURAL BLACK · intro v8
   Starts before heavyweight application scripts.
   Strict order on every page entry: loader -> FA -> FORMA -> studio.
   No session bypass, early skip, fake progress, or exit on raw window load.
   The page opens only after both the minimum animation and app initialization. */
(() => {
 'use strict';
 const TIME={loaderEnd:1650,logo:2050,name:3300,descriptor:3740,minShow:5550,recovery:15000};
 const root=document.documentElement;
 const screen=document.getElementById('forma-intro');
 if(!screen)return;
 const recover=document.getElementById('formaIntroRecover');
 const status=document.getElementById('formaIntroProgressStatus');
 const waitLabel=document.getElementById('formaIntroWait');
 const previewHold=new URLSearchParams(location.search).get('previewIntro')==='1';
 let active=false,closing=false,run=0,firstPaint=false,minimumPassed=false;
 let lastFocus=null,paintStart=0;
 const timers=new Set();
 const addTimeout=(task,ms)=>{
  const id=run;const timer=setTimeout(()=>{
   timers.delete(timer);
   if(id===run&&active&&!closing)task();
  },ms);timers.add(timer);return timer;
 };
 const clearTimers=()=>{for(const t of timers)clearTimeout(t);timers.clear()};
 function lockWorkspace(lock){
  const workspace=document.getElementById('app');
  if(!workspace)return;
  if(lock){
   if(!workspace.hasAttribute('inert')){workspace.setAttribute('inert','');workspace.dataset.formaOpeningLock='1'}
  }else if(workspace.dataset.formaOpeningLock==='1'){
   workspace.removeAttribute('inert');delete workspace.dataset.formaOpeningLock;
  }
 }
 function ready(){
  // The only source of truth for initialized projects is the core app.
  return window.FORMA_APP_READY===true;
 }
 function revealStudio(force=false){
  if(!active||closing||previewHold&&!force||!force&&(!minimumPassed||!ready()))return;
  closing=true;clearTimers();
  screen.classList.remove('is-holding');
  if(recover)recover.hidden=true;
  screen.classList.add('is-leaving');
  const id=run;
  setTimeout(()=>{
   if(id!==run)return;
   active=false;closing=false;
   screen.hidden=true;screen.setAttribute('aria-hidden','true');
   screen.classList.remove('is-leaving','is-loader-complete','is-logo-visible','is-name-visible','is-descriptor-visible','is-holding');
   root.classList.remove('forma-intro-pending');
   lockWorkspace(false);
   if(screen.contains(document.activeElement)){
    if(lastFocus?.isConnected&&lastFocus!==document.body)lastFocus.focus({preventScroll:true});
    else document.querySelector('.forma-hero-primary')?.focus({preventScroll:true});
   }
  },850);
 }
 function checkReadiness(){
  if(!active||closing||!minimumPassed)return;
  if(previewHold)return;
  if(ready()){revealStudio();return}
  screen.classList.add('is-holding');
  if(waitLabel)waitLabel.textContent='Завершаем подготовку студии';
 }
 function begin(){
  run+=1;clearTimers();
  active=true;closing=false;firstPaint=false;minimumPassed=false;
  lastFocus=document.activeElement;
  root.classList.add('forma-intro-pending');
  screen.hidden=false;screen.setAttribute('aria-hidden','false');
  screen.classList.remove('is-leaving','is-loader-complete','is-logo-visible','is-name-visible','is-descriptor-visible','is-holding');
  if(recover)recover.hidden=true;
  if(status)status.textContent='Загружаем инструменты';
  if(waitLabel)waitLabel.textContent='Завершаем подготовку студии';
  lockWorkspace(true);
  screen.getBoundingClientRect();
  const id=run;
  // Run the clock after the browser has shown the first, fully black loader frame.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(id!==run||!active||closing)return;
   firstPaint=true;paintStart=performance.now();
   addTimeout(()=>screen.classList.add('is-loader-complete'),TIME.loaderEnd);
   addTimeout(()=>screen.classList.add('is-logo-visible'),TIME.logo);
   addTimeout(()=>screen.classList.add('is-name-visible'),TIME.name);
   addTimeout(()=>screen.classList.add('is-descriptor-visible'),TIME.descriptor);
   addTimeout(()=>{minimumPassed=true;checkReadiness()},TIME.minShow);
   addTimeout(()=>{
    if(previewHold||ready()||!active)return;
    screen.classList.add('is-holding');
    if(waitLabel)waitLabel.textContent='Загрузка заняла больше времени';
    if(recover)recover.hidden=false;
   },TIME.recovery);
   checkReadiness();
  }));
 }
 document.addEventListener('forma:app-ready',()=>checkReadiness());
 document.addEventListener('DOMContentLoaded',()=>{if(active)lockWorkspace(true)},{once:true});
 recover?.addEventListener('click',()=>revealStudio(true));
 // For navigation restored from browser back-forward cache: rerun the SAME sequence.
 window.addEventListener('pageshow',event=>{if(event.persisted)begin()});
 window.FORMA_INTRO={
  replay:()=>begin(),
  enter:()=>revealStudio(true),
  get active(){return active},
  get stage(){return !firstPaint?'preparing':screen.classList.contains('is-logo-visible')?'branding':'loading'}
 };
 begin();
})();