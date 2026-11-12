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
let sessionId=0,nextPlayback=0,sources=[];
const supported=()=>!!navigator.mediaDevices?.getUserMedia&&typeof WebSocket!=="undefined";
const setState=(name,detail,state="idle")=>{
 title.textContent=name;status.textContent=detail;
 voice.dataset.voiceState=state;
 button.classList.toggle("live",connected);
 button.classList.toggle("plux3183-connecting",connecting);
 button.setAttribute("aria-pressed",connected?"true":"false");
 const layer=voice.querySelector(".voice-image-layer");
 const clip=layer?.querySelector("video");
 const videoState=state==="talking"?"talking":state==="thinking"?"thinking":state==="listening"?"listening":"idle";
 if(clip&&window.PLUXSeamless?.set)try{window.PLUXSeamless.set(clip,layer,videoState)}catch{}
};
const showError=message=>setState("Голосовой режим · Gemini",String(message||"Ошибка подключения").slice(0,220),"idle");
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
 node.buffer=buffer;node.connect(audio.destination);
 const start=Math.max(audio.currentTime+.045,nextPlayback);
 // Never let a stale network burst accumulate unbounded silence.
 if(start-audio.currentTime>3){stopPlayback();nextPlayback=audio.currentTime+.06}
 const at=Math.max(audio.currentTime+.045,nextPlayback);
 node.start(at);nextPlayback=at+buffer.duration;sources.push(node);
 node.onended=()=>{sources=sources.filter(x=>x!==node)};
}
function release(){
 sessionId++;connecting=false;connected=false;
 if(processor){processor.onaudioprocess=null;try{processor.disconnect()}catch{}processor=null}
 if(source){try{source.disconnect()}catch{}source=null}
 if(mute){try{mute.disconnect()}catch{}mute=null}
 if(mic){for(const t of mic.getTracks())try{t.stop()}catch{}mic=null}
 if(ws){const w=ws;ws=null;try{w.close(1000,"Voice ended")}catch{}}
 stopPlayback();
 if(audio){const a=audio;audio=null;void a.close().catch(()=>{})}
 button.classList.remove("plux3183-connecting","live");button.setAttribute("aria-pressed","false");
}
function stop(message="Нажми микрофон, чтобы поговорить с ПЛЮХом через Gemini."){
 release();setState("Голосовой режим · Gemini",message,"idle");
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
  if(!connected||ws?.readyState!==WebSocket.OPEN)return;
  const f=e.inputBuffer.getChannelData(0);
  packet({type:"input_audio_buffer.append",audio:pcm16Base64(f,audio.sampleRate)});
 };
}
function handle(data,generation){
 if(generation!==sessionId||!data||typeof data!=="object")return;
 const type=String(data.type||"");
 if(type==="error"){
  const msg=data.error?.message||data.message||"Сервис голосового ИИ вернул ошибку.";
  showError(msg);stop();
  return;
 }
 if(type==="input_audio_buffer.speech_started"){stopPlayback();setState("ПЛЮХ слушает","Говори свободно. Можешь перебивать ответ.","listening")}
 if(type==="input_audio_buffer.speech_stopped")setState("ПЛЮХ думает","Gemini готовит ответ…","thinking");
 if(type==="response.created")setState("ПЛЮХ думает","Подготавливаю ответ…","thinking");
 if(type==="response.output_audio.delta"||type==="response.audio.delta"){
  setState("ПЛЮХ говорит","Можешь перебить в любой момент.","talking");
  playDelta(data.delta);
 }
 if(type==="response.done"||type==="response.completed"){
  if(nextPlayback<=0||!audio||nextPlayback-audio.currentTime<.12)setState("ПЛЮХ слушает","Говори свободно.","listening");
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
  if(generation!==sessionId)return;
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
   packet({type:"session.update",session:{
    instructions:"Ты ПЛЮХ — молодой, доброжелательный, энергичный помощник. Разговаривай ТОЛЬКО по-русски, короткими естественными фразами, без пауз и иностранных слов.",
    input_audio_format:"pcm16",output_audio_format:"pcm16",voice:"ash",
    turn_detection:{type:"server_vad",threshold:.45,prefix_padding_ms:300,silence_duration_ms:650,create_response:true}
   }});
   audioStart();
   setState("ПЛЮХ слушает","Gemini подключён. Говори!","listening");
  };
  ws.onmessage=e=>{try{handle(JSON.parse(e.data),generation)}catch{}};
  ws.onerror=()=>{if(generation===sessionId){showError("Ошибка соединения с Gemini через Arkheon.");stop()}};
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
window.addEventListener("pagehide",()=>release());
document.addEventListener("visibilitychange",()=>{if(document.hidden)release()});
stop();
window.PLUXGeminiVoiceV3183={start,stop,ready:()=>connected};
})();
