(()=>{
'use strict';
const ribbon=document.getElementById('ribbon-scroll');
const left=document.querySelector('[data-ribbon-prev]');
const right=document.querySelector('[data-ribbon-next]');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(ribbon){
 let direction=1,paused=false,visible=true,holdUntil=0,previous=0,touching=false;
 const pauseFor=(ms)=>{holdUntil=performance.now()+ms};
 const step=(sign)=>{direction=sign;ribbon.scrollBy({left:sign*ribbon.clientWidth*.74,behavior:reduce?'auto':'smooth'});pauseFor(3500)};
 left?.addEventListener('click',()=>step(-1));
 right?.addEventListener('click',()=>step(1));
 ribbon.addEventListener('pointerdown',()=>{touching=true;paused=true},{passive:true});
 ribbon.addEventListener('pointerup',()=>{touching=false;paused=false;pauseFor(4500)},{passive:true});
 ribbon.addEventListener('pointercancel',()=>{touching=false;paused=false;pauseFor(2500)},{passive:true});
 ribbon.addEventListener('mouseenter',()=>{paused=true});
 ribbon.addEventListener('mouseleave',()=>{if(!touching)paused=false});
 ribbon.addEventListener('focusin',()=>{paused=true});
 ribbon.addEventListener('focusout',()=>{paused=false;pauseFor(1800)});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=!!es[0]?.isIntersecting},{threshold:.05}).observe(ribbon);
 document.addEventListener('visibilitychange',()=>{previous=0});
 const run=(time)=>{
  const dt=previous?Math.min(time-previous,48):16;previous=time;
  if(!reduce&&!paused&&visible&&!document.hidden&&time>holdUntil){
    const max=ribbon.scrollWidth-ribbon.clientWidth;
    if(max>0){
      ribbon.scrollLeft+=direction*dt*.051;
      if(ribbon.scrollLeft>=max-2){direction=-1;pauseFor(1000)}
      if(ribbon.scrollLeft<=1){direction=1;pauseFor(1000)}
    }
  }
  requestAnimationFrame(run);
 };
 if(!reduce)requestAnimationFrame(run);
}
const list=[...document.querySelectorAll('[data-exhibit]')];
const dialog=document.getElementById('exhibit-viewer');
if(!dialog||!list.length)return;
const shot=dialog.querySelector('#exhibit-photo'),label=dialog.querySelector('#exhibit-title');
let index=0,token=0,returnFocus=null,startTouch=null;
function show(n){
 index=(n+list.length)%list.length;
 const target=list[index],src=target.dataset.src,title=target.dataset.title,version=++token;
 shot.classList.add('is-changing');
 const pre=new Image();
 pre.onload=()=>{
  if(version!==token)return;
  shot.src=src;shot.alt=title;label.textContent=String(index+1).padStart(2,'0')+' / '+list.length+' · '+title;
  requestAnimationFrame(()=>shot.classList.remove('is-changing'));
 };
 pre.onerror=()=>{if(version!==token)return;shot.src=src;label.textContent=title;shot.classList.remove('is-changing')};
 pre.src=src;
}
function open(n){returnFocus=document.activeElement;dialog.hidden=false;document.body.classList.add('modal-active');show(n);dialog.querySelector('.modal-close').focus({preventScroll:true})}
function close(){dialog.hidden=true;document.body.classList.remove('modal-active');token++;shot.classList.remove('is-changing');returnFocus?.focus?.({preventScroll:true})}
list.forEach((el,i)=>el.addEventListener('click',()=>open(i)));
dialog.querySelector('.modal-close').addEventListener('click',close);
dialog.querySelector('.modal-prev').addEventListener('click',()=>show(index-1));
dialog.querySelector('.modal-next').addEventListener('click',()=>show(index+1));
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
dialog.addEventListener('touchstart',e=>{startTouch=e.changedTouches[0]?.clientX??null},{passive:true});
dialog.addEventListener('touchend',e=>{if(startTouch===null)return;const dx=(e.changedTouches[0]?.clientX??startTouch)-startTouch;startTouch=null;if(Math.abs(dx)>52)show(index+(dx<0?1:-1))},{passive:true});
document.addEventListener('keydown',e=>{
 if(dialog.hidden)return;
 if(e.key==='Escape'){e.preventDefault();close()}
 if(e.key==='ArrowLeft'){e.preventDefault();show(index-1)}
 if(e.key==='ArrowRight'){e.preventDefault();show(index+1)}
 if(e.key==='Tab'){const b=[...dialog.querySelectorAll('button')],i=b.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();b.at(-1).focus()}else if(!e.shiftKey&&i===b.length-1){e.preventDefault();b[0].focus()}}
});
})();
