/* Species-specific measured branching for FORMA's native PBR plants.
 * These functions deliberately contain no camera, DOM or random state, so
 * exact crown dimensions and branching can be regression tested.
 */
export const REFERENCE_CANOPIES=Object.freeze({
 birch:Object.freeze({latin:'Betula pendula',tierMultiplier:1.26,
  primaryArms:5,branchAngle:0.29,shootsPerBranch:3,droop:.12,
  crownAsymmetry:.22,layeredFoliage:.88,leafClusterScale:.82}),
 oak:Object.freeze({latin:'Quercus robur',tierMultiplier:1.16,
  primaryArms:5,branchAngle:0.43,shootsPerBranch:4,droop:0,
  crownAsymmetry:.17,layeredFoliage:1.25,leafClusterScale:1.0}),
 spirea:Object.freeze({latin:'Spiraea japonica',tierMultiplier:1.0,
  primaryArms:0,branchAngle:.58,shootsPerBranch:4,droop:.085,
  crownAsymmetry:.26,layeredFoliage:1.20,leafClusterScale:.70})
});
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function referenceCanopy(id){return REFERENCE_CANOPIES[id]||null;}
export function referenceBranchTips(id,{start,end,stage=.5,crownRadius=3,plantHeight=10,seed=0}={}){
 const profile=referenceCanopy(id);if(!profile)return [];
 const a=start||[0,0,0],b=end||[1,3,0],t=clamp(Number(stage)||0,0,1);
 const dx=b[0]-a[0],dz=b[2]-a[2];
 const horizontal=Math.max(.001,Math.hypot(dx,dz));
 const tangent=[-dz/horizontal,dx/horizontal];
 const shoots=[];
 const count=profile.shootsPerBranch;
 // Secondary shoots grow from the outer 40-90% of their real supporting
 // branch, and preserve asymmetrical species-specific growth habits.
 for(let i=0;i<count;i++){
  const frac=.43+(i+.5)/count*.46;
  const base=[a[0]+(b[0]-a[0])*frac,a[1]+(b[1]-a[1])*frac,a[2]+(b[2]-a[2])*frac];
  const wobble=Math.sin((i+1)*2.4+(Number(seed)||0)*.013+t*1.7);
  const side=(i%2===0?1:-1)*(profile.crownAsymmetry+.07*wobble)*Math.max(.12,horizontal);
  const tip=[
   clamp(base[0]+tangent[0]*side,-crownRadius,crownRadius),
   clamp(base[1]+plantHeight*(profile.branchAngle*.055-profile.droop*(.32+.28*t))*(.55+.15*i),
    id==='spirea'?.03:.12,plantHeight*.995),
   clamp(base[2]+tangent[1]*side,-crownRadius,crownRadius)
  ];
  shoots.push({base,tip,thicknessFactor:(.23-.025*i)*(1-.22*t)});
 }
 return shoots;
}
export function referenceFoliageDensity(id,quality=1){
 const p=referenceCanopy(id);
 const q=clamp(Number(quality)||.2,.15,1);
 return p?Math.max(.25,Math.min(1.5,p.layeredFoliage*(.65+.35*q))):1;
}
