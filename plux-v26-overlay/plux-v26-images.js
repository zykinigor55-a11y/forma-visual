/* PLUX V26: fullscreen presentation of real generated images.
 * Never treat an invented chatgpt.com/backend-api link as a generated file.
 */
(()=>{
 "use strict";
 let overlay=null,previousFocus=null;
 function valid(src){
  if(typeof src!=="string")return false;
  if(/^data:image\/(png|jpeg|webp);base64,/.test(src))return true;
  if(/^blob:https?:\/\//.test(src))return true;
  try{const u=new URL(src);return u.protocol==="https:"&&!u.username&&!u.password
    &&u.hostname!=="chatgpt.com"&&u.hostname!=="www.chatgpt.com"}catch{return false}
 }
 function close(){
  if(!overlay)return;overlay.hidden=true;
  overlay.querySelector("img")?.removeAttribute("src");
  previousFocus?.focus?.({preventScroll:true});
 }
 function open({src,filename="PLUX-GPT-Image-2.png"}={}){
  if(!valid(src))return false;
  previousFocus=document.activeElement;
  if(!overlay){
   overlay=document.createElement("section");overlay.id="plux26-photo-viewer";overlay.hidden=true;
   overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
   overlay.setAttribute("aria-label","Созданное изображение");
   const picture=document.createElement("img");picture.alt="Изображение ПЛЮХа в полном размере";
   const actions=document.createElement("div");actions.className="plux26-actions";
   const back=document.createElement("button");back.type="button";back.textContent="Закрыть";
   back.addEventListener("click",close);
   const download=document.createElement("a");download.textContent="Сохранить фото";
   download.id="plux26-photo-save";download.rel="noopener noreferrer";
   actions.append(back,download);overlay.append(picture,actions);document.body.append(overlay);
   overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
  }
  const photo=overlay.querySelector("img"),save=overlay.querySelector("#plux26-photo-save");
  photo.src=src;save.href=src;
  if(src.startsWith("data:")||src.startsWith("blob:"))save.download=filename;
  else{save.removeAttribute("download");save.target="_blank";}
  overlay.hidden=false;overlay.querySelector(".plux26-actions button")?.focus({preventScroll:true});
  return true;
 }
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&overlay&&!overlay.hidden){e.preventDefault();close()}
 });
 window.PLUX26ImageViewer={open,close};
})();
