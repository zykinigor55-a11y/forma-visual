(() => {
'use strict';
const STORAGE='forma-archviz-interiors-v1';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const defaults=()=>({sceneType:'exterior',room:'living',style:'as-is',lighting:'soft-daylight',furniture:'preserve',surfaces:'',notes:''});
let saved={};try{saved=JSON.parse(localStorage.getItem(STORAGE)||'{}')}catch{}
function projectId(){try{const p=JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}');return String(p.activeId||p.projects?.[0]?.id||'demo')}catch{return 'demo'}}
function state(){return {...defaults(),...(saved[projectId()]||{})}}
function persist(next){saved[projectId()]={...state(),...next};try{localStorage.setItem(STORAGE,JSON.stringify(saved))}catch{message('Не удалось сохранить настройки интерьера')}}
function message(s){const e=$('#faInteriorStatus');if(e)e.textContent=s}
function briefForProject(id){const x={...defaults(),...(saved[id]||{})};if(x.sceneType!=='interior')return {sceneType:'exterior'};return {sceneType:'interior',room:x.room,style:x.style,lighting:x.lighting,furniture:x.furniture,surfaces:x.surfaces.trim().slice(0,500),notes:x.notes.trim().slice(0,800)}}
function view(){
 const select=(id,label,arr)=>`<label>${label}<select id="${id}">${arr.map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label>`;
 return `<div class="fa-space-switch" role="group" aria-label="Тип архитектурной визуализации"><button type="button" data-fa-space="exterior">Экстерьер <small>Дом и участок</small></button><button type="button" data-fa-space="interior">Интерьер <small>Sketch → Photo</small></button></div>
 <section class="fa-interior-panel" id="faInteriorPanel" hidden aria-label="Настройки интерьерной визуализации">
 <div class="fa-interior-intro"><span>FORMA / INTERIOR PHOTO STUDIO</span><h3>Из скетча — в интерьерную фотографию.</h3><p>Исходная модель определяет геометрию, ракурс и расстановку. Вы управляете стилем, освещением и материалами.</p></div>
 <div class="fa-interior-fields">
 ${select('faInteriorRoom','Тип помещения',[['living','Гостиная'],['kitchen','Кухня'],['bedroom','Спальня'],['bathroom','Ванная'],['office','Кабинет'],['hall','Холл'],['dining','Столовая'],['commercial','Коммерческий интерьер']])}
 ${select('faInteriorStyle','Дизайн и отделка',[['as-is','Строго как на исходнике'],['warm-modern','Тёплый современный'],['japandi','Japandi'],['minimal','Архитектурный минимализм'],['scandinavian','Скандинавский'],['contemporary','Современный премиум'],['classic','Современная классика'],['loft','Лофт']])}
 ${select('faInteriorLighting','Свет в помещении',[['soft-daylight','Мягкий дневной свет'],['sunny','Яркий солнечный день'],['overcast','Пасмурный рассеянный свет'],['evening','Вечер, включённые светильники'],['studio','Редакционная интерьерная съёмка']])}
 ${select('faInteriorFurniture','Мебель и предметы',[['preserve','Сохранить строго по скетчу'],['complete','Добавить мебель, если комната пуста'],['no-additions','Не добавлять ничего']])}
 <label class="full">Отделка и материалы<textarea id="faInteriorSurfaces" maxlength="500" rows="3" placeholder="Например: стены — тёплая белая штукатурка, пол — дуб, кухня — орех. Пусто = сохранить скетч."></textarea></label>
 <label class="full">Точные пожелания<textarea id="faInteriorNotes" maxlength="800" rows="3" placeholder="Например: не менять количество стульев, размеры окон и положение светильников."></textarea></label></div>
 <div class="fa-interior-lock"><span>⌗</span><div><b>Фиксация планировки и ракурса</b><small>Стены, проёмы, высота, мебель и конструктив сохраняются по исходному скетчу. AI может ошибаться — проверяйте изображение.</small></div></div>
 <button type="button" id="faInteriorGenerate" class="fa-interior-submit">Создать фотографию интерьера <span>↗</span></button>
 <p id="faInteriorStatus" role="status">Загрузите скриншот помещения и запустите генерацию через текущий API.</p>
 </section>`;
}
function populate(){
 const x=state();document.body.classList.toggle('forma-interior-mode',x.sceneType==='interior');
 $$('[data-fa-space]').forEach(b=>{const yes=b.dataset.faSpace===x.sceneType;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
 $('#faInteriorPanel').hidden=x.sceneType!=='interior';
 const fields={faInteriorRoom:'room',faInteriorStyle:'style',faInteriorLighting:'lighting',faInteriorFurniture:'furniture',faInteriorSurfaces:'surfaces',faInteriorNotes:'notes'};
 for(const [selector,key] of Object.entries(fields)){const el=$('#'+selector);if(el)el.value=x[key]}
 const up=$('#uploadSubtitle');if(up)up.textContent=x.sceneType==='interior'?'PNG, JPG, WEBP · интерьер из Revit, SketchUp или Archicad':'PNG, JPG, WEBP · Archicad, SketchUp, Revit и другие';
 const src=$('#uploadTitle');if(src && (src.textContent.includes('скриншот')||src.textContent.includes('помещения')))src.textContent=x.sceneType==='interior'?'Загрузить скриншот помещения':'Загрузить скриншот проекта';
}
function open(){document.querySelector('[data-nav="environment"]')?.click();persist({sceneType:'interior'});populate();$('#faInteriorRoom')?.focus({preventScroll:true})}
function init(){
 const panel=$('#environmentPanel');if(!panel||$('#faInteriorPanel'))return;
 const wrap=document.createElement('div');wrap.id='faSpaceSelector';wrap.innerHTML=view();
 const after=$('.scene-setup-header',panel);if(after)after.insertAdjacentElement('afterend',wrap);else panel.prepend(wrap);
 $$('[data-fa-space]').forEach(b=>b.addEventListener('click',()=>{persist({sceneType:b.dataset.faSpace});populate();message(b.dataset.faSpace==='interior'?'Режим интерьеров включён.':'Режим экстерьеров включён.')}));
 const fields={faInteriorRoom:'room',faInteriorStyle:'style',faInteriorLighting:'lighting',faInteriorFurniture:'furniture',faInteriorSurfaces:'surfaces',faInteriorNotes:'notes'};
 for(const [id,key] of Object.entries(fields))$('#'+id)?.addEventListener('input',e=>persist({[key]:e.target.value}));
 $('#faInteriorGenerate')?.addEventListener('click',()=>{
  if(state().sceneType!=='interior')return;
  const b=$('#generateBtn');if(!b){message('Не найден основной инструмент генерации');return}
  if(b.disabled){message('Генерация сейчас недоступна. Проверьте API или активное задание.');return}
  message('Запускаем AI-движок с настройками интерьера…');b.click();
 });
 const nav=$('.rail-nav');
 if(nav){const b=document.createElement('button');b.type='button';b.className='rail-btn fa-interior-nav';b.innerHTML='<svg class="ico"><use href="#i-image"/></svg><span class="rail-name">Интерьеры</span>';b.title='Интерьеры · Sketch → Photo';b.setAttribute('aria-label',b.title);b.addEventListener('click',open);const anchor=nav.querySelector('[data-nav="materials"]');if(anchor)nav.insertBefore(b,anchor);else nav.append(b);}
 const mobile=$('.mobile-nav');
 if(mobile){const b=document.createElement('button');b.type='button';b.className='fa-interior-mobile';b.innerHTML='<svg class="ico"><use href="#i-image"/></svg><span>Интерьер</span>';b.addEventListener('click',open);mobile.append(b);}
 const breadcrumb=$('#breadcrumbName');
 if(breadcrumb)new MutationObserver(()=>populate()).observe(breadcrumb,{childList:true,characterData:true,subtree:true});
 populate();window.addEventListener('forma:open-interior',open);
}
window.FORMA_INTERIORS={briefForProject,open,state};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();