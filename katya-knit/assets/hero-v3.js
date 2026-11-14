(()=>{
'use strict';
const hero=document.getElementById('hero-video');
const replay=document.getElementById('video-replay');
const intro=document.getElementById('site-intro');
const film=document.getElementById('intro-film');
const launch=document.getElementById('intro-play');
const skip=document.getElementById('intro-skip');
const mobile=window.matchMedia('(max-width:700px)').matches;
let heroLoaded=false;
function startHero(){
 if(!hero||document.hidden)return;
 if(!heroLoaded){
  // Do not compete for bandwidth with the intro film on 4G/Android.
  hero.muted=true;hero.defaultMuted=true;hero.playsInline=true;
  hero.setAttribute('muted','');hero.setAttribute('playsinline','');
  hero.poster=mobile?'assets/hero-mobile-poster.webp':'assets/hero-poster.webp';
  hero.src=mobile?'assets/hero-mobile-final-loop.mp4':'assets/hero-living-canvas.mp4';
  hero.preload='auto';hero.load();heroLoaded=true;
 }
 try{
  const p=hero.play();
  if(p&&typeof p.then==='function')p.then(()=>{if(replay)replay.hidden=true}).catch(()=>{if(replay)replay.hidden=false});
 }catch{if(replay)replay.hidden=false}
}
replay?.addEventListener('click',startHero);
hero?.addEventListener('error',()=>{if(replay)replay.hidden=false});
if(!intro||!film){startHero();return}
let done=false,started=false,trying=false;
const showLaunch=()=>{if(done)return;if(launch)launch.hidden=false;intro.classList.add('needs-interaction')};
const hideLaunch=()=>{if(launch)launch.hidden=true;intro.classList.remove('needs-interaction')};
function closeIntro(){
 if(done)return;
 done=true;hideLaunch();
 intro.classList.add('is-done');
 // Start hero only after the intro, avoiding competing downloads.
 startHero();
 setTimeout(()=>{try{film.pause()}catch{}intro.remove()},780);
}
function beginPlayback(){
 if(done||trying||document.hidden)return;
 trying=true;
 film.muted=true;film.defaultMuted=true;
 film.setAttribute('muted','');
 film.setAttribute('playsinline','');
 film.setAttribute('webkit-playsinline','');
 film.playsInline=true;film.autoplay=true;film.loop=false;
 film.defaultPlaybackRate=1.2;film.playbackRate=1.2;
 try{
  const p=film.play();
  if(p&&typeof p.then==='function'){
   p.then(()=>{trying=false;started=true;hideLaunch();intro.classList.add('is-playing')})
    .catch(e=>{trying=false;console.warn('KATYA KNIT autoplay:',e?.name||'blocked');showLaunch()});
  }else{trying=false}
 }catch(e){trying=false;showLaunch()}
}
function tapPlay(){
 if(done)return;
 // Direct call inside trusted user tap, for Yandex Browser / Android policies.
 film.muted=true;film.setAttribute('muted','');
 film.defaultPlaybackRate=1.2;film.playbackRate=1.2;
 try{
  const p=film.play();
  if(p&&typeof p.then==='function'){
   p.then(()=>{started=true;intro.classList.add('is-playing');hideLaunch()}).catch(showLaunch);
  }
 }catch{showLaunch()}
}
film.addEventListener('loadedmetadata',()=>{film.defaultPlaybackRate=1.2;film.playbackRate=1.2});
film.addEventListener('playing',()=>{started=true;hideLaunch();intro.classList.add('is-playing')});
// The brand text is revealed only after the coloured threads have formed a complete circle.
const revealName=()=>{
 if(!done && film.currentTime>=4.05){intro.classList.add('show-name')}
};
film.addEventListener('timeupdate',()=>{
 if(film.currentTime>=.1){started=true;hideLaunch();intro.classList.add('is-playing')}
 revealName();
});
film.addEventListener('seeked',revealName);
film.addEventListener('ended',()=>{
 // Allow time to read the studio name and tagline after the logo is complete.
 intro.classList.add('show-name');
 window.setTimeout(closeIntro,1550);
},{once:true});
film.addEventListener('error',()=>{console.warn('KATYA KNIT intro media error',film.error?.code);showLaunch()});
film.addEventListener('stalled',()=>{if(!started)showLaunch()});
launch?.addEventListener('click',e=>{e.preventDefault();tapPlay()});
skip?.addEventListener('click',e=>{e.preventDefault();closeIntro()});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(heroLoaded)hero?.pause()}
 else if(done)startHero();
 else if(film.paused)beginPlayback();
});
window.addEventListener('pageshow',()=>{if(!done&&!document.hidden&&film.paused)beginPlayback()});
// Always show the film on a fresh page load. Never skip because of storage.
beginPlayback();
if(film.readyState<2)film.addEventListener('canplay',()=>{if(!done&&film.paused)beginPlayback()},{once:true});
setTimeout(()=>{if(!done&&!started&&!document.hidden)beginPlayback()},1100);
setTimeout(()=>{if(!done&&!started)showLaunch()},3500);
setTimeout(()=>{
 if(!done&&started&&Number.isFinite(film.duration)&&film.currentTime>=film.duration-.25){
  intro.classList.add('show-name');
  setTimeout(closeIntro,1450);
 }
},11000);
})();
