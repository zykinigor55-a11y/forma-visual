// FORMA R207 — parametric powder-coated horizontal louver fence.
// Dimensions in metres. Stepped level panels, terrain-following post bases.
export const FENCE_COLORS={anthracite:'#393d40',graphite:'#505356',black:'#282b2c',brown:'#594b43',gray:'#868a8b'};
const clamp=(v,min,max,d)=>v!==null&&v!==''&&Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):d;
export function normalizeFence(o={}){
 const f=o.fence||o;
 return {style:'louver',height:clamp(f.height,.8,3,1.8),sectionWidth:clamp(f.sectionWidth,1,3.5,2.4),postWidth:clamp(f.postWidth,.06,.18,.10),pitch:clamp(f.pitch,.08,.18,.12),angle:clamp(f.angle,15,55,32),clearance:clamp(f.clearance,.025,.20,.055),color:Object.hasOwn(FENCE_COLORS,f.color)?f.color:'anthracite',plinth:Boolean(f.plinth)};
}
export function fenceInspector(o){
 const f=normalizeFence(o),num=(k,l,min,max,step)=>'<label>'+l+'</label><input data-fence="'+k+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+f[k]+'">';
 return '<strong>Металлическое жалюзи</strong><p class="hint">Секции автоматически распределяются по линии. На уклоне — ступенями.</p>'+num('height','Высота, м',.8,3,.05)+num('sectionWidth','Ширина секции, м',1,3.5,.05)+num('postWidth','Толщина столба, м',.06,.18,.01)+num('pitch','Шаг ламелей, м',.08,.18,.01)+num('angle','Наклон ламелей, °',15,55,1)+num('clearance','Зазор от земли, м',.025,.20,.005)+'<label>Цвет металла</label><select data-fence="color">'+Object.entries({anthracite:'Антрацит',graphite:'Графит',black:'Чёрный',brown:'Коричневый',gray:'Серый'}).map(([k,v])=>'<option value="'+k+'"'+(f.color===k?' selected':'')+'>'+v+'</option>').join('')+'</select><label><input type="checkbox" data-fence="plinth" '+(f.plinth?'checked':'')+'> Бетонный цоколь</label><button class="action primary" data-fence-action="apply">Применить</button><button class="action" data-fence-action="delete">Удалить забор</button><button class="action" data-fence-action="duplicate">Дублировать</button>';
}
export function createLouverFence(T,o,{pos,terrainAt,mobile=false}){
 const f=normalizeFence(o),g=new T.Group();g.name='forma-louver-fence-r207';
 const points=(o.points||[]).filter(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))).map(p=>pos(Number(p.x),Number(p.y)));
 if(points.length<2)return g;
 const rows={metal:[],edge:[],cap:[],concrete:[]},posts=new Map(),panels=[];
 const box=(key,x,y,z,w,h,d,yaw=0,tilt=0)=>{if(w<=0||h<=0||d<=0)return;rows[key].push({x,y,z,w,h,d,yaw,tilt});};
 const at=(a,b,t)=>a.clone().lerp(b,t);
 const register=(p,top)=>{const k=Math.round(p.x*1000)+':'+Math.round(p.z*1000);const prev=posts.get(k);if(prev)prev.top=Math.max(prev.top,top);else posts.set(k,{p,top});};
 let total=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.15)continue;
  const count=Math.ceil(length/f.sectionWidth),yaw=Math.atan2(-(b.z-a.z),b.x-a.x);
  for(let j=0;j<count&&panels.length<800;j++){
   const u=at(a,b,j/count),v=at(a,b,(j+1)/count),mid=at(u,v,.5),span=length/count;
   const y=Math.max(...[0,.25,.5,.75,1].map(t=>{const p=at(u,v,t);return terrainAt(p.x,p.z);}));
   panels.push({u,v,mid,span,y,yaw});register(u,y+f.height);register(v,y+f.height);total+=span;
  }
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
