/* FORMA LANDSCAPE | geometric primitives shared with the WebGL editor.
   Coordinates are metres. X/Z are centred in the scene; the project stores X/Y
   from the south-west corner. No generated image is an authoritative dimension. */
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
export function heightAt(values,grid,width,depth,x,z){
 const gx=limit((x/width+.5)*grid,0,grid),gz=limit((z/depth+.5)*grid,0,grid);
 const x0=Math.floor(gx),z0=Math.floor(gz),x1=Math.min(grid,x0+1),z1=Math.min(grid,z0+1);
 const sx=gx-x0,sz=gz-z0,at=(i,j)=>Number(values?.[j*(grid+1)+i])||0;
 return (1-sz)*((1-sx)*at(x0,z0)+sx*at(x1,z0))+sz*((1-sx)*at(x0,z1)+sx*at(x1,z1));
}
export function inParcel(point,site){
 if(!point||!site)return false;
 const x=Number(point.x),y=Number(point.y),outline=site.boundary;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>site.width||y>site.height)return false;
 if(!Array.isArray(outline)||outline.length<3)return true;
 let inside=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[j],b=outline[i],dx=b.x-a.x,dy=b.y-a.y;
  const cross=(x-a.x)*dy-(y-a.y)*dx;
  if(Math.abs(cross)<1e-7&&x>=Math.min(a.x,b.x)-1e-7&&x<=Math.max(a.x,b.x)+1e-7&&y>=Math.min(a.y,b.y)-1e-7&&y<=Math.max(a.y,b.y)+1e-7)return true;
  if((a.y>y)!==(b.y>y)&&x<(dx*(y-a.y)/(dy||1e-9)+a.x))inside=!inside;
 }
 return inside;
}
export function clipToCell(poly,left,bottom,right,top){
 let out=poly;
 const edges=[
  {inside:p=>p.x>=left-1e-9,hit:(a,b)=>({x:left,z:a.z+(b.z-a.z)*(left-a.x)/(b.x-a.x)})},
  {inside:p=>p.x<=right+1e-9,hit:(a,b)=>({x:right,z:a.z+(b.z-a.z)*(right-a.x)/(b.x-a.x)})},
  {inside:p=>p.z>=bottom-1e-9,hit:(a,b)=>({z:bottom,x:a.x+(b.x-a.x)*(bottom-a.z)/(b.z-a.z)})},
  {inside:p=>p.z<=top+1e-9,hit:(a,b)=>({z:top,x:a.x+(b.x-a.x)*(top-a.z)/(b.z-a.z)})}
 ];
 for(const edge of edges){
  const old=out;out=[];
  for(let i=0;i<old.length;i++){
   const a=old[(i+old.length-1)%old.length],b=old[i],prev=edge.inside(a),next=edge.inside(b);
   if(next!==prev)out.push(edge.hit(a,b));
   if(next)out.push(b);
  }
  if(!out.length)break;
 }
 return out.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));
}
export function terrainTriangles(site,values,grid=48){
 const {width, height}=site,outline=Array.isArray(site.boundary)&&site.boundary.length>=3
 ?site.boundary.map(p=>({x:p.x-width/2,z:p.y-height/2}))
 :[{x:-width/2,z:-height/2},{x:width/2,z:-height/2},{x:width/2,z:height/2},{x:-width/2,z:height/2}];
 const result=[],dx=width/grid,dz=height/grid;
 const append=p=>result.push(p.x,heightAt(values,grid,width,height,p.x,p.z),p.z);
 for(let iz=0;iz<grid;iz++)for(let ix=0;ix<grid;ix++){
  const left=-width/2+ix*dx,bottom=-height/2+iz*dz;
  const cell=clipToCell(outline,left,bottom,left+dx,bottom+dz);
  if(cell.length<3)continue;
  for(let j=1;j<cell.length-1;j++){
   const a=cell[0],b=cell[j],c=cell[j+1];
   // In X/Y-up/Z space an XZ-CCW triangle faces DOWN. Terrain must
   // have +Y normals for directional light, grounded shadows and PBR grass.
   const signed=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
   if(Math.abs(signed)<1e-10)continue;
   append(a);append(signed>0?c:b);append(signed>0?b:c);
  }
 }
 return new Float32Array(result);
}
/** 3D presentation-only ground. The site measurements and parcel boundary stay
 * authoritative for placement, property lines, brush strokes and the 2D plan.
 * We deliberately never clip this background surface to an uploaded irregular
 * property polygon, which otherwise exposes a torn/triangular-looking edge.
 */
export function squareTerrainSide(site){
 const width=Math.max(1,Number(site?.width)||30);
 const depth=Math.max(1,Number(site?.height)||40);
 const base=Math.max(width,depth);
 const margin=Math.max(1.5,Math.min(15,base*.075));
 return base+2*margin;
}
export function squareTerrainTriangles(site,values,grid=48){
 const width=Math.max(1,Number(site?.width)||30);
 const depth=Math.max(1,Number(site?.height)||40);
 const sourceGrid=Math.max(2,Math.floor(Number(grid)||48));
 // Tessellate the visible surface independently of the editable height grid.
 const steps=Math.max(2,Math.min(256,Math.ceil(sourceGrid*8/3)));
 const side=squareTerrainSide(site),half=side*.5,size=side/steps;
 const triangles=new Float32Array(steps*steps*18);
 let n=0;
 const point=(x,z)=>{
  triangles[n++]=x;
  triangles[n++]=heightAt(values,sourceGrid,width,depth,x,z);
  triangles[n++]=z;
 };
 for(let iz=0;iz<steps;iz++)for(let ix=0;ix<steps;ix++){
  const x0=-half+ix*size,x1=x0+size;
  const z0=-half+iz*size,z1=z0+size;
  // Clockwise when seen from +Y in X/Y/Z coordinates; normals point up.
  point(x0,z0);point(x0,z1);point(x1,z0);
  point(x1,z0);point(x0,z1);point(x1,z1);
 }
 return triangles;
}
export function roofTriangles(width,depth,kind='gable',eave=3.62,rise=1.4){
 const w=width/2+.24,d=depth/2+.24,top=eave+Math.max(.2,rise),positions=[];
 const tri=(a,b,c)=>positions.push(...a,...b,...c);
 const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d)};
 const A=[-w,eave,-d],B=[w,eave,-d],C=[w,eave,d],D=[-w,eave,d];
 if(kind==='hip'){
  const short=Math.max(.1,d-Math.min(w,d)*.7),N=[0,top,-short],S=[0,top,short];
  quad(A,N,S,D);quad(B,C,S,N);tri(A,B,N);tri(D,S,C);
 }else{
  const N=[0,top,-d],S=[0,top,d];
  quad(A,N,S,D);quad(B,C,S,N);tri(A,B,N);tri(D,S,C);
 }
 return new Float32Array(positions);
}
