// FORMA R210 — parametric powder-coated horizontal louver fence.
// Dimensions in metres. Stepped level panels, terrain-following post bases.
export const FENCE_COLORS={anthracite:'#393d40',graphite:'#45494e',black:'#282b2c',brown:'#44322d',gray:'#868a8b'};
export const FENCE_STYLES={profile:'01 · Металлический профлист',picket:'02 · Евроштакетник',louver:'03 · Металлическое жалюзи',ranch:'04 · Металлическое ранчо',tube:'05 · Вертикальный профиль',mesh:'06 · Секционная 3D-сетка','brick-mixed':'07 · Кирпичные столбы + металл',brick:'08 · Сплошной кирпичный','brick-open':'09 · Ажурная кирпичная кладка','wood-picket':'10 · Деревянный штакетник',wood:'11 · Деревянное ранчо','wood-checker':'12 · Деревянная шахматка','wood-slat':'13 · Архитектурные рейки'};
export const BRICK_COLORS={red:'#a15d49',brown:'#65473b',beige:'#c1a98a',graphite:'#535355'};
export const WOOD_COLORS={larch:'#bb9364',oak:'#a58255',thermo:'#75533b',black:'#363330'};
const METAL_STYLES=['profile','picket','louver','ranch','tube','mesh'];
const isBrick=s=>s.startsWith('brick');
const isWood=s=>s.startsWith('wood');
const valid=(v,dict,d)=>Object.hasOwn(dict,v)?v:d;
export function sideFinish(f,i){const style=f.sideStyles[i]||'louver',v=f.sideFinishes[i]||{};return {style,color:valid(v.color,FENCE_COLORS,f.color),brick:valid(v.brick,BRICK_COLORS,'beige'),wood:valid(v.wood,WOOD_COLORS,'larch'),infill:METAL_STYLES.includes(v.infill)?v.infill:'profile',brickPostWidth:clamp(v.brickPostWidth,.26,.51,.38)};}

const clamp=(v,min,max,d)=>v!==null&&v!==''&&Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
export function normalizeFence(o={}){
 const f=o.fence||o;
 return {style:'louver',height:clamp(f.height,.8,3,1.8),sectionWidth:clamp(f.sectionWidth,1,3.5,2.4),postWidth:clamp(f.postWidth,.06,.18,.10),pitch:clamp(f.pitch,.08,.18,.12),angle:clamp(f.angle,15,55,32),clearance:clamp(f.clearance,.025,.20,.055),color:Object.hasOwn(FENCE_COLORS,f.color)?f.color:'anthracite',plinth:Boolean(f.plinth),sideFinishes:Object.fromEntries(Object.entries(f.sideFinishes||{}).filter(([k,v])=>/^\d+$/.test(k)&&v&&typeof v==='object').slice(0,500).map(([k,v])=>[k,{color:valid(v.color,FENCE_COLORS,'graphite'),brick:valid(v.brick,BRICK_COLORS,'beige'),wood:valid(v.wood,WOOD_COLORS,'larch'),infill:METAL_STYLES.includes(v.infill)?v.infill:'profile',brickPostWidth:clamp(v.brickPostWidth,.26,.51,.38)}])),sideStyles:Object.fromEntries(Object.entries(f.sideStyles||{}).filter(([k,v])=>/^\d+$/.test(k)&&Object.hasOwn(FENCE_STYLES,v)).slice(0,500)),openings:Array.isArray(f.openings)?f.openings.filter(x=>x&&Number.isInteger(x.side)&&x.side>=0&&['gate','wicket'].includes(x.kind)).slice(0,120).map(x=>({side:x.side,kind:x.kind,offset:clamp(x.offset,0,10000,1),width:clamp(x.width,x.kind==='gate'?2.5:.8,x.kind==='gate'?7:1.5,x.kind==='gate'?4:1),direction:x.direction==='left'?'left':'right'})):[]};
}

export function perimeterPoints(site){
 const raw=site.boundary?.length>=3?site.boundary:[{x:0,y:0},{x:site.width,y:0},{x:site.width,y:site.height},{x:0,y:site.height}];
 const pts=raw.map(p=>({x:Number(p.x),y:Number(p.y)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 const clean=pts.filter((p,i)=>!i||Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y)>.02);
 if(clean.length>2&&Math.hypot(clean[0].x-clean.at(-1).x,clean[0].y-clean.at(-1).y)<.02)clean.pop();
 return clean.length>=3?[...clean,{...clean[0]}]:[];
}
export function snapFencePoint(point,site,tolerance=.8){const pts=perimeterPoints(site);let best=null;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy);if(L<.02)continue;let t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(L*L)));if(t*L<Math.min(.35,tolerance*.5))t=0;if((1-t)*L<Math.min(.35,tolerance*.5))t=1;const x=a.x+dx*t,y=a.y+dy*t,distance=Math.hypot(point.x-x,point.y-y);if(!best||distance<best.distance)best={x,y,side:i-1,distance};}return best&&best.distance<=tolerance?best:null;}
export function fenceSideLengths(o){return (o.points||[]).slice(1).map((p,i)=>Math.hypot(p.x-o.points[i].x,p.y-o.points[i].y));}
export function validateFenceOpenings(o){
 const f=normalizeFence(o),lengths=fenceSideLengths(o);
 for(const [i,L] of lengths.entries()){
  const finish=sideFinish(f,i),post=isBrick(finish.style)?finish.brickPostWidth:f.postWidth,margin=post+.08;const side=f.openings.filter(x=>x.side===i).sort((a,b)=>a.offset-b.offset);
  if(side.filter(x=>x.kind==='gate').length>1||side.filter(x=>x.kind==='wicket').length>1)return 'На одной стороне допускается по одним воротам и калитке.';
  for(let j=0;j<side.length;j++){
   const x=side[j],end=x.offset+x.width;
   if(x.offset<margin||end>L-margin)return 'Проём не помещается на стороне '+(i+1)+'.';
   if(j&&x.offset<side[j-1].offset+side[j-1].width+post+.04)return 'Проёмы пересекаются на стороне '+(i+1)+'.';
   if(x.kind==='gate'){
    const travel=x.width+Math.max(.6,x.width*.35),lo=x.direction==='left'?x.offset-travel:end,hi=x.direction==='left'?x.offset:end+travel;
    if(lo<margin||hi>L-margin)return 'Не хватает места для отката ворот на стороне '+(i+1)+'.';
    if(side.some(z=>z!==x&&z.offset<hi+post&&z.offset+z.width>lo-post))return 'Калитка попадает в зону отката ворот.';
   }
  }
 }
 if(f.openings.some(x=>x.side>=lengths.length))return 'Выбранная сторона отсутствует.';
 return '';
}
function finishControls(f,side){
 const v=sideFinish(f,side),select=(key,label,values,current)=>'<label>'+label+'</label><select data-side-finish="'+key+'">'+Object.entries(values).map(([k,n])=>'<option value="'+k+'"'+(current===k?' selected':'')+'>'+n+'</option>').join('')+'</select>';
 let h=select('color','Цвет металла',{graphite:'Графит · RAL 7024',brown:'Коричневый · RAL 8017',anthracite:'Антрацит',black:'Чёрный',gray:'Серый'},v.color);
 if(isBrick(v.style))h+=select('brick','Кирпич',{red:'Красный',brown:'Коричневый',beige:'Бежевый',graphite:'Графит'},v.brick)+'<label>Ширина кирпичного столба, м</label><input type="number" min=".26" max=".51" step=".01" data-side-finish="brickPostWidth" value="'+v.brickPostWidth+'">'+(v.style==='brick-mixed'?select('infill','Заполнение между столбами',Object.fromEntries(METAL_STYLES.map(k=>[k,FENCE_STYLES[k]])),v.infill):'<small>Откатные ворота и калитка — металлические, в цвет выбранной стороны.</small>');
 if(isWood(v.style))h+=select('wood','Отделка дерева',{larch:'Лиственница',oak:'Дуб',thermo:'Термодерево',black:'Чёрное дерево'},v.wood);
 return h+'<button class="action" data-fence-action="finish">Применить материал стороны</button>';
}
export function openingInspector(o,side){
 const f=normalizeFence(o),lengths=fenceSideLengths(o),L=lengths[side]||0;
 const controls=['gate','wicket'].map(kind=>{
 const x=f.openings.find(x=>x.side===side&&x.kind===kind),gate=kind==='gate',w=x?.width||(gate?4:1),offset=x?.offset||Math.max(.3,Math.min(gate?3:1,L-w-.3));
 return '<div style="border-top:1px solid #ffffff22;padding:10px 0"><label><input type="checkbox" data-opening="'+kind+'-enabled" '+(x?'checked':'')+'> '+(gate?'Откатные ворота':'Калитка')+'</label><label>От начала стороны, м</label><input type="number" min=".1" max="'+L.toFixed(2)+'" step=".1" data-opening="'+kind+'-offset" value="'+offset.toFixed(2)+'"><label>Ширина проёма, м</label><input type="number" min="'+(gate?2.5:.8)+'" max="'+(gate?7:1.5)+'" step=".1" data-opening="'+kind+'-width" value="'+w+'">'+(gate?'<label>Направление отката (от начала стороны)</label><select data-opening="gate-direction"><option value="left" '+(x?.direction==='left'?'selected':'')+'>К началу ←</option><option value="right" '+(x?.direction!=='left'?'selected':'')+'>К концу →</option></select>':'')+'</div>';
 }).join('');
 return '<section style="margin:12px 0;padding:10px;border:1px solid #ffffff22;border-radius:10px"><strong>Ворота и калитка</strong><p class="hint">Выберите сторону на схеме или нажмите на забор.</p><div style="display:flex;gap:5px;flex-wrap:wrap">'+lengths.map((l,i)=>'<button type="button" data-fence-side="'+i+'" aria-pressed="'+(i===side)+'" style="flex:1;min-width:90px;'+(i===side?'border-color:#d7bd91;background:#514839':'')+'">Сторона '+(i+1)+' · '+l.toFixed(1)+' м</button>').join('')+'</div>'+'<label>Тип выбранной стороны</label><select data-fence-side-style>'+Object.entries(FENCE_STYLES).map(([k,v])=>'<option value="'+k+'"'+((f.sideStyles[side]||'louver')===k?' selected':'')+'>'+v+'</option>').join('')+'</select><small>Меняется только эта сторона. Ворота и калитка сохраняются.</small>'+finishControls(f,side)+controls+'<button class="action primary" data-fence-action="openings">Сохранить проёмы</button></section>';
}

export function fenceInspector(o,side=0){
 const f=normalizeFence(o),num=(k,l,min,max,step)=>'<label>'+l+'</label><input data-fence="'+k+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+f[k]+'">';
 return '<strong>Ограждение участка</strong><p class="hint">Секции автоматически распределяются по линии. На уклоне — ступенями.</p>'+openingInspector(o,side)+num('height','Высота, м',.8,3,.05)+num('sectionWidth','Ширина секции, м',1,3.5,.05)+num('postWidth','Толщина столба, м',.06,.18,.01)+num('pitch','Шаг ламелей, м',.08,.18,.01)+num('angle','Наклон ламелей, °',15,55,1)+num('clearance','Зазор от земли, м',.025,.20,.005)+'<label>Цвет металла</label><select data-fence="color">'+Object.entries({anthracite:'Антрацит',graphite:'Графит',black:'Чёрный',brown:'Коричневый',gray:'Серый'}).map(([k,v])=>'<option value="'+k+'"'+(f.color===k?' selected':'')+'>'+v+'</option>').join('')+'</select><label><input type="checkbox" data-fence="plinth" '+(f.plinth?'checked':'')+'> Бетонный цоколь</label><button class="action primary" data-fence-action="apply">Применить</button><button class="action" data-fence-action="delete">Удалить забор</button><button class="action" data-fence-action="duplicate">Дублировать</button>';
}

// Reusable dimensional components. All geometry is actual 3D, batched by finish.
export function createLouverFence(T,o,{pos,terrainAt,mobile=false}){
 const f=normalizeFence(o),g=new T.Group();g.name='forma-fence-r210';
 const points=(o.points||[]).filter(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))).map(p=>pos(Number(p.x),Number(p.y)));
 if(points.length<2)return g;
 const rows=new Map(),posts=new Map(),panels=[],openings=[];
 const at=(a,b,t)=>a.clone().lerp(b,t),tau=Math.PI*2;
 const keyAt=p=>Math.round(p.x*1000)+':'+Math.round(p.z*1000);
 const colorKey=(v,kind='metal')=>kind+':'+(kind==='brick'?v.brick:kind==='wood'?v.wood:v.color);
 const box=(key,x,y,z,w,h,d,yaw=0,tilt=0,roll=0,shape='box')=>{
  if(![x,y,z,w,h,d,yaw,tilt,roll].every(Number.isFinite)||Math.min(w,h,d)<=.0001)return;
  const k=key+'|'+shape;if(!rows.has(k))rows.set(k,[]);rows.get(k).push({x,y,z,w,h,d,yaw,tilt,roll});
 };
 const postW=v=>isBrick(v.style)?v.brickPostWidth:Math.max(f.postWidth,v.style==='mesh'?.06:0);
 const register=(p,top,v,yaw=0,opening=false)=>{
  const k=keyAt(p),w=postW(v),prev=posts.get(k);
  if(prev){prev.top=Math.max(prev.top,top);if(w>prev.w){prev.w=w;prev.v=v;prev.yaw=yaw;}prev.opening||=opening;}
  else posts.set(k,{p,top,w,v,yaw,opening});
 };
 let total=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.15)continue;
  const v=sideFinish(f,i-1),pw=postW(v),yaw=Math.atan2(-(b.z-a.z),b.x-a.x);
  let cursor=0;
  const list=f.openings.filter(x=>x.side===i-1).sort((x,y)=>x.offset-y.offset);
  const grade=(a,b)=>Math.max(...[0,.25,.5,.75,1].map(t=>{const q=at(a,b,t);return terrainAt(q.x,q.z);}));
  const segment=(start,end)=>{
   const len=end-start;if(len<.015)return;
   const count=Math.max(1,Math.ceil(len/(isBrick(v.style)?Math.min(f.sectionWidth,2.8):f.sectionWidth)));
   for(let j=0;j<count&&panels.length<900;j++){
    const u=at(a,b,(start+len*j/count)/length),q=at(a,b,(start+len*(j+1)/count)/length),y=grade(u,q);
    panels.push({u,q,y,yaw,v});register(u,y+f.height,v,yaw);register(q,y+f.height,v,yaw);
   }
  };
  for(const x of list){
   const start=x.offset-pw/2,end=x.offset+x.width+pw/2;if(start<cursor||end>length)continue;
   segment(cursor,start);const u=at(a,b,start/length),q=at(a,b,end/length),y=grade(u,q);
   register(u,y+f.height,v,yaw,true);register(q,y+f.height,v,yaw,true);
   openings.push({...x,u,q,y,yaw,v});cursor=end;
  }
  segment(cursor,length);total+=length;
 }
 // Each post is a single shared node, including corners between differing styles.
 // Panels terminate against the actual post faces rather than penetrating them.
 const faceTrim=(p,yaw)=>{const node=posts.get(keyAt(p));if(!node)return f.postWidth/2;const a=yaw-node.yaw;return node.w*.5*(Math.abs(Math.cos(a))+Math.abs(Math.sin(a)));};
 const theta=f.angle*Math.PI/180;
 function localBar(mid,yaw,v,z0=0){
  return (u,y,w,h,d,z=0,kind='metal',tilt=0,roll=0,shape='box')=>box(kind==='concrete'||kind==='mortar'||kind==='fastener'?kind:colorKey(v,kind),mid.x+Math.cos(yaw)*u+Math.sin(yaw)*(z+z0),y,mid.z-Math.sin(yaw)*u+Math.cos(yaw)*(z+z0),w,h,d,yaw,tilt,roll,shape);
 }
 function rail(bar,w,y,depth=.045,z=0){bar(0,y,w,.04,depth,z);}
 function fix(bar,x,y,z){if(!mobile)bar(x,y,.012,.012,.009,z,'fastener',0,0,'cylinder');}
 function masonry(bar,w,bottom,top,v,{open=false,depth=.25}={}){
  const H=top-bottom,courses=Math.max(1,Math.round(H/.075)),step=H/courses;
  if(!open)bar(0,(bottom+top)/2,w,H,depth-.014,0,'mortar');
  for(let k=0;k<courses;k++){
   const yy=bottom+(k+.5)*step,offset=k%2?.125:0;
   for(let x=-w/2-offset;x<w/2-.005;x+=.26){
    const a=Math.max(-w/2,x),b=Math.min(w/2,x+.25);if(b-a<.025)continue;
    if(open&&k%4!==0&&((Math.floor((x+w/2+offset)/.26)+k)%2===0)&&a>-w/2+.005&&b<w/2-.005)continue;
    bar((a+b)/2,yy,b-a-.006,Math.max(.02,step-.009),depth,0,'brick');
   }
  }
 }
 function infill(style,bar,w,bottom,top,v,leaf=false){
  const H=top-bottom;if(H<.05||w<.04)return;
  const middle=(bottom+top)/2,ys=[bottom+H*.20,bottom+H*.80],nP=Math.max(1,Math.round(w/.115)),stepP=w/nP;
  const rails=()=>{for(const y of ys)rail(bar,w,y,.045,-.035);};
  const vertical=(count,ratio,depth,kind,shape='box',z=0)=>{const step=w/count;for(let j=0;j<count;j++){const u=-w/2+step*(j+.5);bar(u,middle,step*ratio,H,depth,z,kind,0,0,shape);for(const y of ys)fix(bar,u,y,z+depth*.5+.005);}};
  if(style==='brick'||style==='brick-open'){masonry(bar,w,bottom,top,v,{open:style==='brick-open'});bar(0,top+.025,w,.05,.29,0,'concrete');return;}
  if(style==='brick-mixed')style=v.infill;
  if(style==='profile'){
   rails();const step=w/Math.max(1,Math.ceil(w/.115)),n=Math.round(w/step);
   for(let j=0;j<n;j++)bar(-w/2+step*(j+.5),middle,step+.0005,H,.020,0,'metal',0,0,'corrugated');
   if(!mobile)for(let j=0;j<n;j+=2)for(const y of ys)fix(bar,-w/2+step*(j+.5),y,.014);
  }else if(style==='picket'){
   rails();vertical(Math.max(1,Math.round(w/.145)),.74,.023,'metal','folded');
  }else if(style==='louver'){
   const n=Math.max(1,Math.floor(H/f.pitch)),step=H/n;for(let j=0;j<n;j++){
    const y=bottom+step*(j+.5),h=step*.94/Math.cos(theta);bar(0,y,w,h,.018,0,'metal',theta);
    for(const sign of [-1,1])bar(0,y+sign*Math.cos(theta)*h*.45,w,.008,.026,sign*Math.sin(theta)*h*.45,'metal',theta);
   }
   for(const sign of [-1,1])bar(sign*(w/2-.014),middle,.028,H,.072);
  }else if(style==='ranch'||style==='wood'){
   const wood=style==='wood',n=Math.max(2,Math.floor(H/(wood?.17:.15))),step=H/n;
   for(let j=0;j<n;j++){const y=bottom+step*(j+.5);bar(0,y,w,step*.77,wood?.035:.027,0,wood?'wood':'metal');for(const sign of [-1,1])fix(bar,sign*(w/2-.045),y,wood?.022:.018);}
   for(const sign of [-1,1])bar(sign*(w/2-.025),middle,.05,H,.05,-.035);
  }else if(style==='tube'){
   for(const y of [bottom+.045,top-.045])rail(bar,w,y,.045);
   vertical(Math.max(1,Math.floor(w/.095)),.40,.045,'metal');
  }else if(style==='mesh'){
   // Welded grid with three V-shaped stiffening bends.
   const n=Math.max(2,Math.round(w/.055)),step=w/n;
   const knots=[0,.14,.19,.24,.45,.50,.55,.76,.81,.86,1];
   const zAt=t=>Math.max(0,1-Math.abs(t-.19)/.05,1-Math.abs(t-.50)/.05,1-Math.abs(t-.81)/.05)*.035;
   const line=(u,y0,z0,y1,z1)=>{const len=Math.hypot(y1-y0,z1-z0);bar(u,(y0+y1)/2,.0045,len,.0045,(z0+z1)/2,'metal',Math.atan2(z1-z0,y1-y0));};
   for(let j=0;j<=n;j++)for(let k=1;k<knots.length;k++)line(-w/2+step*j,bottom+H*knots[k-1],zAt(knots[k-1]),bottom+H*knots[k],zAt(knots[k]));
   const levels=Math.max(2,Math.round(H/.16));for(let k=0;k<=levels;k++)bar(0,bottom+H*k/levels,w,.0045,.0045,zAt(k/levels));
   for(const sign of [-1,1])for(const y of ys)bar(sign*(w/2-.018),y,.037,.035,.042,0);
  }else if(style==='wood-picket'){
   rails();vertical(Math.max(1,Math.round(w/.145)),.76,.032,'wood');
  }else if(style==='wood-checker'){
   rails();const n=Math.max(2,Math.ceil(w/.22)),step=w/n;for(let face=0;face<2;face++)for(let j=-1;j<n;j++){const u=-w/2+(j+.5+face*.5)*step,a=Math.max(-w/2,u-step*.34),b=Math.min(w/2,u+step*.34);if(b>a+.015){bar((a+b)/2,middle,b-a,H,.028,face?.045:-.045,'wood');for(const y of ys)fix(bar,(a+b)/2,y,face?.063:-.063);}}
  }else if(style==='wood-slat'){
   rails();vertical(Math.max(1,Math.floor(w/.066)),.56,.055,'wood');
  }
 }
 for(const p of panels){
  const {u,q,y,yaw,v}=p,span=Math.hypot(q.x-u.x,q.z-u.z),a=faceTrim(u,yaw),b=faceTrim(q,yaw),w=span-a-b-.012;if(w<=.04)continue;
  const mid=at(u,q,(a+w/2+.006)/span),bar=localBar(mid,yaw,v);
  const brick=isBrick(v.style),solid=brick&&v.style!=='brick-mixed',plinth=f.plinth||brick;
  const base=plinth?.19:f.clearance,top=y+f.height-(solid?.065:.025);
  if(plinth)bar(0,y+.085,w,.20,solid?.31:Math.max(.18,f.postWidth*1.25),0,'concrete');
  infill(v.style,bar,w,y+base,top,v);
  // Real connection plates at the rail ends; no detached floating infill.
  if(!solid)for(const sign of [-1,1])for(const yy of [y+base+(top-y-base)*.2,y+base+(top-y-base)*.8])bar(sign*(w/2-.012),yy,.028,.055,.07,-.035);
 }
 // Determine inside of a closed polygon for the sliding leaf clearance.
 let area=0;for(let i=1;i<points.length;i++)area+=points[i-1].x*points[i].z-points[i].x*points[i-1].z;
 const inside=o.perimeter&&area<0?-1:1;
 for(const x of openings){
  const {u,q,y,yaw,v,kind,direction,width}=x,gate=kind==='gate',span=Math.hypot(q.x-u.x,q.z-u.z);
  const a=faceTrim(u,yaw),b=faceTrim(q,yaw),w=Math.min(width,span-a-b)-.035;if(w<.2)continue;
  const mid=at(u,q,(a+w/2+.0175)/span),bottom=y+.10,top=y+f.height-.045,H=top-bottom,frame=.045;
  const style=v.style==='brick-mixed'?v.infill:isBrick(v.style)?'profile':v.style;
  const offset=gate?inside*(Math.max(postW(v),isWood(v.style)?.10:.09)*.5+.085):0,bar=localBar(mid,yaw,v,offset);
  bar(0,bottom+frame/2,w,frame,.065);bar(0,top-frame/2,w,frame,.065);
  for(const sign of [-1,1])bar(sign*(w-frame)/2,(bottom+top)/2,frame,H,.065);
  infill(style,bar,w-frame*2,bottom+frame,top-frame,v,true);
  if(gate){
   const sign=direction==='left'?-1:1,tail=Math.max(.6,width*.35),ext=w/2+tail;
   bar(sign*tail/2,bottom-.035,w+tail,.075,.085);
   const rise=H*.72,len=Math.hypot(tail,rise);bar(sign*(w/2+tail/2),bottom+rise/2,len,.045,.045,0,'metal',0,-sign*Math.atan2(rise,tail));
   const groundBar=localBar(mid,yaw,v,offset);groundBar(sign*(w/2+tail*.53),y-.025,tail+.18,.13,.30,0,'concrete');
   for(const k of [.22,.75])groundBar(sign*(w/2+tail*k),y+.055,.12,.10,.10,0,'metal');
   groundBar(sign*(w/2+tail*.35),y+.18,.23,.25,.16,.12,'metal');
  }else{for(const yy of [bottom+.18,top-.18])bar(-w/2,yy,.065,.055,.075,0,'metal');bar(w*.36,(bottom+top)/2,.12,.027,.085,0,'fastener');}
 }
 for(const {p,top,w,v,yaw,opening} of posts.values()){
  const base=terrainAt(p.x,p.z)-.07,H=Math.max(.1,top-base),bar=localBar(p,yaw,v);
  if(isBrick(v.style)){
   bar(0,base+H/2,w-.016,H,w-.016,0,'mortar');
   const N=Math.max(1,Math.round(H/.075)),step=H/N;
   for(let k=0;k<N;k++){const y=base+(k+.5)*step,h=step-.009;
    // Alternating stretcher faces around a masonry core.
    const a=k%2===0;for(const sign of [-1,1]){if(a){bar(0,y,w-.008,h,.105,sign*(w-.105)/2,'brick');bar(sign*(w-.105)/2,y,.105,h,w-.218,0,'brick');}else{bar(sign*(w-.105)/2,y,.105,h,w-.008,0,'brick');bar(0,y,w-.218,h,.105,sign*(w-.105)/2,'brick');}}
   }
   bar(0,top+.025,w+.07,.05,w+.07,0,'concrete');bar(0,top+.06,w+.025,.022,w+.025,0,'concrete');
   if(opening)bar(0,base+H*.5,.045,H*.85,.045,0);
  }else{
   bar(0,base+H/2,w,H,w);bar(0,top+.009,w+.008,.018,w+.008);
  }
 }
 const mats=new Map(),geos=new Map();
 function profileGeo(shape){
  if(shape==='box')return new T.BoxGeometry(1,1,1);
  if(shape==='cylinder'){const g=new T.CylinderGeometry(.5,.5,1,8);g.rotateX(Math.PI/2);return g;}
  // Thin folded metal sheet: trapezoidal ridges and flat valleys, not solid blocks.
  const pts=shape==='corrugated'?[[-.5,-.40],[-.30,-.40],[-.17,.40],[.17,.40],[.30,-.40],[.5,-.40]]:[[-.5,-.25],[-.44,.05],[-.32,.38],[.32,.38],[.44,.05],[.5,-.25]];
  const vertices=[],indices=[];
  for(let i=0;i<pts.length;i++){const [x,z]=pts[i];vertices.push(x,-.5,z,x,.5,z);}
  for(let i=0;i<pts.length-1;i++){const a=i*2;indices.push(a,a+2,a+1,a+2,a+3,a+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
 }
 function grainTexture(kind){
  if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;const img=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const n=Math.sin(x*12.9898+y*78.233)*43758.5453,noise=n-Math.floor(n);
   const vein=kind==='wood'?Math.sin(x*.38+Math.sin(y*.028)*1.7)*.5+.5:Math.sin(x*.83+y*.57)*.5+.5;
   const v=Math.round(224+vein*(kind==='wood'?18:14)+noise*12),i=(y*128+x)*4;img.data.set([v,v,v,255],i);
  }ctx.putImageData(img,0,0);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
 }
 for(const [batch,list] of rows){
  const [key,shape]=batch.split('|'),[kind,c]=key.split(':');
  if(!mats.has(key)){
   const color=kind==='metal'?FENCE_COLORS[c]:kind==='wood'?WOOD_COLORS[c]:kind==='brick'?BRICK_COLORS[c]:kind==='mortar'?'#aaa59a':kind==='fastener'?'#777b7a':'#aaa8a0';
   const map=['wood','brick'].includes(kind)?grainTexture(kind):null;
   mats.set(key,new T.MeshStandardMaterial({color,roughness:kind==='metal'?.56:kind==='fastener'?.42:.88,metalness:kind==='metal'?.48:kind==='fastener'?.60:0,side:T.DoubleSide,...(map?{map,bumpMap:map,bumpScale:kind==='brick'?.0025:.001}: {})}));
  }
  if(!geos.has(shape))geos.set(shape,profileGeo(shape));
  // Independent geometry instances avoid disposal side effects in the editor.
  const mesh=new T.InstancedMesh(geos.get(shape).clone(),mats.get(key),list.length),d=new T.Object3D();
  for(let i=0;i<list.length;i++){const r=list[i];d.position.set(r.x,r.y,r.z);d.rotation.set(r.tilt,r.yaw,r.roll,'YXZ');d.scale.set(r.w,r.h,r.d);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);if(kind==='brick'||kind==='wood')mesh.setColorAt(i,new T.Color().setScalar(.84+.16*(.5+.5*Math.sin(i*13.7+r.x*9.1))));}
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='fence-'+kind+'-'+shape;g.add(mesh);
 }
 for(const geo of geos.values())geo.dispose();
 g.userData.formaFence={...f,sections:panels.length,posts:posts.size,lengthM:total,instances:[...rows.values()].reduce((a,b)=>a+b.length,0)};
 return g;
}
