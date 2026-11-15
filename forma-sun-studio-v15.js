/* FORMA / SUN STUDIO v15 — photographic light direction, not a 3D renderer. */
(()=>{
 'use strict';
 const $=(q,root=document)=>root.querySelector(q);
 const B=()=>window.FORMA_SCENE_BRIDGE;
 const SOURCE=()=>B()?.get?.()||{};
 const DIRECTIONS=[
  {id:'back-left',name:'Сзади слева',short:'↖',x:.18,y:.18,desc:'Контровой свет слева'},
  {id:'back',name:'За домом',short:'↑',x:.50,y:.13,desc:'Контровой свет'},
  {id:'back-right',name:'Сзади справа',short:'↗',x:.82,y:.18,desc:'Контровой свет справа'},
  {id:'left',name:'Слева',short:'←',x:.11,y:.46,desc:'Боковое освещение слева'},
  {id:'front',name:'Перед домом',short:'↓',x:.5,y:.89,desc:'Фронтальный свет'},
  {id:'right',name:'Справа',short:'→',x:.89,y:.46,desc:'Боковое освещение справа'},
  {id:'front-left',name:'Спереди слева',short:'↙',x:.19,y:.78,desc:'Левый передний свет'},
  {id:'front-right',name:'Спереди справа',short:'↘',x:.81,y:.78,desc:'Правый передний свет'}
 ];
 const HEIGHTS=[{id:'low',name:'Низкое',hint:'Длинные тени',degrees:16},{id:'medium',name:'Среднее',hint:'Умеренные тени',degrees:38},{id:'high',name:'Высокое',hint:'Короткие тени',degrees:66}];
 const INDOOR_SOURCES=[{id:'window',name:'Через окна',hint:'Естественный дневной свет'},{id:'ceiling',name:'Потолочный',hint:'Общий свет'},{id:'fixtures',name:'Светильники',hint:'Локальный уютный свет'},{id:'mixed',name:'Комбинированный',hint:'Дневной + искусственный'}];
 const interiorMode=()=>window.FORMA_INTERIORS?.state?.().sceneType==='interior';
 const SHADOWS=[{id:'soft',name:'Мягкие',hint:'Широкая полутень'},{id:'natural',name:'Естественные',hint:'Реалистичный баланс'},{id:'defined',name:'Контрастные',hint:'Чёткие границы'},{id:'cinematic',name:'Кинематографичные',hint:'Глубокий светотеневой рисунок'}];
 let visible=false,previousFocus=null,scene={direction:'front-left',elevation:'medium',shadow:'natural',indoorSource:'window'},userMoved=false;
 const direction=id=>DIRECTIONS.find(d=>d.id===id)||DIRECTIONS[6];
 const height=id=>HEIGHTS.find(h=>h.id===id)||HEIGHTS[1];
 const shadow=id=>SHADOWS.find(s=>s.id===id)||SHADOWS[1];
 const source=id=>INDOOR_SOURCES.find(s=>s.id===id)||INDOOR_SOURCES[0];
 const docBody=()=>document.body;
 function infoFromState(){
  const p=SOURCE().sun||{};
  return {direction:DIRECTIONS.some(d=>d.id===p.direction)?p.direction:'front-left',
   elevation:HEIGHTS.some(h=>h.id===p.elevation)?p.elevation:'medium',
   shadow:SHADOWS.some(s=>s.id===p.shadow)?p.shadow:(p.softness==='soft'?'soft':p.softness==='defined'?'defined':'natural'),
   indoorSource:INDOOR_SOURCES.some(o=>o.id===p.indoorSource)?p.indoorSource:'window'};
 }
 function payload(){
  const d=direction(scene.direction),h=height(scene.elevation);
  return {direction:d.id,elevation:h.id,shadow:scene.shadow,indoorSource:scene.indoorSource,
   x:d.x,y:d.y,softness:scene.shadow==='cinematic'?'defined':scene.shadow,
   elevationDegrees:h.degrees};
 }
 function persist(){
  if(!SOURCE().hasSource)return false;
  const result=B()?.setSun?.(payload());
  if(result===false)return false;
  userMoved=true;refreshLauncher();
  document.dispatchEvent(new CustomEvent('forma:sun-updated',{detail:{...scene}}));
  return true;
 }
 function makeLauncher(){
  const viewer=$('.viewer-card');if(!viewer)return null;
  let launcher=$('#formaSunStudioLauncher');if(launcher)return launcher;
  launcher=document.createElement('button');launcher.type='button';
  launcher.id='formaSunStudioLauncher';launcher.className='forma-sun-studio-launcher';launcher.hidden=true;
  launcher.innerHTML='<span class="forma-sun-studio-mark" aria-hidden="true">☼</span>'+
   '<span class="forma-sun-studio-launch-copy"><strong>SUN STUDIO <i> / Свет сцены</i></strong><small id="formaSunStudioLauncherStatus">Выберите направление солнца</small></span>'+
   '<span class="forma-sun-studio-launch-arrow" aria-hidden="true">↗</span>';
  const anchor=viewer.querySelector('#formaUploadNextBar')||viewer.querySelector('.forma-scene-quick')||viewer.querySelector('.viewer-toolbar');
  anchor?.insertAdjacentElement('afterend',launcher);
  launcher.addEventListener('click',open);
  return launcher;
 }
 function refreshLauncher(){
  const launcher=makeLauncher();
  if(!launcher)return;
  const info=SOURCE();
  launcher.hidden=!info.hasSource;
  const output=$('#formaSunStudioLauncherStatus',launcher);
  const s=info.sun||null;
  output.textContent=s?.direction?direction(s.direction).name+' · '+height(s.elevation).name.toLowerCase()+' · '+shadow(s.shadow).name.toLowerCase():'Направление солнца ещё не выбрано';
 }
 function build(){
  let root=$('#formaSunStudio');if(root)return root;
  root=document.createElement('div');root.id='formaSunStudio';root.className='forma-sunstudio-backdrop';root.hidden=true;
  const dirBtns=DIRECTIONS.map(d=>'<button type="button" data-sun-direction="'+d.id+'" aria-pressed="false"><span aria-hidden="true">'+d.short+'</span><small>'+d.name+'</small></button>').join('');
  const heightBtns=HEIGHTS.map(h=>'<button type="button" data-sun-height="'+h.id+'" aria-pressed="false"><strong>'+h.name+'</strong><small>'+h.hint+'</small></button>').join('');
  const indoorBtns=INDOOR_SOURCES.map(s=>'<button type="button" data-sun-indoor-source="'+s.id+'" aria-pressed="false"><strong>'+s.name+'</strong><small>'+s.hint+'</small></button>').join('');
  const shadowBtns=SHADOWS.map(s=>'<button type="button" data-sun-shadow="'+s.id+'" aria-pressed="false"><strong>'+s.name+'</strong><small>'+s.hint+'</small></button>').join('');
  root.innerHTML='<div class="forma-sunstudio-scrim" data-sun-close></div>'+
   '<section class="forma-sunstudio-panel" role="dialog" aria-modal="true" aria-labelledby="formaSunStudioTitle">'+
    '<header class="forma-sunstudio-head"><div><span class="forma-sunstudio-kicker">FORMA / SUN STUDIO</span><h2 id="formaSunStudioTitle">Свет и тени</h2><p>Управление освещением архитектурного кадра</p></div><button class="forma-sunstudio-close" type="button" data-sun-close aria-label="Закрыть">×</button></header>'+
    '<div class="forma-sunstudio-inner">'+
     '<div class="forma-sunstudio-visual"><div class="forma-sunstudio-visual-head"><span>01 / СВЕТОВАЯ СХЕМА</span><span id="formaSunStudioLiveStatus">ЛЕВЫЙ ПЕРЕДНИЙ СВЕТ</span></div>'+
      '<div class="forma-sunstudio-photo" id="formaSunStudioPhoto">'+
       '<img id="formaSunStudioSource" alt="Исходное изображение дома — световая схема" draggable="false" />'+
       '<div id="formaSunStudioImageArea" class="forma-sunstudio-image-area">'+
        '<div id="formaSunStudioGrade" class="forma-sunstudio-light-grade" aria-hidden="true"></div>'+
        '<svg class="forma-sunstudio-orbit" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">'+
         '<ellipse cx="500" cy="300" rx="410" ry="242" class="forma-sunstudio-orbit-path"/>'+
         '<path d="M 140 380 Q 500 670 860 380" class="forma-sunstudio-orbit-forward"/>'+
         '<line id="formaSunStudioDirectionLine" x1="500" y1="300" x2="160" y2="120" class="forma-sunstudio-direction-line"/>'+
         '<line id="formaSunStudioShadowLine" x1="500" y1="300" x2="730" y2="450" class="forma-sunstudio-shadow-line"/>'+
         '<circle cx="500" cy="300" r="4" class="forma-sunstudio-center"/>'+
        '</svg>'+
        '<div class="forma-sunstudio-marker" id="formaSunStudioMarker" aria-hidden="true"><span></span></div>'+
        '<div class="forma-sunstudio-shadow-marker" id="formaSunStudioShadowMarker" aria-hidden="true">ТЕНИ</div>'+
       '</div>'+
       '<span class="forma-sunstudio-image-note">СХЕМА СВЕТА · НЕ ГОТОВЫЙ РЕНДЕР</span>'+
      '</div>'+
      '<div class="forma-sunstudio-photo-footer"><span><i class="forma-sunstudio-photo-led"></i><strong id="formaSunStudioDirectionName">Спереди слева</strong></span><small>Свет и тени будут рассчитаны AI при генерации</small></div>'+
     '</div>'+
     '<div class="forma-sunstudio-control-stack">'+
      '<section class="forma-sunstudio-control"><header><span>01</span><div><strong>Направление солнца</strong><small>Относительно камеры и фасада дома</small></div></header><div class="forma-sunstudio-direction-grid" role="group" aria-label="Направление света">'+dirBtns+'</div></section>'+
      '<section class="forma-sunstudio-control"><header><span>02</span><div><strong>Высота солнца</strong><small>Влияет на длину теней</small></div></header><div class="forma-sunstudio-height-grid" role="group" aria-label="Высота солнца">'+heightBtns+'</div></section>'+
      '<section class="forma-sunstudio-control"><header><span>03</span><div><strong>Характер теней</strong><small>Выберите мягкость и контраст</small></div></header><div class="forma-sunstudio-shadow-grid" role="group" aria-label="Характер теней">'+shadowBtns+'</div></section>'+
      '<section id="formaSunStudioIndoor" class="forma-sunstudio-control forma-sunstudio-indoor" hidden><header><span>04</span><div><strong>Источники света</strong><small>Для интерьерной фотографии</small></div></header><div class="forma-sunstudio-indoor-grid" role="group" aria-label="Тип интерьерного света">'+indoorBtns+'</div></section>'+
     '</div>'+
    '</div>'+
    '<div class="forma-sunstudio-info" id="formaSunStudioNightNote" hidden>При выбранной ночной атмосфере солнечный свет не действует. Выберите дневное время для видимого солнечного эффекта.</div>'+
    '<footer class="forma-sunstudio-footer"><div><strong id="formaSunStudioResultSummary">Контровой свет · естественные тени</strong><small>Изображение не изменяется до запуска AI</small></div>'+
    '<button type="button" class="forma-sunstudio-secondary" data-sun-save>Сохранить свет</button>'+
    '<button type="button" class="forma-sunstudio-primary" data-sun-continue>Далее · окружение <span aria-hidden="true">↗</span></button></footer>'+
   '</section>';
  docBody().append(root);
  const img=$('#formaSunStudioSource',root);
  img.addEventListener('load',layoutOverlay);
  root.addEventListener('click',e=>{
   if(e.target.closest('[data-sun-close]')){close();return}
   const d=e.target.closest('[data-sun-direction]'),h=e.target.closest('[data-sun-height]'),sh=e.target.closest('[data-sun-shadow]');
   if(d){scene.direction=d.dataset.sunDirection;persist();render();return}
   if(h){scene.elevation=h.dataset.sunHeight;persist();render();return}
   if(sh){scene.shadow=sh.dataset.sunShadow;persist();render();return}
   const indoor=e.target.closest('[data-sun-indoor-source]');if(indoor){scene.indoorSource=indoor.dataset.sunIndoorSource;persist();render();return}
   if(e.target.closest('[data-sun-save]')){persist();close();return}
   if(e.target.closest('[data-sun-continue]')){
    persist();const existing=!!SOURCE().hasRender;
    if(existing){
     if(!confirm('Переосветить готовое изображение в выбранном направлении? Это один новый платный AI-запрос; предыдущий результат сохраняется.'))return;
     close();B()?.relight?.();
    }else{
     close();if(window.FORMA_SCENE_QUICK?.open)window.FORMA_SCENE_QUICK.open();
     else ($('[data-mobile="environment"]')||$('[data-tab="environment"]'))?.click();
    }
   }
  });
  root.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;
   const focusable=[...root.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length);
   if(!focusable.length)return;
   if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus()}
   else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus()}
  });
  return root;
 }
 function layoutOverlay(){
  const photo=$('#formaSunStudioPhoto'),img=$('#formaSunStudioSource'),area=$('#formaSunStudioImageArea');
  if(!photo||!img||!area||!img.naturalWidth)return;
  const bounds=photo.getBoundingClientRect(),ratio=img.naturalWidth/img.naturalHeight;
  if(!bounds.width||!bounds.height)return;
  const displayedW=Math.min(bounds.width,bounds.height*ratio),displayedH=displayedW/ratio;
  area.style.left=((bounds.width-displayedW)/2)+'px';
  area.style.top=((bounds.height-displayedH)/2)+'px';
  area.style.width=displayedW+'px';area.style.height=displayedH+'px';
 }
 function render(){
  const root=$('#formaSunStudio');if(!root)return;
  const d=direction(scene.direction),h=height(scene.elevation),sh=shadow(scene.shadow);
  for(const [attribute,value] of [['data-sun-direction',scene.direction],['data-sun-height',scene.elevation],['data-sun-shadow',scene.shadow]]){
   root.querySelectorAll('['+attribute+']').forEach(button=>{
    const active=button.getAttribute(attribute)===value;
    button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));
   });
  }
  const interior=interiorMode(),indoor=$('#formaSunStudioIndoor',root);
  if(indoor)indoor.hidden=!interior;
  root.classList.toggle('is-interior',interior);
  const kicker=root.querySelector('.forma-sunstudio-kicker');if(kicker)kicker.textContent=interior?'FORMA / LIGHT STUDIO':'FORMA / SUN STUDIO';
  const head=root.querySelector('.forma-sunstudio-control-stack .forma-sunstudio-control header strong');
  if(head)head.textContent=interior?'Направление дневного света':'Направление солнца';
  const infoText=root.querySelector('.forma-sunstudio-visual-head>span:first-child');
  if(infoText)infoText.textContent=interior?'01 / ИНТЕРЬЕРНОЕ ОСВЕЩЕНИЕ':'01 / СВЕТОВАЯ СХЕМА';
  root.querySelectorAll('[data-sun-indoor-source]').forEach(b=>{
   const active=b.dataset.sunIndoorSource===scene.indoorSource;
   b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));
  });
  const area=$('#formaSunStudioImageArea');if(area){
   area.dataset.lightDirection=d.id;area.dataset.shadow=sh.id;area.dataset.elevation=h.id;
   const pin=$('#formaSunStudioMarker'),shadowPin=$('#formaSunStudioShadowMarker');
   pin.style.left=(d.x*100)+'%';pin.style.top=(d.y*100)+'%';
   const dx=d.x-.5,dy=d.y-.5,len=Math.hypot(dx,dy)||1;
   const targetX=Math.max(.13,Math.min(.87,.5-dx/len*.37));
   const targetY=Math.max(.15,Math.min(.85,.5-dy/len*.33));
   shadowPin.style.left=(targetX*100)+'%';shadowPin.style.top=(targetY*100)+'%';
   const ray=$('#formaSunStudioDirectionLine'),shade=$('#formaSunStudioShadowLine');
   if(ray){ray.setAttribute('x2',String(Math.round(d.x*1000)));ray.setAttribute('y2',String(Math.round(d.y*600)))}
   if(shade){shade.setAttribute('x2',String(Math.round(targetX*1000)));shade.setAttribute('y2',String(Math.round(targetY*600)))}
   const grade=$('#formaSunStudioGrade');
   if(grade){
    const strength=sh.id==='soft'?.10:sh.id==='cinematic'?.3:sh.id==='defined'?.24:.16;
    grade.style.background='radial-gradient(circle at '+Math.round(d.x*100)+'% '+Math.round(d.y*100)+'%, rgba(245,217,158,'+(strength*.9).toFixed(2)+') 0%, transparent 39%), linear-gradient('+Math.round(Math.atan2(-dy,-dx)*180/Math.PI)+'deg, rgba(4,13,15,'+(strength*.52).toFixed(2)+'), transparent 67%)';
   }
  }
  $('#formaSunStudioDirectionName').textContent=d.name;
  $('#formaSunStudioLiveStatus').textContent=d.desc.toUpperCase();
  $('#formaSunStudioResultSummary').textContent=interior?'Интерьер · '+source(scene.indoorSource).name+' · '+sh.name.toLowerCase()+' тени':d.desc+' · '+h.hint.toLowerCase()+' · '+sh.name.toLowerCase()+' тени';
  const info=SOURCE();const night=info.explicit?.time&&/ночь|night/i.test(String(info.time||''));
  $('#formaSunStudioNightNote').hidden=!night;
  const continueButton=root.querySelector('[data-sun-continue]');
  if(continueButton)continueButton.innerHTML=info.hasRender?'Переосветить рендер · AI <span aria-hidden="true">↗</span>':'Далее · окружение <span aria-hidden="true">↗</span>';
 }
 function open(){
  if(!SOURCE().hasSource)return;
  const root=build();scene=infoFromState();userMoved=false;previousFocus=document.activeElement;
  const img=$('#formaSunStudioSource'),url=SOURCE().hasRender&&SOURCE().renderImage?SOURCE().renderImage:SOURCE().sourceImage||'';
  if(img.src!==url)img.src=url;
  root.hidden=false;visible=true;docBody().classList.add('forma-sunstudio-open');
  render();requestAnimationFrame(layoutOverlay);
  root.querySelector('[data-sun-direction="'+scene.direction+'"]')?.focus({preventScroll:true});
 }
 function close(){
  const root=$('#formaSunStudio');if(!root||root.hidden)return;
  root.hidden=true;visible=false;docBody().classList.remove('forma-sunstudio-open');
  if(previousFocus?.isConnected&&previousFocus!==docBody())previousFocus.focus({preventScroll:true});
  previousFocus=null;refreshLauncher();
 }
 function init(){
  build();makeLauncher();refreshLauncher();
  document.addEventListener('forma:project-ready',refreshLauncher);
  document.addEventListener('forma:source-uploaded',refreshLauncher);
  document.addEventListener('forma:sun-updated',refreshLauncher);
  window.addEventListener('resize',()=>{if(visible)layoutOverlay()},{passive:true});
  if(typeof ResizeObserver!=='undefined'){new ResizeObserver(()=>{if(visible)layoutOverlay()}).observe($('#formaSunStudioPhoto'))}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FORMA_SUN_STUDIO={open,close,refresh:refreshLauncher,get state(){return {...scene}}};
})();