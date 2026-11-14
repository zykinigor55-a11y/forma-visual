(() => {
'use strict';
const KEY='forma-archviz-flow-v1';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const TYPES={
 source:{title:'Исходник',icon:'▧',kind:'Источник',out:'image',action:'project',text:'Скетч или CAD-скриншот'},
 exterior:{title:'Экстерьер',icon:'⌂',kind:'Рендер',input:'image',out:'image',action:'environment',text:'Дом и участок'},
 interior:{title:'Из скетча в фото',icon:'▣',kind:'Интерьер',input:'image',out:'image',action:'interior',text:'Из скетча в фото'},
 lighting:{title:'Свет / сезоны',icon:'☼',kind:'Сцена',input:'image',out:'image',action:'environment',text:'Дневной, пасмурный, вечер'},
 materials:{title:'Материалы',icon:'▤',kind:'Правки',input:'image',out:'image',action:'materials',text:'Маски и локальные изменения'},
 geometry:{title:'Контроль',icon:'⌗',kind:'Сравнение',input:'image',out:'image',action:'qa',text:'Визуальный контроль контуров'},
 upscale:{title:'Upscale 4K',icon:'↗',kind:'4K локально',input:'image',out:'image',action:'parameters',text:'3840 px · увеличение без AI-детализации'},
 video:{title:'Анимация',icon:'▶',kind:'Видео',input:'image',out:'video',action:'animation',text:'Камеры и движения'},
 image3d:{title:'Из фото в 3D',icon:'⬡',kind:'Интеграция',input:'image',out:'model',action:'image3d',text:'Требуется 3D API'},
 export:{title:'Экспорт',icon:'⇩',kind:'Результат',input:'any',action:'variants',text:'Файлы и галерея'}
};

const ICON_PATHS={
 source:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h5M8 15h8"/>',
 exterior:'<path d="m3 11 9-7 9 7v10H3V11Z"/><path d="M3 11h18M9 21v-7h6v7"/>',
 interior:'<path d="M4 21V4h16v17M4 9h16M8 21v-6h8v6"/>',
 lighting:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
 materials:'<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 geometry:'<path d="M3 3h8v8H3zM13 13h8v8h-8zM11 7h6v6M7 11v6h6"/>',
 upscale:'<path d="M7 17 17 7M9 7h8v8M3 13v8h8M13 3h8v8"/>',
 video:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-3v10l-4-3"/>',
 image3d:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10"/>',
 export:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>'
};
const iconHTML=id=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON_PATHS[id]+'</svg>';

const START=[
 {id:'n1',type:'source',x:65,y:250,title:'Исходный скетч'},
 {id:'n2',type:'exterior',x:355,y:140,title:'Фотография дома'},
 {id:'n3',type:'interior',x:355,y:420,title:'Интерьер · Из скетча в фото'},
 {id:'n4',type:'lighting',x:645,y:85,title:'Синий час'},
 {id:'n5',type:'materials',x:645,y:420,title:'Изменить отделку'},
 {id:'n6',type:'upscale',x:935,y:85,title:'Экспорт · 4K'},
 {id:'n7',type:'export',x:935,y:420,title:'Финальный результат'}
];
const START_EDGES=[['n1','n2'],['n1','n3'],['n2','n4'],['n3','n5'],['n4','n6'],['n6','n7']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function project(){try{return JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}').activeId||'demo'}catch{return 'demo'}}
function initial(){return {nodes:START.map(n=>({...n,options:{}})),edges:START_EDGES.map(([from,to])=>({from,to})),pan:{x:70,y:35},zoom:.75,count:7,selected:'n2'}}
let graph,modal=null,world=null,lines=null,nodeLayer=null,drag=null,pending=null,lastWireDrop=0;
let undoStack=[],redoStack=[],lastGraphJSON='';
const snapshots=new Map(),videoBlobs=new Map(),videoURLs=new Map();let dbPromise=null;
const HISTORY_PREFIX='forma-archviz-node-history-v1-';
function historyIndex(){try{const arr=JSON.parse(localStorage.getItem(HISTORY_PREFIX+project())||'[]');return Array.isArray(arr)?arr.filter(x=>x&&/^n\d+$/.test(x.node)&&/^[a-z0-9_:-]{1,90}$/i.test(x.key)).slice(0,300):[]}catch{return []}}
function historyFor(id){return historyIndex().filter(e=>e.node===id).slice(0,5)}
async function archiveSnapshot(id,image,db){
 if(!db)return;
 const entry={node:id,key:'h_'+id+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),time:Date.now()};
 const all=[entry,...historyIndex()],seen=all.filter(x=>x.node===id);
 const removed=seen.slice(5),remaining=all.filter(x=>!removed.some(d=>d.key===x.key));
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('images','readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  tx.objectStore('images').put(image,mediaKey(entry.key));
 });for(const old of removed){try{const tx=db.transaction('images','readwrite');tx.objectStore('images').delete(mediaKey(old.key))}catch{}}
 localStorage.setItem(HISTORY_PREFIX+project(),JSON.stringify(remaining))}catch{status('Кадр сохранён, но версия в истории могла не сохраниться.')}
}
async function recallHistory(id,key){
 if(!historyFor(id).some(h=>h.key===key)){status('История для выбранной ноды не найдена.');return}
 const db=await mediaDB();if(!db){status('Хранилище версий недоступно.');return}
 const image=await new Promise(resolve=>{const tx=db.transaction('images','readonly');const req=tx.objectStore('images').get(mediaKey(key));req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null)});
 if(!image){status('Этот кадр больше не хранится на устройстве.');return}
 await setSnapshot(id,image);status('Восстановлена версия ноды без AI-запроса.');
}
function mediaDB(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise(resolve=>{
  if(!('indexedDB' in window)){resolve(null);return}
  try{
   const req=indexedDB.open('forma-archviz-node-media-v1',1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images')};
   req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null);
  }catch{resolve(null)}
 });
 return dbPromise;
}
function mediaKey(id){return project()+'__'+id}
async function restoreImages(){
 snapshots.clear();videoBlobs.clear();for(const url of videoURLs.values())URL.revokeObjectURL(url);videoURLs.clear();
 const db=await mediaDB();if(!db)return;
 await Promise.all(graph.nodes.map(n=>new Promise(resolve=>{
  const tx=db.transaction('images','readonly');
  const req=tx.objectStore('images').get(mediaKey(n.id));
  req.onsuccess=()=>{if(req.result)snapshots.set(n.id,req.result);resolve()};
  req.onerror=()=>resolve();
 })));
 await Promise.all(graph.nodes.filter(n=>n.type==='video').map(n=>new Promise(resolve=>{
  const tx=db.transaction('images','readonly'),req=tx.objectStore('images').get(mediaKey(n.id)+'__video');
  req.onsuccess=()=>{if(req.result instanceof Blob){videoBlobs.set(n.id,req.result);videoURLs.set(n.id,URL.createObjectURL(req.result))}resolve()};
  req.onerror=()=>resolve();
 })));
 if(modal)redraw();
}
async function pinImage(id){
 const target=node(id),ref=$('#afterImg');
 if(!target||!ref||!ref.src){status('Нет изображения для сохранения в эту ноду');return}
 const image=ref.currentSrc||ref.src;
 if(!image){status('Сначала создайте или выберите изображение');return}
 await setSnapshot(id,image);
 status('Текущий кадр закреплён за нодой «'+target.title+'».');
}
async function setSnapshot(id,image){
 if(!node(id))throw Error('Нода не найдена');
 if(!/^data:image\/(?:png|jpeg|webp);base64,/i.test(image))throw Error('Для цепочки требуется изображение в PNG, JPG или WEBP');
 if(image.length>24_000_000)throw Error('Слишком большой результат для сохранения в браузере');
 if(snapshots.get(id)===image)return;
 snapshots.set(id,image);
 const db=await mediaDB();
 if(db){
  try{await new Promise((resolve,reject)=>{
   const tx=db.transaction('images','readwrite');
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   tx.objectStore('images').put(image,mediaKey(id));
  })}catch{status('Кадр отображается, но не удалось сохранить его в памяти')}
 }
 await archiveSnapshot(id,image,db);
 redraw();
}
async function setVideoSnapshot(id,blob){
 if(!node(id)||node(id).type!=='video')throw Error('Узел видео не найден.');
 if(!(blob instanceof Blob)||blob.size<1000||blob.size>180*1024*1024)throw Error('Недопустимый размер MP4.');
 const previous=videoURLs.get(id);if(previous)URL.revokeObjectURL(previous);
 videoBlobs.set(id,blob);videoURLs.set(id,URL.createObjectURL(blob));
 const db=await mediaDB();
 if(db){try{await new Promise((resolve,reject)=>{
  const tx=db.transaction('images','readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  tx.objectStore('images').put(blob,mediaKey(id)+'__video');
 })}catch{status('Видео готово, но памяти браузера недостаточно. Скачайте MP4.')}}
 redraw();
}
function downloadVideo(id){
 const video=videoBlobs.get(id);if(!video){status('Сначала создайте видео.');return}
 const url=videoURLs.get(id),a=document.createElement('a');a.href=url;a.download='forma-video-'+Date.now()+'.mp4';document.body.append(a);a.click();a.remove();
}
async function deleteImage(id){
 snapshots.delete(id);videoBlobs.delete(id);if(videoURLs.has(id)){URL.revokeObjectURL(videoURLs.get(id));videoURLs.delete(id)}
 const db=await mediaDB();if(!db)return;
 try{const tx=db.transaction('images','readwrite');tx.objectStore('images').delete(mediaKey(id));tx.objectStore('images').delete(mediaKey(id)+'__video')}catch{}
}
function read(){
 try{const o=JSON.parse(localStorage.getItem(KEY+'-'+project())||'null');if(o&&Array.isArray(o.nodes)&&Array.isArray(o.edges)&&o.nodes.length<=100&&o.edges.length<=180&&o.nodes.every(n=>TYPES[n.type]&&Number.isFinite(n.x)&&Number.isFinite(n.y)))return o}catch{}
 return initial();
}
function save(){
 try{
  const json=JSON.stringify(graph);
  if(lastGraphJSON&&json!==lastGraphJSON){undoStack.push(lastGraphJSON);if(undoStack.length>70)undoStack.shift();redoStack=[]}
  lastGraphJSON=json;localStorage.setItem(KEY+'-'+project(),json);
 }catch{status('Не удалось сохранить схему в браузере')}
}
function stepHistory(direction){
 const from=direction==='undo'?undoStack:redoStack,to=direction==='undo'?redoStack:undoStack;
 if(!from.length){status(direction==='undo'?'Отменять больше нечего.':'Нет действий для повтора.');return}
 to.push(JSON.stringify(graph));graph=JSON.parse(from.pop());lastGraphJSON=JSON.stringify(graph);
 try{localStorage.setItem(KEY+'-'+project(),lastGraphJSON)}catch{}
 pending=null;redraw();
 status(direction==='undo'?'Последнее действие отменено.':'Действие восстановлено.');
}
function node(id){return graph.nodes.find(n=>n.id===id)}
function canLink(from,to){
 if(from===to)return false;
 const a=node(from),b=node(to);if(!a||!b||!TYPES[a.type].out||!TYPES[b.type].input)return false;
 if(TYPES[b.type].input!=='any'&&TYPES[b.type].input!==TYPES[a.type].out)return false;
 const stack=[to],seen=new Set();
 while(stack.length){const id=stack.pop();if(id===from)return false;if(seen.has(id))continue;seen.add(id);graph.edges.filter(e=>e.from===id).forEach(e=>stack.push(e.to))}
 return true;
}
function status(str){const s=$('#faFlowStatus');if(s)s.textContent=str}
function redraw(){
 if(!modal)return;
 nodeLayer.replaceChildren();
 for(const n of graph.nodes){
  const t=TYPES[n.type],card=document.createElement('div');
  card.className='fa-node'+(graph.selected===n.id?' selected':'');
  card.style.left=n.x+'px';card.style.top=n.y+'px';card.dataset.node=n.id;
  card.innerHTML=`<div class="fa-node-top" data-move="${esc(n.id)}"><span class="fa-node-symbol">${iconHTML(n.type)}</span><div><small>${t.kind}</small><b>${esc(n.title||t.title)}</b></div><button type="button" data-fork="${esc(n.id)}" title="Добавить ответвление">+</button></div>
  <div class="fa-node-picture"><span>${esc(t.text)}</span></div>
  <div class="fa-node-bottom"><button type="button" data-run-node="${esc(n.id)}" title="Запустить ветку до этой ноды">▶ Запуск</button><button type="button" data-open-step="${esc(n.id)}">⚙ Настроить</button><button type="button" data-pin="${esc(n.id)}" title="Закрепить текущий результат в ноде" aria-label="Закрепить текущий кадр">◫</button><button type="button" data-rename="${esc(n.id)}" aria-label="Переименовать ноду">✎</button></div>
  ${t.input?`<button type="button" class="fa-node-port input" data-port-in="${esc(n.id)}" aria-label="Вход"></button>`:''}
  ${t.out?`<button type="button" class="fa-node-port output ${pending===n.id?'pending':''}" data-port-out="${esc(n.id)}" aria-label="Выход"></button>`:''}`;
  nodeLayer.append(card);
  const pic=$('.fa-node-picture',card);
  if(n.type==='source'||['exterior','interior','lighting','materials','geometry','upscale','video','export'].includes(n.type)){
   const ref=n.type==='source'?$('#beforeImg'):null;
   const image=snapshots.get(n.id)||(ref&&(ref.currentSrc||ref.src))||'';
   if(image){pic.style.backgroundImage='linear-gradient(0deg,#071d1dcc,#071d1c0c),url("'+String(image).replace(/["']/g,'')+'")';pic.classList.add('has-image')}
  }
 }
 for(const card of nodeLayer.querySelectorAll('.fa-node[data-node]')){
  const n=node(card.dataset.node),url=n?.type==='video'?videoURLs.get(n.id):null;
  if(url){const pic=card.querySelector('.fa-node-picture');pic.classList.add('has-video');
   pic.innerHTML='<video controls muted playsinline preload="metadata" src="'+url+'" aria-label="Готовое видео ноды"></video>';
  }
 }
 drawLines();position();
 $('#faFlowCount').textContent=graph.nodes.length+' нод · '+graph.edges.length+' связей';
 window.FORMA_NODE_ENGINE?.onGraphDrawn?.(graph);
}
function drawLines(){
 if(!lines)return;
 lines.replaceChildren();
 for(const e of graph.edges){
  const a=node(e.from),b=node(e.to);if(!a||!b)continue;
  const x=a.x+230,y=a.y+80,xx=b.x,yy=b.y+80,ctrl=Math.max(70,Math.abs(xx-x)*.47);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d',`M${x} ${y} C${x+ctrl} ${y},${xx-ctrl} ${yy},${xx} ${yy}`);
  p.setAttribute('class','fa-flow-link');lines.append(p);
 }
}
function position(){if(world)world.style.transform=`translate(${graph.pan.x}px,${graph.pan.y}px) scale(${graph.zoom})`;if($('#faFlowZoom'))$('#faFlowZoom').textContent=Math.round(graph.zoom*100)+'%'}
function add(type,from=null){
 if(graph.nodes.length>=100){status('Достигнут лимит 100 нод');return}
 const parent=node(from||graph.selected),id='n'+(++graph.count);
 const n={id,type,x:parent?parent.x+265:80,y:parent?parent.y+210:80,title:TYPES[type].title,options:{}};
 graph.nodes.push(n);graph.selected=id;
 if(from&&canLink(from,id))graph.edges.push({from,to:id});
 save();redraw();status('Нода добавлена. Соединения сохраняются на этом устройстве.');
}
function link(a,b){
 if(!canLink(a,b)){status('Несовместимые данные или циклическая связь.');return}
 graph.edges=graph.edges.filter(e=>e.to!==b);
 graph.edges.push({from:a,to:b});pending=null;save();redraw();status('Соединение создано.');
}
function remove(){
 if(!graph.selected)return;
 const id=graph.selected;
 graph.nodes=graph.nodes.filter(n=>n.id!==id);
 graph.edges=graph.edges.filter(e=>e.from!==id&&e.to!==id);
 graph.selected=graph.nodes[0]?.id||null;pending=null;deleteImage(id);save();redraw();
}
function openStep(id){
 const n=node(id);if(!n)return;
 graph.selected=id;save();redraw();
 const inspector=$('#faFlowInspector');
 if(inspector){inspector.classList.add('fa-inspector-active');inspector.scrollTop=0;}
 status('Настройте «'+n.title+'» справа и запустите этот этап или целую ветку.');
}
// A/B comparison uses the actual saved images attached to graph nodes.
let comparePanel=null;
const compareSlots={a:null,b:null};
function addCompare(id){
 if(!snapshots.has(id)){status('Сначала запустите узел или закрепите в нём результат.');return}
 if(compareSlots.a===id)return showCompare();
 if(!compareSlots.a)compareSlots.a=id;
 else if(!compareSlots.b)compareSlots.b=id;
 else {compareSlots.a=compareSlots.b;compareSlots.b=id}
 showCompare();
}
function showCompare(){
 if(!modal)return;
 const ids=graph.nodes.filter(n=>snapshots.has(n.id));
 if(!compareSlots.a||!snapshots.has(compareSlots.a))compareSlots.a=ids[0]?.id||null;
 if(!compareSlots.b||!snapshots.has(compareSlots.b))compareSlots.b=ids.find(n=>n.id!==compareSlots.a)?.id||null;
 comparePanel?.remove();comparePanel=document.createElement('div');
 comparePanel.className='fa-compare-backdrop';comparePanel.setAttribute('role','dialog');
 comparePanel.setAttribute('aria-modal','true');comparePanel.setAttribute('aria-label','Сравнение архитектурных кадров');
 const selector=(slot,value)=>'<select aria-label="Выберите вариант '+slot+'" data-fa-compare-choice="'+slot+'">'+
  '<option value="">Выберите кадр</option>'+ids.map(n=>'<option value="'+esc(n.id)+'"'+(value===n.id?' selected':'')+'>'+esc(n.title)+'</option>').join('')+'</select>';
 const view=(slot,id)=>'<div class="fa-compare-slot"><div class="fa-compare-slot-title"><b>ВАРИАНТ '+slot.toUpperCase()+'</b>'+selector(slot,id)+'</div>'+
 (id&&snapshots.has(id)?'<img src="'+snapshots.get(id)+'" alt="Архитектурная визуализация '+slot+'">':'<div class="fa-compare-empty">Нет выбранного кадра</div>')+'</div>';
 comparePanel.innerHTML='<div class="fa-compare-window"><header><div><small>ФОРМА / ВИЗУАЛЬНЫЙ КОНТРОЛЬ</small><h2>Сравнение A / B</h2></div><button type="button" data-fa-compare-close aria-label="Закрыть сравнение">×</button></header>'+
 (ids.length?'<div class="fa-compare-grid">'+view('a',compareSlots.a)+view('b',compareSlots.b)+'</div>':'<p class="fa-compare-empty">Выполните хотя бы один этап нодовой цепочки, чтобы сравнить полученные кадры.</p>')+
 '<footer>Сравнивайте ракурс, формы окон, кровлю, материалы, освещение и детали окружения.</footer></div>';
 document.body.append(comparePanel);
 comparePanel.addEventListener('click',e=>{if(e.target===comparePanel||e.target.closest('[data-fa-compare-close]')){comparePanel.remove();comparePanel=null}});
 comparePanel.addEventListener('change',e=>{const el=e.target.closest('[data-fa-compare-choice]');if(!el)return;compareSlots[el.dataset.faCompareChoice]=el.value||null;showCompare()});
}

function exportJSON(){
 const payload={format:'forma-archviz-node-graph',version:1,project:project(),graph};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='forma-archviz-workflow.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
async function importJSON(file){
 if(!file||file.size>900000){status('Файл должен быть JSON размером до 900 KB');return}
 try{
  const v=JSON.parse(await file.text()),g=v.graph;
  if(v.format!=='forma-archviz-node-graph'||!Array.isArray(g?.nodes)||!Array.isArray(g?.edges)||g.nodes.length>100||g.edges.length>180)throw Error();
  const ids=new Set(g.nodes.map(n=>n.id));
  if(ids.size!==g.nodes.length||!g.nodes.every(n=>TYPES[n.type]&&/^n\d+$/.test(n.id)&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Math.abs(n.x)<10000&&Math.abs(n.y)<10000&&String(n.title||'').length<90))throw Error();
  if(!g.edges.every(e=>ids.has(e.from)&&ids.has(e.to)))throw Error();
  graph={nodes:g.nodes.map(n=>({id:n.id,type:n.type,title:String(n.title||TYPES[n.type].title),x:n.x,y:n.y,options:typeof n.options==='object'&&n.options&&!Array.isArray(n.options)?Object.fromEntries(Object.entries(n.options).filter(([k,v])=>/^(mood|room|style|lighting|zone|instruction|reuse)$/.test(k)&&['boolean','string'].includes(typeof v)).map(([k,v])=>[k,typeof v==='string'?v.slice(0,500):v])):{}})),edges:[],selected:g.nodes[0]?.id||null,pan:{x:60,y:50},zoom:.85,count:Math.max(0,...g.nodes.map(n=>Number(n.id.slice(1))))};
  for(const e of g.edges)if(canLink(e.from,e.to)){graph.edges=graph.edges.filter(x=>x.to!==e.to);graph.edges.push({from:e.from,to:e.to})}
  pending=null;save();redraw();status('Рабочая схема загружена.');
 }catch{status('Невозможно импортировать эту схему. Нужен экспорт ФОРМА.')}
}
function arrange(){
 const indeg=new Map(graph.nodes.map(n=>[n.id,0])),depth=new Map(graph.nodes.map(n=>[n.id,0]));
 graph.edges.forEach(e=>indeg.set(e.to,(indeg.get(e.to)||0)+1));
 const queue=graph.nodes.filter(n=>indeg.get(n.id)===0).map(n=>n.id);
 for(let i=0;i<queue.length;i++){
  const id=queue[i];for(const e of graph.edges.filter(e=>e.from===id)){depth.set(e.to,Math.max(depth.get(e.to)||0,(depth.get(id)||0)+1));indeg.set(e.to,indeg.get(e.to)-1);if(indeg.get(e.to)===0)queue.push(e.to)}
 }
 const cols=new Map();
 graph.nodes.forEach(n=>{const d=depth.get(n.id)||0;if(!cols.has(d))cols.set(d,[]);cols.get(d).push(n)});
 for(const [d,ns] of cols)ns.forEach((n,i)=>{n.x=55+d*267;n.y=45+i*215});
 graph.pan={x:60,y:40};graph.zoom=.78;save();redraw();
}
function click(e){
 const b=e.target.closest('button');if(!b)return;
 const a=b.dataset;
 if(b.id==='faFlowClose'){close();return}
 if(b.id==='faFlowRunChain'){window.FORMA_NODE_ENGINE?.runTo?.(graph.selected);return}
 if(b.id==='faFlowUndo'){stepHistory('undo');return}
 if(b.id==='faFlowRedo'){stepHistory('redo');return}
 if(b.id==='faFlowCompare'){showCompare();return}
 if(b.id==='faFlowStopChain'){window.FORMA_NODE_ENGINE?.stop?.();return}
 if(b.id==='faFlowExport'){exportJSON();return}
 if(b.id==='faFlowImport'){$('#faFlowFile')?.click();return}
 if(b.id==='faFlowArrange'){arrange();return}
 if(b.id==='faFlowDelete'){remove();return}
 if(b.id==='faFlowCenter'){graph.pan={x:40,y:40};graph.zoom=.78;save();position();return}
 if(b.id==='faFlowPlus'||b.id==='faFlowMinus'){graph.zoom=Math.max(.3,Math.min(1.5,graph.zoom*(b.id==='faFlowPlus'?1.2:1/1.2)));save();position();return}
 if(a.addNode){add(a.addNode);return}
 if(a.fork){add('exterior',a.fork);return}
 if(a.portOut){pending=a.portOut;redraw();status('Выберите вход другой ноды или нажмите Escape.');return}
 if(a.portIn){if(pending)link(pending,a.portIn);else status('Сначала нажмите выход исходной ноды.');return}
 if(a.runNode){window.FORMA_NODE_ENGINE?.runTo?.(a.runNode);return}
 if(a.openStep){openStep(a.openStep);return}
 if(a.pin){pinImage(a.pin);return}
 if(a.rename){const n=node(a.rename),title=prompt('Название ноды',n.title);if(title?.trim()){n.title=title.trim().slice(0,70);save();redraw()}return}
}
function down(e){
 if(e.button!==0||e.target.closest('button,video,select,textarea,input'))return;
 const head=e.target.closest('[data-move]'),n=head?node(head.dataset.move):null;
 if(n){graph.selected=n.id;drag={kind:'node',id:n.id,x:e.clientX,y:e.clientY,ox:n.x,oy:n.y};}
 else if(!e.target.closest('.fa-node'))drag={kind:'pan',x:e.clientX,y:e.clientY,ox:graph.pan.x,oy:graph.pan.y};
 else {graph.selected=e.target.closest('[data-node]')?.dataset.node;redraw();return}
 if(drag)$('#faFlowViewport').setPointerCapture(e.pointerId);
}
function move(e){
 if(!drag)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(drag.kind==='node'){
  const n=node(drag.id);if(!n)return;
  n.x=Math.round(drag.ox+dx/graph.zoom);n.y=Math.round(drag.oy+dy/graph.zoom);
  const el=nodeLayer.querySelector('[data-node="'+n.id+'"]');if(el){el.style.left=n.x+'px';el.style.top=n.y+'px'}
  drawLines();
 } else {graph.pan={x:drag.ox+dx,y:drag.oy+dy};position()}
}
function up(){if(drag){save();redraw()}drag=null}
function keydown(e){
 const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
 if(!editing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();stepHistory(e.shiftKey?'redo':'undo');return}
 if(!editing&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();stepHistory('redo');return}
 if(e.key==='Escape'){if(pending){pending=null;redraw()}else close()}
 if(e.key==='Delete'&&!editing)remove();
}
function open(){
 if(modal)return;
 graph=read();lastGraphJSON=JSON.stringify(graph);undoStack=[];redoStack=[];
 modal=document.createElement('div');modal.id='faFlowBackdrop';modal.className='fa-flow-backdrop';
 modal.innerHTML=`<div class="fa-flow-shell" role="dialog" aria-modal="true" aria-label="Нодовый редактор ФОРМА">
 <div class="fa-flow-head"><div class="fa-flow-logo"><img src="assets/brand/forma-fa-mark.svg" alt="" width="29" height="29"></div><div class="fa-flow-name"><b>ФОРМА <span>/ НОДЫ</span></b><small>Профессиональные цепочки визуализации</small></div>
 <div class="fa-flow-head-actions"><button type="button" id="faFlowCompare" title="Сравнение двух результатов">Сравнение A/B</button><button type="button" id="faFlowRunChain" class="fa-flow-run-main" title="Запустить ветку до выделенной ноды">▶ Запустить</button><button type="button" id="faFlowStopChain" class="fa-flow-stop-main" disabled>Стоп</button><button type="button" id="faFlowArrange">Упорядочить</button><button type="button" id="faFlowExport">Экспорт JSON</button><button type="button" id="faFlowImport">Импорт</button><input type="file" id="faFlowFile" accept=".json,application/json" hidden><button type="button" id="faFlowClose" aria-label="Закрыть">×</button></div></div>
 <div class="fa-flow-main"><aside class="fa-flow-sidebar"><h3>Библиотека нод</h3><small>Добавляйте узлы на холст</small><div id="faFlowPalette"></div><div class="fa-flow-note"><b>Как работать</b><p>Добавьте операцию и соедините её вход с выходом предыдущей. Один исходник может запускать несколько веток.</p><small>Настройки справа. Результаты хранятся в нодах. Новые AI-этапы оплачиваются отдельно после подтверждения.</small></div></aside>
 <section class="fa-flow-center"><div class="fa-flow-controls"><span id="faFlowCount">0 нод</span><div><button type="button" id="faFlowUndo" title="Отменить Ctrl+Z" aria-label="Отменить действие">↶</button><button type="button" id="faFlowRedo" title="Повторить Ctrl+Shift+Z" aria-label="Повторить действие">↷</button><button id="faFlowMinus" type="button">−</button><span id="faFlowZoom">75%</span><button id="faFlowPlus" type="button">+</button><button id="faFlowCenter" type="button">Центр</button></div></div>
 <div id="faFlowViewport" class="fa-flow-viewport" tabindex="0"><div id="faFlowWorld" class="fa-flow-world"><svg id="faFlowLines" width="2600" height="2100" xmlns="http://www.w3.org/2000/svg"></svg><div id="faFlowNodes"></div></div></div>
 <div class="fa-flow-bottom"><span id="faFlowStatus" role="status">Выберите ноду, настройте её справа и запустите ветку.</span><button type="button" id="faFlowDelete">Удалить ноду</button></div></section><aside class="fa-flow-inspector" id="faFlowInspector"><div class="fa-inspector-header"><small>ФОРМА / ПАРАМЕТРЫ</small><h3 id="faFlowInspectorTitle">Выберите этап</h3><p>Параметры, история и готовые результаты остаются на рабочем холсте.</p></div><div id="faFlowNodeSettings" class="fa-flow-node-settings" aria-label="Настройки выбранного этапа"></div></aside></div></div>`;
 document.body.append(modal);document.body.classList.add('fa-flow-is-open');world=$('#faFlowWorld');lines=$('#faFlowLines');nodeLayer=$('#faFlowNodes');
 const palette=$('#faFlowPalette');
 for(const [id,t] of Object.entries(TYPES)){
  const b=document.createElement('button');b.type='button';b.dataset.addNode=id;b.innerHTML='<i>'+iconHTML(id)+'</i><span><b>'+esc(t.title)+'</b><small>'+esc(t.kind)+'</small></span><strong>+</strong>';palette.append(b);
 }
 modal.addEventListener('click',click);
 modal.addEventListener('pointerdown',e=>{if(e.target===modal)close()});
 const viewport=$('#faFlowViewport');
 viewport.addEventListener('pointerdown',down);viewport.addEventListener('pointermove',move);
 viewport.addEventListener('pointerup',up);viewport.addEventListener('pointercancel',up);
 $('#faFlowFile').addEventListener('change',e=>{importJSON(e.target.files?.[0]);e.target.value=''});
 document.addEventListener('keydown',keydown);
 redraw();restoreImages();
 window.FORMA_NODE_ENGINE?.onOpen?.();
}
function close(){if(!modal)return;comparePanel?.remove();comparePanel=null;window.FORMA_NODE_ENGINE?.onClose?.();save();modal.remove();modal=world=lines=nodeLayer=null;drag=pending=null;document.body.classList.remove('fa-flow-is-open');document.removeEventListener('keydown',keydown)}
function init(){
 const actions=$('.forma-context-actions');
 if(actions){
  const b=document.createElement('button');b.type='button';b.className='forma-mini-btn fa-flow-launch';b.innerHTML='⬡ Ноды';b.addEventListener('click',open);
  const c=actions.querySelector('[data-studio-action="commands"]');if(c)actions.insertBefore(b,c);else actions.append(b);
 }
 const nav=$('.rail-nav');
 if(nav){
  const b=document.createElement('button');b.type='button';b.className='rail-btn fa-flow-rail';
  b.innerHTML='<svg class="ico"><use href="#i-layer"/></svg><span class="rail-name">Ноды</span>';b.title='Нодовый редактор';b.setAttribute('aria-label',b.title);
  b.addEventListener('click',open);nav.append(b);
 }
 const mobile=$('.mobile-nav');
 if(mobile){
  const b=document.createElement('button');b.type='button';b.innerHTML='<svg class="ico"><use href="#i-layer"/></svg><span>Ноды</span>';
  b.className='fa-flow-mobile';b.addEventListener('click',open);mobile.append(b);
 }
 window.FORMA_NODES={open,close,graph:()=>graph, getNode:id=>node(id),setOptions:(id,changes)=>{const n=node(id);if(!n)return; n.options={...(n.options||{}),...changes};save();redraw()}, getSnapshot:id=>snapshots.get(id)||null,setSnapshot,getVideoURL:id=>videoURLs.get(id)||null,getVideoBlob:id=>videoBlobs.get(id)||null,setVideoSnapshot,downloadVideo,restoreImages,historyFor,recallHistory,save,redraw,showStatus:status,addCompare,showCompare,isOpen:()=>!!modal};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();