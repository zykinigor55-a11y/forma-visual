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
  if(window.PLUXSeamless&&host&&video)
   window.PLUXSeamless.set(video,host,next);
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
  visual(s==="speaking"?"talking":s==="thinking"?"thinking":s==="listening"?"listening":"idle");
  if(s==="speaking")say("ПЛЮХ отвечает","Можешь перебить меня — я слушаю.");
  else if(s==="thinking")say("ПЛЮХ думает","Подготавливаю ответ…");
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
   source.onended=()=>{playing=playing.filter(x=>x!==source);try{source.disconnect()}catch{}};
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
  if(name==="session.created"||name==="session.updated")return;
  if(name==="input_audio_buffer.speech_started"){
    clearOutput();
    state("listening");
    return;
  }
  if(name==="input_audio_buffer.speech_stopped"||name==="input_audio_buffer.committed"||
     name==="conversation.item.input_audio_transcription.completed"){
    state("thinking");return;
  }
  if(name==="response.created"){state("thinking");return}
  if(name==="response.output_audio.delta"||name==="response.audio.delta"){
    if(typeof evt.delta==="string"){if(mode!=="talking")state("speaking");playback(evt.delta)}
    return;
  }
  if(name==="response.done"||name==="response.completed"){
    // Queue might still be playing. Keep talking animation until decoded audio ends.
    const remain=Math.max(0,(playAt-(speakerCtx?.currentTime||0))*1000);
    const n=sequence;
    setTimeout(()=>{if(n===sequence&&mode==="talking")state("listening")},Math.min(10000,remain+180));
    return;
  }
  if(name==="error"){
    const reason=evt?.error?.message;
    if(reason)status.textContent="Arkheon: "+String(reason).slice(0,150);
  }
 }
 async function stop(reason="Нажми на микрофон, чтобы поговорить с ПЛЮХ."){
  sequence++;
  connecting=false;active=false;clearTimeout(timeout);
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
   active=true;connecting=false;clearTimeout(timeout);presentation(true);state("listening");
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
   send({type:"session.update",session:{
     type:"realtime",
     instructions:"Ты ПЛЮХ — умный, дружелюбный голосовой помощник. Всегда отвечай на русском языке. Манера общения: молодой энергичный мужчина, тёплый тембр, лёгкая улыбка в голосе, живые доброжелательные интонации, бодрый, но комфортный темп. Не говори как диктор и не используй канцелярит. Говори естественно и достаточно кратко: чаще одна-две фразы, если собеседник не просит подробностей. Не играй роль ребёнка, не кричи, не говори слишком быстро, не добавляй неуместный сленг. Уместный лёгкий юмор приветствуется. Слушай собеседника, допускай перебивания и не придумывай выполненные действия.",
     audio:{
       input:{format:{type:"audio/pcm",rate:24000},turn_detection:{
         type:"server_vad",threshold:.5,prefix_padding_ms:300,silence_duration_ms:550,
         create_response:true,interrupt_response:true
       }},
       output:{format:{type:"audio/pcm",rate:24000},voice:"ash"}
     }
   }});
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
 new MutationObserver(()=>{if(screen.hidden&&(active||connecting))void stop()})
  .observe(screen,{attributes:true,attributeFilter:["hidden"]});
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&(active||connecting))void stop("Разговор остановлен при сворачивании приложения.");
 });
 window.addEventListener("pagehide",()=>{if(active||connecting)void stop()});
 window.PLUXArkheon={start,stop,isActive:()=>active,isConnecting:()=>connecting};
 say("Голосовой режим",original||"Нажми на микрофон, чтобы поговорить с ПЛЮХ.");
})();
