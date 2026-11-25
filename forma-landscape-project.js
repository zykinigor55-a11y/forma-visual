import {GROUPS,CATALOG,TREE_HEIGHT_M,SCENE_OPTIONS,byId,freshProject,normalizeProject,report,lineLength,polygonArea,areaFor,rectBoundary,coordinateSummary,snapPathPoint,translatePoints,isInside,normalizeCornerRounds,pavingRibbonPolygon,normalizePavingSegments,pavingSegments,roundedPavingCenterline} from './forma-landscape-project-core.js?v=path-segments-P22';
import {assetSVG,iconURL,roofingSVG,enablePremiumAssets,fallbackIconURL,premiumIconURL,photographicAssetCount,isPhotographic,cardPhotoURL,hasPhotographicCard,cardPhotoCount} from './forma-landscape-project-graphics.js?v=plant-plan-assets-v1';
import {proposeLandscape} from './forma-landscape-auto-layout.js';
import {brushPolygon} from './forma-landscape-brush.js';
import {premiumIcon, premiumIcon as categoryIcon} from './forma-premium-icons.js';

 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),num=(v,d=2)=>Number(v).toFixed(d);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>'o-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 let modal=null,doc=freshProject(),pid='',mode='select',category='trees',chosen='pine',points=[],selected=null,drag=null,undo=[],redo=[],busy=false,preview=null,roofArt=null,roofArts=new Map(),snap=true,pathShape='orthogonal',generationStarted=0,progressTicker=null,progressListener=null,photoVisible=true;
 let pathInput='points',pathStroke=null,pathFrame=0,pathDraftSource=null,pathShapeExplicit=false,pointPathShape='orthogonal',pointGesture=null,pointPreview=null;
 let lastFocus=null,previewModel=null,previewKind=null,renderOutput=null,areaTool='brush',brush=null;
 let viewScale=1,viewCentre=null,pinch=null,placementCount=0,presentationMode='presentation',showDimensions=false;
const hiddenPlanLayers=new Set();
const PLAN_LAYERS=[['trees','Деревья'],['shrubs','Кусты'],['pavers','Дорожки'],['fills','Отсыпки'],['lawns','Газоны'],['ponds','Вода'],['boulders','Камни'],['lights','Свет']];
 const siteKey=()=>`forma-landscape-masterplan-v1-${pid}`;
 const styleKey=()=>`forma-landscape-presentation-mode-${pid}`;
 function readPresentationMode(){
  try{const v=localStorage.getItem(styleKey());return ['presentation','planting','technical'].includes(v)?v:'presentation'}
  catch{return 'presentation'}
 }
 const activeProject=()=>{try{return JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}').activeId||'landscape'}catch{return 'landscape'}};
 function save(){try{localStorage.setItem(siteKey(),JSON.stringify(doc))}catch{say('Не удалось сохранить проект локально. Экспортируйте JSON.');}}
 function say(str){const el=$('#lpStatus',modal);if(el)el.textContent=str}
 function checkpoint(){photoVisible=false;undo.push(JSON.stringify(doc));if(undo.length>40)undo.shift();redo=[]}
 function reverse(which){cancelPathStroke();cancelCornerStroke();if(mode==='corner')mode='select';const from=which==='undo'?undo:redo,to=which==='undo'?redo:undo;if(!from.length)return;say('Восстановлена версия схемы.');to.push(JSON.stringify(doc));doc=normalizeProject(JSON.parse(from.pop()));photoVisible=false;selected=null;points=[];save();draw();}
 const metric=(p)=>num(p.x,3)+','+num(p.y,3),poly=arr=>arr.map(metric).join(' '),dline=arr=>arr.map((p,i)=>(i?'L':'M')+metric(p)).join(' ');
 const itemCatalog=()=>byId(chosen);
 function selectedColor(){return byId(chosen)?.color||'#8eaa85'}
 function cameraBox(){
  const w=doc.site.width,h=doc.site.height,z=clamp(viewScale,1,8),vw=w/z,vh=h/z;
  const cx=clamp(viewCentre?.x??w/2,vw/2,w-vw/2),cy=clamp(viewCentre?.y??h/2,vh/2,h-vh/2);
  return {x:cx-vw/2,y:cy-vh/2,width:vw,height:vh};
 }
 function applyCameraBox(){const svg=$('#lpSvg',modal);if(!svg)return;const b=cameraBox();svg.setAttribute('viewBox',[b.x,b.y,b.width,b.height].join(' '));const hud=$('#lpZoomValue',modal);if(hud)hud.textContent=Math.round(viewScale*100)+'%';}
 function zoomTo(scale,centre){
  viewScale=clamp(scale,1,8);
  if(centre)viewCentre={x:clamp(centre.x,0,doc.site.width),y:clamp(centre.y,0,doc.site.height)};
  if(viewScale===1)viewCentre=null;
  applyCameraBox();
  const labels=$('#lpPlanCallouts',modal);
  if(labels)labels.outerHTML=planDimensions(doc.site.boundary||rectBoundary(doc.site.width,doc.site.height),planFontSize(),false);
 }
 function focusObject(){
  const obj=selected==='house'?doc.house:selected?.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.objects.find(x=>x.id===selected);
  if(!obj){say('Сначала выберите растение, камень или постройку. Затем нажмите «К объекту».');return}
  const points=obj.points,c=points?.length?{x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length}:{x:obj.x,y:obj.y};
  zoomTo(Math.max(2.5,viewScale),c);
  say('Приближено к выбранному объекту · '+Math.round(viewScale*100)+'%. Размеры участка не изменены.');
 }

 function sunSettings(){
  const a=doc.atmosphere||{},t={morning:[105,26],day:[182,62],evening:[258,6],'blue-hour':[258,0],night:[0,0]}[a.time]||[182,62],w={sunny:1,overcast:.17,'after-rain':.64,rain:.08,fog:.035,snow:.14};
  return {az:t[0],el:t[1],strength:(w[a.weather]??1)*(t[1]>0?1:0),season:a.season||'summer',time:a.time||'day',weather:a.weather||'sunny'};
 }
 function treeShadow(item,entry,d,treeIcon=iconURL){
  const sun=sunSettings();if(!sun.el||sun.strength<.01)return '';
  const height=clamp(Number(item.height)||(TREE_HEIGHT_M[entry.id]||12),.15,40);
  const physical=height/Math.tan(sun.el*Math.PI/180);
  const offset=Math.min(physical,Math.max(.16,Math.min(d*.32,1.6)));
  const a=(sun.az+(doc.north||0))*Math.PI/180;
  const dx=-Math.sin(a)*offset,dy=Math.cos(a)*offset;
  return '<image href="'+treeIcon(entry)+'" x="'+(item.x-d/2+dx)+'" y="'+(item.y-d/2+dy)+'" width="'+d+'" height="'+d+'" filter="url(#lpTreeCastShadow)" opacity="'+(.48*sun.strength).toFixed(3)+'" pointer-events="none"/>'
   +'<path d="M'+item.x+' '+item.y+'l'+dx+' '+dy+'" fill="none" stroke="#122216" stroke-width="'+Math.min(d*.12,.45)+'" stroke-linecap="round" opacity="'+(.2*sun.strength).toFixed(3)+'" pointer-events="none"/>'
   +'<ellipse cx="'+item.x+'" cy="'+item.y+'" rx="'+(d*.22)+'" ry="'+(d*.17)+'" fill="#122216" opacity="'+(.085*sun.strength).toFixed(3)+'" pointer-events="none"/>';
 }
 function foliageTone(entry){
  const v=sunSettings(),evergreen=['pine','spruce'].includes(entry.id);
  if(v.season==='winter')return evergreen?'saturate(.78) brightness(.95)':'saturate(.18) brightness(1.20) opacity(.70)';
  if(v.season==='autumn')return evergreen?'saturate(.95)':'sepia(.62) saturate(1.4) hue-rotate(-15deg)';
  return v.season==='spring'?'saturate(1.1) brightness(1.04)':'none';
 }
 function atmosphereOverlay(){
  const v=sunSettings(),t={morning:['#f6dab1',.065],day:['#fff',0],evening:['#eca75e',.12],'blue-hour':['#557bb5',.27],night:['#102c48',.44]}[v.time],s={spring:['#d4ecc7',.025],summer:['#fff',0],autumn:['#ce995c',.065],winter:['#d8eefa',.13]}[v.season],w={sunny:['#fff',0],overcast:['#91a8b7',.09],'after-rain':['#9cbab2',.08],rain:['#64809b',.21],fog:['#e1e2df',.22],snow:['#e1e9f4',.18]}[v.weather];
  return [t,s,w].filter(x=>x&&x[1]>.005).map(([color,opacity])=>'<rect width="'+doc.site.width+'" height="'+doc.site.height+'" fill="'+color+'" opacity="'+opacity+'" pointer-events="none"/>').join('');
 }
 function planLabelPoint(item,group){
  const pts=item.points;
  if(group==='pavers'||item.geometry==='strip'){
   const segments=pts.slice(1).map((p,i)=>({a:pts[i],b:p,length:Math.hypot(p.x-pts[i].x,p.y-pts[i].y)}));
   const segment=segments.reduce((best,next)=>!best||next.length>best.length?next:best,null);
   return segment?{x:(segment.a.x+segment.b.x)/2,y:(segment.a.y+segment.b.y)/2}:null;
  }
  const centre=pts.reduce((p,q)=>({x:p.x+q.x/pts.length,y:p.y+q.y/pts.length}),{x:0,y:0});
  // A concave bed can have its mean outside its contour; search interior scan lines.
  const inside=p=>isInside(p,pts)&&!item.holes?.some(hole=>isInside(p,hole));
  if(inside(centre))return centre;
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const x0=Math.min(...xs),y0=Math.min(...ys),x1=Math.max(...xs),y1=Math.max(...ys);
  for(const row of [.5,.25,.75,.125,.875])for(const col of [.5,.25,.75,.125,.875]){
   const candidate={x:x0+(x1-x0)*col,y:y0+(y1-y0)*row};
   if(inside(candidate))return candidate;
  }
  return null;
 }
 const planFontSize=()=>Math.max(.4,Math.min(doc.site.width,doc.site.height)*.027);
 function planDimensions(bound,fs,full){
  const view=full?{x:0,y:0,width:doc.site.width,height:doc.site.height}:cameraBox();
  const canvas=!full&&$('#lpMap',modal),toolbar=canvas&&$('.lp-zoom-tools',modal);
  const pixels=canvas?Math.min(canvas.clientWidth/view.width,canvas.clientHeight/view.height):0;
  const size=pixels?clamp(fs*.68,11/pixels,14/pixels):fs*.68;
  const boxes=[];
  if(toolbar&&pixels){
   const frame=canvas.getBoundingClientRect(),hud=toolbar.getBoundingClientRect();
   const left=frame.left+(frame.width-view.width*pixels)/2,top=frame.top+(frame.height-view.height*pixels)/2;
   boxes.push({x:view.x+(hud.left+hud.width/2-left)/pixels,
    y:view.y+(hud.top+hud.height/2-top)/pixels,width:hud.width/pixels,height:hud.height/pixels});
  }
  const dimText=(anchorX,anchorY,value,details=value,itemId=null)=>{
   if(anchorX<view.x||anchorX>view.x+view.width||anchorY<view.y||anchorY>view.y+view.height){
    if(itemId||(!full&&viewScale>1))return '';
   }
   const lines=Array.isArray(value)?value:[value];
   const compact=typeof value==='string'&&itemId;
   const width=compact?(value.length*.62+.55)*size:Math.max(...lines.map(line=>[...line].length))*size*.68+size;
   const height=(lines.length*1.22+.48)*size,gap=size*.22;
   if(width+2*gap>view.width||height+2*gap>view.height)return '';
   const stepX=Math.min(width+gap*1.25,size*4),stepY=height+gap*1.25;
   for(let ring=0;ring<=4;ring++)for(let row=-ring;row<=ring;row++)for(let col=-ring;col<=ring;col++){
    if(Math.max(Math.abs(row),Math.abs(col))!==ring)continue;
    const x=clamp(anchorX+col*stepX,view.x+width/2+gap,view.x+view.width-width/2-gap);
    const y=clamp(anchorY+row*stepY,view.y+height/2+gap,view.y+view.height-height/2-gap);
    if(boxes.some(b=>Math.abs(x-b.x)<(width+b.width)/2+gap&&Math.abs(y-b.y)<(height+b.height)/2+gap))continue;
    boxes.push({x,y,width,height});
    const guide=Math.abs(anchorX-x)>width/2||Math.abs(anchorY-y)>height/2
     ?`<path d="M${anchorX} ${anchorY}L${x} ${y}" fill="none" stroke="#66756b" stroke-width="${size*.085}"/>`:'';
    const hit=itemId&&!full&&mode==='select'?` data-object="${esc(itemId)}" pointer-events="all" style="cursor:pointer"`:'';
    return guide+`<g${hit}><title>${esc([details].flat().join(' · '))}</title><rect x="${x-width/2}" y="${y-height/2}" width="${width}" height="${height}" rx="${size*.22}" fill="#fffdf7" stroke="#938f7d" stroke-width="${size*.07}"/>`+
     lines.map((line,i)=>`<text x="${x}" y="${y+(i-(lines.length-1)/2)*size*1.22}" text-anchor="middle" dominant-baseline="central" fill="#27352c" style="font:${size}px Arial,sans-serif;letter-spacing:normal;word-spacing:normal;stroke:none">${esc(line)}</text>`).join('')+'</g>';
   }
   return '';
  };
  const metricValue=value=>num(value).replace('.',',');
  const measure=(a,b,caption,offset=fs*.46)=>{
   const length=Math.hypot(b.x-a.x,b.y-a.y);if(length<.03)return '';
   const dx=(b.y-a.y)*offset/length,dy=(a.x-b.x)*offset/length;
   return `<path d="M${a.x} ${a.y}l${dx*1.25} ${dy*1.25}M${b.x} ${b.y}l${dx*1.25} ${dy*1.25}M${a.x+dx} ${a.y+dy}L${b.x+dx} ${b.y+dy}" fill="none" stroke="#555f52" stroke-width=".055"/>`+
    dimText((a.x+b.x)/2+dx,(a.y+b.y)/2+dy,caption||metricValue(length)+' м');
  };
  const points=polygonArea(bound)>0&&bound.reduce((sum,p,i)=>{const q=bound[(i+1)%bound.length];return sum+p.x*q.y-q.x*p.y},0)>0?[...bound].reverse():bound;
  let content=showDimensions?points.map((p,i)=>measure(p,points[(i+1)%points.length])).join(''):'';
  if(showDimensions)for(const b of [doc.house,...doc.buildings]){
   const x=b.width/2,y=b.height/2;
   const radians=b.rotation*Math.PI/180;
   const point=(u,v)=>({x:b.x+u*Math.cos(radians)-v*Math.sin(radians),y:b.y+u*Math.sin(radians)+v*Math.cos(radians)});
   content+=measure(point(x,-y),point(-x,-y),metricValue(b.width)+' м',-fs*.55)+
    measure(point(x,y),point(x,-y),metricValue(b.height)+' м',-fs*.55);
  }
  const objects=[...doc.objects.entries()];
  if(selected){const index=objects.findIndex(([,item])=>item.id===selected);if(index>0)objects.unshift(...objects.splice(index,1));}
  for(const [index,item] of objects){
   const entry=byId(item.catalogId);if(!entry||(!full&&hiddenPlanLayers.has(entry.group)))continue;
   const name=(index+1)+'. '+entry.name;
   const labelAt=(p,values)=>{
    const details=showDimensions?[name,...values]:[name];
    const compact=String(index+1);
    const detailed=item.id===selected||full;
    return (detailed?dimText(p.x,p.y,details,details,item.id):'')||dimText(p.x,p.y,compact,details,item.id);
   };
   if(item.points?.length){
    const p=planLabelPoint(item,entry.group);if(!p)continue;
    const values=entry.group==='pavers'||item.geometry==='strip'
     ?['Длина '+metricValue(lineLength(item.points))+' м','Ширина '+metricValue(item.width)+' м']
     :['Площадь '+metricValue(areaFor(doc,item))+' м²'];
    content+=labelAt(p,values);
   }else{
    const lines=[];
    if(Number(item.diameter)>0)lines.push((['trees','shrubs'].includes(entry.group)?'Крона ':'Диаметр ')+metricValue(item.diameter)+' м');
    if(Number(item.height)>0)lines.push('Высота '+metricValue(item.height)+' м');
    content+=labelAt(item,lines);
   }
  }
  return '<g id="lpPlanCallouts" font-family="Arial,sans-serif" pointer-events="none">'+content+'</g>';
 }
 // Local photographs verified in the bundled catalog. Tile sizes describe the
 // full photo repeat in metres (not the size of a single paving stone).
 const PAVING_PHOTO_REPEAT=Object.freeze({'concrete-pavers':2.4,'granite-setts':1.8,'clinker-herringbone':1.55,'slate-pavers':1.8,'radial-setts':1.65,'grass-grid':1.8});
 let selectedSegmentIndex=0;
 function segmentIndex(obj){return Math.max(0,Math.min((obj?.points?.length||2)-2,selectedSegmentIndex));}
 function segmentSettings(obj){return normalizePavingSegments(obj)[segmentIndex(obj)];}
 function setSegmentSettings(obj,values){const parts=normalizePavingSegments(obj),i=segmentIndex(obj);if(parts[i])parts[i]={...parts[i],...values};obj.segments=parts;}
 let cornerRadius=1.5,cornerStrength=.65,cornerAction='smooth',cornerStroke=null,cornerCursor=null;
 function cornerControls(){
  return '<div class="lp-corner-actions"><button type="button" data-corner-brush="smooth" aria-pressed="'+(mode==='corner'&&cornerAction==='smooth')+'">Скруглить</button><button type="button" data-corner-brush="restore" aria-pressed="'+(mode==='corner'&&cornerAction==='restore')+'">Восстановить</button></div><div class="lp-corner-settings"><label>Радиус <output data-corner-radius-value>'+num(cornerRadius,1)+' м</output><input type="range" data-corner-radius min=".2" max="5" step=".1" value="'+cornerRadius+'"></label><label>Сила <output data-corner-strength-value>'+Math.round(cornerStrength*100)+'%</output><input type="range" data-corner-strength min="10" max="100" step="5" value="'+Math.round(cornerStrength*100)+'"></label></div>';
 }
 function cancelCornerStroke(){
  if(cornerStroke){const obj=doc.objects.find(o=>o.id===cornerStroke.id);if(obj)obj.cornerRounds=cornerStroke.before;cornerStroke=null;}
  cornerCursor=null;
 }
 function startCornerTool(action){
  if(!['select','corner'].includes(mode))return;
  const obj=selectedPlanObject();if(obj?.type!=='pavers')return;
  if(obj.points.length<3){say('Для скругления нужен поворот дорожки. Торцы всегда прямые.');return}
  cancelCornerStroke();cornerAction=action;mode='corner';photoVisible=false;draw();say('Проведите кистью по нужному повороту. Торцы остаются прямыми.');
 }
 function updateCornerCursor(p){
  cornerCursor=p;const el=$('#lpCornerCursor',modal);if(el){el.setAttribute('cx',p.x);el.setAttribute('cy',p.y);el.setAttribute('r',cornerRadius);el.setAttribute('visibility','visible');}
 }
 function stampCorner(p,previous=p){
  const obj=selectedPlanObject();if(!cornerStroke||obj?.id!==cornerStroke.id)return;
  let changed=false;const dx=p.x-previous.x,dy=p.y-previous.y,d2=dx*dx+dy*dy;
  for(let i=1;i<obj.points.length-1;i++){
   if(cornerStroke.touched.has(i)||![segmentIndex(obj),segmentIndex(obj)+1].includes(i))continue;
   const v=obj.points[i],t=d2?clamp(((v.x-previous.x)*dx+(v.y-previous.y)*dy)/d2,0,1):0;
   const distance=Math.hypot(v.x-previous.x-dx*t,v.y-previous.y-dy*t);
   if(distance>cornerRadius+(segmentSettings(obj)?.width||obj.width)/2)continue;
   const a=obj.points[i-1],b=obj.points[i+1],la=Math.hypot(a.x-v.x,a.y-v.y),lb=Math.hypot(b.x-v.x,b.y-v.y);
   if(la<.05||lb<.05||Math.abs((a.x-v.x)*(b.y-v.y)-(a.y-v.y)*(b.x-v.x))/(la*lb)<.015)continue;
   const before=obj.cornerRounds[i]||0,limit=Math.min(5,la*.45,lb*.45);
   const amount=cornerRadius*cornerStrength;
   const next=cornerAction==='restore'?Math.max(0,before-amount):Math.max(before,Math.min(limit,before+amount));
   cornerStroke.touched.add(i);if(Math.abs(next-before)>.001){obj.cornerRounds[i]=next;changed=true;cornerStroke.changed=true;}
  }
  if(changed)drawMapBrush();updateCornerCursor(p);
 }
 function finishCornerStroke(cancel=false){
  const stroke=cornerStroke;if(!stroke)return;const obj=doc.objects.find(o=>o.id===stroke.id);cornerStroke=null;cornerCursor=null;
  if(obj){const next=obj.cornerRounds;obj.cornerRounds=stroke.before;if(!cancel&&stroke.changed){checkpoint();obj.cornerRounds=next;save();say('Форма углов сохранена. Торцы не изменены.');}}
  draw();
 }
 const pavingPhoto=entry=>'./assets/landscape-photo/'+entry.id+'.jpg?v=paving-plan-P19';
 function pavingPattern(id,entry,finished=false){
  const tile=PAVING_PHOTO_REPEAT[entry.id]||1.8;
  return '<defs><pattern id="'+id+'" patternUnits="userSpaceOnUse" width="'+tile+'" height="'+tile+'"><rect width="'+tile+'" height="'+tile+'" fill="'+entry.color+'"/><image href="'+(finished?fallbackIconURL(entry):pavingPhoto(entry))+'" x="0" y="0" width="'+tile+'" height="'+tile+'" preserveAspectRatio="xMidYMid slice"/></pattern></defs>';
 }
 function drawSvg(full=false,finished=false){
  const w=doc.site.width,h=doc.site.height,max=Math.max(w,h),fs=planFontSize(),bound=doc.site.boundary||rectBoundary(w,h);
  const planIcon=finished?fallbackIconURL:iconURL;
  const buildingName=b=>({house:'Дом',bath:'Баня',garage:'Гараж',gazebo:'Беседка',
   outbuilding:'Хозпостройка',greenhouse:'Теплица',carport:'Навес'})[b.type]||'Постройка';
  const annotation=(x,y,label)=>`<text x="${x}" y="${y}" font-size="${fs*.72}" fill="#39382d" style="letter-spacing:normal;word-spacing:normal;stroke:none" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-style="italic" pointer-events="none">${esc(label)}</text>`;
  const footprint=b=>`<g transform="translate(${b.x} ${b.y}) rotate(${b.rotation})"><rect x="${-b.width/2}" y="${-b.height/2}" width="${b.width}" height="${b.height}" fill="#e8e7d6" stroke="#666659" stroke-width=".15"/><path d="M${-b.width/2+.14} ${b.height/2-.14}V${-b.height/2+.14}H${b.width/2-.14}" fill="none" stroke="#fffdf0" stroke-width=".11"/></g>`+annotation(b.x,b.y,buildingName(b));
  const grid=max>140?5:max>80?2:1;
  let shapes=`<defs><filter id="lpTreeCastShadow" x="-200%" y="-200%" width="500%" height="500%"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .85 0"/><feGaussianBlur stdDeviation=".12"/></filter></defs><defs><pattern id="lpGrid" width="${grid}" height="${grid}" patternUnits="userSpaceOnUse"><path d="M${grid} 0H0V${grid}" fill="none" stroke="#71836b" stroke-width="${Math.max(.025,grid*.015)}" stroke-opacity=".3"/></pattern></defs><rect width="${w}" height="${h}" fill="${finished?'#fffdf6':'#e9e9df'}"/>`;
  if(!finished&&doc.underlay&&!preview)shapes+=`<image href="${doc.underlay}" width="${w}" height="${h}" opacity="${doc.underlayOpacity}" preserveAspectRatio="none"/>`;
  if(!finished)shapes+=`<rect width="${w}" height="${h}" fill="url(#lpGrid)"/>`;
  if(preview&&photoVisible)shapes+=`<image href="${preview}" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  shapes+=`<polygon points="${poly(bound)}" fill="${preview&&photoVisible?'none':finished?'#dce3bd':'#c1d8b0b8'}" stroke="${preview&&photoVisible?'#ffffff66':'#447754'}" stroke-width="${Math.max(.08,max*.0025)}"/>`;
  const layer={lawns:0,fills:1,ponds:2,pavers:3,boulders:4,trees:5,shrubs:5,lights:6};
  for(const item of [...doc.objects].sort((a,b)=>(a.autoFill?-1:(layer[a.type]??3))-(b.autoFill?-1:(layer[b.type]??3)))){
   const entry=byId(item.catalogId);if(!entry||(!full&&hiddenPlanLayers.has(entry.group)))continue;
   const active=item.id===selected,alpha=preview&&photoVisible?.25:1;
   let maskAttr='';
   if(['fills','lawns','ponds'].includes(entry.group)&&item.holes?.length){
    const maskId='lpEraser-'+item.id;
    shapes+='<defs><mask id="'+maskId+'" maskUnits="userSpaceOnUse" x="0" y="0" width="'+w+'" height="'+h+'"><rect x="0" y="0" width="'+w+'" height="'+h+'" fill="#fff"/>'+item.holes.map(hole=>'<polygon points="'+poly(hole)+'" fill="#000"/>').join('')+'</mask></defs>';
    maskAttr=' mask="url(#'+maskId+')"';
   }
   if(preview&&photoVisible){
    if(entry.group==='pavers')for(const s of pavingSegments(item)){const on=active&&s.index===segmentIndex(item);shapes+=`<polygon data-object="${item.id}" data-path-segment="${s.index}" points="${poly(s.polygon)}" fill="${on?'#ffd697':'transparent'}" fill-opacity="${on?.25:0}" pointer-events="all"/>`;}
    else if(entry.group==='fills'&&item.geometry==='strip')shapes+=`<path data-object="${item.id}" d="${dline(item.points)}" fill="none" stroke="${active?'#ffd697':'transparent'}" stroke-width="${item.width}" stroke-opacity="${active?.8:0}" stroke-linecap="round" stroke-linejoin="round" pointer-events="stroke"/>`;
    else if(['fills','lawns','ponds'].includes(entry.group))shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}"${maskAttr} fill="${active?'#ffe3b7':'transparent'}" fill-opacity="${active?.17:0}" stroke="${active?'#f7d097':'transparent'}" stroke-width=".12" pointer-events="all"/>`;
    else shapes+=`<circle data-object="${item.id}" cx="${item.x}" cy="${item.y}" r="${Math.max(.3,item.diameter/2)}" fill="${active?'#ffe2b5':'transparent'}" fill-opacity="${active?.11:0}" stroke="${active?'#e5c08e':'transparent'}" stroke-width=".09" pointer-events="all"/>`;
    if(active&&item.points&&item.geometry!=='paint')for(const [i,p]of item.points.entries())if(entry.group!=='pavers'||[segmentIndex(item),segmentIndex(item)+1].includes(i))shapes+=`<circle data-vertex="${i}" data-object="${item.id}" cx="${p.x}" cy="${p.y}" r="${Math.min(.3,max*.01)}" fill="#fff7e2" stroke="#a87633" stroke-width=".08"/>`;
    continue;
   }
   if(entry.group==='pavers'){
    for(const s of pavingSegments(item)){const material=byId(s.catalogId)||entry,patternId='lpPaver-'+item.id+'-'+s.index,on=active&&!finished&&!full&&s.index===segmentIndex(item);
     shapes+=pavingPattern(patternId,material,finished)+`<polygon data-object="${item.id}" data-path-segment="${s.index}" points="${poly(s.polygon)}" fill="url(#${patternId})" stroke="${on?'#e3b873':'#4f4a41'}" stroke-width="${on?.15:.035}" stroke-linejoin="miter" opacity="${alpha}" pointer-events="all"/>`;}
    }else if(entry.group==='fills'&&item.geometry==='strip'){
    // Measured linear gravel/mulch: a REAL width-bearing ribbon, not a polygon outline.
    const tile=2.4,patternId='lpStrip-'+item.id;
    shapes+='<defs><pattern id="'+patternId+'" patternUnits="userSpaceOnUse" width="'+tile+'" height="'+tile+'"><image href="'+planIcon(entry)+'" width="'+tile+'" height="'+tile+'" preserveAspectRatio="xMidYMid slice"/></pattern></defs>'
     +'<path data-object="'+item.id+'" d="'+dline(item.points)+'"'+maskAttr+' fill="none" stroke="'+entry.color+'" stroke-width="'+item.width+'" stroke-linecap="round" stroke-linejoin="round" pointer-events="stroke"/>'
     +'<path data-object="'+item.id+'" d="'+dline(item.points)+'"'+maskAttr+' fill="none" stroke="url(#'+patternId+')" stroke-width="'+item.width+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'" pointer-events="stroke"/>';
   }else if(entry.group==='ponds'){
    // Reuse the exact selected pond photo, including dark water and water lilies,
    // clipped to the user's measured polygon (never a rectangular overlay).
    const xs=item.points.map(p=>p.x),ys=item.points.map(p=>p.y);
    const left=Math.min(...xs),top=Math.min(...ys),pw=Math.max(.1,Math.max(...xs)-left),ph=Math.max(.1,Math.max(...ys)-top);
    const clipId='lpPondClip-'+item.id;
    shapes+=`<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><polygon points="${poly(item.points)}"/></clipPath></defs>`;
    shapes+=`<g clip-path="url(#${clipId})"${maskAttr}><rect x="${left}" y="${top}" width="${pw}" height="${ph}" fill="#071f1a"/><image href="${finished?planIcon(entry):cardPhotoURL(entry)}" x="${left}" y="${top}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/><rect x="${left}" y="${top}" width="${pw}" height="${ph}" fill="#03120f" opacity="${entry.id==='formal-pond'?.15:entry.id==='bio-pond'?.27:.50}" pointer-events="none"/></g>`;
    shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}" fill="transparent" stroke="${active?'#e5be86':'#346f69'}" stroke-width="${active?.19:.08}" pointer-events="visiblePainted"/>`;
   }else if(['fills','lawns'].includes(entry.group)){
    // Full-plot lawn uses a close photographic turf crop, rather than the
    // old flat-green brush texture. Preserve precise contour and eraser holes.
    const lawn=entry.group==='lawns',tile=lawn?3.8:2.4;
    shapes+=`<polygon data-object="${item.id}" points="${poly(item.points)}"${maskAttr} fill="${entry.color}" fill-opacity="${lawn?.34:.83}" stroke="${active?'#dfaa58':'#5b7558'}" stroke-width="${active?.16:.065}"/>`;
    shapes+=`<defs><pattern id="tile-${item.id}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse"><image href="${planIcon(entry)}" width="${tile}" height="${tile}" preserveAspectRatio="xMidYMid slice"/></pattern></defs><polygon data-object="${item.id}" points="${poly(item.points)}"${maskAttr} fill="url(#tile-${item.id})" opacity="${lawn?.98:.90}"/>`;
   }else{
    const d=entry.group==='lights'?Math.max(.75,item.diameter):item.diameter;
    if(entry.group==='trees')shapes+=treeShadow(item,entry,d,planIcon);
    shapes+=`<g data-object="${item.id}" transform="rotate(${item.rotation} ${item.x} ${item.y})"><image href="${planIcon(entry)}" x="${item.x-d/2}" y="${item.y-d/2}" width="${d}" height="${d}" ${entry.group==='trees'?'style="filter:'+foliageTone(entry)+'"':''}/></g>`;
    if(active)shapes+=`<circle cx="${item.x}" cy="${item.y}" r="${d/2+.15}" fill="none" stroke="#c68f48" stroke-width=".14" stroke-dasharray=".28 .2" pointer-events="none"/>`;
   }
   if(active&&item.points&&item.geometry!=='paint')for(const [i,p] of item.points.entries())if(entry.group!=='pavers'||[segmentIndex(item),segmentIndex(item)+1].includes(i))shapes+=`<circle data-vertex="${i}" data-object="${item.id}" cx="${p.x}" cy="${p.y}" r="${Math.min(.3,max*.01)}" fill="#fff7e2" stroke="#b47b37" stroke-width=".08"/>`;
  }
  const house=doc.house,w2=house.width/2,h2=house.height/2;
  if(finished){
   shapes+=[house,...doc.buildings].map(footprint).join('');
   const scale=[1,2,5,10,20,50,100].filter(m=>m<=w*.22).at(-1)||1;
   const x=w*.045,y=h*.96;
   shapes+='<g font-family="Georgia,serif" fill="#34372d"><path d="M'+x+' '+y+'h'+scale+'" stroke="#fffdf6" stroke-width=".24"/><path d="M'+x+' '+y+'h'+scale/2+'" stroke="#34372d" stroke-width=".24"/><text x="'+(x+scale/2)+'" y="'+(y-.21)+'" text-anchor="middle" font-size="'+fs*.64+'" stroke="#fffdf6" stroke-width=".08" paint-order="stroke">'+scale+' м</text></g>';
  }else if(!preview||!photoVisible){
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
  if(!showDimensions&&!finished&&(!preview||!photoVisible))shapes+=`<g fill="#3e5544" font-size="${fs*.7}" font-family="Arial,sans-serif"><text x="${w*.5}" y="${h*.02+fs*.8}" text-anchor="middle">${num(w)} м</text><text x="${fs*.6}" y="${h*.5}" text-anchor="middle" transform="rotate(-90 ${fs*.6} ${h*.5})">${num(h)} м</text></g>`;
  if(!preview||!photoVisible)shapes+=`<g transform="translate(${w*.92} ${h*.1}) rotate(${doc.north})"><path d="M0 -1L-.22 .6L0 .3L.22 .6Z" fill="#263a2a"/><text y="-1.3" text-anchor="middle" font-size="${fs*.7}" fill="#263a2a">С</text></g>`;
  if(preview&&photoVisible){
   shapes+=`<g data-house="yes" transform="translate(${house.x} ${house.y}) rotate(${house.rotation})"><rect x="${-w2}" y="${-h2}" width="${house.width}" height="${house.height}" fill="transparent" stroke="${selected==='house'?'#f5c27d':'transparent'}" stroke-width=".12" pointer-events="all"/></g>`;
   for(const b of doc.buildings)shapes+=`<g data-building="${b.id}" transform="translate(${b.x} ${b.y}) rotate(${b.rotation})"><rect x="${-b.width/2}" y="${-b.height/2}" width="${b.width}" height="${b.height}" fill="transparent" stroke="${selected==='building:'+b.id?'#f5c27d':'transparent'}" stroke-width=".12" pointer-events="all"/></g>`;
  }
  if(!finished&&mode==='area'&&['brush','eraser'].includes(areaTool)&&brush?.points.length){
   const draft=brushPolygon(brush.points,brush.diameter,doc.site);
   if(draft.length>=3)shapes+='<polygon points="'+poly(draft)+'" fill="'+(areaTool==='brush'&&itemCatalog()?.group==='ponds'?'#16494a':selectedColor())+'" fill-opacity="'+(areaTool==='brush'&&itemCatalog()?.group==='ponds'?'.88':'.42')+'" stroke="'+(areaTool==='brush'&&itemCatalog()?.group==='ponds'?'#396a68':'#f0bf86')+'" stroke-width=".05" pointer-events="none"/>';
  }
  if(!finished&&points.length){
   const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10);
   if(mode==='area'&&areaTool==='polygon'&&points.length>=3){
    const entry=itemCatalog(),tile=entry?.group==='ponds'?5:2.4;
    const texture=entry?.group==='ponds'?cardPhotoURL(entry):entry?planIcon(entry):null;
    if(texture)shapes+='<defs><pattern id="lpDraftArea" patternUnits="userSpaceOnUse" width="'+tile+'" height="'+tile+'"><image href="'+texture+'" width="'+tile+'" height="'+tile+'" preserveAspectRatio="xMidYMid slice"/></pattern></defs>';
    shapes+='<polygon points="'+poly(points)+'" fill="'+selectedColor()+'" fill-opacity=".57" stroke="#f5c47c" stroke-width=".14" stroke-dasharray=".30 .16" pointer-events="none"/>';
    if(texture)shapes+='<polygon points="'+poly(points)+'" fill="url(#lpDraftArea)" opacity=".78" pointer-events="none"/>';
   }
   if(mode==='path'&&points.length>=2&&itemCatalog()?.group==='pavers'){
    shapes+=pavingPattern('lpDraftPaving',itemCatalog());
    const displayPath=roundedPavingCenterline({points,cornerRounds:pathRounds(points)});
    shapes+='<path d="'+dline(displayPath)+'" fill="none" stroke="#c9aa7b" stroke-width="'+(width+.10)+'" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" pointer-events="none"/><path d="'+dline(displayPath)+'" fill="none" stroke="url(#lpDraftPaving)" stroke-width="'+width+'" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" pointer-events="none"/>';
   }else if(mode==='strip'&&points.length>=2){
    const tile=2.4;
    shapes+='<defs><pattern id="lpDraftStrip" patternUnits="userSpaceOnUse" width="'+tile+'" height="'+tile+'"><image href="'+iconURL(itemCatalog())+'" width="'+tile+'" height="'+tile+'" preserveAspectRatio="xMidYMid slice"/></pattern></defs>';
    shapes+='<path d="'+dline(points)+'" fill="none" stroke="#f7d8a8" stroke-opacity=".72" stroke-width="'+(width+.22)+'" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>';
    shapes+='<path d="'+dline(points)+'" fill="none" stroke="url(#lpDraftStrip)" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round" opacity=".94" pointer-events="none"/>';
   }else if(mode!=='area'||points.length<3)
    shapes+='<path d="'+dline(points)+'" fill="none" stroke="#c47c32" stroke-width="'+(mode==='path'?width:.12)+'" stroke-dasharray=".25 .15" pointer-events="none"/>';

   if(!(mode==='path'&&pathInput==='brush'))for(const p of points)shapes+='<circle cx="'+p.x+'" cy="'+p.y+'" r=".18" fill="#fff0c5" stroke="#a46e35" stroke-width=".06" pointer-events="none"/>';
  }
  if(!finished)shapes+=atmosphereOverlay();
  if(!finished&&!full&&mode==='corner')shapes+='<circle id="lpCornerCursor" cx="'+(cornerCursor?.x||0)+'" cy="'+(cornerCursor?.y||0)+'" r="'+cornerRadius+'" fill="#f4d9ae" fill-opacity=".12" stroke="#fff1d5" stroke-width=".08" stroke-dasharray=".16 .12" pointer-events="none" visibility="'+(cornerCursor?'visible':'hidden')+'"/>';
  if(finished||(showDimensions&&(!preview||!photoVisible)))shapes+=planDimensions(bound,fs,full);
  if(!finished&&!full&&pointDrawing())shapes+='<g id="lpPointPreview" pointer-events="none">'+pointPreviewMarkup()+'</g>';
  return `<svg id="lpSvg" xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="${full?"0 0 "+w+" "+h:Object.values(cameraBox()).join(" ")}" preserveAspectRatio="xMidYMid meet">${shapes}</svg>`;
 }
 function position(e){
  const svg=$('#lpSvg',modal);if(!svg)return null;const m=svg.getScreenCTM();if(!m)return null;
  const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const v=p.matrixTransform(m.inverse());
  const gridSnap=snap&&!(mode==='path'&&pathInput==='brush');
  return {x:clamp(gridSnap?Math.round(v.x*20)/20:v.x,0,doc.site.width),y:clamp(gridSnap?Math.round(v.y*20)/20:v.y,0,doc.site.height)};
 }
 function syncPlanTouchDock(){
  const dock=$('#lpTouchSelection',modal);
  if(!dock)return;
  const obj=selectedPlanObject(),active=mode==='select'&&selected&&obj;
  dock.hidden=!active||(obj?.type==='pavers'&&window.matchMedia('(max-width:760px)').matches);
  if(!active)return;
  const name=selected==='house'?'Основной дом':selected.startsWith('building:')?'Постройка':byId(obj.catalogId)?.name||'Объект';
  const centre=Array.isArray(obj.points)&&obj.points.length?
   {x:obj.points.reduce((v,p)=>v+Number(p.x||0),0)/obj.points.length,
    y:obj.points.reduce((v,p)=>v+Number(p.y||0),0)/obj.points.length}:
   {x:Number(obj.x)||0,y:Number(obj.y)||0};
  $('#lpTouchSelectedName',dock).textContent=name+' · X '+centre.x.toFixed(2)+' / Y '+centre.y.toFixed(2)+' м';
  dock.querySelectorAll('[data-mobile-copy],[data-mobile-delete]').forEach(el=>el.hidden=selected==='house');
}
function syncMobilePathActions(){
 const nav=$('.lp-mobile-jump',modal);if(!nav)return;
 const drawing=mode==='path',obj=selectedPlanObject(),pathSelected=['select','corner'].includes(mode)&&obj?.type==='pavers',segment=pathSelected?segmentSettings(obj):null;
 nav.dataset.pathState=drawing?'drawing':pathSelected?'selected':'normal';
 const done=$('#lpMobilePathDone',nav),back=$('#lpMobilePathBack',nav);
 if(done)done.disabled=!!pathStroke||!!pointGesture||(pathInput!=='brush'&&points.length<2);if(back){back.hidden=pathInput==='brush';back.disabled=!points.length||!!pathStroke;back.textContent='↶ Точка';}
 const cancel=$('#lpMobilePathCancel',nav);if(cancel)cancel.hidden=pathInput==='brush';nav.dataset.pathInput=pathInput;
 const drawControls=$('#lpMobilePathDrawControls',nav);if(drawControls){drawControls.hidden=!drawing;if(drawing&&!pathStroke){const markup=pathDrawControls();if(drawControls.dataset.markup!==markup){drawControls.innerHTML=markup;drawControls.dataset.markup=markup;}}}
 const info=$('#lpMobilePathInfo',nav);
 if(info)info.textContent=drawing?((pathInput==='brush'?'КИСТЬ АКТИВНА · ':'ПО ТОЧКАМ · ')+pathShapeLabel()+' · '+(points.length<2?(pathInput==='brush'?'Каждый мазок — отдельная дорожка':'Дорожка · поставьте '+(points.length?'конечную':'начальную')+' точку'):'Дорожка · '+num(lineLength(points),1)+' м')):pathSelected?(mode==='corner'?'Кисть: обработайте нужный угол · ': '')+'Участок '+(segmentIndex(obj)+1)+' из '+(obj.points.length-1)+' · '+byId(segment.catalogId)?.name+' · '+num(lineLength(obj.points.slice(segmentIndex(obj),segmentIndex(obj)+2)),1)+' м × '+num(segment.width,2)+' м':'';
 const widthPanel=$('#lpMobilePathWidthPanel',nav),widthInput=$('#lpMobilePathWidth',nav),widthValue=$('#lpMobilePathWidthValue',nav);
 if(widthPanel){widthPanel.hidden=!pathSelected;widthPanel.dataset.object=pathSelected?obj.id:'';if(pathSelected&&widthInput){widthInput.value=String(segment.width);widthValue.textContent=num(segment.width,2)+' м';}}
 const roundingPanel=$('#lpMobilePathRoundingPanel',nav);
 if(roundingPanel){roundingPanel.hidden=!pathSelected;if(pathSelected){roundingPanel.innerHTML='<div class="lp-material-header"><strong>Скругление готовой дорожки</strong></div>'+cornerControls();roundingPanel.dataset.active=String(mode==='corner');}}
 if(widthPanel)widthPanel.hidden=!pathSelected||mode==='corner';
 const materials=$('#lpMobilePathMaterials',nav);
 if(materials){
  materials.hidden=!pathSelected||mode==='corner';materials.dataset.object=pathSelected?obj.id:'';
  materials.querySelectorAll('[data-existing-path-material]').forEach(b=>{const on=pathSelected&&b.dataset.existingPathMaterial===segment?.catalogId;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
 }
}
function syncPathFinishDock(){
 const dock=$('#lpPathFinishDock',modal);if(!dock)return;
 dock.hidden=mode!=='path';
 modal.dataset.pathDrawing=String(mode==='path');
 syncMobilePathActions();
 if(dock.hidden)return;
 const length=points.length>=2?lineLength(points):0;
 $('#lpPathDraftInfo',dock).textContent=pathInput==='brush'?'Каждый мазок сохраняется отдельно. «Готово» — выход.':points.length<2?'Поставьте '+(points.length?'ещё одну точку':'начальную точку'):'Длина '+num(length,1)+' м · '+points.length+' точек';
 $('#lpPathFinishNow',dock).disabled=!!pathStroke||!!pointGesture||(pathInput!=='brush'&&points.length<2);$('#lpPathFinishNow',dock).textContent=pathInput==='brush'?'✓ Готово':'✓ Завершить дорожку';$('#lpPathUndoPoint',dock).hidden=pathInput==='brush';$('#lpPathCancelNow',dock).hidden=pathInput==='brush';dock.dataset.pathInput=pathInput;
 $('#lpPathUndoPoint',dock).disabled=!points.length;
}
function drawMap(){
  const canvas=$('#lpMap',modal);if(!canvas)return;
  canvas.innerHTML=drawSvg();$('#lpSvg',modal).addEventListener('pointerdown',startPointer);
  $('#lpSvg',modal).addEventListener('pointermove',movePointer);$('#lpSvg',modal).addEventListener('pointerup',endPointer);$('#lpSvg',modal).addEventListener('pointercancel',endPointer);$('#lpSvg',modal).addEventListener('pointerleave',()=>{if(pointDrawing()&&!pointGesture)updatePointPreview(null);});
  syncPlanTouchDock();syncPathFinishDock();
  const zoomValue=$('#lpZoomValue',modal);if(zoomValue)zoomValue.textContent=Math.round(viewScale*100)+'%';
  for(const control of $$('[data-plan-dimensions]',modal)){
   control.textContent=showDimensions?'Скрыть размеры':'Показать размеры';
   control.setAttribute('aria-pressed',String(showDimensions));
  }
  const photoButton=$('#lpPhotoToggle',modal);if(photoButton){photoButton.disabled=!preview;photoButton.textContent=preview?(photoVisible?'◫ Исходная схема':'▣ Фото-рендер'):'▣ Фото-рендер';}
  const hud=$('#lpDraftSummary',modal);
  if(hud){
   const stripMode=mode==='strip',polyMode=mode==='area'&&areaTool==='polygon',brushPond=mode==='area'&&areaTool==='brush'&&category==='ponds';
   const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10);
   const dist=points.length>=2?lineLength(points):0;
   hud.hidden=!(stripMode||polyMode||brushPond);
   if(brushPond)hud.textContent='ВОДА · ведите кистью — зона заполняется без точек';
   else if(stripMode)hud.textContent='ПОЛОСА · '+num(dist,1)+' м × '+num(width,2)+' м · ≈ '+num(dist*width,1)+' м²';
   else if(polyMode)hud.textContent=points.length>=3?'ЗАЛИВКА · ≈ '+num(polygonArea(points),1)+' м² · '+points.length+' точек':'ЗАЛИВКА · поставьте минимум 3 точки и замкните контур';
  }
  const s=$('#lpSourceState',modal);if(s)s.textContent=`${num(doc.site.width)} × ${num(doc.site.height)} м · ${doc.verified?'Размеры подтверждены':'Требуется сверка размеров'}`;
 }

 
 /* QA: querySelectorAll is required for every forEach UI iteration. */
 function drawPalette(){
  const target=$('#lpPalette',modal);if(!target)return;
  $$('[data-atmo]',modal).forEach(el=>{const value=doc.atmosphere?.[el.dataset.atmo];if(value&&el.value!==value)el.value=value;});
  target.innerHTML='<div class="lp-groups">'+GROUPS.map(g=>`<button type="button" class="${category===g.id?'active':''}" data-category="${g.id}" aria-pressed="${category===g.id}"><span class="lp-category-icon">${categoryIcon(g.id)}</span><span class="lp-category-name">${g.name}</span><small>${g.qty} поз.</small></button>`).join('')+'</div><div class="lp-assets">'+CATALOG.filter(x=>x.group===category).map(x=>`<button class="${chosen===x.id?'active':''}" data-asset="${x.id}" data-photo-type="${x.group}" data-photo-ready="${hasPhotographicCard(x)?'true':'false'}"><img src="${cardPhotoURL(x)}" alt="${esc(x.name)} · ${x.group==='lawns'?'макросъёмка травы':x.group==='lights'?'фото светильника':x.group==='ponds'?'фото водоёма':x.group==='boulders'?'фото камня':(hasPhotographicCard(x)?'фото растения':'вид сверху')}" loading="eager" decoding="async"><span>${esc(x.name)}</span><small class="lp-asset-detail">${x.group==='lawns'?'МАКРО · ФАКТУРА ТРАВЫ':x.group==='trees'||x.group==='shrubs'?(hasPhotographicCard(x)?'ФОТО · РАСТЕНИЕ':'КРОНА · ВИД СВЕРХУ'):x.group==='lights'?'ФОТО · САДОВЫЙ СВЕТ':x.group==='ponds'?'ФОТО · ВОДНАЯ ПОВЕРХНОСТЬ':x.group==='boulders'?'ФОТО · КАМЕНЬ':'ФОТО · МАТЕРИАЛ'}</small></button>`).join('')+'</div>';
  $$('.lp-assets img',target).forEach(img=>{img.addEventListener('error',()=>{const entry=byId(img.closest('[data-asset]')?.dataset.asset);if(entry&&!img.dataset.fallback){img.dataset.fallback='true';img.src=iconURL(entry);}else if(entry&&img.dataset.fallback==='true'&&!img.dataset.svgFallback){img.dataset.svgFallback='true';img.src=fallbackIconURL(entry);}})});
  $$('[data-quick-category]',modal).forEach(b=>{const active=b.dataset.quickCategory===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  modal.querySelectorAll('.lp-tools button[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===mode&&(mode!=='path'||pathInput==='points')));
  const brushTool=$('[data-new-path-brush]',modal);if(brushTool){const on=mode==='path'&&pathInput==='brush';brushTool.classList.toggle('active',on);brushTool.setAttribute('aria-pressed',String(on));}
  $('#lpFinish',modal).disabled=(mode==='path'&&pathInput==='brush')?!!pathStroke:points.length<(['path','strip'].includes(mode)?2:3);
  $('#lpCancel',modal).disabled=!points.length&&mode==='select';
  const t=$('#lpToolName',modal);if(t)t.textContent=({select:'Выбор и перемещение',corner:'Кисть скругления',place:'Размещение объекта',strip:'Отсыпка · полоса заданной ширины',path:'Дорожка · '+pathShapeLabel(),area:'Область · '+(areaTool==='brush'?'Кисть':'Полигональное лассо'),boundary:'Границы участка'})[mode]||mode;
  const pathPanel=$('#lpPathControls',modal);if(pathPanel)pathPanel.hidden=mode!=='path';const desktopDraw=$('#lpDesktopPathDrawControls',modal);if(desktopDraw)desktopDraw.innerHTML=pathDrawControls();
  $$('[data-path-shape]',modal).forEach(b=>{const on=mode==='path'&&pathInput==='points'&&b.dataset.pathShape===pathShape;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  const selection=$('#lpSelectedMaterial',modal);if(selection){selection.textContent=byId(chosen)?.name||'Выберите брусчатку';}
  const pathMaterials=$('#lpPathMaterials',modal);
  if(pathMaterials)pathMaterials.innerHTML=CATALOG.filter(x=>x.group==='pavers').map(x=>'<button type="button" data-path-material="'+x.id+'" class="'+(chosen===x.id?'active':'')+'"><img src="'+pavingPhoto(x)+'" alt=""><span>'+esc(x.name)+'</span></button>').join('');
  const surfaceModes=$('#lpSurfaceModes',modal);if(surfaceModes)surfaceModes.hidden=category!=='fills';
  $$('[data-surface-mode]',modal).forEach(b=>{const on=(b.dataset.surfaceMode==='strip'?mode==='strip':mode==='area');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
  const stripControls=$('#lpStripControls',modal);if(stripControls)stripControls.hidden=mode!=='strip';
  const widthLabel=$('#lpWidthLabel',modal);if(widthLabel){widthLabel.hidden=!['strip','path'].includes(mode);widthLabel.firstChild.textContent=mode==='strip'?'Ширина отсыпки ':'Ширина дорожки ';}
  const areaControls=$('#lpAreaControls',modal);if(areaControls)areaControls.hidden=mode!=='area';
  modal.querySelectorAll('[data-area-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.areaTool===areaTool);b.setAttribute('aria-pressed',String(b.dataset.areaTool===areaTool));});
  const brushSize=$('#lpBrushSize',modal);if(brushSize)brushSize.disabled=areaTool==='polygon';
   const autoFillBtn=$('#lpAutoFillLawn',modal);if(autoFillBtn)autoFillBtn.hidden=mode!=='area'||itemCatalog()?.group!=='lawns';
   const doneBtn=$('#lpFinish',modal);if(doneBtn){doneBtn.hidden=mode==='area'&&areaTool!=='polygon';doneBtn.textContent=mode==='path'&&pathInput==='brush'?'✓ Готово':mode==='area'?'✓ Залить область':mode==='strip'?'✓ Создать полосу':'✓ Завершить'}
  const areaMaterials=$('#lpAreaMaterials',modal);
  if(areaMaterials){const g=category;areaMaterials.innerHTML=['lawns','fills','ponds'].includes(g)?'<div class="lp-area-group" data-current-category="'+g+'"><strong>'+({lawns:'ГАЗОНЫ · 4 ВИДА',fills:'ОТСЫПКИ · ВЫБОР ПОКРЫТИЯ',ponds:'ВОДОЁМЫ · ВЫБЕРИТЕ ТИП ВОДЫ'})[g]+'</strong>'+CATALOG.filter(x=>x.group===g).map(x=>'<button type="button" data-area-material="'+x.id+'" class="'+(chosen===x.id?'active':'')+'" aria-pressed="'+(chosen===x.id)+'"><img src="'+cardPhotoURL(x)+'" alt=""><span>'+esc(x.name)+'</span></button>').join('')+'</div>':'';}
 }
 function field(name,label,value,min,max,step=.05){return `<label>${label}<input data-field="${name}" type="number" value="${value}" min="${min}" max="${max}" step="${step}"></label>`}
 function drawInspector(){
  const root=$('#lpInspector',modal);if(!root)return;
  const h=doc.house,r=report(doc);
  const atmo=doc.atmosphere||{time:'day',season:'summer',weather:'sunny'};
  const sceneSelect=(key,label)=>'<label>'+label+'<select data-atmo="'+key+'">'+SCENE_OPTIONS[key].map(([v,n])=>'<option value="'+v+'" '+(atmo[key]===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';
  let html=`<h3>Параметры</h3><section class="lp-atmosphere"><strong>☀ АТМОСФЕРА СЦЕНЫ</strong><div class="lp-atmo-fields">${sceneSelect('time','Время дня')}${sceneSelect('season','Сезон')}${sceneSelect('weather','Погода')}</div><small>Влияет на свет, тени и GPT Image. Геометрия участка не меняется.</small></section><section><strong>УЧАСТОК · МЕТРЫ</strong><div class="lp-two">${field('site.width','Ширина, м',doc.site.width,5,500)}${field('site.height','Длина, м',doc.site.height,5,500)}</div>${field('north','Север · поворот °',doc.north,0,360,1)}<label class="lp-check"><input type="checkbox" data-field="northVerified" ${doc.northVerified?'checked':''}> Направление севера подтверждено</label><label class="lp-check"><input type="checkbox" data-field="verified" ${doc.verified?'checked':''}> Размеры проверены</label><small>Снимок без измерений не считается точной геометрией. Масштаб не меняет размеры объектов.</small></section>`;
  if(doc.site.boundary)html+=`<section><strong>УГЛЫ ГРАНИЦЫ · КООРДИНАТЫ В МЕТРАХ</strong><p>Введите точные координаты каждого угла участка.</p><div class='lp-vertices'>${doc.site.boundary.map((p,i)=>`<div><span>${i+1}</span><input type='number' aria-label='X угла ${i+1}' data-boundary='${i}' data-axis='x' step='.05' value='${p.x}'><input type='number' aria-label='Y угла ${i+1}' data-boundary='${i}' data-axis='y' step='.05' value='${p.y}'></div>`).join('')}</div></section>`;
  html+=`<section><strong>СТРОЕНИЕ · ВИД СВЕРХУ</strong><label>Тип<select data-field="house.type">${[['house','Дом'],['bath','Баня'],['garage','Гараж'],['gazebo','Беседка'],['outbuilding','Хозпостройка']].map(([v,t])=>`<option value="${v}" ${h.type===v?'selected':''}>${t}</option>`).join('')}</select></label><div class="lp-two">${field('house.width','Ширина м',h.width,2,60)}${field('house.height','Длина м',h.height,2,60)}</div><div class="lp-two">${field('house.x','X центра м',h.x,0,500)}${field('house.y','Y центра м',h.y,0,500)}</div>${field('house.rotation','Поворот °',h.rotation,-360,360,1)}<label>Кровля<select data-field="house.roof"><option value="gable" ${h.roof==='gable'?'selected':''}>Двускатная</option><option value="hip" ${h.roof==='hip'?'selected':''}>Вальмовая</option><option value="flat" ${h.roof==='flat'?'selected':''}>Плоская</option></select></label><label>Фото строения<input type="file" id="lpHousePhoto" accept="image/png,image/jpeg,image/webp"></label><button type="button" data-generate="roof" ${!h.photo?'disabled':''}>GPT Image 2.6 · кровля сверху</button><small>Фото ${h.photo?'загружено':'не загружено'}. Генерация не изменяет размеры дома.</small></section>`;
  html+=`<section><strong>ДОПОЛНИТЕЛЬНЫЕ СТРОЕНИЯ</strong><div class='lp-two'><button type='button' data-add-building='bath'>＋ Баня</button><button type='button' data-add-building='garage'>＋ Гараж</button><button type='button' data-add-building='gazebo'>＋ Беседка</button><button type='button' data-add-building='outbuilding'>＋ Хозблок</button></div><small>${doc.buildings.length} дополнительных строений с отдельной геометрией</small></section>`;
   if(selected?.startsWith('building:')){
    const b=doc.buildings.find(x=>x.id===selected.slice(9));
    if(b)html+=`<section class='lp-selected'><strong>${esc(({bath:'Баня',garage:'Гараж',gazebo:'Беседка',outbuilding:'Хозпостройка',house:'Дом'})[b.type])}</strong><div class='lp-two'>${field('aux.width','Ширина м',b.width,2,60)}${field('aux.height','Длина м',b.height,2,60)}</div><div class='lp-two'>${field('aux.x','X центр м',b.x,0,500)}${field('aux.y','Y центр м',b.y,0,500)}</div>${field('aux.rotation','Поворот °',b.rotation,-360,360,1)}<label>Кровля<select data-field='aux.roof'><option value='gable' ${b.roof==='gable'?'selected':''}>Двускатная</option><option value='hip' ${b.roof==='hip'?'selected':''}>Вальмовая</option><option value='flat' ${b.roof==='flat'?'selected':''}>Плоская</option></select></label><label>Фото этого строения<input type='file' id='lpAuxPhoto' accept='image/png,image/jpeg,image/webp'></label><button type='button' data-roof ${b.photo?'':'disabled'}>AI · кровля сверху</button><button type='button' data-delete-building>Удалить строение</button></section>`;
   }
   if(selected&&selected!=='house'&&!selected.startsWith('building:')){
   const obj=doc.objects.find(x=>x.id===selected),segment=obj?.type==='pavers'?segmentSettings(obj):null,entry=byId(segment?.catalogId||obj?.catalogId);
   if(obj&&entry){html+=`<section class="lp-selected"><strong>${esc(entry.name)}</strong>`;
    if(obj.points){html+=entry.group==='pavers'?'<label>Тип брусчатки<select data-field="object.catalogId">'+CATALOG.filter(x=>x.group==='pavers').map(x=>'<option value="'+x.id+'" '+(x.id===(segment?.catalogId||obj.catalogId)?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+field('object.width','Ширина участка · м',segment?.width||obj.width,.4,10)+'<div class="lp-corner-desktop"><strong>Скругление готовой дорожки</strong>'+cornerControls()+(mode==='corner'?'<button type="button" data-corner-done>✓ Завершить кисть</button>':'')+'</div>':'';
     html+=`<p>${entry.group==='pavers'?'Участок '+(segmentIndex(obj)+1)+' из '+(obj.points.length-1)+' · длина '+num(lineLength(obj.points.slice(segmentIndex(obj),segmentIndex(obj)+2)))+' м':'Площадь '+num(polygonArea(obj.points))+' м²'}</p><div class="lp-vertices">${obj.points.map((p,i)=>`<div><span>${i+1}</span><input data-vertex="${i}" data-axis="x" type="number" step=".05" value="${p.x}"><input data-vertex="${i}" data-axis="y" type="number" step=".05" value="${p.y}"></div>`).join('')}</div>`;
    }else{html+=`<div class="lp-two">${field('object.x','X м',obj.x,0,500)}${field('object.y','Y м',obj.y,0,500)}</div>${field('object.diameter','Диаметр кроны/объекта м',obj.diameter,.1,30)}${entry.group==='trees'?field('object.height','Высота дерева · м',obj.height,.5,40,.5):''}${field('object.rotation','Поворот °',obj.rotation,-360,360,1)}`;}
    html+='<button type="button" data-delete>Удалить выбранное</button></section>';
   }
  }
  html+=`<section><strong>ВЕДОМОСТЬ</strong><div class="lp-totals"><span>Площадь участка <b>${num(r.siteArea)} м²</b></span><span>Пятно дома <b>${num(r.buildingArea)} м²</b></span><span>Прочие строения <b>${num(r.auxBuildingArea)} м²</b></span></div><table><tbody>${Object.entries(r.counts).map(([id,n])=>{const a=byId(id);return `<tr><td>${esc(a?.name)}</td><td>${r.areas[id]!=null?num(r.areas[id])+' м²':n+' шт.'}</td></tr>`}).join('')}</tbody></table><small>Площадь дорожек в пересечениях приближённая, до объединения покрытий.</small></section>`;
  const actions=selected?'<section class="lp-selection-actions"><strong>ВЫБРАННЫЙ ОБЪЕКТ</strong><small>Перетаскивайте выделенный объект пальцем. Можно двигать точно по 0,5 м.</small><div class="lp-action-grid"><button type="button" data-nudge="left">← 0,5 м</button><button type="button" data-nudge="up">↑ 0,5 м</button><button type="button" data-nudge="down">↓ 0,5 м</button><button type="button" data-nudge="right">→ 0,5 м</button><button type="button" data-rotate-object="-15">↶ −15°</button><button type="button" data-rotate-object="15">↷ +15°</button><button type="button" data-duplicate-object '+(selected==='house'?'disabled':'')+'>＋ Копия</button><button type="button" data-tool="select">↔ Переместить</button></div></section>':'';
  root.innerHTML=actions+html;
 }
 function draw(){if(!modal)return;if(preview&&previewModel!==JSON.stringify(doc))photoVisible=false;drawMap();drawInspector();drawPalette()}
 // A mobile user often chooses a species/material in the library below
 // the map; return to the SAME fixed drawing viewport for placement.
 function revealCanvas(){
  if(!modal||!window.matchMedia('(max-width:760px)').matches)return;
  const layout=$('.lp-layout',modal);
  if(layout)layout.scrollTop=0;
 }
 function syncAutoLawn(){
  const background=doc.objects.find(o=>o.autoFill&&o.type==='lawns');
  if(background)background.points=(doc.site.boundary||rectBoundary(doc.site.width,doc.site.height)).map(p=>({...p}));
 }
 function autoFillLawn(){
  const entry=itemCatalog();if(entry?.group!=='lawns')return;
  const previous=doc.objects.find(o=>o.autoFill&&o.type==='lawns');
  checkpoint();
  // One site-wide lawn is authoritative; historical brush strokes are replaced,
  // while paths, ponds, buildings, plants and every other category are untouched.
  doc.objects=doc.objects.filter(o=>o.type!=='lawns');
  doc.objects.unshift({id:previous?.id||uid(),catalogId:entry.id,type:'lawns',
   points:(doc.site.boundary||rectBoundary(doc.site.width,doc.site.height)).map(p=>({...p})),
   width:1.2,autoFill:true,holes:(previous?.holes||[]).map(h=>h.map(p=>({...p})))});
  points=[];brush=null;selected=null;mode='select';save();draw();revealCanvas();
  say('Газон «'+entry.name+'» автоматически заполнил участок. Дорожки, водоёмы и постройки останутся поверх него. Ластик — в верхней панели.');
 }
 function eraseAreaStroke(stroke,polygon){
  const box=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
   minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
  const a=box(polygon);
  const touched=doc.objects.filter(obj=>{
   if(!['lawns','fills','ponds'].includes(obj.type)||!obj.points?.length)return false;
   const b=box(obj.points),pad=obj.type==='fills'&&obj.geometry==='strip'?obj.width/2:0;
   return a.maxX>=b.minX-pad&&a.minX<=b.maxX+pad&&a.maxY>=b.minY-pad&&a.minY<=b.maxY+pad;
  });
  if(!touched.length){say('В этой области нечего стирать.');return;}
  checkpoint();
  for(const obj of touched){
   obj.holes=(obj.holes||[]).slice(-127);
   obj.holes.push(polygon.map(p=>({...p})));
  }
  save();say('Ластик удалил покрытие по проведённой линии. Отменить: ↶');
 }
 function setMode(v){
  cancelPathStroke();cancelCornerStroke();const wasArea=mode==='area',group=itemCatalog()?.group;
  mode=v;points=[];pathDraftSource=null;selected=null;selectedSegmentIndex=0;brush=null;
  if(v==='strip'&&group!=='fills'){category='fills';chosen='pine-bark'}
  if(v==='area'&&!['lawns','fills','ponds'].includes(group)){category='fills';chosen='pine-bark'}
  if(v==='area'&&(!wasArea||group==='ponds'||group==='fills'))areaTool=(group==='ponds'||group==='lawns')?'brush':'polygon';
  if(v==='path'&&group!=='pavers'){category='pavers';chosen='concrete-pavers'}
  if(v==='area'&&itemCatalog()?.group==='lawns'){autoFillLawn();return}
  draw();revealCanvas();
  if(v==='strip')say('Отсыпка полосой: укажите ширину, поставьте точки оси полосы, нажмите «Создать полосу». Фактура и ширина показаны сразу.');
  if(v==='area')say(itemCatalog()?.group==='ponds'?'Пруд: ведите кистью по участку. Полная зона воды появляется сразу без точек. Несколько мазков дополняют водоём.':'Заливка: рисуйте кистью или замкните контур лассо, чтобы заполнить всю площадь.');
  if(v==='path')say(pathInput==='brush'?'Кисть активна. Ведите пальцем: плавная форма без привязки.':'Выберите брусчатку, ширину и режим построения. Нажмите «Готово».');
 }
 function endDrawing(){cancelPathStroke();pathDraftSource=null;if(mode==='corner'){cancelCornerStroke();mode='select';draw();return}points=[];brush=null;drag=null;mode='select';draw();say('Рисование завершено без сохранения черновика. Уже созданные объекты не изменены.');}
 const PATH_SHAPES=[['smooth','Скруглённые'],['free','Прямые'],['orthogonal','Под 90°'],['diagonal','Под 45°']];
 const pathShapeLabel=()=>pathInput==='brush'?'Свободная плавная форма':PATH_SHAPES.find(([id])=>id===pathShape)?.[1]||'Прямые';
 function pathDrawControls(){
  return '<div class="lp-path-inputs"><button type="button" data-path-input="brush" aria-pressed="'+(pathInput==='brush')+'">Свободная кисть</button><button type="button" data-path-input="points" aria-pressed="'+(pathInput==='points')+'">По точкам</button></div><div class="lp-path-shapes">'+PATH_SHAPES.map(([id,label])=>'<button type="button" data-path-shape="'+id+'" aria-pressed="'+(pathInput==='points'&&pathShape===id)+'">'+label+'</button>').join('')+'</div>';
 }
 function pathRounds(p){return p.map((q,i)=>(pathInput==='brush'||pathShape==='smooth')&&i>0&&i<p.length-1?Math.min(5,Math.hypot(q.x-p[i-1].x,q.y-p[i-1].y)*.44,Math.hypot(q.x-p[i+1].x,q.y-p[i+1].y)*.44):0);}
 function simplifyPathStroke(raw,tolerance){
  if(raw.length<3)return raw.slice();
  const keep=new Set([0,raw.length-1]),stack=[[0,raw.length-1]];
  while(stack.length){const [a,b]=stack.pop(),u=raw[a],v=raw[b],dx=v.x-u.x,dy=v.y-u.y,d2=dx*dx+dy*dy;let max=tolerance,index=-1;
   for(let i=a+1;i<b;i++){const p=raw[i],t=d2?clamp(((p.x-u.x)*dx+(p.y-u.y)*dy)/d2,0,1):0,d=Math.hypot(p.x-u.x-dx*t,p.y-u.y-dy*t);if(d>max){max=d;index=i}}
   if(index>=0){keep.add(index);stack.push([a,index],[index,b]);}
  }
  let out=[...keep].sort((a,b)=>a-b).map(i=>raw[i]);if(out.length>110)out=Array.from({length:110},(_,i)=>out[Math.round(i*(out.length-1)/109)]);return out;
 }
 // Equal-distance samples prevent finger speed from changing the smoothing strength.
 function smoothFreehand(raw,width){
  if(raw.length<3)return raw.map(p=>({...p}));
  const clean=[raw[0]],dist=[0];
  for(let i=1;i<raw.length;i++){const p=raw[i],last=clean.at(-1),d=Math.hypot(p.x-last.x,p.y-last.y);if(d>1e-5){clean.push(p);dist.push(dist.at(-1)+d)}}
  const total=dist.at(-1);if(total<.06||clean.length<3)return [raw[0],raw.at(-1)];
  const step=Math.max(.12,Math.min(.30,width*.15),total/900),n=Math.max(2,Math.ceil(total/step)),samples=[];
  let j=1;
  for(let i=0;i<=n;i++){const d=total*i/n;while(j<dist.length-1&&dist[j]<d)j++;const t=(d-dist[j-1])/(dist[j]-dist[j-1]),a=clean[j-1],b=clean[j];samples.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  let out=samples;
  const radius=Math.max(2,Math.min(9,Math.round(Math.max(.32,Math.min(1.1,width*.38))/(total/n))));
  for(let pass=0;pass<2;pass++){
   const src=out;out=src.map((p,i)=>{if(i===0||i===src.length-1)return {...p};let x=0,y=0,w=0;const r=Math.min(radius,i,src.length-1-i);for(let k=-r;k<=r;k++){const weight=r+1-Math.abs(k);x+=src[i+k].x*weight;y+=src[i+k].y*weight;w+=weight}return {x:x/w,y:y/w};});
  }
  return simplifyPathStroke(out,Math.max(.035,Math.min(.11,width*.055)));
 }
 function resolvePathStroke(raw){const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10);return smoothFreehand(raw,width);}
 function reprojectPathDraft(raw,shape,site){
  if(!raw.length)return [];
  if(!['orthogonal','diagonal'].includes(shape))return raw.map(p=>({...p}));
  const out=[{...raw[0]}];for(let i=1;i<raw.length;i++){const p=snapPathPoint(out.at(-1),raw[i],shape,site);if(Math.hypot(p.x-out.at(-1).x,p.y-out.at(-1).y)>.03)out.push(p);}
  return out;
 }
 function switchPathShape(shape){
  if(mode!=='path')return;
  if(!PATH_SHAPES.some(([id])=>id===shape))return;
  if(pathStroke||pointGesture){say('Отпустите палец, чтобы изменить направление.');return;}
  if(pathInput==='brush'){pathInput='points';points=[];pathDraftSource=null;selected=null;}
  cancelPointGesture();pathDraftSource=null;
  pathShape=shape;pointPathShape=shape;pathShapeExplicit=true;
  drawMap();drawPalette();say('Активный режим: '+pathShapeLabel()+'. Новое направление применяется только к следующему отрезку.');
 }
 function cancelPathStroke(){cancelPointGesture();if(pathFrame)cancelAnimationFrame(pathFrame);pathFrame=0;if(pathStroke){points=pathStroke.before;pathDraftSource=pathStroke.beforeSource;pathStroke=null;}}
 function pathStrokeRoute(stroke){return resolvePathStroke(stroke.raw);}
 function commitFreehandPath(route){
  const entry=itemCatalog();if(mode!=='path'||pathInput!=='brush'||entry?.group!=='pavers'||route.length<2||lineLength(route)<.15)return null;
  const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10);
  const obj={id:uid(),catalogId:entry.id,type:'pavers',points:route.map(p=>({...p})),width,cornerRounds:pathRounds(route)};
  checkpoint();doc.objects.push(obj);syncAutoLawn();save();return obj;
 }
 function updatePathStroke(){pathFrame=0;if(!pathStroke)return;points=pathStrokeRoute(pathStroke);drawMapBrush();syncPathFinishDock();}
 function samplePathStroke(p){const raw=pathStroke.raw,last=raw.at(-1);if(Math.hypot(last.x-p.x,last.y-p.y)<.085)return;raw.push(p);if(raw.length>1200)pathStroke.raw=raw.filter((_,i)=>i%2===0||i===raw.length-1);if(!pathFrame)pathFrame=requestAnimationFrame(updatePathStroke);}
 function cancelPointGesture(){pointGesture=null;pointPreview=null;}
 function pointDrawing(){return mode==='path'&&pathInput==='points';}
 function pointSegmentInfo(a,b,site){
  const dx=b.x-a.x,dy=b.y-a.y,edge=site.boundary?.length>1?{x:site.boundary[1].x-site.boundary[0].x,y:site.boundary[1].y-site.boundary[0].y}:{x:1,y:0};
  const angle=((Math.atan2(dy,dx)-Math.atan2(edge.y,edge.x))*180/Math.PI+360)%360;
  return {length:Math.hypot(dx,dy),angle:Math.round(angle)%360};
 }
 function pointPreviewMarkup(){
  if(!pointDrawing()||!pointPreview||!points.length)return '';
  const a=points.at(-1),b=pointPreview,{length,angle}=pointSegmentInfo(a,b,doc.site);if(length<.03)return '';
  const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10),fs=planFontSize(),dx=(b.x-a.x)/length,dy=(b.y-a.y)/length,span=Math.max(doc.site.width,doc.site.height),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},label=num(length,2)+' м · '+angle+'°';
  const x=mid.x-dy*(width/2+fs*.8),y=mid.y+dx*(width/2+fs*.8);
  return pavingPattern('lpLivePaving',itemCatalog())+'<path d="'+dline([{x:a.x-dx*span,y:a.y-dy*span},{x:b.x+dx*span,y:b.y+dy*span}])+'" fill="none" stroke="#e7cf8f" stroke-width=".07" stroke-dasharray=".28 .20"/><path d="'+dline([a,b])+'" fill="none" stroke="#f8dc9c" stroke-width="'+(width+.12)+'" stroke-linecap="butt"/><path d="'+dline([a,b])+'" fill="none" stroke="url(#lpLivePaving)" stroke-width="'+width+'" stroke-linecap="butt" opacity=".88"/><circle cx="'+b.x+'" cy="'+b.y+'" r=".19" fill="#fff0c5" stroke="#a46e35" stroke-width=".06"/><text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-size="'+fs*.85+'" font-weight="600" fill="#292b27" stroke="#fff1d5" stroke-width="'+fs*.16+'" paint-order="stroke" stroke-linejoin="round">'+label+'</text>';
 }
 function updatePointPreview(p){pointPreview=p&&points.length?pathPoint(p):null;const layer=$('#lpPointPreview',modal);if(layer)layer.innerHTML=pointPreviewMarkup();}
 function pathPoint(p){
  if(mode!=='path'||pathInput==='brush'||['free','smooth'].includes(pathShape)||!points.length)return p;
  return snapPathPoint(points.at(-1),p,pathShape,doc.site);
 }
 function addObject(p){const entry=itemCatalog();if(!entry)return;checkpoint();const obj={id:uid(),catalogId:entry.id,type:entry.group,x:p.x,y:p.y,diameter:entry.diameter||1,height:entry.group==='trees'?(TREE_HEIGHT_M[entry.id]||12):.9,rotation:0};doc.objects.push(obj);selected=obj.id;placementCount++;save();draw();say('Добавлено: '+placementCount+' · '+entry.name+'. Нажимайте снова для следующих экземпляров. Для изменения положения выберите «Переместить».');}
 function finish(){
  if(pathStroke||pointGesture)return;cancelPointGesture();
  if(mode==='path'&&pathInput==='brush'){points=[];pathDraftSource=null;selected=null;mode='select';pathInput='points';pathShape=pointPathShape;draw();say('Кисть выключена. Все нарисованные дорожки сохранены.');return;}
  if(mode==='boundary'){if(points.length<3)return;checkpoint();doc.site.boundary=points.map(p=>({...p}));doc.verified=false;say('Контур задан. Проверьте координаты и габариты.');}
  else if(['path','strip','area'].includes(mode)){
   if(points.length<(['path','strip'].includes(mode)?2:3))return;
   const entry=itemCatalog();if(!entry)return;
   if((mode==='path'&&entry.group!=='pavers')||(mode==='strip'&&entry.group!=='fills')||(mode==='area'&&!['lawns','fills','ponds'].includes(entry.group))){say('Выберите правильный материал для этого инструмента.');return}
   if(mode==='area'&&polygonArea(points)<.025){say('Замкнутая область слишком мала. Добавьте точки по её границе.');return}
   checkpoint();
   const width=clamp(Number($('#lpWidth',modal)?.value)||1.2,.4,10);
   const obj={id:uid(),catalogId:entry.id,type:entry.group,points:points.map(p=>({...p})),width,...(mode==='path'?{cornerRounds:pathRounds(points)}:mode==='strip'?{geometry:'strip'}:{})};
   doc.objects.push(obj);selected=obj.id;selectedSegmentIndex=0;
   say(mode==='path'?'Дорожка '+num(lineLength(points),1)+' м сохранена. Режим выбора активен.':mode==='strip'?'Полоса '+num(lineLength(points),1)+' м × '+num(width,2)+' м сохранена.':'Площадь '+num(polygonArea(points),1)+' м² залита материалом без разрывов.');
  }
  points=[];pathDraftSource=null;mode='select';syncAutoLawn();save();draw();revealCanvas();
 }
 function selectedPlanObject(){return selected==='house'?doc.house:selected?.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.objects.find(o=>o.id===selected)}
 function nudgeSelected(direction,step=.5){
  const o=selectedPlanObject();if(!o)return;
  const d=step===.1?.1:.5;
  const vector={left:[-d,0],right:[d,0],up:[0,-d],down:[0,d]}[direction];if(!vector)return;
  const [dx,dy]=vector;
  if(Array.isArray(o.points)){
   const moved=translatePoints(o.points,dx,dy,doc.site);
   checkpoint();o.points=moved;
  }else{
   const x=clamp(Number(o.x||0)+dx,0,doc.site.width),y=clamp(Number(o.y||0)+dy,0,doc.site.height);
   if(x===o.x&&y===o.y)return;
   checkpoint();o.x=x;o.y=y;
  }
  save();draw();say('Сдвиг на '+(step===.1?'10':'50')+' см сохранён. Кнопка ↶ отменит.');
 }
 function spinSelected(degrees){
  const o=selectedPlanObject();if(!o)return;
  if(Array.isArray(o.points))return say('Поворот контура выполняйте редактированием его вершин.');
  checkpoint();o.rotation=((Number(o.rotation)||0)+degrees+360)%360;
  save();draw();say('Поворот '+degrees+'° сохранён.');
 }
 function copySelectedPlan(){
  if(!selected||selected==='house')return;
  const o=selectedPlanObject();if(!o)return;
  checkpoint();const copy=JSON.parse(JSON.stringify(o));copy.id=uid();
  if(Array.isArray(copy.points))copy.points=translatePoints(copy.points,.5,.5,doc.site);
  else{copy.x=clamp(Number(copy.x||0)+.5,0,doc.site.width);copy.y=clamp(Number(copy.y||0)+.5,0,doc.site.height);}
  if(selected.startsWith('building:')){doc.buildings.push(copy);selected='building:'+copy.id}
  else{doc.objects.push(copy);selected=copy.id}
  save();draw();say('Копия создана. Переместите её пальцем.');
 }
 function startPointer(e){
  if(busy||e.button!==0||e.isPrimary===false)return;const p=position(e);if(!p)return;
  if(mode==='path'&&pathInput==='brush'){
   if(pathStroke)return;
   points=[];pathDraftSource=null;selected=null;photoVisible=false;
   pathStroke={pointer:e.pointerId,before:[],beforeSource:null,raw:[p]};
   points=pathStrokeRoute(pathStroke);try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}
   drawMapBrush();syncPathFinishDock();e.preventDefault();return;
  }
  if(pointDrawing()){
   if(pointGesture)return;
   if(points.length>=110){say('Максимум 110 точек. Завершите дорожку.');return;}
   const first=!points.length;pointGesture={pointer:e.pointerId,first};photoVisible=false;
   if(first){points.push({...p});drawMapBrush();syncPathFinishDock();}
   try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}updatePointPreview(p);e.preventDefault();return;
  }
  if(mode==='corner'){const obj=selectedPlanObject();if(obj?.type!=='pavers')return;obj.cornerRounds=normalizeCornerRounds(obj.cornerRounds,obj.points.length);cornerStroke={id:obj.id,pointer:e.pointerId,before:obj.cornerRounds.slice(),last:p,touched:new Set(),changed:false};try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}stampCorner(p);e.preventDefault();return;}
  if(mode==='area'&&['brush','eraser'].includes(areaTool)){
   if(areaTool!=='eraser'&&!['lawns','fills','ponds'].includes(itemCatalog()?.group))return;
   brush={pointer:e.pointerId,points:[p],diameter:clamp(Number($('#lpBrushSize',modal)?.value)||1.5,.5,12)};
   try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}
   drawMapBrush();e.preventDefault();return;
  }
  if(['path','strip','area','boundary'].includes(mode)){
   const q=pathPoint(p);
   if(mode==='area'&&areaTool==='polygon'&&points.length>=3&&Math.hypot(q.x-points[0].x,q.y-points[0].y)<Math.max(.35,Math.min(doc.site.width,doc.site.height)*.015)){finish();return}
   if(points.length&&Math.hypot(q.x-points.at(-1).x,q.y-points.at(-1).y)<.03)return;
   if(points.length>=110){say('Максимум 110 точек на один контур. Завершите фигуру.');return}
   if(mode==='path'){
    if(!points.length||pathDraftSource?.kind!=='points')pathDraftSource={raw:points.map(v=>({...v})),kind:'points'};
    pathDraftSource.raw.push({...p});
   }
   points.push(q);drawMap();drawPalette();e.preventDefault();return
  }
  if(mode==='place'){addObject(p);e.preventDefault();return}
  const node=e.target.closest('[data-object]'),house=e.target.closest('[data-house]'),aux=e.target.closest('[data-building]');
  const previousSelected=selected;
  selected=node?.dataset.object||(aux?'building:'+aux.dataset.building:house?'house':null);
  if(node?.dataset.pathSegment!==undefined)selectedSegmentIndex=Number(node.dataset.pathSegment);else if(previousSelected!==selected)selectedSegmentIndex=0;
  if(!selected){draw();return}
  const obj=selected==='house'?doc.house:selected.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.objects.find(x=>x.id===selected),control=e.target.closest('[data-vertex]');
  if(obj?.type==='pavers'&&!control){drag=null;draw();e.preventDefault();return;}
  if(node?.tagName==='g'&&node.firstElementChild?.tagName==='title'){draw();return;}
  drag={pointer:e.pointerId,id:selected,index:control?Number(control.dataset.vertex):null,start:p,client:{x:e.clientX,y:e.clientY},didMove:false,original:JSON.parse(JSON.stringify(obj))};
  try{$('#lpSvg',modal).setPointerCapture(e.pointerId)}catch{}drawInspector();syncPlanTouchDock();syncMobilePathActions();
 }
 function movePointer(e){
  if(pointDrawing()&&e.isPrimary!==false){if(pointGesture?.pointer===e.pointerId||(!pointGesture&&e.pointerType==='mouse'&&points.length)){const p=position(e);if(p)updatePointPreview(p);if(pointGesture)e.preventDefault();}return;}
  if(pathStroke?.pointer===e.pointerId){const p=position(e);if(p)samplePathStroke(p);e.preventDefault();return;}
  if(mode==='corner'){if(e.isPrimary===false)return;const p=position(e);if(!p)return;if(cornerStroke?.pointer===e.pointerId){stampCorner(p,cornerStroke.last);cornerStroke.last=p;e.preventDefault()}else if(!cornerStroke&&e.pointerType!=='touch')updateCornerCursor(p);return;}
  if(brush&&brush.pointer===e.pointerId){
   const p=position(e);if(!p)return;const q=brush.points.at(-1);
   if(Math.hypot(q.x-p.x,q.y-p.y)>=Math.max(.1,brush.diameter*.08))brush.points.push(p);
   if(brush.points.length>105)brush.points=brush.points.filter((_,i)=>i%2===0);
   drawMapBrush();e.preventDefault();return;
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  if(!drag.didMove){if(Math.hypot(e.clientX-drag.client.x,e.clientY-drag.client.y)<7)return;drag.didMove=true;checkpoint();}
  const p=position(e);if(!p)return;const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
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
  if(pointGesture?.pointer===e.pointerId){
   const gesture=pointGesture;
   if(e.type==='pointercancel'){if(gesture.first)points.pop();cancelPointGesture();drawMap();drawPalette();return;}
   const p=position(e),q=p?pathPoint(p):pointPreview,last=points.at(-1);cancelPointGesture();
   if(q&&last&&Math.hypot(q.x-last.x,q.y-last.y)>.08&&points.length<110){points.push({...q});pathDraftSource=null;}
   drawMap();drawPalette();say(points.length>1?'Отрезок зафиксирован. Продолжите от последней точки или нажмите «Готово».':'Начальная точка задана. Ведите пальцем к следующей точке.');e.preventDefault();return;
  }
  if(pathStroke?.pointer===e.pointerId){
   if(e.type==='pointercancel'){cancelPathStroke();drawMap();return;}
   const p=position(e);if(p)samplePathStroke(p);if(pathFrame)cancelAnimationFrame(pathFrame);pathFrame=0;
   const route=pathStrokeRoute(pathStroke);pathStroke=null;points=[];pathDraftSource=null;selected=null;
   const obj=commitFreehandPath(route);draw();
   say(obj?'Дорожка '+num(lineLength(obj.points),1)+' м сохранена отдельным объектом. Рисуйте следующую.':'Проведите пальцем по плану, чтобы создать дорожку.');return;
  }
  if(cornerStroke?.pointer===e.pointerId){finishCornerStroke(e.type==='pointercancel');return}
  if(brush&&brush.pointer===e.pointerId){
   const stroke=brush;brush=null;
   if(e.type==='pointercancel'){drawMap();return;}
   // A closed freehand water outline is a solid pond, not a narrow ring.
   const first=stroke.points[0],last=stroke.points.at(-1);
   const closed=stroke.points.length>=7&&Math.hypot(first.x-last.x,first.y-last.y)<=Math.max(.85,stroke.diameter*.6);
   const envelope=closed?stroke.points.slice(0,-1):[];
   const polygon=closed&&polygonArea(envelope)>stroke.diameter*stroke.diameter?envelope:brushPolygon(stroke.points,stroke.diameter,doc.site);
   if(areaTool==='eraser'&&polygon.length>=3){eraseAreaStroke(stroke,polygon);draw();return}
    if(polygon.length>=3&&['lawns','fills','ponds'].includes(itemCatalog()?.group)){
    checkpoint();const item=itemCatalog();const obj={id:uid(),catalogId:item.id,type:item.group,points:polygon,width:1.2,...(item.group==='ponds'?{geometry:'paint'}:{})};
    doc.objects.push(obj);selected=item.group==='ponds'?null:obj.id;save();say(item.group==='ponds'?'Вода залита по кисти без контрольных точек. Следующий мазок добавит воду.':'Область кистью сохранена. Следующая кисть добавит новую область, не удаляя дорожки.');
   }
   draw();return;
  }
  if(!drag||drag.pointer!==e.pointerId)return;
  const changed=drag.didMove;
  if(e.type==='pointercancel'&&changed){const snapshot=undo.pop();if(snapshot)doc=normalizeProject(JSON.parse(snapshot));}
  drag=null;if(changed&&e.type!=='pointercancel')save();draw()
 }
 function change(e){
  const key=e.target.dataset.atmo;
   if(key!==undefined){
    if(!SCENE_OPTIONS[key]?.some(x=>x[0]===e.target.value))return;
    checkpoint();doc.atmosphere[key]=e.target.value;
    if(key==='weather'&&e.target.value==='snow')doc.atmosphere.season='winter';
    if(key==='season'&&e.target.value!=='winter'&&doc.atmosphere.weather==='snow')doc.atmosphere.weather='overcast';
    save();draw();say('Атмосфера обновлена — свет и высотные тени пересчитаны.');return;
   }
   const field=e.target.dataset.field,vertex=e.target.dataset.vertex,boundary=e.target.dataset.boundary;if(field===undefined&&vertex===undefined&&boundary===undefined)return;
  checkpoint();const v=e.target.type==='checkbox'?e.target.checked:e.target.tagName==='SELECT'?e.target.value:Number(e.target.value);
  if(boundary!==undefined){if(doc.site.boundary?.[+boundary]){const axis=e.target.dataset.axis;doc.site.boundary[+boundary][axis]=clamp(v,0,axis==='x'?doc.site.width:doc.site.height);doc.verified=false;}}
  else if(vertex!==undefined){const obj=doc.objects.find(x=>x.id===selected);if(obj?.points?.[+vertex])obj.points[+vertex][e.target.dataset.axis]=clamp(v,0,e.target.dataset.axis==='x'?doc.site.width:doc.site.height);}
  else if(field==='verified')doc.verified=v;
  else if(field==='northVerified')doc.northVerified=v;
  else if(field==='north'){doc.north=clamp(v,0,360);doc.northVerified=false;}
  else if(field.startsWith('site.')){doc.site[field.slice(5)]=clamp(v,5,500);doc.verified=false;}
  else if(field.startsWith('house.')){const k=field.slice(6);doc.house[k]=['type','roof'].includes(k)?v:k==='rotation'?clamp(v,-360,360):['x','y'].includes(k)?clamp(v,0,k==='x'?doc.site.width:doc.site.height):clamp(v,2,60);roofArt=null;}
  else if(field.startsWith('aux.')){const b=doc.buildings.find(x=>x.id===selected.slice(9));if(b){const k=field.slice(4);b[k]=k==='roof'?v:k==='rotation'?clamp(v,-360,360):['x','y'].includes(k)?clamp(v,0,k==='x'?doc.site.width:doc.site.height):clamp(v,2,60);roofArts.delete(b.id)}}
   else if(field.startsWith('object.')){const obj=doc.objects.find(x=>x.id===selected);if(obj){const k=field.slice(7);if(obj.type==='pavers'&&['catalogId','width'].includes(k)){if(k==='width')setSegmentSettings(obj,{width:clamp(v,.4,10)});else if(byId(v)?.group==='pavers')setSegmentSettings(obj,{catalogId:v});}else obj[k]=k==='catalogId'?(byId(v)?.group===obj.type?v:obj.catalogId):k==='rotation'?clamp(v,-360,360):k==='width'?clamp(v,.4,10):k==='diameter'?clamp(v,.1,30):k==='height'?clamp(v,.15,40):clamp(v,0,k==='x'?doc.site.width:doc.site.height)}}
  doc=normalizeProject(doc);syncAutoLawn();save();draw();
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
  const paths=[...new Set([...svg.matchAll(new RegExp('href="((?:[.]?/)?assets/(?:landscape-(?:premium|photo|card-photo)|landscape/items)/[a-z0-9-]+[.](?:png|jpe?g|webp)[?][^"]*)"','gi'))].map(m=>m[1]))];
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
 async function rasterize(labels,{album=false,summer=false}={}){
  const w=doc.site.width,h=doc.site.height;
  const width=w>=h?2048:Math.max(1,Math.round(2048*w/h));
  const height=h>=w?2048:Math.max(1,Math.round(2048*h/w));
  // An AI revision always starts from the measured vector geometry, never a previous AI variation.
  const previous=preview,previousPhoto=photoVisible,previousSelection=selected,previousPoints=points,previousBrush=brush,previousDimensions=showDimensions,previousAtmosphere=doc.atmosphere;
  selected=null; // Export/AI source must not contain selection handles or amber outlines.
  if(!labels){preview=null;photoVisible=false;points=[];brush=null;showDimensions=false;}
  if(album){preview=null;photoVisible=false;points=[];brush=null;showDimensions=true;}
  if(summer)doc.atmosphere={...doc.atmosphere,season:'summer',time:'day',weather:'sunny'};
  let raw;try{raw=drawSvg(true,album)}finally{selected=previousSelection;preview=previous;photoVisible=previousPhoto;points=previousPoints;brush=previousBrush;showDimensions=previousDimensions;doc.atmosphere=previousAtmosphere}
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
  const img=$('#lpRenderOutputImage',el);img.hidden=!(stage==='success'&&renderOutput);
  if(stage==='success'&&renderOutput)img.src=renderOutput;
  $('#lpRenderActions',el).hidden=!['success','error'].includes(stage);
  const isPlan=stage==='success'&&renderOutput?.startsWith('data:image/svg');
  $('#lpResultTopPhoto',el).hidden=!isPlan;
  $('#lpResultNightPhoto',el).hidden=!isPlan;
  $('#lpResultDimensions',el).hidden=!isPlan;
  $('[data-render-download]',el).hidden=stage!=='success'||!renderOutput;
  $('[data-render-close]',el).textContent=stage==='error'?'Вернуться в редактор':'Вернуться к плану';
 }
 function showRender(kind){
  renderOutput=null;
  generationStarted=Date.now();
  renderStage('prepare','Подготовка проекта','Подготавливаем геометрию, растения и материалы.');
  $('#lpRenderQueue',modal).textContent='Подготовка исходного изображения';
  stopRenderClock();
  progressTicker=setInterval(()=>{const el=$('#lpRenderElapsed',modal);if(el)el.textContent='Прошло '+elapsed(Date.now()-generationStarted)},1000);
  progressListener=e=>{
   if(!busy||!modal)return;
   const d=e.detail||{},s=d.status,el=$('#lpRenderQueue',modal);
   if(s==='queued'){renderStage('queued','Рендер в очереди','Сервер сам запустит обработку. Повторно нажимать не нужно.');el.textContent='Позиция в очереди: '+Math.max(1,d.position||1);}
   if(s==='running'){renderStage('running',kind.startsWith('photo')?'Создаём фотореалистичный вид сверху':'Создаём визуализацию','Растительность, камень, мощение, вода и солнечное освещение.');el.textContent='Фотореалистичная обработка на сервере';}
   if(s==='completed'){renderStage('save','Сохраняем результат','Файл получен; переносим изображение в проект.');el.textContent='Сохранение готового изображения';}
   if(s==='recovering'){renderStage('running','Восстанавливаем результат','Возвращаем уже отправленную работу без повторной оплаты.');el.textContent='Восстановление соединения';}
  };
  document.addEventListener('forma:render-job-status',progressListener);
 }
 function showFinishedPlan(){
  const oldPreview=preview,oldSelection=selected;
  try{
   preview=null;selected=null;photoVisible=false;
   renderOutput='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(drawSvg(true,true));
  }finally{preview=oldPreview;selected=oldSelection}
  drawMap();
  renderStage('success','Готовый генплан','Подписанный план участка. Можно скачать SVG или открыть фотореалистичный вид сверху.');
  $('#lpRenderQueue',modal).textContent='Генплан из модели проекта';
  $('#lpRenderElapsed',modal).textContent='';
 }
 async function runAI(kind){
  if(busy)return;
  const photo=kind==='photo'||kind==='photo-night',night=kind==='photo-night';
  const sceneKey=JSON.stringify(doc),heading=night?'Вид сверху · ночь':'Вид сверху · летний день';
  busy=true;$('#lpAi',modal).disabled=true;
  try{
   if(photo){
    const cached=await storage('nadir-v3-'+kind).catch(()=>null);
    if(cached?.model===sceneKey&&cached.image){
     preview=cached.image;previewModel=sceneKey;previewKind=kind;photoVisible=true;
     renderOutput=preview;drawMap();
     renderStage('success',heading,'Сохранённый рендер текущего проекта.');
     $('#lpRenderQueue',modal).textContent='Результат из проекта';$('#lpRenderElapsed',modal).textContent='';return;
    }
   }
   if(!confirm(photo?'Создать «'+heading+'»? Это один платный запрос.':'Создать один профессиональный AI-рендер? Операция платная.'))return;
   showRender(kind);
  say('Генерация начата. Этапы отображаются на отдельном экране.');
   const target=selected?.startsWith('building:')?doc.buildings.find(b=>b.id===selected.slice(9)):doc.house;
   const payload=kind==='roof'
    ?{image:target?.photo||null,roofTopView:{width:target?.width,height:target?.height,roof:target?.roof},quality:'high',quantity:1}
    :{image:await rasterize(false,{summer:photo}),reference:doc.house.photo||null,landscapeMasterplan:{...coordinateSummary(doc),presentationMode},quality:'high',quantity:1};
   if(JSON.stringify(doc)!==sceneKey)throw Error('Проект изменился во время подготовки. Запрос не отправлен.');
   if(photo)payload.landscapeMasterplan.presentationMode=night?'photoreal-night':'photoreal-day';
   if(!payload.image)throw Error('Загрузите фотографию строения.');
   const source=$('#lpRenderSourceImage',modal);if(source){source.src=payload.image;source.hidden=false;}
   renderStage('running',kind.startsWith('photo')?'Создаём фотореалистичный вид сверху':'Создаём профессиональный генплан',photo?'Сохраняем ортогональный ракурс, контуры и положение объектов.':'Используем точный план и выбранный стиль ландшафтной графики.');
   $('#lpRenderQueue',modal).textContent='Передано на сервер';
   // Shared FIFO queue preserves its job ID and prevents duplicate paid requests.
   const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.images?.[0])throw Error(data.error||'Сервер не выдал изображение. Проверьте восстановление задания перед повтором.');
   const result='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
   renderStage('save','Сохраняем визуализацию','Получаем готовый файл и привязываем его к проекту.');
   renderOutput=result;
   if(photo)await storage('nadir-v3-'+kind,{model:sceneKey,image:result}).catch(()=>{});
   if(kind==='roof'){
    if(target===doc.house){roofArt=result;await storage('roof',result).catch(()=>{});}
    else{roofArts.set(target.id,result);await storage('roof-'+target.id,result).catch(()=>{});}
   }else{preview=result;previewKind=kind;previewModel=sceneKey;photoVisible=true;await storage('preview-kind',kind).catch(()=>{});await storage('preview',result).catch(()=>{});await storage('preview-model',JSON.stringify(doc)).catch(()=>{});}
   drawMap();say('Готово. Размеры остались в геометрической модели.');
   stopRenderClock();
   renderStage('success',photo?heading:'Визуализация готова','Готовый кадр можно скачать или посмотреть на плане.');$('#lpRenderQueue',modal).textContent='Результат получен';
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
  if(b.dataset.atmoToggle!==undefined){const drawer=$('#lpAtmoQuick',modal);if(drawer){drawer.hidden=!drawer.hidden;b.setAttribute('aria-expanded',String(!drawer.hidden));}return}
  if(b.dataset.pathMaterial){
    const material=byId(b.dataset.pathMaterial);
    if(material?.group!=='pavers')return;
    const selectedPath=doc.objects.find(o=>o.id===selected&&o.type==='pavers');
    chosen=material.id;category='pavers';points=[];pathDraftSource=null;
    if(selectedPath){
     // Changing a selected path is a material replacement, not the creation
     // of another overlapping copy with the default concrete texture.
     checkpoint();setSegmentSettings(selectedPath,{catalogId:material.id});mode='select';photoVisible=false;
     save();draw();say('Материал ВЫБРАННОЙ дорожки изменён: '+material.name+'. Ширина, маршрут и координаты сохранены.');
    }else{
     mode='path';draw();revealCanvas();
     say('Выбрано мощение: '+material.name+'. Нажимайте на план, чтобы создать новую дорожку.');
    }
    return;
   }
  if(b.dataset.autoFillLawn!==undefined){autoFillLawn();return}
   if(b.dataset.areaMaterial){chosen=b.dataset.areaMaterial;category=itemCatalog().group;if(category==='lawns'){autoFillLawn();return}setMode('area');return}
  if(b.dataset.clearLandscape!==undefined){
   const removable=doc.objects.filter(x=>x.type!=='pavers').length+doc.buildings.length;
   if(!removable){say('Участок уже очищен: остались только дом и дорожки.');return}
   if(!confirm('Очистить участок? Будут удалены все растения, газоны, отсыпки, водоёмы, камни, освещение и дополнительные постройки. Дом, дорожки, границы и размеры участка сохранятся. Можно отменить кнопкой ↶.'))return;
   checkpoint();doc.objects=doc.objects.filter(x=>x.type==='pavers');doc.buildings=[];selected=null;points=[];brush=null;drag=null;mode='select';photoVisible=false;category='pavers';chosen='concrete-pavers';placementCount=0;save();draw();say('Участок очищен. Дом и дорожки сохранены. ↶ вернёт удалённые объекты.');return;
  }
  if(b.dataset.areaTool){areaTool=b.dataset.areaTool;points=[];brush=null;draw();revealCanvas();say(areaTool==='eraser'?'Ластик: проведите по газону, отсыпке или пруду.':areaTool==='brush'?'Проведите пальцем или мышью, без точек.':'Поставьте точки контура и нажмите «Завершить».');return}
  if(b.dataset.surfaceMode){setMode(b.dataset.surfaceMode==='strip'?'strip':'area');return}
  if(b.dataset.category){const wasStrip=mode==='strip';category=b.dataset.category;chosen=CATALOG.find(x=>x.group===category).id;if(category==='lawns'){autoFillLawn();return}if(category==='pavers'){pathInput='points';pathShape=pointPathShape;}setMode(category==='pavers'?'path':category==='fills'&&wasStrip?'strip':['fills','ponds'].includes(category)?'area':'place');return}
  if(b.dataset.asset){const wasStrip=mode==='strip';chosen=b.dataset.asset;const g=itemCatalog().group;if(g==='lawns'){autoFillLawn();return}setMode(g==='pavers'?'path':g==='fills'&&wasStrip?'strip':['fills','ponds'].includes(g)?'area':'place');return}
  if(b.dataset.eraser!==undefined){mode='area';areaTool='eraser';points=[];brush=null;draw();revealCanvas();say('Ластик: проведите пальцем по части газона, отсыпки или пруда.');return}
   if(b.dataset.newPathBrush!==undefined){if(mode==='path'&&points.length&&!confirm('Начать новую дорожку? Незавершённый маршрут будет сброшен.'))return;if(pathInput==='points')pointPathShape=pathShape;pathInput='brush';pathShape='smooth';pathShapeExplicit=false;setMode('path');return}
   if(b.dataset.tool){if(b.dataset.tool==='path'){pathInput='points';pathShape=pointPathShape;}setMode(b.dataset.tool);return}
  if(b.dataset.pathInput){if(!['points','brush'].includes(b.dataset.pathInput)||pathStroke||pointGesture)return;if(mode!=='path')setMode('path');const next=b.dataset.pathInput;if(next!==pathInput){if(next==='brush'){if(points.length>=2){say('Сначала завершите маршрут по точкам или нажмите «Отмена».');return;}pointPathShape=pathShape;pathShape='smooth';points=[];pathDraftSource=null;}else{pathShape=pointPathShape;}pathInput=next;}drawMap();drawPalette();say(pathInput==='brush'?'Кисть активна. Каждый мазок сохраняется отдельно.':'Ставьте точки маршрута.');return}
  if(b.dataset.pathShape){switchPathShape(b.dataset.pathShape);return}
  if(b.dataset.quickCategory){category=b.dataset.quickCategory;chosen=category==='ponds'?'natural':CATALOG.find(x=>x.group===category)?.id||chosen;if(category==='lawns'){autoFillLawn();return}if(category==='pavers'){pathInput='points';pathShape=pointPathShape;}setMode(category==='pavers'?'path':['fills','ponds'].includes(category)?'area':'place');return}
  if(b.dataset.zoom==='in'){zoomTo(viewScale*1.5);return}
  if(b.dataset.zoom==='out'){zoomTo(viewScale/1.5);return}
  if(b.dataset.zoom==='fit'){zoomTo(1);say('Весь участок в кадре.');return}
  if(b.dataset.zoom==='focus'){focusObject();return}
  if(b.id==='lpPhotoToggle'){if(preview){if(previewModel!==JSON.stringify(doc)){photoVisible=false;drawMap();say('План изменён. Создайте новый фотореалистичный генплан, чтобы увидеть обновлённое размещение.');return}}photoVisible=!photoVisible;drawMap();return}
  if(b.id==='lpFinish'||b.id==='lpPathFinishNow'||b.id==='lpMobilePathDone'){finish();return}
  if(b.id==='lpCancel'||b.id==='lpPathCancelNow'||b.id==='lpMobilePathCancel'){endDrawing();return}
  if(b.id==='lpPathUndoPoint'||b.id==='lpMobilePathBack'){if(mode==='path'&&pathInput==='brush'){if(pathStroke){cancelPathStroke();drawMap();}return;}if(mode==='path'&&points.length&&!pathStroke){cancelPointGesture();points.pop();pathDraftSource=points.length?{raw:points.map(p=>({...p})),kind:'points'}:null;drawMap();drawPalette();}return}
  if(b.dataset.cornerBrush){startCornerTool(b.dataset.cornerBrush);return}
  if(b.dataset.cornerDone!==undefined){cancelCornerStroke();mode='select';draw();return}
  if(b.id==='lpMobilePathDelete'){if(['select','corner'].includes(mode)&&selectedPlanObject()?.type==='pavers'&&confirm('Удалить только выбранный участок дорожки?')){cancelCornerStroke();mode='select';deleteSelected();}return}
  if(b.id==='lpMobilePathDeselect'){if(mode==='corner'){cancelCornerStroke();mode='select';draw();return}selected=null;drag=null;draw();return}
  if(b.dataset.existingPathMaterial){const obj=selectedPlanObject(),entry=byId(b.dataset.existingPathMaterial);if(mode!=='select'||obj?.type!=='pavers'||entry?.group!=='pavers')return;if(segmentSettings(obj)?.catalogId!==entry.id){checkpoint();setSegmentSettings(obj,{catalogId:entry.id});save();draw();say('Материал выбранного участка изменён. Остальные участки сохранены.');}return}
  if(b.dataset.undo!==undefined){reverse('undo');return}
  if(b.dataset.redo!==undefined){reverse('redo');return}
  if(b.dataset.planDone!==undefined){selected=null;drag=null;draw();say('Объект сохранён. Можно выбрать другой.');return}
  if(b.dataset.planFine){nudgeSelected(b.dataset.planFine,.1);return}
  if(b.dataset.nudge){nudgeSelected(b.dataset.nudge);return}
  if(b.dataset.rotateObject!==undefined){spinSelected(Number(b.dataset.rotateObject));return}
  if(b.dataset.duplicateObject!==undefined){copySelectedPlan();return}
  if(b.dataset.delete!==undefined){deleteSelected();return}
  if(b.dataset.concept!==undefined){
   const proposal=proposeLandscape(doc);
   if(!proposal.objects.length){say('Нет свободного места для автоподбора. Проверьте границы и расположение объектов.');return;}
   const categories={pavers:'дорожки',trees:'деревья',shrubs:'кустарники',lights:'светильники',boulders:'камни'};
   const counts=Object.entries(categories).flatMap(([type,name])=>{
    const count=proposal.objects.filter(o=>o.type===type).length;
    return count?[name+' — '+count]:[];
   }).join(', ');
   if(!confirm('Вариант «'+proposal.name+'»: '+counts+'. Добавить к текущему плану?'))return;
   checkpoint();
   doc.objects.push(...proposal.objects.map(object=>({...object,id:uid()})));
   selected=null;points=[];brush=null;drag=null;mode='select';
   save();draw();
   say('Добавлен вариант «'+proposal.name+'»: '+counts+'. Можно редактировать каждый объект или отменить подбор.');
   return;
  }
  if(b.dataset.addBuilding!==undefined){if(doc.buildings.length>=24){say('Лимит — 24 дополнительных строения.');return}checkpoint();const type=b.dataset.addBuilding,aux={id:'b-'+uid().slice(2),type,x:doc.site.width*.76,y:doc.site.height*.7,width:type==='garage'?7:type==='bath'?6:4,height:type==='garage'?6:4,rotation:0,roof:'gable',roofColor:'#454543',photo:null};doc.buildings.push(aux);selected='building:'+aux.id;save();draw();say('Строение добавлено. Укажите его точное положение, размеры и поворот.');return}
  if(b.dataset.deleteBuilding!==undefined&&selected?.startsWith('building:')){const id=selected.slice(9);checkpoint();doc.buildings=doc.buildings.filter(x=>x.id!==id);roofArts.delete(id);selected=null;save();draw();return}
  if(b.dataset.renderClose!==undefined){if(!busy){$('#lpRenderOverlay',modal).hidden=true;}return}
  if(b.dataset.renderDownload!==undefined){if(renderOutput){const a=document.createElement('a');a.href=renderOutput;a.download=title()+'-genplan.'+(renderOutput.startsWith('data:image/svg')?'svg':renderOutput.startsWith('data:image/webp')?'webp':renderOutput.startsWith('data:image/jpeg')?'jpg':'png');document.body.append(a);a.click();a.remove();}return}
  if(b.dataset.planDimensions!==undefined){
   showDimensions=!showDimensions;
   try{localStorage.setItem(styleKey()+'-dimensions',String(showDimensions))}catch{}
   if(photoVisible)photoVisible=false;
   if(b.id==='lpResultDimensions')showFinishedPlan();else drawMap();
   return;
  }
  if(b.dataset.finishedPlan!==undefined){showFinishedPlan();return}
  if(b.dataset.topPhoto!==undefined){runAI(b.dataset.topPhoto==='night'?'photo-night':'photo');return}
  if(b.dataset.ai!==undefined){runAI('plan');return}
  if(b.dataset.roof!==undefined){runAI('roof');return}
  if(b.dataset.proSheet!==undefined||b.dataset.proPng!==undefined){
   const png=b.dataset.proPng!==undefined;
   const originalSelection=selected;let cleanSource;
   try{selected=null;cleanSource=drawSvg(true)}finally{selected=originalSelection}
   Promise.all([import('./forma-landscape-professional-sheet.js?v=measured-schedule-v2-20261122'),Promise.resolve(cleanSource)]).then(async([module,src])=>{
    const authored=module.composeProfessionalPlanSheet(src,doc,presentationMode);
    const svg=await inlineSVGAssets(authored);
    if(!png){download(title()+'-professional-genplan.svg',svg,'image/svg+xml');say('Профессиональный SVG-лист готов: план, легенда, шкала в метрах, север.');return;}
    const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
    try{
     const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('SVG не открылся'));image.src=url;});
     const canvas=document.createElement('canvas');canvas.width=2400;canvas.height=1680;
     canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,2400,1680);
     const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=title()+'-professional-genplan.png';a.click();
     say('Профессиональный PNG-лист 2400×1680 готов.');
    }finally{URL.revokeObjectURL(url)}
   }).catch(err=>say('Лист генплана: '+(err.message||err)));
   return;
  }
  if(b.dataset.svg!==undefined){inlineSVGAssets(drawSvg(true)).then(svg=>{download(title()+'-genplan.svg',svg,'image/svg+xml');say('Сохранён самостоятельный SVG генплана с встроенными изображениями.');}).catch(err=>say('SVG: '+err.message));return}
  if(b.dataset.png!==undefined){rasterize(true).then(src=>{const a=document.createElement('a');a.href=src;a.download=title()+'-2k.png';a.click()}).catch(err=>say('PNG: '+err.message));return}
  if(b.dataset.json!==undefined){download(title()+'-model.json',JSON.stringify(doc,null,2),'application/json');return}
  if(b.dataset.csv!==undefined){exportCSV();return}
  if(b.dataset.pdf!==undefined){
   const albumProject=JSON.parse(JSON.stringify(doc)),model=JSON.stringify(albumProject);
   say('Собираем PDF-альбом с генпланом и ведомостями.');
   Promise.all([import('./forma-landscape-pdf.js?v=complete-inventory-v2'),rasterize(true,{album:true})]).then(async([module,plan])=>{
    const [day,night]=await Promise.all(['photo','photo-night'].map(kind=>storage('nadir-v3-'+kind).catch(()=>null)));
    const validPhoto=day?.model===model?day.image:null;
    const format=$('#lpPdfFormat',modal)?.value==='A3'?'A3':'A4';
    const blob=await module.buildLandscapeAlbum(albumProject,plan,validPhoto,{format,nightImage:night?.model===model?night.image:null});
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
  cancelCornerStroke();if(mode==='corner')mode='select';
  checkpoint();photoVisible=false;
  if(selected.startsWith('building:')){const id=selected.slice(9);doc.buildings=doc.buildings.filter(x=>x.id!==id);roofArts.delete(id)}
  else {const obj=selectedPlanObject();if(obj?.type==='pavers'&&obj.points.length>2){const i=segmentIndex(obj),parts=normalizePavingSegments(obj),rounds=normalizeCornerRounds(obj.cornerRounds,obj.points.length),replacement=[];
   for(const [a,b] of [[0,i+1],[i+1,obj.points.length]])if(b-a>=2){const seg=parts.slice(a,b-1),pts=obj.points.slice(a,b);replacement.push({...obj,id:uid(),points:pts,segments:seg,width:seg[0].width,catalogId:seg[0].catalogId,cornerRounds:normalizeCornerRounds(rounds.slice(a,b),pts.length)});}
   const at=doc.objects.indexOf(obj);doc.objects.splice(at,1,...replacement);
  }else doc.objects=doc.objects.filter(x=>x.id!==selected);}
  selected=null;save();draw();say('Объект удалён. Отменить: Ctrl+Z. Обновите рендер после изменений.');
 }
 function onKey(e){
  if(!modal?.open||busy)return;
  if(e.key==='Escape'){if(mode!=='select'){e.preventDefault();endDrawing()}else close();return}
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if((e.key==='Delete'||e.key==='Backspace')&&selected&&!points.length){e.preventDefault();deleteSelected();return}
  if(e.key==='Enter'&&points.length){e.preventDefault();finish()}
  if(e.key==='Backspace'&&points.length){e.preventDefault();if(mode==='path'&&pathInput==='brush')points=[];else points.pop();cancelPointGesture();pathDraftSource=null;drawMap();drawPalette()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();reverse(e.shiftKey?'redo':'undo')}
 }
 async function open(){
  if(modal?.open)return;
  lastFocus=document.activeElement;pid=activeProject();try{doc=normalizeProject(JSON.parse(localStorage.getItem(siteKey())||'null'))}catch{doc=freshProject()}
  cancelPathStroke();pathDraftSource=null;pathInput='points';pointPathShape='orthogonal';pathShapeExplicit=false;cancelCornerStroke();selectedSegmentIndex=0;mode='select';chosen='pine';category='trees';selected=null;points=[];brush=null;areaTool='brush';viewScale=1;viewCentre=null;pinch=null;placementCount=0;presentationMode=readPresentationMode();
  try{showDimensions=localStorage.getItem(styleKey()+'-dimensions')==='true'}catch{showDimensions=false}
  hiddenPlanLayers.clear();undo=[];redo=[];preview=null;roofArt=null;roofArts=new Map();pathShape='orthogonal';photoVisible=true;
  modal=document.createElement('dialog');modal.id='faLandscapeMasterplan';modal.className='fa-landscape-masterplan';
   if(!document.getElementById('forma-plan-touch-controls-css')){
     const link=document.createElement('link');link.id='forma-plan-touch-controls-css';link.rel='stylesheet';link.href='forma-landscape-mobile-dock.css?v=touch-precision-v1-20261122';document.head.append(link);
    }
    if(!document.getElementById('forma-professional-plan-css')){
    const sheet=document.createElement('link');sheet.id='forma-professional-plan-css';sheet.rel='stylesheet';sheet.href='forma-landscape-professional-plan.css?v=professional-v1-20261122';document.head.append(sheet);
   }
  modal.innerHTML=`<div class="lp-shell"><header class="lp-head"><div class="lp-brand"><b>FORMA</b><span>ЛАНДШАФТНЫЙ ПРОЕКТ · ВИД СВЕРХУ</span></div><div><span id="lpSourceState"></span><a class="lp-launch-3d" href="forma-landscape-3d.html" title="Перейти в настоящий 3D-конструктор участка">${premiumIcon('world')}<span>3D-КОНСТРУКТОР</span></a><button type="button" data-close aria-label="Закрыть">×</button></div></header><div class="lp-layout"><aside class="lp-sidebar"><div class="lp-sidebar-head"><b>БИБЛИОТЕКА</b><small>46 объектов · 8 категорий</small></div><div id="lpPalette"></div><button type="button" data-icon class="lp-export-icon">Экспорт · SVG 1080</button><button type="button" data-icon-png class="lp-export-icon">Экспорт карточки · PNG/JPG 1080</button></aside><section class="lp-work"><div class="lp-tools"><button type="button" data-tool="select">${premiumIcon('select')}<span>Переместить</span></button><button type="button" data-delete title="Удалить выбранный объект · Delete">${premiumIcon('delete')}<span>Удалить</span></button><button type="button" data-eraser title="Стирать часть газона, отсыпки или пруда">${premiumIcon('eraser')}<span>Ластик</span></button><button type="button" data-tool="boundary">${premiumIcon('site')}<span>Граница</span></button><button type="button" data-tool="path">${premiumIcon('pavers')}<span>Дорожка по точкам</span></button><button type="button" data-new-path-brush title="Новая дорожка свободной кистью">${premiumIcon('pavers')}<span>Рисовать кистью</span></button><button type="button" data-tool="area">${premiumIcon('fills')}<span>Область</span></button><button type="button" data-atmo-toggle aria-expanded="false" aria-controls="lpAtmoQuick">${premiumIcon('atmosphere')}<span>Атмосфера</span></button><button type="button" data-clear-landscape class="lp-clear-all" title="Удалить всё кроме дома и дорожек · можно отменить">${premiumIcon('delete')}<span>Очистить участок</span></button><button type="button" data-undo>↶</button><button type="button" data-redo>↷</button></div><div class="lp-path-controls"><button type="button" data-finished-plan>Готовый генплан</button><button type="button" data-plan-dimensions aria-pressed="false">Показать размеры</button><button type="button" data-top-photo>Вид сверху · летний день</button><button type="button" data-top-photo="night">Вид сверху · ночь</button><button type="button" id="lpPhotoToggle" title="Переключение между точным чертежом и фотореалистичным рендером">▣ Фото-рендер</button><span id="lpToolName">Выбор</span><div class="lp-path-mode" id="lpPathControls" hidden><span id="lpSelectedMaterial">Брусчатка</span><div id="lpDesktopPathDrawControls"></div><div id="lpPathMaterials" class="lp-material-choices"></div></div><div id="lpSurfaceModes" class="lp-surface-modes" hidden><b>ОТСЫПКА · СПОСОБ НАНЕСЕНИЯ</b><div class="lp-surface-choices"><button type="button" data-surface-mode="strip" aria-pressed="false"><strong>〰 Полоса</strong><small>Вдоль дорожек и посадок · ширина в метрах</small></button><button type="button" data-surface-mode="area" aria-pressed="true"><strong>▣ Область</strong><small>Замкнутый контур · заливка всей площади</small></button></div></div><div id="lpStripControls" class="lp-strip-explain" hidden>Поставьте несколько точек вдоль полосы. Материал сразу покажется с реальной шириной. Кнопка «Создать полосу» сохранит отсыпку.</div><div id="lpAreaControls" class="lp-area-controls" hidden><div class="lp-area-modes"><button type="button" data-area-tool="brush">✎ Рисовать пальцем</button><button type="button" data-area-tool="polygon">⬠ Лассо</button><button type="button" data-area-tool="eraser">⌫ Ластик</button><button id="lpAutoFillLawn" type="button" data-auto-fill-lawn hidden>▣ Залить весь газон</button><label>Диаметр <input id="lpBrushSize" type="range" min=".5" max="12" step=".25" value="1.5"> <span id="lpBrushLabel">1.5 м</span></label></div><div id="lpAreaMaterials" class="lp-area-materials"></div></div><label id="lpWidthLabel" hidden>Ширина дорожки <input id="lpWidth" type="number" min=".4" max="10" step=".05" value="1.2"> м</label><label><input id="lpSnap" type="checkbox" checked> Шаг 5 см</label><button id="lpFinish" type="button" disabled>✓ Завершить</button><button id="lpCancel" type="button" disabled>✕ Прервать</button></div><div id="lpAtmoQuick" class="lp-atmo-quick" hidden><strong>☀ АТМОСФЕРА СЦЕНЫ</strong><div class="lp-atmo-quick-fields"><label>Время дня<select data-atmo="time">${SCENE_OPTIONS.time.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')}</select></label><label>Сезон<select data-atmo="season">${SCENE_OPTIONS.season.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')}</select></label><label>Погода<select data-atmo="weather">${SCENE_OPTIONS.weather.map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')}</select></label></div><small>Реальные высотные тени · геометрия остаётся прежней</small></div><div class="lp-category-shortcuts"><button type="button" data-quick-category="pavers" class="lp-quick-category" title="Дорожки"><span class="lp-quick-icon">${categoryIcon('pavers')}</span><span>Дорожки</span></button><button type="button" data-quick-category="lawns" class="lp-quick-category" title="Газоны"><span class="lp-quick-icon">${categoryIcon('lawns')}</span><span>Газоны</span></button><button type="button" data-quick-category="lights" class="lp-quick-category" title="Светильники"><span class="lp-quick-icon">${categoryIcon('lights')}</span><span>Светильники</span></button><button type="button" data-quick-category="trees" class="lp-quick-category" title="Деревья"><span class="lp-quick-icon">${categoryIcon('trees')}</span><span>Деревья</span></button><button type="button" data-quick-category="shrubs" class="lp-quick-category" title="Кустарники"><span class="lp-quick-icon">${categoryIcon('shrubs')}</span><span>Кустарники</span></button><button type="button" data-quick-category="ponds" class="lp-quick-category" title="Водоёмы"><span class="lp-quick-icon">${categoryIcon('ponds')}</span><span>Водоёмы</span></button><button type="button" data-quick-category="fills" class="lp-quick-category" title="Отсыпки"><span class="lp-quick-icon">${categoryIcon('fills')}</span><span>Отсыпки</span></button></div><details id="lpLayers" class="lp-layers"><summary>▦ Слои генплана · видимость</summary><div class="lp-layer-toggles">${PLAN_LAYERS.map(([id,name])=>'<label><input type="checkbox" data-plan-layer="'+id+'" checked>'+name+'</label>').join('')}</div><small>Скрытие слоя влияет только на просмотр. AI и экспорт содержат все объекты.</small></details><div class="lp-canvas"><div class="lp-zoom-tools"><button type="button" data-zoom="out" aria-label="Отдалить">−</button><span id="lpZoomValue">100%</span><button type="button" data-zoom="in" aria-label="Приблизить">＋</button><button type="button" data-zoom="focus" title="Приблизить выбранный объект">◎ К объекту</button><button type="button" data-zoom="fit" title="Весь участок">⤢ Весь</button></div><div id="lpMap"></div><div class="lp-draft-summary" id="lpDraftSummary" aria-live="polite" hidden></div></div><footer class="lp-work-foot"><span id="lpStatus" role="status">План строится в метрах. Отсыпка: полоса или залитая область. Водоём: замкнутый контур.</span><button type="button" data-concept>Подобрать ландшафт автоматически</button></footer></section><aside class="lp-properties"><div id="lpInspector"></div><section class="lp-outputs"><label>Набросок / схема<input id="lpUnderlay" type="file" accept="image/png,image/jpeg,image/webp"></label><label class="lp-plan-style">СТИЛЬ ЛАНДШАФТНОГО ГЕНПЛАНА<select id="lpPresentationMode" aria-label="Стиль профессионального генплана"><option value="presentation">Презентационный · премиальный</option><option value="planting">Посадочный · растения</option><option value="technical">Технический · чертёж</option></select></label><button type="button" id="lpAi" data-ai>AI · Профессиональный генплан</button><small>AI меняет только графическую подачу, не изменяя геометрию. Генерация платная; SVG экспортируется без AI.</small><div><button type="button" data-svg>SVG</button><button type="button" data-pro-sheet class="lp-pro-sheet">▤ Лист генплана · SVG</button><button type="button" data-pro-png class="lp-pro-sheet">▧ Лист генплана · PNG</button><button type="button" data-png>PNG 2K</button><button type="button" data-csv>Ведомость CSV</button><label class="lp-pdf-size">Альбом <select id="lpPdfFormat" aria-label="Формат листа PDF"><option value="A4">A4</option><option value="A3">A3</option></select></label><button type="button" data-pdf class="lp-export-album">▣ PDF-альбом проекта</button><button type="button" data-json>Модель JSON</button></div></section></aside></div><div id="lpRenderOverlay" class="lp-render-overlay" hidden role="dialog" aria-modal="true" aria-label="Ход генерации ландшафта"><div class="lp-render-panel"><header class="lp-render-header"><div class="lp-render-brand">FORMA <span>LANDSCAPE STUDIO</span></div><div class="lp-render-live"><span class="lp-render-dot"></span> RENDER ENGINE</div></header><div class="lp-render-preview" id="lpRenderImageArea"><img id="lpRenderSourceImage" alt="Исходный измеряемый генплан" hidden><div id="lpRenderOrbit" class="lp-render-orbit"><span></span><span></span><span></span><i>F</i></div><img id="lpRenderOutputImage" alt="Фотореалистичный ландшафтный генплан" hidden/></div><div class="lp-render-content"><div class="lp-render-eyebrow">ЛАНДШАФТНАЯ ВИЗУАЛИЗАЦИЯ</div><h2 id="lpRenderTitle">Создаём ваш ландшафт</h2><p id="lpRenderDesc">Подготавливаем план, материалы и окружение.</p><div class="lp-render-timeline"><div data-render-step="prepare"><b>01</b><span>Подготовка геометрии<small>Сверяем план и покрытия</small></span></div><div data-render-step="running"><b>02</b><span>Фотореалистичная визуализация<small>Растительность, фактуры, свет</small></span></div><div data-render-step="save"><b>03</b><span>Результат<small>Сохранение в проект</small></span></div></div><div class="lp-render-bottom"><span id="lpRenderElapsed">Прошло 00:00</span><span id="lpRenderQueue" aria-live="polite">Продолжительность зависит от сервера</span></div><div class="lp-render-result-actions" id="lpRenderActions" hidden><button type="button" data-plan-dimensions id="lpResultDimensions" aria-pressed="false" hidden>Показать размеры</button><button type="button" data-top-photo id="lpResultTopPhoto" hidden>Вид сверху · летний день</button><button type="button" data-top-photo="night" id="lpResultNightPhoto" hidden>Вид сверху · ночь</button><button type="button" data-render-download>↓ Сохранить изображение</button><button type="button" data-render-close>Вернуться к плану</button></div><p class="lp-render-note">Процент готовности модель не сообщает. Повторное нажатие не требуется.</p></div></div></div></div>`;
  document.body.append(modal);modal.addEventListener('click',click);
  const planBuild=document.createElement('small');planBuild.textContent='P29';planBuild.style.cssText='display:inline!important;font-size:9px;color:#b4a896;margin-left:5px;';$('.lp-brand',modal).append(planBuild);
  const modeSelect=$('#lpPresentationMode',modal);if(modeSelect)modeSelect.value=presentationMode;
  // Mobile: access the measured plan, asset catalog and inspector with one tap.
  // Only scroll existing panels; never change site geometry or object coordinates.
  const mobileJump=document.createElement('nav');
  mobileJump.className='lp-mobile-jump';
  mobileJump.setAttribute('aria-label','Разделы ландшафтного редактора');
  mobileJump.innerHTML=[
   ['plan','▦','План'],['assets','◈','Объекты'],['settings','⚙','Параметры']
  ].map(([target,glyph,title],index)=>'<button type="button" data-lp-jump="'+target+'" aria-pressed="'+String(index===0)+'"><span class="lp-nav-glyph" aria-hidden="true">'+glyph+'</span><span>'+title+'</span></button>').join('');
  const touchDock=document.createElement('section');
  touchDock.id='lpTouchSelection';touchDock.className='lp-mobile-selection';
  touchDock.setAttribute('aria-label','Редактирование выделенного объекта на генплане');
  touchDock.hidden=true;
  touchDock.innerHTML='<div class="lp-touch-selected"><strong id="lpTouchSelectedName"></strong><small>Перетащите пальцем или нажмите стрелку · шаг 10 см</small></div>'+
   '<div class="lp-touch-actions" role="group" aria-label="Действия с объектом">'+
   '<button type="button" data-plan-fine="up" aria-label="На 10 см вверх">↑</button>'+
   '<button type="button" data-plan-fine="left" aria-label="На 10 см влево">←</button>'+
   '<button type="button" data-plan-fine="down" aria-label="На 10 см вниз">↓</button>'+
   '<button type="button" data-plan-fine="right" aria-label="На 10 см вправо">→</button>'+
   '<button type="button" data-rotate-object="15" aria-label="Повернуть на 15 градусов">⟳</button>'+
   '<button type="button" data-duplicate-object data-mobile-copy aria-label="Дублировать объект">＋</button>'+
   '<button type="button" data-delete data-mobile-delete aria-label="Удалить объект">⌫</button>'+
   '<button type="button" data-plan-done class="lp-touch-done">✓ Готово</button></div>';
  mobileJump.insertAdjacentHTML('beforeend',
   '<div id="lpMobilePathInfo" aria-live="polite"></div>'+
   '<section id="lpMobilePathDrawControls" hidden></section>'+
   '<button type="button" id="lpMobilePathCancel" class="lp-path-draw-action">✕ Отмена</button>'+
   '<button type="button" id="lpMobilePathBack" class="lp-path-draw-action">↶ Точка</button>'+
   '<button type="button" id="lpMobilePathDone" class="lp-path-draw-action lp-path-primary">✓ Готово</button>'+
   '<button type="button" id="lpMobilePathDelete" class="lp-path-select-action">Удалить</button>'+
   '<button type="button" id="lpMobilePathDeselect" class="lp-path-select-action lp-path-primary">✓ Готово</button>'+
   '<section id="lpMobilePathWidthPanel" hidden aria-label="Ширина выбранной дорожки"><div class="lp-material-header"><strong>Ширина участка · <output id="lpMobilePathWidthValue">1,20 м</output></strong></div><input type="range" id="lpMobilePathWidth" aria-label="Ширина дорожки в метрах" min="0.4" max="10" step="0.05" value="1.2"><div class="lp-width-limits"><span>0,4 м</span><span>10 м</span></div></section>'+
   '<section id="lpMobilePathRoundingPanel" hidden></section>'+
   '<section id="lpMobilePathMaterials" hidden aria-label="Материал выбранной дорожки"><div class="lp-material-header"><strong>Покрытие участка</strong></div><div class="lp-mobile-path-cards">'+
   CATALOG.filter(x=>x.group==='pavers').map(x=>'<button type="button" data-existing-path-material="'+x.id+'"><img src="'+pavingPhoto(x)+'" alt=""><span>'+esc(x.name)+'</span></button>').join('')+'</div></section>');
  $('#lpMobilePathWidth',mobileJump).addEventListener('input',e=>{const width=clamp(Number(e.target.value),.4,10);$('#lpMobilePathWidthValue',mobileJump).textContent=num(width,2)+' м';const obj=selectedPlanObject();if(mode==='select'&&obj?.type==='pavers'){const original=obj.segments,wasPhoto=photoVisible;try{setSegmentSettings(obj,{width});photoVisible=false;drawMapBrush();}finally{obj.segments=original;photoVisible=wasPhoto;}}});
  $('#lpMobilePathWidth',mobileJump).addEventListener('change',e=>{const obj=selectedPlanObject();if(mode!=='select'||obj?.type!=='pavers')return;const width=clamp(Number(e.target.value),.4,10);if(width===segmentSettings(obj)?.width)return;checkpoint();setSegmentSettings(obj,{width});syncAutoLawn();save();draw();say('Ширина выбранного участка изменена. Соседние участки сохранены.');});

  modal.append(touchDock);
  const pathDock=document.createElement('section');
  pathDock.id='lpPathFinishDock';pathDock.hidden=true;
  pathDock.setAttribute('aria-label','Завершение рисования дорожки');
  pathDock.innerHTML='<div id="lpPathDraftInfo" aria-live="polite"></div><div class="lp-path-finish-actions"><button type="button" id="lpPathUndoPoint" aria-label="Убрать последнюю точку">↶ Точка</button><button type="button" id="lpPathCancelNow">✕ Отмена</button><button type="button" id="lpPathFinishNow">✓ Завершить дорожку</button></div>';
  const pathDockStyle=document.createElement('style');
  pathDockStyle.textContent=`
   #faLandscapeMasterplan #lpPathFinishDock[hidden]{display:none!important}
   #faLandscapeMasterplan #lpPathFinishDock{position:fixed;z-index:1100;bottom:18px;left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 20px));box-sizing:border-box;display:grid;gap:5px;padding:8px;border:1px solid #797269;border-radius:12px;background:#26292ef5;color:#eee6d8;box-shadow:0 6px 20px #0006;font:12px/1.3 system-ui,sans-serif}
   #faLandscapeMasterplan #lpPathDraftInfo{text-align:center}
   #faLandscapeMasterplan .lp-path-finish-actions{display:grid;grid-template-columns:.8fr .85fr 1.6fr;gap:5px}
   #faLandscapeMasterplan .lp-path-finish-actions button{min-width:0;min-height:44px;border:1px solid #676b72;background:#363940;color:#f4ede1;border-radius:8px;padding:5px;font:600 11px/1.2 system-ui,sans-serif}
   #faLandscapeMasterplan #lpPathFinishDock[data-path-input='brush'] .lp-path-finish-actions{grid-template-columns:1fr}
   #faLandscapeMasterplan #lpPathFinishDock button[hidden]{display:none!important}
   #faLandscapeMasterplan #lpPathFinishNow{background:#d0b894;color:#24272b;border-color:#d0b894}
   #faLandscapeMasterplan .lp-path-finish-actions button:disabled{opacity:.4}
   #faLandscapeMasterplan .lp-mobile-jump :is(.lp-path-draw-action,.lp-path-select-action,#lpMobilePathInfo,#lpMobilePathMaterials,#lpMobilePathWidthPanel,#lpMobilePathRoundingPanel,#lpMobilePathDrawControls){display:none}
   #faLandscapeMasterplan .lp-corner-actions,#faLandscapeMasterplan .lp-corner-settings{display:grid;grid-template-columns:1fr 1fr;gap:6px;min-width:0}
   #faLandscapeMasterplan .lp-corner-actions button[aria-pressed="true"]{background:#d0bd9f!important;color:#26282e!important}
   #faLandscapeMasterplan .lp-corner-settings label{display:grid;gap:2px;min-width:0;font-size:11px}
   #faLandscapeMasterplan .lp-corner-settings input{width:100%;min-width:0;min-height:35px;accent-color:#d0bd9f;touch-action:pan-x}
    #faLandscapeMasterplan .lp-path-inputs,#faLandscapeMasterplan .lp-path-shapes{display:grid;gap:4px;grid-template-columns:repeat(2,minmax(0,1fr));margin:3px 0}
   #faLandscapeMasterplan .lp-path-shapes{grid-template-columns:repeat(4,minmax(0,1fr))}
   #faLandscapeMasterplan .lp-freehand-note{text-align:center;color:#d6c6ae;font:12px/1.4 system-ui,sans-serif;padding:4px}
   #faLandscapeMasterplan :is(.lp-path-inputs,.lp-path-shapes) button{min-width:0;min-height:44px;padding:4px 2px;font-size:12px;white-space:normal;pointer-events:auto;touch-action:manipulation}
   #faLandscapeMasterplan :is(.lp-path-inputs,.lp-path-shapes) button[aria-pressed="true"]{background:#d0bd9f!important;color:#26282e!important}
   @media(max-width:760px){
    #faLandscapeMasterplan #lpMobilePathDrawControls:not([hidden]){display:block!important;grid-column:1/-1;grid-row:1;padding:1px}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"]>#lpMobilePathInfo{grid-row:2}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"]>.lp-path-draw-action{grid-row:3}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"][data-path-input="brush"]>#lpMobilePathDone{grid-column:1/-1}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"]>.lp-path-draw-action[hidden]{display:none!important}
    #faLandscapeMasterplan #lpDesktopPathDrawControls{display:none}
    #faLandscapeMasterplan #lpPathFinishDock{display:none!important}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"]>[data-lp-jump],#faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]>[data-lp-jump]{display:none!important}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="drawing"]>.lp-path-draw-action,#faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]>.lp-path-select-action{display:flex!important;min-height:49px;font-size:13px}
    #faLandscapeMasterplan .lp-mobile-jump:not([data-path-state="normal"])>#lpMobilePathInfo{display:block;grid-column:1/-1;text-align:center;font:11px/1.35 system-ui,sans-serif;color:#f2e5d1;padding:2px 4px}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]{grid-template-columns:repeat(2,minmax(0,1fr))!important;max-height:45dvh;overflow-y:auto;gap:5px}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]>#lpMobilePathInfo{grid-row:1}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]>.lp-path-select-action{grid-row:5}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"]>.lp-path-select-action{font-size:12px;white-space:normal;min-width:0;padding:4px 2px}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"] #lpMobilePathWidthPanel:not([hidden]){display:block!important;grid-column:1/-1;grid-row:2;padding:2px 5px}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"] #lpMobilePathRoundingPanel:not([hidden]){display:flex!important;grid-column:1/-1;grid-row:4;align-items:center;justify-content:space-between;gap:8px;padding:2px 5px;color:#f2e5d1;font:12px system-ui,sans-serif}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"] #lpMobilePathRoundingPanel:not([hidden]){display:block!important}
    #faLandscapeMasterplan #lpMobilePathRoundingPanel:not([data-active="true"]) .lp-corner-settings{display:none}
    #faLandscapeMasterplan #lpMobilePathRoundingPanel .lp-corner-actions button{min-height:42px;font-size:12px}
    #faLandscapeMasterplan #lpMobilePathWidth{width:100%;min-height:44px;accent-color:#d0bd9f;touch-action:pan-x}
    #faLandscapeMasterplan .lp-width-limits{display:flex;justify-content:space-between;color:#c8c3ba;font-size:10px}
    #faLandscapeMasterplan .lp-mobile-jump .lp-path-primary{background:#d0bd9f!important;color:#26282e!important;border-color:#d0bd9f!important;font-weight:750}
    #faLandscapeMasterplan .lp-mobile-jump button:disabled{opacity:.45}
    #faLandscapeMasterplan .lp-mobile-jump[data-path-state="selected"] #lpMobilePathMaterials:not([hidden]){display:block!important;grid-column:1/-1;grid-row:3;min-width:0;padding:2px 5px}
    #faLandscapeMasterplan .lp-material-header{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:#f2e5d1;margin-bottom:5px}
    #faLandscapeMasterplan .lp-material-header button{width:40px;min-height:40px}
    #faLandscapeMasterplan .lp-mobile-path-cards{display:flex;gap:5px;overflow-x:auto;overscroll-behavior-x:contain;touch-action:pan-x;scrollbar-width:thin;padding-bottom:3px}
    #faLandscapeMasterplan .lp-mobile-path-cards button{flex:0 0 90px;min-width:0;min-height:68px;overflow:hidden;padding:4px;font-size:10px;text-align:center}
    #faLandscapeMasterplan .lp-mobile-path-cards button.active{border-color:#e7c898;background:#5a5042}
    #faLandscapeMasterplan .lp-mobile-path-cards img{width:100%;height:43px;object-fit:cover;border-radius:5px}
    #faLandscapeMasterplan #lpPathFinishDock{position:fixed!important;display:none!important;z-index:1100!important;bottom:calc(82px + env(safe-area-inset-bottom,0px))!important;left:8px;right:8px;transform:none;width:auto;max-width:470px;margin:auto;pointer-events:auto}
    #faLandscapeMasterplan #lpPathFinishDock[hidden]{display:none!important}
    #faLandscapeMasterplan[data-path-drawing='true'] .lp-layout{padding-bottom:calc(105px + env(safe-area-inset-bottom,0px))}
    #faLandscapeMasterplan[data-path-drawing='true'] .lp-mobile-jump{z-index:1099}
    #faLandscapeMasterplan #lpPathFinishDock button{min-height:48px!important;font-size:12px!important}
    #faLandscapeMasterplan #lpPathFinishDock #lpPathFinishNow{font-weight:750;background:#d0b894!important;color:#24272b!important}
    #faLandscapeMasterplan:has(.lp-render-overlay:not([hidden])) #lpPathFinishDock{display:none!important}
   }
  `;
  modal.append(pathDockStyle);
  // A direct dialog child avoids clipping by the map's overflow and scroll containers.
  modal.append(pathDock);
  modal.append(mobileJump);
  mobileJump.addEventListener('click',event=>{
   const button=event.target.closest('[data-lp-jump]');
   if(!button)return;
   event.stopPropagation();
   const section={
    plan:$('.lp-work',modal),assets:$('.lp-sidebar',modal),
    settings:$('.lp-properties',modal)
   }[button.dataset.lpJump];
   if(!section)return;
   section.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   mobileJump.querySelectorAll('button').forEach(item=>
    item.setAttribute('aria-pressed',String(item===button)));
  });
  modal.addEventListener('change',e=>{
   if(e.target.matches('#lpUnderlay,#lpHousePhoto,#lpAuxPhoto')){uploadPhoto(e.target.files?.[0],e.target.id==='lpHousePhoto'?'house':e.target.id==='lpAuxPhoto'?'aux':'underlay').catch(err=>say(err.message));return}
   if(e.target.id==='lpPresentationMode'){
    const next=e.target.value;
    presentationMode=['presentation','planting','technical'].includes(next)?next:'presentation';
    try{localStorage.setItem(styleKey(),presentationMode)}catch{}
    photoVisible=false;drawMap();
    say('Выбран режим: '+e.target.selectedOptions[0]?.textContent+'. Стиль сохранён для проекта и будет применён к новому рендеру.');
    return
   }
   if(e.target.matches('[data-plan-layer]')){
    const layer=e.target.dataset.planLayer;
    if(e.target.checked)hiddenPlanLayers.delete(layer);else hiddenPlanLayers.add(layer);
    if(selected&&doc.objects.find(o=>o.id===selected&&hiddenPlanLayers.has(o.type)))selected=null;
    drawMap();drawInspector();return;
   }
   if(e.target.id==='lpSnap'){snap=e.target.checked;return}
    if(e.target.id==='lpBrushSize'){$('#lpBrushLabel',modal).textContent=Number(e.target.value).toFixed(2)+' м';return}
   change(e);
  });
  modal.addEventListener('input',e=>{if(e.target.hasAttribute('data-corner-radius')){cornerRadius=clamp(Number(e.target.value),.2,5);modal.querySelectorAll('[data-corner-radius-value]').forEach(x=>x.textContent=num(cornerRadius,1)+' м');return}if(e.target.hasAttribute('data-corner-strength')){cornerStrength=clamp(Number(e.target.value)/100,.1,1);modal.querySelectorAll('[data-corner-strength-value]').forEach(x=>x.textContent=Math.round(cornerStrength*100)+'%');return}if(e.target.id==='lpBrushSize'){$('#lpBrushLabel',modal).textContent=Number(e.target.value).toFixed(2)+' м';}if(e.target.id==='lpWidth')drawMap()});
  const canvasRegion=$('#lpMap',modal);
  // Zooming is a VIEW-only transformation: all model coordinates, exports and AI
  // references continue to use full measured dimensions.
  canvasRegion?.addEventListener('wheel',e=>{
   if(!e.target.closest('#lpSvg'))return;
   e.preventDefault();
   const centre=position(e);
   zoomTo(viewScale*(e.deltaY<0?1.19:1/1.19),centre);
  },{passive:false});
  const touchDistance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  canvasRegion?.addEventListener('touchstart',e=>{
   if(mode!=='select'||e.touches.length!==2)return;
   pinch={distance:Math.max(1,touchDistance(e.touches)),scale:viewScale};
   brush=null;drag=null;
  },{passive:true});
  canvasRegion?.addEventListener('touchmove',e=>{
   if(mode!=='select'||!pinch||e.touches.length!==2)return;
   e.preventDefault();
   const midpoint={clientX:(e.touches[0].clientX+e.touches[1].clientX)/2,clientY:(e.touches[0].clientY+e.touches[1].clientY)/2};
   zoomTo(pinch.scale*touchDistance(e.touches)/pinch.distance,position(midpoint));
  },{passive:false});
  canvasRegion?.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null},{passive:true});
  modal.addEventListener('contextmenu',e=>{if(e.target.closest('#lpSvg')&&mode!=='select'){e.preventDefault();endDrawing();}});
  modal.addEventListener('dblclick',e=>{if(e.target.closest('#lpSvg')&&points.length>=(['path','strip'].includes(mode)?2:3)){e.preventDefault();finish();}});
  modal.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close()});
  document.addEventListener('keydown',onKey);modal.showModal();draw();
  enablePremiumAssets().then(ok=>{if(modal?.open){draw();if(ok)say('Библиотека готова: '+(photographicAssetCount()+cardPhotoCount())+' фотографических превью, остальные — прежние 1080×1080.');}}).catch(()=>{});
  try{[preview,roofArt,previewModel,previewKind]=await Promise.all([storage('preview').catch(()=>null),storage('roof').catch(()=>null),storage('preview-model').catch(()=>null),storage('preview-kind').catch(()=>null)]);if(previewModel!==JSON.stringify(doc))photoVisible=false;await Promise.all(doc.buildings.map(async b=>{const img=await storage('roof-'+b.id).catch(()=>null);if(img)roofArts.set(b.id,img)}));if(modal?.open)drawMap()}catch{}
 }
 function close(){
  if(busy){say('Сначала завершите AI-запрос.');return}
  if(!modal)return;cancelPathStroke();cancelCornerStroke();stopRenderClock();save();modal.close();modal.remove();modal=null;document.removeEventListener('keydown',onKey);lastFocus?.focus?.({preventScroll:true});
 }
 window.FORMA_LANDSCAPE_PROJECT={open,close,getProject:()=>normalizeProject(doc),getReport:()=>report(doc)};
