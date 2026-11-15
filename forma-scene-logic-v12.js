/* FORMA scene logic v12. Enhances the existing Scene Director without changing its AI API contract. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const bridge=()=>window.FORMA_SCENE_BRIDGE;
 const state=()=>bridge()?.get?.()||{};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
 const label=(s)=>String(s||'').trim();
 const rootId='formaSceneSheet';
 let lastValidation='',busy=false;
 function make(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
 function section(title,sub){
  const el=make('section','forma-scene-sheet-group forma-scene-logic-group');
  const head=make('div','forma-scene-sheet-group-head');
  head.append(make('strong','',title),make('small','',sub));el.append(head);return el
 }
 function sunToAngles(sun){return {azimuth:Math.round(clamp(sun?.x??.75,0,1)*360),elevation:Math.round((1-clamp(sun?.y??.25,0,1))*90)}}
 function anglesToSun(az,el,old){return {x:clamp(az,0,360)/360,y:1-clamp(el,0,90)/90,softness:old?.softness||'natural'}}
 function getChoice(group){const box=$('#'+(group==='environment'?'environmentOptions':group+'Options'));const active=box?.querySelector('[data-choice].active');return active?.dataset.choice||''}
 function checkScene(){
  const s=state(),time=label(s.time||getChoice('time')).toLowerCase(),weather=label(s.weather||getChoice('weather')).toLowerCase(),season=label(s.season||getChoice('season')).toLowerCase();
  const errors=[],warnings=[];
  const night=/night|ноч/.test(time),snow=/snow|снег/.test(weather),summer=/summer|лето/.test(season),winter=/winter|зима/.test(season);
  if(night&&s.sun)warnings.push('Ночью направление солнца не применяется: переключите время суток или сбросьте маркер.');
  if(snow&&summer)warnings.push('Летний снег требует особого климатического сценария — проверьте сочетание сезона и погоды.');
  if(winter&&/spring|flower|цветени/.test(label(s.plants).toLowerCase()))warnings.push('Зимний сезон может конфликтовать с цветущими растениями.');
  if(/fog|туман|overcast|пасмур/.test(weather)&&s.sun?.softness==='defined')warnings.push('При тумане и сплошной облачности чёткие солнечные тени обычно неправдоподобны.');
  if(!s.hasSource)errors.push('Загрузите собственное исходное изображение дома.');
  return {errors,warnings,night};
 }
 function addSolarControls(sheet){
  const sectionEl=sheet.querySelector('.forma-sun-section');if(!sectionEl)return;
  sectionEl.querySelector('.forma-solar-exact')?.remove();
  const s=state(),sun=s.sun,angles=sunToAngles(sun);
  const wrap=make('div','forma-solar-exact');
  wrap.append(make('div','forma-solar-caption','Точное управление направлением света'));
  const specs=[['azimuth','Азимут',0,360,angles.azimuth,'°'],['elevation','Высота солнца',0,90,angles.elevation,'°']];
  for(const [id,title,min,max,current,suffix] of specs){
   const row=make('label','forma-solar-row');row.htmlFor='formaSolar-'+id;
   const caption=make('span','',title);const value=make('output','',current+suffix);
   value.htmlFor='formaSolar-'+id;caption.append(value);row.append(caption);
   const range=make('input');range.type='range';range.id='formaSolar-'+id;range.min=min;range.max=max;range.step=1;range.value=current;
   range.disabled=!s.hasSource||checkScene().night;
   range.addEventListener('input',()=>{value.textContent=range.value+suffix});
   range.addEventListener('change',()=>{
    const az=Number($('#formaSolar-azimuth')?.value),el=Number($('#formaSolar-elevation')?.value);
    bridge()?.setSun?.(anglesToSun(az,el,state().sun));
    window.FORMA_SCENE_QUICK?.open?.();
    refresh()
   });
   row.append(range);wrap.append(row);
  }
  wrap.append(make('p','forma-solar-disclaimer','Азимут и высота — управляющие подсказки AI, а не точный 3D-солнечный расчёт. Существующее здание и камера должны остаться неизменными.'));
  sectionEl.append(wrap);
 }
 function addSceneValidation(sheet){
  sheet.querySelector('.forma-scene-logic-check')?.remove();
  const result=checkScene(),block=make('section','forma-scene-logic-check');
  block.setAttribute('role','status');block.setAttribute('aria-live','polite');
  const summary=result.errors.length?'Нужно исправить перед генерацией':result.warnings.length?'Проверьте сочетание условий':'Параметры сцены согласованы';
  block.append(make('strong','',summary));
  for(const e of [...result.errors,...result.warnings])block.append(make('p','',e));
  block.classList.toggle('has-errors',!!result.errors.length);
  block.classList.toggle('has-warnings',!!result.warnings.length);
  const footer=sheet.querySelector('.forma-scene-sheet-footer');footer?.parentNode.insertBefore(block,footer);
  lastValidation=summary;
  const submit=sheet.querySelector('#formaSceneQuickGenerate');
  if(submit){submit.disabled=!!result.errors.length;submit.title=result.errors.join(' ')||''}
 }
 function refresh(){const sheet=$('#'+rootId);if(!sheet||sheet.hidden)return;addSolarControls(sheet);addSceneValidation(sheet)}
 function sceneSummary(){
  const s=state(),items=[];
  for(const [id,name] of [['environment','Окружение'],['season','Сезон'],['time','Время'],['weather','Погода']]){
   if(s.explicit?.[id]){const v=getChoice(id);const option=Array.from(document.querySelectorAll('#'+(id==='environment'?'environmentOptions':id+'Options')+' [data-choice]')).find(e=>e.dataset.choice===v);
    items.push(name+': '+label(option?.querySelector('.preset-card-label')?.textContent||option?.title||v));
   }
  }
  if(s.sun){const a=sunToAngles(s.sun);items.push('Солнце: азимут '+a.azimuth+'°, высота '+a.elevation+'°, тени '+(s.sun.softness||'natural'))}
  return items.length?items.join('\n'):'Окружение и освещение по исходному изображению';
 }
 function confirmation(action){
  if(busy)return false;
  const c=checkScene();
  if(c.errors.length){alert(c.errors.join('\n'));return false}
  const cautions=c.warnings.length?'\n\nОбратите внимание:\n'+c.warnings.join('\n'):'';
  return confirm((action==='relight'?'Переосветить готовый кадр?':'Создать новый AI-рендер?')+'\n\n'+sceneSummary()+cautions+'\n\nЭто отдельный запрос к AI. Сохраните предыдущий результат. Продолжить?')
 }
 // Capture phase executes before Scene Director click handlers; do not initiate additional AI jobs.
 document.addEventListener('click',event=>{
  const target=event.target.closest('#formaSceneQuickGenerate, [data-sun-relight]');
  if(!target)return;
  const action=target.matches('[data-sun-relight]')?'relight':'generate';
  if(!confirmation(action)){event.preventDefault();event.stopImmediatePropagation();return}
  // Existing relight control already prompts; avoid redundant dialogs by retaining its prompt.
 },true);
 const observer=new MutationObserver(()=>{
  if(busy)return;
  const sheet=$('#'+rootId);if(!sheet||sheet.hidden)return;
  if(!sheet.querySelector('.forma-scene-logic-check')||!sheet.querySelector('.forma-solar-exact')){
   busy=true;try{refresh()}finally{busy=false}
  }
 });
 function init(){observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});refresh()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.FORMA_SCENE_LOGIC={checkScene,sceneSummary,sunToAngles,anglesToSun};
})();