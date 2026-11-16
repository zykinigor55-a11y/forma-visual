import {scalePlacement,linePlacements,drawStrokes,translateGroup,selectionHasCoverage} from './forma-landscape-tools.js';
import {PLANTS,PAVINGS,LIGHTS,LOOKS,catalogFor,normalizeLandscape,normalizeAtmosphere,sameView,appendPathPoint} from './forma-art-direction-core.js';
import {canvas,loadImage,composeMasked,itemBounds,cropBounds,assertFraming,prepareMaterialEdit} from './forma-local-composite.js';
const $=id=>document.getElementById(id),bridge=()=>window.FORMA_ART_BRIDGE;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(kind)=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">'+(kind==='landscape'?'<path d="M3 21h18M6 21v-6m12 6v-9M6 5c-5 2-5 10 0 10s5-8 0-10Zm12-3-5 10h10Z"/>':'<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>')+'</svg>';
let dragging=null,brushSize=.04,eraser=false,placingMode='single',cleanPreview=false,linePoints=[],selectedGroup=new Set();
const atlases=['assets/landscape/botanical-atlas.webp','assets/landscape/garden-atlas.webp','assets/landscape/details-atlas.webp'];
const atlasCache=new Map();
function assetFor(entry,kind){const index=entry.cell??(kind==='plant'?PLANTS.findIndex(x=>x.id===entry.id):kind==='light'?({bollard:4,blade:11,mushroom:6,spot:7,lantern:14,recessed:8}[entry.id]):null);return index==null?null:{index,url:atlases[(entry.atlas||(kind==='light'?2:1))-1]};}
function assetSVG(entry,kind,attrs=''){
 const a=assetFor(entry,kind);if(!a)return `<span class="fa-art-swatch ${kind}" style="--swatch:${entry.color}"></span>`;
 const cut=(asset,x,y,w,h)=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${asset.index%4*320} ${Math.floor(asset.index/4)*320} 320 320" preserveAspectRatio="none"><image href="${asset.url}" width="1280" height="1280"/></svg>`;
 if(entry.planted){const plant=[...catalogFor('tree'),...PLANTS].find(v=>v.id===entry.planted),pa=assetFor(plant,entry.planted==='thuja'?'plant':'tree');return `<svg ${attrs} viewBox="0 0 320 320" preserveAspectRatio="none" aria-hidden="true">${cut(pa,20,0,280,255)}${cut(a,74,218,172,102)}</svg>`;}
 return `<svg ${attrs} viewBox="${a.index%4*320} ${Math.floor(a.index/4)*320} 320 320" preserveAspectRatio="none" aria-hidden="true"><image href="${a.url}" width="1280" height="1280"/></svg>`;
}
function sprite(entry,kind,attrs=''){return assetSVG(entry,kind,attrs);}

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
 $('artCanvasInput').addEventListener('pointerdown',pointerStart);
 $('artCanvasInput').addEventListener('pointermove',pointerMove);
 $('artCanvasInput').addEventListener('pointerup',pointerEnd);
 $('artCanvasInput').addEventListener('pointercancel',pointerEnd);
 $('artCanvasInput').addEventListener('keydown',keyCanvas);
 dialog.addEventListener('input',change);
}
async function open(which){
 if(!bridge()||busy)return;const next=bridge().snapshot();if(!next)return;
 mode=which;cleanPreview=false;dragging=null;selectedGroup.clear();linePoints=[];lastFocus=document.activeElement;snap=next;history=[];points=[];selected=null;focusMode=false;cursor={x:.5,y:.5};cursorVisible=false;
 if(!dialog)makeDialog();
 items=Array.isArray(snap.landscape?.items)&&snap.landscape.sourceKey===snap.sourceKey&&(snap.landscape.renderId||null)===(snap.renderId||null)?structuredClone(snap.landscape.items):[];
 atmosphere=normalizeAtmosphere(snap.atmosphere)||{preset:'natural',strength:65,contrast:0,saturation:0,temperature:0,dof:0,depth:10,bloom:0,grain:0,focus:{x:.5,y:.5}};
 $('artCanvasInput').setAttribute('aria-label',mode==='landscape'?'Размещение объектов: стрелки — переместить курсор, Enter — поставить точку':'Фокус: включите выбор фокуса, стрелки — переместить, Enter — подтвердить');
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
  $('artInspector').innerHTML=`<div class="fa-art-tabs" role="group" aria-label="Каталог ландшафта">${[['plant','Кусты'],['tree','Деревья'],['fill','Кисть'],['path','Мощение'],['object','Камни · кашпо'],['edge','Бордюры · ступени'],['light','Свет']].map(([v,t])=>`<button type="button" data-art="category" data-value="${v}" aria-pressed="${category===v}">${t}</button>`).join('')}</div><div class="fa-art-catalog">${catalogFor(category).map(e=>`<button type="button" class="fa-art-option" data-art="catalog" data-value="${e.id}" aria-pressed="${chosen===e.id}">${sprite(e,category)}<span><b>${e.name}</b><small>${e.description}</small></span></button>`).join('')}</div><div id="artPlacementTools"></div><section id="artSelection"></section><details class="fa-art-guide"><summary>Как работать с кадром</summary><p>Растение или светильник: нажмите в точку основания. Размер области задаёт размер объекта и место для контактной тени. Дорожка: отметьте границы мощения по перспективе, затем замкните контур.</p><p>Выбрать и удалить объект можно в списке. На клавиатуре стрелки перемещают выбранный объект, Delete удаляет, Enter добавляет объект в центр кадра.</p></details><h3 class="fa-art-list-title">На кадре <span id="artCount"></span></h3><div id="artItemList" class="fa-art-items"></div><button type="button" class="fa-art-text" data-art="upload">Загрузить свой кадр</button>`;
  const tools=$('artPlacementTools');tools.innerHTML=category==='fill'?`<label class="fa-art-size">Размер кисти<input type="range" data-brush-size min="1" max="20" value="${brushSize*100}"></label><button type="button" data-art="eraser" aria-pressed="${eraser}">${eraser?'Ластик включён':'Ластик'}</button>`:['plant','tree','light'].includes(category)?`<div class="fa-art-row"><button type="button" data-art="place-single" aria-pressed="${placingMode==='single'}">По одному</button><button type="button" data-art="place-line" aria-pressed="${placingMode==='line'}">Вдоль линии</button></div><label class="fa-art-size">Расстояние в ряду<input type="range" id="artSpacing" min="2" max="20" value="7"></label>`:'';
  renderList();
 }else{
  $('artInspector').innerHTML=`<div class="fa-art-look-grid">${LOOKS.map(e=>`<button type="button" data-art="look" data-value="${e.id}" class="fa-art-look" aria-pressed="${atmosphere.preset===e.id}"><span class="fa-art-look-image" data-look="${e.id}"></span><b>${e.name}</b><small>${e.description}</small></button>`).join('')}</div><div class="fa-art-sliders">${[
   ['strength','Интенсивность',0,100],['contrast','Контраст',-30,30],['saturation','Насыщенность',-30,30],['temperature','Теплее / холоднее',-30,30],['dof','Глубина резкости',0,100],['depth','Воздушная глубина',0,40],['bloom','Свечение светов',0,30],['grain','Плёночное зерно',0,20]
  ].map(([field,label,min,max])=>`<label for="artSlider-${field}">${label}<output id="artOut-${field}">${atmosphere[field]}</output><input id="artSlider-${field}" type="range" data-atmosphere="${field}" min="${min}" max="${max}" value="${atmosphere[field]}"></label>`).join('')}</div><button type="button" class="fa-art-secondary" data-art="focus" aria-pressed="false">Указать точку фокуса</button><p class="fa-art-help">Дом остаётся резким. Размытие относится к переднему и дальнему плану. Это фотографическая интерпретация по 2D-кадру.</p><button type="button" class="fa-art-text" data-art="reset-look">По исходнику · сбросить</button>`;
  for(const card of dialog.querySelectorAll('.fa-art-look-image')){card.style.backgroundImage=`url("${snap.image.replace(/"/g,'%22')}")`;}
 }
 $('artCanvasTools').innerHTML=mode==='landscape'?'<button type="button" class="fa-art-secondary" data-art="undo">Отменить</button><button type="button" class="fa-art-secondary" data-art="finish-path">Замкнуть дорожку</button><button type="button" class="fa-art-text" data-art="cancel-path">Отменить контур</button><button type="button" class="fa-art-secondary" data-art="clean">Чистый просмотр</button>':'<span class="fa-art-help">Цвет · контраст — цветопроба. Глубина · зерно · свечение — после AI.</span>';
 updateGenerate();
}
function renderList(){
 $('artCount').textContent=items.length;
 $('artItemList').innerHTML=items.map((item,i)=>{const entry=catalogFor(item.kind).find(x=>x.id===item.catalogId);return `<button type="button" data-art="select" data-value="${item.id}" aria-pressed="${selected===item.id}"><span>${String(i+1).padStart(2,'0')}</span>${esc(entry?.name||'Объект')}</button>`}).join('')||'<p class="fa-art-help">Пока нет объектов. Выберите растение, покрытие или светильник.</p>';
 const item=items.find(x=>x.id===selected);
 $('artSelection').innerHTML=item?`<h3>Выбранный объект</h3>${!['path','edge','fill'].includes(item.kind)?`<label class="fa-art-size">Размер · пропорционально<input type="range" data-size="scale" min="20" max="300" value="${Math.round(item.w/(item.baseW||item.w)*100)}"></label><label class="fa-art-size">Зона тени<input type="range" data-influence="shadow" min="0" max="30" value="${(item.influence?.shadow||0)*100}"></label><label class="fa-art-size">Зона отражения<input type="range" data-influence="reflection" min="0" max="60" value="${(item.influence?.reflection||0)*100}"></label>`:item.kind==='fill'?'<p class="fa-art-help">Кисть рисует покрытие. Ластик уточняет только эту область.</p>':`<p class="fa-art-help">Перетаскивайте точки контура на изображении.</p><label class="fa-art-size">Направление укладки<input type="range" data-paving="rotation" min="-180" max="180" value="${item.rotation||0}"></label><label class="fa-art-size">Размер рисунка<input type="range" data-paving="tileScale" min="20" max="250" value="${item.tileScale||100}"></label>`}<div class="fa-art-row"><button type="button" data-art="duplicate">Дублировать</button><button type="button" data-art="group">${selectedGroup.has(item.id)?'Убрать из группы':'В группу'}</button><button type="button" data-art="delete">Удалить</button></div><p class="fa-art-help">${selectedGroup.size?selectedGroup.size+' в группе · стрелки перемещают группу':''}</p>`:'';
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
  const entry=catalogFor(item.kind).find(x=>x.id===item.catalogId);
  let shape;
  if(item.kind==='fill'){
   const c=canvas(650,Math.round(650*(img?.naturalHeight||1)/(img?.naturalWidth||1))),ctx=c.getContext('2d');ctx.strokeStyle=color;drawStrokes(ctx,item.strokes,c.width,c.height);
   shape=`<image href="${c.toDataURL()}" x="0" y="0" width="1000" height="1000" opacity=".45"/>`;
  }else if(['path','edge'].includes(item.kind)){
   const pattern='artPattern'+i;shape=`<defs><pattern id="${pattern}" patternUnits="userSpaceOnUse" width="${40*(item.tileScale||100)/100}" height="${22*(item.tileScale||100)/100}" patternTransform="rotate(${item.rotation||0})"><rect width="100%" height="100%" fill="${color}"/><path d="M0 0H100M0 0V100" stroke="#515958" stroke-width="2"/></pattern></defs><polygon points="${item.points.map(p=>p.x*1000+','+p.y*1000).join(' ')}" style="fill:url(#${pattern});fill-opacity:.65"/>`+(active&&!cleanPreview?item.points.map(p=>`<circle class="fa-art-point" cx="${p.x*1000}" cy="${p.y*1000}" r="7"/>`).join(''):'');
  }else{
   shape=assetSVG(entry,item.kind,`x="${(item.x-item.w/2)*1000}" y="${(item.y-item.h)*1000}" width="${item.w*1000}" height="${item.h*1000}"`);
   if(active&&!cleanPreview)shape+=`<rect x="${b.x*1000}" y="${b.y*1000}" width="${(b.right-b.x)*1000}" height="${(b.bottom-b.y)*1000}" rx="6"/><path class="fa-art-anchor" d="M${item.x*1000-9} ${item.y*1000}h18m-9-9v18"/>`;
  }
  return `<g class="fa-art-region ${active?'selected':''}" style="--region:${color}">${shape}${cleanPreview?'':`<text x="${b.x*1000+9}" y="${b.y*1000+29}">${i+1}</text>`}</g>`;
 }).join('')+(points.length?`<polyline class="fa-art-pending" points="${points.map(p=>p.x*1000+','+p.y*1000).join(' ')}"/>`+points.map(p=>`<circle class="fa-art-point" cx="${p.x*1000}" cy="${p.y*1000}" r="6"/>`).join(''):'');
 if(cursorVisible)overlay.innerHTML+=`<g class="fa-art-focus" transform="translate(${cursor.x*1000} ${cursor.y*1000})"><circle r="11"/><path d="M-22 0h12M10 0h12M0-22v12M0 10v12"/></g>`;
 const finish=dialog.querySelector('[data-art="finish-path"]');if(finish)finish.disabled=points.length<3;
 const undo=dialog.querySelector('[data-art="undo"]');if(undo)undo.disabled=!history.length&&!points.length;
}
function place(e){
 if(busy||!ensureSource())return;const r=$('artStage').getBoundingClientRect();const p={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};
 cursor=p;cursorVisible=true;
 if(mode==='atmosphere'){if(focusMode){atmosphere.focus={...p};persist();renderOverlay();focusMode=false;dialog.querySelector('[data-art="focus"]').setAttribute('aria-pressed','false');message('Точка фокуса сохранена. Дом остаётся главным резким объектом.');}return;}
 if(category==='path'||category==='edge'){if(points.length>=32){message('Максимум 32 точки. Замкните контур.');return;}points=appendPathPoint(points,p);message('Контур: '+points.length+' точек. Обведите края дорожки и нажмите «Замкнуть дорожку».');renderOverlay();return;}
 if(items.length>=80){message('На одном кадре можно разместить до 80 объектов.');return;}
 remember();const h=category==='tree'?.48:category==='light'?.18:.24,w=h*(img?.naturalHeight||1)/(img?.naturalWidth||1),item={id:id(),kind:category,catalogId:chosen,x:p.x,y:p.y,w,h,baseW:w,baseH:h,influence:{shadow:.025,reflection:0}};items.push(item);selected=item.id;persist();renderList();renderOverlay();message('Область добавлена. Выберите её в списке, чтобы изменить размер или удалить.');
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
  for(const q of linePlacements(linePoints[0],linePoints[1],spacing).slice(0,80-items.length))items.push({id:id(),kind:category,catalogId:chosen,...q,w,h,baseW:w,baseH:h,influence:{shadow:.02,reflection:0}});
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
 if(e.target.dataset.size){const item=items.find(x=>x.id===selected);if(item){remember();item.baseW||=item.w;item.baseH||=item.h;Object.assign(item,scalePlacement(item,Number(e.target.value)/100));persist();renderOverlay();}}
 if(e.target.hasAttribute('data-brush-size'))brushSize=Number(e.target.value)/100;
 if(e.target.dataset.influence||e.target.dataset.paving){const item=items.find(x=>x.id===selected);if(item){remember();if(e.target.dataset.influence)item.influence={...item.influence,[e.target.dataset.influence]:Number(e.target.value)/100};else item[e.target.dataset.paving]=Number(e.target.value);persist();renderOverlay();}}
 if(e.target.dataset.atmosphere){const field=e.target.dataset.atmosphere;atmosphere[field]=Number(e.target.value);$('artOut-'+field).value=e.target.value;persist();drawPhoto();renderOverlay();updateGenerate();}
}
function act(action,button){
 if(action==='close'){if(!busy)dialog.close();return;}
 if(busy)return;if(action==='upload'){dialog.close();bridge().upload();return;}
 if(!ensureSource())return;
 if(action==='category'){linePoints=[];category=button.dataset.value;selected=null;chosen=catalogFor(category)[0].id;points=[];renderInspector();renderOverlay();}
 if(action==='catalog'){chosen=button.dataset.value;renderInspector();renderOverlay();}
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
  try{if(items.length>=80)throw Error('Максимум 80 объектов.');const item={id:id(),kind:category==='edge'?'edge':'path',catalogId:chosen,points:structuredClone(points)};normalizeLandscape({items:[item]});remember();items.push(item);selected=item.id;points=[];persist();renderList();renderOverlay();message('Дорожка добавлена. В генерацию уйдёт только область внутри контура.');}catch(e){message(e.message);}
 }
 if(action==='look'){atmosphere.preset=button.dataset.value;persist();renderInspector();drawPhoto();renderOverlay();}
 if(action==='focus'){focusMode=!focusMode;cursor={...atmosphere.focus};cursorVisible=true;button.setAttribute('aria-pressed',String(focusMode));message('Нажмите на дом в кадре, чтобы указать фокус.');$('artCanvasInput').focus();}
 if(action==='reset-look'){atmosphere={...atmosphere,preset:'natural',strength:0,contrast:0,saturation:0,temperature:0,dof:0,depth:0,bloom:0,grain:0};bridge().draft('atmosphere',null);renderInspector();drawPhoto();renderOverlay();message('Атмосфера сброшена. Используется подача исходника.');}
}
function updateGenerate(){if(!$('artGenerate'))return;$('artGenerate').disabled=busy||!snap?.hasSource||snap?.demo||(mode==='landscape'?!items.length:!atmosphere.strength);}
function drawSelection(context,w,h){
 context.fillStyle='#fff';for(const item of items){const b=itemBounds(item);if(item.kind==='fill'){const c=canvas(w,h),ctx=c.getContext('2d');ctx.strokeStyle='#fff';drawStrokes(ctx,item.strokes,w,h);context.drawImage(c,0,0);}else if(['path','edge'].includes(item.kind)){context.beginPath();item.points.forEach((p,i)=>i?context.lineTo(p.x*w,p.y*h):context.moveTo(p.x*w,p.y*h));context.closePath();context.fill();}else context.fillRect(Math.floor(b.x*w),Math.floor(b.y*h),Math.ceil((b.right-b.x)*w),Math.ceil((b.bottom-b.y)*h));}
}
async function landscapePayload(expected){
 const base=await loadImage(expected.image),w=base.naturalWidth,h=base.naturalHeight,crop=cropBounds(items,w,h);
 const selection=canvas(w,h);drawSelection(selection.getContext('2d'),w,h);if(!selectionHasCoverage(selection.getContext('2d').getImageData(0,0,w,h).data))throw Error('Область полностью стёрта. Нарисуйте покрытие перед генерацией.');
 const edge=Math.max(crop.width,crop.height),frame={width:edge,height:edge,x:Math.floor((edge-crop.width)/2),y:Math.floor((edge-crop.height)/2)};
 const edgeOut=Math.min(1536,edge),scale=edgeOut/edge,clean=canvas(edgeOut,edgeOut),cc=clean.getContext('2d');
 cc.fillStyle='#d5d4ce';cc.fillRect(0,0,edgeOut,edgeOut);cc.drawImage(base,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const mask=canvas(edgeOut,edgeOut),mc=mask.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,edgeOut,edgeOut);mc.globalCompositeOperation='destination-out';mc.drawImage(selection,crop.x,crop.y,crop.width,crop.height,frame.x*scale,frame.y*scale,crop.width*scale,crop.height*scale);
 const position=p=>({x:(p.x*w-crop.x+frame.x)/edge,y:(p.y*h-crop.y+frame.y)/edge});
 const transformed=items.map(item=>item.kind==='fill'?{...item,strokes:item.strokes.map(s=>({...s,size:s.size*Math.min(w,h)/edge,points:s.points.map(position)}))}:['path','edge'].includes(item.kind)?{...item,points:item.points.map(position)}:{...item,...position(item),w:item.w*w/edge,h:item.h*h/edge});

 // Context is compact and clean; guide graphics are never sent as source pixels.
 const context=canvas(Math.min(w,1400),Math.round(Math.min(w,1400)*h/w));context.getContext('2d').drawImage(base,0,0,context.width,context.height);
 const entries=[...new Map(items.filter(i=>!['fill','path','edge'].includes(i.kind)).map(i=>[i.catalogId,{kind:i.kind,entry:catalogFor(i.kind).find(e=>e.id===i.catalogId)}])).values()];
 const board=canvas(1024,Math.max(256,Math.ceil(entries.length/4)*256)),bc=board.getContext('2d');bc.fillStyle='#7a7f78';bc.fillRect(0,0,board.width,board.height);
 for(let i=0;i<entries.length;i++){const a=assetFor(entries[i].entry,entries[i].kind);if(!a)continue;let im=atlasCache.get(a.url);if(!im){im=await loadImage(a.url);atlasCache.set(a.url,im);}const edge=im.naturalWidth/4;const bx=i%4*256,by=Math.floor(i/4)*256;
 if(entries[i].entry.planted){const pe=[...catalogFor('tree'),...PLANTS].find(v=>v.id===entries[i].entry.planted),pa=assetFor(pe,pe.id==='thuja'?'plant':'tree');let pi=atlasCache.get(pa.url);if(!pi){pi=await loadImage(pa.url);atlasCache.set(pa.url,pi);}const ps=pi.naturalWidth/4;bc.drawImage(pi,pa.index%4*ps,Math.floor(pa.index/4)*ps,ps,ps,bx+16,by,224,204);bc.drawImage(im,a.index%4*edge,Math.floor(a.index/4)*edge,edge,edge,bx+59,by+174,138,82);}else bc.drawImage(im,a.index%4*edge,Math.floor(a.index/4)*edge,edge,edge,bx,by,256,256);}
 return {crop,selection,frame,payload:{image:clean.toDataURL('image/png'),mask:mask.toDataURL('image/png'),reference:context.toDataURL('image/jpeg',.9),material:entries.length?board.toDataURL('image/png'):null,landscapeEdit:normalizeLandscape({items:transformed,speciesBoard:entries.length>0}),quality:'high',quantity:1}};
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
window.FORMA_ART_DIRECTION={openLandscape:()=>open('landscape'),openAtmosphere:()=>open('atmosphere'),composeMaterial,prepareMaterial:prepareMaterialEdit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
