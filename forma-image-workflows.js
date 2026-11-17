/* Image-only workflows shared by the browser and server. Never infer an unseen building side. */
export const PLAN_2D_STYLES={
 'technical':'Рабочий чертёж',
 'warm':'Материальный фоторендер',
 'zoning':'Схема зонирования',
 'graphite':'Архитектурный коллаж',
 'watercolor':'Акварельный эскиз'
};
export const PLAN_STYLES={modern:'Современный',japandi:'Japandi',minimal:'Минимализм',classic:'Неоклассика',scandi:'Скандинавский',loft:'Лофт'};
export const PLAN_PRESENTATIONS={top:'Фотореалистичный вид сверху',axon:'Объёмная аксонометрия',white:'Белый архитектурный макет',furnished:'План с мебелью'};
const fail=s=>{throw Object.assign(Error(s),{status:400});};
export function normalizeCrop(c){
 if(!c||!['x','y','w','h'].every(k=>Number.isFinite(c[k]))||c.x<0||c.y<0||c.w<.02||c.h<.02||c.x+c.w>1.000001||c.y+c.h>1.000001)fail('Выберите область внутри исходного изображения');
 return Object.fromEntries(['x','y','w','h'].map(k=>[k,c[k]]));
}
export function assertSeriesSource(p){if(p.batchShot==='front'&&!p.batchFrontProvided)fail('Для другого ракурса загрузите его отдельный исходник.');}
export function normalizeImageTask(v){
 if(!v||!['detail','plan','plan2d','room','view'].includes(v.kind))fail('Неизвестная задача изображения');
 const out={kind:v.kind,notes:String(v.notes||'').trim().slice(0,600)};
 if(v.kind==='detail'){out.crop=normalizeCrop(v.crop);out.level=v.level==='macro'?'macro':'close';}
 if(v.kind==='view'){if(!v.hasOwnSource)fail('Для ракурса нужен собственный исходник');out.hasOwnSource=true;}
 if(['plan','plan2d','room'].includes(v.kind)){
  // Never accept a browser-selected model. Server routes plan tasks to
  // its configured GPT image model; no silent Nano Banana fallback.
  out.engine='gpt-image-2.6-sunburst';
  if(v.kind==='plan2d'){
   out.planStyle=v.planStyle||'technical';
   if(!Object.hasOwn(PLAN_2D_STYLES,out.planStyle))fail('Неизвестная 2D-стилистика');
  }else{
   out.style=v.style||'modern';
   if(!Object.hasOwn(PLAN_STYLES,out.style))fail('Неизвестный стиль интерьера');
   if(v.kind==='plan'){out.presentation=v.presentation||'axon';if(!Object.hasOwn(PLAN_PRESENTATIONS,out.presentation))fail('Неизвестная подача плана');}
   else{
    if(!v.room)fail('Выделите комнату на готовом 3D-плане');
    out.room=normalizeCrop(v.room);
    if(!['north','south','east','west'].includes(v.direction))fail('Выберите направление взгляда');
    out.direction=v.direction;
   }
  }
 }
 return out;
}
export function imageTaskPrompt(raw){
 const v=normalizeImageTask(raw),notes=v.notes?' User instruction: '+JSON.stringify(v.notes)+'.':'';
 if(v.kind==='detail')return 'VISIBLE-ONLY ARCHITECTURAL DETAIL — GENERATIVE REDRAW. Virtual camera: move the camera closer along the same viewing direction and aim at ('+ +(100*(v.crop.x+v.crop.w/2)).toFixed(2)+'%, '+ +(100*(v.crop.y+v.crop.h/2)).toFixed(2)+'%) of the full source photograph. The selected region is the photographic target; explicitly resolve the object or surface named in the user instruction. Make a new close-range photographic capture, with true optical-looking edge resolution, material grain at the new viewing scale and physically coherent local shading. Keep the target recognizable; no new design. Image 1 is the exact selected crop and defines the entire output frame; Image 2 is the complete current photograph for material and lighting context only. Re-render Image 1 as a new high-resolution photograph with genuinely resolved fine surface detail. Do not merely enlarge, interpolate, sharpen, denoise or apply an unsharp mask to the blurry input. Replace blur and compression with plausible crisp material microtexture: stone grain and pores, wood fibres, plaster granules or metal finish only where that material already exists. Maintain natural photographic detail without halos, exaggerated relief, plastic smoothing or repetitive artificial texture. Preserve the original viewing side, visible silhouette and perspective relationships, silhouettes, proportions, all material boundaries, joints, existing objects, shadows and illumination. Keep existing joints at their exact positions; never add construction seams or fittings. NEVER reveal an unseen side, move around a corner, invent architecture, add windows or furniture, orbit or rotate the camera to reveal new surfaces, or zoom out to the full context. '+(v.level==='macro'?'MACRO MATERIAL STUDY: resolve fine grain and pores across the visible surfaces at close inspection, while keeping the exact crop composition and architectural geometry.':'ARCHITECTURAL CLOSE-UP: resolve clean architectural edges and realistic fine material grain at a believable scale, keeping the exact crop composition.')+' Missing microscopic information must be synthesized as a plausible material interpretation, never presented as recovered factual detail.'+notes;
 if(v.kind==='view')return 'CONSISTENT PROJECT SERIES. Image 1 is this view’s own authoritative model screenshot: match its camera, geometry, all openings and existing material divisions. Image 2 is the approved master photograph for the site’s materials, vegetation species, light, season and color response. Reuse visible landmarks where supported by the new source; do not invent unseen parts or copy the master camera. No redesign, diagram or collage.'+notes;
 if(v.kind==='plan2d'){
  // A presentation concept changes the entire GRAPHIC METHOD, not simply hue.
  // In every concept the input's structural geometry is an immutable reference.
  const profiles={
   technical:'PROFESSIONAL WORKING DRAWING: strict two-dimensional measured architectural CAD convention on white paper. Strong black poche for cut walls, fine gray furniture symbols, precise opening and door-swing lines, thin line-weight hierarchy, scale and dimension strings ONLY if explicitly legible in source. No textures, cinematic shadows or render props. Readability for architects and construction is the purpose.',
   warm:'PHOTOREALISTIC MATERIAL PLAN: true nadir orthographic architectural photograph-like rendered 2D floor plan, with correct scale real light-oak floorboard micrograin, ceramic or natural stone tile in wet rooms, material transitions at existing walls, realistic overhead upholstered furniture, fine soft contact shadows, sunlight from one coherent direction and accurate global illumination. Premium real-estate / interior design presentation. Unlike a CAD drawing, it reads as a photographic material board while wall geometry remains exactly fixed.',
   zoning:'PROGRAM / FUNCTION / CIRCULATION DIAGRAM: retain exact source wall linework as foreground but visually de-emphasize furniture. Fill ONLY existing enclosed room regions with distinct low-saturation semantic colors based on room functions (social, private, service, circulation). Layer translucent functional areas, numbered zone marks, a visually restrained path-of-movement diagram aligned to actual existing door openings, and a compact legend ONLY for reliable recognizable room functions. This explains how the plan works, not materials, mood or interior style.',
   graphite:'ARCHITECTURAL EDITORIAL COLLAGE: top-down cut-paper architectural presentation board with layered matte stock, carefully clipped material samples inside actual unchanged room boundaries, refined pencil/ink edges, occasional thin leader callouts to supported material changes, organically imperfect paper borders and restrained inset swatches in the free margin. An atmospheric magazine-portfolio presentation, NOT monochrome night-mode technical drawing. Every wall and opening stays pixel-registered with the source.',
   watercolor:'HAND-RENDERED CONCEPT SKETCH: genuine architectural ink-and-watercolor graphic in true top view. Transparent botanical-earth-tone watercolor washes localized to existing rooms, restrained soft bleed and paper grain ONLY in color areas, fine hand-ink outlines accurately following the original structural walls, loose but legible furniture brush forms, small natural sketches only in existing open exterior areas. Warm competition / early concept mood; never blur exact walls or create extra furniture.'
  };
  return 'SAME ARCHITECTURAL FLOOR PLAN, FIVE DISTINCT PROFESSIONAL COMMUNICATION CONCEPTS — user selected ONE concept. Reconstruct Image 1 with identical walls, openings, doors, windows, furniture and ROOM TOPOLOGY. Image 1 is an immutable coordinate-level floor plan: preserve each outer wall and interior wall path, corner, wall thickness, door opening and swing, window center/width, room adjacency, furniture footprint, labels that are legible and relative proportions. No geometry additions, no new balconies, stairs, patios, doors, windows or invented dimensional figures. Do not rotate, crop differently, tilt, change scale or introduce isometric perspective. STRICT ORTHOGRAPHIC NADIR 2D PLAN in all five concepts. GRAPHIC PRESENTATION MODE: '+profiles[v.planStyle]+'. The five styles differ in their visual COMMUNICATION LANGUAGE, hierarchy, texture rendering, annotations, lighting and graphic purpose — NOT just a palette change. If the original plan lacks a material, use a restrained neutral, not an invented new room design. All decorative edits only; geometry lock always outranks aesthetics. Avoid gibberish texts; preserve clearly legible labels only. Deliver ONE polished 2K single-plan image, identical proportions and framing as Image 1 with no surrounding app UI or new measurement claims.'+notes;
 }
 const lock='The original 2D plan is the authority for wall locations, room count, doors, windows, circulation and relative dimensions. Preserve all layout topology. Do not merge rooms, move openings, remove walls or invent extensions. Output one image without UI, dimensions or decorative text. Interior style: '+PLAN_STYLES[v.style]+'. ';
 if(v.kind==='room')return 'SELECTED ROOM → ARCHITECTURAL INTERIOR PHOTOGRAPH. Image 1 is the APPROVED 3D AXONOMETRIC or top-down visualized floor plan, authoritative for the furnished room appearance, walls, openings and materials. Image 2 is a MARKED COPY of that exact 3D view: the colored selection rectangle identifies the ONE room the user wants (normalized rectangle '+JSON.stringify(v.room)+'). The marker is instructions ONLY; do not render any rectangle, outlines, text or arrows. Image 3, when supplied, is the original 2D architectural plan, authoritative for room topology, doors, windows and relative size. Reconstruct ONE believable professional eye-level architectural INTERIOR PHOTOGRAPH taken INSIDE the selected room, not a crop or zoom of the 3D plan. Camera faces '+v.direction+' relative to the top side of the original 2D plan. The user-selected area is the only requested room. Preserve visible wall junctions, room proportions, window/door locations, realistic ceiling heights, furniture pieces and material identity supported by references; keep circulation clear. Do not invent architectural details that contradict the 2D plan; when unseen details are necessary, use restrained plausible interpretation. Premium natural materials, photorealistic daylight, physically accurate soft shadows and realistic architectural lens with corrected verticals. Output only one interior photo — no other rooms, dollhouse, plan, overlays, collage, dimension text or floating furniture. Interior style: '+PLAN_STYLES[v.style]+'.'+notes;
 const style={top:'strict orthographic top-down furnished photographic floor plan; roof removed, all rooms readable',axon:'architectural axonometric cutaway, roof removed and near walls cut to reveal every room, coherent depth',white:'clean white architectural physical model, axonometric cutaway, neutral matte surfaces and soft contact shadows',furnished:'readable top-down furnished plan, realistic materials, furniture at believable scale'}[v.presentation];
 return lock+'Convert this plan into '+style+'. Existing furniture symbols guide placement; finish empty rooms conservatively in the requested style. Keep one coherent light direction and precise wall boundaries.'+notes;
}

export function assertFrameBinding(current,bound){
 if(!current||!bound||current.demo||!current.hasSource)fail('Загрузите собственное исходное изображение');
 if(current.projectId!==bound.projectId||current.sourceKey!==bound.sourceKey||(current.renderId||null)!==(bound.renderId||null))fail('Проект или исходный кадр изменились. Откройте раздел заново.');
}
export function assertRoomReady(s){
 if(!s.planResult||!s.planApproved)fail('Сначала проверьте и утвердите объёмный план');
 if(!s.roomSelected||s.viewImage!==s.planResult)fail('Выделите комнату на утверждённом 3D-плане');
}
