/* ФОРМА · Исполняемые архитектурные цепочки (обособленный модуль).
   Только существующий /api/render, без передачи API-ключей в браузер.
   Платные вызовы требуют подтверждения, результат узла закрепляется отдельно. */
(() => {
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const getAPI=()=>window.FORMA_NODES;
const AI_TYPES=new Set(['exterior','interior','lighting','materials']);
const BLOCKED_TYPES=new Set(['video','image3d','geometry']);
const AVAILABLE_TYPES=new Set(['source','exterior','interior','lighting','materials','upscale','export']);
const LABELS={running:'ВЫПОЛНЯЕТСЯ',done:'ГОТОВО',error:'ОШИБКА',cancelled:'ОСТАНОВЛЕНО'};
const LIGHTS={sunny:'Солнечный день',golden:'Золотой час',overcast:'Пасмурно',blue:'Синий час',rain:'После дождя',winter:'Зима',night:'Ночь'};
const ZONES={main:'Фасад',roof:'Кровля',windows:'Окна',doors:'Двери',base:'Цоколь',terrace:'Терраса',custom:'Другая поверхность'};
let busy=false,aborter=null,wasCancelled=false,nodeSettingsBound=null,openedRunId=0;
const statuses=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiPreview=()=>location.protocol==='file:'||/\.github\.io$/i.test(location.hostname);
function graph(){return getAPI()?.graph?.()}
function tell(s){getAPI()?.showStatus?.(s)}
function checkPlan(g,target){
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
 const invalid=path.find(n=>n.type==='materials'&&!String(n.options?.instruction||'').trim());
 if(invalid)throw Error('Для ноды «Материалы» напишите конкретную инструкцию по редактированию.');
 const calls=path.filter(n=>AI_TYPES.has(n.type)&&!(n.options?.reuse&&getAPI()?.getSnapshot?.(n.id))).length;
 if(calls>8)throw Error('Для контроля стоимости разрешено не более 8 AI-этапов в цепочке.');
 return {path,calls};
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
 if(run)run.disabled=busy;
 if(stop)stop.disabled=!busy;
}
function setState(id,value){statuses.set(id,value);decorate()}
function settingsHTML(n){
 const opts=n.options||{},controls=[];
 const select=(key,label,list,value)=>'<label>'+label+'<select data-node-option="'+key+'">'+
  Object.entries(list).map(([k,v])=>'<option value="'+k+'"'+(k===value?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';
 if(n.type==='exterior'||n.type==='lighting')controls.push(select('mood','Свет и атмосфера',LIGHTS,opts.mood||'overcast'));
 if(n.type==='interior'){
  controls.push(select('room','Тип помещения',{living:'Гостиная',kitchen:'Кухня',bedroom:'Спальня',bathroom:'Ванная',office:'Кабинет',commercial:'Коммерческий'},opts.room||'living'));
  controls.push(select('style','Стиль',{'as-is':'Строго по исходнику','warm-modern':'Тёплый современный','japandi':'Джапанди','minimal':'Минимализм','contemporary':'Премиум современный','classic':'Современная классика'},opts.style||'as-is'));
  controls.push(select('lighting','Освещение',{'soft-daylight':'Мягкий дневной','sunny':'Солнечный','overcast':'Пасмурный','evening':'Вечер','studio':'Редакционная съёмка'},opts.lighting||'soft-daylight'));
 }
 if(n.type==='materials'){
  controls.push(select('zone','Элемент',ZONES,opts.zone||'custom'));
  controls.push('<label>Точное изменение<textarea data-node-option="instruction" rows="4" maxlength="500" placeholder="Например: заменить только деревянную отделку стены на светлый травертин; сохранить ракурс и геометрию.">'+esc(opts.instruction||'')+'</textarea></label>');
 }
 if(n.type==='source')controls.push('<p>Нода получает реальный загруженный исходник активного проекта, не демонстрационный кадр.</p><button type="button" class="fa-inspector-upload" data-fa-upload-source>Загрузить свой исходник</button>');
 if(AI_TYPES.has(n.type)){
  const snapshot=getAPI()?.getSnapshot?.(n.id);
  controls.push('<label class="fa-flow-check"><input type="checkbox" data-node-option="reuse" '+(opts.reuse?'checked':'')+' '+(!snapshot?'disabled':'')+'> Повторно использовать уже готовый кадр без вызова AI</label>');
  if(!snapshot)controls.push('<p>Повторное использование доступно после первого успешного запуска этого узла.</p>');
 }
 const snapshot=getAPI()?.getSnapshot?.(n.id);
 if(snapshot&&imageMime(snapshot))controls.push('<div class="fa-inspector-result"><b>Кадр этой ноды</b><img src="'+snapshot+'" alt="Сохранённый результат ноды"><button type="button" data-fa-download-snapshot="'+esc(n.id)+'">Скачать кадр</button><button type="button" data-fa-compare-snapshot="'+esc(n.id)+'">Добавить в сравнение A/B</button></div>');
 if(n.type==='upscale')controls.push('<p>Локальное увеличение до 3840 пикселей по длинной стороне. Это НЕ нейросетевое улучшение детализации.</p>');
 if(n.type==='export')controls.push('<p>Скачивание файла и сохранение результатов AI-цепочки в галерее проекта.</p>');
 if(BLOCKED_TYPES.has(n.type))controls.push('<p>Автоматическое выполнение требует отдельной интеграции. В этой версии такая операция не запускается.</p>');
 return '<b>НАСТРОЙКИ НОДЫ</b><h4>'+esc(n.title||n.type)+'</h4><div class="fa-flow-node-fields">'+
  (controls.join('')||'<p>Дополнительных параметров пока нет.</p>')+'</div>'+
  '<small>ИИ может ошибаться с окнами, венцами и размерами — проверяйте результат по CAD-исходнику.</small>';
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
  const n=graph()?.nodes.find(n=>n.id===graph()?.selected);
  if(n){n.options={...(n.options||{}),[field.dataset.nodeOption]:field.value};getAPI()?.save?.()}
 });
 host.addEventListener('click',e=>{
  const upload=e.target.closest('[data-fa-upload-source]');
  if(upload){window.FORMA_RENDER_BRIDGE?.openUpload?.();return}
  const download=e.target.closest('[data-fa-download-snapshot]');
  if(download){const image=getAPI()?.getSnapshot?.(download.dataset.faDownloadSnapshot);if(image)downloadImage(image);return}
  const compare=e.target.closest('[data-fa-compare-snapshot]');
  if(compare){getAPI()?.addCompare?.(compare.dataset.faCompareSnapshot);return}
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
 const timer=setTimeout(()=>aborter?.abort(),180000);
 try{
  const r=await fetch('/api/render',{
   method:'POST',headers:{'Content-Type':'application/json'},
   signal:aborter.signal,
   body:JSON.stringify({
    image:source,brief,quantity:1,size:ctx.size,quality:ctx.quality,
    selectedZone:options.selectedZone||null,zoneId:options.zoneId||null,
    editMode:options.editMode||null,editAction:options.editAction||null,
    materialInstruction:options.materialInstruction||null
   })
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(data.error||'Сервер вернул ошибку '+r.status);
  if(!Array.isArray(data.images)||!data.images[0])throw Error('Сервер не вернул изображение.');
  const img='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
  if(!imageMime(img))throw Error('Сервер вернул неподдерживаемый файл.');
  return img;
 }catch(err){
  if(err.name==='AbortError'||wasCancelled)throw Error('Запуск остановлен. Запрос мог продолжиться на сервере и привести к списанию средств.');
  throw err;
 }finally{clearTimeout(timer);aborter=null}
}
async function canvas4K(source){
 const im=new Image();im.src=source;await im.decode();
 const longest=Math.max(im.naturalWidth,im.naturalHeight);
 if(!longest)throw Error('Невозможно определить размер изображения.');
 const scale=Math.max(1,3840/longest);
 const w=Math.round(im.naturalWidth*scale),h=Math.round(im.naturalHeight*scale);
 if(w*h>25_000_000)throw Error('Это изображение превышает лимит локальной обработки.');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 return canvas.toDataURL('image/png');
}
function downloadImage(img){
 const ext=imageMime(img)==='jpeg'?'jpg':imageMime(img)||'png';
 const link=document.createElement('a');link.href=img;link.download='forma-node-'+Date.now()+'.'+ext;
 document.body.append(link);link.click();link.remove();
}
function briefFor(ctx,previousMode,n){
 const b=JSON.parse(JSON.stringify(ctx.brief));
 b.sceneType=previousMode;
 if(n.type==='exterior'){b.sceneType='exterior';b.sceneMood=n.options?.mood||b.sceneMood||'overcast'}
 if(n.type==='interior'){
  b.sceneType='interior';b.room=n.options?.room||'living';
  b.style=n.options?.style||'as-is';b.lighting=n.options?.lighting||'soft-daylight';
  b.furniture='preserve';b.surfaces='';b.notes='';
 }
 if(n.type==='lighting'){
  const mood=n.options?.mood||'overcast';
  if(previousMode==='interior')b.lighting=({blue:'evening',golden:'evening',night:'evening',winter:'overcast',rain:'overcast',sunny:'sunny',overcast:'overcast'})[mood]||'soft-daylight';
  else b.sceneMood=mood;
 }
 return b;
}
async function runTo(target){
 if(busy){tell('Сначала остановите текущую цепочку.');return}
 const api=getAPI(),g=graph();if(!api||!g)return;
 let plan;try{plan=checkPlan(g,target)}catch(err){tell(err.message);return}
 const calls=plan.calls;
 let ctx;try{ctx=await window.FORMA_RENDER_BRIDGE?.capture?.();if(!ctx)throw Error('Сначала загрузите собственный проект в «ФОРМА».');await availability(calls)}
 catch(err){tell(err.message);return}
 if(calls){
  const ok=confirm('Запустить ветку с '+calls+' платными AI-вызовами? Каждый этап оплачивается отдельно у провайдера. Остановка в браузере не отменяет уже начатое списание.');
  if(!ok){tell('Запуск отменён.');return}
 }
 const runId=++openedRunId;
 busy=true;wasCancelled=false;aborter=null;
 decorate();statuses.clear();
 let output=ctx.source,mode=ctx.brief?.sceneType||'exterior',aiCompleted=0,lastAI='';
 try{
  for(const [i,n] of plan.path.entries()){
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   setState(n.id,'running');
   tell('Этап '+(i+1)+'/'+plan.path.length+': '+(n.title||n.type));
   if(n.type==='source'){output=ctx.source}
   else if(AI_TYPES.has(n.type)){
    const brief=briefFor(ctx,mode,n);mode=brief.sceneType;
    const cached=n.options?.reuse?api.getSnapshot?.(n.id):null;
    if(cached){output=cached;tell('Использован готовый кадр: '+(n.title||n.type)+' · бесплатно');}
    else {
     const opts=n.type==='materials'?{selectedZone:ZONES[n.options?.zone]||ZONES.custom,zoneId:n.options?.zone||'custom',editMode:'text',editAction:'material',materialInstruction:String(n.options?.instruction||'').slice(0,500)}:{};
     output=await imageAI(output,brief,ctx,opts);aiCompleted++;lastAI=n.title||n.type;
    }
   }else if(n.type==='upscale'){output=await canvas4K(output)}
   else if(n.type==='export'){downloadImage(output)}
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   if(!api.getSnapshot?.(n.id)||api.getSnapshot(n.id)!==output)await api.setSnapshot?.(n.id,output);
   setState(n.id,'done');
  }
  if(aiCompleted){
   await window.FORMA_RENDER_BRIDGE.saveWorkflowResult(output,'Ноды · '+lastAI,ctx.projectId);
  }
  tell('Готово: '+plan.path.length+' этапов · '+aiCompleted+' AI-вызовов. Результаты закреплены за нодами и сохранены в галерею.');
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
