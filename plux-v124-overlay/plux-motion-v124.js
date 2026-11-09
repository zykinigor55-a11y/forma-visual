/**
 * PLUX V12.4 · Video State Director
 * Original five MP4s remain untouched. Two videos per visible scene, not per state.
 * Optimized for state storms from streaming voice, tab changes, and reduced motion.
 */
(() => {
  'use strict';
  const clips = Object.freeze({
    idle:'01_idle', listening:'02_listening', thinking:'03_thinking',
    talking:'04_talking', happy:'05_happy'
  });
  const FADE_MS = 185;
  const stages = new Map();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mediaUrl = state => `/assets/videos-v106/${clips[state] || clips.idle}.mp4`;
  const fallbacks = state => [mediaUrl(state), `/assets/videos/${clips[state] || clips.idle}.mp4`];
  const visible = host => Boolean(host?.isConnected && !document.hidden && !host.closest('.screen')?.hidden);
  function setOpacity(video, opacity) { video.style.setProperty('opacity', `${opacity}`, 'important'); }
  function setUp(video) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.loop = true;
    video.preload = 'metadata';
    video.playbackRate = 1;
    video.classList.add('plux-v106-video');
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('aria-hidden','true');
    video.style.setProperty('transition', `opacity ${reduced.matches ? 0 : FADE_MS}ms linear`, 'important');
    setOpacity(video,0);
  }
  function guardPlay(video) {
    try { const p=video.play(); p?.catch?.(()=>{}); } catch { /* fallback still image remains */ }
  }
  class Scene {
    constructor(host, initial) {
      this.host=host;
      this.videos=[initial,document.createElement('video')];
      this.videos.forEach(setUp);
      this.videos[1].classList.add('plux-v106-secondary');
      host.append(this.videos[1]);
      host.classList.add('plux-v106-host');
      this.active=null;
      this.state=null;
      this.requested='idle';
      this.generation=0;
      this.pendingCleanup=null;
      this.fadeTimer=0;
      this.recentActivity=0;
      this.stats={transitions:0,redundant:0,failures:0};
      for(const v of this.videos) {
        v.addEventListener('ended',()=>{
          if(v!==this.active)return;
          if(this.state==='happy')this.set('idle');
        });
      }
    }
    cancelPending(){
      this.generation++;
      this.pendingCleanup?.();this.pendingCleanup=null;
      clearTimeout(this.fadeTimer);
    }
    stop(){
      this.cancelPending();
      this.videos.forEach(v=>{try{v.pause()}catch{}});
    }
    sync(){
      if(!visible(this.host)){this.stop();return;}
      const next=this.requested;
      if(this.active && this.state===next){guardPlay(this.active);return;}
      void this.set(next);
    }
    async awaitReady(video,url,token){
      if(token!==this.generation) return false;
      // Do not load the same source again. This avoids stalling the hardware decoder.
      if(video.getAttribute('src')===url && video.readyState>=2) return true;
      return await new Promise(resolve=>{
        let settled=false;
        const complete=ok=>{
          if(settled)return;
          settled=true;cleanup();resolve(ok && this.generation===token);
        };
        const ready=()=>{if(video.readyState>=2) complete(true)};
        const fail=()=>complete(false);
        const timeout=setTimeout(fail,7000);
        const cleanup=()=>{
          clearTimeout(timeout);
          video.removeEventListener('loadeddata',ready);
          video.removeEventListener('canplay',ready);
          video.removeEventListener('error',fail);
          if(this.pendingCleanup===fail) this.pendingCleanup=null;
        };
        this.pendingCleanup=fail;
        video.addEventListener('loadeddata',ready);
        video.addEventListener('canplay',ready);
        video.addEventListener('error',fail);
        if(video.getAttribute('src')!==url){
          video.pause();video.src=url;video.preload='auto';video.load();
        } else if(video.readyState>=2)ready();
      });
    }
    async awaitFirstFrame(video,token){
      try{await video.play()}catch{return false}
      if(token!==this.generation)return false;
      if('requestVideoFrameCallback' in video){
        await Promise.race([
          new Promise(resolve=>{
            try{video.requestVideoFrameCallback(()=>resolve())}catch{resolve()}
          }),
          new Promise(resolve=>setTimeout(resolve,250))
        ]);
      }
      return token===this.generation && video.readyState>=2;
    }
    async set(next='idle'){
      const target=clips[next] ? next:'idle';
      this.requested=target;
      if(!visible(this.host)){this.stop();return}
      if(this.state===target && this.active){
        this.stats.redundant++;
        if(this.active.paused)guardPlay(this.active);
        return;
      }
      this.cancelPending();
      const token=this.generation;
      const current=()=>this.generation===token && this.requested===target && visible(this.host);
      const incoming=this.active===this.videos[0]?this.videos[1]:this.videos[0];
      incoming.loop=target!=='happy';
      incoming.playbackRate=1;
      let ok=false;
      for(const url of fallbacks(target)){
        if(!current())return;
        if(await this.awaitReady(incoming,url,token)){
          if(!current())return;
          try{incoming.currentTime=0}catch{}
          if(await this.awaitFirstFrame(incoming,token)){ok=true;break}
        }
      }
      if(!current())return;
      if(!ok){
        this.stats.failures++;
        // Keep last good video or source still; failure must not blank the mascot.
        if(!this.active)this.host.classList.remove('has-video','video-ready');
        return;
      }
      const outgoing=this.active;
      const previous=this.state;
      this.active=incoming;
      this.state=target;
      this.stats.transitions++;
      incoming.style.zIndex='4';
      setOpacity(incoming,0);
      if(outgoing){outgoing.style.zIndex='3';setOpacity(outgoing,1)}
      this.host.classList.add('has-video','video-ready');
      // Rerender before triggering compositor opacity; source frames are already decoded.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(this.active!==incoming || !current())return;
        setOpacity(incoming,1);
        if(outgoing)setOpacity(outgoing,0);
      }));
      if(outgoing){
        this.fadeTimer=setTimeout(()=>{
          if(this.active!==incoming)return;
          outgoing.pause();
          outgoing.preload='metadata';
          outgoing.removeAttribute('src'); // Free standby decoder until needed.
          outgoing.load();
          this.fadeTimer=0;
        },reduced.matches?15:FADE_MS+55);
      }
      // Useful only for debugging, not user analytics.
      this.host.dataset.pluxEmotion=target;
      this.host.dispatchEvent(new CustomEvent('plux:emotion',{detail:{state:target,previous}}));
    }
  }
  window.PLUXSeamless={
    set(video,host,state){
      if(!video||!host)return;
      let stage=stages.get(host);
      if(!stage){stage=new Scene(host,video);stages.set(host,stage)}
      void stage.set(state);
    },
    sync(){for(const stage of stages.values())stage.sync()},
    debug(){return [...stages.values()].map(stage=>({host:stage.host.id || stage.host.className,requested:stage.requested,state:stage.state,...stage.stats}))}
  };
  document.addEventListener('visibilitychange',()=>window.PLUXSeamless.sync());
  window.addEventListener('pageshow',()=>window.PLUXSeamless.sync());
  window.addEventListener('pagehide',()=>{for(const stage of stages.values())stage.stop()});
})();