const $=id=>document.getElementById(id);
const app=$('app');let current='home',ws=null,micStream=null,audioCtx=null,processor=null,source=null,silent=null,connected=false,connecting=false,playhead=0,playSources=new Set(),inputRate=16000,outputRate=16000,volume=0,raf=0,activeMode='voice',pendingText=[];
const nameKey='plux_user_name';const historyKey='plux_history';let userName=(localStorage.getItem(nameKey)||'').trim();const hist=(()=>{try{return JSON.parse(localStorage.getItem(historyKey)||'[]').slice(-35)}catch{return []}})();
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('is-visible');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('is-visible'),3700)}
function screen(which){for(const [id,el] of [['home',$('home')],['voice',$('voice')],['chat',$('chat')],['onboard',$('onboard')]])el.hidden=id!==which;current=which;app.dataset.mode=which;}
function persistName(name){userName=name.trim().slice(0,35);localStorage.setItem(nameKey,userName);$('personal-label').textContent='PLUX • '+userName;$('setting-name').value=userName;if($('voice-personal-label'))$('voice-personal-label').textContent='PLUX • '+userName}
function setVoiceState(text){$('voice-state').textContent=text;$('voice-hint').textContent=text;window.dispatchEvent(new CustomEvent('plux:voice-state',{detail:{text}}))}
function renderChat(){const feed=$('chat-feed');feed.innerHTML='';const messages=hist.length?hist:[{role:'assistant',text:'Привет'+(userName?', '+userName:'')+'! Чем займёмся сегодня? 💚'}];for(const m of messages){const el=document.createElement('div');el.className='chat-bubble '+(m.role==='user'?'user':'assistant');el.textContent=m.text;feed.append(el)}feed.scrollTop=feed.scrollHeight}
function addMessage(role,text){if(!text||!text.trim())return;if(hist.at(-1)?.role===role&&hist.at(-1)?.text===text.trim())return;hist.push({role,text:text.trim()});if(hist.length>35)hist.splice(0,hist.length-35);localStorage.setItem(historyKey,JSON.stringify(hist));renderChat();if(role==='user')$('recent-title').textContent=text.slice(0,45)}
function openSettings(){ $('setting-name').value=userName;$('settings').showModal();health();}
$('menu').onclick=openSettings;$('voice-settings').onclick=openSettings;$('notify').onclick=()=>toast('PLUX рядом. Скоро здесь появятся уведомления.');
$('save-settings').onclick=()=>{const n=$('setting-name').value.trim();if(n)persistName(n);sessionStorage.setItem('plux_demo_code',$('access-code').value.trim());$('settings').close();toast('Настройки сохранены на этом устройстве')};
$('save-name').onclick=()=>{const n=$('name-input').value.trim();if(!n){toast('Как тебя называть?');$('name-input').focus();return}persistName(n);screen('home');toast('Рад знакомству, '+n+'! ✨')};
$('name-input').onkeydown=e=>{if(e.key==='Enter')$('save-name').click()};
$('home-mic').onclick=()=>{$('talk-trigger').click()};$('talk-trigger').onclick=()=>{screen('voice');setVoiceState('Нажмите на микрофон');initWave()};$('recent').onclick=()=>{renderChat();screen('chat')};$('home-form').onsubmit=e=>{e.preventDefault();const input=$('home-input'),text=input.value.trim();if(!text)return;input.value='';screen('chat');sendText(text)};
$('chat-form').onsubmit=e=>{e.preventDefault();const input=$('chat-input'),text=input.value.trim();if(!text)return;input.value='';sendText(text)};$('chat-back').onclick=()=>{disconnect();screen('home')};$('chat-voice').onclick=()=>{disconnect();screen('voice');initWave()};$('voice-back').onclick=()=>{disconnect();screen('home')};$('switch-text').onclick=()=>{disconnect();renderChat();screen('chat')};$('voice-mic').onclick=()=>{if(connected||connecting){disconnect();setVoiceState('Разговор завершён')}else startSession('voice')};
async function health(){try{const r=await fetch('/api/health',{cache:'no-store'}),d=await r.json();$('service-status').textContent=d.ready?'ElevenLabs: сервер настроен':'ElevenLabs: у сервера пока нет ключа или кода доступа';return d.ready}catch{$('service-status').textContent='Нет связи с сервером';return false}}
function initWave(){if($('waveform').children.length)return;for(let i=0;i<45;i++){const bar=document.createElement('i');bar.style.height='7px';$('waveform').append(bar)}waveLoop()}
function waveLoop(){if(raf)return;const bars=[...$('waveform').children];let phase=0;function tick(){raf=requestAnimationFrame(tick);phase+=.06;const a=connected?volume:0;const talking=connected&&$('voice-state').textContent.includes('Отвеч');bars.forEach((bar,i)=>{const envelope=Math.pow(Math.max(.04,1-Math.abs(i-22)/24),1.6);const movement=(Math.sin(i*.84+phase*1.1)+Math.sin(i*.37-phase*.82)+2)/4;let amount=(connected&&a>.008)?Math.min(1,.16+a*5.5):talking?.36:.12;bar.style.height=(6+envelope*(amount*(18+movement*56)))+'px';bar.style.opacity=(.4+envelope*.55).toFixed(2)})}tick()}
function pcm(input,inRate,outRate){const n=Math.max(1,Math.floor(input.length*outRate/inRate));const bytes=new Uint8Array(n*2);for(let i=0;i<n;i++){const p=i*inRate/outRate,j=Math.floor(p),f=p-j;let v=(input[j]||0)*(1-f)+(input[Math.min(j+1,input.length-1)]||0)*f;v=Math.min(1,Math.max(-1,v));const q=Math.round(v<0?v*32768:v*32767);bytes[i*2]=q&255;bytes[i*2+1]=(q>>8)&255}let s='';for(let i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s)}
function unpcm(b64){const b=Uint8Array.from(atob(b64),x=>x.charCodeAt(0));const o=new Float32Array(Math.floor(b.length/2));for(let i=0;i<o.length;i++){let n=b[i*2]|b[i*2+1]<<8;if(n&32768)n-=65536;o[i]=n/32768}return o}
// V17: retain every PCM chunk in order and protect the output from the microphone.
// Browser echo cancellation is helpful, but not sufficient for a speakerphone.
let outputMuteUntil=0,lastInterruptionId=-1,lastAudioEventId=-1,voiceEpoch=0;
function stopPlaying(){
  voiceEpoch++;
  for(const node of playSources){try{node.stop()}catch{}}
  playSources.clear();
  playhead=0;
  outputMuteUntil=audioCtx?audioCtx.currentTime+.25:0;
}
function playAudio(b64,eventId){
  if(!audioCtx||!b64)return;
  if(Number.isFinite(eventId)&&eventId<=lastInterruptionId)return;
  // Duplicate/replayed event IDs should never append the same speech twice.
  if(Number.isFinite(eventId)){
    if(eventId<=lastAudioEventId)return;
    lastAudioEventId=eventId;
  }
  let samples;
  try{samples=unpcm(b64)}catch{return}
  if(!samples.length)return;
  let rms=0;
  for(let i=0;i<samples.length;i+=48)rms+=samples[i]*samples[i];
  rms=Math.sqrt(rms/Math.max(1,Math.ceil(samples.length/48)));
  window.dispatchEvent(new CustomEvent('plux:audio-out',{detail:{level:rms*4}}));
  const buffer=audioCtx.createBuffer(1,samples.length,outputRate);
  buffer.copyToChannel(samples,0);
  const node=audioCtx.createBufferSource();
  node.buffer=buffer;
  node.connect(audioCtx.destination);
  const now=audioCtx.currentTime;
  // Leave a small jitter buffer when a new phrase begins; never overlap chunks.
  const start=Math.max(now+(playhead>now+.025?.045:.12),playhead);
  const epoch=voiceEpoch;
  playhead=start+buffer.duration;
  outputMuteUntil=Math.max(outputMuteUntil,playhead+.8);
  node.onended=()=>{
    playSources.delete(node);
    if(playSources.size===0&&connected){
      setTimeout(()=>{
        if(connected&&voiceEpoch===epoch&&playSources.size===0&&
          audioCtx&&audioCtx.currentTime>=playhead-.02)
          setVoiceState('Слушаю вас');
      },840);
    }
  };
  playSources.add(node);
  try{node.start(start)}
  catch{playSources.delete(node)}
}
function onSocket(event){
  let m;
  try{m=JSON.parse(event.data)}catch{return}
  switch(m.type){
    case 'conversation_initiation_metadata':{
      const meta=m.conversation_initiation_metadata_event||{};
      const fmt=meta.user_input_audio_format||'pcm_16000';
      const out=meta.agent_output_audio_format||'pcm_16000';
      if(!/^pcm_\d+$/.test(fmt)||!/^pcm_\d+$/.test(out)){
        toast('Этот аудиоформат ElevenLabs не поддерживается');disconnect();return;
      }
      inputRate=Number(fmt.split('_')[1]);
      outputRate=Number(out.split('_')[1]);
      if(micStream)connectMic();
      break;
    }
    case 'ping':{
      if(ws?.readyState===1)ws.send(JSON.stringify({type:'pong',event_id:m.ping_event?.event_id}));
      break;
    }
    case 'user_transcript':{
      const t=m.user_transcription_event?.user_transcript||'';
      if(t){$('voice-transcript').textContent='Вы: '+t;addMessage('user',t)}
      setVoiceState('PLUX думает…');
      break;
    }
    case 'agent_response':{
      const t=m.agent_response_event?.agent_response||'';
      if(t){$('voice-transcript').textContent='PLUX: '+t;addMessage('assistant',t)}
      // The full transcript can arrive while the last audio chunks are still playing.
      if(playSources.size||audioCtx?.currentTime<outputMuteUntil)
        setVoiceState('PLUX отвечает');
      else setVoiceState('Слушаю вас');
      break;
    }
    case 'audio':{
      const payload=m.audio_event||{};
      if(payload.audio_base_64){
        setVoiceState('PLUX отвечает');
        playAudio(payload.audio_base_64,Number(payload.event_id));
      }
      break;
    }
    case 'interruption':{
      const id=Number(m.interruption_event?.event_id??m.event_id);
      if(Number.isFinite(id))lastInterruptionId=Math.max(lastInterruptionId,id);
      stopPlaying();
      setVoiceState('Слушаю вас');
      break;
    }
    case 'agent_response_correction':{
      const correction=m.agent_response_correction_event?.corrected_agent_response||'';
      if(correction){
        $('voice-transcript').textContent='PLUX: '+correction;
        const latest=hist.at(-1);
        if(latest?.role==='assistant'){
          latest.text=correction;
          localStorage.setItem(historyKey,JSON.stringify(hist));
          renderChat();
        }
      }
      break;
    }
  }
}
function connectMic(){
  if(!connected||!micStream||!audioCtx||processor)return;
  source=audioCtx.createMediaStreamSource(micStream);
  processor=audioCtx.createScriptProcessor(2048,1,1);
  silent=audioCtx.createGain();silent.gain.value=0;
  const quiet=new Float32Array(2048);
  processor.onaudioprocess=e=>{
    if(!connected||!ws||ws.readyState!==1||!audioCtx)return;
    const chunk=e.inputBuffer.getChannelData(0);
    const isSpeaking=audioCtx.currentTime<outputMuteUntil;
    const data=isSpeaking?quiet:chunk;
    if(isSpeaking)volume=0;
    else{
      let sum=0;
      for(let i=0;i<chunk.length;i+=4)sum+=chunk[i]*chunk[i];
      volume=Math.sqrt(sum/(chunk.length/4));
    }
    window.dispatchEvent(new CustomEvent('plux:mic-level',{detail:{level:volume}}));
    if(ws.bufferedAmount>200000)return;
    // Keep streaming quiet frames while PLUX speaks so the agent cannot hear
    // its own audio, restart its VAD, and cut off the end of a sentence.
    ws.send(JSON.stringify({user_audio_chunk:pcm(data,audioCtx.sampleRate,inputRate)}));
  };
  source.connect(processor);processor.connect(silent);silent.connect(audioCtx.destination);
}
function disconnect(){connecting=false;connected=false;volume=0;window.dispatchEvent(new Event('plux:voice-disconnect'));stopPlaying();try{ws?.close()}catch{}ws=null;try{processor?.disconnect()}catch{}processor=null;try{source?.disconnect()}catch{}source=null;try{silent?.disconnect()}catch{}silent=null;micStream?.getTracks().forEach(t=>t.stop());micStream=null;if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null}$('voice-mic').classList.remove('is-live');$('voice-mic').setAttribute('aria-label','Начать разговор')}
async function startSession(mode='voice'){if(connecting||connected)return;const code=sessionStorage.getItem('plux_demo_code')||'';if(!code){toast('В настройках нужно указать код доступа к тесту (не API-ключ)');openSettings();return}activeMode=mode;connecting=true;setVoiceState('Подключаю ElevenLabs…');try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();await audioCtx.resume()}const response=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const json=await response.json();if(!response.ok)throw Error(json.error||'Сервер не разрешил соединение');if(mode==='voice')micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});const socket=new WebSocket(json.signedUrl);ws=socket;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('ElevenLabs не отвечает')),12000);socket.onopen=()=>{clearTimeout(timer);resolve()};socket.onerror=()=>{clearTimeout(timer);reject(Error('Ошибка соединения с ElevenLabs'))}});connected=true;connecting=false;socket.onmessage=onSocket;socket.onclose=()=>{if(ws===socket){disconnect();setVoiceState('Соединение завершено')}};socket.send(JSON.stringify({type:'conversation_initiation_client_data',dynamic_variables:{user_name:userName||'друг'}}));if(mode==='voice'){$('voice-mic').classList.add('is-live');$('voice-mic').setAttribute('aria-label','Завершить разговор');setVoiceState('Слушаю вас')}else toast('Текстовый чат подключён');for(const text of pendingText.splice(0))socket.send(JSON.stringify({type:'user_message',text}));}catch(e){disconnect();setVoiceState('Не удалось подключиться');toast(e.message)}}
async function sendText(text){addMessage('user',text);if(connected&&ws?.readyState===1){ws.send(JSON.stringify({type:'user_message',text}));return}pendingText.push(text);await startSession('text');if(!connected){pendingText.length=0;const ready=await health();if(!ready)toast('Для ответов AI добавьте ключ ElevenLabs и код доступа на Render')}}
async function maybeVideo(){const v=$('voice-video');const src='/assets/plux-voice.mp4';try{const r=await fetch(src,{method:'HEAD'});if(!r.ok)return;v.src=src;v.oncanplay=()=>{$('voice').dataset.video='playing';v.play().catch(()=>{})}}catch{}}
window.addEventListener('pagehide',disconnect);window.addEventListener('visibilitychange',()=>{if(document.hidden&&connected)disconnect()});$('access-code').value=sessionStorage.getItem('plux_demo_code')||'';
if(userName){persistName(userName);screen('home')}else{screen('onboard')}renderChat();health();maybeVideo();
