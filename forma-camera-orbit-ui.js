/* FORMA CAMERA ORBIT — the approved photograph defines the site.
   Optional CAD screenshot defines the new camera and house geometry. */
(() => {
 'use strict';
 let dialog=null,entry=null,onResult=null,busy=false,reference=null;
 const $=(s,r=document)=>r.querySelector(s);
 const fileToDataURL=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(Error('Не удалось прочитать скриншот'));r.readAsDataURL(file)});
 async function asDataURL(url){
  if(/^data:image\/(png|jpeg|webp);base64,/i.test(url||''))return url;
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Готовый кадр недоступен');
  const blob=await r.blob();if(!/^image\/(png|jpeg|webp)$/.test(blob.type))throw Error('Для ракурса нужен PNG, JPEG или WebP.');
  return fileToDataURL(blob);
 }
 function message(txt){const e=$('#formaOrbitStatus',dialog);if(e)e.textContent=txt}
 function orbit(){return {
  direction:dialog.querySelector('[name="orbitDirection"]:checked')?.value||'right',
  degrees:Number(dialog.querySelector('[name="orbitDegrees"]:checked')?.value||30),
  sourceMode:reference?'cad':'inferred'};}
 function close(){if(busy)return;dialog?.close();dialog?.remove();dialog=null;entry=null;onResult=null;reference=null}
 function open(input={},onComplete){
  if(busy||!input.image||input.kind==='video')return false;
  if(dialog)close();entry=input;onResult=typeof onComplete==='function'?onComplete:null;
  dialog=document.createElement('dialog');dialog.id='formaCameraOrbitDialog';dialog.setAttribute('aria-label','Новый ракурс дома');
  dialog.innerHTML=[
   '<section class="fa-orbit-sheet">',
    '<header><span>ФОРМА / КАМЕРА ВОКРУГ ДОМА</span><button type="button" data-orbit-close aria-label="Закрыть">×</button></header>',
    '<div class="fa-orbit-content">',
     '<div class="fa-orbit-before"><img alt="Утверждённый предыдущий ракурс и окружение"><small>Фиксируем дом, растения, дорожки и атмосферу этого кадра</small></div>',
     '<div class="fa-orbit-editor">',
      '<h2>Тот же дом. Новая точка съёмки.</h2>',
      '<p>Камера поворачивается вокруг здания. Дом и участок не заменяются — ориентиры должны менять положение только в перспективе.</p>',
      '<fieldset><legend>Направление камеры</legend><div class="fa-orbit-options">',
       '<label><input type="radio" name="orbitDirection" value="left"> ↶ Влево</label>',
       '<label><input type="radio" name="orbitDirection" value="right" checked> Вправо ↷</label>',
      '</div></fieldset>',
      '<fieldset><legend>Угол поворота</legend><div class="fa-orbit-options fa-orbit-degrees">',
       '<label><input type="radio" name="orbitDegrees" value="30" checked>30°</label>',
       '<label><input type="radio" name="orbitDegrees" value="45">45°</label>',
       '<label><input type="radio" name="orbitDegrees" value="90">90°</label>',
      '</div></fieldset>',
      '<div class="fa-orbit-cad"><b>Точная архитектура — дополнительный CAD-ракурс</b>',
       '<p>Если есть новый вид из SketchUp, Revit или Archicad, загрузите его. Он определит геометрию и камеру; готовая фотография сохранит единый участок.</p>',
       '<label class="fa-orbit-file">＋ Загрузить новый ракурс<input id="formaOrbitCad" type="file" accept="image/png,image/jpeg,image/webp"></label>',
       '<button type="button" data-orbit-clear hidden>Убрать файл</button>',
       '<span id="formaOrbitFileName">Без второго ракурса AI приблизительно достраивает скрытые стороны.</span>',
      '</div>',
      '<p id="formaOrbitStatus" role="status" aria-live="polite">Новый ракурс — отдельная платная AI-генерация. Исходное изображение останется в истории.</p>',
      '<button type="button" data-orbit-run>Создать ракурс · 1 AI-запрос</button>',
     '</div>',
    '</div>',
   '</section>'
  ].join('');
  $('#formaOrbitCad',dialog).addEventListener('change',async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>14*1024*1024||file.size<100)throw Error('PNG, JPG или WebP до 14 МБ.');
    reference=await fileToDataURL(file);
    $('#formaOrbitFileName',dialog).textContent=file.name.slice(0,75)+' · геометрия из нового кадра';
    $('[data-orbit-clear]',dialog).hidden=false;message('Используем новый CAD-ракурс для камеры и прежний рендер для участка.');
   }catch(error){reference=null;event.target.value='';message(error.message||'Файл не прочитан');}
  });
  $('[data-orbit-clear]',dialog).addEventListener('click',()=>{reference=null;$('#formaOrbitCad',dialog).value='';$('#formaOrbitFileName',dialog).textContent='Без второго ракурса AI приблизительно достраивает скрытые стороны.';$('[data-orbit-clear]',dialog).hidden=true;});
  $('[data-orbit-close]',dialog).addEventListener('click',close);
  $('[data-orbit-run]',dialog).addEventListener('click',generate);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  document.body.append(dialog);$('.fa-orbit-before img',dialog).src=input.image;dialog.showModal();return true;
 }
 async function generate(){
  if(busy||!entry?.image)return;
  const bridge=window.FORMA_ART_BRIDGE,snapshot=bridge?.snapshot?.();
  if(!snapshot?.hasSource||snapshot.demo){message('Нужен собственный проект и готовый рендер.');return}
  if(snapshot.busy||window.FORMA_NODE_ENGINE?.busy){message('Сначала завершите другую генерацию.');return}
  if(!bridge.acquire()){message('Другая AI-генерация уже выполняется.');return}
  busy=true;const run=$('[data-orbit-run]',dialog);
  run.disabled=true;run.textContent='Создаём ракурс…';
  try{
   const image=await asDataURL(entry.image),cameraOrbit=orbit();
   message('Фиксируем окружение и перемещаем камеру вокруг дома. Исходный кадр сохраняется.');
   const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({image,reference:reference||null,cameraOrbit,brief:{sceneType:'exterior'},quality:'high',quantity:1}),
    signal:AbortSignal.timeout(240000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.images?.[0])throw Error(data.error||'Не удалось создать новый ракурс.');
   const result='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
   message('Готовый кадр получен. Сохраняем в проекте…');
   await bridge.saveResult(result,'Ракурс · '+(cameraOrbit.direction==='left'?'влево':'вправо')+' '+cameraOrbit.degrees+'°',{...snapshot,image});
   busy=false;const finish=onResult;close();finish?.();return;
  }catch(error){message(error?.name==='TimeoutError'?'Ответ задержался; запрос мог быть оплачен. Проверьте историю перед повтором.':error.message||'Ошибка создания ракурса.');}
  finally{busy=false;bridge.release();if(run?.isConnected){run.disabled=false;run.textContent='Повторить ракурс · 1 AI-запрос';}}
 }
 window.FORMA_CAMERA_ORBIT={open,close};
})();