/* DOM.RENDER • Real request state + ESTIMATED image generation progress v53.
 * API Market does not expose an exact completion percentage. Never claim
 * server-sourced accuracy, never show 100% before receipt and persistence.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let active=false,completed=false,phase='prepare',percent=0,aiStarted=0,phaseStarted=0;
 let batchTotal=0,batchIndex=0,runner=null,hideTimer=null,lastReported=-1;
 const clocks=()=>Date.now();
 const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
 function nodes(){return {
  panel:$('renderProgress'),percent:$('renderProgressPercent'),remaining:$('renderProgressRemaining'),
  meter:$('renderProgressMeter'),bar:$('renderProgressBar'),
  hint:$('renderProgressHint'),steps:document.querySelectorAll('#renderProgress .render-progress-step')
 }}
 function paint(){
  const n=nodes();
  if(!n.panel)return;
  const value=clamp(Math.round(percent),0,100);
  if(n.percent)n.percent.textContent=value+'%';
  if(n.remaining)n.remaining.textContent=value===100?'Завершено':('Осталось ≈ '+(100-value)+'%');
  if(n.bar)n.bar.style.width=value+'%';
  if(n.meter&&lastReported!==Math.floor(value/5)){
   lastReported=Math.floor(value/5);
   n.meter.setAttribute('aria-valuenow',String(value));
   n.meter.setAttribute('aria-valuetext',value===100?'Результат сохранён':'Ориентировочно '+value+' процентов выполнено');
  }
  if(n.hint){
   n.hint.textContent=completed
    ?'Результат получен и сохранён в проекте.'
    :phase==='ai'&&clocks()-aiStarted>125000
     ?'AI продолжает обработку. Процент расчётный: API Market не передаёт фактический прогресс.'
     :'Процент ориентировочный: API Market не передаёт точный ход выполнения.';
  }
  const activeIndex=completed?3:phase==='prepare'?0:phase==='ai'?1:2;
  n.steps.forEach((el,i)=>{
   el.classList.toggle('is-active',i===activeIndex);
   el.classList.toggle('is-done',i<activeIndex);
  });
  n.panel.classList.toggle('is-complete',completed);
 }
 function estimate(){
  if(!active||completed)return;
  const elapsed=(clocks()-phaseStarted)/1000;
  let target=percent;
  if(phase==='prepare')target=Math.max(target,2+6*(1-Math.exp(-elapsed/12)));
  if(phase==='ai'){
   const aiElapsed=(clocks()-aiStarted)/1000;
   if(batchIndex&&batchTotal){
    const slice=100/batchTotal;
    const floor=slice*(batchIndex-1);
    target=Math.max(target,floor+2+(slice-3)*(1-Math.exp(-aiElapsed/40)));
    target=Math.min(target,Math.min(99,floor+slice-1));
   }else{
    target=Math.max(target,11+82*(1-Math.exp(-aiElapsed/54)));
    target=Math.min(target,93);
   }
  }
  if(phase==='save')target=Math.max(target,96);
  percent=Math.min(99,Math.max(percent,target));
  paint();
 }
 function begin(){
  if(hideTimer){clearTimeout(hideTimer);hideTimer=null}
  active=true;completed=false;phase='prepare';phaseStarted=clocks();
  aiStarted=0;batchIndex=0;batchTotal=0;percent=2;lastReported=-1;
  if(runner)clearInterval(runner);
  runner=setInterval(estimate,760);
  const n=nodes();if(n.panel)n.panel.hidden=false;
  paint();
 }
 function update(title,detail){
  if(!active||completed)begin();
  const t=String(title||'');
  const frame=t.match(/Кадр\s+(\d+)\s+из\s+(\d+)/i);
  if(frame){
   const idx=Number(frame[1]),total=Number(frame[2]);
   if(idx>=1&&total>=2&&idx<=total){
    const newFrame=batchIndex!==idx||batchTotal!==total;
    batchIndex=idx;batchTotal=total;
    if(newFrame){aiStarted=clocks();phaseStarted=aiStarted;percent=Math.max(percent,Math.floor(100*(idx-1)/total)+2)}
   }
  }
  let next='prepare';
  if(/сохраня|сохранение|галере|готовый результат/i.test(t))next='save';
  else if(frame||/генераци|созда[её][тм]|рендер|обрабатыва/i.test(t))next='ai';
  if(next!==phase){
   phase=next;phaseStarted=clocks();
   if(next==='ai')aiStarted=clocks();
   if(next==='save')percent=Math.max(percent,96);
  }
  if(phase==='ai'&&!aiStarted)aiStarted=clocks();
  estimate();
 }
 function complete(){
  if(!active)return;
  completed=true;phase='save';percent=100;
  if(runner){clearInterval(runner);runner=null}
  paint();
 }
 function stop(){
  if(runner){clearInterval(runner);runner=null}
  if(hideTimer){clearTimeout(hideTimer);hideTimer=null}
  const n=nodes();
  const success=active&&completed;
  active=false;
  if(success){
   hideTimer=setTimeout(()=>{
    if(!active&&n.panel){n.panel.hidden=true;n.panel.classList.remove('is-complete')}
    hideTimer=null;
   },750);
  }else{
   if(n.panel){n.panel.hidden=true;n.panel.classList.remove('is-complete')}
  }
  return !!n.panel;
 }
 window.DOM_RENDER_PROGRESS={update,complete,stop};
})();