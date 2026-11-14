(() => {
'use strict';
const KEY='forma-archviz-flow-v1';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const TYPES={
 source:{title:'Исходник',icon:'▧',kind:'Источник',out:'image',action:'project',text:'Скетч или CAD-скриншот'},
 exterior:{title:'Экстерьер',icon:'⌂',kind:'Рендер',input:'image',out:'image',action:'environment',text:'Дом и участок'},
 interior:{title:'Sketch → Photo',icon:'▣',kind:'Интерьер',input:'image',out:'image',action:'interior',text:'Из скетча в фото'},
 lighting:{title:'Свет / сезоны',icon:'☼',kind:'Сцена',input:'image',out:'image',action:'environment',text:'Дневной, пасмурный, вечер'},
 materials:{title:'Материалы',icon:'▤',kind:'Правки',input:'image',out:'image',action:'materials',text:'Маски и локальные изменения'},
 geometry:{title:'Контроль',icon:'⌗',kind:'Сравнение',input:'image',out:'image',action:'qa',text:'Визуальный контроль контуров'},
 upscale:{title:'Upscale 4K',icon:'↗',kind:'Интеграция',input:'image',out:'image',action:'parameters',text:'AI API подключается отдельно'},
 video:{title:'Анимация',icon:'▶',kind:'Видео',input:'image',out:'video',action:'animation',text:'Камеры и движения'},
 image3d:{title:'Из фото в 3D',icon:'⬡',kind:'Интеграция',input:'image',out:'model',action:'image3d',text:'Требуется 3D API'},
 export:{title:'Экспорт',icon:'⇩',kind:'Результат',input:'any',action:'variants',text:'Файлы и галерея'}
};
const START=[
 {id:'n1',type:'source',x:65,y:250,title:'Исходный скетч'},
 {id:'n2',type:'exterior',x:355,y:140,title:'Фотография дома'},
 {id:'n3',type:'interior',x:355,y:420,title:'Интерьер · Sketch → Photo'},
 {id:'n4',type:'lighting',x:645,y:85,title:'Синий час'},
 {id:'n5',type:'materials',x:645,y:420,title:'Изменить отделку'},
 {id:'n6',type:'video',x:935,y:85,title:'Архитектурное видео'},
 {id:'n7',type:'export',x:935,y:420,title:'Финальный результат'}
];
const START_EDGES=[['n1','n2'],['n1','n3'],['n2','n4'],['n3','n5'],['n4','n6'],['n5','n7']];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function project(){try{return JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}').activeId||'demo'}catch{return 'demo'}}
function initial(){return {nodes:START.map(n=>({...n})),edges:START_EDGES.map(([from,to])=>({from,to})),pan:{x:70,y:35},zoom:.75,count:7,selected:'n3'}}
let graph,modal=null,world=null,lines=null,nodeLayer=null,drag=null,pending=null;
const snapshots=new Map();let dbPromise=null;
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
 snapshots.clear();const db=await mediaDB();if(!db)return;
 await Promise.all(graph.nodes.map(n=>new Promise(resolve=>{
  const tx=db.transaction('images','readonly');
  const req=tx.objectStore('images').get(mediaKey(n.id));
  req.onsuccess=()=>{if(req.result)snapshots.set(n.id,req.result);resolve()};
  req.onerror=()=>resolve();
 })));
 if(modal)redraw();
}
async function pinImage(id){
 const target=node(id),ref=$('#afterImg');
 if(!target||!ref||!ref.src){status('Нет изображения для сохранения в эту ноду');return}
 const image=ref.currentSrc||ref.src;
 if(!image){status('Сначала создайте или выберите изображение');return}
 snapshots.set(id,image);
 const db=await mediaDB();
 if(db){
  try{await new Promise((resolve,reject)=>{
   const tx=db.transaction('images','readwrite');
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   tx.objectStore('images').put(image,mediaKey(id));
  })}catch{status('Кадр отображается, но не удалось сохранить его в памяти')}
 }
 redraw();status('Текущий кадр закреплён за нодой «'+target.title+'».');
}
async function deleteImage(id){
 snapshots.delete(id);const db=await mediaDB();if(!db)return;
 try{const tx=db.transaction('images','readwrite');tx.objectStore('images').delete(mediaKey(id))}catch{}
}
function read(){
 try{const o=JSON.parse(localStorage.getItem(KEY+'-'+project())||'null');if(o&&Array.isArray(o.nodes)&&Array.isArray(o.edges)&&o.nodes.length<=100&&o.edges.length<=180&&o.nodes.every(n=>TYPES[n.type]&&Number.isFinite(n.x)&&Number.isFinite(n.y)))return o}catch{}
 return initial();
}
function save(){try{localStorage.setItem(KEY+'-'+project(),JSON.stringify(graph))}catch{status('Не удалось сохранить схему в браузере')}}
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
  card.innerHTML=`<div class="fa-node-top" data-move="${esc(n.id)}"><span class="fa-node-symbol">${t.icon}</span><div><small>${t.kind}</small><b>${esc(n.title||t.title)}</b></div><button type="button" data-fork="${esc(n.id)}" title="Добавить ответвление">+</button></div>
  <div class="fa-node-picture"><span>${esc(t.text)}</span></div>
  <div class="fa-node-bottom"><button type="button" data-open-step="${esc(n.id)}">Открыть ↗</button><button type="button" data-pin="${esc(n.id)}" title="Закрепить текущий результат в ноде" aria-label="Закрепить текущий кадр">◫</button><button type="button" data-rename="${esc(n.id)}" aria-label="Переименовать ноду">✎</button></div>
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
 drawLines();position();
 $('#faFlowCount').textContent=graph.nodes.length+' нод · '+graph.edges.length+' связей';
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
 const n={id,type,x:parent?parent.x+265:80,y:parent?parent.y+210:80,title:TYPES[type].title};
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
 graph.nodes=graph.nodes.filter(n=>n.id!==graph.selected);
 graph.edges=graph.edges.filter(e=>e.from!==graph.selected&&e.to!==graph.selected);
 graph.selected=graph.nodes[0]?.id||null;pending=null;deleteImage(id);save();redraw();
}
function openStep(id){
 const n=node(id);if(!n)return;
 const action=TYPES[n.type].action;close();
 if(action==='interior'){window.FORMA_INTERIORS?.open?.();return}
 if(action==='qa'){$('#formaQaToggle')?.click();return}
 if(action==='image3d'){window.FORMA_PRO?.open?.('image3d');return}
 if(n.type==='upscale'){window.FORMA_PRO?.open?.('upscale');return}
 document.querySelector('[data-nav="'+action+'"]')?.click();
 if(action==='project')$('#projectUpload')?.focus();
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
  graph={nodes:g.nodes.map(n=>({id:n.id,type:n.type,title:String(n.title||TYPES[n.type].title),x:n.x,y:n.y})),edges:[],selected:g.nodes[0]?.id||null,pan:{x:60,y:50},zoom:.85,count:Math.max(0,...g.nodes.map(n=>Number(n.id.slice(1))))};
  for(const e of g.edges)if(canLink(e.from,e.to)){graph.edges=graph.edges.filter(x=>x.to!==e.to);graph.edges.push({from:e.from,to:e.to})}
  pending=null;save();redraw();status('Рабочая схема загружена.');
 }catch{status('Невозможно импортировать эту схему. Нужен экспорт FORMA ARCHVIZ.')}
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
 if(a.openStep){openStep(a.openStep);return}
 if(a.pin){pinImage(a.pin);return}
 if(a.rename){const n=node(a.rename),title=prompt('Название ноды',n.title);if(title?.trim()){n.title=title.trim().slice(0,70);save();redraw()}return}
}
function down(e){
 if(e.button!==0||e.target.closest('button'))return;
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
 if(e.key==='Escape'){if(pending){pending=null;redraw()}else close()}
 if(e.key==='Delete'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))remove();
}
function open(){
 if(modal)return;
 graph=read();
 modal=document.createElement('div');modal.id='faFlowBackdrop';modal.className='fa-flow-backdrop';
 modal.innerHTML=`<div class="fa-flow-shell" role="dialog" aria-modal="true" aria-label="Нодовый редактор FORMA ARCHVIZ">
 <div class="fa-flow-head"><div class="fa-flow-logo">F</div><div class="fa-flow-name"><b>FORMA ARCHVIZ <span>/ NODES</span></b><small>Профессиональные цепочки визуализации</small></div>
 <div class="fa-flow-head-actions"><button type="button" id="faFlowArrange">Упорядочить</button><button type="button" id="faFlowExport">Экспорт JSON</button><button type="button" id="faFlowImport">Импорт</button><input type="file" id="faFlowFile" accept=".json,application/json" hidden><button type="button" id="faFlowClose" aria-label="Закрыть">×</button></div></div>
 <div class="fa-flow-main"><aside class="fa-flow-sidebar"><h3>Библиотека нод</h3><small>Добавляйте узлы на холст</small><div id="faFlowPalette"></div><div class="fa-flow-note"><b>Как работать</b><p>Потяните карточку за заголовок. Соедините выход одного узла со входом другого. Нода может иметь несколько веток.</p><p>Кнопка «Открыть инструмент» ведёт в настоящий рендер, интерьер, материалы или анимацию.</p><small>Связи — схема проекта, не автоматический запуск AI.</small></div></aside>
 <section class="fa-flow-center"><div class="fa-flow-controls"><span id="faFlowCount">0 нод</span><div><button id="faFlowMinus" type="button">−</button><span id="faFlowZoom">75%</span><button id="faFlowPlus" type="button">+</button><button id="faFlowCenter" type="button">Центр</button></div></div>
 <div id="faFlowViewport" class="fa-flow-viewport" tabindex="0"><div id="faFlowWorld" class="fa-flow-world"><svg id="faFlowLines" width="2600" height="2100" xmlns="http://www.w3.org/2000/svg"></svg><div id="faFlowNodes"></div></div></div>
 <div class="fa-flow-bottom"><span id="faFlowStatus" role="status">Нажмите выход ноды, затем вход другой — связь появится автоматически.</span><button type="button" id="faFlowDelete">Удалить ноду</button></div></section></div></div>`;
 document.body.append(modal);document.body.classList.add('fa-flow-is-open');world=$('#faFlowWorld');lines=$('#faFlowLines');nodeLayer=$('#faFlowNodes');
 const palette=$('#faFlowPalette');
 for(const [id,t] of Object.entries(TYPES)){
  const b=document.createElement('button');b.type='button';b.dataset.addNode=id;b.innerHTML='<i>'+t.icon+'</i><span><b>'+esc(t.title)+'</b><small>'+esc(t.kind)+'</small></span><strong>+</strong>';palette.append(b);
 }
 modal.addEventListener('click',click);
 modal.addEventListener('pointerdown',e=>{if(e.target===modal)close()});
 const viewport=$('#faFlowViewport');
 viewport.addEventListener('pointerdown',down);viewport.addEventListener('pointermove',move);
 viewport.addEventListener('pointerup',up);viewport.addEventListener('pointercancel',up);
 $('#faFlowFile').addEventListener('change',e=>{importJSON(e.target.files?.[0]);e.target.value=''});
 document.addEventListener('keydown',keydown);
 redraw();restoreImages();
}
function close(){if(!modal)return;save();modal.remove();modal=world=lines=nodeLayer=null;drag=pending=null;document.body.classList.remove('fa-flow-is-open');document.removeEventListener('keydown',keydown)}
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
 window.FORMA_NODES={open,close};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();