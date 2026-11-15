import {PLANTS,PAVINGS,LIGHTS,LOOKS,catalogFor,normalizeLandscape,normalizeAtmosphere,sameView} from './forma-art-direction-core.js';
import {canvas,loadImage,composeMasked,itemBounds,cropBounds,assertFraming} from './forma-local-composite.js';
const $=id=>document.getElementById(id),bridge=()=>window.FORMA_ART_BRIDGE;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(kind)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">'+(kind==='landscape'?'<path d="M3 21h18M6 21v-6m12 6v-9M6 5c-5 2-5 10 0 10s5-8 0-10Zm12-3-5 10h10Z"/>':'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>')+'</svg>';
let dialog,mode='landscape',category='plant',chosen='juniper',items=[],points=[],selected=null,history=[],snap=null,img=null,busy=false,focusMode=false,lastFocus=null,atmosphere=null,cursor={x:.5,y:.5},cursorVisible=false;
const id=()=>globalThis.crypto.randomUUID();
function message(text){$('artStatus').textContent=text;}
function remember(){history.push(JSON.stringify(items));if(history.length>50)history.shift();}
function persist(){if(mode==='landscape')bridge().draft('landscape',{sourceKey:snap.sourceKey,renderId:snap.renderId,items});else bridge().draft('atmosphere',atmosphere);}
function sameSource(){const now=bridge()?.snapshot();return sameView(now,snap);}
function ensureSource(){if(sameSource())return true;message('Проект или исходное изображение изменились. Закройте и откройте раздел снова.');return false;}
function makeDialog(){
 dialog=document.createElement('dialog');dialog.id='formaArtDialog';dialog.className='fa-art-dialog';dialog.setAttribute('aria-labelledby','artTitle');
 dialog.innerHTML=`<div class="fa-art-shell"><header class="fa-art-head"><div><small>ФОРМА / РАБОТА С КАДРОМ</small><h2 id="artTitle"></h2><p id="artSubtitle"></p></div><button type="button" data-art="close" aria-label="Закрыть">×</button></header>
 <div class="fa-art-workspace"><section class="fa-art-view"><div class="fa-art-stage" id="artStage"><canvas id="artPhoto"></canvas><svg id="artOverlay" viewBox="0 0 1000 1000" preserveAspectRatio="none" role="img" aria-label="Области изменений на фотографии"></svg><button id="artCanvasInput" type="button" aria-label="Добавить объект в центр кадра; стрелки перемещают выбранный объект"></button></div>
 <div class="fa-art-view-foot"><span id="artPreviewLabel">СХЕМА РАЗМЕЩЕНИЯ · НЕ РЕНДЕР</span><span id="artDimensions"></span></div><div id="artCanvasTools" class="fa-art-row"></div><p id="artStatus" role="status" aria-live="polite"></p></section>
 <aside class="fa-art-inspector" id="artInspector"></aside></div>
 <footer class="fa-art-foot"><p id="artFootnote"></p><button type="button" data-art="close" class="fa-art-secondary">Готово</button><button type="button" id="artGenerate" class="fa-art-primary"></button></footer></div>`;
 document.body.append(dialog);
 dialog.addEventListener('click',e=>{const action=e.target.closest('[data-art]')?.dataset.art;if(action)act(action,e.target.closest('[data-art]'));});
 dialog.addEventListener('cancel',e=>{if(busy){e.preventDefault();message('Идёт обработка кадра. Дождитесь результата.');}});
 dialog.addEventListener('close',()=>{focusMode=false;lastFocus?.focus();});
 $('artGenerate').addEventListener('click',generate);
 $('artCanvasInput').addEventListener('pointerdown',place);
 $('artCanvasInput').addEventListener('keydown',keyCanvas);
 dialog.addEventListener('input',change);
}
async function open(which){
 if(!bridge()||busy)return;const next=bridge().snapshot();if(!next)return;
 mode=which;lastFocus=document.activeElement;snap=next;history=[];points=[];selected=null;focusMode=false;cursor={x:.5,y:.5};cursorVisible=false;
 if(!dialog)makeDialog();
 items=Array.isArray(snap.landscape?.items)&&snap.landscape.sourceKey===snap.sourceKey&&(snap.landscape.renderId||null)===(snap.renderId||null)?structuredClone(snap.landscape.items):[];
 atmosphere=normalizeAtmosphere(snap.atmosphere)||{preset:'natural',strength:65,contrast:0,saturation:0,temperature:0,dof:0,depth:10,bloom:0,grain:0,focus:{x:.5,y:.5}};
 $('artTitle').textContent=mode==='landscape'?'Ландшафт':'Атмосфера';
 $('artSubtitle').textContent=mode==='landscape'?'Посадки, дорожки и свет — в выбранных местах кадра.':'Характер фотографии. Окружение и архитектура сохраняются.';
 $('artGenerate').textContent=mode==='landscape'?'Создать ландшафт':'Применить атмосферу';
 $('artFootnote').textContent=mode==='landscape'?'Обрабатываются только подсвеченные участки. Остальной кадр сохраняется в исходном разрешении.':'Настройки сохраняются для следующих рендеров. Применение к текущему кадру запускает AI.';
 message(snap.demo?'Демонстрационный кадр. Загрузите свой проект для AI-обработки.':mode==='landscape'?'Выберите объект и нажмите на изображение. Для дорожки отметьте контур.':'Цветопроба локальная. Оптическая глубина и свет появятся после AI-обработки.');
 dialog.dataset.mode=mode;dialog.showModal();
 try{img=await loadImage(snap.image);$('artDimensions').textContent=img.naturalWidth+' × '+img.naturalHeight;drawPhoto();renderInspector();renderOverlay();}catch(e){message(e.message);$('artGenerate').disabled=true;}
}
function renderInspector(){
 if(mode==='landscape'){
  $('artInspector').innerHTML=`<div class="fa-art-tabs" role="group" aria-label="Каталог ландшафта">${[['plant','Растения'],['path','Дорожки'],['light','Свет']].map(([v,t])=>`<button type="button" data-art="category" data-value="${v}" aria-pressed="${category===v}">${t}</button>`).join('')}</div><div class="fa-art-catalog">${catalogFor(category).map(e=>`<button type="button" class="fa-art-option" data-art="catalog" data-value="${e.id}" aria-pressed="${chosen===e.id}"><span class="fa-art-swatch ${category}" style="--swatch:${e.color}"></span><span><b>${e.name}</b><small>${e.description}</small></span></button>`).join('')}</div><section id="artSelection"></section><details class="fa-art-guide"><summary>Как работать с кадром</summary><p>Растение или светильник: нажмите в точку основания. Размер области задаёт размер объекта и место для контактной тени. Дорожка: отметьте границы мощения по перспективе, затем замкните контур.</p><p>Выбрать и удалить объект можно в списке. На клавиатуре стрелки перемещают выбранный объект, Delete удаляет, Enter добавляет объект в центр кадра.</p></details><h3 class="fa-art-list-title">На кадре <span id="artCount"></span></h3><div id="artItemList" class="fa-art-items"></div><button type="button" class="fa-art-text" data-art="upload">Загрузить свой кадр</button>`;
  renderList();
 }else{
  $('artInspector').innerHTML=`<div class="fa-art-look-grid">${LOOKS.map(e=>`<button type="button" data-art="look" data-value="${e.id}" class="fa-art-look" aria-pressed="${atmosphere.preset===e.id}"><span class="fa-art-look-image" data-look="${e.id}"></span><b>${e.name}</b><small>${e.description}</small></button>`).join('')}</div><div class="fa-art-sliders">${[
   ['strength','Интенсивность',0,100],['contrast','Контраст',-30,30],['saturation','Насыщенность',-30,30],['temperature','Теплее / холоднее',-30,30],['dof','Глубина резкости',0,100],['depth','Воздушная глубина',0,40],['bloom','Свечение светов',0,30],['grain','Плёночное зерно',0,20]
  ].map(([field,label,min,max])=>`<label>${label}<output id="artOut-${field}">${atmosphere[field]}</output><input type="range" data-atmosphere="${field}" min="${min}" max="${max}" value="${atmosphere[field]}"></label>`).join('')}</div><button type="button" class="fa-art-secondary" data-art="focus" aria-pressed="false">Указать точку фокуса</button><p class="fa-art-help">Дом остаётся резким. Размытие относится к переднему и дальнему плану. Это фотографическая интерпретация по 2D-кадру.</p><button type="button" class="fa-art-text" data-art="reset-look">По исходнику · сбросить</button>`;
  for(const card of dialog.querySelectorAll('.fa-art-look-image')){card.style.backgroundImage=`url("${snap.image.replace(/"/g,'%22')}")`;}
 }
 $('artCanvasTools').innerHTML=mode==='landscape'?'<button type="button" class="fa-art-secondary" data-art="undo">Отменить</button><button type="button" class="fa-art-secondary" data-art="finish-path">Замкнуть дорожку</button><button type="button" class="fa-art-text" data-art="cancel-path">Отменить контур</button>':'<span class="fa-art-help">Цвет · контраст — цветопроба. Глубина · зерно · свечение — после AI.</span>';
 updateGenerate();
}
function renderList(){
 $('artCount').textContent=items.length;
 $('artItemList').innerHTML=items.map((item,i)=>{const entry=catalogFor(item.kind).find(x=>x.id===item.catalogId);return `<button type="button" data-art="select" data-value="${item.id}" aria-pressed="${selected===item.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(entry?.name||'Объект')}</button>`}).join('')||'<p class="fa-art-help">Пока нет объектов. Выберите растение, покрытие или светильник.</p>';
 const item=items.find(x=>x.id===selected);
 $('artSelection').innerHTML=item?`<h3>Выбранный объект</h3>${item.kind!=='path'?`<label class="fa-art-size">Ширина области<input type="range" data-size="w" min="2" max="45" value="${item.w*100}"></label><label class="fa-art-size">Высота области<input type="range" data-size="h" min="2" max="70" value="${item.h*100}"></label>`:'<p class="fa-art-help">Контур закреплён на земле. Для новой формы удалите дорожку и нарисуйте её снова.</p>'}<button class="fa-art-text" type="button" data-art="delete">Удалить объект</button>`:'';
 updateGenerate();
}
function drawPhoto(){
 if(!img)return;const c=$('artPhoto'),scale=Math.min(1,1100/img.naturalWidth);c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);
 const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 if(mode==='atmosphere'){
  const a=atmosphere,look=LOOKS.find(x=>x.id===a.preset),strength=a.strength/100;
  ctx.filter=`contrast(${1+(a.contrast+look.contrast)*strength/100}) saturate(${1+(a.saturation+look.saturation)*strength/100})`;
  ctx.drawImage(img,0,0,c.width,c.height);ctx.filter='none';
  const warm=(a.temperature+look.temperature)*strength;
  if(warm){ctx.globalCompositeOperation='soft-light';ctx.fillStyle=warm>0?'#e9a45c':'#779bd1';ctx.globalAlpha=Math.abs(warm)/120;ctx.fillRect(0,0,c.width,c.height);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
 }else ctx.drawImage(img,0,0,c.width,c.height);
 $('artPreviewLabel').textContent=mode==='landscape'?'СХЕМА РАЗМЕЩЕНИЯ · НЕ РЕНДЕР':'ЦВЕТОПРОБА · ОПТИКА ПОСЛЕ AI';
}
function renderOverlay(){
 const overlay=$('artOverlay');if(mode==='atmosphere'){
  const f=atmosphere.focus;overlay.innerHTML=`<g class="fa-art-focus" transform="translate(${f.x*1000} ${f.y*1000})"><circle r="17"/><path d="M-28 0h16M12 0h16M0-28v16M0 12v16"/></g>`;return;
 }
 overlay.innerHTML=items.map((item,i)=>{
  const color=catalogFor(item.kind).find(x=>x.id===item.catalogId)?.color||'#91a390',b=itemBounds(item),active=selected===item.id;
  const shape=item.kind==='path'?`<polygon points="${item.points.map(p=>p.x*1000+','+p.y*1000).join(' ')}"/>`:`<rect x="${b.x*1000}" y="${b.y*1000}" width="${(b.right-b.x)*1000}" height="${(b.bottom-b.y)*1000}" rx="6"/><path class="fa-art-anchor" d="M${item.x*1000-9} ${item.y*1000}h18m-9-9v18"/>`;
  return `<g class="fa-art-region ${active?'selected':''}" style="--region:${color}">${shape}<text x="${b.x*1000+9}" y="${b.y*1000+29}">${i+1}</text></g>`;
 }).join('')+(points.length?`<polyline class="fa-art-pending" points="${points.map(p=>p.x*1000+','+p.y*1000).join(' ')}"/>`+points.map(p=>`<circle class="fa-art-point" cx="${p.x*1000}" cy="${p.y*1000}" r="6"/>`).join(''):'');
 if(cursorVisible)overlay.innerHTML+=`<g class="fa-art-focus" transform="translate(${cursor.x*1000} ${cursor.y*1000})"><circle r="11"/><path d="M-22 0h12M10 0h12M0-22v12M0 10v12"/></g>`;
 const finish=dialog.querySelector('[data-art="finish-path"]');if(finish)finish.disabled=points.length<3;
 const undo=dialog.querySelector('[data-art="undo"]');if(undo)undo.disabled=!history.length&&!points.length;
}
function place(e){
 if(busy||!ensureSource())return;const r=$('artStage').getBoundingClientRect();const p={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
 cursor=p;cursorVisible=true;
 if(mode==='atmosphere'){if(focusMode){atmosphere.focus=p;persist();renderOverlay();focusMode=false;dialog.querySelector('[data-art="focus"]').setAttribute('aria-pressed','false');message('Точка фокуса сохранена. Дом остаётся главным резким объектом.');}return;}
 if(category==='path'){if(points.length>=32){message('Максимум 32 точки. Замкните контур.');return;}points.push(p);message('Контур: '+points.length+' точек. Обведите края дорожки и нажмите «Замкнуть дорожку».');renderOverlay();return;}
 if(items.length>=80){message('На одном кадре можно разместить до 80 объектов.');return;}
 remember();const item={id:id(),kind:category,catalogId:chosen,x:p.x,y:p.y,w:category==='light'?.045:.14,h:category==='light'?.16:.22};items.push(item);selected=item.id;persist();renderList();renderOverlay();message('Область добавлена. Выберите её в списке, чтобы изменить размер или удалить.');
}
function keyCanvas(e){
 if(busy||!ensureSource())return;
 if(e.key==='Enter'||e.key===' '){e.preventDefault();const r=$('artStage').getBoundingClientRect();place({clientX:r.left+r.width*cursor.x,clientY:r.top+r.height*cursor.y});return;}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&(!selected||category==='path'||mode==='atmosphere')){
  e.preventDefault();const step=e.shiftKey?.025:.005;
  cursor.x=Math.max(0,Math.min(1,cursor.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0)));
  cursor.y=Math.max(0,Math.min(1,cursor.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)));cursorVisible=true;
  if(mode==='atmosphere'&&focusMode){atmosphere.focus={...cursor};persist();}renderOverlay();message('Курсор: '+Math.round(cursor.x*100)+'% × '+Math.round(cursor.y*100)+'%. Enter — подтвердить точку.');return;
 }
 const item=items.find(x=>x.id===selected);if(!item)return;
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();act('delete');return;}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||mode!=='landscape')return;
 e.preventDefault();remember();const step=e.shiftKey?.025:.005,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
 if(item.kind==='path'){const b=itemBounds(item),sx=Math.max(-b.x,Math.min(1-b.right,dx)),sy=Math.max(-b.y,Math.min(1-b.bottom,dy));for(const p of item.points){p.x+=sx;p.y+=sy;}}else{item.x=Math.max(0,Math.min(1,item.x+dx));item.y=Math.max(0,Math.min(1,item.y+dy));}persist();renderOverlay();
}
function change(e){
 if(busy||!ensureSource())return;
 if(e.target.dataset.size){const item=items.find(x=>x.id===selected);if(item){remember();item[e.target.dataset.size]=Number(e.target.value)/100;persist();renderOverlay();}}
 if(e.target.dataset.atmosphere){const field=e.target.dataset.atmosphere;atmosphere[field]=Number(e.target.value);$('artOut-'+field).value=e.target.value;persist();drawPhoto();renderOverlay();updateGenerate();}
}
function act(action,button){
 if(action==='close'){if(!busy)dialog.close();return;}
 if(busy)return;if(action==='upload'){dialog.close();bridge().upload();return;}
 if(!ensureSource())return;
 if(action==='category'){category=button.dataset.value;selected=null;chosen=catalogFor(category)[0].id;points=[];renderInspector();renderOverlay();}
 if(action==='catalog'){chosen=button.dataset.value;renderInspector();renderOverlay();}
 if(action==='select'){selected=button.dataset.value;renderList();renderOverlay();}
 if(action==='delete'){remember();items=items.filter(x=>x.id!==selected);selected=null;persist();renderList();renderOverlay();}
 if(action==='undo'){if(points.length)points.pop();else if(history.length){items=JSON.parse(history.pop());selected=null;persist();}renderList();renderOverlay();}
 if(action==='cancel-path'){points=[];renderOverlay();message('Контур отменён.');}
 if(action==='finish-path'){
  try{if(items.length>=80)throw Error('Максимум 80 объектов.');const item={id:id(),kind:'path',catalogId:chosen,points:structuredClone(points)};normalizeLandscape({items:[item]});remember();items.push(item);selected=item.id;points=[];persist();renderList();renderOverlay();message('Дорожка добавлена. В генерацию уйдёт только область внутри контура.');}catch(e){message(e.message);}
 }
 if(action==='look'){atmosphere.preset=button.dataset.value;persist();renderInspector();drawPhoto();renderOverlay();}
 if(action==='focus'){focusMode=!focusMode;cursor={...atmosphere.focus};cursorVisible=true;button.setAttribute('aria-pressed',String(focusMode));message('Нажмите на дом в кадре, чтобы указать фокус.');$('artCanvasInput').focus();}
 if(action==='reset-look'){atmosphere={...atmosphere,preset:'natural',strength:0,contrast:0,saturation:0,temperature:0,dof:0,depth:0,bloom:0,grain:0};bridge().draft('atmosphere',null);renderInspector();drawPhoto();renderOverlay();message('Атмосфера сброшена. Используется подача исходника.');}
}
function updateGenerate(){if(!$('artGenerate'))return;$('artGenerate').disabled=busy||!snap?.hasSource||snap?.demo||(mode==='landscape'?!items.length:!atmosphere.strength);}
function drawSelection(context,w,h){
 context.fillStyle='#fff';for(const item of items){const b=itemBounds(item);if(item.kind==='path'){context.beginPath();item.points.forEach((p,i)=>i?context.lineTo(p.x*w,p.y*h):context.moveTo(p.x*w,p.y*h));context.closePath();context.fill();}else context.fillRect(Math.floor(b.x*w),Math.floor(b.y*h),Math.ceil((b.right-b.x)*w),Math.ceil((b.bottom-b.y)*h));}
}
async function landscapePayload(expected){
 const base=await loadImage(expected.image),w=base.naturalWidth,h=base.naturalHeight,crop=cropBounds(items,w,h);
 const selection=canvas(w,h);drawSelection(selection.getContext('2d'),w,h);
 const edge=Math.max(crop.width,crop.height),frame={width:edge,height:edge,x:Math.floor((edge-crop.width)/2),y:Math.floor((edge-crop.height)/2)};
 const edgeOut=Math.min(1536,edge),scale=edgeOut/edge,clean=canvas(edgeOut,edgeOut),cc=clean.getContext('2d');
 cc.fillStyle='#d5d4ce';cc.fillRect(0,0,edgeOut,edgeOut);cc.drawImage(base,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const mask=canvas(edgeOut,edgeOut),mc=mask.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,edgeOut,edgeOut);mc.globalCompositeOperation='destination-out';mc.drawImage(selection,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const position=p=>({x:(p.x*w-crop.x+frame.x)/edge,y:(p.y*h-crop.y+frame.y)/edge});
 const transformed=items.map(item=>item.kind==='path'?{...item,points:item.points.map(position)}:{...item,...position(item),w:item.w*w/edge,h:item.h*h/edge});

 // Context is compact and clean; guide graphics are never sent as source pixels.
 const context=canvas(Math.min(w,1400),Math.round(Math.min(w,1400)*h/w));context.getContext('2d').drawImage(base,0,0,context.width,context.height);
 return {crop,selection,frame,payload:{image:clean.toDataURL('image/png'),mask:mask.toDataURL('image/png'),reference:context.toDataURL('image/jpeg',.9),landscapeEdit:normalizeLandscape({items:transformed}),quality:'high',quantity:1}};
}
async function providerCopy(url){const image=await loadImage(url),scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));const c=canvas(Math.round(image.naturalWidth*scale),Math.round(image.naturalHeight*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.97);}
async function generate(){
 if(busy||!ensureSource()||!snap.hasSource||snap.demo)return;
 const expected=bridge().snapshot();if(!expected||expected.busy)return message('Дождитесь текущей генерации.');
 if(!bridge().acquire())return;busy=true;updateGenerate();dialog.classList.add('is-busy');
 message('AI обрабатывает кадр. Настройки временно заблокированы.');
 try{
  let local=null,payload;
  if(mode==='landscape'){normalizeLandscape({items});local=await landscapePayload(expected);payload=local.payload;}
  else{persist();const copy=await providerCopy(expected.image);payload={image:copy,atmosphereOnly:true,brief:{...expected.brief,atmosphere:normalizeAtmosphere(atmosphere)},quality:'high',quantity:1};}
  const response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(240000)});
  const result=await response.json();if(!response.ok||!result.images?.[0])throw Error(result.error||'AI не вернул изображение');
  let image='data:'+(result.mimes?.[0]||'image/png')+';base64,'+result.images[0];
  if(!local){const output=await loadImage(image),original=await loadImage(expected.image);assertFraming(output.naturalWidth,output.naturalHeight,original.naturalWidth,original.naturalHeight);}
  if(local)image=await composeMasked(expected.image,image,local.selection,local.crop,local.frame);
  const label=mode==='landscape'?'Ландшафт · локальная правка':'Атмосфера · '+LOOKS.find(x=>x.id===atmosphere.preset).name;
  await bridge().saveResult(image,label,expected);snap=bridge().snapshot();dialog.close();
  message('Готово. Новый вариант сохранён в галерее. Исходник остаётся доступен.');
 }catch(e){message(e.name==='TimeoutError'?'Время ожидания истекло. Запрос мог продолжиться у провайдера; проверьте историю перед повтором.':e.message||'Не удалось обработать кадр');}
 finally{busy=false;bridge().release();dialog.classList.remove('is-busy');updateGenerate();}
}
async function composeMaterial(base,result,providerMask){
 const maskImage=await loadImage(providerMask),selection=canvas(maskImage.naturalWidth,maskImage.naturalHeight),ctx=selection.getContext('2d',{willReadFrequently:true});ctx.drawImage(maskImage,0,0);const pixels=ctx.getImageData(0,0,selection.width,selection.height);
 for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=255-pixels.data[i+3];ctx.putImageData(pixels,0,0);return composeMasked(base,result,selection);
}
function init(){
 if(!bridge())return;
 const nav=document.querySelector('.rail-nav');for(const [key,name] of [['landscape','Ландшафт'],['atmosphere','Атмосфера']]){
  if(nav&&!nav.querySelector(`[data-art-open="${key}"]`)){const b=document.createElement('button');b.type='button';b.className='rail-btn';b.dataset.artOpen=key;b.setAttribute('aria-label',name);b.title=name;b.innerHTML=icon(key)+'<span class="rail-name">'+name+'</span>';const anchor=nav.querySelector('[data-nav="animation"]');anchor?nav.insertBefore(b,anchor):nav.append(b);}
 }
 const viewer=document.querySelector('.viewer-card');if(viewer&&!$('formaArtLaunchers')){const box=document.createElement('div');box.id='formaArtLaunchers';box.className='fa-art-launchers';box.innerHTML=`<button type="button" data-art-open="landscape">${icon('landscape')}<span><b>Ландшафт</b><small>Растения · дорожки · свет</small></span><span aria-hidden="true">↗</span></button><button type="button" data-art-open="atmosphere">${icon('atmosphere')}<span><b>Атмосфера</b><small>Цвет · оптика · характер кадра</small></span><span aria-hidden="true">↗</span></button>`;const anchor=viewer.querySelector('.viewer-toolbar');anchor?anchor.insertAdjacentElement('afterend',box):viewer.prepend(box);}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-art-open]');if(b)open(b.dataset.artOpen);});
}
window.FORMA_ART_DIRECTION={openLandscape:()=>open('landscape'),openAtmosphere:()=>open('atmosphere'),composeMaterial};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
