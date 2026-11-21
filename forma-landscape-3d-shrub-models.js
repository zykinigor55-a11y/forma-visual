/* Original Innerscene CC0 GLB, checked against the locally saved sha256 manifest.
 * This is a realistic flowering hydrangea shrub used as the foundation for
 * Hydrangea paniculata refinement; its precise cultivar is not verified.
 * Never misrepresent a summer-only flowering model as leafless in winter.
 */
export const SHRUB_3D_MODELS=Object.freeze({
 hydrangea:Object.freeze({
  name:'Гортензия цветущая · PBR 3D (основа для метельчатой)',
  path:'/assets/landscape-models/hydrangea-flowering-innerscene-cc0.glb',
  sourcePage:'https://www.innerscene.com/tools/library/3d-parts/flowering-hydrangea-shrub-af2da5d3',
  license:'CC0 1.0',
  season:'summer',
  fidelity:'flowering shrub; paniculata cultivar not confirmed'
 }),
 spirea:Object.freeze({
  name:'Спирея · цветущий куст с розовыми цветами (стилизованный GLB)',
  path:'/assets/landscape-models/spirea-flowering-grab3d-cc0.glb',
  sourcePage:'https://grab3d.com/models/nature/bush/',
  license:'CC0 1.0',
  season:'summer',
  fidelity:'stylized flowering bush, not verified botanical Spiraea japonica',
  sha256:'29e6c09939cf45327c9a1086515b78e383a62c30b0abe085f4348d30863bb695'
 }),
 barberry:Object.freeze({
  name:'Барбарис Тунберга «Атропурпуреа» · авторская 3D-модель FORMA',
  path:'/assets/landscape-models/barberry-thunberg-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_barberry_thunbergii.py',
  license:'FORMA original authorship; no external source models',
  season:'summer',
  fidelity:'self-authored Berberis with alpha-cutout vein textures on attached burgundy leaves, thorny twigs and red fruit; 160,180 triangles; original GLB, not photo scan',
  sha256:'87bc4582c63fe57e9fe5277841b84c9dedea2f911dc481bd402cf209fdc2def7'
 }),
 'thuja-globe':Object.freeze({
  name:'Туя западная «Даника» · оригинальная GLB-модель FORMA, 3 формы',
  path:'/assets/landscape-models/thuja-danica-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_thuja_danica.py',
  license:'Original FORMA procedural geometry and procedural PBR foliage textures',
  season:'evergreen',
  fidelity:'FORMA original v4; 3 separate true-scale crowns with nested flat fan sprays, physical woody stems and 7 independently painted alpha-masked PBR needle atlases',
  sha256:'dddcf23ad26608d9ee6a917d1d40378a9223e6683203b2cefc1ce266fc9822ce',
  variants:['THUJA_DANICA_NATURAL','THUJA_DANICA_COMPACT','THUJA_DANICA_MATURE']
 }),
 boxwood:Object.freeze({
  name:'Самшит вечнозелёный · оригинальная PBR-модель FORMA, три кроны',
  path:'/assets/landscape-models/boxwood-sempervirens-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_boxwood_sempervirens.py',
  license:'Original independently authored FORMA mesh and PBR materials',
  season:'evergreen',
  fidelity:'Premium original Buxus v2: curved thick oval leaf geometry, 8 leaf tone materials, decussate twig pairs, dense lower canopy, uniform perimeter-sampled hedge wall foliage and three original true-scale crowns; 720940 triangles combined',
  sha256:'1d199528b759bb250879613a734fbc2d08c53f8dc4b2c38abb513a5b17ab88ce',
  variants:['BOXWOOD_NATURAL','BOXWOOD_SPHERE','BOXWOOD_HEDGE']
 }),
 lavender:Object.freeze({
  name:'Лаванда узколистная · оригинальная PBR 3D-модель FORMA',
  path:'/assets/landscape-models/lavender-angustifolia-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_lavender_angustifolia.py',
  license:'Original FORMA procedural geometry, no third-party meshes or textures',
  season:'summer',
  fidelity:'FORMA original v3 mobile-optimized PBR Lavender; three true-scale variants, all 573 flower stems and 4360 foliage tufts retained, 444419 triangles total, UV-free vertex payload and original botanical geometry',
  sha256:'d8ad111821ddaae2508a4ef40e0386ab83b0529b2ba4ca8fe67af2bf3bd301d1',
  variants:['LAVENDER_NATURAL','LAVENDER_COMPACT','LAVENDER_MATURE']
 }),
 dogwood:Object.freeze({
  name:'Дёрен белый «Элегантиссима» · три оригинальных PBR 3D-формы FORMA',
  path:'/assets/landscape-models/dogwood-elegantissima-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_dogwood_elegantissima.py',
  license:'Original FORMA geometry and textures; no 3DDD model files used',
  season:'summer',
  fidelity:'self-authored v9, cream-edged opposite leaves, 3D petioles, darker interior leaves, upright mature canes and three independently modelled PBR crowns',
  sha256:'7eca9000e3473b36303bc8d18b720bdf3ec05323c33a6a54abe48225b15a13a8',
  variants:['DOGWOOD_NATURAL','DOGWOOD_SPHERE','DOGWOOD_BOX']
 })
});
