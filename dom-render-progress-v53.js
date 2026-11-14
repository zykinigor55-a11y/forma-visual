/* FORMA / Graphite Atelier · real request phases, no synthetic percentages or ETA.
 * API Market does not provide a progress API. We display only states controlled
 * by the local request and actual elapsed time. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 let active=false,completed=false,phase='prepare',started=0,clock=null,minimized=false,successTimer=null;
 let mini=null;
 const phases=['prepare','ai','save'];
 function readableTime(seconds){
  const n=Math.max(0,seconds|0);
  return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 }
 function miniButton(){
  if(mini&&mini.isConnected)return mini;
  mini=document.createElement('button');
  mini.type='button';mini.className='forma-ai-mini';mini.hidden=true;
  mini.setAttribute('aria-label','Развернуть ход генерации');
  mini.innerHTML='<span class="forma-ai-mini-dot" aria-hidden="true"></span><span class="forma-ai-mini-title">ФОРМА · AI-рендер</span><span class="forma-ai-mini-time">00:00</span><span class="forma-ai-mini-chevron" aria-hidden="true">↗</span>';
  mini.addEventListener('click',()=>expand());
  document.body.appendChild(mini);return mini;
 }
 function overlay(){
  const el=$('renderProgress');
  if(el&&el.parentNode!==document.body)document.body.appendChild(el);
  return el;
 }
 function syncScene(){
  const source=$('beforeImg');
  const preview=$('renderProgressSource');
  if(preview){const candidate=window.FORMA_RELIGHT_PREVIEW||(source?.currentSrc||source?.src);if(candidate&&preview.src!==candidate)preview.src=candidate;}
  const settings=$('renderSummaryLine')?.textContent?.trim()||$('summaryLine')?.textContent?.trim();
  const summary=$('renderProgressScene');
  if(summary)summary.textContent=(settings||'Архитектурная визуализация').slice(0,165);
 }
 function setPhase(next){
  if(!phases.includes(next))next='prepare';
  phase=next;
  const el=overlay();
  if(!el)return;
  el.dataset.phase=next;
  el.querySelectorAll('.render-progress-step').forEach((step,i)=>{
   const n=phases.indexOf(next);
   step.classList.toggle('is-active',!completed&&i===n);
   step.classList.toggle('is-done',completed||i<n);
  });
  if(mini)mini.querySelector('.forma-ai-mini-title').textContent=completed?'ФОРМА · Результат готов':next==='ai'?'ФОРМА · AI-рендер':next==='save'?'ФОРМА · Сохраняем':'ФОРМА · Подготовка';
 }
 function elapsed(){
  if(!active)return;
  const seconds=(Date.now()-started)/1000;
  const text=readableTime(seconds);
  const label=$('renderProgressElapsed');if(label)label.textContent='Прошло '+text;
  if(mini)mini.querySelector('.forma-ai-mini-time').textContent=text;
 }
 function expand(){
  if(!active)return;
  minimized=false;overlay().hidden=false;miniButton().hidden=true;
  document.documentElement.classList.add('forma-progress-expanded');
 }
 function shrink(){
  if(!active)return;
  minimized=true;overlay().hidden=true;miniButton().hidden=false;
  document.documentElement.classList.remove('forma-progress-expanded');
 }
 function begin(){
  if(successTimer){clearTimeout(successTimer);successTimer=null}
  if(clock)clearInterval(clock);
  active=true;completed=false;started=Date.now();minimized=false;
  const el=overlay();if(!el)return;
  el.hidden=false;el.classList.remove('is-complete');
  miniButton().hidden=true;
  const note=$('renderProgressHint');
  if(note)note.textContent='Результат откроется автоматически, когда кадр будет готов';
  syncScene();setPhase('prepare');elapsed();
  clock=setInterval(elapsed,1000);
  document.documentElement.classList.add('forma-progress-expanded');
 }
 function update(title,detail){
  if(!active||completed)begin();
  if($('renderProgressTitle'))$('renderProgressTitle').textContent=title||'Создаём архитектурный кадр';
  if($('renderProgressDetail'))$('renderProgressDetail').textContent=detail||'Обрабатываем сцену';
  const t=String(title||'');
  const next=/сохраня|сохранение|галере|готовый результат/i.test(t)?'save':
   /кадр\s*\d|генераци|созда[её][тм]|рендер|обрабатыва/i.test(t)?'ai':'prepare';
  setPhase(next);
  if(window.FORMA_RELIGHT_PREVIEW)syncScene();
  if(!minimized)overlay().hidden=false;
 }
 function complete(){
  if(!active)return;
  completed=true;setPhase('save');
  const el=overlay();if(el)el.classList.add('is-complete');
  if($('renderProgressTitle'))$('renderProgressTitle').textContent='Архитектурный кадр готов';
  if($('renderProgressDetail'))$('renderProgressDetail').textContent='Результат получен и добавлен в проект';
  if($('renderProgressHint'))$('renderProgressHint').textContent='Готово · кадр сохранён';
  elapsed();
 }
 function stop(){
  if(clock){clearInterval(clock);clock=null}
  if(successTimer){clearTimeout(successTimer);successTimer=null}
  const el=overlay(),miniEl=miniButton();
  const wasSuccessful=active&&completed;
  active=false;minimized=false;miniEl.hidden=true;
  document.documentElement.classList.remove('forma-progress-expanded');
  if(el){
   if(wasSuccessful){
    successTimer=setTimeout(()=>{if(!active){el.hidden=true;el.classList.remove('is-complete')}successTimer=null},420);
   }else{el.hidden=true;el.classList.remove('is-complete')}
  }
  return !!el;
 }
 document.addEventListener('click',event=>{
  if(event.target.closest('#renderProgressMinimize'))shrink();
 });
 window.DOM_RENDER_PROGRESS={update,complete,stop,expand,collapse:shrink,get active(){return active}};
})();
