/** PLUX V12.6: clear crystal glyphs and direct microphone activation. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const svg=paths=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".6" stop-color="#dbfff0"/><stop offset="1" stop-color="#84d8c3"/></linearGradient></defs><g stroke="url(#g)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">'+paths+'</g></svg>';
const icons={
 keyboard:svg('<rect x="8" y="17" width="48" height="30" rx="5"/><path d="M15 25h3m7 0h3m8 0h3m7 0h3M15 32h3m7 0h3m8 0h3m7 0h3M21 40h22"/>'),
 camera:svg('<path d="M13 21h10l4-6h12l4 6h8a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V26a5 5 0 0 1 5-5Z"/><circle cx="32" cy="35" r="9"/><circle cx="32" cy="35" r="4"/>')
};
for(const [id,key] of [['open-chat-quick','keyboard'],['open-create-quick','camera']]){
 const b=$(id);if(!b)continue;b.querySelector('.plux126-glyph')?.remove();
 const img=document.createElement('img');img.className='plux126-glyph';
 img.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(icons[key]);
 img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');b.append(img);
}
const btn=$('voice-toggle'),screen=$('screen-voice'),title=$('voice-toplabel'),statusEl=$('voice-status'),wave=$('audio-wave');
if(!btn||!screen||!title||!statusEl)return;
let stream=null,ctx=null,analyser=null,source=null,frame=0,deadline=0,busy=false,live=false,ticket=0;
const message=(a,b)=>{title.textContent=a;statusEl.textContent=b};
const stopTracks=s=>{try{s?.getTracks().forEach(t=>t.stop())}catch{}};
function stop(note){
 ticket++;busy=false;live=false;cancelAnimationFrame(frame);clearTimeout(deadline);
 stopTracks(stream);stream=null;try{source?.disconnect()}catch{}source=null;analyser=null;
 try{ctx?.close().catch(()=>{})}catch{}ctx=null;
 screen.classList.remove('plux126-on','plux126-request');
 btn.classList.remove('live');btn.setAttribute('aria-pressed','false');
 btn.setAttribute('aria-label','Включить микрофон');
 for(const bar of wave?.children||[])bar.style.removeProperty('height');
 if(note)message('PLUX слушает...',note);
}
function meter(n){
 if(!live||n!==ticket||!analyser||!wave)return;
 const d=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(d);
 let sum=0;for(const x of d){const y=(x-128)/128;sum+=y*y}
 const power=Math.min(1,Math.sqrt(sum/d.length)*6),count=wave.children.length;
 for(let i=0;i<count;i++){
  const taper=1-Math.abs(i-(count-1)/2)/(count/2);
  const height=3+taper*(8+75*power)*(.65+.35*Math.sin(performance.now()/170+i*.4)**2);
  wave.children[i].style.setProperty('height',height.toFixed(1)+'px','important');
 }
 frame=requestAnimationFrame(()=>meter(n));
}
async function toggle(){
 if(live){stop('Микрофон выключен. Нажми, чтобы включить снова.');return}
 if(busy)return;busy=true;const n=++ticket;screen.classList.add('plux126-request');
 message('Разрешение микрофона…','Разреши доступ к микрофону, если браузер спросит.');
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
  stop();message('Нет доступа к микрофону','Открой приложение по HTTPS в Chrome или другом современном браузере.');return;
 }
 let timedOut=false;
 deadline=setTimeout(()=>{
  if(n!==ticket||!busy)return;
  timedOut=true;stop();message('Микрофон не отвечает','Проверь разрешение для сайта в браузере и нажми ещё раз.');
 },11000);
 try{
  const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  clearTimeout(deadline);
  if(timedOut||n!==ticket){stopTracks(media);return}
  stream=media;busy=false;live=true;screen.classList.remove('plux126-request');
  screen.classList.add('plux126-on');btn.classList.add('live');
  btn.setAttribute('aria-pressed','true');btn.setAttribute('aria-label','Выключить микрофон');
  message('Микрофон включён','Уровень звука реагирует на голос. Для ответов ИИ нужно подключить голосовой сервер.');
  media.getAudioTracks().forEach(t=>t.addEventListener('ended',()=>{
   if(n===ticket)stop('Микрофон отключён системой.');
  },{once:true}));
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(Audio){ctx=new Audio();await ctx.resume();if(!live||n!==ticket)return;
    analyser=ctx.createAnalyser();analyser.fftSize=512;
    source=ctx.createMediaStreamSource(stream);source.connect(analyser);meter(n);
   }
  }catch{statusEl.textContent='Микрофон включён. Индикатор звука недоступен в этом браузере. Для ответов ИИ нужен сервер.'}
 }catch(e){
  clearTimeout(deadline);if(timedOut||n!==ticket)return;stop();
  const denied=['NotAllowedError','PermissionDeniedError','SecurityError'].includes(e?.name);
  message(denied?'Нет разрешения на микрофон':'Не удалось включить микрофон',
   denied?'Настройки сайта → Разрешения → Микрофон → Разрешить.':'Проверь микрофон и нажми ещё раз.');
 }
}
btn.onclick=e=>{e.preventDefault();void toggle()};
const end=()=>{if(busy||live)stop()};
$('voice-back')?.addEventListener('click',end,{capture:true});
$('voice-end')?.addEventListener('click',end,{capture:true});
screen.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',end,{capture:true}));
new MutationObserver(()=>{if(screen.hidden&&(busy||live))stop()}).observe(screen,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(busy||live))stop()});
window.addEventListener('pagehide',end);
window.PLUX126={active:()=>live,pending:()=>busy};
})();