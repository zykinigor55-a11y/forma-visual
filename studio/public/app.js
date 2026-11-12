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
  prompt: '', working: false
};

function alertStatus(message, type='info') {
  const node = $('#liveNotice');
  node.className = `live-notice ${type === 'info' ? '' : type}`;
  node.querySelector('span:last-child').textContent = message;
}
function setBusy(busy) {
  state.working = busy;
  const button = $('#analyzeBtn'); button.disabled = busy;
  button.innerHTML = busy ? 'Идёт арт-дирекшн <span>⋯</span>' : 'Найти лучшее решение <span>↗</span>';
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
  $('#referenceGrid').hidden = false;
  $('#refHelp').hidden = true;
  $('#refsLabel').textContent = '01 / ВЫБРАННЫЙ РЕФЕРЕНС';
  $('#bestRefImage').src = thumb;
  $('#bestRefImage').onerror = () => {
    $('#bestRefImage').alt = 'Превью не загрузилось — оригинал доступен по ссылке';
    $('#bestRefImage').style.display = 'none';
    $('#bestRefLink').style.background = '#262e2c';
  };
  $('#bestRefImage').style.display = '';
  $('#bestRefLink').href = url;
  $('#bestSourceLink').href = url;
  $('#bestTitle').textContent = 'Лучшее направление для этого проекта';
  $('#bestReason').textContent = String(result.direction.reason || 'Референс выбран визуальной AI-моделью по архитектурному соответствию и качеству арт-дирекшна.');
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
  const prompt = `FORMA STUDIO / ARCHITECTURAL EDITORIAL ART DIRECTION
${curated ? 'IMAGE-BASED AI CURATION / VERIFIED REFERENCE SELECTION' : state.isVisualAnalysis ? 'VISION ANALYSIS / NO VERIFIED REFERENCE SEARCH' : 'DRAFT BRIEF / NO VISUAL AI ANALYSIS'}

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
Camera treatment: ${chosen.camera || 'preserve original viewpoint'}` : `REFERENCE STATUS
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
  $('#promptState').textContent = curated ? 'ГОТОВ / ПО ВЫБРАННОМУ РЕФЕРЕНСУ' : state.isVisualAnalysis ? 'ПО ФОТО / БЕЗ ПОИСКА' : 'ЧЕРНОВИК / БЕЗ AI';
  $('#copyPrompt').disabled = false;
  $('#downloadPrompt').disabled = false;
}
function updateImage(file) {
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { alertStatus('Нужен JPG, PNG или WebP.', 'error'); return; }
  if (file.size > 8 * 1024 * 1024) { alertStatus('Изображение больше 8 МБ. Уменьшите файл.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    state.file = file; state.image = String(reader.result || '');
    state.analysis = null; state.winner = null; state.curation = null; state.prompt = '';
    $('#shotPlan').hidden = true;
    $('#projectPreview').src = state.image; $('#projectPreview').hidden = false; $('#emptyScene').hidden = true;
    $('#dropTitle').textContent = 'Заменить изображение'; $('#dropHint').textContent = 'Нажмите, чтобы загрузить другое';
    $('#imageLabel').textContent = file.name.length > 28 ? file.name.slice(0,24) + '…' : file.name;
    setRecommendationMessage('Новый проект загружен. Запустите автоматический отбор.', 'ОЖИДАНИЕ АНАЛИЗА');
    $('#promptText').textContent = 'Начните анализ, чтобы составить промпт по этому изображению.';
    $('#promptState').textContent = 'ПРОМПТ НЕ ГОТОВ';
    $('#copyPrompt').disabled = true; $('#downloadPrompt').disabled = true;
    alertStatus('Изображение загружено. Архитектура и ракурс останутся неизменными.', 'success');
  };
  reader.onerror = () => alertStatus('Не удалось прочитать изображение.', 'error');
  reader.readAsDataURL(file);
}
async function requestJson(url, options={}) {
  const response = await fetch(url, options);
  let body;
  try { body = await response.json(); } catch { throw new Error('Сервер вернул нечитаемый ответ.'); }
  if (!response.ok) throw new Error(body?.error || `Ошибка ${response.status}`);
  return body;
}
async function runProject(event) {
  event.preventDefault();
  if (state.working) return;
  if (!state.image) { alertStatus('Сначала загрузите изображение дома, чтобы анализировать именно его.', 'error'); return; }
  const project = collectProject();
  state.winner = null; state.curation = null; state.isVisualAnalysis = false;
  setRecommendationMessage('Анализируем архитектуру и подбираем визуальный сценарий…', 'AI ART DIRECTOR');
  setBusy(true);
  let issue = '';
  try {
    if (state.config.ai) {
      alertStatus('AI исследует исходную архитектуру, материалы и неизменяемый ракурс…');
      try {
        const result = await requestJson('/api/analyze', {
          method:'POST', headers:{'content-type':'application/json'},
          body:JSON.stringify({image:state.image, project})
        });
        if (result.available && result.result) {
          state.analysis = result.result;
          state.isVisualAnalysis = true;
        } else issue = result.message || 'AI не настроен';
      } catch (error) { issue = error.message; }
    } else issue = 'Для анализа фото нужен VISION_API_KEY';
    if (!state.isVisualAnalysis) state.analysis = manualAnalysis(project);
    showAnalysis(state.analysis, state.isVisualAnalysis);
    const suggested = MODES[modeFromAnalysis(state.analysis)];
    $('#autoDirection').textContent = suggested.name;
    $('#directionReason').textContent = state.isVisualAnalysis ? state.analysis.reason : 'Профессиональный выбор света по изображению пока не выполнен.';
    $('#directionTag').textContent = 'ДЕНЬ / АВТОМАТИЧЕСКИ';
    if (state.isVisualAnalysis && state.config.search) {
      alertStatus('Ищем реальные работы по пяти площадкам и сравниваем их изображения с архитектурой дома…');
      try {
        const curated = await requestJson('/api/direct', {
          method:'POST', headers:{'content-type':'application/json'},
          body:JSON.stringify({image:state.image, project, query:state.analysis.query})
        });
        if (curated.available && curated.reference && curated.direction && showWinner(curated)) {
          alertStatus('Лучший референс выбран после визуального сравнения. Свет — дневной, архитектура и камера защищены.', 'success');
        } else {
          setRecommendationMessage(curated.message || 'Подходящих дневных референсов для этого дома не найдено. Не будем выдавать случайное изображение за лучший вариант.', 'ОТБОР НЕ ПОДТВЕРЖДЁН');
          alertStatus('Анализ дома выполнен, но визуальный выбор референса не подтверждён.', 'info');
        }
      } catch (error) {
        setRecommendationMessage('Нельзя подтвердить лучший референс: ' + error.message, 'ОТБОР НЕ ЗАВЕРШЁН');
        alertStatus('Не удалось сравнить источники: ' + error.message, 'error');
      }
    } else if (state.isVisualAnalysis) {
      setRecommendationMessage('AI изучил архитектуру, но поиск по профессиональным площадкам выключен. Чтобы выбрать лучший референс по изображениям, подключите TAVILY_API_KEY (бесплатный) или BRAVE_SEARCH_API_KEY в Render.', 'ПОИСК НЕ ПОДКЛЮЧЁН');
      alertStatus('Анализ изображения готов. Поиск профессиональных референсов требует TAVILY_API_KEY (бесплатный) или BRAVE_SEARCH_API_KEY.');
    } else {
      setRecommendationMessage('Автоматический арт-дирекшн ещё не запущен: нужен визуальный VISION_API_KEY и TAVILY_API_KEY (бесплатный) или BRAVE_SEARCH_API_KEY. Ниже доступен лишь честно помеченный черновик промпта.', 'НЕ ХВАТАЕТ ПОДКЛЮЧЕНИЙ');
      alertStatus(issue + '. Для поиска и выбора референса также нужен TAVILY_API_KEY (бесплатный) или BRAVE_SEARCH_API_KEY.', 'error');
    }
    makePrompt(project);
    $('#analysis').scrollIntoView({behavior:'smooth', block:'start'});
  } catch (error) { alertStatus('Ошибка анализа: ' + error.message, 'error'); }
  finally { setBusy(false); }
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
    else alertStatus('Для настоящего автоматического поиска и визуального отбора нужны AI и поисковый API. Случайные карточки и имитация поиска отключены.');
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
