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
    }catch(e){append('info',e.name==='TimeoutError'?'Сервер долго не отвечает. Попробуй ещё раз.':String(e.message||'Связь с сервером недоступна.'))}
    finally{busy=false;if(button)button.disabled=false}
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;const t=input.value.trim();if(!t&&!window.PLUXMediaV129?.hasAttachments?.())return;input.value='';void send(t);
  },true);
  window.PLUXChatAPI={model:'gpt-6-luna',endpoint};
})();