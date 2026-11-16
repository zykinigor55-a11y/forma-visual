/* Animation workspace: preserve native controls while restoring moved preview geometry. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const groups={camera:'animCameras',lens:'animLenses',motion:'animMoves',grade:'animGrades'};
const svg=body=>`<svg class="fs-cinema-icon" viewBox="0 0 120 76" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
function equipment(kind,id,index){
 const uid='equip-'+kind+'-'+id;
 const defs=`<defs><linearGradient id="${uid}-body" x2=".8" y2="1"><stop stop-color="#89939b"/><stop offset=".4" stop-color="#363e46"/><stop offset="1" stop-color="#151c24"/></linearGradient><linearGradient id="${uid}-side" x2="1" y2="1"><stop stop-color="#5f6a73"/><stop offset="1" stop-color="#20272e"/></linearGradient><radialGradient id="${uid}-glass"><stop stop-color="#678a92"/><stop offset=".5" stop-color="#25394c"/><stop offset="1" stop-color="#0d151e"/></radialGradient></defs>`;
 const body=`fill="url(#${uid}-body)" stroke="#a4aeb5" stroke-width=".7"`,side=`fill="url(#${uid}-side)" stroke="#8f9ba4" stroke-width=".7"`;
 if(kind==='camera'){
  const models={alexa35:[24,29,48,29,'35'],alexamini:[32,30,36,26,'LF'],venice2:[23,29,51,27,'V2'],vraptor:[34,25,32,33,'X'],komodox:[34,24,31,35,'C'],ursa:[22,28,52,30,'12K']};
  const [x,y,w,h,mark]=models[id]||models.alexa35;
  return svg(defs+`<ellipse cx="61" cy="67" rx="43" ry="4" fill="#000" stroke="none" opacity=".18"/><path d="M${x} ${y}l10-7h${w}l-10 7Z" ${side}/><path d="M${x+w} ${y}l10-7v${h}l-10 7Z" ${side}/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" ${body}/><path d="M${x+8} ${y-5}v-8h${w-14}v8" stroke="#bac3c8" stroke-width="3"/><path d="M${x-6} ${y+8}h6v13h-6Z" ${side}/><path d="M${x+w} ${y+9}h17v17h-17Z" ${body}/><ellipse cx="${x+w+17}" cy="${y+17.5}" rx="7" ry="12" ${side}/><ellipse cx="${x+w+18}" cy="${y+17.5}" rx="4.6" ry="8.5" fill="url(#${uid}-glass)" stroke="#9caaa9"/><circle cx="${x+8}" cy="${y+10}" r="2.5" fill="#a9b4b8"/><path d="M${x+6} ${y+h-7}h12 M${x+6} ${y+h-4}h12" stroke="#849197"/><text x="${x+w-6}" y="${y+13}" text-anchor="end" fill="#e4e9eb" stroke="none" font-size="7" font-family="Arial">${mark}</text>`);
 }
 if(kind==='lens'){
  const lengths={ultra14:38,shift24:42,cine35:46,cine50:49,portrait85:56,macro100:63},length=lengths[id]||46,end=26+length;
  return svg(defs+`<ellipse cx="60" cy="66" rx="43" ry="4" fill="#000" stroke="none" opacity=".18"/><path d="M26 21h${length}v39H26Z" ${body}/><ellipse cx="26" cy="40.5" rx="7" ry="19.5" ${side}/><path d="M34 22v37 M39 22v37 M46 22v37 M51 22v37" stroke="#9ba6ac" stroke-width="2"/><ellipse cx="${end}" cy="40.5" rx="11" ry="22" ${side}/><ellipse cx="${end+1}" cy="40.5" rx="8" ry="17" fill="url(#${uid}-glass)" stroke="#aab7bc"/><ellipse cx="${end+3}" cy="37" rx="3" ry="9" stroke="#a2b9c1" opacity=".5"/><path d="M56 27h10" stroke="#e3c694" stroke-width="2"/>`);
 }
 if(kind==='motion'){
  const route={orbit:'M24 52C8 17 101 9 98 45',dolly:'M60 65V15',drone:'M60 15V65',slider:'M18 46h84',crane:'M31 61V16',walk:'M22 61 99 17'}[id]||'M18 46h84';
  const arrow={orbit:'m91 39 7 7 6-8',dolly:'m53 22 7-7 7 7',drone:'m53 58 7 7 7-7',slider:'m95 39 7 7-7 7',crane:'m24 23 7-7 7 7',walk:'m89 16 10 1-1 10'}[id]||'';
  return svg(`<path d="M44 37 60 28l16 9v17l-16 9-16-9Z" opacity=".35"/><path d="m44 37 16 9 16-9 M60 46v17" opacity=".35"/><path d="${route}" stroke-width="2"/><path d="${arrow}" stroke-width="2"/><circle cx="${id==='dolly'||id==='drone'?60:22}" cy="${id==='dolly'?65:id==='drone'?15:61}" r="3" fill="currentColor"/>`);
 }
 const glass={neutral:'#95bcc0',filmic:'#84918c',contrast:'#bdac82',warm:'#4a7175',cool:'#303e4a',bw:'#5476a2'}[id]||'#95bcc0';
 return svg(defs+`<ellipse cx="61" cy="67" rx="32" ry="4" fill="#000" stroke="none" opacity=".18"/><ellipse cx="62" cy="38" rx="28" ry="29" ${side}/><ellipse cx="58" cy="35" rx="28" ry="29" ${body}/><ellipse cx="58" cy="35" rx="23" ry="24" fill="${glass}" fill-opacity=".32" stroke="#b0bec1"/><path d="M44 20 68 49 M49 17l24 29" stroke="#dbe4e7" opacity=".4"/>${id==='bw'?'<path d="M35 35h46" stroke="#7cb7ff" stroke-width="2"/>':''}${id==='warm'?'<path d="M39 49 75 22" stroke="#a9d0d0" opacity=".6"/>':''}`);

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
