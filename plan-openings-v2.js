/* FORMA / parametrical opening assemblies.
 * Sash count must be explicitly confirmed: a 2D plan rarely identifies it reliably.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=v=>v===undefined||v===null||v===''?NaN:Number(v);
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
export function openingSpec(wall,opening,scale,wallHeight=2.8){
 if(!wall||!opening||!Number.isFinite(scale)||scale<=0)return null;
 const wallLen=length(wall.a,wall.b)*scale;
 if(wallLen<.45)return null;
 const kind=opening.kind==='window'?'window':'door';
 const explicitWidth=num(opening.widthM),fraction=num(opening.width);
 const widthM=Number.isFinite(explicitWidth)&&explicitWidth>.01?explicitWidth:Number.isFinite(fraction)&&fraction>.001?fraction*wallLen:(kind==='window'?1.4:.9);
 const offset=num(opening.offset);
 if(!Number.isFinite(offset)||offset<0||offset>1||widthM<.3||widthM>=wallLen-.1||widthM>6)return null;
 const centerM=offset*wallLen,startM=centerM-widthM/2,endM=centerM+widthM/2;
 if(startM<.045||endM>wallLen-.045)return null;
 const sillM=kind==='window'?clamp(Number.isFinite(num(opening.sillM))?num(opening.sillM):Number.isFinite(num(opening.sill))?num(opening.sill):.9,.2,wallHeight-.4):0;
 const defaultH=kind==='window'?1.35:2.1;
 const heightM=Number.isFinite(num(opening.heightM))?num(opening.heightM):Number.isFinite(num(opening.height))?num(opening.height):defaultH;
 if(!Number.isFinite(heightM)||heightM<.35||sillM+heightM>wallHeight-.055)return null;
 const rawSashes=num(opening.sashes);
 const sashes=kind==='window'&&(rawSashes===2||rawSashes===3)?rawSashes:null;
 return {id:opening.id,wallId:wall.id,kind,centerM,startM,endM,widthM,offset,
  sillM,heightM,topM:sillM+heightM,sashes,previewSashes:sashes||2,
  sashVerified:opening.sashVerified===true&&sashes!==null,verified:opening.verified===true};
}
export function openingsForWall(wall,openings,scale,wallHeight){
 const raw=(openings||[]).filter(o=>o.wallId===wall.id).map(o=>openingSpec(wall,o,scale,wallHeight)).filter(Boolean).sort((a,b)=>a.startM-b.startM);
 const accepted=[];let end=-Infinity;
 for(const spec of raw){if(spec.startM<end+.045)continue;accepted.push(spec);end=spec.endM}
 return accepted;
}
export function openingProblems({walls=[],openings=[],scale=.02,wallHeight=2.8}){
 const warnings=[];
 for(const o of openings){
  const wall=walls.find(w=>w.id===o.wallId),spec=wall?openingSpec(wall,o,scale,wallHeight):null;
  if(!spec){warnings.push('Некорректная геометрия проёма '+String(o.id||''));continue}
  if(o.verified!==true)warnings.push('Нужно подтвердить размеры проёма '+spec.id);
  if(spec.kind==='window'&&!spec.sashVerified)warnings.push('Укажите 2 или 3 створки для окна '+spec.id);
 }
 for(const wall of walls){
  const raw=openings.filter(o=>o.wallId===wall.id).map(o=>openingSpec(wall,o,scale,wallHeight)).filter(Boolean).sort((a,b)=>a.startM-b.startM);
  for(let i=1;i<raw.length;i++)if(raw[i].startM-raw[i-1].endM<.045)warnings.push('Пересекаются проёмы на стене '+wall.id)
 }
 return warnings;
}
export function buildOpeningAssemblies({walls=[],openings=[],width=1,height=1,scale=.02,wallThickness=.2,wallHeight=2.8}){
 const items=[];
 for(const wall of walls){
  const wallLen=length(wall.a,wall.b)*scale;if(wallLen<=0)continue;
  const dx=(wall.b.x-wall.a.x)*scale,dz=-(wall.b.y-wall.a.y)*scale;
  const ux=dx/wallLen,uz=dz/wallLen,rotation=-Math.atan2(dz,dx);
  const startX=(wall.a.x-width/2)*scale,startZ=(height/2-wall.a.y)*scale;
  const make=(o,role,lx,y,w,h,depth,normal=0)=>{
   if(w<.004||h<.004)return;
   items.push({id:o.id+'-'+role+'-'+items.length,openingId:o.id,wallId:wall.id,kind:o.kind,role,
    x:startX+ux*(o.centerM+lx)-uz*normal,z:startZ+uz*(o.centerM+lx)+ux*normal,
    y,width:w,height:h,depth,rotation,
    sashCount:o.previewSashes,verified:o.verified,sashVerified:o.sashVerified});
  };
  for(const o of openingsForWall(wall,openings,scale,wallHeight)){
   const t=Math.min(.08,Math.max(.045,wallThickness*.32));
   const d=Math.min(wallThickness+.012,.13),hw=o.widthM/2,hh=o.heightM/2,cy=o.sillM+hh;
   make(o,'frame-jamb',-hw+t/2,cy,t,o.heightM,d);
   make(o,'frame-jamb',hw-t/2,cy,t,o.heightM,d);
   make(o,'frame-top',0,o.topM-t/2,o.widthM-2*t,t,d);
   if(o.kind==='window'){
    make(o,'frame-sill',0,o.sillM+t/2,o.widthM-2*t,t,d);
    const innerWidth=o.widthM-2*t,innerH=o.heightM-2*t;
    const n=o.previewSashes;
    const cell=innerWidth/n;
    for(let i=0;i<n;i++){
     const local=-innerWidth/2+(i+.5)*cell;
     make(o,'glass',local,cy,Math.max(.04,cell-t*.6),innerH-t*.55,.014);
     make(o,'sash-top',local,o.topM-t*1.25,Math.max(.04,cell-t*.45),t*.54,d*.79);
     make(o,'sash-bottom',local,o.sillM+t*1.25,Math.max(.04,cell-t*.45),t*.54,d*.79);
    }
    for(let i=1;i<n;i++)make(o,'mullion',-innerWidth/2+i*cell,cy,t*.94,innerH,d*1.1);
   }else{
    const innerW=Math.max(.08,o.widthM-2*t);
    const innerH=Math.max(.1,o.heightM-t);
    make(o,'door-leaf',0,innerH/2,innerW,innerH,Math.min(.052,d*.55),d*.32);
    make(o,'handle',innerW*.36,Math.min(1.03,innerH*.58),.045,.13,.05,d*.62);
   }
  }
 }
 return items;
}
