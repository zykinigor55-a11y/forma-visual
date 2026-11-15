import {openingsForWall,openingProblems} from './plan-openings-v2.js';
/* PLAN TO INTERIOR geometry kernel: raster line proposals and physical wall segments.
   Auto tracing is a proposal, not a metric measurement or certified AI detection. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function suggestWalls(imageCanvas){
 const w=imageCanvas.width,h=imageCanvas.height;
 const limit=900,k=Math.min(1,limit/Math.max(w,h));
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
 const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(imageCanvas,0,0,c.width,c.height);
 const {data}=cx.getImageData(0,0,c.width,c.height),cw=c.width,ch=c.height;
 const black=(x,y)=>{const q=(y*cw+x)*4;const brightness=data[q]*.299+data[q+1]*.587+data[q+2]*.114;return brightness<157&&data[q+3]>125};
 const raw=[];
 const minLen=Math.max(24,Math.floor(Math.min(cw,ch)*.095));
 for(const axis of ['h','v']){
  const side=axis==='h'?ch:cw,along=axis==='h'?cw:ch;
  for(let outer=0;outer<side;outer+=2){
   let start=-1,gap=0;
   function save(end){
    if(start<0)return;
    const length=end-start;
    if(length>=minLen)raw.push(axis==='h'?{a:{x:start,y:outer},b:{x:end,y:outer},axis,support:1}:{a:{x:outer,y:start},b:{x:outer,y:end},axis,support:1});
    start=-1;gap=0;
   }
   for(let inner=0;inner<along;inner++){
    const on=axis==='h'?black(inner,outer):black(outer,inner);
    if(on){if(start<0)start=inner;gap=0}
    else if(start>=0){gap++;if(gap>2)save(inner-gap+1)}
   }
   save(along);
  }
 }
 raw.sort((a,b)=>dist(b.a,b.b)-dist(a.a,a.b));
 const output=[];
 for(const l of raw){
  const center=l.axis==='h'?l.a.y:l.a.x;
  const one=l.axis==='h'?l.a.x:l.a.y,two=l.axis==='h'?l.b.x:l.b.y;
  let found=null;
  for(const cand of output){
   if(cand.axis!==l.axis)continue;
   const other=cand.axis==='h'?cand.a.y:cand.a.x;
   const a=cand.axis==='h'?cand.a.x:cand.a.y,b=cand.axis==='h'?cand.b.x:cand.b.y;
   const overlap=Math.min(b,two)-Math.max(a,one);
   if(Math.abs(center-other)<=9&&overlap>Math.min(b-a,two-one)*.71){found=cand;break}
  }
  if(found){
   const t=found.support;
   if(l.axis==='h'){found.a.y=found.b.y=(found.a.y*t+center)/(t+1);found.a.x=Math.min(found.a.x,l.a.x);found.b.x=Math.max(found.b.x,l.b.x)}
   else{found.a.x=found.b.x=(found.a.x*t+center)/(t+1);found.a.y=Math.min(found.a.y,l.a.y);found.b.y=Math.max(found.b.y,l.b.y)}
   found.support++;
  }else if(output.length<180)output.push({...l,a:{...l.a},b:{...l.b}});
 }
 return output.filter(l=>l.support>=2||dist(l.a,l.b)>minLen*2.4)
  .filter(l=>dist(l.a,l.b)>minLen)
  .sort((a,b)=>dist(b.a,b.b)-dist(a.a,a.b))
  .slice(0,115)
  .map((l,i)=>({id:'auto_'+i,a:{x:l.a.x/k,y:l.a.y/k},b:{x:l.b.x/k,y:l.b.y/k},confidence:clamp(l.support/7,.28,.84),verified:false}));
}
export function buildWalls({walls=[],openings=[],width=1,height=1,scale=.02,wallThickness=.2,wallHeight=2.8}){
 const parts=[];
 const add=(wall,startM,endM,bottomM,topM)=>{
  if(endM-startM<.005||topM-bottomM<.005)return;
  const x1=(wall.a.x-width/2)*scale,z1=(height/2-wall.a.y)*scale;
  const x2=(wall.b.x-width/2)*scale,z2=(height/2-wall.b.y)*scale;
  const dx=x2-x1,dz=z2-z1,wallLength=Math.hypot(dx,dz);
  if(wallLength<=0)return;
  const t=(startM+endM)/(2*wallLength);
  parts.push({id:wall.id,wallId:wall.id,x:x1+dx*t,z:z1+dz*t,y:(bottomM+topM)/2,
   length:endM-startM,wallHeight:topM-bottomM,thickness:wallThickness,rotation:-Math.atan2(dz,dx),
   startM,endM,bottomM,topM});
 };
 for(const wall of walls){
  const wallLength=dist(wall.a,wall.b)*scale;if(wallLength<.02)continue;
  let current=0;
  for(const opening of openingsForWall(wall,openings,scale,wallHeight)){
   if(opening.startM<current+.045)continue;
   add(wall,current,opening.startM,0,wallHeight);
   if(opening.sillM>.004)add(wall,opening.startM,opening.endM,0,opening.sillM);
   if(opening.topM<wallHeight-.004)add(wall,opening.startM,opening.endM,opening.topM,wallHeight);
   current=opening.endM;
  }
  add(wall,current,wallLength,0,wallHeight);
 }
 return parts;
}
export function boundsMeters(walls,width,height,scale){
 if(!walls.length)return null;
 const x=walls.flatMap(w=>[w.a.x,w.b.x]),y=walls.flatMap(w=>[w.a.y,w.b.y]);
 const minX=Math.min(...x),maxX=Math.max(...x),minY=Math.min(...y),maxY=Math.max(...y);
 return {minX:(minX-width/2)*scale,maxX:(maxX-width/2)*scale,
  minZ:(height/2-maxY)*scale,maxZ:(height/2-minY)*scale,
  width:(maxX-minX)*scale,depth:(maxY-minY)*scale};
}
export function nearestWall(walls,p,maxDistance){
 let best=null,minimum=maxDistance;
 for(const wall of walls){
  const vx=wall.b.x-wall.a.x,vy=wall.b.y-wall.a.y,mag=vx*vx+vy*vy;
  const t=mag?clamp(((p.x-wall.a.x)*vx+(p.y-wall.a.y)*vy)/mag,0,1):0;
  const distance=dist(p,{x:wall.a.x+vx*t,y:wall.a.y+vy*t});
  if(distance<minimum){minimum=distance;best={wall,t,distance}}
 }
 return best;
}
export function validateModel(s){
 const warnings=[];
 if(!s.image)warnings.push('Нет исходного плана.');
 if(!s.scaleVerified)warnings.push('Масштаб в метрах не подтверждён.');
 if(!s.walls.length)warnings.push('Не распознаны стены.');
 if(s.walls.some(w=>!w.verified))warnings.push('Часть стен не проверена; геометрия предварительная.');
 warnings.push(...openingProblems(s));
 return warnings;
}
