// FORMA R208 — parametric powder-coated horizontal louver fence.
// Dimensions in metres. Stepped level panels, terrain-following post bases.
export const FENCE_COLORS={anthracite:'#393d40',graphite:'#505356',black:'#282b2c',brown:'#594b43',gray:'#868a8b'};
const clamp=(v,min,max,d)=>v!==null&&v!==''&&Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
export function normalizeFence(o={}){
 const f=o.fence||o;
 return {style:'louver',height:clamp(f.height,.8,3,1.8),sectionWidth:clamp(f.sectionWidth,1,3.5,2.4),postWidth:clamp(f.postWidth,.06,.18,.10),pitch:clamp(f.pitch,.08,.18,.12),angle:clamp(f.angle,15,55,32),clearance:clamp(f.clearance,.025,.20,.055),color:Object.hasOwn(FENCE_COLORS,f.color)?f.color:'anthracite',plinth:Boolean(f.plinth),openings:Array.isArray(f.openings)?f.openings.filter(x=>x&&Number.isInteger(x.side)&&x.side>=0&&['gate','wicket'].includes(x.kind)).slice(0,120).map(x=>({side:x.side,kind:x.kind,offset:clamp(x.offset,0,10000,1),width:clamp(x.width,x.kind==='gate'?2.5:.8,x.kind==='gate'?7:1.5,x.kind==='gate'?4:1),direction:x.direction==='left'?'left':'right'})):[]};
}

export function perimeterPoints(site){
 const raw=site.boundary?.length>=3?site.boundary:[{x:0,y:0},{x:site.width,y:0},{x:site.width,y:site.height},{x:0,y:site.height}];
 const pts=raw.map(p=>({x:Number(p.x),y:Number(p.y)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 const clean=pts.filter((p,i)=>!i||Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y)>.02);
 if(clean.length>2&&Math.hypot(clean[0].x-clean.at(-1).x,clean[0].y-clean.at(-1).y)<.02)clean.pop();
 return clean.length>=3?[...clean,{...clean[0]}]:[];
}
export function fenceSideLengths(o){return (o.points||[]).slice(1).map((p,i)=>Math.hypot(p.x-o.points[i].x,p.y-o.points[i].y));}
export function validateFenceOpenings(o){
 const f=normalizeFence(o),lengths=fenceSideLengths(o),margin=f.postWidth+.08;
 for(const [i,L] of lengths.entries()){
  const side=f.openings.filter(x=>x.side===i).sort((a,b)=>a.offset-b.offset);
  if(side.filter(x=>x.kind==='gate').length>1||side.filter(x=>x.kind==='wicket').length>1)return 'На одной стороне допускается по одним воротам и калитке.';
  for(let j=0;j<side.length;j++){
   const x=side[j],end=x.offset+x.width;
   if(x.offset<margin||end>L-margin)return 'Проём не помещается на стороне '+(i+1)+'.';
   if(j&&x.offset<side[j-1].offset+side[j-1].width+f.postWidth+.04)return 'Проёмы пересекаются на стороне '+(i+1)+'.';
   if(x.kind==='gate'){
    const travel=x.width+.4,lo=x.direction==='left'?x.offset-travel:end,hi=x.direction==='left'?x.offset:end+travel;
    if(lo<margin||hi>L-margin)return 'Не хватает места для отката ворот на стороне '+(i+1)+'.';
    if(side.some(z=>z!==x&&z.offset<hi+f.postWidth&&z.offset+z.width>lo-f.postWidth))return 'Калитка попадает в зону отката ворот.';
   }
  }
 }
 if(f.openings.some(x=>x.side>=lengths.length))return 'Выбранная сторона отсутствует.';
 return '';
}
export function openingInspector(o,side){
 const f=normalizeFence(o),lengths=fenceSideLengths(o),L=lengths[side]||0;
 const controls=['gate','wicket'].map(kind=>{
 const x=f.openings.find(x=>x.side===side&&x.kind===kind),gate=kind==='gate',w=x?.width||(gate?4:1),offset=x?.offset||Math.max(.3,Math.min(gate?3:1,L-w-.3));
 return '<div style="border-top:1px solid #ffffff22;padding:10px 0"><label><input type="checkbox" data-opening="'+kind+'-enabled" '+(x?'checked':'')+'> '+(gate?'Откатные ворота':'Калитка')+'</label><label>От начала стороны, м</label><input type="number" min=".1" max="'+L.toFixed(2)+'" step=".1" data-opening="'+kind+'-offset" value="'+offset.toFixed(2)+'"><label>Ширина проёма, м</label><input type="number" min="'+(gate?2.5:.8)+'" max="'+(gate?7:1.5)+'" step=".1" data-opening="'+kind+'-width" value="'+w+'">'+(gate?'<label>Направление отката (от начала стороны)</label><select data-opening="gate-direction"><option value="left" '+(x?.direction==='left'?'selected':'')+'>К началу ←</option><option value="right" '+(x?.direction!=='left'?'selected':'')+'>К концу →</option></select>':'')+'</div>';
 }).join('');
 return '<section style="margin:12px 0;padding:10px;border:1px solid #ffffff22;border-radius:10px"><strong>Ворота и калитка</strong><p class="hint">Выберите сторону на схеме или нажмите на забор.</p><div style="display:flex;gap:5px;flex-wrap:wrap">'+lengths.map((l,i)=>'<button type="button" data-fence-side="'+i+'" aria-pressed="'+(i===side)+'" style="flex:1;min-width:90px;'+(i===side?'border-color:#d7bd91;background:#514839':'')+'">Сторона '+(i+1)+' · '+l.toFixed(1)+' м</button>').join('')+'</div>'+controls+'<button class="action primary" data-fence-action="openings">Сохранить проёмы</button></section>';
}

export function fenceInspector(o,side=0){
 const f=normalizeFence(o),num=(k,l,min,max,step)=>'<label>'+l+'</label><input data-fence="'+k+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+f[k]+'">';
 return '<strong>Металлическое жалюзи</strong><p class="hint">Секции автоматически распределяются по линии. На уклоне — ступенями.</p>'+openingInspector(o,side)+num('height','Высота, м',.8,3,.05)+num('sectionWidth','Ширина секции, м',1,3.5,.05)+num('postWidth','Толщина столба, м',.06,.18,.01)+num('pitch','Шаг ламелей, м',.08,.18,.01)+num('angle','Наклон ламелей, °',15,55,1)+num('clearance','Зазор от земли, м',.025,.20,.005)+'<label>Цвет металла</label><select data-fence="color">'+Object.entries({anthracite:'Антрацит',graphite:'Графит',black:'Чёрный',brown:'Коричневый',gray:'Серый'}).map(([k,v])=>'<option value="'+k+'"'+(f.color===k?' selected':'')+'>'+v+'</option>').join('')+'</select><label><input type="checkbox" data-fence="plinth" '+(f.plinth?'checked':'')+'> Бетонный цоколь</label><button class="action primary" data-fence-action="apply">Применить</button><button class="action" data-fence-action="delete">Удалить забор</button><button class="action" data-fence-action="duplicate">Дублировать</button>';
}
export function createLouverFence(T,o,{pos,terrainAt,mobile=false}){
 const f=normalizeFence(o),g=new T.Group();g.name='forma-louver-fence-r208';
 const points=(o.points||[]).filter(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))).map(p=>pos(Number(p.x),Number(p.y)));
 if(points.length<2)return g;
 const rows={metal:[],edge:[],cap:[],concrete:[]},posts=new Map(),panels=[];
 const box=(key,x,y,z,w,h,d,yaw=0,tilt=0)=>{if(w<=0||h<=0||d<=0)return;rows[key].push({x,y,z,w,h,d,yaw,tilt});};
 const at=(a,b,t)=>a.clone().lerp(b,t);
 const register=(p,top)=>{const k=Math.round(p.x*1000)+':'+Math.round(p.z*1000);const prev=posts.get(k);if(prev)prev.top=Math.max(prev.top,top);else posts.set(k,{p,top});};
 let total=0;const openings=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.15)continue;
  const yaw=Math.atan2(-(b.z-a.z),b.x-a.x),edge=f.postWidth/2;
  const list=f.openings.filter(x=>x.side===i-1).sort((x,y)=>x.offset-y.offset);
  let cursor=0;
  const segment=(start,end)=>{
   const len=end-start;if(len<.01)return;const count=Math.ceil(len/f.sectionWidth);
   for(let j=0;j<count&&panels.length<800;j++){
    const u=at(a,b,(start+len*j/count)/length),v=at(a,b,(start+len*(j+1)/count)/length),mid=at(u,v,.5),span=len/count;
    const y=Math.max(...[0,.25,.5,.75,1].map(t=>{const p=at(u,v,t);return terrainAt(p.x,p.z);}));
    panels.push({u,v,mid,span,y,yaw});register(u,y+f.height);register(v,y+f.height);
   }
  };
  for(const x of list){
   const start=x.offset-edge,end=x.offset+x.width+edge;
   if(start<cursor||end>length)continue;
   segment(cursor,start);
   const u=at(a,b,start/length),v=at(a,b,end/length),mid=at(u,v,.5),y=Math.max(...[0,.25,.5,.75,1].map(t=>{const q=at(u,v,t);return terrainAt(q.x,q.z);}));
   register(u,y+f.height);register(v,y+f.height);
   openings.push({...x,u,v,mid,y,yaw});cursor=end;
  }
  segment(cursor,length);total+=length;
 }
 const theta=f.angle*Math.PI/180,slatH=f.pitch*.96/Math.cos(theta),slatD=.018,foot=f.plinth?.19:f.clearance;
 for(const p of panels){
  const {u,v,mid,span,y,yaw}=p,w=span-f.postWidth-.018;if(w<=.035)continue;
  if(f.plinth)box('concrete',mid.x,y+.085,mid.z,w,.20,f.postWidth*1.25,yaw);
  const bottom=y+foot,top=y+f.height-.025,n=Math.max(1,Math.floor((top-bottom)/f.pitch)),step=(top-bottom)/n;
  for(let j=0;j<n;j++){
   const yy=bottom+step*(j+.5);
   const actualH=step*.94/Math.cos(theta);
   box('metal',mid.x,yy,mid.z,w,actualH,slatD,yaw,theta);
   // Folded upper/lower hems, visible as fine edge highlights.
   for(const sign of [-1,1]){
    const localZ=sign*Math.sin(theta)*actualH*.45,localY=sign*Math.cos(theta)*actualH*.45;
    box('edge',mid.x+Math.sin(yaw)*localZ,yy+localY,mid.z+Math.cos(yaw)*localZ,w,.009,.027,yaw,theta);
   }
  }
  for(const sign of [-1,1]){const x=mid.x+Math.cos(yaw)*sign*(w/2-.015),z=mid.z-Math.sin(yaw)*sign*(w/2-.015);box('metal',x,(bottom+top)/2,z,.025,top-bottom,.065,yaw);}
 }
 // Closed cantilever sliding leaves, with real side rails, receiver posts and
 // an offset counterbalance tail extending behind the adjacent fixed fence.
 for(const x of openings){
  const {mid,y,yaw,width,kind,direction}=x,gate=kind==='gate',w=width-.025,bottom=y+.09,top=y+f.height-.045,h=top-bottom;
  const frame=.045,depth=.065,offset=gate?.045:0,xx=mid.x+Math.sin(yaw)*offset,zz=mid.z+Math.cos(yaw)*offset;
  const bar=(u,yy,ww,hh,dd,tilt=0,key='metal')=>box(key,xx+Math.cos(yaw)*u,yy,zz-Math.sin(yaw)*u,ww,hh,dd,yaw,tilt);
  bar(0,bottom+frame/2,w,frame,depth);bar(0,top-frame/2,w,frame,depth);
  for(const sign of [-1,1])bar(sign*(w-frame)/2,(top+bottom)/2,frame,h,depth);
  const n=Math.max(1,Math.floor((h-frame*2)/f.pitch)),step=(h-frame*2)/n;
  for(let j=0;j<n;j++)bar(0,bottom+frame+step*(j+.5),w-frame*2,step*.94/Math.cos(theta),slatD,theta);
  if(gate){const sign=direction==='left'?-1:1,tail=Math.min(.8,width*.2);bar(sign*(w/2+tail/2),bottom+.035,tail,.07,.075);bar(sign*w*.38,bottom+.12,.14,.15,.08,0,'cap');}
  else{bar(w*.38,(top+bottom)/2,.10,.025,.10,0,'cap');}
 }
 for(const {p,top} of posts.values()){
  const y=terrainAt(p.x,p.z)-.06,hh=Math.max(.1,top-y);
  box('metal',p.x,y+hh/2,p.z,f.postWidth,hh,f.postWidth);
  box('cap',p.x,top+.009,p.z,f.postWidth+.008,.018,f.postWidth+.008);
 }
 const color=new T.Color(FENCE_COLORS[f.color]),mats={metal:new T.MeshStandardMaterial({color,roughness:.58,metalness:.58}),edge:new T.MeshStandardMaterial({color:color.clone().multiplyScalar(1.18),roughness:.48,metalness:.55}),cap:new T.MeshStandardMaterial({color:color.clone().multiplyScalar(.82),roughness:.66,metalness:.4}),concrete:new T.MeshStandardMaterial({color:'#a5a39a',roughness:.91,metalness:0})};
 for(const [key,list] of Object.entries(rows)){
  if(!list.length){mats[key].dispose();continue;}
  const geometry=new T.BoxGeometry(1,1,1),mesh=new T.InstancedMesh(geometry,mats[key],list.length),d=new T.Object3D();
  for(let i=0;i<list.length;i++){const r=list[i];d.position.set(r.x,r.y,r.z);d.rotation.set(r.tilt,r.yaw,0,'YXZ');d.scale.set(r.w,r.h,r.d);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);}
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='fence-'+key;g.add(mesh);
 }
 g.userData.formaFence={...f,sections:panels.length,posts:posts.size,lengthM:total,instances:Object.values(rows).reduce((a,b)=>a+b.length,0)};
 return g;
}
