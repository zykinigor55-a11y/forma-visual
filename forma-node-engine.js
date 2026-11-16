/* ФОРМА · Исполняемые архитектурные цепочки (обособленный модуль).
   Только существующий /api/render, без передачи API-ключей в браузер.
   Платные вызовы требуют подтверждения, результат узла закрепляется отдельно. */
(() => {
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const getAPI=()=>window.FORMA_NODES;
const AI_TYPES=new Set(['exterior','interior','lighting','materials']);
const BLOCKED_TYPES=new Set(['image3d']);
const AVAILABLE_TYPES=new Set(['source','exterior','interior','lighting','materials','geometry','upscale','video','export']);
const LABELS={running:'ВЫПОЛНЯЕТСЯ',done:'ГОТОВО',error:'ОШИБКА',cancelled:'ОСТАНОВЛЕНО'};
const LIGHTS={sunny:'Солнечный день',golden:'Золотой час',overcast:'Пасмурно',blue:'Синий час',rain:'После дождя',winter:'Зима',night:'Ночь'};
const ZONES={main:'Стены фасада',accent:'Декоративная отделка',base:'Цоколь',roof:'Кровля',windows:'Оконные рамы',doors:'Двери',terrace:'Терраса',steps:'Ступени',custom:'Другой участок'};
let busy=false,preparing=false,aborter=null,wasCancelled=false,nodeSettingsBound=null,openedRunId=0,lastFailure=null;
const statuses=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiPreview=()=>location.protocol==='file:'||/\.github\.io$/i.test(location.hostname);
function graph(){return getAPI()?.graph?.()}
function tell(s){getAPI()?.showStatus?.(s)}
function sourceFingerprint(source){
 let hash=2166136261;
 for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619)}
 return source.length.toString(36)+'-'+(hash>>>0).toString(36);
}
function cacheAllowed(n,resumeNodes=new Set()){
 const api=getAPI();
 if(n.options?.needsRun)return false;
 if(!(n.options?.reuse||resumeNodes.has(n.id)))return false;
 return n.type==='video'?!!api?.getVideoBlob?.(n.id):!!api?.getSnapshot?.(n.id);
}
function checkPlan(g,target,resumeNodes=new Set()){
 if(!g?.nodes?.length||!target)throw Error('Сначала выберите ноду.');
 const nodes=new Map(g.nodes.map(n=>[n.id,n]));
 const path=[],seen=new Set();let id=target;
 while(id){
  if(seen.has(id))throw Error('Обнаружена циклическая связь между нодами.');
  const n=nodes.get(id);if(!n)throw Error('Связь ссылается на удалённую ноду.');
  seen.add(id);path.push(n);
  const incoming=g.edges.filter(e=>e.to===id);
  if(incoming.length>1)throw Error('К ноде подключено несколько входов. Оставьте один.');
  id=incoming[0]?.from||null;
 }
 path.reverse();
 if(path[0]?.type!=='source')throw Error('Цепочка должна начинаться с узла «Исходник».');
 const blocked=path.find(n=>BLOCKED_TYPES.has(n.type));
 if(blocked)throw Error('Нода «'+(blocked.title||blocked.type)+'» пока требует отдельного движка или ручного подтверждения — результат не имитируется.');
 const unknown=path.find(n=>!AVAILABLE_TYPES.has(n.type));
 if(unknown)throw Error('Тип «'+unknown.type+'» пока не исполняется.');
 const invalid=path.find(n=>n.type==='materials'&&(n.options?.materialSource==='texture'?!getAPI()?.getTexture?.(n.id):!String(n.options?.instruction||'').trim()&&(!n.options?.material||n.options.material==='custom')));
 if(invalid)throw Error('Для ноды «Материалы» напишите конкретную инструкцию по редактированию.');
 const warnings=[];
 for(const n of path){
  if(!['exterior','lighting'].includes(n.type))continue;
  const o=n.options||{};
  if(o.season==='summer'&&o.weather==='snow')throw Error('Нода «'+(n.title||n.type)+'»: снег летом противоречит выбранному сезону. Выберите зиму или другую погоду.');
  if(o.time==='night'&&['sunny','clear'].includes(o.weather))throw Error('Нода «'+(n.title||n.type)+'»: солнечная погода и ночь несовместимы. Исправьте время суток или погоду.');
  if(['fog','overcast','cloud'].includes(o.weather)&&o.time==='golden')warnings.push('«'+(n.title||n.type)+'»: золотой час при плотной облачности может быть незаметен.');
 }
 const calls=path.filter(n=>AI_TYPES.has(n.type)&&!cacheAllowed(n,resumeNodes)).length;
 const videoCalls=path.filter(n=>n.type==='video'&&!cacheAllowed(n,resumeNodes)).length;
 if(calls>8)throw Error('Для контроля стоимости разрешено не более 8 AI-этапов в цепочке.');
 return {path,calls,videoCalls,warnings};
}
function decorate(){
 const root=$('#faFlowBackdrop');if(!root)return;
 for(const card of $$('.fa-node',root)){
  const value=statuses.get(card.dataset.node);
  card.classList.toggle('fa-node-running',value==='running');
  card.classList.toggle('fa-node-done',value==='done');
  card.classList.toggle('fa-node-failed',value==='error');
  let label=$('.fa-run-state',card);
  if(value){
   if(!label){label=document.createElement('span');label.className='fa-run-state';card.append(label)}
   label.textContent=LABELS[value]||value;
   label.dataset.state=value;
  }else label?.remove();
 }
 const run=$('#faFlowRunChain'),stop=$('#faFlowStopChain');
 if(run)run.disabled=busy||preparing;
 if(stop)stop.disabled=!busy;
 const retry=$('#faFlowRetryChain');if(retry){retry.hidden=busy||preparing||!lastFailure;retry.disabled=busy||preparing;}
 if(busy||preparing){$$('[data-node-option],[data-light-field],[data-fa-material-texture],[data-scenario-add-light],[data-scenario-delete-light]', $('#faFlowNodeSettings')||document).forEach(el=>el.disabled=true)}
}
function setState(id,value){statuses.set(id,value);decorate()}
const ENVIRONMENTS={"keep": "Сохранить исходное", "garden": "Сад и газон", "forest": "Хвойный лес", "lake": "У озера", "mountains": "Горы", "city": "Городской парк", "courtyard": "Тихий парк", "nordic": "Северный пейзаж", "coast": "У побережья", "minimal": "Минимализм", "mist": "Туманный лес"};
const WEATHER={"keep": "По исходнику", "clear": "Ясно", "cloud": "Облачно", "rain": "Дождь", "fog": "Туман", "snow": "Снег"};
const SEASONS={'keep':'По исходнику','spring':'Весна','summer':'Лето','autumn':'Осень','winter':'Зима'};
const TIMES={"keep": "По исходнику", "morning": "Утро", "day": "День", "golden": "Вечер · золотой час", "night": "Ночь"};
const PLANTS={"keep": "Сохранить растительность", "minimal": "Минимальная", "decorative": "Декоративная", "forest": "Лесная", "mediterranean": "Средиземноморская", "tropical": "Тропическая"};
const LENSES={'keep':'Сохранить ракурс','24mm':'Широкий 24 мм','35mm':'Архитектурный 35 мм','50mm':'Нормальный 50 мм','85mm':'Телеобъектив 85 мм'};
const RATIOS={'16:9':'16:9 · Горизонтальный','3:2':'3:2 · Архитектурное фото','4:3':'4:3 · Каталог','1:1':'1:1 · Квадрат','9:16':'9:16 · Вертикальный'};
const MATERIALS={"custom": "По текстовой инструкции", "plaster": "Штукатурка", "travertine": "Травертин", "limestone": "Природный камень", "wood": "Дерево", "brick": "Клинкер", "concrete": "Бетон", "metal": "Металл", "ceramic": "Керамогранит", "glass": "Стекло"};
const LANDSCAPES={"garden":[["formal","Парадный газон","Ровный аккуратный газон, подстриженные группы кустарников, минимальные аккуратные цветники, свободный обзор здания."],["natural","Природный сад","Натуральное разнотравье, злаки, мягкая нерегулярная структура посадок и деликатный ландшафт."],["park","Пейзажный сад","Разновысотные деревья, естественные группы кустарников, спокойный ухоженный зелёный участок."],["conifers","Сад с хвойниками","Композиции из декоративных сосен, можжевельников и невысоких хвойников с естественной фактурой."]],"forest":[["young","Молодые сосны","Молодые стройные сосны с тонкими стволами, сравнительно открытый подлесок, лёгкая прозрачность леса."],["mature","Зрелый сосновый бор","Высокие зрелые сосны с характерной корой, просторный сухой сосновый бор, мох и хвойная подстилка."],["ancient","Вековые сосны","Очень старые мощные сосны с крупными стволами, выразительной рельефной корой, высокими кронами и сложным лесным покровом."],["mixed","Смешанный хвойный лес","Сочетание высоких сосен и елей разного возраста, разнообразный подлесок и природная глубина лесного кадра."]],"lake":[["forest","Лесное озеро","Естественное лесное озеро с тихой водой, природным берегом и деревьями на дальнем плане."],["mountain","Горное озеро","Прозрачное озеро среди горных склонов и каменистых берегов, спокойные реалистичные отражения."],["open","Большое озеро","Просторная открытая водная гладь с далёким горизонтом и небольшими волнами от ветра."],["reeds","Озеро с камышами","Небольшое природное озеро с прибрежными камышами и осокой, неровной естественной кромкой воды."]],"mountains":[["foothills","Лесистые предгорья","Мягкие горные склоны, покрытые естественным лесом, плавная смена планов и глубина кадра."],["alpine","Альпийские луга","Открытые горные луга с низкими травами и редкими камнями, дальние хребты."],["rocky","Скалистые вершины","Выразительные скальные горные массивы, сложная каменная фактура и строгий рельеф."],["valley","Горная долина","Широкая спокойная горная долина с дальними вершинами и природным ландшафтом."]],"city":[["modern","Современный парк","Современный городской парк с ухоженными деревьями, газонами и аккуратной городской растительностью."],["classic","Исторический парк","Зрелые лиственные деревья, классические аллеи и сдержанный исторический характер озеленения."],["square","Тихий сквер","Компактный зелёный сквер с аккуратными аллеями, живыми изгородями и группами деревьев."],["natural","Природный экопарк","Более свободный городской парк с природными посадками и минимально обработанным зелёным ландшафтом."]],"courtyard":[["oldpark","Старый лиственный парк","Высокие взрослые дубы, клёны и липы, широкие кроны, глубокие естественные тени."],["birch","Берёзовая роща","Группа стройных берёз со светлой корой и ажурными кронами, лёгкая лесная атмосфера."],["shady","Тенистый сад","Плотные большие деревья, полутень, хосты, папоротники и низкие теневыносливые растения."],["meadow","Открытая поляна","Небольшая спокойная открытая лужайка с деревьями по периметру, лёгкая и воздушная композиция."]],"nordic":[["pine","Северный сосновый лес","Невысокие суровые северные сосны, скалы, лишайники и сдержанная природная палитра."],["stone","Скалы и мхи","Гранитные выходы и валуны с мхами и лишайниками, редкие низкие растения."],["tundra","Северная тундра","Открытый северный ландшафт с низкими кустарниками, мхами и редкими деревьями."],["boulders","Лес и валуны","Смешанный редкий северный лес, крупные естественные валуны и хвойный подлесок."]],"coast":[["sand","Песчаный берег","Мягкая песчаная береговая линия, светлые дюны, море и естественные приморские травы."],["rock","Скалистый берег","Каменистые уступы и природные скалы у воды, выразительный рельеф побережья."],["pine","Сосны у моря","Приморские сосны с ветвистыми кронами, песчаная почва и дальний горизонт моря."],["dunes","Дюны и злаки","Прибрежные дюны с естественными злаками и сухими травами, ветер и открытый горизонт."]],"minimal":[["gravel","Гравий и злаки","Чистые зоны гравия, тонкие группы декоративных злаков и сдержанное озеленение."],["stone","Камень и мох","Крупные плоские природные камни, мхи и минимальные низкие посадки."],["lawn","Чистый газон","Почти непрерывный минималистичный газон с несколькими аккуратными зелёными акцентами."],["shapes","Формованные кустарники","Редкие геометричные кустарники и строгие лаконичные посадки с понятной композицией."]],"mist":[["pine","Сосны в тумане","Высокие сосны с мягкой лесной дымкой между стволами и естественной многоплановостью."],["mixed","Смешанный лес","Хвойные и лиственные деревья, лёгкие слои тумана в дальних планах."],["ancient","Вековой туманный лес","Крупные возрастные стволы и глубокая лесная перспектива, сдержанная утренняя дымка."],["birch","Светлая роща","Светлые берёзы и мягкая прозрачная дымка, деликатное спокойное освещение."]]};
const getOpt=(n,key,defaultValue)=>String(n.options?.[key]??defaultValue);
const LOCAL_LIGHT_PROFILES={downlight:'Встроенный свет',spot:'Акцентный спот','wall-wash':'Свет по стене',linear:'Линейный свет',pendant:'Подвесной свет',floor:'Торшер'};
const LOCAL_LIGHT_PLACEMENTS={ceiling:'На потолке',left:'Слева в кадре',right:'Справа в кадре',back:'У дальней стены',foreground:'На переднем плане',window:'У окна'};
function lightSettings(sources=[]){
 const option=(values,value)=>Object.entries(values).map(([id,label])=>'<option value="'+id+'"'+(id===value?' selected':'')+'>'+label+'</option>').join('');
 return '<div class="fa-scenario-local-lights">'+sources.slice(0,8).map((light,i)=>'<fieldset data-scenario-light="'+i+'"><legend>Источник '+(i+1)+'</legend><div class="fa-node-two-col"><label>Профиль<select data-light-field="profile">'+option(LOCAL_LIGHT_PROFILES,light.profile)+'</select></label><label>Расположение<select data-light-field="placement">'+option(LOCAL_LIGHT_PLACEMENTS,light.placement||'ceiling')+'</select></label></div><div class="fa-node-two-col"><label>Интенсивность, %<input type="number" min="0" max="200" data-light-field="intensity" value="'+Number(light.intensity??80)+'"></label><label>Температура, K<input type="number" min="2200" max="6500" step="100" data-light-field="temperature" value="'+Number(light.temperature??3000)+'"></label></div><label>Угол луча, °<input type="number" min="10" max="120" data-light-field="cone" value="'+Number(light.cone??60)+'"></label><button type="button" data-scenario-delete-light="'+i+'">Удалить источник</button></fieldset>').join('')+'<button type="button" data-scenario-add-light '+(sources.length>=8?'disabled':'')+'>＋ Добавить источник света</button><p>Визуальные профили для AI: расположение, яркость, цвет и угол луча. Не фотометрический расчёт IES.</p></div>';
}
function settingsHTML(n){
 const opts=n.options||{},controls=[];
 const select=(key,label,list,value,info='')=>'<label>'+label+'<select data-node-option="'+key+'">'+
  Object.entries(list).map(([k,v])=>'<option value="'+esc(k)+'"'+(String(k)===String(value)?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select>'+(info?'<small>'+esc(info)+'</small>':'')+'</label>';
 const textarea=(key,label,value,placeholder,rows=3)=>'<label>'+label+'<textarea data-node-option="'+key+'" rows="'+rows+'" maxlength="500" placeholder="'+esc(placeholder)+'">'+esc(value||'')+'</textarea></label>';
 const group=(name,description='')=>'<div class="fa-node-settings-section"><strong>'+name+'</strong>'+(description?'<p>'+description+'</p>':'')+'</div>';
 const check=(key,label,defaultValue)=>'<label class="fa-flow-check"><input type="checkbox" data-node-option="'+key+'" '+((opts[key]===undefined?defaultValue:opts[key])?'checked':'')+'> '+label+'</label>';
 const scene=()=>{
   controls.push(group('Окружение, погода и свет','Все параметры сцены собраны здесь. Выбранные условия передаются в реальный AI-запрос.'));
   controls.push(select('environment','Окружение',ENVIRONMENTS,getOpt(n,'environment','keep')));
   const variants=LANDSCAPES[opts.environment]||[];
   if(variants.length)controls.push(select('environmentSubtype','Вариант ландшафта',Object.fromEntries([['keep','По исходнику'],...variants.map(v=>[v[0],v[1]])]),getOpt(n,'environmentSubtype','keep')));
   controls.push(select('weather','Погода',WEATHER,getOpt(n,'weather','keep')));
   controls.push('<div class="fa-node-two-col">'+select('season','Сезон',SEASONS,getOpt(n,'season','keep'))+select('time','Время суток',TIMES,getOpt(n,'time','keep'))+'</div>');
   controls.push(select('plants','Растительность',PLANTS,getOpt(n,'plants','keep')));
   controls.push(textarea('environmentInstructions','Описание участка / окружающей среды',opts.environmentInstructions,'Например: взрослые сосны, глубокий передний план, травы, природный камень',2));
   controls.push(group('Камера и качество'));
   controls.push('<div class="fa-node-two-col">'+select('lens','Объектив',LENSES,getOpt(n,'lens','keep'))+select('ratio','Формат кадра',RATIOS,getOpt(n,'ratio','16:9'))+'</div>');
   controls.push(select('quality','Качество',{'high':'Высокое','medium':'Стандартное'},getOpt(n,'quality','high')));
   controls.push(check('lockGeometry','Сохранить точную геометрию и ракурс',true));
   controls.push(check('preserveMaterials','Сохранить существующие материалы',true));
   controls.push(textarea('changes','Дополнительные изменения',opts.changes,'Только явно указанные изменения; остальное оставить как в оригинале',3));
 };
 if(n.type==='exterior'){scene();}
 if(n.type==='lighting'){
   scene();
   controls.push('<p>Этап меняет атмосферу предыдущего кадра. Материалы и архитектуру следует сохранять.</p>');
 }
 if(n.type==='interior'){
   controls.push(group('Помещение и дизайн'));
   controls.push(select('room','Тип помещения',{living:'Гостиная',kitchen:'Кухня',bedroom:'Спальня',bathroom:'Ванная',office:'Кабинет',commercial:'Коммерческое помещение',hall:'Прихожая / холл',dining:'Столовая'},getOpt(n,'room','living')));
   controls.push(select('style','Стиль интерьера',{'as-is':'Строго по исходнику','warm-modern':'Тёплый современный','japandi':'Джапанди','minimal':'Минимализм','contemporary':'Современный премиум','classic':'Современная классика','loft':'Лофт'},getOpt(n,'style','as-is')));
   controls.push(select('lighting','Освещение',{'soft-daylight':'Мягкий дневной свет',sunny:'Солнечный день',overcast:'Пасмурный день',evening:'Вечерний свет',studio:'Архитектурная фотосъёмка'},getOpt(n,'lighting','soft-daylight')));
   controls.push(group('Локальные источники света'));
   controls.push(lightSettings(opts.interiorLights||[]));
   controls.push(textarea('changes','Отделка, мебель и пожелания',opts.changes,'Например: натуральный дуб, штукатурка, сохранить мебель, добавить скрытую подсветку'));
   controls.push(group('Камера и контроль'));
   controls.push('<div class="fa-node-two-col">'+select('lens','Объектив',LENSES,getOpt(n,'lens','keep'))+select('ratio','Формат',RATIOS,getOpt(n,'ratio','16:9'))+'</div>');
   controls.push(select('quality','Качество',{'high':'Высокое',medium:'Стандартное'},getOpt(n,'quality','high')));
   controls.push(check('lockGeometry','Не менять размеры и расположение объектов',true));
 }
 if(n.type==='materials'){
   controls.push(group('Выбор поверхности и материала'));
   controls.push(select('zone','Элемент',ZONES,getOpt(n,'zone','main')));
   controls.push(select('materialSource','Источник материала',{'catalog':'Каталог','text':'Текстовая инструкция','texture':'Своя фактура'},getOpt(n,'materialSource',opts.material&&opts.material!=='custom'?'catalog':'text')));
   if((opts.materialSource|| (opts.material&&opts.material!=='custom'?'catalog':'text'))==='catalog')controls.push(select('material','Новая отделка',Object.fromEntries(Object.entries(MATERIALS).filter(([id])=>id!=='custom')),getOpt(n,'material','plaster')));
   if(opts.materialSource==='texture'){
    controls.push('<label>Фактура PNG, JPG, WEBP<input type="file" accept="image/png,image/jpeg,image/webp" data-fa-material-texture></label>');
    const texture=getAPI()?.getTexture?.(n.id);
    if(texture)controls.push('<figure class="fa-scenario-texture"><img src="'+texture+'" alt="Загруженная фактура"><figcaption>'+esc(opts.textureName||'Своя фактура')+'</figcaption></figure>');
    controls.push('<div class="fa-node-two-col">'+select('textureScale','Масштаб рисунка',{'50':'50%','100':'100%','150':'150%','200':'200%'},getOpt(n,'textureScale','100'))+select('textureRotation','Поворот рисунка',{'0':'0°','90':'90°','180':'180°','270':'270°'},getOpt(n,'textureRotation','0'))+'</div>');
   }
   controls.push(textarea('instruction','Точное изменение',opts.instruction,'Например: только цоколь заменить на тёмный графитовый сланец, сохранить швы и всё остальное',4));
   controls.push('<p>Изменение передаётся в AI как локальная текстовая правка указанной зоны. Для точной кистевой маски используйте редактор материалов основного проекта.</p>');
 }
 if(n.type==='video'){
   controls.push(group('Камера и видео'));
   controls.push(select('cameraMove','Движение камеры',{'dolly':'Плавный наезд','pullback':'Плавный отъезд','truck':'Горизонтальный проезд','orbit':'Медленный облёт','static':'Статичная камера · движение окружения'},getOpt(n,'cameraMove','dolly')));
   controls.push(textarea('prompt','Уточнения к анимации',opts.prompt,'Например: шевелится листва и трава, вода движется, в чаше горит небольшой огонь. Не менять геометрию.',3));
   controls.push('<div class="fa-node-two-col">'+select('duration','Длительность',{'5':'5 секунд','10':'10 секунд'},getOpt(n,'duration','5'))+select('ratio','Формат',{'16:9':'16:9 · Горизонтальный','9:16':'9:16 · Вертикальный'},getOpt(n,'ratio','16:9'))+'</div>');
   controls.push('<p>Генерация через подключённый Wan API. Сначала подтверждается стоимость запроса.</p>');
   if(getAPI()?.getVideoURL?.(n.id))controls.push('<div class="fa-inspector-result"><b>Видео этого этапа</b><video controls playsinline preload="metadata" src="'+getAPI().getVideoURL(n.id)+'"></video><button type="button" data-fa-download-video="'+esc(n.id)+'">Скачать MP4</button></div>');
   controls.push('<label class="fa-flow-check"><input type="checkbox" data-node-option="reuse" '+(opts.reuse?'checked':'')+' '+(!getAPI()?.getVideoBlob?.(n.id)||opts.needsRun?'disabled':'')+'> Использовать уже готовое видео без нового запроса</label>');
 }
 if(n.type==='source'){
   controls.push(group('Исходное изображение'));
   controls.push('<p>В качестве входа используется загруженный CAD-скриншот или фотография активного проекта.</p><button type="button" class="fa-inspector-upload" data-fa-upload-source>Загрузить изображение в проект</button>');
 }
 if(AI_TYPES.has(n.type)){
  const snapshot=getAPI()?.getSnapshot?.(n.id);
  controls.push('<label class="fa-flow-check"><input type="checkbox" data-node-option="reuse" '+(opts.reuse&&!opts.needsRun?'checked':'')+' '+(!snapshot||opts.needsRun?'disabled':'')+'> Использовать уже готовый кадр без нового AI-запроса</label>');
  if(opts.needsRun)controls.push('<p class="fa-node-stale-warning">Настройки или источник изменились. Старый кадр сохранён, но повторное использование отключено до нового запуска.</p>');
  if(!snapshot)controls.push('<p>Повторное использование станет доступно после первого успешного запуска.</p>');
 }
 const snapshot=getAPI()?.getSnapshot?.(n.id);
 if(snapshot&&imageMime(snapshot))controls.push('<div class="fa-inspector-result"><b>Результат выбранной ноды</b><img src="'+snapshot+'" alt="Результат ноды"><button type="button" data-fa-download-snapshot="'+esc(n.id)+'">Скачать изображение</button><button type="button" data-fa-compare-snapshot="'+esc(n.id)+'">Сравнить A/B</button></div>');
 if(n.type==='geometry'){
  controls.push(group('Контроль геометрии'));
  controls.push(select('overlay','Прозрачность линий исходника',{'0.25':'25% · Лёгкое','0.5':'50% · Среднее','0.75':'75% · Сильное'},getOpt(n,'overlay','0.5')));
  controls.push('<p>Наложение исходного CAD-скриншота для ручного сравнения. Не является автоматическим анализом геометрии.</p>');
 }
 if(n.type==='upscale'){controls.push(group('Размер итогового кадра'));controls.push(select('target','Длинная сторона',{'2048':'2K · до 2048 px','3840':'4K · до 3840 px'},getOpt(n,'target','3840')));controls.push('<p>Локальное увеличение средствами браузера. Это не AI-upscale: недостающая детализация не восстанавливается.</p>');}
 if(n.type==='export'){controls.push(group('Сохранение результата'));controls.push(select('format','Формат изображения',{'original':'Оригинальный формат','png':'PNG · без потерь','jpeg':'JPEG · качество 94%','webp':'WebP'},getOpt(n,'format','original')));controls.push('<p>Видеорезультат сохраняется в MP4. Кадры AI остаются в проекте, экспорт скачивает итог выбранной ветки.</p>');}
 if(BLOCKED_TYPES.has(n.type)){controls.push(group('3D-модель'));controls.push('<p>Требуется отдельная интеграция 3D-движка. Фальшивый 3D-результат не создаётся.</p>');}
 const history=getAPI()?.historyFor?.(n.id)||[];
 if(history.length)controls.push('<div class="fa-inspector-history"><b>ИСТОРИЯ РЕЗУЛЬТАТОВ</b>'+history.map((h,i)=>'<button type="button" data-fa-restore-history="'+esc(h.key)+'" data-fa-history-node="'+esc(n.id)+'">↶ Версия '+(i+1)+' · '+new Date(h.time).toLocaleString('ru-RU')+'</button>').join('')+'</div>');
 return '<b>НАСТРОЙКИ НОДЫ</b><h4>'+esc(n.title||n.type)+'</h4><div class="fa-flow-node-fields">'+(controls.join('')||'<p>Дополнительных параметров нет.</p>')+'</div><small>Проверяйте полученное изображение по исходнику: генеративный AI может изменять отдельные детали.</small>';
}
function showSelection(){
 const host=$('#faFlowNodeSettings'),g=graph();if(!host||!g)return;
 const n=g.nodes.find(n=>n.id===g.selected);
 host.innerHTML=n?settingsHTML(n):'<p>Выберите карточку на холсте и настройте операцию в её окне.</p>';
 const heading=$('#faFlowInspectorTitle');if(heading)heading.textContent=n?n.title||n.type:'Параметры ноды';
 if(nodeSettingsBound===host)return;
 host.addEventListener('change',async event=>{
  if(busy||preparing)return;
  const lightField=event.target.closest('[data-light-field]');
  if(lightField){const n=graph()?.nodes.find(n=>n.id===graph()?.selected),lights=(n.options?.interiorLights||[]).map(x=>({...x})),index=Number(lightField.closest('[data-scenario-light]').dataset.scenarioLight),key=lightField.dataset.lightField;
   if(!lights[index])return;const limits={intensity:[0,200],temperature:[2200,6500],cone:[10,120]};
   lights[index][key]=limits[key]?Math.min(limits[key][1],Math.max(limits[key][0],Number(lightField.value))):lightField.value;
   getAPI().setOptions(n.id,{interiorLights:lights});lightField.value=lights[index][key];return;
  }
  if(event.target.matches?.('[data-fa-material-texture]')){
   const file=event.target.files?.[0],id=graph()?.selected;if(!file)return;
   try{if(file.size>5*1024*1024||!/^image\/(png|jpeg|webp)$/.test(file.type))throw Error('Выберите PNG, JPG или WEBP до 5 МБ.');
    const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
    const im=new Image();im.src=data;await im.decode();
    if(busy||preparing||graph()?.selected!==id)throw Error('Выбранный этап изменился. Повторите загрузку.');
    await getAPI().setTexture(id,data);getAPI().setOptions(id,{textureName:file.name});showSelection();
   }catch(err){tell(err.message||'Не удалось загрузить фактуру.')}return;
  }
  const field=event.target.closest('[data-node-option]');if(!field)return;
  const key=field.dataset.nodeOption;
  getAPI()?.setOptions?.(graph()?.selected,{[key]:field.type==='checkbox'?field.checked:field.value,...(key==='environment'?{environmentSubtype:'keep'}:{})});
  if(key==='materialSource'&&field.value==='catalog'&&(!graph().nodes.find(n=>n.id===graph().selected)?.options?.material||graph().nodes.find(n=>n.id===graph().selected)?.options?.material==='custom'))getAPI().setOptions(graph().selected,{material:'plaster'});
  if(['environment','materialSource'].includes(key))showSelection();
 });
 host.addEventListener('input',event=>{
  const field=event.target.closest('textarea[data-node-option]');
  if(!field)return;
  getAPI()?.setOptions?.(graph()?.selected,{[field.dataset.nodeOption]:field.value});
 });
 host.addEventListener('click',e=>{
  if(busy||preparing){tell('Изменения нод недоступны во время выполнения.');return}
  const addLight=e.target.closest('[data-scenario-add-light]'),removeLight=e.target.closest('[data-scenario-delete-light]');
  if(addLight||removeLight){const n=graph().nodes.find(n=>n.id===graph().selected),lights=[...(n.options?.interiorLights||[])];
   if(addLight&&lights.length<8)lights.push({profile:'downlight',placement:'ceiling',intensity:80,temperature:3000,cone:60});
   if(removeLight)lights.splice(Number(removeLight.dataset.scenarioDeleteLight),1);
   getAPI().setOptions(n.id,{interiorLights:lights});showSelection();return;
  }
  const upload=e.target.closest('[data-fa-upload-source]');
  if(upload){window.FORMA_WORKFLOW_UI?.uploadSource?.(graph()?.selected);return}
  const download=e.target.closest('[data-fa-download-snapshot]');
  if(download){const image=getAPI()?.getSnapshot?.(download.dataset.faDownloadSnapshot);if(image)downloadImage(image);return}
  const compare=e.target.closest('[data-fa-compare-snapshot]');
  if(compare){getAPI()?.addCompare?.(compare.dataset.faCompareSnapshot);return}
  const previous=e.target.closest('[data-fa-restore-history]');
  if(previous){getAPI()?.recallHistory?.(previous.dataset.faHistoryNode,previous.dataset.faRestoreHistory);return}
  const video=e.target.closest('[data-fa-download-video]');
  if(video){getAPI()?.downloadVideo?.(video.dataset.faDownloadVideo);return}
 });
 nodeSettingsBound=host;
}
function imageMime(src){return String(src||'').match(/^data:image\/(png|jpeg|webp);base64,/i)?.[1]||null}
async function availability(calls){
 if(!calls)return;
 if(apiPreview())throw Error('Это предпросмотр интерфейса. Для платного AI нужна серверная версия с API.');
 let r;try{r=await fetch('/api/status',{cache:'no-store'})}catch{throw Error('Сервер рендера недоступен.')}
 if(!r.ok)throw Error('Не удалось проверить подключение AI.');
 const data=await r.json();
 if(!data.ready)throw Error('AI-ключ на сервере ещё не подключён.');
 if(Number.isFinite(data.dailyRemaining)&&data.dailyRemaining<calls)throw Error('Недостаточно запросов на сегодня: нужно '+calls+', осталось '+data.dailyRemaining+'.');
}
async function imageAI(source,brief,ctx,options={}){
 if(!imageMime(source))throw Error('Неподдерживаемый формат исходного изображения.');
 aborter=new AbortController();
 const timer=setTimeout(()=>aborter?.abort(),240000);
 try{
  const r=await fetch('/api/render',{
   method:'POST',headers:{'Content-Type':'application/json'},
   signal:aborter.signal,
   body:JSON.stringify({
    image:source,brief,quantity:1,size:({'16:9':'1536x864','3:2':'1536x1024','4:3':'1360x1024','1:1':'1024x1024','9:16':'864x1536'})[brief.output?.ratio]||ctx.size,quality:brief.output?.quality||ctx.quality,
    selectedZone:options.selectedZone||null,zoneId:options.zoneId||null,
    editMode:options.editMode||null,editAction:options.editAction||null,
    materialInstruction:options.materialInstruction||null,material:options.material||null,materialName:options.materialName||null
   })
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Error((data.error||'Сервер вернул ошибку '+r.status)+(data.requestId?' · Код запроса: '+data.requestId:''));
  if(!Array.isArray(data.images)||!data.images[0])throw Error('Сервер не вернул изображение.'+(data.requestId?' · Код запроса: '+data.requestId:''));
  const img='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
  if(!imageMime(img))throw Error('Сервер вернул неподдерживаемый файл.');
  return img;
 }catch(err){
  if(err.name==='AbortError'||wasCancelled)throw Error('Запуск остановлен. Запрос мог продолжиться на сервере и привести к списанию средств.');
  throw err;
 }finally{clearTimeout(timer);aborter=null}
}
async function canvas4K(source,target=3840){
 const im=new Image();im.src=source;await im.decode();
 const longest=Math.max(im.naturalWidth,im.naturalHeight);
 if(!longest)throw Error('Невозможно определить размер изображения.');
 const scale=Math.max(1,Number(target)===2048?2048/longest:3840/longest);
 const w=Math.round(im.naturalWidth*scale),h=Math.round(im.naturalHeight*scale);
 if(w*h>25_000_000)throw Error('Это изображение превышает лимит локальной обработки.');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 return canvas.toDataURL('image/png');
}
async function downloadImage(img,options={}){
 const format=options?.format||'original';
 let src=img,ext=imageMime(img)==='jpeg'?'jpg':imageMime(img)||'png';
 if(['jpeg','webp','png'].includes(format)){
  const im=new Image();im.src=img;await im.decode();
  const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
  const ctx=c.getContext('2d');if(!ctx)throw Error('Экспорт в выбранный формат недоступен.');
  if(format==='jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height)}
  ctx.drawImage(im,0,0);
  src=c.toDataURL('image/'+format,format==='jpeg'?.94:undefined);
  ext=format==='jpeg'?'jpg':format;
 }
 const link=document.createElement('a');link.href=src;link.download='forma-node-'+Date.now()+'.'+ext;
 document.body.append(link);link.click();link.remove();
}

async function geometryOverlay(image,source,opacity){
 const [im,ref]=await Promise.all([new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=image}),new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=source})]);
 const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 if(c.width*c.height>25_000_000)throw Error('Слишком большой кадр для визуального наложения.');
 const ctx=c.getContext('2d');if(!ctx)throw Error('Наложение недоступно.');
 ctx.drawImage(im,0,0,c.width,c.height);
 ctx.globalAlpha=Math.max(.05,Math.min(.95,Number(opacity)||.5));
 ctx.drawImage(ref,0,0,c.width,c.height);
 ctx.globalAlpha=1;
 return c.toDataURL('image/png');
}
async function checkVideoAvailability(){
 if(apiPreview())throw Error('Видео требует серверную версию ФОРМА.');
 let res;try{res=await fetch('/api/wan/status',{cache:'no-store'})}catch{throw Error('Видеосервис недоступен.')}
 if(!res.ok)throw Error('Состояние видеомодели не получено.');
 const data=await res.json();
 if(!data.ready)throw Error(data.reason||'Wan 2.6 не подключена к серверу. Нужен OpenRouter API и разрешение WAN_VIDEO_ENABLED.');
 if(Number.isFinite(data.remaining)&&data.remaining<1)throw Error('Дневной лимит видео исчерпан.');
}
async function prepareVideoFrame(source){
 const im=new Image();im.src=source;await im.decode();
 const scale=Math.min(1,1920/Math.max(im.naturalWidth,im.naturalHeight));
 const w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Не удалось подготовить видео-кадр.');
 ctx.drawImage(im,0,0,w,h);
 const image=canvas.toDataURL('image/jpeg',.88);
 if(image.length>10_500_000)throw Error('Первый кадр видео больше 8 МБ. Используйте меньший кадр.');
 return image;
}
function downloadVideoBlob(blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='forma-architecture-'+Date.now()+'.mp4';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
async function makeVideo(source,options){
 const image=await prepareVideoFrame(source);
 const movements={dolly:'Slow cinematic dolly forward.',pullback:'Slow cinematic dolly backward.',truck:'Slow horizontal camera slide.',orbit:'Gentle partial orbit around the building.',static:'Camera absolutely locked off, only natural water, foliage and atmosphere move.'};
 const prompt=(movements[options?.cameraMove||'dolly']+' '+String(options?.prompt||'Preserve exact building, camera geometry and natural lighting.')).trim().slice(0,500);
 const duration=Number(options?.duration||5),ratio=options?.ratio==='9:16'?'9:16':'16:9';
 if(prompt.length<12)throw Error('Для анимации укажите движение камеры.');
 const ctrl=new AbortController();aborter=ctrl;
 try{
  let res=await fetch('/api/wan/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,prompt,duration,ratio}),signal:ctrl.signal});
  let info=await res.json().catch(()=>({}));
  if(!res.ok||!info.id)throw Error(info.error||'Видеомодель не приняла задание.');
  const jobId=encodeURIComponent(info.id);
  for(let attempt=0;attempt<90;attempt++){
   if(wasCancelled)throw Error('Генерация видео остановлена. Задание у провайдера могло продолжиться.');
   await new Promise(resolve=>setTimeout(resolve,4000));
   res=await fetch('/api/wan/job?id='+jobId,{cache:'no-store',signal:ctrl.signal});
   info=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(info.error||'Не удаётся получить состояние видео.');
   if(info.status==='completed'){
    const file=await fetch('/api/wan/download?id='+jobId,{signal:ctrl.signal});
    if(!file.ok)throw Error('Видео создано, но сервер не отдал MP4. Проверьте видео-проект.');
    const blob=await file.blob();
    if(!blob.size||blob.size>180*1024*1024)throw Error('Недопустимый размер видео от провайдера.');
    return blob;
   }
   if(['failed','cancelled','expired'].includes(info.status))throw Error(info.error||'Видео не создано.');
   tell('Видео Wan · '+(info.status==='in_progress'?'генерируется':'ожидание')+' · проверка '+(attempt+1));
  }
  throw Error('Истекло время проверки статуса видео. Проверьте историю заданий.');
 }finally{aborter=null}
}

function briefFor(ctx,previousMode,n){
 const b=JSON.parse(JSON.stringify(ctx.brief));
 const o=n.options||{};
 b.sceneType=previousMode;b.homeChanges='';
 if(['exterior','interior','lighting'].includes(n.type)){b.atmosphere=null;b.sunLighting=null;b.lightingPreset=null;}
 if(n.type==='exterior')b.sceneType='exterior';
 if(n.type==='interior'){
  b.sceneType='interior';b.room=o.room||'living';b.style=o.style||'as-is';
  b.lighting=o.lighting||'soft-daylight';b.furniture='preserve';b.interiorLights=o.interiorLights||[];
  b.surfaces='';b.notes=String(o.changes||'').trim().slice(0,500);
 }
 const envLabel=ENVIRONMENTS[o.environment||'keep'];
 const weatherLabel=WEATHER[o.weather||'keep'];
 const seasonLabel=SEASONS[o.season||'keep'];
 const timeLabel=TIMES[o.time||'keep'];
 const plantsLabel=PLANTS[o.plants||'keep'];
 if(n.type==='exterior'||n.type==='lighting'){
   b.sceneMood=null;
   for(const key of ['environment','weather','season','time','plants'])if(!o[key]||o[key]==='keep')b[key]=null;
   b.environmentInstructions='';b.environmentSubtype=null;b.environmentSubtypeInstructions=null;
   if(o.environment&&o.environment!=='keep'){
    b.environment=envLabel;
    const variant=LANDSCAPES[o.environment]?.find(v=>v[0]===o.environmentSubtype);
    if(variant){b.environmentSubtype=variant[1];b.environmentSubtypeInstructions=variant[2];b.environmentInstructions=variant[2];}
   }
   if(o.weather&&o.weather!=='keep')b.weather=weatherLabel;
   if(o.season&&o.season!=='keep')b.season=seasonLabel;
   if(o.time&&o.time!=='keep')b.time=timeLabel;
   if(o.plants&&o.plants!=='keep')b.plants=plantsLabel;
   if(o.environmentInstructions)b.environmentInstructions=[b.environmentInstructions,String(o.environmentInstructions).trim()].filter(Boolean).join(' ').slice(0,350);
   // Derive a consistent atmosphere from the same controls rather than contradicting the weather.
   if(!o.time&&!o.weather&&o.mood)b.sceneMood=o.mood;
   if(o.time==='blue')b.sceneMood='blue';
   else if(o.time==='golden')b.sceneMood='golden';
   else if(o.time==='night')b.sceneMood='night';
   else if(['sunny','clear'].includes(o.weather))b.sceneMood='sunny';
   else if(['overcast','cloud'].includes(o.weather))b.sceneMood='overcast';
   else if(o.weather==='fog')b.sceneMood='fog';
   else if(o.weather==='rain')b.sceneMood='rain';
   else if(o.weather==='snow')b.sceneMood='winter';
   if(n.type==='lighting'&&previousMode==='interior'){
    b.lighting=({'blue':'evening','golden':'evening','night':'evening','sunny':'sunny','overcast':'overcast'})[b.sceneMood]||b.lighting||'soft-daylight';
   }
 }
 if(o.lens&&o.lens!=='keep'){const instruction='Architectural camera lens '+o.lens+'. Preserve the perspective and placement of all architectural elements.';b.homeChanges=[b.homeChanges,instruction].filter(Boolean).join(' ').slice(0,600);}
 if(o.changes){b.homeChanges=[b.homeChanges,String(o.changes).trim()].filter(Boolean).join(' ').slice(0,600);}
 b.lockGeometry=o.lockGeometry!==false;
 if(['exterior','lighting'].includes(n.type))b.preserveMaterials=o.preserveMaterials!==false;
 if(n.type==='materials'){b.textureScale=String(o.textureScale||100)+'%';b.textureRotation=String(o.textureRotation||0)+'°';}
 if(['exterior','lighting','interior'].includes(n.type))b.output={...(b.output||{}),ratio:RATIOS[o.ratio]?o.ratio:'16:9',quality:['high','medium'].includes(o.quality)?o.quality:'high'};
 if(o.quality&&['high','medium'].includes(o.quality))b.output={...(b.output||{}),quality:o.quality};
 return b;
}
async function runTo(target,resume=false){
 if(window.FORMA_WORKFLOW_UI?.uploading){tell('Дождитесь загрузки исходника в блок.');return;}
 if(busy||preparing){tell('Другая цепочка уже запущена или проверяется.');return}
 const api=getAPI(),g=graph();if(!api||!g)return;
 preparing=true;decorate();
 let ctx,plan,resumeNodes=new Set();
 try{
  ctx=await window.FORMA_RENDER_BRIDGE?.capture?.();
  if(!ctx)throw Error('Сначала загрузите собственный проект в «ФОРМА».');
  const ownPlan=checkPlan(g,target);const ownSource=api.getSnapshot?.(ownPlan.path[0].id);if(ownSource)ctx={...ctx,source:ownSource};
  const fingerprint=sourceFingerprint(ctx.source);
  const sourceId=ownPlan.path[0].id;g.sourceFingerprints||={};
  if(g.sourceFingerprints[sourceId]!==fingerprint){
   api.invalidateFrom?.(sourceId);
   g.sourceFingerprints[sourceId]=fingerprint;
   api.save?.();
   if(resume)throw Error('Исходное изображение изменилось. Запустите цепочку заново — старые кадры не будут повторно использованы.');
  }
  if(resume){
   if(!lastFailure||lastFailure.target!==target||lastFailure.projectId!==ctx.projectId||lastFailure.source!==ctx.source)
    throw Error('Предыдущий запуск относится к другому исходнику или цепочке. Запустите цепочку заново.');
   resumeNodes=new Set(lastFailure.completed.filter(id=>g.nodes.some(n=>n.id===id)));
  }
  plan=checkPlan(g,target,resumeNodes);
  await availability(plan.calls);
  if(plan.videoCalls)await checkVideoAvailability();
 }catch(err){preparing=false;showSelection();decorate();tell('Проверка цепочки: '+(err.message||'ошибка'));return}
 if(!$('#faFlowBackdrop')){preparing=false;return}
 preparing=false;showSelection();decorate();
 const steps=plan.path.map((n,i)=>{
  let step='локально';
  if(AI_TYPES.has(n.type))step=cacheAllowed(n,resumeNodes)?'готовый кадр · без AI':'новая AI-генерация';
  else if(n.type==='video')step=cacheAllowed(n,resumeNodes)?'готовое видео':'новое AI-видео';
  else if(n.type==='export')step='скачивание файла';
  return (i+1)+'. '+(n.title||n.type)+' — '+step;
 });
 const message='План цепочки ФОРМА\n\n'+steps.join('\n')+
  '\n\nНовых изображений: '+plan.calls+' · новых видео: '+plan.videoCalls+
  (plan.warnings.length?'\n\nПроверьте условия:\n'+plan.warnings.join('\n'):'')+
  '\n\nТочная стоимость зависит от подключённого API. Отмена в браузере НЕ гарантирует отмены списания.\nЗапустить?';
 if((plan.calls||plan.videoCalls)&&!confirm(message)){tell('Запуск отменён. Готовые результаты сохранены.');return}
 if(!plan.calls&&!plan.videoCalls){tell('Используются готовые результаты и локальные операции.');}
 const runId=++openedRunId;
 busy=true;wasCancelled=false;aborter=null;lastFailure=null;
 // Copy settings so they cannot change partway through an asynchronous request.
 plan.path=plan.path.map(n=>({...n,options:{...(n.options||{})}}));
 decorate();statuses.clear();decorate();
 let output=ctx.source,mode=ctx.brief?.sceneType||'exterior',currentBrief=ctx.brief,aiCompleted=0,videoCompleted=0,lastAI='',videoBlob=null;
 try{
  for(const [i,n] of plan.path.entries()){
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   setState(n.id,'running');
   tell('Этап '+(i+1)+'/'+plan.path.length+': '+(n.title||n.type));
   if(n.type==='source'){output=api.getSnapshot?.(n.id)||ctx.source}
   else if(AI_TYPES.has(n.type)){
    const brief=briefFor({...ctx,brief:currentBrief},mode,n);mode=brief.sceneType;currentBrief=brief;
    const cached=cacheAllowed(n,resumeNodes)?api.getSnapshot?.(n.id):null;
    if(cached){output=cached;tell('Готовый кадр: '+(n.title||n.type)+' · без нового AI-запроса');}
    else{
     const materialChoice=n.options?.materialSource!=='text'&&n.options?.materialSource!=='texture'&&n.options?.material&&n.options.material!=='custom'?MATERIALS[n.options.material]:'';
     const instruction=[materialChoice?'Заменить отделку на '+materialChoice+'. Не изменять другие элементы.':'',String(n.options?.instruction||''),n.options?.materialSource==='texture'?'Использовать приложенную фактуру как образец материала, сохранив освещение и геометрию. Масштаб рисунка '+(n.options.textureScale||100)+'%, поворот '+(n.options.textureRotation||0)+'°.':''].filter(Boolean).join(' ').slice(0,500);
     const opts=n.type==='materials'?{selectedZone:ZONES[n.options?.zone]||ZONES.custom,zoneId:n.options?.zone||'custom',editMode:'text',editAction:'material',materialInstruction:instruction,material:n.options?.materialSource==='texture'?api.getTexture?.(n.id):null,materialName:n.options?.textureName||materialChoice}:{};
     output=await imageAI(output,brief,ctx,opts);aiCompleted++;lastAI=n.title||n.type;
    }
   }else if(n.type==='video'){
    const cached=cacheAllowed(n,resumeNodes)?api.getVideoBlob?.(n.id):null;
    videoBlob=cached||await makeVideo(output,n.options);
    if(!cached){videoCompleted++;lastAI=n.title||n.type;await api.setVideoSnapshot?.(n.id,videoBlob)}
   }else if(n.type==='geometry'){output=await geometryOverlay(output,ctx.source,n.options?.overlay)}
   else if(n.type==='upscale'){output=await canvas4K(output,n.options?.target)}
   else if(n.type==='export'){if(videoBlob)downloadVideoBlob(videoBlob);else await downloadImage(output,n.options)}
   if(wasCancelled||runId!==openedRunId)throw Error('Запуск остановлен.');
   if(!videoBlob&&(!api.getSnapshot?.(n.id)||api.getSnapshot(n.id)!==output))await api.setSnapshot?.(n.id,output);
   api.markFresh?.(n.id);
   setState(n.id,'done');
  }
  if(aiCompleted)await window.FORMA_RENDER_BRIDGE.saveWorkflowResult(output,'Сценарий · '+lastAI,ctx.projectId,ctx.source);
  tell('Готово: '+plan.path.length+' этапов · '+aiCompleted+' изображений · '+videoCompleted+' видео. Результаты сохранены в нодах и проекте.');
 }catch(err){
  const pending=plan.path.find(n=>statuses.get(n.id)==='running');
  if(pending)setState(pending.id,wasCancelled?'cancelled':'error');
  const completed=plan.path.filter(n=>statuses.get(n.id)==='done').map(n=>n.id);
  lastFailure={target,completed,projectId:ctx.projectId,source:ctx.source};
  tell((wasCancelled?'Остановлено. ':'Ошибка: ')+(err.message||'неизвестная ошибка')+
   (aiCompleted?' · Выполнено AI-вызовов: '+aiCompleted:'')+
   ' · Готовые этапы сохранены; для повтора нажмите «Повторить».');
 }finally{
  if(runId===openedRunId){busy=false;aborter=null;showSelection();decorate()}
 }
}
function stop(){
 if(!busy)return;
 wasCancelled=true;aborter?.abort();
 tell('Остановка запрошена. Провайдер может продолжить уже начатую генерацию и списать её стоимость.');
}
function onOpen(){
 nodeSettingsBound=null;
 const run=$('#faFlowRunChain');
 if(run&&!$('#faFlowRetryChain')){
  const retry=document.createElement('button');
  retry.type='button';retry.id='faFlowRetryChain';retry.textContent='↻ Повторить';retry.hidden=true;
  retry.title='Продолжить после ошибки, сохранив уже готовые этапы без повторной генерации';
  retry.addEventListener('click',()=>{if(lastFailure)runTo(lastFailure.target,true)});
  run.after(retry);
 }
 showSelection();decorate();
}
function onGraphDrawn(){showSelection();decorate()}
function onClose(){if(busy)stop();nodeSettingsBound=null}
window.FORMA_NODE_ENGINE={catalogs:{environment:ENVIRONMENTS,weather:WEATHER,season:SEASONS,time:TIMES,plants:PLANTS,material:MATERIALS,landscapes:LANDSCAPES},briefFor,settingsHTML,runTo,stop,onOpen,onGraphDrawn,onClose,plan:checkPlan,get busy(){return busy},get preparing(){return preparing}};
})();
