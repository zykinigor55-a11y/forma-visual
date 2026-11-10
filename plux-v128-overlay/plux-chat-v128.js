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
  function appendArtifact(item,onImageReady=()=>{}){
    if(!item||!['image','pdf'].includes(item.type))return;
    const file=String(item.filename|| (item.type==='pdf'?'PLUX.pdf':'PLUX.png')).replace(/[\\\/<>:*?"|]/g,'').slice(0,90);
    // Display image data URLs directly. Blob URLs can be blocked by older
    // Android WebView/CSP, which previously left a text-only result card.
    const safeImageData=item.type==='image'&&typeof item.dataUrl==='string'
      &&/^data:image\/(?:png|jpeg|webp);base64,/.test(item.dataUrl)?item.dataUrl:null;
    const pdfLink=item.type==='pdf'&&typeof item.url==='string'
      &&/^https:\/\/pluh-voice-demo\.onrender\.com\/api\/download\/pdf\/[A-Za-z0-9_-]{43}$/.test(item.url)?item.url:null;
    const uri=safeImageData||pdfLink||(item.type==='pdf'?downloadable(item.dataUrl):null)
      ||(typeof item.url==='string'&&item.url.startsWith('https://')?item.url:null);
    if(!uri){onImageReady(false);append('info','Не удалось открыть вложение от генератора.');return}
    const row=document.createElement('div');row.className='chat-row bot plux14-artifact-row';
    const avatar=document.createElement('img');avatar.className='chat-mini';avatar.src='/assets/states/idle.webp';avatar.alt='';row.append(avatar);
    const bubble=document.createElement('div');bubble.className='chat-bubble plux14-artifact';
    if(item.type==='image'){
      const picture=document.createElement('img');picture.className='plux14-created-image';picture.alt='Изображение, созданное GPT Image 2';
      picture.loading='eager';picture.decoding='async';
      picture.tabIndex=0;picture.setAttribute('role','button');
      picture.setAttribute('aria-label','Открыть созданное изображение на весь экран');
      const showPhoto=()=>window.PLUX26ImageViewer?.open?.({src:uri,filename:file});
      picture.addEventListener('click',showPhoto);
      picture.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();showPhoto();}
      });
      picture.addEventListener('load',()=>{
        picture.classList.add('plux22-image-ready');
        onImageReady(true);
        void window.PLUXGallery?.save?.({kind:'image',source:safeImageData||item.url,filename:file,
          caption:'GPT Image 2',model:'gpt-image-2'});
      },{once:true});
      picture.addEventListener('error',()=>{onImageReady(false);append('info','Изображение создано, но не загрузилось в чат. Попробуй открыть или сохранить его кнопкой ниже.')},{once:true});
      // Keep image visible even when a legacy chat stylesheet applies generic
      // styles to img and chat bubbles.
      picture.style.cssText='display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:220px!important;object-fit:contain!important;visibility:visible!important;opacity:1!important';
      bubble.append(picture);picture.src=uri;
      const title=document.createElement('div');title.className='plux14-file-title';title.textContent='GPT Image 2 · 1024 × 1024';
      bubble.append(title);
    }else{
      const icon=document.createElement('span');icon.className='plux14-pdf-icon';icon.textContent='PDF';bubble.append(icon);
      const title=document.createElement('span');title.className='plux14-file-title';title.textContent=String(item.title||file).slice(0,120);
      bubble.append(title);
    }
    const action=document.createElement('a');action.className='plux14-download';action.textContent=item.type==='pdf'?'Скачать PDF':'Сохранить изображение';
    action.href=safeImageData?downloadable(safeImageData)||uri:uri;
    if(pdfLink){
      // Prefer the real server URL. Android DownloadManager handles this URL,
      // unlike a blob: anchor that silently fails in Capacitor WebView.
      action.href=pdfLink;
      action.removeAttribute('target');action.removeAttribute('download');
      action.setAttribute('aria-label','Скачать PDF в папку Загрузки');
      action.setAttribute('role','button');action.style.pointerEvents='auto';
      action.addEventListener('click',event=>{
        if(!navigator.onLine){event.preventDefault();append('info','Нет интернета. Повтори загрузку PDF после подключения.');}
      });
    }else if(action.href.startsWith('blob:')||action.href.startsWith('data:'))action.download=file;
    else{action.target='_blank';action.rel='noopener noreferrer'}
    bubble.append(action);
    if(item.type==='image'){
      const animate=document.createElement('button');
      animate.type='button';animate.className='plux17-animate';
      animate.textContent='Сделать видео';
      animate.setAttribute('aria-label','Анимировать это изображение через Grok Lite');
      animate.addEventListener('click',()=>{
        if(!window.PLUXVideoV16?.open){
          append('info','Генератор видео пока не загружен.');
          return;
        }
        window.PLUXVideoV16.open({
          imageDataUrl:typeof item.dataUrl==='string'?item.dataUrl:null,
          imageUrl:!item.dataUrl?item.url:null,
          name:file,
          prompt:'Плавная кинематографическая анимация исходного изображения. Сохрани форму объектов, композицию и материалы. Естественное движение камеры и окружения.'
        });
      });
      bubble.append(animate);
    }
    row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
  }
  const imageIntent=text=>{
    const s=String(text||'').trim().toLowerCase();
    if(!s||s.length>2500)return false;
    if(/(?:промпт|как (?:сделать|создать)|почему|объясни|расскажи|[?？])/.test(s))return false;
    const action=/(?:сгенериру|созда|сдела|нарису|нарисуй|генераци|generate|draw|make|create)/i.test(s);
    const visual=/(?:изображени|картин|фото|фотографи|рисунк|иллюстраци|обложк|постер|портрет|image|picture|photo)/i.test(s);
    if(action&&(visual||/нарису|нарисуй|draw/i.test(s)))return true;
    // "Полосатая корова фото" or "Фото полосатой коровы": treat as creation.
    return s.length<=125&&/(?:^|\s)(?:фото|фотографи[яию]|картин[ау]|изображени[ея]|рисунок|портрет)\s+.{3,100}$|^.{3,100}\s+(?:фото|фотографи[яию]|картин[ау]|изображени[ея]|рисунок|портрет)$/i.test(s);
  };
  function showGenerating(kind='image'){
    const row=document.createElement('div');row.className='chat-row bot plux22-generating-row';row.setAttribute('role','status');
    const bubble=document.createElement('div');bubble.className='chat-bubble plux22-generating';
    bubble.innerHTML='<div class="plux22-preview" aria-hidden="true"><div class="plux22-orbit"></div><div class="plux22-spark"></div></div><div class="plux22-gen-title">ПЛЮХ создаёт изображение<span class="plux22-dots"></span></div><div class="plux22-gen-note">Готовлю композицию и детали</div><div class="plux22-progress"><i></i></div>';
    if(kind==='pdf'){
      bubble.querySelector('.plux22-gen-title').firstChild.textContent='ПЛЮХ готовит PDF';
      bubble.querySelector('.plux22-gen-note').textContent='Формирую документ';
    }
    row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
    const notes=kind==='pdf'
      ?['Формирую структуру документа','Ожидаю готовый PDF','Проверяю создание файла']
      :['Готовлю композицию и детали','Ожидаю результат GPT Image 2','Проверяю готовность изображения'];
    let step=0,ended=false;
    const timer=setInterval(()=>{if(ended)return;step=Math.min(step+1,notes.length-1);const label=bubble.querySelector('.plux22-gen-note');if(label)label.textContent=notes[step];feed.scrollTop=feed.scrollHeight},8500);
    return {stop(){if(ended)return;ended=true;clearInterval(timer);row.remove();feed.scrollTop=feed.scrollHeight},ready(){const label=bubble.querySelector('.plux22-gen-note');if(label)label.textContent=kind==='pdf'?'Документ готов. Открываю PDF…':'Изображение готово. Открываю в чате…'}};
  }
  // A job identifier represents one paid generation. Poll it rather than
  // repeating the upstream request on a weak mobile connection.
  const jobKey='plux_pending_generation_v28';
  const jobStatusUrl='https://pluh-voice-demo.onrender.com/api/generation/status';
  const pdfIntent=text=>{
    const t=String(text||'').trim().toLowerCase();
    return /(pdf|пдф)/.test(t)&&/(созда|сдела|сгенериру|нужен|нужна|нужно|хочу|подготов|состав|пришли|собер|альбом|доклад|отч[её]т|презентац)/.test(t);
  };
  async function pollJob(job){
    if(!job||!(/^[A-Za-z0-9_-]{32}$/.test(job.id)))throw Error('Сервер вернул неправильный номер задачи.');
    const maxWait=job.kind==='image'?340000:150000;
    const until=Date.now()+maxWait;
    let connectionErrors=0;
    while(Date.now()<until){
      await new Promise(resolve=>setTimeout(resolve,2200));
      let r,result;
      try{
        r=await fetch(jobStatusUrl+'?id='+encodeURIComponent(job.id),{
          mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(14000)
        });
        result=await r.json().catch(()=>({}));
      }catch(error){
        if(++connectionErrors>12)throw Error('Интернет нестабилен. Задача сохранена — открой чат снова, чтобы получить готовый файл. Не запускай генерацию повторно.');
        continue;
      }
      connectionErrors=0;
      if(!r.ok)throw Error(result.error||'Не удалось проверить генерацию.');
      if(result.state==='working')continue;
      if(result.state==='failed'){
        try{localStorage.removeItem(jobKey)}catch{}
        throw Error(result.error||'Не удалось создать файл.');
      }
      if(result.state==='complete'){
        try{localStorage.removeItem(jobKey)}catch{}
        if(!result.artifact)throw Error('Генератор завершился без файла.');
        return result;
      }
    }
    throw Error('Генерация всё ещё выполняется. Задача сохранена — открой чат позже, не создавая повторный платный запрос.');
  }
  function rememberJob(job){
    try{localStorage.setItem(jobKey,JSON.stringify({id:job.id,kind:job.kind,at:Date.now()}))}catch{}
  }
  // Display the wait state immediately and render genuine streamed tokens.
  // This bubble is persisted to local chat history only when the reply finishes.
  // PLUX V29.1: the same soft sound as the existing onboarding/home screen,
  // paired with real progressive, grapheme-safe typing in chat. No extra audio
  // engine: PLUX125 owns volume, sound-on/off and mobile audio-unlock policy.
  function startTextReply(){
    const row=document.createElement('div');row.className='chat-row bot plux29-live-row';
    const avatar=document.createElement('img');avatar.className='chat-mini';avatar.alt='';avatar.src='/assets/states/idle.webp';
    const bubble=document.createElement('div');bubble.className='chat-bubble plux29-live-bubble';
    const hint=document.createElement('span');hint.className='plux29-hint';hint.textContent='ПЛЮХ готовит ответ';
    const dots=document.createElement('span');dots.className='plux29-dots';dots.setAttribute('aria-hidden','true');
    hint.append(dots);bubble.append(hint);row.append(avatar,bubble);feed.append(row);
    feed.scrollTop=feed.scrollHeight;
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
    const segmenter=typeof Intl?.Segmenter==='function'?new Intl.Segmenter('ru',{granularity:'grapheme'}):null;
    const split=text=>segmenter?[...segmenter.segment(text)].map(x=>x.segment):Array.from(text);
    let incoming='',chars=[],position=0,started=false,finished=false,finalizing=false;
    let timer=null,onComplete=null;
    function persist(text){
      const h=history();h.push({from:'bot',text:String(text).slice(0,5000),at:Date.now()});
      try{localStorage.setItem('plux_messages',JSON.stringify(h.slice(-75)))}catch{}
    }
    function clearTick(){if(timer!==null){clearInterval(timer);timer=null}}
    function draw(){
      if(finished)return;
      const left=chars.length-position;
      if(!left){
        if(finalizing){
          finished=true;clearTick();
          bubble.classList.remove('plux29-live-bubble','plux29-streaming');
          row.classList.remove('plux29-live-row');
          persist(incoming);
          feed.scrollTop=feed.scrollHeight;
          onComplete?.();
        }
        return;
      }
      if(!started){
        started=true;bubble.textContent='';
        bubble.classList.add('plux29-streaming');
      }
      // Stay expressive on short answers, but catch up quickly when a long
      // chunk arrives or streaming finishes. Never delay a large reply by minutes.
      const pace=reduced?left:
        left>450?Math.min(35,Math.ceil(left/22)):
        left>130?Math.min(16,Math.ceil(left/22)):
        finalizing?Math.min(9,Math.max(2,Math.ceil(left/35))):
        left>45?3:1;
      const chunk=chars.slice(position,position+pace).join('');
      position+=pace;
      const nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<160;
      bubble.append(document.createTextNode(chunk));
      if(!reduced&&chunk.trim()&&!document.hidden){
        window.PLUX125?.playTypeClick?.();
      }
      if(nearBottom)feed.scrollTop=feed.scrollHeight;
    }
    function startTick(){
      if(finished||timer!==null)return;
      timer=setInterval(draw,reduced?15:29);
      draw();
    }
    return {
      update(text){
        if(finished||finalizing)return;
        const next=String(text||'').slice(0,5000);
        if(next===incoming)return;
        incoming=next;chars=split(next);
        startTick();
      },
      finish(text){
        if(finished)return Promise.resolve();
        const finalText=String(text||incoming).slice(0,5000);
        if(finalText!==incoming){incoming=finalText;chars=split(finalText);}
        finalizing=true;
        startTick();
        return new Promise(resolve=>{onComplete=resolve;if(finished)resolve()});
      },
      stop(){
        if(finished)return;
        finished=true;clearTick();
        // A network error must not erase already received words.
        if(position>0){
          const partial=chars.slice(0,position).join('');
          bubble.textContent=partial;
          bubble.classList.remove('plux29-live-bubble','plux29-streaming');
          row.classList.remove('plux29-live-row');
          persist(partial);
        }else row.remove();
        onComplete?.();
      }
    };
  }
  async function readTextStream(response,live){
    if(!response.body||!response.body.getReader)throw Error('Телефон не поддерживает потоковый ответ.');
    const reader=response.body.getReader(),decoder=new TextDecoder();
    let buffer='',answer='',finished=false;
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      if(buffer.length>100_000)throw Error('Ошибка передачи ответа.');
      const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';
      for(const line of lines){
        if(!line.trim())continue;
        let event;
        try{event=JSON.parse(line)}catch{continue}
        if(event.type==='delta'&&typeof event.text==='string'){
          answer=(answer+event.text).slice(0,5000);
          live.update(answer);
        }
        if(event.type==='error')throw Error(event.message||'Ошибка модели.');
        if(event.type==='done')finished=true;
      }
    }
    if(!finished||!answer.trim())throw Error('Соединение прервалось до окончания ответа. Попробуй ещё раз.');
    await live.finish(answer);
    return answer;
  }
  async function send(text){
    if(busy)return;busy=true;
    const attachments=window.PLUXMediaV129?.takeAttachments?.()||[];
    const display=text||'Проанализируй вложения';
    const summary=attachments.map(x=>'📎 '+x.name).join('\n');
    const button=form.querySelector('.chat-send');if(button)button.disabled=true;
    append('user',display+(summary?'\n'+summary:''));
    const kind=pdfIntent(text)?'pdf':imageIntent(text)?'image':null;
    const generating=kind?showGenerating(kind):null;
    const live=kind?null:startTextReply();
    const messages=history().filter(m=>m.from==='user'||m.from==='bot').slice(-12).map(m=>({role:m.from==='user'?'user':'assistant',content:m.text.slice(0,2400)}));
    try{
      const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,attachments,clientFeatures:{generationJobs:true,textStreaming:true}}),signal:AbortSignal.timeout(generating?25000:65000)});
      if(response.ok&&response.headers.get('content-type')?.includes('application/x-ndjson')){
        await readTextStream(response,live);
        return;
      }
      let result=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(result.error||'Не удалось получить ответ ИИ');
      live?.stop();
      if(result.job){
        rememberJob(result.job);
        result=await pollJob(result.job);
      }
      if(typeof result.reply==='string'&&result.reply.trim()){
        const text=String(result.reply);
        // A language model's markdown/JSON referencing an internal
        // chatgpt.com/backend-api URL is NOT a generated image file.
        const fake=/chatgpt\.com\/backend-api\/estuary|\`\`\`json[\s\S]{0,200}"size"/i.test(text);
        if(fake&&!result.artifact){
          append('info','Сервер вернул текст вместо настоящего фото. Повтори запрос: «Создай изображение ...». Ссылки ChatGPT внутри стороннего приложения не работают.');
        }else append('bot',text);
      }
      else if(!result.artifact)throw Error('Пустой ответ модели');
      if(result.artifact?.type==='image'){
        generating?.ready();
        appendArtifact(result.artifact,()=>generating?.stop());
      }else{
        generating?.stop();
        if(result.artifact)appendArtifact(result.artifact);
      }
    }catch(e){
      live?.stop();
      generating?.stop();
      append('info',e.name==='TimeoutError'?'Генератор не ответил вовремя. Проверь чат и баланс, прежде чем запускать повторную платную генерацию.':String(e.message||'Связь с сервером недоступна.'));
    }
    finally{busy=false;if(button)button.disabled=false}
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;const t=input.value.trim();if(!t&&!window.PLUXMediaV129?.hasAttachments?.())return;
    // Create video through the same written conversation without mixing it with voice mode.
    // Other messages, attachments, PDFs and images preserve their existing routes.
    if(window.PLUXMusic?.interpret?.(t,{source:'chat'})){input.value='';return;}
    const videoRequest=/(?:созда|сдела|сгенериру|подготов|сними|нарису)/i.test(t)
      &&/(?:видео|видеоролик|ролик|анимаци)/i.test(t);
    if(videoRequest && window.PLUXVideoV16 && !window.PLUXMediaV129?.hasAttachments?.()){
      input.value='';window.PLUXVideoV16.open(t);return;
    }
    input.value='';void send(t);
  },true);
  window.PLUXChatAPI={model:'gpt-6-luna',endpoint};
  // Recover the original job after a tab/app restart instead of paying twice.
  try{
    const saved=JSON.parse(localStorage.getItem(jobKey)||'null');
    if(saved?.id&&Date.now()-saved.at<17*60*1000){
      setTimeout(async()=>{
        if(busy)return;
        busy=true;
        const loading=showGenerating(saved.kind);
        append('info','Восстанавливаю ранее запущенную генерацию…');
        try{
          const ready=await pollJob(saved);
          if(typeof ready.reply==='string')append('bot',ready.reply);
          if(ready.artifact?.type==='image'){
            ready.artifact&&appendArtifact(ready.artifact,()=>loading.stop());
          }else{
            loading.stop();if(ready.artifact)appendArtifact(ready.artifact);
          }
        }catch(error){loading.stop();append('info',String(error.message||'Не удалось восстановить задачу.'))}
        finally{busy=false}
      },1100);
    }
  }catch{}
})();