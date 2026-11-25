import {normalizePineGrowth} from './forma-landscape-pine-growth.js';
import {WEATHER_EFFECT_DEFAULTS,normalizeWeatherEffects} from './forma-landscape-weather-effects.js';
import {INTERIOR_NIGHT_DEFAULTS,normalizeNightInterior} from './forma-landscape-3d-night-interior.js';
import {ROOF_GARLAND_DEFAULTS,normalizeRoofGarland} from './forma-landscape-roof-garlands.js';
import {sprucePromptStage} from './forma-landscape-tree-photo-identity.js';
import {visibleSurfaceAreas} from './forma-landscape-area.js?v=overlap-union-v1';
import {housePresetIds} from './forma-landscape-3d-buildings.js';
/* FORMA Landscape Project — real-world geometry is authoritative.
   Units are metres. AI is never trusted for measurements or object coordinates.
 */
export const GROUPS=Object.freeze([
 {id:'shrubs',name:'Кустарники и почвопокровные',qty:14,symbol:'◈'},
 {id:'trees',name:'Деревья',qty:17,symbol:'♧'},
 {id:'pavers',name:'Брусчатка',qty:6,symbol:'▤'},
 {id:'fills',name:'Отсыпки',qty:9,symbol:'░'},
 {id:'lights',name:'Светильники',qty:11,symbol:'☼'},
 {id:'lawns',name:'Газоны',qty:4,symbol:'≋'},
 {id:'ponds',name:'Водоёмы',qty:3,symbol:'≈'},
 {id:'boulders',name:'Валуны',qty:4,symbol:'⬡'},
 {id:'pools',name:'Бассейны',qty:3,symbol:'≈'}
]);
export const TREE_HEIGHT_M=Object.freeze({pine:14,spruce:12,birch:16,oak:17,maple:13,linden:14,willow:11,rowan:8,apple:6,sakura:7,ash:16,aspen:18,poplar:24,'ph-fir-sapling':3,'ph-pine-sapling':2.8,'ph-quiver-01':4.5,'ph-quiver-02':3.7});
export const SCENE_OPTIONS=Object.freeze({
 time:[['morning','Утро'],['day','День'],['evening','Закат'],['blue-hour','Синий час'],['night','Ночь']],
 season:[['spring','Весна'],['summer','Лето'],['autumn','Осень'],['winter','Зима']],
 weather:[['sunny','Солнечно'],['overcast','Пасмурно'],['after-rain','После дождя'],['rain','Дождь'],['fog','Туман'],['snow','Снег']]
});
export const CATALOG=Object.freeze([
 {id:'pool-frame',group:'pools',name:'Каркасный бассейн',color:'#929da0',diameter:3.05,height:1},
 {id:'pool-inflatable',group:'pools',name:'Надувной бассейн',color:'#367ab0',diameter:3.05,height:.76},
 {id:'pool-inground',group:'pools',name:'Встроенный бассейн',color:'#609eac',diameter:6,width:3,height:1.5},
 ...[
 ['juniper','Можжевельник горизонтальный','#647d6b',1.8,'Juniperus horizontalis'],
 ['hydrangea','Гортензия метельчатая','#96a773',1.6,'Hydrangea paniculata'],
 ['spirea','Спирея японская','#9caa6e',1.2,'Spiraea japonica'],
 ['barberry','Барбарис Тунберга','#874a4a',1.4,'Berberis thunbergii'],
 ['dogwood','Дёрен белый «Элегантиссима»','#849a79',2.91,'Cornus alba Elegantissima'],
 ['thuja-globe','Туя западная «Даника»','#3f6c55',1.02,'Thuja occidentalis Danica'],
 ['lavender','Лаванда узколистная','#8b88af',0.88,'Lavandula angustifolia'],
 ['boxwood','Самшит вечнозелёный','#587346',1.0,'Buxus sempervirens'],
 ['pennisetum','Пеннисетум «Хамельн» · пушистый декоративный злак','#a6a67b',0.87,'Pennisetum alopecuroides Hameln'],
 ['hosta','Хоста декоративная','#658e63',1.2,'Hosta plantaginea'],
 ['ornamental-grass','Декоративный злак · мискантус','#9b9e68',1.5,'Miscanthus sinensis'],
 ['fern','Папоротник 01 · Poly Haven','#54835c',0.62,'Fern 02 · clump a'],
 ['fern-02','Папоротник 02 · Poly Haven','#4a8458',1.00,'Fern 02 · clump b'],
 ['fern-03','Папоротник 03 · Poly Haven','#4e895d',0.88,'Fern 02 · clump c'],
 ['fern-04','Папоротник 04 · Poly Haven','#55885b',0.60,'Fern 02 · clump d'],
 ['periwinkle','Барвинок стелющийся · собственная 3D-модель','#6f997a',1.0,'Vinca minor'],
 ['wild-shrub','Кустарник природный · собственная 3D-модель','#779763',1.8,'Native mixed woodland shrub']
 ].map(([id,name,color,diameter,latin])=>({id,group:'shrubs',name,color,diameter,latin,shape:'shrub'})),
 ...[
 ['pine','Сосна обыкновенная','#6a8160',7,'Pinus sylvestris','pine'],
 ['spruce','Ель обыкновенная','#4b695a',5,'Picea abies','conifer'],
 ['birch','Берёза повислая','#b2c49b',6,'Betula pendula','birch'],
 ['oak','Дуб черешчатый','#64854d',10,'Quercus robur','broadleaf'],
 ['maple','Клён остролистный','#829b49',8,'Acer platanoides','broadleaf'],
 ['linden','Липа мелколистная','#93ae62',8,'Tilia cordata','broadleaf'],
 ['willow','Ива плакучая','#91a45e',9,'Salix babylonica','willow'],
 ['rowan','Рябина обыкновенная','#7a9c51',5,'Sorbus aucuparia','berries'],
 ['apple','Яблоня декоративная','#aa9a78',5,'Malus ornamental','flower'],
 ['sakura','Сакура','#d4a8bf',5,'Prunus serrulata','flower'],
 ['ash','Ясень обыкновенный','#678e50',8,'Fraxinus excelsior','pinnate'],
 ['aspen','Осина европейская','#a4be76',6,'Populus tremula','aspen'],
 ['poplar','Тополь пирамидальный','#718360',4.8,'Populus nigra Italica','broadleaf'],
 ['ph-fir-sapling','Пихта молодая · Poly Haven','#4d7561',2.0,'Fir sapling (Poly Haven)','conifer'],
 ['ph-pine-sapling','Сосна молодая · Poly Haven','#677b60',1.8,'Pine sapling (Poly Haven)','pine'],
 ['ph-quiver-01','Колчанное дерево 01 · Poly Haven','#719179',2.5,'Aloidendron dichotomum','broadleaf'],
 ['ph-quiver-02','Колчанное дерево 02 · Poly Haven','#719179',2.1,'Aloidendron dichotomum','broadleaf']
 ].map(([id,name,color,diameter,latin,shape])=>({id,group:'trees',name,color,diameter,latin,shape})),
 ...[
 ['concrete-pavers','Крупноформатная плита','#b1ada2','slabs'],
 ['granite-setts','Колотая гранитная брусчатка','#8d8b85','setts'],
 ['clinker-herringbone','Клинкер · ёлочка','#a5745f','herringbone'],
 ['slate-pavers','Сланец натуральный','#575957','slate'],
 ['radial-setts','Брусчатка радиальная','#a59f93','radial'],
 ['grass-grid','Газонная решётка','#889582','grid']
 ].map(([id,name,color,texture])=>({id,group:'pavers',name,color,texture})),
 ...[
 ['marble-chips','Мраморная крошка','#dad4c3','marble'],
 ['granite-chips','Гранитная крошка','#8c8d8b','granite'],
 ['river-pebble','Речная галька','#b1a288','pebble'],
 ['slate-chips','Сланцевая отсыпка','#4d5358','slate'],
 ['pine-bark','Кора сосновая','#7b563d','bark'],
 ['sand-fine','Песок природный','#ceb896','sand'],
 ['gravel-natural','Гравий природный','#878580','gravel'],
 ['crushed-stone','Щебень мелкий','#a3a09a','crushed'],
 ['sandy-gravel','Песчано-гравийная смесь','#b9a589','sandy-gravel']
 ].map(([id,name,color,texture])=>({id,group:'fills',name,color,texture})),
 ...[
 ['bollard','Цилиндрический с ребристым стеклом · 07','#d9c3a0','bollard',.16,.83],
 ['ground','Встраиваемый круглый · IP67','#f2d4a2','ground',.28,.12],
 ['spot','Поворотный на стойке · 05','#ead0a3','spot',.18,1.11],
 ['low-post','Квадратный с матовым стеклом · 03','#e6c395','post',.205,1.20],
 ['deck-light','Террасный квадратный · IP67','#e5c390','deck',.095,.10],
 ['linear','Линейный в мощении · LED','#ffcf8f','linear',.037,.08],
 ['mushroom','Грибовидный · мягкий свет вниз','#e6cdaa','mushroom',.15,.38],
 ['square-bollard','Чёрный с тремя световыми поясами · 02','#d8c29f','square-bollard',.145,.82],
 ['garden-lantern','Открытая прямоугольная рама · 06','#f0d4a0','garden-lantern',.205,1.03],
 ['spike-spot','Прожектор с фасеточным отражателем · 01','#e9cda3','spike-spot',.13,.39],
 ['globe','Светильник-шар · опаловый','#f0d9b3','globe',.40,.40]
 ].map(([id,name,color,texture,diameter,height])=>({id,group:'lights',name,color,diameter,height,texture})),
 ...[
 ['formal','Коротко стриженный · партерный газон','#79a24e','formal'],
 ['universal','Универсальный газон · классический','#779853','universal'],
 ['shade','Теневыносливый газон · плотный','#4c7950','shade'],
 ['meadow','Луговой газон · разнотравье','#769b4b','meadow']
 ].map(([id,name,color,texture])=>({id,group:'lawns',name,color,texture})),
 ...[
 ['natural','Природный пруд','#406d66','natural'],
 ['formal-pond','Декоративный пруд','#3a6774','formal'],
 ['bio-pond','Биопруд с растениями','#4e7b6d','bio']
 ].map(([id,name,color,texture])=>({id,group:'ponds',name,color,texture})),
 ...[
 ['granite-boulder','Гранитный валун','#7b7c7b','granite',1.5],
 ['limestone-boulder','Известняковый валун','#c0b59d','limestone',1.6],
 ['slate-boulder','Слоистый сланец','#51595c','slate',1.7],
 ['sandstone-boulder','Песчаник тёплый','#ad9170','sandstone',1.8]
 ].map(([id,name,color,texture,diameter])=>({id,group:'boulders',name,color,texture,diameter,shape:'rock'}))
]);
export const byId=id=>CATALOG.find(x=>x.id===id)||null;
const finite=(x,min,max,fallback)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):fallback;
const round=(x,d=3)=>Math.round(x*10**d)/10**d;
const point=p=>({x:finite(p?.x,-5000,5000,0),y:finite(p?.y,-5000,5000,0)});
const maxObjects=500;
const safePhoto=x=>typeof x==='string'&&x.length<1200000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(x)?x:null;
export const freshProject=()=>({version:1,title:'Ландшафтный проект',site:{width:30,height:40,orientation:0,boundary:null},house:{x:15,y:16,width:12,height:8,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e',ridge:0,entry:'south',photo:null,garland:{...ROOF_GARLAND_DEFAULTS}},objects:[],buildings:[],underlay:null,underlayOpacity:.25,north:0,northVerified:false,verified:false,style:'natural',atmosphere:{time:'day',season:'summer',weather:'sunny',effects:{...WEATHER_EFFECT_DEFAULTS},interior:{...INTERIOR_NIGHT_DEFAULTS}}});
export function normalizeProject(raw){
 const obj=raw&&typeof raw==='object'?raw:{},base=freshProject(),site=obj.site||{},house=obj.house||{};
 const width=finite(site.width,5,500,30),height=finite(site.height,5,500,40);
 const boundary=Array.isArray(site.boundary)&&site.boundary.length>=3&&site.boundary.length<=80?site.boundary.map(p=>({x:finite(p?.x,0,width,0),y:finite(p?.y,0,height,0)})):null;
 const r={version:1,title:String(obj.title||base.title).slice(0,75),site:{width,height,orientation:finite(site.orientation,-360,360,0),boundary},
 house:{x:finite(house.x,0,width,width/2),y:finite(house.y,0,height,height*.4),width:finite(house.width,2,60,12),height:finite(house.height,2,60,8),rotation:finite(house.rotation,-360,360,0),type:['house','bath','garage','carport','greenhouse','gazebo','outbuilding'].includes(house.type)?house.type:'house',
 roof:['gable','hip','flat'].includes(house.roof)?house.roof:'gable',archStyle:housePresetIds.includes(house.archStyle)?house.archStyle:'barn',modelKey:/^[a-z0-9-]{1,48}$/i.test(house.modelKey||'')?house.modelKey:null,roofRise:finite(house.roofRise,.4,8,1.4),roofColor:/^#[a-f0-9]{6}$/i.test(house.roofColor||'')?house.roofColor:'#393c3e',ridge:finite(house.ridge,0,360,0),entry:['north','south','east','west'].includes(house.entry)?house.entry:'south',photo:safePhoto(house.photo),garland:normalizeRoofGarland(house.garland)},
 objects:[],buildings:[],underlay:safePhoto(obj.underlay),
 underlayOpacity:finite(obj.underlayOpacity,0,1,.25),north:finite(obj.north,0,360,0),northVerified:obj.northVerified===true,
 verified:obj.verified===true,style:['natural','modern','architectural'].includes(obj.style)?obj.style:'natural',
 atmosphere:{
  time:SCENE_OPTIONS.time.some(x=>x[0]===obj.atmosphere?.time)?obj.atmosphere.time:'day',
  season:SCENE_OPTIONS.season.some(x=>x[0]===obj.atmosphere?.season)?obj.atmosphere.season:'summer',
  weather:SCENE_OPTIONS.weather.some(x=>x[0]===obj.atmosphere?.weather)?obj.atmosphere.weather:'sunny',
  effects:normalizeWeatherEffects(obj.atmosphere?.effects||obj.atmosphere?.weatherEffects),
  interior:normalizeNightInterior(obj.atmosphere?.interior)
 }};
 for(const item of (Array.isArray(obj.objects)?obj.objects:[]).slice(0,maxObjects)){
  const legacyNinebark=item.catalogId==='ninebark';
  const entry=byId(legacyNinebark?'pennisetum':item.catalogId);if(!entry)continue;
  const id=/^[a-z0-9-]{1,48}$/i.test(item.id||'')?item.id:'o-'+Math.random().toString(36).slice(2,10);
  if(['pavers','fills','lawns','ponds'].includes(entry.group)){
   const points=(Array.isArray(item.points)?item.points:[]).slice(0,512).map(point);
   const strip=['fills','lawns'].includes(entry.group)&&item.geometry==='strip';
   const paintedPond=entry.group==='ponds'&&item.geometry==='paint';
   if(points.length<(entry.group==='pavers'||strip?2:3))continue;
   const holes=['fills','lawns','ponds'].includes(entry.group)&&Array.isArray(item.holes)
     ?item.holes.slice(0,128).filter(poly=>Array.isArray(poly)&&poly.length>=3&&poly.length<=180).map(poly=>poly.map(p=>({x:finite(p?.x,0,width,0),y:finite(p?.y,0,height,0)}))):[];
    r.objects.push({id,catalogId:entry.id,type:entry.group,points,width:finite(item.width,.4,10,1.2),...(strip?{geometry:'strip'}:paintedPond?{geometry:'paint'}:{}),...(holes.length?{holes}:{}),...(entry.group==='lawns'&&item.autoFill===true?{autoFill:true}:{})});
  }else r.objects.push({id,catalogId:entry.id,type:entry.group,x:finite(item.x,0,width,width/2),y:finite(item.y,0,height,height/2),diameter:legacyNinebark?.87:finite(item.diameter,entry.group==='pools'?2:.1,entry.group==='pools'?10:30,entry.diameter||1),height:legacyNinebark?.76:finite(item.height,entry.group==='pools'?.3:.15,entry.group==='pools'?2.5:40,entry.group==='trees'?(TREE_HEIGHT_M[entry.id]||12):entry.height||.9),...(entry.id==='pool-inground'?{width:finite(item.width,2,10,3)}:{}),rotation:finite(item.rotation,-360,360,0),...(['trees','shrubs','boulders'].includes(entry.group)?{variant:finite(item.variant,1,entry.group==='boulders'?4:3,1)}:{}),
    ...(entry.group==='boulders'?{burial:finite(item.burial,0,.36,.12)}:{}),
    ...(entry.group==='lights'?{brightness:finite(item.brightness,0,2,1),kelvin:[2200,2700,3000,4000].includes(Number(item.kelvin))?Number(item.kelvin):2700,...(entry.id==='globe'?{variant:finite(item.variant,1,4,1)}:{})}:{}),
    ...(entry.id==='pine'?{pine:normalizePineGrowth(item.pine)}:{}),
    ...(entry.id==='spruce'?{spruce:{
      type:sprucePromptStage(item),
      ...(Number.isFinite(Number(item.spruce?.age))&&Number(item.spruce.age)>=3&&Number(item.spruce.age)<=350
       ?{age:Math.round(Number(item.spruce.age))}:{})
    }}:{})});
 }
 for(const b of (Array.isArray(obj.buildings)?obj.buildings:[]).slice(0,24)){
  if(!b||typeof b!=='object')continue;
  r.buildings.push({id:/^[a-z0-9-]{1,48}$/i.test(b.id||'')?b.id:'b-'+Math.random().toString(36).slice(2,10),x:finite(b.x,0,width,width*.7),y:finite(b.y,0,height,height*.7),width:finite(b.width,2,60,6),height:finite(b.height,2,60,4),rotation:finite(b.rotation,-360,360,0),type:['bath','garage','carport','greenhouse','gazebo','outbuilding','house'].includes(b.type)?b.type:'bath',roof:['gable','hip','flat'].includes(b.roof)?b.roof:'gable',archStyle:housePresetIds.includes(b.archStyle)?b.archStyle:'scandi',modelKey:/^[a-z0-9-]{1,48}$/i.test(b.modelKey||'')?b.modelKey:null,roofRise:finite(b.roofRise,.4,8,1.2),roofColor:/^#[a-f0-9]{6}$/i.test(b.roofColor||'')?b.roofColor:'#454543',photo:safePhoto(b.photo),garland:normalizeRoofGarland(b.garland)});
 }
 return r;
}
export const segmentLength=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export const lineLength=pts=>pts.slice(1).reduce((s,p,i)=>s+segmentLength(pts[i],p),0);
export const polygonArea=pts=>pts.length<3?0:Math.abs(pts.reduce((s,p,i)=>s+p.x*pts[(i+1)%pts.length].y-pts[(i+1)%pts.length].x*p.y,0))/2;
export const areaFor=(doc,item)=>{
 const group=byId(item.catalogId)?.group;
 if(group==='pavers'||(['fills','lawns'].includes(group)&&item.geometry==='strip'))return lineLength(item.points)*item.width;
 if(!['fills','lawns','ponds'].includes(group))return 0;
 const raw=Math.max(0,polygonArea(item.points)-(item.holes||[]).reduce((sum,shape)=>sum+polygonArea(shape),0));
 if(item.autoFill&&group==='lawns'){
  // Background lawn appears only where the site has no explicit covering
  // or building. Gross areas can overlap, so these quantities remain estimates.
  const other=(doc.objects||[]).filter(x=>x.id!==item.id&&['pavers','fills','lawns','ponds'].includes(byId(x.catalogId)?.group))
   .reduce((n,x)=>n+Math.max(0,(x.type==='pavers'||(x.type==='fills'&&x.geometry==='strip'))?lineLength(x.points)*x.width:polygonArea(x.points)-(x.holes||[]).reduce((h,v)=>h+polygonArea(v),0)),0);
  const building=(doc.house?.width||0)*(doc.house?.height||0)+(doc.buildings||[]).reduce((n,b)=>n+b.width*b.height,0);
  return Math.max(0,raw-other-building);
 }
 return raw;
};
export const perimeter=pts=>pts.length<2?0:lineLength(pts)+segmentLength(pts.at(-1),pts[0]);
export const rectBoundary=(width,height)=>[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
export function report(doc){
 const d=normalizeProject(doc),boundary=d.site.boundary||rectBoundary(d.site.width,d.site.height);
 const counts={},lengths={};
 for(const item of d.objects){
  const entry=byId(item.catalogId);if(!entry)continue;
  counts[item.catalogId]=(counts[item.catalogId]||0)+1;
  if(entry.group==='pavers'||(entry.group==='fills'&&item.geometry==='strip'))
   lengths[item.catalogId]=round((lengths[item.catalogId]||0)+lineLength(item.points),2);
 }
 // Authoritative material quantities are based on the actual visible union,
 // clipped to the site and masked by other surfaces and building footprints.
 // This prevents the historical 14 m² sum for 11 m² of overlapping ponds.
 const visible=visibleSurfaceAreas(d);
 const areas=Object.fromEntries(Object.entries(visible.areas).map(([id,m2])=>[id,round(m2,2)]));
 const approximate=visible.precision!=='polygon';
 return {siteArea:round(polygonArea(boundary),2),sitePerimeter:round(perimeter(boundary),2),
  buildingArea:round(d.house.width*d.house.height,2),auxBuildingArea:round(d.buildings.reduce((v,b)=>v+b.width*b.height,0),2),
  counts,areas,lengths,areaPrecision:visible.precision,
  sourcesVerified:d.verified,
  uncertainty:approximate
   ? 'Большой или сложный генплан: площадь пересекающихся поверхностей вычислена численным интегрированием. '+visible.reason
   : 'Площади покрытий и воды вычислены без двойного учёта пересечений по измеряемой геометрии. Скругления дорожек аппроксимированы многогранниками. Требуется проверка исходных размеров участка.'};
}
export const isInside=(p,polygon)=>{
 let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))inside=!inside;
 }return inside;
};
export function coordinateSummary(doc){
 const d=normalizeProject(doc),r=report(d);
 return {version:1,units:'m',site:d.site,house:{...d.house,photo:undefined},buildings:d.buildings.map(b=>({...b,photo:undefined})),objects:d.objects.map(item=>({catalogId:item.catalogId,...item})),measured:{siteArea:r.siteArea,buildingArea:r.buildingArea,counts:r.counts,areas:r.areas,lengths:r.lengths,areaPrecision:r.areaPrecision},verified:d.verified,atmosphere:d.atmosphere};
}

// Project each path segment onto parcel directions. Clamp length, never its axes,
// so a segment reaching the plan border keeps its exact intended angle.
export function snapPathPoint(previous, target, mode, site){
 if(mode==='free')return {...target};
 const boundary=site.boundary;
 const edge=boundary?.length>1?{x:boundary[1].x-boundary[0].x,y:boundary[1].y-boundary[0].y}:{x:1,y:0};
 const base=Math.atan2(edge.y,edge.x),dx=target.x-previous.x,dy=target.y-previous.y;
 const step=mode==='diagonal'?Math.PI/4:Math.PI/2;
 const angle=base+Math.round((Math.atan2(dy,dx)-base)/step)*step;
 const ux=Math.cos(angle),uy=Math.sin(angle);
 let length=Math.max(0,dx*ux+dy*uy);
 for(const [v,u,max] of [[previous.x,ux,site.width],[previous.y,uy,site.height]]){
  if(Math.abs(u)>1e-10)length=Math.min(length,Math.max(0,((u>0?max:0)-v)/u));
 }
 return {x:previous.x+length*ux,y:previous.y+length*uy};
}
export function translatePoints(points,dx,dy,site){
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 dx=Math.max(-Math.min(...xs),Math.min(site.width-Math.max(...xs),dx));
 dy=Math.max(-Math.min(...ys),Math.min(site.height-Math.max(...ys),dy));
 return points.map(p=>({x:p.x+dx,y:p.y+dy}));
}
