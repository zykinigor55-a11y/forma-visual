/* FORMA quick scene settings. Mirrors and triggers the real, existing scene controls. */
(() => {
 'use strict';
 let sheet=null,launcher=null;
 const names=[['environment','Окружение','Где находится дом?'],['season','Сезон','Время года'],['weather','Погода','Состояние неба'],['time','Время суток','Освещение']];
 const optionsFor=group=>document.getElementById(group==='environment'?'environmentOptions':group+'Options');
 const selected=group=>optionsFor(group)?.querySelector('[data-choice].active')?.dataset.choice||'';
 const labelFor=(group,value)=>{
  const button=Array.from(optionsFor(group)?.querySelectorAll('[data-choice]')||[]).find(x=>x.dataset.choice===value);
  return button?.querySelector('.preset-card-label')?.textContent?.trim()||button?.title||'Не выбрано';
 };
 function summary(){
  return names.map(([group])=>labelFor(group,selected(group))).join(' · ');
 }
 function updateLauncher(){
  if(!launcher)return;
  const value=launcher.querySelector('.forma-scene-quick-value');
  if(value)value.textContent=summary();
 }
 function build(){
  const viewer=document.querySelector('.viewer-card');
  if(!viewer)return false;
  if(!launcher){
   launcher=document.createElement('button');launcher.type='button';
   launcher.className='forma-scene-quick';launcher.id='formaSceneQuickOpen';
   launcher.innerHTML='<span class="forma-scene-quick-icon" aria-hidden="true">☼</span><span class="forma-scene-quick-copy"><strong>Сцена и атмосфера</strong><span class="forma-scene-quick-value">Окружение · Сезон · Погода · Время</span></span><span class="forma-scene-quick-arrow" aria-hidden="true">Изменить ›</span>';
   const toolbar=viewer.querySelector('.viewer-toolbar');
   if(toolbar?.nextSibling)viewer.insertBefore(launcher,toolbar.nextSibling);else viewer.prepend(launcher);
   launcher.addEventListener('click',open);
  }
  if(!sheet){
   sheet=document.createElement('div');sheet.className='forma-scene-sheet';sheet.id='formaSceneSheet';sheet.hidden=true;
   sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Сцена и атмосфера');
   sheet.innerHTML=[
    '<div class="forma-scene-sheet-scrim" data-scene-close></div>',
    '<section class="forma-scene-sheet-card">',
     '<header class="forma-scene-sheet-head"><span><small>ФОРМА / ВИЗУАЛИЗАЦИЯ</small><strong>Сцена и атмосфера</strong><em>Все параметры — в одном месте</em></span>',
      '<button type="button" data-scene-close aria-label="Закрыть настройки сцены">×</button></header>',
     '<div class="forma-scene-sheet-body" id="formaSceneQuickBody"></div>',
     '<footer class="forma-scene-sheet-footer">',
      '<button type="button" class="forma-scene-sheet-apply" data-scene-close>Применить настройки</button>',
      '<button type="button" class="forma-scene-sheet-run" id="formaSceneQuickGenerate">Создать визуализацию ›</button>',
     '</footer>',
    '</section>'
   ].join('');
   document.body.appendChild(sheet);
   sheet.addEventListener('click',event=>{
    if(event.target.closest('[data-scene-close]')){close();return}
    const btn=event.target.closest('[data-quick-group][data-quick-choice]');
    if(!btn)return;
    const group=btn.dataset.quickGroup,choice=btn.dataset.quickChoice;
    const original=Array.from(optionsFor(group)?.querySelectorAll('[data-choice]')||[]).find(x=>x.dataset.choice===choice);
    if(!original)return;
    original.click(); // Calls the existing settings handler, persist logic, preview sync and full brief.
    paint();updateLauncher();
   });
   sheet.querySelector('#formaSceneQuickGenerate').addEventListener('click',()=>{
    close();document.getElementById('generateBtn')?.click();
   });
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){e.preventDefault();close()}});
  }
  updateLauncher();return true;
 }
 function paint(){
  if(!sheet)return;
  const body=sheet.querySelector('#formaSceneQuickBody');body.innerHTML='';
  for(const [group,title,subtitle]of names){
   const controls=optionsFor(group)?.querySelectorAll('[data-choice]')||[];
   const section=document.createElement('section');section.className='forma-scene-sheet-group';
   const heading=document.createElement('div');heading.className='forma-scene-sheet-group-head';
   const strong=document.createElement('strong');strong.textContent=title;
   const small=document.createElement('small');small.textContent=subtitle;
   heading.append(strong,small);section.appendChild(heading);
   const chips=document.createElement('div');chips.className='forma-scene-sheet-chips';
   const current=selected(group);
   for(const source of controls){
    const choice=document.createElement('button');choice.type='button';choice.className='forma-scene-sheet-chip';
    choice.dataset.quickGroup=group;choice.dataset.quickChoice=source.dataset.choice;
    const text=source.querySelector('.preset-card-label')?.textContent?.trim()||source.title||source.dataset.choice;
    choice.textContent=text;const on=source.dataset.choice===current;
    choice.classList.toggle('is-active',on);choice.setAttribute('aria-pressed',String(on));
    chips.appendChild(choice);
   }
   section.appendChild(chips);body.appendChild(section);
  }
 }
 function open(){if(!build())return;paint();sheet.hidden=false;document.documentElement.classList.add('forma-scene-sheet-open');sheet.querySelector('[data-scene-close]')?.focus({preventScroll:true})}
 function close(){if(!sheet)return;sheet.hidden=true;document.documentElement.classList.remove('forma-scene-sheet-open');updateLauncher();launcher?.focus({preventScroll:true})}
 function init(){
  build();
  document.addEventListener('click',event=>{
   if(event.target.closest('[data-choice]')||event.target.closest('[data-scene-demo]'))queueMicrotask(updateLauncher);
  });
  const title=document.getElementById('renderSummaryLine');
  if(title&&typeof MutationObserver!=='undefined')new MutationObserver(updateLauncher).observe(title,{characterData:true,childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FORMA_SCENE_QUICK={open,close,refresh:updateLauncher};
})();