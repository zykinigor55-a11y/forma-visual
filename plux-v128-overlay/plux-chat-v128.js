/* PLUX V12.8 — Chat Completions proxy. API key is never sent to the browser. */
(() => {
  'use strict';
  const form=document.getElementById('chat-form'),input=document.getElementById('chat-input'),feed=document.getElementById('chat-messages');
  if(!form||!input||!feed)return;
  const endpoint='https://pluh-voice-demo.onrender.com/api/chat';
  let busy=false;
  const history=()=>{try{const x=JSON.parse(localStorage.getItem('plux_messages')||'[]');return Array.isArray(x)?x.filter(m=>m&&['bot','user','info'].includes(m.from)&&typeof m.text==='string').slice(-35):[]}catch{return []}};
  function append(from,text){
    const message=String(text||'').slice(0,5000);
    const rows=history();rows.push({from,text:message,at:Date.now()});
    try{localStorage.setItem('plux_messages',JSON.stringify(rows.slice(-75)))}catch{}
    const row=document.createElement('div');row.className='chat-row '+(from==='user'?'user':from==='info'?'info':'bot');
    if(from!=='user'){const im=document.createElement('img');im.className='chat-mini';im.src='/assets/states/idle.webp';im.alt='';row.append(im)}
    const bubble=document.createElement('div');bubble.className='chat-bubble';bubble.textContent=message;row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
  }
  // V14: display real tool outputs, not fabricated text links from the language model.
  const temporaryUrls=[];
  const downloadable=data=>{
    if(typeof data!=='string'||!/^data:(application\/pdf|image\/png|image\/jpeg|image\/webp);base64,/.test(data))return null;
    try{
      const split=data.indexOf(','),head=data.slice(5,split),body=atob(data.slice(split+1));
      const bytes=new Uint8Array(body.length);
      for(let i=0;i<body.length;i++)bytes[i]=body.charCodeAt(i);
      const uri=URL.createObjectURL(new Blob([bytes],{type:head.slice(0,head.indexOf(';'))}));
      temporaryUrls.push(uri);return uri;
    }catch{return null}
  };
  window.addEventListener('pagehide',()=>temporaryUrls.splice(0).forEach(uri=>URL.revokeObjectURL(uri)));
  // V31.8.7: resolve the REAL image bytes before replacing the progress card.
  // A remote download URL can fail on Android WebView or expire; never silently
  // show a filename as though the preview was successfully delivered.
  const secureSource=item=>{
    const source=downloadable(item?.dataUrl)
      ||(typeof item?.url==="string"&&/^https:\/\/[^/]+\/.+/.test(item.url)?item.url:null);
    return source;
  };
  const loadPreview=async(uri)=>{
    const load=source=>new Promise((resolve,reject)=>{
      const image=new Image();
      image.className="plux14-created-image plux3187-image-loaded";
      image.loading="eager";image.decoding="async";
      image.alt="Готовое изображение GPT Image 2";
      const timer=setTimeout(()=>reject(Error("Изображение слишком долго загружается. Повтори просмотр.")),26000);
      image.onload=()=>{clearTimeout(timer);if(image.naturalWidth<1)reject(Error("Изображение оказалось пустым."));else resolve(image)};
      image.onerror=()=>{clearTimeout(timer);reject(Error("Не удалось открыть изображение. Проверь соединение."))};
      image.src=source;
      if(image.complete&&image.naturalWidth>0){clearTimeout(timer);resolve(image)}
    });
    if(uri.startsWith("blob:"))return load(uri);
    // The server stores generated images as an HTTPS download. Turn it into an
    // object URL so Android Chromium renders the bytes directly in the bubble.
    let local=null;
    try{
      const response=await fetch(uri,{mode:"cors",credentials:"omit",cache:"no-store",
        signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error("Не удалось загрузить изображение (HTTP "+response.status+").");
      const blob=await response.blob();
      if(!/^image\/(png|jpeg|webp)$/.test(blob.type)||blob.size<100)
        throw Error("Генератор вернул не изображение.");
      local=URL.createObjectURL(blob);
      temporaryUrls.push(local);
      return await load(local);
    }catch(e){
      if(local){try{URL.revokeObjectURL(local)}catch{}}
      // A provider may not allow fetch/CORS but still allow the ordinary image
      // resource in WebView. Try it, and propagate real errors if that fails.
      try{return await load(uri)}catch{throw e}
    }
  };
  function createArtifactRow(existing){
    if(existing?.row&&existing?.bubble)return existing;
    const row=document.createElement("div");
    row.className="chat-row bot plux14-artifact-row";
    const avatar=document.createElement("img");
    avatar.className="chat-mini";avatar.alt="";avatar.src="/assets/states/idle.webp";row.append(avatar);
    const bubble=document.createElement("div");
    bubble.className="chat-bubble plux14-artifact";row.append(bubble);feed.append(row);
    return {row,bubble};
  }
  async function appendArtifact(item,pending=null){
    if(!item||!["image","pdf","presentation"].includes(item.type))
      throw Error("Генератор вернул неизвестный тип файла.");
    const file=String(item.filename||(item.type==="presentation"?"PLUX-presentation.pptx":
      item.type==="pdf"?"PLUX.pdf":"PLUX.png")).replace(/[\\/<>\:*?"|]/g,"").slice(0,90);
    const uri=secureSource(item);
    if(!uri)throw Error("Сервер не вернул ссылку на готовое изображение или документ.");
    const {row,bubble}=createArtifactRow(pending);
    if(item.type==="image"){
      pending?.state("Загружаю готовое изображение…");
      pending?.setProgress(95);
      const picture=await loadPreview(uri);
      pending?.finish();
      row.className="chat-row bot plux14-artifact-row plux3187-image-row";
      bubble.className="chat-bubble plux14-artifact plux3187-image-card";
      bubble.replaceChildren();
      const label=document.createElement("strong");label.className="plux3187-image-title";
      label.textContent="Изображение готово";
      const opener=document.createElement("button");
      opener.className="plux3187-image-open";opener.type="button";
      opener.setAttribute("aria-label","Открыть готовое изображение на весь экран");
      opener.append(picture);
      opener.onclick=()=>{
        const preview=picture.src;
        if(window.PLUX26ImageViewer?.open)window.PLUX26ImageViewer.open({src:preview,filename:file});
        else window.open(preview,"_blank","noopener,noreferrer");
      };
      const meta=document.createElement("small");meta.className="plux14-file-title";
      meta.textContent="GPT Image 2 · "+picture.naturalWidth+" × "+picture.naturalHeight;
      const action=document.createElement("button");action.type="button";
      action.className="plux14-download plux3187-image-save";
      action.textContent="Сохранить изображение";
      action.onclick=()=>{
        if(window.PLUXSaveV17?.save)void window.PLUXSaveV17.save(uri,file,item.mime||"image/png");
        else{
          const link=document.createElement("a");link.href=uri;link.download=file;
          link.target="_blank";link.rel="noopener noreferrer";document.body.append(link);link.click();link.remove();
        }
      };
      bubble.append(label,opener,meta,action);
    }else{
      pending?.finish();
      row.className="chat-row bot plux14-artifact-row";
      bubble.className="chat-bubble plux14-artifact";
      bubble.replaceChildren();
      const icon=document.createElement("span");icon.className="plux14-pdf-icon";
      icon.textContent=item.type==="presentation"?"PPTX":"PDF";bubble.append(icon);
      const title=document.createElement("span");title.className="plux14-file-title";
      title.textContent=String(item.title||file).slice(0,120);bubble.append(title);
      const action=document.createElement("a");action.className="plux14-download";
      action.textContent=item.type==="presentation"?"Скачать презентацию PPTX":"Скачать PDF";
      action.href=uri;
      if(uri.startsWith("blob:"))action.download=file;
      else{action.target="_blank";action.rel="noopener noreferrer"}
      bubble.append(action);
    }
    feed.scrollTop=feed.scrollHeight;
    return row;
  }
  function isPresentation(text){
    const s=String(text||'').toLowerCase();
    return /(?:сделай|создай|собери|подготовь|оформи|придумай|сгенерируй|нужна|хочу)\s.{0,55}(?:презентаци|слайды|powerpoint|pptx)/i.test(s)
       || /^(?:презентация|презентацию|слайды|pptx)\b/i.test(s);
  }
  function inferredKind(text){
    if(isPresentation(text))return 'presentation';
    if(/(?:созда|сдела|сгенериру|нарису|подготов).{0,65}(?:картин|изображени|фото|портрет|иллюстраци)/i.test(text)||/(?:нарисуй)/i.test(text))return 'image';
    if(/(?:сдела|созда|подготов|нужен|хочу).{0,55}(?:пдф|pdf)/i.test(text))return 'pdf';
    return null;
  }
  // The provider does not report reliable percentage completion. Display a
  // clearly labeled estimated percentage, capped below 100% until the preview
  // has decoded successfully. Never claim 100% on a failed/expired image.
  function appendPending(kind){
    const row=document.createElement("div");row.className="chat-row bot plux3184-progress-row";
    const avatar=document.createElement("img");avatar.className="chat-mini";
    avatar.alt="";avatar.src="/assets/states/idle.webp";row.append(avatar);
    const bubble=document.createElement("div");bubble.className="chat-bubble plux3184-generation plux3187-generation";
    bubble.setAttribute("role","status");bubble.setAttribute("aria-live","polite");bubble.setAttribute("aria-busy","true");
    const visual=document.createElement("div");visual.className="plux3184-render-visual";visual.setAttribute("aria-hidden","true");
    for(let i=0;i<3;i++){const orbit=document.createElement("i");orbit.className="plux3184-render-orbit";visual.append(orbit)}
    const body=document.createElement("div");body.className="plux3184-render-body";
    const title=document.createElement("strong");title.textContent=kind==="image"?"Создаю изображение":
      kind==="presentation"?"Собираю презентацию":"Создаю PDF";
    const status=document.createElement("small");status.textContent="Подключаю генератор…";
    const percent=document.createElement("b");percent.className="plux3187-percent";
    const estimate=document.createElement("span");estimate.className="plux3187-percent-note";
    estimate.textContent="Примерный прогресс";
    const track=document.createElement("div");track.className="plux3184-render-track plux3187-track";
    track.setAttribute("role","progressbar");track.setAttribute("aria-label","Примерный прогресс генерации");
    track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax","100");
    const fill=document.createElement("i");track.append(fill);
    const progressline=document.createElement("div");progressline.className="plux3187-progressline";
    progressline.append(estimate,percent);
    body.append(title,status,progressline,track);
    bubble.append(visual,body);row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
    let value=4,closed=false;
    const start=Date.now();
    const stages=kind==="image"?["Генерирую изображение…","Детализирую результат…","Подготавливаю файл…"]:
      kind==="presentation"?["Создаю структуру слайдов…","Оформляю презентацию…","Подготавливаю PowerPoint…"]:
      ["Подготавливаю документ…","Оформляю страницы…","Собираю PDF…"];
    function setProgress(amount){
      if(closed)return;
      value=Math.max(value,Math.min(100,Math.round(amount)));
      percent.textContent=value+"%";track.setAttribute("aria-valuenow",String(value));
      fill.style.width=value+"%";
    }
    setProgress(value);
    const timer=setInterval(()=>{
      if(closed)return;
      const elapsed=(Date.now()-start)/1000;
      // Gradual estimated advancement without falsely reaching completion.
      const estimate=Math.min(92,Math.floor(7+87*(1-Math.exp(-elapsed/63))));
      setProgress(estimate);
      status.textContent=stages[Math.min(Math.floor(elapsed/24),stages.length-1)];
    },650);
    function finish(){
      if(closed)return;
      setProgress(100);closed=true;clearInterval(timer);
      bubble.setAttribute("aria-busy","false");
    }
    function fail(message){
      if(closed)return;
      closed=true;clearInterval(timer);
      bubble.setAttribute("aria-busy","false");
      bubble.classList.add("plux3187-failed");
      title.textContent="Не удалось создать изображение";
      status.textContent=String(message||"Генерация не завершена.").slice(0,260);
      percent.textContent="Ошибка";
      fill.style.width="0%";
      track.removeAttribute("aria-valuenow");
      row.scrollIntoView({block:"nearest",behavior:"smooth"});
    }
    return {row,bubble,state:message=>{if(!closed)status.textContent=String(message)},
      setProgress,finish,fail,end:()=>{if(!closed){closed=true;clearInterval(timer);row.remove()}}};
  }
  function appendUploads(attachments){
    for(const item of attachments){
      if(!item?.mime?.startsWith('image/')||!/^data:image\/(png|jpeg|webp);base64,/.test(item.dataUrl||''))continue;
      const row=document.createElement('div');row.className='chat-row user plux3184-upload-row';
      const image=document.createElement('img');image.className='plux3184-upload-preview';image.alt='Загруженное изображение: '+String(item.name||'фото').slice(0,80);
      image.src=item.dataUrl;row.append(image);feed.append(row);
    }
    feed.scrollTop=feed.scrollHeight;
  }
  async function pollJob(job,progress){
    if(!job?.id||!/^[A-Za-z0-9_-]{32}$/.test(job.id))throw Error('Сервер вернул неверный номер задачи');
    const started=Date.now();
    while(Date.now()-started<270000){
      await new Promise(resolve=>setTimeout(resolve,2400));
      const res=await fetch('https://pluh-voice-demo.onrender.com/api/generation/status?id='+job.id,
       {method:'GET',mode:'cors',credentials:'omit',signal:AbortSignal.timeout(18000)});
      const x=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(x.error||'Не удалось узнать состояние генерации');
      if(x.state==='failed')throw Error(x.error||'Не удалось создать файл');
      if(x.state==='complete')return x;
      progress.state(job.kind==='image'?'GPT Image 2 создаёт изображение…':
        job.kind==='presentation'?'Собираю слайды PowerPoint…':'Готовлю PDF…');
    }
    throw Error('Генерация длится дольше обычного. Проверь чат позже, не запускай повторно платный запрос.');
  }
  async function send(text){
    if(busy)return;busy=true;
    const attachments=window.PLUXMediaV129?.takeAttachments?.()||[];
    const display=text||"Проанализируй вложения";
    const summary=attachments.map(x=>"📎 "+x.name).join("\n");
    const button=form.querySelector(".chat-send");if(button)button.disabled=true;
    append("user",display+(summary?"\n"+summary:""));
    appendUploads(attachments);
    const wantsPhotoChange=attachments.some(a=>a?.mime?.startsWith("image/"))
      &&/(?:сдела|созда|сгенериру|передела|преврат|измен|обработ|улучш|замен|нарису|добав|убер|удал)/i.test(display)
      &&!/презентаци|pptx|слайд/i.test(display);
    const kind=inferredKind(display)||(wantsPhotoChange?"image":null);
    const progress=kind?appendPending(kind):null;
    const messages=history().filter(m=>m.from==="user"||m.from==="bot").slice(-12)
      .map(m=>({role:m.from==="user"?"user":"assistant",content:m.text.slice(0,2400)}));
    try{
      const response=await fetch(endpoint,{method:"POST",mode:"cors",credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages,attachments,requestedArtifact:kind||undefined,
          clientFeatures:{generationJobs:!!kind}}),
        signal:AbortSignal.timeout(65000)});
      let result=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(result.error||"Не удалось получить ответ ИИ");
      if(response.status===202&&result.job)result=await pollJob(result.job,progress||{state:()=>{}});
      if(result.artifact){
        // The same pending bubble becomes the finished image or document.
        // No separate generic success text concealing the actual picture.
        await appendArtifact(result.artifact,progress);
      }else{
        if(progress)progress.end();
        if(typeof result.reply==="string"&&result.reply.trim())append("bot",result.reply);
        else throw Error("Сервер не вернул готовое изображение или ответ.");
      }
    }catch(e){
      const msg=e.name==="TimeoutError"?"Сервер долго не отвечает. Проверь чат позже и не повторяй платный запрос сразу.":
        String(e.message||"Связь с сервером недоступна.");
      if(progress)progress.fail(msg);else append("info",msg);
    }finally{busy=false;if(button)button.disabled=false}
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;const t=input.value.trim();if(!t&&!window.PLUXMediaV129?.hasAttachments?.())return;
    // Create video through the same written conversation without mixing it with voice mode.
    // Other messages, attachments, PDFs and images preserve their existing routes.
    const videoRequest=/(?:созда|сдела|сгенериру|подготов|сними|нарису)/i.test(t)
      &&/(?:видео|видеоролик|ролик|анимаци)/i.test(t);
    if(videoRequest && window.PLUXVideoV16 && !window.PLUXMediaV129?.hasAttachments?.()){
      input.value='';window.PLUXVideoV16.open(t);return;
    }
    input.value='';void send(t);
  },true);
  window.PLUXChatAPI={model:'gpt-6-luna',endpoint};
})();