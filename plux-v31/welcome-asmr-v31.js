/* PLUX v31.1 — soft, procedural keycap ASMR for the launch typewriter.
 * No external audio, no speech/microphone access, respects mute and volume.
 * Native WebViews may autoplay; browsers/iOS may require a first user gesture. */
(()=>{
  'use strict';
  if(window.PLUXWelcomeASMRV31)return;
  const SETTINGS_MUTE='plux_sfx_enabled',SETTINGS_VOLUME='plux_v125_volume';
  const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  let context=null,buffer=null,unlocked=false,lastAt=0,scheduled=false;
  const watched=new WeakSet();
  function allowed(){
    if(document.hidden||reduced())return false;
    try{return localStorage.getItem(SETTINGS_MUTE)!=='off'}catch{return true}
  }
  function volume(){
    try{
      const value=Number(localStorage.getItem(SETTINGS_VOLUME)??55);
      return Math.max(0,Math.min(1,(Number.isFinite(value)?value:55)/100));
    }catch{return .55}
  }
  function audio(){
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    if(!context){
      context=new C({latencyHint:'interactive'});
      buffer=context.createBuffer(1,Math.max(2048,Math.floor(context.sampleRate*.095)),context.sampleRate);
      const samples=buffer.getChannelData(0);
      let smooth=0;
      for(let i=0;i<samples.length;i++){
        smooth=smooth*.60+(Math.random()*2-1)*.40;
        samples[i]=smooth;
      }
    }
    return context;
  }
  function unlock(){
    unlocked=true;
    if(!allowed())return;
    try{const c=audio();if(c?.state==='suspended')void c.resume().catch(()=>{})}catch{}
  }
  for(const type of ['pointerdown','keydown','touchstart'])
    document.addEventListener(type,unlock,{capture:true,passive:true,once:true});
  function keycap(){
    const now=performance.now();
    if(now-lastAt<30||!allowed())return;
    const loudness=volume();
    if(!loudness)return;
    lastAt=now;
    try{
      const c=audio();
      if(!c)return;
      if(c.state!=='running'){
        if(unlocked)void c.resume().catch(()=>{});
        return;
      }
      const start=c.currentTime+.006,pitch=.86+Math.random()*.28;
      for(const [offset,duration,level] of [[0,.033,.12],[.032,.021,.055]]){
        const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
        src.buffer=buffer;src.playbackRate.value=pitch*(offset?1.18:1);
        filter.type='bandpass';filter.frequency.value=(offset?1150:720)*pitch;filter.Q.value=.66;
        const at=start+offset,peak=level*loudness;
        gain.gain.setValueAtTime(.00001,at);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),at+.003);
        gain.gain.exponentialRampToValueAtTime(.00001,at+duration);
        src.connect(filter);filter.connect(gain);gain.connect(c.destination);
        src.start(at);src.stop(at+duration+.002);
        src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()};
      }
    }catch{}
  }
  function visible(el){
    if(!el?.isConnected||el.closest('[hidden]')||!el.getClientRects().length)return false;
    return getComputedStyle(el).visibility!=='hidden';
  }
  function watch(el){
    if(!el||watched.has(el))return;
    watched.add(el);
    let previous=el.textContent||'';
    const observer=new MutationObserver(()=>{
      const current=el.textContent||'';
      const growth=current.length-previous.length;
      if(growth>0&&growth<=6&&visible(el)&&/[^\s]/.test(current.slice(-growth)))keycap();
      previous=current;
      if(!el.isConnected)observer.disconnect();
    });
    observer.observe(el,{subtree:true,childList:true,characterData:true});
  }
  const screenTargets=[
    ['#plux127-intro','[data-plux-welcome-typewriter],[data-typewriter],#intro-typewriter,#welcome-typewriter,.typing-text,.typewriter,h1'],
    ['#screen-welcome','[data-plux-welcome-typewriter],[data-typewriter],#welcome-typewriter,.typing-text,.typewriter,h1'],
    ['#screen-onboard','[data-plux-welcome-typewriter],[data-typewriter],#onboard-typed-text,.typing-text,.typewriter,h1'],
    ['#screen-onboarding','[data-typewriter],.typing-text,.typewriter,h1'],
    ['#onboard','[data-typewriter],.typing-text,.typewriter,h1'],
    ['.welcome-screen','[data-typewriter],.typing-text,.typewriter,h1'],
    ['.onboarding-screen','[data-typewriter],.typing-text,.typewriter,h1']
  ];
  function scan(){
    scheduled=false;
    watch(document.getElementById('greeting-title'));
    for(const [screenSelector,textSelector] of screenTargets){
      const screen=document.querySelector(screenSelector);
      if(screen)watch(screen.querySelector(textSelector));
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    queueMicrotask(scan);
  }
  if(document.body){
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    schedule();
  }else document.addEventListener('DOMContentLoaded',()=>{
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    schedule();
  },{once:true});
  window.PLUXWelcomeASMRV31={enabled:allowed,volume,connected:()=>Boolean(context)};
})();