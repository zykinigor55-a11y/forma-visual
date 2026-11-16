import {LANDSCAPE_GROUPS,catalogGroup,assetLayers,placementMarkup} from './forma-landscape-catalog.js';
import {scalePlacement,clampLegacyPlacement,automaticInfluence,linePlacements,drawStrokes,translateGroup,selectionHasCoverage} from './forma-landscape-tools.js?v=composition-v2';
import {PLANTS,PAVINGS,LIGHTS,LOOKS,ATMOSPHERE_VEGETATION,isLinearEdge,catalogFor,normalizeLandscape,normalizeAtmosphere,sameView,appendPathPoint} from './forma-art-direction-core.js?v=landscape-custom-image-v1';
import {ATMOSPHERE_SCENARIOS,ATMOSPHERE_SCENE_GROUPS,ATMOSPHERE_FOREGROUND_PLANS} from './forma-atmosphere-scenes.js?v=composition-v2';
import {canvas,loadImage,composeMasked,itemBounds,cropBounds,assertFraming,prepareMaterialEdit} from './forma-local-composite.js';
import {CUSTOM_LANDSCAPE_ID,CUSTOM_ASSET_LIMIT,customAssetKey,decodeLandscapeFile,makeCustomReferenceBoard} from './forma-landscape-custom-assets.js';
import {specialById,isCurveKind,isBrushKind,curvePath,pointOnPolyline} from './forma-landscape-special-tools.js';
const $=id=>document.getElementById(id),bridge=()=>window.FORMA_ART_BRIDGE;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(kind)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">'+(kind==='landscape'?'<path d="M3 21h18M6 21v-6m12 6v-9M6 5c-5 2-5 10 0 10s5-8 0-10Zm12-3-5 10h10Z"/>':'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>')+'</svg>';
let dragging=null,brushSize=.04,eraser=false,placingMode='single',cleanPreview=false,linePoints=[],selectedGroup=new Set(),activePointers=new Map(),pinchStart=null;
const assetCache=new Map(),customImages=new Map();
function cachedAsset(url){
 if(!assetCache.has(url)){assetCache.set(url,null);loadImage(url).then(picture=>{assetCache.set(url,picture);if(dialog?.open)renderOverlay();}).catch(()=>{assetCache.delete(url);});}
 return assetCache.get(url);
}
function sprite(entry,kind){
 if(specialById(entry.id)){const sym=entry.kind==='garland'?'✧··✧··✧':entry.kind==='climber'?'❧ 〰 ❧':entry.group==='snow'?'❄ · ❄':entry.group==='leaves'?'🍂 · 🍂':'◌ · ◌';return `<span class="fa-art-special-swatch" style="--special-color:${entry.color}"><span>${sym}</span></span>`;}
 if(entry.planted)return `<svg viewBox="0 0 320 320" aria-hidden="true">${placementMarkup(entry)}</svg>`;
 return `<img class="fa-art-reference ${['fill','path'].includes(kind)?'surface':''}" src="${assetLayers(entry)[0].url}" alt="" draggable="false">`;
}

let dialog,mode='landscape',category='plant',catalogCategory='plant',chosen='juniper',selectedCustomKey=null,customAssets=[],items=[],points=[],selected=null,history=[],snap=null,img=null,busy=false,focusMode=false,lastFocus=null,atmosphere=null,cursor={x:.5,y:.5},cursorVisible=false;
const id=()=>globalThis.crypto.randomUUID();
function message(text){$('artStatus').textContent=text;}
function remember(){history.push(JSON.stringify(items));if(history.length>50)history.shift();}
function persist(){if(mode==='landscape')bridge().draft('landscape',{sourceKey:snap.sourceKey,renderId:snap.renderId,items,customAssets});else bridge().draft('atmosphere',atmosphere);}
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
 $('artCanvasInput').addEventListener('pointerdown',pointerStart);
 $('artCanvasInput').addEventListener('pointermove',pointerMove);
 $('artCanvasInput').addEventListener('pointerup',pointerEnd);
 $('artCanvasInput').addEventListener('pointercancel',pointerEnd);
 $('artCanvasInput').addEventListener('keydown',keyCanvas);
 dialog.addEventListener('input',change);
 dialog.addEventListener('change',e=>{if(e.target.id==='artCustomFile'){const file=e.target.files?.[0];e.target.value='';if(file)void uploadCustomImage(file);}});
}
async function open(which){
 if(!bridge()||busy)return;const next=bridge().snapshot();if(!next)return;
 mode=which;cleanPreview=false;dragging=null;selectedGroup.clear();linePoints=[];lastFocus=document.activeElement;snap=next;history=[];points=[];selected=null;focusMode=false;cursor={x:.5,y:.5};cursorVisible=false;
 if(!dialog)makeDialog();
 items=Array.isArray(snap.landscape?.items)&&snap.landscape.sourceKey===snap.sourceKey&&(snap.landscape.renderId||null)===(snap.renderId||null)?structuredClone(snap.landscape.items):[];
 items=items.map(item=>['path','edge','fill'].includes(item.kind)?item:{...clampLegacyPlacement(item),influence:automaticInfluence(clampLegacyPlacement(item)),influenceManual:false});
 customAssets=mode==='landscape'&&snap.landscape?.sourceKey===snap.sourceKey&&(snap.landscape.renderId||null)===(snap.renderId||null)&&Array.isArray(snap.landscape.customAssets)?snap.landscape.customAssets.slice(0,CUSTOM_ASSET_LIMIT).filter(a=>/^landscape_[a-f0-9]{32}$/.test(a?.key)):[];
 customImages.clear();selectedCustomKey=null;
 if(mode==='landscape'&&customAssets.length)await Promise.all(customAssets.map(async entry=>{
  try{const value=await bridge().getAsset(entry.key,snap.projectId);if(value?.startsWith('data:image/'))customImages.set(entry.key,value);}
  catch(error){console.warn('[FORMA landscape] custom asset unavailable:',entry.key,error?.message);}
 }));
 atmosphere=normalizeAtmosphere(snap.atmosphere)||normalizeAtmosphere({scenario:'day-soft',preset:'editorial',vegetation:'match'});
 $('artCanvasInput').setAttribute('aria-label',mode==='landscape'?'Размещение объектов: стрелки — переместить курсор, Enter — поставить точку':'Фокус: включите выбор фокуса, стрелки — переместить, Enter — подтвердить');
 $('artTitle').textContent=mode==='landscape'?'Ландшафт':'Атмосфера';
 $('artSubtitle').textContent=mode==='landscape'?'Посадки, дорожки и свет — в выбранных местах кадра.':'Настроение, свет, зелень по краям и глубина. Дом и ракурс сохраняются.';
 $('artGenerate').textContent=mode==='landscape'?'Создать ландшафт':'Применить атмосферу';
 $('artFootnote').textContent=mode==='landscape'?'Обрабатываются только подсвеченные участки. Остальной кадр сохраняется в исходном разрешении.':'Настройки сохраняются для следующих рендеров. Применение к текущему кадру запускает AI.';
 message(snap.demo?'Демонстрационный кадр. Загрузите свой проект для AI-обработки.':mode==='landscape'?'Выберите объект и нажмите на изображение. Для дорожки отметьте контур.':'Цветопроба локальная. Оптическая глубина и свет появятся после AI-обработки.');
 dialog.dataset.mode=mode;dialog.showModal();
 try{img=await loadImage(snap.image);$('artDimensions').textContent=img.naturalWidth+' × '+img.naturalHeight;drawPhoto();renderInspector();renderOverlay();}catch(e){message(e.message);$('artGenerate').disabled=true;}
}
async function uploadCustomImage(file){
 if(busy||mode!=='landscape'||!ensureSource())return;
 if(customAssets.length>=CUSTOM_ASSET_LIMIT){message('В одном проекте можно загрузить до 12 своих изображений.');return;}
 const targetProject=snap.projectId;
 message('Открываем изображение и сохраняем его в проект…');
 try{
  const prepared=await decodeLandscapeFile(file);
  if(!sameSource())throw Error('Проект изменился во время загрузки.');
  const key=customAssetKey(id());
  await bridge().setAsset(key,prepared.image,targetProject);
  customAssets.push({key,name:prepared.name,width:prepared.width,height:prepared.height});
  customImages.set(key,prepared.image);
  selectedCustomKey=key;chosen=CUSTOM_LANDSCAPE_ID;catalogCategory='object';category='object';placingMode='single';selected=null;points=[];
  persist();renderInspector();renderOverlay();
  message('«'+prepared.name+'» добавлено. Нажмите на фото в точку основания, затем перемещайте или меняйте размер.'+(prepared.lowResolution?' Исходный файл небольшой: качество генерации может быть ограничено.':''));
 }catch(error){message(error?.message||'Не удалось загрузить своё изображение.');}
}
function renderInspector(){
 if(mode==='landscape'){
  $('artInspector').innerHTML=`<div class="fa-art-custom-upload"><input type="file" id="artCustomFile" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" hidden aria-label="Выберите своё изображение для ландшафта"><button type="button" class="fa-art-custom-trigger" data-art="custom-upload">＋ Загрузить своё изображение</button><small>PNG с прозрачностью, JPG, WebP · до 10 МБ · размещение на кадре</small></div><div class="fa-art-tabs" role="group" aria-label="Каталог ландшафта">${LANDSCAPE_GROUPS.map(g=>`<button type="button" data-art="category" data-value="${g.id}" aria-pressed="${catalogCategory===g.id}">${g.name}</button>`).join('')}</div><div class="fa-art-catalog">${catalogGroup(catalogCategory).map(e=>`<button type="button" class="fa-art-option" data-art="catalog" data-value="${e.id}" aria-pressed="${chosen===e.id}">${sprite(e,category)}<span><b>${e.name}</b><small>${e.description}</small></span></button>`).join('')}${catalogCategory==='object'?customAssets.map(a=>`<button type="button" class="fa-art-option fa-art-custom-option" data-art="choose-custom" data-value="${a.key}" aria-pressed="${chosen===CUSTOM_LANDSCAPE_ID&&selectedCustomKey===a.key}"><img class="fa-art-reference" src="${customImages.get(a.key)||''}" alt="" draggable="false"><span><b>${esc(a.name)}</b><small>Моё изображение · ${a.width}×${a.height}${customImages.has(a.key)?'':' · файл не найден'}</small></span></button>`).join(''):''}</div><div id="artPlacementTools"></div><section id="artSelection"></section><details class="fa-art-guide"><summary>Как работать с кадром</summary><p>Растение или светильник: нажмите в точку основания.  Газон и отсыпки рисуются кистью, мощение и бордюры — контуром. Порода, форма кроны, размер и координаты передаются AI текстом. Свои изображения передаются AI визуальным референсом. Картинка на холсте — только схема размещения. Свет и контакт с поверхностью подбираются по исходному кадру.</p><p>Выбрать и удалить объект можно в списке. На клавиатуре стрелки перемещают выбранный объект, Delete удаляет, Enter добавляет объект в центр кадра.</p></details><h3 class="fa-art-list-title">На кадре <span id="artCount"></span></h3><div id="artItemList" class="fa-art-items"></div><button type="button" class="fa-art-text" data-art="upload">Загрузить свой кадр</button>`;
  const tools=$('artPlacementTools');tools.innerHTML=isBrushKind(category)?`<label class="fa-art-size">Размер кисти<input type="range" data-brush-size min="1" max="20" value="${brushSize*100}"></label><button type="button" class="fa-art-secondary" data-art="eraser" aria-pressed="${eraser}">${eraser?'Ластик включён':'Ластик'}</button>`:isCurveKind(category)?`<p class="fa-art-help">Ставьте точки вдоль стен, ветвей или перголы. Кривую можно уточнить перетаскиванием точек.</p>`:['plant','tree','light'].includes(category)?`<div class="fa-art-row"><button type="button" class="fa-art-secondary" data-art="place-single" aria-pressed="${placingMode==='single'}">По одному</button><button type="button" class="fa-art-secondary" data-art="place-line" aria-pressed="${placingMode==='line'}">Вдоль линии</button></div><label class="fa-art-size">Расстояние в ряду<input type="range" id="artSpacing" min="2" max="20" value="7"></label>`:'';
  renderList();
 }else{
  $('artInspector').innerHTML=`<div class="fa-art-scene-groups">${ATMOSPHERE_SCENE_GROUPS.map(g=>`<section class="fa-art-scene-group"><header class="fa-art-scene-group-head"><h3>${g.name}</h3><small>${g.description}</small></header><div class="fa-art-look-grid">${ATMOSPHERE_SCENARIOS.filter(s=>s.group===g.id).map(e=>`<button type="button" data-art="scenario" data-value="${e.id}" class="fa-art-look fa-art-scene-card" aria-pressed="${atmosphere.scenario===e.id}"><span class="fa-art-look-image" data-look="${e.id}"></span><b>${e.name}</b><small>${e.description}</small><span class="fa-art-scene-placement">${ATMOSPHERE_FOREGROUND_PLANS[e.id].label}</span></button>`).join('')}</div></section>`).join('')}</div><label class="fa-art-size" for="artVegetation">Порода дерева для обрамления<select id="artVegetation" data-atmosphere-species>${ATMOSPHERE_VEGETATION.map(v=>`<option value="${v.id}" ${(atmosphere.vegetation||'match')===v.id?'selected':''}>${v.name}</option>`).join('')}</select></label><div class="fa-art-sliders">${[
   ['strength','Интенсивность',0,100],['contrast','Контраст',-30,30],['saturation','Насыщенность',-30,30],['temperature','Теплее / холоднее',-30,30],['dof','Глубина резкости',0,100],['depth','Воздушная глубина',0,40],['foreground','Зелень по краям',0,70],['trunks','Стволы в ближнем плане',0,100],['shrubs','Кусты на переднем плане',0,100],['grounding','Заземление растений',0,100],['vignette','Оптическая виньетка',0,30],['bloom','Свечение светов',0,30],['grain','Плёночное зерно',0,20]
  ].map(([field,label,min,max])=>`<label for="artSlider-${field}">${label}<output id="artOut-${field}">${atmosphere[field]}</output><input id="artSlider-${field}" type="range" data-atmosphere="${field}" min="${min}" max="${max}" value="${atmosphere[field]}"></label>`).join('')}</div><button type="button" class="fa-art-secondary" data-art="focus" aria-pressed="false">Указать точку фокуса</button><p class="fa-art-help">9 сценариев: 3 дневных, 2 осенних, 2 зимних, 2 синего часа. AI заново прорисовывает существующие деревья и кусты; при необходимости добавляет настоящие ближние стволы и объёмные кусты с контактом с землёй. Исходный дом и камера сохраняются. Предпросмотр показывает только цвет, реальная растительность появится после генерации.</p><button type="button" class="fa-art-text" data-art="reset-look">По исходнику · сбросить</button>`;
  for(const card of dialog.querySelectorAll('.fa-art-look-image')){card.style.backgroundImage=`url("${snap.image.replace(/"/g,'%22')}")`;}
 }
 $('artCanvasTools').innerHTML=mode==='landscape'?'<button type="button" class="fa-art-secondary" data-art="undo">Отменить</button><button type="button" class="fa-art-secondary" data-art="finish-path">Замкнуть область</button><button type="button" class="fa-art-text" data-art="cancel-path">Отменить контур</button><button type="button" class="fa-art-secondary" data-art="clean">Чистый просмотр</button>':'<span class="fa-art-help">Цвет · контраст — цветопроба. Глубина · зерно · свечение — после AI.</span>';
 updateGenerate();
}
function renderList(){
 $('artCount').textContent=items.length;
 $('artItemList').innerHTML=items.map((item,i)=>{const entry=specialById(item.catalogId)||catalogFor(item.kind).find(x=>x.id===item.catalogId);return `<button type="button" data-art="select" data-value="${item.id}" aria-pressed="${selected===item.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(item.customLabel||entry?.name||'Объект')}</button>`}).join('')||'<p class="fa-art-help">Пока нет объектов. Выберите растение, покрытие или светильник.</p>';
 const item=items.find(x=>x.id===selected);
 $('artSelection').innerHTML=item?`<h3>Выбранный объект</h3>${!['path','edge','fill','scatter','climber','garland'].includes(item.kind)?`<label class="fa-art-size">Размер · пропорционально · до 200%<input type="range" data-size="scale" min="20" max="200" step="5" value="${Math.min(200,Math.round(item.w/(item.baseW||item.w)*100))}"></label>`:isBrushKind(item.kind)?`<p class="fa-art-help">Кисть наносит эффект в выделенном месте, ластик уточняет границы.</p>${item.kind==='scatter'?`<label class="fa-art-size">Плотность<input type="range" data-special="density" min="5" max="100" value="${item.density??60}"></label><label class="fa-art-size">Направление ветра<input type="range" data-special="wind" min="-180" max="180" value="${item.wind??0}"></label>`:''}`:isCurveKind(item.kind)?`<p class="fa-art-help">Перемещайте точки линии на изображении. Изгиб регулируется ниже.</p><label class="fa-art-size">Плавность кривой<input type="range" data-special="tension" min="0" max="100" value="${Math.round((item.tension??.7)*100)}"></label><label class="fa-art-size">Плотность<input type="range" data-special="density" min="5" max="100" value="${item.density??50}"></label>${item.kind==='garland'?`<label class="fa-art-size">Шаг ламп<input type="range" data-special="bulbSpacing" min="8" max="150" value="${Math.round((item.bulbSpacing??.035)*1000)}"></label><label class="fa-art-size">Провисание провода<input type="range" data-special="sag" min="0" max="60" value="${Math.round((item.sag??.15)*100)}"></label><label class="fa-art-size">Яркость света<input type="range" data-special="brightness" min="0" max="100" value="${item.brightness??60}"></label>`:''}`:`<p class="fa-art-help">Перетаскивайте точки контура на изображении.</p>${isLinearEdge(item)?`<label class="fa-art-size">Толщина полосы<input type="range" data-paving="edgeWidth" min="3" max="100" value="${(item.edgeWidth||.015)*1000}"></label>`:`<label class="fa-art-size">Направление укладки<input type="range" data-paving="rotation" min="-180" max="180" value="${item.rotation||0}"></label><label class="fa-art-size">Размер рисунка<input type="range" data-paving="tileScale" min="20" max="250" value="${item.tileScale||100}"></label>`}` }${item.catalogId===CUSTOM_LANDSCAPE_ID?`<label class="fa-art-custom-desc">Что изображено? (необязательно)<textarea data-custom-description rows="2" maxlength="240" placeholder="Например: куст можжевельника с хвоей">${esc(item.customDescription||'')}</textarea></label>`:''}<div class="fa-art-row"><button type="button" class="fa-art-secondary" data-art="duplicate">Дублировать</button><button type="button" class="fa-art-secondary" data-art="group">${selectedGroup.has(item.id)?'Убрать из группы':'В группу'}</button><button type="button" class="fa-art-secondary" data-art="delete">Удалить</button></div><p class="fa-art-help">${selectedGroup.size?selectedGroup.size+' в группе · стрелки перемещают группу':''}</p>`:'';
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
  const color=(specialById(item.catalogId)||catalogFor(item.kind).find(x=>x.id===item.catalogId))?.color||'#91a390',b=itemBounds(item),active=selected===item.id;
  const entry=specialById(item.catalogId)||catalogFor(item.kind).find(x=>x.id===item.catalogId);
  let shape;
  if(item.kind==='fill'){
   const c=canvas(650,Math.round(650*(img?.naturalHeight||1)/(img?.naturalWidth||1))),ctx=c.getContext('2d');ctx.strokeStyle=color;drawStrokes(ctx,item.strokes,c.width,c.height);
   const photo=cachedAsset(assetLayers(entry)[0].url);if(photo){const tile=canvas(110,110);tile.getContext('2d').drawImage(photo,0,0,110,110);ctx.globalCompositeOperation='source-in';ctx.fillStyle=ctx.createPattern(tile,'repeat');ctx.fillRect(0,0,c.width,c.height);}
   shape=`<image href="${c.toDataURL()}" x="0" y="0" width="1000" height="1000" opacity=".45"/>`;
  }else if(['path','edge'].includes(item.kind)){
   const vertices=item.points.map(p=>p.x*1000+','+p.y*1000).join(' '),pattern='artPattern'+i;
   if(isLinearEdge(item))shape=`<polyline points="${vertices}" fill="none" stroke="${color}" stroke-width="${(item.edgeWidth||.015)*1000}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${vertices}" fill="none" stroke="#e0d9c5" stroke-opacity=".65" stroke-width="1.5"/>`;
   else shape=`<defs><pattern id="${pattern}" patternUnits="userSpaceOnUse" width="${120*(item.tileScale||100)/100}" height="${120*(item.tileScale||100)/100}" patternTransform="rotate(${item.rotation||0})"><image href="${assetLayers(entry)[0].url}" width="${120*(item.tileScale||100)/100}" height="${120*(item.tileScale||100)/100}" preserveAspectRatio="none"/></pattern></defs><polygon points="${vertices}" style="fill:url(#${pattern});fill-opacity:.8"/>`;
   if(active&&!cleanPreview)shape+=item.points.map(p=>`<circle class="fa-art-point" cx="${p.x*1000}" cy="${p.y*1000}" r="7"/>`).join('');
  }else{
   if(item.catalogId===CUSTOM_LANDSCAPE_ID){
    const src=customImages.get(item.customKey);
    shape=src?`<image href="${src}" x="${(item.x-item.w/2)*1000}" y="${(item.y-item.h)*1000}" width="${item.w*1000}" height="${item.h*1000}" preserveAspectRatio="none"/>`:
     `<rect x="${(item.x-item.w/2)*1000}" y="${(item.y-item.h)*1000}" width="${item.w*1000}" height="${item.h*1000}" fill="none" stroke="#d5a579" stroke-dasharray="7 4"/>`;
   }else shape=placementMarkup(entry,{x:(item.x-item.w/2)*1000,y:(item.y-item.h)*1000,w:item.w*1000,h:item.h*1000,detail:true});
   if(active&&!cleanPreview)shape+=`<path class="fa-art-anchor" d="M${item.x*1000-9} ${item.y*1000}h18m-9-9v18"/>`;
  }
  return `<g class="fa-art-region ${active?'selected':''}" style="--region:${color}">${shape}${cleanPreview?'':`<text x="${b.x*1000+9}" y="${b.y*1000+29}">${i+1}</text>`}</g>`;
 }).join('')+(points.length?`<polyline class="fa-art-pending" points="${points.map(p=>p.x*1000+','+p.y*1000).join(' ')}"/>`+points.map(p=>`<circle class="fa-art-point" cx="${p.x*1000}" cy="${p.y*1000}" r="6"/>`).join(''):'');
 if(cursorVisible)overlay.innerHTML+=`<g class="fa-art-focus" transform="translate(${cursor.x*1000} ${cursor.y*1000})"><circle r="11"/><path d="M-22 0h12M10 0h12M0-22v12M0 10v12"/></g>`;
 const finish=dialog.querySelector('[data-art="finish-path"]');if(finish){const linear=isLinearEdge({kind:category,catalogId:chosen});finish.disabled=points.length<(linear?2:3);finish.textContent=linear?'Готово · линия бордюра':'Замкнуть область';}
 const undo=dialog.querySelector('[data-art="undo"]');if(undo)undo.disabled=!history.length&&!points.length;
}
function place(e){
 if(busy||!ensureSource())return;const r=$('artStage').getBoundingClientRect();const p={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
 cursor=p;cursorVisible=true;
 if(mode==='atmosphere'){if(focusMode){atmosphere.focus={...p};persist();renderOverlay();focusMode=false;dialog.querySelector('[data-art="focus"]').setAttribute('aria-pressed','false');message('Точка фокуса сохранена. Дом остаётся главным резким объектом.');}return;}
 if(category==='path'||category==='edge'){if(points.length>=32){message('Максимум 32 точки. Замкните контур.');return;}points=appendPathPoint(points,p);message('Контур: '+points.length+' точек. Обведите границы выбранного элемента и нажмите «Замкнуть область».');renderOverlay();return;}
 if(items.length>=80){message('На одном кадре можно разместить до 80 объектов.');return;}
 const custom=chosen===CUSTOM_LANDSCAPE_ID?customAssets.find(a=>a.key===selectedCustomKey):null;
 if(chosen===CUSTOM_LANDSCAPE_ID&&(!custom||!customImages.has(custom.key))){message('Своё изображение не найдено в проекте. Загрузите его ещё раз.');return;}
 remember();const h=category==='tree'?.48:category==='light'?.18:custom?.34:.24,w=custom?Math.min(.65,h*(custom.width/custom.height)*(img?.naturalHeight||1)/(img?.naturalWidth||1)):h*(img?.naturalHeight||1)/(img?.naturalWidth||1),item={id:id(),kind:category,catalogId:chosen,...(custom?{customKey:custom.key,customLabel:custom.name,customDescription:custom.description||''}:{}),x:p.x,y:p.y,w,h,baseW:w,baseH:h,influence:{shadow:Math.min(.4,h*.55),reflection:Math.min(.7,h*.8)}};items.push(item);selected=item.id;persist();renderList();renderOverlay();message('Область добавлена. Выберите её в списке, чтобы изменить размер или удалить.');
}
function eventPoint(e){const r=$('artStage').getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
function pointerStart(e){
 if(busy||!ensureSource())return;if(mode!=='landscape'){place(e);return;}const p=eventPoint(e);$('artCanvasInput').setPointerCapture(e.pointerId);
 if(category==='fill'){
  remember();let item=items.find(i=>i.id===selected&&i.kind==='fill'&&i.catalogId===chosen);if(!item&&eraser){message('Сначала нарисуйте покрытие кистью.');return;}if(!item){item={id:id(),kind:'fill',catalogId:chosen,strokes:[]};items.push(item);selected=item.id;}
  const stroke={size:brushSize,erase:eraser,points:[p]};item.strokes.push(stroke);dragging={type:'brush',stroke};renderList();renderOverlay();return;
 }
 const current=items.find(i=>i.id===selected);
 if(current?.points){const r=$('artStage').getBoundingClientRect(),vertex=current.points.findIndex(v=>Math.hypot((v.x-p.x)*r.width,(v.y-p.y)*r.height)<14);if(vertex>=0){remember();dragging={type:'vertex',item:current,vertex};return;}}
 const hit=[...items].reverse().find(i=>!['fill','path','edge'].includes(i.kind)&&p.x>=i.x-i.w/2&&p.x<=i.x+i.w/2&&p.y>=i.y-i.h&&p.y<=i.y);
 if(hit&&!e.altKey){remember();selected=hit.id;dragging={type:'object',item:hit,last:p};renderList();renderOverlay();return;}
 if(placingMode==='line'&&['plant','tree','light'].includes(category)){
  linePoints.push(p);if(linePoints.length===1){message('Теперь отметьте конец ряда.');return;}
  remember();const spacing=Number($('artSpacing')?.value||7)/100,h=category==='tree'?.4:.16,w=h*img.naturalHeight/img.naturalWidth;
  for(const q of linePlacements(linePoints[0],linePoints[1],spacing).slice(0,80-items.length))items.push({id:id(),kind:category,catalogId:chosen,...q,w,h,baseW:w,baseH:h,influence:{shadow:Math.min(.4,h*.55),reflection:Math.min(.7,h*.8)}});
  linePoints=[];persist();renderList();renderOverlay();message('Ряд объектов добавлен. Размер каждого можно уточнить.');return;
 }
 place(e);
}
function pointerMove(e){
 if(!dragging||busy)return;const p=eventPoint(e);
 if(dragging.type==='brush'){const pts=dragging.stroke.points;if(pts.length<1000&&Math.hypot(p.x-pts.at(-1).x,p.y-pts.at(-1).y)>.002)pts.push(p);}
 if(dragging.type==='vertex')dragging.item.points[dragging.vertex]=p;
 if(dragging.type==='object'){
  const dx=p.x-dragging.last.x,dy=p.y-dragging.last.y,ids=selectedGroup.has(dragging.item.id)?selectedGroup:new Set([dragging.item.id]);items=translateGroup(items,ids,dx,dy);dragging.item=items.find(i=>i.id===selected);dragging.last=p;
 }
 renderOverlay();
}
function pointerEnd(){if(dragging){dragging=null;persist();renderList();renderOverlay();}}
function keyCanvas(e){
 if(busy||!ensureSource())return;
 if((e.key==='Enter'||e.key===' ')&&category==='fill'&&mode==='landscape'){e.preventDefault();remember();let item=items.find(i=>i.id===selected&&i.kind==='fill'&&i.catalogId===chosen);if(!item&&eraser){message('Сначала нарисуйте покрытие кистью.');return;}if(!item){item={id:id(),kind:'fill',catalogId:chosen,strokes:[]};items.push(item);selected=item.id;}item.strokes.push({size:brushSize,erase:eraser,points:[{...cursor}]});persist();renderList();renderOverlay();return;}
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
 items=translateGroup(items,selectedGroup.has(selected)?selectedGroup:new Set([selected]),dx,dy);persist();renderOverlay();
}
function change(e){
 if(busy||!ensureSource())return;
 if(e.target.hasAttribute('data-custom-description')){const item=items.find(x=>x.id===selected);if(item?.catalogId===CUSTOM_LANDSCAPE_ID){item.customDescription=e.target.value.slice(0,240);persist();}return;}
 if(e.target.dataset.size){const item=items.find(x=>x.id===selected);if(item){remember();item.baseW||=item.w;item.baseH||=item.h;Object.assign(item,scalePlacement(item,Number(e.target.value)/100));item.influence=automaticInfluence(item);persist();renderOverlay();}}
 if(e.target.hasAttribute('data-brush-size'))brushSize=Number(e.target.value)/100;
 if(e.target.dataset.paving){const item=items.find(x=>x.id===selected);if(item){remember();item[e.target.dataset.paving]=Number(e.target.value)/(e.target.dataset.paving==='edgeWidth'?1000:1);persist();renderOverlay();}}
 if(e.target.hasAttribute('data-atmosphere-species')){atmosphere.vegetation=e.target.value;persist();updateGenerate();}
 if(e.target.dataset.atmosphere){const field=e.target.dataset.atmosphere;atmosphere[field]=Number(e.target.value);$('artOut-'+field).value=e.target.value;persist();drawPhoto();renderOverlay();updateGenerate();}
}
function act(action,button){
 if(action==='close'){if(!busy)dialog.close();return;}
 if(busy)return;
 if(action==='custom-upload'){$('artCustomFile')?.click();return;}
 if(action==='upload'){dialog.close();bridge().upload();return;}
 if(!ensureSource())return;
 if(action==='category'){linePoints=[];catalogCategory=button.dataset.value;category=LANDSCAPE_GROUPS.find(g=>g.id===catalogCategory).kind;eraser=false;selected=null;selectedCustomKey=null;chosen=catalogGroup(catalogCategory)[0].id;points=[];renderInspector();renderOverlay();message(category==='fill'?'Выберите образец и рисуйте покрытие кистью. Ластик уточняет только выбранную область.':category==='edge'?'Бордюр: отметьте линию двумя или более точками. Ступени и стенка: обведите область.':category==='path'?'Выберите покрытие, обведите площадку и нажмите «Замкнуть область».':'Выберите один объект и нажмите в точку его основания.');}
 if(action==='catalog'){chosen=button.dataset.value;selectedCustomKey=null;points=[];eraser=false;renderInspector();renderOverlay();}
 if(action==='choose-custom'){selectedCustomKey=button.dataset.value;chosen=CUSTOM_LANDSCAPE_ID;category='object';catalogCategory='object';points=[];renderInspector();renderOverlay();message('Нажмите на кадре в точку основания своего изображения. Перетаскивайте его и меняйте размер до 200%.');}
 if(action==='clean'){cleanPreview=!cleanPreview;button.setAttribute('aria-pressed',String(cleanPreview));renderOverlay();}
 if(action==='eraser'){eraser=!eraser;renderInspector();}
 if(action==='place-single'||action==='place-line'){placingMode=action==='place-line'?'line':'single';linePoints=[];renderInspector();message(placingMode==='line'?'Отметьте начало и конец ряда.':'Нажмите в точку основания объекта.');}
 if(action==='duplicate'){const item=items.find(x=>x.id===selected);if(item){remember();const copy=structuredClone(item);copy.id=id();if(copy.points)copy.points=copy.points.map(p=>({x:Math.min(1,p.x+.025),y:p.y}));else if(copy.strokes)copy.strokes.forEach(s=>s.points=s.points.map(p=>({x:Math.min(1,p.x+.025),y:p.y})));else copy.x=Math.min(.95,copy.x+.035);items.push(copy);selected=copy.id;persist();renderList();renderOverlay();}}
 if(action==='group'){selectedGroup.has(selected)?selectedGroup.delete(selected):selectedGroup.add(selected);renderList();}
 if(action==='select'){selected=button.dataset.value;renderList();renderOverlay();}
 if(action==='delete'){remember();items=items.filter(x=>x.id!==selected);selected=null;persist();renderList();renderOverlay();}
 if(action==='undo'){if(points.length)points.pop();else if(history.length){items=JSON.parse(history.pop());selected=null;persist();}renderList();renderOverlay();}
 if(action==='cancel-path'){points=[];renderOverlay();message('Контур отменён.');}
 if(action==='finish-path'){
  try{if(items.length>=80)throw Error('Максимум 80 объектов.');const item={id:id(),kind:category==='edge'?'edge':'path',catalogId:chosen,points:structuredClone(points)};normalizeLandscape({items:[item]});remember();items.push(item);selected=item.id;points=[];persist();renderList();renderOverlay();message('Область добавлена. AI применит выбранный образец внутри контура.');}catch(e){message(e.message);}
 }
 if(action==='scenario'){const scene=ATMOSPHERE_SCENARIOS.find(x=>x.id===button.dataset.value);if(!scene)return;atmosphere={...atmosphere,scenario:scene.id,preset:scene.look,...scene.defaults};persist();renderInspector();drawPhoto();renderOverlay();message('Выбран сценарий «'+scene.name+'»: '+ATMOSPHERE_FOREGROUND_PLANS[scene.id].label+'. Свет, сезон и растения появятся после AI-генерации.');}
 if(action==='focus'){focusMode=!focusMode;cursor={...atmosphere.focus};cursorVisible=true;button.setAttribute('aria-pressed',String(focusMode));message('Нажмите на дом в кадре, чтобы указать фокус.');$('artCanvasInput').focus();}
 if(action==='reset-look'){atmosphere={...atmosphere,preset:'natural',scenario:'day-soft',vegetation:'none',foreground:0,trunks:0,shrubs:0,grounding:0,vignette:0,strength:0,contrast:0,saturation:0,temperature:0,dof:0,depth:0,bloom:0,grain:0};bridge().draft('atmosphere',null);renderInspector();drawPhoto();renderOverlay();message('Атмосфера сброшена. Используется подача исходника.');}
}
function updateGenerate(){if(!$('artGenerate'))return;$('artGenerate').disabled=busy||!snap?.hasSource||snap?.demo||(mode==='landscape'?!items.length:!atmosphere.strength);}
function drawSelection(context,w,h){
 context.fillStyle='#fff';for(const item of items){const b=itemBounds(item);if(item.kind==='fill'){const c=canvas(w,h),ctx=c.getContext('2d');ctx.strokeStyle='#fff';drawStrokes(ctx,item.strokes,w,h);context.drawImage(c,0,0);}else if(['path','edge'].includes(item.kind)){context.beginPath();item.points.forEach((p,i)=>i?context.lineTo(p.x*w,p.y*h):context.moveTo(p.x*w,p.y*h));if(isLinearEdge(item)){context.strokeStyle='#fff';context.lineCap='round';context.lineJoin='round';context.lineWidth=(item.edgeWidth||.015)*Math.min(w,h);context.stroke();}else{context.closePath();context.fill();}}else context.fillRect(Math.floor(b.x*w),Math.floor(b.y*h),Math.ceil((b.right-b.x)*w),Math.ceil((b.bottom-b.y)*h));}
}
async function landscapePayload(expected){
 const base=await loadImage(expected.image),w=base.naturalWidth,h=base.naturalHeight,crop=cropBounds(items,w,h);
 const selection=canvas(w,h);drawSelection(selection.getContext('2d'),w,h);if(!selectionHasCoverage(selection.getContext('2d').getImageData(0,0,w,h).data))throw Error('Область полностью стёрта. Нарисуйте покрытие перед генерацией.');
 const edge=Math.max(crop.width,crop.height),frame={width:edge,height:edge,x:Math.floor((edge-crop.width)/2),y:Math.floor((edge-crop.height)/2)};
 const edgeOut=Math.min(1536,edge),scale=edgeOut/edge,clean=canvas(edgeOut,edgeOut),cc=clean.getContext('2d');
 cc.fillStyle='#d5d4ce';cc.fillRect(0,0,edgeOut,edgeOut);cc.drawImage(base,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const mask=canvas(edgeOut,edgeOut),mc=mask.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,edgeOut,edgeOut);mc.globalCompositeOperation='destination-out';mc.drawImage(selection,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const position=p=>({x:(p.x*w-crop.x+frame.x)/edge,y:(p.y*h-crop.y+frame.y)/edge});
 const transformed=items.map(item=>item.kind==='fill'?{...item,strokes:item.strokes.map(s=>({...s,size:s.size*Math.min(w,h)/edge,points:s.points.map(position)}))}:['path','edge'].includes(item.kind)?{...item,...(isLinearEdge(item)?{edgeWidth:(item.edgeWidth||.015)*Math.min(w,h)/edge}:{}),points:item.points.map(position)}:{...item,...position(item),w:item.w*w/edge,h:item.h*h/edge});

 const context=canvas(Math.min(w,1400),Math.round(Math.min(w,1400)*h/w));context.getContext('2d').drawImage(base,0,0,context.width,context.height);
 const referenced=[...new Set(items.filter(item=>item.catalogId===CUSTOM_LANDSCAPE_ID).map(item=>item.customKey))];
 const customBoard=referenced.length?await makeCustomReferenceBoard(referenced.map(key=>({key,name:customAssets.find(a=>a.key===key)?.name||'Свой объект'})),{resolveImage:key=>customImages.get(key)}):null;
 return {crop,selection,frame,payload:{image:clean.toDataURL('image/png'),mask:mask.toDataURL('image/png'),...(customBoard?{material:customBoard}:{}),reference:context.toDataURL('image/jpeg',.93),landscapeEdit:normalizeLandscape({items:transformed}),quality:'high',quantity:1}};
}
async function providerCopy(url){const image=await loadImage(url),scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));const c=canvas(Math.round(image.naturalWidth*scale),Math.round(image.naturalHeight*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.97);}
async function generate(){
 if(busy||!ensureSource()||!snap.hasSource||snap.demo)return;
 const expected=bridge().snapshot();if(!expected||expected.busy)return message('Дождитесь текущей генерации.');
 if(!bridge().acquire())return;let completed=false;busy=true;updateGenerate();dialog.classList.add('is-busy');
 message('AI обрабатывает кадр. Настройки временно заблокированы.');
 try{
  let local=null,payload;
  if(mode==='landscape'){normalizeLandscape({items});local=await landscapePayload(expected);payload=local.payload;}
  else{persist();const copy=await providerCopy(expected.image);payload={image:copy,atmosphereOnly:true,brief:{...expected.brief,atmosphere:normalizeAtmosphere(atmosphere)},quality:'high',quantity:1};}
  const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(240000)});
  const result=await response.json();if(!response.ok||!result.images?.[0])throw Error(result.error||'AI не вернул изображение');
  let image='data:'+(result.mimes?.[0]||'image/png')+';base64,'+result.images[0];
  if(!local){const output=await loadImage(image),original=await loadImage(expected.image);assertFraming(output.naturalWidth,output.naturalHeight,original.naturalWidth,original.naturalHeight);}
  if(local)image=await composeMasked(expected.image,image,local.selection,local.crop,local.frame);
  const label=mode==='landscape'?'Ландшафт · локальная правка':'Атмосфера · '+(ATMOSPHERE_SCENARIOS.find(x=>x.id===atmosphere.scenario)?.name||'Сценарий');
  await bridge().saveResult(image,label,expected);snap=bridge().snapshot();completed=true;dialog.close();
  message('Готово. Новый вариант сохранён в галерее. Исходник остаётся доступен.');
 }catch(e){message(e.name==='TimeoutError'?'Время ожидания истекло. Запрос мог продолжиться у провайдера; проверьте историю перед повтором.':e.message||'Не удалось обработать кадр');}
 finally{busy=false;bridge().release();dialog.classList.remove('is-busy');updateGenerate();if(completed)window.FORMA_STUDIO?.open('project');}
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
window.FORMA_ART_DIRECTION={openLandscape:()=>open('landscape'),openAtmosphere:()=>open('atmosphere'),composeMaterial,prepareMaterial:prepareMaterialEdit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
