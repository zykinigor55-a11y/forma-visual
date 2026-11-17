import './forma-materials-upload.js';
import {PLAN_STYLES,PLAN_PRESENTATIONS,PLAN_2D_STYLES,normalizeCrop,assertFrameBinding,assertRoomReady} from './forma-image-workflows.js?v=five-concept-presentations-v2';
import {canvas,loadImage} from './forma-local-composite.js';
const $=s=>document.querySelector(s),bridge=()=>window.FORMA_ART_BRIDGE;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PLAN_CONCEPT_INFO={
 technical:{num:'01',desc:'Линии, размеры и чертёжная иерархия'},
 warm:{num:'02',desc:'Реальные материалы и мягкие физические тени'},
 zoning:{num:'03',desc:'Функции помещений и пути движения'},
 graphite:{num:'04',desc:'Бумага, фактуры и графика портфолио'},
 watercolor:{num:'05',desc:'Ручная тушь и акварельная фактура'}
};
let state=null,run=false,token=0;
async function readImage(file){if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Выберите PNG, JPG или WebP');if(file.size>14*1024*1024)throw Error('Максимальный размер — 14 МБ');const result=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Не удалось прочитать файл'));r.readAsDataURL(file);});await loadImage(result);return result;}
const select=(id,label,values)=>`<label class="fs-image-field">${label}<select id="${id}">${Object.entries(values).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
function status(s){if($('#studioImageStatus'))$('#studioImageStatus').textContent=s;}
async function compactImage(url,max=1800){const i=await loadImage(url),factor=Math.min(1,max/Math.max(i.naturalWidth,i.naturalHeight)),c=canvas(Math.round(i.naturalWidth*factor),Math.round(i.naturalHeight*factor));c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.95);}
async function cropImage(url,rect,max=3840){const i=await loadImage(url),r=normalizeCrop(rect),w=Math.round(i.naturalWidth*r.w),h=Math.round(i.naturalHeight*r.h),f=Math.min(1,max/Math.max(w,h)),c=canvas(Math.max(1,Math.round(w*f)),Math.max(1,Math.round(h*f)));c.getContext('2d').drawImage(i,i.naturalWidth*r.x,i.naturalHeight*r.y,w,h,0,0,c.width,c.height);return c.toDataURL('image/png');}
function imageView(){return `<div class="fs-image-stage"><img id="studioImageSource" alt="Исходное изображение"><div id="studioImageSelection" role="img" aria-label="Выбранная область"></div><button type="button" id="studioImageSelect" aria-label="Обведите область на исходном изображении"></button></div><div class="fs-crop-numbers">${['x','y','w','h'].map(k=>`<label>${{x:'Слева',y:'Сверху',w:'Ширина',h:'Высота'}[k]} %<input type="number" min="0" max="100" step="1" data-crop="${k}" value="${{x:20,y:20,w:40,h:40}[k]}"></label>`).join('')}</div>${state?.kind==='frames'?'<p class="fs-selection-guide" id="fsSelectionGuide">1. Обведите участок на изображении. Рамка задаёт весь будущий кадр.</p><div class="fs-detail-preview"><img id="fsCropPreview" alt="Выбранный участок до AI"><span>Выбранный участок · исходные пиксели</span></div>':''}<p id="studioImageStatus" class="fs-image-status" role="status" aria-live="polite"></p><div id="studioImageResults" class="fs-image-results"></div>`;}
function updateSelection(){if(!state)return;const c=state.crop,box=$('#studioImageSelection');if(box)Object.assign(box.style,{left:c.x*100+'%',top:c.y*100+'%',width:c.w*100+'%',height:c.h*100+'%'});document.querySelectorAll('[data-crop]').forEach(i=>i.value=Math.round(c[i.dataset.crop]*100));}
async function previewCrop(){const own=state,version=token;if(own?.kind!=='frames'||!own.source)return;try{const rect={...normalizeCrop(own.crop)},url=await cropImage(own.source,rect,640);if(state===own&&token===version&&JSON.stringify(rect)===JSON.stringify(own.crop)){const img=$('#fsCropPreview');if(img)img.src=url;}}catch{}}
function setView(url){state.viewImage=url;const im=$('#studioImageSource');im.hidden=!url;if(url)im.src=url;else im.removeAttribute('src');im.parentElement.classList.toggle('is-empty',!url);updateSelection();updateActions();previewCrop();}
function updateActions(){if(!state||run)return;for(const id of ['fsDetail','fsCrop','fsAddCrop']){const control=$('#'+id);if(control){let valid=!!state.source&&!state.loading;try{normalizeCrop(state.crop);}catch{valid=false;}control.disabled=!valid;}}const button=$('#fsRoomGenerate');if(button)button.disabled=!(state.planResult&&state.planApproved&&state.roomSelected&&state.viewImage===state.planResult);const btn2d=$('#fsPlan2DGenerate');if(btn2d)btn2d.disabled=!state.source||state.loading;const show2d=$('#fsPlan2DShowVariant');if(show2d)show2d.disabled=!state.plan2dResult;const approve=$('#fsApprovePlan');if(approve)approve.disabled=!state.planResult;}
function selectRoom(){if(state?.kind==='plan'){state.roomSelected=state.planApproved&&state.viewImage===state.planResult;updateActions();}}
function bindSelection(){const el=$('#studioImageSelect');let start=null;
 const point=e=>{const r=el.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};};
 el.addEventListener('pointerdown',e=>{if(run)return;start=point(e);el.setPointerCapture(e.pointerId);status(state?.kind==='plan'?'Обведите одну комнату на готовом 3D-плане.':'Обведите участок для крупного плана.');});el.addEventListener('pointermove',e=>{if(!start)return;const p=point(e);state.crop={x:Math.min(p.x,start.x),y:Math.min(p.y,start.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)};updateSelection();updateActions();});el.addEventListener('pointercancel',()=>{start=null;updateActions();});el.addEventListener('pointerup',()=>{start=null;try{normalizeCrop(state.crop);selectRoom();updateActions();previewCrop();status(state.kind==='plan'?(state.roomSelected?'Комната отмечена на 3D-плане. Выберите направление камеры.':'Сначала создайте и утвердите 3D-план, затем выделите комнату.'):'2. Выберите крупный план или макро и нажмите «Создать детальный кадр · AI».');}catch(e){status(e.message);}});
 document.querySelectorAll('[data-crop]').forEach(i=>i.addEventListener('input',()=>{const key=i.dataset.crop,v=Number(i.value)/100;state.crop[key]=Math.max(key==='w'||key==='h'?.02:0,Math.min(1,v));state.crop.w=Math.min(state.crop.w,1-state.crop.x);state.crop.h=Math.min(state.crop.h,1-state.crop.y);updateSelection();try{normalizeCrop(state.crop);selectRoom();previewCrop();updateActions();}catch{state.roomSelected=false;updateActions();}}));
}
function addResult(url,label){const item=document.createElement('div');item.className='fs-image-result';const img=document.createElement('img');img.src=url;img.alt=label;const name=document.createElement('b');name.textContent=label;const download=document.createElement('a');download.href=url;download.download='FORMA-'+label.replace(/[^a-zа-я0-9]+/gi,'-')+'.png';download.textContent='Скачать';item.append(img,name,download);$('#studioImageResults')?.prepend(item);}
async function markedRoomReference(image,rect){
 const i=await loadImage(image),r=normalizeCrop(rect),f=Math.min(1,1600/Math.max(i.naturalWidth,i.naturalHeight));
 const c=canvas(Math.round(i.naturalWidth*f),Math.round(i.naturalHeight*f)),ctx=c.getContext('2d');
 ctx.drawImage(i,0,0,c.width,c.height);
 const x=r.x*c.width,y=r.y*c.height,w=r.w*c.width,h=r.h*c.height;
 ctx.save();ctx.fillStyle='rgba(0,0,0,.36)';
 ctx.beginPath();ctx.rect(0,0,c.width,c.height);ctx.rect(x,y,w,h);ctx.fill('evenodd');
 ctx.lineWidth=Math.max(5,Math.round(Math.min(c.width,c.height)*.008));
 ctx.strokeStyle='#efae3d';ctx.strokeRect(x,y,w,h);ctx.restore();
 return c.toDataURL('image/png');
}
async function request(payload){
 const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({...payload,quantity:1,quality:'high'}),
  signal:AbortSignal.timeout(240000)
 });
 const data=await response.json();
 if(!response.ok||!data.images?.[0])throw Error(data.error||'Изображение не получено');
 const result='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
 if(['plan','plan2d','room'].includes(payload.imageTask?.kind)){
  // Check the true returned pixels. No fake 2K by CSS or client-side upscaling.
  try{
   const photo=await loadImage(result);
   const w=photo.naturalWidth,h=photo.naturalHeight;
   if(Math.max(w,h)<1900&&state){
    state.resolutionNotice='Внимание: API Market вернул '+w+' × '+h+' вместо запрошенного 2K. Изображение не увеличивалось искусственно.';
   }
  }catch{if(state)state.resolutionNotice='Не удалось проверить реальные пиксели результата.';}
 }
 return result;
}
function lock(value){run=value;$('#formaStudioWorkspace')?.querySelectorAll('button,input,select,textarea').forEach(el=>{if(!el.hasAttribute('data-studio-exit'))el.disabled=value;});if(!value)updateActions();}
async function execute(action){
 if(run||!state||state.loading)return;const own=state,version=token;let expected=bridge().snapshot(),acquired=false;
 try{
  own.resolutionNotice='';
  if(!own.source)throw Error('Загрузите исходное изображение');
  assertFrameBinding(expected,own.binding);
  if(action!=='crop'&&(expected.demo||!expected.hasSource))throw Error('Для AI загрузите собственное изображение');
  if(action==='room')assertRoomReady(own);
  if(!bridge().acquire())throw Error('Дождитесь текущей обработки');acquired=true;lock(true);status(action==='crop'?'Вырезаем выбранный участок без AI…':action==='detail'?'AI заново прорисовывает выбранный кадр: чёткая фактура, прежняя геометрия…':'Создаём изображение. Результат появится здесь.');
  let url,label;
  if(action==='crop'){url=await cropImage(own.source,own.crop);label='Кроп исходника · без новых деталей';}
  else if(action==='detail'){
   url=await request({image:await compactImage(await cropImage(own.source,own.crop,1800)),reference:await compactImage(own.source),imageTask:{kind:'detail',crop:own.crop,level:$('#fsDetailLevel').value,notes:$('#fsNotes').value}});label='Детальный кадр · AI-интерпретация';
  }else if(action==='plan2d'){
   const planStyle=own.plan2dStyle||'technical';
   url=await request({image:await compactImage(own.source),imageTask:{kind:'plan2d',planStyle,notes:$('#fsNotes').value}});
   label='2D-план · '+PLAN_2D_STYLES[planStyle];
   assertFrameBinding(bridge().snapshot(),expected);
   own.plan2dResult=url;
   await bridge().setAsset('plan_2d_result',url,own.projectId);
   setView(url);
  }else if(action==='room'){
   const marker=await markedRoomReference(own.planResult,own.crop);
   url=await request({image:await compactImage(own.planResult),material:marker,reference:await compactImage(own.source),
    imageTask:{kind:'room',room:{...own.crop},direction:$('#fsPlanDirection').value,style:$('#fsPlanStyle').value,notes:$('#fsNotes').value}});
   label='Фото выбранной комнаты';
  }else{
   const imageTask={kind:'plan',style:$('#fsPlanStyle').value,presentation:$('#fsPlanPresentation').value,notes:$('#fsNotes').value};
   url=await request({image:await compactImage(own.source),imageTask});
   label='3D-план · '+PLAN_PRESENTATIONS[imageTask.presentation];
   assertFrameBinding(bridge().snapshot(),expected);
   own.planResult=url;own.planApproved=false;own.roomSelected=false;
   await bridge().setAsset('plan_result',url,own.projectId);
   setView(url);$('#fsApprovePlan').disabled=false;
  }
  if(version!==token||state!==own)throw Error('Рабочее окно изменилось');
  assertFrameBinding(bridge().snapshot(),expected);await bridge().saveResult(url,label,{...expected,image:own.source});own.binding=bridge().snapshot();addResult(url,label);status('Готово · сохранено в проекте. Исходник доступен для сравнения.'+(own.resolutionNotice?' '+own.resolutionNotice:''));
 }catch(e){status(e.name==='TimeoutError'?'Время ожидания истекло. Проверьте историю перед повтором.':e.message);}finally{if(acquired)bridge().release();if(acquired&&state===own)lock(false);}
}
function drawSeries(){if(state)bridge().setAsset('series_draft',JSON.stringify({projectId:state.projectId,sourceKey:state.sourceKey,master:state.master,source:state.source,frames:state.frames}),state.projectId).catch(()=>{});const host=$('#fsSeriesList');if(!host)return;host.innerHTML=state.frames.map((f,i)=>`<div class="fs-series-item"><b>${i+1}. ${esc(f.label)}</b><small>${f.done?'Готово':f.error||'Готов к запуску'}</small><button type="button" data-series-run="${i}">${f.done?'Пересоздать':'Создать'}</button><button type="button" data-series-remove="${i}" aria-label="Удалить кадр">×</button></div>`).join('');}
async function runSeries(only=null){
 if(run||!state||state.loading)return;const own=state,version=token;
 if(!own.frames.length)return status('Добавьте кадры в серию.');
 try{assertFrameBinding(bridge().snapshot(),own.binding);}catch(e){return status(e.message);}
 if(!bridge().acquire())return status('Дождитесь обработки текущего кадра.');lock(true);
 try{
  for(const [i,f] of own.frames.entries()){
   if(only!==null&&only!==i||only===null&&f.done)continue;
   const now=bridge().snapshot();if(now.projectId!==own.projectId||now.sourceKey!==own.sourceKey||token!==version)throw Error('Проект или исходник изменился. Серия остановлена.');
   status(`Кадр ${i+1} из ${own.frames.length}: ${f.label}`);
   try{
    const url=f.kind==='crop'?await cropImage(own.source,f.crop):await request({image:await compactImage(f.input||await cropImage(own.source,f.crop)),reference:await compactImage(own.master),brief:own.brief,...(f.kind==='scene'?{sceneVariation:f.variant}:{imageTask:f.kind==='view'?{kind:'view',hasOwnSource:true,notes:''}:{kind:'detail',crop:f.crop,level:f.level||'close',notes:f.notes||''}})});
    await bridge().saveResult(url,'Серия · '+f.label,{...now,image:f.input||own.source});own.binding=bridge().snapshot();f.done=true;f.error=null;addResult(url,f.label);
   }catch(e){f.error=e.message;throw e;}
   drawSeries();
  }
  status('Серия готова. Все успешные кадры сохранены по отдельности.');
 }catch(e){drawSeries();status(e.message+' Уже созданные кадры сохранены. Повторите только неудачный.');}finally{bridge().release();lock(false);}
}
async function open({id,view,controls}){
 if(!['frames','plan'].includes(id))return;token++;const mine=token,snapshot=bridge().snapshot();state={kind:id,loading:false,loadId:0,binding:snapshot,planApproved:false,roomSelected:false,plan2dResult:null,plan2dStyle:'technical',source:id==='frames'&&snapshot.hasSource&&!snapshot.demo?snapshot.image:null,viewImage:id==='frames'&&snapshot.hasSource&&!snapshot.demo?snapshot.image:null,crop:{x:.2,y:.2,w:.4,h:.4},frames:[],master:snapshot.image,projectId:snapshot.projectId,sourceKey:snapshot.sourceKey,brief:snapshot.brief,planResult:null};
 view.innerHTML=imageView();controls.innerHTML=id==='plan'?`<div class="fs-image-intro"><small>ПЛАН → 2D / 3D / ФОТО</small><h2>Планировка в объёме.</h2><p>Пять видов 2D-подачи, объёмная визуализация плана и фотография любой выбранной комнаты.</p></div>
 <label class="fs-file">Загрузить исходный план<input id="fsSource" type="file" accept="image/png,image/jpeg,image/webp"></label>
 <section class="fs-plan-part fs-plan-2d-section">
  <span class="fs-plan-step">01 / КОНЦЕПЦИИ 2D-ПЛАНА</span><h3>Один план. Пять принципиально разных подач.</h3>
  <p class="fa-art-help">Сравните пять концепций на одной и той же планировке. Стены, окна, двери и мебель остаются в исходных координатах, меняется графический язык.</p>
  <div class="fs-plan-2d-options" role="group" aria-label="Стилистика 2D-плана">
   ${Object.entries(PLAN_2D_STYLES).map(([key,name])=>`<button type="button" class="fs-plan-2d-option" data-plan-2d-style="${key}" aria-pressed="${key==='technical'}"><span class="fs-plan-concept-preview"><img src="/assets/plan-presentations/${key}.svg?v=plan-concepts-v1" loading="lazy" decoding="async" alt="Пример подачи того же плана: ${name}"></span><span class="fs-plan-concept-copy"><em>${PLAN_CONCEPT_INFO[key].num} / ПОДАЧА</em><b>${name}</b><small>${PLAN_CONCEPT_INFO[key].desc}</small></span></button>`).join('')}
  </div>
  <button type="button" class="fa-studio-primary" id="fsPlan2DGenerate">✦ Создать 2D-план в этом стиле</button>
  <div class="fs-plan-view-switch"><button type="button" id="fsPlan2DShowOriginal">Исходный 2D</button><button type="button" id="fsPlan2DShowVariant" disabled>Оформленный 2D</button></div>
 </section>
 <section class="fs-plan-part fs-plan-3d-section">
  <span class="fs-plan-step">02 / ОБЪЁМНАЯ ПОДАЧА</span>
  ${select('fsPlanPresentation','Как показывать 3D-план',PLAN_PRESENTATIONS)}
  ${select('fsPlanStyle','Стиль интерьера',PLAN_STYLES)}
  <p id="fsPlanProvider" class="fa-art-help">Проверяем подключение генерации…</p>
  <label class="fs-image-field">Пожелания<textarea id="fsNotes" rows="3" maxlength="600" placeholder="Дубовый пол, тёплая штукатурка, мягкий дневной свет…"></textarea></label>
  <button type="button" class="fa-studio-primary" id="fsPlanGenerate">✦ Создать объёмный 3D-план</button>
 </section>
 <section class="fs-plan-part fs-plan-room-section">
  <span class="fs-plan-step">03 / ФОТО КОМНАТЫ</span><h3>Интерьер выбранной комнаты</h3>
  <p class="fa-art-help">Когда 3D-план будет готов, проверь его и нажми кнопку ниже. Затем обведи нужную комнату рамкой <strong>на готовом 3D-плане</strong>. Угол зрения задаётся отдельно.</p>
  <button type="button" id="fsApprovePlan" disabled>✓ План проверен · выбрать комнату</button>
  ${select('fsPlanDirection','Направление камеры',{'north':'К верхней стене плана','east':'К правой стене плана','south':'К нижней стене плана','west':'К левой стене плана'})}
  <button type="button" id="fsRoomGenerate" class="fa-studio-primary" disabled>✦ Создать фото интерьера</button>
  <p class="fa-art-help">Генерация интерпретирует пространство по плану; скрытые детали без чертежей нельзя считать фактически точными.</p>
 </section>
 <a class="fs-advanced-link" href="/plan-to-interior.html">Точный редактор стен и 3D →</a>`:
 `<div class="fs-image-intro"><small>КАДРЫ И ДЕТАЛИ</small><h2>Детальный кадр из фотографии.</h2><p>1. Обведите фрагмент. 2. Выберите крупность. 3. Создайте кадр с заново прорисованной фактурой. Камера приближается к выбранной детали с той же стороны; форма и стыки сохраняются.</p></div><label class="fs-file">Загрузить свой кадр<input id="fsSource" type="file" accept="image/png,image/jpeg,image/webp"></label>${select('fsDetailLevel','Крупность',{'close':'Крупный план · архитектура и стыки','macro':'Макро · зерно и поры материала'})}<label class="fs-image-field">Что снять крупно?<textarea id="fsNotes" rows="3" maxlength="600" placeholder="Например: ручка на деревянном фасаде, стык кирпича и шва…"></textarea></label><button type="button" class="fa-studio-primary" id="fsDetail">Создать детальный кадр · AI</button><p class="fa-art-help">Новая чёткая прорисовка видимого участка. Микрофактура синтезируется: это интерпретация, а не точное восстановление скрытых деталей. Для достоверной фактуры загрузите её фото.</p><button type="button" id="fsCrop">Показать кроп исходника · без AI</button><p class="fa-art-help">Кроп сохраняет исходные пиксели и не добавляет деталей.</p><hr><h3>Серия проекта</h3><p class="fa-art-help">Главный кадр задаёт материалы, окружение и подачу серии.</p><button type="button" id="fsAddCrop">Добавить выбранный участок</button><div class="fs-series-presets"><button type="button" data-series-preset="presentation">Подача проекта</button><button type="button" data-series-preset="evening">День и вечер</button><button type="button" data-series-preset="seasons">Сезоны</button></div><label class="fs-file">Добавить другой ракурс<input id="fsViewSource" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="fa-art-help">Для другого ракурса нужен его собственный скриншот. Согласованность окружения приблизительная.</p><div id="fsSeriesList"></div><button type="button" class="fa-studio-primary" id="fsSeriesGenerate">Создать серию</button>`;
 setView(state.source);bindSelection();status(id==='plan'?'Загрузите план и выберите его подачу.':'Обведите участок мышью или задайте рамку в процентах. Ниже показан выбранный фрагмент до AI.');
 const own=state;
 $('#fsSource').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file||run)return;const load=++own.loadId,projectBefore=bridge().snapshot();own.loading=true;try{
  const source=await readImage(file);if(mine!==token||state!==own||load!==own.loadId)return;if(bridge().snapshot().projectId!==projectBefore.projectId||bridge().snapshot().sourceKey!==projectBefore.sourceKey)throw Error('Проект изменился во время чтения файла');
  await bridge().uploadFile(file);if(mine!==token||state!==own||load!==own.loadId)return;const snap=bridge().snapshot();Object.assign(own,{binding:snap,source,master:source,projectId:snap.projectId,sourceKey:snap.sourceKey,brief:snap.brief,planResult:null,plan2dResult:null,planApproved:false,roomSelected:false,frames:[]});setView(source);if(id==='plan'){await bridge().setAsset('plan_source',source,snap.projectId);await bridge().setAsset('plan_result','',snap.projectId);await bridge().setAsset('plan_2d_result','',snap.projectId);}drawSeries();status('Изображение загружено.');
 }catch(err){if(mine===token&&state===own)status(err.message);}finally{if(mine===token&&state===own&&load===own.loadId){own.loading=false;updateActions();}}});

 if(id==='frames'){
  const draft=await bridge().getAsset('series_draft');if(mine!==token||state!==own||own.loadId)return;if(draft){try{const saved=JSON.parse(draft);if(saved.projectId===state.projectId&&saved.sourceKey===state.sourceKey){state.frames=saved.frames||[];state.master=saved.master||state.master;state.source=saved.source||state.source;setView(state.source);drawSeries();}}catch{}}
  $('#fsCrop').onclick=()=>execute('crop');$('#fsDetail').onclick=()=>execute('detail');$('#fsAddCrop').onclick=()=>{try{normalizeCrop(state.crop);state.frames.push({kind:'detail',crop:{...state.crop},level:$('#fsDetailLevel').value,notes:$('#fsNotes').value,label:$('#fsDetailLevel').value==='macro'?'Макро':'Крупный план'});drawSeries();}catch(e){status(e.message);}};
  $('#fsViewSource').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;const binding={...state.binding},own=state;const input=await readImage(f);if(mine!==token||state!==own)return;assertFrameBinding(bridge().snapshot(),binding);own.frames.push({kind:'view',input,label:f.name.replace(/\.[^.]+$/,'')});drawSeries();}catch(err){status(err.message);}});$('#fsSeriesGenerate').onclick=()=>runSeries();
  controls.querySelectorAll('[data-series-preset]').forEach(b=>b.onclick=()=>{
   const preset=b.dataset.seriesPreset;
   const original={kind:'crop',crop:{x:0,y:0,w:1,h:1},label:'Общий кадр'};
   if(preset==='presentation')state.frames.push(original,{kind:'detail',crop:{...state.crop},label:'Крупный план',level:'close',notes:$('#fsNotes').value},{kind:'detail',crop:{...state.crop},label:'Макро',level:'macro',notes:$('#fsNotes').value});
   else if(preset==='evening')state.frames.push(original,{kind:'scene',input:state.master,variant:'evening',label:'Вечер'});
   else state.frames.push(original,{kind:'scene',input:state.master,variant:'autumn_sunny',label:'Золотая осень'},{kind:'scene',input:state.master,variant:'winter_overcast',label:'Зимний день'});
   drawSeries();status('Серия добавлена. Участки деталей можно выбрать перед добавлением кадра.');
  });
  $('#fsSeriesList').onclick=e=>{const run=e.target.closest('[data-series-run]'),remove=e.target.closest('[data-series-remove]');if(run)runSeries(Number(run.dataset.seriesRun));if(remove){state.frames.splice(Number(remove.dataset.seriesRemove),1);drawSeries();}};
 }else{
  $('#fsPlanGenerate').onclick=()=>execute('plan');
  $('#fsPlan2DGenerate').onclick=()=>execute('plan2d');
  $('#fsRoomGenerate').onclick=()=>execute('room');
  $('#fsPlan2DShowOriginal').onclick=()=>{if(state.source){state.roomSelected=false;setView(state.source);status('Исходный 2D-план.');}};
  $('#fsPlan2DShowVariant').onclick=()=>{if(state.plan2dResult){state.roomSelected=false;setView(state.plan2dResult);status('Оформленный 2D-план.');}};
  controls.querySelectorAll('[data-plan-2d-style]').forEach(btn=>btn.onclick=()=>{
   state.plan2dStyle=btn.dataset.plan2dStyle;
   controls.querySelectorAll('[data-plan-2d-style]').forEach(card=>card.setAttribute('aria-pressed',String(card===btn)));
   status('Концепция: '+PLAN_2D_STYLES[state.plan2dStyle]+'. Стены и мебель сохраняются. Нажмите «Создать 2D-план».');
  });
  $('#fsApprovePlan').onclick=()=>{
   if(!state.planResult)return;
   state.planApproved=true;state.roomSelected=false;setView(state.planResult);
   status('План утверждён. Обведите одну комнату рамкой на готовом 3D-плане. Затем выберите направление камеры.');
  };
  const [saved,result,styled2d,provider]=await Promise.all([
   bridge().getAsset('plan_source'),bridge().getAsset('plan_result'),bridge().getAsset('plan_2d_result'),
   fetch('/api/status').then(r=>r.json()).catch(()=>({}))
  ]);
  if(mine!==token||state!==own||own.loadId)return;
  if(saved&&snapshot.hasSource&&!snapshot.demo){state.source=saved;setView(saved);}
  if(styled2d&&snapshot.hasSource&&!snapshot.demo){state.plan2dResult=styled2d;addResult(styled2d,'Мой 2D-план');}
  if(result&&snapshot.hasSource&&!snapshot.demo){state.planResult=result;$('#fsApprovePlan').disabled=false;addResult(result,'3D-план');}
  $('#fsPlanProvider').textContent=provider.planImageReady?'Генерация планов: GPT Image 2.6. Настройка найдена; доступ модели проверяется при первом запросе.':'Для создания 2D/3D-планов и интерьеров требуется GPT Image 2.6. Серверная модель пока не настроена.';
  updateActions();
 }
}
document.addEventListener('forma:workspace-open',e=>{open(e.detail).catch(err=>status(err.message));});
document.addEventListener('forma:workspace-close',()=>{if(!run){token++;state=null;}});
