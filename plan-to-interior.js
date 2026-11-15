import {suggestWalls,buildWalls,boundsMeters,nearestWall,validateModel,dist} from './plan-geometry.js';
import {openingSpec,openingProblems,buildOpeningAssemblies} from './plan-openings-v2.js';
import {INTERIOR_STYLES,materialZonesForWall,materialTargetName,normalizeMaterial} from './plan-finishes-v3.js';
/* FORMA / PLAN TO INTERIOR — geometry-first browser editor. 3D via Three.js.
 * AI vision and photorender are explicit, separately paid operations.
 * The source drawing is never replaced by a generated photograph. */
const $=id=>document.getElementById(id);
const STORE='forma-plan-to-interior-mvp-v1';
const state={image:null,width:0,height:0,bitmap:null,walls:[],openings:[],furniture:[],scale:.02,scaleVerified:false,
 wallHeight:2.8,wallThickness:.2,wallColor:'#e7dfd1',floorColor:'#af9172',style:'warm-modern',lighting:'soft-daylight',materials:{walls:{},floor:null,zones:[]}};
let mode='select',selection=null,pending=null,calibration=[],history=[],photo=null,photoHistory=[];
let screen={x:0,y:0,k:1,w:0,h:0},three=null,lastMessage='',toastTimer=null,dragWall=null;
let selectedSurface=null,selectedOpeningId=null,materialDraft={color:'#e7dfd1',texture:null,textureScale:1};
const textureCache=new Map();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const round=(v,n=2)=>Number(Number(v).toFixed(n));
function message(text){lastMessage=text;const e=$('toast');e.textContent=text;e.classList.add('visible');if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('visible'),4700)}
function snapshot(){history.push(JSON.stringify({walls:state.walls,openings:state.openings,furniture:state.furniture,materials:state.materials,scale:state.scale,scaleVerified:state.scaleVerified}));if(history.length>25)history.shift()}
function save(){
 const payload={version:1,image:state.image,width:state.width,height:state.height,walls:state.walls,openings:state.openings,
 furniture:state.furniture,scale:state.scale,scaleVerified:state.scaleVerified,wallHeight:state.wallHeight,
 wallThickness:state.wallThickness,wallColor:state.wallColor,floorColor:state.floorColor,style:state.style,lighting:state.lighting,materials:state.materials};
 try{localStorage.setItem(STORE,JSON.stringify(payload));$('autosaveStatus').textContent='Сохранено на устройстве'}
 catch{$('autosaveStatus').textContent='Недостаточно места для автосохранения'}
}
function sync(){
 const has=!!state.bitmap;const scaled=!!state.scaleVerified;const hasWalls=state.walls.length>0;
 for(const id of ['autoDetect','calibrate'])$(id).disabled=!has;
 $('aiDetect').disabled=!has||!window.planVisionReady;
 $('applyScale').disabled=calibration.length!==2;
 $('saveModel').disabled=!hasWalls;$('exportOBJ').disabled=!hasWalls||!three;
 $('renderPhoto').disabled=!hasWalls||!scaled||!three||validateModel(state).length>0;
 $('deleteWall').disabled=!selection;$('undo').disabled=!history.length;
 $('confirmWalls').disabled=!hasWalls||!scaled;
 $('planEmpty').hidden=has;$('threeEmpty').hidden=hasWalls&&!!three;
 $('sourceStatus').textContent=has?'ПЛАН ЗАГРУЖЕН':'НЕТ ПЛАНА';
 $('sourceStatus').classList.toggle('warn',!has);
 $('modelStatus').textContent=scaled?'МАСШТАБ ПОДТВЕРЖДЁН':'МАСШТАБ НЕ ПРОВЕРЕН';
 $('modelStatus').classList.toggle('warn',!scaled);
 $('wallCount').textContent=state.walls.length+' стен · '+state.openings.length+' проёмов';
 $('metricWalls').textContent=state.walls.length;$('metricOpenings').textContent=state.openings.length;
 const bb=boundsMeters(state.walls,state.width,state.height,state.scale);
 $('metricArea').textContent=bb?(round(bb.width,1)+' × '+round(bb.depth,1)):'—';
 const errors=validateModel(state);
 $('validation').textContent=errors.length?errors.join(' '):'Масштаб подтверждён, линии проверены. Можно создавать интерьерный кадр.';
 $('validation').classList.toggle('ok',!errors.length);
 $('scaleMessage').textContent=scaled?'1 пиксель = '+round(state.scale,5)+' м · масштаб подтверждён':calibration.length?'Точек выбрано: '+calibration.length+'/2. Нажмите вторую точку на плане.':'Укажите известный отрезок двумя точками на плане.';
 $('planHint').textContent=mode==='calibrate'?'Выберите две крайние точки известного размера.':mode==='wall'?'Добавьте стену: первая точка → вторая точка.':mode==='door'||mode==='window'?'Нажмите на существующую стену, чтобы вставить проём.':'Стены на плане — редактируемые линии. Коснитесь, чтобы выбрать.';
}
function redraw(){
 const canvas=$('planCanvas'),rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
 if(!rect.width||!rect.height)return;
 canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#202822';ctx.fillRect(0,0,rect.width,rect.height);
 if(!state.bitmap)return;
 const k=Math.min((rect.width-20)/state.width,(rect.height-20)/state.height);
 const drawW=state.width*k,drawH=state.height*k;
 screen={k,x:(rect.width-drawW)/2,y:(rect.height-drawH)/2,w:drawW,h:drawH};
 ctx.drawImage(state.bitmap,screen.x,screen.y,drawW,drawH);
 ctx.fillStyle='#10151010';ctx.fillRect(screen.x,screen.y,drawW,drawH);
 for(const wall of state.walls){
  const a=toCanvas(wall.a),b=toCanvas(wall.b);
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
  ctx.lineWidth=wall.id===selection?5:3;ctx.lineCap='round';
  ctx.strokeStyle=wall.id===selection?'#ffce8a':wall.verified?'#a8dab1':'#ddbb89';
  ctx.shadowColor='#000';ctx.shadowBlur=1;ctx.stroke();ctx.shadowBlur=0;
  if(wall.id===selection){for(const end of [a,b]){ctx.fillStyle='#f5d4a5';ctx.strokeStyle='#1a211d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(end.x,end.y,6,0,Math.PI*2);ctx.fill();ctx.stroke()}}
  for(const o of state.openings.filter(o=>o.wallId===wall.id)){
   const t=clamp(o.offset,0,1),cx=a.x+(b.x-a.x)*t,cy=a.y+(b.y-a.y)*t;
   ctx.fillStyle=o.kind==='window'?'#8bcfde':'#eb986c';ctx.beginPath();ctx.arc(cx,cy,o.id===selectedOpeningId?8:5,0,Math.PI*2);ctx.fill();
   if(o.id===selectedOpeningId){ctx.strokeStyle='#1d2420';ctx.lineWidth=2;ctx.stroke();}
  }
 }
 for(const point of calibration){const q=toCanvas(point);ctx.fillStyle='#92dece';ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();}
 if(calibration.length===2){const a=toCanvas(calibration[0]),b=toCanvas(calibration[1]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.setLineDash([7,5]);ctx.strokeStyle='#b1f3df';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([])}
 if(pending){const q=toCanvas(pending);ctx.fillStyle='#ffd39a';ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();}
 for(const f of state.furniture){
  const q=worldToCanvas(f.x,f.z);ctx.fillStyle='#496f60aa';ctx.fillRect(q.x-8,q.y-8,16,16);
 }
}
function toCanvas(p){return {x:screen.x+p.x*screen.k,y:screen.y+p.y*screen.k}}
function fromPointer(e){
 const rect=$('planCanvas').getBoundingClientRect(),x=(e.clientX-rect.left-screen.x)/screen.k,y=(e.clientY-rect.top-screen.y)/screen.k;
 return {x:clamp(x,0,state.width),y:clamp(y,0,state.height)};
}
function worldToCanvas(x,z){return toCanvas({x:x/state.scale+state.width/2,y:state.height/2-z/state.scale})}
function afterChange(){redraw();sync();refresh3D();refreshInspectors();save()}
function setTool(next){mode=next;pending=null;calibration=next==='calibrate'?[]:calibration;
 for(const e of document.querySelectorAll('[data-tool]'))e.classList.toggle('selected',e.dataset.tool===mode);
 $('calibrate').classList.toggle('selected',mode==='calibrate');sync();redraw();
}
function canvasTap(e){
 if(!state.bitmap)return;
 const p=fromPointer(e);
 if(mode==='calibrate'){
  if(calibration.length===2)calibration=[];
  calibration.push(p);sync();redraw();return;
 }
 if(mode==='wall'){
  if(!pending){pending=p;redraw();message('Выберите конец новой стены.');return}
  if(dist(p,pending)<8){message('Стена слишком короткая.');return}
  snapshot();state.walls.push({id:'wall_'+Date.now().toString(36),a:pending,b:p,confidence:1,verified:true});pending=null;afterChange();return;
 }
 const candidate=nearestWall(state.walls,p,Math.max(14,13/screen.k));
 if(mode==='select'){
  const nearOpening=state.openings.find(o=>{
   const w=state.walls.find(w=>w.id===o.wallId);if(!w)return false;
   const a=toCanvas(w.a),b=toCanvas(w.b),t=clamp(o.offset,0,1);
   const point={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
   const click={x:e.clientX-$('planCanvas').getBoundingClientRect().left,y:e.clientY-$('planCanvas').getBoundingClientRect().top};
   return dist(point,click)<=12;
  });
  if(nearOpening){selectOpening(nearOpening.id,true);return}
  selectedOpeningId=null;selection=candidate?.wall.id||null;
  sync();redraw();return;
 }
 if(!candidate){message('Нажмите ближе к линии стены.');return}
 const kind=mode;
 const widthM=kind==='window'?1.35:.90;
 const length=dist(candidate.wall.a,candidate.wall.b)*state.scale;
 snapshot();
 const portion=clamp(widthM/Math.max(.1,length),.04,.67);
 const newOpening={id:'open_'+Date.now().toString(36),wallId:candidate.wall.id,offset:candidate.t,width:portion,widthM:length*portion,
  heightM:kind==='window'?1.35:2.1,sillM:kind==='window'?.9:0,kind,
  sashes:null,sashVerified:false,verified:false,frameColor:'#303633'};
 state.openings.push(newOpening);
 afterChange();selectOpening(newOpening.id,true);message((kind==='window'?'Окно':'Дверь')+' добавлено. Проверьте размер и расположение.');
}
async function readImageFile(file){
 if(file.size>13*1024*1024)throw Error('План слишком большой. Используйте файл до 13 МБ.');
 if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
  if(!window.pdfjsLib){
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload=resolve;script.onerror=()=>reject(Error('Не удалось загрузить модуль PDF. Конвертируйте первую страницу в PNG.'));document.head.append(script);
   });
  }
  const lib=window.pdfjsLib;
  lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const page=await pdf.getPage(1),vp=page.getViewport({scale:1});
  const scale=Math.min(2.3,1600/Math.max(vp.width,vp.height));
  const view=page.getViewport({scale}),c=document.createElement('canvas');c.width=Math.round(view.width);c.height=Math.round(view.height);
  await page.render({canvasContext:c.getContext('2d'),viewport:view}).promise;return c;
 }
 if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Поддерживаются PNG, JPG, WEBP и PDF.');
 const url=URL.createObjectURL(file);let image;
 try{image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Не удалось открыть план.'));i.src=url})}
 finally{URL.revokeObjectURL(url)}
 const k=Math.min(1,1500/Math.max(image.naturalWidth,image.naturalHeight));
 const c=document.createElement('canvas');c.width=Math.round(image.naturalWidth*k);c.height=Math.round(image.naturalHeight*k);
 c.getContext('2d').drawImage(image,0,0,c.width,c.height);return c;
}
async function applyImage(canvas,fromRestore=false){
 const ctx=canvas.getContext('2d'),data=ctx.getImageData(0,0,canvas.width,canvas.height);
 const blobCanvas=document.createElement('canvas');blobCanvas.width=canvas.width;blobCanvas.height=canvas.height;
 blobCanvas.getContext('2d').putImageData(data,0,0);
 state.bitmap=blobCanvas;state.width=canvas.width;state.height=canvas.height;
 const storeCanvas=document.createElement('canvas'),k=Math.min(1,850/Math.max(canvas.width,canvas.height));
 storeCanvas.width=Math.round(canvas.width*k);storeCanvas.height=Math.round(canvas.height*k);
 storeCanvas.getContext('2d').drawImage(canvas,0,0,storeCanvas.width,storeCanvas.height);
 state.image=storeCanvas.toDataURL('image/jpeg',.76);
 if(!fromRestore){history=[];state.walls=[];state.openings=[];state.furniture=[];state.materials={walls:{},floor:null,zones:[]};state.scaleVerified=false;selection=null;selectedSurface=null;selectedOpeningId=null;calibration=[];state.scale=.02}
 afterChange();return canvas;
}
function autoDetect(){
 if(!state.bitmap)return;
 if(state.walls.length&&!confirm('Заменить текущие линии стен автоматическим черновиком? Исходное изображение сохранится.'))return;
 const guessed=suggestWalls(state.bitmap);
 if(!guessed.length){message('Линии не найдены. Добавьте стены вручную или используйте AI Vision.');return}
 snapshot();state.walls=guessed;state.openings=[];state.materials.walls={};state.materials.zones=[];selection=null;selectedSurface=null;selectedOpeningId=null;afterChange();message('Автоматический черновик: '+guessed.length+' линий. Проверьте лишние и недостающие стены.');
}
async function visionStatus(){
 try{
  const r=await fetch('/api/plan/status',{cache:'no-store'});
  const d=await r.json();window.planVisionReady=!!d.ready;
  $('aiHelp').textContent=d.ready?'Vision-модель указана: '+(d.model||'неизвестная')+'. Доступность подтверждается при первом запросе. Платный анализ — только по нажатию.':'AI Vision пока не подключена; автоматический черновик доступен без AI. Для AI нужен PLAN_VISION_MODEL на сервере.';
 }catch{window.planVisionReady=false;$('aiHelp').textContent='AI Vision недоступна; черновое распознавание работает локально.'}
 sync();
}
async function useVision(){
 if(!state.bitmap||!window.planVisionReady)return;
 if(!confirm('Распознать план через AI Vision? Будет отправлен платный запрос на сервер API Market. Распознанные стены нужно проверить. Продолжить?'))return;
 const resized=document.createElement('canvas'),k=Math.min(1,1200/Math.max(state.width,state.height));
 resized.width=Math.round(state.width*k);resized.height=Math.round(state.height*k);
 resized.getContext('2d').drawImage(state.bitmap,0,0,resized.width,resized.height);
 $('aiDetect').disabled=true;message('AI анализирует стены и проёмы. Существующий план не удалён.');
 try{
  const res=await fetch('/api/plan/recognize',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({image:resized.toDataURL('image/jpeg',.83)})});
  const data=await res.json();if(!res.ok)throw Error(data.error||'Ошибка AI-распознавания.');
  snapshot();
  state.walls=data.walls.map(w=>({id:w.id,a:{x:w.x1*state.width,y:w.y1*state.height},b:{x:w.x2*state.width,y:w.y2*state.height},confidence:w.confidence,verified:false}));
  state.openings=(data.openings||[]).map(o=>({...o,verified:false,sashVerified:false,
   widthM:undefined,frameColor:'#303633'}));selection=null;selectedOpeningId=null;afterChange();
  message('AI нашёл '+state.walls.length+' стен и '+state.openings.length+' проёмов. Подтвердите масштаб и исправьте неточности.');
 }catch(e){message(e.message||'Ошибка Vision API. Используйте ручное редактирование.')}
 finally{sync()}
}
function applyCalibration(){
 if(calibration.length!==2)return;
 const meters=Number($('knownLength').value),pixels=dist(calibration[0],calibration[1]);
 if(!(meters>.05&&meters<201&&pixels>=8)){message('Нужен известный отрезок минимум 8 пикселей и корректная длина в метрах.');return}
 snapshot();state.scale=meters/pixels;state.scaleVerified=true;setTool('select');afterChange();
 message('Масштаб установлен. Сверьте ещё один размер и проверьте 3D.');
}
function deleteSelected(){
 if(!selection)return;
 snapshot();state.walls=state.walls.filter(w=>w.id!==selection);
 state.openings=state.openings.filter(o=>o.wallId!==selection);
 delete state.materials.walls[selection];state.materials.zones=state.materials.zones.filter(z=>z.wallId!==selection);
 selectedSurface=null;selectedOpeningId=null;selection=null;afterChange();
}
function undo(){
 if(!history.length)return;
 const prev=JSON.parse(history.pop());
 for(const k of Object.keys(prev))state[k]=prev[k];
 state.materials=state.materials||{walls:{},floor:null,zones:[]};
 selection=null;pending=null;afterChange();
}
function selectedOpening(){return state.openings.find(o=>o.id===selectedOpeningId)||null}
function selectOpening(id,scroll=false){
 const found=state.openings.find(o=>o.id===id);if(!found)return;
 selectedOpeningId=id;selectedSurface=null;selection=found.wallId;
 stagedSashes=[2,3].includes(Number(found.sashes))?Number(found.sashes):null;
 refreshInspectors();redraw();
 if(scroll)$('openingEditorPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
}
let stagedSashes=null;
function surfaceMaterial(){
 if(!selectedSurface)return normalizeMaterial({color:state.wallColor});
 if(selectedSurface.type==='floor')return normalizeMaterial(state.materials.floor||{color:state.floorColor});
 if(selectedSurface.type==='zone')return normalizeMaterial(state.materials.zones.find(z=>z.id===selectedSurface.zoneId)||{color:state.wallColor});
 return normalizeMaterial(state.materials.walls[selectedSurface.wallId]||{color:state.wallColor});
}
function selectSurface(target,scroll=false){
 selectedSurface=target;selectedOpeningId=null;selection=target?.wallId||null;
 materialDraft=surfaceMaterial();
 $('surfaceScope').value=target?.type==='zone'?'patch':'whole';
 refreshInspectors();redraw();
 if(scroll)$('surfaceEditorPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderMaterialPreview(){
 const el=$('materialPreview');el.replaceChildren();
 if(!materialDraft.texture){el.textContent='Текстура не загружена — будет использован выбранный цвет';return}
 const img=document.createElement('img');img.src=materialDraft.texture;img.alt='Загруженный материал';
 const label=document.createElement('span');label.textContent='Собственная текстура · масштаб '+materialDraft.textureScale;
 el.append(img,label);
}
function refreshInspectors(){
 document.querySelectorAll('[data-style-preset]').forEach(b=>b.classList.toggle('selected',b.dataset.stylePreset===state.style));
 $('surfaceEditorPanel').hidden=!selectedSurface;
 $('openingEditorPanel').hidden=!selectedOpeningId;
 $('selectionStatus').textContent=selectedOpeningId?'Выбран архитектурный проём':selectedSurface?'Выбрано: '+materialTargetName(selectedSurface):'Нажмите на поверхность, чтобы изменить материал';
 if(selectedSurface){
  $('surfaceName').textContent=materialTargetName(selectedSurface)+(selectedSurface.wallId?' · '+selectedSurface.wallId:'');
  $('surfaceHint').textContent=selectedSurface.type==='floor'?'Меняется только пол. Стены и окна не затрагиваются.':
   selectedSurface.type==='zone'?'Выделен готовый фрагмент отделки.':'Можно изменить всю стену или только участок вокруг выбранной точки. Проёмы сохранятся.';
  const scope=$('surfaceScope');if(selectedSurface.type==='floor'){scope.value='whole';scope.disabled=true}else scope.disabled=false;
  if(selectedSurface.type==='zone')scope.value='patch';
  $('patchOptions').hidden=scope.value!=='patch'||selectedSurface.type==='floor';
  $('surfaceColor').value=materialDraft.color;
  $('surfaceTextureScale').value=String(materialDraft.textureScale);
  renderMaterialPreview();
 }
 const o=selectedOpening();if(o){
  const wall=state.walls.find(w=>w.id===o.wallId),spec=wall?openingSpec(wall,o,state.scale,state.wallHeight):null;
  $('openingName').textContent=(o.kind==='window'?'Окно':'Дверь')+' · '+o.id;
  $('openingHint').textContent=o.kind==='window'?
    (o.sashVerified?'Количество створок подтверждено.':'2 или 3 створки не определяются надёжно по одному плану. Выберите по фасаду или спецификации.'):'Уточните размер дверного проёма и цвет рамы.';
  $('openingWidth').value=Number((spec?.widthM||o.widthM||1.4).toFixed(2));
  $('openingHeight').value=Number((spec?.heightM||o.heightM||1.35).toFixed(2));
  $('openingSill').value=Number((spec?.sillM||0).toFixed(2));
  $('sillLabel').hidden=o.kind!=='window';
  $('windowSashes').hidden=o.kind!=='window';
  $('openingFrameColor').value=/^#[0-9a-f]{6}$/i.test(o.frameColor)?o.frameColor:(INTERIOR_STYLES[state.style]?.frame||'#303633');
  document.querySelectorAll('[data-sashes]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sashes)===stagedSashes));
  $('sashConfidence').textContent=o.sashVerified?'Створки подтверждены пользователем.':
    stagedSashes?'Вариант предложен AI или выбран в текущем сеансе. Нажмите «Сохранить и подтвердить».':'Количество створок неизвестно. Без фасада или спецификации 3D покажет условный двухстворчатый вариант.';
 }
}
function useStyle(style){
 const preset=INTERIOR_STYLES[style];if(!preset)return;
 snapshot();state.style=style;state.wallColor=preset.walls;state.floorColor=preset.floor;
 $('style').value=style;$('wallColor').value=preset.walls;$('floorColor').value=preset.floor;
 afterChange();message('Стиль '+preset.name+' применён к базовым поверхностям. Индивидуальные материалы стен и пола сохранены.');
}
function materialForSelection(){
 if(!selectedSurface){message('Нажмите на стену или пол прямо в 3D-просмотре.');return}
 const color=$('surfaceColor').value,texture=materialDraft.texture,textureScale=Number($('surfaceTextureScale').value)||1;
 const mat=normalizeMaterial({color,texture,textureScale});
 snapshot();
 if(selectedSurface.type==='floor')state.materials.floor=mat;
 else if(selectedSurface.type==='zone'){
  const zone=state.materials.zones.find(z=>z.id===selectedSurface.zoneId);
  if(zone)Object.assign(zone,mat);
 }else if($('surfaceScope').value==='patch'){
  const wall=state.walls.find(w=>w.id===selectedSurface.wallId);if(!wall)return;
  const len=dist(wall.a,wall.b)*state.scale;
  const patchW=clamp(Number($('patchWidth').value)||1.6,.2,Math.max(.2,len-.04));
  const patchH=clamp(Number($('patchHeight').value)||1.5,.2,state.wallHeight);
  const centerM=clamp(Number(selectedSurface.centerM)||len/2,patchW/2,Math.max(patchW/2,len-patchW/2));
  const bottomM=clamp((Number(selectedSurface.hitY)||1.35)-patchH/2,0,Math.max(0,state.wallHeight-patchH));
  const id='zone_'+Date.now().toString(36);
  state.materials.zones.push({id,wallId:wall.id,centerM,bottomM,widthM:patchW,heightM:patchH,side:selectedSurface.side===-1?-1:1,...mat});
  selectedSurface={type:'zone',wallId:wall.id,zoneId:id};
 }else{
  state.materials.walls[selectedSurface.wallId]=mat;
 }
 materialDraft=mat;afterChange();message('Материал изменён только у выбранного объекта. Геометрия и оконные проёмы сохранены.');
}
function clearMaterial(){
 if(!selectedSurface)return;
 snapshot();
 if(selectedSurface.type==='floor')state.materials.floor=null;
 else if(selectedSurface.type==='zone'){
  state.materials.zones=state.materials.zones.filter(z=>z.id!==selectedSurface.zoneId);
  selectedSurface={type:'wall',wallId:selectedSurface.wallId,centerM:1,hitY:1.4,side:1};
 }else delete state.materials.walls[selectedSurface.wallId];
 materialDraft=surfaceMaterial();$('surfaceScope').value='whole';
 afterChange();message('Локальная отделка удалена, вернулась базовая отделка стиля.');
}
async function loadMaterialImage(file){
 if(!selectedSurface)return;
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>5_000_000)throw Error('Нужна текстура PNG, JPG или WEBP до 5 МБ.');
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Не удалось открыть изображение материала'));im.src=url});
  const c=document.createElement('canvas'),k=Math.min(1,850/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*k));c.height=Math.max(1,Math.round(img.height*k));
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  materialDraft.texture=c.toDataURL('image/jpeg',.78);
  renderMaterialPreview();message('Текстура загружена. Нажмите «Применить», чтобы назначить её объекту.');
 }finally{URL.revokeObjectURL(url)}
}
function saveSelectedOpening(){
 const original=selectedOpening();if(!original)return;
 const wall=state.walls.find(w=>w.id===original.wallId);if(!wall)return;
 const widthM=Number($('openingWidth').value),heightM=Number($('openingHeight').value),sillM=original.kind==='window'?Number($('openingSill').value):0;
 if(original.kind==='window'&&!([2,3].includes(stagedSashes))){message('Для точной модели сначала выберите: 2 или 3 створки.');return}
 const candidate={...original,widthM,heightM,sillM,frameColor:$('openingFrameColor').value,
  sashes:original.kind==='window'?stagedSashes:null,sashVerified:original.kind==='window',verified:true};
 if(!openingSpec(wall,candidate,state.scale,state.wallHeight)){message('Некорректные размеры: проверьте ширину, отступ, высоту и подоконник.');return}
 const problems=openingProblems({...state,openings:state.openings.map(o=>o.id===candidate.id?candidate:o)});
 if(problems.some(p=>p.includes('пересекаются')||p.includes('Некорректная'))){message('Проём пересекается с соседним или выходит за границы стены.');return}
 snapshot();Object.assign(original,candidate);afterChange();
 message((original.kind==='window'?'Окно':'Дверь')+' подтверждено: '+widthM.toFixed(2)+' × '+heightM.toFixed(2)+' м.'+(original.kind==='window'?' '+stagedSashes+' створки.':''));
}
function deleteSelectedOpening(){
 const o=selectedOpening();if(!o)return;
 snapshot();state.openings=state.openings.filter(x=>x.id!==o.id);
 selectedOpeningId=null;selection=null;afterChange();message('Проём удалён.');
}

function addFurniture(type){
 if(!state.walls.length){message('Сначала создайте стены.');return}
 snapshot();
 const dims=type==='sofa'?[2.2,.85,.85]:type==='table'?[1.5,.75,.8]:[2,1.9,.5];
 const box=boundsMeters(state.walls,state.width,state.height,state.scale);
 const x=box?(box.minX+box.maxX)/2:0,z=box?(box.minZ+box.maxZ)/2:0;
 state.furniture.push({id:'f'+Date.now().toString(36),type,x,z,width:dims[0],depth:dims[1],height:dims[2]});
 afterChange();message('Добавлена условная мебель с габаритами '+dims[0]+' × '+dims[1]+' м. Проверьте размещение.');
}
let init3dRequested=false;
async function init3D(){
 if(init3dRequested)return;init3dRequested=true;
 try{
  const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
  const canvas=$('threeCanvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#1c221e');
  const camera=new THREE.PerspectiveCamera(49,1,.05,600);
  const orbit={theta:.75,phi:1.02,radius:17,target:new THREE.Vector3(0,0,0)};
  const ambient=new THREE.AmbientLight(0xffffff,1.5);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffebca,3);sun.position.set(-6,12,8);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;
  sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;scene.add(sun);
  const group=new THREE.Group();scene.add(group);
  const grid=new THREE.GridHelper(100,100,0x657467,0x303c32);grid.position.y=-.045;scene.add(grid);
  three={THREE,renderer,scene,camera,orbit,sun,ambient,group,grid};
  const updateCamera=()=>{
   orbit.phi=clamp(orbit.phi,.18,Math.PI/2.05);
   camera.position.set(orbit.target.x+orbit.radius*Math.sin(orbit.phi)*Math.sin(orbit.theta),
    orbit.target.y+orbit.radius*Math.cos(orbit.phi),orbit.target.z+orbit.radius*Math.sin(orbit.phi)*Math.cos(orbit.theta));
   camera.lookAt(orbit.target);
  };
  three.updateCamera=updateCamera;updateCamera();
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{
   if(!drag)return;
   if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>7)drag.moved=true;
   if(drag.moved){orbit.theta-=(e.clientX-drag.x)*.012;orbit.phi-=(e.clientY-drag.y)*.009;updateCamera()}
   drag.x=e.clientX;drag.y=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{if(!drag)return;const wasMoved=drag.moved;drag=null;if(!wasMoved)pick3D(e)});
  canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();orbit.radius=clamp(orbit.radius*Math.exp(e.deltaY*.001),2,100);updateCamera()},{passive:false});
  const resize=()=>{
   const r=$('threeArea').getBoundingClientRect();if(!r.width||!r.height)return;
   renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe($('threeArea'));resize();
  const draw=()=>{renderer.render(scene,camera);requestAnimationFrame(draw)};draw();
  refresh3D();sync();
 }catch(e){
  $('threeEmpty').hidden=false;
  $('threeEmpty').querySelector('strong').textContent='3D-модуль не загрузился';
  $('threeEmpty').querySelector('small').textContent='Для 3D требуется WebGL и доступ к модулю Three.js. План 2D доступен.';
  message('Трёхмерный просмотр недоступен в этом браузере. '+(e.message||''));
 }
}
function lightPreview(){
 if(!three)return;
 const {sun,ambient}=three;sun.visible=true;
 if(state.lighting==='evening'){
  ambient.intensity=.8;ambient.color.set('#c4d3eb');sun.intensity=1.1;sun.color.set('#f2aa6f');
 }else if(state.lighting==='sunny'){
  ambient.intensity=1.4;sun.intensity=3.8;sun.color.set('#ffedcc');
 }else if(state.lighting==='overcast'){
  ambient.intensity=2;sun.intensity=.65;sun.color.set('#f2f7ff');
 }else if(state.lighting==='studio'){
  ambient.intensity=2;sun.intensity=2;sun.color.set('#ffffff');
 }else{
  ambient.intensity=1.5;sun.intensity=2;sun.color.set('#ffebc8');
 }
}
function getSurfaceTexture(THREE,src,scale=1){
 if(!src||!src.startsWith('data:image/'))return null;
 let result=textureCache.get(src);
 if(!result){
  result=new THREE.TextureLoader().load(src);
  result.colorSpace=THREE.SRGBColorSpace;result.wrapS=THREE.RepeatWrapping;result.wrapT=THREE.RepeatWrapping;
  textureCache.set(src,result);
 }
 // Texture belongs to the whole material: clone when changing repeat count to avoid changing other objects.
 const clone=result.clone();clone.needsUpdate=true;
 clone.repeat.set(Math.max(.25,scale),Math.max(.25,scale));
 return clone;
}
function createFinishMaterial(THREE,value,backup,side=THREE.FrontSide){
 const v=normalizeMaterial(value||{color:backup});
 const map=getSurfaceTexture(THREE,v.texture,v.textureScale);
 return new THREE.MeshStandardMaterial({color:map?'#ffffff':v.color,map,roughness:.82,metalness:0,side,
  polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
}
function refresh3D(){
 if(!three)return;
 const {THREE,group}=three;
 while(group.children.length){
  const obj=group.children[0];group.remove(obj);
  obj.geometry?.dispose();obj.material?.map?.dispose();
  if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose();
 }
 if(!state.walls.length){sync();return}
 const bb=boundsMeters(state.walls,state.width,state.height,state.scale);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.3,bb.width+.3),.09,Math.max(.3,bb.depth+.3)),
  createFinishMaterial(THREE,state.materials.floor,state.floorColor));
 floor.position.set((bb.minX+bb.maxX)/2,-.065,(bb.minZ+bb.maxZ)/2);
 floor.receiveShadow=true;floor.name='reference-floor';floor.userData.surfaceType='floor';group.add(floor);
 const segments=buildWalls(state);
 for(const [i,w] of segments.entries()){
  const style=state.materials.walls[w.wallId]||null;
  const mat=createFinishMaterial(THREE,style,state.wallColor);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w.length,w.wallHeight,w.thickness),mat);
  mesh.position.set(w.x,w.y,w.z);mesh.rotation.y=w.rotation;
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='wall_'+i;
  mesh.userData={surfaceType:'wall',wallId:w.wallId};
  group.add(mesh);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),
   new THREE.LineBasicMaterial({color:0x6d756d,transparent:true,opacity:.24}));
  outline.position.copy(mesh.position);outline.rotation.copy(mesh.rotation);
  outline.userData.ignorePick=true;group.add(outline);
 }
 for(const z of materialZonesForWall(state.materials.zones,segments)){
  const material=createFinishMaterial(THREE,z, '#e7dfd1',THREE.DoubleSide);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(z.width,z.height,z.depth),material);
  mesh.position.set(z.x,z.y,z.z);mesh.rotation.y=z.rotation;
  mesh.userData={surfaceType:'zone',wallId:z.wallId,zoneId:z.zoneId};
  mesh.name='finish-zone-'+z.zoneId;mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
 }
 const windowParts=buildOpeningAssemblies(state);
 for(const part of windowParts){
  const opening=state.openings.find(o=>o.id===part.openingId);
  const frameColor=opening?.frameColor||INTERIOR_STYLES[state.style]?.frame||'#303633';
  let mat;
  if(part.role==='glass'){
   mat=new THREE.MeshPhysicalMaterial({color:0xc1d5d8,metalness:.03,roughness:.085,transparent:true,opacity:.44,
    transmission:.18,thickness:.01,side:THREE.DoubleSide,depthWrite:false});
  }else if(part.role==='door-leaf'){
   mat=new THREE.MeshStandardMaterial({color:0xc9bca9,roughness:.63,metalness:0});
  }else if(part.role==='handle'){
   mat=new THREE.MeshStandardMaterial({color:0xc1b6a6,roughness:.25,metalness:.8});
  }else{
   mat=new THREE.MeshStandardMaterial({color:frameColor,roughness:.3,metalness:.58});
  }
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(part.width,part.height,part.depth),mat);
  mesh.position.set(part.x,part.y,part.z);mesh.rotation.y=part.rotation;
  mesh.castShadow=part.role!=='glass';mesh.receiveShadow=true;
  mesh.name=part.role+'-'+part.openingId;
  mesh.userData={surfaceType:'opening',openingId:part.openingId,wallId:part.wallId};
  group.add(mesh);
 }
 const mapColor={sofa:'#b9af9e',table:'#8c745c',bed:'#ece5dd'};
 for(const f of state.furniture){
  const mat=new THREE.MeshStandardMaterial({color:mapColor[f.type]||'#aaaaaa',roughness:.8});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(f.width,f.height,f.depth),mat);
  mesh.position.set(f.x,f.height/2,f.z);mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.userData={surfaceType:'furniture',furnitureId:f.id};
  mesh.name='furniture_'+f.id;group.add(mesh);
 }
 const frameKey=[round(bb.minX,1),round(bb.maxX,1),round(bb.minZ,1),round(bb.maxZ,1),state.wallHeight].join(',');
 if(three.frameKey!==frameKey){
  three.frameKey=frameKey;
  three.orbit.target.set((bb.minX+bb.maxX)/2,Math.min(1,state.wallHeight*.42),(bb.minZ+bb.maxZ)/2);
  three.orbit.radius=clamp(Math.max(bb.width,bb.depth)*1.8,5,55);
  three.updateCamera();
 }
 lightPreview();sync();
}
function pick3D(e){
 if(!three||!state.walls.length)return;
 const {THREE,renderer,camera,group}=three;
 const bounds=renderer.domElement.getBoundingClientRect();
 const p=new THREE.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
 const raycaster=new THREE.Raycaster();raycaster.setFromCamera(p,camera);
 const hit=raycaster.intersectObjects(group.children,true).find(item=>item.object.isMesh&&item.object.userData?.surfaceType);
 if(!hit)return;
 const meta=hit.object.userData;
 if(meta.openingId){selectOpening(meta.openingId,true);return}
 if(meta.surfaceType==='furniture'){message('Выбрана мебель. Библиотека точных предметов и их перемещение будут добавлены отдельно.');return}
 if(meta.surfaceType==='floor'){selectSurface({type:'floor'},true);return}
 if(meta.surfaceType==='zone'){selectSurface({type:'zone',zoneId:meta.zoneId,wallId:meta.wallId},true);return}
 if(meta.surfaceType==='wall'){
  const wall=state.walls.find(w=>w.id===meta.wallId);if(!wall)return;
  const len=dist(wall.a,wall.b)*state.scale;if(!len)return;
  const ux=(wall.b.x-wall.a.x)*state.scale/len,uz=-(wall.b.y-wall.a.y)*state.scale/len;
  const ax=(wall.a.x-state.width/2)*state.scale,az=(state.height/2-wall.a.y)*state.scale;
  const centerM=clamp((hit.point.x-ax)*ux+(hit.point.z-az)*uz,0,len);
  const faceNormal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld);
  const angle=hit.object.rotation.y;
  const side=faceNormal?.x*Math.sin(angle)+faceNormal?.z*Math.cos(angle)<0?-1:1;
  selectSurface({type:'wall',wallId:meta.wallId,centerM,hitY:clamp(hit.point.y,0,state.wallHeight),side},true);
 }
}
function download(name,blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function exportJSON(){
 const out={format:'FORMA-PLAN-TO-INTERIOR',version:1,units:'m',sourceWidth:state.width,sourceHeight:state.height,
 scaleMPerPixel:state.scale,scaleVerified:state.scaleVerified,wallHeightM:state.wallHeight,wallThicknessM:state.wallThickness,
 walls:state.walls,openings:state.openings,furniture:state.furniture,materials:state.materials,style:state.style,lighting:state.lighting,wallColor:state.wallColor,floorColor:state.floorColor};
 download('forma-plan-interior.json',new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
}
function exportOBJ(){
 if(!three)return;
 const group=three.group;group.updateMatrixWorld(true);
 let data='# FORMA PLAN TO INTERIOR · meters · editable architectural model\n';
 let offset=1;
 for(const mesh of group.children){
  if(!mesh.isMesh)continue;
  const geo=mesh.geometry,pos=geo.getAttribute('position'),idx=geo.getIndex();
  if(!pos)continue;
  data+='o '+String(mesh.name).replace(/[^a-zA-Z0-9_-]/g,'_')+'\n';
  const vertex=new three.THREE.Vector3();
  for(let i=0;i<pos.count;i++){vertex.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);data+='v '+round(vertex.x,5)+' '+round(vertex.y,5)+' '+round(vertex.z,5)+'\n'}
  if(idx){for(let i=0;i<idx.count;i+=3)data+='f '+(offset+idx.getX(i))+' '+(offset+idx.getX(i+1))+' '+(offset+idx.getX(i+2))+'\n'}
  else{for(let i=0;i<pos.count;i+=3)data+='f '+(offset+i)+' '+(offset+i+1)+' '+(offset+i+2)+'\n'}
  offset+=pos.count;
 }
 download('forma-plan-interior.obj',new Blob([data],{type:'text/plain'}));
}
async function importJSON(file){
 try{
  const d=JSON.parse(await file.text());
  if(d.format!=='FORMA-PLAN-TO-INTERIOR'||!Array.isArray(d.walls)||d.walls.length>300)throw Error('Неподдерживаемый проект.');
  if(state.bitmap&&Math.abs((d.sourceWidth||0)-state.width)>1)throw Error('Сначала загрузите исходное изображение именно этого плана.');
  if(!state.bitmap)throw Error('Сначала загрузите исходный план, потом импортируйте модель.');
  snapshot();
  state.walls=d.walls.filter(w=>w.a&&w.b&&Number.isFinite(w.a.x)&&Number.isFinite(w.b.x)&&Number.isFinite(w.a.y)&&Number.isFinite(w.b.y)).slice(0,250);
  state.openings=Array.isArray(d.openings)?d.openings.slice(0,150):[];
  state.furniture=Array.isArray(d.furniture)?d.furniture.slice(0,70):[];
  state.materials=d.materials&&typeof d.materials==='object'?{walls:d.materials.walls||{},floor:d.materials.floor||null,zones:Array.isArray(d.materials.zones)?d.materials.zones.slice(0,100):[]}:{walls:{},floor:null,zones:[]};
  state.scale=clamp(Number(d.scaleMPerPixel)||.02,.0001,2);state.scaleVerified=d.scaleVerified===true;
  state.wallHeight=clamp(Number(d.wallHeightM)||2.8,2,8);state.wallThickness=clamp(Number(d.wallThicknessM)||.2,.08,.6);
  $('wallHeight').value=state.wallHeight;$('wallWidth').value=state.wallThickness;
  afterChange();message('Модель загружена из JSON. Проверьте геометрию и размеры.');
 }catch(e){message(e.message||'Не удалось открыть JSON')}
}
async function createPhoto(relight=false){
 if(!three||!state.scaleVerified||!state.walls.length){message('Перед AI-фото подтвердите масштаб и постройте 3D.');return}
 if(!confirm(relight?'Переосветить готовое AI-фото? Это отдельный платный запрос; мебель и геометрия должны остаться неизменными.':'Создать фотореалистичную фотографию по 3D-кадру? Это платный запрос API Market. Геометрия может немного измениться при AI-генерации. Продолжить?'))return;
 $('renderPhoto').disabled=true;$('relightPhoto').disabled=true;
 $('photoStatus').textContent='AI обрабатывает интерьер. Не закрывайте страницу.';
 try{
  const base=relight&&photo?photo:three.renderer.domElement.toDataURL('image/png');
  const brief={sceneType:'interior',room:'living',style:relight?'as-is':state.style,
   furniture:relight?'preserve':'preserve',lighting:state.lighting,
   preserveMaterials:true,lockGeometry:true,output:{ratio:'16:9',quality:'high',quantity:1},
   notes:'This reference is a snapshot of a 3D architectural model. Keep all walls, windows, doors, exact camera, furniture locations and proportions unchanged. Upgrade only real physical surfaces and believable photographic light.',
   sunLighting:{indoorSource:state.lighting==='evening'?'fixtures':'window',shadow:state.lighting==='sunny'?'defined':'soft'}};
  const response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({image:base,brief,relightOnly:relight,quality:'high',quantity:1,size:'1536x864'})});
  const result=await response.json().catch(()=>({error:'Неверный ответ сервера'}));
  if(!response.ok||!result.images?.length)throw Error(result.error||'AI не вернул кадр.');
  const mime=result.mimes?.[0]||'image/png';
  photo='data:'+mime+';base64,'+result.images[0];photoHistory.push(photo);
  $('photoImg').src=photo;$('photoResult').hidden=false;
  $('photoStatus').textContent=relight?'Новый вариант освещения готов. Предыдущий кадр сохранён в памяти этой вкладки.':'AI-фотография готова. Скачайте результат.';
  message(relight?'Переосвещение завершено.':'Фотореалистичный интерьер готов.');
 }catch(e){message(e.message||'Не удалось создать AI-фото.');$('photoStatus').textContent='AI не выполнил запрос. Изображение не потеряно.'}
 finally{sync();$('relightPhoto').disabled=!photo}
}
function demo(){
 const c=document.createElement('canvas');c.width=1100;c.height=760;
 const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
 ctx.strokeStyle='#21252a';ctx.lineWidth=18;ctx.strokeRect(95,85,910,590);
 ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(560,93);ctx.lineTo(560,420);ctx.lineTo(995,420);ctx.moveTo(95,420);ctx.lineTo(315,420);ctx.moveTo(420,420);ctx.lineTo(560,420);ctx.stroke();
 ctx.font='25px Arial';ctx.fillStyle='#737373';ctx.fillText('ГОСТИНАЯ',195,260);ctx.fillText('КУХНЯ',687,275);ctx.fillText('СПАЛЬНЯ',675,548);
 ctx.font='17px Arial';ctx.fillText('Демо-план для проверки распознавания и 3D',100,715);
 applyImage(c).then(()=>{autoDetect();message('Пример загружен. Для точных размеров укажите масштаб — например, отрезок 4 м.')});
}
function bind(){
 $('planFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{await applyImage(await readImageFile(file));autoDetect();message('План загружен. Распознанные стены — предварительные. Подтвердите масштаб и проверьте линии.')}
  catch(err){message(err.message||'Не удалось открыть план.')}
 });
 $('planCanvas').addEventListener('pointerdown',e=>{
  e.preventDefault();
  if(mode==='select'&&selection){
   const wall=state.walls.find(w=>w.id===selection);
   if(wall){
    const p=fromPointer(e);const endpoint=dist(p,wall.a)<=13/screen.k?'a':dist(p,wall.b)<=13/screen.k?'b':null;
    if(endpoint){snapshot();dragWall={id:wall.id,endpoint};$('planCanvas').setPointerCapture(e.pointerId);return}
   }
  }
  canvasTap(e);
 });
 $('planCanvas').addEventListener('pointermove',e=>{
  if(!dragWall)return;
  const wall=state.walls.find(w=>w.id===dragWall.id);if(!wall)return;
  wall[dragWall.endpoint]=fromPointer(e);redraw();
 });
 const finishDrag=()=>{if(!dragWall)return;dragWall=null;state.scaleVerified=false;afterChange();message('Стена изменена: проверьте размерные цепочки и повторно подтвердите масштаб при необходимости.');};
 $('planCanvas').addEventListener('pointerup',finishDrag);
 $('planCanvas').addEventListener('pointercancel',finishDrag);
 $('autoDetect').addEventListener('click',autoDetect);
 $('aiDetect').addEventListener('click',useVision);
 $('calibrate').addEventListener('click',()=>setTool('calibrate'));
 $('applyScale').addEventListener('click',applyCalibration);
 for(const tool of document.querySelectorAll('[data-tool]'))tool.addEventListener('click',()=>setTool(tool.dataset.tool));
 $('deleteWall').addEventListener('click',deleteSelected);
 $('confirmWalls').addEventListener('click',()=>{if(!state.scaleVerified)return; if(!confirm('Вы проверили все линии стен и положение проёмов по чертежу? Отмечаем стены подтверждёнными; окна и двери должны быть проверены отдельно.'))return;state.walls.forEach(w=>w.verified=true);afterChange();message('Стены подтверждены. Проёмы остаются предварительными до отдельной проверки.')});
 $('undo').addEventListener('click',undo);
 $('wallHeight').addEventListener('change',e=>{state.wallHeight=clamp(Number(e.target.value)||2.8,2,8);afterChange()});
 $('wallWidth').addEventListener('change',e=>{state.wallThickness=clamp(Number(e.target.value)||.2,.08,.6);afterChange()});
 $('style').addEventListener('change',e=>useStyle(e.target.value));
 for(const id of ['lighting','wallColor','floorColor'])$(id).addEventListener('input',e=>{state[id]=e.target.value;afterChange()});
 for(const button of document.querySelectorAll('[data-style-preset]')){
  button.addEventListener('click',()=>useStyle(button.dataset.stylePreset));
 }
 for(const button of document.querySelectorAll('[data-next]'))button.addEventListener('click',()=>{
  const step=button.dataset.next;
  if(step==='style'){$('styleEditor').scrollIntoView({behavior:'smooth',block:'start'});return}
  if(step==='surface'){if(!selectedSurface)message('Нажмите на пол или любую стену в правом окне 3D.');$('threeArea').scrollIntoView({behavior:'smooth',block:'center'});return}
  if(step==='window'){if(!selectedOpeningId)message('Нажмите на точку проёма на плане или на оконную раму в 3D.');$('threeArea').scrollIntoView({behavior:'smooth',block:'center'});return}
  $('renderPhoto').scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('surfaceScope').addEventListener('change',e=>{
  $('patchOptions').hidden=e.target.value!=='patch';
  if(e.target.value==='patch'&&selectedSurface?.type==='floor'){e.target.value='whole';$('patchOptions').hidden=true}
 });
 $('surfaceColor').addEventListener('input',e=>{materialDraft.color=e.target.value});
 $('surfaceTextureScale').addEventListener('change',e=>{materialDraft.textureScale=Number(e.target.value)||1;renderMaterialPreview()});
 $('materialFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{await loadMaterialImage(file)}catch(error){message(error.message||'Ошибка загрузки текстуры.')}
 });
 $('applySurface').addEventListener('click',materialForSelection);
 $('resetSurface').addEventListener('click',clearMaterial);
 for(const btn of document.querySelectorAll('[data-sashes]'))btn.addEventListener('click',()=>{
  stagedSashes=Number(btn.dataset.sashes);
  document.querySelectorAll('[data-sashes]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.sashes)===stagedSashes));
  $('sashConfidence').textContent='Выбрано '+stagedSashes+' створки. Нажмите «Сохранить и подтвердить».';
 });
 $('saveOpening').addEventListener('click',saveSelectedOpening);
 $('deleteOpening').addEventListener('click',deleteSelectedOpening);
 $('addSofa').addEventListener('click',()=>addFurniture('sofa'));
 $('addTable').addEventListener('click',()=>addFurniture('table'));
 $('addBed').addEventListener('click',()=>addFurniture('bed'));
 $('clearFurniture').addEventListener('click',()=>{snapshot();state.furniture=[];afterChange()});
 $('loadDemo').addEventListener('click',demo);
 $('saveModel').addEventListener('click',exportJSON);
 $('exportOBJ').addEventListener('click',exportOBJ);
 $('importModel').addEventListener('change',e=>{if(e.target.files[0])importJSON(e.target.files[0]);e.target.value=''});
 $('resetCamera').addEventListener('click',()=>{if(!three)return;three.orbit.theta=.75;three.orbit.phi=1.02;three.updateCamera()});
 $('renderPhoto').addEventListener('click',()=>createPhoto(false));
 $('relightPhoto').addEventListener('click',()=>createPhoto(true));
 $('downloadPhoto').addEventListener('click',()=>{if(photo)download('forma-interior-photo.png',new Blob([Uint8Array.from(atob(photo.split(',')[1]),c=>c.charCodeAt(0))],{type:photo.slice(5,photo.indexOf(';'))}))});
 window.addEventListener('resize',()=>{redraw();refresh3D()},{passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){pending=null;setTool('select')}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();undo()}});
}
async function restore(){
 try{
  const raw=localStorage.getItem(STORE);if(!raw)return;
  const saved=JSON.parse(raw);if(!saved?.image)return;
  const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=saved.image});
  const c=document.createElement('canvas');c.width=Math.max(1,Math.min(2000,Number(saved.width)||img.width));c.height=Math.max(1,Math.min(2000,Number(saved.height)||img.height));c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  await applyImage(c,true);
  const allowed=['walls','openings','furniture','materials','scale','scaleVerified','wallHeight','wallThickness','wallColor','floorColor','style','lighting'];
  for(const k of allowed){if(saved[k]!==undefined)state[k]=saved[k]}
  state.walls=Array.isArray(state.walls)?state.walls:[];state.openings=Array.isArray(state.openings)?state.openings:[];
  state.materials=state.materials&&typeof state.materials==='object'?{walls:state.materials.walls||{},floor:state.materials.floor||null,zones:Array.isArray(state.materials.zones)?state.materials.zones:[]}:{walls:{},floor:null,zones:[]};
  $('wallHeight').value=state.wallHeight;$('wallWidth').value=state.wallThickness;
  for(const k of ['wallColor','floorColor','style','lighting'])$(k).value=state[k];
  afterChange();message('Ваш предыдущий план восстановлен из памяти браузера.');
 }catch{message('Не удалось восстановить сохранённый план. Загрузите его снова.')}
}
bind();sync();new ResizeObserver(redraw).observe($('planArea'));
restore().then(()=>{init3D();visionStatus();refreshInspectors()});
