/* PLUX 15.1 — realtime voice conversation, no text-chat side effects.
 * The crystal microphone starts a private ElevenLabs voice agent session via Render.
 * Conversation ends on second tap, back, app hide or navigating away.
 */
import {Conversation} from "@elevenlabs/client";

(()=>{
  "use strict";
  const server="https://pluh-voice-demo.onrender.com";
  const voiceScreen=document.getElementById("screen-voice");
  const mic=document.getElementById("voice-toggle");
  const header=document.getElementById("voice-toplabel");
  const status=document.getElementById("voice-status");
  const launch=document.getElementById("open-voice-quick");
  if(!voiceScreen||!mic||!header||!status)return;

  const originalStatus=status.textContent;
  let current=null,starting=false,active=false,seq=0,timeout=0;
  const voiceHost=()=>voiceScreen.querySelector(".voice-image-layer");
  let lastError="";
  const say=(title,detail)=>{
    header.textContent=title;
    status.textContent=detail;
  };
  function visual(state){
    if(voiceScreen.hidden)return;
    const host=voiceHost();
    if(!host||!window.PLUXSeamless)return;
    const clip=host.querySelector("video");
    if(clip)window.PLUXSeamless.set(clip,host,state);
    voiceScreen.dataset.voiceState=state;
  }
  function presentation(on){
    voiceScreen.classList.toggle("plux126-on",on);
    voiceScreen.classList.toggle("plux151-connected",on);
    mic.classList.toggle("live",on);
    mic.setAttribute("aria-pressed",on?"true":"false");
    mic.setAttribute("aria-label",on?"Завершить голосовой разговор":"Начать голосовой разговор");
  }
  function mode(next){
    if(!active)return;
    const speaking=next==="speaking",thinking=next==="thinking";
    visual(speaking?"talking":thinking?"thinking":"listening");
    say(speaking?"ПЛЮХ говорит":thinking?"ПЛЮХ думает":"ПЛЮХ слушает",
      speaking?"Можешь перебить меня в любой момент."
        :thinking?"Подготавливаю ответ…":"Говори свободно. Нажми микрофон, чтобы закончить.");
  }
  async function stop(reason="Нажми микрофон, чтобы начать разговор."){
    seq++;starting=false;active=false;clearTimeout(timeout);
    voiceScreen.classList.remove("plux126-request");
    presentation(false);
    const outgoing=current;current=null;
    if(outgoing){try{await outgoing.endSession()}catch{}}
    say("Голосовой режим",reason);
    if(!voiceScreen.hidden)visual("idle");
  }
  async function start(){
    if(starting||active)return;
    const n=++seq;
    starting=true;lastError="";
    clearTimeout(timeout);
    voiceScreen.classList.add("plux126-request");
    mic.setAttribute("aria-label","Подключение голоса. Нажми ещё раз для отмены");
    say("Подключение…","Разреши использование микрофона, если телефон спросит.");
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
      await stop("Для разговора нужен HTTPS и доступ к микрофону.");
      return;
    }
    // Permission prompt must be initiated from the user's tap, before an await for tokens.
    let permit;
    try{permit=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}
    catch(e){
      if(n!==seq)return;
      const denied=["NotAllowedError","PermissionDeniedError","SecurityError"].includes(e.name);
      await stop(denied
        ?"Разреши микрофон в настройках приложения или браузера."
        :"Не удалось открыть микрофон. Проверь разрешения.");
      return;
    }
    // Releasing the temporary stream avoids double capture: the SDK owns the live mic.
    permit.getTracks().forEach(t=>t.stop());
    if(n!==seq)return;
    try{
      const res=await fetch(server+"/api/voice/token",{
        method:"POST",mode:"cors",credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:"{}",
        signal:AbortSignal.timeout(17000)
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(data.error||"Не удалось подключить голосового помощника.");
      if(!data.conversationToken)throw Error("Сервер не вернул токен голосовой сессии.");
      if(n!==seq)return;
      say("Подключаю голос…","Открываю защищённую аудиосессию.");
      timeout=setTimeout(()=>{
        if(n!==seq||active)return;
        void stop("Соединение не установлено. Проверь интернет и повтори.");
      },22000);
      const session=await Conversation.startSession({
        conversationToken:data.conversationToken,
        connectionType:"webrtc",
        useWakeLock:false,
        preferHeadphonesForIosDevices:true,
        // Keep microphone startup responsive, especially on Android.
        connectionDelay:{android:250,ios:0,default:0},
        onConnect:()=>{
          if(n!==seq)return;
          active=true;
          presentation(true);
          voiceScreen.classList.remove("plux126-request");
          clearTimeout(timeout);
          mode("listening");
        },
        onModeChange:evt=>{
          if(n!==seq)return;
          const state=typeof evt==="string"?evt:evt?.mode;
          if(state==="speaking"||state==="listening")mode(state);
        },
        onMessage:evt=>{
          if(n!==seq||!active)return;
          // Show live state only. Do not copy voice transcripts into the text chat.
          if(evt?.source==="user"&&typeof evt.message==="string")mode("thinking");
          if(evt?.source==="ai"&&typeof evt.message==="string")mode("speaking");
        },
        onDisconnect:()=>{
          if(n!==seq)return;
          void stop("Разговор завершён. Нажми микрофон, чтобы начать снова.");
        },
        onError:()=>{
          if(n!==seq)return;
          lastError="Голосовая связь прервалась. Нажми микрофон, чтобы попробовать ещё раз.";
          void stop(lastError);
        }
      });
      if(n!==seq){try{await session.endSession()}catch{}return}
      current=session;
      if(!active){active=true;presentation(true);voiceScreen.classList.remove("plux126-request");mode("listening")}
      starting=false;
      clearTimeout(timeout);
    }catch(e){
      if(n!==seq)return;
      const text=e?.name==="TimeoutError"?"Сервер не ответил. Попробуй позже.":String(e?.message||"Не удалось начать голосовой разговор.");
      await stop(text.slice(0,220));
    }
  }
  // Stop the old 'microphone level only' handler, registered as onclick on the bubble.
  mic.addEventListener("click",event=>{
    event.preventDefault();event.stopImmediatePropagation();
    if(starting||active)void stop("Разговор остановлен.");
    else void start();
  },{capture:true});
  // Home microphone opens the voice screen and starts conversation on the same tap.
  // Preserve the existing approved navigation and glass button styling.
  launch?.addEventListener("click",()=>{
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!voiceScreen.hidden&&!starting&&!active)void start();
    }));
  },{capture:true});
  for(const id of ["voice-back","voice-end"]){
    document.getElementById(id)?.addEventListener("click",()=>{
      if(active||starting)void stop();
    },{capture:true});
  }
  new MutationObserver(()=>{
    if(voiceScreen.hidden&&(active||starting))void stop();
  }).observe(voiceScreen,{attributes:true,attributeFilter:["hidden"]});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden&&(active||starting))void stop("Разговор остановлен при сворачивании приложения.");
  });
  window.addEventListener("pagehide",()=>{if(active||starting)void stop()});
  window.PLUXVoiceV151={
    isActive:()=>active,
    start:()=>start(),
    stop:()=>stop()
  };
  presentation(false);
  say("Голосовой режим",originalStatus||"Нажми на микрофон, чтобы поговорить с Плюхом.");
})();
