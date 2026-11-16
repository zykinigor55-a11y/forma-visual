/* FORMA RENDER QUEUE — shared client for every image tool.
 * Enqueues each paid request exactly once, polls its result after network
 * interruptions and exposes status without asking a provider to regenerate.
 * Old cached pages still work via the compatible /api/render endpoint.
 */
(()=>{
 'use strict';
 if(window.FORMA_RENDER_QUEUE)return;
 const PREFIX='/api/render/jobs';
 const WAIT_LIMIT=16*60*1000;
 const RECOVERY_KEY='forma:last-render-job:v1';
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const guid=()=>window.crypto?.randomUUID?.()||('forma-'+Date.now()+'-'+Math.random().toString(36).slice(2).padEnd(16,'0'));
 const fallbackResponse=(status,message,code='job_failed')=>new Response(JSON.stringify({error:message,code}),{status,headers:{'Content-Type':'application/json'}});
 function tell(stage,meta){
  const status=stage==='queued'?'В очереди · позиция '+Math.max(1,meta.position||1):
   stage==='running'?'AI генерирует изображение. Это может занять несколько минут.':
   stage==='completed'?'Генерация завершена. Сохраняем изображение…':
   stage==='recovering'?'Восстанавливаем результат ранее отправленного задания…':
   stage==='failed'?'Генерация не удалась. Повторный запрос автоматически не отправлялся.':'';
  document.dispatchEvent(new CustomEvent('forma:render-job-status',{detail:{...meta,status:stage,message:status}}));
  const progress=document.getElementById('renderProgress');
  if(progress&&!progress.hidden){
   const detail=document.getElementById('renderProgressDetail');
   if(detail&&status)detail.textContent=status;
   const hint=document.getElementById('renderProgressHint');
   if(hint&&stage==='queued')hint.textContent='Рендер запустится автоматически, когда сервер освободится. Не нажимайте создание повторно.';
  }
  for(const selector of ['#artStatus','#formaEnhanceStatus']){
   const element=document.querySelector(selector);
   if(element&&element.closest('dialog[open]'))element.textContent=status;
  }
 }
 function remember(record){
  try{localStorage.setItem(RECOVERY_KEY,JSON.stringify(record))}catch{}
 }
 function forget(jobId){
  try{
   const old=JSON.parse(localStorage.getItem(RECOVERY_KEY)||'null');
   if(old?.jobId===jobId)localStorage.removeItem(RECOVERY_KEY);
  }catch{}
 }
 async function recoverLast(){
  let job;try{job=JSON.parse(localStorage.getItem(RECOVERY_KEY)||'null')}catch{return null}
  if(!job?.jobId||!/^[a-f0-9]{48}$/.test(job.jobId)||Date.now()-(job.created||0)>20*60*1000)return null;
  const status=await fetch(PREFIX+'/'+job.jobId,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  if(!status)return null;
  return { ...job, ...status };
 }
 async function queuedFetch(url,options={}){
  if(url!=='/api/render')return fetch(url,options);
  const key='forma-'+guid();
  const request={method:'POST',headers:{...Object.fromEntries(new Headers(options.headers||{}).entries()),'X-Forma-Idempotency-Key':key},
   body:options.body,credentials:'same-origin',cache:'no-store'};
  let res;
  // Network failure after a successful server accept is ambiguous; use the
  // SAME idempotency key, never a fresh one, for a single safe retry.
  for(let attempt=0;attempt<2;attempt++){
   try{res=await fetch(PREFIX,request);break}
   catch(error){if(attempt)throw new Error('Нет связи с сервером. Повторная платная генерация не запускалась.');await pause(1600);}
  }
  if(!res.ok)return res;
  const job=await res.json().catch(()=>null);
  if(!job?.jobId)return fallbackResponse(502,'Сервер не выдал номер задания.');
  const snap=window.FORMA_ART_BRIDGE?.snapshot?.();
  remember({jobId:job.jobId,key,created:Date.now(),projectId:snap?.projectId||null,sourceKey:snap?.sourceKey||null});
  return await waitForJob(job);
 }
 async function waitForJob(job){
  const started=Date.now();
  let state=job,failures=0,lastStatus='',lastPosition=-1;
  while(Date.now()-started<WAIT_LIMIT){
   const phase=state.status;
   if(phase!==lastStatus||phase==='queued'&&state.position!==lastPosition){
    tell(phase,state);lastStatus=phase;lastPosition=state.position;
   }
   if(phase==='completed'){
    tell('completed',state);
    for(let attempt=0;attempt<3;attempt++){
     try{
      const imageResult=await fetch(PREFIX+'/'+job.jobId+'/result',{cache:'no-store',credentials:'same-origin'});
      if(imageResult.ok){forget(job.jobId);return imageResult;}
      if(imageResult.status!==502&&imageResult.status!==503) return imageResult;
     }catch{}
     await pause(1800);
    }
    return fallbackResponse(503,'Изображение готово, но соединение прервалось. Номер задания: '+job.jobId+'. Его можно восстановить без повторной генерации.','result_download_failed');
   }
   if(phase==='failed'){
    tell('failed',state);
    return fallbackResponse(state.error?.status||502,state.error?.message||'Генерация не выполнена.',state.error?.code||'render_failed');
   }
   await pause(Math.max(1200,Math.min(5000,Number(state.pollAfterMs)||2500)));
   try{
    const next=await fetch(PREFIX+'/'+job.jobId,{cache:'no-store',credentials:'same-origin'});
    if(next.status===404)return fallbackResponse(404,'Результат задания недоступен после перезапуска сервера. Номер: '+job.jobId+'. Проверьте расходы перед повтором.','job_missing');
    if(!next.ok)throw new Error('Сервер временно недоступен');
    state=await next.json();
    failures=0;
   }catch(error){
    failures++;
    tell('recovering',{...state,jobId:job.jobId});
    if(failures>=18)return fallbackResponse(503,'Связь с сервером потеряна. Номер задания: '+job.jobId+'. Проверьте его статус перед новой генерацией.','connection_lost');
    await pause(Math.min(10000,1800*failures));
   }
  }
  return fallbackResponse(504,'Превышено время ожидания очереди. Не отправляйте повторную генерацию без проверки задания '+job.jobId+'.','job_wait_timeout');
 }
 function showRecovery(){
  recoverLast().then(last=>{
   if(!last||last.status==='failed'||document.getElementById('formaQueueRecover'))return;
   const banner=document.createElement('aside');banner.id='formaQueueRecover';banner.className='forma-queue-recover';
   banner.setAttribute('aria-label','Восстановление последнего рендера');
   banner.innerHTML='<div class="forma-queue-recover-copy"><strong>Есть незавершённый AI-рендер</strong><span role="status">Проверьте задание без нового платного запроса.</span></div><button type="button" data-queue-restore>Восстановить</button><button type="button" class="forma-queue-recover-close" data-queue-hide aria-label="Скрыть">×</button>';
   document.body.append(banner);
   if(last.status==='completed')banner.querySelector('[role=status]').textContent='Готовый кадр ожидает загрузки. Повторная генерация не нужна.';
   banner.querySelector('[data-queue-hide]').addEventListener('click',()=>banner.remove());
   banner.querySelector('[data-queue-restore]').addEventListener('click',async()=>{
    const button=banner.querySelector('[data-queue-restore]'),status=banner.querySelector('[role=status]');
    button.disabled=true;button.textContent='Проверяем…';
    try{
     const response=await waitForJob(last);
     const result=await response.json().catch(()=>({error:'Некорректный ответ сервера.'}));
     if(!response.ok||!result.images?.[0])throw Error(result.error||'Результат не найден. Проверьте расход API.');
     const src='data:'+(result.mimes?.[0]||'image/png')+';base64,'+result.images[0];
     const bridge=window.FORMA_ART_BRIDGE,snap=bridge?.snapshot?.();
     const sameProject=!!(snap?.hasSource&&!snap.demo&&snap.projectId===last.projectId&&snap.sourceKey===last.sourceKey);
     const onSave=sameProject?()=>bridge.saveResult(src,'Восстановленный AI-рендер',snap):undefined;
     const shown=window.FORMA_RESULT_FOCUS?.show?.({image:src,project:snap?.projectName||'Восстановленный кадр',scene:'Результат после перезагрузки',onSave});
     if(!shown){
      const a=document.createElement('a');a.href=src;a.download='FORMA-recovered-render.png';document.body.append(a);a.click();a.remove();
      status.textContent='Кадр скачан. Его можно добавить в проект вручную.';
     }else banner.remove();
    }catch(error){status.textContent=error.message||'Не удалось восстановить кадр.'}
    finally{button.disabled=false;button.textContent='Восстановить'}
   });
  }).catch(()=>{});
 }
 window.FORMA_RENDER_QUEUE={fetch:queuedFetch,recoverLast};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showRecovery,{once:true});
 else setTimeout(showRecovery,0);
})();
