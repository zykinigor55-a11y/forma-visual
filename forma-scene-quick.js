/* FORMA / Scene Director · simple scene choices and user-directed sun on source photo.
   Every quick choice calls existing project handlers. Sun pin is an AI lighting guide,
   not a physically exact 3D light simulator. No API calls occur until Generate/Relight. */
(() => {
 'use strict';
 let sheet=null,launcher=null,dragging=false,dragPointer=null,draftSun=null,previousFocus=null;
 const fields=[
  ['environment','Окружение','Где находится дом?'],
  ['season','Сезон','Какое время года?'],
  ['weather','Погода','Какая погода?'],
  ['time','Время суток','Какой свет нужен?']
 ];
 const bridge=()=>window.FORMA_SCENE_BRIDGE;
 const get=()=>bridge()?.get?.()||{explicit:{},hasSource:false,hasRender:false,sun:null};
 const optionsFor=group=>document.getElementById(group==='environment'?'environmentOptions':group+'Options');
 const chosen=group=>optionsFor(group)?.querySelector('[data-choice].active')?.dataset.choice||'';
 const labelFor=(group,value)=>{
  const button=Array.from(optionsFor(group)?.querySelectorAll('[data-choice]')||[]).find(x=>x.dataset.choice===value);
  return button?.querySelector('.preset-card-label')?.textContent?.trim()||button?.title||'Не выбрано';
 };
 function summary(){
  const info=get(),values=fields.filter(([g])=>info.explicit?.[g]).map(([g])=>labelFor(g,chosen(g)));
  return values.length?(values.join(' · ')+(values.length<4?' · Остальное по исходнику':'')):'Атмосфера по исходному изображению';
 }
 function updateLauncher(){
  if(!launcher)return;
  const target=launcher.querySelector('.forma-scene-quick-value');if(target)target.textContent=summary();
 }
 function build(){
  const viewer=document.querySelector('.viewer-card');
  if(!viewer)return false;
  if(!launcher){
   launcher=document.createElement('button');launcher.type='button';
   launcher.className='forma-scene-quick';launcher.id='formaSceneQuickOpen';
   launcher.innerHTML='<span class="forma-scene-quick-icon" aria-hidden="true">☼</span><span class="forma-scene-quick-copy"><strong>Сцена · Свет</strong><span class="forma-scene-quick-value">Атмосфера по исходнику</span></span><span class="forma-scene-quick-arrow" aria-hidden="true">Настроить ›</span>';
   const toolbar=viewer.querySelector('.viewer-toolbar');
   if(toolbar?.nextSibling)viewer.insertBefore(launcher,toolbar.nextSibling);else viewer.prepend(launcher);
   launcher.addEventListener('click',open);
  }
  if(!sheet){
   sheet=document.createElement('div');sheet.id='formaSceneSheet';sheet.className='forma-scene-sheet';sheet.hidden=true;
   sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Сцена и свет');
   sheet.innerHTML=[
    '<div class="forma-scene-sheet-scrim" data-scene-close></div>',
    '<section class="forma-scene-sheet-card">',
     '<header class="forma-scene-sheet-head"><span><small>ФОРМА / НАСТРОЙКА КАДРА</small><strong>Сцена и свет</strong><em>Выбирай только то, что хочешь изменить</em></span>',
      '<button type="button" data-scene-close aria-label="Закрыть настройки">×</button></header>',
     '<div class="forma-scene-sheet-body" id="formaSceneQuickBody"></div>',
     '<footer class="forma-scene-sheet-footer">',
      '<button type="button" class="forma-scene-sheet-apply" data-scene-close>Применить</button>',
      '<button type="button" class="forma-scene-sheet-run" id="formaSceneQuickGenerate">Создать рендер ›</button>',
     '</footer>',
    '</section>'
   ].join('');
   document.body.appendChild(sheet);
   sheet.addEventListener('click',onSheetClick);
   sheet.addEventListener('pointerdown',onSunPointerDown);
   sheet.addEventListener('pointermove',onSunPointerMove);
   sheet.addEventListener('pointerup',onSunPointerUp);
   sheet.addEventListener('pointercancel',cancelSunPointer);
   sheet.addEventListener('keydown',onSheetKeydown);
   sheet.querySelector('#formaSceneQuickGenerate').addEventListener('click',()=>{
    close();document.getElementById('generateBtn')?.click();
   });
  }
  updateLauncher();return true;
 }
 function paint(){
  if(!sheet)return;
  const info=get(),body=sheet.querySelector('#formaSceneQuickBody');body.replaceChildren();
  for(const [group,title,subtitle] of fields){
   const section=document.createElement('section');section.className='forma-scene-sheet-group';
   const head=document.createElement('div');head.className='forma-scene-sheet-group-head';
   const strong=document.createElement('strong');strong.textContent=title;
   const small=document.createElement('small');small.textContent=subtitle;
   head.append(strong,small);section.append(head);
   const chips=document.createElement('div');chips.className='forma-scene-sheet-chips';
   const auto=document.createElement('button');auto.type='button';auto.className='forma-scene-sheet-chip';
   auto.dataset.quickGroup=group;auto.dataset.quickChoice='auto';auto.textContent='По исходнику';
   const autoOn=!info.explicit?.[group];
   auto.classList.toggle('is-active',autoOn);auto.setAttribute('aria-pressed',String(autoOn));
   chips.append(auto);
   for(const source of optionsFor(group)?.querySelectorAll('[data-choice]')||[]){
    const button=document.createElement('button');button.type='button';button.className='forma-scene-sheet-chip';
    button.dataset.quickGroup=group;button.dataset.quickChoice=source.dataset.choice;
    button.textContent=source.querySelector('.preset-card-label')?.textContent?.trim()||source.title||source.dataset.choice;
    const on=!!info.explicit?.[group]&&source.dataset.choice===chosen(group);
    button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));
    chips.append(button);
   }
   section.append(chips);body.append(section);
  }
  const sunSection=document.createElement('section');sunSection.className='forma-scene-sheet-group forma-sun-section';
  const sunTitle=document.createElement('div');sunTitle.className='forma-scene-sheet-group-head';
  sunTitle.innerHTML='<strong>Направление солнца</strong><small>Выбери точку света пальцем</small>';
  sunSection.append(sunTitle);
  const sub=document.createElement('p');sub.className='forma-sun-explainer';
  sub.textContent='Коснись кадра и перетащи значок ☀. Это подсказка AI, откуда должен идти свет. Тени будут ориентированы в противоположную сторону.';
  sunSection.append(sub);
  if(!info.hasSource){
   const empty=document.createElement('p');empty.className='forma-sun-empty';
   empty.textContent='Сначала загрузи собственный скриншот дома, чтобы задать направление солнца.';
   sunSection.append(empty);
  }else{
   const preview=document.createElement('div');preview.className='forma-sun-preview';preview.id='formaSunPreview';
   preview.tabIndex=0;preview.setAttribute('role','slider');
   preview.setAttribute('aria-label','Направление солнца на изображении');
   preview.setAttribute('aria-valuemin','0');preview.setAttribute('aria-valuemax','100');
   preview.setAttribute('aria-valuenow',String(Math.round((info.sun?.x??.75)*100)));
   preview.setAttribute('aria-valuetext','Перемести солнце пальцем или стрелками');
   const image=document.createElement('img');image.id='formaSunPreviewImage';
   image.alt='Исходный кадр для выбора направления освещения';
   image.draggable=false;image.src=info.hasRender&&info.renderImage?info.renderImage:info.sourceImage||'';
   preview.append(image);
   const pin=document.createElement('span');pin.className='forma-sun-pin';pin.textContent='☀';
   pin.setAttribute('aria-hidden','true');pin.hidden=!info.sun;
   preview.append(pin);
   const caption=document.createElement('span');caption.className='forma-sun-preview-caption';
   caption.textContent=info.hasRender?'ТЕКУЩИЙ РЕНДЕР · МОЖНО ПЕРЕОСВЕТИТЬ':'ИСХОДНИК · ДЛЯ ПЕРВОГО РЕНДЕРА';
   preview.append(caption);sunSection.append(preview);
   const actions=document.createElement('div');actions.className='forma-sun-actions';
   const reset=document.createElement('button');reset.type='button';reset.dataset.sunReset='1';
   reset.textContent='По исходному свету';reset.className='forma-sun-reset';
   actions.append(reset);
   const modes=document.createElement('div');modes.className='forma-sun-softness';
   modes.setAttribute('role','group');modes.setAttribute('aria-label','Характер теней');
   for(const [id,text]of [['soft','Мягкие тени'],['natural','Естественные'],['defined','Чёткие тени']]){
    const b=document.createElement('button');b.type='button';b.dataset.sunSoftness=id;b.textContent=text;
    const active=(info.sun?.softness||'natural')===id;
    b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));modes.append(b);
   }
   sunSection.append(actions,modes);
   drawPin(info.sun);
   if(info.explicit?.time&&info.time==='night'){
    const night=document.createElement('p');night.className='forma-sun-night-hint';
    night.textContent='Выбрана ночь — положение солнца не применяется. Для солнечного света выбери утро, день или вечер.';
    sunSection.append(night);
   }
   if(info.hasRender){
    const relight=document.createElement('button');relight.type='button';relight.className='forma-sun-relight';
    relight.dataset.sunRelight='1';relight.textContent='↻  Переосветить текущий рендер · 1 AI-запрос';
    sunSection.append(relight);
   }
  }
  body.append(sunSection);
 }
 function drawPin(sun){
  const preview=sheet?.querySelector('#formaSunPreview'),pin=preview?.querySelector('.forma-sun-pin');
  if(!preview||!pin)return;
  if(!sun){pin.hidden=true;return}
  const image=preview.querySelector('img');
  const box=preview.getBoundingClientRect();
  const nw=image.naturalWidth||16,nh=image.naturalHeight||9;
  const fit=Math.min(box.width/nw,box.height/nh);
  const dw=nw*fit,dh=nh*fit,offsetX=(box.width-dw)/2,offsetY=(box.height-dh)/2;
  pin.hidden=false;pin.style.left=(offsetX+sun.x*dw)+'px';
  pin.style.top=(offsetY+sun.y*dh)+'px';
  preview.setAttribute('aria-valuenow',String(Math.round(sun.x*100)));
 }
 function positionFromPointer(event){
  const preview=sheet?.querySelector('#formaSunPreview'),image=preview?.querySelector('img');
  if(!preview||!image)return null;
  const rect=preview.getBoundingClientRect();
  const iw=image.naturalWidth||16,ih=image.naturalHeight||9;
  const fit=Math.min(rect.width/iw,rect.height/ih);
  const width=iw*fit,height=ih*fit;
  const offsetX=(rect.width-width)/2,offsetY=(rect.height-height)/2;
  const x=(event.clientX-rect.left-offsetX)/width,y=(event.clientY-rect.top-offsetY)/height;
  return {x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y)),softness:get().sun?.softness||'natural'};
 }
 function onSunPointerDown(event){
  const preview=event.target.closest('#formaSunPreview');if(!preview||event.button>0)return;
  dragging=true;dragPointer=event.pointerId;
  try{preview.setPointerCapture(event.pointerId)}catch{}
  draftSun=positionFromPointer(event);drawPin(draftSun);event.preventDefault();
 }
 function onSunPointerMove(event){
  if(!dragging||event.pointerId!==dragPointer)return;
  draftSun=positionFromPointer(event);drawPin(draftSun);event.preventDefault();
 }
 function onSunPointerUp(event){
  if(!dragging||event.pointerId!==dragPointer)return;
  const point=positionFromPointer(event)||draftSun;
  dragging=false;dragPointer=null;draftSun=null;
  if(point&&bridge()?.setSun?.(point)){paint();updateLauncher()}
  event.preventDefault();
 }
 function cancelSunPointer(){dragging=false;dragPointer=null;draftSun=null}
 function onSheetClick(event){
  if(event.target.closest('[data-scene-close]')){close();return}
  const choice=event.target.closest('[data-quick-group][data-quick-choice]');
  if(choice){
   const group=choice.dataset.quickGroup,value=choice.dataset.quickChoice;
   if(value==='auto')bridge()?.resetField?.(group);
   else{
    const original=Array.from(optionsFor(group)?.querySelectorAll('[data-choice]')||[]).find(x=>x.dataset.choice===value);
    original?.click();
   }
   paint();updateLauncher();return;
  }
  if(event.target.closest('[data-sun-reset]')){bridge()?.resetSun?.();paint();return}
  const soft=event.target.closest('[data-sun-softness]');
  if(soft){
   const info=get(),sun=info.sun||{x:.75,y:.2};
   bridge()?.setSun?.({...sun,softness:soft.dataset.sunSoftness});
   paint();return;
  }
  if(event.target.closest('[data-sun-relight]')){
   const info=get();
   if(!info.hasRender)return;
   if(!confirm('Переосветить готовый рендер? Будет отправлен один новый платный AI-запрос. Исходный кадр и предыдущие результаты сохранятся.'))return;
   close();bridge()?.relight?.();return;
  }
 }
 function onSheetKeydown(event){
  if(event.key==='Escape'){event.preventDefault();close();return}
  if(event.target.id!=='formaSunPreview')return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();
  const info=get(),sun={x:info.sun?.x??.75,y:info.sun?.y??.2,softness:info.sun?.softness||'natural'};
  const step=event.shiftKey?.05:.02;
  if(event.key==='ArrowLeft')sun.x=Math.max(0,sun.x-step);
  if(event.key==='ArrowRight')sun.x=Math.min(1,sun.x+step);
  if(event.key==='ArrowUp')sun.y=Math.max(0,sun.y-step);
  if(event.key==='ArrowDown')sun.y=Math.min(1,sun.y+step);
  bridge()?.setSun?.(sun);drawPin(sun);
 }
 function open(){
  if(!build())return;
  previousFocus=document.activeElement;paint();sheet.hidden=false;
  document.documentElement.classList.add('forma-scene-sheet-open');
  sheet.querySelector('[data-scene-close]')?.focus({preventScroll:true});
 }
 function close(){
  if(!sheet)return;
  sheet.hidden=true;document.documentElement.classList.remove('forma-scene-sheet-open');
  updateLauncher();
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 }
 function init(){
  build();
  document.addEventListener('click',event=>{
   if(event.target.closest('[data-choice]')||event.target.closest('[data-scene-demo]'))queueMicrotask(updateLauncher);
  });
  const summaryEl=document.getElementById('renderSummaryLine');
  if(summaryEl&&typeof MutationObserver!=='undefined')
   new MutationObserver(updateLauncher).observe(summaryEl,{characterData:true,childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FORMA_SCENE_QUICK={open,close,refresh:updateLauncher};
})();