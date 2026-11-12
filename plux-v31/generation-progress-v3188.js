/* PLUX 31.8.8: a SINGLE progress widget for Create and Chat.
   Same DOM, typography and motion in both screens. Percentages are estimates
   (the image provider does not expose true progress), capped at 94% until the
   actual image bytes have been decoded. */
(()=>{
"use strict";
if(window.PLUXGenerationProgressV3188)return;
const MAX=94;
function mount(target,{kind="image",model="GPT Image 2",edit=false}={}){
 if(!target)throw Error("Нет контейнера генерации");
 const root=document.createElement("section");
 root.className="plux3188-progress";
 root.setAttribute("role","status");root.setAttribute("aria-live","polite");
 root.setAttribute("aria-busy","true");root.setAttribute("data-plux-progress","estimate");
 const halo=document.createElement("div");halo.className="plux3188-progress-orbit";halo.setAttribute("aria-hidden","true");
 for(let i=0;i<3;i++){const arc=document.createElement("span");arc.className="plux3188-progress-arc";halo.append(arc)}
 const core=document.createElement("i");core.className="plux3188-progress-core";halo.append(core);
 const content=document.createElement("div");content.className="plux3188-progress-content";
 const heading=document.createElement("strong");heading.className="plux3188-progress-title";
 heading.textContent=kind==="presentation"?"Создаю презентацию":kind==="pdf"?"Создаю документ":edit?"Редактирую фотографию":"Создаю изображение";
 const sub=document.createElement("small");sub.className="plux3188-progress-sub";sub.textContent=String(model).slice(0,55)+" · Подключаю генератор…";
 const row=document.createElement("div");row.className="plux3188-progress-numbers";
 const foot=document.createElement("span");foot.textContent="Примерный прогресс";
 const number=document.createElement("b");number.className="plux3188-progress-value";
 row.append(foot,number);
 const track=document.createElement("div");track.className="plux3188-progress-track";
 track.setAttribute("role","progressbar");track.setAttribute("aria-label","Примерный прогресс генерации");
 track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax","100");
 const fill=document.createElement("i");fill.className="plux3188-progress-fill";track.append(fill);
 content.append(heading,sub,row,track);root.append(halo,content);target.append(root);
 let value=4,ended=false,manualStatus="",stage=0;
 const started=Date.now();
 const phrases=kind==="image"?["Генерирую изображение…","Прорабатываю детали…","Ожидаю готовый файл…"]:
  kind==="presentation"?["Собираю структуру…","Оформляю слайды…","Подготавливаю файл…"]:
  ["Подготавливаю содержание…","Оформляю страницы…","Собираю документ…"];
 function setProgress(n){
  if(ended)return;
  value=Math.max(value,Math.min(MAX,Math.round(Number(n)||0)));
  number.textContent=value+"%";
  fill.style.width=value+"%";track.setAttribute("aria-valuenow",String(value));
 }
 function state(value){
  if(ended)return;
  manualStatus=String(value||"").slice(0,105);
  sub.textContent=String(model).slice(0,55)+" · "+manualStatus;
 }
 setProgress(4);
 const timer=setInterval(()=>{
  if(ended)return;
  const secs=(Date.now()-started)/1000;
  setProgress(Math.min(MAX,Math.round(6+89*(1-Math.exp(-secs/62)))));
  const next=Math.min(2,Math.floor(secs/24));
  if(!manualStatus||next>stage){
   stage=next;manualStatus="";
   sub.textContent=String(model).slice(0,55)+" · "+phrases[stage];
  }
 },600);
 function finish(){
  if(ended)return;
  clearInterval(timer);
  number.textContent="100%";fill.style.width="100%";track.setAttribute("aria-valuenow","100");
  sub.textContent=String(model).slice(0,55)+" · Готово";
  root.setAttribute("aria-busy","false");
  ended=true;
 }
 function fail(message){
  if(ended)return;
  ended=true;clearInterval(timer);
  root.setAttribute("aria-busy","false");
  root.classList.add("plux3188-progress-error");
  heading.textContent="Не удалось создать "+(kind==="image"?"изображение":"файл");
  sub.textContent=String(message||"Связь с генератором прервана.").slice(0,210);
  number.textContent="Ошибка";track.removeAttribute("aria-valuenow");fill.style.width="0%";
 }
 function end(){clearInterval(timer);ended=true;root.remove()}
 return {root,setProgress,state,finish,fail,end};
}
window.PLUXGenerationProgressV3188={mount};
})();
