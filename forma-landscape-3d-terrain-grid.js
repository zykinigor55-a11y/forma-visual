/* FORMA 3D / measured high-density relief.
 * Saved terrain from old 48x48 and 96x96 projects is interpolated, never discarded.
 * Vertex normals use sampled slope rather than per-triangle flat normals.
 */
export const TERRAIN_GRID=192;
export function inferTerrainGrid(values){
 if(!Array.isArray(values))return null;
 const side=Math.sqrt(values.length);
 return Number.isInteger(side)&&side>=3&&side<=257?side-1:null;
}
export function resampleTerrainGrid(values,target=TERRAIN_GRID){
 const oldGrid=inferTerrainGrid(values);
 const n=Math.max(2,Math.min(192,Math.round(target)));
 if(oldGrid===n)return values.slice();
 if(!oldGrid)return Array((n+1)*(n+1)).fill(0);
 const get=(x,z)=>Number(values[Math.min(oldGrid,Math.max(0,z))*(oldGrid+1)+Math.min(oldGrid,Math.max(0,x))])||0;
 const result=Array((n+1)*(n+1));
 for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
  const gx=x/n*oldGrid,gz=z/n*oldGrid,ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz;
  const a=get(ix,iz)*(1-fx)+get(ix+1,iz)*fx,b=get(ix,iz+1)*(1-fx)+get(ix+1,iz+1)*fx;
  result[z*(n+1)+x]=a*(1-fz)+b*fz;
 }
 return result;
}
export function sampledTerrainNormals(vertices,width,depth,sample){
 const result=new Float32Array(vertices.length);
 const e=Math.min(width,depth)/192;
 for(let i=0;i<vertices.length;i+=3){
  const x=vertices[i],z=vertices[i+2];
  const sx=(sample(x+e,z)-sample(x-e,z))/(2*e),sz=(sample(x,z+e)-sample(x,z-e))/(2*e);
  const inv=1/Math.hypot(sx,1,sz);
  result[i]=-sx*inv;result[i+1]=inv;result[i+2]=-sz*inv;
 }
 return result;
}
