/* FORMA · People & Animals catalogue.
 * Pinned, verified tevy CC0 glTF assets; models remain true GLBs, never
 * procedurally faked if a network/source asset fails. 1-based site metre scale.
 * Source licence checked 2026-11-22: https://tevy.dev/docs (CC0 1.0).
 */
export const CREATURE_ASSETS=Object.freeze([
 {id:'creature-casual-man',group:'people',name:'Мужчина · повседневный',
  species:'Homo sapiens',height:1.79,slug:'casual-walker',emoji:'🧍',lod:1,
  notes:'Человек в худи, джинсах и кроссовках · idle/walk',
  source:'https://tevy.dev/models/casual-walker'},
 {id:'creature-hiker-woman',group:'people',name:'Женщина · турист',
  species:'Homo sapiens',height:1.70,slug:'hiker',emoji:'🥾',lod:1,
  notes:'Куртка, рюкзак и походная обувь',
  source:'https://tevy.dev/models/hiker'},
 {id:'creature-older-man',group:'people',name:'Мужчина · прогулка',
  species:'Homo sapiens',height:1.75,slug:'dog-walker',emoji:'🚶',lod:1,
  notes:'Взрослый мужчина в куртке и кепке, без собаки',
  source:'https://tevy.dev/models/dog-walker'},
 {id:'creature-red-fox',group:'animals',name:'Лиса рыжая',
  species:'Vulpes vulpes',height:.43,slug:'red-fox',emoji:'🦊',lod:1,
  notes:'Рыжий мех, объёмный хвост, природные пропорции',
  source:'https://tevy.dev/models/red-fox'},
 {id:'creature-roe-deer',group:'animals',name:'Косуля',
  species:'Capreolus capreolus',height:.84,slug:'roe-deer',emoji:'🦌',lod:1,
  notes:'Лесная косуля, анатомическая форма и небольшие рога',
  source:'https://tevy.dev/models/roe-deer'},
 {id:'creature-reindeer',group:'animals',name:'Северный олень',
  species:'Rangifer tarandus',height:1.15,slug:'reindeer',emoji:'🦌',lod:1,
  notes:'Серый зимний мех, естественные рога',
  source:'https://tevy.dev/models/reindeer'},
 {id:'creature-sheep',group:'animals',name:'Овца',
  species:'Ovis aries',height:.78,slug:'sheep',emoji:'🐑',lod:1,
  notes:'Шерсть, натуральный масштаб, анимации',
  source:'https://tevy.dev/models/sheep'},
 {id:'creature-pig',group:'animals',name:'Свинья',
  species:'Sus scrofa domesticus',height:.74,slug:'pig',emoji:'🐖',lod:1,
  notes:'Сельский ландшафт, натуральные пропорции',
  source:'https://tevy.dev/models/pig'}
].map(item=>Object.freeze({...item,license:'CC0-1.0',
  modelPath:'/api/creatures/'+item.id+'.glb',
  origin:'tevy.dev',sourceVersion:'v1',
  nativeGLB:'https://tevy.dev/models/'+item.slug+'/v1/lod1.glb',
  preview:'https://tevy.dev/models/'+item.slug+'/v1/preview.webp'})));
const CREATURE_MAP=new Map(CREATURE_ASSETS.map(x=>[x.id,x]));
export const creatureById=id=>CREATURE_MAP.get(id)||null;
export const isCreatureId=id=>CREATURE_MAP.has(id);
export function creaturePhotoDescription(id,height){
 const animal=creatureById(id);if(!animal)return null;
 const metric=Number.isFinite(Number(height))?Number(height).toFixed(2):animal.height.toFixed(2);
 return animal.name+' ('+animal.species+'), real living '+(animal.group==='people'?'human':'animal')+
  ', authored height '+metric+' m. Anatomically plausible limb proportions, eyes, natural textured skin/fur, physically correct outdoor light and shadows; existing site position and size are immutable. The low-polygon GLB is ONLY a positional reference for photographic reconstruction.';
}
