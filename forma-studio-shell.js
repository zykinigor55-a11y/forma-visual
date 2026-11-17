/* A single active workspace; existing controls are moved, never duplicated. */
const $=(s,r=document)=>r.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const paths={landscapeProjectIcon:'M3 3h18v18H3z M7 16l3-6 4 3 3-7 M5 19h14',render:'M3 11 12 4l9 7v10H3Z M9 21v-7h6v7',interior:'M3 21V3h18v18 M3 10h18 M8 21v-7h8v7',materials:'m12 3 9 5-9 5-9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5',landscape:'M3 21h18 M7 21v-7 M7 3C0 8 1 15 7 15S14 8 7 3 M17 21V10 M17 3l-5 10h10Z',landscapeProject:'M3 3h18v18H3z M7 16l3-6 4 3 3-7 M5 19h14 M12 3v18',atmosphere:'M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',animation:'M3 5h14v14H3Z m14 5 4-3v10l-4-3',frames:'M3 3h18v18H3Z M7 7h10v10H7Z M3 12h4 M17 12h4',enhance:'M12 2l2.1 6.8L21 11l-6.9 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2Z M19 17l1 2.2L22 20l-2 .8-1 2.2-.8-2.2L16 20l2.2-.8L19 17Z',world:'M12 2l9 5v10l-9 5-9-5V7l9-5Z M3 7l9 5 9-5 M12 12v10',plan:'M3 3h18v18H3Z M12 3v10h9 M3 13h5 M12 17v4',nodes:'M2 3h6v6H2Z M16 15h6v6h-6Z M2 15h6v6H2Z M8 6h4v12h4 M8 18h8',project:'M3 6h7l2 3h9v12H3Z',settings:'M4 5h16 M4 12h16 M4 19h16 M8 2v6 M16 9v6 M10 16v6'};
export const studioIcon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id==='landscape-project'?'landscapeProject':id]||paths.project}"/>${id==='atmosphere'?'<circle cx="12" cy="12" r="4"/>':''}</svg>`;
const tasks=[['render','Экстерьеры','Скриншот → фотография'],['interior','Интерьеры','Свет, отделка и пространство'],['materials','Материалы','Цвет и фактура поверхности'],['landscape','Благоустройство','Растения, дорожки и свет на готовом рендере'],['landscape-project','Ландшафтный проект','Генплан участка · точный вид сверху'],['atmosphere','Атмосфера','Цвет и характер фотографии'],['animation','Анимация','Камера, движение и цвет'],['plan','План → интерьер','Объёмная подача и комнаты'],['frames','Кадры и детали','Приближения и серии проекта']];
let workspace=null,moves=[],active=null,bypass=false,origin=null;const confirmedSources=new Set();
const bindingKey=snap=>snap?`${active}:${snap.projectId}:${snap.sourceKey}`:'';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function move(el,to){if(!el)return;const marker=document.createComment('studio-workspace');el.before(marker);moves.push([el,marker]);to.append(el);}
function nativeClick(selector){const b=$(selector);if(!b)return;bypass=true;try{b.click();}finally{bypass=false;}}
export function closeWorkspace(){
 if(window.FORMA_ART_BRIDGE?.snapshot()?.busy){window.FORMA_ART_BRIDGE.notify('Дождитесь завершения обработки кадра.');return false;}
 if(!workspace)return true;
 window.FORMA_SUN_STUDIO?.close();
 document.dispatchEvent(new CustomEvent('forma:workspace-close',{detail:{id:active}}));
 for(const [el,marker] of moves.reverse()){if(el.id==='dialogCover')el.hidden=true;if(el.classList?.contains('viewer-card'))el.classList.remove('studio-hide-viewer');marker.replaceWith(el);}moves=[];
 const progress=$('#renderProgress');if(progress&&workspace.contains(progress))document.body.append(progress);workspace.close();workspace.remove();workspace=null;active=null;document.body.classList.remove('fa-studio-tool-open');
 document.body.classList.remove('forma-interior-mode');$$('.rail-nav .active,.mobile-nav .active').forEach(e=>e.classList.remove('active'));origin?.focus({preventScroll:true});refreshHome();return true;
}
function refreshSource(){if(!workspace)return;const snap=window.FORMA_ART_BRIDGE?.snapshot(),available=!!snap?.hasSource&&!snap.demo,isCustom=['frames','plan'].includes(active);const need=!isCustom&&(!available||!confirmedSources.has(bindingKey(snap)));workspace.classList.toggle('needs-source',need);const sun=$('[data-studio-sun]',workspace);if(sun)sun.disabled=!available;const existing=$('[data-studio-existing]');if(existing)existing.disabled=!available;const tag=$('#studioSourceState');if(tag)tag.textContent=available?snap.projectName||'Изображение проекта':'Загрузите изображение для начала работы';}

function mountDialog(id,title){
 workspace=document.createElement('dialog');workspace.id='formaStudioWorkspace';workspace.className='fa-studio-workspace';workspace.dataset.tool=id;
 workspace.setAttribute('aria-labelledby','studioWorkspaceTitle');workspace.innerHTML=`<header class="fa-studio-work-head"><div class="fa-studio-work-brand">${studioIcon(id)}<div><small>ФОРМА / СТУДИЯ</small><h1 id="studioWorkspaceTitle">${escape(title)}</h1></div></div><div>${id==='render'?`<button type="button" data-studio-sun>${studioIcon('atmosphere')} Положение солнца</button>`:''}<button type="button" data-studio-gallery>Галерея</button><button type="button" data-studio-upload>Загрузить изображение</button><button type="button" data-studio-exit aria-label="Вернуться в студию">×</button></div></header><div class="fa-studio-source-state" id="studioSourceState"></div><div class="fa-studio-source-gate"><span>${studioIcon('project')}</span><h2>С чего начнём?</h2><p>Загрузите фотографию, рендер или скриншот модели.</p><button type="button" class="fa-studio-primary" data-studio-upload>Выбрать изображение</button><button type="button" data-studio-existing>Использовать текущий кадр</button></div><div class="fa-studio-work-body"><section class="fa-studio-view" id="studioView"></section><section class="fa-studio-controls" id="studioControls"></section></div><footer class="fa-studio-work-footer"><span>Исходник и результаты сохраняются в проекте</span><button type="button" data-studio-exit>Вернуться в студию</button></footer>`;
 document.body.append(workspace);workspace.addEventListener('cancel',e=>{e.preventDefault();const cover=$('#dialogCover');if(cover&&!cover.hidden){cover.hidden=true;return;}closeWorkspace();});
 workspace.addEventListener('click',e=>{if(e.target.closest('[data-studio-sun]')){window.FORMA_INTERIORS?.setScene?.('exterior');const sun=$('#formaSunStudio');if(sun&&!workspace.contains(sun))move(sun,workspace);window.FORMA_SUN_STUDIO?.open();return;}if(e.target.closest('[data-studio-exit]'))closeWorkspace();if(e.target.closest('[data-studio-upload]')){const own=['frames','plan'].includes(active)?workspace.querySelector('#fsSource'):null;if(own)own.click();else{const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;workspace.append(input);input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{await window.FORMA_ART_BRIDGE.uploadFile(file);const snap=window.FORMA_ART_BRIDGE.snapshot();confirmedSources.add(bindingKey(snap));refreshSource();}catch(error){window.FORMA_ART_BRIDGE.notify(error.message);}finally{input.remove();}},{once:true});input.click();}}if(e.target.closest('[data-studio-existing]')){const snap=window.FORMA_ART_BRIDGE.snapshot();if(snap.hasSource&&!snap.demo){confirmedSources.add(bindingKey(snap));refreshSource();}}});
 move($('#dialogCover'),workspace);move($('#toast'),workspace);workspace.showModal();document.body.classList.add('fa-studio-tool-open');refreshSource();
}
export async function openWorkspace(id){
 if(bypass)return;if(workspace&&active===id)return;if(!closeWorkspace())return;
 origin=document.activeElement;active=id;
 if(id==='enhance'){
  active=null;
  const opened=window.FORMA_RESULT_FOCUS?.openForEnhancement?.();
  if(!opened)window.FORMA_ART_BRIDGE?.notify?.('Для улучшения сначала создайте или выберите готовый рендер проекта.');
  return;
 }
 if(id==='world'){active=null;window.location.assign('forma-world.html');return;}
 if(id==='landscape-project'){
  active=null;
  // The category must open the top-down masterplan, not scenario-flow.
  try{
   if(!window.FORMA_LANDSCAPE_PROJECT?.open)await import('./forma-landscape-project.js?v=pond-brush-zoom-photo-v3-20261117');
   if(!window.FORMA_LANDSCAPE_PROJECT?.open)throw Error('Модуль генплана не загрузился');
   await window.FORMA_LANDSCAPE_PROJECT.open();
  }catch(error){window.FORMA_ART_BRIDGE?.notify?.('Не удалось открыть «Ландшафтный проект»: '+error.message);}
  return;
 }
 if(id==='landscape'||id==='atmosphere'){active=null;window.FORMA_ART_DIRECTION?.[id==='landscape'?'openLandscape':'openAtmosphere']();return;}
 if(id==='nodes'){active=null;window.FORMA_NODES?.open();return;}
 const task=tasks.find(t=>t[0]===id);mountDialog(id,task?.[1]||({project:'Проект',settings:'Настройки'}[id]||id));
 const isCustom=['frames','plan'].includes(id);
 if(isCustom){workspace.classList.remove('needs-source');document.dispatchEvent(new CustomEvent('forma:workspace-open',{detail:{id,view:$('#studioView'),controls:$('#studioControls')}}));return;}
 if(id==='interior'){bypass=true;window.FORMA_INTERIORS?.open();bypass=false;}else{
  if(id==='render')window.FORMA_INTERIORS?.setScene?.('exterior');
  nativeClick(`[data-nav="${{render:'environment',settings:'parameters'}[id]||id}"]`);
 }
 move($('.viewer-card'),$('#studioView'));
 if(id==='project')workspace.classList.remove('needs-source');
 const panel=$('#'+({render:'environment',interior:'environment',settings:'parameters'}[id]||id)+'Panel');move(panel,$('#studioControls'));
 if(panel){panel.classList.add('active');panel.hidden=false;}
 if(id==='render'||id==='interior'||id==='materials')move($('.inspector-footer'),$('#studioControls'));
 if(id==='animation'){
  const section=$('.anim-preview-shell',panel);if(section)move(section,$('#studioView'));
  $('.viewer-card',workspace)?.classList.add('studio-hide-viewer');nativeClick('[data-anim-source="project"]');
  if(window.FORMA_CINEMA_UI)window.FORMA_CINEMA_UI.enhance();
 }
 document.dispatchEvent(new CustomEvent('forma:workspace-open',{detail:{id,view:$('#studioView'),controls:$('#studioControls')}}));
}
function refreshHome(){
 const host=$('#studioRecent');if(!host)return;let data={};try{data=JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}')}catch{}
 const projects=(data.projects||[]).filter(p=>!p.demo).slice(0,6);
 host.innerHTML=projects.length?projects.map(p=>`<button type="button" class="fa-studio-recent" data-studio-project="${escape(p.id)}"><span>${studioIcon('project')}</span><b>${escape(p.name||'Проект')}</b><small>${(p.renders||[]).length} кадров</small><i>↗</i></button>`).join(''):'<div class="fa-studio-empty"><span>Ваш первый проект</span><p>Загрузите скриншот модели или готовый рендер. Все дальнейшие кадры останутся вместе.</p><button type="button" data-studio-new>Создать проект</button></div>';
 for(const p of projects)window.FORMA_ART_BRIDGE?.projectPreview?.(p.id).then(src=>{if(!src)return;const card=host.querySelector('[data-studio-project="'+CSS.escape(p.id)+'"]');if(!card)return;const image=document.createElement('img');image.src=src;image.alt='';card.querySelector('span')?.replaceWith(image);}).catch(()=>{});
}
function init(){
 document.body.classList.add('fa-unified-studio');
 const home=document.createElement('section');home.id='formaStudioHome';home.innerHTML=`<div class="fa-studio-home-heading"><div><small>ФОРМА / РАБОЧАЯ СТУДИЯ</small><h1>Пространство для архитектуры.</h1><p>От первого скриншота до готовой подачи проекта.</p></div><div class="fa-studio-main-actions"><button type="button" class="fa-studio-gallery-launch" data-studio-gallery>▤ Галерея</button><button type="button" class="fa-studio-primary" data-studio-new>＋ Новый проект</button></div></div><div class="fa-studio-task-grid">${tasks.map(([id,name,desc])=>`<button type="button" data-studio-tool="${id}" class="fa-studio-task">${studioIcon(id)}<strong>${name}</strong><small>${desc}</small><span>↗</span></button>`).join('')}</div><div class="fa-studio-section-title"><h2>Последние проекты</h2><button type="button" data-studio-tool="project">Все проекты ↗</button></div><div id="studioRecent"></div><div class="fa-studio-utilities"><button type="button" data-studio-tool="nodes">${studioIcon('nodes')}Сценарии<span>Соберите цепочку обработки</span></button><button type="button" data-studio-tool="settings">${studioIcon('settings')}Настройки<span>Формат и качество</span></button></div>`;
 $('.topline')?.after(home);
 // Расширенный каталог находится в отдельной вкладке «Инструменты» кабинета.
 document.addEventListener('click',e=>{
  if(bypass)return;if(e.target.closest('[data-studio-enhance]')){e.preventDefault();e.stopImmediatePropagation();openWorkspace('enhance');return;}if(e.target.closest('[data-studio-gallery]')){e.preventDefault();e.stopImmediatePropagation();if(closeWorkspace()){window.FORMA_CABINET?.open('gallery');}return;}if(e.target.closest('.top-actions [data-studio-action=commands]')){e.preventDefault();e.stopImmediatePropagation();closeWorkspace();$('#formaStudioHome').scrollIntoView({behavior:'smooth'});return;}const tool=e.target.closest('[data-studio-tool]');
  if(tool){e.preventDefault();e.stopImmediatePropagation();openWorkspace(tool.dataset.studioTool);return;}
  if(e.target.closest('[data-studio-new]')){e.preventDefault();window.FORMA_ART_BRIDGE.newProject().then(()=>openWorkspace('project'));return;return;}
  const project=e.target.closest('[data-studio-project]');if(project){const selector=`[data-project="${CSS.escape(project.dataset.studioProject)}"]`;window.FORMA_ART_BRIDGE.selectProject(project.dataset.studioProject).then(()=>openWorkspace('project'));return;}
  const nav=e.target.closest('.rail-nav [data-nav],.mobile-nav [data-mobile],.fa-interior-nav,.fa-interior-mobile,.fa-flow-rail,.fa-flow-mobile');
  if(nav){const id=nav.classList.contains('fa-flow-rail')||nav.classList.contains('fa-flow-mobile')?'nodes':nav.classList.contains('fa-interior-nav')||nav.classList.contains('fa-interior-mobile')?'interior':({environment:'render',variants:'frames',parameters:'settings'}[nav.dataset.nav||nav.dataset.mobile]||nav.dataset.nav||nav.dataset.mobile);e.preventDefault();e.stopImmediatePropagation();openWorkspace(id);}
  if(e.target.closest('#faInteriorLightStudio')){e.preventDefault();e.stopImmediatePropagation();window.FORMA_INTERIORS?.openLighting();return;}
  if(e.target.closest('#formaSceneQuickOpen,#formaSunStudioLauncher')){e.preventDefault();e.stopImmediatePropagation();if(closeWorkspace())window.FORMA_SUN_STUDIO?.open();return;}
  if(e.target.closest('#viewAllVariants')){e.preventDefault();e.stopImmediatePropagation();openWorkspace('frames');return;}
  if(e.target.closest('#batchToggle,#renderSetupBatch')){e.preventDefault();e.stopImmediatePropagation();openWorkspace('frames');}
 },true);
 document.addEventListener('forma:source-uploaded',()=>{if(active==='interior')window.FORMA_INTERIORS?.setScene('interior');if(active==='render')window.FORMA_INTERIORS?.setScene('exterior');const snap=window.FORMA_ART_BRIDGE?.snapshot();if(workspace&&snap?.hasSource&&!snap.demo)confirmedSources.add(bindingKey(snap));refreshHome();refreshSource();});
 document.addEventListener('forma:project-updated',()=>{refreshHome();refreshSource();});
 const breadcrumb=$('#breadcrumbName');if(breadcrumb)new MutationObserver(()=>{refreshHome();refreshSource();}).observe(breadcrumb,{childList:true,subtree:true,characterData:true});
 document.addEventListener('change',e=>{if(e.target.id==='sourceFile'){const tick=setInterval(()=>{refreshSource();if(!workspace||!workspace.classList.contains('needs-source'))clearInterval(tick);},200);setTimeout(()=>clearInterval(tick),12000);}});
 document.querySelectorAll('[data-nav="variants"] .rail-name,[data-mobile="variants"] span').forEach(e=>e.textContent='Кадры');
 document.querySelectorAll('.fa-flow-rail .rail-name,.fa-flow-mobile span').forEach(e=>e.textContent='Сценарии');
 refreshHome();
 // The new studio, not only the core render engine, must be ready before intro reveals.
 window.FORMA_STUDIO_READY=true;
 document.documentElement.classList.remove('forma-studio-booting');
 document.dispatchEvent(new Event('forma:studio-ready'));
}
window.FORMA_STUDIO={open:openWorkspace,close:closeWorkspace,refresh:refreshSource};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
