(()=>{
'use strict';
const list=[...document.querySelectorAll('[data-exhibit]')],dialog=document.getElementById('exhibit-viewer');
if(!dialog||!list.length)return;
const shot=dialog.querySelector('#exhibit-photo'),label=dialog.querySelector('#exhibit-title');
let idx=0,token=0,returnFocus=null;
function showFrame(n){idx=(n+list.length)%list.length;const card=list[idx];const next=++token;shot.style.visibility='hidden';const pre=new Image();pre.onload=()=>{if(next!==token)return;shot.src=card.dataset.src;shot.alt=card.dataset.title;shot.style.visibility='visible'};pre.onerror=()=>{if(next!==token)return;shot.src=card.dataset.src;shot.style.visibility='visible'};pre.src=card.dataset.src;label.textContent=card.dataset.title;}
function open(n){returnFocus=document.activeElement;dialog.hidden=false;document.body.classList.add('modal-active');showFrame(n);dialog.querySelector('.close').focus();}
function close(){if(dialog.hidden)return;dialog.hidden=true;document.body.classList.remove('modal-active');token++;returnFocus?.focus?.();}
list.forEach((x,i)=>x.addEventListener('click',()=>open(i)));
dialog.querySelector('.close').addEventListener('click',close);
dialog.querySelector('.modal-prev').addEventListener('click',()=>showFrame(idx-1));
dialog.querySelector('.modal-next').addEventListener('click',()=>showFrame(idx+1));
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
document.addEventListener('keydown',e=>{if(dialog.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')showFrame(idx-1);if(e.key==='ArrowRight')showFrame(idx+1);if(e.key==='Tab'){let a=[...dialog.querySelectorAll('button')];let i=a.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();a.at(-1).focus()}else if(!e.shiftKey&&i===a.length-1){e.preventDefault();a[0].focus()}}});
})();