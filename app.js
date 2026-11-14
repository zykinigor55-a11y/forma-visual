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
  if(photoId)return 'https://images.unsplash.com/'+photoId+'?auto=format&fit=crop&w=2048&h=1280&q=88';

  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
document.addEventListener('error',function(event) {
  const img=event.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.domFallback) return;
  const path=img.dataset.assetPath;
  if(path){
    img.dataset.domFallback='1';
    img.removeAttribute('srcset');
    const failedSrc=img.getAttribute('src')||'';
    // Local Natural Luxury photographs are optional until uploaded to GitHub.
    // If an asset is missing, retain a working premium photographic fallback.
    img.src=failedSrc.includes('assets/thumbs/natural-luxury/')
      ? (window.DOM_RENDER_UNIFIED_PRESETS?.[path] || window.DOM_RENDER_ASSETS?.[path] || naturePhoto(path) || HD_PRESETS[path] || path)
      : (window.DOM_RENDER_UNIFIED_PRESETS?.[path] || window.DOM_RENDER_ASSETS?.[path] || path);
    return;
  }
  const name=img.getAttribute('src')||'';
  if (!/assets\/thumbs\/[^/]+\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(name)) return;
  img.dataset.domFallback='1';
  const photo = typeof naturePhoto==='function' ? naturePhoto(name.split('?')[0]) : null;
  img.src=photo || domRenderThumbFallback(name);
},true);

// High-density landscape / daypart imagery. Real photos, delivered at up to 2048px.
// The remote CDN is used for file size efficiency; fallback remains photographic.
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
const PREMIUM_LANDSCAPES = {
 'assets/thumbs/env-garden.jpg':'photo-1416879595882-3373a0480b5b',
 'assets/thumbs/env-forest.jpg':'photo-1441974231531-c6227db76b6e',
 'assets/thumbs/env-lake.jpg':'photo-1501785888041-af3ef285b470',
 'assets/thumbs/env-mountains.jpg':'photo-1464822759023-fed622ff2c3b',
 'assets/thumbs/env-city.jpg':'photo-1519501025264-65ba15a82390',
 'assets/thumbs/env-courtyard.jpg':'photo-1494438639946-1ebd1d20bf85',
 'assets/thumbs/env-nordic.jpg':'photo-1470770841072-f978cf4d019e',
 'assets/thumbs/env-coast.jpg':'photo-1507525428034-b723cf961d3e',
 'assets/thumbs/env-minimal.jpg':'photo-1500534623283-312aade485b7',
 'assets/thumbs/env-mist.jpg':'photo-1483347756197-71ef80e95f73',
 'assets/thumbs/time-morning.jpg':'photo-1470252649378-9c29740c9fa8',
 'assets/thumbs/time-day.jpg':'photo-1500534623283-312aade485b7',
 'assets/thumbs/time-golden.jpg':'photo-1500534314209-a25ddb2bd429',
 'assets/thumbs/time-night.jpg':'photo-1519608487953-e999c86e7455'
};
const premiumPhoto = (path, size=2048) => {
 const id=PREMIUM_LANDSCAPES[path];
 return id ? 'https://images.unsplash.com/'+id+'?auto=format&fit=crop&crop=entropy&w='+size+'&h='+Math.round(size*.64)+'&q=88' : null;
};
const HD_PRESETS = Object.fromEntries(Object.entries(HD_PHOTO_IDS).map(([path,id])=>[
 path, 'https://images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&cs=tinysrgb&w=2048&h=1280&fit=crop'
]));
document.addEventListener('error',event=>{
 const im=event.target;
 if(!(im instanceof HTMLImageElement))return;
 const path=im.dataset.assetPath;
 if(!path)return;
 const src=im.getAttribute('src')||'';
 // If premium image fails, retry a second full-resolution photographer source.
 if(src.startsWith('https://images.unsplash.com/') && HD_PRESETS[path] && im.dataset.imageFallback!=='pexels'){
   im.dataset.imageFallback='pexels'; im.src=HD_PRESETS[path];return;
 }
 // For other preset groups use a known photographic alternative rather than a 2D tile.
 if(src.startsWith('https://images.pexels.com/') && im.dataset.imageFallback!=='atlas'){
   im.dataset.imageFallback='atlas';
   im.src=path; // the bundled photo atlas handles offline mode, never a vector icon
 }
},true);
const ASSET = 'assets/';
// The user-approved PNG is an exact, byte-identical copy of the uploaded original.
// Approved colored SketchUp source, with an existing image as a safe fallback
// until the exact approved PNG is present in the repository.
const APPROVED_DEMO_BEFORE='assets/residence-model-clean-approved-v36.png?v=approved-clean-v36';
const PREVIOUS_DEMO_BEFORE='assets/residence-model-user-approved-20261109.png?v=approved-photo-20261109';
async function approvedDemoSource(){
 try {
  const res=await fetch(APPROVED_DEMO_BEFORE,{method:'HEAD',cache:'no-store'});
  if(res.ok && (res.headers.get('content-type')||'').startsWith('image/'))return APPROVED_DEMO_BEFORE;
 } catch(e){}
 return PREVIOUS_DEMO_BEFORE;
}

// v2.6: distinct, direct static demo source; avoid previously embedded model overrides.
const NATURE_PHOTOS={
 'env-garden':'photo-1416879595882-3373a0480b5b','env-forest':'photo-1441974231531-c6227db76b6e','env-lake':'photo-1501785888041-af3ef285b470','env-mountains':'photo-1464822759023-fed622ff2c3b','env-city':'photo-1519501025264-65ba15a82390','env-courtyard':'photo-1494438639946-1ebd1d20bf85','env-nordic':'photo-1470770841072-f978cf4d019e','env-coast':'photo-1507525428034-b723cf961d3e','env-minimal':'photo-1500534623283-312aade485b7','env-mist':'photo-1483347756197-71ef80e95f73',
 'time-morning':'photo-1470252649378-9c29740c9fa8','time-day':'photo-1500534623283-312aade485b7','time-golden':'photo-1500534314209-a25ddb2bd429','time-night':'photo-1519608487953-e999c86e7455',
 'season-spring':'photo-1490750967868-88aa4486c946','season-summer':'photo-1470252649378-9c29740c9fa8','season-autumn':'photo-1507371341162-763b5e419408','season-winter':'photo-1455156218388-5e61b526818b',
 'weather-clear':'photo-1500534623283-312aade485b7','weather-cloud':'photo-1500534314209-a25ddb2bd429','weather-rain':'photo-1515694346937-94d85e41e6f0','weather-fog':'photo-1483347756197-71ef80e95f73','weather-snow':'photo-1455156218388-5e61b526818b',
 'plants-minimal':'photo-1500534623283-312aade485b7','plants-decorative':'photo-1416879595882-3373a0480b5b','plants-forest':'photo-1441974231531-c6227db76b6e','plants-mediterranean':'photo-1416879595882-3373a0480b5b','plants-tropical':'photo-1502082553048-f009c37129b9'
};
const naturePhoto=path=>{
 const filename=path.split('/').pop().replace(/\.(jpe?g|webp|png)$/,'');
 const id=NATURE_PHOTOS[filename];
 return id?'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w=2048&h=1280&q=88':null;
};
const isPhotoPreset = path => /^assets\/thumbs\/(?:env|time|season|weather|plants)-[a-z]+\.jpg$/.test(path);
// All 28 cards: prefer the user's curated local WebP pack when its binaries exist.
// Master images live separately; the browser uses optimized 800x600 WebP.
const NATURAL_LUXURY_28=new Set([
 'env-garden','env-forest','env-lake','env-mountains','env-city','env-courtyard','env-nordic','env-coast','env-minimal','env-mist',
 'season-spring','season-summer','season-autumn','season-winter',
 'weather-clear','weather-cloud','weather-rain','weather-fog','weather-snow',
 'time-morning','time-day','time-golden','time-night',
 'plants-minimal','plants-decorative','plants-forest','plants-mediterranean','plants-tropical'
]);
const luxuryLocalAsset=path=>{
 const name=path.split('/').pop()?.replace(/\.jpg$/,'');
 return NATURAL_LUXURY_28.has(name)?'assets/thumbs/natural-luxury/'+name+'.webp?v=natural-luxury-28-20261109':null;
};
// Use selected unified imagery first. The old short-circuit returned stale local JPEGs.
// Keep embedded files as offline fallback and never rewrite user-uploaded pictures.
const asset = path => isPhotoPreset(path)
  ? (luxuryLocalAsset(path) || window.DOM_RENDER_UNIFIED_PRESETS?.[path] || window.DOM_RENDER_ASSETS?.[path] || naturePhoto(path) || HD_PRESETS[path] || path)
  : (window.DOM_RENDER_ASSETS?.[path] || window.DOM_RENDER_UNIFIED_PRESETS?.[path] || naturePhoto(path) || premiumPhoto(path) || HD_PRESETS[path] || path);
const environments = [['garden','Сад и газон','Ухоженный приватный сад, аккуратный газон и декоративные посадки.'],['forest','Хвойный лес','Высокие хвойные деревья на заднем плане, натуральный лесной рельеф.'],['lake','У озера','Естественная береговая линия и спокойное озеро на заднем плане, берег не перемещать между видами произвольно.'],['mountains','Горы','Дальний горный горизонт и каменистый рельеф.'],['city','Городской парк','Ландшафт современного городского парка без новых построек.'],['courtyard','Тихий парк','Приватный озеленённый участок с высокими деревьями.'],['nordic','Северный пейзаж','Сдержанная северная природа, камни, хвойники.'],['coast','У побережья','Прибрежная природа, дальняя горизонтальная линия моря.'],['minimal','Минимализм','Сдержанный ландшафт, гравий, небольшие деревья и злаки.'],['mist','Туманный лес','Мягкий дальний лесной пейзаж с атмосферной дымкой.']];
const choices = {
 time:[['morning','Утро','Мягкое низкое утреннее солнце'],['day','День','Естественный дневной свет'],['golden','Вечер','Тёплый золотой час'],['night','Ночь','Ночная съёмка, мягкий интерьерный свет']],
 weather:[['clear','Ясно','Чистое небо'],['cloud','Облачно','Плотная переменная облачность'],['rain','Дождь','Реалистичный дождь, влажные поверхности'],['fog','Туман','Низкий мягкий туман'],['snow','Снег','Снег, зимний свет']],
 season:[['spring','Весна','Молодая зелень, весенние цветущие растения'],['summer','Лето','Пышная зелёная листва'],['autumn','Осень','Осенняя листва и приглушённая палитра'],['winter','Зима','Безлиственные деревья, зимние фактуры']],
 plants:[['minimal','Минимальная','Редкие акцентные посадки и низкие злаки'],['decorative','Декоративная','Аккуратные кустарники и многолетники'],['forest','Лесная','Лесной подлесок, папоротники, кустарники'],['mediterranean','Средиземноморская','Оливы, лаванда, сухостойные злаки'],['tropical','Тропическая','Крупнолистные тропические растения']]
};
const zones = [['main','Стены фасада'],['accent','Декоративная отделка'],['base','Цоколь'],['roof','Кровля'],['windows','Оконные рамы'],['doors','Двери'],['terrace','Терраса'],['steps','Ступени'],['custom','Другой участок']];
const catalog = [['plaster','Штукатурка','mat-plaster.jpg'],['travertine','Травертин','mat-travertine.jpg'],['limestone','Природный камень','mat-limestone.jpg'],['wood','Дерево','mat-wood.jpg'],['brick','Клинкер','mat-brick.jpg'],['concrete','Бетон','mat-concrete.jpg'],['metal','Металл','mat-metal.jpg'],['ceramic','Керамогранит','mat-ceramic.jpg'],['glass','Стекло','mat-glass.jpg']];
const defaultSettings = ()=>({environment:'garden',time:'day',weather:'cloud',season:'summer',plants:'decorative',ratio:'16:9',quality:'high',quantity:'1',zone:'main',mats:{main:null,accent:null,base:null,roof:null,windows:null,doors:null,terrace:null,steps:null,custom:null},materialActions:{},materialColors:{},materialInstructions:{},textureScale:100,textureRotate:0,lockGeometry:true,preserveMaterials:true,keepReference:true,editSelectedOnly:false,homeChanges:'',batchDetail1X:60,batchDetail1Y:60,batchDetail2X:77,batchDetail2Y:40});
const makeProject=(name='Новый проект',isDemo=false)=>({id:isDemo?'demo':uuid(),name,createdAt:Date.now(),modifiedAt:Date.now(),demo:isDemo,settings:defaultSettings(),renders:[],activeRender:null,reference:null,sourceWidth:1672,sourceHeight:941,hasSource:isDemo,angle:1});
const STKEY='domrender_mvp_projects_v1', MTKEY='domrender_mvp_materials_v1';
let projects=[],project=null,customMaterials=[],currentTab='project',materialTab='mine',viewerMode=localStorage.getItem('domrender_view_mode')||'slider';
let sourceURL='',renderURL='',texturePreviewURL='',loadedMaskZone='',editing=false,tool='brush',lastPoint=null,polyPoints=[],drawActive=false,maskHistory=[],demoPhoto=ASSET+'residence-render-bluehour-fixed.webp?v=stable-20261109';
let maskVisible=false,wandPreviewMask=null,wandPreviewAdd=false,wandBusy=false;
let maskCanvas=document.createElement('canvas'),maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true}),toastTimer,rendering=false,uploadBusy=false,aiConnected=false,apiCheckError='';
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
/* Preserve uploaded pixels instead of downsizing all source drawings to 2000px
 * JPEG/0.88. Provider accepts PNG/JPEG/WebP up to 14 MB per reference. */
function pngDataFromFile(file,maxEdge=3800){return new Promise((resolve,reject)=>{
 if(!file)return reject(Error('Выберите изображение'));
 const type=file.type||(/\.png$/i.test(file.name)?'image/png':/\.webp$/i.test(file.name)?'image/webp':'image/jpeg');
 if(!['image/png','image/jpeg','image/webp'].includes(type))return reject(Error('Поддерживаются только PNG, JPG и WebP'));
 if(file.size>22*1024*1024)return reject(Error('Размер изображения должен быть до 22 МБ'));
 const maxBytes=12*1024*1024,url=URL.createObjectURL(file),im=new Image();let done=false;
 const finish=(err,val)=>{if(done)return;done=true;clearTimeout(timer);URL.revokeObjectURL(url);im.onload=im.onerror=null;err?reject(err):resolve(val)};
 const timer=setTimeout(()=>finish(Error('Загрузка изображения занимает слишком много времени')),60000);
 im.onerror=()=>finish(Error('Не удалось прочитать изображение'));
 im.onload=async()=>{
  try{
   const w=im.naturalWidth,h=im.naturalHeight;
   if(!w||!h)throw Error('Изображение повреждено');
   // Standard uploads are sent bit-for-bit, retaining genuine texture and
   // precise construction lines. Re-encode only larger-than-provider files.
   if(file.size<=maxBytes){
    const reader=new FileReader();
    reader.onerror=()=>finish(Error('Не удалось прочитать исходный файл.'));
    reader.onload=()=>finish(null,{data:String(reader.result),width:w,height:h});
    reader.readAsDataURL(file.type?file:new Blob([file],{type}));
    return;
   }
   const factor=Math.min(1,maxEdge/Math.max(w,h));
   const outW=Math.max(1,Math.round(w*factor)),outH=Math.max(1,Math.round(h*factor));
   const cn=document.createElement('canvas');cn.width=outW;cn.height=outH;
   const ctx=cn.getContext('2d');if(!ctx)throw Error('Недостаточно памяти');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.fillStyle='#fff';ctx.fillRect(0,0,outW,outH);
   ctx.drawImage(im,0,0,outW,outH);
   let data=cn.toDataURL('image/jpeg',.97);
   if(data.length>Math.ceil(maxBytes*4/3)+60)data=cn.toDataURL('image/jpeg',.93);
   if(data.length>Math.ceil(maxBytes*4/3)+60)data=cn.toDataURL('image/jpeg',.88);
   cn.width=cn.height=1;
   if(data.length>Math.ceil(maxBytes*4/3)+60)throw Error('Изображение слишком сложное для обработки. Сохраните исходник в PNG/JPEG до 12 МБ.');
   finish(null,{data,width:outW,height:outH});
  }catch(e){finish(Error(e.message||'Не удалось подготовить изображение'))}
 };
 im.src=url;
})}
async function imageFrom(url){return new Promise((resolve,reject)=>{const im=new Image;im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Не удалось загрузить текстуру'));im.src=url})}
function setupMaskSize(){let w=1200,h=Math.round(1200*(project.sourceHeight||941)/(project.sourceWidth||1672));h=Math.max(300,Math.min(1750,h));maskCanvas.width=w;maskCanvas.height=h;maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});$('maskOverlay').width=w;$('maskOverlay').height=h;$('materialPreview').width=w;$('materialPreview').height=h;$('polyOverlay').setAttribute('viewBox',`0 0 ${w} ${h}`)}
function updateStageAspect(){const w=project.demo?2048:(project.sourceWidth||1672),h=project.demo?1143:(project.sourceHeight||941);$('stage').style.aspectRatio=`${w}/${h}`;setupMaskSize()}
async function getMaskForZone(zone=current().zone){return getMedia(mediaKey('mask_'+zone))}
async function loadMask(zone=current().zone){cancelWandPreview();loadedMaskZone=zone;maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);const data=await getMaskForZone(zone);if(data){try{const im=await imageFrom(data);maskCtx.drawImage(im,0,0,maskCanvas.width,maskCanvas.height)}catch{}}maskHistory=[];polyPoints=[];paintMaskOverlay();updateUndoControls()}
function selectedMaskPixels(){const px=maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height).data;let count=0;for(let i=3;i<px.length;i+=4)if(px[i]>80)count++;return count}
async function persistMask(){const url=maskCanvas.toDataURL('image/png');await setMedia(mediaKey('mask_'+current().zone),url);save()}
function updateSelectionStatus(){
 const el=$('selectionStatus');if(!el||!maskCanvas.width||!maskCanvas.height)return;
 const pixels=selectedMaskPixels(),percent=pixels/(maskCanvas.width*maskCanvas.height)*100;
 const msg=pixels?('Выделено '+percent.toFixed(1)+'% кадра · '+(percent>45?'проверьте границы':'можно уточнить кистью')):'Область ещё не выделена';
 el.textContent=msg;el.classList.toggle('selection-warn',percent>45);
 const simple=$('simpleMaskStatus');
 if(simple){simple.textContent=msg;simple.classList.toggle('selection-warn',percent>45)}
 if($('simpleApplyTexture')&&current().mats?.custom)$('simpleApplyTexture').disabled=!pixels||!customMaterials.some(m=>m.id===current().mats.custom);
}
function paintMaskOverlay(){updateSelectionStatus();const cn=$('maskOverlay'),ctx=cn.getContext('2d');ctx.clearRect(0,0,cn.width,cn.height);if(!editing&&!maskVisible)return;const data=maskCtx.getImageData(0,0,maskCanvas.width,maskCanvas.height),out=ctx.createImageData(cn.width,cn.height);if(!wandPreviewMask||wandPreviewAdd){for(let i=0;i<data.data.length;i+=4){const a=data.data[i+3];if(a>0){out.data[i]=177;out.data[i+1]=100;out.data[i+2]=60;out.data[i+3]=Math.min(120,a*.48)}}}if(wandPreviewMask){for(let p=0;p<wandPreviewMask.length;p++)if(wandPreviewMask[p]){const k=p*4;out.data[k]=23;out.data[k+1]=204;out.data[k+2]=144;out.data[k+3]=174}}ctx.putImageData(out,0,0);drawPolygonGuide()}
function drawPolygonGuide(){const svg=$('polyOverlay');if(!editing||tool!=='polygon'||!polyPoints.length){svg.innerHTML='';return}const pts=polyPoints.map(p=>`${p.x},${p.y}`).join(' ');svg.innerHTML=`<polyline points="${pts}"/>`+polyPoints.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4"/>`).join('')}
function updateUndoControls(){
 const canUndo=maskHistory.length>0||polyPoints.length>0;
 for(const id of ['undoMask','undoWandFloating']){
  const button=$(id);if(button)button.disabled=!canUndo;
 }
}
function stashHistory(){maskHistory.push(maskCanvas.toDataURL('image/png'));if(maskHistory.length>32)maskHistory.shift();updateUndoControls()}
async function undoMask(){
 if(wandBusy){toast('Дождитесь завершения выделения');return}
 cancelWandPreview();
 if(polyPoints.length){polyPoints.pop();drawPolygonGuide();updateUndoControls();return}
 const prev=maskHistory.pop();
 if(!prev){toast('Больше нечего отменять');updateUndoControls();return}
 const im=await imageFrom(prev);
 maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
 maskCtx.drawImage(im,0,0,maskCanvas.width,maskCanvas.height);
 paintMaskOverlay();await persistMask();updateUndoControls();
 toast('Последний клик отменён');
}
function makeDemoMask(zone){if(!project.demo){toast('На своём проекте выделите нужную область кистью или полигоном');return}const w=maskCanvas.width,h=maskCanvas.height;const shapes={main:[[.05,.31],[.17,.07],[.57,.17],[.61,.42],[.49,.41],[.47,.52],[.16,.48],[.07,.56]],accent:[[.48,.43],[.61,.35],[.97,.46],[.96,.75],[.56,.75],[.47,.65]],base:[[.07,.75],[.94,.75],[.95,.86],[.07,.85]],roof:[[.03,.28],[.18,.045],[.89,.27],[.93,.32],[.17,.10],[.07,.35]],custom:[]};const shape=shapes[zone]||[];maskCtx.clearRect(0,0,w,h);if(shape.length){maskCtx.beginPath();shape.forEach(([x,y],i)=>i?maskCtx.lineTo(x*w,y*h):maskCtx.moveTo(x*w,y*h));maskCtx.closePath();maskCtx.fillStyle='#fff';maskCtx.fill()}paintMaskOverlay();persistMask();toast('Примерная зона выделена на демонстрационном доме. Уточните кистью.')}
function polygonDone(){if(polyPoints.length<3){toast('Для полигона нужно минимум три точки');return}stashHistory();maskCtx.beginPath();polyPoints.forEach((p,i)=>i?maskCtx.lineTo(p.x,p.y):maskCtx.moveTo(p.x,p.y));maskCtx.closePath();maskCtx.fillStyle='#fff';maskCtx.fill();polyPoints=[];paintMaskOverlay();persistMask()}
const ptFromEvent=e=>{const rect=$('maskOverlay').getBoundingClientRect();return {x:Math.max(0,Math.min(maskCanvas.width,(e.clientX-rect.left)/rect.width*maskCanvas.width)),y:Math.max(0,Math.min(maskCanvas.height,(e.clientY-rect.top)/rect.height*maskCanvas.height))}};
function stroke(a,b,eraser=false){maskCtx.save();maskCtx.globalCompositeOperation=eraser?'destination-out':'source-over';maskCtx.strokeStyle='#fff';maskCtx.fillStyle='#fff';maskCtx.lineWidth=Number($('brushSize').value)*2;maskCtx.lineCap='round';maskCtx.lineJoin='round';maskCtx.beginPath();maskCtx.moveTo(a.x,a.y);maskCtx.lineTo(b.x,b.y);maskCtx.stroke();maskCtx.restore();paintMaskOverlay()}
function initDrawEvents(){const cn=$('maskOverlay');cn.addEventListener('pointerdown',e=>{if(!editing)return;e.preventDefault();const pt=ptFromEvent(e);if(tool==='polygon'){polyPoints.push(pt);drawPolygonGuide();updateUndoControls();return}if(tool==='wand'){magicWandAt(pt,e.shiftKey);return}stashHistory();drawActive=true;lastPoint=pt;cn.setPointerCapture(e.pointerId);stroke(pt,pt,tool==='erase')});cn.addEventListener('pointermove',e=>{if(!drawActive||!editing)return;const pt=ptFromEvent(e);stroke(lastPoint,pt,tool==='erase');lastPoint=pt});async function finish(){if(!drawActive)return;drawActive=false;lastPoint=null;await persistMask()}cn.addEventListener('pointerup',finish);cn.addEventListener('pointercancel',finish);cn.addEventListener('dblclick',e=>{if(editing&&tool==='polygon'){e.preventDefault();polygonDone()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing){leaveEditor()}if(e.key==='Enter'&&editing&&tool==='polygon'){polygonDone()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&editing){e.preventDefault();undoMask()}})}
function enterEditor(){maskVisible=true;editing=true;current().editSelectedOnly=true;$('editSelectedOnly').checked=true;save();tool='wand';cancelWandPreview();if(renderURL&&viewerMode==='slider')setViewerMode('result');$('stage').classList.add('edit-mode');$('editorToolbar').hidden=false;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool===tool));$('stage').scrollIntoView({behavior:'smooth',block:'center'});paintMaskOverlay();toast('Волшебная палочка: нажмите на материал. Зелёная область — предварительная маска; нажмите «Применить», если границы верны.')}
async function leaveEditor(){cancelWandPreview();if(polyPoints.length>=3)polygonDone();editing=false;maskVisible=false;polyPoints=[];$('stage').classList.remove('edit-mode');$('editorToolbar').hidden=true;await persistMask();paintMaskOverlay()}
function updateSplit(value){const n=Math.max(0,Math.min(100,Number(value)||0));$('stage').style.setProperty('--split',`${n}%`);$('splitSlider').value=n}
function setRenderProgress(title,detail){const overlay=$('renderProgress');if(!overlay)return;$('renderProgressTitle').textContent=title;$('renderProgressDetail').textContent=detail;overlay.hidden=false;$('stage').classList.add('is-rendering');$('noRender').hidden=true;window.DOM_RENDER_PROGRESS?.update?.(title,detail)}
function stopRenderProgress(){const overlay=$('renderProgress');if(overlay&&!window.DOM_RENDER_PROGRESS?.stop?.())overlay.hidden=true;$('stage').classList.remove('is-rendering');setViewerMode(viewerMode)}
function setUploadBusy(busy){$('uploadBox').classList.toggle('is-uploading',busy);$('uploadBox').setAttribute('aria-busy',String(busy));$('uploadTitle').textContent=busy?'Загружаем изображение…':project.demo?'Загрузить свой скриншот':'Заменить скриншот проекта';$('projectUpload').disabled=busy;$('newAngleBtn').disabled=busy}
function bindTouchComparison(){const stage=$('stage');let dragging=false,pointerId=null;const move=e=>{const rect=stage.getBoundingClientRect();if(rect.width)updateSplit(Math.round((e.clientX-rect.left)*100/rect.width))};stage.addEventListener('pointerdown',e=>{if(viewerMode!=='slider'||editing||rendering||e.button>0)return;dragging=true;pointerId=e.pointerId;try{stage.setPointerCapture(pointerId)}catch{}move(e)});stage.addEventListener('pointermove',e=>{if(dragging&&e.pointerId===pointerId)move(e)});const stop=()=>{dragging=false;pointerId=null};stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);$('splitSlider').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))requestAnimationFrame(()=>updateSplit($('splitSlider').value))})}
function setViewerMode(mode){
 if(!['slider','side','result'].includes(mode))mode='slider';
 viewerMode=mode;
 try{localStorage.setItem('domrender_view_mode',mode)}catch{}
 const stage=$('stage');stage.dataset.viewMode=mode;
 const layer=$('materialPreview');if(layer){layer.style.clipPath=mode==='result'?'none':mode==='side'?'none':'';layer.style.visibility='visible';}
 document.querySelectorAll('[data-view-mode]').forEach(b=>{
   const selected=b.dataset.viewMode===mode;
   b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
 });
 $('resetSplit').hidden=mode!=='slider';
 $('splitSlider').hidden=mode!=='slider';
 const hasResult=!!renderURL;
 const hasLocalPreview=maskVisible||!!wandPreviewMask||$('resultTag')?.textContent?.includes('ПРИМЕРКА');
 $('noRender').hidden=hasResult||hasLocalPreview||(mode!=='result'&&mode!=='side')||rendering;
 if($('compareHint'))$('compareHint').hidden=hasResult||!!project.demo;
 stage.classList.toggle('is-pending',!hasResult);
}

/* Two clear studio modes: preset atmosphere or four editable scene settings. */
const SCENE_SETUP_FIELDS=['environment','season','weather','time'];
function renderFlowLabels(){
 if(!project||!$('renderSummaryLine'))return;
 const p=current(),values={
  environment:envLabel(),season:cLabel('season',p.season),weather:cLabel('weather',p.weather),
  time:cLabel('time',p.time),plants:cLabel('plants',p.plants)
 };
 for(const k of [...SCENE_SETUP_FIELDS,'plants']){
  const el=$('renderSettingValue-'+k);
  if(el)el.textContent=values[k];
 }
 $('renderAutoEnvironmentValue').textContent=values.environment;
 $('renderSummaryLine').textContent=[values.environment,values.season,values.weather,values.time].join(' · ');
 const locked=p.lockGeometry!==false&&p.preserveMaterials!==false;
 $('renderSummaryLock').classList.toggle('is-warning',!locked);
 $('renderSummaryLockText').textContent=locked?
   'Геометрия и материалы исходника сохраняются':
   'Защита геометрии или материалов отключена — проверьте параметры';
 $('renderSetupSourceNote').textContent=project.demo?
   'Демонстрационный проект. Для собственного рендера загрузите скриншот дома.':
   !project.hasSource?'Для генерации загрузите исходный скриншот дома.':
   'Обычная генерация · '+(Number(p.quantity)||1)+' кадр(ов). Пакетная визуализация · 4 кадра.';
}
function showRenderSetupMode(mode,persist=true){
 mode=mode==='manual'?'manual':'auto';
 const a=$('renderAutoPanel'),m=$('renderManualPanel');
 if(!a||!m)return;
 a.hidden=mode!=='auto';m.hidden=mode!=='manual';
 document.querySelectorAll('[data-render-mode]').forEach(b=>{
  const selected=b.dataset.renderMode===mode;
  b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
 });
 if(project&&persist&&current().renderSetupMode!==mode){current().renderSetupMode=mode;save()}
 renderFlowLabels();
 if(mode==='auto'){initMoodPhotos();syncDemoWithSettings()}
}
function openRenderPicker(key,scroll=false){
 if(!project)return;
 if(key&&!SCENE_SETUP_FIELDS.includes(key))return;
 showRenderSetupMode('manual');
 for(const name of SCENE_SETUP_FIELDS){
  const active=name===key;
  const button=document.querySelector('[data-render-open="'+name+'"]');
  const panel=$('renderChoicePanel-'+name);
  const parent=document.querySelector('[data-scene-choice="'+name+'"]');
  if(button)button.setAttribute('aria-expanded',String(active));
  if(panel)panel.hidden=!active;
  if(parent)parent.classList.toggle('is-open',active);
 }
 if(scroll&&key){
  const el=document.querySelector('[data-scene-choice="'+key+'"]');
  if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});
 }
 renderFlowLabels();
}
function showTab(tab,scroll=false){
 if(!['project','environment','materials','animation','variants','parameters'].includes(tab))tab='project';
 currentTab=tab;
 for(const b of document.querySelectorAll('[data-tab]')){const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))}
 for(const panel of document.querySelectorAll('.tab-panel'))panel.classList.toggle('active',panel.id===tab+'Panel');
 const copy={
  project:['Проект','Загрузка исходника, сравнение и доступ к проектам.'],
  environment:['Настройка сцены','Готовая атмосфера или четыре понятных настройки.'],
  materials:['Материалы','Выделите поверхность, загрузите фактуру или напишите запрос для AI.'],
  animation:['Архитектурная анимация','Кинокамеры, оптика, движение и цвет в одном месте.'],
  variants:['Варианты','Просмотр и управление сохранёнными результатами.'],
  parameters:['Настройки','Качество, формат и сохранение архитектуры.']
 };
 $('panelTitle').textContent=copy[tab][0];$('panelSubtitle').textContent=copy[tab][1];
 document.querySelectorAll('[data-mobile]').forEach(x=>x.classList.toggle('active',x.dataset.mobile===tab));
 document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===tab));
 if(tab!=='materials'&&editing)leaveEditor();
 if(tab==='materials'){
  current().zone='custom';
  current().materialActions={...current().materialActions,custom:'replace'};
  current().editSelectedOnly=true;
  renderZones();renderMaterials();
  loadMask('custom').then(()=>{updateSelectionStatus();updateSimpleMaterialsUI()}).catch(()=>{});
 }else {$('maskOverlay').getContext('2d').clearRect(0,0,$('maskOverlay').width,$('maskOverlay').height);resetColorPreview(true)}
 if(tab==='variants')renderVariantsPanel();
 if(tab==='animation'){
  renderAnimationPanel();
  window.DOM_RENDER_CAMERA_PATH?.mount($('animThreeLayer'));
  window.DOM_RENDER_CAMERA_PATH?.setMotion(animationSettings().motion);
 }else window.DOM_RENDER_CAMERA_PATH?.setVisible(false);
 if(tab==='environment'){showRenderSetupMode(current().renderSetupMode||'auto',false);syncDemoWithSettings()}
 if(scroll)$('inspector').scrollIntoView({behavior:'smooth',block:'start'});
}
function optionCards(group,arr,selected){return arr.map(([id,name])=>{
 const path=`${ASSET}thumbs/${group==='environment'?'env':group}-${id}.jpg`;
 // Always load the approved Natural Luxury image directly; do not let old HD images override it.
 const sharp=luxuryLocalAsset(path) || asset(path);
 const glyph = group==='time'?'sun':group==='weather'?'cloud':'tree';
 return `<button class="image-option preset-photo-card ${selected===id?'active':''}" data-choice-group="${group}" data-choice="${id}" aria-pressed="${selected===id}" title="${eHTML(name)}"><img src="${eHTML(sharp)}" data-asset-path="${eHTML(path)}" alt="${eHTML(name)}" loading="lazy" decoding="async"><span class="preset-card-icon" aria-hidden="true">${icon(glyph)}</span><span class="preset-card-label">${eHTML(name)}</span></button>`;
}).join('')}
function renderChoices(){const s=current();$('environmentOptions').innerHTML=optionCards('environment',environments,s.environment);for(let group of ['time','weather','season','plants'])$(group+'Options').innerHTML=optionCards(group,choices[group],s[group]);renderFlowLabels()}
function materialAction(zone=current().zone){return current().materialActions?.[zone]||'keep'}
function materialColor(zone=current().zone){const value=current().materialColors?.[zone];return /^#[0-9a-fA-F]{6}$/.test(value||'')?value:'#575c51'}
let materialPreviewRevision=0;
function materialInstruction(zone=current().zone){return String(current().materialInstructions?.[zone]||'').slice(0,500)}
function suggestedColorFromText(value){
 const text=String(value||'').toLowerCase();
 const roots=[[/ч[её]рн|black|антрацит/g,'#242424'],[/графит/g,'#303433'],[/бел|white/g,'#f5f5f2'],[/сер|grey|gray/g,'#919691'],[/корич|каштан|brown/g,'#79543c'],[/беж|песоч|sand/g,'#c9baa2'],[/т[её]мн[^\s]*\s*зел|оливк/g,'#455740'],[/зел|green/g,'#4a7852'],[/син|blue/g,'#365983'],[/красн|red/g,'#933d39']];
 const relevant=text.split(/сделать|перекрасить|покрасить|сменить цвет на|изменить цвет на/).slice(-1)[0]||text;
 const matches=[];
 for(const [re,hex] of roots){for(const m of relevant.matchAll(re))matches.push({index:m.index,color:hex})}
 matches.sort((a,b)=>a.index-b.index);
 return matches[0]?.color||null;
}
function resetColorPreview(silent=false){
 materialPreviewRevision++;
 const canvas=$('materialPreview');
 if(canvas)canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
 if($('materialColorPreviewStatus'))$('materialColorPreviewStatus').textContent='Цветовая примерка не активна';
 if($('resultTag'))$('resultTag').textContent=project?.demo?'ДЕМОНСТРАЦИЯ':renderURL?'AI-РЕЗУЛЬТАТ':'НЕТ РЕНДЕРА';
 if($('noRender'))$('noRender').hidden=!!renderURL;
 if(!silent)toast('Цветовая примерка скрыта. Исходник и AI-результат не менялись.');
}
async function previewSelectedColor(){
 if(editing)await leaveEditor();
 const revision=++materialPreviewRevision;
 if(materialAction()!=='color')return;
 if(!window.DOM_RENDER_MATERIAL_PREVIEW){toast('Модуль примерки не загрузился');return}
 if(!selectedMaskPixels()){
  $('materialColorPreviewStatus').textContent='Для точной примерки сначала подтвердите найденную область или выделите её на изображении.';
  return;
 }
 try{
  const src=renderURL||sourceURL,im=await imageFrom(src);
  if(revision!==materialPreviewRevision)return;
  const w=maskCanvas.width,h=maskCanvas.height,base=document.createElement('canvas');
  base.width=w;base.height=h;const bc=base.getContext('2d',{willReadFrequently:true});
  bc.drawImage(im,0,0,w,h);
  const candidate=window.DOM_RENDER_MATERIAL_PREVIEW.recolor(bc.getImageData(0,0,w,h),maskCtx.getImageData(0,0,w,h),materialColor());
  if(revision!==materialPreviewRevision)return;
  if(!candidate.count){$('materialColorPreviewStatus').textContent='Пустая маска: уточните область';return}
  const c=$('materialPreview'),ctx=c.getContext('2d');
  ctx.clearRect(0,0,w,h);ctx.putImageData(new ImageData(candidate.data,w,h),0,0);
  maskVisible=false;paintMaskOverlay();
  $('resultTag').textContent='ПРИМЕРКА ЦВЕТА · БЕЗ AI';
  $('noRender').hidden=true;setViewerMode('result');
  $('materialColorPreviewStatus').textContent='Предварительный цвет '+materialColor().toUpperCase()+' на '+zoneLabel().toLowerCase()+'. Это только локальная примерка, не AI.';
 }catch(e){
  if(revision===materialPreviewRevision)$('materialColorPreviewStatus').textContent='Примерка не удалась: '+(e.message||'ошибка');
 }
}
async function proposeMaterialZone(){
 if(!project?.hasSource){toast('Сначала загрузите проект');return false}
 if(!window.DOM_RENDER_MATERIAL_PREVIEW){toast('Модуль анализа не загрузился');return false}
 try{
  const src=renderURL||sourceURL,im=await imageFrom(src);
  const w=maskCanvas.width,h=maskCanvas.height;
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,w,h);
  const result=window.DOM_RENDER_MATERIAL_PREVIEW.guess(ctx.getImageData(0,0,w,h),current().zone);
  if(!result){$('materialFindStatus').textContent='Надёжно определить этот элемент по цвету не удалось. Уточните его «Волшебной палочкой» или введите задание для AI без маски.';return false}
  wandPreviewMask=result.mask;wandPreviewAdd=false;
  $('materialFindReview').hidden=false;
  $('materialFindStatus').textContent='Зелёным показана ПРЕДПОЛАГАЕМАЯ область ('+(result.coverage*100).toFixed(1)+'% кадра). Это не распознавание AI: проверьте окна, стёкла, стыки и соседние материалы перед подтверждением.';
  maskVisible=true;paintMaskOverlay();
  if($('materialPreview'))$('materialPreview').getContext('2d').clearRect(0,0,w,h);
  $('noRender').hidden=true;setViewerMode('result');
  return true;
 }catch(e){$('materialFindStatus').textContent='Не удалось найти зону: '+(e.message||'ошибка');return false}
}
async function applyMaterialZoneSuggestion(){
 if(!wandPreviewMask)return;
 await applyWandPreview();
 $('materialFindReview').hidden=true;
 if(materialAction()==='color')await previewSelectedColor();
}
async function selectMaterialElement(id,action=null){
 if(!zones.some(([z])=>z===id))return;
 resetColorPreview(true);
 current().zone=id;
 if(action){
  current().materialActions={...current().materialActions,[id]:action};
  current().editSelectedOnly=action!=='keep';
 }
 renderZones();renderMaterials();renderFooter();save();
 await loadMask();
 if(materialAction()==='color'){
  if(selectedMaskPixels())await previewSelectedColor();
  else await proposeMaterialZone();
 }else if(materialAction()==='replace'&&!selectedMaskPixels()){
  await proposeMaterialZone();
 }
}
function renderMaterialAction(){
 const act=materialAction(),name=zoneLabel();
 document.querySelectorAll('[data-material-action]').forEach(b=>{const active=b.dataset.materialAction===act;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('materialKeepPane').hidden=act!=='keep';
 $('materialEditPane').hidden=act==='keep';
 $('materialColorPane').hidden=act!=='color';
 $('materialReplacePane').hidden=act!=='replace';
 $('editSelectedOnly').checked=act!=='keep'&&current().editSelectedOnly!==false;
 $('materialColor').value=materialColor();
 $('materialColorHex').value=materialColor().toUpperCase();
 document.querySelectorAll('[data-quick-zone]').forEach(button=>{const active=button.dataset.quickZone===current().zone&&act==='color';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
 if($('materialInstruction').value!==materialInstruction())$('materialInstruction').value=materialInstruction();
 document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('active',b.dataset.color.toLowerCase()===materialColor().toLowerCase());b.setAttribute('aria-pressed',String(b.dataset.color.toLowerCase()===materialColor().toLowerCase()))});
 $('materialActionInfo').textContent=act==='keep'?name+': сохраняем исходный материал и улучшаем только реализм.':act==='color'?name+': задайте желаемый оттенок или опишите изменение словами. Тип покрытия сохраняется.':name+': загрузите новую фактуру или опишите материал словами. Изменение относится только к этому элементу.';
}
function renderZones(){
 const s=current();
 const glyphs={main:'▤',accent:'▧',base:'▥',roof:'⌂',windows:'▦',doors:'▯',terrace:'▱',steps:'≡',custom:'✦'};
 $('zoneOptions').innerHTML=zones.map(([id,name])=>{
  const chosen=customMaterials.find(m=>m.id===s.mats?.[id]);
  const act=s.materialActions?.[id]||'keep';
  const desc=act==='color'?'Цвет '+materialColor(id).toUpperCase():act==='replace'?(chosen?chosen.name:'Новая фактура'):'Исходный материал';
  return `<button type="button" class="zone-option material-zone-card ${s.zone===id?'active':''}" data-zone="${id}" aria-pressed="${s.zone===id}" title="${eHTML(name)}"><span class="zone-icon material-zone-icon" aria-hidden="true">${glyphs[id]}</span><span><b>${eHTML(name)}</b><small>${eHTML(desc)}</small></span>${s.zone===id?icon('check'):''}</button>`
 }).join('');
 renderMaterialAction();
}
function updateSimpleMaterialsUI(){
 if(!project||!$('materialSimple'))return;
 const selected=current().mats?.custom;
 const currentMaterial=customMaterials.find(m=>m.id===selected);
 const grid=$('simpleMaterialGrid');
 grid.innerHTML=customMaterials.map(m=>{
  const preview=matById(m.id);
  return '<button type="button" class="material-simple-item '+(m.id===selected?'active':'')+'" data-simple-material="'+eHTML(m.id)+'" aria-pressed="'+(m.id===selected)+'"><img src="'+eHTML(preview.img)+'" alt="Фактура '+eHTML(m.name)+'" loading="lazy"><span>'+eHTML(m.name)+'</span></button>';
 }).join('');
 $('simpleMaterialStatus').textContent=currentMaterial?'Выбрана фактура: '+currentMaterial.name:'Материал пока не загружен. Можно применить изменение через текст.';
 const text=materialInstruction('custom');
 if($('simpleMaterialPrompt').value!==text)$('simpleMaterialPrompt').value=text;
 const masked=maskCanvas.width&&maskCanvas.height&&selectedMaskPixels()>0;
 $('simpleApplyTexture').disabled=!(currentMaterial&&masked);
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
 updateSimpleMaterialsUI();
}
function renderFooter(){const s=current();$('projectPanelName').textContent=project.name;$('projectPanelMeta').textContent=(project.demo?'Демонстрационная модель':'Ракурс '+(project.angle||1))+' · '+(project.sourceWidth||1672)+'×'+(project.sourceHeight||941);$('projectPanelStatus').textContent=project.demo?'Демонстрация · AI-фото не генерировалось':(project.renders.length?project.renders.length+' сохранённых AI-результатов':'Исходник загружен · AI-результатов пока нет');$('summaryLine').textContent=`${envLabel()} · ${cLabel('season',s.season)} · ${cLabel('time',s.time)}`;$('summaryMaterial').textContent=`${customMaterials.some(m=>m.id===s.mats[s.zone])?matById(s.mats[s.zone]).name:(s.preserveMaterials!==false?'Материалы исходника':'Материал не выбран')} · ${zoneLabel().toLowerCase()}`;$('stageSubtitle').textContent=$('summaryLine').textContent;$('stageTitle').textContent=project.name;$('canvasProjectLabel').textContent=project.name;$('breadcrumbName').textContent=project.name;$('stageRatio').textContent=s.ratio;$('ratioSelect').value=s.ratio;$('qualitySelect').value=s.quality;$('quantitySelect').value=s.quantity;$('lockGeometry').checked=s.lockGeometry;$('preserveMaterials').checked=s.preserveMaterials!==false;$('keepReference').checked=s.keepReference;if($('angleLandscapeLock'))$('angleLandscapeLock').checked=s.keepReference;$('editSelectedOnly').checked=!!s.editSelectedOnly;renderFlowLabels()}
/* Cinematic equipment and optical preview are local UI simulations, not billed video. */
/* Individual 1K images are faithfully cropped from the user's approved 6x4 cinema atlas.
   Each tile is 160x120 in the reference; upscale to 1024x768 without inventing new visuals. */
const animationArtCache=new Map();
const cinema1KOrder={
 camera:['alexa35','alexamini','venice2','vraptor','komodox','ursa'],
 lens:['ultra14','shift24','cine35','cine50','portrait85','macro100'],
 motion:['orbit','dolly','drone','slider','crane','walk'],
 grade:['neutral','filmic','contrast','warm','cool','bw']
};
let cinema1KLoading=false;
function loadCinema1K(){
 if(cinema1KLoading)return;
 cinema1KLoading=true;
 const atlas=new Image();
 atlas.onload=()=>{
  try{
   for(const [row,kind] of ['camera','lens','motion','grade'].entries()){
    for(const [col,id] of cinema1KOrder[kind].entries()){
     const canvas=document.createElement('canvas');
     canvas.width=1024;canvas.height=768;
     const ctx=canvas.getContext('2d',{alpha:false});
     ctx.imageSmoothingEnabled=true;
     ctx.imageSmoothingQuality='high';
     ctx.drawImage(atlas,col*160,row*120,160,120,0,0,1024,768);
     const url=canvas.toDataURL('image/webp',.94);
     const key=kind+':'+id;
     animationArtCache.set(key,url);
     document.querySelectorAll('#animationPanel [data-anim-kind] ').forEach(card=>{
      if(card.dataset.animKind===kind && card.dataset.animId===id){
       const img=card.querySelector('.anim-option-photo img');
       if(img){img.src=url;img.style.filter='none';}
      }
     });
    }
   }
  }catch(err){console.warn('Cinema 1K atlas enhancement unavailable',err)}
 };
 atlas.onerror=()=>console.warn('Cinema atlas did not load; showing SVG fallback');
 atlas.src='assets/cinema/forma-cinema-atlas.webp?v=approved-cinema-1k-20261110';
}
function animationArt(kind,id){
 const folders={camera:'cameras',lens:'lenses',motion:'motions',grade:'grades'};
 if(!folders[kind]||!/^[a-z0-9]+$/.test(id))return '';
 if(!cinema1KLoading)loadCinema1K();
 const key=kind+':'+id;
 return animationArtCache.get(key)||('assets/cinema/'+folders[kind]+'/'+id+'.svg?v=cinema-svg-fallback');
}
function animationSettings(){
 const lib=window.DOM_RENDER_ANIMATION;
 return lib.normalize(current().cinema||{});
}
function animationColorFilter(id){
 return {neutral:'none',filmic:'brightness(1.04) contrast(.91) saturate(.94)',contrast:'brightness(1.05) contrast(.88) saturate(.95)',warm:'contrast(1.10) saturate(1.10)',cool:'brightness(.64) contrast(1.03)',bw:'contrast(.97) saturate(.89)'}[id]||'none';
}
const ANIM_DEMO_HOUSE='assets/Современный дом с бассейном.png';
const ANIM_LENS_SETTINGS={
 ultra14:[18,1.04],shift17:[17,1.07],shift24:[25,1.16],cine24:[24,1.16],
 cine35:[35,1.29],cine50:[47,1.42],portrait85:[75,1.64],
 macro100:[95,1.80],tele135:[135,2.07],ana40:[40,1.34]
};
const ANIM_MOVEMENT_PATHS={
 dolly:['M18 45 L206 11',18,45,206,11],
 orbit:['M28 35 Q112 -8 198 35',28,35,198,35],
 slider:['M18 28 L205 28',18,28,205,28],
 crane:['M110 50 L110 5',110,50,110,5],
 drone:['M206 11 L18 45',206,11,18,45],
 walk:['M18 43 Q90 39 203 9',18,43,203,9],
 tilt:['M110 50 Q155 25 110 5',110,50,110,5],
 macro:['M30 34 L192 21',30,34,192,21]
};
function animationMotionGraphic(id){
 const row=ANIM_MOVEMENT_PATHS[id]||ANIM_MOVEMENT_PATHS.dolly;
 return '<span class="anim-motion-photo-overlay" aria-hidden="true"><svg viewBox="0 0 220 55"><path d="'+row[0]+'" fill="none" stroke="#d7ffe3" stroke-width="4" stroke-linecap="round" stroke-dasharray="11 7"/><circle cx="'+row[1]+'" cy="'+row[2]+'" r="6" fill="#f5fff5"/><circle cx="'+row[3]+'" cy="'+row[4]+'" r="7" fill="#66e49a"/></svg></span>';
}
function renderAnimationCards(containerId,field,items,kind,value){
 const holder=$(containerId);
 if(!holder)return;
 holder.innerHTML=items.map(item=>{
  const realPhoto=false;
  const source=animationArt(kind,item.id);
  const filter='';
  return `<button type="button" class="anim-option-card ${item.id===value?'active':''}" data-anim-kind="${eHTML(field)}" data-anim-id="${eHTML(item.id)}" aria-pressed="${item.id===value}">
 <span class="anim-option-photo ${realPhoto?'anim-photo-real':''}"><img src="${source}" alt="${eHTML(item.name)} — изображение пресета" loading="lazy" decoding="async"${filter}><span class="anim-option-check" aria-hidden="true">✓</span></span>
 <span class="anim-option-copy"><strong>${eHTML(item.name)}</strong><em>${eHTML(item.tag||'')}</em><small>${eHTML(item.desc||'')}</small></span></button>`;
 }).join('');
}
function updateAnimationTrajectory(motion){
 const row=ANIM_MOVEMENT_PATHS[motion]||ANIM_MOVEMENT_PATHS.dolly;
 $('animPath').setAttribute('d',row[0]);
 $('animPathStart').setAttribute('cx',row[1]);$('animPathStart').setAttribute('cy',row[2]);
 $('animPathEnd').setAttribute('cx',row[3]);$('animPathEnd').setAttribute('cy',row[4]);
}
function renderAnimationSummary(){
 if(!$('animSummary')||!project||!window.DOM_RENDER_ANIMATION)return;
 const lib=window.DOM_RENDER_ANIMATION,s=animationSettings();
 const c=lib.cameras.find(v=>v.id===s.camera)||lib.cameras[0],
       l=lib.lenses.find(v=>v.id===s.lens)||lib.lenses[0],
       m=lib.moves.find(v=>v.id===s.motion)||lib.moves[0],
       g=lib.grades.find(v=>v.id===s.grade)||lib.grades[0];
 $('animSummary').textContent=c.name+' · '+l.name+' · '+m.name;
 $('animSummaryDetail').textContent=s.duration+' секунд · '+s.fps+' fps · '+s.ratio+' · '+g.name;
 $('animPreviewDuration').textContent=s.duration+' с · '+s.fps+' fps';
 $('animHUDCamera').textContent=c.name;
 $('animHUDLens').textContent=l.name;
 $('animHUDMotion').textContent=m.name;
 $('animPreviewScreen').dataset.motion=s.motion;
 $('animPreviewScreen').dataset.ratio=s.ratio;
 $('animPreviewImage').style.filter=animationColorFilter(s.grade);
 const [mm,zoom]=ANIM_LENS_SETTINGS[s.lens]||ANIM_LENS_SETTINGS.shift24;
 const fov=s.lens==='ana40'?Math.round(2*Math.atan(36/(2*20))*180/Math.PI):
   Math.round(2*Math.atan(36/(2*mm))*180/Math.PI);
 $('animFocalLabel').textContent=mm+' мм';
 $('animFovLabel').textContent='≈'+fov+'°';
 const preview=$('animPreviewFrame');
 const motion=s.motion;
 const diff={dolly:[0,0,1.08],orbit:[-1.8,.2,1.03],slider:[-2.6,0,1],crane:[0,2.4,1.02],drone:[0,0,.94],walk:[3,-1,1.04],tilt:[0,2.5,1],macro:[-2,0,1.075]}[motion]||[0,0,1.06];
 const intensity=s.intensity==='moderate'?1.5:1;
 preview.style.setProperty('--anim-start-scale',String(zoom));
 preview.style.setProperty('--anim-end-scale',String(+(zoom*diff[2]).toFixed(4)));
 preview.style.setProperty('--anim-end-x',(diff[0]*intensity)+'%');
 preview.style.setProperty('--anim-end-y',(diff[1]*intensity)+'%');
 preview.style.transform='scale('+zoom+')';
 updateAnimationTrajectory(motion);
 window.DOM_RENDER_CAMERA_PATH?.setMotion(motion);
}
function renderAnimationPanel(){
 const lib=window.DOM_RENDER_ANIMATION;
 if(!lib||!project||!$('animCameras'))return;
 const s=animationSettings();
 renderAnimationCards('animCameras','camera',lib.cameras,'camera',s.camera);
 renderAnimationCards('animLenses','lens',lib.lenses,'lens',s.lens);
 renderAnimationCards('animMoves','motion',lib.moves,'motion',s.motion);
 renderAnimationCards('animGrades','grade',lib.grades,'grade',s.grade);
 for(const [id,field] of [['animDuration','duration'],['animFPS','fps'],['animRatio','ratio'],['animIntensity','intensity']])$(id).value=String(s[field]);
 if($('animExtra').value!==s.promptExtra)$('animExtra').value=s.promptExtra;
 // The animation preview must show exactly the current project's selected AFTER image.
 // No unrelated sample house may replace a source or a completed AI render.
 const preview=renderURL
   ?{src:renderURL,label:project.demo?'Демо-проект · вариант после':'Мой проект · вариант после'}
   :project.hasSource&&sourceURL
     ?{src:sourceURL,label:'Мой проект · исходное изображение'}
     :{src:demoPhoto,label:'Демо-проект · вариант после'};
 const previewImg=$('animPreviewImage');
 if(previewImg.getAttribute('src')!==preview.src)previewImg.src=preview.src;
 $('animPreviewState').textContent=preview.label;
 document.querySelectorAll('[data-anim-source]').forEach(el=>{
  const active=el.dataset.animSource==='project';
  el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));
 });
 renderAnimationSummary();
 window.DOM_RENDER_HOUSE_PREVIEW?.sync?.();
}
function updateAnimationSetting(field,value,rerender=true){
 if(!project||!window.DOM_RENDER_ANIMATION)return;
 current().cinema=window.DOM_RENDER_ANIMATION.normalize({...animationSettings(),[field]:value});
 save();
 if(rerender)renderAnimationPanel();else renderAnimationSummary();
}
function playAnimationPreview(){
 if(!project)return;
 const frame=$('animPreviewFrame'),s=animationSettings();
 frame.classList.remove('is-playing');
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  $('animPreviewState').textContent='Анимация отключена настройками устройства';
  return;
 }
 frame.style.setProperty('--anim-preview-seconds',String(s.duration)+'s');
 void frame.offsetWidth;
 frame.classList.add('is-playing');
 window.DOM_RENDER_CAMERA_PATH?.play(s.duration);
 $('animPreviewState').textContent='3D-камера и светящаяся траектория · '+s.duration+' с';
}
const SCENE_VARIANT_OPTIONS={
 evening:'Синий час · свет',
 autumn_overcast:'Осень · рассеянный свет',
 autumn_sunny:'Осень · тёплое солнце',
 autumn_evening:'Осень · синий час',
 winter_overcast:'Зима · мягкий свет',
 winter_sunny:'Зима · ясный день',
 winter_evening:'Зима · синий час'
};
function renderHomeChanges(){
 const input=$('homeChangesInput');
 if(input&&document.activeElement!==input){
  const value=String(current()?.homeChanges||'');
  if(input.value!==value)input.value=value;
 }
 const specified=!!String(current()?.homeChanges||'').trim();
 if($('renderSummaryLockText'))$('renderSummaryLockText').textContent=specified
  ?'Геометрия сохраняется; отделка меняется по вашему заданию'
  :'Архитектура и материалы исходника сохраняются';
 if($('renderSetupSourceNote'))$('renderSetupSourceNote').textContent=specified
  ?'AI использует текстовое задание только для указанных элементов дома. Архитектура и ракурс сохраняются.'
  :'Используется выбранный проект. AI сохраняет архитектуру и существующие материалы.';
}
function renderSceneVariantsUI(){
 const panel=$('sceneVariantsPanel');
 if(!panel)return;
 const hasApprovedRender=!!(project&&!project.demo&&renderURL&&project.activeRender&&project.renders?.some(r=>r.id===project.activeRender));
 panel.hidden=!hasApprovedRender;
 panel.querySelectorAll('[data-scene-variant]').forEach(button=>button.disabled=rendering);
}
async function generateSceneVariant(variantId){
 const label=SCENE_VARIANT_OPTIONS[variantId];
 if(!label){toast('Такой вариант не найден');return}
 if(rendering){toast('Дождитесь завершения текущей генерации');return}
 if(!project||project.demo||!project.activeRender||!project.renders.some(x=>x.id===project.activeRender)||!renderURL){
  toast('Сначала создайте и выберите готовую AI-визуализацию дома.');
  return;
 }
 const sourceRender=project.activeRender;
 const targetProject=project;
 if(!aiConnected){
  await checkAPI(30000);
  if(!aiConnected){toast(apiCheckError||'AI Market сейчас недоступен.');return}
 }
 rendering=true;renderSceneVariantsUI();
 const status=$('sceneVariantsStatus');
 if(status){status.classList.remove('is-error');status.textContent='Создаём «'+label+'» из выбранного изображения…'}
 setRenderProgress('Создаём '+label,'Используем выбранный готовый рендер, сохраняем архитектуру и ракурс');
 $('generateBtn').disabled=true;$('renderSetupGenerate').disabled=true;
 try{
  const base=renderURL;
  const image=await urlToDataURL(base);
  const payload={image,sceneVariation:variantId,quantity:1,quality:current().quality,
   size:imageSizeForRatio(current().ratio),brief:{lockGeometry:true,preserveMaterials:true,project:project.name}};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),180000);
  let response;
  try{
   response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),signal:controller.signal});
  }finally{clearTimeout(timer)}
  const data=await response.json().catch(()=>({error:'Сервер вернул некорректный ответ'}));
  if(!response.ok||!Array.isArray(data.images)||!data.images.length){
   throw new Error(data.error||'AI не вернул изображение');
  }
  if(project!==targetProject)throw new Error('Во время создания варианта изменился проект');
  setRenderProgress('Сохраняем вариант','AI прислал изображение — сохраняем результат в проекте');
  const id='r'+uuid().slice(0,8);
  const result='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
  await setMedia(mediaKey('render_'+id),result);
  await setMedia(mediaKey('input_'+id),base);
  project.renders.push({id,number:project.renders.length+1,createdAt:Date.now(),batchLabel:label,sceneVariant:variantId,derivedFrom:sourceRender});
  project.activeRender=id;renderURL=result;
  save();
  await loadProject(project.id);
  setViewerMode('result');
  window.DOM_RENDER_PROGRESS?.complete?.();
  if(status){status.classList.remove('is-error');status.textContent='Вариант «'+label+'» готов и сохранён в истории.'}
  toast('Готово: '+label+'. Новая версия сохранена отдельно.');
 }catch(error){
  const message=error?.name==='AbortError'?'Превышено время ожидания. Запрос мог быть списан у провайдера.':String(error?.message||'Ошибка генерации');
  if(status){status.classList.add('is-error');status.textContent='Не удалось создать вариант: '+message}
  toast(message);
 }finally{
  rendering=false;
  stopRenderProgress();
  $('generateBtn').disabled=false;$('renderSetupGenerate').disabled=false;
  renderSceneVariantsUI();
 }
}
function renderAll(){renderChoices();renderZones();renderMaterials();renderFooter();renderHomeChanges();renderResults();renderVariantsPanel();renderSceneVariantsUI();renderAnimationPanel();updateStageAspect();updateSplit(36);setViewerMode(viewerMode);showTab(currentTab)}
function renderResults(){const items=[{id:'source',label:'Исходник',src:sourceURL||asset(ASSET+'residence-model-v32.webp')}];if(project.demo)items.push({id:'demo',label:'Пример фото',src:demoPhoto});for(const r of project.renders)items.push({id:r.id,label:r.batchLabel||`Рендер ${r.number||''}`,src:imageCache.get(mediaKey('render_'+r.id))||asset(ASSET+'residence-render.jpg')});$('resultsStrip').innerHTML=items.map(r=>`<button class="result-thumb ${((project.activeRender|| (project.demo?'demo':'source'))===r.id)?'active':''}" data-result="${r.id}"><img src="${eHTML(r.src)}" alt="${eHTML(r.label)}"><span>${eHTML(r.label)}</span></button>`).join('');$('resultsHint').textContent=project.demo?'Пример результата · AI-фото не генерировалось':(project.renders.length?`${project.renders.length} AI-результатов`:'Рендеров пока нет')}
function renderVariantsPanel(){
 if(!project||!$('variantHistory'))return;
 const items=[{id:'source',label:'Исходное изображение',src:sourceURL||asset(ASSET+'residence-model-v32.webp'),kind:'source'}];
 if(project.demo)items.push({id:'demo',label:'Демонстрация · синий час',src:demoPhoto,kind:'demo'});
 for(const r of project.renders)items.push({id:r.id,label:r.batchLabel||'AI-рендер '+(r.number||''),src:imageCache.get(mediaKey('render_'+r.id))||asset(ASSET+'residence-render.jpg'),kind:'render'});
 const active=project.activeRender||(project.demo?'demo':'source');
 $('variantHistory').innerHTML=items.map(x=>`<div class="variant-entry ${active===x.id?'is-active':''}">
   <button type="button" class="variant-picture" data-variant-open="${eHTML(x.id)}" aria-label="Открыть ${eHTML(x.label)}"><img src="${eHTML(x.src)}" alt="${eHTML(x.label)}" loading="lazy"><span>${eHTML(x.label)}</span></button>
   <div class="variant-entry-actions">
   <button type="button" class="btn btn-quiet btn-sm" data-variant-open="${eHTML(x.id)}">Открыть</button>
   ${x.kind!=='source'?'<button type="button" class="btn btn-quiet btn-sm" data-variant-ref="'+eHTML(x.id)+'">В референс</button>':''}
   ${x.kind==='render'?'<button type="button" class="btn btn-quiet btn-sm variant-danger" data-variant-delete="'+eHTML(x.id)+'">Удалить</button>':''}
   </div></div>`).join('');
}
async function makeVariantReference(id){
 const url=id==='demo'?demoPhoto:await getMedia(mediaKey('render_'+id));
 if(!url){toast('Не удалось открыть изображение для референса');return}
 await setMedia(mediaKey('ref'),url);project.reference='ref';current().keepReference=true;save();renderFooter();toast('Результат выбран как референс для следующего ракурса');
}
async function deleteVariant(id){
 const idx=project.renders.findIndex(x=>x.id===id);
 if(idx<0)return;
 if(!confirm('Удалить этот AI-результат из браузера?'))return;
 project.renders.splice(idx,1);
 await dataStore.del(mediaKey('render_'+id));imageCache.delete(mediaKey('render_'+id));await dataStore.del(mediaKey('input_'+id));imageCache.delete(mediaKey('input_'+id));
 if(project.activeRender===id)project.activeRender=project.demo?'demo':null;
 await loadProject(project.id);
 toast('Результат удалён');
}
async function hydrateRenderImages(){for(const r of project.renders){const u=await getMedia(mediaKey('render_'+r.id));if(u)imageCache.set(mediaKey('render_'+r.id),u)}renderResults();renderVariantsPanel()}
async function loadProject(id){maskVisible=false;const found=projects.find(p=>p.id===id);if(!found)return;project=found;sourceURL=project.demo?await approvedDemoSource():await getMedia(mediaKey('source'));if(!sourceURL&&!project.demo){project.hasSource=false;sourceURL=asset(ASSET+'residence-model-v32.webp')}renderURL='';if(project.activeRender&&project.activeRender!=='demo'){renderURL=await getMedia(mediaKey('render_'+project.activeRender))}else if(project.demo){renderURL=demoPhoto}texturePreviewURL='';$('beforeImg').src=(project.activeRender&&await getMedia(mediaKey('input_'+project.activeRender)))||sourceURL;$('stage').classList.toggle('demo-model-preview',!!project.demo);$('afterImg').src=renderURL||sourceURL;$('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height);$('noRender').hidden=!!renderURL;$('resultTag').textContent=project.demo?'ДЕМОНСТРАЦИЯ':renderURL?'AI-РЕЗУЛЬТАТ':'НЕТ РЕНДЕРА';$('splitSlider').disabled=false;$('uploadTitle').textContent=project.demo?'Загрузить свой скриншот':'Заменить скриншот проекта';$('uploadSubtitle').textContent=project.demo?'PNG, JPG, WEBP · Archicad, SketchUp, Revit и другие':`Ракурс ${project.angle||1} · PNG, JPG, WEBP`;$('workNote').textContent=project.demo?'Вы видите демонстрационное сравнение. Загрузите скриншот своего проекта, затем сгенерируйте результат через сервер с API-ключом.':'Ваш проект хранится локально в этом браузере. Без API-ключа AI-генерация недоступна; правки маски и настройки сохраняются.';renderAll();updateBatchUI();await hydrateRenderImages();await loadMask();save()}
async function createProject(name){const p=makeProject(name||'Новый проект');projects.unshift(p);await loadProject(p.id);toast('Создан новый проект. Загрузите скриншот.')}
async function uploadSource(file,newAngle=false){if(!file||uploadBusy)return;uploadBusy=true;setUploadBusy(true);try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const im=await pngDataFromFile(file);if(project.demo){await createProject(file.name.replace(/\.(png|jpe?g|webp)$/i,'').slice(0,48)||'Мой проект');newAngle=false}if(newAngle&&renderURL&&current().keepReference){await setMedia(mediaKey('ref'),renderURL);project.reference='ref'}if(!newAngle){project.renders=[];project.hasBatchFront=false;project.batchFrontName='';await dataStore.del(mediaKey('batchFront'));imageCache.delete(mediaKey('batchFront'))}project.angle=(newAngle?(project.angle||1)+1:1);project.activeRender=null;project.sourceWidth=im.width;project.sourceHeight=im.height;project.demo=false;project.hasSource=true;await setMedia(mediaKey('source'),im.data);for(const [zone] of zones){await dataStore.del(mediaKey('mask_'+zone));imageCache.delete(mediaKey('mask_'+zone))}await loadProject(project.id);save();toast(newAngle?'Новый ракурс добавлен. Настройки сцены сохранены.':'Скриншот загружен. Выберите параметры визуализации.')}catch(err){toast(err.message||'Не удалось открыть изображение')}finally{uploadBusy=false;setUploadBusy(false)}}
async function uploadOwnMaterial(file){if(!file)return;try{const im=await pngDataFromFile(file,1600);const id='usr_'+uuid();const name=file.name.replace(/\.(png|jpe?g|webp)$/i,'').slice(0,48)||'Мой материал';const m={id,name,width:0,height:0,createdAt:Date.now()};customMaterials.unshift(m);await setMedia('material_'+id,im.data);current().mats[current().zone]=id;current().materialActions={...current().materialActions,[current().zone]:'replace'};materialTab='mine';renderMaterials();renderZones();renderZones();renderFooter();save();toast('Фактура добавлена. Выделите поверхность дома и нажмите «Применить материал».')}catch(err){toast(err.message||'Не удалось загрузить текстуру')}}
function openDimensions(m){modal('Размеры материала',`<p class="muted">Укажите фактический размер одного фрагмента фактуры. Это поможет сохранить масштаб при AI-редактировании.</p><label>Название материала<input type="text" id="matNewName" maxlength="48" value="${eHTML(m.name)}"></label><div class="modal-pair"><label>Ширина, мм<input type="number" id="matWidth" min="0" max="10000" value="${m.width||''}" placeholder="Например, 1200"></label><label>Высота, мм<input type="number" id="matHeight" min="0" max="10000" value="${m.height||''}" placeholder="Например, 600"></label></div><p class="muted">Размеры можно оставить пустыми.</p>`,[{label:'Сохранить материал',primary:true,click:()=>{m.name=$('matNewName').value.trim()||m.name;m.width=Math.min(10000,Math.max(0,Number($('matWidth').value)||0));m.height=Math.min(10000,Math.max(0,Number($('matHeight').value)||0));renderMaterials();renderZones();renderFooter();save();closeModal()}}])}
function modal(title,html,actions=[]){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialogActions').innerHTML='';const a=$('dialogActions');a.className='dialog-actions';for(const item of actions){let b=document.createElement('button');b.className='btn '+(item.primary?'btn-dark':'btn-outline');b.textContent=item.label;b.addEventListener('click',item.click);a.appendChild(b)}$('dialogCover').hidden=false}
function closeModal(){$('dialogCover').hidden=true}
async function deleteProjectMedia(p){const keys=['source','ref','batchFront',...zones.map(([z])=>'mask_'+z),...p.renders.flatMap(r=>['render_'+r.id,'input_'+r.id])];for(const k of keys){const key=mediaKey(k,p.id);imageCache.delete(key);await dataStore.del(key).catch(()=>{})}}
async function deleteSelectedCustomMaterial(){const id=current().mats[current().zone];const m=customMaterials.find(m=>m.id===id);if(!m)return;if(!confirm('Удалить материал «'+m.name+'» из вашей библиотеки?'))return;customMaterials=customMaterials.filter(x=>x.id!==id);for(const p of projects)for(const [z,mid] of Object.entries(p.settings.mats))if(mid===id)p.settings.mats[z]=null;imageCache.delete('material_'+id);await dataStore.del('material_'+id).catch(()=>{});save();renderZones();renderMaterials();renderFooter();toast('Материал удалён')}
function showProjects(){modal('Мои проекты',`<p class="muted">Проекты, материалы и маски хранятся локально на этом устройстве. При очистке данных браузера они могут исчезнуть.</p><div class="project-list">${projects.map(p=>`<div class="project-item ${p.id===project.id?'active':''}"><button data-open-project="${p.id}"><b>${eHTML(p.name)}</b><small>${p.demo?'Демонстрационный':'Проект'} · ${new Date(p.modifiedAt).toLocaleDateString('ru-RU')}</small></button><button class="icon-button" data-delete-project="${p.id}" title="Удалить">${icon('trash')}</button></div>`).join('')}</div>`,[{label:'Новый проект',primary:true,click:()=>{closeModal();showNewProject()}}]);$('dialogBody').querySelectorAll('[data-open-project]').forEach(b=>b.onclick=async()=>{closeModal();await loadProject(b.dataset.openProject)});$('dialogBody').querySelectorAll('[data-delete-project]').forEach(b=>b.onclick=async()=>{if(projects.length<=1){toast('Нельзя удалить единственный проект');return}const id=b.dataset.deleteProject;if(!confirm('Удалить проект и его изображения из этого браузера?'))return;const doomed=projects.find(p=>p.id===id);projects=projects.filter(p=>p.id!==id);if(doomed)await deleteProjectMedia(doomed);if(project.id===id)await loadProject(projects[0].id);else save();showProjects()})}
function showNewProject(){modal('Новый проект',`<label>Название проекта<input type="text" id="newProjectName" maxlength="64" placeholder="Например, Вилла на озере" value="Новый проект"></label><p class="muted">После создания загрузите один или несколько скриншотов дома.</p>`,[{label:'Создать проект',primary:true,click:async()=>{const name=$('newProjectName').value.trim()||'Новый проект';closeModal();await createProject(name)}}]);setTimeout(()=>$('newProjectName')?.focus(),0)}
function settingsBrief(){
 const s=current();
 /* Only explicit user-uploaded material assignments: no phantom plaster defaults. */
 const assignedMaterials=String(s.homeChanges||'').trim()?{}:Object.fromEntries(zones.flatMap(([id,name])=>{
  const materialId=s.mats?.[id];
  const chosen=customMaterials.find(m=>m.id===materialId);
  return chosen?[[name,chosen.name]]:[];
 }));
 return {...(window.FORMA_INTERIORS?.briefForProject(project.id)||{sceneType:'exterior'}),project:project.name,source:project.hasSource?'Скриншот':'Нет',environment:envLabel(),environmentInstructions:environments.find(e=>e[0]===s.environment)?.[2],time:cLabel('time',s.time),weather:cLabel('weather',s.weather),season:cLabel('season',s.season),plants:cLabel('plants',s.plants),sceneMood:s.sceneMood||null,materials:assignedMaterials,textureScale:s.textureScale+'%',textureRotation:s.textureRotate+'°',homeChanges:String(s.homeChanges||'').trim().slice(0,600),lockGeometry:s.lockGeometry,preserveMaterials:s.preserveMaterials!==false,sceneReference:s.keepReference,output:{ratio:s.ratio,quality:s.quality,quantity:Number(s.quantity)},note:'Серия ракурсов использует визуальные референсы. Без 3D геометрическая идентичность окружения не гарантируется.'}}
function showBrief(){const text=JSON.stringify(settingsBrief(),null,2);modal('Техническое задание',`<p class="muted">Собрано автоматически из выбранных карточек. Пользователю не требуется писать промпт.</p><pre>${eHTML(text)}</pre>`,[{label:'Скопировать',primary:true,click:async()=>{try{await navigator.clipboard.writeText(text);toast('Бриф скопирован')}catch{downloadText('dom-render-brief.json',text,'application/json')}closeModal()}},{label:'Скачать JSON',click:()=>downloadText('dom-render-brief.json',text,'application/json')}])}
function downloadText(filename,text,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function downloadDataURL(url,filename){const a=document.createElement('a');a.href=url;a.download=filename;a.click()}
async function applyTexture(){if(editing)await leaveEditor();if(selectedMaskPixels()===0){toast('Сначала выделите поверхность в редакторе маски.');return}const mat=matById(current().mats[current().zone]);if(!mat.custom){toast('Сначала загрузите свою фактуру и выберите её.');return}try{const im=await imageFrom(mat.img);const cn=$('materialPreview'),ctx=cn.getContext('2d');const w=cn.width,h=cn.height;const tile=document.createElement('canvas');const edge=Math.max(24,Math.round(190*current().textureScale/100));tile.width=edge;tile.height=edge;const tc=tile.getContext('2d');tc.translate(edge/2,edge/2);tc.rotate((current().textureRotate||0)*Math.PI/180);tc.drawImage(im,-edge/2,-edge/2,edge,edge);ctx.clearRect(0,0,w,h);const pat=ctx.createPattern(tile,'repeat');ctx.fillStyle=pat;ctx.globalAlpha=.75;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;const clip=document.createElement('canvas');clip.width=w;clip.height=h;clip.getContext('2d').drawImage(maskCanvas,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(clip,0,0);ctx.globalCompositeOperation='source-over';maskVisible=false;paintMaskOverlay();$('noRender').hidden=true;$('resultTag').textContent='ЛОКАЛЬНАЯ ПРИМЕРКА · НЕ AI';$('splitSlider').disabled=false;setViewerMode('result');toast('Черновая примерка видна полностью. Это не финальный AI-рендер.')}catch(err){toast(err.message||'Не получилось применить текстуру')}}
async function buildMaskReviewImage(){
 try{
  const src=renderURL||sourceURL;
  if(!src)return '';
  const im=await imageFrom(src);
  const w=720,h=Math.max(100,Math.round(w*im.naturalHeight/im.naturalWidth));
  const cn=document.createElement('canvas');cn.width=w;cn.height=h;
  const ctx=cn.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(im,0,0,w,h);
  const tint=document.createElement('canvas');tint.width=maskCanvas.width;tint.height=maskCanvas.height;
  const tc=tint.getContext('2d');
  tc.fillStyle='rgba(230,140,69,.78)';tc.fillRect(0,0,tint.width,tint.height);
  tc.globalCompositeOperation='destination-in';tc.drawImage(maskCanvas,0,0);
  ctx.drawImage(tint,0,0,w,h);
  return cn.toDataURL('image/jpeg',.83);
 }catch(e){return ''}
}
async function reviewMaskBeforeAI(continueAI=false){
 if(editing)await leaveEditor();
 const pixels=selectedMaskPixels();
 if(!pixels){toast('Сначала выделите всю нужную поверхность кистью, полигоном или инструментом похожих оттенков');showTab('materials');return}
 const coverage=(pixels/(maskCanvas.width*maskCanvas.height)*100).toFixed(1);
 maskVisible=true;paintMaskOverlay();
 const preview=await buildMaskReviewImage();
 modal('Проверка выделения',`<p class="muted">Оранжевым показана область, которую передадим AI. Выделено <b>${coverage}%</b> кадра. Проверьте все участки фасада — сейчас AI не найдёт недостающие поверхности автоматически.</p>${preview?'<img class="mask-review-image" src="'+preview+'" alt="Выделенные участки, окрашенные оранжевым">':''}<p class="muted">Это проверка, не списание генерации. Финальный материал появится только после обработки AI.</p>`,[
  {label:'Исправить выделение',click:()=>{closeModal();enterEditor()}},
  {label:continueAI?'Подтвердить и запустить AI':'Выделение верное',primary:true,click:async()=>{closeModal();maskVisible=false;paintMaskOverlay();if(continueAI){if(materialAction()==='color')await generateConfirmedColor();else await generateConfirmedMaterial()}}}
 ]);
}
async function generateConfirmedColor(){
 if(!project.hasSource){toast('Сначала загрузите проект');return}
 if(selectedMaskPixels()===0){toast('Выделите поверхность, цвет которой нужно изменить');return}
 if(materialAction()!=='color')return toast('Выберите действие «Изменить цвет»');
 current().editSelectedOnly=true;
 $('editSelectedOnly').checked=true;
 save();
 $('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height);
 maskVisible=false;paintMaskOverlay();
 toast('Отправляем выбранный цвет и проверенную область на AI');
 await generate({materialEdit:true});
}
async function generateConfirmedMaterial(){
 const chosen=customMaterials.find(m=>m.id===current().mats[current().zone]);
 if(!chosen){toast('Сначала загрузите и выберите свою фактуру материала');showTab('materials');return}
 if(selectedMaskPixels()===0){toast('Выделение пустое. Начните с маски поверхности');return}
 current().editSelectedOnly=true;$('editSelectedOnly').checked=true;save();
 $('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height);
 maskVisible=false;paintMaskOverlay();
 toast('Отправляем вашу фактуру и подтверждённую маску на AI-генерацию');
 await generate({materialEdit:true});
}
async function generateSelectedMaterial(){
 const chosen=customMaterials.find(m=>m.id===current().mats[current().zone]);
 if(!chosen){toast('Сначала загрузите собственную фактуру');showTab('materials');return}
 await reviewMaskBeforeAI(true);
}
function discardMaterialPreview(){
 $('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height);
 $('resultTag').textContent=project.demo?'ДЕМОНСТРАЦИЯ':renderURL?'AI-РЕЗУЛЬТАТ':'НЕТ РЕНДЕРА';
 $('noRender').hidden=!!renderURL;
 toast('Черновая примерка скрыта. Исходное изображение не изменено');
}
function cancelWandPreview(){
 wandPreviewMask=null;
 if($('wandApproval'))$('wandApproval').hidden=true;
 if($('materialFindReview'))$('materialFindReview').hidden=true;
 if($('wandPreviewText'))$('wandPreviewText').textContent='Предпросмотр выделения';
 if(maskCanvas?.width&&editing)paintMaskOverlay();
}
async function commitWandMask(mask,add){
 const w=maskCanvas.width,h=maskCanvas.height;
 if(!mask||mask.length!==w*h)return 0;
 const pixels=maskCtx.getImageData(0,0,w,h),data=pixels.data;
 let changed=0;
 for(let i=0;i<mask.length;i++)if(mask[i]&&(!add||data[i*4+3]<=80))changed++;
 if(!changed)return 0;
 stashHistory();
 if(!add)data.fill(0);
 for(let i=0;i<mask.length;i++)if(mask[i]){
  const j=i*4;data[j]=255;data[j+1]=255;data[j+2]=255;data[j+3]=255;
 }
 maskCtx.putImageData(pixels,0,0);
 cancelWandPreview();
 maskVisible=true;paintMaskOverlay();
 await persistMask();updateUndoControls();
 return changed;
}
async function magicWandAt(pt,addByShift=false){
 if(wandBusy)return;
 if(!window.DOM_RENDER_MAGIC_WAND){toast('Модуль выделения не загрузился. Обновите страницу.');return}
 const src=renderURL||sourceURL;
 if(!src){toast('Сначала загрузите изображение дома');return}
 const w=maskCanvas.width,h=maskCanvas.height;
 wandBusy=true;
 if($('wandApply'))$('wandApply').disabled=true;
 try{
  // Bound the image size for good response even on mobile.
  const photo=await imageFrom(src);
  const scale=Math.min(1,820/Math.max(w,h));
  const sw=Math.max(64,Math.round(w*scale)),sh=Math.max(64,Math.round(h*scale));
  const canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
  const cx=canvas.getContext('2d',{willReadFrequently:true});
  cx.drawImage(photo,0,0,sw,sh);
  const result=window.DOM_RENDER_MAGIC_WAND.select(cx.getImageData(0,0,sw,sh),{
   x:pt.x*sw/w,y:pt.y*sh/h,
   tolerance:Number($('similarTolerance')?.value||18),
   maxCoverage:.42
  });
  if(result.overflow){
   cancelWandPreview();
   toast('Слишком широкое выделение: уменьшите допуск или кликните внутри нужной поверхности.');
   return;
  }
  if(!result.mask||result.count<12){
   cancelWandPreview();
   toast('Не удалось выделить область. Кликните по другому участку материала или немного увеличьте допуск.');
   return;
  }
  const mask=new Uint8Array(w*h),xs=new Int32Array(w);
  for(let x=0;x<w;x++)xs[x]=Math.min(sw-1,Math.floor(x*sw/w));
  let count=0;
  for(let y=0;y<h;y++){
   const sy=Math.min(sh-1,Math.floor(y*sh/h)),offset=y*w,source=sy*sw;
   for(let x=0;x<w;x++)if(result.mask[source+xs[x]]){mask[offset+x]=1;count++}
  }
  const add=!!($('wandAddMode')?.checked||addByShift);
  if(add){
   // Multi-click material selection: each successful click is applied immediately.
   // Every click stores one undo snapshot; only the connected candidate region is added.
   const n=await commitWandMask(mask,true);
   if(n)toast('Участок добавлен. Кликайте по оставшимся частям стены; ошибочный клик — кнопка «Назад».');
   else toast('Этот участок уже выделен. Нажмите на пропущенную часть материала.');
  }else{
   // Replacing an existing mask remains preview-first for safety.
   wandPreviewMask=mask;wandPreviewAdd=false;
   $('wandPreviewText').textContent='Зелёное: '+(count/(w*h)*100).toFixed(1)+'% кадра · заменить маску';
   $('wandApproval').hidden=false;
   maskVisible=true;paintMaskOverlay();
   toast('Проверьте новую область и нажмите «Применить» для замены текущей маски.');
  }
 }catch(e){
  cancelWandPreview();
  toast('Автовыделение не удалось: '+(e.message||'ошибка чтения изображения'));
 }finally{wandBusy=false;if($('wandApply'))$('wandApply').disabled=false}
}
async function applyWandPreview(){
 if(!wandPreviewMask||wandBusy)return;
 wandBusy=true;
 try{
  const mask=wandPreviewMask,add=wandPreviewAdd;
  const count=await commitWandMask(mask,add);
  if(count)toast(add?'Новый участок добавлен.':'Маска заменена. Для добавления других участков включите «Добавлять кликами».');
 }finally{wandBusy=false}
}
function asPNGMask(baseWidth,baseHeight){const total=maskCanvas.width*maskCanvas.height;if(!total||!selectedMaskPixels())return null;const cn=document.createElement('canvas');cn.width=baseWidth;cn.height=baseHeight;const ctx=cn.getContext('2d');ctx.fillStyle='rgba(0,0,0,1)';ctx.fillRect(0,0,cn.width,cn.height);ctx.globalCompositeOperation='destination-out';ctx.drawImage(maskCanvas,0,0,cn.width,cn.height);ctx.globalCompositeOperation='source-over';return cn.toDataURL('image/png')}
function getImageSize(url){return imageFrom(url).then(im=>({w:im.naturalWidth,h:im.naturalHeight}))}
function imageSizeForRatio(ratio){return {'16:9':'1536x864','3:2':'1536x1024','4:3':'1360x1024','1:1':'1024x1024','9:16':'864x1536'}[ratio]||'1536x864'}
async function generate(options={}){if(rendering)return;if(!project.hasSource){toast('Сначала загрузите скриншот');return}if(!aiConnected){$('generateText').textContent='Проверяем подключение…';$('generateBtn').disabled=true;try{await checkAPI(30000)}finally{$('generateBtn').disabled=false;$('generateText').textContent='Создать визуализацию'}if(!aiConnected){toast(apiCheckError||'Генерация сейчас недоступна. Проверьте подключение API Market.');return}}if(Number(current().quantity)>1&&!confirm('Вы выбрали '+current().quantity+' варианта. Каждый AI-рендер оплачивается по тарифу API. Продолжить?'))return;rendering=true;setRenderProgress('Подготавливаем изображение','Проверяем ракурс, материалы и параметры сцены');$('generateBtn').disabled=true;$('generateText').textContent='Генерация…';$('providerFoot').textContent='AI обрабатывает изображение. Не закрывайте страницу.';try{const editRequested=options?.materialEdit===true;
const instruction=editRequested?materialInstruction().trim():'';
const useMask=editRequested&&current().editSelectedOnly&&selectedMaskPixels()>0;
const textOnly=editRequested&&!useMask&&options?.textRequested===true;
if(textOnly&&!instruction)throw Error('Опишите изменение выбранного элемента дома.');
if(editRequested&&!useMask&&!textOnly)throw Error('Сначала выделите поверхность либо воспользуйтесь текстовым запросом.');
const action=materialAction(),editMode=useMask?(action==='color'?'recolor':'replace'):textOnly?'text':null;
const base=editRequested?(renderURL||sourceURL):sourceURL; // Edits target the current visual; ordinary full-scene rendering uses the original screenshot.
const imSize=await getImageSize(base);
const maskData=useMask?asPNGMask(imSize.w,imSize.h):null;
const m=matById(current().mats[current().zone]);
if(useMask&&editMode==='replace'&&!m.custom&&!instruction)throw Error('Для замены выберите фактуру или опишите новый материал текстом.');
const materialData=useMask&&editMode==='replace'&&m.custom&&!options?.materialPromptOnly?await getMedia('material_'+m.id):null;
if(useMask&&editMode==='replace'&&m.custom&&!options?.materialPromptOnly&&!materialData)throw Error('Загрузите выбранную фактуру повторно.');let refData=null;if(current().keepReference&&!renderURL&&!project.demo){refData=await getMedia(mediaKey('ref'))}else if(current().keepReference&&project.reference){refData=await getMedia(mediaKey(project.reference))}const payload={image:await urlToDataURL(base),mask:maskData,material:materialData,reference:refData,brief:options?.materialPromptOnly?{...settingsBrief(),materials:{}}:settingsBrief(),selectedZone:editRequested?zoneLabel():null,zoneId:editRequested?current().zone:null,editMode,editAction:editRequested?action:null,materialInstruction:editRequested?instruction:null,targetColor:editRequested&&action==='color'?materialColor():null,materialName:useMask&&editMode==='replace'&&m.custom&&!options?.materialPromptOnly?m.name:null,materialDimensions:useMask&&editMode==='replace'&&m.custom&&!options?.materialPromptOnly?{width:m.width||0,height:m.height||0}:null,size:imageSizeForRatio(current().ratio),quality:current().quality,quantity:Number(current().quantity)};setRenderProgress('AI создаёт визуализацию','Сервер обрабатывает сцену. Время зависит от сложности изображения.');const ac=new AbortController();const id=setTimeout(()=>ac.abort(),180000);let response;try{response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ac.signal})}finally{clearTimeout(id)}const data=await response.json().catch(()=>({error:'Некорректный ответ сервера'}));if(!response.ok||!Array.isArray(data.images)||!data.images.length)throw new Error(data.error||'Сервер не вернул изображение');setRenderProgress('Сохраняем результат','Добавляем изображение в галерею проекта');for(const [index,out] of data.images.entries()){const id='r'+uuid().slice(0,8);const url='data:'+(data.mimes?.[index]||'image/png')+';base64,'+out;await setMedia(mediaKey('render_'+id),url);project.renders.push({id,number:project.renders.length+1,createdAt:Date.now()});project.activeRender=id;renderURL=url}if(current().keepReference){await setMedia(mediaKey('ref'),renderURL);project.reference='ref'}save();await loadProject(project.id);window.DOM_RENDER_PROGRESS?.complete?.();toast(data.warning||'AI-визуализация готова. Сохраните изображение через галерею.')}catch(err){toast((err.name==='AbortError'?'Время ожидания AI истекло. ':err.message)||'Ошибка генерации')}finally{rendering=false;stopRenderProgress();$('generateBtn').disabled=false;$('generateText').textContent='Создать визуализацию';$('providerFoot').textContent=aiConnected?'Nano Banana подключена':'Демо: AI не подключён'}}
const BATCH_SHOTS=[
 {id:'original',label:'01 · Исходный ракурс',title:'Исходный ракурс'},
 {id:'front',label:'02 · Фронтальный вид',title:'Фронтальный вид'},
 {id:'detailEntry',label:'03 · Архитектурная деталь А',title:'Крупный план А'},
 {id:'detailMaterial',label:'04 · Архитектурная деталь Б',title:'Крупный план Б'}
];
function batchStatus(message,error=false){
 const status=$('batchStatus');if(!status)return;
 status.textContent=message;status.classList.toggle('is-error',error);
}
function updateBatchUI(){
 if(!project)return;
 const hasFront=!!project.hasBatchFront;
 $('batchFrontName').textContent=hasFront?(project.batchFrontName||'Фронтальный вид загружен'):'Выбрать файл';
 $('batchFrontClear').hidden=!hasFront;
 const notice=$('batchGeometryNotice');
 notice.classList.toggle('is-exact',hasFront);
 notice.textContent=hasFront
  ?'Для кадра №2 будет использован отдельный фронтальный скрин вашей модели. Это значительно надёжнее для сохранения геометрии.'
  :'Без отдельного фронтального вида кадр №2 будет AI-реконструкцией. Строгое совпадение невидимой геометрии не гарантируется.';
 for(const key of ['batchDetail1X','batchDetail1Y','batchDetail2X','batchDetail2Y']){
  const fallback={batchDetail1X:60,batchDetail1Y:60,batchDetail2X:77,batchDetail2Y:40}[key];
  $(key).value=String(Number(current()[key])||fallback);
 }
}
async function storeBatchFront(file){
 if(!file)return;
 if(rendering){toast('Завершите текущую визуализацию');return}
 if(!project?.hasSource){toast('Сначала загрузите основной скриншот дома');return}
 try{
  const im=await pngDataFromFile(file);
  await setMedia(mediaKey('batchFront'),im.data);
  project.hasBatchFront=true;
  project.batchFrontName=file.name.slice(0,80);
  save();updateBatchUI();
  batchStatus('Фронтальный скрин сохранён для кадра №2. Все четыре кадра готовы к запуску.');
 }catch(error){toast(error.message||'Не удалось загрузить фронтальный ракурс')}
}
async function clearBatchFront(){
 if(rendering)return;
 await dataStore.del(mediaKey('batchFront'));
 imageCache.delete(mediaKey('batchFront'));
 project.hasBatchFront=false;project.batchFrontName='';
 save();updateBatchUI();
 batchStatus('Дополнительный фронтальный вид удалён. При генерации кадра №2 AI будет оценивать фронтальную геометрию по основному изображению.');
}
async function cropBatchDetail(source,focusX,focusY,ratioString,zoom=.5){
 const img=await imageFrom(source);
 const [a,b]=String(ratioString||'16:9').split(':').map(Number);
 const ratio=a>0&&b>0?a/b:16/9;
 const cropWidthFraction=Math.max(.28,Math.min(.68,Number(zoom)||.5));
 let sw=Math.min(img.naturalWidth*cropWidthFraction,img.naturalHeight*.67*ratio);
 let sh=sw/ratio;
 if(sh>img.naturalHeight){sh=img.naturalHeight;sw=sh*ratio}
 sw=Math.max(1,Math.round(sw));sh=Math.max(1,Math.round(sh));
 const fx=Math.max(.04,Math.min(.96,Number(focusX)/100)),fy=Math.max(.04,Math.min(.96,Number(focusY)/100));
 const sx=Math.max(0,Math.min(img.naturalWidth-sw,img.naturalWidth*fx-sw/2));
 const sy=Math.max(0,Math.min(img.naturalHeight-sh,img.naturalHeight*fy-sh/2));
 const out=document.createElement('canvas');
 const factor=Math.min(2,2000/Math.max(sw,sh));
 out.width=Math.min(2000,Math.max(384,Math.round(sw*factor)));
 out.height=Math.min(2000,Math.max(256,Math.round(sh*factor)));
 const ctx=out.getContext('2d');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
 ctx.drawImage(img,sx,sy,sw,sh,0,0,out.width,out.height);
 const data=out.toDataURL('image/jpeg',.92);
 out.width=out.height=1;
 return data;
}
async function generateBatch(){
 if(rendering){toast('Другая генерация уже выполняется');return}
 if(!project?.hasSource){toast('Сначала загрузите исходный скриншот дома');return}
 let available;
 try{
  const resp=await fetch('/api/status',{cache:'no-store'});
  const status=await resp.json();
  if(!status.ready)throw Error('Генерация AI Market не подключена');
  available=Number(status.dailyRemaining);
  if(!Number.isFinite(available)||available<4)throw Error('Недостаточно генераций в общем дневном лимите сервера: осталось '+(Number.isFinite(available)?available:'—')+'. Для пакета нужно 4.');
 }catch(err){batchStatus(err.message||'Не удалось проверить лимит',true);return}
 const front=project.hasBatchFront?await getMedia(mediaKey('batchFront')):null;
 if(project.hasBatchFront&&!front){batchStatus('Фронтальный скрин не удалось прочитать. Загрузите его ещё раз.',true);return}
 const estimate=front?'':'\nКадр 2 без фронтального скрина является AI-приближением, точную геометрию обещать нельзя.';
 if(!confirm('Запустить пакет из 4 кадров? Будут отправлены ровно 4 отдельных платных обращения к API Market: по одному на кадр. Если часть запросов завершится ошибкой, уже отправленные могут быть списаны.'+estimate))return;
 const batchProject=project,src=sourceURL,brief=settingsBrief(),ratio=current().ratio,quality=current().quality;
 const positions=[[current().batchDetail1X||60,current().batchDetail1Y||60],[current().batchDetail2X||77,current().batchDetail2Y||40]];
 const batchId='b'+uuid().slice(0,9);
 let made=0,attempted=0,firstResult=null;
 rendering=true;
 $('batchStart').disabled=true;$('generateBtn').disabled=true;$('batchToggle').disabled=true;$('batchFrontFile').disabled=true;
 $('batchStart').textContent='Создаём пакет…';
 setRenderProgress('Пакетная визуализация','Готовим четыре независимых кадра');
 try{
  const images=[
   src,
   front||src,
   await cropBatchDetail(src,positions[0][0],positions[0][1],ratio,.55),
   await cropBatchDetail(src,positions[1][0],positions[1][1],ratio,.38)
  ];
  for(let i=0;i<BATCH_SHOTS.length;i++){
   if(project!==batchProject)throw Error('Во время пакета был переключён проект. Генерация оставшихся кадров остановлена.');
   const shot=BATCH_SHOTS[i];
   const position=(i+1)+' из 4';
   batchStatus('Создаётся кадр '+position+': '+shot.title+'. Успешно сохранено: '+made+'.');
   setRenderProgress('Кадр '+position,shot.title+' · один запрос к AI Market');
   const payload={
    image:await urlToDataURL(images[i]),
    reference:i===0?null:(i===1&&!front?null:src), // The original complete MODEL anchors geometry in frontal and AI-generated macro crops.
    brief:{...brief,lockGeometry:true,preserveMaterials:true,output:{...brief.output,quantity:1}},
    batchShot:shot.id,batchFrontProvided:!!front,
    quantity:1,quality,size:imageSizeForRatio(ratio)
   };
   const ctrl=new AbortController();
   const timeout=setTimeout(()=>ctrl.abort(),200000);
   let response,data;
   attempted++;
   try{
    response=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:ctrl.signal});
    data=await response.json().catch(()=>({error:'Неверный ответ сервера'}));
   }finally{clearTimeout(timeout)}
   if(!response.ok||!Array.isArray(data.images)||data.images.length!==1)throw Error(data.error||'AI не вернул кадр '+position);
   const url='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
   if(!firstResult)firstResult=url;
   const id='r'+uuid().slice(0,8);
   await setMedia(mediaKey('render_'+id,batchProject.id),url);
   await setMedia(mediaKey('input_'+id,batchProject.id),images[i]);
   batchProject.renders.push({
    id,number:batchProject.renders.length+1,createdAt:Date.now(),
    batchId,batchIndex:i+1,batchLabel:shot.label,
    approximateFront:i===1&&!front
   });
   batchProject.activeRender=id;
   renderURL=url;
   $('afterImg').src=url;$('noRender').hidden=true;$('resultTag').textContent='ПАКЕТ '+position.toUpperCase();
   made++;save();renderResults();renderVariantsPanel();renderAnimationPanel();
  }
  if(current().keepReference&&firstResult){
   await setMedia(mediaKey('ref'),firstResult);batchProject.reference='ref';save();
  }
  setRenderProgress('Сохраняем пакет','Все четыре изображения получены и сохранены');
  window.DOM_RENDER_PROGRESS?.complete?.();
  batchStatus('Все четыре кадра готовы. Расход — 4 обращения к AI Market. Каждый сохранён в разделе «Варианты».');
  toast('Пакет готов: 4 отдельных изображения сохранены');
 }catch(error){
  const status='Создано '+made+' из 4 кадров. Отправлено запросов: '+attempted+'. '+(error.name==='AbortError'?'Истекло время ожидания; запрос мог быть оплачен. ':String(error.message||'Ошибка'))+' Уже полученные кадры сохранены. Повторный запуск создаст новый платный пакет.';
  batchStatus(status,true);toast('Пакет завершён частично — '+made+' из 4. Проверьте статус и баланс.');
 }finally{
  rendering=false;stopRenderProgress();
  $('batchStart').disabled=false;$('generateBtn').disabled=false;$('batchToggle').disabled=false;$('batchFrontFile').disabled=false;
  $('batchStart').innerHTML='<svg class="ico"><use href="#i-spark"/></svg><span>Создать пакет · 4 кадра</span>';
  $('providerFoot').textContent=aiConnected?'Nano Banana подключена':'Проверьте подключение API';
  if(made>0)await loadProject(batchProject.id);
 }
}
async function urlToDataURL(url){if(url.startsWith('data:'))return url;const response=await fetch(url);if(!response.ok)throw Error('Не удалось загрузить справочное изображение');const blob=await response.blob();return new Promise((resolve,reject)=>{const r=new FileReader;r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
async function showResult(id){$('beforeImg').src=(id==='source'||id==='demo'?sourceURL:await getMedia(mediaKey('input_'+id))||sourceURL);if(id==='source'){project.activeRender=null;renderURL='';$('afterImg').src=sourceURL;$('noRender').hidden=false;$('resultTag').textContent='НЕТ РЕНДЕРА';$('splitSlider').disabled=false}else if(id==='demo'&&project.demo){project.activeRender='demo';renderURL=demoPhoto;$('afterImg').src=renderURL;$('noRender').hidden=true;$('resultTag').textContent='ДЕМОНСТРАЦИЯ';$('splitSlider').disabled=false}else{const url=await getMedia(mediaKey('render_'+id));if(!url){toast('Результат не найден в локальном хранилище');return}project.activeRender=id;renderURL=url;$('afterImg').src=url;$('noRender').hidden=true;$('resultTag').textContent='AI-РЕЗУЛЬТАТ';$('splitSlider').disabled=false}save();renderResults();renderVariantsPanel();renderSceneVariantsUI();setViewerMode(viewerMode);renderAnimationPanel();$('materialPreview').getContext('2d').clearRect(0,0,$('materialPreview').width,$('materialPreview').height)}
async function checkAPI(timeoutMs=20000){try{const res=await fetch('/api/status',{cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});if(!res.ok)throw Error('Not running');const data=await res.json();aiConnected=!!data.ready;apiCheckError=''}catch{aiConnected=false;apiCheckError='Не удалось связаться с сервером AI. Повторите попытку через несколько секунд.'}$('providerFoot').textContent=aiConnected?'Nano Banana подключена':apiCheckError?'Проверить подключение AI':'Демо: AI не подключён';return aiConnected}
async function init(){let saved;try{saved=JSON.parse(localStorage.getItem(STKEY)||'null')}catch{}projects=saved?.projects?.length?saved.projects:[makeProject('Резиденция 01',true)];try{customMaterials=JSON.parse(localStorage.getItem(MTKEY)||'[]')}catch{customMaterials=[]}for(const m of customMaterials){const value=await getMedia('material_'+m.id);if(value)imageCache.set('material_'+m.id,value)}await loadProject(saved?.activeId||projects[0].id);initDrawEvents();bind();bindTouchComparison();syncDemoWithSettings();checkAPI();}
/* Atmosphere presets control ONLY season, weather and light, never the surroundings. */
const SCENE_PRESETS={
 sunny:{title:'Солнечный день',caption:'Лето · Ясно · День',season:'summer',weather:'clear',time:'day'},
 golden:{title:'Золотой час',caption:'Лето · Вечер',season:'summer',weather:'clear',time:'golden'},
 fog:{title:'Туманное утро',caption:'Осень · Туман · Утро',season:'autumn',weather:'fog',time:'morning'},
 overcast:{title:'Мягкий пасмурный',caption:'Лето · Облачно · День',season:'summer',weather:'cloud',time:'day'},
 rain:{title:'После дождя',caption:'Осень · Дождь · День',season:'autumn',weather:'rain',time:'day'},
 winter:{title:'Зимняя тишина',caption:'Зима · Снег · День',season:'winter',weather:'snow',time:'day'},
 blue:{title:'Синий час',caption:'Лето · Вечер · Сумерки',season:'summer',weather:'clear',time:'golden'},
 night:{title:'Ночная архитектура',caption:'Лето · Ночь · Свет',season:'summer',weather:'cloud',time:'night'}
};
function presetMatchesSettings(id,s){
 const p=SCENE_PRESETS[id];
 return !!p&&p.season===s.season&&p.weather===s.weather&&p.time===s.time;
}
function syncDemoWithSettings(){
 const s=current();
 let id=s.sceneMood;
 if(!presetMatchesSettings(id,s))id=Object.keys(SCENE_PRESETS).find(k=>presetMatchesSettings(k,s))||null;
 const preset=id?SCENE_PRESETS[id]:null;
 document.querySelectorAll('[data-scene-demo]').forEach(b=>{
  const active=b.dataset.sceneDemo===id;
  b.classList.toggle('active',active);
  b.setAttribute('aria-pressed',String(active));
 });
 if($('scenePresetSelected'))$('scenePresetSelected').textContent=preset?preset.title:'Индивидуальная атмосфера';
 if($('scenePresetDesc'))$('scenePresetDesc').textContent=preset?preset.caption:(cLabel('season',s.season)+' · '+cLabel('weather',s.weather)+' · '+cLabel('time',s.time));
}
function setDemoScene(id,applySettings=true){
 const p=SCENE_PRESETS[id];if(!p)return;
 if(applySettings){
  Object.assign(current(),{season:p.season,weather:p.weather,time:p.time,sceneMood:id});
  renderChoices();renderFooter();save();
  toast('Атмосфера «'+p.title+'» сохранена: сезон, погода и свет обновлены. Окружение участка осталось прежним.');
 }
 syncDemoWithSettings();
}
let moodImagesInitialized=false;
function initMoodPhotos(){
 if(moodImagesInitialized)return;
 moodImagesInitialized=true;
 document.querySelectorAll('.mood-card img[data-preset-source]').forEach(img=>{
  const target=img.dataset.presetSource;
  if(!target)return;
  const preload=new Image();
  preload.onload=()=>{img.src=target;img.dataset.newPhoto='true'};
  preload.onerror=()=>{img.dataset.newPhoto='false'};
  preload.src=target;
 });
}
function bind(){
 const homeInput=$('homeChangesInput');
 if(homeInput)homeInput.addEventListener('input',()=>{
  current().homeChanges=homeInput.value.slice(0,600);save();renderHomeChanges();
 });
 const variantsGrid=$('sceneVariantsGrid');
 if(variantsGrid)variantsGrid.addEventListener('click',event=>{
  const choice=event.target.closest('[data-scene-variant]');
  if(choice&&!choice.disabled)generateSceneVariant(choice.dataset.sceneVariant);
 });
 for(const id of ['animCameras','animLenses','animMoves','animGrades']){
 $(id).onclick=e=>{
  const el=e.target.closest('[data-anim-kind][data-anim-id]');if(!el)return;
  updateAnimationSetting(el.dataset.animKind,el.dataset.animId);
 };
}
for(const [id,field] of [['animDuration','duration'],['animFPS','fps'],['animRatio','ratio'],['animIntensity','intensity']]){
 $(id).onchange=e=>updateAnimationSetting(field,e.target.value);
}
$('animExtra').oninput=e=>updateAnimationSetting('promptExtra',e.target.value,false);
$('animPlayPreview').onclick=playAnimationPreview;
document.querySelectorAll('[data-anim-source]').forEach(el=>el.onclick=()=>updateAnimationSetting('previewSource',el.dataset.animSource));
$('animPreviewFrame').addEventListener('animationend',()=>{
 $('animPreviewFrame').classList.remove('is-playing');
 const s=animationSettings(),zoom=(ANIM_LENS_SETTINGS[s.lens]||ANIM_LENS_SETTINGS.shift24)[1];
 $('animPreviewFrame').style.transform='scale('+zoom+')';
 $('animPreviewState').textContent=s.previewSource==='project'&&!!(renderURL||sourceURL)?'Исходное изображение проекта':'Демонстрационный архитектурный дом';
});
if($('angleLandscapeLock'))$('angleLandscapeLock').onchange=e=>{current().keepReference=e.target.checked;$('keepReference').checked=e.target.checked;save();toast(e.target.checked?'Ландшафт и стиль сохраняются для следующих ракурсов':'Передача прошлого ракурса как референса выключена')};document.querySelectorAll('[data-view-mode]').forEach(b=>b.onclick=()=>setViewerMode(b.dataset.viewMode));document.querySelectorAll('[data-tab]').forEach(el=>el.onclick=()=>showTab(el.dataset.tab));document.querySelectorAll('[data-render-mode]').forEach(b=>b.onclick=()=>showRenderSetupMode(b.dataset.renderMode));
document.querySelectorAll('[data-render-open]').forEach(b=>b.onclick=()=>{
 const key=b.dataset.renderOpen;
 openRenderPicker(b.getAttribute('aria-expanded')==='true'?null:key,true);
});
$('renderAutoEnvironment').onclick=()=>openRenderPicker('environment',true);
$('renderSetupGenerate').onclick=()=>generate();
$('renderSetupBatch').onclick=()=>{
 if($('batchPanel').hidden)$('batchToggle').click();
 $('batchToggle').scrollIntoView({behavior:'smooth',block:'nearest'});
};
$('simpleSelectArea').onclick=()=>{
 current().zone='custom';
 current().materialActions={...current().materialActions,custom:'replace'};
 current().editSelectedOnly=true;
 $('startMask').click();
};
$('simpleShowMask').onclick=()=>{$('showMask').click()};
$('simpleUploadTexture').onclick=()=>{$('uploadMaterialBtn').click()};
$('simpleMaterialGrid').onclick=e=>{
 const btn=e.target.closest('[data-simple-material]');if(!btn)return;
 const id=btn.dataset.simpleMaterial;if(!customMaterials.some(m=>m.id===id))return;
 current().zone='custom';current().mats.custom=id;
 current().materialActions={...current().materialActions,custom:'replace'};
 renderMaterials();renderZones();renderFooter();save();
};
$('simpleApplyTexture').onclick=()=>{
 current().zone='custom';current().editSelectedOnly=true;
 current().materialActions={...current().materialActions,custom:'replace'};
 $('generateMaterial').click();
};
$('simpleMaterialPrompt').addEventListener('input',e=>{
 const value=e.target.value.slice(0,500);
 current().zone='custom';
 current().materialInstructions={...current().materialInstructions,custom:value};
 $('materialInstruction').value=value;
 save();
});
$('simpleApplyPrompt').onclick=async()=>{
 const value=$('simpleMaterialPrompt').value.trim();
 if(!value){toast('Напишите, какой материал или цвет нужно изменить');return}
 current().zone='custom';
 current().materialInstructions={...current().materialInstructions,custom:value};
 current().materialActions={...current().materialActions,custom:'replace'};
 current().editSelectedOnly=true;save();
 if(!confirm('Выполнить платную AI-генерацию по вашему описанию? Без выделения AI определяет нужную область по тексту.'))return;
 await generate({materialEdit:true,textRequested:true,materialPromptOnly:true});
};
document.querySelectorAll('[data-scene-demo]').forEach(el=>el.onclick=()=>setDemoScene(el.dataset.sceneDemo));
$('moodCustomize').onclick=()=>openRenderPicker('season',true);document.querySelectorAll('[data-jump]').forEach(el=>el.onclick=()=>{const target=document.getElementById('renderSection-'+el.dataset.jump);if(!target)return;if(currentTab!=='environment')showTab('environment');document.querySelectorAll('[data-jump]').forEach(b=>b.classList.toggle('active',b===el));target.scrollIntoView({behavior:'smooth',block:'start'})});document.querySelectorAll('[data-mobile]').forEach(el=>el.onclick=()=>showTab(el.dataset.mobile,true));document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=()=>showTab(el.dataset.nav,true));$('environmentOptions').addEventListener('click',pickChoice);for(const group of ['time','weather','season','plants'])$(group+'Options').addEventListener('click',pickChoice);$('zoneOptions').addEventListener('click',async e=>{const el=e.target.closest('[data-zone]');if(!el)return;await selectMaterialElement(el.dataset.zone)});document.querySelectorAll('[data-quick-zone]').forEach(el=>el.addEventListener('click',async()=>{await selectMaterialElement(el.dataset.quickZone,'color');$('materialColorPane').scrollIntoView({behavior:'smooth',block:'nearest'});}));for(const el of [$('catalogMaterials'),$('myMaterials')])el.addEventListener('click',e=>{const b=e.target.closest('[data-material]');if(!b)return;current().mats[current().zone]=b.dataset.material;renderMaterials();renderZones();renderFooter();save();toast('Материал назначен зоне. Для визуальной примерки используйте маску.')});document.querySelectorAll('[data-mtab]').forEach(el=>el.onclick=()=>{materialTab=el.dataset.mtab;renderMaterials()});$('sourceFile').onchange=e=>{uploadSource(e.target.files[0],false);e.target.value=''};$('angleFile').onchange=e=>{uploadSource(e.target.files[0],true);e.target.value=''};$('newAngleBtn').onclick=()=>{if(!project.hasSource)return toast('Сначала загрузите первый ракурс');$('angleFile').click()};$('uploadBox').onclick=()=>{$('sourceFile').click()};$('uploadBox').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('sourceFile').click()}};for(const ev of ['dragover','dragleave','drop'])$('uploadBox').addEventListener(ev,e=>{e.preventDefault();if(ev==='dragover')$('uploadBox').classList.add('dragging');else $('uploadBox').classList.remove('dragging');if(ev==='drop'&&e.dataTransfer.files[0])uploadSource(e.dataTransfer.files[0],false)});document.querySelectorAll('[data-material-action]').forEach(b=>b.addEventListener('click',()=>{
 const act=b.dataset.materialAction;
 current().materialActions={...current().materialActions,[current().zone]:act};
 current().editSelectedOnly=act!=='keep';
 if(act==='keep')current().preserveMaterials=true;
 if(act!=='color')resetColorPreview(true);
 renderZones();renderMaterials();renderFooter();save();
 if(act==='color'){if(selectedMaskPixels())previewSelectedColor();else proposeMaterialZone()}else if(act==='replace'&&!selectedMaskPixels())proposeMaterialZone()
 if(act==='color')toast('Выберите цвет и выделите нужную поверхность.');
 if(act==='replace')toast('Загрузите фактуру и выделите нужную поверхность.');
}));
$('materialColor').addEventListener('input',e=>{
 current().materialColors={...current().materialColors,[current().zone]:e.target.value};
 renderZones();renderFooter();save();previewSelectedColor();
});
$('materialColorHex').addEventListener('input',e=>{
 const hex=e.target.value.trim();
 const valid=/^#[0-9a-fA-F]{6}$/.test(hex);
 e.target.classList.toggle('is-invalid',hex.length>=7&&!valid);
 if(!valid)return;
 current().materialColors={...current().materialColors,[current().zone]:hex.toLowerCase()};
 $('materialColor').value=hex.toLowerCase();
 renderZones();renderFooter();save();
 if(selectedMaskPixels())previewSelectedColor();
});
$('materialColorSwatches').addEventListener('click',e=>{
 const b=e.target.closest('[data-color]');if(!b)return;
 const c=b.dataset.color;
 current().materialColors={...current().materialColors,[current().zone]:c};
 renderZones();renderFooter();save();previewSelectedColor();
});
$('materialInstruction').addEventListener('input',e=>{
 const value=e.target.value.slice(0,500);
 current().materialInstructions={...current().materialInstructions,[current().zone]:value};
 if(materialAction()==='color'){
  const named=suggestedColorFromText(value);
  if(named){
   current().materialColors={...current().materialColors,[current().zone]:named};
   renderZones();renderFooter();
   if(selectedMaskPixels())previewSelectedColor();
  }
 }
 save();
});
$('materialFindZone').onclick=proposeMaterialZone;
$('materialFindApply').onclick=applyMaterialZoneSuggestion;
$('materialFindCancel').onclick=()=>{cancelWandPreview();paintMaskOverlay();$('materialFindStatus').textContent='Предложение отменено. Можно выбрать область кистью или палочкой.'};
$('materialPreviewColor').onclick=previewSelectedColor;
$('materialPreviewReset').onclick=()=>resetColorPreview();
$('materialGenerateFromText').onclick=async()=>{if(!materialInstruction().trim())return toast('Напишите, что изменить: например, оконные рамы сделать чёрными.');if(!confirm('Запустить платное AI-изменение по описанию? При отсутствии точной маски AI сам определит нужные элементы.'))return;await generate({materialEdit:true,textRequested:true})};
$('generateColor').onclick=()=>reviewMaskBeforeAI(true);
$('materialFile').onchange=e=>{uploadOwnMaterial(e.target.files[0]);e.target.value=''};$('uploadMaterialBtn').onclick=()=>$('materialFile').click();$('deleteMyMaterial').onclick=deleteSelectedCustomMaterial;$('startMask').onclick=async()=>{await loadMask();enterEditor();if(project.demo&&selectedMaskPixels()===0)makeDemoMask(current().zone)};$('showMask').onclick=async()=>{if(currentTab!=='materials')showTab('materials');await loadMask();if(selectedMaskPixels()===0){if(project.demo)makeDemoMask(current().zone);else toast('Маска пуста. Выделите область кистью или полигоном.');maskVisible=true}else maskVisible=!maskVisible;paintMaskOverlay();if(selectedMaskPixels())toast(maskVisible?'Маска показана.':'Маска скрыта.')};$('finishMask').onclick=leaveEditor;$('clearMask').onclick=()=>{cancelWandPreview();stashHistory();maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);polyPoints=[];paintMaskOverlay();persistMask();toast('Выделение очищено')};$('undoMask').onclick=undoMask;$('undoWandFloating').onclick=undoMask;document.querySelectorAll('[data-tool]').forEach(el=>el.onclick=()=>{if(polyPoints.length>=3&&tool==='polygon')polygonDone();cancelWandPreview();tool=el.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('active',x===el));drawPolygonGuide()});$('brushSize').oninput=e=>$('brushOut').textContent=e.target.value;$('similarTolerance').oninput=e=>{$('similarOut').textContent=e.target.value;cancelWandPreview()};$('wandApply').onclick=applyWandPreview;$('wandCancel').onclick=cancelWandPreview;$('textureScale').oninput=e=>{current().textureScale=Number(e.target.value);$('scaleValue').textContent=e.target.value+'%';save()};$('textureRotate').onchange=e=>{current().textureRotate=Number(e.target.value);save()};$('tryMaterial').onclick=applyTexture;$('discardMaterialPreview').onclick=discardMaterialPreview;$('generateMaterial').onclick=generateSelectedMaterial;$('reviewMask').onclick=()=>reviewMaskBeforeAI(false);$('splitSlider').oninput=e=>updateSplit(e.target.value);$('resetSplit').onclick=()=>updateSplit(50);$('downloadResult').onclick=()=>{if(!renderURL){toast('Сначала создайте или выберите результат');return}downloadDataURL(renderURL,'dom-render-'+project.id+(project.demo||renderURL.startsWith('data:image/jpeg')?'.jpg':renderURL.startsWith('data:image/webp')?'.webp':'.png'));toast(project.demo?'Скачан демонстрационный кадр':'Результат скачан')};$('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('viewerCard')?.requestFullscreen?.()||$('stage').requestFullscreen?.()};$('resultsStrip').addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(b)showResult(b.dataset.result)});for(const id of ['ratioSelect','qualitySelect','quantitySelect'])$(id).onchange=e=>{current()[id.replace('Select','')]=e.target.value;renderFooter();save()};for(const id of ['lockGeometry','preserveMaterials','keepReference','editSelectedOnly'])$(id).onchange=e=>{current()[id]=e.target.checked;if(id==='keepReference'&&$('angleLandscapeLock'))$('angleLandscapeLock').checked=e.target.checked;save()};$('viewAllVariants').onclick=()=>showTab('variants',true);
 $('projectUpload').onclick=()=>$('sourceFile').click();
 $('projectSwitch').onclick=showProjects;
 $('projectCreate').onclick=showNewProject;
 $('projectToRender').onclick=()=>showTab('environment',true);
 $('variantsGenerate').onclick=generate;
 $('variantHistory').addEventListener('click',async e=>{
   const open=e.target.closest('[data-variant-open]');
   if(open){await showResult(open.dataset.variantOpen);return}
   const ref=e.target.closest('[data-variant-ref]');
   if(ref){await makeVariantReference(ref.dataset.variantRef);return}
   const del=e.target.closest('[data-variant-delete]');
   if(del){await deleteVariant(del.dataset.variantDelete)}
 });
 $('newProjectBtn').onclick=showNewProject;$('mobileAdd').onclick=showNewProject;$('helpBtn').onclick=()=>modal('Как работает ФОРМА',`<p class="muted"><b>1.</b> Загрузите скриншот из Archicad, SketchUp или Revit.<br><b>2.</b> Выберите окружение, погоду, сезон и время суток кнопками с изображениями.<br><b>3.</b> Во вкладке «Материалы и цвета» выберите элемент: стены, окна, террасу или кровлю. Примерьте цвет бесплатно или введите текстовое задание для AI. Для точной замены подтвердите маску.<br><b>4.</b> Запустите AI-генерацию при подключённом API.<br><b>5.</b> Для следующего вида используйте «Новый ракурс»: настройки и референс сохранятся.</p><p class="muted">Без 3D совпадение положения объектов между разными ракурсами является приблизительным. Работа AI-редактора тоже не гарантирует идеальное сохранение геометрии.</p>`,[{label:'Понятно',primary:true,click:closeModal}]);$('generateBtn').onclick=generate;
$('batchToggle').onclick=()=>{
 const open=$('batchPanel').hidden;
 $('batchPanel').hidden=!open;
 $('batchToggle').setAttribute('aria-expanded',String(open));
 updateBatchUI();
};
$('batchFrontFile').onchange=e=>{storeBatchFront(e.target.files[0]);e.target.value=''};
$('batchFrontClear').onclick=clearBatchFront;
for(const name of ['batchDetail1X','batchDetail1Y','batchDetail2X','batchDetail2Y']){
 $(name).oninput=e=>{current()[name]=Number(e.target.value);save()};
}
$('batchStart').onclick=generateBatch;
$('dialogClose').onclick=closeModal;$('dialogCover').onclick=e=>{if(e.target===$('dialogCover'))closeModal()}}
function pickChoice(e){const btn=e.target.closest('[data-choice]');if(!btn)return;const group=btn.dataset.choiceGroup;current()[group]=btn.dataset.choice;if(['time','season','weather'].includes(group))current().sceneMood=null;renderChoices();renderFooter();save();if(['environment','time','season','weather'].includes(group))syncDemoWithSettings();if(SCENE_SETUP_FIELDS.includes(group))openRenderPicker(null);toast('Выбрано: '+(group==='environment'?envLabel():cLabel(group,current()[group])))}
init().catch(err=>{console.error(err);toast('Не удалось загрузить приложение')});
