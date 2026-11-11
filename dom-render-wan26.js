/* OpenRouter Wan 2.6 Free — real video output inside existing Cinema Studio. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let available=null,jobId=null,timer=null,uploadData='',uploadName='';
 const button=$('wanGenerate'),status=$('wanAvailability'),message=$('wanMessage'),result=$('wanResult'),download=$('wanDownload'),file=$('wanImageFile');
 if(!button)return;
 const label=(t)=>{message.textContent=t;};
 const getJSON=async(url,opts)=>{
  const r=await fetch(url,{cache:'no-store',...opts});
  let data={};try{data=await r.json()}catch{}
  if(!r.ok)throw Error(data.error||'Сервис временно недоступен: '+r.status);
  return data;
 };
 const safeName=name=>String(name||'').slice(0,80);
 function chosen(){
  const s={};
  for(const field of ['camera','lens','motion','grade']){
   const el=document.querySelector('#animationPanel .anim-option-card[data-anim-kind="'+field+'"].active');
   if(el)s[field]=el.dataset.animId;
  }
  s.duration=Number($('wanDuration').value);
  s.ratio=$('animRatio')?.value||'16:9';
  s.fps=Number($('animFPS')?.value||24);
  s.intensity=$('animIntensity')?.value||'low';
  s.promptExtra=$('animExtra')?.value||'';
  return s;
 }
 function sourceImage(){
  const img=$('animPreviewImage');
  return img?.complete&&img.naturalWidth?img:null;
 }
 async function imageData(){
  if(uploadData)return uploadData;
  const img=sourceImage();
  if(!img)throw Error('Загрузите изображение дома или откройте существующий рендер.');
  // Canvas ensures the remote frame is sent in the same view, without UI overlays.
  const max=1800,ratio=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(img.naturalWidth*ratio));
  c.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  c.getContext('2d',{alpha:false}).drawImage(img,0,0,c.width,c.height);
  try{return c.toDataURL('image/jpeg',0.88)}
  catch{throw Error('Источник не разрешает чтение изображения. Выберите файл вручную.')}
 }
 async function refresh(){
  try{
   const data=await getJSON('/api/wan/status');
   available=data;
   status.textContent=data.ready?'Wan 2.6 Free доступна · осталось запусков сегодня: '+data.remaining:
      'Wan 2.6 не подключена: '+(data.reason||'проверьте ключ OpenRouter');
   status.dataset.ready=String(!!data.ready);
   button.disabled=!data.ready || Number(data.remaining)<=0;
  }catch(e){available={ready:false};button.disabled=true;status.textContent=e.message;status.dataset.ready='false'}
 }
 const states={pending:'В очереди OpenRouter',in_progress:'Генерация видео выполняется',completed:'Видео готово',failed:'Ошибка генерации',cancelled:'Задание отменено',expired:'Срок задания истёк'};
 function stop(){if(timer){clearInterval(timer);timer=null}}
 async function poll(){
  if(!jobId)return;
  try{
   const data=await getJSON('/api/wan/job?id='+encodeURIComponent(jobId));
   label((states[data.status]||'Проверка статуса')+(data.error?' · '+data.error:''));
   if(data.status==='completed'){
    stop();download.hidden=false;download.href=data.downloadUrl;result.hidden=false;result.textContent='✓ Генерация завершена. Нажмите «Скачать MP4».';
    button.disabled=false;await refresh();
   }else if(['failed','cancelled','expired'].includes(data.status)){
    stop();button.disabled=!available?.ready;await refresh();
   }
  }catch(e){stop();label(e.message);button.disabled=!available?.ready;}
 }
 async function generate(){
  if(!available?.ready)return;
  button.disabled=true;download.hidden=true;result.hidden=false;
  result.textContent='Отправляем кадр на сервер…';label('Проверяем изображение и параметры.');
  try{
   const image=await imageData();
   const lib=window.DOM_RENDER_ANIMATION;
   if(!lib?.buildPrompt)throw Error('Не удалось получить настройки кинокамеры.');
   const c=chosen();
   const prompt=lib.buildPrompt(c);
   if(image.length>11*1024*1024)throw Error('Изображение больше 8 МБ. Сожмите файл.');
   const job=await getJSON('/api/wan/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,prompt,duration:c.duration,ratio:c.ratio})});
   jobId=job.id;
   try{sessionStorage.setItem('wan-job-id',jobId)}catch{}
   result.textContent='Видео создаётся из текущего кадра.';
   await poll();if(timer===null&&jobId&&!result.textContent.includes('Генерация завершена'))timer=setInterval(poll,25000);
  }catch(e){
   label(e.message);
   result.textContent='Генерация не запущена.';
   button.disabled=!available?.ready;
  }
 }
 button.addEventListener('click',generate);
 $('wanRefresh').addEventListener('click',()=>{refresh();if(jobId)poll()});
 $('wanClearFile').addEventListener('click',()=>{uploadData='';uploadName='';$('wanFilename').textContent='Используется кадр предпросмотра';file.value='';});
 file.addEventListener('change',e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8*1024*1024){
   label('Используйте JPG/PNG/WebP размером до 8 МБ.');file.value='';return;
  }
  const reader=new FileReader();
  reader.onload=()=>{uploadData=String(reader.result);uploadName=safeName(f.name);$('wanFilename').textContent='Выбран файл: '+uploadName;label('Кадр загружен.');};
  reader.onerror=()=>label('Не удалось прочитать файл.');
  reader.readAsDataURL(f);
 });
 try{const saved=sessionStorage.getItem('wan-job-id');if(saved&&/^[0-9a-f-]{36}$/i.test(saved)){jobId=saved;poll().then(()=>{if(timer===null&&!result.textContent.includes('Генерация завершена'))timer=setInterval(poll,25000)})}}catch{}
 refresh();
})();
