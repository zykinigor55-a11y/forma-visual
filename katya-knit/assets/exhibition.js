(() => {
'use strict';
const slides=[...document.querySelectorAll('[data-exhibit]')];
const viewport=document.getElementById('exhibition-viewport');
const previous=document.getElementById('gallery-prev');
const next=document.getElementById('gallery-next');
const counter=document.getElementById('exhibition-count');
const progress=document.getElementById('exhibition-progress-fill');
const dialog=document.getElementById('exhibit-viewer');
if(!slides.length||!viewport||!dialog)return;
let current=0,modalIndex=0,loadToken=0,returnFocus=null,lastTouchX=null;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const picture=dialog.querySelector('#exhibit-photo'),caption=dialog.querySelector('#exhibit-title');
function activate(index){
 current=Math.max(0,Math.min(slides.length-1,index));
 slides.forEach((slide,i)=>slide.closest('.exhibition-work')?.classList.toggle('is-active',i===current));
 counter.innerHTML=String(current+1).padStart(2,'0')+' <span>/ '+String(slides.length).padStart(2,'0')+'</span>';
 if(previous)previous.disabled=current===0;
 if(next)next.disabled=current===slides.length-1;
 if(progress){progress.style.width=(100/slides.length)+'%';progress.style.transform='translateX('+(current*100)+'%)';}
}
function to(i){const target=Math.max(0,Math.min(i,slides.length-1));activate(target);const card=slides[target].closest('.exhibition-work');viewport.scrollTo({left:card.offsetLeft-slides[0].closest('.exhibition-work').offsetLeft,behavior:reduce?'auto':'smooth'});}
const findVisible=()=>{const base=viewport.getBoundingClientRect().left;let best=0,dist=Infinity;slides.forEach((slide,i)=>{const d=Math.abs(slide.closest('.exhibition-work').getBoundingClientRect().left-base-20);if(d<dist){dist=d;best=i}});activate(best)};
let raf=0;viewport.addEventListener('scroll',()=>{if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(findVisible)},{passive:true});
previous?.addEventListener('click',()=>to(current-1));
next?.addEventListener('click',()=>to(current+1));
viewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();to(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();to(current-1)}});
window.addEventListener('resize',findVisible);
activate(0);
function showFrame(index,animate=true){
 modalIndex=(index+slides.length)%slides.length;
 const slide=slides[modalIndex],src=slide.dataset.src,title=slide.dataset.title;
 const token=++loadToken;
 if(animate)picture.classList.add('is-changing');
 const pre=new Image();
 pre.onload=()=>{if(token!==loadToken)return;picture.src=src;picture.alt=title;caption.textContent=String(modalIndex+1).padStart(2,'0')+' / '+slides.length+' — '+title;requestAnimationFrame(()=>picture.classList.remove('is-changing'));};
 pre.onerror=()=>{if(token!==loadToken)return;picture.src=src;picture.alt=title;caption.textContent=title;picture.classList.remove('is-changing');};
 pre.src=src;
}
function open(i){returnFocus=document.activeElement;dialog.hidden=false;document.body.classList.add('modal-active');showFrame(i,false);dialog.querySelector('.close').focus({preventScroll:true})}
function close(){if(dialog.hidden)return;dialog.hidden=true;document.body.classList.remove('modal-active');loadToken++;picture.classList.remove('is-changing');returnFocus?.focus?.({preventScroll:true})}
slides.forEach((slide,i)=>slide.addEventListener('click',()=>open(i)));
dialog.querySelector('.close').addEventListener('click',close);
dialog.querySelector('.modal-prev').addEventListener('click',()=>showFrame(modalIndex-1));
dialog.querySelector('.modal-next').addEventListener('click',()=>showFrame(modalIndex+1));
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
dialog.addEventListener('touchstart',e=>{lastTouchX=e.changedTouches[0]?.clientX??null},{passive:true});
dialog.addEventListener('touchend',e=>{if(lastTouchX===null)return;const dx=(e.changedTouches[0]?.clientX??lastTouchX)-lastTouchX;lastTouchX=null;if(Math.abs(dx)>55)showFrame(modalIndex+(dx<0?1:-1))},{passive:true});
document.addEventListener('keydown',e=>{if(dialog.hidden)return;
 if(e.key==='Escape'){e.preventDefault();close()}
 if(e.key==='ArrowLeft'){e.preventDefault();showFrame(modalIndex-1)}
 if(e.key==='ArrowRight'){e.preventDefault();showFrame(modalIndex+1)}
 if(e.key==='Tab'){const a=[...dialog.querySelectorAll('button')],i=a.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();a.at(-1).focus()}else if(!e.shiftKey&&i===a.length-1){e.preventDefault();a[0].focus()}}
});
})();
