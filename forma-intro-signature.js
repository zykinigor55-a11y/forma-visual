/* FORMA / ARCHITECTURAL BLACK · intro v8
   Starts before heavyweight application scripts.
   Strict order on every page entry: loader -> FA -> FORMA -> studio.
   No session bypass, early skip, fake progress, or exit on raw window load.
   The page opens only after both the minimum animation and app initialization. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const TIME={loaderEnd:1100,logo:550,name:1550,descriptor:2600,minShow:reduced?1600:4200,recovery:14000};
 const root=document.documentElement;
 const screen=document.getElementById('forma-intro');
 if(!screen)return;
 const recover=document.getElementById('formaIntroRecover');
 const status=document.getElementById('formaIntroProgressStatus');
 const waitLabel=document.getElementById('formaIntroWait');
 const progress=screen.querySelector('#formaLaunchProgress');
 const previewHold=new URLSearchParams(location.search).get('previewIntro')==='1';
 let active=false,closing=false,run=0,firstPaint=false,minimumPassed=false;
 let lastFocus=null,paintStart=0,readyQueued=false;
 let soundEnabled=false,audioContext=null;
 const soundKey='forma-noir-open-sound-v1';
 try{soundEnabled=localStorage.getItem(soundKey)==='on'}catch{}
 const soundButton=document.getElementById('formaIntroSound');
 function soundUI(){
  if(!soundButton)return;
  soundButton.textContent=soundEnabled?'◉  Звук включён':'○  Включить звук';
  soundButton.setAttribute('aria-pressed',String(soundEnabled));
 }
 function unlockSound(){
  if(!soundEnabled)return;
  try{
   const A=window.AudioContext||window.webkitAudioContext;
   if(!A)return;
   if(!audioContext)audioContext=new A();
   if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch{}
 }
 function entranceSound(){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  try{
   const context=audioContext,now=context.currentTime;
   const mix=context.createGain(),filter=context.createBiquadFilter();
   filter.type='lowpass';filter.frequency.setValueAtTime(630,now);
   mix.gain.setValueAtTime(.0001,now);
   mix.gain.exponentialRampToValueAtTime(.024,now+.12);
   mix.gain.exponentialRampToValueAtTime(.0001,now+.84);
   mix.connect(filter);filter.connect(context.destination);
   for(const [frequency,type,volume,offset] of [[196,'sine',.64,0],[293.66,'sine',.29,.04],[392,'triangle',.07,.07]]){
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);
    gain.gain.value=volume;oscillator.connect(gain);gain.connect(mix);
    oscillator.start(now+offset);oscillator.stop(now+.87);
    oscillator.addEventListener('ended',()=>{oscillator.disconnect();gain.disconnect()},{once:true});
   }
   setTimeout(()=>{mix.disconnect();filter.disconnect()},1200);
  }catch{}
 }
 soundButton?.addEventListener('click',()=>{
  soundEnabled=!soundEnabled;
  try{localStorage.setItem(soundKey,soundEnabled?'on':'off')}catch{}
  soundUI();
  if(soundEnabled)unlockSound();
 });
 screen.addEventListener('pointerdown',()=>{if(soundEnabled)unlockSound()},{passive:true});
 soundUI();
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
  return window.FORMA_APP_READY===true && window.FORMA_STUDIO_READY===true && !!document.getElementById('formaStudioHome') && document.body.classList.contains('fa-unified-studio');
 }
 function revealStudio(force=false){
  if(!active||closing||previewHold&&!force||!force&&(!minimumPassed||!ready()))return;
  closing=true;clearTimers();
  screen.classList.remove('is-holding');
  if(recover)recover.hidden=true;
  entranceSound();
  screen.classList.add('is-leaving');
  const id=run;
  setTimeout(()=>{
   if(id!==run)return;
   active=false;closing=false;
   screen.hidden=true;screen.setAttribute('aria-hidden','true');
   screen.classList.remove('is-leaving','is-grid-visible','is-loader-complete','is-logo-visible','is-name-visible','is-descriptor-visible','is-holding');
   root.classList.remove('forma-intro-pending');
   lockWorkspace(false);
   if(screen.contains(document.activeElement)){
    if(lastFocus?.isConnected&&lastFocus!==document.body)lastFocus.focus({preventScroll:true});
    else document.querySelector('.forma-hero-primary')?.focus({preventScroll:true});
   }
  },650);
 }
 function checkReadiness(){
  if(!active||closing||!minimumPassed)return;
  if(ready()){
   screen.classList.add('is-ready');
   progress?.setAttribute('aria-valuetext','Студия готова');
   progress?.setAttribute('aria-valuenow','100');
   if(!previewHold&&!readyQueued){readyQueued=true;addTimeout(()=>revealStudio(),260);}
   return;
  }
  if(previewHold)return;
  screen.classList.add('is-holding');
  if(waitLabel)waitLabel.textContent='Завершаем подготовку студии';
 }
 function begin(){
  run+=1;clearTimers();
  active=true;closing=false;firstPaint=false;minimumPassed=false;readyQueued=false;
  screen.classList.remove('is-ready');progress?.removeAttribute('aria-valuenow');progress?.setAttribute('aria-valuetext','Загрузка');
  lastFocus=document.activeElement;
  root.classList.add('forma-intro-pending');
  screen.hidden=false;screen.setAttribute('aria-hidden','false');
  screen.classList.remove('is-leaving','is-grid-visible','is-loader-complete','is-logo-visible','is-name-visible','is-descriptor-visible','is-holding');
  if(recover)recover.hidden=true;
  if(status)status.textContent='Загружаем инструменты';
  if(waitLabel)waitLabel.textContent='Завершаем подготовку студии';
  lockWorkspace(true);
  screen.getBoundingClientRect();
  const id=run;
  // Run the clock after the browser has shown the first, fully black loader frame.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(id!==run||!active||closing)return;
   firstPaint=true;paintStart=performance.now();screen.classList.add('is-grid-visible');
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
 document.addEventListener('forma:studio-ready',()=>checkReadiness());
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