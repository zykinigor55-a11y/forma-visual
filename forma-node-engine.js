/* ФОРМА · Исполняемые архитектурные цепочки (обособленный модуль).
   Только существующий /api/render, без передачи API-ключей в браузер.
   Платные вызовы требуют подтверждения, результат узла закрепляется отдельно. */
(() => {
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const getAPI=()=>window.FORMA_NODES;
const AI_TYPES=new Set(['exterior','interior','lighting','materials']);
const BLOCKED_TYPES=new Set(['image3d']);
const AVAILABLE_TYPES=new Set(['source','exterior','interior','lighting','materials','geometry','upscale','video','export']);
const LABELS={running:'ВЫПОЛНЯЕТСЯ',done:'ГОТОВО',error:'ОШИБКА',cancelled:'ОСТАНОВЛЕНО'};
const LIGHTS={sunny:'Солнечный день',golden:'Золотой час',overcast:'Пасмурно',blue:'Синий час',rain:'После дождя',winter:'Зима',night:'Ночь'};
const ZONES={main:'Фасад',roof:'Кровля',windows:'Окна',doors:'Двери',base:'Цоколь',terrace:'Терраса',custom:'Другая поверхность'};
let busy=false,preparing=false,aborter=null,wasCancelled=false,nodeSettingsBound=null,openedRunId=0,lastFailure=null;
const statuses=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiPreview=()=>location.protocol==='file:'||/\.github\.io$/i.test(location.hostname);
function graph(){return getAPI()?.graph?.()}
function tell(s){getAPI()?.showStatus?.(s)}
function sourceFingerprint(source){
 let hash=2166136261;
 for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619)}
 return source.length.toString(36)+'-'+(hash>>>0).toString(36);
}
function cacheAllowed(n,resumeNodes=new Set()){
 const api=getAPI();
 if(n.options?.needsRun)return false;
 if(!(n.options?.reuse||resumeNodes.has(n.id)))return false;
 return n.type==='video'?!!api?.getVideoBlob?.(n.id):!!api?.getSnapshot?.(n.id);
}
function checkPlan(g,target,resumeNodes=new Set()){
 if(!g?.nodes?.length||!target)throw Error('Сначала выберите ноду.');
 const nodes=new Map(g.nodes.map(n=>[n.id,n]));
 const path=[],seen=new Set();let id=target;
 while(id){
  if(seen.has(id))throw Error('Обнаружена циклическая связь между нодами.');
  const n=nodes.get(id);if(!n)throw Error('Связь ссылается на удалённую ноду.');
  seen.add(id);path.push(n);
  const incoming=g.edges.filter(e=>e.to===id);
  if(incoming.length>1)throw Error('К ноде подключено несколько входов. Оставьте один.');
  id=incoming[0]?.from||null;
 }
 path.reverse();
 if(path[0]?.type!=='source')throw Error('Цепочка должна начинаться с узла «Исходник».');
 const blocked=path.find(n=>BLOCKED_TYPES.has(n.type));
 if(blocked)throw Error('Нода «'+(blocked.title||blocked.type)+'» пока требует отдельного движка или ручного подтверждения — результат не имитируется.');
 const unknown=path.find(n=>!AVAILABLE_TYPES.has(n.type));
 if(unknown)throw Error('Тип «'+unknown.type+'» пока не исполняется.');
 const invalid=path.find(n=>n.type==='materials'&&!String(n.options?.instruction||'').trim()&&(!n.options?.material||n.options.material==='custom'));
 if(invalid)throw Error('Для ноды «Материалы» напишите конкретную инструкцию по редактированию.');
 const warnings=[];
 for(const n of path){
  if(!['exterior','lighting'].includes(n.type))continue;
  const o=n.options||{};
  if(o.season==='summer'&&o.weather==='snow')throw Error('Нода «'+(n.title||n.type)+'»: снег летом противоречит выбранному сезону. Выберите зиму или другую погоду.');
  if(o.time==='night'&&o.weather==='sunny')throw Error('Нода «'+(n.title||n.type)+'»: солнечная погода и ночь несовместимы. Исправьте время суток или погоду.');
  if(['fog','overcast'].includes(o.weather)&&o.time==='golden')warnings.push('«'+(n.title||n.type)+'»: золотой час при плотной облачности может быть незаметен.');
 }
 const calls=path.filter(n=>AI_TYPES.has(n.type)&&!cacheAllowed(n,resumeNodes)).length;
 const videoCalls=path.filter(n=>n.type==='video'&&!cacheAllowed(n,resumeNodes)).length;
 if(calls>8)throw Error('Для контроля стоимости разрешено не более 8 AI-этапов в цепочке.');
 return {path,calls,videoCalls,warnings};
}
function decorate(){
 const root=$('#faFlowBackdrop');if(!root)return;
 for(const card of $$('.fa-node',root)){
  const value=statuses.get(card.dataset.node);
  card.classList.toggle('fa-node-running',value==='running');
  card.classList.toggle('fa-node-done',value==='done');
  card.classList.toggle('fa-node-failed',value==='error');
  let label=$('.fa-run-state',card);
  if(value){
   if(!label){label=document.createElement('span');label.className='fa-run-state';card.append(label)}
   label.textContent=LABELS[value]||value;
   label.dataset.state=value;
  }else label?.remove();
 }
 const run=$('#faFlowRunChain'),stop=$('#faFlowStopChain');
 if(run)run.disabled=busy||preparing;
 if(stop)stop.disabled=!busy;
 const retry=$('#faFlowRetryChain');if(retry){retry.hidden=busy||preparing||!lastFailure;retry.disabled=busy||preparing;}
 if(busy){$('[data-node-option]', $('#faFlowNodeSettings')||document).forEach(el=>el.disabled=true)}
}
function setState(id,value){statuses.set(id,value);decorate()}
const ENVIRONMENTS={'keep':'Сохранить исходное','forest':'Хвойный лес','deciduous':'Лиственный лес','park':'Парк с крупными деревьями','lake':'Берег озера / реки','mountain':'Горный ландшафт','suburban':'Загородный участок','urban':'Городская застройка','minimal':'Минимальное окружение'};
const WEATHER={'keep':'По исходному изображению','sunny':'Ясно и солнечно','partly':'Переменная облачность','overcast':'Пасмурно','rain':'Дождь / мокрые поверхности','fog':'Туман','snow':'Снег'};
const SEASONS={'keep':'По исходнику','spring':'Весна','summer':'Лето','autumn':'Осень','winter':'Зима'};
const TIMES={'keep':'По исходнику','morning':'Утро','noon':'День','golden':'Золотой час','blue':'Синий час','evening':'Вечер','night':'Ночь'};
const PLANTS={'keep':'Сохранить растительность','garden':'Ухоженный сад','conifers':'Хвойные посадки','natural':'Естественная растительность','ornamental':'Декоративные травы и кустарники','none':'Без добавления растений'};
const LENSES={'keep':'Сохранить ракурс','24mm':'Широкий 24 мм','35mm':'Архитектурный 35 мм','50mm':'Нормальный 50 мм','85mm':'Телеобъектив 85 мм'};
const RATIOS={'16:9':'16:9 · Горизонтальный','3:2':'3:2 · Архитектурное фото','4:3':'4:3 · Каталог','1:1':'1:1 · Квадрат','9:16':'9:16 · Вертикальный'};
const MATERIALS={'custom':'По текстовой инструкции','wood':'Натуральное дерево','brick':'Кирпич','plaster':'Штукатурка','stone':'Натуральный камень','metal':'Металл','concrete':'Бетон','glass':'Стекло'};
const getOpt=(n,key,defaultValue)=>String(n.options?.[key]??defaultValue);
function settingsHTML(n){
 const opts=n.options||{},controls=[];
 const select=(key,label,list,value,info='')=>'<label>'+label+'<select data-node-option="'+key+'">'+
  Object.entries(list).map(([k,v])=>'<option value="'+esc(k)+'"'+(String(k)===String(value)?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'+(info?'<small>'+esc(info)+'</small>':'')+'</label>';
 const textarea=(key,label,value,placeholder,rows=3)=>'<label>'+label+'<textarea data-node-option="'+key+'" rows="'+rows+'" maxlength="500" placeholder="'+esc(placeholder)+'">'+esc(value||'')+'</textarea></label>';
 const group=(name,description='')=>'<div class="fa-node-settings-section"><strong>'+name+'</strong>'+(description?'<p>'+description+'</p>':'')+'</div>';
 const check=(key,label,defaultValue)=>'<label class="fa-flow-check"><input type="checkbox" data-node-option="'+key+'" '+((opts[key]===undefined?defaultValue:opts[key])?'checked':'')+'> '+label+'</label>';
 const scene=()=>{
   controls.push(group('Окружение, погода и свет','Все параметры сцены собраны здесь. Выбранные условия передаются в реальный AI-запрос.'));
   controls.push(select('environment','Окружение',ENVIRONMENTS,getOpt(n,'environment','keep')));
   controls.push(select('weather','Погода',WEATHER,getOpt(n,'weather','keep')));
   controls.push('<div class="fa-node-two-col">'+select('season','Сезон',SEASONS,getOpt(n,'season','keep'))+select('time','Время суток',TIMES,getOpt(n,'time','keep'))+'</div>');
   controls.push(select('plants','Растительность',PLANTS,getOpt(n,'plants','keep')));
   controls.push(textarea('environmentInstructions','Описание участка / окружающей среды',opts.environmentInstructions,'Например: взрослые сосны, глубокий передний план, травы, природный камень',2));
   controls.push(group('Камера и качество'));
   controls.push('<div class="fa-node-two-col">'+select('lens','Объектив',LENSES,getOpt(n,'lens','keep'))+select('ratio','Формат кадра',RATIOS,getOpt(n,'ratio','16:9'))+'</div>');
   controls.push(select('quality','Качество',{'high':'Высокое','medium':'Стандартное'},getOpt(n,'quality','high')));
   controls.push(check('lockGeometry','Сохранить точную геометрию и ракурс',true));
   controls.push(textarea('changes','Дополнительные изменения',opts.changes,'Только явно указанные изменения; остальное оставить как в оригинале',3));
 };
 if(n.type==='exterior'){scene();}
 if(n.type==='lighting'){
   scene();
   controls.push('<p>Этап меняет атмосферу предыдущего кадра. Материалы и архитектуру следует сохранять.</p>');
 }
 if(n.type==='interior'){
   controls.push(group('Помещение и дизайн'));
   controls.push(select('room','Тип помещения',{living:'Гостиная',kitchen:'Кухня',bedroom:'Спальня',bathroom:'Ванная',office:'Кабинет',commercial:'Коммерческое помещение',hall:'Прихожая / холл',dining:'Столовая'},getOpt(n,'room','living')));
   controls.push(select('style','Стиль интерьера',{'as-is':'Строго по исходнику','warm-modern':'Тёплый современный','japandi':'Джапанди','minimal':'Минимализм','contemporary':'Современный премиум','classic':'Современная классика','loft':'Лофт'},getOpt(n,'style','as-is')));
   controls.push(select('lighting','Освещение',{'soft-daylight':'Мягкий дневной свет',sunny:'Солнечный день',overcast:'Пасмурный день',evening:'Вечерний свет',studio:'Архитектурная фотосъёмка'},getOpt(n,'lighting','soft-daylight')));
   controls.push(textarea('changes','Отделка, мебель и пожелания',opts.changes,'Например: натуральный дуб, штукатурка, сохранить мебель, добавить скрытую подсветку'));
   controls.push(group('Камера и контроль'));
   controls.push('<div class="fa-node-two-col">'+select('lens','Объектив',LENSES,getOpt(n,'lens','keep'))+select('ratio','Формат',RATIOS,getOpt(n,'ratio','16:9'))+'</div>');
   controls.push(select('quality','Качество',{'high':'Высокое',medium:'Стандартное'},getOpt(n,'quality','high')));
   controls.push(check('lockGeometry','Не менять размеры и расположение объектов',true));
 }
 if(n.type==='materials'){
   controls.push(group('Выбор поверхности и материала'));
   controls.push('<div class="fa-node-two-col">'+select('zone','Элемент',ZONES,getOpt(n,'zone','main'))+select('material','Новая отделка',MATERIALS,getOpt(n,'material','custom'))+'</div>');
   controls.push(textarea('instruction','Точное изменение',opts.instruction,'Например: только цоколь заменить на тёмный графитовый сланец, сохранить швы и всё остальное',4));
   controls.push('<p>Изменение передаётся в AI как локальная текстовая правка указанной зоны. Для точной кистевой маски используйте редактор материалов основного проекта.</p>');
 }
 if(n.type==='video'){
   controls.push(group('Камера и видео'));
   controls.push(select('cameraMove','Движение камеры',{'dolly':'Плавный наезд','pullback':'Плавный отъезд','truck':'Горизонтальный проезд','orbit':'Медленный облёт','static':'Статичная камера · движение окружения'},getOpt(n,'cameraMove','dolly')));
   controls.push(textarea('prompt','Уточнения к анимации',opts.prompt,'Например: шевелится листва и трава, вода движется, в чаше горит небольшой огонь. Не менять геометрию.',3));
   controls.push('<div class="fa-node-two-col">'+select('duration','Длительность',{'5':'5 секунд','10':'10 секунд'},getOpt(n,'duration','5'))+select('ratio','Формат',{'16:9':'16:9 · Горизонтальный','9:16':'9:16 · Вертикальный'},getOpt(n,'ratio','16:9'))+'</div>');
   controls.push('<p>Генерация через подключённый Wan API. Сначала подтверждается стоимость запроса.</p>');
   if(getAPI()?.getVideoURL?.(n.id))controls.push('<div class="fa-inspector-result"><b>Видео этого этапа</b><video controls playsinline preload="metadata" src="'+getAPI().getVideoURL(n.id)+'"></video><button type="button" data-fa-download-video="'+esc(n.id)+'">Скачать MP4</button></div>');
   controls.push('<label class="fa-flow-check"><input type="checkbox" data-node-option="reuse" '+(opts.reuse?'checked':'')+' '+(!getAPI()?.getVideoBlob?.(n.id)||opts.needsRun?'disabled':'')+'> Использовать уже готовое видео без нового запроса</label>');
 }
 if(n.type==='source'){
   controls.push(group('Исходное изображение'));
   controls.push('<p>В качестве входа используется загруженный CAD-скриншот или фотография активного проекта.</p><button type="button" class="fa-inspector-upload" data-fa-upload-source>Загрузить изображение в проект</button>');
 }
 if(AI_TYPES.has(n.type)){
  const snapshot=getAPI()?.getSnapshot?.(n.id);
  controls.push('<label class="fa-flow-check"><input type="checkbox" data-node-option="reuse" '+(opts.reuse&&!opts.needsRun?'checked':'')+' '+(!snapshot||opts.needsRun?'disabled':'')+'> Использовать уже готовый кадр без нового AI-запроса</label>');
  if(opts.needsRun)controls.push('<p class="fa-node-stale-warning">Настройки или источник изменились. Старый кадр сохранён, но повторное использование отключено до нового запуска.</p>');
  if(!snapshot)controls.push('<p>Повторное использование станет доступно после первого успешного запуска.</p>');
 }
 const snapshot=getAPI()?.getSnapshot?.(n.id);
 if(snapshot&&imageMime(snapshot))controls.push('<div class="fa-inspector-result"><b>Результат выбранной ноды</b><img src="'+snapshot+'" alt="Результат ноды"><button type="button" data-fa-download-snapshot="'+esc(n.id)+'">Скачать изображение</button><button type="button" data-fa-compare-snapshot="'+esc(n.id)+'">Сравнить A/B</button></div>');
 if(n.type==='geometry'){
  controls.push(group('Контроль геометрии'));
  controls.push(select('overlay','Прозрачность линий исходника',{'0.25':'25% · Лёгкое','0.5':'50% · Среднее','0.75':'75% · Сильное'},getOpt(n,'overlay','0.5')));
  controls.push('<p>Наложение исходного CAD-скриншота для ручного сравнения. Не является автоматическим анализом геометрии.</p>');
 }
 if(n.type==='upscale'){controls.push(group('Размер итогового кадра'));controls.push(select('target','Длинная сторона',{'2048':'2K · до 2048 px','3840':'4K · до 3840 px'},getOpt(n,'target','3840')));controls.push('<p>Локальное увеличение средствами браузера. Это не AI-upscale: недостающая детализация не восстанавливается.</p>');}
 if(n.type==='export'){controls.push(group('Сохранение результата'));controls.push(select('format','Формат изображения',{'original':'Оригинальный формат','png':'PNG · без потерь','jpeg':'JPEG · качество 94%','webp':'WebP'},getOpt(n,'format','original')));controls.push('<p>Видеорезультат сохраняется в MP4. Кадры AI остаются в проекте, экспорт скачивает итог выбранной ветки.</p>');}
 if(BLOCKED_TYPES.has(n.type)){controls.push(group('3D-модель'));controls.push('<p>Требуется отдельная интеграция 3D-движка. Фальшивый 3D-результат не создаётся.</p>');}
 const history=getAPI()?.historyFor?.(n.id)||[];
 if(history.length)controls.push('<div class="fa-inspector-history"><b>ИСТОРИЯ РЕЗУЛЬТАТОВ</b>'+history.map((h,i)=>'<button type="button" data-fa-restore-history="'+esc(h.key)+'" data-fa-history-node="'+esc(n.id)+'">↶ Версия '+(i+1)+' · '+new Date(h.time).toLocaleString('ru-RU')+'</button>').join('')+'</div>');
 return '<b>НАСТРОЙКИ НОДЫ</b><h4>'+esc(n.title||n.type)+'</h4><div class="fa-flow-node-fields">'+(controls.join('')||'<p>Дополнительных параметров нет.</p>')+'</div><small>Проверяйте полученное изображение по исходнику: генеративный AI может изменять отдельные детали.</small>';
}
function showSelection(){
 const host=$('#faFlowNodeSettings'),g=graph();if(!host||!g)return;
 const n=g.nodes.find(n=>n.id===g.selected);
 host.innerHTML=n?settingsHTML(n):'<p>Выберите карточку на холсте и настройте операцию. Кнопка «Настроить» больше не открывает другие страницы.</p>';
 const heading=$('#faFlowInspectorTitle');if(heading)heading.textContent=n?n.title||n.type:'Параметры ноды';
 if(nodeSettingsBound===host)return;
 host.addEventListener('change',event=>{
  const field=event.target.closest('[data-node-option]');if(!field)return;
  getAPI()?.setOptions?.(graph()?.selected,{[field.dataset.nodeOption]:field.type==='checkbox'?field.checked:field.value});
 });
 host.addEventListener('input',event=>{
  const field=event.target.closest('textarea[data-node-option]');
  if(!field)return;
  getAPI()?.setOptions?.(graph()?.selected,{[field.dataset.nodeOption]:field.value});
 });
 host.addEventListener('click',e=>{
  const upload=e.target.closest('[data-fa-upload-source]');
  if(upload){window.FORMA_RENDER_BRIDGE?.openUpload?.();return}
  const download=e.target.closest('[data-fa-download-snapshot]');
  if(download){const image=getAPI()?.getSnapshot?.(download.dataset.faDownloadSnapshot);if(image)downloadImage(image);return}
  const compare=e.target.closest('[data-fa-compare-snapshot]');
  if(compare){getAPI()?.addCompare?.(compare.dataset.faCompareSnapshot);return}
  const previous=e.target.closest('[data-fa-restore-history]');
  if(previous){getAPI()?.recallHistory?.(previous.dataset.faHistoryNode,previous.dataset.faRestoreHistory);return}
  const video=e.target.closest('[data-fa-download-video]');
  if(video){getAPI()?.downloadVideo?.(video.dataset.faDownloadVideo);return}
 });
 nodeSettingsBound=host;
}
function imageMime(src){return String(src||'').match(/^data:image\/(png|jpeg|webp);base64,/i)?.[1]||null}
async function availability(calls){
 if(!calls)return;
 if(apiPreview())throw Error('Это предпросмотр интерфейса. Для платного AI нужна серверная версия с API.');
 let r;try{r=await fetch('/api/status',{cache:'no-store'})}catch{throw Error('Сервер рендера недоступен.')}
 if(!r.ok)throw Error('Не удалось проверить подключение AI.');
 const data=await r.json();
 if(!data.ready)throw Error('AI-ключ на сервере ещё не подключён.');
 if(Number.isFinite(data.dailyRemaining)&&data.dailyRemaining<calls)throw Error('Недостаточно запросов на сегодня: нужно '+calls+', осталось '+data.dailyRemaining+'.');
}
async function imageAI(source,brief,ctx,options={}){
 if(!imageMime(source))throw Error('Неподдерживаемый формат исходного изображения.');
 aborter=new AbortController();
 const timer=setTimeout(()=>aborter?.abort(),240000);
 try{
  const r=await fetch('/api/render',{
   method:'POST',headers:{'Content-Type':'application/json'},
   signal:aborter.signal,
   body:JSON.stringify({
    image:source,brief,quantity:1,size:({'16:9':'1536x864','3:2':'1536x1024','4:3':'1360x1024','1:1':'1024x1024','9:16':'864x1536'})[brief.output?.ratio]||ctx.size,quality:brief.output?.quality||ctx.quality,
    selectedZone:options.selectedZone||null,zoneId:options.zoneId||null,
    editMode:options.editMode||null,editAction:options.editAction||null,
    materialInstruction:options.materialInstruction||null
   })
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error((data.error||'Сервер вернул ошибку '+r.status)+(data.requestId?' · Код запроса: '+data.requestId:''));
  if(!Array.isArray(data.images)||!data.images[0])throw Error('Сервер не вернул изображение.'+(data.requestId?' · Код запроса: '+data.requestId:''));
  const img='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
  if(!imageMime(img))throw Error('Сервер вернул неподдерживаемый файл.');
  return img;
 }catch(err){
  if(err.name==='AbortError'||wasCancelled)throw Error('Запуск остановлен. Запрос мог продолжиться на сервере и привести к списанию средств.');
  throw err;
 }finally{clearTimeout(timer);aborter=null}
}
async function canvas4K(source,target=3840){
 const im=new Image();im.src=source;await im.decode();
 const longest=Math.max(im.naturalWidth,im.naturalHeight);
 if(!longest)throw Error('Невозможно определить размер изображения.');
 const scale=Math.max(1,Number(target)===2048?2048/longest:3840/longest);
 const w=Math.round(im.naturalWidth*scale),h=Math.round(im.naturalHeight*scale);
 if(w*h>25_000_000)throw Error('Это изображение превышает лимит локальной обработки.');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 return canvas.toDataURL('image/png');
}
async function downloadImage(img,options={}){
 const format=options?.format||'original';
 let src=img,ext=imageMime(img)==='jpeg'?'jpg':imageMime(img)||'png';
 if(['jpeg','webp','png'].includes(format)){
  const im=new Image();im.src=img;await im.decode();
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Экспорт в выбранный формат недоступен.');
  if(format==='jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height)}
  ctx.drawImage(im,0,0);
  src=c.toDataURL('image/'+format,format==='jpeg'?.94:undefined);
  ext=format==='jpeg'?'jpg':format;
 }
 const link=document.createElement('a');link.href=src;link.download='forma-node-'+Date.now()+'.'+ext;
 document.body.append(link);link.click();link.remove();
}

async function geometryOverlay(image,source,opacity){
 const [im,ref]=await Promise.all([new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=image}),new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=source})]);
 const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 if(c.width*c.height>25_000_000)throw Error('Слишком большой кадр для визуального наложения.');
 const ctx=c.getContext('2d');if(!ctx)throw Error('Наложение недоступно.');
 ctx.drawImage(im,0,0,c.width,c.height);
 ctx.globalAlpha=Math.max(.05,Math.min(.95,Number(opacity)||.5));
 ctx.drawImage(ref,0,0,c.width,c.height);
 ctx.globalAlpha=1;
 return c.toDataURL('image/png');
}
async function checkVideoAvailability(){
 if(apiPreview())throw Error('Видео требует серверную версию ФОРМА.');
 let res;try{res=await fetch('/api/wan/status',{cache:'no-store'})}catch{throw Error('Видеосервис недоступен.')}
 if(!res.ok)throw Error('Состояние видеомодели не получено.');
 const data=await res.json();
 if(!data.ready)throw Error(data.reason||'Wan 2.6 не подключена к серверу. Нужен OpenRouter API и разрешение WAN_VIDEO_ENABLED.');
 if(Number.isFinite(data.remaining)&&data.remaining<1)throw Error('Дневной лимит видео исчерпан.');
}
async function prepareVideoFrame(source){
 const im=new Image();im.src=source;await im.decode();
 const scale=Math.min(1,1920/Math.max(im.naturalWidth,im.naturalHeight));
 const w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Не удалось подготовить видео-кадр.');
 ctx.drawImage(im,0,0,w,h);
 const image=canvas.toDataURL('image/jpeg',.88);
 if(image.length>10_500_000)throw Error('Первый кадр видео больше 8 МБ. Используйте меньший кадр.');
 return image;
}
function downloadVideoBlob(blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='forma-architecture-'+Date.now()+'.mp4';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
async function makeVideo(source,options){
 const image=await prepareVideoFrame(source);
 const movements={dolly:'Slow cinematic dolly forward.',pullback:'Slow cinematic dolly backward.',truck:'Slow horizontal camera slide.',orbit:'Gentle partial orbit around the building.',static:'Camera absolutely locked off, only natural water, foliage and atmosphere move.'};
 const prompt=(movements[options?.cameraMove||'dolly']+' '+String(options?.prompt||'Preserve exact building, camera geometry and natural lighting.')).trim().slice(0,500);
 const duration=Number(options?.duration||5),ratio=options?.ratio==='9:16'?'9:16':'16:9';
 if(prompt.length<12)throw Error('Для анимации укажите движение камеры.');
 const ctrl=new AbortController();aborter=ctrl;
 try{
  let res=await fetch('/api/wan/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,prompt,duration,ratio}),signal:ctrl.signal});
  let info=await res.json().catch(()=>({}));
  if(!res.ok||!info.id)throw Error(info.error||'Видеомодель не приняла задание.');
  const jobId=encodeURIComponent(info.id);
  for(let attempt=0;attempt<90;attempt++){
   if(wasCancelled)throw Error('Генерация видео остановлена. Задание у провайдера могло продолжиться.');
   await new Promise(resolve=>setTimeout(resolve,4000));
   res=await fetch('/api/wan/job?id='+jobId,{cache:'no-store',signal:ctrl.signal});
   info=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(info.error||'Не удаётся получить состояние видео.');
   if(info.status==='completed'){
    const file=await fetch('/api/wan/download?id='+jobId,{signal:ctrl.signal});
    if(!file.ok)throw Error('Видео создано, но сервер не отдал MP4. Проверьте видео-проект.');
    const blob=await file.blob();
    if(!blob.size||blob.size>180*1024*1024)throw Error('Недопустимый размер видео от провайдера.');
    return blob;
   }
   if(['failed','cancelled','expired'].includes(info.status))throw Error(info.error||'Видео не создано.');
   tell('Видео Wan · '+(info.status==='in_progress'?'генерируется':'ожидание')+' · проверка '+(attempt+1));
  }
  throw Error('Истекло время проверки статуса видео. Проверьте историю заданий.');
 }finally{aborter=null}
}

function briefFor(ctx,previousMode,n){
 const b=JSON.parse(JSON.stringify(ctx.brief));
 const o=n.options||{};
 b.sceneType=previousMode;
 if(n.type==='exterior')b.sceneType='exterior';
 if(n.type==='interior'){
  b.sceneType='interior';b.room=o.room||'living';b.style=o.style||'as-is';
  b.lighting=o.lighting||'soft-daylight';b.furniture='preserve';
  b.surfaces='';b.notes=String(o.changes||'').trim().slice(0,500);
 }
 const envLabel=ENVIRONMENTS[o.environment||'keep'];
 const weatherLabel=WEATHER[o.weather||'keep'];
 const seasonLabel=SEASONS[o.season||'keep'];
 const timeLabel=TIMES[o.time||'keep'];
 const plantsLabel=PLANTS[o.plants||'keep'];
 if(n.type==='exterior'||n.type==='lighting'){
   if(o.environment&&o.environment!=='keep')b.environment=envLabel;
   if(o.weather&&o.weather!=='keep')b.weather=weatherLabel;
   if(o.season&&o.season!=='keep')b.season=seasonLabel;
   if(o.time&&o.time!=='keep')b.time=timeLabel;
   if(o.plants&&o.plants!=='keep')b.plants=plantsLabel;
   if(o.environmentInstructions)b.environmentInstructions=String(o.environmentInstructions).trim().slice(0,350);
   // Derive a consistent atmosphere from the same controls rather than contradicting the weather.
   if(!o.time&&!o.weather&&o.mood)b.sceneMood=o.mood;
   if(o.time==='blue')b.sceneMood='blue';
   else if(o.time==='golden')b.sceneMood='golden';
   else if(o.time==='night')b.sceneMood='night';
   else if(o.weather==='sunny')b.sceneMood='sunny';
   else if(o.weather==='overcast')b.sceneMood='overcast';
   else if(o.weather==='fog')b.sceneMood='fog';
   else if(o.weather==='rain')b.sceneMood='rain';
   else if(o.weather==='snow')b.sceneMood='winter';
   if(n.type==='lighting'&&previousMode==='interior'){
    b.lighting=({'blue':'evening','golden':'evening','night':'evening','sunny':'sunny','overcast':'overcast'})[b.sceneMood]||b.lighting||'soft-daylight';
   }
 }
 if(o.lens&&o.lens!=='keep'){const instruction='Architectural camera lens '+o.lens+'. Preserve the perspective and placement of all architectural elements.';b.homeChanges=[b.homeChanges,instruction].filter(Boolean).join(' ').slice(0,600);}
 if(o.changes){b.homeChanges=[b.homeChanges,String(o.changes).trim()].filter(Boolean).join(' ').slice(0,600);}
 if(o.lockGeometry===true||o.lockGeometry===undefined)b.lockGeometry=true;
 if(o.ratio&&RATIOS[o.ratio])b.output={...(b.output||{}),ratio:o.ratio};
 if(o.quality&&['high','medium'].includes(o.quality))b.output={...(b.output||{}),quality:o.quality};
 return b;
}
async function runTo(target){
 if(busy){tell('Сначала остановите текущую цепочку.');return}
 const api=getAPI(),g=graph();if(!api||!g)return;
 let plan;try{plan=checkPlan(g,target)}catch(err){tell(err.message);return}
 const calls=plan.calls,videoCalls=plan.videoCalls;
 let ctx;try{ctx=await window.FORMA_RENDER_BRIDGE?.capture?.();if(!ctx)throw Error('Сначала загрузите собственный проект в «ФОРМА».');await availability(calls);if(videoCalls)await checkVideoAvailability()}
 catch(err){tell(err.message);return}
 if(calls||videoCalls){
  const ok=confirm('Запустить цепочку? Генераций изображений: '+calls+'. Генераций видео: '+videoCalls+'. Каждый запрос учитывается по тарифу/квоте провайдера; отмена в браузере может не отменить списание.');
  if(!ok){tell('Запуск отменён.');return}
 }
 const runId=++openedRunId;
 busy=true;wasCancelled=false;aborter=null;
 decorate();statuses.clear();
 let output=ctx.source,mode=ctx.brief?.sceneType||'exterior',currentBrief=ctx.brief,aiCompleted=0,videoCompleted=0,lastAI='',videoBlob=null;
 try{
  for(const [i,n] of plan.path.entries()){
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   setState(n.id,'running');
   tell('Этап '+(i+1)+'/'+plan.path.length+': '+(n.title||n.type));
   if(n.type==='source'){output=ctx.source}
   else if(AI_TYPES.has(n.type)){
    const brief=briefFor({...ctx,brief:currentBrief},mode,n);mode=brief.sceneType;currentBrief=brief;
    const cached=n.options?.reuse?api.getSnapshot?.(n.id):null;
    if(cached){output=cached;tell('Использован готовый кадр: '+(n.title||n.type)+' · бесплатно');}
    else {
     const materialChoice=n.options?.material&&n.options.material!=='custom'?MATERIALS[n.options.material]:'';const instruction=[materialChoice?'Заменить отделку на '+materialChoice+'. Не изменять другие элементы.':'',String(n.options?.instruction||'')].filter(Boolean).join(' ').slice(0,500);const opts=n.type==='materials'?{selectedZone:ZONES[n.options?.zone]||ZONES.custom,zoneId:n.options?.zone||'custom',editMode:'text',editAction:'material',materialInstruction:instruction}:{};
     output=await imageAI(output,brief,ctx,opts);aiCompleted++;lastAI=n.title||n.type;
    }
   }else if(n.type==='video'){
    const cached=n.options?.reuse?api.getVideoBlob?.(n.id):null;
    videoBlob=cached||await makeVideo(output,n.options);
    if(!cached){videoCompleted++;lastAI=n.title||n.type;await api.setVideoSnapshot?.(n.id,videoBlob)}
   }else if(n.type==='geometry'){output=await geometryOverlay(output,ctx.source,n.options?.overlay)}
   else if(n.type==='upscale'){output=await canvas4K(output,n.options?.target)}
   else if(n.type==='export'){if(videoBlob)downloadVideoBlob(videoBlob);else await downloadImage(output,n.options)}
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   if(!videoBlob&&(!api.getSnapshot?.(n.id)||api.getSnapshot(n.id)!==output))await api.setSnapshot?.(n.id,output);
   setState(n.id,'done');
  }
  if(aiCompleted){
   await window.FORMA_RENDER_BRIDGE.saveWorkflowResult(output,'Ноды · '+lastAI,ctx.projectId);
  }
  tell('Готово: '+plan.path.length+' этапов · '+aiCompleted+' изображений · '+videoCompleted+' видео. Кадры и MP4 сохранены в нодах, AI-кадры — в галерее.');
 }catch(err){
  const pending=plan.path.find(n=>statuses.get(n.id)==='running');
  if(pending)setState(pending.id,wasCancelled?'cancelled':'error');
  tell((wasCancelled?'Остановлено. ':'Ошибка: ')+(err.message||'неизвестная ошибка')+(aiCompleted?' · Выполнено AI-вызовов: '+aiCompleted:''));
 }finally{
  if(runId===openedRunId){busy=false;aborter=null;decorate()}
 }
}
function stop(){
 if(!busy)return;
 wasCancelled=true;aborter?.abort();
 tell('Остановка запрошена. Провайдер может продолжить уже начатую генерацию и списать её стоимость.');
}
function onOpen(){nodeSettingsBound=null;showSelection();decorate()}
function onGraphDrawn(){showSelection();decorate()}
function onClose(){if(busy)stop();nodeSettingsBound=null}
window.FORMA_NODE_ENGINE={runTo,stop,onOpen,onGraphDrawn,onClose,plan:checkPlan,get busy(){return busy}};
})();
