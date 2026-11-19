/* Licensed source pages, reviewed 19 Nov 2026. Runtime loads bundled local GLBs only.
 * The model importer accepts any user-owned species-matching GLB with priority.
 */
export const MATURE_TREE_MODELS=Object.freeze({
 birch:Object.freeze({name:'Взрослая берёза',path:'/assets/landscape-models/birch-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/mature-silver-birch-tree-8e297753',license:'CC0 1.0'}),
 spruce:Object.freeze({name:'Взрослая ель',path:'/assets/landscape-models/spruce-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/mature-norway-spruce-tree-48c2566f',license:'CC0 1.0'}),
 oak:Object.freeze({name:'Дуб с детальной листвой',path:'/assets/landscape-models/oak-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9',license:'CC0 1.0'})
});
export const TREE_MODEL_SOURCE_LINKS=Object.freeze({
 pine:{name:'Poly Haven · Pine Tree 01',sourcePage:'https://polyhaven.com/a/pine_tree_01'},
 ...MATURE_TREE_MODELS
});
