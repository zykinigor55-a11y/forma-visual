/* FORMA / LIGHT TRACE v24 — elapsed-time estimate on a subtle line, not actual AI progress.
 * The provider does not expose completion percentages or ETA. Never claim otherwise. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 let active=false,completed=false,phase='prepare',started=0,clock=null,minimized=false,successTimer=null;
 let mini=null;
 const phases=['prepare','ai','save'];
 const historyKey='forma-render-real-durations-v1';
 let observedEstimate=null,estimateSource='heuristic';
 const estimateFallback=120; // labelled approximate; AI backend does not stream percent or ETA
 function history(){
  try{const data=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(data)?data.filter(n=>Number.isFinite(n)&&n>=5&&n<=360).slice(-15):[]}
  catch{return []}
 }
 function median(samples){
  const sorted=[...samples].sort((a,b)=>a-b);
  return sorted.length?sorted[Math.floor(sorted.length/2)]:null;
 }
 function estimateLabel(seconds){
  if(completed)return 'Готово';
  if(observedEstimate==null)return 'Ориентир: условные 2 минуты, AI не сообщает ETA';
  const left=Math.round(observedEstimate-seconds);
  return left>0?'Ориентир ещё ≈ '+readableTime(left):'Дольше среднего · ожидаем ответ AI';
 }
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
  const host=document.querySelector('dialog[open]')||document.body;
  if(el&&el.parentNode!==host)host.appendChild(el);
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
 function updateEstimate(seconds){
  const eta=observedEstimate??estimateFallback;
  // Time-based, advisory progress ONLY. Never report as a provider completion metric.
  // At the estimate threshold stop at 94%, then wait for the actual server reply.
  let pct=completed?100:Math.min(94,Math.round(Math.max(0,seconds)/eta*90));
  if(!completed&&seconds>=eta)pct=Math.min(94,90+Math.floor(Math.log2(Math.max(1,seconds/eta))*3));
  const pctLabel=$('renderProgressPercent'),remaining=$('renderProgressEta');
  const bar=$('renderProgressBar');
  if(pctLabel)pctLabel.textContent=(completed?'':'≈ ')+pct+'%';
  if(bar)bar.style.width=pct+'%';
  if(remaining){
   const left=Math.round(eta-seconds);
   remaining.textContent=completed?'00:00':left>0?'≈ '+readableTime(left):'≈ больше';
   remaining.title=observedEstimate!=null?
     'Приблизительный прогноз на основании последних успешных рендеров в этом браузере.':
     'Условный ориентир 2 минуты, а не фактическое время сервера.';
  }
  const frame=document.querySelector('#renderProgress .forma-render-frame');
  if(frame)frame.dataset.progressKind=completed?'complete':observedEstimate!=null?'history':'initial';
 }
 function elapsed(){
  if(!active)return;
  const seconds=(Date.now()-started)/1000;
  const text=readableTime(seconds);
  const label=$('renderProgressElapsed');if(label)label.textContent='Прошло '+text;
  if(mini)mini.querySelector('.forma-ai-mini-time').textContent=text;
  updateEstimate(seconds);
  const remaining=$('renderProgressRemaining');
  if(remaining){
   remaining.textContent=estimateLabel(seconds);
   remaining.title=observedEstimate==null?'Сервис генерации не предоставляет точный ETA.':'Это приблизительная оценка по нескольким предыдущим успешным генерациям на этом устройстве, не прогресс от AI.';
  }
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
  const samples=history();observedEstimate=samples.length>=3?median(samples):null;
  estimateSource=observedEstimate!=null?'history':'heuristic';
  const el=overlay();if(!el)return;
  el.hidden=false;el.classList.remove('is-complete');
  miniButton().hidden=true;
  const note=$('renderProgressHint');
  if(note)note.textContent='Результат откроется автоматически после ответа AI';
  const truth=document.querySelector('.forma-render-truth-note');
  if(truth)truth.textContent=observedEstimate!=null?
   'Тонкая линия — прогноз по прошлым генерациям на этом устройстве. AI не передаёт реальные проценты и оставшееся время.':
   'Тонкая линия — условный прогноз по времени. AI не сообщает реальные проценты или срок завершения.';
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
  const seconds=Math.round((Date.now()-started)/1000);
  if(seconds>=5&&seconds<=360){
   try{localStorage.setItem(historyKey,JSON.stringify([...history(),seconds].slice(-15)))}catch{}
  }
  completed=true;setPhase('save');
  updateEstimate(seconds);
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
