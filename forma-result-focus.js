/* FORMA / Result Studio v2. Preview first, then one-tap scene revisions.
   Every adjustment is explicit; no new paid generation without pressing Generate. */
(() => {
 'use strict';
 let screen=null,lastImage='',opened=false,previousFocus=null,pending={},inFlight=false;
 const settings=[
  ['time','Время суток',[['morning','Утро'],['day','День'],['golden','Золотой час'],['night','Ночь']]],
  ['season','Сезон',[['spring','Весна'],['summer','Лето'],['autumn','Осень'],['winter','Зима']]],
  ['weather','Погода',[['clear','Ясно'],['cloud','Пасмурно'],['rain','Дождь'],['fog','Туман'],['snow','Снег']]],
  ['lighting','Освещение',[['natural','Естественный'],['soft','Мягкий'],['dramatic','Выразительный'],['windows','Свет в окнах'],['exterior','Наружный свет']]]
 ];
 const labels=(group,id)=>settings.find(v=>v[0]===group)?.[2]?.find(x=>x[0]===id)?.[1]||id;
 function mount(){
  if(screen)return screen;
  screen=document.createElement('div');screen.id='formaResultFocus';screen.hidden=true;
  screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');
  screen.setAttribute('aria-labelledby','formaResultTitle');
  const groups=settings.map(([id,name,values])=>
   '<div class="forma-next-group"><div class="forma-next-group-title">'+name+'</div>'+
   '<div class="forma-next-chips" role="group" aria-label="'+name+'">'+
    values.map(([val,title])=>'<button type="button" class="forma-next-chip" data-quick-group="'+id+'" data-quick-value="'+val+'" aria-pressed="false">'+title+'</button>').join('')+
   '</div></div>').join('');
  screen.innerHTML=[
   '<section class="forma-result-window">',
    '<header class="forma-result-header"><div class="forma-result-brand">',
     '<img src="assets/brand/forma-fa-mark.svg" alt="" width="38" height="38">',
     '<span class="forma-result-brand-copy"><span class="forma-result-overline">ФОРМА / ВИЗУАЛИЗАЦИЯ ГОТОВА</span>',
     '<h2 id="formaResultTitle">Ваш архитектурный кадр</h2></span></div>',
     '<button type="button" class="forma-result-close" data-result-action="close" aria-label="Закрыть просмотр результата">×</button></header>',
    '<div class="forma-result-meta"><span id="formaResultProject">Проект</span><span id="formaResultScene">Результат сохранён</span></div>',
    '<div class="forma-result-figure"><img id="formaResultPhoto" alt="Новый AI-рендер архитектурного проекта">',
     '<span class="forma-result-counter">НОВЫЙ РЕЗУЛЬТАТ</span></div>',
    '<section class="forma-result-next" aria-label="Следующие действия с изображением">',
     '<div class="forma-result-next-heading"><span><strong>Что сделать дальше?</strong><small>Выберите новые условия — предыдущий кадр останется в истории.</small></span>',
     '<button type="button" class="forma-result-next-angle" data-result-action="angle">↗ Другой ракурс</button></div>',
     '<div class="forma-result-next-groups">'+groups+'</div>',
     '<div class="forma-result-next-footer"><span id="formaResultPending">Выберите параметры нового варианта</span>',
      '<button type="button" class="forma-result-make-variant" data-result-action="make" disabled>Создать новый вариант</button></div>',
    '</section>',
    '<div class="forma-result-actions">',
     '<button type="button" data-result-action="compare">◧ Сравнить</button>',
     '<button type="button" data-result-action="download">↓ Скачать</button>',
     '<button type="button" data-result-action="variants">▤ История</button>',
     '<button type="button" data-result-action="scene">☼ Все настройки сцены</button></div>',
    '<footer class="forma-result-footer">Изменения не запускают AI автоматически · Новый вариант — отдельный запрос</footer>',
   '</section>'
  ].join('');
  screen.addEventListener('click',event=>{
   const chip=event.target.closest('[data-quick-group][data-quick-value]');
   if(chip){pick(chip);return}
   const btn=event.target.closest('[data-result-action]');
   if(!btn)return;
   const type=btn.dataset.resultAction;
   if(type==='download'){download();return}
   if(type==='compare'){close(true);document.querySelector('[data-view-mode="slider"]')?.click();return}
   if(type==='angle'){
    close(false);
    const button=document.getElementById('newAngleBtn');
    if(button&&!button.disabled)button.click();
    else document.getElementById('sourceFile')?.click();
    return
   }
   if(type==='variants'){
    close(false);document.querySelector('[data-tab="variants"]')?.click();
    document.getElementById('inspector')?.scrollIntoView({behavior:'smooth',block:'start'});return
   }
   if(type==='scene'){
    close(false);
    if(window.FORMA_SCENE_QUICK?.open)window.FORMA_SCENE_QUICK.open();
    else document.querySelector('[data-tab="environment"]')?.click();
    return
   }
   if(type==='make'){
    if(inFlight||!Object.keys(pending).length)return;
    const changes=Object.entries(pending).map(([group,id])=>({group,id,label:labels(group,id)}));
    const result=window.FORMA_SCENE_BRIDGE?.generateVariant?.(changes);
    if(!result)return;
    inFlight=true;
    close(false);
    Promise.resolve(result).finally(()=>{inFlight=false}).catch(()=>{});
    return
   }
   if(type==='close')close(true);
  });
  screen.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();close(true);return}
   if(event.key==='Tab'){
    const focus=Array.from(screen.querySelectorAll('button:not([disabled])'));
    const first=focus[0],last=focus[focus.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  });
  document.body.appendChild(screen);return screen;
 }
 function pick(button){
  const group=button.dataset.quickGroup,id=button.dataset.quickValue;
  if(!window.FORMA_SCENE_BRIDGE?.setQuickOption?.(group,id))return;
  pending[group]=id;
  screen.querySelectorAll('[data-quick-group="'+group+'"]').forEach(el=>{
   const on=el.dataset.quickValue===id;
   el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on));
  });
  const summary=Object.entries(pending).map(([g,k])=>labels(g,k)).join(' · ');
  document.getElementById('formaResultPending').textContent='Новый вариант: '+summary;
  const btn=screen.querySelector('[data-result-action="make"]');btn.disabled=false;
  btn.textContent='Создать вариант · 1 AI-запрос';
 }
 function close(scrollToResult=true){
  if(!screen||!opened)return;
  opened=false;screen.hidden=true;
  document.documentElement.classList.remove('forma-result-focused');
  if(scrollToResult)document.querySelector('.viewer-card')?.scrollIntoView({behavior:'instant',block:'start'});
  if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
 }
 function download(){
  if(!lastImage)return;
  const a=document.createElement('a');a.href=lastImage;
  const mime=lastImage.slice(5,30);
  a.download='FORMA-render-'+new Date().toISOString().replace(/[.:]/g,'-')+'.'+(mime.includes('jpeg')?'jpg':mime.includes('webp')?'webp':'png');
  document.body.appendChild(a);a.click();a.remove();
 }
 function show({image,project,scene}={}){
  if(!image||!(/^(data:image\/|blob:|https:\/\/)/.test(image)))return false;
  mount();lastImage=image;pending={};
  document.getElementById('formaResultPhoto').src=image;
  document.getElementById('formaResultProject').textContent=String(project||'Мой проект').slice(0,100);
  document.getElementById('formaResultScene').textContent=String(scene||'Архитектурная визуализация').slice(0,140);
  screen.querySelectorAll('.forma-next-chip').forEach(chip=>{chip.classList.remove('is-active');chip.setAttribute('aria-pressed','false')});
  document.getElementById('formaResultPending').textContent='Выберите параметры нового варианта';
  const generate=screen.querySelector('[data-result-action="make"]');generate.disabled=true;generate.textContent='Создать новый вариант';
  previousFocus=document.activeElement;opened=true;screen.hidden=false;
  document.documentElement.classList.add('forma-result-focused');
  screen.querySelector('[data-result-action="close"]')?.focus({preventScroll:true});
  return true;
 }
 window.FORMA_RESULT_FOCUS={show,close,get open(){return opened}};
})();