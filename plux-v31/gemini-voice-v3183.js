/* PLUX V31.8.3 — Gemini realtime via the EXISTING Arkheon gateway.
 * Overrides obsolete ElevenLabs V15.1 voice-button handler in capture phase.
 * Sends only a 60-second one-use session token to the browser; never the Arkheon key.
 * PCM16 24 kHz streamed to OpenAI-compatible Arkheon WS; audio responses are queued.
 */
(()=>{
"use strict";
if(window.PLUXGeminiVoiceV3183)return;
const BASE="https://pluh-voice-demo.onrender.com";
const voice=document.getElementById("screen-voice");
const button=document.getElementById("voice-toggle");
const title=document.getElementById("voice-toplabel");
const status=document.getElementById("voice-status");
if(!voice||!button||!title||!status)return;
let connected=false,connecting=false,ws=null,mic=null,audio=null,source=null,processor=null,mute=null;
let sessionId=0,nextPlayback=0,sources=[],inputEnabled=false,responseFinished=false;
let resumeTimer=0,lastSignalAt=0;
const launch=document.getElementById("open-voice-quick");
function micEnabled(enabled){
 inputEnabled=Boolean(enabled)&&connected;
 if(mic)for(const t of mic.getAudioTracks())t.enabled=inputEnabled;
}
function clearResume(){if(resumeTimer){clearTimeout(resumeTimer);resumeTimer=0}}
function signalReady(){
 if(!audio||audio.state==="closed")return;
 const when=audio.currentTime+.02,gain=audio.createGain();
 gain.gain.setValueAtTime(.0001,when);
 gain.gain.exponentialRampToValueAtTime(.12,when+.035);
 gain.gain.exponentialRampToValueAtTime(.0001,when+.27);
 gain.connect(audio.destination);
 const a=audio.createOscillator(),b=audio.createOscillator();
 a.type="sine";b.type="sine";a.frequency.value=760;b.frequency.value=1040;
 a.connect(gain);b.connect(gain);
 a.start(when);b.start(when+.105);a.stop(when+.17);b.stop(when+.27);
 b.onended=()=>{try{gain.disconnect()}catch{}};
}
function listening(generation,{tone=true}={}){
 if(generation!==sessionId||!connected)return;
 clearResume();micEnabled(false);responseFinished=false;
 setState("Слушаю","Говори, я тебя слышу.","listening");
 const now=Date.now(),canTone=tone&&now-lastSignalAt>1150;
 if(canTone){lastSignalAt=now;try{signalReady()}catch{}}
 resumeTimer=setTimeout(()=>{
  resumeTimer=0;
  if(generation===sessionId&&connected&&voice.dataset.voiceState==="listening")micEnabled(true);
 },canTone?390:160);
}
function resumeAfterAnswer(generation){
 if(!responseFinished||generation!==sessionId||!connected||sources.length)return;
 clearResume();
 resumeTimer=setTimeout(()=>{
  resumeTimer=0;
  if(generation!==sessionId||!connected||sources.length||!responseFinished)return;
  listening(generation);
 },560);
}
const supported=()=>!!navigator.mediaDevices?.getUserMedia&&typeof WebSocket!=="undefined";
const setState=(name,detail,state="idle")=>{
 const changed=voice.dataset.voiceState!==state;
 if(title.textContent!==name)title.textContent=name;
 if(status.textContent!==detail)status.textContent=detail;
 voice.dataset.voiceState=state;
 button.classList.toggle("live",connected);
 button.classList.toggle("plux3183-connecting",connecting);
 button.setAttribute("aria-pressed",connected?"true":"false");
 // The old code reinitialized the mascot video on EVERY PCM chunk. Change it
 // only when the voice phase changes, not dozens of times per second.
 if(changed){
  const layer=voice.querySelector(".voice-image-layer");
  const clip=layer?.querySelector("video");
  const videoState=state==="talking"?"talking":state==="thinking"?"thinking":state==="listening"?"listening":"idle";
  if(clip&&window.PLUXSeamless?.set)try{window.PLUXSeamless.set(clip,layer,videoState)}catch{}
 }
};
const showError=message=>setState("Голосовой режим",String(message||"Ошибка подключения").slice(0,220),"idle");
const bytesToBase64=bytes=>{
 let s="";for(let i=0;i<bytes.length;i+=8192){s+=String.fromCharCode(...bytes.subarray(i,i+8192));}
 return btoa(s);
};
function pcm16Base64(float32,rate){
 const target=24000,step=rate/target,length=Math.max(1,Math.floor(float32.length/step));
 const data=new Uint8Array(length*2),view=new DataView(data.buffer);
 for(let i=0;i<length;i++){
  const from=Math.floor(i*step),to=Math.max(from+1,Math.min(float32.length,Math.floor((i+1)*step)));
  let avg=0;for(let k=from;k<to;k++)avg+=float32[k];avg/=to-from;
  const x=Math.max(-1,Math.min(1,avg));
  view.setInt16(i*2,x<0?Math.round(x*32768):Math.round(x*32767),true);
 }
 return bytesToBase64(data);
}
function stopPlayback(){
 for(const x of sources){try{x.stop()}catch{}}
 sources=[];nextPlayback=0;
}
function playDelta(value){
 if(!audio||audio.state==="closed"||typeof value!=="string"||value.length>2e6)return;
 let str;try{str=atob(value)}catch{return}
 if(str.length<2)return;
 const pcmLength=Math.floor(str.length/2),buffer=audio.createBuffer(1,pcmLength,24000);
 const samples=buffer.getChannelData(0);
 for(let i=0;i<pcmLength;i++){
  let n=str.charCodeAt(i*2)|(str.charCodeAt(i*2+1)<<8);
  if(n>=32768)n-=65536;samples[i]=n/32768;
 }
 const node=audio.createBufferSource();
 const generation=sessionId;
 node.buffer=buffer;node.connect(audio.destination);
 // Preserve queued chunks: dropping them caused truncated and stuttering speech.
 const at=Math.max(audio.currentTime+.045,nextPlayback);
 node.start(at);nextPlayback=at+buffer.duration;sources.push(node);
 node.onended=()=>{sources=sources.filter(x=>x!==node);resumeAfterAnswer(generation)};
}
function release(){
 sessionId++;connecting=false;connected=false;
 clearResume();inputEnabled=false;responseFinished=false;
 if(processor){processor.onaudioprocess=null;try{processor.disconnect()}catch{}processor=null}
 if(source){try{source.disconnect()}catch{}source=null}
 if(mute){try{mute.disconnect()}catch{}mute=null}
 if(mic){for(const t of mic.getTracks())try{t.stop()}catch{}mic=null}
 if(ws){const w=ws;ws=null;try{w.close(1000,"Voice ended")}catch{}}
 stopPlayback();
 if(audio){const a=audio;audio=null;void a.close().catch(()=>{})}
 button.classList.remove("plux3183-connecting","live");button.setAttribute("aria-pressed","false");
}
function stop(message="Нажми микрофон, чтобы поговорить с ПЛЮХом."){
 release();setState("Голосовой режим",message,"idle");
}
function packet(payload){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(payload))}
function audioStart(){
 if(!audio||!mic)return;
 source=audio.createMediaStreamSource(mic);
 // AudioWorklet is ideal, but ScriptProcessor is supported by older Android WebViews.
 processor=audio.createScriptProcessor(2048,1,1);
 mute=audio.createGain();mute.gain.value=0;
 source.connect(processor);processor.connect(mute);mute.connect(audio.destination);
 processor.onaudioprocess=e=>{
  if(!connected||!inputEnabled||ws?.readyState!==WebSocket.OPEN)return;
  const f=e.inputBuffer.getChannelData(0);
  packet({type:"input_audio_buffer.append",audio:pcm16Base64(f,audio.sampleRate)});
 };
}
function handle(data,generation){
 if(generation!==sessionId||!data||typeof data!=="object")return;
 const type=String(data.type||"");
 if(type==="error"){
  const msg=data.error?.message||data.message||"Сервис голосового ИИ вернул ошибку.";
  release();showError(msg);
  return;
 }
 if(type==="input_audio_buffer.speech_started"){
  if(inputEnabled)setState("Слушаю","Я тебя слышу.","listening");
 }
 if(type==="input_audio_buffer.speech_stopped"){
  micEnabled(false);clearResume();
  responseFinished=false;setState("Думаю","Формирую ответ…","thinking");
 }
 if(type==="response.created"){
  micEnabled(false);clearResume();
  responseFinished=false;setState("Думаю","Подготавливаю ответ…","thinking");
 }
 if(type==="response.output_audio.delta"||type==="response.audio.delta"){
  micEnabled(false);clearResume();
  setState("Отвечаю","Готовый ответ ПЛЮХа.","talking");
  playDelta(data.delta);
 }
 if(type==="response.done"||type==="response.completed"||type==="response.output_audio.done"||type==="response.audio.done"||type==="response.cancelled"||type==="response.failed"){
  responseFinished=true;resumeAfterAnswer(generation);
 }
}
async function start(){
 if(connecting||connected)return;
 if(!supported()){showError("Для разговора нужен HTTPS и доступ к микрофону.");return}
 const generation=++sessionId;
 connecting=true;setState("Подключаем Gemini…","Запрашиваю разрешение на микрофон.","thinking");
 try{
  await window.PLUXMicPermissionV318?.request?.();
  mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(generation!==sessionId){mic.getTracks().forEach(t=>t.stop());mic=null;return}
  audio=new(window.AudioContext||window.webkitAudioContext)({sampleRate:24000,latencyHint:"interactive"});
  await audio.resume();
  setState("Подключаем Gemini…","Получаю защищённую голосовую сессию.","thinking");
  const response=await fetch(BASE+"/api/arkheon/token",{method:"POST",headers:{"Content-Type":"application/json"},
   mode:"cors",credentials:"omit",body:"{}",signal:AbortSignal.timeout(18000)});
  const json=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(json.error||"Arkheon не смог открыть сессию (HTTP "+response.status+").");
  if(generation!==sessionId)return;
  if(typeof json.token!=="string"||json.token.length<16||typeof json.wsUrl!=="string")throw Error("Сервер не вернул корректный токен Gemini.");
  const destination=new URL(json.wsUrl);
  if(destination.protocol!=="wss:"||destination.hostname!=="arkheonchat.com"||destination.pathname!=="/v1/realtime")throw Error("Некорректный адрес голосового сервера.");
  ws=new WebSocket(destination.toString(),["realtime","openai-insecure-api-key."+json.token]);
  const timer=setTimeout(()=>{if(generation===sessionId&&!connected){showError("Сервер Gemini не ответил. Проверь интернет.");stop()}},19000);
  ws.onopen=()=>{
   if(generation!==sessionId)return;
   clearTimeout(timer);connecting=false;connected=true;
   micEnabled(false);
   packet({type:"session.update",session:{
    instructions:"Ты ПЛЮХ — молодой, доброжелательный, энергичный помощник. Общайся исключительно по-русски, цельными короткими фразами без повторений. Не перебивай говорящего.",
    input_audio_format:"pcm16",output_audio_format:"pcm16",voice:"ash",
    turn_detection:{type:"server_vad",threshold:.57,prefix_padding_ms:300,silence_duration_ms:820,create_response:true}
   }});
   audioStart();
   listening(generation);
  };
  ws.onmessage=e=>{try{handle(JSON.parse(e.data),generation)}catch{}};
  ws.onerror=()=>{if(generation===sessionId){release();showError("Ошибка соединения с Gemini через Arkheon.")}};
  ws.onclose=e=>{clearTimeout(timer);if(generation!==sessionId)return;const code=e.code;stop(code===1000?"Разговор завершён. Нажми микрофон.":"Соединение прервано (код "+code+"). Нажми микрофон ещё раз.")};
 }catch(e){
  if(generation!==sessionId)return;
  const msg=e?.name==="NotAllowedError"?"Разреши микрофон в настройках приложения Android.":
    e?.name==="TimeoutError"?"Сервер долго отвечает. Проверь интернет.":e?.message||"Не удалось подключить Gemini.";
  release();showError(msg);
 }
}
button.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();connected||connecting?stop():void start()},{capture:true});
document.addEventListener("click",e=>{
 const el=e.target?.closest?.("#voice-toggle");
 if(!el)return;
 // Document capture is reached BEFORE the old V15.1 ElevenLabs listener on the button.
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 connected||connecting?stop():void start();
},true);
for(const id of ["voice-back","voice-end"]){
 document.getElementById(id)?.addEventListener("click",()=>stop(),{capture:true});
}
// Opening the voice page from the Home mic starts only the Gemini flow.
launch?.addEventListener("click",()=>{
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(!voice.hidden&&!connecting&&!connected)void start();
 }));
});
new MutationObserver(()=>{
 if(voice.hidden&&(connecting||connected))stop();
}).observe(voice,{attributes:true,attributeFilter:["hidden"]});
window.addEventListener("pagehide",()=>release());
document.addEventListener("visibilitychange",()=>{if(document.hidden)release()});
stop();
window.PLUXGeminiVoiceV3183={start,stop,ready:()=>connected,isListening:()=>inputEnabled};
})();
