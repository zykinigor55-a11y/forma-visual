import {GROUPS,CATALOG,byId,freshProject,normalizeProject,report,lineLength,polygonArea,areaFor,rectBoundary,coordinateSummary,snapPathPoint,translatePoints} from './forma-landscape-project-core.js';
import {assetSVG,iconURL,roofingSVG,enablePremiumAssets,fallbackIconURL,premiumIconURL,photographicAssetCount,isPhotographic,cardPhotoURL,hasPhotographicCard,cardPhotoCount} from './forma-landscape-project-graphics.js?v=photo-light-pond-v6';
import {brushPolygon} from './forma-landscape-brush.js';

 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),num=(v,d=2)=>Number(v).toFixed(d);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>'o-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 let modal=null,doc=freshProject(),pid='',mode='select',category='trees',chosen='pine',points=[],selected=null,drag=null,undo=[],redo=[],busy=false,preview=null,roofArt=null,roofArts=new Map(),snap=true,pathShape='orthogonal',generationStarted=0,progressTicker=null,progressListener=null,photoVisible=true;
 let lastFocus=null,previewModel=null,areaTool='polygon',brush=null;
 const siteKey=()=>`forma-landscape-masterplan-v1-${pid}`;
 const activeProject=()=>{try{return JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}').activeId||'landscape'}catch{return 'landscape'}};
 function save(){try{localStorage.setItem(siteKey(),JSON.stringify(doc))}catch{say('Не удалось сохранить проект локально. Экспортируйте JSON.');}}
 function say(str){const el=$('#lpStatus',modal);if(el)el.textContent=str}
 function checkpoint(){photoVisible=false;undo.push(JSON.stringify(doc));if(undo.length>40)undo.shift();redo=[]}
 function reverse(which){const from=which==='undo'?undo:redo,to=which==='undo'?redo:undo;if(!from.length)return;say('Восстановлена версия схемы.');to.push(JSON.stringify(doc));doc=normalizeProject(JSON.parse(from.pop()));photoVisible=false;selected=null;points=[];save();draw();}
 const metric=(p)=>num(p.x,3)+','+num(p.y,3),poly=arr=>arr.map(metric).join(' '),dline=arr=>arr.map((p,i)=>(i?'L':'M')+metric(p)).join(' ');
 const itemCatalog=()=>byId(chosen);
 function selectedColor(){return byId(chosen)?.color||'#8eaa85'}
 function drawSvg(){
  const w=doc.site.width,h=doc.site.height,max=Math.max(w,h),fs=Math.max(.4,Math.min(w,h)*.027),bound=doc.site.boundary||rectBoundary(w,h);
  const grid=max>140?5:max>80?2:1;
  let shapes=`<defs><pattern id="lpGrid" width="${grid}" height="${grid}" patternUnits="userSpaceOnUse"><path d="M${grid} 0H0V${grid}" fill="none" stroke="#71836b" stroke-width="${Math.max(.025,grid*.015)}" stroke-opacity=".3"/></pattern></defs><rect width="${w}" height="${h}" fill="#e9e9df"/>`;
  if(doc.underlay&&!preview)shapes+=`<image href="${doc.underlay}" width="${w}" height="${h}" opacity="${doc.underlayOpacity}" preserveAspectRatio="none"/>`;
  shapes+=`<rect width="${w}" height="${h}" fill="url(#lpGrid)"/>`;
  if(preview&&photoVisible)shapes+=`<image href="${preview}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  shapes+=`<polygon points="${poly(bound)}" fill="${preview&&photoVisible?'none':'#c1d8b0b8'}" stroke="${preview&&photoVisible?'#ffffff66':'#447754'}" stroke-width="${Math.max(.08,max*.0025)}"/>`;
  const layer={fills:0,lawns:0,ponds:0,pavers:1,boulders:2,trees:3,shrubs:3,lights:4};
  for(const item of [...doc.objects].sort((a,b)=>(layer[a.type]??3)-(layer[b.type]??3))){
   const entry=byId(item.catalogId);if(!entry)continue;
   const active=item.id===selected,alpha=preview&&photoVisible?.25:1;
   if(preview&&photoVisible){
    if(entry.group==='pavers')shapes+=`<path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="${active?'#ffd697':'transparent'}" stroke-width="${item.width}" stroke-opacity="${active?.8:0}" stroke-linecap="round" stroke-linejoin="round" pointer-events="stroke"/>`;
    else if(['fills','lawns','ponds'].includes(entry.group))shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}" fill="${active?'#ffe3b7':'transparent'}" fill-opacity="${active?.17:0}" stroke="${active?'#f7d097':'transparent'}" stroke-width=".12" pointer-events="all"/>`;
    else shapes+=`<circle data-object="${item.id}" cx="${item.x}" cy="${item.y}" r="${Math.max(.3,item.diameter/2)}" fill="${active?'#ffe2b5':'transparent'}" fill-opacity="${active?.11:0}" stroke="${active?'#e5c08e':'transparent'}" stroke-width=".09" pointer-events="all"/>`;
    if(active&&item.points)for(const [i,p]of item.points.entries())shapes+=`<circle data-vertex="${i}" data-object="${item.id}" cx="${p.x}" cy="${p.y}" r="${Math.min(.3,max*.01)}" fill="#fff7e2" stroke="#a87633" stroke-width=".08"/>`;
    continue;
   }
   if(entry.group==='pavers'){
    const patternId='lpPaver-'+item.id;
    shapes+=`<defs><pattern id="${patternId}" patternUnits="userSpaceOnUse" width="1.2" height="1.2"><image href="${iconURL(entry)}" x="0" y="0" width="1.2" height="1.2" preserveAspectRatio="xMidYMid slice"/></pattern></defs><path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="#4f4a41" stroke-width="${item.width+.1}" stroke-linecap="round" stroke-linejoin="round"/><path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="url(#${patternId})" stroke-width="${item.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${alpha}"/>`;
   }else if(['fills','lawns','ponds'].includes(entry.group)){
    shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}" fill="${entry.color}" fill-opacity="${preview&&photoVisible?.18:.85}" stroke="${active?'#dfaa58':'#5b7558'}" stroke-width="${active?.16:.065}"/>`;
    if(!(preview&&photoVisible)){shapes+=`<defs><pattern id="tile-${item.id}" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><image href="${iconURL(entry)}" width="2.4" height="2.4"/></pattern></defs><polygon data-object="${item.id}" points="${poly(item.points)}" fill="url(#tile-${item.id})" opacity=".46"/>`;}
   }else{
    const d=entry.group==='lights'?Math.max(.75,item.diameter):item.diameter;
    shapes+=`<g data-object="${item.id}" transform="rotate(${item.rotation} ${item.x} ${item.y})"><image href="${iconURL(entry)}" x="${item.x-d/2}" y="${item.y-d/2}" width="${d}" height="${d}"/></g>`;
    if(active)shapes+=`<circle cx="${item.x}" cy="${item.y}" r="${d/2+.15}" fill="none" stroke="#c68f48" stroke-width=".14" stroke-dasharray=".28 .2" pointer-events="none"/>`;
   }
   if(active&&item.points)for(const [i,p] of item.points.entries())shapes+=`<circle data-vertex="${i}" data-object="${item.id}" cx="${p.x}" cy="${p.y}" r="${Math.min(.3,max*.01)}" fill="#fff7e2" stroke="#b47b37" stroke-width=".08"/>`;
  }
  const house=doc.house,w2=house.width/2,h2=house.height/2;
  if(!preview||!photoVisible){
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
  }
  if(!preview||!photoVisible)shapes+=`<g fill="#3e5544" font-size="${fs*.7}" font-family="Arial,sans-serif"><text x="${w*.5}" y="${h*.02+fs*.8}" text-anchor="middle">${num(w)} м</text><text x="${fs*.6}" y="${h*.5}" text-anchor="middle" transform="rotate(-90 ${fs*.6} ${h*.5})">${num(h)} м</text></g>`;
  if(!preview||!photoVisible)shapes+=`<g transform="translate(${w*.92} ${h*.1}) rotate(${doc.north})"><path d="M0 -1L-.22 .6L0 .3L.22 .6Z" fill="#263a2a"/><text y="-1.3" text-anchor="middle" font-size="${fs*.7}" fill="#263a2a">С</text></g>`;
  if(preview&&photoVisible){
   shapes+=`<g data-house="yes" transform="translate(${house.x} ${house.y}) rotate(${house.rotation})"><rect x="${-w2}" y="${-h2}" width="${house.width}" height="${house.height}" fill="transparent" stroke="${selected==='house'?'#f5c27d':'transparent'}" stroke-width=".12" pointer-events="all"/></g>`;
   for(const b of doc.buildings)shapes+=`<g data-building="${b.id}" transform="translate(${b.x} ${b.y}) rotate(${b.rotation})"><rect x="${-b.width/2}" y="${-b.height/2}" width="${b.width}" height="${b.height}" fill="transparent" stroke="${selected==='building:'+b.id?'#f5c27d':'transparent'}" stroke-width=".12" pointer-events="all"/></g>`;
  }
  if(mode==='area'&&areaTool==='brush'&&brush?.points.length){
   const draft=brushPolygon(brush.points,brush.diameter,doc.site);
   if(draft.length>=3)shapes+='<polygon points="'+poly(draft)+'" fill="'+selectedColor()+'" fill-opacity=".42" stroke="#f0bf86" stroke-width=".13" pointer-events="none"/>';
  }
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
  const photoButton=$('#lpPhotoToggle',modal);if(photoButton){photoButton.disabled=!preview;photoButton.textContent=preview?(photoVisible?'◫ Исходная схема':'▣ Фото-рендер'):'▣ Фото-рендер';}
  const s=$('#lpSourceState',modal);if(s)s.textContent=`${num(doc.site.width)} × ${num(doc.site.height)} м · ${doc.verified?'Размеры подтверждены':'Требуется сверка размеров'}`;
 }
 function drawPalette(){
  const target=$('#lpPalette',modal);if(!target)return;
  target.innerHTML='<div class="lp-groups">'+GROUPS.map(g=>`<button class="${category===g.id?'active':''}" data-category="${g.id}"><strong>${g.symbol}</strong>${g.name}<small>${g.qty}</small></button>`).join('')+'</div><div class="lp-assets">'+CATALOG.filter(x=>x.group===category).map(x=>`<button class="${chosen===x.id?'active':''}" data-asset="${x.id}" data-photo-type="${x.group}" data-photo-ready="${hasPhotographicCard(x)?'true':'false'}"><img src="${cardPhotoURL(x)}" alt="${esc(x.name)} · ${x.group==='lawns'?'макросъёмка травы':x.group==='lights'?'фото светильника':x.group==='ponds'?'фото водоёма':x.group==='boulders'?'фото камня':'вид сверху'}" loading="eager" decoding="async"><span>${esc(x.name)}</span><small class="lp-asset-detail">${x.group==='lawns'?'МАКРО · ФАКТУРА ТРАВЫ':x.group==='trees'||x.group==='shrubs'?'КРОНА · ВИД СВЕРХУ':x.group==='lights'?'ФОТО · САДОВЫЙ СВЕТ':x.group==='ponds'?'ФОТО · ВОДНАЯ ПОВЕРХНОСТЬ':x.group==='boulders'?'ФОТО · КАМЕНЬ':'ФОТО · МАТЕРИАЛ'}</small></button>`).join('')+'</div>';
  $$('.lp-assets img',target).forEach(img=>{img.addEventListener('error',()=>{const entry=byId(img.closest('[data-asset]')?.dataset.asset);if(entry&&!img.dataset.fallback){img.dataset.fallback='true';img.src=iconURL(entry);}else if(entry&&img.dataset.fallback==='true'&&!img.dataset.svgFallback){img.dataset.svgFallback='true';img.src=fallbackIconURL(entry);}})});
  $$('.lp-tools button[data-tool]',modal).forEach(b=>b.classList.toggle('active',b.dataset.tool===mode));
  $('#lpFinish',modal).disabled=points.length<(mode==='path'?2:3);
  $('#lpCancel',modal).disabled=!points.length&&mode==='select';
  const t=$('#lpToolName',modal);if(t)t.textContent=({select:'Выбор и перемещение',place:'Размещение объекта',path:'Дорожка · '+(pathShape==='free'?'свободная форма':pathShape==='diagonal'?'диагонали · 45°':'параллельно границе · 90°'),area:'Область · '+(areaTool==='brush'?'Кисть':'Полигональное лассо'),boundary:'Границы участка'})[mode]||mode;
  const pathPanel=$('#lpPathControls',modal);if(pathPanel)pathPanel.hidden=mode!=='path';
  $$('[data-path-shape]',modal).forEach(b=>{b.classList.toggle('active',b.dataset.pathShape===pathShape);b.setAttribute('aria-pressed',String(b.dataset.pathShape===pathShape));});
  const selection=$('#lpSelectedMaterial',modal);if(selection){selection.textContent=byId(chosen)?.name||'Выберите брусчатку';}
  const pathMaterials=$('#lpPathMaterials',modal);
  if(pathMaterials)pathMaterials.innerHTML=CATALOG.filter(x=>x.group==='pavers').map(x=>'<button type="button" data-path-material="'+x.id+'" class="'+(chosen===x.id?'active':'')+'"><img src="'+iconURL(x)+'" alt=""><span>'+esc(x.name)+'</span></button>').join('');
  const areaControls=$('#lpAreaControls',modal);if(areaControls)areaControls.hidden=mode!=='area';
  modal.querySelectorAll('[data-area-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.areaTool===areaTool);b.setAttribute('aria-pressed',String(b.dataset.areaTool===areaTool));});
  const brushSize=$('#lpBrushSize',modal);if(brushSize)brushSize.disabled=areaTool!=='brush';
  const areaMaterials=$('#lpAreaMaterials',modal);
  if(areaMaterials)areaMaterials.innerHTML=['lawns','fills','ponds'].map(g=>'<div class="lp-area-group"><strong>'+({lawns:'Газоны',fills:'Отсыпки',ponds:'Водоёмы'})[g]+'</strong>'+CATALOG.filter(x=>x.group===g).map(x=>'<button type="button" data-area-material="'+x.id+'" class="'+(chosen===x.id?'active':'')+'"><img src="'+cardPhotoURL(x)+'" alt=""><span>'+esc(x.name)+'</span></button>').join('')+'</div>').join('');
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
    if(obj.points){html+=entry.group==='pavers'?'<label>Тип брусчатки<select data-field="object.catalogId">'+CATALOG.filter(x=>x.group==='pavers').map(x=>'<option value="'+x.id+'" '+(x.id===obj.catalogId?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+field('object.width','Ширина дорожки · м',obj.width,.4,10):'';
     html+=`<p>${entry.group==='pavers'?'Длина '+num(lineLength(obj.points))+' м, площадь приблиз. '+num(areaFor(doc,obj))+' м²':'Площадь '+num(polygonArea(obj.points))+' м²'}</p><div class="lp-vertices">${obj.points.map((p,i)=>`<div><span>${i+1}</span><input data-vertex="${i}" data-axis="x" type="number" step=".05" value="${p.x}"><input data-vertex="${i}" data-axis="y" type="number" step=".05" value="${p.y}"></div>`).join('')}</div>`;
    }else{html+=`<div class="lp-two">${field('object.x','X м',obj.x,0,500)}${field('object.y','Y м',obj.y,0,500)}</div>${field('object.diameter','Диаметр кроны/объекта м',obj.diameter,.1,30)}${field('object.rotation','Поворот °',obj.rotation,-360,360,1)}`;}
    html+='<button type="button" data-delete>Удалить выбранное</button></section>';
   }
  }
  html+=`<section><strong>ВЕДОМОСТЬ</strong><div class="lp-totals"><span>Площадь участка <b>${num(r.siteArea)} м²</b></span><span>Пятно дома <b>${num(r.buildingArea)} м²</b></span><span>Прочие строения <b>${num(r.auxBuildingArea)} м²</b></span></div><table><tbody>${Object.entries(r.counts).map(([id,n])=>{const a=byId(id);return `<tr><td>${esc(a?.name)}</td><td>${r.areas[id]!=null?num(r.areas[id])+' м²':n+' шт.'}</td></tr>`}).join('')}</tbody></table><small>Площадь дорожек в пересечениях приближённая, до объединения покрытий.</small></section>`;
  root.innerHTML=html;
 }
 function draw(){if(!modal)return;drawMap();drawInspector();drawPalette()}
 // A mobile user often chooses a species/material in the library below
 // the map; return to the SAME fixed drawing viewport for placement.
 function revealCanvas(){
  if(!modal||!window.matchMedia('(max-width:760px)').matches)return;
  const layout=$('.lp-layout',modal);
  if(layout)layout.scrollTop=0;
 }
 function setMode(v){mode=v;points=[];selected=null;brush=null;if(v==='path'&&!['pavers'].includes(itemCatalog()?.group)){category='pavers';chosen='concrete-pavers'}if(v==='area'&&!['lawns','fills','ponds'].includes(itemCatalog()?.group)){category='lawns';chosen='universal'}draw();revealCanvas();if(v==='path')say('Выберите тип брусчатки, ширину и режим: параллельно границе, диагонали 45° или свободная форма. Двойное касание завершает дорожку.');}
 function endDrawing(){points=[];mode='select';draw();say('Рисование прервано. Уже созданные объекты не изменены.');}
 function pathPoint(p){
  if(mode!=='path'||pathShape==='free'||!points.length)return p;
  return snapPathPoint(points.at(-1),p,pathShape,doc.site);
 }
 function addObject(p){const entry=itemCatalog();if(!entry)return;checkpoint();const obj={id:uid(),catalogId:entry.id,type:entry.group,x:p.x,y:p.y,diameter:entry.diameter||1,rotation:0};doc.objects.push(obj);selected=obj.id;mode='select';save();draw();say('Объект добавлен. Перетащите его мышью или пальцем; удалить можно кнопкой или Delete.');}
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
  if(mode==='area'&&areaTool==='brush'){
   if(!['lawns','fills','ponds'].includes(itemCatalog()?.group))return;
   brush={pointer:e.pointerId,points:[p],diameter:clamp(Number($('#lpBrushSize',modal)?.value)||1.5,.5,12)};
   try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}
   drawMapBrush();e.preventDefault();return;
  }
  if(['path','area','boundary'].includes(mode)){const q=pathPoint(p);if(points.length&&Math.hypot(q.x-points.at(-1).x,q.y-points.at(-1).y)<.03)return;points.push(q);drawMap();drawPalette();return}
  if(mode==='place'){addObject(p);return}
  const node=e.target.closest('[data-object]'),house=e.target.closest('[data-house]'),aux=e.target.closest('[data-building]');
  selected=node?.dataset.object||(aux?'building:'+aux.dataset.building:house?'house':null);
  if(!selected){draw();return}
  const obj=selected==='house'?doc.house:selected.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.objects.find(x=>x.id===selected),control=e.target.closest('[data-vertex]');
  checkpoint();photoVisible=false;drag={pointer:e.pointerId,id:selected,index:control?Number(control.dataset.vertex):null,start:p,original:JSON.parse(JSON.stringify(obj))};
  try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}drawInspector();
 }
 function movePointer(e){
  if(brush&&brush.pointer===e.pointerId){
   const p=position(e);if(!p)return;const q=brush.points.at(-1);
   if(Math.hypot(q.x-p.x,q.y-p.y)>=Math.max(.1,brush.diameter*.08))brush.points.push(p);
   if(brush.points.length>105)brush.points=brush.points.filter((_,i)=>i%2===0);
   drawMapBrush();e.preventDefault();return;
  }
  if(!drag||drag.pointer!==e.pointerId)return;const p=position(e);if(!p)return;const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
  const obj=drag.id==='house'?doc.house:drag.id.startsWith('building:')?doc.buildings.find(b=>b.id===drag.id.slice(9)):doc.objects.find(x=>x.id===drag.id);if(!obj)return;
  if(obj.points){
   if(drag.index!==null){const a=drag.original.points[drag.index];obj.points[drag.index]={x:clamp(a.x+dx,0,doc.site.width),y:clamp(a.y+dy,0,doc.site.height)}}
   else obj.points=translatePoints(drag.original.points,dx,dy,doc.site);
  }else{obj.x=clamp(drag.original.x+dx,0,doc.site.width);obj.y=clamp(drag.original.y+dy,0,doc.site.height)}
  const svg=$('#lpSvg',modal);if(!svg)return;
  const replacement=drawSvg(),markup=replacement.slice(replacement.indexOf('>')+1,replacement.lastIndexOf('</svg>'));
  svg.innerHTML=markup;
 }
 function drawMapBrush(){
  const svg=$('#lpSvg',modal);if(!svg)return;
  const markup=drawSvg();svg.innerHTML=markup.slice(markup.indexOf('>')+1,markup.lastIndexOf('</svg>'));
 }
 function endPointer(e){
  if(brush&&brush.pointer===e.pointerId){
   const stroke=brush;brush=null;
   if(e.type==='pointercancel'){drawMap();return;}
   const polygon=brushPolygon(stroke.points,stroke.diameter,doc.site);
   if(polygon.length>=3&&['lawns','fills','ponds'].includes(itemCatalog()?.group)){
    checkpoint();const item=itemCatalog();const obj={id:uid(),catalogId:item.id,type:item.group,points:polygon,width:1.2};
    doc.objects.push(obj);selected=obj.id;save();say('Область кистью сохранена. Следующая кисть добавит новую область, не удаляя дорожки.');
   }
   draw();return;
  }
  if(!drag||drag.pointer!==e.pointerId)return;drag=null;save();draw()
 }
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
   else if(field.startsWith('object.')){const obj=doc.objects.find(x=>x.id===selected);if(obj){const k=field.slice(7);obj[k]=k==='catalogId'?(byId(v)?.group===obj.type?v:obj.catalogId):k==='rotation'?clamp(v,-360,360):k==='width'?clamp(v,.4,10):k==='diameter'?clamp(v,.1,30):clamp(v,0,k==='x'?doc.site.width:doc.site.height)}}
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
 async function inlineSVGAssets(svg){
  const paths=[...new Set([...svg.matchAll(new RegExp('href="(/assets/landscape-(?:premium|photo)/[a-z0-9-]+[.](?:png|jpe?g|webp)[?][^"]*)"','gi'))].map(m=>m[1]))];
  if(!paths.length)return svg;
  const converted=await Promise.all(paths.map(async url=>{
   try{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)return [url,null];const b=await r.blob();
    if(b.size>10_000_000||!['image/webp','image/png','image/jpeg'].includes(b.type))return [url,null];
    const data=await new Promise((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(f.result);f.onerror=reject;f.readAsDataURL(b)});
    return [url,data];
   }catch{return [url,null]}
  }));
  for(const [from,to]of converted){if(to)svg=svg.replaceAll('href="'+from+'"','href="'+to+'"');}
  return svg;
 }
 async function rasterize(labels){
  const w=doc.site.width,h=doc.site.height;
  const width=w>=h?2048:Math.max(1,Math.round(2048*w/h));
  const height=h>=w?2048:Math.max(1,Math.round(2048*h/w));
  // An AI revision always starts from the measured vector geometry, never a previous AI variation.
  const previous=preview,previousPhoto=photoVisible;if(!labels){preview=null;photoVisible=false;}
  let raw;try{raw=drawSvg()}finally{preview=previous;photoVisible=previousPhoto}
  const svg=await inlineSVGAssets((labels?raw:raw.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'')).replace('id="lpSvg"','id="exportedPlan"').replace('width="1400" height="1400"','width="'+width+'" height="'+height+'"'));
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try{const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error('SVG не открылся'));im.src=url});
   const c=document.createElement('canvas');c.width=width;c.height=height;
   c.getContext('2d').drawImage(img,0,0,width,height);
   return c.toDataURL('image/png');
  }finally{URL.revokeObjectURL(url)}
 }
 function elapsed(ms){const n=Math.floor(ms/1000);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
 function stopRenderClock(){
  if(progressTicker){clearInterval(progressTicker);progressTicker=null;}
  if(progressListener){document.removeEventListener('forma:render-job-status',progressListener);progressListener=null;}
 }
 function renderStage(stage,title,detail){
  const el=$('#lpRenderOverlay',modal);if(!el)return;
  el.hidden=false;el.dataset.stage=stage;
  $('#lpRenderTitle',el).textContent=title;
  $('#lpRenderDesc',el).textContent=detail;
  const phase=['prepare','queued'].includes(stage)?'prepare':stage==='running'?'running':'save';
  $$('[data-render-step]',el).forEach(node=>node.classList.toggle('is-active',node.dataset.renderStep===phase));
  $('#lpRenderOrbit',el).hidden=['success','error'].includes(stage);
  const source=$('#lpRenderSourceImage',el);if(source)source.hidden=stage==='success'||!source.src;
  const img=$('#lpRenderOutputImage',el);img.hidden=!(stage==='success'&&preview);
  if(stage==='success'&&preview)img.src=preview;
  $('#lpRenderActions',el).hidden=!['success','error'].includes(stage);
  $('[data-render-download]',el).hidden=stage!=='success'||!preview;
  $('[data-render-close]',el).textContent=stage==='error'?'Вернуться в редактор':'Вернуться к плану';
 }
 function showRender(){
  generationStarted=Date.now();
  renderStage('prepare','Подготовка проекта','Подготавливаем геометрию, растения и материалы.');
  $('#lpRenderQueue',modal).textContent='Подготовка исходного изображения';
  stopRenderClock();
  progressTicker=setInterval(()=>{const el=$('#lpRenderElapsed',modal);if(el)el.textContent='Прошло '+elapsed(Date.now()-generationStarted)},1000);
  progressListener=e=>{
   if(!busy||!modal)return;
   const d=e.detail||{},s=d.status,el=$('#lpRenderQueue',modal);
   if(s==='queued'){renderStage('queued','Рендер в очереди','Сервер сам запустит обработку. Повторно нажимать не нужно.');el.textContent='Позиция в очереди: '+Math.max(1,d.position||1);}
   if(s==='running'){renderStage('running','Создаём ландшафтную фотографию','Растительность, камень, мощение, вода и солнечное освещение.');el.textContent='Фотореалистичная обработка на сервере';}
   if(s==='completed'){renderStage('save','Сохраняем результат','Файл получен; переносим изображение в проект.');el.textContent='Сохранение готового изображения';}
   if(s==='recovering'){renderStage('running','Восстанавливаем результат','Возвращаем уже отправленную работу без повторной оплаты.');el.textContent='Восстановление соединения';}
  };
  document.addEventListener('forma:render-job-status',progressListener);
 }
 async function runAI(kind){
  if(busy)return;
  if(!confirm('Создать один фотореалистичный рендер? Это платная операция; геометрия участка останется неизменной.'))return;
  busy=true;$('#lpAi',modal).disabled=true;showRender();
  say('Генерация начата. Этапы отображаются на отдельном экране.');
  try{
   const target=selected?.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.house;
   const payload=kind==='roof'
    ?{image:target?.photo||null,roofTopView:{width:target?.width,height:target?.height,roof:target?.roof},quality:'high',quantity:1}
    :{image:await rasterize(false),reference:doc.house.photo||null,landscapeMasterplan:coordinateSummary(doc),quality:'high',quantity:1};
   if(!payload.image)throw Error('Загрузите фотографию строения.');
   const source=$('#lpRenderSourceImage',modal);if(source){source.src=payload.image;source.hidden=false;}
   renderStage('running','Создаём фотореалистичный ландшафт','Используем измеряемый план и фототекстуры материалов.');
   $('#lpRenderQueue',modal).textContent='Передано на сервер';
   // Shared FIFO queue preserves its job ID and prevents duplicate paid requests.
   const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.images?.[0])throw Error(data.error||'Сервер не выдал изображение. Проверьте восстановление задания перед повтором.');
   const result='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
   renderStage('save','Сохраняем визуализацию','Получаем готовый файл и привязываем его к проекту.');
   if(kind==='roof'){
    if(target===doc.house){roofArt=result;await storage('roof',result).catch(()=>{});}
    else{roofArts.set(target.id,result);await storage('roof-'+target.id,result).catch(()=>{});}
   }else{preview=result;previewModel=JSON.stringify(doc);photoVisible=true;await storage('preview',result).catch(()=>{});await storage('preview-model',JSON.stringify(doc)).catch(()=>{});}
   drawMap();say('Готово. Размеры остались в геометрической модели.');
   stopRenderClock();
   renderStage('success','Визуализация готова','Готовый кадр можно скачать или посмотреть на плане.');$('#lpRenderQueue',modal).textContent='Результат получен';
  }catch(err){
   stopRenderClock();
   const message=err?.name==='TimeoutError'?'Сервер не ответил вовремя. Запрос мог быть оплачен — не запускайте повторно.':err?.message||'Ошибка создания визуализации.';
   say(message);renderStage('error','Не удалось получить результат',message);
   $('#lpRenderQueue',modal).textContent='Возможен восстановимый результат в очереди';
  }finally{busy=false;$('#lpAi',modal).disabled=false;}
 }
 function exportCSV(){
  const r=report(doc),rows=[['Категория','Объект','Количество, шт','Площадь, м²','Длина, м']];
  for(const [id,n] of Object.entries(r.counts)){const x=byId(id);rows.push([x.group,x.name,n,r.areas[id]??'',r.lengths[id]??''])}
  download(title()+'-vedomost.csv','\uFEFF'+rows.map(v=>v.map(k=>'"'+String(k).replaceAll('"','""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8');
 }
 function click(e){
  const b=e.target.closest('button');if(!b||busy)return;
  if(b.dataset.pathMaterial){chosen=b.dataset.pathMaterial;category='pavers';mode='path';points=[];draw();revealCanvas();say('Выбрано мощение: '+itemCatalog().name);return}
  if(b.dataset.areaMaterial){chosen=b.dataset.areaMaterial;category=itemCatalog().group;mode='area';points=[];brush=null;draw();revealCanvas();say('Область: '+itemCatalog().name+' — выберите кисть или лассо.');return}
  if(b.dataset.areaTool){areaTool=b.dataset.areaTool;points=[];brush=null;draw();revealCanvas();say(areaTool==='brush'?'Проведите пальцем или мышью по нужной области.':'Поставьте точки контура и нажмите «Завершить».');return}
  if(b.dataset.category){category=b.dataset.category;chosen=CATALOG.find(x=>x.group===category).id;drawPalette();return}
  if(b.dataset.asset){chosen=b.dataset.asset;const g=itemCatalog().group;setMode(g==='pavers'?'path':['fills','lawns','ponds'].includes(g)?'area':'place');return}
  if(b.dataset.tool){setMode(b.dataset.tool);return}
  if(b.dataset.pathShape){pathShape=b.dataset.pathShape;points=[];drawMap();drawPalette();revealCanvas();say(pathShape==='free'?'Свободная форма: ставьте точки в любом направлении.':pathShape==='diagonal'?'Диагонали: точная привязка под 45° к первой стороне участка.':'Параллельно: точная привязка к первой стороне участка и перпендикулярам.');return}
  if(b.dataset.quickCategory){category=b.dataset.quickCategory;chosen=CATALOG.find(x=>x.group===category)?.id||chosen;setMode(category==='pavers'?'path':['lawns','fills','ponds'].includes(category)?'area':'place');return}
  if(b.id==='lpPhotoToggle'){if(preview){if(previewModel!==JSON.stringify(doc)){photoVisible=false;drawMap();say('План изменён. Создайте новый фотореалистичный генплан, чтобы увидеть обновлённое размещение.');return}}photoVisible=!photoVisible;drawMap();return}
  if(b.id==='lpFinish'){finish();return}
  if(b.id==='lpCancel'){endDrawing();return}
  if(b.dataset.undo!==undefined){reverse('undo');return}
  if(b.dataset.redo!==undefined){reverse('redo');return}
  if(b.dataset.delete!==undefined){deleteSelected();return}
  if(b.dataset.concept!==undefined){
   if(!confirm('Добавить восемь редактируемых растений, сохраняя текущие объекты?'))return;
   checkpoint();const samples=[['pine',.13,.16],['birch',.85,.15],['oak',.12,.85],['spruce',.85,.81],['hydrangea',.28,.35],['juniper',.7,.36],['spirea',.25,.69],['barberry',.72,.65]];
   for(const [id,x,y] of samples){const entry=byId(id);doc.objects.push({id:uid(),catalogId:id,type:entry.group,x:x*doc.site.width,y:y*doc.site.height,diameter:entry.diameter,rotation:0})}
   save();draw();say('Редактируемый эскиз посадок готов. Проверьте отступы и размеры взрослых крон.');return;
  }
  if(b.dataset.addBuilding!==undefined){if(doc.buildings.length>=24){say('Лимит — 24 дополнительных строения.');return}checkpoint();const type=b.dataset.addBuilding,aux={id:'b-'+uid().slice(2),type,x:doc.site.width*.76,y:doc.site.height*.7,width:type==='garage'?7:type==='bath'?6:4,height:type==='garage'?6:4,rotation:0,roof:'gable',roofColor:'#454543',photo:null};doc.buildings.push(aux);selected='building:'+aux.id;save();draw();say('Строение добавлено. Укажите его точное положение, размеры и поворот.');return}
  if(b.dataset.deleteBuilding!==undefined&&selected?.startsWith('building:')){const id=selected.slice(9);checkpoint();doc.buildings=doc.buildings.filter(x=>x.id!==id);roofArts.delete(id);selected=null;save();draw();return}
  if(b.dataset.renderClose!==undefined){if(!busy){$('#lpRenderOverlay',modal).hidden=true;}return}
  if(b.dataset.renderDownload!==undefined){if(preview){const a=document.createElement('a');a.href=preview;a.download=title()+'-visualization.'+(preview.startsWith('data:image/webp')?'webp':'png');document.body.append(a);a.click();a.remove();}return}
  if(b.dataset.ai!==undefined){runAI('plan');return}
  if(b.dataset.roof!==undefined){runAI('roof');return}
  if(b.dataset.svg!==undefined){inlineSVGAssets(drawSvg()).then(svg=>{download(title()+'-genplan.svg',svg,'image/svg+xml');say('Сохранён самостоятельный SVG генплана с встроенными изображениями.');}).catch(err=>say('SVG: '+err.message));return}
  if(b.dataset.png!==undefined){rasterize(true).then(src=>{const a=document.createElement('a');a.href=src;a.download=title()+'-2k.png';a.click()}).catch(err=>say('PNG: '+err.message));return}
  if(b.dataset.json!==undefined){download(title()+'-model.json',JSON.stringify(doc,null,2),'application/json');return}
  if(b.dataset.csv!==undefined){exportCSV();return}
  if(b.dataset.pdf!==undefined){
   say('Собираем PDF-альбом с измеряемым генпланом, растениями и светильниками.');
   Promise.all([import('./forma-landscape-pdf.js'),rasterize(true)]).then(async([module,plan])=>{
    const validPhoto=preview&&previewModel===JSON.stringify(doc)?preview:null;
    const blob=await module.buildLandscapeAlbum(doc,plan,validPhoto);
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=title()+'-landscape-album.pdf';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    say('PDF-альбом готов. Планы, растения, освещение и покрытия выгружены.');
   }).catch(err=>say('PDF: '+(err?.message||'Ошибка экспорта')));
   return;
  }
  if(b.dataset.icon!==undefined){const entry=itemCatalog();download('FORMA-'+entry.id+'-1080.svg',assetSVG(entry,{size:1080,transparent:true}),'image/svg+xml');say('Векторная иконка 1080×1080 экспортирована.');return}
  if(b.dataset.iconPng!==undefined){
   const entry=itemCatalog(),img=new Image();
   img.onload=()=>{
    const c=document.createElement('canvas');c.width=1080;c.height=1080;
    const ctx=c.getContext('2d');
    const asJpg=['pavers','fills','lawns'].includes(entry.group);
    if(asJpg){ctx.fillStyle='#fff';ctx.fillRect(0,0,1080,1080);}
    ctx.drawImage(img,0,0,1080,1080);
    const format=asJpg?'image/jpeg':'image/png',ext=asJpg?'jpg':'png';
    const a=document.createElement('a');a.href=c.toDataURL(format,0.94);
    a.download='FORMA-'+entry.id+'-1080.'+ext;a.click();
    say(ext.toUpperCase()+' 1080×1080 сохранён.');
   };
   img.onerror=()=>say('Не удалось подготовить карточку.');
   img.src=iconURL(entry);return;
  }
  if(b.dataset.close!==undefined){close();return}
 }
 function deleteSelected(){
  if(busy||!selected||selected==='house')return;
  checkpoint();photoVisible=false;
  if(selected.startsWith('building:')){const id=selected.slice(9);doc.buildings=doc.buildings.filter(x=>x.id!==id);roofArts.delete(id)}
  else doc.objects=doc.objects.filter(x=>x.id!==selected);
  selected=null;save();draw();say('Объект удалён. Отменить: Ctrl+Z. Обновите рендер после изменений.');
 }
 function onKey(e){
  if(!modal?.open||busy)return;
  if(e.key==='Escape'){if(mode!=='select'){e.preventDefault();endDrawing()}else close();return}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if((e.key==='Delete'||e.key==='Backspace')&&selected&&!points.length){e.preventDefault();deleteSelected();return}
  if(e.key==='Enter'&&points.length){e.preventDefault();finish()}
  if(e.key==='Backspace'&&points.length){e.preventDefault();points.pop();drawMap();drawPalette()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();reverse(e.shiftKey?'redo':'undo')}
 }
 async function open(){
  if(modal?.open)return;
  lastFocus=document.activeElement;pid=activeProject();try{doc=normalizeProject(JSON.parse(localStorage.getItem(siteKey())||'null'))}catch{doc=freshProject()}
  mode='select';chosen='pine';category='trees';selected=null;points=[];brush=null;areaTool='polygon';undo=[];redo=[];preview=null;roofArt=null;roofArts=new Map();pathShape='orthogonal';photoVisible=true;
  modal=document.createElement('dialog');modal.id='faLandscapeMasterplan';modal.className='fa-landscape-masterplan';
  modal.innerHTML=`<div class="lp-shell"><header class="lp-head"><div class="lp-brand"><b>FORMA</b><span>ЛАНДШАФТНЫЙ ПРОЕКТ · ВИД СВЕРХУ</span></div><div><span id="lpSourceState"></span><button type="button" data-close aria-label="Закрыть">×</button></div></header><div class="lp-layout"><aside class="lp-sidebar"><div class="lp-sidebar-head"><b>БИБЛИОТЕКА</b><small>46 объектов · 8 категорий</small></div><div id="lpPalette"></div><button type="button" data-icon class="lp-export-icon">Экспорт · SVG 1080</button><button type="button" data-icon-png class="lp-export-icon">Экспорт карточки · PNG/JPG 1080</button></aside><section class="lp-work"><div class="lp-tools"><button type="button" data-tool="select">↖ Переместить</button><button type="button" data-delete title="Удалить выбранный объект · Delete">⌫ Удалить</button><button type="button" data-tool="boundary">⬡ Граница</button><button type="button" data-tool="path">⌁ Дорожка</button><button type="button" data-tool="area">▧ Область</button><button type="button" data-undo>↶</button><button type="button" data-redo>↷</button></div><div class="lp-path-controls"><button type="button" id="lpPhotoToggle" title="Переключение между точным чертежом и фотореалистичным рендером">▣ Фото-рендер</button><span id="lpToolName">Выбор</span><div class="lp-path-mode" id="lpPathControls" hidden><span id="lpSelectedMaterial">Брусчатка</span><button type="button" data-path-shape="orthogonal" aria-pressed="true">Параллельно · 90°</button><button type="button" data-path-shape="diagonal" aria-pressed="false">Диагонали · 45°</button><button type="button" data-path-shape="free" aria-pressed="false">Свободная форма</button><div id="lpPathMaterials" class="lp-material-choices"></div></div><div id="lpAreaControls" class="lp-area-controls" hidden><div class="lp-area-modes"><button type="button" data-area-tool="brush">✎ Кисть</button><button type="button" data-area-tool="polygon">⬠ Полигональное лассо</button><label>Диаметр <input id="lpBrushSize" type="range" min=".5" max="12" step=".25" value="1.5"> <span id="lpBrushLabel">1.5 м</span></label></div><div id="lpAreaMaterials" class="lp-area-materials"></div></div><label>Ширина дорожки <input id="lpWidth" type="number" min=".4" max="10" step=".05" value="1.2"> м</label><label><input id="lpSnap" type="checkbox" checked> Шаг 5 см</label><button id="lpFinish" type="button" disabled>✓ Завершить</button><button id="lpCancel" type="button" disabled>✕ Прервать</button></div><div class="lp-category-shortcuts"><button type="button" data-quick-category="pavers">▦ Дорожки</button><button type="button" data-quick-category="lawns">≋ Газоны</button><button type="button" data-quick-category="lights">☼ Светильники</button><button type="button" data-quick-category="trees">♧ Деревья</button><button type="button" data-quick-category="shrubs">◈ Кустарники</button><button type="button" data-quick-category="ponds">≈ Водоёмы</button><button type="button" data-quick-category="fills">◌ Отсыпки</button></div><div class="lp-canvas"><div id="lpMap"></div></div><footer class="lp-work-foot"><span id="lpStatus" role="status">План строится в метрах. Дорожки рисуются точками, не кистью.</span><button type="button" data-concept>＋ Эскиз посадок</button></footer></section><aside class="lp-properties"><div id="lpInspector"></div><section class="lp-outputs"><label>Набросок / схема<input id="lpUnderlay" type="file" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="lpAi" data-ai>Создать фотореалистичный генплан</button><small>Генерация меняет только презентацию. Размеры и координаты остаются в 2D-модели.</small><div><button type="button" data-svg>SVG</button><button type="button" data-png>PNG 2K</button><button type="button" data-csv>Ведомость CSV</button><button type="button" data-pdf class="lp-export-album">▣ PDF-альбом проекта</button><button type="button" data-json>Модель JSON</button></div></section></aside></div><div id="lpRenderOverlay" class="lp-render-overlay" hidden role="dialog" aria-modal="true" aria-label="Ход генерации ландшафта"><div class="lp-render-panel"><header class="lp-render-header"><div class="lp-render-brand">FORMA <span>LANDSCAPE STUDIO</span></div><div class="lp-render-live"><span class="lp-render-dot"></span> RENDER ENGINE</div></header><div class="lp-render-preview" id="lpRenderImageArea"><img id="lpRenderSourceImage" alt="Исходный измеряемый генплан" hidden><div id="lpRenderOrbit" class="lp-render-orbit"><span></span><span></span><span></span><i>F</i></div><img id="lpRenderOutputImage" alt="Фотореалистичный ландшафтный генплан" hidden/></div><div class="lp-render-content"><div class="lp-render-eyebrow">ЛАНДШАФТНАЯ ВИЗУАЛИЗАЦИЯ</div><h2 id="lpRenderTitle">Создаём ваш ландшафт</h2><p id="lpRenderDesc">Подготавливаем план, материалы и окружение.</p><div class="lp-render-timeline"><div data-render-step="prepare"><b>01</b><span>Подготовка геометрии<small>Сверяем план и покрытия</small></span></div><div data-render-step="running"><b>02</b><span>Фотореалистичная визуализация<small>Растительность, фактуры, свет</small></span></div><div data-render-step="save"><b>03</b><span>Результат<small>Сохранение в проект</small></span></div></div><div class="lp-render-bottom"><span id="lpRenderElapsed">Прошло 00:00</span><span id="lpRenderQueue" aria-live="polite">Продолжительность зависит от сервера</span></div><div class="lp-render-result-actions" id="lpRenderActions" hidden><button type="button" data-render-download>↓ Сохранить изображение</button><button type="button" data-render-close>Вернуться к плану</button></div><p class="lp-render-note">Процент готовности модель не сообщает. Повторное нажатие не требуется.</p></div></div></div></div>`;
  document.body.append(modal);modal.addEventListener('click',click);
  modal.addEventListener('change',e=>{
   if(e.target.matches('#lpUnderlay,#lpHousePhoto,#lpAuxPhoto')){uploadPhoto(e.target.files?.[0],e.target.id==='lpHousePhoto'?'house':e.target.id==='lpAuxPhoto'?'aux':'underlay').catch(err=>say(err.message));return}
   if(e.target.id==='lpSnap'){snap=e.target.checked;return}
    if(e.target.id==='lpBrushSize'){$('#lpBrushLabel',modal).textContent=Number(e.target.value).toFixed(2)+' м';return}
   change(e);
  });
  modal.addEventListener('input',e=>{if(e.target.id==='lpBrushSize'){$('#lpBrushLabel',modal).textContent=Number(e.target.value).toFixed(2)+' м';}});
  modal.addEventListener('contextmenu',e=>{if(e.target.closest('#lpSvg')&&mode!=='select'){e.preventDefault();endDrawing();}});
  modal.addEventListener('dblclick',e=>{if(e.target.closest('#lpSvg')&&points.length>=(mode==='path'?2:3)){e.preventDefault();finish();}});
  modal.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close()});
  document.addEventListener('keydown',onKey);modal.showModal();draw();
  enablePremiumAssets().then(ok=>{if(modal?.open){draw();if(ok)say('Библиотека готова: '+(photographicAssetCount()+cardPhotoCount())+' фотографических превью, остальные — прежние 1080×1080.');}}).catch(()=>{});
  try{[preview,roofArt,previewModel]=await Promise.all([storage('preview').catch(()=>null),storage('roof').catch(()=>null),storage('preview-model').catch(()=>null)]);if(previewModel!==JSON.stringify(doc))photoVisible=false;await Promise.all(doc.buildings.map(async b=>{const img=await storage('roof-'+b.id).catch(()=>null);if(img)roofArts.set(b.id,img)}));if(modal?.open)drawMap()}catch{}
 }
 function close(){
  if(busy){say('Сначала завершите AI-запрос.');return}
  if(!modal)return;stopRenderClock();save();modal.close();modal.remove();modal=null;document.removeEventListener('keydown',onKey);lastFocus?.focus?.({preventScroll:true});
 }
 window.FORMA_LANDSCAPE_PROJECT={open,close,getProject:()=>normalizeProject(doc),getReport:()=>report(doc)};
