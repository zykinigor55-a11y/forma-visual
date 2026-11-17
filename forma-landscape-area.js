/**
 * FORMA LANDSCAPE — visible coverage by material, in square metres.
 * No AI measurements. Uses vertical polygon sweep over every critical edge
 * intersection; each sweep slab is piecewise linear, so midpoint integration
 * is exact for the planar polygon representation. Rounded road end-caps are
 * approximated by 24-sided caps. Overlaps are painted in on-screen layer order.
 */
const EPS=1e-9;
const LAYERS={lawns:0,fills:10,ponds:20,pavers:30};
const finite=n=>Number.isFinite(Number(n));
const round=n=>Math.round(Math.max(0,n)*1e8)/1e8;
const ring=points=>(Array.isArray(points)?points:[])
 .filter(p=>p&&finite(p.x)&&finite(p.y)).map(p=>({x:Number(p.x),y:Number(p.y)}));
const rect=(cx,cy,w,h,degrees=0)=>{
 const a=Number(degrees||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]
  .map(([x,y])=>({x:cx+x*c-y*s,y:cy+x*s+y*c}));
};
function capsule(a,b,width){
 const rad=Math.max(.01,Number(width)||1)/2,angle=Math.atan2(b.y-a.y,b.x-a.x);
 const n=12,pts=[];
 for(let i=0;i<=n;i++){const t=angle+Math.PI/2+i*Math.PI/n;pts.push({x:a.x+rad*Math.cos(t),y:a.y+rad*Math.sin(t)});}
 for(let i=0;i<=n;i++){const t=angle-Math.PI/2+i*Math.PI/n;pts.push({x:b.x+rad*Math.cos(t),y:b.y+rad*Math.sin(t)});}
 return pts;
}
function regionsFromProject(project){
 const d=project||{},objects=d.objects||[],regions=[];
 objects.forEach((o,index)=>{
  const layer=LAYERS[o.type];
  if(layer===undefined)return;
  const points=ring(o.points);
  if(o.type==='pavers'||(o.type==='fills'&&o.geometry==='strip')){
   for(let j=1;j<points.length;j++){
    const a=points[j-1],b=points[j];
    if(Math.hypot(b.x-a.x,b.y-a.y)<EPS)continue;
    regions.push({id:o.id+'-seg'+j,material:o.catalogId,rank:layer*10000+index,outer:capsule(a,b,o.width),holes:[]});
   }
  }else if(points.length>=3){
   regions.push({id:o.id,material:o.catalogId,rank:layer*10000+index,outer:points,holes:(o.holes||[]).map(ring).filter(h=>h.length>=3)});
  }
 });
 const cover=(o,id,index)=>{
  if(!o||!finite(o.x)||!finite(o.y)||!finite(o.width)||!finite(o.height))return;
  regions.push({id,material:null,rank:1000000+index,outer:rect(Number(o.x),Number(o.y),Number(o.width),Number(o.height),o.rotation),holes:[]});
 };
 cover(d.house,'house',0);
 (d.buildings||[]).forEach((b,i)=>cover(b,'building-'+i,i+1));
 const site=d.site||{};
 const bound=ring(site.boundary);
 const parcel=bound.length>=3?bound:[{x:0,y:0},{x:Number(site.width)||30,y:0},{x:Number(site.width)||30,y:Number(site.height)||40},{x:0,y:Number(site.height)||40}];
 return {regions,parcel};
}
const cross=(a,b,c,d)=>(b.x-a.x)*(d.y-c.y)-(b.y-a.y)*(d.x-c.x);
function edgeCrossX(a,b,c,d){
 const minx=Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x));
 const maxx=Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x));
 if(minx>maxx+EPS)return null;
 const miny=Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y));
 const maxy=Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y));
 if(miny>maxy+EPS)return null;
 const den=cross(a,b,c,d);
 if(Math.abs(den)<EPS)return null;
 const t=cross(a,c,c,d)/den,u=cross(a,c,a,b)/den;
 if(t<=EPS||t>=1-EPS||u<=EPS||u>=1-EPS)return null;
 return a.x+t*(b.x-a.x);
}
function edgesOf(outer,holes=[]){
 const all=[];
 for(const pts of [outer,...holes])for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)>EPS)all.push([a,b]);
 }
 return all;
}
function criticalXs(regions,site){
 const edges=[...edgesOf(site)],xs=site.map(p=>p.x);
 for(const r of regions){
  edges.push(...edgesOf(r.outer,r.holes));
  for(const pts of [r.outer,...r.holes])for(const p of pts)xs.push(p.x);
 }
 const minX=Math.min(...site.map(p=>p.x)),maxX=Math.max(...site.map(p=>p.x));
 // Above this threshold, use bounded deterministic sampling to avoid quadratic
 // comparisons and keep drag/resize responsive even for huge plant layouts.
 if(edges.length>750)return {xs:sampleXs(minX,maxX,420),estimated:true,reason:'Слишком много контуров для точного объединения'};
 for(let i=0;i<edges.length;i++){
  const [a,b]=edges[i];
  for(let j=i+1;j<edges.length;j++){
   const [c,d]=edges[j],x=edgeCrossX(a,b,c,d);
   if(x!==null&&x>minX+EPS&&x<maxX-EPS)xs.push(x);
  }
 }
 const arr=[...new Set(xs.filter(x=>x>=minX-EPS&&x<=maxX+EPS).map(x=>Math.round(x*1e8)/1e8))].sort((a,b)=>a-b);
 if(arr.length>2600)return {xs:sampleXs(minX,maxX,600),estimated:true,reason:'Очень сложные пересечения; использовано численное интегрирование'};
 return {xs:arr,estimated:false,reason:''};
}
function sampleXs(min,max,steps){return Array.from({length:steps+1},(_,i)=>min+(max-min)*i/steps)}
function intervals(points,x){
 const ys=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  if((a.x<x&&b.x>x)||(b.x<x&&a.x>x)|| (a.x<=x&&b.x>x)||(b.x<=x&&a.x>x)){
   const t=(x-a.x)/(b.x-a.x);
   if(t>=0&&t<=1)ys.push(a.y+(b.y-a.y)*t);
  }
 }
 ys.sort((a,b)=>a-b);
 const out=[];
 for(let i=0;i+1<ys.length;i+=2)if(ys[i+1]-ys[i]>EPS)out.push([ys[i],ys[i+1]]);
 return out;
}
function subtractIntervals(base,cuts){
 if(!cuts.length)return base;
 const ordered=cuts.slice().sort((a,b)=>a[0]-b[0]),out=[];
 for(const [lo,hi] of base){
  let start=lo;
  for(const [a,b] of ordered){
   if(b<=start+EPS)continue;
   if(a>=hi-EPS)break;
   if(a>start+EPS)out.push([start,Math.min(hi,a)]);
   start=Math.max(start,b);
   if(start>=hi-EPS)break;
  }
  if(start<hi-EPS)out.push([start,hi]);
 }
 return out;
}
function regionIntervals(r,x){
 let inside=intervals(r.outer,x);
 if(r.holes?.length)inside=subtractIntervals(inside,r.holes.flatMap(h=>intervals(h,x)));
 return inside;
}
function areaSliceAtX(regions,parcel,x,out){
 const events=[];
 for(const [lo,hi] of intervals(parcel,x)){events.push({y:lo,site:1},{y:hi,site:-1});}
 regions.forEach((r,id)=>{
  for(const [lo,hi] of regionIntervals(r,x)){
   events.push({y:lo,id,delta:1},{y:hi,id,delta:-1});
  }
 });
 events.sort((a,b)=>a.y-b.y);
 let siteOn=0,active=new Map();
 for(let i=0;i<events.length;){
  const at=events[i].y;
  while(i<events.length&&Math.abs(events[i].y-at)<EPS){
   const e=events[i++];if(e.site)siteOn+=e.site;
   else{
    const cnt=(active.get(e.id)||0)+e.delta;
    if(cnt>0)active.set(e.id,cnt);else active.delete(e.id);
   }
  }
  if(!siteOn||i>=events.length)continue;
  const dy=events[i].y-at;
  if(dy<=EPS)continue;
  let top=null;
  for(const id of active.keys()){
   const r=regions[id];
   if(!top||r.rank>top.rank)top=r;
  }
  if(top?.material)out[top.material]=(out[top.material]||0)+dy;
 }
}
/**
 * Returns the *visible* net covered area, without overlapping double counts.
 * Ponds cover lawns/fills; paved paths cover ponds; buildings mask all.
 * Different surface materials in one layer follow placement order.
 * Site's edited polygon clips all areas.
 */
export function visibleSurfaceAreas(project){
 const {regions,parcel}=regionsFromProject(project);
 const result={};
 for(const o of project.objects||[])if(LAYERS[o.type]!==undefined)result[o.catalogId]=0;
 const sweep=criticalXs(regions,parcel);
 const xs=sweep.xs;
 for(let i=1;i<xs.length;i++){
  const dx=xs[i]-xs[i-1];
  if(dx<EPS)continue;
  const slice={};
  areaSliceAtX(regions,parcel,(xs[i]+xs[i-1])/2,slice);
  for(const [id,h] of Object.entries(slice))result[id]=(result[id]||0)+h*dx;
 }
 for(const key of Object.keys(result))result[key]=round(result[key]);
 return {areas:result,precision:sweep.estimated?'estimated':'polygon',reason:sweep.reason};
}
