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
 if(asset.id==='pine'){
  const growth=o?.pine&&typeof o.pine==='object'?o.pine:{};
  const form=pineForm[growth.pineType]||pineForm.solitary;
  const age=bounded(growth.age,3,150);
  const maturity=age===null?'author-selected growth stage as seen in the GLB and source image':
   age<=15?'young Scots pine with naturally lower branches':
   age<70?'adult Scots pine of the explicitly selected age':'old mature Scots pine of the explicitly selected age';
  return 'SPECIES Pinus sylvestris (Scots pine, NOT spruce), '+maturity+
   (age!==null?'; age '+Math.round(age)+' years':'')+
   '; selected form '+form+'; retain original GLB needle color, pine bark and crown silhouette. '+fixed;
 }
 if(asset.id==='spruce'){
  const stage=sprucePromptStage(o),age=bounded(o?.spruce?.age,3,350);
  return 'SPECIES Picea abies (Norway spruce, NOT Scots pine), selected TREE TYPE '+stage+
   '; '+spruceForm[stage]+(age===null?'':'; user-authored age '+Math.round(age)+' years')+
   '; keep original evergreen needle color and authentic drooping branch structure. '+fixed;
 }
 if(asset.id==='birch'){
  const age=bounded(o?.birch?.age,3,200);
  return 'SPECIES Betula pendula (silver birch, NOT aspen), '+stageFromBirch(o?.birch?.stage??o?.treeStage)+
   (age===null?'':'; author-selected age '+Math.round(age)+' years')+
   '; small translucent deciduous leaves, gracefully hanging fine twigs, white bark with black scars. '+fixed;
 }
 const latin=asset.latin||asset.name;
 return 'SPECIES '+latin+', reproduce this exact planted botanical species, its reference growth habit, leaf shape, bark and canopy. '+fixed;
}
