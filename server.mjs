import {interiorLightsPrompt} from './forma-interior-light-contract.js';
import {cameraOrbitPrompt} from './forma-camera-orbit.js';
import {furnitureEditPrompt} from './forma-furniture-edit.js';
import {masterplanPrompt,perspectiveLandscapePrompt,topDownRoofPrompt} from './forma-landscape-project-prompts.js';
/**
 * ДОМ.РЕНДЕР – minimal local Node 20+ server + OpenAI Images Edit proxy.
 * Keeps API keys on the server, not in the browser. Prototype, not public multi-tenant service.
 */
import http from 'node:http';
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {apiMarketEdit} from './api-market.mjs';
import {createRenderJobQueue} from './forma-render-jobs.mjs';
import {createEnhancementPrompt} from './forma-enhancement-prompt.js';
import {landscapePrompt,atmospherePrompt,normalizeAtmosphere,materialTextPrompt,materialCropPrompt} from './forma-art-direction-core.js';
import {imageTaskPrompt,normalizeImageTask,assertSeriesSource} from './forma-image-workflows.js';
import {createPlanVision,visionStatus} from './plan-vision.mjs';
import {createWanVideo} from './wan-video.mjs';
import {createWan3Video} from './wan3-video.mjs';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Optional simple local .env parser (no external packages). Environment variables win.
try {const dotenv=await readFile(path.join(ROOT,'.env'),'utf8');for(const line of dotenv.split(/\r?\n/)){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}} catch {}
const previewPort=process.argv.indexOf('--port');
const PORT=Number(process.env.PORT)||Number(previewPort>=0?process.argv[previewPort+1]:0)||3000;
const HOST=process.env.HOST||'127.0.0.1';
const API_KEY=process.env.API_MARKET_KEY||'';
const MODEL='nano-banana-2.1';
const PLAN_IMAGE_MODEL=['gpt-image-2.6-sunburst','gpt-image-2.6-flare'].includes(process.env.PLAN_IMAGE_MODEL)?process.env.PLAN_IMAGE_MODEL:null;
// FORMA Landscape Project uses GPT Image 2.6, without a Nano Banana fallback.
const LANDSCAPE_IMAGE_MODEL=['gpt-image-2.6-sunburst','gpt-image-2.6-flare'].includes(process.env.LANDSCAPE_IMAGE_MODEL)?process.env.LANDSCAPE_IMAGE_MODEL:'gpt-image-2.6-sunburst';
// No shared PIN: the public preview uses server-side usage limits instead.
const DAILY_CAP=Math.min(200,Math.max(1,Number(process.env.DAILY_GENERATION_LIMIT)||12));
const PUBLIC_SUPPORT_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PUBLIC_SUPPORT_EMAIL||'')?process.env.PUBLIC_SUPPORT_EMAIL:'';
let dailyCount=0, day=new Date().toISOString().slice(0,10);
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;const host=req.headers.host;try{return new URL(origin).host===host}catch{return false}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const MAX_BODY=44*1024*1024; // Up to two full-quality 12MB references plus edit metadata; each file also capped at 14MB.
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload))}
async function readJSON(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){const err=Error('Запрос слишком большой');err.status=413;throw err}chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{const err=Error('Некорректный JSON');err.status=400;throw err}}
function imageBlob(data,field){if(!data)return null;const m=String(data).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+\/=]+)$/);if(!m)throw Object.assign(Error(`Некорректное изображение: ${field}`),{status:400});const bytes=Buffer.from(m[2],'base64');if(bytes.length>14*1024*1024||bytes.length<100)throw Object.assign(Error(`Неверный размер: ${field}`),{status:400});const type=m[1]==='jpeg'?'image/jpeg':`image/${m[1]}`;return new Blob([bytes],{type})}
function compact(str,limit=180){return String(str||'').slice(0,limit).replace(/\s+/g,' ').trim()}
/**
 * Shared photographic direction appended to EVERY image generation prompt:
 * first render, edited surface, all four batch shots, and post-render scenes.
 * Camera specifications guide realistic image formation, never override the
 * supplied lens geometry/crop or imply an actual physical camera was used.
 */
function photographicDirection(p){
 const b=p.brief||{};
 if(b.sceneType==='interior')return 'PROFESSIONAL INTERIOR ARCHITECTURAL PHOTOGRAPHY: photographic capture style resembling Nikon Z8 or Sony A7R V with corrected architectural verticals, accurate original source viewpoint and physically realistic full-frame exposure. True-to-life colors, balanced highlight retention in windows and lamps, accurate room proportions, crisp material microdetails without CGI appearance. Camera position, crop and architecture stay exactly as in the source; interior lens choice must never alter geometry or furniture arrangement.';
 const variant=String(p.sceneVariation||'').toLowerCase();
 const mood=String(b.sceneMood||'').toLowerCase();
 const weather=String(b.weather||'').toLowerCase();
 const season=String(b.season||'').toLowerCase();
 const time=String(b.time||'').toLowerCase();
 const shot=String(p.batchShot||'').toLowerCase();
 const art=normalizeAtmosphere(b.atmosphere),selectiveFocus=art&&art.strength>0&&art.dof>0;
 const isDetail=shot==='detailentry'||shot==='detailmaterial';
 // A post-render scene variant intentionally overrides the weather/season of
 // the source render; never let an original overcast/daytime mood override it.
 const evening=variant
  ?variant==='evening'||variant.endsWith('_evening')
  :['blue','night','golden'].includes(mood)||/вечер|сумерк|ночь|blue.hour|twilight|evening|night/i.test(time);
 const winter=variant?variant.startsWith('winter'):/зима|winter/i.test(season);
 const cloudy=variant?variant.endsWith('_overcast'):['fog','overcast','rain'].includes(mood)||/пасмур|облач|дожд|туман|overcast|cloud|rain|fog/i.test(weather);
 const sunny=variant?variant.endsWith('_sunny'):['sunny','golden'].includes(mood)||/солнеч|ясно|sunny|clear/i.test(weather);
 let camera;
 let exposure;
 if(selectiveFocus){
  camera='Nikon Z8 full-frame camera with professional source-matching photographic optics; the original camera and field of view remain fixed.';
  exposure='Use exposure appropriate to the selected weather and time. Aperture and focus follow the selected optical depth-of-field instructions below; the primary architecture remains sharp while near/far out-of-focus planes are treated optically.';
 }else if(isDetail){
  camera='Nikon Z8 full-frame mirrorless camera with NIKKOR Z MC 105mm f/2.8 VR S macro optics; a close-up architectural detail photograph, deep enough focus to resolve material relief, without synthetic macro blur.';
  exposure='Use approximately f/8–f/11 with light-appropriate shutter and ISO 64–200; focus stacking is acceptable ONLY if it preserves the reference framing and true construction edges.';
 }else if(evening){
  camera='Sony Alpha 7R V full-frame camera with Sony FE 24–70mm F2.8 GM II professional zoom; use the source-matching architectural field of view, typically 24–35mm full-frame equivalent.';
  exposure='Tripod-based blue-hour/exterior exposure, approximately f/5.6–f/8, ISO 100–400 and a physically plausible slower shutter. Balance residual cool sky with warm existing practical lights; avoid blown-out windows and pitch-black walls.';
 }else if(winter){
  camera='Canon EOS R5 Mark II full-frame camera with Canon RF 24–70mm F2.8 L IS USM lens; use the existing source-matching perspective, typically 24–35mm full-frame equivalent.';
  exposure='Approximately f/8, ISO 100–200, shutter speed set by genuine scene luminance; protect snow highlights from clipping and keep clear detail in darker facades.';
 }else if(cloudy){
  camera='Sony Alpha 7R V full-frame camera with Sony FE 24–70mm F2.8 GM II lens; professional straight-line architectural image with the source-matching focal length.';
  exposure='Approximately f/8, ISO 100–200, shutter adapted to soft overcast illuminance; maintain neutral white balance, soft shadows and detailed midtones.';
 }else if(sunny){
  camera='Canon EOS R5 Mark II full-frame camera with Canon RF 24–70mm F2.8 L IS USM lens; use the source-matching field of view, commonly 28–35mm equivalent.';
  exposure='Approximately f/8, ISO 100, shutter adjusted to actual daylight; preserve highlights, physically consistent direct sunlight and sharp but natural shadows.';
 }else{
  camera='Nikon Z8 full-frame mirrorless camera with NIKKOR Z 24–70mm f/2.8 S professional lens; use the lens field of view matching the source, typically 24–35mm full-frame equivalent.';
  exposure='Approximately f/8, ISO 64–100, shutter and white balance calibrated to the actual season, weather and time; realistic depth of field across the building and landscaping.';
 }
 const capture='REAL ARCHITECTURAL PHOTO / CAMERA PROFILE: Render the visual character of a high-resolution photograph CAPTURED AS IF using a '+camera+' '+exposure+' The supplied image dictates the camera position, lens perspective, horizon, vertical alignment, framing and all geometry (except an explicitly requested approximate new frontal view). Camera/lens/EXIF are quality references only: DO NOT move the camera, crop, warp perspective, invent architectural features, insert a camera, show an EXIF caption, or change any building shape to imitate a focal length. Keep verticals naturally straight, with realistic optical contrast and no unnatural wide-angle distortion.';
 const materials='ULTRA-DETAILED, MATERIAL-ACCURATE SURFACES: Preserve material identity and construction assembly in the actual input. On timber/logs/glulam reveal realistic directional grain, subtle annual rings, joints and wood fibers at correct physical scale; on brick reveal irregular mineral pores and accurate mortar joints; on natural stone/slate show believable layered fractures, veins, chips and roughness; on plaster/concrete show fine aggregate, grain and restrained micro-variation; on metal roof/cladding preserve every real seam/ridge and physically correct fine specular reflections; on painted frames/uPVC preserve actual profiles and precise edges; on glass show true transparency plus angle-dependent reflections, interior depth and appropriate Fresnel response. Render paving, gravel, soil, lawn and decking with individually distinguishable microtextures. Materials must NOT be changed, artificially recolored or newly assigned except where explicitly specified by the user or required by the chosen seasonal variation. No invented planks, joints, pipes, gutters, railings, windows or roof changes.';
 const plants='BOTANICAL PHOTOGRAPHY / VEGETATION MICRODETAIL: High-frequency natural detail in individual grass blades, clumps, leaf veins, realistic leaf sizes, fine branches, needles, bark fissures, moss and groundcover; plausible plant species and growth, varied green/ochre hues, realistic subsurface transmission through thin leaves, optical occlusion between leaves, contact shadows at roots, and believable plant spacing. Distinguish conifer needles, barberry leaves, willow branches, fruit-tree foliage, etc. WHERE ACTUALLY PRESENT; never add an unrequested species. Maintain exact existing tree/plant locations and silhouettes as far as visible. In autumn alter only seasonal deciduous foliage and fallen leaves; in winter respect leafless deciduous trees, snow weights and evergreen conifers. No plastic-looking identical shrubs, duplicated foliage, painterly smear, repeated leaf textures or impossibly sharp distant vegetation.';
 const light='PHYSICALLY COHERENT LIGHT TRANSPORT: One believable sky/sun and weather state; correct solar direction and shadow lengths, natural skylight bounce, soft ambient fill, realistic contact and occlusion shadows, energy-conserving diffuse/specular response, correct wet or dry roughness, subtle reflection in glass and stone, credible shadow softness for clouds and proper warm/cool mixed lighting at dusk. Artificial fixtures and window light illuminate nearby walls, paving and foliage with realistic falloff without turning daytime into night. Preserve dimensional texture with nuanced highlights; no flat ambient wash, neon glow, black shadows, glowing tree bark, forced HDR or oversaturation.';
 const finish=selectiveFocus?'PHOTOGRAPHIC CLARITY: preserve sharply resolved primary architecture and material microdetail at native output resolution. Selected optical depth of field governs foreground and background; do not blur or change the building. No oversharpening halos or plastic texture.':'PROFESSIONAL EDGE-TO-EDGE PHOTOGRAPHIC CLARITY / NATIVE PIXEL DETAIL: Render a genuinely crisp high-resolution architectural photograph with physically plausible, finely resolved detail across the entire depth of the building and landscape; use f/8-style deep architectural depth of field instead of portrait bokeh. Preserve every visible brick joint, mortar grain, individual wood fiber and glulam seam, slate lamination, roof rib, window reveal, bevel, glass reflection, stone pore, paving joint, leaf silhouette, needle cluster, twig, bark fissure and grass blade at their correct real-world scale. Fine detail must be STRUCTURAL and CAMERA-FOCUSED rather than synthesized as artificial texture. Avoid the following failures: blurry facades, soft or melted building outlines, smeared vegetation, mushy grass, watercolor foliage, plastic bark, muddy wood grain, false defocus, motion blur, diffusion filters, beauty smoothing, excessive denoising, haze unrelated to the actual weather, low-resolution upscale appearance, JPEG blockiness, oversharpening halos, edge ringing, crunchy artificial microcontrast, or invented detail. Aim for clean optical acuity with restrained texture contrast, natural tonal transitions, true-to-life dynamic range, neutral facade color and correct white balance. Deliver the sharpest native-resolution image the selected provider actually supports; do not falsely claim 4K when only 2K is returned.';
 return [capture,materials,plants,light,finish].join('\n\n');
}
/**
 * Global reference lock. Image 1 is always the camera/composition/geometry
 * authority. Only an explicitly requested inferred frontal batch view can
 * depart from the source viewpoint; that cannot be geometrically exact
 * without a separate frontal reference.
 */
function architecturalReferenceLock(p){
 if(p.brief?.sceneType==='interior')return 'NON-NEGOTIABLE INTERIOR GEOMETRY AND CAMERA LOCK: IMAGE 1 defines actual room wall positions, wall-to-ceiling joints, floor plan, ceiling shape, structural openings, door/window positions, original camera height, framing, perspective, furniture locations and original real-world proportions. Preserve these without moving them, changing apparent room shape, adding openings or fabricating structural changes. If the source is incomplete, do not infer nonexistent walls or windows as certain. Relighting never changes furniture, finishes or camera.';
 const cameraLock='HARD CAMERA/COMPOSITION LOCK — REFERENCE IMAGE 1 IS AUTHORITATIVE: Match its exact viewpoint, camera height, perspective, field of view, framing, object positions and relative proportions. Do not orbit, dolly, tilt, invent an unseen building side or reveal hidden geometry. A different view requires its own source screenshot. Camera brands and lens descriptions are capture-style guidance only.';
 const geometryLock='NON-NEGOTIABLE ARCHITECTURAL GEOMETRY LOCK: The house in IMAGE 1 is the sole ground truth. Preserve 1:1 the number, exact positions, shapes, relative dimensions and outlines of all floors, walls, roofs (including ridge, slopes, eaves and overhangs), gables, chimneys, window/door openings, frames/mullions, balconies, canopies, terraces, stairs, plinth, railings, structural columns, beams, gutters and every other EXISTING architectural element. Match the roof-to-wall connections, architectural seams, silhouette and built proportions precisely. No changed roof pitch, house footprint, added/removed/moved windows, doors, stories or structural parts; no invented decorative features. For material or color edits, change only the surface finish requested, NOT its physical shape, boundary, scale or construction seams. For scene/season edits, change only weather, daylight, seasonal vegetation, snow and requested lights, never the building geometry or camera.';
 const caution='STRICT REFERENCE-TO-PHOTO EDIT: Generate a photorealistic photograph OF THE SAME EXACT BUILDING IN THE REFERENCE, not a similar or redesigned house. If the source has uncertain or hidden geometry, preserve what is visible and do not hallucinate missing structures. Keep the source site footprint, hardscape paths, existing pool placement and building relation to surroundings; update only the landscape/atmosphere explicitly requested. Photorealism and microdetail must never come at the expense of geometry/camera accuracy.';
 return [cameraLock,geometryLock,caution].join('\n\n');
}
const SCENE_VARIANTS=Object.freeze({
 evening:'Evening blue-hour architectural photograph: cobalt-blue twilight, residual sky glow, warm physically believable light from the EXISTING windows, warm exterior garden and pathway lanterns that illuminate the real paths and foliage; if no lamps exist, introduce only a few discreet removable ground-level garden lamps, never change architecture. Natural light falloff, gentle reflections, no black nighttime exposure. Keep the original season.',
 autumn_overcast:'Mid-autumn overcast daylight: deciduous leaves in realistic amber, copper and ochre, some fallen leaves on the existing ground, grey softly diffused sky, nuanced texture on slightly damp paving, muted but true-to-source facade colors, no direct sunlight, realistic autumn plant species.',
 autumn_sunny:'Sunny golden autumn day: natural low-to-medium sun, clear blue autumn sky, warm directional light, realistic shadows, amber and golden leaves on deciduous trees, subdued greens on evergreen conifers, a few fallen leaves on unchanged pathways and lawn; no orange color cast across building finishes.',
 autumn_evening:'Autumn blue-hour evening: copper, ochre and golden deciduous foliage, muted blue-lavender twilight sky, visible warm light from existing windows, restrained existing exterior lighting or discreet ground-level garden lamps. Natural realistic evening contrast with architecture still clearly legible; no dark night, no altered materials.',
 winter_overcast:'Overcast winter daytime with realistic snow accumulation on the exact existing roof, terrace railings, paving edges, trees and landscape; soft cold diffused daylight and pale-grey winter sky, bare deciduous branches, evergreen conifers retained, no sunshine. If a pool exists, treat it as seasonally winterized with a simple safety cover instead of inventing new pool geometry.',
 winter_sunny:'Bright clear winter day: accurate snow cover on existing roof, ground and landscaping, bare deciduous trees and snow-dusted conifers, bright blue-cool sky with low crisp sunlight and physically coherent long shadows, glittering subtle snow texture. If a pool exists, show its winterized safety cover without moving it.',
 winter_evening:'Winter blue-hour evening: natural snow on all appropriate existing surfaces, bare deciduous trees, deep cobalt dusk sky, cosy amber light through existing windows and from garden lanterns, delicate warm light pools reflected in existing snow, architecture still clearly visible. If a pool exists, keep it in place and winterize with a realistic cover.'
});
function sceneVariationPrompt(p){
 const variant=SCENE_VARIANTS[String(p.sceneVariation||'')];
 if(!variant)throw Object.assign(Error('Неизвестный вариант сцены'),{status:400});
 return [
 'PHOTOREAL ARCHITECTURAL PHOTOGRAPH — CONTROLLED SEASON / LIGHT VARIATION FROM A COMPLETED AI RENDER.',
 'IMAGE 1 is the final approved architectural photograph. Rework ONLY the weather, season, existing foliage seasonality, natural lighting, sky, snow and requested nighttime lights. Preserve camera viewpoint, focal length, image crop, building silhouette, roof geometry, number/size/position of ALL windows and doors, facades, cladding type/colors, site layout, objects, pool footprint, walkways and construction joints. No building modifications, no material swaps, no invented rooms or structural parts, no altered camera perspective. Keep facade texture and microdetail authentic and sharp.',
 'REQUIRED SCENE TRANSFORMATION: '+variant,
 architecturalReferenceLock(p),
 photographicDirection(p),
 'Change only the aspects strictly required by the chosen scene variant. No people, text, overlays, new construction, material retexturing, warped openings, duplicated trees or hallucinated building elements.',
 'Keep the same exact house as Image 1. This is an image-to-image edit, not a new design.'
 ].join('\n\n');
}
export function createPrompt(p){
 assertSeriesSource(p);
 if(p.enhanceOnly===true)return createEnhancementPrompt(p);
 if(p.cameraOrbit)return cameraOrbitPrompt(p.cameraOrbit,{referenceProvided:!!p.reference});
 if(p.furnitureEdit)return furnitureEditPrompt(p.furnitureEdit,{maskProvided:!!p.mask,referenceProvided:!!p.material});
 if(p.landscapeMasterplan)return p.landscapeMasterplan.cameraMode==='3d-perspective'?perspectiveLandscapePrompt(p.landscapeMasterplan):masterplanPrompt(p.landscapeMasterplan);
 if(p.roofTopView)return topDownRoofPrompt(p.roofTopView);
 if(p.imageTask)return imageTaskPrompt(p.imageTask);
 if(p.editMode==='text')return [architecturalReferenceLock(p),materialTextPrompt(p.materialInstruction,p)].join('\n\n');
 if(p.localCrop)return [architecturalReferenceLock(p),materialCropPrompt(p)].join('\n\n');
 if(p.landscapeEdit){if(!p.mask)throw Object.assign(Error('Для ландшафта нужна маска'),{status:400});return landscapePrompt(p.landscapeEdit);}
 if(p.atmosphereOnly){const art=atmospherePrompt(p.brief?.atmosphere);if(!art)throw Object.assign(Error('Выберите атмосферу и её интенсивность'),{status:400});return [architecturalReferenceLock(p),art].join('\n\n');}
 if(p.sceneVariation)return sceneVariationPrompt(p);const b=p.brief||{};const specific=Boolean(p.selectedZone&&(p.mask||p.editMode==='text'));const shot=compact(p.batchShot,32);
 const essential=String(b.sceneType||'')==='interior'
  ?'You are an expert architectural interior photographer and 3D-based visualization artist. Create a photorealistic premium INTERIOR photograph from Image 1. Image 1 is the authoritative approved room geometry and camera composition. Preserve all visible wall positions, room proportions, ceiling height implied by the supplied view, exact door and window locations/count/sizes, structural columns and fixed openings. Do NOT move openings, distort perspective or invent additional rooms. Keep the approved virtual camera fixed. Physically plausible lighting, material microdetail, reflections, natural scale and architectural editorial photography. No people, logos, captions or graphic overlays. If the source is only a 2D floor plan rather than a 3D room or interior image, DO NOT pretend that hidden elevations or wall heights are known: the project must first be verified as a 3D layout.'
  :`You are an expert architectural photographer and material visualization artist. Produce a genuinely photorealistic high-end editorial architectural photograph, never a CGI-looking image, illustration, or concept sketch. Source input image 1 is the authoritative architectural building; ${shot==='front'&&!p.batchFrontProvided?'the user requires a NEW frontal camera position inferred conservatively from the oblique source, so do not preserve the oblique camera angle, but preserve the architecture; unseen geometry cannot be guaranteed accurate':'keep the exact supplied camera viewpoint'}. Preserve the exact building massing, facade proportions, number/size/locations of windows and doors, roof silhouette, entrance and horizontal lines; ${shot==='front'&&!p.batchFrontProvided?'change ONLY camera orientation toward a straight-on frontal facade view, treating occluded elements conservatively':'preserve camera perspective and framing'}. Do NOT invent extra rooms, balconies, windows, roofs, storeys or structural elements. Natural light transport, plausible surface textures, realistic reflections, detailed landscaping, restrained photographic grading. No logos, text, people, watermarks or distracting objects.`;
 const materialMap=specific?Object.entries(b.materials||{}).filter(([,name])=>String(name||'').trim()):[];
 const homeChanges=compact(b.homeChanges,600);const preserve=b.preserveMaterials!==false&&!specific&&!homeChanges;
 const materialPolicy=b.sceneType==='interior'
  ?(p.relightOnly===true?'INTERIOR RELIGHT: preserve all visible original finishes, exact furniture positions, materials, textures and colors; modify only light, shadow, exposure and physically corresponding reflections.':b.style==='as-is'?'INTERIOR STYLE AS-IS: keep original finishes, colors, furniture and material assemblies exactly as provided.':'INTERIOR DESIGN STYLING PER USER: change ONLY explicitly selected soft furnishings and finishes as described in interior requirements, preserving every structural wall, floor plan, ceiling/door/window opening and all existing structural geometry. Do not change the camera.')
  :preserve?`MATERIAL AND DESIGN FIDELITY — MANDATORY FOR EVERY ARCHITECTURAL STYLE: Identify the ACTUAL existing finishes and material boundaries in the supplied original building image. Preserve each material exactly as visible, without guessing a different covering, inventing an architectural feature, changing a material type, recoloring a surface or modifying its construction pattern. Preserve every existing seam, joint, relief, edge, opening, trim, proportion and arrangement. Improve ONLY physically plausible microdetail, surface response, lighting, photographic realism and resolution, consistent with the already visible source. Where the material or geometry is unclear, remain conservative and preserve the original appearance rather than creating or replacing details. The original image is the authority: do not impose any preset architectural style or predefined material palette. Absolutely no redesign.`:`Follow the source building geometry and appearance unless a user explicitly requested and scoped an edit.`;
 const chosenConditions=[
  b.environment?'Environment, explicitly chosen: '+compact(b.environment)+'. '+compact(b.environmentInstructions,350)+(b.environmentSubtype?'. Precise chosen landscape subtype: '+compact(b.environmentSubtype,90)+'. Shape, age, botanical character, landform and natural scale follow this choice.':'. Preserve the existing architectural site layout and camera.'):null,
  b.season?'Season explicitly chosen: '+compact(b.season):null,
  b.weather?'Weather explicitly chosen: '+compact(b.weather):null,
  b.time?'Time of day explicitly chosen: '+compact(b.time):null,
  b.plants?'Vegetation explicitly chosen: '+compact(b.plants):null
 ].filter(Boolean).join('. ');
 const context=`USER-SELECTED SCENE CONDITIONS ONLY: ${chosenConditions||'No atmosphere options were explicitly selected.'}. For unspecified environment/season/weather/time/planting, preserve the source image where credible; infer only what is essential for coherent photographic lighting, without adding a default garden, summer trees, cloud cover, or other unrequested landscape. Never let an unspecified default override an explicit user choice. Fit vegetation to climate and do not obstruct the architecture. Explicit USER-ASSIGNED materials only: ${materialMap.length?materialMap.map(([z,m])=>`${compact(z,50)}: ${compact(m,70)}`).join('; '):'none; do not invent, guess, or introduce a new finish from missing material assignments'}. Texture repeat scale: ${compact(b.textureScale)}. Texture rotation: ${compact(b.textureRotation)}. Image aspect ratio: ${compact(b.output?.ratio)}.`;
 const sunlight=b.sunLighting&&typeof b.sunLighting==='object'?b.sunLighting:null;
 const nightRequested=/ночь|night|сумер|blue.hour/i.test(String(b.time||''));
 const x=Number(sunlight?.x),y=Number(sunlight?.y);
 const directionalLight={
  'front-left':'LIGHT COMES FROM THE CAMERA-FRONT-LEFT OF THE HOUSE: the left-front facade is directly sunlit; shadows fall backward/right.',
  'front':'LIGHT COMES FROM CAMERA-FRONT, not behind the house. The camera-facing facade is clearly sunlit; house and tree shadows fall AWAY from the camera.',
  'front-right':'LIGHT COMES FROM CAMERA-FRONT-RIGHT: sunlit front-right facade and cast shadows toward the back-left.',
  'left':'LIGHT COMES FROM CAMERA-LEFT SIDE: left-facing facade planes are lit; right-facing planes are shaded; cast shadows fall to camera-right.',
  'right':'LIGHT COMES FROM CAMERA-RIGHT SIDE: right-facing facade planes are lit; left-facing planes are shaded; cast shadows fall to camera-left.',
  'back-left':'THE SUN IS BEHIND THE HOUSE ON CAMERA-BACK-LEFT. STRONG REAR-LEFT BACKLIGHT: the camera-facing facade is noticeably darker; luminous roof silhouettes and left rim light. Tree and house shadows extend diagonally TOWARD CAMERA-RIGHT. Do not front-light the house.',
  'back':'THE SUN IS DIRECTLY BEHIND THE HOUSE, ON THE FAR SIDE FROM THE CAMERA. STRONG BACKLIGHT: THE FRONT CAMERA-FACING FACADE MUST BE SIGNIFICANTLY DARKER; only restrained luminous roof edges and vegetation rim light. The rear roof slopes and sky behind the building are brighter. House and tree shadows fall TOWARD THE CAMERA. NEVER FRONT-LIGHT THIS BUILDING.',
  'back-right':'THE SUN IS BEHIND THE HOUSE ON CAMERA-BACK-RIGHT. STRONG REAR-RIGHT BACKLIGHT: the camera-facing facade is noticeably darker, silhouette gains right-side rim lighting, house and tree shadows extend diagonally TOWARD CAMERA-LEFT. Do not front-light the house.'
 };
 const elevationDirections={
  low:'LOW SUN at about 16 degrees above horizon; create visibly LONG directional shadows and grazing facade illumination.',
  medium:'MEDIUM SUN at about 38 degrees above horizon; realistic medium-length cast shadows.',
  high:'HIGH SUN at about 66 degrees above horizon; clearly SHORTER downward cast shadows.'
 };
 const shadowModes={
  soft:'SOFT SHADOWS: gradual penumbrae and low local light contrast, but the selected sun direction must stay clear.',
  natural:'NATURAL SHADOWS: balanced contrast, physically plausible penumbrae and realistic bounced skylight.',
  defined:'CONTRAST SHADOWS: strong clear separation between sunlit and shaded facades, defined physically plausible cast-shadow edges.',
  cinematic:'CINEMATIC SHADOWS: deep directional yet readable shadows, refined negative fill, editorial photographic contrast, no clipped blacks.'
 };
 const direction=sunlight&&Object.hasOwn(directionalLight,String(sunlight.direction||''))?sunlight.direction:null;
 const sunHint=sunlight&&direction&&!nightRequested&&!specific&&b.sceneType!=='interior'
  ?'CRITICAL USER-DEFINED ARCHITECTURAL LIGHTING. APPLY VISIBLY; PRIORITY OVER GENERAL LIGHT PRESETS. '+directionalLight[direction]+' '+(elevationDirections[sunlight.elevation]||elevationDirections.medium)+' '+(shadowModes[sunlight.shadow]||shadowModes.natural)+' RECOMPUTE the lighting distribution: facade highlights and shadows, cast shadows on site, sky, window reflections, bounced fill, and directional atmosphere. A new lighting direction must noticeably change the photographic lighting, not just tint/brightness. NEVER render sun glyphs, orbits, UI arrows or any on-image markers. Keep camera, building geometry, materials, windows, doors and landscape layout unchanged. User direction is camera-relative, not an exact geographic azimuth. Exact 3D shadow geometry cannot be guaranteed from a 2D screenshot.'
  :sunlight&&!nightRequested&&!specific&&b.sceneType!=='interior'&&Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1&&y>=0&&y<=1
  ?'LEGACY VIRTUAL SUN MARKER: approximate sunlight from photo coordinate ('+x.toFixed(3)+', '+y.toFixed(3)+'), '+(x<.33?'camera-left.':x>.67?'camera-right.':'near camera axis.')+' '+(y>.65?'Low grazing sunlight and long cast shadows.':y<.35?'Higher sunlight and shorter shadows.':'Medium sunlight and medium shadows.')+' Make the directional light and facade shading visibly change; keep geometry identical.'
  :null;
 const sunlightAppearance=sunlight&&!nightRequested&&!specific&&b.sceneType!=='interior'?
  'SUN VISIBILITY FROM USER: '+(sunlight.showSunDisk===true?
   'Show the NATURAL PHOTOGRAPHIC solar disk only IF the actual sun is in the visible unobstructed sky, within the camera frame. If behind the roof, building, clouds, or outside the frame, NEVER paint a visible sun disk on the structure or invent a second light source.':
   'Do NOT depict a visible solar disk even if the sky is bright; keep natural illumination and shadows.')+' '+(sunlight.showSunRays===true?
   'User requests visible atmospheric crepuscular rays ONLY if a physically credible veil of haze, mist, or suspended particles exists, with correct occlusion by existing geometry. Subtle restrained editorial light shafts, never opaque stylized beams. They must originate at the user-selected sun position. Do not invent heavy fog.':
   'NO VISIBLE ATMOSPHERIC LIGHT SHAFTS, god rays or artificial radial flare. Normal directional sun and shadows must remain unaffected.')+
   ' Keep all SUN STUDIO marker graphics, sun orbits, diagrams and arrows OUT OF THE FINAL IMAGE.':null;
 const relightInstruction=p.relightOnly===true
  ?'RELIGHT EDIT OF AN EXISTING FINISHED IMAGE: IMAGE 1 IS THE APPROVED ARCHITECTURAL PHOTOGRAPH. Change ONLY lighting, plausible direction/softness of sunlight and cast shadows, sky luminance consistent with the expressly selected time/weather, and related exposure/reflections. Keep the same architectural geometry, framing, windows, finishes, landscaping, existing objects and the exact camera position. NO scene redesign, no extra structures, no invented lamps or props. Preserve content identically as far as image editing allows.'
  :null;
 const sceneChangeCatalog={
  time:{morning:'early morning, soft low-angle sunlight',day:'clear professional daytime illumination',golden:'warm low golden-hour light with long plausible shadows',night:'realistic nighttime lighting, warm existing windows and correct dark sky'},
  season:{spring:'spring vegetation, young leaves and appropriate seasonal colors',summer:'full realistic summer foliage',autumn:'autumn leaves and seasonal foliage with realistic local colors',winter:'winter vegetation, bare deciduous trees and cold natural ground detail'},
  weather:{clear:'clear sky and physically coherent direct sunlight',cloud:'overcast sky, soft diffuse light and subdued shadows',rain:'credible rainfall, wet surfaces, realistic puddles and reflections without obscuring architecture',fog:'natural layered ground fog, building remains legible',snow:'falling or settled snow, physically credible accumulation and cold seasonal light'},
  lighting:{natural:'natural physically plausible photographic lighting',soft:'gentle soft diffused lighting and soft natural shadows',dramatic:'expressive but physically credible contrast, directional highlights and deep readable shadows',windows:'subtle warm illumination in EXISTING windows; do not create new openings',exterior:'switch on EXISTING exterior luminaires only; do not invent new light fixtures'}
 };
 const changes=Array.isArray(p.sceneChanges)?p.sceneChanges.slice(0,6).map(entry=>{
  const group=typeof entry?.group==='string'?entry.group:'';
  const id=typeof entry?.id==='string'?entry.id:'';
  const description=sceneChangeCatalog[group]?.[id];
  return description?group+': '+description:null;
 }).filter(Boolean):[];
 const editExistingScene=p.sceneTransformOnly===true&&changes.length?
 'EDIT AN EXISTING COMPLETED ARCHITECTURAL PHOTOGRAPH (IMAGE 1). The user explicitly requests ONLY these revisions: '+changes.join('; ')+
 '. Keep camera position, building geometry, window sizes, materials, architectural details, landscape terrain, plants and props unchanged EXCEPT seasonal plant changes, precipitation or lighting directly required by the listed revisions. Do not reinterpret the building or create a new composition. Make physically consistent light and shadows. Preserve all previous visual decisions that do not conflict with the specified revisions. This is a controlled edit of IMAGE 1, not a brand new design.':null;
 const lightingChoices={
  natural:'Keep physically plausible natural daylight and illumination.',
  soft:'Use soft directional or diffused illumination and broad realistic penumbrae.',
  dramatic:'Use cinematic but realistic directional lighting and controlled shadow contrast.',
  windows:'Illuminate existing interior windows realistically; no new openings or invented fixtures.',
  exterior:'Switch on existing external architectural light fixtures; do not add new fixtures.'
 };
 const lightingRule=lightingChoices[b.lightingPreset]||null;
 const sceneMood=compact(b.sceneMood,32);
 const atmosphere={
  sunny:'Crisp bright summer daylight with credible sunlight, deep natural green foliage and controlled contrast. A clean professional daytime photograph, not oversaturated.',
  golden:'Golden hour shortly before sunset. Long, soft warm shadows, amber low sun, realistic warm highlights and coherent blue shadows. Avoid cartoon orange cast.',
  fog:'Early autumn morning with layered natural fog and cool soft diffuse light. Preserve visual access to the building; no heavy opacity across facade.',
  overcast:'Elegant soft overcast daylight, broad neutral light, fine diffuse shadows, rich natural surface color without harsh sun. Architectural editorial light.',
  rain:'Autumn just AFTER rainfall: wet ground and leaves, coherent reflections, soft daylight, residual dampness. Do not force heavy rain streaks or obscure the architecture.',
  winter:'Quiet realistic snowy winter in soft cool daylight; physically credible snow accumulation. Follow original site geometry and existing object restrictions.',
  blue:'BLUE HOUR ONLY: 15–30 minutes after sunset, deep cobalt twilight sky with remaining ambient light, architecture still clearly legible, subtle existing window or garden lighting. This is twilight, NOT a pitch-black night. Do not shift building geometry.',
  night:'NIGHT ARCHITECTURE: nighttime outdoor scene with natural darkness, realistic localized lighting from existing windows and luminaires, careful exposure and controlled reflections. Do not invent new light fixtures or openings.'
 };
 const moodInstruction=Object.hasOwn(atmosphere,sceneMood)&&!specific?'ATMOSPHERE PRESET FOR IMAGE: '+atmosphere[sceneMood]:null;
 const batchShots={
  original:'BATCH FRAME 1 OF 4 — SOURCE CAMERA: Generate a photorealistic image from the exact original camera angle and composition supplied by the user. Preserve this specific building, its existing architecture and every visible surface. Do not alter the geometry, material appearance or scene layout. Enhance photographic realism only.',
  front:'BATCH FRAME 2 OF 4 — STRAIGHT FRONT VIEW: '+(p.batchFrontProvided?'The first image is a separate FRONT IMAGE supplied by the user. Keep its exact geometry and frontal viewpoint, and faithfully render this very same building.':'Only an oblique view is supplied. Attempt a conservative approximate front-facing viewpoint toward the clearly visible primary facade. The unseen portions cannot be reconstructed with geometric certainty; do not invent structures or claim technical accuracy.')+' Keep all architecturally identifiable elements, positions, opening counts, proportions and source material appearance unchanged. No facade redesign. No invented features.',
  detailEntry:'BATCH FRAME 3 OF 4 — AI-GENERATED ARCHITECTURAL CLOSE-UP A. Image 1 is a cropped region of the ORIGINAL approved building screenshot. Image 2, if supplied, shows the FULL original building for geometry cross-check. Identify whatever authentic architectural elements and materials are ACTUALLY VISIBLE in this crop, regardless of house type or architectural style. Generate a new highly photorealistic close-up with crisp, physically plausible microtexture, surface finish, natural lighting, subtle contact shadows and authentic optical details from these very elements. This MUST be AI image generation with newly synthesized realistic microdetail, NOT an interpolation, simple enlargement or image upscale. The original crop is the exact reference for camera, composition, contours, existing construction, element count, shape, material identity and boundaries. Do not add, omit, relocate or redesign ANY architectural part. Do not assume that an entrance, window, porch or any named element exists in this crop.',
  detailMaterial:'BATCH FRAME 4 OF 4 — AI-GENERATED ARCHITECTURAL CLOSE-UP B. Image 1 is another, tighter crop of the SAME original building screenshot. Image 2 if supplied is the FULL original building for visual cross-check. Analyze ONLY the actual elements and surfaces visible in the crop. Render genuine high-definition photographic material microdetail and realistic surface interaction with light — not a simple pixel upscale — while keeping each visible form, joint, texture direction, original color and architecture exactly as supplied. Preserve the exact crop and camera. Do not infer a preselected material, architectural style, window, doorway, step, facade system or other element that is absent. Do not fabricate extra geometry, alter surface types, widen seams, modify profiles or invent fixtures.'
 };
 const batchInstruction=Object.hasOwn(batchShots,shot)?batchShots[shot]:'';
 const batchModelLock=shot?'STRICT ARCHITECTURAL MODEL LOCK — applies to ANY house, style, complexity and building material. Use the supplied original model as the sole truth. Retain massing, footprint, relative dimensions, roof and facade outlines, all openings, their number and placement, roof-to-wall junctions, structural edges, surface divisions, orientation, perspective of the supplied image (except the explicitly requested approximate frontal shot), construction joints and visible details. Reproduce original finishes and visual texture direction based solely on the uploaded image, without a preset or guess. An AI macro may add realistic surface *microdetail* but cannot invent architecture or change materials. Never extrapolate unseen geometry as fact.':null;
 const geometry=b.lockGeometry===false?'Respect architectural design broadly.':'VERY IMPORTANT: architectural geometry must not be changed under any circumstance.';
 const physics=!specific&&(/зима|winter/i.test(String(b.season||'')))?'WINTER PHYSICAL REALISM: any outdoor swimming pool in view is winterized and FULLY CLOSED by a taut opaque safety cover; no open blue water, no pool loungers, towels, wine glasses or summer furniture left outside. Snow settles on roofs, ground and plantings according to temperature. Trees and vegetation match winter, shadows and reflections are plausible.':!specific&&(/дождь|rain/i.test(String(b.weather||'')))?'RAIN PHYSICAL REALISM: wet stone and pavement, rainwater puddles and realistic muted reflections, wet foliage. No impossible sunlight or floating raindrops.':'';
 const continuity=p.landscapeReference&&p.reference?'The landscape reference photo defines the site: reproduce its vegetation species, age, trunk thickness, canopy spacing, ground cover, relief, water and planting pattern where visible. Adapt perspective around the building in the primary image. Use the selected season, weather and light; ignore buildings in the landscape reference. Establish stable landmarks for all subsequent views.':p.batchShot==='original'?'Compose one coherent site layout for subsequent views. Place distinguishable trees and paths relative to building corners, terrace and entrance. Follow selected species, season, weather and lighting.':p.reference?(p.environmentAnchor?'Second input is the approved first RENDER of this site. Keep its spring or seasonal state, sky, light, species, individual trees, paths and terrain anchored relative to identifiable facade corners and terrace. Project these landmarks into the requested camera, respecting occlusion and crop. The first input controls architecture.':p.batchShot?'Second input image, when present, is the complete approved ORIGINAL model screenshot. Use it as a strict visual structural cross-check of the cropped first image. Never add details to the crop merely because they appear elsewhere in the full image; keep the first image viewpoint and geometry unchanged.':'Additional reference image depicts the SAME project as a previous view. Reuse its material palette, specific tree species, garden character, shoreline/terrain motifs and photographic style where visible and logically consistent with the new camera. The new first image dictates the geometry, camera AND existing building materials. A prior rendered image must NEVER replace the source facade materials. Without 3D do not claim exact spatial reconstruction.'):'';
 const targetZone=compact(p.zoneId)==='custom'?'the exact architectural surface or component named in the user instruction':compact(p.selectedZone,90);
 const userRequest=compact(p.materialInstruction,500);
 const semanticOnly=specific&&p.editMode==='text';
 const zoneId=compact(p.zoneId,30);
 const elementRules={
  windows:'Window FRAME profiles and sashes only. Do not recolor/replace transparent glazing, curtain reflections or surrounding walls. Preserve exact number, shapes and mullions.',
  doors:'Door leaf and frame only. Preserve handles, hinges, shape and opening location.',
  roof:'Roof cladding and edge only. Preserve roof geometry, drainage and seam layout.',
  terrace:'Terrace DECKING and platform only; exclude grass, walls, glazing, doors and site paving.',
  steps:'All porch stair TREADS and RISERS only; keep stair count and geometry.',
  base:'Plinth/base band only; do not alter the terrace and paving.',
  main:'Main exterior wall cladding only; preserve seam layout and all openings.',
  accent:'Secondary decorative facade cladding only; do not modify main facade.',
  custom:'Only the explicitly described surface; do not alter any other elements.'
 };
 const category=elementRules[zoneId]||'Only the named architectural component. Preserve adjacent materials.';
 const recolor=specific&&(p.editMode==='recolor'||(semanticOnly&&p.editAction==='color'));
 if(semanticOnly&&!userRequest)throw Object.assign(Error('Опишите изменение материала или цвета'),{status:400});
 const color=String(p.targetColor||'');
 if(recolor&&!semanticOnly&&!/^#[0-9a-fA-F]{6}$/.test(color))throw Object.assign(Error('Не задан корректный HEX-цвет'),{status:400});
 const recolorText=recolor?`MASKED COLOR EDIT ONLY: Image 1 is authoritative. The user wants to recolor ONLY the surface described as "${compact(p.selectedZone)}" to the exact visual shade ${color}. Apply the target color uniformly and naturally to the architectural surface inside the transparent mask, accounting for real lighting, shading, physically correct reflections and highlights. Do NOT change the type of existing material, surface microgeometry or relief. Preserve all standing-seam ridges, timber grain and plank joints, brick grout, stone pores, metal finish, glass transparency, door and frame design. Do not replace wood or metal with stucco, plaster or paint that obscures texture. Do not recolor any object outside the mask, including adjacent windows or other surfaces. Keep the original camera, architectural geometry and environment intact. This is RECOLOR ONLY, not material replacement.`:null;
 const semanticText=semanticOnly?`TARGETED ARCHITECTURAL COMPONENT EDIT WITHOUT A MASK: IMAGE 1 is authoritative. Visually identify each visible component called "${targetZone}" by architectural function, never by a simple color match. Component rules: ${category} User instruction: "${userRequest}". ${recolor?`Recolor ONLY this component according to the COLOR NAMED IN THE USER INSTRUCTION while preserving its original material, grain, surface texture and geometry. If no color is named, use ${/^#[0-9a-fA-F]{6}$/.test(color)?color:'the existing selected shade'}.`:'Replace or adjust ONLY the selected component according to the text description with physically plausible material scale and reflections.'} Keep EVERY other building material and color unchanged. Do not touch glazing, landscape, sky, camera, windows, roof, terrace, doors or adjacent areas except the named target. Preserve architectural geometry exactly. NO MASK WAS SUPPLIED; the model must locate the target visually, and the result requires user review.`:null;
 const extraRequest=!semanticOnly&&specific&&userRequest?`Additional user instruction scoped ONLY to the named masked component: "${userRequest}". ${category} Keep every unmasked pixel untouched.`:null;
 const edit=semanticOnly?semanticText:specific?recolor?recolorText:`LOCAL EDIT ONLY: edit the transparent region of the supplied PNG mask on IMAGE 1. The masked area is the selected facade zone named '${compact(p.selectedZone)}'. Apply requested material '${compact(p.materialName)||compact(userRequest,100)||'as described in the user instruction'}' to that facade surface and keep the rest of the image, environment, lighting and all other surfaces as unchanged as possible. Use the material reference image (when provided) for accurate color, grain and texture repeat. ${Number(p.materialDimensions?.width)>0?`Material physical size: ${Number(p.materialDimensions.width)} by ${Number(p.materialDimensions.height)||Number(p.materialDimensions.width)} millimetres.`:''} Replace the material consistently through the ENTIRE transparent masked area, never only a small isolated patch. Respect the mask boundary, preserve the contours around glazing and doors, and keep all unmasked pixels as untouched as possible. The mask is a guide and may not be pixel exact. Material reference image is not the building.`:`FULL SCENE ENHANCEMENT: Transform the sketch/model screenshot into a realistic architectural photograph while preserving existing building materials, all visible texture divisions and exact architectural point of view. Develop only the selected surroundings, weather, season and photographic lighting. A photographed exterior must look realistic without redesigning or re-cladding any part of the house.`;
 const interiorRules=(()=>{
  if(String(b.sceneType||'')!=='interior')return null;
  const styles={
   'as-is':'KEEP the existing interior style and finishes as closely as visible.',
   'warm-modern':'Warm modern: considered walnut/oak textures, neutral plaster, elegant restrained furniture, natural stone accents.',
   'japandi':'Premium Japandi: precise minimal forms, soft tactile oak, quiet natural palette and restrained handmade details.',
   'minimal':'Architectural minimalism: refined detailing, continuous surfaces, warm neutral volumes and quality materials.',
   'scandinavian':'High-end Scandinavian: daylight, warm oak, soft natural textile and calm proportions.',
   'contemporary':'Contemporary luxury: refined custom joinery, carefully proportioned furniture and premium materials without excessive decor.',
   'classic':'Modern classic: elegant restrained moulding, balanced proportions and refined materials without excessive ornament.',
   'loft':'Refined loft: restrained metal, stone, timber and industrial accents while respecting the existing building.'
  };
  const furnishings={
   preserve:'KEEP furniture already visible in Image 1 in precisely the same positions and sizes; no replacement.',
   complete:'Furnish empty zones appropriately to actual room scale, maintain clear paths, never block doorways, windows or access.',
   'no-additions':'Do not add any new furniture, decoration or lighting fixtures.'
  };
  const lighting={
   'soft-daylight':'Natural diffused daylight through EXISTING windows, physically realistic soft illumination.',
   sunny:'Distinct clear-sky sun patches through existing windows, directional indoor shadows.',
   overcast:'Uniform elegant soft overcast window light, extremely gentle shadows.',
   evening:'Evening interior with existing practical light fixtures, warm but balanced and realistic exposure.',
   studio:'Professional editorial interior photography with accurate soft light and restrained bounce fill.'
  };
  const sun=b.sunLighting&&typeof b.sunLighting==='object'?b.sunLighting:{};
  const dir={
   'front-left':'from the front-left relative to the camera','front':'from camera-front','front-right':'from camera-front-right',
   left:'from camera-left',right:'from camera-right','back-left':'from rear-left','back':'from behind the camera-facing room','back-right':'from rear-right'
  };
  const shadows={
   soft:'soft wide penumbrae, gentle contrast',natural:'balanced natural shadow contrast',defined:'crisp realistic strong shadows',
   cinematic:'cinematic controlled pools of light and dark, still preserving readable details'
  };
  const sources={
   window:'DAYLIGHT THROUGH THE WINDOWS already present in the original room. Never add windows.',
   ceiling:'Use ceiling light fixtures where already represented in Image 1. Do not add fixture positions without explicit instruction.',
   fixtures:'Use existing wall, table, floor and pendant fixtures without relocating or inventing new ones.',
   mixed:'Combine existing window daylight and existing indoor fixtures with balanced realistic exposure.'
  };
  const current=compact(b.room,48);
  const style=styles[b.style]||styles['as-is'];
  const furniture=furnishings[b.furniture]||furnishings.preserve;
  const additional=compact(b.notes,800),surfaces=compact(b.surfaces,500);
  const fixturePrompt=interiorLightsPrompt(b.interiorLights);
  if(fixturePrompt)return 'INTERIOR ROOM REQUIREMENTS: Room purpose '+current+'. Preserve original room layout. '+(p.relightOnly===true?'RELIGHT ONLY: preserve all furniture and finishes.':style+' '+furniture+' '+surfaces+' '+additional)+' Base lighting: '+(lighting[b.lighting]||lighting['soft-daylight'])+' '+fixturePrompt;
  return 'INTERIOR ROOM REQUIREMENTS: Room type: '+current+'. '+(p.relightOnly===true?'RELIGHT ONLY: preserve furniture, existing finishes, materials, wall colors and camera exactly; no redesign.':style+' '+furniture+' '+(surfaces?'Finish requests: '+surfaces+'. ':'')+(additional?'Additional user requests: '+additional+'. ':''))+
   ' Base lighting: '+(lighting[b.lighting]||lighting['soft-daylight'])+' '+(sources[sun.indoorSource]||sources.window)+
   ' If selected indoor daylight is available, directional light '+(dir[sun.direction]||'according to the visible window configuration')+
   ', sun elevation '+(sun.elevation||'medium')+', '+(shadows[sun.shadow]||shadows.natural)+
   '. Respect actual window positions: do not pretend physically impossible sunlight arrives through solid walls. For a finished-photo relight, alter lighting, direct and indirect shadows, window exposure and reflections ONLY. Preserve architecture, camera and furniture.';
 })();
 const homeEdit=homeChanges&&!specific?`USER-REQUESTED CHANGES BEFORE FIRST RENDER: "${homeChanges}". Apply these explicit edits to the specified architectural components only; e.g. "dark roof" means recolor existing roof cladding without changing roof shape, and "black frames" means recolor existing frames without changing the openings. Preserve every unmentioned material, roof and window geometry, facade proportions, camera and site. Do NOT force preservation of the original colors specifically requested to be changed. A text-only request needs semantic target identification; verify visually, mask-less edits are approximate.`:null;
 return [p.localCrop?'LOCAL CROP ALIGNMENT: Image 1 is a clean square crop centred on the selected material surface, with neutral padding. Return EXACTLY this same square framing and pixel alignment; do not zoom, crop or expand to the full context reference. The full reference photo is context only, not the output camera. Edit only the transparent mask; preserve all original construction edges and protected windows.':null,architecturalReferenceLock(p),essential,photographicDirection(p),geometry,batchModelLock,materialPolicy,moodInstruction,batchInstruction,relightInstruction,editExistingScene,lightingRule,interiorRules,edit,homeEdit,extraRequest,physics,context,sunHint,sunlightAppearance,continuity,!specific?atmospherePrompt(b.atmosphere,{preserveScene:false}):null].filter(Boolean).join('\n\n')}
export function renderQuantity(p){return p.landscapeMasterplan||p.roofTopView||p.imageTask||p.localCrop||p.landscapeEdit||p.atmosphereOnly||p.enhanceOnly===true||p.editMode==='text'?1:([1,2,4].includes(Number(p.quantity))?Number(p.quantity):1);}
function renderError(error,requestId){
 const status=Number.isInteger(error?.status)&&error.status>=400&&error.status<=599?error.status:502;
 const message=String(error?.message||'Ошибка сервера').slice(0,240);
 const code=error?.code||((status===400||status===413)?'invalid_request':status===429?'daily_limit':/время ожидания|timeout/i.test(message)?'provider_timeout':status>=500?'provider_error':'render_failed');
 console.warn('[AI]',requestId,'ошибка:',code,'http:',status,'детали:',message);
 return Object.assign(Error(message),{status,code});
}
async function performRender(p,requestId){
 const started=Date.now();
 const fail=(message,status=400,code='invalid_request')=>{throw Object.assign(Error(message),{status,code})};
 if(!API_KEY)fail('AI не настроен: укажите API_MARKET_KEY в Render.',503,'key_not_configured');
 if(!p?.image)fail('Загрузите исходный скриншот',400);
 if(p.enhanceOnly===true&&(p.mask||p.material||p.reference||p.imageTask||p.landscapeEdit||p.localCrop||p.atmosphereOnly||p.cameraOrbit))fail('Улучшение фотографии не совмещается с другими изменениями.',400);
 if(p.cameraOrbit&&(p.mask||p.material||p.localCrop||p.atmosphereOnly||p.landscapeEdit||p.imageTask||p.sceneVariation||p.furnitureEdit))fail('Новый ракурс создаётся отдельным запросом.',400);
 if(p.furnitureEdit&&(!p.mask||p.cameraOrbit||p.imageTask||p.localCrop||p.landscapeEdit||p.atmosphereOnly||p.sceneVariation||p.enhanceOnly||p.editMode||p.reference))fail('Замена мебели требует локальную PNG-маску и отдельный запрос.',400);
 if((p.landscapeMasterplan||p.roofTopView)&&(p.cameraOrbit||p.furnitureEdit||p.imageTask||p.mask||p.material||p.localCrop||p.landscapeEdit||p.atmosphereOnly||p.sceneVariation||p.enhanceOnly||p.editMode||p.batchShot||p.landscapeMasterplan&&p.roofTopView))fail('Фотореалистичный генплан и кровля создаются отдельными запросами без масок и смены ракурса.',400);
 const primary=imageBlob(p.image,'image'),mask=imageBlob(p.mask,'mask'),material=imageBlob(p.material,'material'),reference=imageBlob(p.reference,'reference');
 if(mask&&mask.type!=='image/png')fail('Маска должна быть PNG',400);
 const n=renderQuantity(p);
 if(p.batchShot&&(!['original','front','detailEntry','detailMaterial'].includes(p.batchShot)||n!==1))fail('Для пакета допускается один кадр в запросе, ракурс должен быть из списка.',400);
 const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyCount=0}
 if(dailyCount+n>DAILY_CAP)fail('Осталось генераций на сегодня: '+Math.max(0,DAILY_CAP-dailyCount),429,'daily_limit');
 assertSeriesSource(p);
 const task=p.imageTask?normalizeImageTask(p.imageTask):null;
 const needsPlan=task&&['plan','plan2d','room'].includes(task.kind);
 const needsLandscape=!!(p.landscapeMasterplan||p.roofTopView);
 if(needsPlan&&!PLAN_IMAGE_MODEL)fail('Модель GPT Image 2.6 для планов не настроена на сервере. Укажите PLAN_IMAGE_MODEL=gpt-image-2.6-sunburst в Render. Nano Banana для этого раздела не используется.',503,'plan_model_missing');
 if(['room','view'].includes(task?.kind)&&!reference)fail('Сначала утвердите главный кадр или визуализацию плана.',400);
 const prompt=task?imageTaskPrompt(task):createPrompt(p);
 console.info('[AI]',requestId,'начинаем оплачиваемую генерацию; осталось:',DAILY_CAP-dailyCount,'кадров:',n);
 const images=[],mimes=[];let warning='';
 for(let i=0;i<n;i++){
  // Count BEFORE the external request: even a timeout may be billed by the provider.
  dailyCount++;
  try{
   const result=await apiMarketEdit({apiKey:API_KEY,source:primary,material,reference,mask,model:needsLandscape?LANDSCAPE_IMAGE_MODEL:needsPlan?PLAN_IMAGE_MODEL:MODEL,prompt:n>1?prompt+'\\nCreate variation '+(i+1)+' of '+n+' with the same architecture and camera.':prompt,quality:p.quality});
   images.push(result.b64);mimes.push(result.mimeType);
  }catch(error){
   if(!images.length)throw error;
   warning='Часть визуализаций не создана: '+error.message;break;
  }
 }
 console.info('[AI]',requestId,'готово',images.length,'кадров; длительность_мс:',Date.now()-started);
 return {images,mimes,model:needsLandscape?LANDSCAPE_IMAGE_MODEL:needsPlan?PLAN_IMAGE_MODEL:MODEL,provider:'API Market',warning};
}
const renderJobs=createRenderJobQueue({
 worker:async(p,requestId)=>{
  try{return await performRender(p,requestId)}catch(error){throw renderError(error,requestId)}
 },
 maxWaiting:3,ttlMs:10*60*1000,maxFinished:5
});
async function proxyRender(req,res,{queued=false}={}){
 const requestId='request-'+Date.now().toString(36);
 if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.',code:'invalid_origin',requestId});
 if(!API_KEY)return json(res,503,{error:'AI не настроен: укажите API_MARKET_KEY в Render.',code:'key_not_configured',requestId});
 try{
  const payload=await readJSON(req);
  const job=renderJobs.enqueue(payload,{idempotencyKey:req.headers['x-forma-idempotency-key']});
  console.info('[AI]',job.jobId.slice(0,12),'задание:',job.status,'позиция:',job.position);
  if(queued)return json(res,202,job);
  // Older cached site clients may still call /api/render. Keep their old JSON
  // contract while sharing the SAME FIFO queue (no more busy-rejection 429).
  const completed=await renderJobs.wait(job.jobId);
  const output=renderJobs.result(job.jobId);
  if(res.destroyed||res.writableEnded)return;
  return json(res,output?.status||502,output?.body||{error:'Результат задания недоступен.',code:'job_missing',requestId});
 }catch(error){
  const safe=renderError(error,requestId);
  if(!res.destroyed&&!res.writableEnded)return json(res,safe.status,{error:safe.message,code:safe.code,requestId});
 }
}
function getRenderJob(req,res){
 if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.'});
 const match=req.url?.match(/^\/api\/render\/jobs\/([a-f0-9]{48})(\/result)?$/);
 if(!match)return json(res,404,{error:'Задание не найдено',code:'job_not_found'});
 const jobId=match[1],wantResult=!!match[2];
 if(!wantResult){
  const job=renderJobs.get(jobId);
  return json(res,job?200:404,job||{error:'Задание не найдено или срок хранения истёк.',code:'job_not_found'});
 }
 const result=renderJobs.result(jobId);
 return json(res,result?.status||404,result?.body||{error:'Результат задания не найден или срок хранения истёк.',code:'job_not_found'});
}
async function serveStatic(req,res){let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return json(res,400,{error:'Неправильный адрес'})}if(pathname==='/')pathname='/forma-preview.html';if(pathname.startsWith('/.'))return json(res,403,{error:'Нет доступа'});const file=path.resolve(ROOT,'.'+pathname);if(!(file===ROOT||file.startsWith(ROOT+path.sep))||path.basename(file).startsWith('.'))return json(res,403,{error:'Нет доступа'});const ext=path.extname(file).toLowerCase();if(!MIME[ext]||ext==='.json')return json(res,404,{error:'Не найдено'});try{const s=await stat(file);if(!s.isFile())throw Error();const content=await readFile(file);res.writeHead(200,{'Content-Type':MIME[ext],'Content-Length':content.length,'X-Content-Type-Options':'nosniff','Cache-Control':['.html','.js','.css'].includes(ext)?'no-store':'public, max-age=300','Referrer-Policy':'no-referrer'});res.end(content)}catch{json(res,404,{error:'Не найдено'})}}
const planVision=createPlanVision({json,readJSON,sameOrigin});
const wanVideo=createWanVideo({json,readJSON,sameOrigin,imageBlob});
const wan3Video=createWan3Video({json,readJSON,sameOrigin,imageBlob});
const server=http.createServer(async(req,res)=>{
 if(req.url?.startsWith('/api/wan3/'))return wan3Video.handle(req,res);
 if(req.url?.startsWith('/api/wan/'))return wanVideo.handle(req,res);
 if(req.url==='/api/status'&&req.method==='GET'){const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyCount=0;}return json(res,200,{ready:!!API_KEY,planImageReady:!!API_KEY&&!!PLAN_IMAGE_MODEL,planImageModel:PLAN_IMAGE_MODEL,provider:'API Market',model:API_KEY?MODEL:null,authRequired:false,authorized:true,dailyRemaining:Math.max(0,DAILY_CAP-dailyCount),dailyLimit:DAILY_CAP,renderQueue:renderJobs.stats(),quotaScope:'shared_server',tariffName:null,balanceRub:null,balanceAvailable:false,supportEmail:PUBLIC_SUPPORT_EMAIL});}
 if(req.url==='/api/plan/status'&&req.method==='GET')return json(res,200,visionStatus());
 if(req.url==='/api/plan/recognize')return planVision(req,res);
 if(req.url==='/api/render/jobs'&&req.method==='POST')return proxyRender(req,res,{queued:true});
 if(req.url?.startsWith('/api/render/jobs/')&&req.method==='GET')return getRenderJob(req,res);
 if(req.url==='/api/render'&&req.method==='POST')return proxyRender(req,res);
 if(req.url?.startsWith('/api/'))return json(res,404,{error:'Не найдено'});
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Метод запрещён'});
 await serveStatic(req,res)
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(PORT,HOST,()=>{console.log(`ДОМ.РЕНДЕР: http://${HOST}:${PORT}`);console.log(API_KEY?`AI Market: ${MODEL} (секрет на сервере)`:'AI Market не подключён — демо без генерации')});
