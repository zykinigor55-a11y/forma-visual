/* FORMA ARCHVIZ STUDIO
   Added non-destructively on top of the legacy DOM.RENDER application.
   Real actions reuse existing navigation, rendering and cabinet handlers.
   QA is visual-only; 4K export is pixel resizing, not AI super-resolution. */
(() => {
 'use strict';
 const $ = (s,root=document) => root.querySelector(s);
 const $$ = (s,root=document) => [...root.querySelectorAll(s)];
 const node = (tag,cls,html) => {
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(html!==undefined)el.innerHTML=html;
  return el;
 };
 const icons = {
  search:'<svg class="ico" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 6 6"/></svg>',
  layers:'<svg class="ico"><use href="#i-layer"/></svg>',
  image:'<svg class="ico"><use href="#i-image"/></svg>',
  download:'<svg class="ico"><use href="#i-download"/></svg>',
  check:'<svg class="ico"><use href="#i-check"/></svg>'
 };
 let qaActive=false, qaMode='blend', previousView='slider', edgeSignature='';
 let commandBackdrop=null;
 function toast(message){
  let el=$('#formaStudioToast');
  if(!el){
   el=node('div','', '');el.id='formaStudioToast';el.setAttribute('role','status');
   el.style.cssText='position:fixed;z-index:2600;left:50%;bottom:25px;transform:translateX(-50%);background:#1d3030;color:white;border:1px solid #405453;padding:11px 19px;border-radius:9px;font:600 12px Inter,Arial,sans-serif;box-shadow:0 12px 40px #0004;max-width:90%;text-align:center';
   document.body.append(el);
  }
  el.textContent=message;el.hidden=false;
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true},4200);
 }
 function navigate(where){
  const b=$('[data-nav="'+where+'"]') || $('[data-tab="'+where+'"]');
  if(b){b.click();return true}return false;
 }
 function gallery(){
  const opener=$('[data-open-cabinet="account"]');
  if(!opener){toast('Галерея недоступна в этой версии');return}
  opener.click();
  requestAnimationFrame(()=>$('[data-cabinet-tab="gallery"]')?.click());
 }
 function setupBrand(){
  const rail=$('.rail'),nav=$('.rail-nav');
  if(rail && nav && !$('.forma-rail-brand')){
   const brand=node('div','forma-rail-brand',
    '<span class="forma-brand-symbol" aria-hidden="true"><img src="assets/brand/forma-fa-mark.svg" alt="" width="30" height="30"></span><span class="forma-brand-copy"><strong>ФОРМА</strong><small>АРХИТЕКТУРНАЯ ВИЗУАЛИЗАЦИЯ</small></span>');
   rail.insertBefore(brand,nav);
   nav.prepend(node('div','forma-nav-section','РАБОЧАЯ СТУДИЯ'));
   const btn=(label,icon,action)=>{
    const b=node('button','rail-btn',icon+'<span class="rail-name">'+label+'</span>');
    b.type='button';b.setAttribute('data-studio-action',action);
    b.setAttribute('title',label);b.setAttribute('aria-label',label);nav.append(b);
   };
   btn('Проверка',icons.layers,'qa');
   btn('Галерея',icons.image,'gallery');
   const railLast=$('.rail-monogram');
   if(railLast && !railLast.querySelector('img'))railLast.innerHTML='<img src="assets/brand/forma-fa-mark.svg" alt="" width="22" height="22">';
   const version=$('.build-version');if(version)version.textContent='СТУДИЯ · 01';
  }
 }
 function setupContext(){
  const workspace=$('#workspace'), intro=$('.page-intro');
  if(!workspace||!intro)return;
  const section=node('div','forma-context-bar',
   '<div class="forma-context-breadcrumbs"><span>ФОРМА</span><span>/</span><b>РАБОЧАЯ СТУДИЯ</b></div>'+
   '<div class="forma-context-actions">'+
   '<span class="forma-chip" id="formaServerState" data-server="offline" title="Статус сервера рендера"><span></span><b>Проверка сервера</b></span>'+
   '<button type="button" class="forma-mini-btn" data-studio-action="gallery">'+icons.image+' Галерея</button>'+
   '<button type="button" class="forma-mini-btn" id="formaQaToggle" data-studio-action="qa" aria-pressed="false">'+icons.layers+' Контроль</button>'+
   '<button type="button" class="forma-mini-btn is-primary" data-studio-action="commands">'+icons.search+' Все инструменты <span aria-hidden="true">⌘K</span></button>'+
   '</div>');
  intro.parentNode.insertBefore(section,intro);
  const viewerBtns=$('.viewer-toolbar .viewer-actions');
  if(viewerBtns){
   const exportBtn=node('button','icon-button forma-4k-export','4K');
   exportBtn.type='button';exportBtn.id='forma4KExport';
   exportBtn.title='Экспорт до 3840 пикселей по длинной стороне (масштабирование без AI)';
   exportBtn.setAttribute('aria-label','Экспорт до 4K без AI');
   viewerBtns.insertBefore(exportBtn,viewerBtns.firstChild);
  }
  checkServer();
 }
 async function checkServer(){
  const e=$('#formaServerState');if(!e)return;
  try{
   const res=await fetch('/api/status',{headers:{'Accept':'application/json'},cache:'no-store'});
   if(!res.ok)throw Error('server');
   const d=await res.json();
   e.dataset.server=d.ready?'online':'offline';
   $('b',e).textContent=d.ready?'AI · '+(d.model||'подключён'):'AI не подключён';
   e.title=d.ready?'Сервер и модель доступны. Доступно запросов: '+d.dailyRemaining:'Сервер работает, но API-ключ модели не установлен';
  }catch{
   e.dataset.server='offline';$('b',e).textContent='Сервер недоступен';
   e.title='Проверьте соединение с сервером';
  }
 }
 function setupPresets(){
  const workspace=$('#workspace'),viewer=$('.viewer-card');if(!workspace||!viewer)return;
  const presets=node('section','forma-photo-presets',
    '<div class="forma-photo-caption"><strong>Фотографические сценарии</strong><small>Реальные настройки света и атмосферы сцены</small></div>'+
    '<button type="button" class="forma-photo-card" data-studio-mood="sunny" style="background-image:url(look-noon.jpg)"><span><strong>ДНЕВНАЯ СЪЁМКА</strong><small>Чистый дневной свет</small></span></button>'+
    '<button type="button" class="forma-photo-card" data-studio-mood="overcast" style="background-image:url(look-fog.jpg)"><span><strong>ПАСМУРНЫЙ СВЕТ</strong><small>Мягкая архитектурная подача</small></span></button>'+
    '<button type="button" class="forma-photo-card" data-studio-mood="blue" style="background-image:url(look-dusk.jpg)"><span><strong>СИНИЙ ЧАС</strong><small>Вечер · тёплые окна</small></span></button>');
  viewer.insertAdjacentElement('afterend',presets);
 }
 function setPreset(mood){
  const target=$('[data-scene-demo="'+mood+'"]');
  if(!target){toast('Пресет ещё не подключён к настройкам рендера');return}
  if(qaActive)toggleQA(false);
  navigate('environment');
  const auto=$('[data-render-mode="auto"]');
  if(auto)auto.click();
  target.click();
  $$('[data-studio-mood]').forEach(b=>b.classList.toggle('is-current',b.dataset.studioMood===mood));
  toast('Световой сценарий выбран — настройки рендера обновлены');
 }
 function setupQA(){
  const stage=$('#stage'), viewer=$('.viewer-card'), footer=$('.viewer-footer');
  if(!stage||!viewer||!footer)return;
  const overlay=node('img','');overlay.id='formaQaBefore';overlay.alt='Исходник, наложенный на визуализацию';
  overlay.draggable=false;stage.append(overlay);
  const edge=node('canvas','');edge.id='formaQaEdges';edge.setAttribute('aria-hidden','true');stage.append(edge);
  const panel=node('div','forma-qa-controls',
   '<div class="forma-qa-left"><strong>Визуальный контроль архитектуры</strong>'+
   '<small>Наложение и контуры исходника помогают заметить расхождения. Это не автоматическая проверка размеров.</small></div>'+
   '<div class="forma-qa-actions">'+
   '<button type="button" data-qa-mode="blend" aria-pressed="true">Наложение</button>'+
   '<button type="button" data-qa-mode="edge" aria-pressed="false">Контуры</button>'+
   '<label>Исходник <input type="range" id="formaQAOpacity" min="0" max="100" value="50" aria-label="Прозрачность исходника"><b id="formaQAOpacityOut">50%</b></label>'+
   '</div>');
  panel.id='formaQAControls';panel.hidden=true;
  footer.parentNode.insertBefore(panel,footer);
  $('#formaQAOpacity').addEventListener('input',e=>{
   const v=Number(e.target.value);stage.style.setProperty('--forma-qa-opacity',(v/100).toFixed(2));
   $('#formaQAOpacityOut').textContent=v+'%';
  });
  $$('[data-qa-mode]').forEach(b=>b.addEventListener('click',()=>setQAMode(b.dataset.qaMode)));
  const before=$('#beforeImg');
  if(before) {
   const sync=()=>{overlay.src=before.currentSrc||before.src;edgeSignature='';};
   sync();
   new MutationObserver(sync).observe(before,{attributes:true,attributeFilter:['src','srcset']});
  }
  new MutationObserver(()=>{
   if(qaActive&&stage.classList.contains('edit-mode'))toggleQA(false);
  }).observe(stage,{attributes:true,attributeFilter:['class']});
 }
 function toggleQA(force){
  const stage=$('#stage'),panel=$('#formaQAControls'),before=$('#beforeImg');
  if(!stage||!panel||!before)return;
  const next=typeof force==='boolean'?force:!qaActive;
  if(next&&stage.classList.contains('edit-mode')){
   toast('Закончите выделение материала перед сравнением');return;
  }
  if(next&&!qaActive){
   previousView=$('.view-mode.active')?.dataset.viewMode||'slider';
   $('[data-view-mode="result"]')?.click();
  } else if(!next&&qaActive){
   const prev=$('[data-view-mode="'+previousView+'"]');
   if(prev)prev.click();
  }
  qaActive=next;
  stage.classList.toggle('forma-qa-active',qaActive);
  panel.hidden=!qaActive;
  $$('[data-studio-action="qa"]').forEach(b=>b.setAttribute('aria-pressed',String(qaActive)));
  if(qaActive){
   const img=$('#formaQaBefore');img.src=before.currentSrc||before.src;
   setQAMode(qaMode);
  }
 }
 function setQAMode(mode){
  qaMode=mode;
  const stage=$('#stage');if(!stage)return;
  stage.classList.toggle('forma-qa-edge',mode==='edge');
  $$('[data-qa-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qaMode===mode)));
  $('#formaQAOpacity')?.closest('label')?.classList.toggle('is-hidden',mode==='edge');
  if(mode==='edge')drawEdges();
 }
 function drawEdges(){
  const img=$('#beforeImg'),canvas=$('#formaQaEdges');
  if(!img||!canvas||!img.complete||!img.naturalWidth){toast('Изображение ещё загружается');return}
  const sig=(img.currentSrc||img.src)+':'+img.naturalWidth+'x'+img.naturalHeight;
  if(sig===edgeSignature)return;
  const w=Math.min(1000,img.naturalWidth);
  const h=Math.max(1,Math.round(w*img.naturalHeight/img.naturalWidth));
  const tmp=document.createElement('canvas');tmp.width=w;tmp.height=h;
  const t=tmp.getContext('2d',{willReadFrequently:true});
  if(!t)return;
  try{
   t.drawImage(img,0,0,w,h);
   const data=t.getImageData(0,0,w,h).data;
   const luma=new Float32Array(w*h);
   for(let i=0,j=0;i<data.length;i+=4,j++)luma[j]=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
   canvas.width=w;canvas.height=h;
   const c=canvas.getContext('2d');const out=c.createImageData(w,h);
   for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
     const p=y*w+x;
     const gx=-luma[p-w-1]+luma[p-w+1]-2*luma[p-1]+2*luma[p+1]-luma[p+w-1]+luma[p+w+1];
     const gy=-luma[p-w-1]-2*luma[p-w]-luma[p-w+1]+luma[p+w-1]+2*luma[p+w]+luma[p+w+1];
     const mag=Math.sqrt(gx*gx+gy*gy);
     if(mag>90){
      const at=p*4;out.data[at]=250;out.data[at+1]=186;out.data[at+2]=103;
      out.data[at+3]=Math.min(230,Math.round((mag-65)*1.4));
     }
    }
   }
   c.putImageData(out,0,0);edgeSignature=sig;
  }catch(e){
   setQAMode('blend');
   toast('Контуры недоступны для этого источника изображения');
  }
 }
 async function export4K(){
  const img=$('#afterImg');
  if(!img||!img.complete||!img.naturalWidth){
   toast('Сначала создайте или выберите изображение для экспорта');return;
  }
  const longSide=Math.max(img.naturalWidth,img.naturalHeight);
  if(longSide>=3840){
   $('#downloadResult')?.click();
   toast('Исходный файл уже имеет разрешение не ниже 3840 px по длинной стороне');
   return;
  }
  const scale=3840/longSide;
  const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
  if(w*h>25000000){toast('Слишком большое изображение для экспорта на этом устройстве');return}
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx){toast('Экспорт недоступен');return}
  try{
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(img,0,0,w,h);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   if(!blob)throw Error('empty blob');
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.download='forma-archviz-'+w+'x'+h+'-resized.png';
   a.href=url;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   toast('Экспорт '+w+' × '+h+' готов. Это масштабирование пикселей, не AI-upscale.');
  }catch{
   toast('Не удалось экспортировать изображение. Попробуйте скачать оригинал.');
  }
 }
 const commands=[
  ['Сцена: окружение, погода, сезон и свет','01 · Визуализация','scene'],
  ['Создать экстерьер','01 · Визуализация','exteriorNode'],
  ['Создать интерьер','01 · Визуализация','interiorNode'],
  ['Материалы и локальная правка','02 · Обработка','materialsNode'],
  ['Контроль геометрии','02 · Обработка','geometryNode'],
  ['Увеличение / экспорт 4K','02 · Обработка','upscaleNode'],
  ['Анимация: камера и движение','03 · Видео','videoNode'],
  ['Экспорт кадра или видео','03 · Видео','exportNode'],
  ['Нодовый редактор','04 · Рабочая студия','nodes'],
  ['Камера и оптика','04 · Рабочая студия','camera'],
  ['CAD Bridge','04 · Рабочая студия','cad'],
  ['3D-мир','04 · Рабочая студия','world'],
  ['Создание 3D из изображения','04 · Рабочая студия','image3d'],
  ['Альбом проекта','04 · Рабочая студия','presentation'],
  ['Новый проект','05 · Проект','new'],
  ['Загрузить исходник','05 · Проект','upload'],
  ['История вариантов','05 · Проект','variants'],
  ['Галерея изображений','05 · Проект','gallery'],
  ['Параметры изображения','05 · Проект','parameters'],
  ['AI-модели и подключение','06 · Система','models'],
  ['Аккаунт и тарифы','06 · Система','account'],
  ['Контроль публикации','06 · Система','release']
 ];
 function runCommand(cmd){
  closeCommands();
  const nodeTypes={scene:'exterior',exteriorNode:'exterior',interiorNode:'interior',materialsNode:'materials',geometryNode:'geometry',upscaleNode:'upscale',videoNode:'video',exportNode:'export'};
  if(nodeTypes[cmd]){window.FORMA_NODES?.openFor?.(nodeTypes[cmd]);return}
  if(['variants','parameters'].includes(cmd))navigate(cmd);
  else if(cmd==='new')$('#newProjectBtn')?.click();
  else if(cmd==='upload')$('#sourceFile')?.click();
  else if(cmd==='gallery')gallery();
  else if(cmd==='nodes')window.FORMA_NODES?.open?.();
  else if(['camera','cad','world','image3d','presentation','models','account','release'].includes(cmd)){
   if(cmd==='world'){window.FORMA_HOME_TOOLS?.open?.('world');document.querySelector('#formaProjectPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}
   else window.FORMA_PRO?.open?.(cmd);
  }
 }
 function renderCommands(query=''){
  const list=$('#formaCommandList');if(!list)return;
  list.replaceChildren();
  const q=query.toLocaleLowerCase('ru').trim();
  const found=commands.filter(([label,category])=>(label+' '+category).toLocaleLowerCase('ru').includes(q));
  if(!found.length){list.append(node('div','forma-command-empty','Инструмент не найден'));return}
  let previous='';
  found.forEach(([label,category,action])=>{
   if(category!==previous){const group=node('div','forma-command-group',category);list.append(group);previous=category}
   const b=node('button','forma-command-choice','<span>'+label+'</span><small>Открыть ↗</small>');
   b.type='button';b.addEventListener('click',()=>runCommand(action));list.append(b);
  });
 }
 function openCommands(){
  if(commandBackdrop){$('#formaCommandSearch')?.focus();return}
  commandBackdrop=node('div','forma-command-backdrop',
   '<div class="forma-command-dialog" role="dialog" aria-modal="true" aria-label="Команды студии">'+
   '<div class="forma-command-head">'+icons.search+'<input id="formaCommandSearch" type="text" placeholder="Найти задачу: погода, свет, 3D, материалы…" autocomplete="off" aria-label="Поиск команд"></div>'+
   '<div class="forma-command-list" id="formaCommandList"></div>'+
   '<div class="forma-command-hint">Нажмите Esc, чтобы закрыть · Ctrl+K / ⌘K, чтобы открыть</div></div>');
  document.body.append(commandBackdrop);
  commandBackdrop.addEventListener('click',e=>{if(e.target===commandBackdrop)closeCommands()});
  $('#formaCommandSearch').addEventListener('input',e=>renderCommands(e.target.value));
  renderCommands();$('#formaCommandSearch').focus();
 }
 function closeCommands(){commandBackdrop?.remove();commandBackdrop=null}
 function setupEvents(){
  document.addEventListener('click',e=>{
   const b=e.target.closest('[data-studio-action]');
   if(b){
    const action=b.dataset.studioAction;
    if(action==='qa')toggleQA();
    else if(action==='gallery')gallery();
    else if(action==='commands')openCommands();
    else if(action==='upload')$('#sourceFile')?.click();
    else if(action==='interior')window.FORMA_INTERIORS?.open?.();
    else if(action==='render')navigate('environment');
    else if(action==='nodes')window.FORMA_NODES?.open?.();
    return;
   }
   const p=e.target.closest('[data-studio-mood]');
   if(p)setPreset(p.dataset.studioMood);
  });
  $('#forma4KExport')?.addEventListener('click',export4K);
  document.addEventListener('keydown',e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();commandBackdrop?closeCommands():openCommands();
   }
   if(e.key==='Escape'&&commandBackdrop){e.preventDefault();closeCommands()}
  });
 }
 function init(){
  if(document.body.dataset.formaStudioReady)return;
  document.body.dataset.formaStudioReady='1';
  setupBrand();setupContext();setupQA();setupEvents();
  const mobile=document.querySelector('.mobile-header-actions');
  if(mobile&&!mobile.querySelector('[data-studio-action="commands"]')){const quick=node('button','forma-mobile-tools-quick','Инструменты');quick.type='button';quick.dataset.studioAction='commands';mobile.prepend(quick)}
  const top=document.querySelector('.top-actions');
  if(top&&!top.querySelector('[data-studio-action="commands"]')){const quick=node('button','forma-desktop-tools-quick','⌕ Инструменты');quick.type='button';quick.dataset.studioAction='commands';top.prepend(quick)}

 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
