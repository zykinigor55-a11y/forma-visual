/* Licensed source pages, reviewed 19 Nov 2026. Runtime loads bundled local GLBs only.
 * The model importer accepts any user-owned species-matching GLB with priority.
 */
export const MATURE_TREE_MODELS=Object.freeze({
 birch:Object.freeze({name:'Берёза повислая · PBR с естественной листвой',path:'/assets/landscape-models/birch-tevy-cc0.glb',sourcePage:'https://tevy.dev/models/silver-birch',fallbackPath:'/assets/landscape-models/birch-mature-cc0.glb',license:'CC0 1.0'}),
 spruce:Object.freeze({name:'Ель обыкновенная · густая PBR-хвоя',path:'/assets/landscape-models/spruce-tevy-cc0.glb',sourcePage:'https://tevy.dev/models/norway-spruce',fallbackPath:'/assets/landscape-models/spruce-mature-cc0.glb',license:'CC0 1.0'}),
 oak:Object.freeze({name:'Дуб черешчатый · PBR кора и лопастная листва',path:'/assets/landscape-models/oak-terraintale-cc0.glb',sourcePage:'https://terraintale.com/library/realistic-surfaces/oak-tree-large',fallbackPath:'/assets/landscape-models/oak-mature-cc0.glb',license:'CC0 1.0'}),
 maple:Object.freeze({name:'Клён с детальной листвой',path:'/assets/landscape-models/maple-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/maple-street-tree-detailed-leaves-006cddf4',license:'CC0 1.0'}),
 linden:Object.freeze({name:'Липа с детальной листвой',path:'/assets/landscape-models/linden-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/linden-street-tree-detailed-leaves-6300c26e',license:'CC0 1.0'}),
 sakura:Object.freeze({name:'Весеннее цветущее дерево · сакура',path:'/assets/landscape-models/sakura-mature-cc0.glb',sourcePage:'https://www.innerscene.com/tools/library/3d-parts/flowering-cherry-tree-6d80049e',license:'CC0 1.0',season:'spring'}),
 apple:Object.freeze({name:'Садовая яблоня с плодами',path:'/assets/landscape-models/apple-mature-cc0.glb',sourcePage:'https://tevy.dev/models/apple-tree',license:'CC0 1.0'}),
 rowan:Object.freeze({name:'Рябина обыкновенная с ягодами',path:'/assets/landscape-models/rowan-mature-cc0.glb',sourcePage:'https://tevy.dev/models/rowan',license:'CC0 1.0'}),
 ash:Object.freeze({name:'Ясень обыкновенный · фактурная кора и PBR-листва',path:'/assets/landscape-models/ash-terraintale-cc0.glb',sourcePage:'https://terraintale.com/library/realistic-surfaces/ash-tree-large',license:'CC0 1.0'}),
 aspen:Object.freeze({name:'Осина европейская',path:'/assets/landscape-models/aspen-mature-cc0.glb',sourcePage:'https://tevy.dev/models/aspen',license:'CC0 1.0'})
});
export const TREE_MODEL_SOURCE_LINKS=Object.freeze({
 pine:{name:'Poly Haven · Pine Tree 01',sourcePage:'https://polyhaven.com/a/pine_tree_01'},
 ...MATURE_TREE_MODELS
});
