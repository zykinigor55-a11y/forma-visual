/* PLUX V26: six unified satin glass mode icons. The existing six buttons,
 * their dataset navigation targets and click handlers remain unchanged.
 */
(()=>{
 "use strict";
 const host=document.querySelector("#screen-modes .mode-grid");
 if(!host)return;
 const icons={
  chat:'<path d="M6 7h20v15H14l-6 5v-5H6z"/><path d="M10 13h12M10 17h8"/>',
  voice:'<rect x="12" y="4" width="8" height="16" rx="4"/><path d="M8 16c0 10 16 10 16 0M16 25v4M11 29h10"/>',
  create:'<rect x="4" y="5" width="24" height="22" rx="4"/><circle cx="12" cy="12" r="2"/><path d="M5.5 23.5 12 17l4.5 4 4.5-5 6.5 6.5"/>',
  video:'<rect x="4" y="7" width="24" height="20" rx="4"/><path d="m13 12 9 5-9 5z"/>',
  music:'<path d="M14 23V6l13-2v16"/><ellipse cx="9.5" cy="24" rx="4.5" ry="3"/><ellipse cx="22.5" cy="21" rx="4.5" ry="3"/>',
  gallery:'<rect x="4" y="5" width="24" height="22" rx="4"/><circle cx="12" cy="12" r="2.5"/><path d="m6 23 7-6.5 5.5 4.5 3.5-4 4 4"/>'
 };
 const modes=[
  {key:"chat",title:"Пообщаться",subtitle:"Чат и идеи"},
  {key:"voice",title:"Поговорить",subtitle:"Голосовой диалог"},
  {key:"create",title:"Создать изображение",subtitle:"Фото и творчество"},
  {key:"video",title:"Создать видео",subtitle:"Видео из идей"},
  {key:"music",title:"Музыка и звук",subtitle:"Плеер Audius"},
  {key:"gallery",title:"Галерея",subtitle:"Мои фото и видео"}
 ];
 const buttons=[...host.querySelectorAll("button.mode-card")];
 const svgFor=key=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>';
 for(const [index,button] of buttons.entries()){
  const id=button.dataset.action||button.dataset.go;
  const conf=modes.find(x=>x.key===id)||(id==="more"?modes[5]:modes[index]);
  if(!conf)continue;
  // For Gallery, PLUXGallery has already converted data-action="more" to "gallery".
  // Do not modify the data-action for any other mode: their bound listeners
  // are attached to the button, not to its icon or labels.
  button.classList.add("plux26-mode-card");
  button.setAttribute("aria-label",conf.title+". "+conf.subtitle);
  button.replaceChildren();
  const emblem=document.createElement("span");emblem.className="plux26-mode-icon";
  emblem.innerHTML=svgFor(conf.key);
  const title=document.createElement("strong");title.textContent=conf.title;
  const subtitle=document.createElement("small");subtitle.textContent=conf.subtitle;
  button.append(emblem,title,subtitle);
  if(conf.key==="create"){
    button.addEventListener("click",()=>{
      // Existing [data-go=create] handler opens the dedicated Nano Banana screen.
      // Fallback only if no navigation took place.
      requestAnimationFrame(()=>{
        if(!document.getElementById("screen-create")?.hidden)return;
        document.getElementById("open-create-quick")?.click();
      });
    });
  }
 }
})();
