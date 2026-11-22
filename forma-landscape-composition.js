export const COMPOSITION_ROLES = [
 ['cover','Обложка'],['entry','Вход'],['site','Дом на участке'],['garden','Со стороны сада'],['detail','Деталь']
];

export function compositionCandidates(T,{house,bounds,aspect,ground,sun,time,weather,blockers,paths,features}) {
 const size=bounds.getSize(new T.Vector3()), center=bounds.getCenter(new T.Vector3());
 const span=Math.max(size.x,size.z), yaw=-(Number(house.rotation)||0)*Math.PI/180;
 const front=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 const lens=new T.PerspectiveCamera(44,aspect,.1,700);
 const ray=new T.Ray(), hit=new T.Vector3();
 // Points on the two visible sides measure the silhouette and screen margins.
 const corners=[];
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])
  for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
 const specs={cover:[1.65,1.35,.46],entry:[1.65,1.1,.31],site:[6,1.95,.40],garden:[1.7,1.35,.46],detail:[1.65,.68,.30]};
 const angularOffsets={cover:[-52,-35,35,52],entry:[-22,-10,10,22],
  site:[-138,-58,58,138],garden:[-153,-127,127,153],detail:[-35,-16,16,35]};
 const byRole={};
 const isTwilight=['blue-hour','night'].includes(time);
 const direct=!isTwilight&&!['overcast','fog','rain','snow'].includes(weather);
 const light=new T.Vector3(sun?.x||0,0,sun?.z||0).normalize();
 for(const [role] of COMPOSITION_ROLES){
  const [eye,spacing,aim]=specs[role];
  byRole[role]=angularOffsets[role].map((degrees,index)=>{
   const angle=yaw+degrees*Math.PI/180,dir=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
   const fov=role==='detail'?37:44;
   const distance=Math.max(span,2)*spacing*Math.max(1,.93/aspect);
   const position=center.clone().addScaledVector(dir,distance);
   position.y=ground(position.x,position.z)+eye+(role==='site'?span*.2:0);
   const target=center.clone();target.y=bounds.min.y+size.y*aim;
   if(role==='entry'||role==='detail')target.addScaledVector(front,Number(house.height||size.z)*.33);
   if(role==='detail'&&features.length){
    const visibleFeature=features.map(point=>({point,depth:point.clone().sub(center).dot(dir)}))
     .sort((a,b)=>b.depth-a.depth)[0];
    if(visibleFeature.depth>0)target.copy(visibleFeature.point);
   }
   position.y=Math.max(position.y,target.y+distance*.01);
   lens.fov=fov;lens.position.copy(position);lens.lookAt(target);
   lens.updateProjectionMatrix();lens.updateMatrixWorld(true);
   const frame=corners.map(p=>p.clone().project(lens));
   const edge=Math.max(...frame.map(p=>Math.max(Math.abs(p.x),Math.abs(p.y))));
   const inside=role==='detail'?1:Math.max(0,1-Math.max(0,edge-.88)*1.8);
   const blocked=point=>{
    const depth=position.distanceTo(point);
    for(const fraction of [.25,.50,.75]){
     hit.copy(position).lerp(point,fraction);
     if(hit.y<ground(hit.x,hit.z)+.12)return true;
    }
    ray.set(position,point.clone().sub(position).normalize());
    return blockers.some(box=>{
     const occluder=ray.intersectBox(box,hit);
     return occluder&&position.distanceTo(hit)<depth-.35;
    });
   };
   const insideObstacle=blockers.some(box=>box.containsPoint(position));
   const samples=[target,...corners.filter(point=>point.y>center.y&&point.clone().sub(center).dot(dir)>0)];
   const obstruction=samples.filter(blocked).length/samples.length;
   const roomDepth=paths.reduce((best,point)=>{
    const local=point.clone().project(lens);
    const distanceToCamera=position.distanceTo(point);
    return local.y<-.18&&local.y>-.98&&Math.abs(local.x)<.92&&distanceToCamera<distance
     ?Math.max(best,1-Math.abs(local.x)*.5):best;
   },0);
   const frontness=dir.dot(front);
   const lighting=direct?1-Math.abs(dir.dot(light)-.45):isTwilight?(frontness+1)/2:1-Math.abs(Math.abs(frontness)-.70);
   const sideFrame=blockers.some(box=>{
    const point=box.getCenter(new T.Vector3());
    if(point.distanceTo(position)>=distance*.9)return false;
    const projected=point.project(lens);
    return Math.abs(projected.x)>.68&&Math.abs(projected.x)<1.12&&Math.abs(projected.y)<1;
   });
   const score=inside*3-obstruction*4+lighting*.75+roomDepth*.55+(sideFrame?.3:0)-(insideObstacle?10:0);
   return {id:role+'-'+index,role,position:position.toArray(),target:target.toArray(),fov,score};
  }).sort((a,b)=>b.score-a.score);
 }
 return byRole;
}
