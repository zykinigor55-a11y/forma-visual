/** PLUX V10.5 — live idle MP4 in the small chat avatar, safely paused offscreen. */
(() => {
  'use strict';
  const screen=document.getElementById('screen-chat');
  const still=screen?.querySelector('.chat-header .chat-avatar');
  const form=document.getElementById('chat-form');
  const input=document.getElementById('chat-input');
  if(!screen||!still)return;

  const circle=document.createElement('span');
  circle.className='chat-avatar-live';
  circle.setAttribute('role','img');
  circle.setAttribute('aria-label','PLUX — живая спокойная капля');
  still.replaceWith(circle);
  circle.append(still);
  still.setAttribute('aria-hidden','true');
  const video=document.createElement('video');
  video.id='chat-avatar-video';
  video.muted=true;video.defaultMuted=true;video.autoplay=true;
  video.loop=true;video.playsInline=true;video.preload='metadata';
  video.playbackRate=1;
  video.poster='/assets/videos/01-poster.jpg';
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.setAttribute('muted','');
  video.setAttribute('aria-hidden','true');
  circle.append(video);
  let generation=0;
  const active=()=>!screen.hidden&&!document.hidden;
  video.addEventListener('playing',()=>circle.classList.add('is-playing'));
  video.addEventListener('error',()=>circle.classList.remove('is-playing'));
  video.addEventListener('stalled',()=>{if(video.readyState<2)circle.classList.remove('is-playing')});
  function sync(){
    const request=++generation;
    if(!active()){video.pause();circle.classList.remove('is-playing');return}
    if(!video.getAttribute('src')){
      video.src='/assets/videos/01_idle.mp4';
      video.load();
    }
    if(!video.paused&&video.readyState>=2){circle.classList.add('is-playing');return}
    try {
      const play=video.play();
      if(play?.catch)play.catch(error=>{
        if(request===generation&&active()){
          circle.classList.remove('is-playing');
          console.info('PLUX chat avatar: poster fallback',error?.name||error)
        }
      });
    }catch(error){
      circle.classList.remove('is-playing');
      console.info('PLUX chat avatar: playback unavailable',error?.name||error)
    }
  }
  new MutationObserver(sync).observe(screen,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pageshow',sync);
  window.addEventListener('pagehide',()=>{video.pause();circle.classList.remove('is-playing')});
  video.addEventListener('canplay',()=>{if(active()&&video.paused)sync()});
  sync();
  if(form&&input){
    const update=()=>form.classList.toggle('has-message',!!input.value.trim());
    input.addEventListener('input',update);
    form.addEventListener('submit',()=>requestAnimationFrame(update));
    update();
  }
})();
