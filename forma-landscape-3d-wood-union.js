/* Sparse implicit union for the main woody skeleton. Local signed distance
 * fields are combined per branch, then polygonized. Fine twigs retain their
 * native geometry; this avoids a full-plot voxel grid. */
export function fuseWood(T,paths,step){
 if(!paths.length)return null;
 const pad=step*3.4,blend=step*1.55,limit=320000;
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const path of paths)for(let i=0;i<path.points.length;i++){const p=path.points[i],r=path.radii[i]+pad;for(let a=0;a<3;a++){const v=[p.x,p.y,p.z][a];min[a]=Math.min(min[a],v-r);max[a]=Math.max(max[a],v+r);}}
 const origin=min.map(v=>Math.floor(v/step)*step),size=max.map((v,a)=>Math.ceil((v-origin[a])/step)+2),[nx,ny,nz]=size,plane=nx*ny;
 const key=(x,y,z)=>x+nx*y+plane*z,field=new Map(),segments=[];
 const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
 for(const path of paths){
  const local=new Map();let length=0;
  for(let j=0;j<path.points.length-1;j++){
   const a=path.points[j],b=path.points[j+1],ra=path.radii[j],rb=path.radii[j+1],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l2=dx*dx+dy*dy+dz*dz;
   if(l2<1e-12)continue;const l=Math.sqrt(l2),u=new T.Vector3(dx,dy,dz).normalize(),ref=Math.abs(u.y)>.93?new T.Vector3(1,0,0):new T.Vector3(0,1,0),side=new T.Vector3().crossVectors(u,ref).normalize(),up=new T.Vector3().crossVectors(u,side).normalize();
   const id=segments.length;segments.push({a,dx,dy,dz,l,l2,ra,rb,length,side,up,seed:path.seed});length+=l;
   const p=Math.max(ra,rb)+pad,lo=[Math.min(a.x,b.x)-p,Math.min(a.y,b.y)-p,Math.min(a.z,b.z)-p].map((v,i)=>Math.max(0,Math.floor((v-origin[i])/step))),hi=[Math.max(a.x,b.x)+p,Math.max(a.y,b.y)+p,Math.max(a.z,b.z)+p].map((v,i)=>Math.min(size[i]-1,Math.ceil((v-origin[i])/step)));
   for(let z=lo[2];z<=hi[2];z++)for(let y=lo[1];y<=hi[1];y++)for(let x=lo[0];x<=hi[0];x++){
    const X=origin[0]+x*step-a.x,Y=origin[1]+y*step-a.y,Z=origin[2]+z*step-a.z,t=Math.max(0,Math.min(1,(X*dx+Y*dy+Z*dz)/l2));
    const d=Math.hypot(X-t*dx,Y-t*dy,Z-t*dz)-(ra+(rb-ra)*t);
    if(d>pad)continue;const k=key(x,y,z),old=local.get(k);if(!old||d<old.d)local.set(k,{d,id});
   }
  }
  for(const [k,v] of local){const old=field.get(k);if(!old)field.set(k,v);else{const id=v.d<old.d?v.id:old.id;field.set(k,{d:smin(old.d,v.d,blend),id});}}
  if(field.size>limit)return null;
 }
 const offsets=[0,1,1+nx,nx,plane,plane+1,plane+nx+1,plane+nx];
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
 const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const cubes=new Set();
 for(const [k,v] of field)if(v.d<0){const z=Math.floor(k/plane),y=Math.floor((k-z*plane)/nx),x=k%nx;for(let dz=-1;dz<=0;dz++)for(let dy=-1;dy<=0;dy++)for(let dx=-1;dx<=0;dx++)if(x+dx>=0&&y+dy>=0&&z+dz>=0&&x+dx<nx-1&&y+dy<ny-1&&z+dz<nz-1)cubes.add(key(x+dx,y+dy,z+dz));}
 const P=[],N=[],UV=[],C=[],dist=k=>field.get(k)?.d??pad;
 function vertex(k,x,y,z,c){const a=corners[c],q=k+offsets[c],v=field.get(q);return {p:[origin[0]+(x+a[0])*step,origin[1]+(y+a[1])*step,origin[2]+(z+a[2])*step],d:v?.d??pad,id:v?.id??-1,n:[dist(q+1)-dist(q-1),dist(q+nx)-dist(q-nx),dist(q+plane)-dist(q-plane)]};}
 function cut(a,b){const t=a.d/(a.d-b.d);return {p:a.p.map((v,i)=>v+(b.p[i]-v)*t),n:a.n.map((v,i)=>v+(b.n[i]-v)*t),id:a.d<b.d?a.id:b.id};}
 function texture(p,s){const x=p[0]-s.a.x,y=p[1]-s.a.y,z=p[2]-s.a.z,t=Math.max(0,Math.min(1,(x*s.dx+y*s.dy+z*s.dz)/s.l2));const X=x-t*s.dx,Y=y-t*s.dy,Z=z-t*s.dz;return [Math.atan2(X*s.up.x+Y*s.up.y+Z*s.up.z,X*s.side.x+Y*s.side.y+Z*s.side.z)/(Math.PI*2),s.seed*.9+(s.length+t*s.l)/1.8];}
 function tri(a,b,c){
  const u=b.p.map((v,i)=>v-a.p[i]),v=c.p.map((v,i)=>v-a.p[i]),cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(Math.hypot(...cross)<1e-12)return;
  if(cross.reduce((v,n,i)=>v+n*(a.n[i]+b.n[i]+c.n[i]),0)<0)[b,c]=[c,b];
  const s=segments[a.id]||segments[b.id]||segments[c.id];if(!s)return;
  const ref=texture(a.p,s)[0],scale=Math.max(.045,s.ra*Math.PI*2/1.8);
  for(const q of [a,b,c]){const len=Math.hypot(...q.n)||1;P.push(...q.p);N.push(...q.n.map(v=>v/len));let [u,v]=texture(q.p,s);u-=Math.round(u-ref);UV.push(s.seed*.8+u*scale,v);C.push(.94,.94,.94);}
 }
 for(const k of cubes){const z=Math.floor(k/plane),y=Math.floor((k-z*plane)/nx),x=k%nx;const a=corners.map((_,i)=>vertex(k,x,y,z,i));
  if(a.every(v=>v.d>=0)||a.every(v=>v.d<0))continue;
  for(const t of tetra){const inside=t.filter(i=>a[i].d<0),outside=t.filter(i=>a[i].d>=0);
   if(inside.length===1){const q=outside.map(i=>cut(a[inside[0]],a[i]));tri(...q);}
   else if(inside.length===3){const q=inside.map(i=>cut(a[i],a[outside[0]]));tri(...q);}
   else if(inside.length===2){const [i,j]=inside,[m,n]=outside,A=cut(a[i],a[m]),B=cut(a[i],a[n]),C=cut(a[j],a[m]),D=cut(a[j],a[n]);tri(A,B,C);tri(B,D,C);}
  }
 }
 if(P.length<9||P.length/9>260000)return null;
 const g=new T.BufferGeometry();for(const [k,v,n] of [['position',P,3],['normal',N,3],['uv',UV,2],['color',C,3]])g.setAttribute(k,new T.Float32BufferAttribute(v,n));g.computeBoundingSphere();return g;
}
