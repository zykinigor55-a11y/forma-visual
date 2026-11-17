import {GROUPS,CATALOG,byId,freshProject,normalizeProject,report,lineLength,polygonArea,areaFor,rectBoundary,coordinateSummary} from './forma-landscape-project-core.js';
import {assetSVG,iconURL,roofingSVG} from './forma-landscape-project-graphics.js';

 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),num=(v,d=2)=>Number(v).toFixed(d);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>'o-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 let modal=null,doc=freshProject(),pid='',mode='select',category='trees',chosen='pine',points=[],selected=null,drag=null,undo=[],redo=[],busy=false,preview=null,roofArt=null,roofArts=new Map(),snap=true;
 let lastFocus=null;
 const siteKey=()=>`forma-landscape-masterplan-v1-${pid}`;
 const activeProject=()=>{try{return JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}').activeId||'landscape'}catch{return 'landscape'}};
 function save(){try{localStorage.setItem(siteKey(),JSON.stringify(doc))}catch{say('Не удалось сохранить проект локально. Экспортируйте JSON.');}}
 function say(str){const el=$('#lpStatus',modal);if(el)el.textContent=str}
 function checkpoint(){undo.push(JSON.stringify(doc));if(undo.length>40)undo.shift();redo=[]}
 function reverse(which){const from=which==='undo'?undo:redo,to=which==='undo'?redo:undo;if(!from.length)return;say('Восстановлена версия схемы.');to.push(JSON.stringify(doc));doc=normalizeProject(JSON.parse(from.pop()));selected=null;points=[];save();draw();}
 const metric=(p)=>num(p.x,3)+','+num(p.y,3),poly=arr=>arr.map(metric).join(' '),dline=arr=>arr.map((p,i)=>(i?'L':'M')+metric(p)).join(' ');
 const itemCatalog=()=>byId(chosen);
 function selectedColor(){return byId(chosen)?.color||'#8eaa85'}
 function drawSvg(){
  const w=doc.site.width,h=doc.site.height,max=Math.max(w,h),fs=Math.max(.4,Math.min(w,h)*.027),bound=doc.site.boundary||rectBoundary(w,h);
  const grid=max>140?5:max>80?2:1;
  let shapes=`<defs><pattern id="lpGrid" width="${grid}" height="${grid}" patternUnits="userSpaceOnUse"><path d="M${grid} 0H0V${grid}" fill="none" stroke="#71836b" stroke-width="${Math.max(.025,grid*.015)}" stroke-opacity=".3"/></pattern></defs><rect width="${w}" height="${h}" fill="#e9e9df"/>`;
  if(doc.underlay&&!preview)shapes+=`<image href="${doc.underlay}" width="${w}" height="${h}" opacity="${doc.underlayOpacity}" preserveAspectRatio="none"/>`;
  shapes+=`<rect width="${w}" height="${h}" fill="url(#lpGrid)"/>`;
  if(preview)shapes+=`<image href="${preview}" width="${w}" height="${h}" opacity=".92" preserveAspectRatio="none"/>`;
  shapes+=`<polygon points="${poly(bound)}" fill="${preview?'#e8f1db0d':'#c1d8b0b8'}" stroke="#447754" stroke-width="${Math.max(.08,max*.0025)}"/>`;
  for(const item of doc.objects){
   const entry=byId(item.catalogId);if(!entry)continue;
   const active=item.id===selected,alpha=preview?.25:1;
   if(entry.group==='pavers'){
    shapes+=`<path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="#4f4a41" stroke-width="${item.width+.1}" stroke-linecap="round" stroke-linejoin="round" opacity="${alpha}"/><path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="${entry.color}" stroke-width="${item.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${alpha}"/>`;
   }else if(['fills','lawns','ponds'].includes(entry.group)){
    shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}" fill="${entry.color}" fill-opacity="${preview?.18:.85}" stroke="${active?'#dfaa58':'#5b7558'}" stroke-width="${active?.16:.065}"/>`;
    if(!preview){shapes+=`<defs><pattern id="tile-${item.id}" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><image href="${iconURL(entry)}" width="2.4" height="2.4"/></pattern></defs><polygon data-object="${item.id}" points="${poly(item.points)}" fill="url(#tile-${item.id})" opacity=".46"/>`;}
   }else{
    const d=entry.group==='lights'?Math.max(.75,item.diameter):item.diameter;
    shapes+=`<g data-object="${item.id}" transform="rotate(${item.rotation} ${item.x} ${item.y})"><image href="${iconURL(entry)}" x="${item.x-d/2}" y="${item.y-d/2}" width="${d}" height="${d}"/></g>`;
    if(active)shapes+=`<circle cx="${item.x}" cy="${item.y}" r="${d/2+.15}" fill="none" stroke="#c68f48" stroke-width=".14" stroke-dasharray=".28 .2" pointer-events="none"/>`;
   }
   if(active&&item.points)for(const [i,p] of item.points.entries())shapes+=`<circle data-vertex="${i}" data-object="${item.id}" cx="${p.x}" cy="${p.y}" r="${Math.min(.3,max*.01)}" fill="#fff7e2" stroke="#b47b37" stroke-width=".08"/>`;
  }
  const house=doc.house,w2=house.width/2,h2=house.height/2;
  shapes+=`<g data-house="yes" transform="translate(${house.x} ${house.y}) rotate(${house.rotation})"><rect x="${-w2-.13}" y="${-h2-.13}" width="${house.width+.26}" height="${house.height+.26}" fill="#282c2d" stroke="${selected==='house'?'#edab57':'#f5eee0'}" stroke-width="${selected==='house'?.25:.1}"/>`;
  if(roofArt)shapes+=`<image href="${roofArt}" x="${-w2}" y="${-h2}" width="${house.width}" height="${house.height}" preserveAspectRatio="none"/>`;
  else shapes+=roofingSVG(house);
  shapes+='</g>';
   for(const b of doc.buildings){
    const bw=b.width/2,bh=b.height/2,art=roofArts.get(b.id);
    shapes+=`<g data-building='${b.id}' transform='translate(${b.x} ${b.y}) rotate(${b.rotation})'><rect x='${-bw-.1}' y='${-bh-.1}' width='${b.width+.2}' height='${b.height+.2}' fill='#252a2b' stroke='${selected==='building:'+b.id?'#eaae5b':'#f4ebdc'}' stroke-width='${selected==='building:'+b.id?.17:.10}'/>`;
    shapes+=art?`<image href='${art}' x='${-bw}' y='${-bh}' width='${b.width}' height='${b.height}' preserveAspectRatio='none'/>`:roofingSVG(b);
    shapes+=`</g><text x='${b.x}' y='${b.y}' font-size='${fs*.56}' fill='#fff5df' stroke='#1e2421' stroke-width='.1' paint-order='stroke' text-anchor='middle'>${({house:'ДОМ',bath:'БАНЯ',garage:'ГАРАЖ',gazebo:'БЕСЕДКА',outbuilding:'ПОСТРОЙКА'})[b.type]}</text>`;
   }
  shapes+=`<text x="${house.x}" y="${house.y}" font-size="${fs*.65}" fill="#fff7dc" stroke="#201b18" stroke-width=".1" paint-order="stroke" text-anchor="middle" font-weight="700">${({house:'ДОМ',bath:'БАНЯ',garage:'ГАРАЖ',gazebo:'БЕСЕДКА',outbuilding:'ПОСТРОЙКА'})[house.type]}</text>`;
  shapes+=`<g fill="#3e5544" font-size="${fs*.7}" font-family="Arial,sans-serif"><text x="${w*.5}" y="${h*.02+fs*.8}" text-anchor="middle">${num(w)} м</text><text x="${fs*.6}" y="${h*.5}" text-anchor="middle" transform="rotate(-90 ${fs*.6} ${h*.5})">${num(h)} м</text></g>`;
  shapes+=`<g transform="translate(${w*.92} ${h*.1}) rotate(${doc.north})"><path d="M0 -1L-.22 .6L0 .3L.22 .6Z" fill="#263a2a"/><text y="-1.3" text-anchor="middle" font-size="${fs*.7}" fill="#263a2a">С</text></g>`;
  if(points.length){
   shapes+=`<path d="${dline(points)}" fill="none" stroke="#c47c32" stroke-width="${mode==='path'?Math.max(.35,Number($('#lpPathWidth',modal)?.value)||1.2):.12}" stroke-dasharray=".25 .15"/>`;
   for(const p of points)shapes+=`<circle cx="${p.x}" cy="${p.y}" r=".18" fill="#fff0c5" stroke="#a46e35" stroke-width=".06"/>`;
  }
  return `<svg id="lpSvg" xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${shapes}</svg>`;
 }
 function position(e){
  const svg=$('#lpSvg',modal);if(!svg)return null;const m=svg.getScreenCTM();if(!m)return null;
  const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const v=p.matrixTransform(m.inverse());
  return {x:clamp(snap?Math.round(v.x*20)/20:v.x,0,doc.site.width),y:clamp(snap?Math.round(v.y*20)/20:v.y,0,doc.site.height)};
 }
 function drawMap(){
  const canvas=$('#lpMap',modal);if(!canvas)return;
  canvas.innerHTML=drawSvg();$('#lpSvg',modal).addEventListener('pointerdown',startPointer);
  $('#lpSvg',modal).addEventListener('pointermove',movePointer);$('#lpSvg',modal).addEventListener('pointerup',endPointer);$('#lpSvg',modal).addEventListener('pointercancel',endPointer);
  const s=$('#lpSourceState',modal);if(s)s.textContent=`${num(doc.site.width)} × ${num(doc.site.height)} м · ${doc.verified?'Размеры подтверждены':'Требуется сверка размеров'}`;
 }
 function drawPalette(){
  const target=$('#lpPalette',modal);if(!target)return;
  target.innerHTML='<div class="lp-groups">'+GROUPS.map(g=>`<button class="${category===g.id?'active':''}" data-category="${g.id}"><strong>${g.symbol}</strong>${g.name}<small>${g.qty}</small></button>`).join('')+'</div><div class="lp-assets">'+CATALOG.filter(x=>x.group===category).map(x=>`<button class="${chosen===x.id?'active':''}" data-asset="${x.id}"><img src="${iconURL(x)}" alt="${esc(x.name)} · строго сверху" loading="lazy"><span>${esc(x.name)}</span></button>`).join('')+'</div>';
  $$('.lp-tools button[data-tool]',modal).forEach(b=>b.classList.toggle('active',b.dataset.tool===mode));
  $('#lpFinish',modal).disabled=points.length<(mode==='path'?2:3);
  $('#lpCancel',modal).disabled=!points.length;
  const t=$('#lpToolName',modal);if(t)t.textContent=({select:'Выбор и перемещение',place:'Размещение объекта',path:'Дорожка · точки оси',area:'Замкнутый контур',boundary:'Границы участка'})[mode]||mode;
 }
 function field(name,label,value,min,max,step=.05){return `<label>${label}<input data-field="${name}" type="number" value="${value}" min="${min}" max="${max}" step="${step}"></label>`}
 function drawInspector(){
  const root=$('#lpInspector',modal);if(!root)return;
  const h=doc.house,r=report(doc);
  let html=`<h3>Параметры</h3><section><strong>УЧАСТОК · МЕТРЫ</strong><div class="lp-two">${field('site.width','Ширина, м',doc.site.width,5,500)}${field('site.height','Длина, м',doc.site.height,5,500)}</div>${field('north','Север · поворот °',doc.north,-360,360,1)}<label class="lp-check"><input type="checkbox" data-field="verified" ${doc.verified?'checked':''}> Размеры проверены</label><small>Снимок без измерений не считается точной геометрией. Масштаб не меняет размеры объектов.</small></section>`;
  if(doc.site.boundary)html+=`<section><strong>УГЛЫ ГРАНИЦЫ · КООРДИНАТЫ В МЕТРАХ</strong><p>Введите точные координаты каждого угла участка.</p><div class='lp-vertices'>${doc.site.boundary.map((p,i)=>`<div><span>${i+1}</span><input type='number' aria-label='X угла ${i+1}' data-boundary='${i}' data-axis='x' step='.05' value='${p.x}'><input type='number' aria-label='Y угла ${i+1}' data-boundary='${i}' data-axis='y' step='.05' value='${p.y}'></div>`).join('')}</div></section>`;
  html+=`<section><strong>СТРОЕНИЕ · ВИД СВЕРХУ</strong><label>Тип<select data-field="house.type">${[['house','Дом'],['bath','Баня'],['garage','Гараж'],['gazebo','Беседка'],['outbuilding','Хозпостройка']].map(([v,t])=>`<option value="${v}" ${h.type===v?'selected':''}>${t}</option>`).join('')}</select></label><div class="lp-two">${field('house.width','Ширина м',h.width,2,60)}${field('house.height','Длина м',h.height,2,60)}</div><div class="lp-two">${field('house.x','X центра м',h.x,0,500)}${field('house.y','Y центра м',h.y,0,500)}</div>${field('house.rotation','Поворот °',h.rotation,-360,360,1)}<label>Кровля<select data-field="house.roof"><option value="gable" ${h.roof==='gable'?'selected':''}>Двускатная</option><option value="hip" ${h.roof==='hip'?'selected':''}>Вальмовая</option><option value="flat" ${h.roof==='flat'?'selected':''}>Плоская</option></select></label><label>Фото строения<input type="file" id="lpHousePhoto" accept="image/png,image/jpeg,image/webp"></label><button type="button" data-generate="roof" ${!h.photo?'disabled':''}>GPT Image 2.6 · кровля сверху</button><small>Фото ${h.photo?'загружено':'не загружено'}. Генерация не изменяет размеры дома.</small></section>`;
  html+=`<section><strong>ДОПОЛНИТЕЛЬНЫЕ СТРОЕНИЯ</strong><div class='lp-two'><button type='button' data-add-building='bath'>＋ Баня</button><button type='button' data-add-building='garage'>＋ Гараж</button><button type='button' data-add-building='gazebo'>＋ Беседка</button><button type='button' data-add-building='outbuilding'>＋ Хозблок</button></div><small>${doc.buildings.length} дополнительных строений с отдельной геометрией</small></section>`;
   if(selected?.startsWith('building:')){
    const b=doc.buildings.find(x=>x.id===selected.slice(9));
    if(b)html+=`<section class='lp-selected'><strong>${esc(({bath:'Баня',garage:'Гараж',gazebo:'Беседка',outbuilding:'Хозпостройка',house:'Дом'})[b.type])}</strong><div class='lp-two'>${field('aux.width','Ширина м',b.width,2,60)}${field('aux.height','Длина м',b.height,2,60)}</div><div class='lp-two'>${field('aux.x','X центр м',b.x,0,500)}${field('aux.y','Y центр м',b.y,0,500)}</div>${field('aux.rotation','Поворот °',b.rotation,-360,360,1)}<label>Кровля<select data-field='aux.roof'><option value='gable' ${b.roof==='gable'?'selected':''}>Двускатная</option><option value='hip' ${b.roof==='hip'?'selected':''}>Вальмовая</option><option value='flat' ${b.roof==='flat'?'selected':''}>Плоская</option></select></label><label>Фото этого строения<input type='file' id='lpAuxPhoto' accept='image/png,image/jpeg,image/webp'></label><button type='button' data-roof ${b.photo?'':'disabled'}>AI · кровля сверху</button><button type='button' data-delete-building>Удалить строение</button></section>`;
   }
   if(selected&&selected!=='house'&&!selected.startsWith('building:')){
   const obj=doc.objects.find(x=>x.id===selected),entry=byId(obj?.catalogId);
   if(obj&&entry){html+=`<section class="lp-selected"><strong>${esc(entry.name)}</strong>`;
    if(obj.points){html+=entry.group==='pavers'?field('object.width','Ширина дорожки м',obj.width,.4,10):'';
     html+=`<p>${entry.group==='pavers'?'Длина '+num(lineLength(obj.points))+' м, площадь приблиз. '+num(areaFor(doc,obj))+' м²':'Площадь '+num(polygonArea(obj.points))+' м²'}</p><div class="lp-vertices">${obj.points.map((p,i)=>`<div><span>${i+1}</span><input data-vertex="${i}" data-axis="x" type="number" step=".05" value="${p.x}"><input data-vertex="${i}" data-axis="y" type="number" step=".05" value="${p.y}"></div>`).join('')}</div>`;
    }else{html+=`<div class="lp-two">${field('object.x','X м',obj.x,0,500)}${field('object.y','Y м',obj.y,0,500)}</div>${field('object.diameter','Диаметр кроны/объекта м',obj.diameter,.1,30)}${field('object.rotation','Поворот °',obj.rotation,-360,360,1)}`;}
    html+='<button type="button" data-delete>Удалить выбранное</button></section>';
   }
  }
  html+=`<section><strong>ВЕДОМОСТЬ</strong><div class="lp-totals"><span>Площадь участка <b>${num(r.siteArea)} м²</b></span><span>Пятно дома <b>${num(r.buildingArea)} м²</b></span><span>Прочие строения <b>${num(r.auxBuildingArea)} м²</b></span></div><table><tbody>${Object.entries(r.counts).map(([id,n])=>{const a=byId(id);return `<tr><td>${esc(a?.name)}</td><td>${r.areas[id]!=null?num(r.areas[id])+' м²':n+' шт.'}</td></tr>`}).join('')}</tbody></table><small>Площадь дорожек в пересечениях приближённая, до объединения покрытий.</small></section>`;
  root.innerHTML=html;
 }
 function draw(){if(!modal)return;drawMap();drawInspector();drawPalette()}
 function setMode(v){mode=v;points=[];selected=null;draw()}
 function addObject(p){const entry=itemCatalog();if(!entry)return;checkpoint();const obj={id:uid(),catalogId:entry.id,type:entry.group,x:p.x,y:p.y,diameter:entry.diameter||1,rotation:0};doc.objects.push(obj);selected=obj.id;save();draw()}
 function finish(){
  if(mode==='boundary'){if(points.length<3)return;checkpoint();doc.site.boundary=points.map(p=>({...p}));doc.verified=false;say('Контур задан. Проверьте координаты и габариты.');}
  else if(mode==='path'||mode==='area'){
   if(points.length<(mode==='path'?2:3))return;const entry=itemCatalog();if(!entry)return;
   if(mode==='path'&&entry.group!=='pavers'||mode==='area'&&!['lawns','fills','ponds'].includes(entry.group)){say('Выберите правильный материал для этого инструмента.');return}
   checkpoint();const obj={id:uid(),catalogId:entry.id,type:entry.group,points:points.map(p=>({...p})),width:clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10)};
   doc.objects.push(obj);selected=obj.id;say('Объект создан с измеряемой геометрией.');}
  points=[];mode='select';save();draw();
 }
 function startPointer(e){
  if(busy||e.button!==0)return;const p=position(e);if(!p)return;
  if(['path','area','boundary'].includes(mode)){points.push(p);drawMap();drawPalette();return}
  if(mode==='place'){addObject(p);return}
  const node=e.target.closest('[data-object]'),house=e.target.closest('[data-house]'),aux=e.target.closest('[data-building]');
  selected=node?.dataset.object||(aux?'building:'+aux.dataset.building:house?'house':null);
  if(!selected){draw();return}
  const obj=selected==='house'?doc.house:selected.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.objects.find(x=>x.id===selected),control=e.target.closest('[data-vertex]');
  checkpoint();drag={pointer:e.pointerId,id:selected,index:control?Number(control.dataset.vertex):null,start:p,original:JSON.parse(JSON.stringify(obj))};
  try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}drawInspector();
 }
 function movePointer(e){
  if(!drag||drag.pointer!==e.pointerId)return;const p=position(e);if(!p)return;const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
  const obj=drag.id==='house'?doc.house:drag.id.startsWith('building:')?doc.buildings.find(b=>b.id===drag.id.slice(9)):doc.objects.find(x=>x.id===drag.id);if(!obj)return;
  if(obj.points){
   if(drag.index!==null){const a=drag.original.points[drag.index];obj.points[drag.index]={x:clamp(a.x+dx,0,doc.site.width),y:clamp(a.y+dy,0,doc.site.height)}}
   else obj.points=drag.original.points.map(a=>({x:clamp(a.x+dx,0,doc.site.width),y:clamp(a.y+dy,0,doc.site.height)}));
  }else{obj.x=clamp(drag.original.x+dx,0,doc.site.width);obj.y=clamp(drag.original.y+dy,0,doc.site.height)}
  const svg=$('#lpSvg',modal);if(!svg)return;
  const replacement=drawSvg(),markup=replacement.slice(replacement.indexOf('>')+1,replacement.lastIndexOf('</svg>'));
  svg.innerHTML=markup;
 }
 function endPointer(e){if(!drag||drag.pointer!==e.pointerId)return;drag=null;save();draw()}
 function change(e){
  const field=e.target.dataset.field,vertex=e.target.dataset.vertex,boundary=e.target.dataset.boundary;if(field===undefined&&vertex===undefined&&boundary===undefined)return;
  checkpoint();const v=e.target.type==='checkbox'?e.target.checked:e.target.tagName==='SELECT'?e.target.value:Number(e.target.value);
  if(boundary!==undefined){if(doc.site.boundary?.[+boundary]){const axis=e.target.dataset.axis;doc.site.boundary[+boundary][axis]=clamp(v,0,axis==='x'?doc.site.width:doc.site.height);doc.verified=false;}}
  else if(vertex!==undefined){const obj=doc.objects.find(x=>x.id===selected);if(obj?.points?.[+vertex])obj.points[+vertex][e.target.dataset.axis]=clamp(v,0,e.target.dataset.axis==='x'?doc.site.width:doc.site.height);}
  else if(field==='verified')doc.verified=v;
  else if(field==='north')doc.north=clamp(v,-360,360);
  else if(field.startsWith('site.')){doc.site[field.slice(5)]=clamp(v,5,500);doc.verified=false;}
  else if(field.startsWith('house.')){const k=field.slice(6);doc.house[k]=['type','roof'].includes(k)?v:k==='rotation'?clamp(v,-360,360):['x','y'].includes(k)?clamp(v,0,k==='x'?doc.site.width:doc.site.height):clamp(v,2,60);roofArt=null;}
  else if(field.startsWith('aux.')){const b=doc.buildings.find(x=>x.id===selected.slice(9));if(b){const k=field.slice(4);b[k]=k==='roof'?v:k==='rotation'?clamp(v,-360,360):['x','y'].includes(k)?clamp(v,0,k==='x'?doc.site.width:doc.site.height):clamp(v,2,60);roofArts.delete(b.id)}}
   else if(field.startsWith('object.')){const obj=doc.objects.find(x=>x.id===selected);if(obj){const k=field.slice(7);obj[k]=k==='rotation'?clamp(v,-360,360):k==='width'?clamp(v,.4,10):k==='diameter'?clamp(v,.1,30):clamp(v,0,k==='x'?doc.site.width:doc.site.height)}}
  doc=normalizeProject(doc);save();draw();
 }
 async function uploadPhoto(file,kind){
  if(!file||file.size>14*1024*1024||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Нужен PNG/JPG/WebP до 14 МБ.');
  const uri=await new Promise((ok,err)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>err(Error('Ошибка чтения'));r.readAsDataURL(file)});
  const img=await new Promise((ok,err)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>err(Error('Файл не изображение'));im.src=uri});
  const scale=Math.min(1,1250/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');
  c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);const encoded=c.toDataURL('image/jpeg',.76);
  checkpoint();if(kind==='house'){doc.house.photo=encoded;roofArt=null;}else if(kind==='aux'){const b=doc.buildings.find(x=>x.id===selected?.slice(9));if(!b)throw Error('Выберите дополнительное строение.');b.photo=encoded;roofArts.delete(b.id);}else{doc.underlay=encoded;doc.verified=false;}
  save();draw();say(kind==='house'?'Фото строения сохранено для генерации кровли строго сверху.':'Набросок добавлен как подложка. Масштаб задаётся численно.');
 }
 const openMedia=()=>new Promise((resolve,reject)=>{const r=indexedDB.open('forma-landscape-masterplan-assets',1);r.onupgradeneeded=()=>r.result.createObjectStore('media');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
 async function storage(k,value){
  let db;try{db=await openMedia();return await new Promise((res,rej)=>{const tx=db.transaction('media',value?'readwrite':'readonly'),store=tx.objectStore('media'),req=value?store.put(value,pid+':'+k):store.get(pid+':'+k);req.onsuccess=()=>res(value||req.result||null);req.onerror=()=>rej(req.error)})}finally{db?.close()}
 }
 function download(name,text,type){
  const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function title(){return (doc.title||'landscape').replace(/[^0-9a-zа-яё_-]/gi,'_').slice(0,48)}
 async function rasterize(labels){
  const w=doc.site.width,h=doc.site.height;
  const width=w>=h?2048:Math.max(1,Math.round(2048*w/h));
  const height=h>=w?2048:Math.max(1,Math.round(2048*h/w));
  // An AI revision always starts from the measured vector geometry, never a previous AI variation.
  const previous=preview;if(!labels)preview=null;
  let raw;try{raw=drawSvg()}finally{preview=previous}
  const svg=(labels?raw:raw.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'')).replace('id="lpSvg"','id="exportedPlan"').replace('width="1400" height="1400"','width="'+width+'" height="'+height+'"');
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try{const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error('SVG не открылся'));im.src=url});
   const c=document.createElement('canvas');c.width=width;c.height=height;
   c.getContext('2d').drawImage(img,0,0,width,height);
   return c.toDataURL('image/png');
  }finally{URL.revokeObjectURL(url)}
 }
 async function runAI(kind){
  if(busy)return;
  if(!confirm('Запустить один платный запрос GPT Image 2.6? Точные размеры останутся в исходной модели.'))return;
  busy=true;$('#lpAi',modal).disabled=true;say('Подготавливаем изображение для GPT Image 2.6...');
  try{
   const target=selected?.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.house;
   const payload=kind==='roof'
    ?{image:target?.photo||null,roofTopView:{width:target?.width,height:target?.height,roof:target?.roof},quality:'high',quantity:1}
    :{image:await rasterize(false),reference:doc.house.photo||null,landscapeMasterplan:coordinateSummary(doc),quality:'high',quantity:1};
   if(!payload.image)throw Error('Загрузите фотографию строения.');
   const r=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(240000)});
   const result=await r.json().catch(()=>({}));
   if(!r.ok||!result.images?.[0])throw Error(result.error||'GPT Image не выдал изображение.');
   const img='data:'+(result.mimes?.[0]||'image/png')+';base64,'+result.images[0];
   if(kind==='roof'){if(target===doc.house){roofArt=img;await storage('roof',img).catch(()=>{});}else{roofArts.set(target.id,img);await storage('roof-'+target.id,img).catch(()=>{});}say('Кровля сгенерирована: размеры и положение строения не изменены.')}
   else{preview=img;await storage('preview',img).catch(()=>{});say('Фотореалистичная подача создана. Измерения остались в векторной модели.')}
   drawMap();
  }catch(err){say(err?.name==='TimeoutError'?'Истекло время ожидания. Запрос мог быть оплачен. Не повторяйте сразу.':err.message)}
  finally{busy=false;$('#lpAi',modal).disabled=false}
 }
 function exportCSV(){
  const r=report(doc),rows=[['Категория','Объект','Количество, шт','Площадь, м²','Длина, м']];
  for(const [id,n] of Object.entries(r.counts)){const x=byId(id);rows.push([x.group,x.name,n,r.areas[id]??'',r.lengths[id]??''])}
  download(title()+'-vedomost.csv','\uFEFF'+rows.map(v=>v.map(k=>'"'+String(k).replaceAll('"','""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8');
 }
 function click(e){
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.category){category=b.dataset.category;chosen=CATALOG.find(x=>x.group===category).id;drawPalette();return}
  if(b.dataset.asset){chosen=b.dataset.asset;const g=itemCatalog().group;setMode(g==='pavers'?'path':['fills','lawns','ponds'].includes(g)?'area':'place');return}
  if(b.dataset.tool){setMode(b.dataset.tool);return}
  if(b.id==='lpFinish'){finish();return}
  if(b.id==='lpCancel'){points=[];drawMap();drawPalette();return}
  if(b.dataset.undo!==undefined){reverse('undo');return}
  if(b.dataset.redo!==undefined){reverse('redo');return}
  if(b.dataset.delete!==undefined&&selected&&selected!=='house'){checkpoint();doc.objects=doc.objects.filter(x=>x.id!==selected);selected=null;save();draw();return}
  if(b.dataset.concept!==undefined){
   if(!confirm('Добавить восемь редактируемых растений, сохраняя текущие объекты?'))return;
   checkpoint();const samples=[['pine',.13,.16],['birch',.85,.15],['oak',.12,.85],['spruce',.85,.81],['hydrangea',.28,.35],['juniper',.7,.36],['spirea',.25,.69],['barberry',.72,.65]];
   for(const [id,x,y] of samples){const entry=byId(id);doc.objects.push({id:uid(),catalogId:id,type:entry.group,x:x*doc.site.width,y:y*doc.site.height,diameter:entry.diameter,rotation:0})}
   save();draw();say('Редактируемый эскиз посадок готов. Проверьте отступы и размеры взрослых крон.');return;
  }
  if(b.dataset.addBuilding!==undefined){if(doc.buildings.length>=24){say('Лимит — 24 дополнительных строения.');return}checkpoint();const type=b.dataset.addBuilding,aux={id:'b-'+uid().slice(2),type,x:doc.site.width*.76,y:doc.site.height*.7,width:type==='garage'?7:type==='bath'?6:4,height:type==='garage'?6:4,rotation:0,roof:'gable',roofColor:'#454543',photo:null};doc.buildings.push(aux);selected='building:'+aux.id;save();draw();say('Строение добавлено. Укажите его точное положение, размеры и поворот.');return}
  if(b.dataset.deleteBuilding!==undefined&&selected?.startsWith('building:')){const id=selected.slice(9);checkpoint();doc.buildings=doc.buildings.filter(x=>x.id!==id);roofArts.delete(id);selected=null;save();draw();return}
  if(b.dataset.ai!==undefined){runAI('plan');return}
  if(b.dataset.roof!==undefined){runAI('roof');return}
  if(b.dataset.svg!==undefined){download(title()+'-genplan.svg',drawSvg(),'image/svg+xml');say('Сохранён SVG генплана.');return}
  if(b.dataset.png!==undefined){rasterize(true).then(src=>{const a=document.createElement('a');a.href=src;a.download=title()+'-2k.png';a.click()}).catch(err=>say('PNG: '+err.message));return}
  if(b.dataset.json!==undefined){download(title()+'-model.json',JSON.stringify(doc,null,2),'application/json');return}
  if(b.dataset.csv!==undefined){exportCSV();return}
  if(b.dataset.icon!==undefined){const entry=itemCatalog();download('FORMA-'+entry.id+'-1080.svg',assetSVG(entry,{size:1080,transparent:true}),'image/svg+xml');say('Векторная иконка 1080×1080 экспортирована.');return}
  if(b.dataset.iconPng!==undefined){const entry=itemCatalog(),img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1080;c.height=1080;c.getContext('2d').drawImage(img,0,0,1080,1080);const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='FORMA-'+entry.id+'-1080.png';a.click();say('PNG иконка 1080×1080 создана — строго сверху.');};img.onerror=()=>say('Не удалось подготовить PNG. Используйте SVG.');img.src=iconURL(entry);return}
  if(b.dataset.close!==undefined){close();return}
 }
 function onKey(e){
  if(!modal?.open)return;
  if(e.key==='Escape'){if(points.length){e.preventDefault();points=[];drawMap();drawPalette()}else close();return}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.key==='Enter'&&points.length){e.preventDefault();finish()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();reverse(e.shiftKey?'redo':'undo')}
 }
 async function open(){
  if(modal?.open)return;
  lastFocus=document.activeElement;pid=activeProject();try{doc=normalizeProject(JSON.parse(localStorage.getItem(siteKey())||'null'))}catch{doc=freshProject()}
  mode='select';chosen='pine';category='trees';selected=null;points=[];undo=[];redo=[];preview=null;roofArt=null;roofArts=new Map();
  modal=document.createElement('dialog');modal.id='faLandscapeMasterplan';modal.className='fa-landscape-masterplan';
  modal.innerHTML=`<div class="lp-shell"><header class="lp-head"><div class="lp-brand"><b>FORMA</b><span>ЛАНДШАФТНЫЙ ПРОЕКТ · ВИД СВЕРХУ</span></div><div><span id="lpSourceState"></span><button type="button" data-close aria-label="Закрыть">×</button></div></header><div class="lp-layout"><aside class="lp-sidebar"><div class="lp-sidebar-head"><b>БИБЛИОТЕКА</b><small>46 объектов · 8 категорий</small></div><div id="lpPalette"></div><button type="button" data-icon class="lp-export-icon">Экспорт · SVG 1080</button><button type="button" data-icon-png class="lp-export-icon">Экспорт · PNG 1080</button></aside><section class="lp-work"><div class="lp-tools"><button type="button" data-tool="select">↖ Выбор</button><button type="button" data-tool="boundary">⬡ Граница</button><button type="button" data-tool="path">⌁ Дорожка</button><button type="button" data-tool="area">▧ Область</button><button type="button" data-undo>↶</button><button type="button" data-redo>↷</button></div><div class="lp-path-controls"><span id="lpToolName">Выбор</span><label>Ширина дорожки <input id="lpWidth" type="number" min=".4" max="10" step=".05" value="1.2"> м</label><label><input id="lpSnap" type="checkbox" checked> Шаг 5 см</label><button id="lpFinish" type="button" disabled>Завершить</button><button id="lpCancel" type="button" disabled>Отмена</button></div><div class="lp-canvas"><div id="lpMap"></div></div><footer class="lp-work-foot"><span id="lpStatus" role="status">План строится в метрах. Дорожки рисуются точками, не кистью.</span><button type="button" data-concept>＋ Эскиз посадок</button></footer></section><aside class="lp-properties"><div id="lpInspector"></div><section class="lp-outputs"><label>Набросок / схема<input id="lpUnderlay" type="file" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="lpAi" data-ai>GPT Image 2.6 · Фото-генплан</button><small>Генерация меняет только презентацию. Размеры и координаты остаются в 2D-модели.</small><div><button type="button" data-svg>SVG</button><button type="button" data-png>PNG 2K</button><button type="button" data-csv>Ведомость CSV</button><button type="button" data-json>Модель JSON</button></div></section></aside></div></div>`;
  document.body.append(modal);modal.addEventListener('click',click);
  modal.addEventListener('change',e=>{
   if(e.target.matches('#lpUnderlay,#lpHousePhoto,#lpAuxPhoto')){uploadPhoto(e.target.files?.[0],e.target.id==='lpHousePhoto'?'house':e.target.id==='lpAuxPhoto'?'aux':'underlay').catch(err=>say(err.message));return}
   if(e.target.id==='lpSnap'){snap=e.target.checked;return}
   change(e);
  });
  modal.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close()});
  document.addEventListener('keydown',onKey);modal.showModal();draw();
  try{[preview,roofArt]=await Promise.all([storage('preview').catch(()=>null),storage('roof').catch(()=>null)]);await Promise.all(doc.buildings.map(async b=>{const img=await storage('roof-'+b.id).catch(()=>null);if(img)roofArts.set(b.id,img)}));if(modal?.open)drawMap()}catch{}
 }
 function close(){
  if(busy){say('Сначала завершите AI-запрос.');return}
  if(!modal)return;save();modal.close();modal.remove();modal=null;document.removeEventListener('keydown',onKey);lastFocus?.focus?.({preventScroll:true});
 }
 window.FORMA_LANDSCAPE_PROJECT={open,close,getProject:()=>normalizeProject(doc),getReport:()=>report(doc)};
