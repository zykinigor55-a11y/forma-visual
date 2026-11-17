/** FORMA landscape: geometry-only brush polygon; dimensions in metres.
 * Creates an editable polygon; it does NOT paint pixels or flatten existing paths.
 */
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function brushPolygon(samples,diameter,site){
 if(!Array.isArray(samples)||!samples.length)return [];
 const w=Number(site?.width)||30,h=Number(site?.height)||40;
 const radius=clamp(Number(diameter)||1.2,.2,20)/2;
 const input=samples.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
 if(!input.length)return [];
 const selected=[input[0]];
 for(let i=1;i<input.length;i++){
  if(distance(input[i],selected.at(-1))>=radius*.18||i===input.length-1)selected.push(input[i]);
 }
 const pts=selected.length>54?selected.filter((_,i)=>i===0||i===selected.length-1||i%Math.ceil(selected.length/54)===0):selected;
 const vertex=p=>({x:Math.round(clamp(p.x,0,w)*1000)/1000,y:Math.round(clamp(p.y,0,h)*1000)/1000});
 if(pts.length<2||distance(pts[0],pts.at(-1))<.001){
  const p=pts[0],out=[];
  for(let i=0;i<20;i++){const a=i*2*Math.PI/20;out.push(vertex({x:p.x+radius*Math.cos(a),y:p.y+radius*Math.sin(a)}));}
  return out;
 }
 const normal=(i)=>{
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];
  const vx=b.x-a.x,vy=b.y-a.y,len=Math.hypot(vx,vy)||1;
  return {x:-vy/len,y:vx/len};
 };
 const left=pts.map((p,i)=>{const n=normal(i);return vertex({x:p.x+n.x*radius,y:p.y+n.y*radius})});
 const right=pts.map((p,i)=>{const n=normal(i);return vertex({x:p.x-n.x*radius,y:p.y-n.y*radius})}).reverse();
 // Polygon layer supports vertex dragging in the existing inspector.
 return left.concat(right).filter((p,i,a)=>i===0||distance(p,a[i-1])>.0001).slice(0,120);
}
