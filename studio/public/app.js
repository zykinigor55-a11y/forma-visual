const $ = (sel) => document.querySelector(sel);
const sources = [
  {id:'behance',label:'Behance',domain:'behance.net',abbr:'BE'},
  {id:'divisare',label:'Divisare',domain:'divisare.com',abbr:'DI'},
  {id:'archdaily',label:'ArchDaily',domain:'archdaily.com',abbr:'AD'},
  {id:'cgconnect',label:'CGconnect',domain:'cgconnect.chaos.com',abbr:'CG'},
  {id:'dezeen',label:'Dezeen',domain:'dezeen.com',abbr:'DZ'}
];
const directions = {
  editorial: {num:'01', title:'Editorial / Daylight', sub:'Мягкий солнечный свет, чистые материалы, выразительные тени, зелень и глубина переднего плана.', mood:'СВЕТ · 09:30', time:'Bright late-morning sunlight with credible solar direction, dimensional cast shadows, natural dynamic range, vibrant but realistic greens. Clean premium editorial architectural photography. Layered foreground with soft plant occlusion: junipers, hostas, dwarf willow, architectural landscaping, a strong yet physically plausible shadow rhythm.',camera:'Nikon Z8, NIKKOR Z 24–70mm f/2.8 S, focal length 35mm, f/8, ISO 64, 1/250 s, tripod-height eye-level composition.',palette:['#d8d7c3','#a8ac95','#697865','#3d4640'],sun:'#ede4c9'},
  cinematic: {num:'02',title:'Cinematic / Blue Hour',sub:'Синий час, сдержанный драматизм и тёплая подсветка помещений, которая подчёркивает форму.',mood:'СИНИЙ ЧАС · 19:40',time:'Deep blue hour immediately after sunset. Cool cobalt sky and controlled low-level ambient bounce, realistic warm 2700–3000 K window light, subtle architectural accent lighting, legible dark cladding and gentle reflections. Atmospheric yet natural architectural editorial photography. Do not invent new windows or fixtures.',camera:'Nikon Z8, NIKKOR Z 24–70mm f/2.8 S, 35mm, f/8, ISO 64, 1/10 s on tripod, natural exposure with recovered highlight detail.',palette:['#77858d','#4c616c','#303b41','#21282d'],sun:'#e7c18d'},
  atmospheric: {num:'03',title:'Atmospheric / Soft Light',sub:'Рассеянный свет, лёгкая дымка и спокойная палитра, с вниманием к фактуре фасада.',mood:'OVERCAST · 11:00',time:'Premium soft overcast daylight with a subtle atmospheric haze in the distant background, diffuse skylight revealing real facade texture, delicate shadow transitions, natural muted forest greens. Deep perspective created by vegetation near camera and layered background, not by altering the house. Calm, photographic and non-synthetic.',camera:'Nikon Z8, NIKKOR Z 24–70mm f/2.8 S, 40mm, f/8, ISO 100, 1/160 s, restrained natural color grade.',palette:['#aeb7ae','#919e96','#6d7b70','#4c5b53'],sun:'#eee9e2'}
};
const state={file:null,image:null,config:{ai:false,search:false},analysis:null,selected:'editorial',resultPrompt:'',refs:[],sourceStatus:[],searched:false,working:false};

function alertStatus(message,type='info'){
  const n=$('#liveNotice');n.className=`live-notice ${type==='info'?'':type}`;
  n.querySelector('span:last-child').textContent=message;
}
function setBusy(busy){state.working=busy;const btn=$('#analyzeBtn');btn.disabled=busy;btn.innerHTML=busy?'Обработка проекта <span>⋯</span>':'Начать анализ <span>↗</span>';}
function safeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function queryForProject(type,materials){
  let base='contemporary architectural house';
  if(/брус|сосн|кело|дерев|древес|сибир/.test((type+' '+materials).toLowerCase()))base='premium timber wooden house exterior';
  if(/барн/.test(type.toLowerCase()))base='modern barn house architecture exterior';
  if(/кирпич/.test((type+' '+materials).toLowerCase()))base='contemporary brick plaster house facade';
  if(/вилла|минимал/.test(type.toLowerCase()))base='minimalist contemporary villa exterior';
  return base;
}
function preferredDirection(type,materials,notes){
  const all=(type+' '+materials+' '+notes).toLowerCase();
  if(/вечер|синий час|ноч|blue hour/.test(all))return 'cinematic';
  if(/туман|пасмур|fog|overcast/.test(all))return 'atmospheric';
  return 'editorial';
}
function collectProject(){return {type:$('#buildingType').value,materials:$('#materials').value.trim(),description:$('#notes').value.trim(),lockGeometry:true};}
function manualAnalysis(project){
  const choice=preferredDirection(project.type,project.materials,project.description);
  return {architecture:`${project.type}. Оценка по введённым параметрам, не по изображению.`,materials:project.materials||'Материал не задан',composition:'Ракурс исходного изображения сохраняется. Параметры перспективы требуют визуальной оценки AI-моделью.',lighting:'Исходное освещение не определено автоматически; ниже можно выбрать художественное направление.',query:queryForProject(project.type,project.materials),choice,reason:'Рекомендация основана на типе здания и ваших параметрах. Для анализа фотографии и более точного арт-дирекшна необходимо подключить визуальную AI-модель.',confidence:'not-analyzed',constraints:['Точно сохранить геометрию, пропорции и конфигурацию кровли','Не менять положения, размеры и количество окон и дверей','Сохранить исходную точку съёмки и перспективу']};
}
function showAnalysis(result,real){
  $('#analysisEmpty').hidden=true;$('#analysisResults').hidden=false;
  $('#analysisTag').textContent=real?'ПРОВЕРЕНО ПО ИЗОБРАЖЕНИЮ':'РЕЖИМ ПО ОПИСАНИЮ';
  $('#analysisOrigin').textContent=real?'AI / ИЗОБРАЖЕНИЕ И ПАРАМЕТРЫ':'BRIEF / ДАННЫЕ ПОЛЬЗОВАТЕЛЯ';
  $('#analysisConfidence').textContent=real?('УВЕРЕННОСТЬ: '+(result.confidence||'—').toUpperCase()):'БЕЗ АНАЛИЗА ФОТО';
  $('#architectureText').textContent=result.architecture;
  $('#analysisReason').textContent=result.reason;
  $('#materialText').textContent=result.materials;
  $('#compositionText').textContent=result.composition;
  $('#lightingText').textContent=result.lighting;
}
function sourceUrl(domain,q){return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(`site:${domain} ${q} architectural exterior photography`);}
function referenceCard(source,item,query){
  const card=document.createElement('article');card.className='ref-card';
  const link=document.createElement('a');link.className='ref-thumb';link.target='_blank';link.rel='noopener noreferrer';link.href=item?item.link:sourceUrl(source.domain,query);
  if(item){const img=document.createElement('img');img.loading='lazy';img.alt=item.title||'Архитектурный референс';img.referrerPolicy='no-referrer';img.src=item.thumbnail;img.onerror=()=>{img.remove();const s=document.createElement('span');s.className='ref-placeholder';s.textContent=source.abbr;link.append(s);};link.append(img);}
  else {const s=document.createElement('span');s.className='ref-placeholder';s.textContent=source.abbr;link.append(s);}
  const body=document.createElement('div');body.className='ref-body';
  const src=document.createElement('span');src.className='ref-source';src.textContent=source.label.toUpperCase();
  const title=document.createElement('div');title.className='ref-title';title.textContent=item?(item.title||'Архитектурный референс'):'Открыть поиск по этой площадке';
  const go=document.createElement('a');go.className='ref-link';go.target='_blank';go.rel='noopener noreferrer';go.href=link.href;go.textContent=item?'Перейти к первоисточнику ↗':'Искать изображения ↗';
  body.append(src,title,go);card.append(link,body);return card;
}
function renderReferences(query,searchResult){
  const grid=$('#referenceGrid');grid.replaceChildren();
  const results=searchResult?.results || [];
  for(const s of sources){
    const items=results.filter(r=>r.source===s.id);
    if(items.length)for(const item of items.slice(0,2))grid.append(referenceCard(s,item,query));
    else grid.append(referenceCard(s,null,query));
  }
  const found=results.length;
  $('#refsLabel').textContent=found ? `${found} РЕФЕРЕНСОВ / 05 ИСТОЧНИКОВ`:'05 ИСТОЧНИКОВ';
  $('#refHelp').textContent=found
   ?`Получены ${found} ссылок на реальные изображения. Пустые карточки ведут к поиску на площадке. Открывайте страницу первоисточника для проверки авторства и контекста. Рейтинг по содержимому самих фотографий пока не рассчитан.`
   :'Автоматический поиск требует BRAVE_SEARCH_API_KEY. Ниже доступны пять подготовленных поисков по выбранному типу здания; эти карточки не являются найденными фотографиями.';
}
function sceneSVG(d){
  const [sky,back,forest,ground]=d.palette;
  return `<svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Абстрактная цветовая иллюстрация освещения, не визуализация проекта"><rect width="340" height="160" fill="${sky}"/><circle cx="267" cy="34" r="28" fill="${d.sun}" opacity=".75"/><path d="M0 99Q100 77 164 98T340 95V160H0Z" fill="${back}"/><path d="M0 112L56 47 101 124V160H0ZM340 115 302 36 260 130V160H340Z" fill="${forest}"/><path d="M55 100 153 51 253 103V142L160 157 55 137Z" fill="${ground}"/><path d="M55 100 152 39 254 100 153 51Z" fill="#1c2424"/><path d="M157 68 233 105V137L157 151Z" fill="#222b2b"/><path d="M70 102 143 72V140L70 151Z" fill="#555d54"/><path d="M170 92 222 110V130L170 141Z" fill="${d.sun}" opacity=".35"/><path d="M92 110 126 97V133L92 142Z" fill="${d.sun}" opacity=".27"/><path d="M0 145Q100 118 173 147t167-7v20H0Z" fill="${forest}" opacity=".6"/></svg>`;
}
function renderDirections(){
  const container=$('#directionCards');container.replaceChildren();
  for(const [key,d] of Object.entries(directions)){
    const card=document.createElement('button');card.type='button';card.className='direction-card'+(key===state.selected?' active':'');card.setAttribute('aria-pressed',String(key===state.selected));
    card.innerHTML=`<div class="direction-visual">${sceneSVG(d)}<span class="dir-num">${d.num} / CONCEPT</span>${key===state.selected?'<span class="dir-check">✓</span>':''}</div><div class="direction-info"><h3>${safeHtml(d.title)}</h3><p>${safeHtml(d.sub)}</p><div class="dir-foot"><span>${safeHtml(d.mood)}</span><span>↗</span></div></div>`;
    card.addEventListener('click',()=>{state.selected=key;renderDirections();makePrompt();});
    container.append(card);
  }
}
function makePrompt(){
  if(!state.analysis){return;}
  const project=collectProject(), d=directions[state.selected],a=state.analysis;
  const ratio='16:9 landscape composition', detail=project.description || 'Natural premium residential landscaping appropriate to the actual site.';
  const prompt=`ARCHITECTURAL PHOTO ART DIRECTION — IMAGE-TO-IMAGE / NANO BANANA

SOURCE OF TRUTH
Use the ATTACHED ORIGINAL BUILDING IMAGE as the sole and exact source of architectural geometry. Treat it as a fixed architectural model, NOT as inspiration to redesign the house. Preserve 100% of the original dimensions, massing, roof geometry and pitch, facade proportions, timber courses, eaves and roof ends, materials unless explicitly listed otherwise, all window and door openings, mullions, structural details, landscaping placement if already visible, and the exact camera position, viewing angle, building orientation, framing and perspective. No additional floors, annexes, windows, roofs, fences, or architectural inventions. Keep the building fully recognisable and identical to the input.

PROJECT BRIEF
Building: ${project.type}.
Materials given by architect: ${project.materials || 'match the reference image exactly'}.
Architect's wishes: ${detail}.
Architecture notes: ${a.architecture}.
Material observation: ${a.materials}.
Viewpoint: ${a.composition}.

SELECTED PHOTOGRAPHIC DIRECTION
${d.title.toUpperCase()} — ${d.time}

CAMERA AND OPTICS
${d.camera}
Preserve the INPUT IMAGE camera angle and projection even if the camera description suggests an impossible change. No ultrawide stretching, no keystone distortion, no fisheye. Honest optical perspective, believable focal falloff, tactile microcontrast and controlled highlights.

ENVIRONMENT AND PHYSICAL REALISM
Architecturally credible premium landscaping; realistic foliage species, fine branches, leaves, gravel, ground cover and contact shadows. Foreground-to-background depth with natural occlusion. Realistic timber surface grain, lamination and end grain, true-to-life roofing module, correct facade joints, restrained material roughness, accurate reflections, ambient bounce and physically plausible exposure. No plastic vegetation, no overprocessing, no AI smearing or excessive sharpening.

NON-NEGOTIABLE QUALITY
Photorealistic editorial architectural photography, precise texture fidelity, clean edges and realistic fine detail, natural dynamic range, cinematic yet believable light, consistent shadows and perspective. Aim for high-resolution 4K-level detail, ${ratio}. Output must look like an actual professional architectural photograph, not a CG illustration.

STRICT NEGATIVES
No changes to architecture or camera, no swapped facade system, no redesign, no extra openings, no oversized plants hiding important geometry, no exaggerated sunset, no surreal fog, no color bleed, no halos, no blurry leaf clusters, no warped mullions, no additional elements, no watermarks, no text.

EXECUTION PRIORITY
1. Building geometry and original viewpoint  2. Architectural material authenticity  3. Physically correct selected light  4. Cohesive landscaping  5. Fine photorealistic detail.`;
  state.resultPrompt=prompt;
  $('#promptText').textContent=prompt;
  $('#promptState').textContent='ГОТОВ / '+d.title.toUpperCase();
  $('#copyPrompt').disabled=false;$('#downloadPrompt').disabled=false;
}
function updateImage(file){
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alertStatus('Нужен JPG, PNG или WebP.','error');return;}
  if(file.size>8*1024*1024){alertStatus('Изображение больше 8 МБ. Уменьшите файл.','error');return;}
  const reader=new FileReader();
  reader.onload=()=>{
    state.file=file;state.image=String(reader.result||'');
    $('#projectPreview').src=state.image;$('#projectPreview').hidden=false;$('#emptyScene').hidden=true;
    $('#dropTitle').textContent='Заменить изображение';$('#dropHint').textContent='Нажмите, чтобы загрузить другое';
    $('#imageLabel').textContent=file.name.length>28 ? file.name.slice(0,24)+'…':file.name;
    alertStatus('Изображение загружено. Запустите анализ, чтобы получить три направления.','success');
  };
  reader.onerror=()=>alertStatus('Не удалось прочитать изображение.','error');
  reader.readAsDataURL(file);
}
async function requestJson(url,options={}){
  const res=await fetch(url,options);
  let body;
  try{body=await res.json();}catch{throw new Error('Не удалось прочитать ответ сервера.');}
  if(!res.ok)throw new Error(body?.error||`Ошибка ${res.status}`);
  return body;
}
async function runProject(e){
  e.preventDefault();if(state.working)return;
  const project=collectProject();setBusy(true);
  let real=false,issue='';
  try{
    if(state.image&&state.config.ai){
      alertStatus('Визуальная AI-модель анализирует исходный дом: геометрию, материалы и перспективу.');
      try{
        const r=await requestJson('/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({image:state.image,project})});
        if(r.available&&r.result){state.analysis=r.result;real=true;}else issue=r.message||'AI-модель не настроена';
      }catch(ex){issue=ex.message;}
    } else issue=!state.image?'Не загружено изображение': 'Не подключён ключ визуальной AI-модели';
    if(!real)state.analysis=manualAnalysis(project);
    state.selected=state.analysis.choice||'editorial';
    showAnalysis(state.analysis,real);renderDirections();makePrompt();
    const q=(state.analysis.query||queryForProject(project.type,project.materials)).slice(0,120);
    alertStatus('Подготавливаем референсы из пяти профессиональных источников…');
    try{
      const refs=await requestJson('/api/references?q='+encodeURIComponent(q));
      renderReferences(q,refs);
      const found=refs.results?.length||0;
      if(real)alertStatus(found?`Архитектурный AI-анализ готов. Найдено ${found} референсов. Выберите режиссуру кадра.`:'AI-анализ готов. Для поиска изображений подключите Brave Image Search API.','success');
      else alertStatus((issue?issue+'. ':'')+(found?`Найдено ${found} ссылок. Промпты составлены по описанию, не по распознаванию фото.`:'Промпты по описанию готовы. Для поиска реальных картинок нужен BRAVE_SEARCH_API_KEY.'),'info');
    }catch(ex){renderReferences(q,null);alertStatus(`Поиск референсов недоступен: ${ex.message}. Прямые поисковые ссылки работают.`, 'error');}
    $('#analysis').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(ex){alertStatus('Ошибка обработки: '+ex.message,'error');}
  finally{setBusy(false);}
}
function downloadText(){
  const b=new Blob([state.resultPrompt],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='forma-studio-nano-banana-prompt.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init(){
  renderDirections();
  try{
    const conf=await requestJson('/api/config');state.config=conf;
    const status=$('#connectStatus');
    status.textContent=`● AI ${conf.ai?'ON':'OFF'} · SEARCH ${conf.search?'ON':'OFF'}`;
    status.title='Серверная конфигурация, без раскрытия ключей';
    if(conf.ai&&conf.search)alertStatus('Подключены визуальный AI-анализ и поиск изображений. Загрузите архитектуру.','success');
    else if(conf.ai)alertStatus('AI-анализ доступен. Для автоматического поиска референсов нужен ключ Brave Image Search.');
    else if(conf.search)alertStatus('Поиск референсов доступен. AI-анализ фотографии пока не подключён.');
  }catch{alertStatus('Сервер API недоступен. Проверьте запуск FORMA STUDIO.','error');}
  const zone=$('#dropZone'),input=$('#imageInput');
  zone.addEventListener('click',()=>input.click());
  zone.addEventListener('keydown',e=>{if(e.target===zone&&(e.key==='Enter'||e.key===' ')){e.preventDefault();input.click();}});
  $('#chooseImage').addEventListener('click',e=>{e.stopPropagation();input.click();});
  input.addEventListener('change',e=>updateImage(e.target.files?.[0]));
  for(const event of ['dragenter','dragover'])zone.addEventListener(event,e=>{e.preventDefault();zone.classList.add('is-over');});
  for(const event of ['dragleave','drop'])zone.addEventListener(event,e=>{e.preventDefault();zone.classList.remove('is-over');});
  zone.addEventListener('drop',e=>updateImage(e.dataTransfer?.files?.[0]));
  $('#projectForm').addEventListener('submit',runProject);
  $('#copyPrompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.resultPrompt);alertStatus('Промпт скопирован в буфер обмена.','success');}catch{alertStatus('Буфер обмена недоступен. Можно скачать TXT.','error');}});
  $('#downloadPrompt').addEventListener('click',downloadText);
  for(const a of document.querySelectorAll('.nav-item'))a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('is-current'));a.classList.add('is-current');});
}
init();
