(()=>{
'use strict';
const hero=document.getElementById('hero-video');
const replay=document.getElementById('video-replay');
const intro=document.getElementById('site-intro');
const film=document.getElementById('intro-film');
const launch=document.getElementById('intro-play');
const skip=document.getElementById('intro-skip');
const mobile=window.matchMedia('(max-width:700px)').matches;
// Play the background hero as a normal muted inline video.
if(hero){
 hero.muted=true;hero.defaultMuted=true;hero.playsInline=true;
 hero.setAttribute('muted','');hero.setAttribute('playsinline','');
 hero.preload='auto';
 hero.poster=mobile?'assets/hero-mobile-poster.webp':'assets/hero-poster.webp';
 const url=mobile?'assets/hero-mobile-final-loop.mp4':'assets/hero-living-canvas.mp4';
 const source=hero.querySelector('source');
 if(source)source.src=url;
 hero.load();
 function playHero(){
  try{const p=hero.play();if(p&&typeof p.then==='function')p.then(()=>{if(replay)replay.hidden=true}).catch(()=>{if(replay)replay.hidden=false});}catch{if(replay)replay.hidden=false}
 }
 replay?.addEventListener('click',playHero);
 hero.addEventListener('error',()=>{if(replay)replay.hidden=false});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hero.pause();else playHero()});
 if(!document.hidden)playHero();
}
if(!intro||!film)return;
let done=false;
let started=false;
let trying=false;
const showLaunch=()=>{
 if(done)return;
 if(launch)launch.hidden=false;
 intro.classList.add('needs-interaction');
};
const hideLaunch=()=>{
 if(launch)launch.hidden=true;
 intro.classList.remove('needs-interaction');
};
function closeIntro(){
 if(done)return;
 done=true;hideLaunch();
 intro.classList.add('is-done');
 // No sessionStorage: the animation must play on every fresh site load.
 window.setTimeout(()=>{
  try{film.pause()}catch{}
  intro.remove();
 },780);
}
function beginPlayback(){
 if(done||trying||document.hidden)return;
 trying=true;
 film.muted=true;
 film.defaultMuted=true;
 film.setAttribute('muted','');
 film.setAttribute('playsinline','');
 film.setAttribute('webkit-playsinline','');
 film.playsInline=true;
 film.autoplay=true;
 film.loop=false;
 try{
  const p=film.play();
  if(p&&typeof p.then==='function'){
   p.then(()=>{
    trying=false;
    started=true;
    hideLaunch();
    intro.classList.add('is-playing');
   }).catch(e=>{
    trying=false;
    // Autoplay restrictions on Android require a direct tap to call play().
    // Never replace the film with a static logo on autoplay rejection.
    console.warn('KATYA KNIT intro autoplay:',e?.name||'blocked');
    showLaunch();
   });
  }else{trying=false}
 }catch(e){trying=false;showLaunch()}
}
function startByTap(){
 // Keep play() directly inside the user gesture; no async delay.
 if(done)return;
 film.muted=true;
 film.setAttribute('muted','');
 const p=film.play();
 if(p&&typeof p.then==='function'){
  p.then(()=>{started=true;intro.classList.add('is-playing');hideLaunch()}).catch(showLaunch);
 }
}
film.addEventListener('playing',()=>{started=true;intro.classList.add('is-playing');hideLaunch()});
film.addEventListener('timeupdate',()=>{if(film.currentTime>=0.1){started=true;intro.classList.add('is-playing');hideLaunch()}});
film.addEventListener('ended',closeIntro,{once:true});
film.addEventListener('error',()=>{
 console.warn('KATYA KNIT intro video load/decode error:',film.error?.code);
 // Don't silently fall back to a static mark. Offer retry / skip.
 showLaunch();
});
film.addEventListener('stalled',()=>{
 // Network stalls happen on mobile. Retry only on a real gesture if blocked.
 if(!started)showLaunch();
});
launch?.addEventListener('click',e=>{e.preventDefault();startByTap()});
skip?.addEventListener('click',closeIntro);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!done&&film.paused)beginPlayback()});
window.addEventListener('pageshow',()=>{if(!done&&!document.hidden&&film.paused)beginPlayback()});
// First attempt immediately from a muted video. Retry once after load if needed.
beginPlayback();
if(film.readyState<2){
 film.addEventListener('canplay',()=>{if(!done&&film.paused)beginPlayback()},{once:true});
}
window.setTimeout(()=>{if(!done&&!started&&!document.hidden)beginPlayback()},1100);
window.setTimeout(()=>{if(!done&&!started)showLaunch()},3500);
// Avoid getting stuck indefinitely after a partial playback.
window.setTimeout(()=>{if(!done&&started&&film.currentTime>=film.duration-.25&&Number.isFinite(film.duration))closeIntro()},11000);
})();
