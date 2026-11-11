/* PLUX V16 — low-cost Cyhub Grok Lite video generation.
   An explicit price quote and second tap are required before any paid task.
   No user API secrets in the browser. Native video preview and MP4 download.
 */
(()=>{
 'use strict';
 const API='https://pluh-voice-demo.onrender.com/api/video';
 const $=(selector,scope=document)=>scope.querySelector(selector);
 const root=$('#screen-modes');
 const imagePage=$('#screen-create');
 if(!root&&!imagePage)return;

 const icon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4z"/></svg>';
 const launch=document.createElement('button');
 launch.type='button';launch.className='plux16-open';launch.innerHTML=icon+'<span><strong>Создать видео</strong><small>Grok Lite · Cyhub · от 3 ₽</small></span><span class="plux16-right">›</span>';
 launch.setAttribute('aria-label','Создать видео через Cyhub Grok Lite');
 const modesGrid=root?.querySelector('.mode-grid');
 if(modesGrid)modesGrid.insertAdjacentElement('afterend',launch);
 else root?.append(launch);
 if(imagePage){
   const second=launch.cloneNode(true);
   second.setAttribute('aria-label','Открыть генератор видео');
   const createButton=$('#create-art-button');
   if(createButton)createButton.insertAdjacentElement('afterend',second);
   else imagePage.append(second);
 }
 const modal=document.createElement('dialog');
 modal.className='plux16-modal';
 modal.setAttribute('aria-label','Генерация видео');
 modal.innerHTML=[
  '<section class="plux16-card">',
  '<header class="plux16-head"><div class="plux16-symbol">'+icon+'</div><div><b>Создать видео</b><small>GROK LITE  /  CYHUB</small></div><button type="button" class="plux16-close" aria-label="Закрыть окно">×</button></header>',
  '<p class="plux16-description">Оживи готовое изображение или создай ролик по описанию. Точную цену покажем до запуска.</p>',
  '<div class="plux17-photo"><div class="plux17-photo-inner"><img class="plux17-preview" hidden alt="Исходное изображение для анимации"><div class="plux17-placeholder">Первый кадр видео</div></div><div class="plux17-photo-actions"><label class="plux17-pick">Выбрать фото<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button class="plux17-clear" type="button" hidden>Убрать фото</button></div><small>Можно использовать созданную в ПЛЮХ картинку или загрузить свою. До 9 МБ.</small></div>',
  '<form class="plux16-form">',
   '<div class="plux19-preset-group"><div class="plux19-preset-head"><span>СТИЛЬ ВИДЕО</span><small>Как должен выглядеть ролик</small></div><div class="plux19-presets plux19-styles" role="group" aria-label="Стиль видео">',
     '<button type="button" class="plux19-option selected" data-style="original" aria-pressed="true">Как на фото</button>',
     '<button type="button" class="plux19-option" data-style="cinema" aria-pressed="false">Кино</button>',
     '<button type="button" class="plux19-option" data-style="3d" aria-pressed="false">3D</button>',
     '<button type="button" class="plux19-option" data-style="anime" aria-pressed="false">Аниме</button>',
     '<button type="button" class="plux19-option" data-style="advert" aria-pressed="false">Реклама</button>',
   '</div></div>',
   '<div class="plux19-preset-group"><div class="plux19-preset-head"><span>ДВИЖЕНИЕ КАМЕРЫ</span><small>Как оживить кадр</small></div><div class="plux19-presets plux19-motion" role="group" aria-label="Движение камеры">',
     '<button type="button" class="plux19-option selected" data-motion="soft" aria-pressed="true">Плавно</button>',
     '<button type="button" class="plux19-option" data-motion="closer" aria-pressed="false">Наезд</button>',
     '<button type="button" class="plux19-option" data-motion="back" aria-pressed="false">Отъезд</button>',
     '<button type="button" class="plux19-option" data-motion="pan" aria-pressed="false">Панорама</button>',
     '<button type="button" class="plux19-option" data-motion="orbit" aria-pressed="false">Облёт</button>',
     '<button type="button" class="plux19-option" data-motion="static" aria-pressed="false">Статично</button>',
   '</div></div>',
   '<label for="plux16-prompt">Что должно происходить в ролике?</label>',
   '<textarea id="plux16-prompt" rows="4" maxlength="850" placeholder="Современный дом у озера. Камера плавно приближается, деревья движутся от ветра, мягкий вечерний свет…" required></textarea>',
   '<div class="plux16-fields">',
    '<label>Длительность<select name="duration"><option value="1">1 сек · самая дешёвая</option><option value="3">3 сек</option><option value="5" selected>5 сек</option><option value="8">8 сек</option><option value="10">10 сек</option><option value="15">15 сек</option></select></label>',
    '<label>Формат<select name="aspectRatio"><option value="16:9" selected>16:9 · кино</option><option value="9:16">9:16 · вертикальный</option><option value="1:1">1:1 · квадрат</option></select></label>',
   '</div>',
   '<div class="plux16-spec"><span>Grok Imagine Lite</span><span>480p · экономный режим</span></div>',
   '<p class="plux19-help">Стиль и камера задаются описанием для Grok Lite. При анимации исходное фото остаётся первым кадром.</p>',
   '<div class="plux16-price" role="status" aria-live="polite">Стоимость зависит от длительности. Сначала проверим цену.</div>',
   '<button class="plux16-quote" type="submit">Проверить стоимость</button>',
   '<button class="plux16-confirm" type="button" hidden>Создать видео</button>',
  '</form>',
  '<section class="plux16-result" hidden><div class="plux16-status" role="status" aria-live="polite">Генерация видео…</div><div class="plux16-orb" aria-hidden="true"></div><video controls playsinline crossorigin="anonymous" preload="none" hidden></video><button type="button" class="plux16-save" hidden>Сохранить MP4</button></section>',
  '<p class="plux16-footnote">Один платный запуск — только после подтверждения. Работающая задача Cyhub может продолжиться после закрытия окна.</p>',
  '</section>'
 ].join('');
 document.body.append(modal);
 const form=$('.plux16-form',modal),prompt=$('#plux16-prompt',modal);
 const quoteBtn=$('.plux16-quote',modal),confirmBtn=$('.plux16-confirm',modal);
 const price=$('.plux16-price',modal);
 const result=$('.plux16-result',modal),status=$('.plux16-status',result);
 const player=$('video',result),save=$('.plux16-save',result);
 const duration=$('select[name=duration]',modal),aspect=$('select[name=aspectRatio]',modal);
 const preview=$('.plux17-preview',modal),place=$('.plux17-placeholder',modal);
 const pick=$('.plux17-pick input',modal),clearPhoto=$('.plux17-clear',modal);
 let sourceImage=null,sourceName='',uploadTicket=0,needsSource=false;
 let photoRevision=0,sourceCache=null,sourcePending=null;
 // Don't re-upload identical photo each time user adjusts video options.
 function forgetUploadedImage(){photoRevision++;sourceCache=null;sourcePending=null}
 const STYLE={
  original:'Preserve the exact source image visual style, composition, identity and materials. No redesign.',
  cinema:'Cinematic live-action film look, natural shadows, realistic motion, elegant lens rendering.',
  '3d':'Turn the moving scene into polished professional 3D CGI animation; preserve recognisable subjects and the original composition.',
  anime:'Anime animation style, hand-drawn cel shading, refined 2D movement; preserve the subjects and composition.',
  advert:'Premium commercial filmmaking, refined product-lighting style, polished controlled movement.'
 };
 const MOTION={
  soft:'Gentle natural motion, subtle parallax, flowing atmosphere, slow steady cinematic camera.',
  closer:'Slow smooth dolly-in toward the main subject, keep framing balanced.',
  back:'Smooth dolly-out to reveal more surrounding context, preserve the subject.',
  pan:'Smooth horizontal camera pan, subtle scene depth.',
  orbit:'Subtle cinematic orbital camera movement, no distortion of the main subject.',
  static:'Locked camera without zoom or pan; only subtle movement of objects and atmosphere.'
 };
 let style='original',movement='soft';
 const makePrompt=text=>[text,STYLE[style],MOTION[movement]].filter(Boolean).join('\n').slice(0,1200);
 function presetGroup(group,attribute,update){
  const buttons=[...modal.querySelectorAll(group+' .plux19-option')];
  for(const btn of buttons)btn.addEventListener('click',()=>{
   update(btn.dataset[attribute]);
   for(const b of buttons){
    const chosen=b===btn;b.classList.toggle('selected',chosen);
    b.setAttribute('aria-pressed',String(chosen));
   }
   resetQuote();
  });
 }
 presetGroup('.plux19-styles','style',value=>{style=value});
 presetGroup('.plux19-motion','motion',value=>{movement=value});
 let quote=null,videoId=null,timer=0,seq=0,busy=false,playing=false;
 function setImage(data,name='Готовое изображение'){
  if(data&&!/^data:image\/(png|jpeg|webp);base64,/i.test(data))throw Error('Не удалось прочитать исходный кадр. Загрузи фото вручную.');
  if(data&&data.length>12_500_000)throw Error('Фото превышает 9 МБ.');
  if(sourceImage!==data)forgetUploadedImage();
  sourceImage=data||null;sourceName=name;needsSource=false;preview.hidden=!sourceImage;
  if(sourceImage)preview.src=sourceImage;
  else preview.removeAttribute('src');
  place.hidden=!!sourceImage;clearPhoto.hidden=!sourceImage;
  aspect.disabled=!!sourceImage;
  resetQuote();
 }
 // Mobile galleries sometimes assign the wrong MIME to otherwise valid photo bytes.
 // Inspect the signature and, if needed, use the browser's image decoder to
 // create a standards-compliant JPEG without cropping or changing proportions.
 function detectedType(bytes){
  if(bytes.length>=8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'image/png';
  if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
  return '';
 }
 const fileDataUrl=blob=>new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||''));
  reader.onerror=()=>reject(Error('Не получилось прочитать фото.'));
  reader.readAsDataURL(blob);
 });
 async function compatiblePhoto(file){
  if(file.size>24_000_000)throw Error('Файл больше 24 МБ. Сначала уменьши его на телефоне.');
  const header=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const realType=detectedType(header);
  if(realType&&file.size<=9_000_000){
   const data=await fileDataUrl(file);
   return data.replace(/^data:[^;]+;base64,/i,'data:'+realType+';base64,');
  }
  // Unsupported HEIC/AVIF, mislabeled gallery photos and oversized images:
  // render to a canvas using the native decoder and encode a valid JPEG.
  const url=URL.createObjectURL(file);
  try{
   const img=new Image();
   img.decoding='async';
   await new Promise((resolve,reject)=>{
    img.onload=resolve;img.onerror=()=>reject(Error('Не удалось декодировать фото. Сохрани его как JPEG или PNG.'));
    img.src=url;
   });
   if(!img.naturalWidth||!img.naturalHeight)throw Error('Фото пустое.');
   const ratio=Math.min(1,4096/Math.max(img.naturalWidth,img.naturalHeight));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Браузер не может обработать фото.');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   let quality=.94,output='';
   do{output=canvas.toDataURL('image/jpeg',quality);quality-=.08}
   while(output.length>12_000_000&&quality>=.5);
   if(output.length>12_000_000)throw Error('Фото слишком большое даже после преобразования.');
   return output;
  }finally{URL.revokeObjectURL(url)}
 }
 pick.addEventListener('change',async()=>{
  const file=pick.files?.[0];if(!file)return;
  const ticket=++uploadTicket;needsSource=true;quoteBtn.disabled=true;
  price.textContent='Проверяю фото и подготавливаю первый кадр…';
  try{
   const data=await compatiblePhoto(file);
   if(ticket!==uploadTicket)return;
   setImage(data,file.name);
   price.textContent='Фото готово. Выбери стиль и проверь стоимость.';
   quoteBtn.disabled=false;
  }catch(e){
   if(ticket===uploadTicket){needsSource=true;price.textContent=String(e.message||'Не удалось прочитать фото.');quoteBtn.disabled=true}
  }finally{pick.value=''}
 });
 clearPhoto.addEventListener('click',()=>setImage(null));
 const rub=minor=>(minor/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₽';
 async function fetchJson(path,options={}){
   const {timeout=25000,...opts}=options;
   let response;
   try{
     response=await fetch(API+path,{mode:'cors',credentials:'omit',cache:'no-store',
       headers:{'Content-Type':'application/json'},...opts,
       signal:AbortSignal.timeout(timeout)});
   }catch(error){
     if(error?.name==='TimeoutError'||error?.name==='AbortError')
       throw Error(path==='/source'?'Загрузка фото занимает слишком много времени. Проверь интернет и повтори бесплатную проверку цены.':'Cyhub не ответил вовремя. Попробуй проверить цену позже.');
     throw Error('Нет связи с видеосервисом. Проверь интернет и повтори бесплатную проверку.');
   }
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(data.error||('Cyhub HTTP '+response.status+'. Генерация не запущена.'));
   return data;
 }
 async function uploadSourceOnce(){
   if(!sourceImage)return null;
   const revision=photoRevision;
   if(sourceCache&&sourceCache.revision===revision&&sourceCache.expires>Date.now())
     return sourceCache.id;
   if(sourcePending&&sourcePending.revision===revision)return sourcePending.promise;
   const promise=(async()=>{
     const upload=await fetchJson('/source',{
       method:'POST',timeout:50000,body:JSON.stringify({dataUrl:sourceImage})
     });
     if(!upload?.sourceId)throw Error('Cyhub не подтвердил загрузку исходного кадра.');
     if(revision===photoRevision)
       sourceCache={revision,id:upload.sourceId,expires:Date.now()+48*60*1000};
     return upload.sourceId;
   })();
   sourcePending={revision,promise};
   try{return await promise}
   finally{if(sourcePending?.promise===promise)sourcePending=null}
 }
 function resetQuote(){
   seq++;quote=null;
   confirmBtn.hidden=true;
   price.textContent='Нажми «Проверить стоимость» — это бесплатно.';
   quoteBtn.hidden=false;
 }
 for(const item of [prompt,duration,aspect])item.addEventListener('input',resetQuote);
 const updateButton=(btn,on,label)=>{
  btn.disabled=on;btn.setAttribute('aria-busy',String(on));
  if(label)btn.textContent=label;
 };
 const close=()=>{modal.close();clearTimeout(timer)};
 $('.plux16-close',modal).addEventListener('click',close);
 modal.addEventListener('click',event=>{if(event.target===modal)close()});
 modal.addEventListener('close',()=>clearTimeout(timer));
 function open(prefill=''){
  if(prefill&&typeof prefill==='object'){
    try{
      if(prefill.imageDataUrl)setImage(prefill.imageDataUrl,prefill.name||'Фото ПЛЮХ');
      else if(prefill.imageUrl){
        const url=String(prefill.imageUrl);
        if(url.startsWith('data:'))setImage(url,prefill.name||'Фото ПЛЮХ');
        else{
          needsSource=true;quoteBtn.disabled=true;
          price.textContent='Загружаю исходную картинку…';
          if(/^https:\/\//.test(url)){
            const ticket=++uploadTicket;
            void fetch(url,{mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)})
              .then(async resp=>{
                if(!resp.ok)throw Error('Фото недоступно.');
                const blob=await resp.blob();
                if(!['image/jpeg','image/png','image/webp'].includes(blob.type)||blob.size>9_000_000)throw Error('Ссылка вернула неподдерживаемый файл.');
                return await new Promise((resolve,reject)=>{
                  const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Фото не прочитано.'));
                  reader.readAsDataURL(blob);
                });
              }).then(data=>{
                if(ticket!==uploadTicket)return;
                setImage(data,prefill.name||'Фото ПЛЮХ');
                quoteBtn.disabled=false;price.textContent='Первый кадр загружен. Проверь стоимость генерации.';
              }).catch(()=>{
                if(ticket!==uploadTicket)return;
                needsSource=true;quoteBtn.disabled=true;
                price.textContent='Фото недоступно для автоматической загрузки. Сохрани его и нажми «Выбрать фото».';
              });
          }else price.textContent='Сохрани картинку и нажми «Выбрать фото».';
        }
      }
    }catch(e){needsSource=true;quoteBtn.disabled=true;price.textContent=e.message}
    if(prefill.prompt)prompt.value=String(prefill.prompt).slice(0,850);
    resetQuote();
    if(needsSource)price.textContent='Загружаю исходный кадр. Проверка стоимости станет доступна после загрузки.';
  }else if(prefill){prompt.value=String(prefill).slice(0,850);resetQuote()}
  if(!modal.open)modal.showModal();
  prompt.focus({preventScroll:true});
  if(videoId&&playing)void poll();
  void fetchJson('/config').then(data=>{
    if(!data.configured){
      price.textContent='Озвучка и видео используют разные API. Для видео нужен CYHUB_API_KEY в Render.';
      quoteBtn.disabled=true;
    }else if(!busy&& !needsSource){
      quoteBtn.disabled=false;
    }
  }).catch(()=>{price.textContent='Не удалось проверить подключение Cyhub. Попробуй позже.'});
 }
 document.querySelectorAll('.plux16-open').forEach(b=>b.addEventListener('click',()=>open()));
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(busy||playing)return;
  if(needsSource){price.textContent='Для видео из фото сначала выбери исходное изображение.';return}
  const text=prompt.value.trim();
  if(text.length<5){price.textContent='Опиши движение и сцену хотя бы пятью символами.';prompt.focus();return}
  busy=true;const ticket=++seq;confirmBtn.hidden=true;
  updateButton(quoteBtn,true,'Проверяю цену…');
  const started=Date.now();
  const noteTimer=setInterval(()=>{
    if(ticket!==seq||!busy)return;
    const seconds=Math.floor((Date.now()-started)/1000);
    price.textContent=sourceImage&&!sourceCache
      ?'Передаю исходное фото: '+seconds+' сек. Деньги не списаны.'
      :'Cyhub рассчитывает цену: '+seconds+' сек. Деньги не списаны.';
  },3500);
  price.textContent='Запрашиваю точную стоимость у Cyhub, деньги не списываются.';
  try{
    let sourceId=null;
    if(sourceImage){
      price.textContent='Подготавливаю исходное фото для Grok Lite…';
      sourceId=await uploadSourceOnce();
      if(ticket!==seq)return;
      price.textContent='Первый кадр загружен. Проверяю стоимость…';
    }
    const data=await fetchJson('/quote',{method:'POST',timeout:25000,body:JSON.stringify({
      prompt:makePrompt(text),duration:Number(duration.value),aspectRatio:aspect.value,sourceId
    })});
    if(ticket!==seq)return;
    quote=data.quoteId;
    price.textContent='Стоимость: '+rub(data.amountMinor)+'. Подтверди запуск, чтобы оплатить эту генерацию.';
    if(data.available===false){price.textContent+=' Недостаточно средств на Cyhub.';confirmBtn.hidden=true}
    else {confirmBtn.textContent='Создать видео за '+rub(data.amountMinor);confirmBtn.hidden=false}
    quoteBtn.hidden=true;
  }catch(e){if(ticket===seq)price.textContent=String(e.message||'Не удалось получить цену.')}
  finally{clearInterval(noteTimer);busy=false;updateButton(quoteBtn,false,'Проверить стоимость')}
 });
 confirmBtn.addEventListener('click',async()=>{
  if(!quote||busy||playing)return;
  busy=true;
  updateButton(confirmBtn,true,'Запускаю…');
  price.textContent='Подтверждение принято. Запускаю генерацию.';
  try{
    const data=await fetchJson('/start',{method:'POST',body:JSON.stringify({quoteId:quote})});
    quote=null;confirmBtn.hidden=true;form.hidden=true;
    videoId=data.videoId;playing=true;result.hidden=false;
    status.textContent='Cyhub принял задачу. Генерация видео…';
    player.hidden=true;player.removeAttribute('src');player.load();save.hidden=true;
    void poll();
  }catch(e){
    price.textContent=String(e.message||'Не удалось запустить видео.');
    quote=null;confirmBtn.hidden=true;quoteBtn.hidden=false;
  }finally{busy=false;updateButton(confirmBtn,false)}
 });
 async function poll(){
  clearTimeout(timer);
  if(!videoId||!playing||!modal.open)return;
  try{
    const data=await fetchJson('/status/'+encodeURIComponent(videoId),{timeout:25000});
    if(data.ready){
      playing=false;
      result.hidden=false;
      status.textContent='Видео готово. Можно посмотреть и скачать MP4.';
      const url=API+'/file/'+encodeURIComponent(videoId);
      player.crossOrigin='anonymous';player.src=url;player.hidden=false;player.preload='metadata';
      save.hidden=false;
      // Save the finished video, not only its temporary provider URL.
      // If local space/CORS is unavailable, keep normal MP4 download working.
      void window.PLUXGallery?.save?.({kind:'video',source:url,filename:'PLUX-Grok-Lite-'+videoId+'.mp4',
        caption:prompt.value||'Видео ПЛЮХ',model:'grok-lite'});
      result.querySelector('.plux16-orb')?.classList.add('finished');
      return;
    }
    if(['failed','cancelled'].includes(data.status)){
      playing=false;status.textContent=data.error||'Задача завершилась без видео. Вернись в генератор.';
      form.hidden=false;result.querySelector('.plux16-orb')?.classList.add('finished');
      return;
    }
    status.textContent=data.status==='queued'?'Видео ожидает обработки…':'Создаю видео… '+(data.stage||'');
  }catch(e){status.textContent='Проверка статуса недоступна: '+String(e.message||'Попробуй позже.')}
  timer=setTimeout(()=>{if(modal.open&&playing)void poll()},5500);
 }
 save.addEventListener('click',async()=>{
  if(!videoId)return;
  updateButton(save,true,'Загружаю MP4…');
  try{
    const response=await fetch(API+'/file/'+encodeURIComponent(videoId),{mode:'cors',credentials:'omit',cache:'no-store'});
    if(!response.ok){const d=await response.json().catch(()=>({}));throw Error(d.error||'Не удалось получить MP4')}
    const blob=await response.blob();
    if(blob.size>65000000)throw Error('Ролик слишком большой');
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='PLUX-Grok-Lite.mp4';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }catch(e){status.textContent=String(e.message||'Не удалось сохранить видео.')}
  finally{updateButton(save,false,'Сохранить MP4')}
 });
 const restart=document.createElement('button');restart.type='button';restart.className='plux16-again';restart.textContent='Новый ролик';
 restart.addEventListener('click',()=>{
   clearTimeout(timer);playing=false;videoId=null;form.hidden=false;result.hidden=true;
   player.pause();player.removeAttribute('src');player.load();prompt.value='';setImage(null);
   resetQuote();quoteBtn.disabled=false;
 });
 result.append(restart);
 window.PLUXVideoV16={open,active:()=>playing,setImage};
})();
