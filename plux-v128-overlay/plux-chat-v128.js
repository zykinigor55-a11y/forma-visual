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
    if(!item||!['image','pdf'].includes(item.type))return;
    const file=String(item.filename|| (item.type==='pdf'?'PLUX.pdf':'PLUX.png')).replace(/[\\\/<>:*?"|]/g,'').slice(0,90);
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
      const icon=document.createElement('span');icon.className='plux14-pdf-icon';icon.textContent='PDF';bubble.append(icon);
      const title=document.createElement('span');title.className='plux14-file-title';title.textContent=String(item.title||file).slice(0,120);
      bubble.append(title);
    }
    const action=document.createElement('a');action.className='plux14-download';action.textContent=item.type==='pdf'?'Скачать PDF':'Сохранить изображение';
    action.href=uri;
    if(uri.startsWith('blob:'))action.download=file;
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
  async function send(text){
    if(busy)return;busy=true;
    const attachments=window.PLUXMediaV129?.takeAttachments?.()||[];
    const display=text||'Проанализируй вложения';
    const summary=attachments.map(x=>'📎 '+x.name).join('\n');
    const button=form.querySelector('.chat-send');if(button)button.disabled=true;
    append('user',display+(summary?'\n'+summary:''));
    const messages=history().filter(m=>m.from==='user'||m.from==='bot').slice(-12).map(m=>({role:m.from==='user'?'user':'assistant',content:m.text.slice(0,2400)}));
    try{
      const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,attachments}),signal:AbortSignal.timeout(65000)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(result.error||'Не удалось получить ответ ИИ');
      if(typeof result.reply!=='string'||!result.reply.trim())throw Error('Пустой ответ модели');
      append('bot',result.reply);
      if(result.artifact)appendArtifact(result.artifact);
    }catch(e){append('info',e.name==='TimeoutError'?'Сервер долго не отвечает. Попробуй ещё раз.':String(e.message||'Связь с сервером недоступна.'))}
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