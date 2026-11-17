/* Shared deterministic, metric brush sampling for the FORMA 3D editor. */
export const strokeDistance=(a,b)=>Math.hypot(Number(a.x)-Number(b.x),Number(a.y)-Number(b.y));
export function appendBrushPoint(points,p,spacing=.25){
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
 const last=points.at(-1);
 if(last&&strokeDistance(last,p)<Math.max(.025,spacing))return false;
 points.push({x:p.x,y:p.y});return true;
}
export function strokeSample(last,next,spacing=.25){
 if(!last)return [next];
 const distance=strokeDistance(last,next),step=Math.max(.05,spacing),n=Math.floor(distance/step),samples=[];
 for(let i=1;i<=n;i++){const t=Math.min(1,i*step/distance);samples.push({x:last.x+(next.x-last.x)*t,y:last.y+(next.y-last.y)*t})}
 if(n===0&&distance>step*.4)samples.push(next);
 return samples;
}
export function plantScatterPositions(a,b,spacing=1.2){
 const step=Math.max(.25,spacing),length=strokeDistance(a,b),n=Math.floor(length/step),out=[];
 for(let i=1;i<=n;i++){const t=i*step/length;out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t})}
 return out;
}

/** Swept planar paint area with rounded ends, preserving exact metric width.
 * Works with any direction in the X/Y site plane and with duplicate points.
 * A single continuous mesh avoids seams from overlapping rectangular stamps. */
export function strokeRibbon(points,width,roundSteps=18){
 const input=(Array.isArray(points)?points:[]).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
 if(!input.length)return [];
 const path=[{x:input[0].x,y:input[0].y}];
 for(let i=1;i<input.length;i++){
  if(strokeDistance(input[i],path.at(-1))>1e-5)path.push({x:input[i].x,y:input[i].y});
 }
 if(path.length===1)path.push({x:path[0].x+.001,y:path[0].y});
 const radius=Math.max(.2,Math.min(5,Number(width)||1.2)/2);
 const tangent=(i)=>{
  const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
  return {x:dx/d,y:dy/d};
 };
 const left=[],right=[];
 for(let i=0;i<path.length;i++){
  const dir=tangent(i),norm={x:-dir.y,y:dir.x},p=path[i];
  left.push({x:p.x+norm.x*radius,y:p.y+norm.y*radius});
  right.push({x:p.x-norm.x*radius,y:p.y-norm.y*radius});
 }
 const result=[...left],steps=Math.max(6,Math.min(32,Math.floor(roundSteps)));
 const end=path.at(-1),angleEnd=Math.atan2(tangent(path.length-1).y,tangent(path.length-1).x)+Math.PI/2;
 for(let i=1;i<=steps;i++){
  const a=angleEnd-Math.PI*i/steps;
  result.push({x:end.x+radius*Math.cos(a),y:end.y+radius*Math.sin(a)});
 }
 for(let i=path.length-2;i>=0;i--)result.push(right[i]);
 const start=path[0],angleStart=Math.atan2(tangent(0).y,tangent(0).x)-Math.PI/2;
 for(let i=1;i<steps;i++){
  const a=angleStart-Math.PI*i/steps;
  result.push({x:start.x+radius*Math.cos(a),y:start.y+radius*Math.sin(a)});
 }
 return result;
}
