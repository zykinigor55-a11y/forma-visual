/* FORMA / FURNITURE EDITOR — click an object, adjust a manual rectangle, replace one item.
   No automatic segmentation claims; exact outside pixels preserved by local compositing.
*/
(() => {
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let dialog=null,source=null,afterSuccess=null,original=null,selection=null,drag=null,reference=null,busy=false;
 const fileToDataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Не удалось прочитать файл.'));reader.readAsDataURL(file)});
 const imageFrom=url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Изображение не загрузилось.'));image.src=url});
 async function asDataURL(src){if(/^data:image\/(?:png|jpeg|webp);base64,/i.test(src||''))return src;const response=await fetch(src,{cache:'no-store'});if(!response.ok)throw Error('Готовый кадр недоступен');const blob=await response.blob();if(!/^image\/(?:png|jpeg|webp)$/.test(blob.type))throw Error('Выберите PNG/JPG/WebP.');return fileToDataURL(blob)}
 function status(value){const el=$('#faFurnitureStatus',dialog);if(el)el.textContent=value}
 function close(){if(busy)return;dialog?.close();dialog?.remove();dialog=null;source=null;original=null;selection=null;reference=null;drag=null;afterSuccess=null}
 function redraw(){
  const frame=$('#faFurnitureSelection',dialog),button=$('[data-furn-run]',dialog);
  if(!frame)return;
  frame.hidden=!selection;
  if(selection){frame.style.left=selection.x+'%';frame.style.top=selection.y+'%';frame.style.width=selection.w+'%';frame.style.height=selection.h+'%'}
  if(button)button.disabled=!selection||busy;
 }
 function coords(event){
  const rect=$('#faFurnitureImageStage',dialog).getBoundingClientRect();
  return {x:clamp((event.clientX-rect.left)/Math.max(rect.width,1)*100,0,100),
   y:clamp((event.clientY-rect.top)/Math.max(rect.height,1)*100,0,100)};
 }
 function pointerDown(event){
  if(busy||event.button!==0)return;
  const bounds=$('#faFurnitureImageStage',dialog),point=coords(event);
  const resize=event.target.closest('[data-furn-resize]'),move=event.target.closest('#faFurnitureSelection');
  if(!resize&&!move){
   selection={x:clamp(point.x-12,0,76),y:clamp(point.y-14,0,72),w:24,h:28};
   status('Рамка выделения установлена. Перетащите её и подгоните угол, чтобы захватить один предмет.');
  }
  drag={id:event.pointerId,kind:resize?'resize':move?'move':'new',point,start:{...selection},element:bounds};
  try{bounds.setPointerCapture(event.pointerId)}catch{}
  event.preventDefault();event.stopPropagation();redraw();
 }
 function pointerMove(event){
  if(!drag||drag.id!==event.pointerId)return;
  event.preventDefault();
  const p=coords(event),dx=p.x-drag.point.x,dy=p.y-drag.point.y,v=drag.start;
  if(drag.kind==='resize'){
   selection.w=clamp(v.w+dx,3,100-v.x);selection.h=clamp(v.h+dy,3,100-v.y);
  }else if(drag.kind==='move'){
   selection.x=clamp(v.x+dx,0,100-v.w);selection.y=clamp(v.y+dy,0,100-v.h);
  }
  redraw();
 }
 function pointerUp(event){
  if(!drag||drag.id!==event.pointerId)return;
  try{drag.element.releasePointerCapture(event.pointerId)}catch{}
  drag=null;
 }
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
 async function buildMask(imageData){
  const img=await imageFrom(imageData),w=img.naturalWidth,h=img.naturalHeight;
  if(!w||!h||w*h>25000000)throw Error('Изображение слишком большое для локальной маски.');
  const c=canvas(w,h),ctx=c.getContext('2d');
  if(!ctx)throw Error('Не удалось построить маску.');
  ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
  const box=selection;
  ctx.clearRect(Math.floor(box.x*w/100),Math.floor(box.y*h/100),Math.ceil(box.w*w/100),Math.ceil(box.h*h/100));
  return c.toDataURL('image/png');
 }
 async function protectOutside(originalData,generatedData){
  const [base,edit]=await Promise.all([imageFrom(originalData),imageFrom(generatedData)]);
  const w=base.naturalWidth,h=base.naturalHeight;
  if(w*h>25000000)throw Error('Кадр слишком велик для совмещения.'); 
  const c=canvas(w,h),ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(base,0,0,w,h);
  const rect=selection,rx=Math.round(rect.x*w/100),ry=Math.round(rect.y*h/100),
   rw=Math.min(w-rx,Math.round(rect.w*w/100)),rh=Math.min(h-ry,Math.round(rect.h*h/100));
  if(rw<2||rh<2)throw Error('Слишком маленькая область замены.');
  const second=canvas(w,h),other=second.getContext('2d',{willReadFrequently:true});
  other.drawImage(edit,0,0,w,h);
  const from=ctx.getImageData(rx,ry,rw,rh),to=other.getImageData(rx,ry,rw,rh);
  const edge=Math.max(2,Math.min(13,Math.round(Math.min(rw,rh)*.035)));
  for(let y=0;y<rh;y++){
   for(let x=0;x<rw;x++){
    const factor=Math.min(1,(x+1)/edge,(y+1)/edge,(rw-x)/edge,(rh-y)/edge);
    const alpha=clamp(factor,0,1);
    const k=(y*rw+x)*4;
    for(let j=0;j<3;j++)from.data[k+j]=Math.round(from.data[k+j]*(1-alpha)+to.data[k+j]*alpha);
   }
  }
  ctx.putImageData(from,rx,ry);return c.toDataURL('image/png');
 }
 function open(input={},onComplete=null){
  if(busy||!input?.image||input.kind==='video')return false;
  if(dialog)close();source=input;afterSuccess=typeof onComplete==='function'?onComplete:null;selection=null;reference=null;
  dialog=document.createElement('dialog');dialog.id='formaFurnitureEditor';dialog.setAttribute('aria-label','Замена предмета мебели');
  dialog.innerHTML=[
   '<section class="fa-furn-shell">',
    '<header><div><small>ФОРМА / ИНТЕРЬЕР · ОБЪЕКТ</small><h2>Заменить предмет мебели</h2></div><button type="button" data-furn-close aria-label="Закрыть">×</button></header>',
    '<div class="fa-furn-main">',
     '<div class="fa-furn-work">',
      '<div id="faFurnitureImageStage" role="group" aria-label="Нажмите на предмет и отрегулируйте рамку выделения" tabindex="0">',
       '<img id="faFurnitureOriginal" alt="Готовый интерьер">',
       '<div id="faFurnitureSelection" hidden><span class="fa-furn-corner" data-furn-resize aria-label="Изменить размер выделения">↘</span></div>',
      '</div>',
      '<p>Нажмите на предмет на фотографии. Подвиньте рамку и потяните нижний угол: выделение должно охватывать только заменяемую мебель. Автоматическое распознавание границ пока не используется.</p>',
     '</div>',
     '<div class="fa-furn-controls">',
      '<label>Что заменяем?<select id="faFurnitureType"><option value="sofa">Диван</option><option value="chair">Кресло / стул</option><option value="table">Стол</option><option value="bed">Кровать</option><option value="storage">Шкаф / стеллаж</option><option value="decor">Предмет декора</option><option value="other">Другой предмет</option></select></label>',
      '<div class="fa-furn-upload"><strong>Свой предмет</strong><label>＋ Загрузить фото нового предмета<input id="faFurnitureReference" type="file" accept="image/png,image/jpeg,image/webp"></label><span id="faFurnitureFileName">Можно без фотографии — тогда опишите замену ниже.</span><img id="faFurnitureReferencePreview" alt="Выбранный предмет мебели" hidden></div>',
      '<label>Размер по отношению к прежнему <output id="faFurnitureScaleValue">100%</output><input id="faFurnitureScale" type="range" min="60" max="140" value="100" step="5"></label>',
      '<label>Поворот предмета <output id="faFurnitureRotationValue">0°</output><input id="faFurnitureRotation" type="range" min="-15" max="15" value="0" step="5"></label>',
      '<label>Пожелание к замене<textarea id="faFurnitureNote" maxlength="280" rows="3" placeholder="Например: диван из тёплого бежевого букле, низкие ножки."></textarea></label>',
      '<p id="faFurnitureStatus" role="status" aria-live="polite">Выделите предмет. Новый кадр — отдельный платный AI-запрос; исходный интерьер останется в истории.</p>',
      '<button type="button" data-furn-run disabled>Заменить объект · 1 AI-запрос</button>',
     '</div>',
    '</div>',
   '</section>'
  ].join('');
  const stage=$('#faFurnitureImageStage',dialog);
  stage.addEventListener('pointerdown',pointerDown);
  stage.addEventListener('pointermove',pointerMove);
  stage.addEventListener('pointerup',pointerUp);
  stage.addEventListener('pointercancel',pointerUp);
  stage.addEventListener('keydown',event=>{
   if(!selection||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();const step=event.shiftKey?3:1;
   if(event.key==='ArrowLeft')selection.x=clamp(selection.x-step,0,100-selection.w);
   if(event.key==='ArrowRight')selection.x=clamp(selection.x+step,0,100-selection.w);
   if(event.key==='ArrowUp')selection.y=clamp(selection.y-step,0,100-selection.h);
   if(event.key==='ArrowDown')selection.y=clamp(selection.y+step,0,100-selection.h);
   redraw();
  });
  $('[data-furn-close]',dialog).addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  $('[data-furn-run]',dialog).addEventListener('click',generate);
  for(const [key,label,suffix] of [['Scale','faFurnitureScaleValue','%'],['Rotation','faFurnitureRotationValue','°']]){
   $('#faFurniture'+key,dialog).addEventListener('input',event=>{$('#'+label,dialog).textContent=event.target.value+suffix});
  }
  $('#faFurnitureReference',dialog).addEventListener('change',async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try{
    if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size<100||file.size>14*1024*1024)throw Error('Нужна фотография JPG, PNG или WebP до 14 МБ.');
    reference=await fileToDataURL(file);
    $('#faFurnitureFileName',dialog).textContent=file.name.slice(0,85);
    const preview=$('#faFurnitureReferencePreview',dialog);preview.src=reference;preview.hidden=false;
   }catch(error){reference=null;status(error.message);e.target.value='';}
  });
  document.body.append(dialog);
  $('#faFurnitureOriginal',dialog).src=input.image;
  asDataURL(input.image).then(image=>imageFrom(image)).then(img=>{
   if(!stage?.isConnected)return;
   original=img;
   stage.style.aspectRatio=img.naturalWidth+'/'+img.naturalHeight;
   stage.style.width='min(100%, '+Math.round(64*img.naturalWidth/img.naturalHeight)+'dvh)';
  }).catch(e=>status(e.message));
  dialog.showModal();return true;
 }
 async function generate(){
  if(busy||!source?.image||!selection)return;
  const bridge=window.FORMA_ART_BRIDGE,expected=bridge?.snapshot?.();
  if(!expected?.hasSource||expected.demo){status('Нужен загруженный интерьер своего проекта.');return}
  if(expected.busy||window.FORMA_NODE_ENGINE?.busy){status('Другая генерация выполняется.');return}
  if(!bridge.acquire()){status('Дождитесь другой генерации.');return}
  busy=true;const run=$('[data-furn-run]',dialog);run.disabled=true;run.textContent='Заменяем объект…';
  try{
   const image=await asDataURL(source.image),mask=await buildMask(image);
   const spec={rect:{...selection},type:$('#faFurnitureType',dialog).value,
    scale:Number($('#faFurnitureScale',dialog).value),rotation:Number($('#faFurnitureRotation',dialog).value),
    note:$('#faFurnitureNote',dialog).value,hasReference:!!reference};
   status('AI меняет только выбранный предмет, сохраняя остальную комнату и камеру.');
   const response=await (window.FORMA_RENDER_QUEUE?.fetch||fetch)('/api/render',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({image,mask,material:reference||null,furnitureEdit:spec,quantity:1,quality:'high',brief:{sceneType:'interior'}}),
    signal:AbortSignal.timeout(240000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.images?.[0])throw Error(data.error||'Не удалось заменить предмет.');
   const candidate='data:'+(data.mimes?.[0]||'image/png')+';base64,'+data.images[0];
   status('Сохраняем прежние пиксели за пределами выделения…');
   const protectedImage=await protectOutside(image,candidate);
   await bridge.saveResult(protectedImage,'Интерьер · замена мебели',{...expected,image});
   busy=false;const finish=afterSuccess;close();finish?.();return;
  }catch(error){status(error?.name==='TimeoutError'?'Превышено время ожидания. AI-запрос мог быть оплачен. Проверьте историю перед повтором.':error.message||'Не удалось заменить объект.');}
  finally{busy=false;bridge.release();if(run?.isConnected){run.disabled=!selection;run.textContent='Повторить замену · 1 AI-запрос';}}
 }
 window.FORMA_FURNITURE_EDITOR={open,close};
})();