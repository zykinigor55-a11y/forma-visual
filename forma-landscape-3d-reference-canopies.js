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
/* Remaining catalogue species receive their OWN branch habit, not a
 * scaled copy of oak or spirea. The three reference exemplars stay special.
 * Values are fractional growth-shape guidelines, not final dimensions.
 */
export const ADDITIONAL_GROWTH_TRAITS=Object.freeze({
 maple:{primaryArms:5,branchAngle:.37,shootsPerBranch:3,droop:.018,crownAsymmetry:.13,layeredFoliage:1.10,leafClusterScale:1.04},
 linden:{primaryArms:5,branchAngle:.31,shootsPerBranch:3,droop:.045,crownAsymmetry:.12,layeredFoliage:1.10,leafClusterScale:.91},
 willow:{primaryArms:5,branchAngle:.27,shootsPerBranch:4,droop:.26,crownAsymmetry:.20,layeredFoliage:.88,leafClusterScale:.86},
 rowan:{primaryArms:4,branchAngle:.33,shootsPerBranch:2,droop:.035,crownAsymmetry:.20,layeredFoliage:.87,leafClusterScale:.68},
 apple:{primaryArms:5,branchAngle:.31,shootsPerBranch:3,droop:.042,crownAsymmetry:.23,layeredFoliage:1.16,leafClusterScale:.95},
 sakura:{primaryArms:5,branchAngle:.35,shootsPerBranch:3,droop:.029,crownAsymmetry:.21,layeredFoliage:1.05,leafClusterScale:.83},
 ash:{primaryArms:5,branchAngle:.38,shootsPerBranch:3,droop:.01,crownAsymmetry:.19,layeredFoliage:.87,leafClusterScale:.76},
 aspen:{primaryArms:4,branchAngle:.30,shootsPerBranch:2,droop:.02,crownAsymmetry:.12,layeredFoliage:.96,leafClusterScale:.67},
 juniper:{primaryArms:0,branchAngle:.12,shootsPerBranch:2,droop:.07,crownAsymmetry:.21,layeredFoliage:1.21,leafClusterScale:.59},
 hydrangea:{primaryArms:0,branchAngle:.43,shootsPerBranch:3,droop:.08,crownAsymmetry:.17,layeredFoliage:1.19,leafClusterScale:.96},
 barberry:{primaryArms:0,branchAngle:.32,shootsPerBranch:3,droop:.035,crownAsymmetry:.25,layeredFoliage:1.04,leafClusterScale:.59},
 dogwood:{primaryArms:0,branchAngle:.55,shootsPerBranch:3,droop:.14,crownAsymmetry:.29,layeredFoliage:.86,leafClusterScale:.89},
 'thuja-globe':{primaryArms:0,branchAngle:.20,shootsPerBranch:2,droop:.03,crownAsymmetry:.13,layeredFoliage:1.21,leafClusterScale:.59},
 lavender:{primaryArms:0,branchAngle:.56,shootsPerBranch:2,droop:.10,crownAsymmetry:.25,layeredFoliage:.85,leafClusterScale:.51},
 boxwood:{primaryArms:0,branchAngle:.17,shootsPerBranch:2,droop:.02,crownAsymmetry:.14,layeredFoliage:1.17,leafClusterScale:.56},
 ninebark:{primaryArms:0,branchAngle:.41,shootsPerBranch:3,droop:.11,crownAsymmetry:.28,layeredFoliage:1.06,leafClusterScale:.84},
 hosta:{primaryArms:0,branchAngle:.18,shootsPerBranch:2,droop:.14,crownAsymmetry:.16,layeredFoliage:.92,leafClusterScale:.82},
 'ornamental-grass':{primaryArms:0,branchAngle:.68,shootsPerBranch:2,droop:.15,crownAsymmetry:.31,layeredFoliage:.84,leafClusterScale:.52},
 fern:{primaryArms:0,branchAngle:.62,shootsPerBranch:2,droop:.17,crownAsymmetry:.24,layeredFoliage:.86,leafClusterScale:.62},
 periwinkle:{primaryArms:0,branchAngle:.12,shootsPerBranch:2,droop:.07,crownAsymmetry:.23,layeredFoliage:1.05,leafClusterScale:.56},
 'wild-shrub':{primaryArms:0,branchAngle:.46,shootsPerBranch:3,droop:.12,crownAsymmetry:.35,layeredFoliage:.89,leafClusterScale:.87}
});
export function speciesGrowthProfile(id){
 return REFERENCE_CANOPIES[id]||ADDITIONAL_GROWTH_TRAITS[id]||null;
}
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function referenceCanopy(id){return REFERENCE_CANOPIES[id]||null;}
export function referenceBranchTips(id,{start,end,stage=.5,crownRadius=3,plantHeight=10,seed=0}={}){
 const profile=speciesGrowthProfile(id);if(!profile)return [];
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
