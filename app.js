/* ДОМ.РЕНДЕР · MVP front-end, no external dependencies */
'use strict';
const $ = id => document.getElementById(id);
const eHTML = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const uuid = () => (globalThis.crypto?.randomUUID?.() || ('local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)));
const icon = id => `<svg class="ico"><use href="#i-${id}"/></svg>`;

// Missing asset fallback: preserve real photos when present; illustrate only unavailable thumbnail JPGs.
// No external image requests, and no replacement of user-uploaded source images.
function domRenderThumbFallback(file) {
  const filename=String(file).split('/').pop().replace(/\.(jpg|png|webp)$/i,'');
  const [group, ...parts]=filename.split('-');
  const id=parts.join('-');
  const textLabels={
    garden:'Сад и газон',forest:'Лес',lake:'Озеро',mountains:'Горы',city:'Город',
    coast:'Побережье',mist:'Туман',nordic:'Север',minimal:'Минимализм',
    courtyard:'Двор',spring:'Весна',summer:'Лето',autumn:'Осень',winter:'Зима',
    clear:'Ясно',cloud:'Облачно',rain:'Дождь',snow:'Снег',fog:'Туман',
    morning:'Утро',day:'День',golden:'Закат',night:'Ночь',
    tropical:'Тропики',mediterranean:'Средиземноморье',decorative:'Декоративные',
    plaster:'Штукатурка',wood:'Дерево',glass:'Стекло',concrete:'Бетон',
    travertine:'Травертин',brick:'Кирпич',metal:'Металл',ceramic:'Керамика',limestone:'Известняк',
    original:'Исходный',cinematic:'Кино',dusk:'Сумерки',noon:'Полдень'
  };
  const palette={
    garden:['#9dc3b0','#e5e8c4','#54795d'],forest:['#456c61','#b9c6a0','#274b40'],
    lake:['#77b5bf','#d5e8e6','#567f8e'],mountains:['#8097a1','#e2e4df','#4e6c80'],
    city:['#9fa8aa','#e6ddd4','#566e77'],coast:['#8fc4cf','#f5e3bc','#428f9d'],
    mist:['#9aada8','#e2e5dc','#708c88'],nordic:['#86a7b6','#ecede6','#486c70'],
    minimal:['#b7b9ad','#e7e3d6','#808b74'],courtyard:['#bba88e','#ebdcc3','#727f68'],
    spring:['#a6c7a2','#f5dfd9','#69a571'],summer:['#86b6a4','#dfe6bb','#3f8c63'],
    autumn:['#cd9c79','#eddfbd','#a35f45'],winter:['#bacdd6','#f5f5ef','#8ea9b9'],
    clear:['#83bada','#e8d4a9','#6facc4'],cloud:['#9fb2c0','#e8ece9','#7a93a0'],
    rain:['#778e9b','#bac8cf','#566c79'],snow:['#b4cbd8','#f2f5f8','#849eae'],
    fog:['#a4b8b6','#e5e6dd','#829e9e'],morning:['#deb8a6','#f1e1ba','#9eb1b1'],
    day:['#85bdd8','#e4e1bb','#6da1b2'],golden:['#d7a175','#f5d5a5','#996c69'],
    night:['#344965','#9a8baa','#263b53'],
    wood:['#ab8667','#e1c8a6','#7a5841'],brick:['#b57a6a','#dfaea0','#80564c'],
    plaster:['#d5d3c6','#efede6','#a8a99f'],concrete:['#a7a9a4','#d0d0c9','#7e8482'],
    metal:['#86979b','#cfd7d4','#596b71'],glass:['#89b5bd','#dce8e6','#5a909c'],
    ceramic:['#b8b0a5','#e0d9ce','#8e887d'],travertine:['#c8b9a0','#eae0ce','#b4a084'],
    limestone:['#cbbfa8','#efe8da','#a39883']
  };
  const p=palette[id]||['#9fb6af','#e5e6dc','#69817d'];
  const landscape=group==='env'||group==='season'||group==='weather'||group==='time'||group==='plants'||group==='look';
  const trees=landscape?'<path d="M18 122 54 55 90 122ZM264 122 291 73 318 122Z" fill="'+p[2]+'" opacity=".72"/><rect x="51" y="115" width="6" height="37" fill="#735e4c" opacity=".75"/>':'';
  const house=landscape?'<path d="m104 110 60-45 62 45v58H104Z" fill="#eeeae0"/><path d="m95 110 69-53 71 53" fill="none" stroke="#485c57" stroke-width="8"/><path d="M127 119h30v34h-30zm49 0h30v34h-30" fill="'+p[2]+'" opacity=".78"/>':'';
  const surface=landscape?'':'<rect x="50" y="38" width="220" height="126" rx="7" fill="'+p[2]+'" opacity=".72"/><path d="M50 66h220M50 98h220M50 130h220" stroke="'+p[1]+'" stroke-width="3" opacity=".52"/>';
  const label=(textLabels[id]||id).replace(/[<&]/g,'');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="bg" x2=".3" y2="1"><stop stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><rect width="320" height="200" fill="url(#bg)"/><circle cx="253" cy="45" r="26" fill="#fff9e9" opacity=".55"/><path d="M0 138Q70 100 155 135T320 133v67H0Z" fill="'+p[2]+'" opacity=".35"/>'+trees+house+surface+'<rect x="0" y="167" width="320" height="33" fill="#1e302d" opacity=".72"/><text x="12" y="188" fill="#fff" font-family="Arial,sans-serif" font-size="16">'+label+'</text></svg>';
  // Photographic placeholders for not-yet-uploaded thumbnails.
  // Original files under assets/thumbs always take priority; these are shown only on 404.
  const photoIds = {
    'env-garden':'photo-1500534623283-312aade485b7',
    'env-forest':'photo-1441974231531-c6227db76b6e',
    'env-lake':'photo-1501785888041-af3ef285b470',
    'env-mountains':'photo-1464822759023-fed622ff2c3b',
    'env-city':'photo-1519501025264-65ba15a82390',
    'env-coast':'photo-1507525428034-b723cf961d3e',
    'env-mist':'photo-1483347756197-71ef80e95f73',
    'env-nordic':'photo-1464822759023-fed622ff2c3b',
    'env-minimal':'photo-1500534623283-312aade485b7',
    'env-courtyard':'photo-1416879595882-3373a0480b5b',
    'season-spring':'photo-1490750967868-88aa4486c946',
    'season-summer':'photo-1470252649378-9c29740c9fa8',
    'season-autumn':'photo-1507371341162-763b5e419408',
    'season-winter':'photo-1455156218388-5e61b526818b',
    'weather-clear':'photo-1500534623283-312aade485b7',
    'weather-cloud':'photo-1500534314209-a25ddb2bd429',
    'weather-rain':'photo-1515694346937-94d85e41e6f0',
    'weather-snow':'photo-1455156218388-5e61b526818b',
    'weather-fog':'photo-1483347756197-71ef80e95f73',
    'time-morning':'photo-1493246507139-91e8fad9978e',
    'time-day':'photo-1500534623283-312aade485b7',
    'time-golden':'photo-1470252649378-9c29740c9fa8',
    'time-night':'photo-1470770841072-f978cf4d019e',
    'plants-forest':'photo-1441974231531-c6227db76b6e',
    'plants-tropical':'photo-1502082553048-f009c37129b9',
    'plants-mediterranean':'photo-1416879595882-3373a0480b5b',
    'plants-decorative':'photo-1416879595882-3373a0480b5b',
    'plants-minimal':'photo-1500534623283-312aade485b7',
    'look-original':'photo-1500534623283-312aade485b7',
    'look-cinematic':'photo-1470252649378-9c29740c9fa8',
    'look-dusk':'photo-1470770841072-f978cf4d019e',
    'look-noon':'photo-1500534623283-312aade485b7',
    'look-fog':'photo-1483347756197-71ef80e95f73',
    'look-winter':'photo-1455156218388-5e61b526818b',
    'mat-wood':'photo-1510798831971-661eb04b3739',
    'mat-brick':'photo-1511818966892-d7d671e672a2',
    'mat-concrete':'photo-1510798831971-661eb04b3739',
    'mat-travertine':'photo-1511818966892-d7d671e672a2',
    'mat-glass':'photo-1487958449943-2429e8be8625',
    'mat-metal':'photo-1487958449943-2429e8be8625',
    'mat-ceramic':'photo-1487958449943-2429e8be8625',
    'mat-plaster':'photo-1511818966892-d7d671e672a2',
    'mat-limestone':'photo-1511818966892-d7d671e672a2'
  };
  const photoId=photoIds[filename];
  if(photoId)return 'https://images.unsplash.com/'+photoId+'?auto=format&fit=crop&w=440&h=270&q=75';

  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
document.addEventListener('error',function(event) {
  const img=event.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.domFallback) return;
  const name=img.getAttribute('src')||'';
  if (!/assets\/thumbs\/[^/]+\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(name)) return;
  img.dataset.domFallback='1';
  img.src=domRenderThumbFallback(name);
},true);

// Verified Pexels library originals: the CDN requests a 2048px image for each photographic preset.
// If the CDN cannot load, we fall back to the photographic atlas bundled with this project.
const HD_PHOTO_IDS = {
 'assets/thumbs/env-garden.jpg':10610731,
 'assets/thumbs/env-forest.jpg':29863712,
 'assets/thumbs/env-lake.jpg':32665591,
 'assets/thumbs/env-mountains.jpg':35757664,
 'assets/thumbs/env-city.jpg':33783264,
 'assets/thumbs/env-courtyard.jpg':31979505,
 'assets/thumbs/env-nordic.jpg':35552479,
 'assets/thumbs/env-coast.jpg':36899281,
 'assets/thumbs/env-minimal.jpg':9976121,
 'assets/thumbs/env-mist.jpg':17497197,
 'assets/thumbs/season-spring.jpg':16215927,
 'assets/thumbs/season-summer.jpg':7601179,
 'assets/thumbs/season-autumn.jpg':9665012,
 'assets/thumbs/season-winter.jpg':35830070,
 'assets/thumbs/weather-clear.jpg':8996637,
 'assets/thumbs/weather-cloud.jpg':18154963,
 'assets/thumbs/weather-rain.jpg':28447782,
 'assets/thumbs/weather-fog.jpg':6697824,
 'assets/thumbs/weather-snow.jpg':6533455,
 'assets/thumbs/time-morning.jpg':17807979,
 'assets/thumbs/time-day.jpg':35382739,
 'assets/thumbs/time-golden.jpg':785734,
 'assets/thumbs/time-night.jpg':5518647,
 'assets/thumbs/plants-minimal.jpg':297954,
 'assets/thumbs/plants-decorative.jpg':4846304,
 'assets/thumbs/plants-forest.jpg':32166001,
 'assets/thumbs/plants-mediterranean.jpg':28450914,
 'assets/thumbs/plants-tropical.jpg':927414
};
const HD_PRESETS = Object.fromEntries(Object.entries(HD_PHOTO_IDS).map(([path,id]) => [
 path, 'https://images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&cs=tinysrgb&w=2048&h=1210&fit=crop'
]));
document.addEventListener('error',event=>{
 const im=event.target;
 if(!(im instanceof HTMLImageElement)||im.dataset.hdFallback)return;
 const path=im.dataset.assetPath;
 if(path && HD_PRESETS[path] && im.src.startsWith('https://images.pexels.com/')){
   im.dataset.hdFallback='1';im.src=path;
 }
},true);
const ASSET = 'assets/';
const asset = path => window.DOM_RENDER_ASSETS?.[path] || HD_PRESETS[path] || path;
const environments = [['garden','Сад и газон','Ухоженный приватный сад, аккуратный газон и декоративные посадки.'],['forest','Хвойный лес','Высокие хвойные деревья на заднем плане, натуральный лесной рельеф.'],['lake','У озера','Естественная береговая линия и спокойное озеро на заднем плане, берег не перемещать между видами произвольно.'],['mountains','Горы','Дальний горный горизонт и каменистый рельеф.'],['city','Городской парк','Ландшафт современного городского парка без новых построек.'],['courtyard','Тихий парк','Приватный озеленённый участок с высокими деревьями.'],['nordic','Северный пейзаж','Сдержанная северная природа, камни, хвойники.'],['coast','У побережья','Прибрежная природа, дальняя горизонтальная линия моря.'],['minimal','Минимализм','Сдержанный ландшафт, гравий, небольшие деревья и злаки.'],['mist','Туманный лес','Мягкий дальний лесной пейзаж с атмосферной дымкой.']];
const choices = {
 time:[['morning','Утро','Мягкое низкое утреннее солнце'],['day','День','Естественный дневной свет'],['golden','Вечер','Тёплый золотой час'],['night','Ночь','Ночная съёмка, мягкий интерьерный свет']],
 weather:[['clear','Ясно','Чистое небо'],['cloud','Облачно','Плотная переменная облачность'],['rain','Дождь','Реалистичный дождь, влажные поверхности'],['fog','Туман','Низкий мягкий туман'],['snow','Снег','Снег, зимний свет']],
 season:[['spring','Весна','Молодая зелень, весенние цветущие растения'],['summer','Лето','Пышная зелёная листва'],['autumn','Осень','Осенняя листва и приглушённая палитра'],['winter','Зима','Безлиственные деревья, зимние фактуры']],
 plants:[['minimal','Минимальная','Редкие акцентные посадки и низкие злаки'],['decorative','Декоративная','Аккуратные кустарники и многолетники'],['forest','Лесная','Лесной подлесок, папоротники, кустарники'],['mediterranean','Средиземноморская','Оливы, лаванда, сухостойные злаки'],['tropical','Тропическая','Крупнолистные тропические растения']]
};
const zones = [['main','Основной фасад'],['accent','Акцентные вставки'],['base','Цоколь'],['roof','Кровля'],['custom','Своя область']];
const catalog = [['plaster','Штукатурка','mat-plaster.jpg'],['travertine','Травертин','mat-travertine.jpg'],['limestone','Природный камень','mat-limestone.jpg'],['wood','Дерево','mat-wood.jpg'],['brick','Клинкер','mat-brick.jpg'],['concrete','Бетон','mat-concrete.jpg'],['metal','Металл','mat-metal.jpg'],['ceramic','Керамогранит','mat-ceramic.jpg'],['glass','Стекло','mat-glass.jpg']];
const defaultSettings = ()=>({environment:'garden',time:'day',weather:'cloud',season:'summer',plants:'decorative',ratio:'16:9',quality:'high',quantity:'1',zone:'main',mats:{main:null,accent:null,base:null,roof:null,custom:null},textureScale:100,textureRotate:0,lockGeometry:true,keepReference:true,editSelectedOnly:false});
const makeProject=(name='Новый проект',isDemo=false)=>({id:isDemo?'demo':uuid(),name,createdAt:Date.now(),modifiedAt:Date.now(),demo:isDemo,settings:defaultSettings(),renders:[],activeRender:null,reference:null,sourceWidth:1672,sourceHeight:941,hasSource:isDemo,angle:1});
const STKEY='domrender_mvp_projects_v1', MTKEY='domrender_mvp_materials_v1';
let projects=[],project=null,customMaterials=[],currentTab='environment',materialTab='mine',viewerMode=localStorage.getItem('domrender_view_mode')||'slider';
let sourceURL='',renderURL='',texturePreviewURL='',loadedMaskZone='',editing=false,tool='brush',lastPoint=null,polyPoints=[],drawActive=false,maskHistory=[],demoPhoto=asset(ASSET+'residence-render.jpg');
let maskVisible=false;
let maskCanvas=document.createElement('canvas'),maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true}),toastTimer,rendering=false,aiConnected=false,apiAuthRequired=false;
const imageCache = new Map();
const dataStore = (()=>{
 const fallbackStore = new Map();
 let dbPromise;
 function open(){if(!('indexedDB' in window))return Promise.resolve(null);if(!dbPromise)dbPromise=new Promise(resolve=>{let req;try{req=indexedDB.open('domrender-media-v1',1)}catch{return resolve(null)}req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)});return dbPromise}
 async function transact(type,key,value){const db=await open();if(!db){try{if(type==='get')return localStorage.getItem('domrender_fallback_'+key) || fallbackStore.get(key) || null;if(type==='put')localStorage.setItem('domrender_fallback_'+key,value);if(type==='delete')localStorage.removeItem('domrender_fallback_'+key)}catch{if(type==='get')return fallbackStore.get(key) || null;if(type==='put')fallbackStore.set(key,value);if(type==='delete')fallbackStore.delete(key)}return null}return new Promise((resolve,reject)=>{const tx=db.transaction('media',type==='get'?'readonly':'readwrite');const req=tx.objectStore('media')[type](...(type==='put'?[value,key]:[key]));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
 return {get:k=>transact('get',k),put:(k,v)=>transact('put',k,v),del:k=>transact('delete',k)};
})();
const mediaKey=(kind,id=project?.id)=>`${id}_${kind}`;
const current = ()=>project.settings;
const labelFor=(arr,key)=>arr.find(x=>x[0]===key)?.[1]||key;
const cLabel=(key,val)=>labelFor(choices[key],val);
const envLabel=()=>labelFor(environments,current().environment);
const zoneLabel=()=>labelFor(zones,current().zone);
const matById=id=>{const c=catalog.find(m=>m[0]===id);if(c)return {id,name:c[1],img:asset(ASSET+'thumbs/'+c[2]),custom:false};const m=customMaterials.find(m=>m.id===id);return m?{...m,custom:true,img:imageCache.get('material_'+id)||ASSET+'thumbs/mat-plaster.jpg'}:{id:'plaster',name:'Штукатурка',img:asset(ASSET+'thumbs/mat-plaster.jpg'),custom:false}};
function save(){if(!project)return;project.modifiedAt=Date.now();try{localStorage.setItem(STKEY,JSON.stringify({projects,activeId:project.id}));localStorage.setItem(MTKEY,JSON.stringify(customMaterials.map(({id,name,width,height,createdAt})=>({id,name,width,height,createdAt}))))}catch(e){toast('Не удалось сохранить настройки: хранилище браузера заполнено')}}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3400)}
async function setMedia(key,url){imageCache.set(key,url);await dataStore.put(key,url)}
async function getMedia(key){if(imageCache.has(key))return imageCache.get(key);const val=await dataStore.get(key);if(val)imageCache.set(key,val);return val||''}
function pngDataFromFile(file,maxEdge=2000){return new Promise((resolve,reject)=>{if(!file.type.startsWith('image/')||!['image/png','image/jpeg','image/webp'].includes(file.type))return reject(new Error('Поддерживаются только PNG, JPG и WebP'));if(file.size>22*1024*1024)return reject(new Error('Размер изображения должен быть до 22 МБ'));const reader=new FileReader;reader.onerror=()=>reject(new Error('Не удалось открыть файл'));reader.onload=()=>{const im=new Image;im.onload=()=>{const factor=Math.min(1,maxEdge/Math.max(im.naturalWidth,im.naturalHeight));const cn=document.createElement('canvas');cn.width=Math.round(im.naturalWidth*factor);cn.height=Math.round(im.naturalHeight*factor);const ctx=cn.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cn.width,cn.height);ctx.drawImage(im,0,0,cn.width,cn.height);resolve({data:cn.toDataURL('image/jpeg',.91),width:cn.width,height:cn.height})};im.onerror=()=>reject(new Error('Некорректное изображение'));im.src=reader.result};reader.readAsDataURL(file)})}
async function imageFrom(url){return new Promise((resolve,reject)=>{const im=new Image;im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Не удалось загрузить текстуру'));im.src=url})}
function setupMaskSize(){let w=1200,h=Math.round(1200*(project.sourceHeight||941)/(project.sourceWidth||1672));h=Math.max(300,Math.min(1750,h));maskCanvas.width=w;maskCanvas.height=h;maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});$('maskOverlay').width=w;$('maskOverlay').height=h;$('materialPreview').width=w;$('materialPreview').height=h;$('polyOverlay').setAttribute('viewBox',`0 0 ${w} ${h}`)}
function updateStageAspect(){const w=project.sourceWidth||1672,h=project.sourceHeight||941;$('stage').style.aspectRatio=`${w}/${h}`;setupMaskSize()}
async function getMaskForZone(zone=current().zone){return getMedia(mediaKey('mask_'+zone))}
async function loadMask(zone=current().zone){loadedMaskZone=zone;maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);const data=await getMaskForZone(zone);if(data){try{const im=await imageFrom(data);maskCtx.drawImage(im,0,0,maskCanvas.width,maskCanvas.height)}catch{}}maskHistory=[];polyPoints=[];paintMaskOverlay()}
function selectedMaskPixels(){const px=maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;let count=0;for(let i=3;i<px.length;i+=4)if(px[i]>80)count++;return count}
async function persistMask(){const url=maskCanvas.toDataURL('image/png');await setMedia(mediaKey('mask_'+current().zone),url);save()}
function paintMaskOverlay(){const cn=$('maskOverlay'),ctx=cn.getContext('2d');ctx.clearRect(0,0,cn.width,cn.height);if(!editing&&!maskVisible)return;const data=maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height),out=ctx.createImageData(cn.width,cn.height);for(let i=0;i<data.data.length;i+=4){const a=data.data[i+3];if(a>0){out.data[i]=177;out.data[i+1]=100;out.data[i+2]=60;out.data[i+3]=Math.min(120,a*.48)}}ctx.putImageData(out,0,0);drawPolygonGuide()}
function drawPolygonGuide(){const svg=$('polyOverlay');if(!editing||tool!=='polygon'||!polyPoints.length){svg.innerHTML='';return}const pts=polyPoints.map(p=>`${p.x},${p.y}`).join(' ');svg.innerHTML=`<polyline points="${pts}"/>`+polyPoints.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4"/>`).join('')}
function stashHistory(){maskHistory.push(maskCanvas.toDataURL('image/png'));if(maskHistory.length>16)maskHistory.shift()}
async function undoMask(){if(polyPoints.length){polyPoints.pop();drawPolygonGuide();return}const prev=maskHistory.pop();if(!prev){toast('Нет изменений для отмены');return}maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);const im=await imageFrom(prev);maskCtx.drawImage(im,0,0,maskCanvas.width,maskCanvas.height);paintMaskOverlay();await persistMask()}
function makeDemoMask(zone){if(!project.demo){toast('На своём проекте выделите нужную область кистью или полигоном');return}const w=maskCanvas.width,h=maskCanvas.height;const shapes={main:[[.05,.31],[.17,.07],[.57,.17],[.61,.42],[.49,.41],[.47,.52],[.16,.48],[.07,.56]],accent:[[.48,.43],[.61,.35],[.97,.46],[.96,.75],[.56,.75],[.47,.65]],base:[[.07,.75],[.94,.75],[.95,.86],[.07,.85]],roof:[[.03,.28],[.18,.045],[.89,.27],[.93,.32],[.17,.10],[.07,.35]],custom:[]};const shape=shapes[zone]||[];maskCtx.clearRect(0,0,w,h);if(shape.length){maskCtx.beginPath();shape.forEach(([x,y],i)=>i?maskCtx.lineTo(x*w,y*h):maskCtx.moveTo(x*w,y*h));maskCtx.closePath();maskCtx.fillStyle='#fff';maskCtx.fill()}paintMaskOverlay();persistMask();toast('Примерная зона выделена на демонстрационном доме. Уточните кистью.')}
function polygonDone(){if(polyPoints.length<3){toast('Для полигона нужно минимум три точки');return}stashHistory();maskCtx.beginPath();polyPoints.forEach((p,i)=>i?maskCtx.lineTo(p.x,p.y):maskCtx.moveTo(p.x,p.y));maskCtx.closePath();maskCtx.fillStyle='#fff';maskCtx.fill();polyPoints=[];paintMaskOverlay();persistMask()}
const ptFromEvent=e=>{const rect=$('maskOverlay').getBoundingClientRect();return {x:Math.max(0,Math.min(maskCanvas.width,(e.clientX-rect.left)/rect.width*maskCanvas.width)),y:Math.max(0,Math.min(maskCanvas.height,(e.clientY-rect.top)/rect.height*maskCanvas.height))}};
function stroke(a,b,eraser=false){maskCtx.save();maskCtx.globalCompositeOperation=eraser?'destination-out':'source-over';maskCtx.strokeStyle='#fff';maskCtx.fillStyle='#fff';maskCtx.lineWidth=Number($('brushSize').value)*2;maskCtx.lineCap='round';maskCtx.lineJoin='round';maskCtx.beginPath();maskCtx.moveTo(a.x,a.y);maskCtx.lineTo(b.x,b.y);maskCtx.stroke();maskCtx.restore();paintMaskOverlay()}
function initDrawEvents(){const cn=$('maskOverlay');cn.addEventListener('pointerdown',e=>{if(!editing)return;e.preventDefault();const pt=ptFromEvent(e);if(tool==='polygon'){polyPoints.push(pt);drawPolygonGuide();return}stashHistory();drawActive=true;lastPoint=pt;cn.setPointerCapture(e.pointerId);stroke(pt,pt,tool==='erase')});cn.addEventListener('pointermove',e=>{if(!drawActive||!editing)return;const pt=ptFromEvent(e);stroke(lastPoint,pt,tool==='erase');lastPoint=pt});async function finish(){if(!drawActive)return;drawActive=false;lastPoint=null;await persistMask()}cn.addEventListener('pointerup',finish);cn.addEventListener('pointercancel',finish);cn.addEventListener('dblclick',e=>{if(editing&&tool==='polygon'){e.preventDefault();polygonDone()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing){leaveEditor()}if(e.key==='Enter'&&editing&&tool==='polygon'){polygonDone()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&editing){e.preventDefault();undoMask()}})}
function enterEditor(){maskVisible=true;editing=true;current().editSelectedOnly=true;$('editSelectedOnly').checked=true;save();tool='brush';$('stage').classList.add('edit-mode');$('editorToolbar').hidden=false;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool===tool));$('stage').scrollIntoView({behavior:'smooth',block:'center'});paintMaskOverlay();toast('Закрасьте нужную поверхность. Полигон закрывается двойным нажатием или Enter.')}
async function leaveEditor(){if(polyPoints.length>=3)polygonDone();editing=false;maskVisible=false;polyPoints=[];$('stage').classList.remove('edit-mode');$('editorToolbar').hidden=true;await persistMask();paintMaskOverlay()}
function updateSplit(value){$('stage').style.setProperty('--split',`${value}%`);$('splitSlider').value=value}
function setViewerMode(mode){
 if(!['slider','side','result'].includes(mode))mode='slider';
 viewerMode=mode;
 try{localStorage.setItem('domrender_view_mode',mode)}catch{}
 const stage=$('stage');stage.dataset.viewMode=mode;
 document.querySelectorAll('[data-view-mode]').forEach(b=>{
   const selected=b.dataset.viewMode===mode;
   b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
 });
 $('resetSplit').hidden=mode!=='slider';
 $('splitSlider').hidden=mode!=='slider';
 const hasResult=!!renderURL;
 if(mode==='result'&&!hasResult){$('noRender').hidden=false}
 else if(mode==='result'){$('noRender').hidden=true}
}

function showTab(tab,scroll=false){currentTab=tab;for(const b of document.querySelectorAll('[data-tab]')){const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))}for(const panel of document.querySelectorAll('.tab-panel'))panel.classList.toggle('active',panel.id===tab+'Panel');$('panelTitle').textContent=({environment:'Настройка рендера',materials:'Смена материалов',parameters:'Параметры'})[tab];$('panelSubtitle').textContent=({environment:'Выберите ландшафт, сезон, погоду и освещение.',materials:'Выделите часть дома и назначьте новое покрытие.',parameters:'Выберите качество, формат и защиту архитектуры.'})[tab];document.querySelectorAll('[data-mobile]').forEach(x=>x.classList.toggle('active',x.dataset.mobile===tab));document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===tab||x.dataset.nav==='studio'&&tab==='environment'));if(tab!=='materials'&&editing)leaveEditor();if(tab==='materials')loadMask();else $('maskOverlay').getContext('2d').clearRect(0,0,$('maskOverlay').width,$('maskOverlay').height);if(scroll)$('inspector').scrollIntoView({behavior:'smooth',block:'start'})}
function optionCards(group,arr,selected){return arr.map(([id,name])=>{
 const path=`${ASSET}thumbs/${group==='environment'?'env':group}-${id}.jpg`;
 return `<button class="image-option ${selected===id?'active':''}" data-choice-group="${group}" data-choice="${id}" aria-pressed="${selected===id}"><img src="${eHTML(asset(path))}" data-asset-path="${eHTML(path)}" alt="${eHTML(name)}" loading="lazy" decoding="async"><span>${eHTML(name)}</span></button>`;
}).join('')}
function renderChoices(){const s=current();$('environmentOptions').innerHTML=optionCards('environment',environments,s.environment);for(let group of ['time','weather','season','plants'])$(group+'Options').innerHTML=optionCards(group,choices[group],s[group])}
function renderZones(){
 const s=current();
 $('zoneOptions').innerHTML=zones.map(([id,name])=>{
  const chosen=customMaterials.find(m=>m.id===s.mats[id]);
  return `<button class="zone-option ${s.zone===id?'active':''}" data-zone="${id}"><span class="zone-icon">${icon('layer')}</span><span><b>${eHTML(name)}</b><small>${chosen?eHTML(chosen.name):'Фактура не назначена'}</small></span>${s.zone===id?icon('check'):icon('arrow')}</button>`
 }).join('');
 $('selectedZoneName').textContent=zoneLabel();
}
function renderMaterials(){
 const s=current();
 
 const cards=m=>`<button class="material-option ${s.mats[s.zone]===m.id?'active':''}" data-material="${eHTML(m.id)}" aria-pressed="${s.mats[s.zone]===m.id}"><img src="${eHTML(m.img)}" alt="Загруженная фактура ${eHTML(m.name)}"><span>${eHTML(m.name)}</span></button>`;
 $('catalogMaterials').innerHTML='';
 $('catalogMaterials').hidden=true;
 $('myMaterials').hidden=false;
 $('myMaterials').innerHTML=customMaterials.length?customMaterials.map(m=>cards(matById(m.id))).join(''):'<div class="empty-materials"><strong>Добавьте первую фактуру</strong><p>Загрузите фотографию камня, кирпича, дерева или любого собственного материала. На старте каталог пустой — вы сами формируете библиотеку.</p></div>';
 $('textureScale').value=s.textureScale;
 $('scaleValue').textContent=s.textureScale+'%';
 $('textureRotate').value=String(s.textureRotate);
 $('deleteMyMaterial').hidden=!matById(s.mats[s.zone]).custom;
}
function renderFooter(){const s=current();$('summaryLine').textContent=`${envLabel()} · ${cLabel('season',s.season)} · ${cLabel('time',s.time)}`;$('summaryMaterial').textContent=`${customMaterials.some(m=>m.id===s.mats[s.zone])?matById(s.mats[s.zone]).name:'Выберите свою фактуру'} · ${zoneLabel().toLowerCase()}`;$('stageSubtitle').textContent=$('summaryLine').textContent;$('stageTitle').textContent=project.name;$('canvasProjectLabel').textContent=project.name;$('breadcrumbName').textContent=project.name;$('stageRatio').textContent=s.ratio;$('ratioSelect').value=s.ratio;$('qualitySelect').value=s.quality;$('quantitySelect').value=s.quantity;$('lockGeometry').checked=s.lockGeometry;$('keepReference').checked=s.keepReference;if($('angleLandscapeLock'))$('angleLandscapeLock').checked=s.keepReference;$('editSelectedOnly').checked=!!s.editSelectedOnly}
function renderAll(){renderChoices();renderZones();renderMaterials();renderFooter();renderResults();updateStageAspect();updateSplit(36);setViewerMode(viewerMode);showTab(currentTab)}
function renderResults(){const items=[{id:'source',label:'Исходник',src:sourceURL||asset(ASSET+'residence-model-sketch.jpg')}];if(project.demo)items.push({id:'demo',label:'Пример фото',src:demoPhoto});for(const r of project.renders)items.push({id:r.id,label:`Рендер ${r.number||''}`,src:imageCache.get(mediaKey('render_'+r.id))||asset(ASSET+'residence-render.jpg')});$('resultsStrip').innerHTML=items.map(r=>`<button class="result-thumb ${((project.activeRender|| (project.demo?'demo':'source'))===r.id)?'active':''}" data-result="${r.id}"><img src="${eHTML(r.src)}" alt="${eHTML(r.label)}"><span>${eHTML(r.label)}</span></button>`).join('');$('resultsHint').textContent=project.demo?'Пример результата · AI-фото не генерировалось':(project.renders.length?`${project.renders.length} AI-результатов`:'Рендеров пока нет')}
async function hydrateRenderImages(){for(const r of project.renders){const u=await getMedia(mediaKey('render_'+r.id));if(u)imageCache.set(mediaKey('render_'+r.id),u)}renderResults()}
async function loadProject(id){maskVisible=false;const found=projects.find(p=>p.id===id);if(!found)return;project=found;sourceURL=project.demo?asset(ASSET+'residence-model-sketch.jpg'):await getMedia(mediaKey('source'));if(!sourceURL&&!project.demo){project.hasSource=false;sourceURL=asset(ASSET+'residence-model-sketch.jpg')}renderURL='';if(project.activeRender&&project.activeRender!=='demo'){renderURL=await getMedia(mediaKey('render_'+project.activeRender))}else if(project.demo){renderURL=demoPhoto}texturePreviewURL='';$('beforeImg').src=sourceURL;$('afterImg').src=renderURL||sourceURL;$('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height);$('noRender').hidden=!!renderURL;$('resultTag').textContent=project.demo?'ДЕМОНСТРАЦИЯ':renderURL?'AI-РЕЗУЛЬТАТ':'НЕТ РЕНДЕРА';$('splitSlider').disabled=!renderURL;$('uploadTitle').textContent=project.demo?'Загрузить свой скриншот':'Заменить скриншот проекта';$('uploadSubtitle').textContent=project.demo?'PNG, JPG, WEBP · Archicad, SketchUp, Revit и другие':`Ракурс ${project.angle||1} · PNG, JPG, WEBP`;$('workNote').textContent=project.demo?'Вы видите демонстрационное сравнение. Загрузите скриншот своего проекта, затем сгенерируйте результат через сервер с API-ключом.':'Ваш проект хранится локально в этом браузере. Без API-ключа AI-генерация недоступна; правки маски и настройки сохраняются.';renderAll();await hydrateRenderImages();await loadMask();save()}
async function createProject(name){const p=makeProject(name||'Новый проект');projects.unshift(p);await loadProject(p.id);toast('Создан новый проект. Загрузите скриншот.')}
async function uploadSource(file,newAngle=false){if(!file)return;try{const im=await pngDataFromFile(file);if(project.demo){await createProject(file.name.replace(/\.(png|jpe?g|webp)$/i,'').slice(0,48)||'Мой проект');newAngle=false}if(newAngle&&renderURL&&current().keepReference){await setMedia(mediaKey('ref'),renderURL);project.reference='ref'}if(!newAngle)project.renders=[];project.angle=(newAngle?(project.angle||1)+1:1);project.activeRender=null;project.sourceWidth=im.width;project.sourceHeight=im.height;project.demo=false;project.hasSource=true;await setMedia(mediaKey('source'),im.data);for(const [zone] of zones){await dataStore.del(mediaKey('mask_'+zone));imageCache.delete(mediaKey('mask_'+zone))}await loadProject(project.id);save();toast(newAngle?'Новый ракурс добавлен. Настройки сцены сохранены.':'Скриншот загружен. Выберите параметры визуализации.')}catch(err){toast(err.message||'Не удалось открыть изображение')}}
async function uploadOwnMaterial(file){if(!file)return;try{const im=await pngDataFromFile(file,1600);const id='usr_'+uuid();const name=file.name.replace(/\.(png|jpe?g|webp)$/i,'').slice(0,48)||'Мой материал';const m={id,name,width:0,height:0,createdAt:Date.now()};customMaterials.unshift(m);await setMedia('material_'+id,im.data);current().mats[current().zone]=id;materialTab='mine';renderMaterials();renderZones();renderFooter();save();toast('Материал добавлен. Выделите часть дома и нажмите «Примерить».');openDimensions(m)}catch(err){toast(err.message||'Не удалось загрузить текстуру')}}
function openDimensions(m){modal('Размеры материала',`<p class="muted">Укажите фактический размер одного фрагмента фактуры. Это поможет сохранить масштаб при AI-редактировании.</p><label>Название материала<input type="text" id="matNewName" maxlength="48" value="${eHTML(m.name)}"></label><div class="modal-pair"><label>Ширина, мм<input type="number" id="matWidth" min="0" max="10000" value="${m.width||''}" placeholder="Например, 1200"></label><label>Высота, мм<input type="number" id="matHeight" min="0" max="10000" value="${m.height||''}" placeholder="Например, 600"></label></div><p class="muted">Размеры можно оставить пустыми.</p>`,[{label:'Сохранить материал',primary:true,click:()=>{m.name=$('matNewName').value.trim()||m.name;m.width=Math.min(10000,Math.max(0,Number($('matWidth').value)||0));m.height=Math.min(10000,Math.max(0,Number($('matHeight').value)||0));renderMaterials();renderZones();renderFooter();save();closeModal()}}])}
function modal(title,html,actions=[]){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialogActions').innerHTML='';const a=$('dialogActions');a.className='dialog-actions';for(const item of actions){let b=document.createElement('button');b.className='btn '+(item.primary?'btn-dark':'btn-outline');b.textContent=item.label;b.addEventListener('click',item.click);a.appendChild(b)}$('dialogCover').hidden=false}
function closeModal(){$('dialogCover').hidden=true}
async function deleteProjectMedia(p){const keys=['source','ref',...zones.map(([z])=>'mask_'+z),...p.renders.map(r=>'render_'+r.id)];for(const k of keys){const key=mediaKey(k,p.id);imageCache.delete(key);await dataStore.del(key).catch(()=>{})}}
async function deleteSelectedCustomMaterial(){const id=current().mats[current().zone];const m=customMaterials.find(m=>m.id===id);if(!m)return;if(!confirm('Удалить материал «'+m.name+'» из вашей библиотеки?'))return;customMaterials=customMaterials.filter(x=>x.id!==id);for(const p of projects)for(const [z,mid] of Object.entries(p.settings.mats))if(mid===id)p.settings.mats[z]='plaster';imageCache.delete('material_'+id);await dataStore.del('material_'+id).catch(()=>{});save();renderZones();renderMaterials();renderFooter();toast('Материал удалён')}
function showProjects(){modal('Мои проекты',`<p class="muted">Проекты, материалы и маски хранятся локально на этом устройстве. При очистке данных браузера они могут исчезнуть.</p><div class="project-list">${projects.map(p=>`<div class="project-item ${p.id===project.id?'active':''}"><button data-open-project="${p.id}"><b>${eHTML(p.name)}</b><small>${p.demo?'Демонстрационный':'Проект'} · ${new Date(p.modifiedAt).toLocaleDateString('ru-RU')}</small></button><button class="icon-button" data-delete-project="${p.id}" title="Удалить">${icon('trash')}</button></div>`).join('')}</div>`,[{label:'Новый проект',primary:true,click:()=>{closeModal();showNewProject()}}]);$('dialogBody').querySelectorAll('[data-open-project]').forEach(b=>b.onclick=async()=>{closeModal();await loadProject(b.dataset.openProject)});$('dialogBody').querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=async()=>{if(projects.length<=1){toast('Нельзя удалить единственный проект');return}const id=b.dataset.deleteProject;if(!confirm('Удалить проект и его изображения из этого браузера?'))return;const doomed=projects.find(p=>p.id===id);projects=projects.filter(p=>p.id!==id);if(doomed)await deleteProjectMedia(doomed);if(project.id===id)await loadProject(projects[0].id);else save();showProjects()})}
function showNewProject(){modal('Новый проект',`<label>Название проекта<input type="text" id="newProjectName" maxlength="64" placeholder="Например, Вилла на озере" value="Новый проект"></label><p class="muted">После создания загрузите один или несколько скриншотов дома.</p>`,[{label:'Создать проект',primary:true,click:async()=>{const name=$('newProjectName').value.trim()||'Новый проект';closeModal();await createProject(name)}}]);setTimeout(()=>$('newProjectName')?.focus(),0)}
function settingsBrief(){const s=current();return {project:project.name,source:project.hasSource?'Скриншот':'Нет',environment:envLabel(),environmentInstructions:environments.find(e=>e[0]===s.environment)?.[2],time:cLabel('time',s.time),weather:cLabel('weather',s.weather),season:cLabel('season',s.season),plants:cLabel('plants',s.plants),materials:Object.fromEntries(zones.map(([id,name])=>[name,matById(s.mats[id]).name])),textureScale:s.textureScale+'%',textureRotation:s.textureRotate+'°',lockGeometry:s.lockGeometry,sceneReference:s.keepReference,output:{ratio:s.ratio,quality:s.quality,quantity:Number(s.quantity)},note:'Серия ракурсов использует визуальные референсы. Без 3D геометрическая идентичность окружения не гарантируется.'}}
function showBrief(){const text=JSON.stringify(settingsBrief(),null,2);modal('Техническое задание',`<p class="muted">Собрано автоматически из выбранных карточек. Пользователю не требуется писать промпт.</p><pre>${eHTML(text)}</pre>`,[{label:'Скопировать',primary:true,click:async()=>{try{await navigator.clipboard.writeText(text);toast('Бриф скопирован')}catch{downloadText('dom-render-brief.json',text,'application/json')}closeModal()}},{label:'Скачать JSON',click:()=>downloadText('dom-render-brief.json',text,'application/json')}])}
function downloadText(filename,text,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function downloadDataURL(url,filename){const a=document.createElement('a');a.href=url;a.download=filename;a.click()}
async function applyTexture(){if(editing)await leaveEditor();if(selectedMaskPixels()===0){toast('Сначала выделите поверхность кнопкой «Выделить на изображении».');return}const mat=matById(current().mats[current().zone]);if(!mat.custom){toast('Сначала загрузите свою фактуру и выберите её.');return}try{const im=await imageFrom(mat.img);const cn=$('materialPreview'),ctx=cn.getContext('2d');const w=cn.width,h=cn.height;const tile=document.createElement('canvas');const edge=Math.max(24,Math.round(190*current().textureScale/100));tile.width=edge;tile.height=edge;const tc=tile.getContext('2d');tc.translate(edge/2,edge/2);tc.rotate((current().textureRotate||0)*Math.PI/180);tc.drawImage(im,-edge/2,-edge/2,edge,edge);ctx.clearRect(0,0,w,h);const pat=ctx.createPattern(tile,'repeat');ctx.fillStyle=pat;ctx.globalAlpha=.75;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;const clip=document.createElement('canvas');clip.width=w;clip.height=h;clip.getContext('2d').drawImage(maskCanvas,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(clip,0,0);ctx.globalCompositeOperation='source-over';maskVisible=false;paintMaskOverlay();$('noRender').hidden=true;$('resultTag').textContent='ЛОКАЛЬНАЯ ПРИМЕРКА · НЕ AI';$('splitSlider').disabled=false;updateSplit(36);toast('Материал примерен локально. Для фотореализма нажмите «Создать визуализацию».')}catch(err){toast(err.message||'Не получилось применить текстуру')}}
function asPNGMask(baseWidth,baseHeight){const total=maskCanvas.width*maskCanvas.height;if(!total||!selectedMaskPixels())return null;const cn=document.createElement('canvas');cn.width=baseWidth;cn.height=baseHeight;const ctx=cn.getContext('2d');ctx.fillStyle='rgba(0,0,0,1)';ctx.fillRect(0,0,cn.width,cn.height);ctx.globalCompositeOperation='destination-out';ctx.drawImage(maskCanvas,0,0,cn.width,cn.height);ctx.globalCompositeOperation='source-over';return cn.toDataURL('image/png')}
function getImageSize(url){return imageFrom(url).then(im=>({w:im.naturalWidth,h:im.naturalHeight}))}
function imageSizeForRatio(ratio){return {'16:9':'1536x864','3:2':'1536x1024','4:3':'1360x1024','1:1':'1024x1024','9:16':'864x1536'}[ratio]||'1536x864'}
async function generate(){if(rendering)return;if(!project.hasSource){toast('Сначала загрузите скриншот');return}if(!aiConnected){if(apiAuthRequired){const pin=prompt('Введите код доступа к AI-генерации (SITE_ACCESS_PIN)');if(!pin)return;try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});const d=await r.json();if(!r.ok)throw Error(d.error||'Ошибка входа');await checkAPI();if(aiConnected)return generate();toast('AI пока не настроен на сервере.');}catch(err){toast(err.message)}return}modal('Подключение AI',`<p class="muted">Настройки и маски работают. Для реальной генерации запустите сервер и добавьте ключ API Market в защищённый <code>.env</code>.</p><p class="muted"><b>Запуск:</b> <code>API_MARKET_KEY</code> и <code>node server.mjs</code>. API-ключ нельзя хранить в браузере или на статическом хостинге.</p>`,[{label:'Понятно',primary:true,click:closeModal}]);return}if(Number(current().quantity)>1&&!confirm('Вы выбрали '+current().quantity+' варианта. Каждый AI-рендер оплачивается по тарифу API. Продолжить?'))return;rendering=true;$('generateBtn').disabled=true;$('generateText').textContent='Генерация…';$('providerFoot').textContent='AI обрабатывает изображение. Не закрывайте страницу.';try{const base=renderURL&&!project.demo?renderURL:sourceURL;const imSize=await getImageSize(base);const useMask=selectedMaskPixels()>0&&!!current().editSelectedOnly;const maskData=useMask?asPNGMask(imSize.w,imSize.h):null;const m=matById(current().mats[current().zone]);const materialData=useMask?(m.custom?await getMedia('material_'+m.id):await urlToDataURL(m.img)):null;let refData=null;if(current().keepReference&&!renderURL&&!project.demo){refData=await getMedia(mediaKey('ref'))}else if(current().keepReference&&project.reference){refData=await getMedia(mediaKey(project.reference))}const payload={image:await urlToDataURL(base),mask:maskData,material:materialData,reference:refData,brief:settingsBrief(),selectedZone:useMask?zoneLabel():null,materialName:useMask?m.name:null,materialDimensions:useMask?{width:m.width||0,height:m.height||0}:null,size:imageSizeForRatio(current().ratio),quality:current().quality,quantity:Number(current().quantity)};const ac=new AbortController();const id=setTimeout(()=>ac.abort(),180000);let response;try{response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ac.signal})}finally{clearTimeout(id)}const data=await response.json().catch(()=>({error:'Некорректный ответ сервера'}));if(!response.ok||!Array.isArray(data.images)||!data.images.length)throw new Error(data.error||'Сервер не вернул изображение');for(const [index,out] of data.images.entries()){const id='r'+uuid().slice(0,8);const url='data:'+(data.mimes?.[index]||'image/png')+';base64,'+out;await setMedia(mediaKey('render_'+id),url);project.renders.push({id,number:project.renders.length+1,createdAt:Date.now()});project.activeRender=id;renderURL=url}if(current().keepReference){await setMedia(mediaKey('ref'),renderURL);project.reference='ref'}save();await loadProject(project.id);toast(data.warning||'AI-визуализация готова. Сохраните изображение через галерею.')}catch(err){toast((err.name==='AbortError'?'Время ожидания AI истекло. ':err.message)||'Ошибка генерации')}finally{rendering=false;$('generateBtn').disabled=false;$('generateText').textContent='Создать визуализацию';$('providerFoot').textContent=aiConnected?'Nano Banana подключена':apiAuthRequired?'Доступ к генерации':'Демо: AI не подключён'}}
async function urlToDataURL(url){if(url.startsWith('data:'))return url;const response=await fetch(url);if(!response.ok)throw Error('Не удалось загрузить справочное изображение');const blob=await response.blob();return new Promise((resolve,reject)=>{const r=new FileReader;r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
async function showResult(id){if(id==='source'){project.activeRender=null;renderURL='';$('afterImg').src=sourceURL;$('noRender').hidden=false;$('resultTag').textContent='НЕТ РЕНДЕРА';$('splitSlider').disabled=true}else if(id==='demo'&&project.demo){project.activeRender='demo';renderURL=demoPhoto;$('afterImg').src=renderURL;$('noRender').hidden=true;$('resultTag').textContent='ДЕМОНСТРАЦИЯ';$('splitSlider').disabled=false}else{const url=await getMedia(mediaKey('render_'+id));if(!url){toast('Результат не найден в локальном хранилище');return}project.activeRender=id;renderURL=url;$('afterImg').src=url;$('noRender').hidden=true;$('resultTag').textContent='AI-РЕЗУЛЬТАТ';$('splitSlider').disabled=false}save();renderResults();setViewerMode(viewerMode);$('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height)}
async function checkAPI(){try{const res=await fetch('/api/status',{cache:'no-store',signal:AbortSignal.timeout(2500)});if(!res.ok)throw Error('Not running');const data=await res.json();aiConnected=!!data.ready;apiAuthRequired=!!data.authRequired&&!data.authorized}catch{aiConnected=false;apiAuthRequired=false}$('providerFoot').textContent=aiConnected?'Nano Banana подключена':apiAuthRequired?'Доступ к генерации':'Демо: AI не подключён'}
async function init(){let saved;try{saved=JSON.parse(localStorage.getItem(STKEY)||'null')}catch{}projects=saved?.projects?.length?saved.projects:[makeProject('Резиденция 01',true)];try{customMaterials=JSON.parse(localStorage.getItem(MTKEY)||'[]')}catch{customMaterials=[]}for(const m of customMaterials){const value=await getMedia('material_'+m.id);if(value)imageCache.set('material_'+m.id,value)}await loadProject(saved?.activeId||projects[0].id);initDrawEvents();bind();checkAPI();}
function setDemoScene(scene){
 const valid={summer:'Лето · Ясно · День',autumn:'Осень · Дневной свет',winter:'Зима · Холодный день',rain:'Дождь · Мокрые поверхности',fog:'Туман · Мягкий свет',golden:'Золотой вечер',night:'Ночь · Интерьерный свет'};
 if(!Object.hasOwn(valid,scene))return;
 const photo=$('sceneDemoPhoto'),caption=$('sceneDemoCaption');
 if(!photo||!caption)return;
 photo.dataset.scene=scene;
 caption.textContent=valid[scene];
 document.querySelectorAll('[data-scene-demo]').forEach(b=>{
   const active=b.dataset.sceneDemo===scene;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))
 });
}
function chooseDemoEnvironment(kind){
 const info={garden:'Сад и газон',forest:'Хвойный лес',lake:'У озера',mountains:'Горы'};
 if(!Object.hasOwn(info,kind))return;
 const path='assets/thumbs/env-'+kind+'.jpg';
 const im=$('sceneEnvironmentPreview'),label=$('sceneEnvironmentLabel');
 if(im){im.removeAttribute('data-hd-fallback');im.dataset.assetPath=path;im.src=asset(path);im.alt='Референс окружения: '+info[kind]}
 if(label)label.textContent=info[kind];
 document.querySelectorAll('[data-scene-environment]').forEach(b=>{let active=b.dataset.sceneEnvironment===kind;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
function bind(){if($('angleLandscapeLock'))$('angleLandscapeLock').onchange=e=>{current().keepReference=e.target.checked;$('keepReference').checked=e.target.checked;save();toast(e.target.checked?'Ландшафт и стиль сохраняются для следующих ракурсов':'Передача прошлого ракурса как референса выключена')};document.querySelectorAll('[data-view-mode]').forEach(b=>b.onclick=()=>setViewerMode(b.dataset.viewMode));document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>showTab(el.dataset.tab));document.querySelectorAll('[data-jump]').forEach(el=>el.onclick=()=>{const target=document.getElementById('renderSection-'+el.dataset.jump);if(!target)return;if(currentTab!=='environment')showTab('environment');document.querySelectorAll('[data-jump]').forEach(b=>b.classList.toggle('active',b===el));target.scrollIntoView({behavior:'smooth',block:'start'})});document.querySelectorAll('[data-mobile]').forEach(el=>el.onclick=()=>{const target=el.dataset.mobile;if(target==='studio'){$('workspace').scrollIntoView({behavior:'smooth'});document.querySelectorAll('[data-mobile]').forEach(x=>x.classList.toggle('active',x.dataset.mobile==='studio'))}else showTab(target,true)});document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=()=>{const target=el.dataset.nav;if(target==='projects')showProjects();else if(target==='studio'){$('workspace').scrollIntoView({behavior:'smooth'});showTab('environment')}else showTab(target,true)});$('environmentOptions').addEventListener('click',pickChoice);for(const group of ['time','weather','season','plants'])$(group+'Options').addEventListener('click',pickChoice);$('zoneOptions').addEventListener('click',async e=>{const el=e.target.closest('[data-zone]');if(!el)return;current().zone=el.dataset.zone;renderZones();renderMaterials();renderFooter();save();await loadMask()});for(const el of [$('catalogMaterials'),$('myMaterials')])el.addEventListener('click',e=>{const b=e.target.closest('[data-material]');if(!b)return;current().mats[current().zone]=b.dataset.material;renderMaterials();renderZones();renderFooter();save();toast('Материал назначен зоне. Для визуальной примерки используйте маску.')});document.querySelectorAll('[data-mtab]').forEach(el=>el.onclick=()=>{materialTab=el.dataset.mtab;renderMaterials()});$('sourceFile').onchange=e=>{uploadSource(e.target.files[0],false);e.target.value=''};$('angleFile').onchange=e=>{uploadSource(e.target.files[0],true);e.target.value=''};$('newAngleBtn').onclick=()=>{if(!project.hasSource)return toast('Сначала загрузите первый ракурс');$('angleFile').click()};$('uploadBox').onclick=()=>{$('sourceFile').click()};$('uploadBox').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('sourceFile').click()}};for(const ev of ['dragover','dragleave','drop'])$('uploadBox').addEventListener(ev,e=>{e.preventDefault();if(ev==='dragover')$('uploadBox').classList.add('dragging');else $('uploadBox').classList.remove('dragging');if(ev==='drop'&&e.dataTransfer.files[0])uploadSource(e.dataTransfer.files[0],false)});$('materialFile').onchange=e=>{uploadOwnMaterial(e.target.files[0]);e.target.value=''};$('uploadMaterialBtn').onclick=()=>$('materialFile').click();$('deleteMyMaterial').onclick=deleteSelectedCustomMaterial;$('startMask').onclick=async()=>{await loadMask();enterEditor();if(project.demo&&selectedMaskPixels()===0)makeDemoMask(current().zone)};$('showMask').onclick=async()=>{if(currentTab!=='materials')showTab('materials');await loadMask();if(selectedMaskPixels()===0){if(project.demo)makeDemoMask(current().zone);else toast('Маска пуста. Выделите область кистью или полигоном.');maskVisible=true}else maskVisible=!maskVisible;paintMaskOverlay();if(selectedMaskPixels())toast(maskVisible?'Маска показана.':'Маска скрыта.')};$('finishMask').onclick=leaveEditor;$('clearMask').onclick=()=>{stashHistory();maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);polyPoints=[];paintMaskOverlay();persistMask();toast('Выделение очищено')};$('undoMask').onclick=undoMask;document.querySelectorAll('[data-tool]').forEach(el=>el.onclick=()=>{if(polyPoints.length>=3&&tool==='polygon')polygonDone();tool=el.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===el));drawPolygonGuide()});$('brushSize').oninput=e=>$('brushOut').textContent=e.target.value;$('textureScale').oninput=e=>{current().textureScale=Number(e.target.value);$('scaleValue').textContent=e.target.value+'%';save()};$('textureRotate').onchange=e=>{current().textureRotate=Number(e.target.value);save()};$('tryMaterial').onclick=applyTexture;$('splitSlider').oninput=e=>updateSplit(e.target.value);$('resetSplit').onclick=()=>updateSplit(50);$('downloadResult').onclick=()=>{if(!renderURL){toast('Сначала создайте или выберите результат');return}downloadDataURL(renderURL,'dom-render-'+project.id+(project.demo||renderURL.startsWith('data:image/jpeg')?'.jpg':renderURL.startsWith('data:image/webp')?'.webp':'.png'));toast(project.demo?'Скачан демонстрационный кадр':'Результат скачан')};$('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('viewerCard')?.requestFullscreen?.()||$('stage').requestFullscreen?.()};$('resultsStrip').addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(b)showResult(b.dataset.result)});for(const id of ['ratioSelect','qualitySelect','quantitySelect'])$(id).onchange=e=>{current()[id.replace('Select','')]=e.target.value;renderFooter();save()};for(const id of ['lockGeometry','keepReference','editSelectedOnly'])$(id).onchange=e=>{current()[id]=e.target.checked;if(id==='keepReference'&&$('angleLandscapeLock'))$('angleLandscapeLock').checked=e.target.checked;save()};$('newProjectBtn').onclick=showNewProject;$('mobileAdd').onclick=showNewProject;$('helpBtn').onclick=()=>modal('Как работает ДОМ.РЕНДЕР',`<p class="muted"><b>1.</b> Загрузите скриншот из Archicad, SketchUp или Revit.<br><b>2.</b> Выберите окружение, погоду, сезон и время суток кнопками с изображениями.<br><b>3.</b> Во вкладке «Смена материалов» выделите фасад кистью или полигоном. Загрузите собственную текстуру, если требуется.<br><b>4.</b> Запустите AI-генерацию при подключённом API.<br><b>5.</b> Для следующего вида используйте «Новый ракурс»: настройки и референс сохранятся.</p><p class="muted">Без 3D совпадение положения объектов между разными ракурсами является приблизительным. Работа AI-редактора тоже не гарантирует идеальное сохранение геометрии.</p>`,[{label:'Понятно',primary:true,click:closeModal}]);$('generateBtn').onclick=generate;$('dialogClose').onclick=closeModal;$('dialogCover').onclick=e=>{if(e.target===$('dialogCover'))closeModal()}}
function pickChoice(e){const btn=e.target.closest('[data-choice]');if(!btn)return;const group=btn.dataset.choiceGroup;current()[group]=btn.dataset.choice;renderChoices();renderFooter();save();toast('Настройка сохранена: '+(group==='environment'?envLabel():cLabel(group,current()[group])))}
init().catch(err=>{console.error(err);toast('Не удалось загрузить приложение')});
