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
  fidelity:'self-authored Berberis with alpha-cutout vein textures on attached burgundy leaves, thorny twigs and red fruit; 76,628 triangles; original GLB, not photo scan',
  sha256:'87aaa5f8351a0bef5e674aaa54b0a694cd1d27385f20fd887f65ab1e5a5388e5'
 })
});
