/* FORMA · native horizontal swipe with accessible fallback arrows. */
(() => {
 'use strict';
 function init(){
  const strip=document.querySelector('.forma-workflow-launcher');
  if(!strip||strip.dataset.swipeReady)return;
  strip.dataset.swipeReady='1';
  const wrapper=document.createElement('div');wrapper.className='forma-workflow-swipe';
  strip.parentNode.insertBefore(wrapper,strip);wrapper.append(strip);
  const prev=document.createElement('button'),next=document.createElement('button');
  for(const [btn,cls,label,content] of [[prev,'prev','Предыдущий инструмент','‹'],[next,'next','Следующий инструмент','›']]){
   btn.type='button';btn.className='forma-workflow-arrowbtn '+cls;
   btn.setAttribute('aria-label',label);btn.textContent=content;wrapper.append(btn);
  }
  function update(){
    const max=strip.scrollWidth-strip.clientWidth;
    const overflow=max>12;
    prev.hidden=next.hidden=!overflow;
    prev.disabled=strip.scrollLeft<=5;
    next.disabled=strip.scrollLeft>=max-5;
  }
  function move(direction){
   const card=strip.querySelector('.forma-workflow-card');
   const delta=(card?.getBoundingClientRect().width||200)+10;
   strip.scrollBy({left:direction*delta,behavior:'smooth'});
  }
  prev.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  strip.addEventListener('scroll',update,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(update).observe(strip);
  window.addEventListener('resize',update,{passive:true});
  requestAnimationFrame(update);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();