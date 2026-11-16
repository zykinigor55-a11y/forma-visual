/* FORMA / Upload next step v14. No AI requests are started by this interface. */
(() => {
 'use strict';
 const sheetId='formaUploadNextSheet',barId='formaUploadNextBar';
 let previousFocus=null,lastProjectId=null;
 const $=(query,root=document)=>root.querySelector(query);
 const get=()=>window.FORMA_SCENE_BRIDGE?.get?.()||null;
 function ready(){return !!get()?.hasSource}
 function ensureBar(){
  const viewer=$('.viewer-card');if(!viewer)return null;
  let bar=$('#'+barId);if(bar)return bar;
  bar=document.createElement('div');bar.id=barId;bar.className='forma-upload-next-bar';bar.hidden=true;
  bar.innerHTML='<span class="forma-upload-next-step">ШАГ 02 / 03</span>'+
   '<span class="forma-upload-next-bar-copy"><strong>Исходник готов</strong><small>Выберите действие для своего дома</small></span>'+
   '<button type="button" class="forma-upload-next-open" aria-label="Выбрать следующий шаг">Что дальше <span aria-hidden="true">↗</span></button>';
  const anchor=viewer.querySelector('.forma-scene-quick')||viewer.querySelector('.viewer-toolbar');
  if(anchor)anchor.insertAdjacentElement('afterend',bar);else viewer.prepend(bar);
  bar.querySelector('button').addEventListener('click',open);
  return bar;
 }
 function refreshBar(){
  const data=get(),bar=ensureBar();if(!bar)return;
  // After receiving an AI result the result-studio workflow becomes the next step.
  const visible=!!data?.hasSource&&!data?.hasRender;
  bar.hidden=!visible;
 }
 function buildSheet(){
  let overlay=$('#'+sheetId);if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id=sheetId;
  overlay.className='forma-upload-next-backdrop';overlay.hidden=true;
  overlay.innerHTML=
   '<div class="forma-upload-next-scrim" data-upload-next-close></div>'+
   '<section class="forma-upload-next-dialog" role="dialog" aria-modal="true" aria-labelledby="formaUploadNextTitle">'+
    '<header class="forma-upload-next-head">'+
     '<div><span class="forma-upload-next-kicker">ФОРМА / СЛЕДУЮЩИЙ ШАГ</span><span class="forma-upload-next-count">02 <i></i> 03</span></div>'+
     '<button type="button" class="forma-upload-next-close" data-upload-next-close aria-label="Закрыть подсказку">×</button>'+
    '</header>'+
    '<div class="forma-upload-next-loaded">'+
     '<img id="formaUploadNextImage" alt="Загруженное изображение дома" src="" />'+
     '<div><span class="forma-upload-next-success"><span aria-hidden="true">✓</span> ИЗОБРАЖЕНИЕ ЗАГРУЖЕНО</span>'+
     '<strong id="formaUploadNextFile">Исходный кадр</strong><small>Исходная геометрия будет основой следующего рендера</small></div>'+
    '</div>'+
    '<h2 id="formaUploadNextTitle">Что делаем с домом?</h2>'+
    '<p class="forma-upload-next-intro">Выберите, как хотите продолжить. Генерация не запускается автоматически.</p>'+
    '<div class="forma-upload-next-choices">'+
     '<button type="button" class="forma-upload-next-choice is-primary" data-upload-next-action="scene">'+
      '<span class="forma-upload-next-symbol" aria-hidden="true">☼</span><span><strong>Настроить окружение и солнце</strong><small>Ландшафт, погода, сезон, направление света</small></span><span aria-hidden="true">↗</span></button>'+
     '<button type="button" class="forma-upload-next-choice" data-upload-next-action="render">'+
      '<span class="forma-upload-next-symbol" aria-hidden="true">▧</span><span><strong>Сделать фотореалистичный рендер</strong><small>Выбрать готовую атмосферу и запустить AI</small></span><span aria-hidden="true">↗</span></button>'+
     '<button type="button" class="forma-upload-next-choice" data-upload-next-action="materials">'+
      '<span class="forma-upload-next-symbol" aria-hidden="true">▤</span><span><strong>Изменить материалы и цвета</strong><small>Стены, кровля, окна, фасады</small></span><span aria-hidden="true">↗</span></button>'+
    '</div>'+
    '<label class="forma-upload-next-prompt" for="formaUploadNextPrompt"><strong>Пожелания к рендеру <span>необязательно</span></strong>'+
     '<textarea id="formaUploadNextPrompt" rows="2" maxlength="500" placeholder="Например: большие сосны, солнечный вечер, не менять фасад и ракурс"></textarea></label>'+
    '<footer class="forma-upload-next-footer"><span>Переход к настройкам бесплатный · AI запускается отдельно</span>'+
    '<button type="button" data-upload-next-close>Позже</button></footer>'+
   '</section>';
  document.body.append(overlay);
  overlay.addEventListener('click',event=>{
   const choice=event.target.closest('[data-upload-next-action]');
   if(choice){go(choice.dataset.uploadNextAction);return}
   if(event.target.closest('[data-upload-next-close]'))close();
  });
  overlay.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab')return;
   const focusable=Array.from(overlay.querySelectorAll('button:not([disabled]),textarea:not([disabled])')).filter(el=>el.getClientRects().length);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
  return overlay;
 }
 function open(data){
  if(!ready())return;
  const overlay=buildSheet(),info=get();
  previousFocus=document.activeElement;
  const preview=$('#formaUploadNextImage',overlay);
  preview.src=info?.sourceImage||'';
  const name=$('#formaUploadNextFile',overlay);
  name.textContent=(data?.sourceName||'Мой проект').slice(0,75);
  $('#formaUploadNextPrompt',overlay).value='';
  overlay.hidden=false;
  document.documentElement.classList.add('forma-upload-next-opened');
  $('#formaUploadNextPrompt',overlay).blur();
  overlay.querySelector('[data-upload-next-action="scene"]')?.focus({preventScroll:true});
 }
 function close(){
  const overlay=$('#'+sheetId);if(!overlay||overlay.hidden)return;
  overlay.hidden=true;
  document.documentElement.classList.remove('forma-upload-next-opened');
  if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
  previousFocus=null;
  refreshBar();
 }
 function savePrompt(action){
  const text=$('#formaUploadNextPrompt')?.value?.trim().slice(0,500);
  if(!text)return;
  const id=action==='materials'?'simpleMaterialPrompt':'homeChangesInput';
  const target=$('#'+id);
  if(!target)return;
  target.value=text;
  target.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function tab(id){
  const target=$('[data-mobile="'+id+'"]')||$('[data-tab="'+id+'"]');
  target?.click();
  if(!target){$('#inspector')?.scrollIntoView({behavior:'smooth',block:'start'})}
 }
 function go(action){
  if(!ready())return close();
  savePrompt(action);close();
  if(action==='scene'){
   if(window.FORMA_SUN_STUDIO?.open)window.FORMA_SUN_STUDIO.open();
   else if(window.FORMA_SCENE_QUICK?.open)window.FORMA_SCENE_QUICK.open();
   else tab('environment');
   return;
  }
  if(action==='render'){tab('environment');return}
  if(action==='materials'){tab('materials');return}
 }
 function handleUploaded(event){
  if(document.body.classList.contains('fa-unified-studio')){refreshBar();return;}
  const detail=event.detail||{},info=get();
  if(!info?.hasSource)return;
  lastProjectId=detail.projectId||lastProjectId;
  refreshBar();
  // The first step after uploading is now SUN STUDIO, not a generic menu.
  requestAnimationFrame(()=>{
   if(window.FORMA_SUN_STUDIO?.open)window.FORMA_SUN_STUDIO.open();
   else open({sourceName:detail.sourceName||'Исходный кадр'});
  });
 }
 function handleProjectReady(event){
  lastProjectId=event.detail?.projectId||lastProjectId;
  refreshBar();
 }
 function init(){
  ensureBar();buildSheet();refreshBar();
  document.addEventListener('forma:source-uploaded',handleUploaded);
  document.addEventListener('forma:project-ready',handleProjectReady);
  // Existing projects may initialize after DOMContentLoaded.
  if(!ready())setTimeout(refreshBar,700);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FORMA_UPLOAD_NEXT={open,close,refresh:refreshBar};
})();