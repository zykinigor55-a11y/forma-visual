/* FORMA / metre-accurate landscape terrain sculpting.
 * Pure operations: the site owns coordinates, height samples remain editable.
 * Each stroke is deterministic; paint and orbit tools may run concurrently. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function terrainBrushFalloff(dx,dz,radius,softness=72,shape='circle'){
 const r=Math.max(.05,Number(radius)||1);
 const distance=shape==='square'?Math.max(Math.abs(dx),Math.abs(dz)):Math.hypot(dx,dz);
 if(distance>=r)return 0;
 const normalized=distance/r,soft=clamp(Number(softness)||0,0,100)/100;
 if(soft<.001)return 1;
 const core=1-soft;
 if(normalized<=core)return 1;
 const x=clamp((normalized-core)/soft,0,1);
 return 1-x*x*(3-2*x);
}
export function applyTerrainBrush({heights,grid,width,length,world,mode='raise',radius=3,strength=.35,softness=72,shape='circle',contains}){
 if(!Array.isArray(heights)||!world||!Number.isFinite(world.x)||!Number.isFinite(world.z))return heights;
 const N=Math.round(Number(grid)||48),W=Number(width),L=Number(length);
 if(N<2||!(W>0)||!(L>0)||heights.length!==(N+1)*(N+1))return heights;
 const r=clamp(Number(radius)||3,.1,30),amplitude=clamp(Number(strength)||.35,.01,3);
 const start=heights.slice(),end=start.slice(),sample=(i,j)=>start[clamp(i,0,N)*(N+1)+clamp(j,0,N)]||0;
 const ci=clamp(Math.round((world.z/L+.5)*N),0,N),cj=clamp(Math.round((world.x/W+.5)*N),0,N),level=sample(ci,cj);
 for(let i=0;i<=N;i++){
  const z=(i/N-.5)*L;if(Math.abs(z-world.z)>=r)continue;
  for(let j=0;j<=N;j++){
   const x=(j/N-.5)*W;if(Math.abs(x-world.x)>=r)continue;
   const factor=terrainBrushFalloff(x-world.x,z-world.z,r,softness,shape);
   if(factor<.001)continue;
   if(contains&&!contains(x+W/2,z+L/2))continue;
   const k=i*(N+1)+j,v=sample(i,j),blend=clamp(amplitude*factor,0,.95);
   let next=v;
   if(mode==='raise')next=v+amplitude*factor;
   else if(mode==='lower')next=v-amplitude*factor;
   else if(mode==='flatten')next=v+(level-v)*blend;
   else if(mode==='smooth'){
    const average=(sample(i-1,j)+sample(i+1,j)+sample(i,j-1)+sample(i,j+1)+v*2)/6;
    next=v+(average-v)*blend;
   }else if(mode==='roughen'){
    const noise=(Math.sin(x*7.13+z*3.47)*Math.cos(x*3.61-z*6.71)
      +.35*Math.sin(x*13.7-z*11.29))/.95;
    next=v+noise*amplitude*factor*.4;
   }
   end[k]=clamp(next,-8,12);
  }
 }
 return end;
}
