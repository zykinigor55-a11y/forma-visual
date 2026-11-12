/* PLUX V31: the EXACT V30 theme switcher, expanded to 8 realistic color choices. */
(() => {
 "use strict";
 const STORAGE="plux_theme_v23";
 const THEMES=[
   {id:"emerald",title:"Изумрудный",description:"Фирменный цвет",accent:"#00bd7a"},
   {id:"azure",title:"Синий",description:"Настоящий синий",accent:"#1761ee"},
   {id:"ruby",title:"Красный",description:"Чистый красный",accent:"#e52034"},
   {id:"solar",title:"Золотой",description:"Тёплое золото",accent:"#e7bd55"},
   {id:"turquoise",title:"Бирюзовый",description:"Морская бирюза",accent:"#00c7c9"},
   {id:"violet",title:"Фиолетовый",description:"Глубокий фиолетовый",accent:"#8252e8"},
   {id:"rose",title:"Розовый",description:"Нежный розовый",accent:"#eb68ab"},
   {id:"silver",title:"Серебряный",description:"Светлое серебро",accent:"#bad6dc"}
 ];
 let active=THEMES[0].id;
 try{const pref=localStorage.getItem(STORAGE);if(THEMES.some(t=>t.id===pref))active=pref;}catch{}
 document.documentElement.dataset.pluxTheme=active;
 const home=document.querySelector("#screen-home .home-head");
 if(!home)return;
 const trigger=document.createElement("button");
 trigger.type="button";trigger.id="plux-theme-trigger";trigger.className="plux-theme-trigger";
 trigger.setAttribute("aria-label","Выбрать цвет ПЛЮХа");trigger.setAttribute("aria-haspopup","dialog");
 trigger.setAttribute("aria-expanded","false");trigger.title="Цвет ПЛЮХа";
 trigger.innerHTML='<span class="plux-theme-four" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
 const notifications=home.querySelector("#open-notifications");
 if(notifications)home.insertBefore(trigger,notifications);else home.append(trigger);
 const backdrop=document.createElement("div");
 backdrop.id="plux-theme-backdrop";backdrop.className="plux-theme-backdrop";backdrop.hidden=true;
 const dialog=document.createElement("section");dialog.className="plux-theme-dialog";
 dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");
 dialog.setAttribute("aria-label","Цвет ПЛЮХа");
 const heading=document.createElement("div");heading.className="plux-theme-heading";
 const title=document.createElement("div");title.innerHTML="<strong>Цвет капли</strong><small>Цвет меняет каплю, Инструменты и подсветку интерфейса</small>";
 const close=document.createElement("button");close.type="button";close.className="plux-theme-close";close.textContent="×";close.setAttribute("aria-label","Закрыть выбор цвета");
 heading.append(title,close);dialog.append(heading);
 const list=document.createElement("div");list.className="plux-theme-options";
 for(const theme of THEMES){
   const button=document.createElement("button");button.type="button";button.className="plux-theme-option";
   button.dataset.themeChoice=theme.id;button.setAttribute("aria-label",theme.title);
   const swatch=document.createElement("span");swatch.className="plux-theme-swatch";swatch.style.setProperty("--swatch-color",theme.accent);
   const caption=document.createElement("span");caption.className="plux-theme-name";caption.textContent=theme.title;
   const check=document.createElement("span");check.className="plux-theme-check";check.setAttribute("aria-hidden","true");check.textContent="✓";
   button.append(swatch,caption,check);list.append(button);
 }
 dialog.append(list);backdrop.append(dialog);document.body.append(backdrop);
 let previouslyFocused=null;
 function apply(next){
   if(!THEMES.some(t=>t.id===next))return;
   active=next;document.documentElement.dataset.pluxTheme=next;
   try{localStorage.setItem(STORAGE,next);}catch{}
   for(const b of list.children){
     const selected=b.dataset.themeChoice===active;
     b.classList.toggle("selected",selected);
     b.setAttribute("aria-pressed",String(selected));
   }
   window.dispatchEvent(new CustomEvent("plux:themechange",{detail:{theme:active}}));
 }
 function open(){
   previouslyFocused=document.activeElement;
   backdrop.hidden=false;
   trigger.setAttribute("aria-expanded","true");
   document.body.classList.add("plux-theme-open");
   const selected=list.querySelector(".selected");
   (selected||list.firstElementChild)?.focus({preventScroll:true});
 }
 function shut(){
   backdrop.hidden=true;trigger.setAttribute("aria-expanded","false");
   document.body.classList.remove("plux-theme-open");
   (previouslyFocused||trigger)?.focus?.({preventScroll:true});
 }
 trigger.addEventListener("click",()=>backdrop.hidden?open():shut());
 close.addEventListener("click",shut);
 backdrop.addEventListener("click",event=>{if(event.target===backdrop)shut()});
 list.addEventListener("click",event=>{
   const button=event.target.closest("button[data-theme-choice]");
   if(!button)return;apply(button.dataset.themeChoice);shut();
 });
 document.addEventListener("keydown",event=>{
   if(backdrop.hidden)return;
   if(event.key==="Escape"){event.preventDefault();shut();return}
   if(event.key==="Tab"){
      const items=[close,...list.querySelectorAll("button")];
      const index=items.indexOf(document.activeElement);
      if(event.shiftKey&&index<=0){event.preventDefault();items.at(-1).focus();}
      else if(!event.shiftKey&&index===items.length-1){event.preventDefault();items[0].focus();}
   }
 });
 window.PLUXThemes={set:apply,get:()=>active,all:()=>THEMES.map(({id,title})=>({id,title}))};
 window.PLUXThemesV31=window.PLUXThemes;
 apply(active);
})();
