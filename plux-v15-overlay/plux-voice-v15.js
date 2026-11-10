/* PLUX V15 — premium click-to-voice in the existing OLED chat.
   No autoplay, no API keys in browser, no paid requests until the user presses "Озвучить".
*/
(()=>{
  "use strict";
  const server="https://pluh-voice-demo.onrender.com";
  const created=[];
  let currentAudio=null;
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const request=async(path,options={})=>{
    const response=await fetch(server+path,{
      mode:"cors",credentials:"omit",signal:AbortSignal.timeout(24000),
      ...options
    });
    if(!response.ok){
      const info=await response.json().catch(()=>null);
      throw new Error(String(info?.error||"Ошибка сервера озвучки.").slice(0,250));
    }
    return response;
  };
  const speaker='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/></svg>';
  const stopOther=()=>{
    if(currentAudio){
      try{currentAudio.pause();currentAudio.currentTime=0}catch{}
      currentAudio=null;
    }
  };
  window.addEventListener("pagehide",()=>{
    stopOther();
    for(const url of created)URL.revokeObjectURL(url);
    created.length=0;
  });
  function decorate(row,text){
    const bubble=row?.querySelector(".chat-bubble");
    if(!bubble||bubble.querySelector(".plux15-voice"))return;
    const spoken=String(text||"").replace(/https?:\/\/\S+/g,"").trim().slice(0,450);
    if(spoken.length<2)return;
    const area=document.createElement("div");
    area.className="plux15-voice";
    const button=document.createElement("button");
    button.type="button";button.className="plux15-voice-button";
    button.innerHTML=speaker+"<span>Озвучить</span>";
    button.setAttribute("aria-label","Озвучить ответ Плюха");
    button.title="Создать голосовую версию через ElevenLabs (платная генерация)";
    const status=document.createElement("span");
    status.className="plux15-voice-status";status.setAttribute("role","status");
    area.append(button,status);bubble.append(area);
    let clip=null,objectUrl=null;
    const set=(label,s,disabled)=>{
      button.querySelector("span").textContent=label;
      status.textContent=s||"";
      button.disabled=Boolean(disabled);
      button.setAttribute("aria-busy",disabled?"true":"false");
    };
    async function play(){
      if(!objectUrl)return;
      if(currentAudio&&currentAudio!==clip)stopOther();
      if(clip&&!clip.paused){
        clip.pause();set("Слушать","Пауза",false);return;
      }
      if(!clip){
        clip=new Audio();
        clip.preload="none";
        clip.src=objectUrl;
        clip.addEventListener("ended",()=>{set("Повторить","Прослушивание завершено",false);if(currentAudio===clip)currentAudio=null});
        clip.addEventListener("error",()=>{set("Слушать","Ошибка воспроизведения",false)});
      }
      currentAudio=clip;
      try{
        await clip.play();
        set("Пауза","Воспроизводится",false);
      }catch{
        set("Слушать","Нажми ещё раз, чтобы запустить аудио.",false);
      }
    }
    async function generate(){
      set("Готовлю голос…","Проверяю стоимость озвучки",true);
      try{
        const resp=await request("/api/tts/start",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({text:spoken}),
          signal:AbortSignal.timeout(45000)
        });
        const task=await resp.json();
        const id=String(task.taskId||"");
        if(!/^[0-9a-f-]{36}$/i.test(id))throw Error("Cyhub не вернул номер задачи.");
        const rub=Number.isInteger(task.amountMinor)?(task.amountMinor/100).toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})+" ₽":"";
        set("Генерирую…",rub?"Стоимость: "+rub:"Голосовая задача выполняется",true);
        let ready=false;
        for(let i=0;i<32;i++){
          await delay(3200);
          const check=await request("/api/tts/task/"+encodeURIComponent(id));
          const state=await check.json();
          if(state.status==="succeeded"){
            if(!state.ready)throw Error("Аудиофайл не найден в ответе Cyhub.");
            ready=true;break;
          }
          if(["failed","cancelled"].includes(state.status))throw Error(state.error||"Озвучка отменена сервисом.");
        }
        if(!ready)throw Error("Озвучка ещё обрабатывается. Попробуй повторить позже (запрос мог быть оплачен).");
        set("Загружаю MP3…","",true);
        const audio=await request("/api/tts/audio/"+encodeURIComponent(id),{signal:AbortSignal.timeout(30000)});
        const blob=await audio.blob();
        if(!blob.type.startsWith("audio/")||blob.size<100)throw Error("Cyhub вернул неподдерживаемый аудиофайл.");
        objectUrl=URL.createObjectURL(blob);created.push(objectUrl);
        const a=document.createElement("a");
        a.className="plux15-voice-download";a.href=objectUrl;a.download="PLUX-voice.mp3";
        a.textContent="Скачать MP3";area.append(a);
        set("Слушать",rub?"Голос готов · "+rub:"Голос готов",false);
      }catch(e){
        set("Озвучить",String(e.message||"Не удалось озвучить.").slice(0,190),false);
      }
    }
    button.addEventListener("click",()=>{
      if(objectUrl)void play();
      else void generate();
    });
  }
  window.PLUXVoiceV15={decorate};
})();
