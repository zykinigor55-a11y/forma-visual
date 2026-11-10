/* PLUX V17 — Arkheon Realtime speech conversation.
 * Big crystal microphone: one tap starts full duplex Russian conversation.
 * Text chat remains text-only. ARKHEON_API_KEY is never sent to this script.
 */
(()=>{
 "use strict";
 const backend="https://pluh-voice-demo.onrender.com";
 const screen=document.getElementById("screen-voice");
 const mic=document.getElementById("voice-toggle");
 const launch=document.getElementById("open-voice-quick");
 const label=document.getElementById("voice-toplabel");
 const status=document.getElementById("voice-status");
 if(!screen||!mic||!label||!status)return;
 const Context=window.AudioContext||window.webkitAudioContext;
 let ws=null,stream=null,captureCtx=null,speakerCtx=null,worklet=null,processor=null,input=null,silence=null;
 let active=false,connecting=false,sequence=0,playAt=0,playing=[],closed=false;
 let mode="idle",checking=false,timeout=0;
 let responseDone=false,responseAudioStarted=false,responseCycle=0,lastAudioAt=0;
 let userSpeaking=false,ignoreAbortedResponse=false,sessionConfirmed=false;
 let speakingStartedAt=0,finishTimer=0,happyTimer=0,latestEvent="idle";
 const cancelEmotionTimers=()=>{
  clearTimeout(finishTimer);clearTimeout(happyTimer);finishTimer=0;happyTimer=0;
 };
 // The fifth original mascot clip is intentionally a short celebration
 // after an audible answer; speech must finish playing first.
 function finishAudio(){
  clearTimeout(finishTimer);finishTimer=0;
  if(!active||userSpeaking||!responseAudioStarted||mode!=="talking")return;
  const remaining=Math.max(0,(playAt-(speakerCtx?.currentTime||0))*1000);
  const elapsed=Date.now()-lastAudioAt;
  const minTalkMs=Math.max(0,1350-(performance.now()-speakingStartedAt));
  const settlingMs=Math.max(0,420-elapsed);
  const waitingForDone=!responseDone?Math.max(0,2100-elapsed):0;
  const delay=Math.max(remaining+((remaining>0)?90:0),playing.length?100:0,minTalkMs,settlingMs,waitingForDone);
  if(delay>5){finishTimer=setTimeout(finishAudio,Math.max(50,Math.min(delay,2000)));return}
  responseAudioStarted=false;
  responseDone=false;
  state("happy");
  const generation=sequence,cycle=responseCycle;
  happyTimer=setTimeout(()=>{
   if(generation===sequence&&cycle===responseCycle&&active&&!userSpeaking&&mode==="happy")state("listening");
  },1800);
 }
 function scheduleFinish(){
  clearTimeout(finishTimer);
  finishTimer=setTimeout(finishAudio,90);
 }
 const original=label.textContent;
 function say(head,note){
  label.textContent=head;status.textContent=note;
 }
 function visual(next){
  mode=next;
  screen.dataset.voiceState=next;
  if(screen.hidden)return;
  const host=screen.querySelector(".voice-image-layer");
  const video=host?.querySelector("video");
  if(window.PLUXSeamless&&host&&video){
   window.PLUXSeamless.set(video,host,next);
  }
 }
 function presentation(on){
  active=on;
  screen.classList.toggle("plux126-on",on);
  screen.classList.toggle("plux151-connected",on);
  screen.classList.toggle("plux126-request",connecting);
  mic.classList.toggle("live",on);
  mic.setAttribute("aria-pressed",String(on));
  mic.setAttribute("aria-label",on?"Завершить голосовой разговор":"Начать голосовой разговор");
 }
 function state(s){
  visual(s==="speaking"?"talking":s==="thinking"?"thinking":s==="listening"?"listening":s==="happy"?"happy":"idle");
  if(s==="speaking")say("ПЛЮХ говорит","Можешь перебить меня — я слушаю.");
  else if(s==="thinking")say("ПЛЮХ думает","Подготавливаю ответ…");
  else if(s==="happy")say("ПЛЮХ рад","Готово! Слушаю тебя дальше.");
  else if(s==="listening")say("ПЛЮХ слушает","Говори свободно. Нажми микрофон, чтобы закончить.");
 }
 function clearOutput(){
  for(const node of playing){try{node.stop()}catch{}try{node.disconnect()}catch{}}
  playing=[];
  playAt=speakerCtx?.currentTime||0;
 }
 function playback(base64){
  if(!speakerCtx||!base64)return;
  try{
   const raw=atob(base64);
   if(raw.length<2||raw.length>2_500_000)return;
   const samples=raw.length>>1;
   const audio=speakerCtx.createBuffer(1,samples,24000);
   const channel=audio.getChannelData(0);
   for(let i=0;i<samples;i++){
    let v=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);
    if(v>=32768)v-=65536;
    channel[i]=v/32768;
   }
   if(playAt-speakerCtx.currentTime>5){clearOutput()}
   const source=speakerCtx.createBufferSource();
   source.buffer=audio;source.connect(speakerCtx.destination);
   source.onended=()=>{
    playing=playing.filter(x=>x!==source);
    try{source.disconnect()}catch{}
    // Network completion can be earlier than the last sound from the speaker.
    if(responseAudioStarted&&playing.length===0)scheduleFinish();
   };
   const time=Math.max(speakerCtx.currentTime+.025,playAt);
   source.start(time);playing.push(source);playAt=time+audio.duration;
  }catch{}
 }
 function send(obj){
  if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj));
 }
 function audioChunk(buf){
  if(ws?.readyState!==WebSocket.OPEN||ws.bufferedAmount>1_000_000)return;
  const bytes=new Uint8Array(buf);
  let binary="";
  // A worklet sends only ~2 kB of data at once, so no giant apply()/stack frames.
  for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  send({type:"input_audio_buffer.append",audio:btoa(binary)});
 }
 async function openMicrophone(media){
  if(!Context||!window.AudioWorkletNode)throw Error("Нужен современный браузер с поддержкой AudioWorklet.");
  captureCtx=new Context({latencyHint:"interactive"});
  await captureCtx.audioWorklet.addModule("/plux-arkheon-processor-v17.js?v=1702");
  if(!active){throw Error("Разговор был остановлен.")}
  input=captureCtx.createMediaStreamSource(media);
  worklet=new AudioWorkletNode(captureCtx,"plux-arkheon-capture",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
  worklet.port.onmessage=e=>{if(e.data instanceof ArrayBuffer)audioChunk(e.data)};
  silence=captureCtx.createGain();silence.gain.value=0;
  input.connect(worklet);worklet.connect(silence);silence.connect(captureCtx.destination);
  await captureCtx.resume();
 }
 function handleEvent(evt){
  const name=String(evt?.type||"");
  latestEvent=name.slice(0,100);
  if(name==="session.created"||name==="session.updated")return;
  if(name==="error"){
   const reason=evt?.error?.message;
   if(reason)status.textContent="Arkheon: "+String(reason).slice(0,150);
   return;
  }
  if(!sessionConfirmed)return; // Never speak before Russian instructions are acknowledged.
  if(name==="input_audio_buffer.speech_started"){
   userSpeaking=true;ignoreAbortedResponse=true;
   responseCycle++;responseDone=false;responseAudioStarted=false;
   cancelEmotionTimers();clearOutput();
   state("listening");return;
  }
  if(name==="input_audio_buffer.speech_stopped"||name==="input_audio_buffer.committed"){
   userSpeaking=false;
   if(mode!=="talking")state("thinking");
   return;
  }
  if(name==="conversation.item.input_audio_transcription.completed"){
   // A transcript may arrive AFTER audio started: it must never hide talking video.
   if(!userSpeaking&&mode==="listening")state("thinking");
   return;
  }
  if(name==="response.created"){
   userSpeaking=false;ignoreAbortedResponse=false;
   responseCycle++;responseDone=false;responseAudioStarted=false;
   cancelEmotionTimers();
   state("thinking");
   return;
  }
  if(name==="response.output_audio.delta"||name==="response.audio.delta"){
   if(ignoreAbortedResponse||typeof evt.delta!=="string")return;
   lastAudioAt=Date.now();
   responseDone=false;
   if(!responseAudioStarted){
    responseAudioStarted=true;speakingStartedAt=performance.now();
    cancelEmotionTimers();state("speaking");
   }
   playback(evt.delta);
   scheduleFinish();
   return;
  }
  if(name==="response.output_audio.done"||name==="response.audio.done"){
   responseDone=true;scheduleFinish();return;
  }
  if(name==="response.done"||name==="response.completed"){
   if(ignoreAbortedResponse)return;
   responseDone=true;
   if(responseAudioStarted)scheduleFinish();
   else if(!userSpeaking)state("listening");
   return;
  }
 }
 async function stop(reason="Нажми на микрофон, чтобы поговорить с ПЛЮХ."){
  sequence++;
  connecting=false;active=false;sessionConfirmed=false;clearTimeout(timeout);
  cancelEmotionTimers();responseAudioStarted=false;responseDone=false;ignoreAbortedResponse=false;
  screen.classList.remove("plux126-request");
  const oldSocket=ws;ws=null;
  if(oldSocket){try{oldSocket.close(1000,"PLUX user ended session")}catch{}}
  clearOutput();
  if(stream){for(const track of stream.getTracks())try{track.stop()}catch{}stream=null}
  try{worklet?.port.postMessage("stop")}catch{}
  for(const node of [input,worklet,silence])try{node?.disconnect()}catch{}
  worklet=null;input=null;silence=null;
  try{await captureCtx?.close()}catch{}captureCtx=null;
  try{await speakerCtx?.close()}catch{}speakerCtx=null;
  presentation(false);
  say("Голосовой режим",reason);visual("idle");
 }
 async function start(){
  if(active||connecting)return;
  const id=++sequence;
  connecting=true;screen.classList.add("plux126-request");
  mic.setAttribute("aria-label","Подключение к ПЛЮХ");
  say("Подключаю голос","Разреши доступ к микрофону, если телефон спросит.");
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!Context){
   await stop("Нужен HTTPS и разрешение на микрофон.");return;
  }
  // User gesture: permission and playback context are created immediately.
  const microphonePromise=navigator.mediaDevices.getUserMedia({
    audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
  });
  speakerCtx=new Context({latencyHint:"interactive"});
  void speakerCtx.resume().catch(()=>{});
  timeout=setTimeout(()=>{if(id===sequence&&!active)void stop("Соединение с Arkheon не установлено.")},28000);
  try{
   const media=await microphonePromise;
   if(id!==sequence){media.getTracks().forEach(t=>t.stop());return}
   stream=media;
   const response=await fetch(backend+"/api/arkheon/token",{
    method:"POST",mode:"cors",credentials:"omit",headers:{"Content-Type":"application/json"},
    body:"{}",signal:AbortSignal.timeout(18000)
   });
   const credentials=await response.json().catch(()=>({}));
   if(!response.ok)throw Error(credentials.error||"Не удалось получить голосовую сессию Arkheon.");
   if(typeof credentials.token!=="string"||!credentials.wsUrl)throw Error("Не получен одноразовый токен Arkheon.");
   if(id!==sequence)return;
   const url=new URL(credentials.wsUrl);
   if(url.protocol!=="wss:"||url.hostname!=="arkheonchat.com"||url.pathname!=="/v1/realtime")
    throw Error("Неизвестный сервер голосовой связи.");
   say("Соединяю…","Открываю голосовой диалог.");
   // Token is one-use and valid for only 60s; never save it to storage.
   const socket=new WebSocket(url.toString(),["realtime","openai-insecure-api-key."+credentials.token]);
   ws=socket;
   await new Promise((resolve,reject)=>{
     socket.addEventListener("open",resolve,{once:true});
     socket.addEventListener("error",()=>reject(Error("Не удалось подключиться к Arkheon.")),{once:true});
     socket.addEventListener("close",()=>reject(Error("Arkheon закрыл голосовое соединение.")),{once:true});
   });
   if(id!==sequence){socket.close();return}
   active=true;connecting=false;clearTimeout(timeout);presentation(true);
   say("Настраиваю русский язык…","Проверяю язык и голос перед началом разговора.");
   socket.addEventListener("message",e=>{
     if(id!==sequence)return;
     try{handleEvent(JSON.parse(e.data))}catch{}
   });
   socket.addEventListener("close",()=>{
     if(id===sequence)void stop("Голосовой разговор завершён. Нажми микрофон для нового.");
   });
   socket.addEventListener("error",()=>{
     if(id===sequence)void stop("Связь с Arkheon прервалась.");
   });
   const confirmed=new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{socket.removeEventListener("message",onConfig);reject(Error("Arkheon не подтвердил настройки русского языка."))},8500);
    function onConfig(msg){
     try{
      const e=JSON.parse(msg.data);
      if(e.type==="session.updated"){
       clearTimeout(timer);socket.removeEventListener("message",onConfig);resolve(e.session);
      }else if(e.type==="error"){
       clearTimeout(timer);socket.removeEventListener("message",onConfig);
       reject(Error("Arkheon отклонил настройки голоса: "+String(e.error?.message||"ошибка").slice(0,150)));
      }
     }catch{}
    }
    socket.addEventListener("message",onConfig);
   });
   send({type:"session.update",session:{
     type:"realtime",
     instructions:"СИСТЕМНОЕ ПРАВИЛО: ОТВЕЧАЙ ИСКЛЮЧИТЕЛЬНО ПО-РУССКИ С ПЕРВОЙ ЖЕ РЕПЛИКИ. Не произноси английские приветствия, инструкции и вводные слова, даже если в контексте есть английский текст. Ты ПЛЮХ — умный, дружелюбный голосовой помощник. Твой стиль: молодой энергичный мужской голос, тёплый тембр, лёгкая улыбка, естественные доброжелательные интонации, бодрый, но комфортный темп. Без дикторской манеры и канцелярита. Отвечай обычно одной-двумя короткими фразами, подробнее по просьбе. Не играй роль ребёнка, не кричи и не добавляй неуместный сленг. Уместен лёгкий юмор. Слушай собеседника, допускай перебивания и не выдумывай выполненные действия. ВАЖНО: ЯЗЫК КАЖДОГО ОТВЕТА — РУССКИЙ.",
     audio:{
       input:{format:{type:"audio/pcm",rate:24000},turn_detection:{
         type:"server_vad",threshold:.5,prefix_padding_ms:300,silence_duration_ms:550,
         create_response:true,interrupt_response:true
       }},
       output:{format:{type:"audio/pcm",rate:24000},voice:"ash"}
     }
   }});
   await confirmed;
   if(id!==sequence)return;
   sessionConfirmed=true;
   await openMicrophone(media);
   if(id!==sequence)return;
   state("listening");
  }catch(e){
   if(id!==sequence)return;
   const detail=e?.name==="TimeoutError"?"Сервер Arkheon не отвечает. Попробуй позже.":String(e?.message||"Не удалось начать разговор.");
   await stop(detail.slice(0,200));
  }
 }
 // Capture ensures the old V12.6 microphone-level-only listener never runs.
 mic.addEventListener("click",event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(active||connecting)void stop("Разговор остановлен.");
  else void start();
 },{capture:true});
 // On the home screen, user presses the crystal mic: start media permission
 // synchronously in this gesture while the old app navigates to voice screen.
 launch?.addEventListener("click",()=>{if(!active&&!connecting)void start()},{capture:true});
 for(const id of ["voice-back","voice-end"]){
  document.getElementById(id)?.addEventListener("click",()=>{if(active||connecting)void stop()},{capture:true});
 }
 new MutationObserver(()=>{
   if(screen.hidden&&(active||connecting))void stop();
   else if(!screen.hidden&&active){
    // Home quick microphone can open the voice screen after network setup.
    visual(mode);
    window.PLUXSeamless?.sync?.();
   }
  }).observe(screen,{attributes:true,attributeFilter:["hidden"]});
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&(active||connecting))void stop("Разговор остановлен при сворачивании приложения.");
 });
 window.addEventListener("pagehide",()=>{if(active||connecting)void stop()});
 window.PLUXArkheon={
  start,stop,isActive:()=>active,isConnecting:()=>connecting,
  debug:()=>({state:mode,connected:active,russianConfigured:sessionConfirmed,
   streamEvent:latestEvent,playingChunks:playing.length,
   video:screen.querySelector(".voice-image-layer")?.dataset.pluxEmotion||null,
   videoDirector:window.PLUXSeamless?.debug?.()||[]})
 };
 say("Голосовой режим",original||"Нажми на микрофон, чтобы поговорить с ПЛЮХ.");
})();
