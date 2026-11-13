const $ = (selector) => document.querySelector(selector);
const MODES = {
  sunlit: {
    name: 'Режиссёрский солнечный свет',
    lighting: 'Distinctive late-morning or early-afternoon sunshine with believable direction, sculptural architectural shadows, legible material relief, restrained natural colour and controlled highlights. Keep all daylight, never blue hour or night.',
    camera: 'Professional full-frame architectural photograph, Nikon Z8-level crispness, a rectilinear 28–50 mm look only where compatible with the original projection; tripod-stable exposure, f/8-like depth, realistic glass reflections.'
  },
  soft: {
    name: 'Мягкий естественный свет',
    lighting: 'Premium luminous daylight beneath a high thin cloud layer, graceful transition of shadows, highly readable facade texture, nuanced reflected skylight, realistic restrained greens; no dusk or night.',
    camera: 'Full-frame architectural editorial capture, rectilinear optics, controlled perspective, clean medium-deep focus, natural microcontrast.'
  },
  golden: {
    name: 'Тёплый дневной свет',
    lighting: 'Late-afternoon GOLDEN DAYLIGHT while the sun remains clearly above the horizon: warm grazing sunlight, controlled deep shadows and dimensional atmosphere. Not sunset darkness, not twilight, not blue hour, not night.',
    camera: 'Professional full-frame architectural photography with believable warm daylight exposure and accurate perspective; no forced camera movement.'
  },
  atmospheric: {
    name: 'Атмосферный светлый кадр',
    lighting: 'Bright overcast daylight with atmospheric perspective and delicate distant haze only if justified by the site; layers and materials remain crisp, building fully legible. Never dark fog, dawn darkness, evening or night.',
    camera: 'Architectural editorial photograph, detailed material rendering, natural medium focal-length feel compatible with input, no perspective distortions.'
  }
};
const state = {
  image: null, visionImage: null, file: null, config: {ai: false, search: false},
  analysis: null, isVisualAnalysis: false, winner: null, curation: null,
  prompt: '', working: false, progressPct: 0, photoSearchConfirmed:false, searchMethod:null
};

function alertStatus(message, type='info') {
  const node = $('#liveNotice');
  node.className = `live-notice ${type === 'info' ? '' : type}`;
  node.querySelector('span:last-child').textContent = message;
}
function setBusy(busy){
  state.working=busy;
  const button=$('#analyzeBtn');
  button.disabled=busy;
  button.innerHTML=busy?'Обработка <span>'+state.progressPct+'%</span>':'Найти по фотографии <span>↗</span>';
}
function showProgress(value,message,finished=false){
  const percent=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  state.progressPct=Math.max(state.progressPct,percent);
  const panel=$('#processingProgress');
  panel.hidden=false;
  const bar=$('#progressBar');
  bar.style.width=state.progressPct+'%';
  bar.setAttribute('aria-valuenow',String(state.progressPct));
  $('#progressPercent').textContent=state.progressPct+'%';
  $('#progressPhase').textContent=message||'Обработка проекта…';
  panel.classList.toggle('is-finished',finished);
  if(state.working)$('#analyzeBtn').innerHTML='Обработка <span>'+state.progressPct+'%</span>';
}
function uploadJob(image,project){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST','/api/jobs');
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.timeout=45000;
    xhr.upload.onprogress=event=>{
      if(event.lengthComputable)showProgress(Math.round(event.loaded/event.total*10),'Передаём изображение на сервер…');
    };
    xhr.onload=()=>{
      let body;
      try{body=JSON.parse(xhr.responseText);}catch{reject(new Error('Сервер вернул некорректный ответ.'));return;}
      if(xhr.status>=200&&xhr.status<300&&body.jobId)resolve(body);
      else reject(new Error(body.error||'Не удалось запустить анализ.'));
    };
    xhr.onerror=()=>reject(new Error('Не удалось отправить изображение. Проверьте интернет.'));
    xhr.ontimeout=()=>reject(new Error('Загрузка изображения заняла слишком много времени.'));
    xhr.send(JSON.stringify({image,project}));
  });
}
async function trackJob(jobId){
  const started=Date.now();
  let previousPhase='',phaseStarted=started;
  const upperBounds={lens:72,vision:40,'vision-fallback':60,structure:56,brief:62,search:76,ranking:91,scene:98};
  while(Date.now()-started<6*60*1000){
    const job=await requestJson('/api/jobs/'+encodeURIComponent(jobId),{cache:'no-store'});
    if(job.phase!==previousPhase){previousPhase=job.phase;phaseStarted=Date.now();}
    const base=Number(job.progress||12);
    const cap=upperBounds[job.phase]||base;
    // Approximate progress within confirmed milestones; never reach 100 before completion.
    const estimate=job.status==='running'?Math.min(cap,base+Math.floor((Date.now()-phaseStarted)/2600)):base;
    showProgress(estimate,job.message);
    if(job.status==='finished')return job;
    await new Promise(resolve=>setTimeout(resolve,1900));
  }
  throw new Error('Не удалось получить результат анализа. Обновите страницу и повторите попытку.');
}
function collectProject() {
  return {type: $('#buildingType').value, materials: $('#materials').value.trim(), description: $('#notes').value.trim(), lockGeometry: true};
}
function manualAnalysis(project) {
  return {
    architecture: 'Изображение загружено; автоматическая оценка формы пока недоступна.',
    materials: project.materials || 'Будут определены после подключения визуальной модели.',
    composition: 'Исходная камера и точная перспектива должны остаться неизменными.',
    lighting: 'Выбор света ожидает анализа исходного изображения.',
    reason: 'Пока это только бриф, не профессиональный AI-отбор. Для выбора подходящего референса нужны AI-модель и поиск изображений.',
    choice: 'sunlit', confidence: 'not-analyzed',
    constraints: ['Сохранить архитектуру, окна, кровлю, масштабы и исходную камеру'],
    query: 'contemporary architectural residence editorial photography'
  };
}
function showAnalysis(a, visual) {
  $('#analysisEmpty').hidden = true;
  $('#analysisResults').hidden = false;
  $('#analysisTag').textContent = visual ? 'AI / РАСПОЗНАНО ПО ФОТО' : 'РЕЗЕРВНЫЙ РЕЖИМ / ФОТО НЕ ПРОВЕРЕНО';
  $('#analysisOrigin').textContent = visual ? 'ARCHITECTURE / IMAGE-BASED' : 'PROJECT / BRIEF ONLY';
  $('#analysisConfidence').textContent = visual ? `УВЕРЕННОСТЬ: ${String(a.confidence || '—').toUpperCase()}` : 'ФОТО НЕ ПРОВЕРЕНО';
  $('#architectureText').textContent = a.architecture || 'Архитектура проекта';
  $('#analysisReason').textContent = a.reason || '—';
  $('#materialText').textContent = a.materials || '—';
  $('#compositionText').textContent = a.composition || '—';
  $('#lightingText').textContent = a.lighting || '—';
}
function safeExternalUrl(raw) {
  try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
function setRecommendationMessage(text, label='ОЖИДАЕТ АНАЛИЗА') {
  $('#referenceGrid').hidden = true;
  $('#refHelp').hidden = false;
  $('#refHelp').textContent = text;
  $('#refsLabel').textContent = label;
}
function renderLensResults(matches){
  const region=$('#lensResults'),grid=$('#lensGrid');
  grid.replaceChildren();
  const list=(Array.isArray(matches)?matches:[]).filter(item=>safeExternalUrl(item.link)).slice(0,8);
  region.hidden=list.length===0;
  $('#lensCount').textContent=list.length+' / IMAGE MATCHES';
  for(const item of list){
    const card=document.createElement('a');
    card.className='lens-card';
    card.href=safeExternalUrl(item.link);
    card.target='_blank';card.rel='noopener noreferrer';
    const photo=document.createElement('div');photo.className='lens-thumb';
    if(safeExternalUrl(item.thumbnail)){
      const image=document.createElement('img');image.loading='lazy';image.decoding='async';
      image.referrerPolicy='no-referrer';image.alt=item.title||'Архитектурный референс';
      image.src=item.thumbnail;image.onerror=()=>{image.remove();photo.textContent='ПРЕВЬЮ НЕДОСТУПНО';};
      photo.append(image);
    }else{photo.textContent='СМОТРЕТЬ ПРОЕКТ';}
    const source=document.createElement('span');source.className='lens-source';source.textContent=item.sourceLabel||'Источник';
    const title=document.createElement('strong');title.textContent=item.title||'Архитектурный проект';
    const action=document.createElement('span');action.className='lens-go';action.textContent='Открыть публикацию ↗';
    card.append(photo,source,title,action);grid.append(card);
  }
}

function showWinner(result) {
  const ref = result.reference;
  const url = safeExternalUrl(ref?.link);
  const thumb = safeExternalUrl(ref?.thumbnail);
  if (!url || !thumb) {
    setRecommendationMessage('Поиск ответил, но выбранный источник не предоставил безопасную ссылку на изображение. Автоматический выбор не подтверждён.', 'НЕ УДАЛОСЬ ПОДТВЕРДИТЬ');
    return false;
  }
  state.winner = ref;
  state.suggestedRef = null;
  state.curation = result.direction;
  $('#referenceGrid').classList.remove('is-director-only');
  $('#bestSourceLink').hidden=false;
  $('#referenceGrid').hidden = false;
  $('#refHelp').hidden = true;
  $('#refsLabel').textContent = result.matchLevel==='lens'?'НАЙДЕНО ПО ФОТО / GOOGLE LENS':result.matchLevel==='approximate'?'01 / РЕФЕРЕНС ПО ПОХОЖЕЙ ФОРМЕ':'01 / ВЫБРАННЫЙ РЕФЕРЕНС';
  $('#bestRefImage').src = thumb;
  $('#bestRefImage').onerror = () => {
    $('#bestRefImage').alt = 'Превью не загрузилось — оригинал доступен по ссылке';
    $('#bestRefImage').style.display = 'none';
    $('#bestRefLink').style.background = '#262e2c';
  };
  $('#bestRefImage').style.display = '';
  $('#bestRefLink').href = url;
  $('#bestSourceLink').href = url;
  $('#bestTitle').textContent = result.matchLevel==='lens'?'Архитектурное совпадение по фото':result.matchLevel==='approximate'?'Похожий силуэт. Лучшая подача.':'Лучшее направление для этого проекта';
  $('#bestReason').textContent = result.matchLevel==='lens'?'Google Lens обнаружил визуальную схожесть с исходным изображением. Это реальная публикация, но её профессионализм, фотореализм и освещение не проверены нейросетью. Геометрию твоего дома не меняем.':result.matchLevel==='approximate'?'Референс используется только для художественной подачи. '+String(result.direction.reason||''):String(result.direction.reason||'Свет и окружение подбираются под исходный дом.');
  $('#bestLighting').textContent = String(result.direction.lightingDescription || MODES[result.direction.lighting]?.name || 'Выразительный натуральный дневной свет');
  $('#bestEnvironment').textContent = String(result.direction.environment || 'Индивидуальное окружение под стиль здания');
  $('#bestComposition').textContent = String(result.direction.composition || 'Архитектурная композиция при сохранении камеры исходного изображения');
  const shot = result.direction;
  $('#shotPlan').hidden = !(shot.focalPoint || shot.foreground || shot.middleGround || shot.background || shot.story);
  $('#bestFocalPoint').textContent = shot.focalPoint || 'Архитектура — главный герой кадра';
  $('#bestStory').textContent = shot.story || '';
  $('#bestForeground').textContent = shot.foreground || 'Передний план без перекрытия архитектуры';
  $('#bestMiddleGround').textContent = shot.middleGround || 'Архитектурный объём и его контакт с ландшафтом';
  $('#bestBackground').textContent = shot.background || 'Естественный и правдоподобный дальний план';
  $('#autoDirection').textContent = MODES[result.direction.lighting]?.name || MODES.sunlit.name;
  $('#directionReason').textContent = result.direction.reason || 'Профессиональная дневная архитектурная фотография.';
  $('#directionTag').textContent = result.matchLevel==='lens'?'ПОИСК ПО ФОТО / ДНЕВНАЯ ПОДАЧА':'РЕДАКЦИОННАЯ ПОДАЧА / ДЕНЬ';
  return true;
}
function showDirectorOnly(result){
  const shot=result?.direction;
  if(!shot)return false;
  const source=result.reference;
  const url=safeExternalUrl(source?.link);
  state.winner=null;
  state.suggestedRef=url?{...source,link:url}:null;
  state.curation=shot;
  $('#referenceGrid').hidden=false;
  $('#referenceGrid').classList.add('is-director-only');
  $('#refHelp').hidden=true;
  $('#refsLabel').textContent=url?'РЕДАКЦИОННЫЙ ПРИМЕР / НЕ СОВПАДЕНИЕ ПО ФОТО':'ПО ФОТО СОВПАДЕНИЙ НЕТ';
  const refLink=$('#bestSourceLink');
  refLink.hidden=!url;
  if(url){
    refLink.href=url;
    refLink.textContent='Открыть пример на '+String(source.sourceLabel||'Behance')+' ↗';
  }
  $('#bestTitle').textContent=url?'Профессиональная архитектурная подача':'Дневной свет и окружение для твоего дома';
  $('#bestReason').textContent=url?
    'Публикация выбрана по редакционному описанию, а не по загруженному фото. '+String(result.message||'Свет и окружение создаются отдельно для твоего дома.') :
    (result.message||'Фотографически подходящий референс не подтверждён.')+' Геометрия и ракурс твоего здания остаются исходными.';
  $('#bestLighting').textContent=shot.lightingDescription||'Естественный дневной свет';
  $('#bestEnvironment').textContent=shot.environment||'Индивидуальное окружение под характер дома';
  $('#bestComposition').textContent=shot.composition||'Исходная перспектива сохраняется';
  $('#shotPlan').hidden=false;
  $('#bestFocalPoint').textContent=shot.focalPoint||'Архитектура — главная тема кадра';
  $('#bestStory').textContent=shot.story||'Профессиональная дневная фотография';
  $('#bestForeground').textContent=shot.foreground||'Передний план не перекрывает дом';
  $('#bestMiddleGround').textContent=shot.middleGround||'Масштабная связь дома с участком';
  $('#bestBackground').textContent=shot.background||'Правдоподобный дальний план';
  $('#autoDirection').textContent=MODES[shot.lighting]?.name||MODES.soft.name;
  $('#directionReason').textContent=shot.reason||'Арт-дирекшн по исходной архитектуре';
  $('#directionTag').textContent='ДНЕВНАЯ ПОСТАНОВКА / АВТОМАТИЧЕСКИ';
  return true;
}
function modeFromAnalysis(a) {
  // The old "cinematic" label can be returned by earlier configured models; never map it to night.
  return ['sunlit','soft','golden','atmospheric'].includes(a?.choice) ? a.choice : 'sunlit';
}
function makePrompt(project) {
  if (!state.analysis) return;
  const a = state.analysis;
  const chosen = state.curation || {};
  const mode = MODES[chosen.lighting] || MODES[modeFromAnalysis(a)];
  const curated = Boolean(state.winner && state.curation);
  const directed = Boolean(state.curation);
  const prompt = `FORMA STUDIO / ARCHITECTURAL EDITORIAL ART DIRECTION
${curated ? (state.searchMethod==='google-lens'?'GOOGLE LENS VISUAL MATCH / PROFESSIONAL QUALITY NOT VERIFIED / ORIGINAL ARCHITECTURE LOCKED':'REFERENCE SELECTION / ORIGINAL ARCHITECTURE LOCKED') : directed ? (state.isVisualAnalysis ? 'PHOTO ANALYZED / EDITORIAL STAGING WITHOUT VERIFIED REFERENCE' : 'VISUAL AI UNAVAILABLE / ART DIRECTION BASED ON USER BRIEF, NOT VERIFIED GEOMETRY') : state.isVisualAnalysis ? 'VISION ANALYSIS / NO VERIFIED REFERENCE' : 'DRAFT BRIEF / NO VISUAL AI ANALYSIS'}

NON-NEGOTIABLE SOURCE OF TRUTH
If visual analysis failed, do NOT assume any model observed the building. The image-editing model must examine the ATTACHED ORIGINAL HOUSE IMAGE itself before changing only lighting, natural textures and the surrounding landscape.
Use the ATTACHED ORIGINAL HOUSE IMAGE as the exact architectural source, not as loose inspiration. Preserve the entire building design: footprint, volume, roof configuration and pitch, overhangs, facade geometry and joints, material authenticity, window and door number, sizes, exact placement, mullions, plinth, levels, stairs, openings and every architectural line. Preserve ORIGINAL CAMERA POSITION, lens perspective, eye level, viewpoint, orientation and building framing. Do not change the house to resemble the reference's building. Do not invent architectural components or landscape structures.

EDITORIAL SHOT DIRECTOR / PUBLIC ARCHVIZ PRINCIPLES
Develop one cohesive professional architectural editorial photograph rather than a generic glossy render. Work from the existing image toward a complete visual story: a clear visual hierarchy centred on the actual architecture; purposeful light revealing volumes and surfaces; an original, site-appropriate environment; near/middle/far layers making depth; nuanced atmospheric perspective, realistic surface and plant microdetail. The mood should emerge from THIS building, rather than following a fixed forest / plant / camera preset. Editorial image-making principles: same building, same camera, new light and environment, coherent storytelling.

ORIGINAL BUILDING
Type (user note, not proof): ${project.type || 'determine from image'}
User materials (preserve visible facts): ${project.materials || 'adhere to original image'}
User constraints: ${project.description || 'none beyond exact architecture lock'}
Architecture (VISUALLY VERIFIED ONLY IF STATED ABOVE; otherwise brief information, not facts): ${a.architecture || 'not inspected'}
Materials (must be verified against the attached source, not invented): ${a.materials || 'not inspected'}
Existing camera: ${a.composition || 'preserve original camera'}
Original lighting: ${a.lighting || 'not assessed'}

AUTOMATICALLY CHOSEN PHOTOGRAPHIC DIRECTION
${mode.name}
${mode.lighting}
${mode.camera}
Daylight only. Absolutely no night scenes, blue hour, dusk, twilight, dark evening, neon effects or artificially dominant window lighting.

${curated ? `REFERENCE-BASED ART DIRECTION (inspiration only, not geometry source)
Published visual-search match or editorial source (NOT necessarily professional or quality-verified): ${state.winner.sourceLabel} — ${state.winner.link}
SIMILAR FORM INSPIRATION ONLY: The reference building may be different; NEVER copy its geometry, windows, camera or floor count into the original. Borrow ONLY professional natural light, environment hierarchy, colour and editorial mood.
Why selected: ${chosen.reason || 'compatible architectural photo direction'}
Composition treatment: ${chosen.composition || 'preserve image perspective, refine visual hierarchy'}
Architectural hero / visual anchor: ${chosen.focalPoint || 'determine from the original architecture'}
Near-foreground shot staging: ${chosen.foreground || 'use only believable, architecture-friendly foreground depth'}
Middle-ground relationship to the building: ${chosen.middleGround || 'create credible hardscape/planting transition around the architecture'}
Distant landscape / horizon: ${chosen.background || 'site-consistent layered distance, without inventing observed location'}
Editorial story / emotional intention: ${chosen.story || 'one purposeful, photographed architectural editorial moment'}
Environment concept: ${chosen.environment || 'bespoke landscape matching building'}
Light treatment: ${chosen.lightingDescription || mode.lighting}
Material and colour balance: ${chosen.palette || 'restrained premium neutral grade'}
Camera treatment: ${chosen.camera || 'preserve original viewpoint'}` : directed ? `PROPOSED ORIGINAL ART DIRECTION — NO PHOTO REFERENCE VERIFIED
The following scene concept is a proposed artistic direction for the uploaded house. If visual AI was unavailable, it is based on USER-SUPPLIED BRIEF AND STRICT SOURCE-IMAGE PRESERVATION INSTRUCTIONS, NOT a verified reading of the image. Never invent unseen materials, geometry, site features or an external reference.
${state.suggestedRef ? `SIMILAR-FORM PROJECT PAGE ONLY (metadata match, image and daylight not verified): ${state.suggestedRef.sourceLabel} — ${state.suggestedRef.link}
Use this page solely as optional broad massing inspiration. Do not copy its house, geometry, materials, windows or lens; all daylight staging below is original.` : 'No verified source page was selected.'}
Daylight lighting: ${chosen.lightingDescription || mode.lighting}
Camera and composition (unchanged): ${chosen.composition || a.composition}
Architectural focal point: ${chosen.focalPoint || a.architecture}
Foreground treatment: ${chosen.foreground || 'create subtle natural depth'}
Middle-ground: ${chosen.middleGround || 'make building-ground contact plausible'}
Background: ${chosen.background || 'develop coherent distant scenery'}
Proposed environment: ${chosen.environment || 'choose according to actual house'}
Photographic narrative: ${chosen.story || 'natural editorial daytime moment'}
Colour palette: ${chosen.palette || 'faithful restrained colour'}
Optics (preserve source): ${chosen.camera || 'do not change source camera'}` : `REFERENCE STATUS
No verified professional reference has been visually selected. Do NOT pretend one was searched or approved. Develop the mood exclusively from the real source image and supplied brief.`}

ENVIRONMENT & VISUAL STORYTELLING
Choose landscape and context appropriate to the actual building's style, location cues and scale; create architectural depth without blocking facade or openings. Use coherent scene-building: foreground accents, convincing middle-ground planting and a natural distant background, with authentic species, correct scale, fine branches, controlled softness and believable contact shadows. Vary light direction and site rhythm in a physically plausible manner, keep the architecture dominant, make the frame emotionally engaging but photographically truthful. DO NOT impose a fixed list of junipers, hostas, shrubs or forest on every project.

QUALITY / CAMERA / OPTICAL REQUIREMENTS
Photo-realism is the absolute visual standard: the result must convincingly look like a professional architectural photograph rather than 3D CGI. Build physically believable architectural volume using lateral sunlight and visible bounce; preserve hard-soft shadow transitions, natural high-dynamic-range exposure, imperfect micro-roughness of plaster, brick, timber, metal and glazing, believable botanical detail, precise contact shadows and richly layered depth. Avoid flat evenly illuminated facades, plasticky smooth materials, generic staged landscaping, oversharpening, excessive HDR and AI-looking vegetation. Respect original camera and architecture even if a stronger composition would require moving it.
High-fidelity realistic architectural photography, microtexture, physically based reflections, credible roughness, clean contours, precise optical lines, convincing exposure, realistic atmospheric depth, rich colour separation, no excessive saturation, no AI textures, no smearing. Aim for 4K-level detail, 16:9 landscape output where compatible with the input; if cropping would alter the exact original framing, preserve the source framing instead.

NEGATIVES
Night, blue-hour darkness, dusk, purple sky, fake lighting, CGI plastic trees, generic luxury stock scenery, overdone sun flares, fake haze, blurred building details, inconsistent shadows, floating plants, duplicated windows, warped straight lines, moved camera, altered floor count, invented details, watermarks or text.

PRIORITIES
1) EXACT source building and camera. 2) Context-specific editorial visual story. 3) AI-selected daylight. 4) Architectural light and composition. 5) Precise materials and photorealism.`;
  state.prompt = prompt;
  $('#promptText').textContent = prompt;
  $('#promptState').textContent = curated ? (state.searchMethod==='google-lens'?'ПОИСК ПО ФОТО / ПРОМПТ ГОТОВ':'ГОТОВ / ПО ВЫБРАННОМУ РЕФЕРЕНСУ') : directed ? (state.isVisualAnalysis ? 'ГОТОВ / ИНДИВИДУАЛЬНАЯ ПОСТАНОВКА' : 'ГОТОВ / ПО БРИФУ, ФОТО НЕ ПРОВЕРЕНО') : state.isVisualAnalysis ? 'ПО ФОТО / БЕЗ ПОИСКА' : 'ЧЕРНОВИК / БЕЗ AI';
  $('#copyPrompt').disabled = false;
  $('#downloadPrompt').disabled = false;
}
function imageAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(new Error('Не удалось прочитать изображение'));
    reader.readAsDataURL(file);
  });
}
async function prepareImage(file,maxSide=1280,quality=0.82){
  let bmp;
  try{bmp=await createImageBitmap(file);}
  catch{return imageAsDataURL(file);}
  try{
    if(Math.max(bmp.width,bmp.height)<=maxSide&&file.size<500000)return await imageAsDataURL(file);
    const scale=Math.min(1,maxSide/Math.max(bmp.width,bmp.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bmp.width*scale));
    canvas.height=Math.max(1,Math.round(bmp.height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)return await imageAsDataURL(file);
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingQuality='high';ctx.drawImage(bmp,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',quality);
  }finally{bmp.close?.();}
}
async function updateImage(file){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alertStatus('Нужен JPG, PNG или WebP.','error');return;}
  if(file.size>8*1024*1024){alertStatus('Изображение больше 8 МБ. Уменьшите файл.','error');return;}
  const loadId=state.loadId=(state.loadId||0)+1;
  alertStatus('Подготавливаем изображение для быстрого архитектурного анализа…');
  try{
    // 1280px preview preserves presentation; 768px is a temporary low-bandwidth visual-analysis copy.
    const modelImage=await prepareImage(file,1280,0.82);
    const visionImage=await prepareImage(file,768,0.74);
    if(loadId!==state.loadId)return;
    state.file=file;state.image=modelImage;state.visionImage=visionImage;
    state.suggestedRef=null;state.photoSearchConfirmed=false;state.searchMethod=null;
    state.analysis=null;state.winner=null;state.curation=null;state.prompt='';
    $('#lensResults').hidden=true;$('#lensGrid').replaceChildren();
    state.progressPct=0;$('#processingProgress').hidden=true;
    $('#shotPlan').hidden=true;
    $('#projectPreview').src=modelImage;$('#projectPreview').hidden=false;$('#emptyScene').hidden=true;
    $('#dropTitle').textContent='Заменить изображение';$('#dropHint').textContent='Нажмите, чтобы загрузить другое';
    $('#imageLabel').textContent=file.name.length>28?file.name.slice(0,24)+'…':file.name;
    setRecommendationMessage('Новый проект загружен. Запустите автоматический отбор.','ОЖИДАНИЕ АНАЛИЗА');
    $('#promptText').textContent='Начните анализ, чтобы составить промпт по этому изображению.';
    $('#promptState').textContent='ПРОМПТ НЕ ГОТОВ';
    $('#copyPrompt').disabled=true;$('#downloadPrompt').disabled=true;
    alertStatus('Изображение готово. Исходная геометрия и ракурс сохраняются.','success');
  }catch(err){alertStatus('Не удалось подготовить изображение: '+String(err.message||err),'error');}
}
async function requestJson(url, options={}) {
  const response = await fetch(url, options);
  let body;
  try { body = await response.json(); } catch { throw new Error('Сервер вернул нечитаемый ответ.'); }
  if (!response.ok) throw new Error(body?.error || `Ошибка ${response.status}`);
  return body;
}
async function runProject(event){
  event.preventDefault();
  if(state.working)return;
  if(!state.image){alertStatus('Сначала загрузите изображение дома.','error');return;}
  const project=collectProject();
  state.winner=null;state.suggestedRef=null;state.curation=null;state.analysis=null;state.isVisualAnalysis=false;state.photoSearchConfirmed=false;state.searchMethod=null;
  $('#lensResults').hidden=true;$('#lensGrid').replaceChildren();
  state.progressPct=0;
  setRecommendationMessage('Ищем реальные архитектурные изображения по загруженному фото…','GOOGLE LENS / ПОИСК ПО ФОТО');
  setBusy(true);
  showProgress(1,'Подготавливаем фото для поиска Google Lens…');
  try{
    const uploaded=await uploadJob(state.visionImage||state.image,project);
    showProgress(uploaded.progress||12,'Изображение передано. Ищем визуально похожие работы…');
    const job=await trackJob(uploaded.jobId);
    if(job.analysis){
      state.analysis=job.analysis;
      state.isVisualAnalysis=state.analysis.visualVerified===true;
      state.photoSearchConfirmed=job.curation?.photoSearchConfirmed===true;
      state.searchMethod=job.curation?.searchMethod||null;
      showAnalysis(state.analysis,state.isVisualAnalysis);
      if(state.photoSearchConfirmed){
        $('#analysisTag').textContent='GOOGLE LENS / ПОИСК ПО ФОТО';
        $('#analysisOrigin').textContent='ВИЗУАЛЬНЫЙ ПОИСК / НЕ АНАЛИЗ МОДЕЛЬЮ';
        $('#analysisConfidence').textContent='ИСХОДНОЕ ИЗОБРАЖЕНИЕ ИСПОЛЬЗОВАНО';
        $('#analysisReason').textContent='Поиск выполнен по загруженной фотографии. Форму дома отдельная визуальная модель не описывала.';
      }
      renderLensResults(job.curation?.visualMatches||[]);
      const suggested=MODES[modeFromAnalysis(state.analysis)];
      $('#autoDirection').textContent=suggested.name;
      $('#directionReason').textContent=state.analysis.reason||'Индивидуальная дневная постановка';
      $('#directionTag').textContent='ДЕНЬ / АВТОМАТИЧЕСКИ';
      if(job.curation?.searchMethod==='google-lens'&&job.curation.reference?.thumbnail&&job.curation.direction&&showWinner(job.curation)){
        alertStatus('По загруженной фотографии найдены настоящие архитектурные публикации. Превью и ссылки доступны ниже.','success');
      }else if(job.curation?.metadataOnly&&job.curation.direction&&showDirectorOnly(job.curation)){
        alertStatus(job.curation.message||'Совпадений по фото нет: предложена отдельная подборка Behance / ANT.','info');
      }else if(job.curation?.direction&&showDirectorOnly(job.curation)){
        alertStatus(job.curation.message||'Поиск завершён. Визуальные совпадения не найдены.','info');
      }else{
        setRecommendationMessage(job.curation?.message||'Похожих архитектурных публикаций не найдено.','ПУБЛИКАЦИИ НЕ НАЙДЕНЫ');
        alertStatus('Поиск завершён: архитектурных совпадений нет.','info');
      }
      showProgress(100,job.message||'Поиск по фото завершён.',true);
      makePrompt(project);
    }else{
      state.analysis=manualAnalysis(project);
      showAnalysis(state.analysis,false);
      const reason=job.error||job.message||'Неизвестная ошибка';
      setRecommendationMessage('Визуальный анализ не завершён: '+reason+'. Промпт ниже — только черновик.','ОШИБКА АНАЛИЗА');
      $('#directionReason').textContent='Выбор освещения по фотографии не подтверждён.';
      alertStatus('Визуальная модель не завершила анализ: '+reason,'error');
      showProgress(job.progress||12,reason);
      makePrompt(project);
    }
    $('#analysis').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    alertStatus('Не удалось завершить обработку: '+String(err.message||err),'error');
    showProgress(state.progressPct,'Ошибка: '+String(err.message||err));
  }finally{setBusy(false);}
}
function downloadPrompt() {
  if (!state.prompt) return;
  const blob = new Blob([state.prompt], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'forma-studio-art-direction.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function init() {
  try {
    state.config = await requestJson('/api/config');
    $('#connectStatus').textContent = `● AI ${state.config.ai ? 'ON':'OFF'} · SEARCH ${state.config.search ? 'ON':'OFF'}`;
    $('#connectStatus').title = 'Статусы серверных ключей, без раскрытия значений';
    if (state.config.ai && state.config.search) alertStatus('Режим автоматического арт-дирекшна доступен. Загрузите исходную архитектуру.', 'success');
    else if(state.config.search) alertStatus('Поиск референсов подключён (' + (state.config.searchProvider || 'Search') + '). Для выбора лучшей постановки по фотографии осталось подключить VISION_API_KEY.');
    else if(state.config.ai) alertStatus('Визуальный AI подключён. Для поиска профессиональных фотографий нужен SERPER_API_KEY.');
    else alertStatus('Для автоматического подбора референсов нужно подключить поиск Serper и визуальный AI. Случайные карточки отключены.');
  } catch { alertStatus('Не удалось проверить сервер. Проверьте подключение к FORMA STUDIO.', 'error'); }
  const zone = $('#dropZone'); const input = $('#imageInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', event => {if (event.target === zone && (event.key === 'Enter' || event.key === ' ')) {event.preventDefault(); input.click();}});
  $('#chooseImage').addEventListener('click', event => {event.stopPropagation(); input.click();});
  input.addEventListener('change', event => updateImage(event.target.files?.[0]));
  for (const eventName of ['dragenter','dragover']) zone.addEventListener(eventName, event => {event.preventDefault(); zone.classList.add('is-over');});
  for (const eventName of ['dragleave','drop']) zone.addEventListener(eventName, event => {event.preventDefault(); zone.classList.remove('is-over');});
  zone.addEventListener('drop', event => updateImage(event.dataTransfer?.files?.[0]));
  $('#projectForm').addEventListener('submit', runProject);
  $('#copyPrompt').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(state.prompt); alertStatus('Промпт скопирован.', 'success'); }
    catch { alertStatus('Не удалось скопировать. Можно скачать TXT.', 'error'); }
  });
  $('#downloadPrompt').addEventListener('click', downloadPrompt);
  for (const link of document.querySelectorAll('.nav-item')) link.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('is-current'));
    link.classList.add('is-current');
  });
}
init();
