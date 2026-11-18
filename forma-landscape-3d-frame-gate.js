/* Render on demand: keep the WebGL viewport responsive under large planting
 * scenes, while still redrawing each actual camera move, drag and brush stroke.
 * Pure state machine, no browser or Three.js dependency. */
export function createFrameGate(){
 let dirty=true,previousFrame=-Infinity,rendered=0,skipped=0;
 return {
  invalidate(){dirty=true},
  allow(now,{cameraMoved=false,walking=false,interval=20}={}){
   if(cameraMoved||walking)dirty=true;
   const stamp=Number(now);
   if(!dirty||!Number.isFinite(stamp)||stamp-previousFrame<Math.max(0,Number(interval)||0)){
    skipped++;return false;
   }
   dirty=false;previousFrame=stamp;rendered++;return true;
  },
  get stats(){return {rendered,skipped,dirty}},
  reset(){dirty=true;previousFrame=-Infinity}
 };
}
