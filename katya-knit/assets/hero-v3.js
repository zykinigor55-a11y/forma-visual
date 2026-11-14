(()=>{
'use strict';
const video=document.getElementById('hero-video');
const fallback=document.getElementById('video-replay');
const intro=document.getElementById('site-intro');
const introFilm=document.getElementById('intro-film');
const skip=document.getElementById('intro-skip');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(max-width:700px)').matches;
if(video){
 video.muted=true;video.defaultMuted=true;video.playsInline=true;
 video.setAttribute('muted','');video.setAttribute('playsinline','');video.preload='auto';
 video.poster=mobile?'assets/hero-mobile-poster.webp':'assets/hero-poster.webp';
 const url=mobile?'assets/hero-mobile-final-loop.mp4':'assets/hero-living-canvas.mp4';
 video.querySelector('source').src=url;video.load();
 const play=()=>{if(reduced)return;video.play().then(()=>{if(fallback)fallback.hidden=true}).catch(()=>{if(fallback)fallback.hidden=false})};
 fallback?.addEventListener('click',play);
 video.addEventListener('error',()=>{if(fallback)fallback.hidden=false});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else play()});
 document.addEventListener('pointerdown',()=>{if(video.paused)play()},{once:true,passive:true});
 play();
}
if(!intro||!introFilm)return;
let removed=false;
const finish=()=>{
 if(removed)return;
 removed=true;intro.classList.add('is-done');
 try{sessionStorage.setItem('katya-intro-film-seen-v2','yes')}catch{}
 setTimeout(()=>{introFilm.pause();intro.remove()},770);
};
let wasSeen=false;
try{wasSeen=sessionStorage.getItem('katya-intro-film-seen-v2')==='yes'}catch{}
if(wasSeen||reduced){intro.remove();return}
introFilm.muted=true;introFilm.defaultMuted=true;introFilm.playsInline=true;
const fallbackIntro=()=>{intro.classList.add('has-error');setTimeout(finish,1600)};
introFilm.addEventListener('ended',finish,{once:true});
introFilm.addEventListener('error',fallbackIntro,{once:true});
skip?.addEventListener('click',finish);
introFilm.play().catch(fallbackIntro);
setTimeout(finish,10000);
})();
