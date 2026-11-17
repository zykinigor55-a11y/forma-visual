/** FORMA / plan illustration via GPT Image 2.6.
 * Exact geometric SVG masterplan is the legal/source plan; AI output is
 * presentation-only and may NOT be used to calculate dimensions.
 */
const clean=s=>String(s??'').replace(/\s+/g,' ').slice(0,250);
const accepted=new Set(['natural','modern','architectural']);
export function masterplanPrompt(input){
 if(!input||typeof input!=='object')throw Object.assign(Error('Не передан план участка.'),{status:400});
 const site=input.site,house=input.house;
 const w=Number(site?.width),h=Number(site?.height);
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<5||h<5||w>500||h>500)throw Object.assign(Error('Укажите реальные габариты участка в метрах.'),{status:400});
 if(!Number.isFinite(Number(house?.width))||!Number.isFinite(Number(house?.height))||Number(house.width)<2||Number(house.height)<2)throw Object.assign(Error('Укажите размеры здания.'),{status:400});
 const count=Array.isArray(input.objects)?Math.min(input.objects.length,500):0;
 const style=accepted.has(input.style)?input.style:'natural';
 return [
  'PROFESSIONAL ARCHITECTURAL LANDSCAPE MASTERPLAN PRESENTATION — TRUE ORTHOGRAPHIC 90-DEGREE STRAIGHT-DOWN AERIAL VIEW. THIS IS AN ILLUSTRATION OF AN ALREADY-DIMENSIONED PLAN, NOT A NEW LANDSCAPE DESIGN.',
  'IMAGE 1 is the ALREADY FIXED, measured top-down landscape plan. It is the sole geometry authority for plot shape, building location and rotation, roof footprint, path centreline, path widths, paved areas, lawns, gravel, planting centres, existing boulders, garden luminaires and pond shapes. Re-render this exact plan with high-end photographic top-down textures while maintaining pixel-aligned positions, shapes, scale and sizes. Do not change, add, remove, move or duplicate any object.',
  'The plot is '+w.toFixed(2)+'m by '+h.toFixed(2)+'m bounding dimensions. The main building footprint is '+Number(house.width).toFixed(2)+'m by '+Number(house.height).toFixed(2)+'m. Number of editable objects recorded in the plan: '+count+'. These are external reference metadata only, not instructions to draw a fixed number of new objects.',
  'The top-down view must be truly NADIR and ORTHOGRAPHIC: no perspective, no oblique trees, no sideways shrubs, no house facade elevations. Show the ROOF from directly overhead with physically accurate ridge direction, slopes, gutters, chimney only if present, eaves and roof material. Buildings must NOT be flat placeholder boxes. Include real-looking tree crowns, shrub canopies, distinct gravel and paving grains, realistic turf, water ripples and natural boulders as seen from a drone pointed exactly downward.',
  'All trees, shrubs and boulders have only top-down crowns or top surfaces. All outdoor lights must be GROUND, PAVING or POST-MOUNTED, never wall sconces. Their top surfaces or realistic subtle pool of light are visible from overhead. No wall-mounted lighting anywhere.',
  'Preserve original path WIDTH everywhere, and exact paving boundaries and interfaces with lawns, mulch and planting beds. Do not widen paths, invent intersections, scale plants, distort lot edges or move the main building.',
  'Style: '+({natural:'natural layered botanical realism, restrained park landscaping',modern:'restrained premium modern landscape, precise stone surfaces and natural tree crowns',architectural:'clean refined architectural competition-board top-down photoreal presentation'})[style]+'. Color grading neutral, physically correct species scale and credible ground textures. Each individual leaf and rock should be legible in the foreground; no painted cartoon icons.',
  'Image 2 if supplied is a user-uploaded photograph of the EXACT proposed main building. Use that photo for its authentic roof materials and visible roof geometry ONLY. Image 1 continues to dictate the footprint and exact overhead position. Infer missing roof parts carefully, never introduce an unsupported window, storey or structural extension. If no overhead roof geometry is supplied, unknown roof slopes are approximate.',
  'No labels, measurements, rulers, north arrows, symbols, decorative frames, legend, logo, watermark or UI in the AI result. The application draws those geometrically from the source data, independently and accurately. No text.',
  'OUTPUT: one sharp photorealistic 2K straight-down plan background matching Image 1 exactly. Changes to spatial relationships are an error. This AI output is presentation art only, not a measured CAD file.'
 ].join('\n\n');
}
export function topDownRoofPrompt(info){
 const width=Number(info?.width),height=Number(info?.height);
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<2||height<2||width>60||height>60)throw Object.assign(Error('Для кровли необходимы проверенные размеры здания.'),{status:400});
 return [
  'HIGH-END HYPERREAL ORTHOGRAPHIC NADIR 90-DEGREE ROOF TEXTURE OF THE SAME BUILDING IN IMAGE 1. No perspective or oblique views, no visible facade walls, only top of the building. Match roof material, actual color, eaves, gutter design, roof slope count and ridge direction using the uploaded photograph. Building footprint '+width.toFixed(2)+'m by '+height.toFixed(2)+'m (real coordinates controlled by the landscape editor).',
  'Image 2 if supplied is a building ROOF PLAN and overrides guesses for precise roof geometry; the source photo only defines roof surface appearance. Never invent dormers, skylights, chimneys or extra volumes not supported by the source materials.',
  'Generate a hyper-detailed realistic roof isolated against a UNIFORM dark charcoal background, at centre, with wide margins. No garden, no surrounding trees, no labels, dimensions or text. The architectural vector editor will handle scale, rotation and placement. This is a presentation texture, not a substitute for verified roof measurements.'
 ].join('\n\n');
}
