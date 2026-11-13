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
  image: null, file: null, config: {ai: false, search: false},
  analysis: null, isVisualAnalysis: false, winner: null, curation: null,
  prompt: '', working: false, progressPct: 0
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
  button.innerHTML=busy?'Обработка <span>'+state.progressPct+'%</span>':'Найти лучшее решение <span>↗</span>';
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
  const upperBounds={vision:40,structure:56,brief:62,search:76,ranking:91,scene:98};
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
  $('#analysisTag').textContent = visual ? 'AI / РАСПОЗНАНО ПО ФОТО' : 'БРИФ / НЕ AI-АНАЛИЗ';
  $('#analysisOrigin').textContent = visual ? 'ARCHITECTURE / IMAGE-BASED' : 'PROJECT / PARAMETERS ONLY';
  $('#analysisConfidence').textContent = visual ? `УВЕРЕННОСТЬ: ${String(a.confidence || '—').toUpperCase()}` : 'AI НЕ ПОДКЛЮЧЕН';
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
function showWinner(result) {
  const ref = result.reference;
  const url = safeExternalUrl(ref?.link);
  const thumb = safeExternalUrl(ref?.thumbnail);
  if (!url || !thumb) {
    setRecommendationMessage('Поиск ответил, но выбранный источник не предоставил безопасную ссылку на изображение. Автоматический выбор не подтверждён.', 'НЕ УДАЛОСЬ ПОДТВЕРДИТЬ');
    return false;
  }
  state.winner = ref;
  state.curation = result.direction;
  $('#referenceGrid').classList.remove('is-director-only');
  $('#bestSourceLink').hidden=false;
  $('#referenceGrid').hidden = false;
  $('#refHelp').hidden = true;
  $('#refsLabel').textContent = result.matchLevel==='approximate'?'01 / РЕФЕРЕНС ПО ПОХОЖЕЙ ФОРМЕ':'01 / ВЫБРАННЫЙ РЕФЕРЕНС';
  $('#bestRefImage').src = thumb;
  $('#bestRefImage').onerror = () => {
    $('#bestRefImage').alt = 'Превью не загрузилось — оригинал доступен по ссылке';
    $('#bestRefImage').style.display = 'none';
    $('#bestRefLink').style.background = '#262e2c';
  };
  $('#bestRefImage').style.display = '';
  $('#bestRefLink').href = url;
  $('#bestSourceLink').href = url;
  $('#bestTitle').textContent = result.matchLevel==='approximate'?'Похожий силуэт. Лучшая подача.':'Лучшее направление для этого проекта';
  $('#bestReason').textContent = result.matchLevel==='approximate'? 'Архитектура референса не повторяет твой дом. Используем только принцип подачи: освещение, окружение и художественную композицию. '+String(result.direction.reason||''):String(result.direction.reason || 'Референс выбран визуальной AI-моделью по архитектурному соответствию и качеству арт-дирекшна.');
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
  $('#directionTag').textContent = 'ОТОБРАНО AI / ДЕНЬ';
  return true;
}
function showDirectorOnly(result){
  const shot=result?.direction;
  if(!shot)return false;
  state.winner=null;
  state.curation=shot;
  $('#referenceGrid').hidden=false;
  $('#referenceGrid').classList.add('is-director-only');
  $('#refHelp').hidden=true;
  $('#bestSourceLink').hidden=true;
  $('#refsLabel').textContent='01 / АВТОРСКАЯ ПОСТАНОВКА БЕЗ ФОТОРЕФЕРЕНСА';
  $('#bestTitle').textContent='Свет, окружение и подача для твоего дома';
  $('#bestReason').textContent=(result.message||'Фотографически подходящий референс не подтверждён.')+' Не изменяем геометрию и ракурс исходного здания.';
  $('#bestLighting').textContent=shot.lightingDescription||'Выразительный естественный дневной свет';
  $('#bestEnvironment').textContent=shot.environment||'Индивидуальный ландшафт по архитектуре';
  $('#bestComposition').textContent=shot.composition||'Исходный ракурс и перспектива неизменны';
  $('#shotPlan').hidden=false;
  $('#bestFocalPoint').textContent=shot.focalPoint||'Архитектура — основной акцент';
  $('#bestStory').textContent=shot.story||'Съёмка при естественном дневном свете';
  $('#bestForeground').textContent=shot.foreground||'Деликатный первый план без перекрытия здания';
  $('#bestMiddleGround').textContent=shot.middleGround||'Дом и участок в естественном масштабе';
  $('#bestBackground').textContent=shot.background||'Дальний фон создаёт правдоподобную глубину';
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
${curated ? 'IMAGE-BASED REFERENCE SELECTION / SOURCE ARCHITECTURE LOCKED' : directed ? 'IMAGE-BASED ARCHITECTURE ANALYSIS / PROPOSED ART DIRECTION WITHOUT VERIFIED REFERENCE' : state.isVisualAnalysis ? 'VISION ANALYSIS / NO VERIFIED REFERENCE SEARCH' : 'DRAFT BRIEF / NO VISUAL AI ANALYSIS'}

NON-NEGOTIABLE SOURCE OF TRUTH
Use the ATTACHED ORIGINAL HOUSE IMAGE as the exact architectural source, not as loose inspiration. Preserve the entire building design: footprint, volume, roof configuration and pitch, overhangs, facade geometry and joints, material authenticity, window and door number, sizes, exact placement, mullions, plinth, levels, stairs, openings and every architectural line. Preserve ORIGINAL CAMERA POSITION, lens perspective, eye level, viewpoint, orientation and building framing. Do not change the house to resemble the reference's building. Do not invent architectural components or landscape structures.

EDITORIAL SHOT DIRECTOR / PUBLIC ARCHVIZ PRINCIPLES
Develop one cohesive professional architectural editorial photograph rather than a generic glossy render. Work from the existing image toward a complete visual story: a clear visual hierarchy centred on the actual architecture; purposeful light revealing volumes and surfaces; an original, site-appropriate environment; near/middle/far layers making depth; nuanced atmospheric perspective, realistic surface and plant microdetail. The mood should emerge from THIS building, rather than following a fixed forest / plant / camera preset. Editorial image-making principles: same building, same camera, new light and environment, coherent storytelling.

ORIGINAL BUILDING
Type (user note, not proof): ${project.type || 'determine from image'}
User materials (preserve visible facts): ${project.materials || 'adhere to original image'}
User constraints: ${project.description || 'none beyond exact architecture lock'}
Observed architecture: ${a.architecture || 'unspecified'}
Observed materials: ${a.materials || 'verify against original'}
Existing camera: ${a.composition || 'preserve original camera'}
Original lighting: ${a.lighting || 'not assessed'}

AUTOMATICALLY CHOSEN PHOTOGRAPHIC DIRECTION
${mode.name}
${mode.lighting}
${mode.camera}
Daylight only. Absolutely no night scenes, blue hour, dusk, twilight, dark evening, neon effects or artificially dominant window lighting.

${curated ? `REFERENCE-BASED ART DIRECTION (inspiration only, not geometry source)
Chosen professional reference: ${state.winner.sourceLabel} — ${state.winner.link}
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
The following scene concept was developed only from the UPLOADED HOUSE, NOT from any supposedly selected source photo. Never invent an external reference.
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
High-fidelity realistic architectural photography, microtexture, physically based reflections, credible roughness, clean contours, precise optical lines, convincing exposure, realistic atmospheric depth, rich colour separation, no excessive saturation, no AI textures, no smearing. Aim for 4K-level detail, 16:9 landscape output where compatible with the input; if cropping would alter the exact original framing, preserve the source framing instead.

NEGATIVES
Night, blue-hour darkness, dusk, purple sky, fake lighting, CGI plastic trees, generic luxury stock scenery, overdone sun flares, fake haze, blurred building details, inconsistent shadows, floating plants, duplicated windows, warped straight lines, moved camera, altered floor count, invented details, watermarks or text.

PRIORITIES
1) EXACT source building and camera. 2) Context-specific editorial visual story. 3) AI-selected daylight. 4) Architectural light and composition. 5) Precise materials and photorealism.`;
  state.prompt = prompt;
  $('#promptText').textContent = prompt;
  $('#promptState').textContent = curated ? 'ГОТОВ / ПО ВЫБРАННОМУ РЕФЕРЕНСУ' : directed ? 'ГОТОВ / ИНДИВИДУАЛЬНАЯ ПОСТАНОВКА' : state.isVisualAnalysis ? 'ПО ФОТО / БЕЗ ПОИСКА' : 'ЧЕРНОВИК / БЕЗ AI';
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
async function prepareImage(file){
  let bmp;
  try{bmp=await createImageBitmap(file);}
  catch{return imageAsDataURL(file);}
  try{
    const maxSide=1280;
    if(Math.max(bmp.width,bmp.height)<=maxSide&&file.size<500000)return await imageAsDataURL(file);
    const scale=Math.min(1,maxSide/Math.max(bmp.width,bmp.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bmp.width*scale));
    canvas.height=Math.max(1,Math.round(bmp.height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)return await imageAsDataURL(file);
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingQuality='high';ctx.drawImage(bmp,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',0.82);
  }finally{bmp.close?.();}
}
async function updateImage(file){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alertStatus('Нужен JPG, PNG или WebP.','error');return;}
  if(file.size>8*1024*1024){alertStatus('Изображение больше 8 МБ. Уменьшите файл.','error');return;}
  const loadId=state.loadId=(state.loadId||0)+1;
  alertStatus('Подготавливаем изображение для быстрого архитектурного анализа…');
  try{
    const modelImage=await prepareImage(file);
    if(loadId!==state.loadId)return;
    state.file=file;state.image=modelImage;
    state.analysis=null;state.winner=null;state.curation=null;state.prompt='';
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
  state.winner=null;state.curation=null;state.analysis=null;state.isVisualAnalysis=false;
  state.progressPct=0;
  setRecommendationMessage('Готовим анализ и поиск профессиональных референсов…','AI ART DIRECTOR');
  setBusy(true);
  showProgress(1,'Подготовка проекта к отправке…');
  try{
    const uploaded=await uploadJob(state.image,project);
    showProgress(uploaded.progress||12,'Изображение передано. Распознаём архитектуру…');
    const job=await trackJob(uploaded.jobId);
    if(job.analysis){
      state.analysis=job.analysis;
      state.isVisualAnalysis=true;
      showAnalysis(state.analysis,true);
      const suggested=MODES[modeFromAnalysis(state.analysis)];
      $('#autoDirection').textContent=suggested.name;
      $('#directionReason').textContent=state.analysis.reason||'Индивидуальная дневная постановка';
      $('#directionTag').textContent='ДЕНЬ / АВТОМАТИЧЕСКИ';
      if(job.curation?.available&&job.curation.reference&&job.curation.direction&&showWinner(job.curation)){
        alertStatus(job.curation.matchLevel==='approximate'?'Подобран референс по похожей форме — свет, окружение и подача адаптированы к твоему дому.':'Готово: выбран дневной референс и подготовлен профессиональный промпт.','success');
      }else if(job.curation?.direction&&showDirectorOnly(job.curation)){
        alertStatus('Архитектура проанализирована. Подобран индивидуальный свет и окружение без неподтверждённой фотографии.','success');
      }else{
        setRecommendationMessage(job.curation?.message||'Подходящих подтверждённых дневных референсов не найдено.','РЕФЕРЕНС НЕ ПОДТВЕРЖДЁН');
        alertStatus('Анализ архитектуры готов. Подтверждённый референс не выбран.','info');
      }
      showProgress(100,'Анализ завершён. Промпт готов.',true);
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
