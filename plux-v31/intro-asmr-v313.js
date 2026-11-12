/* PLUX V31.3 — ambient home backdrop and quiet physical-keyboard welcome clicks.
 * Synthesized original soft keystrokes; no external audio data or network calls.
 * Browser audio remains gesture-gated; follows existing PLUX sound preference.
 */
(()=>{
 'use strict';
 if(window.PLUXHomeV313)return;
 const home=document.getElementById('screen-home');
 if(!home)return;
 // The V30 app sets background-image:none inline with !important during startup.
 // Explicitly apply our background as an inline variable-based style, preserving
 // the original home scene and all mascot images above it.
 function restoreHomeBackdrop(){
   home.style.setProperty('background-color','#000','important');
   home.style.setProperty('background-image',
     'radial-gradient(ellipse 64% 24% at 50% 29%, var(--plux31-home-contrast-a), transparent 79%), '+
     'radial-gradient(ellipse 59% 19% at 50% 70%, var(--plux31-home-contrast-b), transparent 85%), '+
     'linear-gradient(#000, #000)',
     'important');
 }
 restoreHomeBackdrop();
 window.addEventListener('plux:themechange',restoreHomeBackdrop);
 const scene=home.querySelector('.scene-home');
 if(scene&&!scene.querySelector('.plux31-home-ambient')){
   const ambient=document.createElement('span');
   ambient.className='plux31-home-ambient';
   ambient.setAttribute('aria-hidden','true');
   scene.insertBefore(ambient,scene.firstChild);
 }
 const textSelectors=[
   '#greeting-title','#greeting-subtitle',
   '#welcome-text','#welcome-typewriter','#onboard-typed-text',
   '#intro-typewriter','#screen-onboard .typewriter',
   '#screen-onboard .typing-text','#screen-welcome .typewriter',
   '#plux127-intro .typing-text','#plux127-intro h1',
   '#screen-onboard [data-plux-welcome-typewriter]',
   '#screen-welcome [data-typewriter]','#screen-onboard h1'
 ];
 let ctx=null,noise=null,unlocked=false;
 let lastTick=0,tickCount=0;
 const targets=new Map();
 const C=window.AudioContext||window.webkitAudioContext;
 const soundEnabled=()=>{
   try{
     if(localStorage.getItem('plux_sfx_enabled')==='off')return false;
     const v=Number(localStorage.getItem('plux_v125_volume')??55);
     if(Number.isFinite(v)&&v<=0)return false;
   }catch{}
   return true;
 };
 function audioVolume(){
   try{const n=Number(localStorage.getItem('plux_v125_volume')??55);return Math.max(0,Math.min(100,Number.isFinite(n)?n:55))/100}catch{return .55}
 }
 function initialize(){
   if(!C||!soundEnabled())return;
   try{
     if(!ctx){ctx=new C({latencyHint:'interactive'});
       const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.07),ctx.sampleRate);
       const a=b.getChannelData(0);
       for(let i=0;i<a.length;i++){
         // Gentle mechanical tactility, damped high frequencies. No loud hiss.
         const envelope=Math.exp(-7*i/a.length);
         a[i]=(Math.random()*2-1)*envelope;
       }
       noise=b;
     }
     if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
     unlocked=true;
   }catch{}
 }
 // Browser/iOS WebKit requires first actual touch before audio can be heard.
 document.addEventListener('pointerdown',initialize,{capture:true,passive:true});
 document.addEventListener('keydown',initialize,{capture:true,passive:true});
 // Native PLUX WebViews can play the launch typewriter without a tap.
 // Web/Safari still follows its own first-gesture autoplay restriction.
 if(window.Capacitor?.isNativePlatform?.()===true)initialize();
 function tick(){
   if(!soundEnabled()||document.hidden||!C)return;
   const now=performance.now();
   if(now-lastTick<46)return;
   lastTick=now;
   if(!ctx||ctx.state!=='running'){
     // Initial greeting may begin before any user gesture: respect OS autoplay policy.
     if(!unlocked)return;
     return;
   }
   const vol=audioVolume();
   if(vol<=0)return;
   try{
     const start=ctx.currentTime+.004;
     const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();
     src.buffer=noise;filter.type='lowpass';filter.frequency.value=1000+(tickCount%3)*170;filter.Q.value=.7;
     amp.gain.setValueAtTime(.00002,start);
     amp.gain.linearRampToValueAtTime(vol*.029,start+.003);
     amp.gain.exponentialRampToValueAtTime(.00002,start+.043);
     src.connect(filter);filter.connect(amp);amp.connect(ctx.destination);
     src.start(start);src.stop(start+.052);
     src.onended=()=>{try{src.disconnect();filter.disconnect();amp.disconnect()}catch{}};
     if(tickCount++%5===0){
       const thump=ctx.createOscillator(),tap=ctx.createGain();
       thump.type='sine';thump.frequency.setValueAtTime(190,start);
       thump.frequency.exponentialRampToValueAtTime(105,start+.037);
       tap.gain.setValueAtTime(.00002,start);
       tap.gain.linearRampToValueAtTime(vol*.0045,start+.002);
       tap.gain.exponentialRampToValueAtTime(.00002,start+.038);
       thump.connect(tap);tap.connect(ctx.destination);
       thump.start(start);thump.stop(start+.041);
       thump.onended=()=>{try{thump.disconnect();tap.disconnect()}catch{}};
     }
   }catch{}
 }
 function visible(node){
   if(document.hidden||!node.isConnected)return false;
   const r=node.getBoundingClientRect();
   if(!r.width||!r.height)return false;
   return !node.closest('[hidden]')&&getComputedStyle(node).visibility!=='hidden';
 }
 function attach(node){
   if(targets.has(node))return;
   let prior=node.textContent||'';
   const observer=new MutationObserver(()=>{
     const next=node.textContent||'';
     if(next.length>prior.length&&next.startsWith(prior)&&next.length-prior.length<=6&&/\S/.test(next.slice(prior.length))&&visible(node)){
       tick();
     }
     prior=next;
   });
   observer.observe(node,{subtree:true,childList:true,characterData:true});
   targets.set(node,observer);
 }
 function scan(){
   for(const sel of textSelectors)document.querySelectorAll(sel).forEach(attach);
   // Keep screen mounting stable when onboarding replaces its welcome labels.
   for(const [node,obs] of targets)if(!node.isConnected){obs.disconnect();targets.delete(node)}
 }
 scan();
 const watch=new MutationObserver(records=>{
   if(records.some(r=>r.type==='childList'&&r.addedNodes.length))scan();
 });
 if(document.body)watch.observe(document.body,{childList:true,subtree:true});
 else document.addEventListener('DOMContentLoaded',()=>{
   scan();watch.observe(document.body,{childList:true,subtree:true})
 },{once:true});
 window.PLUXHomeV313={version:'31.3',getGreetingTargets:()=>targets.size,hasAmbient:()=>!!home.querySelector('.plux31-home-ambient')};
})();