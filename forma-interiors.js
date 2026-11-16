(() => {
'use strict';
const STORAGE='forma-archviz-interiors-v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const defaults=()=>({sceneType:'exterior',room:'living',style:'as-is',lighting:'soft-daylight',furniture:'preserve',surfaces:'',notes:'',lightSources:[]});
let saved={};try{saved=JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{}
function projectId(){try{const p=JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}');return String(p.activeId||p.projects?.[0]?.id||'demo')}catch{return 'demo'}}
function state(){return {...defaults(),...(saved[projectId()]||{})}}
function persist(next){saved[projectId()]={...state(),...next};try{localStorage.setItem(STORAGE,JSON.stringify(saved))}catch{message('Не удалось сохранить настройки интерьера')}}
function message(s){const e=$('#faInteriorStatus');if(e)e.textContent=s}
const LIGHT_PROFILES={
 downlight:{label:'Встроенный свет',cone:60,path:'M7 5h10v3H7z M8 11l-3 8m7-8v9m4-9 3 8'},
 spot:{label:'Акцентный спот',cone:25,path:'M9 3h6v5H9z M9 8l-4 11h14L15 8 M12 11v6'},
 'wall-wash':{label:'Заливка стены',cone:90,path:'M4 3v18 M8 6h6v4H8z M14 10l6 3m-6-1 6 7'},
 linear:{label:'Линейный свет',cone:110,path:'M3 6h18v3H3z M5 12v6m7-6v8m7-8v6'},
 pendant:{label:'Подвес',cone:70,path:'M12 2v6 M8 8h8l4 7H4z M8 18l-2 3m6-3v4m4-4 2 3'},
 floor:{label:'Торшер',cone:100,path:'M8 4h8l3 8H5z M12 12v9 M7 21h10 M4 15l-2 3m18-3 2 3'}
};
const PLACEMENTS={ceiling:'Центр потолка',left:'Слева в кадре',right:'Справа в кадре',back:'У дальней стены',foreground:'На переднем плане',window:'У окна',custom:'На изображении'};
const LIGHT_POSITIONS={ceiling:[50,20,50,65],left:[22,40,48,70],right:[78,40,52,70],back:[50,40,50,80],foreground:[50,67,50,92],window:[18,37,43,68]};
const safeNumber=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function normalizeLights(sources){return (Array.isArray(sources)?sources:[]).slice(0,8).filter(x=>x&&Object.hasOwn(LIGHT_PROFILES,x.profile)).map((source,i)=>{const placement=Object.hasOwn(PLACEMENTS,source.placement)?source.placement:'ceiling';const preset=LIGHT_POSITIONS[placement]||LIGHT_POSITIONS.ceiling;return {id:String(source.id||'light-'+i).replace(/[^a-z0-9-]/gi,'').slice(0,60),profile:source.profile,label:LIGHT_PROFILES[source.profile].label,intensity:safeNumber(source.intensity,0,200,80),temperature:safeNumber(source.temperature,2200,6500,3000),cone:safeNumber(source.cone,10,120,LIGHT_PROFILES[source.profile].cone),placement,mode:source.mode==='fixture'?'fixture':'effect',x:safeNumber(source.x,2,98,preset[0]),y:safeNumber(source.y,2,98,preset[1]),targetX:safeNumber(source.targetX,2,98,preset[2]),targetY:safeNumber(source.targetY,2,98,preset[3])}})}
function lightingBrief(sources){return {version:2,interpretation:'ai-lighting-direction-camera-relative',sources:normalizeLights(sources)}}
function notifyLights(){document.dispatchEvent(new CustomEvent('forma:interior-lights-changed',{detail:{sources:normalizeLights(state().lightSources)}}))}
function setLights(sources,{refresh=true}={}){persist({lightSources:normalizeLights(sources)});if(refresh)renderLights();notifyLights()}
function icon(profile){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${LIGHT_PROFILES[profile].path}"/></svg>`}
function renderLights(){
 const list=$('#faInteriorSources');if(!list)return;const lights=normalizeLights(state().lightSources);
 list.innerHTML=lights.length?lights.map((x,i)=>`<fieldset class="fa-light-source" data-light-index="${i}"><legend>${icon(x.profile)}<span>${x.label} ${i+1}</span></legend><button type="button" data-light-remove="${i}" aria-label="Удалить источник ${i+1}" class="fa-light-remove">Удалить</button><div class="fa-light-mode" role="group" aria-label="Отображение светильника"><button type="button" data-light-mode="effect" aria-pressed="${x.mode==='effect'}" class="${x.mode==='effect'?'active':''}">Свет без светильника</button><button type="button" data-light-mode="fixture" aria-pressed="${x.mode==='fixture'}" class="${x.mode==='fixture'?'active':''}">Видимый светильник</button></div><button type="button" class="fa-light-on-image" data-light-focus="${i}">◎ Указать на фотографии</button><div class="fa-light-controls"><label>Интенсивность <output>${x.intensity}%</output><input type="range" data-light-field="intensity" min="0" max="200" step="5" value="${x.intensity}"></label><label>Температура <output>${x.temperature} K</output><input type="range" data-light-field="temperature" min="2200" max="6500" step="100" value="${x.temperature}"></label><label>Угол пучка <output>${x.cone}°</output><input type="range" data-light-field="cone" min="10" max="120" step="5" value="${x.cone}"></label><label>Расположение<select data-light-field="placement">${Object.entries(PLACEMENTS).map(([key,label])=>`<option value="${key}"${x.placement===key?' selected':''}>${label}</option>`).join('')}</select></label></div></fieldset>`).join(''):'<p class="fa-light-empty">Источники пока не добавлены. Сохраняем светильники исходного кадра; выберите профиль, чтобы задать дополнительный свет.</p>';
 $('#faInteriorLightCount').textContent=`${lights.length} / 8 источников`;
 $$('[data-light-add]').forEach(b=>b.disabled=lights.length>=8);
}
function openLighting(){if(state().sceneType!=='interior')persist({sceneType:'interior'});populate();const editor=$('#faInteriorLightEditor');if(!editor)return;editor.hidden=false;$('#faInteriorLightStudio')?.setAttribute('aria-expanded','true');editor.scrollIntoView?.({behavior:'smooth',block:'nearest'});$('[data-light-add]',editor)?.focus({preventScroll:true});document.dispatchEvent(new Event('forma:interior-lighting-opened'))}
function briefForProject(id){const x={...defaults(),...(saved[id]||{})};if(x.sceneType!=='interior')return {sceneType:'exterior'};return {sceneType:'interior',homeChanges:'',environment:null,environmentInstructions:null,environmentSubtype:null,environmentSubtypeInstructions:null,plants:null,season:null,weather:null,time:null,room:x.room,style:x.style,lighting:x.lighting,interiorLights:lightingBrief(x.lightSources),furniture:x.furniture,surfaces:x.surfaces.trim().slice(0,500),notes:x.notes.trim().slice(0,800)}}
function view(){
 const select=(id,label,arr)=>`<label${id==='faInteriorRoom'?' class="full"':''}>${label}<select id="${id}"${id==='faInteriorRoom'?' aria-describedby="faInteriorRoomHelp"':''}>${arr.map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label>`;
 return `<div class="fa-space-switch" role="group" aria-label="Тип архитектурной визуализации"><button type="button" data-fa-space="exterior">Экстерьер <small>Дом и участок</small></button><button type="button" data-fa-space="interior">Интерьер <small>из скетча в фото</small></button></div>
 <section class="fa-interior-panel" id="faInteriorPanel" hidden aria-label="Настройки интерьерной визуализации">
 <div class="fa-interior-intro"><span>ФОРМА / ИНТЕРЬЕРЫ</span><h3>Из скетча — в интерьерную фотографию.</h3><p>Исходная модель определяет геометрию, ракурс и расстановку. Вы управляете стилем, освещением и материалами.</p></div>
 <div class="fa-interior-fields">
 ${select('faInteriorRoom','Тип помещения',[['living','Гостиная'],['kitchen','Кухня'],['bedroom','Спальня'],['bathroom','Ванная'],['office','Кабинет'],['hall','Холл'],['dining','Столовая'],['commercial','Коммерческий интерьер']])}
 <p id="faInteriorRoomHelp" class="fa-room-help full">Тип помещения задаёт назначение и характер декора. Выбор «Спальня» сам по себе не перестраивает комнату и не добавляет кровать: стены, проёмы, ракурс и расстановка сохраняются по исходнику.</p>
 ${select('faInteriorStyle','Дизайн и отделка',[['as-is','Строго как на исходнике'],['warm-modern','Тёплый современный'],['japandi','Джапанди'],['minimal','Архитектурный минимализм'],['scandinavian','Скандинавский'],['contemporary','Современный премиум'],['classic','Современная классика'],['loft','Лофт']])}
 ${select('faInteriorLighting','Свет в помещении',[['soft-daylight','Мягкий дневной свет'],['sunny','Яркий солнечный день'],['overcast','Пасмурный рассеянный свет'],['evening','Вечер, включённые светильники'],['studio','Редакционная интерьерная съёмка']])}
 ${select('faInteriorFurniture','Мебель и предметы',[['preserve','Сохранить строго по скетчу'],['complete','Добавить мебель, если комната пуста'],['no-additions','Не добавлять ничего']])}
 <label class="full">Отделка и материалы<textarea id="faInteriorSurfaces" maxlength="500" rows="3" placeholder="Например: стены — тёплая белая штукатурка, пол — дуб, кухня — орех. Пусто = сохранить скетч."></textarea></label>
 <label class="full">Точные пожелания<textarea id="faInteriorNotes" maxlength="800" rows="3" placeholder="Например: не менять количество стульев, размеры окон и положение светильников."></textarea></label></div>
 <section class="fa-interior-light-studio"><div><span>LIGHT STUDIO / ИНТЕРЬЕР</span><h4>Источники света</h4><p>Добавьте светильники и настройте их световой рисунок: яркость, температуру, угол и расположение в кадре.</p></div><button type="button" id="faInteriorLightStudio" aria-expanded="false" aria-controls="faInteriorLightEditor">${icon('spot')} Настроить свет <span aria-hidden="true">↗</span></button></section>
 <section id="faInteriorLightEditor" class="fa-interior-light-editor" aria-label="Редактор интерьерных источников" hidden><div class="fa-light-heading"><h4>Добавить источник</h4><span id="faInteriorLightCount">0 / 8 источников</span></div><div class="fa-light-catalog">${Object.entries(LIGHT_PROFILES).map(([key,p])=>`<button type="button" data-light-add="${key}">${icon(key)}<span>${p.label}</span><small>${p.cone}°</small></button>`).join('')}</div><p class="fa-light-note">Перемещайте маркеры света прямо на фотографии. Внутренний круг — положение источника, внешний — направление луча. Предпросмотр приблизительный, итоговый свет рассчитывает AI.</p><div id="faInteriorSources"></div><p class="fa-light-apply">Настройки сохранены в проекте и применятся при следующей генерации интерьера.</p></section>
 <div class="fa-interior-lock"><span>⌗</span><div><b>Фиксация планировки и ракурса</b><small>Стены, проёмы, высота, мебель и конструктив сохраняются по исходному скетчу. AI может ошибаться — проверяйте изображение.</small></div></div>
 <button type="button" id="faInteriorGenerate" class="fa-interior-submit">Создать фотографию интерьера <span>↗</span></button>
 <p id="faInteriorStatus" role="status">Загрузите скриншот помещения и запустите генерацию через текущий API.</p>
 </section>`;
}
function populate(){
 const x=state();renderLights();document.body.classList.toggle('forma-interior-mode',x.sceneType==='interior');
 $$('[data-fa-space]').forEach(b=>{const yes=b.dataset.faSpace===x.sceneType;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
 $('#faInteriorPanel').hidden=x.sceneType!=='interior';
 const fields={faInteriorRoom:'room',faInteriorStyle:'style',faInteriorLighting:'lighting',faInteriorFurniture:'furniture',faInteriorSurfaces:'surfaces',faInteriorNotes:'notes'};
 for(const [selector,key] of Object.entries(fields)){const el=$('#'+selector);if(el)el.value=x[key]}
 const up=$('#uploadSubtitle');if(up)up.textContent=x.sceneType==='interior'?'PNG, JPG, WEBP · интерьер из Revit, SketchUp или Archicad':'PNG, JPG, WEBP · Archicad, SketchUp, Revit и другие';
 const src=$('#uploadTitle');if(src && (src.textContent.includes('скриншот')||src.textContent.includes('помещения')))src.textContent=x.sceneType==='interior'?'Загрузить скриншот помещения':'Загрузить скриншот проекта';
}
function open(){document.querySelector('[data-nav="environment"]')?.click();persist({sceneType:'interior'});populate();document.dispatchEvent(new CustomEvent('forma:interior-mode-changed'));$('#faInteriorRoom')?.focus({preventScroll:true})}
function init(){
 const panel=$('#environmentPanel');if(!panel||$('#faInteriorPanel'))return;
 const wrap=document.createElement('div');wrap.id='faSpaceSelector';wrap.innerHTML=view();
 const after=$('.scene-setup-header',panel);if(after)after.insertAdjacentElement('afterend',wrap);else panel.prepend(wrap);
 $$('[data-fa-space]').forEach(b=>b.addEventListener('click',()=>{persist({sceneType:b.dataset.faSpace});populate();document.dispatchEvent(new CustomEvent('forma:interior-mode-changed'));message(b.dataset.faSpace==='interior'?'Режим интерьеров включён.':'Режим экстерьеров включён.')}));
 const fields={faInteriorRoom:'room',faInteriorStyle:'style',faInteriorLighting:'lighting',faInteriorFurniture:'furniture',faInteriorSurfaces:'surfaces',faInteriorNotes:'notes'};
 for(const [id,key] of Object.entries(fields))$('#'+id)?.addEventListener('input',e=>persist({[key]:e.target.value}));
 $('#faInteriorLightStudio')?.addEventListener('click',openLighting);
 $('#faInteriorLightEditor')?.addEventListener('click',event=>{
  const add=event.target.closest('[data-light-add]'),remove=event.target.closest('[data-light-remove]'),mode=event.target.closest('[data-light-mode]'),focus=event.target.closest('[data-light-focus]');
  const sources=normalizeLights(state().lightSources);
  if(add&&sources.length<8){const profile=add.dataset.lightAdd;sources.push({id:'light-'+Date.now()+'-'+sources.length,profile,intensity:80,temperature:3000,cone:LIGHT_PROFILES[profile].cone,placement:profile==='floor'?'left':'ceiling',mode:['pendant','floor'].includes(profile)?'fixture':'effect'});setLights(sources);document.dispatchEvent(new CustomEvent('forma:interior-light-selected',{detail:{index:sources.length-1,scroll:true}}));message('Источник добавлен. Перетаскивайте свет и направление на фотографии.');}
  if(remove){sources.splice(Number(remove.dataset.lightRemove),1);setLights(sources);message('Источник удалён.');}
  if(mode){const index=Number(mode.closest('[data-light-index]')?.dataset.lightIndex);if(!sources[index])return;sources[index].mode=mode.dataset.lightMode;setLights(sources)}
  if(focus){document.dispatchEvent(new CustomEvent('forma:interior-light-selected',{detail:{index:Number(focus.dataset.lightFocus),scroll:true}}));}
 });
 $('#faInteriorSources')?.addEventListener('input',event=>{
  const field=event.target.dataset.lightField;if(!field)return;
  const row=event.target.closest('[data-light-index]'),sources=normalizeLights(state().lightSources),index=Number(row.dataset.lightIndex);
  if(!sources[index])return;sources[index][field]=field==='placement'?event.target.value:Number(event.target.value);
  if(field==='placement'&&LIGHT_POSITIONS[event.target.value]){const p=LIGHT_POSITIONS[event.target.value];[sources[index].x,sources[index].y,sources[index].targetX,sources[index].targetY]=p;}
  setLights(sources,{refresh:field==='placement'});
  const out=event.target.parentElement.querySelector('output');if(out)out.textContent=event.target.value+({intensity:'%',temperature:' K',cone:'°'}[field]||'');
 });
 $('#faInteriorGenerate')?.addEventListener('click',()=>{
  if(state().sceneType!=='interior')return;
  const b=$('#generateBtn');if(!b){message('Не найден основной инструмент генерации');return}
  if(b.disabled){message('Генерация сейчас недоступна. Проверьте API или активное задание.');return}
  message('Запускаем AI-движок с настройками интерьера…');b.click();
 });
 const nav=$('.rail-nav');
 if(nav){const b=document.createElement('button');b.type='button';b.className='rail-btn fa-interior-nav';b.innerHTML='<svg class="ico"><use href="#i-image"/></svg><span class="rail-name">Интерьеры</span>';b.title='Интерьеры · из скетча в фото';b.setAttribute('aria-label',b.title);b.addEventListener('click',open);const anchor=nav.querySelector('[data-nav="materials"]');if(anchor)nav.insertBefore(b,anchor);else nav.append(b);}
 const mobile=$('.mobile-nav');
 if(mobile){const b=document.createElement('button');b.type='button';b.className='fa-interior-mobile';b.innerHTML='<svg class="ico"><use href="#i-image"/></svg><span>Интерьер</span>';b.addEventListener('click',open);mobile.append(b);}
 const breadcrumb=$('#breadcrumbName');
 if(breadcrumb)new MutationObserver(()=>populate()).observe(breadcrumb,{childList:true,characterData:true,subtree:true});
 populate();window.addEventListener('forma:open-interior',open);
}
window.FORMA_INTERIORS={briefForProject,open,state,openLighting,lightProfiles:LIGHT_PROFILES,normalizeLights,setLights,setScene(value){persist({sceneType:value==='interior'?'interior':'exterior'});populate();document.dispatchEvent(new CustomEvent('forma:interior-mode-changed'));}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();