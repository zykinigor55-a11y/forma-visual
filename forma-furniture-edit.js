/** FORMA / FURNITURE EDIT — bounded local changes only.
 * The selected rectangle is manual, not automatic object segmentation.
 */
const TYPES=Object.freeze({sofa:'sofa or sectional',chair:'chair or armchair',table:'table or desk',bed:'bed',storage:'cabinet or shelving',decor:'decorative interior object',other:'selected furniture or decor object'});
const n=(v,lo,hi)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):NaN;
export function normalizeFurnitureEdit(x){
 if(!x||typeof x!=='object')throw Object.assign(Error('Выделите предмет мебели на изображении.'),{status:400});
 const rect=x.rect||{},box={x:n(rect.x,0,100),y:n(rect.y,0,100),w:n(rect.w,0,100),h:n(rect.h,0,100)};
 if(Object.values(box).some(v=>!Number.isFinite(v))||box.w<3||box.h<3||box.x+box.w>100.1||box.y+box.h>100.1)throw Object.assign(Error('Уточните рамку предмета на фотографии.'),{status:400});
 const type=Object.hasOwn(TYPES,x.type)?x.type:'other';
 return {rect:box,type,scale:n(x.scale,60,140)||100,rotation:n(x.rotation,-15,15)||0,
  note:String(x.note||'').replace(/\s+/g,' ').trim().slice(0,280),hasReference:x.hasReference===true};
}
export function furnitureEditPrompt(spec,{maskProvided=false,referenceProvided=false}={}){
 const x=normalizeFurnitureEdit(spec);
 if(!maskProvided)throw Object.assign(Error('Нужна маска выделенного предмета.'),{status:400});
 if(x.hasReference&&!referenceProvided)throw Object.assign(Error('Загрузите фотографию нового предмета ещё раз.'),{status:400});
 const box=x.rect;
 return [
  'PRECISE LOCAL FURNITURE REPLACEMENT in the existing, APPROVED INTERIOR PHOTO (IMAGE 1). Image 1 is the absolute authority for room layout, the camera and all unchanged scene details.',
  'Replace ONLY the single user-selected '+TYPES[x.type]+' within the transparent portion of the supplied PNG edit mask. The selected region on the original photo is x='+box.x.toFixed(1)+'%, y='+box.y.toFixed(1)+'%, width='+box.w.toFixed(1)+'%, height='+box.h.toFixed(1)+'% (percent of image, top-left origin).',
  'The mask is transparent at the edit region and fully opaque elsewhere. Do not modify ANY opaque pixels or add duplicate furniture. Do not change nearby furnishings, art, floor, wallpaper, geometry, doors, windows, lamps, camera framing, time of day or room exposure.',
  x.hasReference?'IMAGE 2 is the user-uploaded replacement OBJECT ONLY, not a new room, new camera or an image to paste as a flat rectangle. Reconstruct the referenced item three-dimensionally in the existing room with its correct design, upholstery, materials, proportions and perspective.':'No object photo was provided: replace only the selected object according to the user written description, conservatively and without redesigning the room.',
  'Size requested: '+x.scale+'% relative to the selected original object footprint (100% = same approximate overall size). Rotation: '+x.rotation+' degrees relative to its original orientation. Align feet and contact edges to the SAME floor plane, retain reasonable walking clearance, scale to adjacent objects.',
  'Recompute localized contact shadows, reflection, material illumination and occlusion exactly where needed inside the selected mask. Everything outside remains pixel-aligned and unchanged. Never produce text, highlighting, a selection rectangle, watermark, arrows or editing handles.',
  x.note?'Specific user request for the chosen object ONLY: '+JSON.stringify(x.note):'Match a tasteful restrained contemporary interior furniture replacement of the same category. Preserve local scale.',
  'Output one photorealistic image in EXACTLY the input camera view, crop and aspect ratio. No wider panorama, zoom, new angles or room redesign.'
 ].join('\n\n');
}