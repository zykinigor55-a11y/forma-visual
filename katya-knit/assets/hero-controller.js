(()=>{'use strict';
const video=document.getElementById('hero-video');
const loader=document.getElementById('site-intro');
const skip=document.getElementById('intro-skip');
const count=document.getElementById('intro-count');
const manual=document.getElementById('video-replay');
if(!video)return;
// Set a definite source for each screen size. Avoid <source media> video selection differences.
const mobile=window.matchMedia('(max-width: 700px)').matches;
const source=mobile?'assets/hero-mobile-final-loop.mp4':'assets/hero-living-canvas.mp4';
video.muted=true;
video.defaultMuted=true;
video.setAttribute('muted','');
video.setAttribute('playsinline','');
video.setAttribute('webkit-playsinline','');
video.playsInline=true;
video.preload='auto';
video.poster=mobile?'assets/hero-mobile-poster.webp':'assets/hero-poster.webp';
const element=video.querySelector('source');
if(element)element.src=source;
video.load();
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=!!navigator.connection?.saveData;
let ready=false;
let closed=false;
const started=Date.now();
const MIN_INTRO=1550;
function endIntro(){
 if(closed)return;
 closed=true;
 if(loader){
   loader.classList.add('is-done');
   window.setTimeout(()=>loader.remove(),720);
 }
}
function updateProgress(){
 if(closed)return;
 const elapsed=Date.now()-started;
 if(count){let v=Math.min(99,Math.max(1,Math.round(elapsed/2800*100)));count.textContent=String(v).padStart(2,'0')+' / 100';}
 if(elapsed>=MIN_INTRO && ready){if(count)count.textContent='100 / 100';endIntro()}
}
const progress=window.setInterval(()=>{updateProgress();if(closed)window.clearInterval(progress)},90);
window.setTimeout(()=>{if(!closed){if(count)count.textContent='100 / 100';endIntro()}},4100);
skip?.addEventListener('click',endIntro);
function showManual(){if(manual){manual.hidden=false;manual.removeAttribute('hidden')}}
async function play(){
 if(reduced||saveData){ready=true;updateProgress();return;}
 try{await video.play();ready=true;manual.hidden=true;updateProgress();}
 catch(err){console.warn('KATYA KNIT video autoplay blocked:',err?.name||err);showManual();ready=true;updateProgress()}
}
video.addEventListener('playing',()=>{ready=true;if(manual)manual.hidden=true;updateProgress()});
video.addEventListener('loadeddata',()=>{ready=true;updateProgress()});
video.addEventListener('error',()=>{console.warn('KATYA KNIT media failed:',video.error?.code);showManual();ready=true;updateProgress()});
video.addEventListener('stalled',()=>{console.warn('KATYA KNIT video stalled')});
manual?.addEventListener('click',()=>{video.muted=true;video.play().then(()=>{manual.hidden=true}).catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else play()});
document.addEventListener('pointerdown',()=>{if(!reduced&&!saveData&&video.paused)play()},{once:true,passive:true});
if(document.readyState==='complete'||video.readyState>=2)play();
else window.addEventListener('load',play,{once:true});
window.setTimeout(()=>{if(!ready&&!reduced&&!saveData)play()},1100);
})();
