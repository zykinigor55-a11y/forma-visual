/* Original Innerscene CC0 GLB, checked against the locally saved sha256 manifest.
 * This is a realistic flowering hydrangea shrub used as the foundation for
 * Hydrangea paniculata refinement; its precise cultivar is not verified.
 * Never misrepresent a summer-only flowering model as leafless in winter.
 */
export const SHRUB_3D_MODELS=Object.freeze({
 hydrangea:Object.freeze({
  name:'Гортензия цветущая · PBR 3D (основа для метельчатой)',
  path:'./assets/landscape-models/hydrangea-flowering-innerscene-cc0.glb',
  sourcePage:'https://www.innerscene.com/tools/library/3d-parts/flowering-hydrangea-shrub-af2da5d3',
  license:'CC0 1.0',
  season:'summer',
  fidelity:'flowering shrub; paniculata cultivar not confirmed'
 }),
 spirea:Object.freeze({
  name:'Спирея · цветущий куст с розовыми цветами (стилизованный GLB)',
  path:'./assets/landscape-models/spirea-flowering-grab3d-cc0.glb',
  sourcePage:'https://grab3d.com/models/nature/bush/',
  license:'CC0 1.0',
  season:'summer',
  fidelity:'stylized flowering bush, not verified botanical Spiraea japonica',
  sha256:'29e6c09939cf45327c9a1086515b78e383a62c30b0abe085f4348d30863bb695'
 }),
 barberry:Object.freeze({
  name:'Барбарис Тунберга «Атропурпуреа» · авторская 3D-модель FORMA',
  path:'./assets/landscape-models/barberry-thunberg-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_barberry_thunbergii.py',
  license:'FORMA original authorship; no external source models',
  season:'summer',
  fidelity:'self-authored Berberis with alpha-cutout vein textures on attached burgundy leaves, thorny twigs and red fruit; 160,180 triangles; original GLB, not photo scan',
  sha256:'87bc4582c63fe57e9fe5277841b84c9dedea2f911dc481bd402cf209fdc2def7'
 }),
 'thuja-globe':Object.freeze({
  name:'Туя западная «Даника» · оригинальная GLB-модель FORMA, 3 формы',
  path:'./assets/landscape-models/thuja-danica-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_thuja_danica.py',
  license:'Original FORMA procedural geometry and procedural PBR foliage textures',
  season:'evergreen',
  fidelity:'FORMA original v4; 3 separate true-scale crowns with nested flat fan sprays, physical woody stems and 7 independently painted alpha-masked PBR needle atlases',
  sha256:'dddcf23ad26608d9ee6a917d1d40378a9223e6683203b2cefc1ce266fc9822ce',
  variants:['THUJA_DANICA_NATURAL','THUJA_DANICA_COMPACT','THUJA_DANICA_MATURE']
 }),
 boxwood:Object.freeze({
  name:'Самшит вечнозелёный · оригинальная PBR-модель FORMA, три кроны',
  path:'./assets/landscape-models/boxwood-sempervirens-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_boxwood_sempervirens.py',
  license:'Original independently authored FORMA mesh and PBR materials',
  season:'evergreen',
  fidelity:'Buxus premium v3: REAL PUBLIC-DOMAIN photographed leaf albedo + tangent-space normal map, UV-mapped onto 89300 curved 3D leaves; original three true-scale crowns, year-round evergreen',
  sha256:'46ca248559075f5893c928b3e8d4bf7d64426c6c5ed9ce6df434834612dd9d76',
  variants:['BOXWOOD_NATURAL','BOXWOOD_SPHERE','BOXWOOD_HEDGE']
 }),
 fern:Object.freeze({
  name:'Папоротник 01 · Poly Haven Fern 02 · отдельный PBR-куст',
  path:'./assets/landscape-models/polyhaven-fern-02-source.glb',
  sourcePage:'https://polyhaven.com/a/fern_02',
  license:'CC0 1.0 Universal · Rob Tuytel, Rico Cilliers · Poly Haven',
  season:'summer',
  fidelity:'Один из четырёх самостоятельных оригинальных кустов Fern 02; реальная геометрия fern_02_a, UV и PBR-текстуры из Poly Haven. Не копия с поворотом.',
  sha256:'3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c',
  variants:['fern_02_a']
 }),
 'fern-02':Object.freeze({
  name:'Папоротник 02 · Poly Haven Fern 02 · отдельный PBR-куст',
  path:'./assets/landscape-models/polyhaven-fern-02-source.glb',
  sourcePage:'https://polyhaven.com/a/fern_02',
  license:'CC0 1.0 Universal · Rob Tuytel, Rico Cilliers · Poly Haven',
  season:'summer',
  fidelity:'Один из четырёх самостоятельных оригинальных кустов Fern 02; реальная геометрия fern_02_b, UV и PBR-текстуры из Poly Haven. Не копия с поворотом.',
  sha256:'3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c',
  variants:['fern_02_b']
 }),
 'fern-03':Object.freeze({
  name:'Папоротник 03 · Poly Haven Fern 02 · отдельный PBR-куст',
  path:'./assets/landscape-models/polyhaven-fern-02-source.glb',
  sourcePage:'https://polyhaven.com/a/fern_02',
  license:'CC0 1.0 Universal · Rob Tuytel, Rico Cilliers · Poly Haven',
  season:'summer',
  fidelity:'Один из четырёх самостоятельных оригинальных кустов Fern 02; реальная геометрия fern_02_c, UV и PBR-текстуры из Poly Haven. Не копия с поворотом.',
  sha256:'3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c',
  variants:['fern_02_c']
 }),
 'fern-04':Object.freeze({
  name:'Папоротник 04 · Poly Haven Fern 02 · отдельный PBR-куст',
  path:'./assets/landscape-models/polyhaven-fern-02-source.glb',
  sourcePage:'https://polyhaven.com/a/fern_02',
  license:'CC0 1.0 Universal · Rob Tuytel, Rico Cilliers · Poly Haven',
  season:'summer',
  fidelity:'Один из четырёх самостоятельных оригинальных кустов Fern 02; реальная геометрия fern_02_d, UV и PBR-текстуры из Poly Haven. Не копия с поворотом.',
  sha256:'3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c',
  variants:['fern_02_d']
 }),
 'fern-original':Object.freeze({
  name:'Щитовник мужской · оригинальная PBR 3D-модель FORMA, 3 формы',
  path:'./assets/landscape-models/fern-dryopteris-filix-mas-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_fern_dryopteris.py',
  license:'FORMA original self-authored botanical geometry, albedo and tangent normal maps',
  season:'summer',
  fidelity:'FORMA fern v2: UV-mapped true CC0 Dryopteris frond photograph, photo-derived PBR normal atlas, asymmetrical sculpted pinnule tips and irregular naturally arching fronds; three original real-size 3D crowns',
  sha256:'1a359e5ba392f24a25b5f3af6db57c9f5770b97c9a32212cd208c2a3e3d32ddc',
  variants:['FERN_NATURAL','FERN_YOUNG','FERN_MATURE']
 }),
 pennisetum:Object.freeze({
  name:'Пеннисетум лисохвостный «Hameln» · пушистый декоративный злак FORMA',
  path:'./assets/landscape-models/pennisetum-hameln-forma-original.glb',
  sourcePage:'https://www.rhs.org.uk/plants/43921/pennisetum-alopecuroides-hameln/details',
  license:'Original FORMA procedural 3D geometry; botanical reference RHS and UF IFAS; no copied meshes or photographs',
  season:'summer',
  fidelity:'FORMA original v1: 3 independent fountain-grass crowns with physically curved grass blades, slender flowering culms and real mesh fluffy foxtail bristles; 195876 combined triangles',
  sha256:'15991fd8e7a7944def689dac5db0389fd1b6365aad30c1f99c50dd2454a644b9',
  variants:['PENNISETUM_NATURAL','PENNISETUM_COMPACT','PENNISETUM_MATURE']
 }),
 lavender:Object.freeze({
  name:'Лаванда узколистная · оригинальная PBR 3D-модель FORMA',
  path:'./assets/landscape-models/lavender-angustifolia-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_lavender_angustifolia.py',
  license:'Original FORMA procedural geometry, no third-party meshes or textures',
  season:'summer',
  fidelity:'FORMA original v3 mobile-optimized PBR Lavender; three true-scale variants, all 573 flower stems and 4360 foliage tufts retained, 444419 triangles total, UV-free vertex payload and original botanical geometry',
  sha256:'d8ad111821ddaae2508a4ef40e0386ab83b0529b2ba4ca8fe67af2bf3bd301d1',
  variants:['LAVENDER_NATURAL','LAVENDER_COMPACT','LAVENDER_MATURE']
 }),
 dogwood:Object.freeze({
  name:'Дёрен белый «Элегантиссима» · три оригинальных PBR 3D-формы FORMA',
  path:'./assets/landscape-models/dogwood-elegantissima-forma-original.glb',
  sourcePage:'https://github.com/zykinigor55-a11y/forma-visual/blob/dom-render-nanobanana/tools/generate_dogwood_elegantissima.py',
  license:'Original FORMA geometry and textures; no 3DDD model files used',
  season:'summer',
  fidelity:'self-authored v9, cream-edged opposite leaves, 3D petioles, darker interior leaves, upright mature canes and three independently modelled PBR crowns',
  sha256:'7eca9000e3473b36303bc8d18b720bdf3ec05323c33a6a54abe48225b15a13a8',
  variants:['DOGWOOD_NATURAL','DOGWOOD_SPHERE','DOGWOOD_BOX']
 })
});
