/* Animation workspace: preserve native controls while restoring moved preview geometry. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const groups={camera:'animCameras',lens:'animLenses',motion:'animMoves',grade:'animGrades'};
const svg=body=>`<svg class="fs-cinema-icon" viewBox="0 0 120 76" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
function equipment(kind,id,index){
 if(kind==='camera'){
  const body=index===3?'<path d="M32 26h39v29H32z M39 26v-5h24v5 M26 33h6v15h-6"/>':index===4?'<path d="M37 25h27l8 9v21H32V33z M42 25v-7h16v7 M25 35h7v14h-7"/>':'<rect x="28" y="28" width="44" height="28" rx="3"/><path d="M37 28v-8h27v8 M42 20v-4h19 M21 35h7v14h-7"/>';
  return svg(body+'<path d="M72 35h13v16H72 M85 32h8v22h-8 M93 35h6v16h-6 M42 56v5h20v-5 M46 61l-5 8 M58 61l5 8"/><circle cx="43" cy="41" r="5"/><path d="M55 36h9 M55 41h9 M55 46h6"/>');
 }
 if(kind==='lens'){
  const length=42+index*3;
  return svg(`<ellipse cx="${32+length}" cy="39" rx="10" ry="22"/><ellipse cx="${32+length}" cy="39" rx="6" ry="15"/><path d="M${32+length} 17H30q-7 0-7 22t7 22h${2+length} M32 18v42 M42 18v42 M48 18v42 M61 18v42"/><path d="M35 25h4 M35 32h4 M35 39h4 M35 46h4 M35 53h4"/><path d="M53 28h5v22h-5"/>`);
 }
 if(kind==='motion'){
  const route={orbit:'M24 52C8 17 101 9 98 45',dolly:'M60 65V15',drone:'M60 15V65',slider:'M18 46h84',crane:'M31 61V16',walk:'M22 61 99 17'}[id]||'M18 46h84';
  const arrow={orbit:'m91 39 7 7 6-8',dolly:'m53 22 7-7 7 7',drone:'m53 58 7 7 7-7',slider:'m95 39 7 7-7 7',crane:'m24 23 7-7 7 7',walk:'m89 16 10 1-1 10'}[id]||'';
  return svg(`<path d="M44 37 60 28l16 9v17l-16 9-16-9Z" opacity=".35"/><path d="m44 37 16 9 16-9 M60 46v17" opacity=".35"/><path d="${route}" stroke-width="2"/><path d="${arrow}" stroke-width="2"/><circle cx="${id==='dolly'||id==='drone'?60:22}" cy="${id==='dolly'?65:id==='drone'?15:61}" r="3" fill="currentColor"/>`);
 }
 const effects={neutral:'<path d="M48 39h24"/>',filmic:'<circle cx="60" cy="39" r="10"/><circle cx="60" cy="39" r="17" opacity=".35"/>',contrast:'<path d="m48 39 8-4 4-9 4 9 8 4-8 4-4 9-4-9z"/>',warm:'<path d="m45 45 30-12 M45 38l22-9 M53 49l22-9"/>',cool:'<path d="M60 18a21 21 0 0 1 0 42Z" fill="currentColor" opacity=".2"/><path d="M60 18v42"/>',bw:'<path d="M28 39h64 M47 35h26 M47 43h26"/>'};
 return svg('<rect x="31" y="10" width="58" height="58" rx="8"/><circle cx="60" cy="39" r="23"/>'+ (effects[id]||effects.neutral));
}
function decorate(){
 for(const [kind,group] of Object.entries(groups)){
  document.querySelectorAll('#'+group+' .anim-option-card').forEach((card,index)=>{
   const photo=$('.anim-option-photo',card);if(!photo||$('.fs-cinema-icon',photo))return;
   photo.insertAdjacentHTML('beforeend',equipment(kind,card.dataset.animId,index));
  });
 }
}
function enhance(){
 const workspace=$('#formaStudioWorkspace[data-tool="animation"]');if(!workspace)return;
 window.FORMA_CINEMA_UI?.enhance?.();
 const preview=$('.anim-preview-shell',workspace);if(!preview)return;
 if(!$('.fs-cinema-source',preview)){
  const source=document.createElement('div');source.className='fs-cinema-source';
  source.innerHTML='<div><small>ИСХОДНЫЙ КАДР</small><strong>Изображение проекта</strong></div><button type="button" data-cinema-upload><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></svg>Загрузить кадр</button>';
  preview.prepend(source);
  source.addEventListener('click',event=>{if(event.target.closest('[data-cinema-upload]'))window.FORMA_ART_BRIDGE?.upload?.();});
 }
 const title=$('.fs-cinema-source strong',preview),snap=window.FORMA_ART_BRIDGE?.snapshot?.();
 if(title)title.textContent=snap?.hasSource&&!snap.demo?(snap.projectName||'Изображение проекта'):'Выберите фотографию или рендер';
 const caption=$('.anim-preview-caption',preview);if(caption)caption.textContent='Предпросмотр показывает движение и характер оптики. Готовый ролик создаётся по вашему кадру с сохранением архитектуры.';
 decorate();
 window.DOM_RENDER_HOUSE_PREVIEW?.sync?.();
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});}
function start(){
 const panel=$('#animationPanel');if(panel)new MutationObserver(schedule).observe(panel,{childList:true,subtree:true});
 document.addEventListener('forma:workspace-open',event=>{if(event.detail?.id==='animation')enhance();});
 document.addEventListener('forma:source-uploaded',()=>{if($('#formaStudioWorkspace[data-tool="animation"]')){document.querySelector('[data-anim-source="project"]')?.click();schedule();}});
 decorate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
