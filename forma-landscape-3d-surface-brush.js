/* Smooth, metre-accurate surface painting and reversible local erasing.
 * Works only on lawn/fill strips, never removes buildings, paving or plants.
 * All geometric functions are pure; the UI owns Undo/Redo and persistence. */
import {strokeDistance} from './forma-landscape-3d-strokes.js';

export function smoothPaintPath(points){
 const clean=[];
 for(const p of (Array.isArray(points)?points:[])){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  if(!clean.length||strokeDistance(clean.at(-1),p)>.00001)clean.push({x:p.x,y:p.y});
 }
 if(clean.length<3||clean.length>260)return clean;
 const out=[clean[0]];
 // One conservative corner-rounding pass. Endpoints/widths remain exact.
 for(let i=1;i<clean.length-1;i++){
  const prev=clean[i-1],cur=clean[i],next=clean[i+1];
  out.push({x:prev.x*.125+cur.x*.875,y:prev.y*.125+cur.y*.875});
  out.push({x:cur.x*.875+next.x*.125,y:cur.y*.875+next.y*.125});
 }
 out.push(clean.at(-1));
 return out;
}
function distancePointSegment(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 if(den<1e-12)return strokeDistance(p,a);
 const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den));
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function surfaceStrokeTouchesCircle(obj,point,radius){
 const path=obj?.points;if(!Array.isArray(path)||!path.length)return false;
 const reach=Math.max(.1,radius)+Math.max(.2,Number(obj.width)||1.2)/2;
 for(let i=0;i<path.length;i++){
  if(distancePointSegment(point,path[i],path[Math.min(i+1,path.length-1)])<=reach)return true;
 }
 return false;
}
export function erasePaintedStrips(objects,{point,radius,group,makeId,capacity=500}={}){
 if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||!(radius>0)||
    !['lawns','fills'].includes(group))return {objects,changed:false,removed:0};
 const out=[];let changed=false,removed=0;
 for(const obj of objects){
  if(obj?.type!==group||obj.geometry!=='strip'||!surfaceStrokeTouchesCircle(obj,point,radius)){
   out.push(obj);continue;
  }
  const r=radius+Math.max(.2,Number(obj.width)||1.2)/2;
  const step=Math.max(.08,Math.min(.25,r*.22));
  const path=obj.points;const runs=[];let active=[];
  const accept=p=>{
   const outside=Math.hypot(p.x-point.x,p.y-point.y)>r;
   if(outside){const prev=active.at(-1);if(!prev||strokeDistance(prev,p)>.005)active.push(p)}
   else if(active.length){runs.push(active);active=[]}
  };
  accept(path[0]);
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],length=strokeDistance(a,b);
   const n=Math.max(1,Math.min(10000,Math.ceil(length/step)));
   for(let j=1;j<=n;j++){
    const t=j/n;accept({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
   }
  }
  if(active.length)runs.push(active);
  const fragments=runs.filter(pts=>pts.length>=2&&strokeDistance(pts[0],pts.at(-1))>.035);
  // Do not silently lose stroke data when the 500-object cap is reached.
  if(out.length+fragments.length>capacity){out.push(obj);continue}
  fragments.forEach((pts,i)=>out.push({...obj,id:i===0?obj.id:makeId(),points:pts}));
  changed=true;removed++;
 }
 return {objects:changed?out:objects,changed,removed};
}
