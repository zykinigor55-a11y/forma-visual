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
