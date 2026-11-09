/**
 * ДОМ.РЕНДЕР – minimal local Node 20+ server + OpenAI Images Edit proxy.
 * Keeps API keys on the server, not in the browser. Prototype, not public multi-tenant service.
 */
import http from 'node:http';
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {apiMarketEdit} from './api-market.mjs';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Optional simple local .env parser (no external packages). Environment variables win.
try {const dotenv=await readFile(path.join(ROOT,'.env'),'utf8');for(const line of dotenv.split(/\r?\n/)){const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}} catch {}
const PORT=Number(process.env.PORT)||3000;
const HOST=process.env.HOST||'127.0.0.1';
const API_KEY=process.env.API_MARKET_KEY||'';
const MODEL='nano-banana-2.1';
// No shared PIN: the public preview uses server-side usage limits instead.
const DAILY_CAP=Math.min(200,Math.max(1,Number(process.env.DAILY_GENERATION_LIMIT)||12));
const PUBLIC_SUPPORT_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PUBLIC_SUPPORT_EMAIL||'')?process.env.PUBLIC_SUPPORT_EMAIL:'';
let dailyCount=0, day=new Date().toISOString().slice(0,10);
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;const host=req.headers.host;try{return new URL(origin).host===host}catch{return false}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const MAX_BODY=24*1024*1024;
let active=0;
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload))}
async function readJSON(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY){const err=Error('Запрос слишком большой');err.status=413;throw err}chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{const err=Error('Некорректный JSON');err.status=400;throw err}}
function imageBlob(data,field){if(!data)return null;const m=String(data).match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+\/=]+)$/);if(!m)throw Object.assign(Error(`Некорректное изображение: ${field}`),{status:400});const bytes=Buffer.from(m[2],'base64');if(bytes.length>14*1024*1024||bytes.length<100)throw Object.assign(Error(`Неверный размер: ${field}`),{status:400});const type=m[1]==='jpeg'?'image/jpeg':`image/${m[1]}`;return new Blob([bytes],{type})}
function compact(str,limit=180){return String(str||'').slice(0,limit).replace(/\s+/g,' ').trim()}
function createPrompt(p){const b=p.brief||{};const specific=Boolean(p.selectedZone&&(p.mask||p.editMode==='text'));const shot=compact(p.batchShot,32);
 const essential=`You are an expert architectural photographer and material visualization artist. Produce a genuinely photorealistic high-end editorial architectural photograph, never a CGI-looking image, illustration, or concept sketch. Source input image 1 is the authoritative architectural building; ${shot==='front'&&!p.batchFrontProvided?'the user requires a NEW frontal camera position inferred conservatively from the oblique source, so do not preserve the oblique camera angle, but preserve the architecture; unseen geometry cannot be guaranteed accurate':'keep the exact supplied camera viewpoint'}. Preserve the exact building massing, facade proportions, number/size/locations of windows and doors, roof silhouette, entrance and horizontal lines; ${shot==='front'&&!p.batchFrontProvided?'change ONLY camera orientation toward a straight-on frontal facade view, treating occluded elements conservatively':'preserve camera perspective and framing'}. Do NOT invent extra rooms, balconies, windows, roofs, storeys or structural elements. Natural light transport, plausible surface textures, realistic reflections, detailed landscaping, restrained photographic grading. No logos, text, people, watermarks or distracting objects.`;
 const materialMap=specific?Object.entries(b.materials||{}).filter(([,name])=>String(name||'').trim()):[];
 const preserve=b.preserveMaterials!==false&&!specific;
 const materialPolicy=preserve?`MATERIAL AND DESIGN FIDELITY — MANDATORY FOR EVERY ARCHITECTURAL STYLE: Identify the ACTUAL existing finishes and material boundaries in the supplied original building image. Preserve each material exactly as visible, without guessing a different covering, inventing an architectural feature, changing a material type, recoloring a surface or modifying its construction pattern. Preserve every existing seam, joint, relief, edge, opening, trim, proportion and arrangement. Improve ONLY physically plausible microdetail, surface response, lighting, photographic realism and resolution, consistent with the already visible source. Where the material or geometry is unclear, remain conservative and preserve the original appearance rather than creating or replacing details. The original image is the authority: do not impose any preset architectural style or predefined material palette. Absolutely no redesign.`:`Follow the source building geometry and appearance unless a user explicitly requested and scoped an edit.`;
 const context=`Environment: ${compact(b.environment)}. Site instructions: ${compact(b.environmentInstructions,350)}. Season: ${compact(b.season)}. Weather: ${compact(b.weather)}. Time of day: ${compact(b.time)}. Vegetation: ${compact(b.plants)}. Fit vegetation to climate and do not obstruct the architecture. Explicit USER-ASSIGNED materials only: ${materialMap.length?materialMap.map(([z,m])=>`${compact(z,50)}: ${compact(m,70)}`).join('; '):'none; do not invent, guess, or introduce a new finish from missing material assignments'}. Texture repeat scale: ${compact(b.textureScale)}. Texture rotation: ${compact(b.textureRotation)}. Image aspect ratio: ${compact(b.output?.ratio)}.`;
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
 const continuity=p.reference?(p.batchShot?'Second input image, when present, is the complete approved ORIGINAL model screenshot. Use it as a strict visual structural cross-check of the cropped first image. Never add details to the crop merely because they appear elsewhere in the full image; keep the first image viewpoint and geometry unchanged.':'Additional reference image depicts the SAME project as a previous view. Reuse its material palette, specific tree species, garden character, shoreline/terrain motifs and photographic style where visible and logically consistent with the new camera. The new first image dictates the geometry, camera AND existing building materials. A prior rendered image must NEVER replace the source facade materials. Without 3D do not claim exact spatial reconstruction.'):'';
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
 return [essential,geometry,batchModelLock,materialPolicy,moodInstruction,batchInstruction,edit,extraRequest,physics,context,continuity].filter(Boolean).join('\n\n')}
async function proxyRender(req,res){
 if(!sameOrigin(req))return json(res,403,{error:'Недопустимый источник запроса.'});
 if(!API_KEY)return json(res,503,{error:'AI не настроен: укажите API_MARKET_KEY в .env и перезапустите сервер.'});
 const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyCount=0;}
 if(dailyCount>=DAILY_CAP)return json(res,429,{error:'Достигнут дневной лимит генераций этого сервера.'});
 if(active>=1)return json(res,429,{error:'Другая визуализация уже выполняется. Дождитесь результата.'});
 active++;
 console.info('[AI] Запрос генерации принят');
 try{
  const p=await readJSON(req);if(!p.image)return json(res,400,{error:'Загрузите исходный скриншот'});
  const primary=imageBlob(p.image,'image');const mask=imageBlob(p.mask,'mask');const material=imageBlob(p.material,'material');const reference=imageBlob(p.reference,'reference');
  if(mask&&mask.type!=='image/png')return json(res,400,{error:'Маска должна быть PNG'});
  const n=[1,2,4].includes(Number(p.quantity))?Number(p.quantity):1;
  if(p.batchShot&&(!['original','front','detailEntry','detailMaterial'].includes(p.batchShot)||n!==1))return json(res,400,{error:'Для пакета допускается один кадр в запросе, ракурс должен быть из списка.'});
  if(dailyCount+n>DAILY_CAP)return json(res,429,{error:`Осталось генераций на сегодня: ${Math.max(0,DAILY_CAP-dailyCount)}.`});
  const prompt=createPrompt(p);
  const images=[];const mimes=[];let warning='';
  for(let i=0;i<n;i++){
   // Count before call: timeout does not prove supplier hasn't charged the request.
   dailyCount++;
   try{
    const result=await apiMarketEdit({apiKey:API_KEY,source:primary,material,reference,mask,prompt: n>1?prompt+`\nCreate variation ${i+1} of ${n} with the same architecture and camera.`:prompt,quality:p.quality});
    images.push(result.b64);mimes.push(result.mimeType);
   }catch(error){
    if(!images.length)throw error;
    warning='Часть визуализаций не создана: '+error.message;
    break;
   }
  }
  json(res,200,{images,mimes,model:MODEL,provider:'API Market',warning});
 }catch(err){const status=err.status||502;console.warn('[AI] Генерация не выполнена:',status,String(err.message||'Ошибка сервера').slice(0,240));json(res,status,{error:err.message||'Ошибка сервера'})}finally{active--}
}
async function serveStatic(req,res){let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{return json(res,400,{error:'Неправильный адрес'})}if(pathname==='/')pathname='/index.html';if(pathname.startsWith('/.'))return json(res,403,{error:'Нет доступа'});const file=path.resolve(ROOT,'.'+pathname);if(!(file===ROOT||file.startsWith(ROOT+path.sep))||path.basename(file).startsWith('.'))return json(res,403,{error:'Нет доступа'});const ext=path.extname(file).toLowerCase();if(!MIME[ext]||ext==='.json')return json(res,404,{error:'Не найдено'});try{const s=await stat(file);if(!s.isFile())throw Error();const content=await readFile(file);res.writeHead(200,{'Content-Type':MIME[ext],'Content-Length':content.length,'X-Content-Type-Options':'nosniff','Cache-Control':['.html','.js','.css'].includes(ext)?'no-store':'public, max-age=300','Referrer-Policy':'no-referrer'});res.end(content)}catch{json(res,404,{error:'Не найдено'})}}
const server=http.createServer(async(req,res)=>{
 if(req.url==='/api/status'&&req.method==='GET'){const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyCount=0;}return json(res,200,{ready:!!API_KEY,provider:'API Market',model:API_KEY?MODEL:null,authRequired:false,authorized:true,dailyRemaining:Math.max(0,DAILY_CAP-dailyCount),dailyLimit:DAILY_CAP,quotaScope:'shared_server',tariffName:null,balanceRub:null,balanceAvailable:false,supportEmail:PUBLIC_SUPPORT_EMAIL});}
 if(req.url==='/api/render'&&req.method==='POST')return proxyRender(req,res);
 if(req.url?.startsWith('/api/'))return json(res,404,{error:'Не найдено'});
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Метод запрещён'});
 await serveStatic(req,res)
});
server.listen(PORT,HOST,()=>{console.log(`ДОМ.РЕНДЕР: http://${HOST}:${PORT}`);console.log(API_KEY?`AI Market: ${MODEL} (секрет на сервере)`:'AI Market не подключён — демо без генерации')});
