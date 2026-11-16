/* Image-only workflows shared by the browser and server. Never infer an unseen building side. */
export const PLAN_STYLES={modern:'Современный',japandi:'Japandi',minimal:'Минимализм',classic:'Неоклассика',scandi:'Скандинавский',loft:'Лофт'};
export const PLAN_PRESENTATIONS={top:'Фотореалистичный вид сверху',axon:'Объёмная аксонометрия',white:'Белый архитектурный макет',furnished:'План с мебелью'};
const fail=s=>{throw Object.assign(Error(s),{status:400});};
export function normalizeCrop(c){
 if(!c||!['x','y','w','h'].every(k=>Number.isFinite(c[k]))||c.x<0||c.y<0||c.w<.02||c.h<.02||c.x+c.w>1.000001||c.y+c.h>1.000001)fail('Выберите область внутри исходного изображения');
 return Object.fromEntries(['x','y','w','h'].map(k=>[k,c[k]]));
}
export function assertSeriesSource(p){if(p.batchShot==='front'&&!p.batchFrontProvided)fail('Для другого ракурса загрузите его отдельный исходник.');}
export function normalizeImageTask(v){
 if(!v||!['detail','plan','room','view'].includes(v.kind))fail('Неизвестная задача изображения');
 const out={kind:v.kind,notes:String(v.notes||'').trim().slice(0,600)};
 if(v.kind==='detail'){out.crop=normalizeCrop(v.crop);out.level=v.level==='macro'?'macro':'close';}
 if(v.kind==='view'){if(!v.hasOwnSource)fail('Для ракурса нужен собственный исходник');out.hasOwnSource=true;}
 if(v.kind==='plan'||v.kind==='room'){
  out.engine=v.engine||'gpt-image-2.6-sunburst';if(!['gpt-image-2.6-sunburst','gpt-image-2.6-flare','nano-banana-2.1'].includes(out.engine))fail('Неизвестная модель');
  out.style=v.style||'modern';if(!Object.hasOwn(PLAN_STYLES,out.style))fail('Неизвестный стиль интерьера');
  if(v.kind==='plan'){out.presentation=v.presentation||'axon';if(!Object.hasOwn(PLAN_PRESENTATIONS,out.presentation))fail('Неизвестная подача плана');}
  else{if(!v.room)fail('Выделите комнату на исходном плане');out.room=normalizeCrop(v.room);if(!['north','south','east','west'].includes(v.direction))fail('Выберите направление взгляда');out.direction=v.direction;}
 }
 return out;
}
export function imageTaskPrompt(raw){
 const v=normalizeImageTask(raw),notes=v.notes?' User instruction: '+JSON.stringify(v.notes)+'.':'';
 if(v.kind==='detail')return 'VISIBLE-ONLY ARCHITECTURAL DETAIL — GENERATIVE REDRAW. Virtual camera: move the camera closer along the same viewing direction and aim at ('+ +(100*(v.crop.x+v.crop.w/2)).toFixed(2)+'%, '+ +(100*(v.crop.y+v.crop.h/2)).toFixed(2)+'%) of the full source photograph. The selected region is the photographic target; explicitly resolve the object or surface named in the user instruction. Make a new close-range photographic capture, with true optical-looking edge resolution, material grain at the new viewing scale and physically coherent local shading. Keep the target recognizable; no new design. Image 1 is the exact selected crop and defines the entire output frame; Image 2 is the complete current photograph for material and lighting context only. Re-render Image 1 as a new high-resolution photograph with genuinely resolved fine surface detail. Do not merely enlarge, interpolate, sharpen, denoise or apply an unsharp mask to the blurry input. Replace blur and compression with plausible crisp material microtexture: stone grain and pores, wood fibres, plaster granules or metal finish only where that material already exists. Maintain natural photographic detail without halos, exaggerated relief, plastic smoothing or repetitive artificial texture. Preserve the original viewing side, visible silhouette and perspective relationships, silhouettes, proportions, all material boundaries, joints, existing objects, shadows and illumination. Keep existing joints at their exact positions; never add construction seams or fittings. NEVER reveal an unseen side, move around a corner, invent architecture, add windows or furniture, orbit or rotate the camera to reveal new surfaces, or zoom out to the full context. '+(v.level==='macro'?'MACRO MATERIAL STUDY: resolve fine grain and pores across the visible surfaces at close inspection, while keeping the exact crop composition and architectural geometry.':'ARCHITECTURAL CLOSE-UP: resolve clean architectural edges and realistic fine material grain at a believable scale, keeping the exact crop composition.')+' Missing microscopic information must be synthesized as a plausible material interpretation, never presented as recovered factual detail.'+notes;
 if(v.kind==='view')return 'CONSISTENT PROJECT SERIES. Image 1 is this view’s own authoritative model screenshot: match its camera, geometry, all openings and existing material divisions. Image 2 is the approved master photograph for the site’s materials, vegetation species, light, season and color response. Reuse visible landmarks where supported by the new source; do not invent unseen parts or copy the master camera. No redesign, diagram or collage.'+notes;
 const lock='The original 2D plan is the authority for wall locations, room count, doors, windows, circulation and relative dimensions. Preserve all layout topology. Do not merge rooms, move openings, remove walls or invent extensions. Output one image without UI, dimensions or decorative text. Interior style: '+PLAN_STYLES[v.style]+'. ';
 if(v.kind==='room')return lock+'Image 1 is the original 2D plan. Image 2, if supplied, is its approved furnished plan visualization for finishes and furniture consistency. Render a photographic eye-level interior view INSIDE the selected room, normalized bounds '+JSON.stringify(v.room)+', looking towards '+v.direction+' relative to the top of the original plan. Only show architecture supported by the plan, avoid inventing hidden architectural details; use approved furniture/material identity.'+notes;
 const style={top:'strict orthographic top-down furnished photographic floor plan; roof removed, all rooms readable',axon:'architectural axonometric cutaway, roof removed and near walls cut to reveal every room, coherent depth',white:'clean white architectural physical model, axonometric cutaway, neutral matte surfaces and soft contact shadows',furnished:'readable top-down furnished plan, realistic materials, furniture at believable scale'}[v.presentation];
 return lock+'Convert this plan into '+style+'. Existing furniture symbols guide placement; finish empty rooms conservatively in the requested style. Keep one coherent light direction and precise wall boundaries.'+notes;
}

export function assertFrameBinding(current,bound){
 if(!current||!bound||current.demo||!current.hasSource)fail('Загрузите собственное исходное изображение');
 if(current.projectId!==bound.projectId||current.sourceKey!==bound.sourceKey||(current.renderId||null)!==(bound.renderId||null))fail('Проект или исходный кадр изменились. Откройте раздел заново.');
}
export function assertRoomReady(s){
 if(!s.planResult||!s.planApproved)fail('Сначала проверьте и утвердите объёмный план');
 if(!s.roomSelected||s.viewImage!==s.source&&s.viewImage!=null)fail('Выделите комнату на исходном плане');
}
