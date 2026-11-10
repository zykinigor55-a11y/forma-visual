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
  '<p class="plux16-description">Промпт превратится в короткое видео. Цена рассчитывается до списания.</p>',
  '<form class="plux16-form">',
   '<label for="plux16-prompt">Что должно происходить в ролике?</label>',
   '<textarea id="plux16-prompt" rows="4" maxlength="1200" placeholder="Современный дом у озера. Камера плавно приближается, деревья движутся от ветра, мягкий вечерний свет…" required></textarea>',
   '<div class="plux16-fields">',
    '<label>Длительность<select name="duration"><option value="1">1 сек · самая дешёвая</option><option value="3">3 сек</option><option value="5" selected>5 сек</option><option value="8">8 сек</option><option value="10">10 сек</option><option value="15">15 сек</option></select></label>',
    '<label>Формат<select name="aspectRatio"><option value="16:9" selected>16:9 · кино</option><option value="9:16">9:16 · вертикальный</option><option value="1:1">1:1 · квадрат</option></select></label>',
   '</div>',
   '<div class="plux16-spec"><span>Grok Imagine Lite</span><span>480p · экономный режим</span></div>',
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
 let quote=null,videoId=null,timer=0,seq=0,busy=false,playing=false;
 const rub=minor=>(minor/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₽';
 async function fetchJson(path,options={}){
   const response=await fetch(API+path,{mode:'cors',credentials:'omit',cache:'no-store',
     headers:{'Content-Type':'application/json'},...options,
     signal:AbortSignal.timeout(options.timeout||25000)});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||'Ошибка соединения с сервисом.');
   return data;
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
  if(prefill){prompt.value=String(prefill).slice(0,1200);resetQuote()}
  if(!modal.open)modal.showModal();
  prompt.focus({preventScroll:true});
  if(videoId&&playing)void poll();
  void fetchJson('/config').then(data=>{
    if(!data.configured){
      price.textContent='Озвучка и видео используют разные API. Для видео нужен CYHUB_API_KEY в Render.';
      quoteBtn.disabled=true;
    }else if(!busy){
      quoteBtn.disabled=false;
    }
  }).catch(()=>{price.textContent='Не удалось проверить подключение Cyhub. Попробуй позже.'});
 }
 document.querySelectorAll('.plux16-open').forEach(b=>b.addEventListener('click',()=>open()));
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(busy||playing)return;
  const text=prompt.value.trim();
  if(text.length<5){price.textContent='Опиши движение и сцену хотя бы пятью символами.';prompt.focus();return}
  busy=true;const ticket=++seq;confirmBtn.hidden=true;
  updateButton(quoteBtn,true,'Проверяю цену…');
  price.textContent='Запрашиваю точную стоимость у Cyhub, деньги не списываются.';
  try{
    const data=await fetchJson('/quote',{method:'POST',body:JSON.stringify({
      prompt:text,duration:Number(duration.value),aspectRatio:aspect.value
    })});
    if(ticket!==seq)return;
    quote=data.quoteId;
    price.textContent='Стоимость: '+rub(data.amountMinor)+'. Подтверди запуск, чтобы оплатить эту генерацию.';
    if(data.available===false){price.textContent+=' Недостаточно средств на Cyhub.';confirmBtn.hidden=true}
    else {confirmBtn.textContent='Создать видео за '+rub(data.amountMinor);confirmBtn.hidden=false}
    quoteBtn.hidden=true;
  }catch(e){if(ticket===seq)price.textContent=String(e.message||'Не удалось получить цену.')}
  finally{busy=false;updateButton(quoteBtn,false,'Проверить стоимость')}
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
   player.pause();player.removeAttribute('src');player.load();prompt.value='';
   resetQuote();quoteBtn.disabled=false;
 });
 result.append(restart);
 window.PLUXVideoV16={open,active:()=>playing};
})();
