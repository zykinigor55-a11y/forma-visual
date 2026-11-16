export function scalePlacement(item,factor){
 const f=Math.max(.1,Math.min(12,Number(factor)||1));
 const w=(item.baseW||item.w)*f,h=(item.baseH||item.h)*f,limit=Math.min(1,3/Math.max(w,h));
 return {...item,w:w*limit,h:h*limit};
}
export function linePlacements(a,b,spacing=.05){const distance=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(1,Math.min(40,Math.round(distance/Math.max(.01,spacing))));return Array.from({length:n+1},(_,i)=>({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}));}
export function strokeBounds(strokes){const points=strokes.flatMap(s=>s.points.map(p=>({x:p.x,y:p.y,r:s.size/2})));if(!points.length)return {x:0,y:0,right:0,bottom:0};return {x:Math.max(0,Math.min(...points.map(p=>p.x-p.r))),y:Math.max(0,Math.min(...points.map(p=>p.y-p.r))),right:Math.min(1,Math.max(...points.map(p=>p.x+p.r))),bottom:Math.min(1,Math.max(...points.map(p=>p.y+p.r)))};}
export function drawStrokes(ctx,strokes,w,h){ctx.lineCap='round';ctx.lineJoin='round';for(const s of strokes){ctx.globalCompositeOperation=s.erase?'destination-out':'source-over';ctx.lineWidth=s.size*Math.min(w,h);ctx.beginPath();s.points.forEach((p,i)=>i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h));if(s.points.length===1)ctx.lineTo(s.points[0].x*w+.01,s.points[0].y*h);ctx.stroke();}ctx.globalCompositeOperation='source-over';}
export function translateGroup(items,ids,dx,dy){
 const chosen=items.filter(i=>ids.has(i.id));if(!chosen.length)return items;
 const points=chosen.flatMap(i=>i.points||i.strokes?.flatMap(s=>s.points)||[{x:i.x,y:i.y}]);
 dx=Math.max(-Math.min(...points.map(p=>p.x)),Math.min(1-Math.max(...points.map(p=>p.x)),dx));
 dy=Math.max(-Math.min(...points.map(p=>p.y)),Math.min(1-Math.max(...points.map(p=>p.y)),dy));
 return items.map(i=>{if(!ids.has(i.id))return i;const out=structuredClone(i),shift=p=>{p.x+=dx;p.y+=dy;};if(out.points)out.points.forEach(shift);else if(out.strokes)out.strokes.forEach(s=>s.points.forEach(shift));else shift(out);return out;});
}
export function selectionHasCoverage(pixels){for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)return true;return false;}

export function automaticInfluence(item){return {shadow:Math.min(.4,item.h*.55),reflection:Math.min(.7,item.h*.8)};}
