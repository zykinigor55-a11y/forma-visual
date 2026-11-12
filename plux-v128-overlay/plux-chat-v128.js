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
  function appendArtifact(item){
    if(!item||!['image','pdf','presentation'].includes(item.type))return;
    const file=String(item.filename|| (item.type==='presentation'?'PLUX-presentation.pptx':item.type==='pdf'?'PLUX.pdf':'PLUX.png')).replace(/[\\\/<>:*?"|]/g,'').slice(0,90);
    const uri=downloadable(item.dataUrl)||(typeof item.url==='string'&&item.url.startsWith('https://')?item.url:null);
    if(!uri){append('info','Не удалось открыть вложение от генератора.');return}
    const row=document.createElement('div');row.className='chat-row bot plux14-artifact-row';
    const avatar=document.createElement('img');avatar.className='chat-mini';avatar.src='/assets/states/idle.webp';avatar.alt='';row.append(avatar);
    const bubble=document.createElement('div');bubble.className='chat-bubble plux14-artifact';
    if(item.type==='image'){
      const picture=document.createElement('img');picture.className='plux14-created-image';picture.src=uri;picture.alt='Изображение, созданное GPT Image 2';
      picture.loading='lazy';bubble.append(picture);
      const title=document.createElement('div');title.className='plux14-file-title';title.textContent='GPT Image 2 · 1024 × 1024';
      bubble.append(title);
    }else{
      const icon=document.createElement('span');icon.className='plux14-pdf-icon';icon.textContent=item.type==='presentation'?'PPTX':'PDF';bubble.append(icon);
      const title=document.createElement('span');title.className='plux14-file-title';title.textContent=String(item.title||file).slice(0,120);
      bubble.append(title);
    }
    const action=document.createElement('a');action.className='plux14-download';action.textContent=item.type==='presentation'?'Скачать презентацию PPTX':item.type==='pdf'?'Скачать PDF':'Сохранить изображение';
    action.href=uri;
    if(uri.startsWith('blob:'))action.download=file;
    if(item.type==='presentation'&&uri.startsWith('https://'))action.download=file;
    else{action.target='_blank';action.rel='noopener noreferrer'}
    bubble.append(action);row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
  }
  function isPresentation(text){
    const s=String(text||'').toLowerCase();
    return /(?:сделай|создай|собери|подготовь|оформи|придумай|сгенерируй|нужна|хочу)\\s.{0,55}(?:презентаци|слайды|powerpoint|pptx)/i.test(s)
       || /^(?:презентация|презентацию|слайды|pptx)\\b/i.test(s);
  }
  function inferredKind(text){
    if(isPresentation(text))return 'presentation';
    if(/(?:созда|сдела|сгенериру|нарису|подготов).{0,65}(?:картин|изображени|фото|портрет|иллюстраци)/i.test(text)||/(?:нарисуй)/i.test(text))return 'image';
    if(/(?:сдела|созда|подготов|нужен|хочу).{0,55}(?:пдф|pdf)/i.test(text))return 'pdf';
    return null;
  }
  function appendPending(kind){
    const row=document.createElement('div');row.className='chat-row bot plux3184-progress-row';
    const bubble=document.createElement('div');bubble.className='chat-bubble plux3184-generation';
    const visual=document.createElement('div');visual.className='plux3184-render-visual';visual.setAttribute('aria-hidden','true');
    for(let i=0;i<3;i++){const shape=document.createElement('i');shape.className='plux3184-render-orbit';visual.append(shape)}
    const body=document.createElement('div');body.className='plux3184-render-body';
    const heading=document.createElement('strong');heading.textContent=kind==='image'?'Создаю изображение':kind==='presentation'?'Собираю презентацию':'Готовлю документ';
    const status=document.createElement('small');status.textContent='Подключение генератора…';
    const track=document.createElement('div');track.className='plux3184-render-track';track.append(document.createElement('i'));
    body.append(heading,status,track);bubble.append(visual,body);row.append(bubble);feed.append(row);feed.scrollTop=feed.scrollHeight;
    let stage=0;const messages=kind==='image'?['Генерирую изображение…','Детализирую результат…','Подготавливаю файл…']:
      kind==='presentation'?['Продумываю структуру…','Собираю слайды и иллюстрации…','Подготавливаю PowerPoint…']:
      ['Подготавливаю документ…','Оформляю страницы…','Создаю PDF…'];
    const clock=setInterval(()=>{status.textContent=messages[Math.min(stage++,messages.length-1)]},8000);
    return {
      state:message=>{status.textContent=message},
      end:()=>{clearInterval(clock);row.remove()}
    };
  }
  function appendUploads(attachments){
    for(const item of attachments){
      if(!item?.mime?.startsWith('image/')||!/^data:image\\/(png|jpeg|webp);base64,/.test(item.dataUrl||''))continue;
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
    const display=text||'Проанализируй вложения';
    const summary=attachments.map(x=>'📎 '+x.name).join('\n');
    const button=form.querySelector('.chat-send');if(button)button.disabled=true;
    append('user',display+(summary?'\n'+summary:''));
    appendUploads(attachments);
    const kind=inferredKind(display);
    const progress=kind?appendPending(kind):null;
    const messages=history().filter(m=>m.from==='user'||m.from==='bot').slice(-12).map(m=>({role:m.from==='user'?'user':'assistant',content:m.text.slice(0,2400)}));
    try{
      const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,attachments,requestedArtifact:kind||undefined,clientFeatures:{generationJobs:!!kind}}),signal:AbortSignal.timeout(65000)});
      let result=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(result.error||'Не удалось получить ответ ИИ');
      if(response.status===202&&result.job)result=await pollJob(result.job,progress||{state:()=>{}});
      if(progress)progress.end();
      if(typeof result.reply==='string'&&result.reply.trim())append('bot',result.reply);
      if(result.artifact)appendArtifact(result.artifact);
      if(!result.reply&&!result.artifact)throw Error('Сервер не вернул результат.');
    }catch(e){progress?.end();append('info',e.name==='TimeoutError'?'Сервер долго не отвечает. Попробуй ещё раз.':String(e.message||'Связь с сервером недоступна.'))}
    finally{busy=false;if(button)button.disabled=false}
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