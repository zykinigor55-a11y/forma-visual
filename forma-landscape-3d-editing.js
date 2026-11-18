/* Pure, metric editing operations shared by 3D landscape UI and tests.
 * No model bytes, framework or browser access. Preserve reference asset IDs.
 */
export const normalizedRotation=degrees=>{
 const angle=Number(degrees);
 if(!Number.isFinite(angle))return 0;
 return ((angle%360)+360)%360;
};
export function rotatedLandscapeObject(object,degrees){
 if(!object||!Number.isFinite(Number(degrees)))return null;
 return {...object,rotation:normalizedRotation((Number(object.rotation)||0)+Number(degrees))};
}
export function duplicateLandscapeObject(object,{newId,plot,contains,offset}={}){
 if(!object||typeof object!=='object'||typeof newId!=='string'||!newId)return null;
 // A deterministic, non-overlapping candidate offset for the original
 // footprint; never silently push a duplicate beyond surveyed boundaries.
 const size=Math.min(4,Math.max(.8,Number(object.width||object.diameter)||1));
 const distance=Number.isFinite(Number(offset))&&Number(offset)>0?Number(offset):size*.9;
 const paths=Array.isArray(object.points)&&object.points.length>0?object.points:[{x:object.x,y:object.y}];
 if(!paths.every(p=>Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))))return null;
 const inBounds=typeof contains==='function'?contains:
  plot?(p=>p.x>=0&&p.y>=0&&p.x<=plot.width&&p.y<=plot.height):(()=>true);
 const candidates=[[distance,distance],[-distance,distance],[distance,-distance],[-distance,-distance],
  [distance,0],[-distance,0],[0,distance],[0,-distance]];
 for(const [dx,dy] of candidates){
  const shifted=paths.map(p=>({x:Number(p.x)+dx,y:Number(p.y)+dy}));
  if(!shifted.every(inBounds))continue;
  // Structured clone is JSON-safe because objects in this editor are stored
  // as serializable project data (never as THREE meshes).
  const next=JSON.parse(JSON.stringify(object));
  next.id=newId;
  next.x=(Number(next.x)||0)+dx;next.y=(Number(next.y)||0)+dy;
  if(Array.isArray(next.points))next.points=next.points.map((p,i)=>({...p,x:shifted[i].x,y:shifted[i].y}));
  next.rotation=normalizedRotation(next.rotation||0);
  return next;
 }
 return null;
}
