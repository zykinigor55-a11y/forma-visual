import {CATALOG,TREE_HEIGHT_M,byId,isInside,rectBoundary} from './forma-landscape-project-core.js';
import {SHRUB_HEIGHT_M} from './forma-landscape-3d-botany.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const move=(p,v,n)=>({x:p.x+v.x*n,y:p.y+v.y*n});
const segments=(points,closed=false)=>points.slice(closed?0:1).map((p,i)=>[points[closed?(i+points.length-1)%points.length:i],p]);
function distanceToSegment(p,a,b){
 const x=b.x-a.x,y=b.y-a.y,length=x*x+y*y;
 return distance(p,mix(a,b,length?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/length)):0));
}
const edgeDistance=(point,edges)=>edges.reduce((d,[a,b])=>Math.min(d,distanceToSegment(point,a,b)),Infinity);
const axis=(a,b)=>{const length=distance(a,b)||1;return {x:(b.x-a.x)/length,y:(b.y-a.y)/length}};
function rotated(b,x,y){
 const a=b.rotation*Math.PI/180;
 return {x:b.x+x*Math.cos(a)-y*Math.sin(a),y:b.y+x*Math.sin(a)+y*Math.cos(a)};
}
const footprint=b=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>rotated(b,x*b.width/2,y*b.height/2));

const styles=[
 {name:'Лесной сад',tree:['pine','birch','spruce','rowan'],shrub:['juniper','wild-shrub','ornamental-grass','fern'],pave:['granite-setts','slate-pavers'],rock:['granite-boulder','slate-boulder'],light:['bollard','mushroom']},
 {name:'Сдержанный современный',tree:['birch','maple','ph-pine-sapling'],shrub:['ornamental-grass','juniper','thuja-globe','hydrangea'],pave:['concrete-pavers','slate-pavers'],rock:['slate-boulder','granite-boulder'],light:['square-bollard','mushroom']},
 {name:'Природный сад',tree:['rowan','apple','birch','maple'],shrub:['pennisetum','spirea','hydrangea','dogwood'],pave:['clinker-herringbone','radial-setts'],rock:['sandstone-boulder','limestone-boulder'],light:['mushroom','low-post']}
];
const shorePlants=['ornamental-grass','hosta','fern','fern-02','fern-03','fern-04','dogwood','pennisetum'];
const catalogue=Object.groupBy?Object.groupBy(CATALOG,x=>x.group):CATALOG.reduce((groups,entry)=>{(groups[entry.group]??=[]).push(entry);return groups},{});
const preferred=(group,ids)=>[...catalogue[group]].sort((a,b)=>{
 const rank=id=>ids.includes(id)?ids.indexOf(id):ids.length;
 return rank(a.id)-rank(b.id);
});

export function proposeLandscape(doc) {
 const boundary=doc.site.boundary||rectBoundary(doc.site.width,doc.site.height);
 const edges=segments(boundary,true),buildings=[doc.house,...doc.buildings].map(footprint);
 const existing=doc.objects;
 const waters=existing.filter(o=>byId(o.catalogId)?.group==='ponds'&&o.points?.length>=3);
 const existingPaths=existing.filter(o=>byId(o.catalogId)?.group==='pavers'&&o.points?.length>=2);
 const points=existing.filter(o=>!o.points&&Number.isFinite(o.x)&&Number.isFinite(o.y));
 const pavedAreas=existing.filter(o=>byId(o.catalogId)?.group==='fills'&&o.geometry!=='strip'&&o.points?.length>=3);
 const polygons=[...buildings,...waters.map(o=>o.points),...pavedAreas.map(o=>o.points)]
  .map(poly=>({poly,edges:segments(poly,true)}));
 const inside=(p,r)=>isInside(p,boundary)&&edgeDistance(p,edges)>=r;
 const free=(p,r,added,route=false)=>polygons.every(({poly,edges:rim},i)=>
   !isInside(p,poly)&&edgeDistance(p,rim)>=(route&&i===0&&distance(p,door)<pathWidth?0:r))&&
  points.concat(added.filter(o=>!o.points)).every(o=>distance(p,o)>=r+(o.diameter||.2)/2+.15);
 const b=doc.house;
 const [u,v]=({south:[0,1],north:[0,-1],west:[-1,0],east:[1,0]})[b.entry]||[0,1];
 const door=rotated(b,u*(b.width/2+.03),v*(b.height/2+.03));
 const approach=axis(b,door);
 const pathWidth=Math.min(1.5,Math.max(.9,Math.min(doc.site.width,doc.site.height)*.055));
 const budget=Math.max(0,Math.min(50,500-existing.length));
 const existingPathEdges=existingPaths.flatMap(o=>segments(o.points).map(([a,b])=>({a,b,r:o.width/2})));
 const existingStrips=existing.filter(o=>byId(o.catalogId)?.group==='fills'&&o.geometry==='strip')
  .flatMap(o=>segments(o.points).map(([a,b])=>({a,b,r:o.width/2})));
 const clearRoute=route=>segments(route).every(([a,b])=>{
  const n=Math.max(1,Math.ceil(distance(a,b)/.26));
  for(let i=0;i<=n;i++){
   const p=mix(a,b,i/n);
   if(!inside(p,pathWidth/2)||!free(p,pathWidth/2,[],true)||existingStrips.some(e=>distanceToSegment(p,e.a,e.b)<e.r+pathWidth/2))return false;
  }
  return true;
 });
 let route=null;
 if(!existingPaths.length){
  const start=move(door,approach,pathWidth*.65);
  const gates=edges.flatMap(([a,b])=>[.2,.4,.5,.6,.8].map(t=>{
   const p=mix(a,b,t),n=axis(a,b),offset=pathWidth/2+.09;
   return [-1,1].map(side=>move(p,{x:-n.y,y:n.x},offset*side)).find(q=>inside(q,pathWidth/2));
  })).filter(Boolean);
  let best=Infinity;
  for(const gate of gates){
   for(const bend of [null,{x:start.x,y:gate.y},{x:gate.x,y:start.y}]){
    const candidate=[door,start,...(bend?[bend]:[]),gate].filter((p,i,a)=>!i||distance(p,a[i-1])>.03);
    const length=segments(candidate).reduce((sum,[a,b])=>sum+distance(a,b),0)+(bend?1.5:0);
    if(length<best&&clearRoute(candidate)){best=length;route=candidate}
   }
  }
 }
 const scale=Math.sqrt(doc.site.width*doc.site.height);
 const results=styles.map(style=>{
  const added=[],pathEdges=[...existingPathEdges];
  if(route&&budget){
   const type=preferred('pavers',style.pave)[0];
   added.push({catalogId:type.id,type:'pavers',points:route,width:pathWidth});
   pathEdges.push(...segments(route).map(([a,b])=>({a,b,r:pathWidth/2})));
  }
  const add=(p,group,ids,index,maxSize=Infinity)=>{
   if(added.length>=budget)return false;
   const choices=preferred(group,ids).filter(x=>!x.id.startsWith('ph-quiver')&&(ids!==shorePlants||shorePlants.includes(x.id)));
   const matching=choices.filter(x=>x.diameter<=maxSize);
   const shortlist=matching.slice(0,Math.min(2,ids.length));
   const candidates=[...shortlist.slice(index%2),...shortlist.slice(0,index%2),...matching.slice(shortlist.length)];
   // Large-crown models stay out of narrow borders; alternate only suitable assets.
   const entry=candidates.find(x=>{
    const r=(x.diameter||.25)/2;
    return inside(p,r+.15)&&free(p,r,added)&&pathEdges.every(e=>distanceToSegment(p,e.a,e.b)>=e.r+r+.16)&&
     existingStrips.every(e=>distanceToSegment(p,e.a,e.b)>=e.r+r+.16);
   });
   if(!entry)return false;
   added.push({catalogId:entry.id,type:group,x:p.x,y:p.y,diameter:entry.diameter,
    height:entry.height||TREE_HEIGHT_M[entry.id]||SHRUB_HEIGHT_M[entry.id]||.9,rotation:(index*47)%360,
    ...(group==='lights'?{brightness:.85,kelvin:2700}:{})});
   return true;
  };
  let shore=0,lighting=0,trees=0;
  for(const pond of waters){
   const rim=segments(pond.points,true);
   const candidates=rim.filter(([a,b])=>distance(a,b)>1.1).flatMap(([a,b])=>[.28,.72].map(t=>[mix(a,b,t),axis(a,b)]));
   for(const [index,[p,tangent]] of candidates.entries()){
    if(index>=32)break;
    for(const sign of [-1,1]){
     const normal={x:-tangent.y*sign,y:tangent.x*sign};
     const q=move(p,normal,1.18);
     if(add(q,'shrubs',shorePlants,index,1.8)){
      shore++;
      if(index%4===0)add(move(p,normal,2.15),'boulders',style.rock,index,1.8);
      if(index%6===0&&add(move(p,normal,2.8),'lights',style.light,index,.45))lighting++;
      break;
     }
    }
   }
  }
  for(const [index,e] of pathEdges.entries()){
   const length=distance(e.a,e.b),v=axis(e.a,e.b);
   for(let at=1.8,k=0;at<length-.6&&k<16;at+=2.25,k++){
    const point=move(e.a,v,at),normal={x:-v.y,y:v.x};
    const side=(k+index)%2?1:-1;
    if(k%2===0){
     if(add(move(point,normal,(e.r+.77)*side),'lights',style.light,k,.45)||
        add(move(point,normal,-(e.r+.77)*side),'lights',style.light,k,.45))lighting++;
    }else add(move(point,normal,(e.r+1.45)*side),'shrubs',style.shrub,k,2.2);
   }
  }
  const rows=[[.16,.20],[.84,.22],[.18,.78],[.84,.76],[.20,.49],[.82,.51],[.38,.84],[.63,.20],[.48,.80],[.55,.55]];
  for(const [index,[x,y]] of rows.entries()){
   const point={x:x*doc.site.width,y:y*doc.site.height};
   if(trees<Math.max(1,Math.min(7,Math.floor(scale/6)))&&add(point,'trees',style.tree,index,Math.max(2,scale*.3)))trees++;
   const cluster=move(point,{x:index%2?1:-1,y:.36},Math.max(1.5,Math.min(3.6,scale*.085)));
   add(cluster,'shrubs',style.shrub,index,2.2);
   if(index%3===0)add(move(cluster,{x:.25,y:1},2),'boulders',style.rock,index,1.8);
  }
  return {name:style.name,objects:added,score:shore*3+lighting*2+trees*2+added.length};
 });
 return results.sort((a,b)=>b.score-a.score)[0];
}
