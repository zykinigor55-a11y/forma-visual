/* FORMA 3D walk mode: ground-constrained first-person movement.
 * WASD are continuous keyboard state, not discrete camera jumps.
 */
export const WALK_EYE_HEIGHT=1.7;
export const WALK_SPEED_MPS=2.8;
const MOVE_KEYS=Object.freeze(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
export const walkMovementKey=key=>MOVE_KEYS.includes(String(key||'').toLowerCase());
export function walkStep({x,z,yaw=0,keys=[],dt=0,sprint=false,ground=()=>0,contains=()=>true,eyeHeight=WALK_EYE_HEIGHT}){
 const pressed=new Set([...keys].map(k=>String(k).toLowerCase()));
 const forward=Number(pressed.has('w')||pressed.has('arrowup'))-Number(pressed.has('s')||pressed.has('arrowdown'));
 const side=Number(pressed.has('d')||pressed.has('arrowright'))-Number(pressed.has('a')||pressed.has('arrowleft'));
 const norm=Math.hypot(forward,side);
 const step=Math.min(.1,Math.max(0,Number(dt)||0))*(sprint?WALK_SPEED_MPS*1.7:WALK_SPEED_MPS);
 const distance=norm?step/norm:0;
 const angle=Number.isFinite(yaw)?yaw:0;
 const nextX=x+(-Math.sin(angle)*forward+Math.cos(angle)*side)*distance;
 const nextZ=z+(-Math.cos(angle)*forward-Math.sin(angle)*side)*distance;
 const moved=distance>0&&contains(nextX,nextZ);
 const sx=moved?nextX:x,sz=moved?nextZ:z;
 const terrain=Number(ground(sx,sz))||0;
 return {x:sx,z:sz,y:terrain+eyeHeight,moved};
}
