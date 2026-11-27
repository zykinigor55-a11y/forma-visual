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
 const tapHint=document.getElementById('formaLaunchTapHint');
 const touchDevice=matchMedia('(pointer: coarse)').matches;
 const previewHold=new URLSearchParams(location.search).get('previewIntro')==='1';
 let active=false,closing=false,run=0,firstPaint=false,minimumPassed=false;
 let lastFocus=null,paintStart=0,readyQueued=false;
 let audioContext=null,sequencePending=false,gestureBusy=false,playedTaps=0;
 function hint(message=''){if(tapHint){tapHint.textContent=message;tapHint.hidden=!message}}
 // Real wooden blocks: Freesound #543705, 200221-WeanBekker, CC0.
 // Public preview from the source page; no synthesized substitute.
 const woodUrl='https://cdn.freesound.org/previews/543/543705_11072224-lq.mp3';
 let woodBuffer=null,woodCuts=[],woodPromise=null,woodError=false;
 const playingWood=new Set();
 function findWoodCuts(buffer){
  const rate=buffer.sampleRate,hop=Math.max(1,Math.round(rate*.008)),frames=Math.floor(buffer.length/hop);
  const ch=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
  const levels=new Float32Array(frames);
  for(let i=0;i<frames;i++){let power=0;for(let k=0;k<hop;k++)for(const channel of ch){const v=channel[i*hop+k];power+=v*v}levels[i]=Math.sqrt(power/(hop*ch.length))}
  const max=levels.reduce((a,b)=>Math.max(a,b),0),candidates=[];
  if(max<.0001)throw Error('Silent source');
  for(let i=7;i<frames-29;i++){
   const peak=levels[i],prior=(levels[i-6]+levels[i-5]+levels[i-4]+levels[i-3]+levels[i-2])/5;
   if(peak<max*.13||peak<levels[i-1]||peak<levels[i+1]||peak<prior*1.9)continue;
   let tail=0;for(let k=12;k<25;k++)tail+=levels[i+k]/13;
   const score=(peak-prior)/(Math.max(.008,tail)+peak*.28);
   candidates.push({i,score,peak});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const chosen=[];
  for(const c of candidates){if(chosen.every(x=>Math.abs(x.i-c.i)*hop/rate>.30)){chosen.push(c);if(chosen.length===12)break}}
  if(chosen.length<3)throw Error('Not enough separate wooden impacts');
  // Use separate sharp transients; brief dry tails, with no pitch shift or synthetic bass.
  return chosen.sort((a,b)=>a.i-b.i).map(c=>{
   let onset=c.i;while(onset>c.i-6&&levels[onset-1]>c.peak*.12)onset--;
   const start=Math.max(0,onset*hop/rate-.012);
   let duration=Math.min(.195,buffer.duration-start);
   let peak=0;for(const channel of ch)for(let k=Math.floor(start*rate);k<Math.min(buffer.length,Math.floor((start+duration)*rate));k++)peak=Math.max(peak,Math.abs(channel[k]));
   return {start,duration,peak:Math.max(.03,peak)};
  });
 }
 function prepareWood(){
  if(woodBuffer)return Promise.resolve(true);
  if(woodPromise)return woodPromise;
  woodError=false;
  woodPromise=(async()=>{
   const response=await fetch(woodUrl,{mode:'cors',credentials:'omit',cache:'force-cache'});
   if(!response.ok)throw Error('Audio HTTP '+response.status);
   const buffer=await audioContext.decodeAudioData(await response.arrayBuffer());
   const cuts=findWoodCuts(buffer);woodBuffer=buffer;woodCuts=cuts;
   return true;
  })().catch(error=>{woodError=true;console.warn('FORMA natural wood recording unavailable',error);return false}).finally(()=>{woodPromise=null});
  return woodPromise;
 }
 function unlockSound(){
  try{
   const A=window.AudioContext||window.webkitAudioContext;
   if(!A)return Promise.resolve(false);
   if(!audioContext)audioContext=new A();
   // Resume within the user gesture; decoding itself may finish later.
   const resume=audioContext.resume().catch(()=>{});
   return Promise.all([resume,prepareWood()]).then(([,loaded])=>loaded&&audioContext.state==='running');
  }catch{return Promise.resolve(false)}
 }
 function stopWood(){for(const node of playingWood){try{node.stop()}catch{}}playingWood.clear()}
 function woodTap(index,level=.085){
  if(!woodBuffer||!woodCuts.length||audioContext?.state!=='running')return;
  const cut=woodCuts[index%woodCuts.length],ctx=audioContext,now=ctx.currentTime+.008;
  const src=ctx.createBufferSource(),gain=ctx.createGain(),hp=ctx.createBiquadFilter();
  src.buffer=woodBuffer;hp.type='highpass';hp.frequency.value=85;hp.Q.value=.6;
  const volume=Math.min(1,level/cut.peak);
  gain.gain.setValueAtTime(0,now);
  gain.gain.linearRampToValueAtTime(volume,now+.006);
  gain.gain.setValueAtTime(volume,now+Math.max(.004,cut.duration-.025));
  gain.gain.linearRampToValueAtTime(0,now+cut.duration);
  src.connect(hp);hp.connect(gain);gain.connect(ctx.destination);playingWood.add(src);
  src.onended=()=>{playingWood.delete(src);src.disconnect();hp.disconnect();gain.disconnect()};
  src.start(now,cut.start,cut.duration);playedTaps++;
 }
 // Touch activation: click/pointerup, not touch pointerdown. Never bypass browser policy.
 function resumeOnInteraction(event){
  if(!active||closing||gestureBusy||event?.target===recover)return;
  if(audioContext?.state==='running'&&woodBuffer&&playedTaps>0)return;
  gestureBusy=true;const current=run;
  const wasPending=sequencePending;
  const loading=unlockSound();
  hint('');
  Promise.race([loading,new Promise(resolve=>setTimeout(()=>resolve(false),950))]).then(ok=>{
   if(current!==run||!active||closing)return;
   gestureBusy=false;
   if(wasPending&&sequencePending){startSequence(current);return}
   if(ok&&previewHold&&playedTaps===0){begin();return}
   if(woodError&&previewHold)hint('Запись дерева недоступна');
   else if(!ok&&previewHold)hint('Коснитесь экрана для звука');
  });
 }
 screen.addEventListener('click',resumeOnInteraction);
 document.addEventListener('keydown',resumeOnInteraction);
 unlockSound();
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
  closing=true;clearTimers();hint('');
  screen.classList.remove('is-holding');
  if(recover)recover.hidden=true;
  woodTap(7,.075);
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
  run+=1;clearTimers();stopWood();playedTaps=0;gestureBusy=false;sequencePending=false;hint('');
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
  const id=run;sequencePending=true;
  if(touchDevice&&audioContext?.state!=='running'){
   screen.classList.add('is-grid-visible');
   hint('Коснитесь экрана');
   // A brief optional window for gesture; unattended startup still proceeds.
   addTimeout(()=>{if(sequencePending&&!gestureBusy)startSequence(id)},1800);
   addTimeout(()=>{if(sequencePending)startSequence(id)},3000);
  }else startSequence(id);
 }
 function startSequence(id){
  if(id!==run||!active||closing||!sequencePending)return;
  sequencePending=false;
  if(!previewHold||audioContext?.state==='running')hint('');
  // Run the clock after the browser has shown the first, fully black loader frame.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(id!==run||!active||closing)return;
   firstPaint=true;paintStart=performance.now();screen.classList.add('is-grid-visible');
   addTimeout(()=>screen.classList.add('is-loader-complete'),TIME.loaderEnd);
   addTimeout(()=>{screen.classList.add('is-logo-visible');woodTap(0,.095)},TIME.logo);
   addTimeout(()=>screen.classList.add('is-name-visible'),TIME.name);
   addTimeout(()=>woodTap(3,.08),TIME.name+195);
   addTimeout(()=>woodTap(5,.065),TIME.name+510);
   addTimeout(()=>screen.classList.add('is-descriptor-visible'),TIME.descriptor);
   addTimeout(()=>{minimumPassed=true;checkReadiness();if(previewHold&&playedTaps===0)hint(woodError?'Запись дерева недоступна':'Коснитесь экрана для звука')},TIME.minShow);
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