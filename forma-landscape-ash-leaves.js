/* FORMA native Fraxinus excelsior leaf spray.
 * A real compound leaf: 5 opposite leaflet pairs plus one terminal leaflet
 * (11 in total) on a continuous, tapered midrib. Each small serrated leaflet
 * is folded into 3D, not a flat sprite or a larger round leaf.
 * Deterministic geometry, no per-frame allocations and no imported textures.
 */
export const ASH_LEAFLET_PAIRS=5;
export const ASH_LEAFLET_COUNT=ASH_LEAFLET_PAIRS*2+1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function ashCompoundLeafData({pairs=ASH_LEAFLET_PAIRS}={}){
 const n=Math.round(clamp(Number(pairs)||ASH_LEAFLET_PAIRS,3,6));
 const vertices=[];
 const push=(a,b,c)=>vertices.push(...a,...b,...c);
 function leaflet(base,tip,width,twist=0){
  const axis=[tip[0]-base[0],tip[1]-base[1],tip[2]-base[2]];
  const length=Math.hypot(...axis)||1;
  const along=axis.map(x=>x/length);
  // The narrower lateral cross-axis is folded in Z like a real lamina.
  const transverse=[-along[1],along[0],.14+twist*.10];
  let lastLeft=null,lastRight=null;
  for(let step=0;step<=5;step++){
   const t=step/5;
   const blade=width*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.68)*(1-.12*t);
   const fold=.015*Math.sin(Math.PI*t);
   const p=[base[0]+axis[0]*t,base[1]+axis[1]*t,base[2]+axis[2]*t];
   const left=[p[0]+transverse[0]*blade,p[1]+transverse[1]*blade,p[2]+fold];
   const right=[p[0]-transverse[0]*blade,p[1]-transverse[1]*blade,p[2]-fold*.5];
   if(lastLeft){
    push(lastLeft,left,right);
    push(lastLeft,right,lastRight);
   }
   lastLeft=left;lastRight=right;
  }
 }
 // A slender petiole/rachis; the leaflets are attached to the same stem.
 for(let i=0;i<11;i++){
  const t=i/11,next=(i+1)/11;
  const root=[.023*Math.sin(t*1.7),t*.78,.012*Math.sin(t*3)];
  const end=[.023*Math.sin(next*1.7),next*.78,.012*Math.sin(next*3)];
  const thin=.0055*(1-.72*t);
  push([root[0]-thin,root[1],root[2]],[root[0]+thin,root[1],root[2]],[end[0],end[1],end[2]]);
 }
 for(let i=0;i<n;i++){
  const t=(i+.65)/(n+1.15);
  const y=t*.77,spread=(.27-.095*t)*(1+.06*Math.sin(i*2.2));
  const length=.15+.055*Math.sin(Math.PI*t);
  for(const side of [-1,1]){
   const base=[.023*Math.sin(t*1.7),y,.012*Math.sin(t*3)];
   const tip=[base[0]+side*spread, y+length*.47,base[2]+side*.035];
   leaflet(base,tip,.060*(1-.23*t),side);
  }
 }
 // Solitary terminal leaflet (not an extra opposite pair).
 leaflet([.023,.77,0],[.028,.99,.005],.049,0);
 return Object.freeze({positions:new Float32Array(vertices),leafletCount:n*2+1,
  pairs:n,triangles:vertices.length/9});
}
export function ashCompoundLeafGeometry(T){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(ashCompoundLeafData().positions,3));
 geometry.computeVertexNormals();
 return geometry;
}
