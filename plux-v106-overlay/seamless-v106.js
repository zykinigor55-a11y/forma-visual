/** PLUX V10.6: double-buffered video and painted-frame crossfade. */
(()=>{
'use strict';
const clips={idle:'01_idle',listening:'02_listening',thinking:'03_thinking',talking:'04_talking',happy:'05_happy'};
const expected={idle:'listening',listening:'thinking',thinking:'talking',talking:'idle',happy:'idle'};
const engines=new WeakMap(),DURATION=260;
const visible=host=>!document.hidden&&!host.closest('.screen')?.hidden;
const opacity=(v,x)=>v.style.setProperty('opacity',String(x),'important');
const urls=name=>['/assets/videos-v106/'+name+'.mp4','/assets/videos/'+name+'.mp4'];
function configure(v){
 v.classList.add('plux-v106-video');v.muted=v.defaultMuted=v.autoplay=v.playsInline=true;
 v.preload='metadata';v.defaultPlaybackRate=v.playbackRate=1;
 v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
 v.setAttribute('aria-hidden','true');v.style.setProperty('transition','opacity '+DURATION+'ms linear','important');opacity(v,0);
}
function waitData(v,url,fresh){
 return new Promise((resolve,reject)=>{
   if(!fresh())return reject(Error('Superseded'));
   if(v.getAttribute('src')===url&&v.readyState>=2)return resolve();
   let timer;
   const cleanup=()=>{clearTimeout(timer);v.removeEventListener('loadeddata',ok);v.removeEventListener('canplay',ok);v.removeEventListener('error',fail)};
   const ok=()=>{if(v.readyState<2)return;cleanup();resolve()};
   const fail=()=>{cleanup();reject(Error('Network or decode error'))};
   v.addEventListener('loadeddata',ok);v.addEventListener('canplay',ok);v.addEventListener('error',fail);
   timer=setTimeout(()=>{cleanup();reject(Error('Timeout'))},9000);
   if(v.getAttribute('src')!==url){v.pause();v.src=url;v.preload='auto';v.load()}
   else{v.load();if(v.readyState>=2)ok()}
 });
}
class Engine{
 constructor(v,host){
   this.host=host;this.main=v;this.second=document.createElement('video');this.front=null;
   this.state='';this.target='';this.id=0;this.busy=false;
   for(const x of [this.main,this.second]){
     configure(x);
     x.addEventListener('ended',()=>{if(x!==this.front)return;if(this.state==='happy')void this.set('idle')});
   }
   host.append(this.second);host.classList.add('plux-v106-host');
   document.addEventListener('visibilitychange',()=>this.sync());
   window.addEventListener('pagehide',()=>{this.main.pause();this.second.pause()});
 }
 sync(){
   if(!visible(this.host)){this.main.pause();this.second.pause();return}
   if(this.target)void this.set(this.target,true);
 }
 async set(state,resume=false){
   state=clips[state]?state:'idle';
   if(!visible(this.host)){this.target=state;this.main.pause();this.second.pause();return}
   if(this.target===state&&this.front&&this.state===state){
     if(this.front.paused)try{await this.front.play()}catch{}
     return;
   }
   if(!resume&&this.target===state&&this.busy)return;
   this.target=state;const id=++this.id;this.busy=true;
   const fresh=()=>this.id===id&&this.target===state&&visible(this.host);
   const incoming=this.front===this.main?this.second:this.main;
   let success=false;
   for(const path of urls(clips[state])){
     if(!fresh())return;
     try{
       incoming.loop=state!=='happy';incoming.preload='auto';
       await waitData(incoming,path,fresh);
       if(!fresh())return;
       incoming.currentTime=0;
       await incoming.play();
       if(incoming.seeking)await new Promise(resolve=>{
         let finished=false;
         const finish=()=>{if(finished)return;finished=true;incoming.removeEventListener('seeked',finish);resolve()};
         incoming.addEventListener('seeked',finish,{once:true});setTimeout(finish,800);
       });
       if('requestVideoFrameCallback' in incoming)await Promise.race([
         new Promise(resolve=>incoming.requestVideoFrameCallback(()=>resolve())),
         new Promise(resolve=>setTimeout(resolve,650))
       ]);
       if(!fresh()){incoming.pause();return}
       if(incoming.readyState<2)continue;
       success=true;break;
     }catch(err){if(!fresh())return;console.info('PLUX media fallback',path,err?.message)}
   }
   if(!fresh())return;
   this.busy=false;
   if(!success){incoming.pause();if(!this.front)this.host.classList.remove('has-video','video-ready');return}
   const previous=this.front;
   this.front=incoming;this.state=state;
   incoming.style.zIndex='4';opacity(incoming,0);
   if(previous){previous.style.zIndex='3';opacity(previous,1)}
   this.host.classList.add('has-video','video-ready');
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(this.front!==incoming)return;
     opacity(incoming,1);if(previous)opacity(previous,0);
   }));
   if(previous)setTimeout(()=>{
     if(previous===this.front)return;
     previous.pause();previous.preload='auto';
     const path=urls(clips[expected[this.state]||'idle'])[0];
     if(previous.getAttribute('src')!==path){previous.src=path;previous.load()}
   },DURATION+100);
 }
}
window.PLUXSeamless={
 set(v,host,state){if(!v||!host)return;let p=engines.get(host);if(!p){p=new Engine(v,host);engines.set(host,p)}void p.set(state)},
 sync(){for(const host of [document.getElementById('home-mascot'),document.querySelector('.voice-image-layer')])if(host)engines.get(host)?.sync()}
};
})();
