/** FORMA CAMERA ORBIT — world-anchored architecture and environment.
 * Camera inference from one flat photograph is approximate; a new CAD view is authoritative when supplied.
 */
const DIRECTIONS=Object.freeze({left:'counterclockwise to CAMERA-LEFT',right:'clockwise to CAMERA-RIGHT'});
const ANGLES=new Set([30,45,90]);
export function normalizeCameraOrbit(input){
 if(!input||typeof input!=='object')throw Object.assign(Error('Выберите направление нового ракурса.'),{status:400});
 const direction=String(input.direction||'');
 const degrees=Number(input.degrees);
 const sourceMode=input.sourceMode==='cad'?'cad':'inferred';
 if(!Object.hasOwn(DIRECTIONS,direction)||!ANGLES.has(degrees))throw Object.assign(Error('Доступен поворот камеры на 30°, 45° или 90° влево или вправо.'),{status:400});
 return {direction,degrees,sourceMode};
}
export function cameraOrbitPrompt(request,{referenceProvided=false}={}){
 const v=normalizeCameraOrbit(request);
 if(v.sourceMode==='cad'&&!referenceProvided)throw Object.assign(Error('Для точного ракурса загрузите CAD-скриншот нового вида.'),{status:400});
 const anchor=[
  'SAME BUILDING + SAME WORLD ANCHOR: IMAGE 1 is the approved previous architectural PHOTO, containing the exact approved house design, facade palette, landscaping species, specific tree identities, ground plane, pathways, fences, pool, rocks, terrace, driveways and light/weather/season.',
  'THIS IS NOT A NEW ARCHITECTURAL PROJECT OR ANOTHER LANDSCAPE. Treat the visible world as one fixed three-dimensional scene. Move only the virtual camera; do not shuffle the site objects as decorations.',
  'WORLD-SPACE CONTINUITY IS CRITICAL: a tree behind the right house corner remains behind that physical corner; a path ending at the porch still ends there; a pond, gate, fence and planting bed retain their positions, spacing and size relative to the building and one another. Their SCREEN positions naturally change due to parallax and occlusion, not because the site layout has been rearranged.',
  'REPROJECT every landmark through the new camera angle, maintaining approximate world coordinates, plausible parallax, shared scale, silhouettes and shadows. Keep season, sky character, time of day, lighting direction and species identical unless physically altered by visibility.',
  'Keep house materials exactly as approved in IMAGE 1: cladding, colors, stone, roof, windows, doors, trims, drainage, terrace finish and any visible special details. Keep physical real-world sizes and construction logic stable.',
  'NO new houses, roof shapes, windows, doors, garden elements, cars, pools, paths or decorative plantings; do not replace trees with random species or copy a flat background. Never flip or mirror the scene.',
  'Any newly revealed surfaces that are not documented by the input images are hypotheses, NOT established geometry: infer conservatively and avoid unsupported detailed claims. If geometry accuracy matters, require a separate CAD screenshot from the requested new viewpoint.',
  'Deliver ONE natural professional architectural photograph. No split screen, duplicate buildings, collage, picture-in-picture, overlays, text, arrows, wireframes, AI artifacts or camera-control marks.'
 ];
 const movement='CAMERA MOVE: orbit '+v.degrees+' degrees '+DIRECTIONS[v.direction]+' around the SAME house, with the same camera height, field-of-view character and approximate subject distance. Camera position changes; geometry and objects do not.';
 if(v.sourceMode==='cad')return [
  'TWO-REFERENCE CAMERA-LOCKED ORBIT. IMAGE 1 is the previously APPROVED photographed scene and unique source of the world layout, authentic material palette, lighting, vegetation identities and atmosphere.',
  'IMAGE 2 is the user-uploaded CAD/SketchUp/Revit screenshot FROM THE REQUESTED NEW CAMERA ANGLE. IMAGE 2 is the strict source of the new camera framing, house geometry, outlines, roof, openings and visible construction. IMAGE 2 is NOT a source for landscape redesign or replacement of approved facade materials.',
  movement,
  ...anchor,
  'FINAL CAMERA: reproduce the new view and geometry of IMAGE 2 while transferring the SAME WORLD-SPACE landscaping, materials and lighting from IMAGE 1 to the locations their objects occupy when reprojected around the house. Do not simply overlay Image 1 onto Image 2. If an object becomes occluded, omit its hidden parts; never force all landmarks into view.'
 ].join('\n\n');
 return [
  'APPROXIMATE SINGLE-PHOTO CAMERA ORBIT — NO OTHER CAD VIEW SUPPLIED. IMAGE 1 is the approved photorealistic house and world layout. This task is an inferred new view, not a dimensional survey.',
  movement,
  ...anchor,
  'Reconstruct approximate hidden views cautiously. Reproject ground and all identifiable site landmarks as rigid positions relative to the SAME house. Do not merely crop, pan, flip or rotate the 2D photograph in-place, and do not generate a wholly different garden.',
  'Output perspective must DIFFER visibly from IMAGE 1 while remaining plausible. State no claim of exact unseen-side architecture in image.'
 ].join('\n\n');
}
