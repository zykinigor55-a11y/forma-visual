/* ФОРМА · Встроенная панель инструментов проекта
   Все рабочие разделы видны на главной странице; PRO-настройки редактируются справа,
   без открытия отдельного окна. */
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 const $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const icons={
  upscale:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 16 16 8M10 8h6v6M7 11v6h6"/>',
  render:'<path d="m3 11 9-7 9 7v10H3V11Z"/><path d="M3 11h18M9 21v-7h6v7"/>',
  interior:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 10h18M8 21v-7h8v7"/>',
  materials:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  animation:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3"/>',
  nodes:'<rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><path d="M9 7h3v10h3M9 17h6"/>',
  camera:'<path d="M4 7h4l2-3h5l2 3h3v14H4z"/><circle cx="12" cy="14" r="4"/>',
  preview:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/>',
  geometry:'<path d="M3 3h8v8H3zM13 13h8v8h-8zM11 7h6v6M7 11v6h6"/>',
  cad:'<path d="M5 3h10l5 5v13H5zM15 3v5h5M8 12h8M8 16h6"/>',
  image3d:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10"/>',
  presentation:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  gallery:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m4 19 5-5 3 3 4-5 4 6"/>',
  models:'<path d="m12 2 2.6 6.9L22 12l-7.4 3.1L12 22l-2.6-6.9L2 12l7.4-3.1Z"/>',
  account:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3c0-5 16-5 16 0v3"/>',
  release:'<path d="M4 13l5 5L20 6"/><rect x="3" y="3" width="18" height="18" rx="3"/>'
 };
 const svg=id=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+icons[id]+'</svg>';
 const groups={all:'Все',render:'Визуализация',edit:'Обработка',studio:'Студия',system:'Система'};
 const tools=[
  {id:'upscale',name:'Upscaler · 4K',desc:'Увеличить изображение до 4K',group:'edit',state:'local',note:'Без AI',type:'pro'},
  {id:'render',name:'Экстерьеры',desc:'Из скетча в архитектурное фото',group:'render',state:'api',note:'AI-модель',type:'route'},
  {id:'interior',name:'Интерьеры',desc:'Sketch → Photo · свет и отделка',group:'render',state:'api',note:'AI-модель',type:'route'},
  {id:'materials',name:'Редактор материалов',desc:'Маски и локальные изменения',group:'edit',state:'api',note:'AI-модель',type:'route'},
  {id:'animation',name:'Анимация',desc:'Камеры, движение, видео',group:'render',state:'api',note:'Видео API',type:'route'},
  {id:'nodes',name:'Нодовый редактор',desc:'Исполняемые AI-цепочки и ветки проекта',group:'studio',state:'api',note:'Схема локально · рендер по API',type:'route'},
  {id:'camera',name:'Камера и оптика',desc:'Паспорта ракурсов и объективы',group:'studio',state:'local',note:'Локально',type:'pro'},
  {id:'preview',name:'Свет и цвет',desc:'Контраст, яркость, цвет',group:'edit',state:'local',note:'Локально',type:'pro'},
  {id:'geometry',name:'Контроль геометрии',desc:'Наложение и линии исходника',group:'studio',state:'local',note:'Визуально',type:'pro'},
  {id:'cad',name:'CAD Bridge',desc:'Revit · SketchUp · Archicad',group:'studio',state:'pending',note:'Подготовка',type:'pro'},
  {id:'image3d',name:'Из фото в 3D',desc:'Подготовить задание для 3D',group:'edit',state:'pending',note:'Нужен API',type:'pro'},
  {id:'presentation',name:'Альбом проекта',desc:'Печатный лист и экспорт PDF',group:'studio',state:'local',note:'Локально',type:'pro'},
  {id:'gallery',name:'Галерея',desc:'Сохранённые изображения проекта',group:'studio',state:'local',note:'Локально',type:'route'},
  {id:'models',name:'AI-движки',desc:'Модели и статус подключения',group:'system',state:'pending',note:'Статус API',type:'pro'},
  {id:'account',name:'Аккаунты и тарифы',desc:'Подготовка коммерческого SaaS',group:'system',state:'pending',note:'Нужен сервер',type:'pro'},
  {id:'release',name:'Контроль публикации',desc:'Проверки и чек-лист запуска',group:'system',state:'local',note:'Локально',type:'pro'}
 ];
 const badge=t=>t.state==='local'?'ЛОКАЛЬНО':t.state==='api'?'ТРЕБУЕТ API':'ПОДКЛЮЧЕНИЕ';
 let current='upscale',filter='all',panel=null;
 function nav(name){
  const target=$('[data-nav="'+name+'"]');
  if(target){target.click();return true}
  return false;
 }
 function openRoute(id){
  if(id==='nodes')return window.FORMA_NODES?.open?.();
  if(id==='interior')return window.FORMA_INTERIORS?.open?.();
  if(id==='gallery'){
   const b=$('[data-open-cabinet="account"]');if(b){b.click();requestAnimationFrame(()=>$('[data-cabinet-tab="gallery"]')?.click());}
   return;
  }
  if(id==='render')return nav('environment');
  if(id==='materials')return nav('materials');
  if(id==='animation')return nav('animation');
 }
 function choose(id){
  const tool=tools.find(t=>t.id===id);if(!tool)return;
  current=id;
  if(tool.type==='pro'){
   window.FORMA_PRO?.open?.(id);
  }else{
   const detail=$('#faProjectToolContent');
   if(detail)detail.innerHTML='<div class="fa-home-route-context"><span>РАБОЧИЙ МОДУЛЬ</span><h4>'+tool.name+'</h4><p>'+tool.desc+'</p><p>Этот инструмент открывается в рабочей панели проекта. Все его параметры и результаты связаны с текущим проектом.</p><div class="fa-home-route-hint">Основные настройки: справа от изображения · История результатов: в галерее проекта</div></div>';
   const title=$('#faHomeToolTitle');if(title)title.textContent=tool.name;
   const short=$('#faHomeToolSub');if(short)short.textContent='Рабочий модуль проекта';
   openRoute(id);
  }
  $$('.fa-home-tool',panel).forEach(b=>{const selected=b.dataset.toolId===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
 }
 function filterTools(value){
  filter=value;
  $$('.fa-home-filter',panel).forEach(b=>{const yes=b.dataset.filter===filter;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
  $$('.fa-home-tool',panel).forEach(b=>{b.hidden=filter!=='all'&&b.dataset.group!==filter});
 }
 function renderPanel(){
  const card=(t)=>'<button type="button" class="fa-home-tool" data-tool-id="'+t.id+'" data-group="'+t.group+'" aria-pressed="false">'+
   '<span class="fa-home-tool-icon">'+svg(t.id)+'</span>'+
   '<span class="fa-home-tool-body"><strong>'+t.name+'</strong><small>'+t.desc+'</small><span class="fa-home-tool-status '+t.state+'">'+badge(t)+' <span>· '+t.note+'</span></span></span>'+
   '<span class="fa-home-tool-arrow" aria-hidden="true">↗</span></button>';
  return '<div class="fa-home-panel-head">'+
   '<div class="fa-home-heading"><span>ФОРМА / РАБОЧЕЕ ПРОСТРАНСТВО</span><h2>Панель проекта</h2><p>Все инструменты архитектурной визуализации — на одном экране.</p></div>'+
   '<div class="fa-home-panel-count"><strong>16</strong><span>ИНСТРУМЕНТОВ</span></div></div>'+
   '<div class="fa-home-panel-filters" role="group" aria-label="Категории инструментов">'+Object.entries(groups).map(([id,name])=>'<button type="button" class="fa-home-filter'+(id==='all'?' active':'')+'" data-filter="'+id+'" aria-pressed="'+(id==='all')+'">'+name+'</button>').join('')+'</div>'+
   '<div class="fa-home-panel-layout"><div class="fa-home-tool-grid" aria-label="Инструменты проекта">'+tools.map(card).join('')+'</div>'+
   '<div class="fa-home-inspector"><div class="fa-home-inspector-head"><span>ПАРАМЕТРЫ ИНСТРУМЕНТА</span><h3 id="faHomeToolTitle">Upscaler · 4K</h3><p id="faHomeToolSub">Настраивайте выбранный инструмент, не покидая главную страницу.</p></div>'+
   '<div class="fa-home-tool-details fa-pro-content" id="faProjectToolContent"></div>'+
   '<div class="fa-home-inspector-footer"><span id="faProjectStatus" role="status">Настройки проекта сохраняются в браузере.</span></div></div></div>';
 }
 function init(){
  if($('#formaProjectPanel'))return;
  const viewer=$('.viewer-card');if(!viewer)return;
  panel=document.createElement('section');panel.id='formaProjectPanel';panel.className='fa-home-panel';panel.setAttribute('aria-label','Панель проекта и инструменты');
  panel.innerHTML=renderPanel();
  viewer.insertAdjacentElement('afterend',panel);
  panel.addEventListener('click',e=>{
   const filterButton=e.target.closest('[data-filter]');
   if(filterButton){filterTools(filterButton.dataset.filter);return}
   const tool=e.target.closest('[data-tool-id]');
   if(tool){choose(tool.dataset.toolId)}
  });
  window.FORMA_PRO?.mountInline?.($('#faProjectToolContent'),id=>{
   const tool=tools.find(x=>x.id===id);
   if(tool){current=id;$('#faHomeToolTitle').textContent=tool.name;$('#faHomeToolSub').textContent=tool.desc}
   $$('.fa-home-tool',panel).forEach(b=>{const selected=b.dataset.toolId===id;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))})
  });
  const actions=$('.forma-context-actions');
  if(actions&&!$('#faHomeUpscaleQuick')){
   const b=document.createElement('button');b.id='faHomeUpscaleQuick';b.type='button';b.className='forma-mini-btn fa-home-quick';b.textContent='↗ Upscaler 4K';
   b.addEventListener('click',()=>{filterTools('all');choose('upscale');panel.scrollIntoView({behavior:'smooth',block:'start'})});
   actions.insertBefore(b,actions.firstChild);
  }
  window.FORMA_HOME_TOOLS={open:choose,filter:filterTools};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();