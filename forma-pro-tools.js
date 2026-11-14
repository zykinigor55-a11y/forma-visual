(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORE='forma-archviz-pro-workspace-v1';
const ITEMS=[
 ['overview','Панель проекта','Обзор', '◈'],
 ['camera','Камера и оптика','Работает локально','◎'],
 ['preview','Экспозиция и цвет','Работает локально','◐'],
 ['geometry','Контроль геометрии','Визуальный контроль','⌗'],
 ['cad','CAD Bridge','Подготовка импорта','▤'],
 ['models','AI-движки','Состояние API','✧'],
 ['upscale','Upscale · 4K','Подключение API','↗'],
 ['image3d','Из фото в 3D','Подключение API','⬡'],
 ['presentation','Альбом проекта','Печатный PDF','▣'],
 ['account','Аккаунты и тарифы','Серверная интеграция','◇'],
 ['release','Контроль публикации','Чек-лист','✓']
];
const CHECKS=['Сохранена конфигурация проекта','Проверены результаты генерации и ошибки','Проверена геометрия контрольных сцен','Проверена мобильная версия','Проверен серверный API и лимиты','Проверена безопасность и хранение секретов','Подтверждена публикация отдельного релиза'];
let state={camera:'Nikon Z8',lens:'24mm tilt-shift',height:1.6,notes:'',shots:[],check:{},color:{brightness:100,contrast:100,saturation:100},projectTitle:'Резиденция 01',cameraConfigured:false};
try{state={...state,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{}
let modal=null,tab='overview',cadInfo=null,health=null,inlineHost=null,inlineSelection=null,upscaleSource=null,upscalePreviewURL=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state))}catch{note('Не удалось сохранить настройки локально')}};
function note(str){for(const n of [$('#faProStatus'),$('#faProjectStatus')])if(n)n.textContent=str;}
function download(name,str,type='application/json'){
 const url=URL.createObjectURL(new Blob([str],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function section(title,kicker,description,body){
 return `<div class="fa-pro-intro"><span>${kicker}</span><h2>${title}</h2><p>${description}</p></div>${body}`;
}
const tile=(title,body,status)=>`<div class="fa-pro-tile"><small>${status}</small><b>${title}</b><p>${body}</p></div>`;
const button=(action,label,primary=false)=>`<button type="button" data-fa-pro="${action}" class="fa-pro-action ${primary?'primary':''}">${label}</button>`;
const warning=str=>`<div class="fa-pro-warning">${str}</div>`;
function inner(id){
 switch(id){
 case 'overview':
 return section('Профессиональный набор инструментов','ФОРМА / РАБОЧАЯ СТУДИЯ','Управление полноценной архитектурной визуализацией из одной рабочей среды.',
 `<div class="fa-pro-tile-grid">
 ${tile('Экстерьеры','Исходный скриншот → профессиональная архитектурная фотография.','AI / ТЕКУЩИЙ ДВИЖОК')}
 ${tile('Интерьеры','Sketch → Photo: материалы, свет и фиксация планировки.','AI / ТЕКУЩИЙ ДВИЖОК')}
 ${tile('Нодовые сценарии','Развилки визуализаций, связь операций и история настроек.','ЛОКАЛЬНЫЙ РЕДАКТОР')}
 ${tile('Проверка ракурса','Сравнение исходника, контуры и визуальная инспекция.','ЛОКАЛЬНЫЙ ИНСТРУМЕНТ')}
 </div>
 <div class="fa-pro-section-title">Быстрые действия</div>
 <div class="fa-pro-actions">${button('nodes','Открыть нодовый редактор',true)}${button('interior','Новый интерьер')}${button('geometry','Проверить геометрию')}${button('camera','Паспорт камеры')}</div>
 ${warning('Вызовы AI оплачиваются и зависят от действующего API-ключа на сервере. Без подключения новых провайдеров не заявляем наличие AI-upscale, 3D-генерации и автоматической проверки геометрии.')}`);
 case 'camera':
 return section('Паспорта камеры и ракурсов','CAMERA STUDY / 02','Записывайте настройки виртуальной съёмки отдельно от генератора и сохраняйте серию кадров.',
 `<div class="fa-pro-form">
 <label>Камера<select id="faProCamera">${['Nikon Z8','Canon EOS R5','Sony A7R V','Hasselblad X2D','ARRI Alexa 35'].map(x=>`<option ${state.camera===x?'selected':''}>${x}</option>`).join('')}</select></label>
 <label>Объектив<select id="faProLens">${['17mm tilt-shift','24mm tilt-shift','24mm wide-angle','35mm prime','50mm prime','85mm detail'].map(x=>`<option ${state.lens===x?'selected':''}>${x}</option>`).join('')}</select></label>
 <label>Высота камеры, м<input id="faProHeight" type="number" min="0.1" max="30" step="0.1" value="${esc(state.height)}"></label>
 <label class="full">Описание кадра<input id="faProNotes" maxlength="140" placeholder="Главный фасад, 3/4, съёмка с уровня глаз…" value="${esc(state.notes)}"></label>
 </div><div class="fa-pro-actions">${button('saveShot','Сохранить ракурс',true)}${button('exportShots','Скачать JSON')}</div>
 <div class="fa-pro-section-title">Сохранённые ракурсы</div>
 <div class="fa-pro-shotlist">${state.shots.length?state.shots.map((s,i)=>`<div><span><b>${esc(s.notes||'Ракурс '+(i+1))}</b><small>${esc(s.camera)} · ${esc(s.lens)} · ${esc(s.height)} м</small></span><button type="button" data-fa-delete-shot="${i}" aria-label="Удалить ракурс">×</button></div>`).join(''):'<p>Ракурсы пока не сохранены.</p>'}</div>
 ${warning('Паспорт камеры передаётся в текущий AI-бриф как пожелание к оптическому характеру снимка. Ракурс и геометрия по-прежнему определяются исходным изображением; управлять камерой внутри CAD можно будет после отдельной интеграции.')}`);
 case 'preview':
 return section('Предпросмотр экспозиции','LOCAL LOOK DEVELOPMENT / 03','Быстрая цветовая проба текущего результата, без обращения к AI.',
 `<div class="fa-pro-preview"><img id="faProPreviewImage" alt="Цветовой предпросмотр проекта"><span>LOCAL PREVIEW · NO AI</span></div>
 <div class="fa-pro-range">${[['brightness','Яркость',50,150],['contrast','Контраст',50,170],['saturation','Насыщенность',0,175]].map(([key,label,min,max])=>`<label>${label}<b id="faProValue-${key}">${state.color[key]}%</b><input type="range" data-fa-color="${key}" min="${min}" max="${max}" value="${state.color[key]}"></label>`).join('')}</div>
 <div class="fa-pro-actions">${button('resetColor','Сбросить',false)}${button('render','Перейти к AI-рендеру',true)}</div>
 ${warning('Предпросмотр — CSS-коррекция. Исходник и сохранённый результат не перезаписываются.')}`);
 case 'geometry':
 return section('Контроль архитектурной геометрии','ARCHITECTURAL ACCURACY / 04','Наложение исходного скетча на фото и проверка фасадных элементов.',
 `<div class="fa-pro-tile-grid">${tile('Контуры и линии','Проверяйте окна, кровлю, колонны, венцы и контуры исходника.','ВИЗУАЛЬНО')}
 ${tile('Прозрачность','Сравнивайте перспективу с помощью ползунка 0–100%.','ВИЗУАЛЬНО')}</div>
 <div class="fa-pro-actions">${button('overlay','Открыть наложение',true)}${button('qaNotes','Скачать акт контроля')}</div>
 ${warning('Это способ визуальной проверки, а не автоматическое определение размеров или CAD-сверка.')}`);
 case 'cad':
 return section('CAD Bridge','CAD INTEGRATION / 05','Подготовка файла для последующего подключения Revit, SketchUp, Archicad и других программ.',
 `<div class="fa-pro-tags"><span>REVIT</span><span>SKETCHUP</span><span>ARCHICAD</span><span>RHINO</span><span>3DS MAX</span><span>BLENDER</span><span>IFC</span></div>
 <label class="fa-pro-drop"><strong>Выбрать CAD-файл</strong><span>RVT, SKP, PLN, IFC, OBJ, GLB, GLTF, FBX, 3DM, MAX, BLEND</span><input type="file" id="faProCad" accept=".rvt,.skp,.pln,.ifc,.obj,.glb,.gltf,.fbx,.3dm,.max,.blend"></label>
 <div class="fa-pro-info" id="faProCadInfo">${cadInfo?esc(cadInfo.name)+' · '+(cadInfo.size/1048576).toFixed(2)+' MB':'Файл ещё не выбран'}</div>
 <div class="fa-pro-actions">${button('cadPackage','Сохранить технический пакет JSON',true)}</div>
 ${warning('Пока нативные форматы не импортируются внутрь редактора. Здесь готовится передача данных; серверные CAD-плагины подключаются отдельно.')}`);
 case 'models':
 return section('AI-модели и маршруты','MODEL ROUTER / 06','Какие операции доступны в текущем проекте и для чего нужен следующий API.',
 `<div class="fa-pro-health" id="faProHealth">Проверяем сервер…</div>
 <div class="fa-pro-providers">
 ${[['AI Image Render','Nano Banana 2.1','Существующий /api/render'],['Material Edit','Nano Banana 2.1','Существующий /api/render с маской'],['Image-to-video','WAN','Существующий видеоадаптер (требуется настройка)'],['AI Super Resolution','Upscaler','Ожидает нового API'],['Image-to-3D','3D model','Ожидает нового API'],['Geometry QA','CAD validator','Ожидает нового движка']].map(([a,b,c])=>`<div><strong>${a}</strong><span>${b}</span><small>${c}</small></div>`).join('')}
 </div>${button('status','Обновить статус API',true)}`);
 case 'upscale':
 return section('Upscale / 4K','IMAGE FINISHING / 07','Разделяйте увеличение количества пикселей и реконструкцию реальных деталей.',
 `<div class="fa-pro-tile-grid">${tile('Масштабирование 4K','Изменение размера до 3840 px по длинной стороне без дорисовывания деталей.','РАБОТАЕТ БЕЗ AI')}
 ${tile('AI Upscaler','Нейросетевое улучшение мелких деталей потребует отдельного API.','ОЖИДАЕТ API')}</div>
 <label class="fa-pro-drop fa-upscale-drop"><strong>Загрузить изображение для 4K</strong><span>Выберите JPG, PNG или WEBP · файл останется на вашем устройстве</span><input id="faProUpscaleUpload" type="file" accept="image/png,image/jpeg,image/webp"></label>
 <div class="fa-pro-info" id="faProUpscaleInfo">Или используйте текущий результат в окне проекта.</div>
 <div class="fa-upscale-image"><img id="faProUpscalePreview" alt="Изображение для увеличения до 4K" hidden></div>
 <div class="fa-pro-actions">${button('resize4k','Скачать увеличенное изображение 4K',true)}</div>
 ${warning('Это обычное изменение размера изображения, НЕ AI-upscale. Новые текстуры и детализация не создаются.')}`);
 case 'image3d':
 return section('Image to 3D','MODEL CONVERSION / 08','Подготовьте исходную фотографию и задание для будущей генерации 3D.',
 `<label class="fa-pro-drop"><strong>Выбрать референс для 3D</strong><span>PNG / JPEG / WEBP — только локальная подготовка</span><input type="file" id="faPro3DFile" accept="image/png,image/jpeg,image/webp"></label>
 <div class="fa-pro-info" id="faPro3DInfo">Референс пока не выбран.</div>
 <div class="fa-pro-actions">${button('image3dPackage','Сохранить задачу 3D в JSON',true)}</div>
 ${warning('Ни GLB, ни OBJ не генерируются до подключения отдельной 3D-модели и сервера задач.')}`);
 case 'presentation':
 return section('Архитектурный альбом','PRESENTATION STUDIO / 09','Оформите исходник и визуализацию как профессиональный лист проекта.',
 `<label class="fa-pro-single">Название проекта<input id="faProProjectTitle" maxlength="100" value="${esc(state.projectTitle)}"></label>
 <div class="fa-pro-presentation"><div><small>ФОРМА / 001</small><b>АРХИТЕКТУРНЫЙ ПРОЕКТ</b><p>Исходная модель</p></div><div><small>ФОРМА / 002</small><b>ФОТОРЕАЛИСТИЧНЫЙ РЕНДЕР</b><p>Архитектурный рендер</p></div></div>
 <div class="fa-pro-actions">${button('print','Открыть печатный лист PDF',true)}${button('downloadBrief','Скачать описание проекта')}</div>
 ${warning('PDF сохраняется через печать браузера. Планы не создаются автоматически и не выдаются за проектную документацию.')}`);
 case 'account':
 return section('Аккаунты и коммерческий SaaS','BUSINESS / 10','Проверка инфраструктуры перед подключением биллинга и пользовательских тарифов.',
 `<div class="fa-pro-health" id="faProHealth">Проверяем сервер…</div>
 <div class="fa-pro-providers">${[['Кабинет пользователя','Нужна защищённая авторизация'],['Учёт кредитов','Нужна серверная база и лимиты на пользователя'],['Оплата генераций','Нужен платёжный провайдер'],['Хранение изображений','Сейчас файлы сохраняются локально'],['Секреты API','Должны храниться только на сервере']].map(([a,b])=>`<div><strong>${a}</strong><small>${b}</small></div>`).join('')}</div>
 ${warning('До внедрения серверной авторизации нельзя считать публичный сайт готовым к платным пользователям.')}`);
 case 'release':
 return section('Контроль публикации','RELEASE CONTROL / 11','Отмечайте проверенные условия, прежде чем переводить ветку в продакшн.',
 `<div class="fa-pro-checks">${CHECKS.map((c,i)=>`<label><input type="checkbox" data-fa-check="${i}" ${state.check[i]?'checked':''}><span>${esc(c)}</span></label>`).join('')}</div>
 <div class="fa-pro-actions">${button('checkExport','Скачать чек-лист',true)}</div>
 ${warning('Отметки проставляются вручную и не подтверждают успешную сборку, проверку API и публикацию на Render.')}`);
 default:return '';
 }
}
function show(id){
 tab=id;
 if(modal){
  $('.fa-pro-nav button',modal).forEach(b=>b.classList.toggle('active',b.dataset.proTab===id));
 }
 const host=modal?$('#faProContent',modal):inlineHost;
 if(!host)return;
 host.innerHTML=inner(id);
 host.scrollTop=0;
 bindDetails(id,host);
 inlineSelection?.(id);
 if(['models','account'].includes(id))checkServer(host);
}
function printSheet(){
 const title=state.projectTitle.trim()||'Архитектурный проект';
 const src=$('#beforeImg')?.currentSrc||$('#beforeImg')?.src||'',out=$('#afterImg')?.currentSrc||$('#afterImg')?.src||'';
 const w=window.open('','_blank');if(!w){note('Разрешите всплывающие окна для экспорта альбома');return}
 const cleanTitle=esc(title);
 w.document.open();
 w.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>'+cleanTitle+' | ФОРМА</title><style>@page{size:A4 landscape;margin:15mm}body{font:12px Arial,sans-serif;color:#222;margin:0}header{display:flex;justify-content:space-between;border-bottom:1px solid #999;padding:16px 0}h1{font-size:29px;font-weight:500}article{display:grid;grid-template-columns:1fr 1fr;gap:16px}article img{width:100%;max-height:142mm;object-fit:contain;background:#e7e9e8}h3{font-size:12px;font-weight:600;letter-spacing:.08em}footer{margin-top:20px;color:#777}</style></head><body><header><b>ФОРМА</b><span>АРХИТЕКТУРНЫЙ ПРОЕКТ</span></header><h1>'+cleanTitle+'</h1><article><section><h3>01 / ИСХОДНАЯ МОДЕЛЬ</h3><img alt="Исходник" src="'+esc(src)+'"></section><section><h3>02 / ВИЗУАЛИЗАЦИЯ</h3><img alt="Рендер" src="'+esc(out)+'"></section></article><footer>ФОРМА · VISUAL PROJECT DOCUMENT · '+new Date().toLocaleDateString('ru-RU')+'</footer></body></html>');
 w.document.close();note('Открыт печатный лист — сохраните его через меню печати как PDF');
}
async function checkServer(host=modal?$('#faProContent'):inlineHost){
 const el=host?.querySelector('#faProHealth');if(!el)return;
 if(document.documentElement.classList.contains('forma-static-preview')){
  el.textContent='Режим предпросмотра. AI-генерация на этой странице отключена.';
  el.dataset.online='false';return;
 }
 try{
  const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok)throw Error();
  const data=await r.json();
  el.textContent=data.ready?'AI-движок: '+data.provider+' · '+(data.model||'подключён')+' · осталось запросов: '+data.dailyRemaining:'Сервер доступен, но AI-ключ не настроен';
  el.dataset.online=data.ready?'true':'false';
 }catch{el.textContent='Сервер API не отвечает. Рендеринг недоступен.';el.dataset.online='false'}
}
function bindDetails(id,e){
 if(!e)return;
 if(id==='preview'){
  const img=$('#faProPreviewImage',e),a=$('#afterImg');if(img&&a)img.src=a.currentSrc||a.src;
  const apply=()=>{if(img)img.style.filter='brightness('+state.color.brightness+'%) contrast('+state.color.contrast+'%) saturate('+state.color.saturation+'%)';};apply();
  $$('[data-fa-color]',e).forEach(el=>el.addEventListener('input',ev=>{const k=el.dataset.faColor;state.color[k]=Number(el.value);$('#faProValue-'+k,e).textContent=el.value+'%';apply();save()}));
 }
 if(id==='release')$$('[data-fa-check]',e).forEach(el=>el.addEventListener('change',()=>{state.check[el.dataset.faCheck]=el.checked;save()}));
 if(id==='presentation')$('#faProProjectTitle',e)?.addEventListener('input',x=>{state.projectTitle=x.target.value;save()});
 if(id==='cad')$('#faProCad',e)?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;cadInfo={name:f.name,size:f.size,format:f.name.split('.').pop()};$('#faProCadInfo',e).textContent=f.name+' · '+(f.size/1048576).toFixed(2)+' MB · метаданные получены'});
 if(id==='image3d')$('#faPro3DFile',e)?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;cadInfo={name:f.name,size:f.size,format:f.type};$('#faPro3DInfo',e).textContent=f.name+' · '+(f.size/1048576).toFixed(2)+' MB · готово к подготовке задания'});
 if(id==='upscale'){
  const upload=$('#faProUpscaleUpload',e),preview=$('#faProUpscalePreview',e),info=$('#faProUpscaleInfo',e);
  const fromResult=()=>{
   const image=$('#afterImg');
   if(!upscaleSource&&preview&&image?.src){preview.src=image.currentSrc||image.src;preview.hidden=false}
  };
  fromResult();
  if(upscaleSource&&upscalePreviewURL){preview.src=upscalePreviewURL;preview.hidden=false;info.textContent=upscaleSource.name+' · файл выбран для локального масштабирования'}
  upload?.addEventListener('change',event=>{
   const f=event.target.files?.[0];
   if(!f)return;
   if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>40*1024*1024){note('Поддерживаются PNG, JPG и WEBP до 40 МБ');upload.value='';return}
   if(upscalePreviewURL)URL.revokeObjectURL(upscalePreviewURL);
   upscaleSource=f;upscalePreviewURL=URL.createObjectURL(f);
   if(preview){preview.src=upscalePreviewURL;preview.hidden=false}
   info.textContent=f.name+' · '+(f.size/1048576).toFixed(1)+' МБ';
  });
 }
 if(!modal){
  $('[data-fa-pro],[data-fa-delete-shot]',e).forEach(b=>b.addEventListener('click',actions));
 }
}
async function upscaleTo4K(){
 if(!upscaleSource){$('#forma4KExport')?.click();return}
 const img=new Image();
 img.src=upscalePreviewURL;
 try{await img.decode()}catch{note('Не удалось прочитать изображение');return}
 const maxSide=Math.max(img.naturalWidth,img.naturalHeight);
 if(!maxSide){note('Не удалось определить размеры изображения');return}
 const scale=Math.max(1,3840/maxSide);
 const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
 if(w*h>25000000){note('Слишком большое изображение для локальной обработки');return}
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d');if(!context){note('Canvas не поддерживается');return}
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(img,0,0,w,h);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 if(!blob){note('Не удалось создать PNG');return}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='forma-4k-'+w+'x'+h+'.png';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 note('Файл '+w+'×'+h+' сохранён (масштабирование, не AI).');
}
function actions(e){
 const del=e.target.closest('[data-fa-delete-shot]');
 if(del){state.shots.splice(Number(del.dataset.faDeleteShot),1);save();show('camera');return}
 const b=e.target.closest('[data-fa-pro]');if(!b)return;
 const a=b.dataset.faPro;
 if(ITEMS.some(x=>x[0]===a)){show(a);return}
 if(a==='nodes'){close();window.FORMA_NODES?.open?.();return}
 if(a==='interior'){close();window.FORMA_INTERIORS?.open?.();return}
 if(a==='overlay'){close();$('#formaQaToggle')?.click();return}
 if(a==='render'){close();document.querySelector('[data-nav="environment"]')?.click();return}
 if(a==='saveShot'){
  state.camera=$('#faProCamera').value;state.lens=$('#faProLens').value;state.height=Number($('#faProHeight').value)||1.6;state.notes=$('#faProNotes').value.trim();
  state.cameraConfigured=true;
  state.shots.unshift({camera:state.camera,lens:state.lens,height:state.height,notes:state.notes,date:new Date().toISOString()});state.shots=state.shots.slice(0,40);save();show('camera');note('Паспорт камеры сохранён локально');return;
 }
 if(a==='exportShots'){download('forma-camera-shots.json',JSON.stringify(state.shots,null,2));return}
 if(a==='resetColor'){state.color={brightness:100,contrast:100,saturation:100};save();show('preview');return}
 if(a==='qaNotes'){download('forma-geometry-review.json',JSON.stringify({date:new Date().toISOString(),method:'manual visual overlay',verifiedAutomatically:false},null,2));return}
 if(a==='resize4k'){note('Обрабатываем изображение 4K…');upscaleTo4K().catch(err=>{note('Ошибка масштабирования: '+(err?.message||'неизвестная ошибка'))});return}
 if(a==='status'){checkServer();return}
 if(a==='cadPackage'){download('forma-cad-bridge.json',JSON.stringify({workflow:'cad bridge',date:new Date().toISOString(),file:cadInfo,camera:state.camera,lens:state.lens,height:state.height,integrated:false},null,2));return}
 if(a==='image3dPackage'){download('forma-image-to-3d-task.json',JSON.stringify({date:new Date().toISOString(),file:cadInfo,requiresProvider:true,status:'not submitted'},null,2));return}
 if(a==='print'){printSheet();return}
 if(a==='downloadBrief'){download('forma-project-brief.json',JSON.stringify({project:state.projectTitle,camera:state.camera,lens:state.lens,shots:state.shots},null,2));return}
 if(a==='checkExport'){download('forma-release-checklist.json',JSON.stringify({date:new Date().toISOString(),items:CHECKS.map((name,i)=>({name,checked:!!state.check[i]}))},null,2));return}
}
function open(id='overview'){
 if(inlineHost&&!modal){show(id);inlineHost.closest('#formaProjectPanel')?.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(modal){show(id);return}
 modal=document.createElement('div');modal.className='fa-pro-backdrop';modal.id='faProBackdrop';
 modal.innerHTML='<div class="fa-pro-shell" role="dialog" aria-modal="true" aria-label="Профессиональные инструменты"><header class="fa-pro-head"><div class="fa-pro-monogram"><img src="assets/brand/forma-fa-mark.svg" alt="" width="29" height="29"></div><div><b>ФОРМА <span>/ ИНСТРУМЕНТЫ</span></b><small>ПРОФЕССИОНАЛЬНАЯ АРХИТЕКТУРНАЯ СТУДИЯ</small></div><button id="faProClose" type="button" aria-label="Закрыть">×</button></header><div class="fa-pro-main"><nav class="fa-pro-nav" aria-label="Разделы инструментов"></nav><div id="faProContent" class="fa-pro-content"></div></div><footer class="fa-pro-footer"><span id="faProStatus" role="status">Проекты и настройки могут храниться локально в этом браузере.</span><span>ФОРМА / СТУДИЯ 01</span></footer></div>';
 document.body.append(modal);document.body.classList.add('fa-pro-is-open');
 const nav=$('.fa-pro-nav');
 nav.innerHTML=ITEMS.map(([id,title,caption,icon])=>`<button type="button" data-pro-tab="${id}"><i>${icon}</i><span><b>${title}</b><small>${caption}</small></span></button>`).join('');
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-pro-tab]');if(b)show(b.dataset.proTab)});
 modal.addEventListener('click',actions);
 modal.addEventListener('click',e=>{if(e.target===modal)close()});
 $('#faProClose').addEventListener('click',close);
 document.addEventListener('keydown',keydown);
 show(id);
}
function keydown(e){if(e.key==='Escape')close()}
function close(){if(!modal)return;modal.remove();modal=null;document.body.classList.remove('fa-pro-is-open');document.removeEventListener('keydown',keydown)}
function init(){
 const actions=$('.forma-context-actions');
 if(actions){
  const b=document.createElement('button');b.type='button';b.className='forma-mini-btn fa-pro-launch';b.textContent='◈ Инструменты';b.title='Профессиональные инструменты студии';b.addEventListener('click',()=>open());
  const c=actions.querySelector('[data-studio-action="commands"]');if(c)actions.insertBefore(b,c);else actions.append(b);
 }
 const nav=$('.rail-nav');
 if(nav){
  const b=document.createElement('button');b.type='button';b.className='rail-btn fa-pro-nav-launch';b.innerHTML='<svg class="ico"><use href="#i-sliders"/></svg><span class="rail-name">Инструменты</span>';b.title='Профессиональные инструменты';b.addEventListener('click',()=>open());nav.append(b);
 }
 window.FORMA_PRO={open,close,mountInline:(host,onSelect)=>{if(!host)return;inlineHost=host;inlineSelection=onSelect;show('upscale')},cameraBrief:()=>{
  if(!state.cameraConfigured)return null;
  return {enabled:true,camera:state.camera,lens:state.lens,height:Math.max(.1,Math.min(30,Number(state.height)||1.6)),notes:String(state.notes||'').slice(0,140)};
 }};
 window.addEventListener('forma:open-tool',e=>open(e.detail?.tool||'overview'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();