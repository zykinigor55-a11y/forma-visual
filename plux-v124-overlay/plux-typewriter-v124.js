/** PLUX V12.4 · screen-aware text reveal. It never blocks input or retypes old messages. */
(() => {
  'use strict';
  const home=document.getElementById('screen-home');
  const title=document.getElementById('greeting-title');
  const subtitle=document.getElementById('greeting-subtitle');
  const chat=document.getElementById('chat-messages');
  if(!home||!title||!subtitle)return;
  document.documentElement.classList.add('plux124-typewriter');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const segments=text => window.Intl?.Segmenter ?
    [...new Intl.Segmenter('ru',{granularity:'grapheme'}).segment(text)].map(x=>x.segment) : Array.from(text);
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let shown=false, token=0, target='', subtitleTarget='';
  function finish(){
    token++;
    if(!shown)return;
    title.textContent=target;
    subtitle.textContent=subtitleTarget;
    subtitle.classList.add('plux124-revealed');
    title.classList.remove('plux124-writing');
  }
  async function showHome(){
    if(shown||home.hidden||document.hidden)return;
    shown=true;
    target=title.textContent||'Привет! 👋';
    subtitleTarget=subtitle.textContent||'Чем займёмся сегодня?';
    if(reduced.matches){finish();return}
    const id=++token;
    title.setAttribute('aria-label',target);
    title.classList.add('plux124-writing');
    title.textContent='';
    subtitle.classList.remove('plux124-revealed');
    await delay(240);
    const parts=segments(target);
    for(let i=0;i<parts.length;i++){
      if(id!==token||home.hidden||document.hidden){finish();return}
      title.textContent+=parts[i];
      await delay(/[,.! ]/.test(parts[i])?60:38);
    }
    if(id!==token)return;
    title.classList.remove('plux124-writing');
    subtitle.classList.add('plux124-revealed');
  }
  function maybeStart(){ if(!home.hidden){void showHome()}else if(shown)finish() }
  new MutationObserver(maybeStart).observe(home,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();else maybeStart()});
  // Do not delay the active user: leaving the greeting immediately reveals full text.
  home.querySelectorAll('button').forEach(b=>b.addEventListener('pointerdown',finish,{passive:true}));
  requestAnimationFrame(maybeStart);

  if(!chat)return;
  // Initial chat history is left as normal readable content.
  for(const row of chat.querySelectorAll('.chat-row.bot'))row.dataset.plux124Known='true';
  const live=()=>!document.hidden && !document.getElementById('screen-chat')?.hidden;
  let chatToken=0;
  async function revealBot(row){
    if(row.dataset.plux124Known)return;
    row.dataset.plux124Known='true';
    const bubble=row.querySelector('.chat-bubble');
    if(!bubble)return;
    const full=bubble.textContent||'';
    if(!live()||reduced.matches||full.length>650)return;
    const id=++chatToken;
    bubble.setAttribute('aria-label',full);
    bubble.textContent='';
    bubble.classList.add('plux124-chat-writing');
    for(const char of segments(full)){
      if(id!==chatToken||!live())break;
      bubble.textContent+=char;
      await delay(/[,.!?]/.test(char)?85:19);
    }
    bubble.textContent=full;
    bubble.classList.remove('plux124-chat-writing');
    bubble.removeAttribute('aria-label');
  }
  new MutationObserver(muts=>{
    for(const mut of muts){
      for(const node of mut.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.('.chat-row.bot'))void revealBot(node);
        for(const row of node.querySelectorAll?.('.chat-row.bot')||[])void revealBot(row);
      }
    }
  }).observe(chat,{childList:true,subtree:true});
  document.getElementById('screen-chat')?.addEventListener('pointerdown',()=>{chatToken++},{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)chatToken++});
  window.PLUXTypewriter={skip:finish,replayHome(){if(home.hidden)return;shown=false;void showHome()}};
})();