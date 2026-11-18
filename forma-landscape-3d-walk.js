/* FORMA 3D walk mode: ground-constrained first-person movement.
 * WASD are continuous keyboard state, not discrete camera jumps.
 */
export const WALK_EYE_HEIGHT=1.7;
export const WALK_SPEED_MPS=2.8;
const MOVE_KEYS=Object.freeze(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
export const walkMovementKey=key=>MOVE_KEYS.includes(String(key||'').toLowerCase());
/** Prevent the eye-level camera clipping through measured building footprints. */
export function walkCanOccupy(x,z,obstacles=[],clearance=.3){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 for(const o of obstacles){
  if(!o||![o.x,o.z,o.width,o.depth].every(Number.isFinite))continue;
  const a=(Number(o.rotation)||0)*Math.PI/180;
  const dx=x-o.x,dz=z-o.z;
  const lx=Math.cos(a)*dx+Math.sin(a)*dz,lz=-Math.sin(a)*dx+Math.cos(a)*dz;
  if(Math.abs(lx)<o.width/2+clearance&&Math.abs(lz)<o.depth/2+clearance)return false;
 }
 return true;
}
export function walkStep({x,z,yaw=0,keys=[],dt=0,sprint=false,ground=()=>0,contains=()=>true,obstacles=[],eyeHeight=WALK_EYE_HEIGHT}){
 const pressed=new Set([...keys].map(k=>String(k).toLowerCase()));
 const forward=Number(pressed.has('w')||pressed.has('arrowup'))-Number(pressed.has('s')||pressed.has('arrowdown'));
 const side=Number(pressed.has('d')||pressed.has('arrowright'))-Number(pressed.has('a')||pressed.has('arrowleft'));
 const norm=Math.hypot(forward,side);
 const step=Math.min(.1,Math.max(0,Number(dt)||0))*(sprint?WALK_SPEED_MPS*1.7:WALK_SPEED_MPS);
 const distance=norm?step/norm:0;
 const angle=Number.isFinite(yaw)?yaw:0;
 const nextX=x+(-Math.sin(angle)*forward+Math.cos(angle)*side)*distance;
 const nextZ=z+(-Math.cos(angle)*forward-Math.sin(angle)*side)*distance;
 // If one axis is blocked by a building, slide along the wall.
 const allowed=(px,pz)=>contains(px,pz)&&walkCanOccupy(px,pz,obstacles);
 let sx=x,sz=z;
 if(distance>0){
  if(allowed(nextX,nextZ)){sx=nextX;sz=nextZ}
  else if(allowed(nextX,z))sx=nextX;
  else if(allowed(x,nextZ))sz=nextZ;
 }
 const moved=sx!==x||sz!==z;
 const terrain=Number(ground(sx,sz))||0;
 return {x:sx,z:sz,y:terrain+eyeHeight,moved};
}
