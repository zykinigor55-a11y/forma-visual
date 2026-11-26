/* FORMA / Nano Banana & GPT image-to-image botanical identity lock.
 * These are per-instance factual metadata from the authored landscape plan,
 * NOT permission for the model to create more trees or change their footprint.
 * Species and shapes are whitelisted; do not interpolate unselected ages.
 */
const bounded=(value,min,max)=>{
 if(value==null||value==='')return null;
 const n=Number(value);
 return Number.isFinite(n)&&n>=min&&n<=max?n:null;
};
const metres=value=>{
 const v=bounded(value,.05,40);
 return v===null?'as shown in the reference':v.toFixed(2)+'m';
};
const pineForm=Object.freeze({
 solitary:'solitary, asymmetrical wide Scots pine; characteristic reddish upper bark and natural low-to-middle needle clusters',
 forest:'slender forest-grown Scots pine; more open lower trunk, narrower upper crown and separate asymmetric pine needle whorls',
 garden:'dense garden-grown Scots pine; fuller natural lower branches and an irregular broad crown, NEVER a conical spruce'
});
const spruceForm=Object.freeze({
 young:'YOUNG LOW Norway spruce: short tree, slender central leader, low branches begin near the ground, softly tapered crown of fine short needles',
 ordinary:'ORDINARY Norway spruce (current adult GLB): upright conical crown, naturally tiered drooping branchlets, fine dark green short needles',
 century:'CENTURY-OLD Norway spruce: substantial trunk, broad developed lower crown, uneven aged branch whorls and gently hanging twigs, still the SAME Picea abies'
});
const spruceAliases=Object.freeze({
 young:'young',juvenile:'young',low:'young',small:'young',sapling:'young',
 ordinary:'ordinary',normal:'ordinary',standard:'ordinary',adult:'ordinary',regular:'ordinary',
 century:'century',old:'century',veteran:'century',ancient:'century',century_old:'century'
});
function stageFromBirch(value){
 const raw=String(value??'').toLowerCase();
 if(['young','sapling','juvenile'].includes(raw))return 'young deciduous birch with fine hanging shoots';
 if(['old','veteran','century'].includes(raw))return 'veteran birch with an irregular open canopy and mature pale bark';
 return 'existing naturally airy silver birch with fine pendulous twigs and white bark with dark scars';
}
export function sprucePromptStage(o){
 const raw=o?.spruce?.type??o?.spruce?.stage??o?.spruceType??o?.spruceStage??o?.treeStage??o?.stage;
 return spruceAliases[String(raw??'ordinary').toLowerCase()]||'ordinary';
}
export function treeInstancePhotoDetail(o,asset){
 if(!asset||asset.group!=='trees')return '';
 const height=metres(o?.height),diameter=metres(o?.diameter);
 const fixed='Measured, immutable single-tree height '+height+' and crown diameter '+diameter+
  '; no species substitution, no extra trees, no resizing, no tree relocation.';
 const rotation=bounded(o?.rotation,-360,360),variant=bounded(o?.variant,1,3);
 const identity=' Keep the individual reference trunk path, major forks, branch directions, crown lobes, silhouette, internal gaps and foliage coverage; no generic replacement. '+(rotation===null?'':'Authored yaw '+rotation.toFixed(1)+' degrees. ')+(variant===null?'':'Individual shape variant '+variant+'. ');
 if(asset.id==='ph-fir-sapling'){
  const age=bounded(o?.fir?.age,10,100),m=o?.photoTreeModel;
  const stage=age===10?'young 10-year form: low compact tapered crown, slim leader, low whorls':age===100?'old 100-year form: heavier trunk, elevated irregular crown base, drooping lower branches and broader upper crown':'adult 45-year form: regular but asymmetric layered conical crown with developed lateral branchlets';
  const tiers=bounded(m?.tiers,1,40);
  return 'FIR / ABIES (NOT spruce or pine), FORMA selected growth template: '+stage+'. '+fixed+identity+
   (tiers===null?'':'Source modeled tier count '+Math.round(tiers)+'; keep visible tier spacing and gaps. ')+
   'Preserve flat individual fir needles at their small physical scale, subtle pale underside, fine curved branchlets, muted green mature needles and lighter existing fresh growth, grey-brown bark appropriate to the source age. Only retain upright seed cones where visible in Image 1. Do not add or remove crowns, needles in bulk, or change the existing branch architecture. '+(m?.revision==='R99'?'Source FORMA R99: individual narrow fir needles on real branched shoots, no foliage planes, staggered natural whorls, continuous trunk and attached upright cones. Preserve exact source silhouette, branch attachments, foliage coverage and gaps. ':m?.revision==='R98'?'Source FORMA R98: dense layered crown, fine three-dimensional needle sprays and attached upright cones. Preserve the actual irregular branch outline, gaps and coverage in the supplied reference, without generic replacement. ':m?.revision==='R97'?'Source FORMA R97: dense fine short needles, continuous trunk, fuller branch whorls and attached upright cones. Retain the exact visible cone distribution and foliage coverage. ':m?.revision==='R96'?'Source FORMA R96: continuous tapered trunk with root flare and curved tapered branch paths; keep these exact silhouettes. ':m?.revision==='R94'?'Source geometry FORMA R94. ':'');
 }
 if(asset.id==='oak'){
  const age=bounded(o?.oak?.age,1,350);
  return 'SPECIES Quercus robur, '+(age===null?'source-selected age':age+'-year selected template')+'. '+fixed+identity+' Preserve the existing irregular woody branching and lobed leaf scale, mature bark and source canopy coverage. No generic stock oak substitution.';
 }
 if(asset.id==='willow'){
  const age=bounded(o?.willow?.age,5,100),stage=age===null?'source-selected stage':age<22?'young':age<55?'adult':'old',trunk=bounded(o?.photoTreeModel?.trunkDiameterM,.01,4),leaves=bounded(o?.photoTreeModel?.leafCards,0,1000000);
  return 'SPECIES Salix babylonica (weeping willow), '+stage+(age===null?'':'; selected design age '+Math.round(age)+' years')+'. Rounded asymmetric crown with individual arching woody limbs and irregular hanging curtains of narrow lanceolate leaves; preserve existing open gaps and exact lengths of drooping branchlets. '+fixed+identity+(trunk===null?'':'Measured nominal trunk diameter '+trunk.toFixed(2)+'m. ')+(leaves===null?'':'Source leaf-card count '+Math.round(leaves)+' is a coverage cue, not literal biological leaf count. ')+' Natural subdued leaf greens, grey-brown bark; do not substitute a rectangular curtain, broadleaf foliage or a different age.';
 }
 if(asset.id==='maple'){
  const age=bounded(o?.maple?.age,5,110),model=o?.photoTreeModel;
  const stage=age===null?'source-selected age':age<30?'young':age<85?'adult':'century-old';
  const trunk=bounded(model?.trunkDiameterM,.01,4),leaves=bounded(model?.leafCards,0,1000000),limbs=bounded(model?.primaryBranches,1,100);
  return 'SPECIES Acer platanoides (Norway maple), '+stage+(age===null?'':', selected design age '+Math.round(age)+' years')+
   '; preserve the exact source maple individual, not a generic botanical stock tree. '+fixed+identity+
   (trunk===null?'':'Nominal source trunk diameter '+trunk.toFixed(2)+'m; preserve taper and root flare. ')+
   (limbs===null?'':'Source primary branch count '+Math.round(limbs)+'; preserve visible major forks and angles. ')+
   (leaves===null?'':'Source foliage geometry contains '+Math.round(leaves)+' leaf cards (coverage cue, not literal photographic leaf count). Match the visual coverage, do not independently thicken or thin it. ')+
   'Keep palmate maple leaf shape and source leaf scale, subdued natural green hues, photographic grey-brown bark, fine twig detail, and existing sunlight transmission. A young maple must stay slender; an adult or century-old maple must retain its own actual trunk thickness, branch architecture and crown spread as shown, without imposing idealized age proportions.';
 }
 if(asset.id==='pine'){
  const growth=o?.pine&&typeof o.pine==='object'?o.pine:{};
  const form=pineForm[growth.pineType]||pineForm.solitary;
  const age=bounded(growth.age,3,150);
  const maturity=age===null?'author-selected growth stage as seen in the GLB and source image':
   age<=15?'young Scots pine with naturally lower branches':
   age<70?'adult Scots pine of the explicitly selected age':'old mature Scots pine of the explicitly selected age';
  return 'SPECIES Pinus sylvestris (Scots pine, NOT spruce), '+maturity+
   (age!==null?'; age '+Math.round(age)+' years':'')+
   '; selected form '+form+'; retain original GLB needle color, pine bark and crown silhouette. '+fixed+identity;
 }
 if(asset.id==='spruce'){
  const stage=sprucePromptStage(o),age=bounded(o?.spruce?.age,3,350);
  return 'SPECIES Picea abies (Norway spruce, NOT Scots pine), selected TREE TYPE '+stage+
   '; '+spruceForm[stage]+(age===null?'':'; user-authored age '+Math.round(age)+' years')+
   '; keep original evergreen needle color and authentic drooping branch structure. '+fixed+identity;
 }
 if(asset.id==='birch'){
  const age=bounded(o?.birch?.age,3,200);
  const m=o?.photoTreeModel, trunk=bounded(m?.trunkDiameterM,.01,4),leaves=bounded(m?.leafCards,0,1000000),limbs=bounded(m?.primaryBranches,1,100);
  const stage=age===null?stageFromBirch(o?.birch?.stage??o?.treeStage):age<=10?'young slender birch':age>=75?'old broad irregular birch':'adult airy silver birch';
  return 'SPECIES Betula pendula (silver birch, NOT aspen), '+stage+(age===null?'':'; selected design age '+Math.round(age)+' years')+'. '+fixed+identity+(m?.revision==='R56'?'APPROVED FORMA BIRCH R56: retain the exact curved tapering trunk, irregular curved structural branches, thin secondary shoots, drooping branch tips and existing airy canopy with dense individual serrated leaves. Preserve all visible forks and branch attachments. Pale grey-white bark with irregular enlarged horizontal black lenticels and dark scars, fine relief and darker root flare; do not reduce markings to dots or use vertical stripes. Small individual leaves with source scale, muted natural greens, no boosted saturation. ':'Small translucent deciduous leaves, hanging twigs, white bark with dark scars. ')+(trunk===null?'':'Nominal source trunk diameter '+trunk.toFixed(2)+'m. ')+(limbs===null?'':'Source primary limbs '+Math.round(limbs)+'. ')+(leaves===null?'':'Source leaf instances '+Math.round(leaves)+' are a coverage cue; preserve existing gaps and density, not a literal photo leaf count. ');
 }
 const latin=asset.latin||asset.name;
 return 'SPECIES '+latin+', reproduce this exact planted botanical species, its reference growth habit, leaf shape, bark and canopy. '+fixed+identity;
}
