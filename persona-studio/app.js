/* PERSONA STUDIO v0.3 — zero-dependency, privacy-first interactive prototype.
   Image generation and photographic identity transfer are intentionally NOT simulated. */
(() => {
  'use strict';
  const STORAGE_KEY = 'persona-studio-local-v1';
  const $ = (selector, parent=document) => parent.querySelector(selector);
  const $$ = (selector, parent=document) => [...parent.querySelectorAll(selector)];
  const uid = () => 'ps_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, a => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v)));
  const mix = (a,b,t) => Math.round(a + (b - a) * t);
  const hexRgb = s => [1,3,5].map(i => parseInt(s.slice(i,i+2),16));
  const rgbHex = c => '#' + c.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
  const blend = (a,b,t) => rgbHex(hexRgb(a).map((x,i)=>mix(x,hexRgb(b)[i],t)));
  const skinPalette = ['#f1c9ae','#e5b79a','#c99475','#aa7458','#85523e','#5d382c','#382721'];
  function skinFrom(v,undertone='neutral') {
    const f=clamp(v,0,100)/100*(skinPalette.length-1),i=Math.min(skinPalette.length-2,Math.floor(f));
    let base=blend(skinPalette[i],skinPalette[i+1],f-i);
    if(undertone==='warm') base=blend(base,'#b87044',.09);
    if(undertone==='cool') base=blend(base,'#846b79',.08);
    if(undertone==='olive') base=blend(base,'#82714e',.12);
    return base;
  }
  const initial = () => ({
    id:uid(),name:'Персонаж 001',createdAt:Date.now(),updatedAt:Date.now(),source:'builder',photo:null,aiImage:null,hasAIImage:false,locked:false,identity:null,identityImage:null,hasIdentityImage:false,previousAIImage:null,hasPreviousAIImage:false,marks:[],wardrobe:[],
    params:{age:32,height:180,body:44,muscle:43,skin:36,undertone:'neutral',origin:'Не указано',originNote:'',faceWidth:50,jaw:53,nose:46,eyes:51,mouth:53,hairStyle:'parted',hairLength:42,hairDensity:86,hairColor:'#3f322d',grey:0,teeth:'natural',teethTone:26,smile:30,expression:'neutral',outfit:'casual',background:'studio',pose:'front'}
  });
  const sections=[
    {id:'appearance',title:'Внешность',icon:'◉',number:'01',kicker:'01 / ОСНОВА',desc:'Создайте основу персонажа. Двигайте бегунки — эскиз меняется сразу.'},
    {id:'face',title:'Лицо и зубы',icon:'♙',number:'02',kicker:'02 / МОРФОЛОГИЯ',desc:'Настраивайте пропорции лица и детали улыбки.'},
    {id:'hair',title:'Причёски',icon:'〰',number:'03',kicker:'03 / ВОЛОСЫ',desc:'Стрижка, длина, цвет, густота, седина и укладка.'},
    {id:'skin',title:'Кисть и детали',icon:'✎',number:'04',kicker:'04 / ДЕТАЛИ',desc:'Добавляйте шрамы, веснушки, родинки и другие индивидуальные черты.'},
    {id:'wardrobe',title:'Гардероб',icon:'♧',number:'05',kicker:'05 / ОБРАЗ',desc:'Выберите базовый образ и загрузите фотографии своей одежды.'},
    {id:'pose',title:'Позы и камера',icon:'⌖',number:'06',kicker:'06 / ПОСТАНОВКА',desc:'Выбирайте ракурс, выражение лица и фон предпросмотра.'},
    {id:'ai',title:'AI-генерация',icon:'✦',number:'07',kicker:'07 / ФОТОРЕАЛИЗМ',desc:'Создавайте фото по параметрам, загруженному лицу или гардеробу.'},
    {id:'export',title:'Экспорт',icon:'↗',number:'08',kicker:'08 / РЕЗУЛЬТАТ',desc:'Сохраните персонажа и выгрузите эскиз или паспорт параметров.'}
  ];
  const hairStyles=[['buzz','Коротко','▥'],['short','Классика','◒'],['parted','Пробор','◕'],['bob','Каре','◉'],['long','Длинные','♧'],['curly','Кудри','❋'],['bun','Пучок','●']];
  const hairColors=['#211b1b','#3f322d','#76503d','#b78c5f','#d8b98a','#9a3d2c','#aeb0b0'];
  const originChoices=['Не указано','Русская','Армянская','Грузинская','Казахская','Узбекская','Татарская','Украинская','Китайская','Японская','Корейская','Индийская','Нигерийская','Французская','Бразильская','Смешанное происхождение','Другое'];
  const brushTypes=[['scar','Шрам','╱'],['freckles','Веснушки','∴'],['acne','Акне','⋮'],['mole','Родинка','•'],['wrinkle','Морщины','≋'],['spot','Пятно','◦']];
  let saved=[];
  try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY));if(Array.isArray(raw?.characters))saved=raw.characters;}catch(e){}
  if(!saved.length)saved=[initial()];
  let state={characters:saved,id:saved[0].id,section:'appearance',brushEnabled:false,brushType:'scar',brushSize:44,brushStrength:65,view:'front',zoom:100,previewAI:false,previewPrevious:false,aiBusy:false,aiReady:false,aiProvider:'openai',aiModel:'',aiCode:'',aiInstruction:'',aiMode:'create',hairReference:null,aiQuality:'medium',aiSize:'1024x1536',aiGarment:-1};
  let savingTimer=null, storageWarningShown=false;
  const current=()=>state.characters.find(c=>c.id===state.id)||state.characters[0];
  // Generated images are larger than localStorage quotas. Store their bytes in IndexedDB.
  const aiDB=()=>new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error('IndexedDB unavailable'));return;}
    const request=indexedDB.open('persona-studio-images',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('images');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  async function storeAI(id,image){
    const db=await aiDB();
    await new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite');tx.objectStore('images').put(image,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
  }
  async function deleteAI(id){
    try{const db=await aiDB();await new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite');tx.objectStore('images').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch(e){console.warn('Could not remove stored image',e);}
  }
  async function readAI(id){
    try{const db=await aiDB();const image=await new Promise((resolve,reject)=>{const tx=db.transaction('images','readonly'),req=tx.objectStore('images').get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});db.close();return image;}
    catch{return null;}
  }
  async function hydrateAI(id){
    const c=state.characters.find(x=>x.id===id);
    if(!c)return;
    if(c.hasAIImage&&!c.aiImage)c.aiImage=await readAI(id);
    if(c.hasIdentityImage&&!c.identityImage)c.identityImage=await readAI('identity:'+id);
    if(c.hasPreviousAIImage&&!c.previousAIImage)c.previousAIImage=await readAI('previous:'+id);
    if(current().id===id){renderStage();if(state.section==='ai')renderInspector();}
  }
  function saveNow(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:2,characters:state.characters.map(({aiImage,identityImage,previousAIImage,...character})=>character)}));return true;}
    catch(e){if(!storageWarningShown){storageWarningShown=true;toast('Автосохранение недоступно или место браузера заполнено. Скачайте паспорт.');}return false;}
  }
  function persist(){clearTimeout(savingTimer);savingTimer=setTimeout(saveNow,200);}
  function toast(msg){const node=document.createElement('div');node.className='toast';node.textContent=msg;$('#toastRoot').append(node);setTimeout(()=>node.remove(),3300)}
  const slider=(key,label,min,max,unit='',hints=[])=>{
    const v=current().params[key];
    return `<div class="field"><div class="field-name"><label for="range-${key}">${label}</label><span class="field-value" data-value-for="${key}">${v}${unit}</span></div><input class="range" id="range-${key}" data-param="${key}" type="range" min="${min}" max="${max}" value="${v}" aria-label="${label}" />${hints.length?`<div class="field-hints"><span>${esc(hints[0])}</span><span>${esc(hints[1])}</span></div>`:''}</div>`;
  };
  const heading=(title,num='')=>`<div class="control-section-heading"><h2>${title}</h2><small>${num}</small></div>`;
  const chips=(key,items)=>`<div class="chip-row">${items.map(([val,label])=>`<button class="chip ${current().params[key]===val?'selected':''}" data-chip-key="${key}" data-chip-value="${esc(val)}">${esc(label)}</button>`).join('')}</div>`;
  const tiles=(key,items,klass='hair-grid')=>`<div class="${klass}">${items.map(([val,label,glyph])=>`<button class="option-tile ${current().params[key]===val?'selected':''}" data-chip-key="${key}" data-chip-value="${esc(val)}"><span class="option-glyph">${glyph}</span>${esc(label)}</button>`).join('')}</div>`;
  const note=s=>`<p class="field-note">${s}</p>`;
  function sectionContent(){
    const c=current(),p=c.params;
    switch(state.section){
      case 'appearance':return `
        <section class="control-section">${heading('Основные характеристики','01 / 03')}
          <div class="field"><div class="field-name"><label for="charName">Имя персонажа</label></div><input class="text-control" id="charName" maxlength="48" value="${esc(c.name)}" placeholder="Имя или название персонажа" /></div>
          ${slider('age','Визуальный возраст',1,90,' лет',['1 год','90 лет'])}
          ${slider('height','Рост',120,220,' см',['120 см','220 см'])}
          ${slider('body','Телосложение',0,100,'%',['Худощавое','Полное'])}
          ${slider('muscle','Мускулатура',0,100,'%',['Мягкое','Атлетичное'])}
        </section>
        <section class="control-section separated">${heading('Тон кожи','02 / 03')}
          ${slider('skin','Светлота кожи',0,100,'%',['Светлая','Тёмная'])}
          <div class="field"><div class="field-name"><span class="field-label">Подтон</span></div>${chips('undertone',[['cool','Холодный'],['neutral','Нейтральный'],['warm','Тёплый'],['olive','Оливковый']])}</div>
        </section>
        <section class="control-section separated">${heading('Национальность и происхождение','03 / 03')}
          <div class="field"><div class="field-name"><label for="originSelect">Культурная принадлежность</label></div><select id="originSelect" class="select-control">${originChoices.map(o=>`<option ${p.origin===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
          <div class="field"><div class="field-name"><label for="originNote">Уточнение / сочетание</label></div><input class="text-control" id="originNote" maxlength="150" placeholder="Например, смешанное происхождение" value="${esc(p.originNote)}" /></div>
          ${note('Национальность и культурное происхождение не определяют внешность автоматически. Лицо, цвет кожи и волосы настраиваются независимо.')}
        </section>`;
      case 'face':return `<section class="control-section">${heading('Пропорции лица','01 / 02')}
          ${slider('faceWidth','Ширина лица',0,100,'%',['Узкое','Широкое'])}
          ${slider('jaw','Линия челюсти',0,100,'%',['Мягкая','Выраженная'])}
          ${slider('nose','Ширина носа',0,100,'%',['Узкий','Широкий'])}
          ${slider('eyes','Размер глаз',0,100,'%',['Меньше','Больше'])}
          ${slider('mouth','Полнота губ',0,100,'%',['Тонкие','Полные'])}
        </section><section class="control-section separated">${heading('Улыбка и зубы','02 / 02')}
          <div class="field"><div class="field-name"><span class="field-label">Форма и состояние</span></div>${chips('teeth',[['natural','Натуральные'],['even','Ровные'],['gap','Щербинка'],['uneven','Неровные'],['aged','Потемневшие'],['damaged','Повреждённые']])}</div>
          ${slider('teethTone','Оттенок эмали',0,100,'%',['Светлее','Темнее'])}
          ${slider('smile','Выраженность улыбки',0,100,'%',['Нейтрально','Широкая'])}
          ${note('Эскиз показывает приблизительную форму. Точная анатомия отдельных зубов будет доступна в AI/3D-редакторе.')}
        </section>`;
      case 'hair':return `<section class="control-section">${heading('Стиль стрижки','01 / 03')}${tiles('hairStyle',hairStyles)}</section>
        <section class="control-section separated">${heading('Геометрия волос','02 / 03')}
          ${slider('hairLength','Длина',0,100,'%',['Очень короткие','Длинные'])}
          ${slider('hairDensity','Густота',0,100,'%',['Редкие','Густые'])}
          ${slider('grey','Седина',0,100,'%',['Нет','Полная'])}
        </section><section class="control-section separated">${heading('Цвет волос','03 / 03')}
          <div class="color-grid">${hairColors.map(color=>`<button class="color-swatch ${p.hairColor===color?'selected':''}" style="background:${color}" data-hair-color="${color}" aria-label="Цвет ${color}" title="${color}"></button>`).join('')}</div>
          <button id="uploadHairReference" class="ghost-action">＋ Загрузить референс причёски</button>${state.hairReference?'<div class="reference-ready">✓ Фото причёски выбрано для AI</div>':''}${note('Загруженная причёска используется как отдельный референс в режиме AI «Причёска». Изменение реального фото потребует генерации.')}</section>`;
      case 'skin':return `<section class="control-section">${heading('Ретушь и индивидуальные черты','01 / 03')}
          <div class="brush-grid">${brushTypes.map(([val,label,glyph])=>`<button data-brush="${val}" class="option-tile ${state.brushType===val?'selected':''}"><span class="option-glyph">${glyph}</span>${label}</button>`).join('')}</div>
          <p class="brush-target">Выберите инструмент, включите кисть и укажите на изображении место изменения.</p>
          <button id="toggleBrush" class="${state.brushEnabled?'brush-mode-indicator':'ghost-action'}" style="width:100%;border:0;cursor:pointer">${state.brushEnabled?'● Кисть включена — нажмите на лицо':'✎ Включить кисть'}</button>
        </section><section class="control-section separated">${heading('Настройки инструмента','02 / 03')}
          <div class="field"><div class="field-name"><label>Размер кисти</label><span class="field-value" id="brushSizeValue">${state.brushSize}%</span></div><input type="range" min="10" max="100" class="range" data-brush-setting="brushSize" value="${state.brushSize}" /></div>
          <div class="field"><div class="field-name"><label>Интенсивность</label><span class="field-value" id="brushStrengthValue">${state.brushStrength}%</span></div><input type="range" min="10" max="100" class="range" data-brush-setting="brushStrength" value="${state.brushStrength}" /></div>
        </section><section class="control-section separated">${heading('Слои деталей','03 / 03')}
          <div class="brush-setting-grid"><div class="mini-stat">Добавлено деталей<b id="marksCount">${c.marks.length}</b></div><div class="mini-stat">Тип кисти<b style="font-size:13px">${brushTypes.find(x=>x[0]===state.brushType)?.[1]||'—'}</b></div></div>
          <button class="ghost-action" id="undoMark">↶ Удалить последнюю деталь</button><button class="ghost-action" id="clearMarks">✕ Очистить все детали</button>
          ${note('Пока это рисуемые отметки на отдельном слое, а не фотореалистичная реконструкция кожи. AI-преобразование будет подключено позже.')}
        </section>`;
      case 'wardrobe':return `<section class="control-section">${heading('Базовый образ','01 / 02')}
          ${tiles('outfit',[['casual','Повседневный','◕'],['smart','Классика','◇'],['coat','Пальто','♙'],['dress','Платье','♧'],['work','Рабочий','▣'],['sport','Спортивный','▱']],'outfit-grid')}
          ${note('Здесь одежда меняется на векторном эскизе. Настоящая фотореалистичная примерка фотографии одежды — следующий технический этап.')}
        </section><section class="control-section separated">${heading('Мой гардероб','02 / 02')}
          <button class="upload-box" id="uploadGarment"><span class="upload-glyph">＋</span><strong>Загрузить фото одежды</strong><small>JPG, PNG, WebP · хранится локально</small></button>
          <div style="margin-top:15px">${c.wardrobe.length?c.wardrobe.map((item,i)=>`<div class="saved-outfit"><img src="${item.image}" alt="Фото одежды"/><div class="outfit-info"><strong>${esc(item.name)}</strong><small>Референс одежды</small></div><button data-remove-garment="${i}" aria-label="Удалить ${esc(item.name)}">×</button></div>`).join(''):'<p style="color:#77787f;font-size:11px">В гардеробе пока нет загруженных вещей.</p>'}</div>
        </section>`;
      case 'pose':return `<section class="control-section">${heading('Положение персонажа','01 / 03')}
          <div class="field"><div class="field-name"><span class="field-label">Эскизный ракурс</span></div>${chips('pose',[['front','Анфас'],['quarter','¾'],['side','Профиль']])}</div>
          <div class="field"><div class="field-name"><span class="field-label">Выражение</span></div>${chips('expression',[['neutral','Нейтральное'],['smile','Улыбка'],['serious','Серьёзное']])}</div>
        </section><section class="control-section separated">${heading('Предпросмотр','02 / 03')}
          <div class="field"><div class="field-name"><span class="field-label">Фон экспорта</span></div>${chips('background',[['studio','Студия'],['transparent','Прозрачный']])}</div>
          ${note('Векторный ракурс — условный эффект. Для настоящих фотографических видов с разных сторон потребуется AI-генерация и согласование внешности между кадрами.')}
        </section><section class="control-section separated">${heading('Идентичность','03 / 03')}
          <button id="lockIdentity" class="ghost-action">${c.locked?'◇ Зафиксировано — снять фиксацию':'◆ Зафиксировать основу персонажа'}</button>
          <p class="field-note">${c.locked?'Базовые параметры сохранены в паспорте. Вы по-прежнему можете вносить изменения в текущий эскиз.':'Фиксация записывает эталонные параметры, с которыми позже сможет сравниваться AI-результат.'}</p>
        </section>`;
      case 'ai':return `<section class="control-section">${heading('Фотореалистичная генерация','01 / 04')}
          <div class="ai-state ${state.aiReady?'ai-online':'ai-offline'}" id="aiStatus">${state.aiReady?(state.aiProvider==='arkheon'?'● Arkheon настроен · Image API пока не проверен':'● AI-сервер готов к работе'):(state.aiProvider==='arkheon'?'○ Arkheon: нужен API-ключ и ID модели изображений':'○ AI не настроен или недоступен')}</div>
          ${note(state.aiProvider==='arkheon'?'Выбран Arkheon. Поддержка генерации и редактирования изображений через публичный API ещё не подтверждена. После настройки проверьте доступность метода и модели; кредиты Arkheon могут списываться за успешный запрос.':'Фотореалистичная генерация выполняется только после подключения API. Оплачивается отдельно. Отправляйте только фотографии, которые имеете право использовать.')}
          <div class="field"><div class="field-name"><label for="aiAccessCode">Код доступа</label></div><input class="text-control" id="aiAccessCode" type="password" autocomplete="off" placeholder="Задаётся владельцем приложения" value="${esc(state.aiCode)}" /></div>
          <div class="field"><div class="field-name"><label for="aiMode">Режим генерации</label></div><select id="aiMode" class="select-control"><option value="create" ${state.aiMode==='create'?'selected':''}>Создать нового по параметрам</option><option value="identity" ${state.aiMode==='identity'?'selected':''}>Сохранить лицо — изменить по запросу</option><option value="hair" ${state.aiMode==='hair'?'selected':''}>Изменить только причёску</option><option value="outfit" ${state.aiMode==='outfit'?'selected':''}>Переодеть персонажа</option><option value="skin" ${state.aiMode==='skin'?'selected':''}>Изменить детали кожи</option></select></div>
          <div class="reference-ready">${c.locked?(c.hasIdentityImage||c.identityImage?'◆ Фотореференс личности закреплён':'◆ Параметры закреплены — для точности создайте эталонное фото'):'◇ Личность не закреплена'} ${c.source==='photo'?' · Есть исходное фото':''}</div>
          <div class="field"><div class="field-name"><label for="aiInstruction">Что изменить или добавить</label></div><textarea class="text-control ai-textarea" id="aiInstruction" maxlength="450" placeholder="Например: лёгкий шрам на правой щеке, строгий взгляд">${esc(state.aiInstruction)}</textarea></div>
        </section><section class="control-section separated">${heading('Параметры вывода','02 / 03')}
          <div class="field"><div class="field-name"><label for="aiQuality">Детализация</label></div><select class="select-control" id="aiQuality"><option value="low" ${state.aiQuality==='low'?'selected':''}>Черновик / экономно</option><option value="medium" ${state.aiQuality==='medium'?'selected':''}>Стандарт</option><option value="high" ${state.aiQuality==='high'?'selected':''}>Высокое качество</option></select></div>
          <div class="field"><div class="field-name"><label for="aiSize">Формат изображения</label></div><select class="select-control" id="aiSize"><option value="1024x1536" ${state.aiSize==='1024x1536'?'selected':''}>Портрет — 1024×1536</option><option value="1024x1024" ${state.aiSize==='1024x1024'?'selected':''}>Квадрат — 1024×1024</option><option value="1536x1024" ${state.aiSize==='1536x1024'?'selected':''}>Горизонтально — 1536×1024</option></select></div>
          <div class="field"><div class="field-name"><label for="aiGarment">Фото одежды</label></div><select class="select-control" id="aiGarment"><option value="-1">Без фото одежды</option>${c.wardrobe.map((w,i)=>`<option value="${i}" ${state.aiGarment===i?'selected':''}>${esc(w.name)}</option>`).join('')}</select></div>
          <button id="showSketch" class="ghost-action">◇ Вернуться к эскизу / исходному фото</button>
        </section><section class="control-section separated">${heading('Как сохраняется внешность','03 / 03')}
          ${note('В режиме создания выполняется новая генерация. В режимах правки используется закреплённый портрет, исходное фото или последний результат. Полная идентичность не гарантирована: сравнивайте лицо после каждой операции.')}
          <button id="lockIdentity" class="ghost-action">${c.locked?'◇ Снять фиксацию персонажа':'◆ Зафиксировать текущую личность'}</button>
          <div class="ai-compare"><button id="showPrevious" class="ghost-action" ${!c.hasPreviousAIImage?'disabled':''}>◐ Показать предыдущий результат</button><button id="showAI" class="ghost-action" ${!c.hasAIImage?'disabled':''}>◑ Показать текущий результат</button></div>
          <div class="ai-progress" id="aiProgress" style="display:${state.aiBusy?'block':'none'}"><div class="ai-progress-bar"></div><small>AI создаёт изображение. Это индикатор ожидания, не измерение процента готовности.</small></div>
        </section>`;
      case 'export':return `<section class="control-section">${heading('Файлы для проекта','01 / 02')}
          <div class="export-row"><div class="export-icon">▧</div><div><h3>Изображение PNG</h3><p>1200 × 1440 · текущий эскиз / фото</p></div><button data-export="png">Скачать</button></div>
          <div class="export-row"><div class="export-icon">{ }</div><div><h3>Паспорт персонажа</h3><p>JSON · параметры, слои, одежда (без исходных фото)</p></div><button data-export="json">Скачать</button></div>
          <div class="export-row"><div class="export-icon">◧</div><div><h3>Фото для AI</h3><p>Пакет эталонов и генерация ракурсов</p></div><button id="notReady">Позже</button></div>
        </section><section class="control-section separated">${heading('Мой персонаж','02 / 02')}
          <div class="brush-setting-grid"><div class="mini-stat">Детали кожи<b>${c.marks.length}</b></div><div class="mini-stat">Вещей в гардеробе<b>${c.wardrobe.length}</b></div></div>
          <button class="ghost-action" id="lockIdentity">${c.locked?'◇ Основа зафиксирована':'◆ Зафиксировать внешность'}</button>
          <button class="ghost-action" id="deleteCharacter" style="color:#e2ad9f">✕ Удалить персонажа</button>
          ${note('Экспортированный PNG из фото не гарантирует физическую точность формы лица. В первой версии изображения и параметры сохраняются только в вашем браузере.')}
        </section>`;
    }
    return '';
  }
  function renderSidebar(){
    $('#sections').innerHTML=sections.map(s=>`<button class="${state.section===s.id?'active':''}" data-section="${s.id}"><span class="side-icon">${s.icon}</span><span>${s.title}</span><span class="side-number">${s.number}</span></button>`).join('');
    $('#libraryCount').textContent=state.characters.length;
    $('#libraryList').innerHTML=state.characters.map(c=>`<button class="library-item ${c.id===state.id?'active':''}" data-character="${c.id}"><span class="library-thumb">${c.photo?`<img src="${c.photo}" alt=""/>`:`<span style="font-size:20px;color:${skinFrom(c.params.skin,c.params.undertone)}">●</span>`}</span><span class="library-item-info"><strong>${esc(c.name)}</strong><small>${c.source==='photo'?'По фотографии':'Создан с нуля'}${c.locked?' · ◈':''}</small></span></button>`).join('');
    const bottomSections=['appearance','face','hair','skin','ai','export'];
    $('#mobileNav').innerHTML=bottomSections.map(id=>{const s=sections.find(t=>t.id===id);return `<button data-section="${id}" class="${state.section===id?'active':''}"><span>${s.icon}</span>${s.title.split(' ')[0]}</button>`}).join('');
  }
  function renderInspector(){
    const c=current(),s=sections.find(s=>s.id===state.section);
    $('#inspectorKicker').textContent=s.kicker;
    $('#inspectorTitle').textContent=s.title;
    $('#inspectorDescription').textContent=s.desc;
    $('#inspectorContent').innerHTML=sectionContent();
    $('#characterNameTop').textContent=c.name;
    $('#characterState').textContent=c.locked?'ОСНОВА ЗАФИКСИРОВАНА':'ЧЕРНОВИК';
    $('#identityIcon').textContent=c.locked?'◆':'◇';
    $('#identityText').textContent=c.locked?'Основа персонажа зафиксирована':'Внешность не зафиксирована';
    const mainLabels={ai:state.aiBusy?'Генерация выполняется…':'✦ Сгенерировать фото',appearance:'Создать 4 варианта',face:'Создать 4 варианта',hair:'Создать 4 варианта',skin:state.brushEnabled?'Выключить кисть':'Включить кисть',wardrobe:'Добавить свою одежду',pose:c.locked?'Снять фиксацию':'Зафиксировать основу',export:'Скачать изображение PNG'};
    $('#mainAction').innerHTML=esc(mainLabels[state.section])+' <span>↗</span>';
    $('#mainAction').disabled=state.aiBusy;
    $('#sourceLabel').textContent=c.source==='photo'?'PHOTO / USER FILE':'ORIGINAL / 01';
    $('#stageModeLabel').textContent=state.previewAI&&c.aiImage?(state.previewPrevious?'AI / ДО':'AI / ПОСЛЕ'):c.source==='photo'?'Фото пользователя':'Живой эскиз';
    $('#stageDisclaimer').innerHTML=state.previewAI&&c.aiImage?'<span class="disclaimer-asterisk">✦</span> AI-изображение готово. Проверяйте сохранение внешности и точность одежды.':c.source==='photo'?'<span class="disclaimer-asterisk">✦</span> Загруженное фото показано без изменения внешности. Кисть добавляет отдельный слой; AI пока не подключён.':'<span class="disclaimer-asterisk">✦</span> Параметрический 2D-эскиз, не фотография и не 3D-модель. AI-генерация подключается следующим этапом.';
  }
  function renderStage(){
    const c=current(),target=$('#avatarContainer');
    const view=state.view;
    const displayingAI=state.previewAI&&!!(state.previewPrevious?c.previousAIImage:c.aiImage);
    target.className='avatar-container '+(c.source==='photo'||displayingAI?'photo-mode':'')+(state.brushEnabled?' brush-active':'');
    target.style.transform=`scale(${state.zoom/100})`;
    if(displayingAI || (c.source==='photo'&&c.photo)){
      const shownImage=displayingAI?(state.previewPrevious?c.previousAIImage:c.aiImage):c.photo;
      target.innerHTML=`<div class="photo-scene"><img class="uploaded-photo" src="${shownImage}" alt="${displayingAI?'AI-изображение персонажа':'Загруженное фото персонажа'}"/><svg class="photo-overlay" viewBox="0 0 600 720" preserveAspectRatio="none"><g>${marksSvg(c.marks)}</g></svg></div>`;
    } else {
      target.innerHTML=avatarSVG(c.params,c.marks,view,'large');
    }
    $('#zoomReadout').textContent=state.zoom+'%';
    $$('#viewSwitch button').forEach(b=>b.classList.toggle('selected',b.dataset.view===view));
    $('#stage').style.background=c.params.background==='transparent'?'linear-gradient(45deg,#bdb5a8 25%,#a89f93 25%,#a89f93 50%,#bdb5a8 50%,#bdb5a8 75%,#a89f93 75%) 0 0/32px 32px':'';
    $('#stage').style.borderColor=state.brushEnabled?'#d0ad83':'#47433e';
  }
  function renderAll(){renderSidebar();renderInspector();renderStage();persist();}
  function colorShade(hex,amount){return blend(hex,amount>=0?'#ffffff':'#000000',Math.abs(amount));}
  function marksSvg(marks){return marks.map((m,i)=>{
    const x=+m.x||0,y=+m.y||0,size=m.size||35,k=(m.strength||65)/100;
    switch(m.type){
      case 'scar':return `<g opacity="${k*.78}"><path d="M${x-size*.55} ${y+size*.23} Q${x-size*.13} ${y-size*.15} ${x+size*.55} ${y-size*.3}" fill="none" stroke="#6d3735" stroke-width="${Math.max(1,size*.052)}" stroke-linecap="round"/><path d="M${x-size*.54} ${y+size*.33} Q${x-size*.13} ${y-size*.05} ${x+size*.55} ${y-size*.20}" fill="none" stroke="#edb9ad" stroke-width="${Math.max(1,size*.038)}"/></g>`;
      case 'freckles':return `<g fill="#805039" opacity="${k*.72}">${Array.from({length:12},(_,n)=>{const dx=Math.sin(n*19+i)*size*.42,dy=Math.cos(n*13+i)*size*.27,r=1+(n%3)*.53;return `<circle cx="${x+dx}" cy="${y+dy}" r="${r}"/>`}).join('')}</g>`;
      case 'acne':return `<g opacity="${k}">${Array.from({length:5},(_,n)=>{const dx=Math.sin(n*10+i)*size*.32,dy=Math.cos(n*21+i)*size*.29;return `<circle cx="${x+dx}" cy="${y+dy}" r="${2+n%3}" fill="#b96056"/><circle cx="${x+dx-1}" cy="${y+dy-1}" r=".8" fill="#f5b3a6"/>`}).join('')}</g>`;
      case 'mole':return `<circle cx="${x}" cy="${y}" r="${Math.max(2,size*.12)}" fill="#3e2925" opacity="${k}"/>`;
      case 'wrinkle':return `<g fill="none" stroke="#5f4036" stroke-width="1.4" opacity="${k*.5}"><path d="M${x-size*.42} ${y-4} Q${x} ${y-size*.16} ${x+size*.42} ${y-5}"/><path d="M${x-size*.32} ${y+5} Q${x} ${y-size*.01} ${x+size*.32} ${y+4}"/></g>`;
      default:return `<ellipse cx="${x}" cy="${y}" rx="${size*.30}" ry="${size*.20}" fill="#ad755e" opacity="${k*.38}"/>`;
    }
  }).join('')}
  function avatarSVG(p, marks=[], view='front', instance='main'){
    const skin=skinFrom(p.skin,p.undertone), skinLight=colorShade(skin,.2),skinDark=colorShade(skin,-.17);
    const dark=blend(p.hairColor,'#aeb0ab',p.grey/100);
    const hairLight=colorShade(dark,.14),teeth=blend('#fff7e7','#a48a6b',p.teethTone/100);
    const faceWidth=61+(p.faceWidth-50)*.25, jawX=26+(p.jaw-50)*.20;
    const faceLeft=300-faceWidth,faceRight=300+faceWidth;
    const eyeW=10+(p.eyes-50)*.056, noseW=5+(p.nose-50)*.1;
    const bodySize=112+(p.body-50)*.48+(p.muscle-50)*.1;
    const topWidth=bodySize + (p.muscle-50)*.22;
    const halfHip=60+(p.body-50)*.33;
    const heightFactor=.85+(p.height-120)/100*.22;
    const mouthSpread=15+(p.mouth-50)*.18;
    const hairStretch=.87+(p.hairLength/100)*.39;
    const smile=(p.expression==='smile'?75:p.expression==='serious'?8:p.smile);
    const aged=clamp((p.age-37)/48,0,1);
    const hairShape={
      buzz:`<path d="M${faceLeft-1} 188 Q${faceLeft-8} 138 300 129 Q${faceRight+10} 136 ${faceRight+2} 189 Q${faceRight-20} 151 300 155 Q${faceLeft+20} 151 ${faceLeft-1} 188Z" fill="url(#hair-${instance})"/>`,
      short:`<path d="M${faceLeft-3} 200 Q${faceLeft-20} 151 ${faceLeft+8} 142 Q300 119 ${faceRight-3} 143 Q${faceRight+18} 146 ${faceRight+3} 203 L${faceRight-10} 172 Q300 158 ${faceLeft+11} 176Z" fill="url(#hair-${instance})"/>`,
      parted:`<path d="M${faceLeft-5} 203 Q${faceLeft-23} 151 ${faceLeft+3} 139 Q${faceLeft+44} 119 305 128 Q${faceRight+23} 126 ${faceRight+8} 203 L${faceRight-7} 186 Q${faceRight-15} 159 307 153 Q286 170 ${faceLeft+9} 167 Z" fill="url(#hair-${instance})"/><path d="M306 137 Q300 150 302 164" fill="none" stroke="${hairLight}" opacity=".43" stroke-width="2"/>`,
      bob:`<path d="M${faceLeft-7} 188 Q${faceLeft-18} 130 300 127 Q${faceRight+20} 134 ${faceRight+9} 196 L${faceRight+12} 329 Q${faceRight-11} 347 ${faceRight-21} 314 L${faceRight-11} 174 Q300 148 ${faceLeft+11} 175 L${faceLeft+18} 319 Q${faceLeft-17} 348 ${faceLeft-10} 321Z" fill="url(#hair-${instance})"/>`,
      long:`<path d="M${faceLeft-7} 189 Q${faceLeft-20} 124 300 126 Q${faceRight+16} 136 ${faceRight+7} 189 Q${faceRight+28} 308 ${faceRight+35} 473 L${faceRight-14} 479 Q${faceRight+5} 311 ${faceRight-14} 171 Q300 150 ${faceLeft+12} 173 Q${faceLeft-9} 305 ${faceLeft-33} 473 L${faceLeft-50} 474 Q${faceLeft-32} 287 ${faceLeft-7} 189Z" fill="url(#hair-${instance})"/>`,
      curly:`<g fill="url(#hair-${instance})">${Array.from({length:18},(_,i)=>{const a=Math.PI*1.05+Math.PI*.95*i/17;const rX=69,rY=63;return `<circle cx="${300+Math.cos(a)*rX}" cy="${194+Math.sin(a)*rY}" r="${16+(i%4)*2}"/>`}).join('')}<path d="M${faceLeft-6} 205 Q${faceLeft-27} 140 300 125 Q${faceRight+32} 154 ${faceRight+6} 207 L${faceRight-10} 178 Q300 152 ${faceLeft+10} 178Z"/></g>`,
      bun:`<circle cx="300" cy="102" r="38" fill="url(#hair-${instance})"/><path d="M${faceLeft-5} 194 Q${faceLeft-22} 144 300 136 Q${faceRight+20} 144 ${faceRight+6} 194 Q300 160 ${faceLeft+14} 176Z" fill="url(#hair-${instance})"/>`
    };
    const hair=p.hairStyle==='buzz'&&p.hairLength>65?hairShape.short:(hairShape[p.hairStyle]||hairShape.parted);
    const outfit={
      casual:['#282b2d','#1e2023','#343438'],smart:['#242629','#ece8e2','#19191d'],coat:['#675a4d','#302d2b','#3c3934'],dress:['#24272a','#383b40','#24272a'],work:['#75644c','#38342f','#43403c'],sport:['#4a504e','#343b3a','#34383a']
    }[p.outfit]||['#282b2d','#1e2023','#343438'];
    const clothes=outfit[0],pants=outfit[1],accent=outfit[2];
    const turn=view==='side'?'translate(81 0) scale(.73 1)':view==='quarter'?'translate(33 0) scale(.89 1)':'translate(0 0)';
    const isDress=p.outfit==='dress';
    const img=`<svg xmlns="http://www.w3.org/2000/svg" class="avatar-svg" viewBox="0 0 600 720" preserveAspectRatio="xMidYMid meet" aria-label="Векторный эскиз персонажа">
      <defs>
        <linearGradient id="skin-${instance}" x1="0" y1="0" x2="1" y2=".25"><stop stop-color="${skinDark}"/><stop offset=".33" stop-color="${skinLight}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${skinDark}"/></linearGradient>
        <linearGradient id="cloth-${instance}" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="${colorShade(clothes,-.16)}"/><stop offset=".45" stop-color="${colorShade(clothes,.15)}"/><stop offset="1" stop-color="${colorShade(clothes,-.22)}"/></linearGradient>
        <linearGradient id="hair-${instance}" x1="0" x2="1" y1=".2" y2=".8"><stop stop-color="${colorShade(dark,-.14)}"/><stop offset=".37" stop-color="${hairLight}"/><stop offset="1" stop-color="${colorShade(dark,-.17)}"/></linearGradient>
        <linearGradient id="pant-${instance}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${colorShade(pants,-.22)}"/><stop offset=".5" stop-color="${colorShade(pants,.14)}"/><stop offset="1" stop-color="${colorShade(pants,-.17)}"/></linearGradient>
        <radialGradient id="face-${instance}"><stop offset=".1" stop-color="${skinLight}"/><stop offset=".76" stop-color="${skin}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient>
      </defs>
      <g transform="translate(300 700) scale(1 ${heightFactor}) translate(-300 -700) ${turn}">
        <ellipse cx="300" cy="700" rx="108" ry="12" fill="#232b2b" opacity=".18"/>
        <path d="M${300-halfHip} 485 L${300-halfHip+9} 576 L${300-halfHip+5} 668 Q${300-halfHip+7} 686 ${300-halfHip+33} 686 L287 681 L300 550 L312 681 L${300+halfHip-29} 686 Q${300+halfHip-6} 682 ${300+halfHip-5} 664 L${300+halfHip-10} 570 L${300+halfHip} 488Z" fill="url(#pant-${instance})"/>
        <path d="M${300-halfHip+6} 563 Q${300-halfHip+24} 578 288 552 M312 550 Q${300+halfHip-19} 575 ${300+halfHip-7} 561" fill="none" stroke="#696766" opacity=".24" stroke-width="2"/>
        <path d="M${300-halfHip+5} 675 L${300-halfHip+28} 673 L${300-halfHip+35} 700 L${300-halfHip-4} 700 Q${300-halfHip-9} 691 ${300-halfHip+5} 675Z" fill="#292a2a"/>
        <path d="M${300+halfHip-28} 675 L${300+halfHip-5} 674 L${300+halfHip+17} 691 Q${300+halfHip+20} 701 ${300+halfHip+8} 702 L${300+halfHip-31} 702Z" fill="#28292a"/>
        <path d="M${300-topWidth+13} 344 L${300-topWidth-11} 365 L${300-topWidth-32} 504 Q${300-topWidth-33} 518 ${300-topWidth-16} 521 Q${300-topWidth-5} 521 ${300-topWidth+1} 501 L${300-topWidth+35} 404Z" fill="url(#skin-${instance})"/>
        <path d="M${300+topWidth-13} 345 L${300+topWidth+10} 365 L${300+topWidth+34} 504 Q${300+topWidth+35} 519 ${300+topWidth+16} 521 Q${300+topWidth+5} 521 ${300+topWidth-1} 500 L${300+topWidth-35} 404Z" fill="url(#skin-${instance})"/>
        <path d="M${300-topWidth+13} 339 Q${300-topWidth-13} 347 ${300-topWidth-26} 378 L${300-topWidth+8} 404 L${300-topWidth+35} 395 L${300-topWidth+27} 519 Q300 543 ${300+topWidth-25} 518 L${300+topWidth-35} 395 L${300+topWidth+9} 407 L${300+topWidth+26} 378 Q${300+topWidth+13} 348 ${300+topWidth-15} 340 L338 320 L262 320Z" fill="url(#cloth-${instance})"/>
        <path d="M263 320 L279 339 L300 353 L322 338 L337 321 L326 319 Q300 346 275 319Z" fill="${p.outfit==='smart'?'#e1ddd4':colorShade(clothes,-.13)}"/>
        ${p.outfit==='smart'?'<path d="M280 331 L290 362 L300 345 L310 363 L320 332 M295 350 L300 412 L305 350" fill="none" stroke="#cbc7bf" stroke-width="2"/>':''}
        ${p.outfit==='coat'?`<path d="M282 333 L289 511 L314 515 L318 330 M269 346 L297 379 L287 422 M332 346 L308 380 L319 422" fill="none" stroke="#a19179" stroke-width="2.5"/>`:''}
        ${p.outfit==='work'?'<path d="M238 394 h39 v29 h-39z M322 394 h39 v29 h-39z" fill="none" stroke="#b7a181" opacity=".5"/>':''}
        ${isDress?`<path d="M${300-topWidth+34} 468 Q300 480 ${300+topWidth-35} 467 L${300+topWidth+8} 615 Q300 632 ${300-topWidth-6} 615Z" fill="url(#cloth-${instance})"/>`:''}
        <path d="M261 330 Q300 347 338 329" fill="none" stroke="${accent}" opacity=".18" stroke-width="1.5"/>
        <path d="M276 300 L276 342 Q300 354 324 342 L324 300Z" fill="url(#skin-${instance})"/>
        <ellipse cx="${faceLeft-1}" cy="229" rx="11" ry="19" fill="${skinDark}"/><ellipse cx="${faceRight+1}" cy="229" rx="11" ry="19" fill="${skinDark}"/>
        <path d="M300 151 C${faceLeft+6} 145 ${faceLeft-4} 180 ${faceLeft} 236 C${faceLeft+2} 288 ${300-jawX} 321 300 327 C${300+jawX} 323 ${faceRight-2} 290 ${faceRight} 236 C${faceRight+4} 180 ${faceRight-5} 145 300 151Z" fill="url(#face-${instance})"/>
        <ellipse cx="${faceLeft+14}" cy="252" rx="13" ry="24" fill="${skinDark}" opacity=".06"/><ellipse cx="${faceRight-15}" cy="253" rx="13" ry="24" fill="${skinDark}" opacity=".07"/>
        <g transform="translate(300 155) scale(1 ${hairStretch}) translate(-300 -155)" opacity="${.48+p.hairDensity/100*.52}">${hair}</g>
        <path d="M${300-faceWidth*.72} 210 Q${300-faceWidth*.48} 203 ${300-19} 211 M${300+20} 211 Q${300+faceWidth*.47} 204 ${300+faceWidth*.72} 211" fill="none" stroke="${dark}" stroke-width="3.8" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="${300-faceWidth*.49}" cy="230" rx="${eyeW}" ry="5.4" fill="#e1d9ce" opacity=".92"/><ellipse cx="${300+faceWidth*.49}" cy="230" rx="${eyeW}" ry="5.4" fill="#e1d9ce" opacity=".92"/>
        <circle cx="${300-faceWidth*.49}" cy="229.8" r="4.6" fill="#504c43"/><circle cx="${300+faceWidth*.49}" cy="229.8" r="4.6" fill="#504c43"/>
        <circle cx="${300-faceWidth*.49-1.2}" cy="228.8" r="1.1" fill="#fff"/><circle cx="${300+faceWidth*.49-1.2}" cy="228.8" r="1.1" fill="#fff"/>
        <path d="M${300-faceWidth*.49-eyeW} 229 Q${300-faceWidth*.49} 223 ${300-faceWidth*.49+eyeW} 229 M${300+faceWidth*.49-eyeW} 229 Q${300+faceWidth*.49} 223 ${300+faceWidth*.49+eyeW} 229" stroke="#4e3934" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M299 234 Q${300-noseW-2} 251 ${300-noseW} 259 Q300 264 ${300+noseW} 259" fill="none" stroke="${skinDark}" stroke-width="2.1" stroke-linecap="round" opacity=".53"/>
        <path d="M${300-noseW-5} 257 Q300 262 ${300+noseW+5} 257" stroke="${skinDark}" opacity=".25" fill="none"/>
        <path d="M${300-mouthSpread-smile*.07} 281 Q300 ${281+smile*.13} ${300+mouthSpread+smile*.07} 281 Q300 ${288+smile*.17} ${300-mouthSpread-smile*.07} 281Z" fill="#6d4039" opacity=".88"/>
        ${smile>38?`<path d="M${300-13-smile*.055} 282 Q300 285 ${300+13+smile*.055} 282 Q300 ${290+smile*.07} ${300-13-smile*.055} 282Z" fill="${teeth}"/>`:''}
        ${p.teeth==='gap'&&smile>38?'<rect x="299" y="283" width="2.5" height="5" rx="1" fill="#51342b"/>':''}
        ${p.teeth==='uneven'&&smile>38?'<path d="M290 282 v6 m9-5 v6 m9-6 v4" stroke="#987863" stroke-width="1" opacity=".5"/>':''}
        ${p.teeth==='damaged'&&smile>38?'<path d="M302 285 l3 3 l3-2" stroke="#594938" stroke-width="2" fill="none"/>':''}
        <path d="M289 303 Q300 308 311 303" fill="none" stroke="${skinDark}" stroke-width="1.2" opacity=".13"/>
        <g fill="none" stroke="#714f40" stroke-width="1.25" opacity="${aged*.6}"><path d="M${faceLeft+12} 244 q11 -6 16 -1 M${faceRight-12} 244 q-11 -6 -16 -1 M281 184 q20 -5 39 0 M281 190 q20 -5 39 0"/><path d="M${faceLeft+18} 283 q10 -8 13 -8 M${faceRight-18} 283 q-10 -8 -13 -8"/></g>
        <g id="skin-marks">${marksSvg(marks)}</g>
      </g>
    </svg>`;
    return img;
  }
  function activateSection(section){state.section=section;state.brushEnabled=false;renderAll(); if(window.innerWidth<700){$('#inspectorTitle').scrollIntoView({behavior:'smooth',block:'center'});}}
  function switchCharacter(id){state.previewAI=false;state.previewPrevious=false;state.id=id;state.section='appearance';state.brushEnabled=false;state.zoom=100;state.view='front';renderAll();hydrateAI(id);}
  function addCharacter(fromPhoto=false, photo=null){let c=initial();c.name='Персонаж '+String(state.characters.length+1).padStart(3,'0');if(fromPhoto){c.source='photo';c.photo=photo;state.aiMode='identity';}else{state.aiMode='create';}state.characters.unshift(c);switchCharacter(c.id);toast(fromPhoto?'Фотография добавлена. AI-перенос внешности будет подключён позже.':'Новый персонаж создан. Настройте внешность.');}
  function modal(html){$('#modalRoot').innerHTML=`<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true"><button class="modal-close" aria-label="Закрыть" id="closeModal">×</button>${html}</section></div>`;$('#closeModal').addEventListener('click',closeModal);$('#modalRoot .modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal();});}
  function closeModal(){$('#modalRoot').innerHTML='';}
  function openCreateModal(){modal(`<div class="modal-eyebrow">PERSONA / NEW CHARACTER</div><h2>Создадим нового героя.</h2><p>Выберите отправную точку. Обе возможности доступны в одном редакторе.</p><div class="creation-choices"><button class="creation-choice" id="choiceBlank"><i>◉</i><strong>Создать с нуля</strong><small>Параметры, лицо, причёска, рост, тон кожи</small></button><button class="creation-choice" id="choicePhoto"><i>▧</i><strong>По фотографии</strong><small>Загрузить собственное фото и работать с деталями</small></button></div><p style="font-size:10px;margin-top:18px">Фото хранятся локально до момента, когда вы нажмёте AI-генерацию. Тогда выбранные изображения отправляются на сервер и провайдеру AI.</p>`);$('#choiceBlank').onclick=()=>{closeModal();addCharacter()};$('#choicePhoto').onclick=()=>{closeModal();$('#photoFile').click()};}
  function openAbout(){modal(`<div class="modal-eyebrow">PERSONA / PREVIEW 0.3</div><h2>Первая рабочая версия</h2><p>Это локальный интерактивный прототип, позволяющий проверить работу редактора до подключения дорогих генеративных моделей.</p><p><strong style="color:#eee">Уже работает:</strong> бегунки с живым векторным эскизом, создание нескольких персонажей, загрузка своего фото, косметические метки кистью, библиотека одежды, выбор причёски, паспорт, скачивание PNG, сохранение в браузере.</p><p><strong style="color:#eee">AI-функции:</strong> доступны после подключения ключей на сервере. Новые режимы позволяют попробовать редактировать причёску, одежду и детали кожи. Точность сохранения внешности не гарантирована. Настоящей 3D-геометрии пока нет.</p><div class="modal-actions"><button id="gotIt">Понятно</button></div>`);$('#gotIt').onclick=closeModal;}
  async function resizedImage(file){
    if(!file.type.startsWith('image/')) throw new Error('Нужно изображение');
    if(file.size>15*1024*1024) throw new Error('Максимальный размер исходного файла 15 МБ');
    const url=URL.createObjectURL(file);
    try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});
      const maxSize=1100,scale=Math.min(1,maxSize/Math.max(img.width,img.height));const can=document.createElement('canvas');can.width=Math.round(img.width*scale);can.height=Math.round(img.height*scale);
      const ctx=can.getContext('2d');ctx.fillStyle='#c1b9ae';ctx.fillRect(0,0,can.width,can.height);ctx.drawImage(img,0,0,can.width,can.height);
      return can.toDataURL('image/jpeg',.79);
    }finally{URL.revokeObjectURL(url)}
  }
  function setBrushMark(clientX,clientY){
    if(!state.brushEnabled||state.section!=='skin')return;
    const c=current();
    const target=(state.previewAI&&c.aiImage)||c.source==='photo'?$('#avatarContainer svg.photo-overlay'):$('#avatarContainer svg.avatar-svg');
    if(!target)return;
    const point=target.createSVGPoint();point.x=clientX;point.y=clientY;
    const matrix=target.getScreenCTM();if(!matrix)return;
    const local=point.matrixTransform(matrix.inverse());
    const x=clamp(local.x,0,600),y=clamp(local.y,0,720);
    if(c.source==='builder'&&!state.previewAI&&(x<193||x>408||y<118||y>335)){toast('Для эскиза наносите детали на лицо.');return;}
    c.marks.push({type:state.brushType,x,y,size:state.brushSize*.65+10,strength:state.brushStrength});c.updatedAt=Date.now();renderStage();$('#marksCount')&&($('#marksCount').textContent=c.marks.length);persist();
  }
  function variations(){
    const c=current(); if(c.source==='photo'){toast('Генерация вариантов по фото потребует подключения AI.');return;}
    const copies=Array.from({length:4},(_,i)=>{const p={...c.params};if(i===1){p.faceWidth=clamp(p.faceWidth+9,0,100);p.jaw=clamp(p.jaw+8,0,100)}if(i===2){p.faceWidth=clamp(p.faceWidth-10,0,100);p.eyes=clamp(p.eyes+9,0,100)}if(i===3){p.nose=clamp(p.nose+11,0,100);p.mouth=clamp(p.mouth+10,0,100)}return p;});
    modal(`<div class="modal-eyebrow">CHARACTER / EXPLORATION</div><h2>Четыре варианта основы</h2><p>Это локальные векторные вариации параметров лица, без вызова AI. Выберите лучший вариант для продолжения.</p><div class="variants-grid">${copies.map((p,i)=>`<button class="variant ${i===0?'active':''}" data-variant="${i}"><div class="variant-figure">${avatarSVG(p,[],'front','v'+i)}</div><small>Вариант ${String(i+1).padStart(2,'0')}</small></button>`).join('')}</div><div class="modal-actions"><button id="cancelVariants" class="secondary">Отмена</button><button id="chooseVariant">Выбрать вариант 01</button></div>`);
    let selected=0;$$('[data-variant]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.variant);$$('[data-variant]').forEach(x=>x.classList.toggle('active',x===b));$('#chooseVariant').textContent='Выбрать вариант 0'+(selected+1);});
    $('#cancelVariants').onclick=closeModal;$('#chooseVariant').onclick=()=>{current().params={...copies[selected]};current().updatedAt=Date.now();closeModal();renderAll();toast('Вариант сохранён в текущем персонаже.');};
  }
  async function lockIdentity(){
    const c=current();c.locked=!c.locked;c.identity=c.locked?structuredClone(c.params):null;
    if(c.locked){
      c.identityImage=c.aiImage||c.photo||null;c.hasIdentityImage=!!c.identityImage;
      if(c.identityImage)try{await storeAI('identity:'+c.id,c.identityImage);}catch{toast('Эталонное фото не удалось надёжно сохранить. Скачайте копию.');}
      toast(c.identityImage?'Лицо и эталонное фото зафиксированы.':'Параметры зафиксированы. Для фотоэталона сначала создайте AI-портрет.');
    }else{c.identityImage=null;c.hasIdentityImage=false;toast('Фиксация внешности снята.');}
    renderAll();
  }
  function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
  const filenameBase=c=>String(c.name||'persona').toLowerCase().normalize('NFKD').replace(/[^a-z0-9а-яё_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,45)||'persona';
  async function exportPNG(){
    const c=current(),w=1200,h=1440,can=document.createElement('canvas');can.width=w;can.height=h;const ctx=can.getContext('2d');
    if(c.params.background==='studio'){const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#b3a99b');g.addColorStop(1,'#77766f');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
    try{
      if(state.previewAI&&(state.previewPrevious?c.previousAIImage:c.aiImage)){const img=await loadImage(state.previewPrevious?c.previousAIImage:c.aiImage);const scale=Math.min(w/img.width,h/img.height);ctx.drawImage(img,(w-img.width*scale)/2,(h-img.height*scale)/2,img.width*scale,img.height*scale);}
      else if(c.source==='photo'&&c.photo){const photo=await loadImage(c.photo);const scale=Math.min(w/photo.width,h/photo.height);const ww=photo.width*scale,hh=photo.height*scale;ctx.drawImage(photo,(w-ww)/2,(h-hh)/2,ww,hh);}
      else{const svg=avatarSVG(c.params,[],state.view,'export').replace('class="avatar-svg"','');const img=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));ctx.drawImage(img,0,0,w,h);}
      if(c.marks.length&&!state.previewAI){const markDoc=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720">${marksSvg(c.marks)}</svg>`;const overlay=await loadImage('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markDoc));ctx.drawImage(overlay,0,0,w,h);}
      can.toBlob(blob=>{if(blob){downloadBlob(blob,filenameBase(c)+'-persona.png');toast('PNG экспортирован.')}else toast('Не удалось создать PNG.');},'image/png');
    }catch(e){toast('Ошибка экспорта изображения. Попробуйте ещё раз.');console.error(e)}
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});}
  function exportJSON(){const c=current();const passport={format:'persona-studio-character-v1',exportedAt:new Date().toISOString(),id:c.id,name:c.name,source:c.source,photoIncluded:false,locked:c.locked,identity:c.identity,params:c.params,marks:c.marks,wardrobe:c.wardrobe.map(w=>({name:w.name})),hasAIImage:c.hasAIImage,notes:'Изображения не включены в паспорт; сохраните фото отдельно.'};downloadBlob(new Blob([JSON.stringify(passport,null,2)],{type:'application/json;charset=utf-8'}),filenameBase(c)+'-passport.json');toast('Паспорт персонажа скачан.');}
  function removeCharacter(){if(state.characters.length===1){toast('Оставьте хотя бы одного персонажа.');return;}const c=current();modal(`<div class="modal-eyebrow">DELETE CHARACTER</div><h2>Удалить ${esc(c.name)}?</h2><p>Локальные параметры, фото и одежда этого персонажа будут удалены из библиотеки браузера.</p><div class="modal-actions"><button class="secondary" id="cancelDelete">Отмена</button><button id="confirmDelete">Удалить</button></div>`);$('#cancelDelete').onclick=closeModal;$('#confirmDelete').onclick=()=>{state.characters=state.characters.filter(ch=>ch.id!==c.id);closeModal();switchCharacter(state.characters[0].id);Promise.all([deleteAI(c.id),deleteAI('identity:'+c.id),deleteAI('previous:'+c.id)]);toast('Персонаж и сохранённые снимки удаляются с этого устройства.');};}
  function handleMainAction(){switch(state.section){case 'ai':generateAI();break;case 'skin':state.brushEnabled=!state.brushEnabled;renderAll();if(state.brushEnabled)toast('Коснитесь лица или фото, чтобы добавить деталь.');break;case 'wardrobe':$('#garmentFile').click();break;case 'pose':lockIdentity();break;case 'export':exportPNG();break;default:variations();}}
  document.addEventListener('click',e=>{
    const section=e.target.closest('[data-section]');if(section){activateSection(section.dataset.section);return;}
    const ch=e.target.closest('[data-character]');if(ch){switchCharacter(ch.dataset.character);return;}
    const chip=e.target.closest('[data-chip-key]');if(chip){current().params[chip.dataset.chipKey]=chip.dataset.chipValue;if(chip.dataset.chipKey==='pose'){if(current().source==='photo'&&chip.dataset.chipValue!=='front'){toast('Новые ракурсы фотографии требуют AI-генерации.');return;}state.view=chip.dataset.chipValue;}if(chip.dataset.chipKey==='teeth'){current().params.smile=Math.max(current().params.smile,60);current().params.expression='smile';}current().updatedAt=Date.now();renderAll();return;}
    const swatch=e.target.closest('[data-hair-color]');if(swatch){current().params.hairColor=swatch.dataset.hairColor;renderAll();return;}
    const brush=e.target.closest('[data-brush]');if(brush){state.brushType=brush.dataset.brush;renderInspector();return;}
    const rm=e.target.closest('[data-remove-garment]');if(rm){current().wardrobe.splice(+rm.dataset.removeGarment,1);renderAll();return;}
    const exp=e.target.closest('[data-export]');if(exp){exp.dataset.export==='png'?exportPNG():exportJSON();return;}
  });
  document.addEventListener('input',e=>{
    const t=e.target,c=current();if(t.matches('[data-param]')){state.previewAI=false;const key=t.dataset.param;c.params[key]=+t.value;c.updatedAt=Date.now();const value=$(`[data-value-for="${key}"]`);if(value)value.textContent=t.value+(key==='age'?' лет':key==='height'?' см':'%');renderStage();persist();}
    if(t.id==='charName'){c.name=t.value||'Без названия';$('#characterNameTop').textContent=c.name;renderSidebar();persist();}
    if(t.id==='originNote'){c.params.originNote=t.value;persist();}
    if(t.id==='aiAccessCode')state.aiCode=t.value;
    if(t.id==='aiInstruction')state.aiInstruction=t.value;
    if(t.matches('[data-brush-setting]')){state[t.dataset.brushSetting]=Number(t.value);const label=$('#'+t.dataset.brushSetting+'Value');if(label)label.textContent=t.value+'%';}
  });
  document.addEventListener('change',e=>{if(e.target.id==='originSelect'){current().params.origin=e.target.value;persist();}if(e.target.id==='aiMode')state.aiMode=e.target.value;if(e.target.id==='aiQuality')state.aiQuality=e.target.value;if(e.target.id==='aiSize')state.aiSize=e.target.value;if(e.target.id==='aiGarment')state.aiGarment=Number(e.target.value);});
  $('#newCharacter').onclick=openCreateModal;
  $('#uploadPhotoTop').onclick=()=>$('#photoFile').click();
  $('#saveButton').onclick=()=>{clearTimeout(savingTimer);if(saveNow())toast('Сохранено локально в этом браузере.');};
  $('#aboutButton').onclick=openAbout;
  $('#undoButton').onclick=()=>{if(current().marks.length){current().marks.pop();renderAll();toast('Последняя отметка удалена.')}else toast('Нечего отменять.');};
  $('#mainAction').onclick=handleMainAction;
  $('#stageZoomIn').onclick=()=>{state.zoom=clamp(state.zoom+10,60,170);renderStage();};
  $('#stageZoomOut').onclick=()=>{state.zoom=clamp(state.zoom-10,60,170);renderStage();};
  $('#stageReset').onclick=()=>{state.zoom=100;renderStage();};
  $('#viewSwitch').onclick=e=>{const b=e.target.closest('[data-view]');if(!b)return;if(current().source==='photo'&&b.dataset.view!=='front'){toast('Новые ракурсы фотографии появятся после подключения AI.');return;}state.view=b.dataset.view;current().params.pose=state.view;renderStage();if(state.section==='pose')renderInspector();};
  $('#avatarContainer').addEventListener('click',e=>{if(state.brushEnabled){setBrushMark(e.clientX,e.clientY);}});
  $('#inspectorContent').addEventListener('click',e=>{
    const id=e.target.closest('button')?.id;
    switch(id){case 'toggleBrush':state.brushEnabled=!state.brushEnabled;renderInspector();renderStage();if(state.brushEnabled)toast('Нажмите на лицо, чтобы нанести деталь.');break;
      case 'undoMark':current().marks.pop();renderAll();break;
      case 'clearMarks':current().marks=[];renderAll();break;
      case 'uploadGarment':$('#garmentFile').click();break;
      case 'lockIdentity':lockIdentity();break;
      case 'deleteCharacter':removeCharacter();break;
      case 'showAI':if(current().aiImage){state.previewAI=true;state.previewPrevious=false;renderStage();renderInspector();}else hydrateAI(current().id);break;
      case 'showPrevious':if(current().previousAIImage){state.previewAI=true;state.previewPrevious=true;renderStage();renderInspector();}else hydrateAI(current().id);break;
      case 'uploadHairReference':$('#hairReferenceFile').click();break;
      case 'showSketch':state.previewAI=false;state.previewPrevious=false;renderStage();renderInspector();break;
      case 'notReady':toast('Пока доступен только экспорт эскиза и параметров.');break;}
  });
  $('#photoFile').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const photo=await resizedImage(f);addCharacter(true,photo);state.section='skin';renderAll();}catch(err){toast(err.message||'Не удалось открыть фото.');}});
  $('#hairReferenceFile').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{state.hairReference=await resizedImage(f);renderInspector();toast('Референс причёски готов. Откройте раздел AI-генерация.');}catch(err){toast(err.message||'Не удалось открыть фотографию.');}});
  $('#garmentFile').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{const image=await resizedImage(f);const name=f.name.replace(/\.[^.]+$/,'');current().wardrobe.push({name,image});renderAll();toast('Фото одежды сохранено как референс.');}catch(err){toast(err.message||'Не удалось загрузить одежду.');}});
  document.addEventListener('keydown',e=>{const el=document.activeElement;const editing=el&&/INPUT|TEXTAREA|SELECT/.test(el.tagName);if(e.key.toLowerCase()==='n'&&!editing&&!$('#modalRoot').children.length){e.preventDefault();openCreateModal();}if(e.key==='Escape')closeModal();});
  async function checkAI(){
    try{const response=await fetch('/api/status',{signal:AbortSignal.timeout(4000)});const info=await response.json();state.aiReady=!!info.aiConfigured;state.aiProvider=info.provider||'openai';state.aiModel=info.model||'';}
    catch{state.aiReady=false;}
    if(state.section==='ai')renderInspector();
  }
  async function generateAI(){
    if(state.aiBusy)return;
    if(!state.aiReady){toast('AI пока не подключён. Для запуска настройте серверные ключи.');return;}
    if(!state.aiCode){toast('Введите код доступа к AI-генерации.');return;}
    const c=current();
    const clothing=c.wardrobe[state.aiGarment]?.image||null;
    const reference=state.aiMode==='create'?null:(c.locked?(c.identityImage||c.photo||c.aiImage):(c.aiImage||c.photo))||null;
    if(state.aiMode!=='create'&&!reference){toast('Для редактирования сначала загрузите фото или создайте персонажа в AI.');return;}
    if(state.aiMode==='outfit'&&!clothing){toast('Для примерки выберите фото одежды в настройках AI.');return;}
    state.aiBusy=true;renderInspector();
    try{
      const response=await fetch('/api/ai/generate',{
        method:'POST',headers:{'Content-Type':'application/json','x-persona-access-code':state.aiCode},
        body:JSON.stringify({params:c.params,marks:c.marks,mode:state.aiMode,referenceImage:reference,clothingImage:state.aiMode==='outfit'?clothing:null,hairImage:state.aiMode==='hair'?state.hairReference:null,instruction:state.aiInstruction,quality:state.aiQuality,size:state.aiSize}),
      });
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Не удалось сгенерировать изображение.');
      if(!result.image?.startsWith('data:image/'))throw new Error('Неправильный формат ответа AI.');
      if(c.aiImage){c.previousAIImage=c.aiImage;c.hasPreviousAIImage=true;try{await storeAI('previous:'+c.id,c.aiImage);}catch{toast('Не удалось сохранить предыдущий результат.');}}
      c.aiImage=result.image;c.hasAIImage=true;c.updatedAt=Date.now();state.previewAI=true;state.previewPrevious=false;
      try{await storeAI(c.id,c.aiImage);}catch{toast('Фото готово, но браузер не сохранил его между сеансами. Скачайте PNG.');}
      renderAll();toast('AI-изображение создано. При необходимости проверьте детали и внешность.');
    }catch(err){toast(err.message||'Ошибка подключения к AI');}
    finally{state.aiBusy=false;renderInspector();}
  }
  window.PERSONA_TEST={getState:()=>({characters:state.characters.map(c=>({name:c.name,source:c.source,marks:c.marks.length})),section:state.section,photo:!!current().photo,avatar:!!$('#avatarContainer svg')})};
  renderAll();
  checkAI();
  state.characters.filter(c=>c.hasAIImage||c.hasIdentityImage||c.hasPreviousAIImage).forEach(c=>hydrateAI(c.id));
})();
