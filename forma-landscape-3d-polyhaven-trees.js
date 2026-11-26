/* FORMA · Optional Poly Haven CC0 tree collection.
 * Only verified 1K, embedded-texture GLBs appear here. Existing approved
 * mature pines, spruces, birches and all other species stay untouched.
 * Photo geometry is never generated or swapped by this metadata module.
 */
export const POLY_HAVEN_TREE_MODELS=Object.freeze({
 'ph-fir-sapling':Object.freeze({
  name:'Пихта молодая · Poly Haven',path:'./assets/landscape-models/ph-fir-sapling.glb',
  sourcePage:'https://polyhaven.com/a/fir_sapling',license:'CC0 1.0',juvenile:true,
  height:3.0,diameter:2.0,thumbnail:'./assets/landscape-models/thumbs/ph-fir-sapling.webp'}),
 'ph-pine-sapling':Object.freeze({
  name:'Сосна молодая · Poly Haven',path:'./assets/landscape-models/ph-pine-sapling.glb',
  sourcePage:'https://polyhaven.com/a/pine_sapling_small',license:'CC0 1.0',juvenile:true,
  height:2.8,diameter:1.8,thumbnail:'./assets/landscape-models/thumbs/ph-pine-sapling.webp'}),
 'ph-quiver-01':Object.freeze({
  name:'Колчанное дерево 01 · Poly Haven',path:'./assets/landscape-models/ph-quiver-01.glb',
  sourcePage:'https://polyhaven.com/a/quiver_tree_01',license:'CC0 1.0',exotic:true,
  height:4.5,diameter:2.5,thumbnail:'./assets/landscape-models/thumbs/ph-quiver-01.webp'}),
 'ph-quiver-02':Object.freeze({
  name:'Колчанное дерево 02 · Poly Haven',path:'./assets/landscape-models/ph-quiver-02.glb',
  sourcePage:'https://polyhaven.com/a/quiver_tree_02',license:'CC0 1.0',exotic:true,
  height:3.7,diameter:2.1,thumbnail:'./assets/landscape-models/thumbs/ph-quiver-02.webp'})
});
export const isPolyHavenTree=id=>Object.hasOwn(POLY_HAVEN_TREE_MODELS,id);
