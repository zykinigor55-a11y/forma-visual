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
 let responseInProgress=false,microphoneSilencedFrames=0,manualInterrupts=0;
 let lastUserTranscript="";
 let userSpeaking=false,ignoreAbortedResponse=false,sessionConfirmed=false;
 let speakingStartedAt=0,finishTimer=0,happyTimer=0,latestEvent="idle";
 let detectedVoiceMs=0,pendingSpeechStart=0,lastVoiceAt=0,interruptions=0,playedChunks=0;
 const jitterLeadSeconds=.16; // lower first-audio latency, retain some 4G jitter protection
 const speakingVoiceThreshold=.062; // post-echo-cancellation local voice RMS
 const interruptionVoiceMs=210;
 const cancelEmotionTimers=()=>{
  clearTimeout(finishTimer);clearTimeout(happyTimer);finishTimer=0;happyTimer=0;
 };
 // The fifth original mascot clip is intentionally a short celebration
 // after an audible answer; speech must finish playing first.
 function finishAudio(){
  clearTimeout(finishTimer);finishTimer=0;
  if(!active||userSpeaking||!responseAudioStarted||mode!=="talking")return;
  // IMPORTANT: never infer that a streamed answer is complete from a 2s gap.
  // Sentences are synthesized separately; long network gaps are normal.
  if(!responseDone)return;
  const remaining=Math.max(0,(playAt-(speakerCtx?.currentTime||0))*1000);
  const minTalkMs=Math.max(0,900-(performance.now()-speakingStartedAt));
  const delay=Math.max(remaining+60,playing.length?80:0,minTalkMs);
  if(delay>65){finishTimer=setTimeout(finishAudio,Math.max(65,Math.min(delay,1600)));return}
  responseAudioStarted=false;
  responseDone=false;
  responseInProgress=false; // Resume microphone only once final PCM buffer finished.
  pendingSpeechStart=0;
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
 let lastGlassCueAt=0;
 function glassVoiceCue(next){
  if(next!=="listening"&&next!=="thinking"&&next!=="talking")return;
  let enabled=true;
  try{enabled=localStorage.getItem("plux_sfx_enabled")!=="off";}catch{}
  if(!enabled||document.getElementById("sound-toggle")?.checked===false)return;
  // Use an already user-unlocked voice context: no autoplay bypass,
  // no extra microphone permission, no heavyweight sound downloads.
  const ctx=speakerCtx;
  if(!ctx||ctx.state!=="running"||typeof ctx.createOscillator!=="function"||typeof ctx.createGain!=="function")return;
  const now=performance.now();
  if(now-lastGlassCueAt<180)return;
  lastGlassCueAt=now;
  const settings={listening:[680,900,.095,.013],thinking:[575,480,.115,.010],talking:[780,1020,.070,.008]};
  const [first,last,duration,volume]=settings[next];
  try{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+.007;
   osc.type="sine";osc.frequency.setValueAtTime(first,t);
   osc.frequency.exponentialRampToValueAtTime(last,t+duration);
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.linearRampToValueAtTime(volume,t+.017);
   gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(t);osc.stop(t+duration+.012);
   osc.onended=()=>{try{osc.disconnect();gain.disconnect()}catch{}};
  }catch{}
 }
 function state(s){
  const old=mode;
  visual(s==="speaking"?"talking":s==="thinking"?"thinking":s==="listening"?"listening":s==="happy"?"happy":"idle");
  if(mode!==old&&active&&!screen.hidden)glassVoiceCue(mode);
  if(s==="speaking")say("ПЛЮХ говорит","Чтобы перебить ответ, нажми микрофон ещё раз.");
  else if(s==="thinking")say("ПЛЮХ думает","Подготавливаю ответ…");
  else if(s==="happy")say("ПЛЮХ рад","Готово! Слушаю тебя дальше.");
  else if(s==="listening")say("ПЛЮХ слушает","Говори свободно. Нажми микрофон, чтобы закончить.");
 }
 function clearOutput(){
  const list=playing;playing=[];
  // Reset scheduling BEFORE stop() fires onended handlers.
  playAt=speakerCtx?.currentTime||0;
  for(const node of list){try{node.onended=null;node.stop()}catch{}try{node.disconnect()}catch{}}
 }
 function interruptFromSpeech(){
  if(!active||mode!=="talking"||!pendingSpeechStart)return;
  pendingSpeechStart=0;interruptions++;
  userSpeaking=true;ignoreAbortedResponse=true;
  responseCycle++;responseDone=false;responseAudioStarted=false;
  cancelEmotionTimers();
  // Arkheon cannot distinguish speaker echo from a real barge-in reliably.
  // We cancel at the server ONLY when microphone-side acoustic evidence exists.
  send({type:"response.cancel"});
  clearOutput();state("listening");
 }
 function localLevel(level){
  if(!active)return;
  const rms=Number(level);
  if(!Number.isFinite(rms))return;
  const now=Date.now();
  if(rms>speakingVoiceThreshold){
   detectedVoiceMs=Math.min(1000,detectedVoiceMs+100);lastVoiceAt=now;
  }else{
   detectedVoiceMs=Math.max(0,detectedVoiceMs-80);
  }
  if(pendingSpeechStart){
   if(now-pendingSpeechStart>1400){pendingSpeechStart=0;return}
   if(detectedVoiceMs>=interruptionVoiceMs&&now-lastVoiceAt<300)
    interruptFromSpeech();
  }
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
   // Earlier releases dropped *all* queued audio after five seconds, cutting
   // off answers and causing repeated syllables. Never discard valid output.
   playedChunks++;
   const source=speakerCtx.createBufferSource();
   source.buffer=audio;source.connect(speakerCtx.destination);
   source.onended=()=>{
    playing=playing.filter(x=>x!==source);
    try{source.disconnect()}catch{}
    // Network completion can be earlier than the last sound from the speaker.
    if(responseAudioStarted&&playing.length===0)scheduleFinish();
   };
   const time=Math.max(speakerCtx.currentTime+jitterLeadSeconds,playAt);
   source.start(time);playing.push(source);playAt=time+audio.duration;
  }catch{}
 }
 function send(obj){
  if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj));
 }
 const silentEncoded=new Map();
 function audioChunk(buf){
  if(ws?.readyState!==WebSocket.OPEN||ws.bufferedAmount>800_000)return;
  const bytes=new Uint8Array(buf);
  // Acoustic echo is often interpreted as a NEW user utterance on speakerphone.
  // Use a microphone gate during the entire model response, including pauses
  // between sentence-by-sentence synthesis. Resume after ALL output is played.
  // Keep sending equal-duration silence: input audio clock/VAD stays stable.
  if(responseInProgress){
   let encoded=silentEncoded.get(bytes.length);
   if(!encoded){
    encoded=btoa("\0".repeat(bytes.length));
    if(silentEncoded.size>4)silentEncoded.clear();
    silentEncoded.set(bytes.length,encoded);
   }
   microphoneSilencedFrames++;
   send({type:"input_audio_buffer.append",audio:encoded});
   return;
  }
  let binary="";
  for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
  send({type:"input_audio_buffer.append",audio:btoa(binary)});
 }
 async function openMicrophone(media){
  if(!Context||!window.AudioWorkletNode)throw Error("Нужен современный браузер с поддержкой AudioWorklet.");
  captureCtx=new Context({latencyHint:"interactive"});
  await captureCtx.audioWorklet.addModule("/plux-arkheon-processor-v17.js?v=2001");
  if(!active){throw Error("Разговор был остановлен.")}
  input=captureCtx.createMediaStreamSource(media);
  worklet=new AudioWorkletNode(captureCtx,"plux-arkheon-capture",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
  worklet.port.onmessage=e=>{
   if(e.data instanceof ArrayBuffer)audioChunk(e.data);
   else if(e.data?.type==="level")localLevel(e.data.rms);
  };
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
   // Ignore echoed speaker voice while the provider is composing or talking.
   if(responseInProgress)return;
   if(mode==="talking"){
    // False server VAD triggers on the assistant's own speaker output are
    // common on phones. Do not truncate replies until real local speech.
    pendingSpeechStart=Date.now();
    if(detectedVoiceMs>=interruptionVoiceMs&&Date.now()-lastVoiceAt<300)
     interruptFromSpeech();
    return;
   }
   userSpeaking=true;ignoreAbortedResponse=true;
   responseCycle++;responseDone=false;responseAudioStarted=false;
   pendingSpeechStart=0;
   cancelEmotionTimers();clearOutput();
   state("listening");return;
  }
  if(name==="input_audio_buffer.speech_stopped"||name==="input_audio_buffer.committed"){
   if(responseInProgress)return;
   pendingSpeechStart=0;
   userSpeaking=false;
   if(mode!=="talking")state("thinking");
   return;
  }
  if(name==="conversation.item.input_audio_transcription.completed"){
   // A transcript may arrive AFTER audio started: it must never hide talking video.
   const transcript=typeof evt.transcript==="string"?evt.transcript.trim():"";
   if(transcript)lastUserTranscript=transcript.slice(0,240);
   // A locally recognized music command opens the actual licensed Audius
   // player. Stop the live mic to prevent feedback from musical playback.
   if(transcript&&window.PLUXMusic?.interpret?.(transcript,{source:"voice"})){
    void stop("Музыкальный плеер открыт. Нажми ▶, если звук не начался.");
    return;
   }
   if(!userSpeaking&&mode==="listening")state("thinking");
   // Shows what was actually understood, useful to diagnose noisy microphones.
   if(transcript&&!responseAudioStarted&&mode==="thinking")
    status.textContent="Распознано: "+transcript.slice(0,120);
   return;
  }
  if(name==="response.created"){
   responseInProgress=true;
   userSpeaking=false;ignoreAbortedResponse=false;
   detectedVoiceMs=0;pendingSpeechStart=0;
   responseCycle++;responseDone=false;responseAudioStarted=false;
   cancelEmotionTimers();
   state("thinking");
   return;
  }
  if(name==="response.output_audio.delta"||name==="response.audio.delta"){
   if(ignoreAbortedResponse||typeof evt.delta!=="string")return;
   lastAudioAt=Date.now();
   // Do not reset responseDone from late audio chunks: the completion event
   // can arrive before the local speaker queue has finished playing.
   if(!responseAudioStarted){
    responseAudioStarted=true;speakingStartedAt=performance.now();
    cancelEmotionTimers();state("speaking");
   }
   playback(evt.delta);
   scheduleFinish();
   return;
  }
  if(name==="response.output_audio.done"||name==="response.audio.done"){
   // This closes ONE audio part, not the whole Arkheon sentence-streamed answer.
   // Wait for response.done before declaring that the assistant has finished.
   return;
  }
  if(name==="response.done"||name==="response.completed"){
   if(ignoreAbortedResponse)return;
   responseDone=true;
   if(responseAudioStarted)scheduleFinish();
   else if(!userSpeaking){responseInProgress=false;state("listening");}
   return;
  }
 }
 async function stop(reason="Нажми на микрофон, чтобы поговорить с ПЛЮХ."){
  sequence++;
  connecting=false;active=false;sessionConfirmed=false;clearTimeout(timeout);
  cancelEmotionTimers();responseAudioStarted=false;responseDone=false;responseInProgress=false;ignoreAbortedResponse=false;
  pendingSpeechStart=0;detectedVoiceMs=0;
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
  window.PLUXMusic?.pause?.(); // prevent music from being mistaken for user speech
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
   if(id===sequence)status.textContent="Микрофон подключён. Устанавливаю голосовую связь…";
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
     instructions:"ПРАВИЛО ЯЗЫКА: ОТВЕЧАЙ ИСКЛЮЧИТЕЛЬНО ПО-РУССКИ. Ты ПЛЮХ — внимательный, энергичный, доброжелательный голосовой помощник. ВСЕГДА отвечай естественным грамотным русским языком; никогда не начинай на английском. Слушай вопрос целиком, не теряй смысл слов и продолжай тему с учётом предыдущих реплик. Не перескакивай на другие темы. Если речь распознана неуверенно, задай один короткий уточняющий вопрос, вместо догадок. Говори понятно, без спешки, тёплым молодым мужским голосом. Обычно отвечай полноценно за 2–5 предложений, а если просят подробностей — объясняй подробнее. ЗАВЕРШАЙ каждую фразу и мысль; не обрывай предложение и не вставляй многоточие вместо ответа. Не повторяй одни и те же слова, не начинай заново уже сказанное. Лёгкий юмор допустим. Не выдумывай выполненные действия, результаты или подключения. Пользователь общается по-русски, отвечай только по-русски.",
     audio:{
       input:{format:{type:"audio/pcm",rate:24000},turn_detection:{
         type:"server_vad",threshold:.42,prefix_padding_ms:500,silence_duration_ms:820,
         create_response:true,interrupt_response:false
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
   const detail=e?.name==="TimeoutError"?"Сервер голосовой связи не отвечает. Попробуй позже."
    :e?.name==="NotAllowedError"?"Разреши микрофон: Настройки Android → Приложения → ПЛЮХ → Разрешения → Микрофон."
    :e?.name==="NotReadableError"?"Микрофон занят другим приложением или не готов. Закрой другие приложения и повтори."
    :e?.name==="NotFoundError"?"Микрофон не найден. Проверь устройство."
    :String(e?.message||"Не удалось начать разговор.");
   await stop(detail.slice(0,200));
  }
 }
 // Capture ensures the old V12.6 microphone-level-only listener never runs.
 mic.addEventListener("click",event=>{
  event.preventDefault();event.stopImmediatePropagation();
  if(active&&responseInProgress){
   // Explicit tap is the reliable way to interrupt while the speaker gate is on.
   manualInterrupts++;
   if(!responseDone)send({type:"response.cancel"});
   clearOutput();responseDone=false;responseAudioStarted=false;responseInProgress=false;
   pendingSpeechStart=0;detectedVoiceMs=0;
   cancelEmotionTimers();state("listening");
  }else if(active||connecting)void stop("Разговор остановлен.");
  else void start();
 },{capture:true});
 // On the home screen, user presses the crystal mic: start media permission
 // synchronously in this gesture while the old app navigates to voice screen.
 launch?.addEventListener("click",()=>{if(!active&&!connecting)void start()},{capture:true});
 // The welcome panel on Home is also a microphone affordance. Start the
 // permission request on the actual touch, not only after navigation.
 document.getElementById("speech-button")?.addEventListener("click",()=>{
  if(!active&&!connecting)void start();
 },{capture:true});

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
   speakerQueueSeconds:Math.max(0,playAt-(speakerCtx?.currentTime||0)).toFixed(2),
   totalPlaybackChunks:playedChunks,confirmedBargeIns:interruptions,
   mutedInputFrames:microphoneSilencedFrames,manualInterrupts,responseInProgress,
   lastUserTranscript,
   video:screen.querySelector(".voice-image-layer")?.dataset.pluxEmotion||null,
   videoDirector:window.PLUXSeamless?.debug?.()||[]})
 };
 say("Голосовой режим",original||"Нажми на микрофон, чтобы поговорить с ПЛЮХ.");
})();
