/* DOM.RENDER — cinema house preview v46
 * One exact demo image. Optical zoom and restrained 2D camera-motion emulation.
 * This is NOT a 3D reconstruction; previously hidden building sides remain unknown.
 */
(function(){
 'use strict';
 const DEMO='/assets/%D0%A1%D0%BE%D0%B2%D1%80%D0%B5%D0%BC%D0%B5%D0%BD%D0%BD%D1%8B%D0%B9%20%D0%B4%D0%BE%D0%BC%20%D1%81%20%D0%B1%D0%B0%D1%81%D1%81%D0%B5%D0%B9%D0%BD%D0%BE%D0%BC.png';
 const $=id=>document.getElementById(id);
 const lensScale={ultra14:1.02,shift24:1.15,cine35:1.33,cine50:1.55,portrait85:1.93,macro100:2.28};
 const focal={ultra14:18,shift24:25,cine35:35,cine50:47,portrait85:75,macro100:95};
 const cameraFX={alexa35:'contrast(1.045) saturate(.96)',alexamini:'contrast(.985) saturate(.98)',venice2:'contrast(1.09) saturate(.94)',vraptor:'contrast(1.16) saturate(1.05)',komodox:'contrast(1.035) saturate(1.07) sepia(.025)',ursa:'contrast(1.085) saturate(1.04)'};
 const gradeFX={neutral:'',filmic:'brightness(1.04) contrast(.9)',contrast:'brightness(1.045) contrast(.94)',warm:'saturate(1.16) contrast(1.07)',cool:'brightness(.59)',bw:'contrast(1.02) saturate(.94)'};
 let stage=null,frame=null,photo=null,animation=null,progressAnim=null,preview4K=null,enhancing=false;
 let lastLens='',lastMotion='',lastGrade='',posterURL='';
 const selected=id=>$(id)?.querySelector('.anim-option-card.active')?.dataset.animId||'';
 const activeDemo=()=>document.querySelector('#animationPanel [data-anim-source="demo"]')?.classList.contains('active');
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 function read(){
  const s=window.DOM_RENDER_ANIMATION?.normalize?.({})||{};
  return {lens:selected('animLenses')||s.lens||'cine35',
   motion:selected('animMoves')||s.motion||'orbit',
   grade:selected('animGrades')||s.grade||'neutral',
   camera:selected('animCameras')||s.camera||'alexa35'};
 }
 function reset(){
  animation?.cancel();animation=null;
  progressAnim?.cancel();progressAnim=null;
  if(frame)frame.classList.remove('is-playing');
  stage?.classList.remove('cinema-playing');
 }
 function photoLook(s){
  if(!photo)return;
  photo.style.filter=(cameraFX[s.camera]||'')+' '+(gradeFX[s.grade]||'');
 }
 function sync(){
  if(!frame||!stage)return;
  const s=read(),zoom=lensScale[s.lens]||1.33;
  if(s.lens!==lastLens||s.motion!==lastMotion||s.grade!==lastGrade)reset();
  if(!animation)frame.style.transform='translate3d(0,0,0) scale('+zoom+')';
  frame.style.transformOrigin='50% 50%';
  photoLook(s);
  stage.dataset.cinemaMotion=s.motion;
  const l=$('cinemaLensLabel');
  if(l)l.textContent=(focal[s.lens]||35)+' мм';
  lastLens=s.lens;lastMotion=s.motion;lastGrade=s.grade;
  // Source of truth: app.js, which chooses the current project's image.
 }
 function motionKeyframes(id,z,intensity){
  const k=intensity,scale=n=>+(z*n).toFixed(4),p=n=>+(n*k).toFixed(2)+'%';
  const mk=(x,y,s,rot=0)=>({transform:'translate3d('+p(x)+','+p(y)+',0) rotate('+rot+'deg) scale('+scale(s)+')'});
  switch(id){
   case 'dolly':return [mk(0,0,.91),mk(0,0,1.24)];
   case 'drone':return [mk(0,0,1.25),mk(0,0,.93)];
   case 'slider':return [mk(-7,0,1.085),mk(7,0,1.085)];
   case 'crane':return [mk(0,7,1.10),mk(0,-7,1.10)];
   case 'walk':return [mk(-7,3,1.15,-.4),mk(7,-3,1.035,.4)];
   case 'orbit':default:return [mk(-5,1,1.095,-.45),mk(5,-1,1.13,.45)];
  }
 }
 function play(){
  if(!stage||!frame)return;
  reset();
  const s=read(),z=lensScale[s.lens]||1.33;
  let settings={duration:6,intensity:'low'};
  try{
   const extra=window.DOM_RENDER_ANIMATION;
   if(extra&&window.localStorage){/* use the actual visible controls below */}
  }catch(e){}
  settings.duration=Math.max(2,Math.min(12,Number($('animDuration')?.value)||6));
  settings.intensity=$('animIntensity')?.value||'low';
  const move=settings.intensity==='moderate'?1.28:1;
  if(reduced()){frame.style.transform='scale('+z+')';return}
  stage.classList.add('cinema-playing');
  const options={duration:settings.duration*1000,easing:'cubic-bezier(.35,.03,.65,.97)',fill:'forwards'};
  const keyframes=motionKeyframes(s.motion,z,move);
  try{
   animation=frame.animate(keyframes,options);
   animation.onfinish=()=>{if(!frame)return;frame.style.transform=keyframes.at(-1).transform;animation?.cancel();animation=null;stage.classList.remove('cinema-playing')};
   const bar=$('cinemaProgressBar');
   if(bar)progressAnim=bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:options.duration,easing:'linear',fill:'forwards'});
  }catch(e){frame.style.transform=keyframes.at(-1).transform;stage.classList.remove('cinema-playing')}
 }
 function installControls(){
  if(!stage||$('cinemaFullscreen'))return;
  const full=document.createElement('button');
  full.type='button';full.id='cinemaFullscreen';full.className='cinema-fullscreen';
  full.setAttribute('aria-label','Увеличить предпросмотр');
  full.title='Полный экран';
  full.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>';
  stage.appendChild(full);
  const track=document.createElement('div');track.className='cinema-progress-track';
  track.innerHTML='<span id="cinemaProgressBar"></span>';
  stage.appendChild(track);
  full.addEventListener('click',e=>{
   e.stopPropagation();
   const maximizing=!stage.classList.contains('cinema-maximized');
   stage.classList.toggle('cinema-maximized',maximizing);
   document.body.classList.toggle('cinema-preview-open',maximizing);
   full.setAttribute('aria-label',maximizing?'Закрыть полный экран':'Увеличить предпросмотр');
  });
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('cinema-maximized')){stage.classList.remove('cinema-maximized');document.body.classList.remove('cinema-preview-open')}});
 }
 function start(){
  stage=$('animPreviewScreen');frame=$('animPreviewFrame');photo=$('animPreviewImage');
  if(!stage||!frame||!photo)return;
  installControls();
  // Do not set an independent demo image here: app.js owns the preview src.
  const button=$('animPlayPreview');
  if(button)button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();play()},{capture:true});
  document.getElementById('animationPanel')?.addEventListener('click',event=>{
    const option=event.target.closest('[data-anim-kind][data-anim-id]');
    const source=event.target.closest('[data-anim-source]');
    if(option||source){
     window.setTimeout(()=>{
      sync();
      if(option&&option.dataset.animKind==='motion')play();
     },0);
    }
  },{capture:true});
  for(const id of ['animIntensity','animRatio','animDuration'])$(id)?.addEventListener('change',()=>window.setTimeout(sync,0));
  // The source image is set by renderAnimationPanel() whenever the project changes.
  sync();
  window.addEventListener('pageshow',sync);
 }
 window.DOM_RENDER_HOUSE_PREVIEW={sync};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
