/* FORMA / Real AI result focus. No extra paid API calls. */
(() => {
 'use strict';
 let screen=null,lastImage='',opened=false,previousFocus=null;
 function mount(){
  if(screen)return screen;
  screen=document.createElement('div');screen.id='formaResultFocus';screen.hidden=true;
  screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');
  screen.setAttribute('aria-labelledby','formaResultTitle');
  screen.innerHTML=[
   '<section class="forma-result-window">',
    '<header class="forma-result-header">',
     '<div class="forma-result-brand"><img src="assets/brand/forma-fa-mark.svg" alt="" width="38" height="38">',
     '<span class="forma-result-brand-copy"><span class="forma-result-overline">ФОРМА / РЕЗУЛЬТАТ ГОТОВ</span>',
     '<h2 id="formaResultTitle">Новый архитектурный кадр</h2></span></div>',
     '<button type="button" class="forma-result-close" data-result-action="close" aria-label="Вернуться в проект">×</button>',
    '</header>',
    '<div class="forma-result-meta"><span id="formaResultProject">Мой проект</span><span id="formaResultScene">Архитектурная визуализация</span></div>',
    '<div class="forma-result-figure"><img id="formaResultPhoto" alt="Новый AI-рендер архитектурного проекта">',
     '<span class="forma-result-counter">AI · РЕЗУЛЬТАТ</span></div>',
    '<div class="forma-result-actions">',
     '<button type="button" data-result-action="compare">◧ Сравнить</button>',
     '<button type="button" data-result-action="download">↓ Скачать</button>',
     '<button type="button" data-result-action="variants">▤ Создать вариант</button>',
     '<button type="button" data-result-action="scene">☼ Изменить сцену</button>',
    '</div>',
    '<footer class="forma-result-footer">Результат открыт автоматически · Все варианты доступны в проекте</footer>',
   '</section>'
  ].join('');
  screen.addEventListener('click',event=>{
   const button=event.target.closest('[data-result-action]');
   if(!button)return;
   const action=button.dataset.resultAction;
   if(action==='download'){download();return}
   if(action==='compare'){close(true);document.querySelector('[data-view-mode="slider"]')?.click();return}
   if(action==='variants'){
    close(false);const variants=document.querySelector('#sceneVariantsPanel');
    if(variants&&!variants.hidden)variants.scrollIntoView({behavior:'smooth',block:'start'});
    else document.querySelector('[data-tab="variants"]')?.click();
    return;
   }
   if(action==='scene'){
    close(false);
    if(window.FORMA_SCENE_QUICK?.open)window.FORMA_SCENE_QUICK.open();
    else{document.querySelector('[data-tab="environment"]')?.click();document.querySelector('#inspector')?.scrollIntoView({behavior:'smooth',block:'start'})}
    return;
   }
   if(action==='close')close(true);
  });
  screen.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();close(true);return}
   if(event.key==='Tab'){
    const focusables=Array.from(screen.querySelectorAll('button:not([disabled])'));
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  });
  document.body.appendChild(screen);return screen;
 }
 function close(returnToViewer=true){
  if(!screen||!opened)return;
  opened=false;screen.hidden=true;
  document.documentElement.classList.remove('forma-result-focused');
  if(returnToViewer)document.querySelector('.viewer-card')?.scrollIntoView({behavior:'instant',block:'start'});
  if(previousFocus?.isConnected&&previousFocus!==document.body)previousFocus.focus({preventScroll:true});
 }
 function download(){
  if(!lastImage)return;
  const link=document.createElement('a');link.href=lastImage;
  const mime=lastImage.slice(5,30);
  link.download='FORMA-render-'+new Date().toISOString().replace(/[.:]/g,'-')+'.'+(mime.includes('jpeg')?'jpg':mime.includes('webp')?'webp':'png');
  document.body.appendChild(link);link.click();link.remove();
 }
 function show({image,project,scene}={}){
  if(!image||!(image.startsWith('data:image/')||image.startsWith('blob:')||image.startsWith('https://')))return false;
  mount();lastImage=image;
  document.getElementById('formaResultPhoto').src=image;
  document.getElementById('formaResultProject').textContent=String(project||document.getElementById('canvasProjectLabel')?.textContent||'Мой проект').slice(0,100);
  document.getElementById('formaResultScene').textContent=String(scene||document.getElementById('renderSummaryLine')?.textContent||'Архитектурная визуализация').slice(0,170);
  previousFocus=document.activeElement;opened=true;screen.hidden=false;
  document.documentElement.classList.add('forma-result-focused');
  screen.querySelector('[data-result-action="close"]')?.focus({preventScroll:true});
  return true;
 }
 window.FORMA_RESULT_FOCUS={show,close,get open(){return opened}};
})();