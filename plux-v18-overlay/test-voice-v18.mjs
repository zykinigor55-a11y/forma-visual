/* PLUX V18: no-network regression test for the five original animation states.
 * Simulates Arkheon WebSocket events, confirms Russian config-before-mic,
 * and verifies animations reflect actual local speaker playback.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const boot=Date.now(),transitions=[];
class Node {
 constructor(){this.listeners=new Map();this.dataset={};this.hidden=false;this.attributes={};this.style={};this.classList={toggle(){},add(){},remove(){}};this.textContent="";this.children=[]}
 addEventListener(name,cb){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(cb)}
 removeEventListener(name,cb){this.listeners.get(name)?.delete(cb)}
 dispatch(name,event={}){for(const cb of this.listeners.get(name)||[])cb(event)}
 setAttribute(key,value){this.attributes[key]=value}
 querySelector(name){if(name===".voice-image-layer")return host;if(name==="video")return firstVideo;return null}
}
const screen=new Node(),mic=new Node(),launch=new Node(),header=new Node(),status=new Node();
const back=new Node(),end=new Node(),host=new Node(),firstVideo=new Node();
const elements={"screen-voice":screen,"voice-toggle":mic,"open-voice-quick":launch,
 "voice-toplabel":header,"voice-status":status,"voice-back":back,"voice-end":end};
let micOpened=0,lastSocket;
const document={
 hidden:false,
 getElementById:id=>elements[id]||null,
 addEventListener(){},querySelector(){return null}
};
class MutationObserver{observe(){}disconnect(){}}
class FakeWebSocket{
 static OPEN=1;
 constructor(url,protocols){
  this.url=url;this.protocols=protocols;this.listeners=new Map();this.sent=[];this.readyState=0;lastSocket=this;
  queueMicrotask(()=>{this.readyState=FakeWebSocket.OPEN;this.emit("open")});
 }
 addEventListener(name,handler){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(handler)}
 removeEventListener(name,handler){this.listeners.get(name)?.delete(handler)}
 emit(name,event={}){for(const h of this.listeners.get(name)||[])h(event)}
 receive(payload){this.emit("message",{data:JSON.stringify(payload)})}
 send(payload){
  const event=JSON.parse(payload);this.sent.push(event);
  if(event.type==="session.update")queueMicrotask(()=>this.receive({type:"session.updated",session:event.session}));
 }
 close(){this.readyState=3}
}
class FakeAudio{
 constructor(){this.born=Date.now();this.destination={};this.audioWorklet={addModule:async()=>{}}}
 get currentTime(){return (Date.now()-this.born)/1000}
 resume(){return Promise.resolve()}
 close(){return Promise.resolve()}
 createMediaStreamSource(){micOpened++;return {connect(){},disconnect(){}}}
 createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
 createBuffer(_channels,size,sampleRate){return {duration:size/sampleRate,getChannelData:()=>new Float32Array(size)}}
 createBufferSource(){
  const parent=this;
  const source={buffer:null,onended:null,connect(){},disconnect(){},start(time){
   setTimeout(()=>source.onended?.(),Math.max(1,Math.ceil((time-parent.currentTime+source.buffer.duration)*1000)));
  },stop(){source.onended?.()}};
  return source;
 }
}
class AudioWorkletNode{constructor(){this.port={onmessage:null,postMessage(){}}}connect(){}disconnect(){}}
const stream={getTracks:()=>[{stop(){}}]};
const window={
 isSecureContext:true,AudioContext:FakeAudio,AudioWorkletNode,
 PLUXSeamless:{set(_video,_host,state){transitions.push(state);host.dataset.pluxEmotion=state},sync(){},debug(){return transitions}},
 addEventListener(){}
};
const navigator={mediaDevices:{getUserMedia:async()=>stream}};
const fetch=async()=>({ok:true,json:async()=>({token:"ark_fake_test_ephemeral_token_123",wsUrl:"wss://arkheonchat.com/v1/realtime?model=google%2Fgemini-2.5-flash-lite"})});
const context={window,document,navigator,fetch,WebSocket:FakeWebSocket,MutationObserver,
 AbortSignal,URL,Date,Math,console,
 performance:{now:()=>Date.now()-boot},setTimeout,clearTimeout,
 atob:s=>Buffer.from(s,"base64").toString("binary"),btoa:s=>Buffer.from(s,"binary").toString("base64"),
 requestAnimationFrame:cb=>setTimeout(cb,0)};
runInNewContext(readFileSync("plux-v17-overlay/plux-arkheon-v17.js","utf8"),context,{filename:"plux-arkheon-v17.js"});
assert.equal(window.PLUXArkheon.debug().state,"idle");
await window.PLUXArkheon.start();
assert.equal(window.PLUXArkheon.debug().connected,true,"Voice startup: "+JSON.stringify({debug:window.PLUXArkheon.debug(),status:status.textContent,header:header.textContent,micOpened,webSocketSent:lastSocket?.sent?.map(x=>x.type)}));
assert.equal(window.PLUXArkheon.debug().russianConfigured,true);
assert.equal(micOpened,1,"Microphone must open only after acknowledgement");
assert.equal(window.PLUXArkheon.debug().state,"listening");
const settings=lastSocket.sent.find(s=>s.type==="session.update");
assert.ok(settings?.session?.instructions?.includes("ОТВЕЧАЙ ИСКЛЮЧИТЕЛЬНО ПО-РУССКИ"));
assert.equal(settings.session.audio.output.voice,"ash");
lastSocket.receive({type:"input_audio_buffer.speech_started"});
lastSocket.receive({type:"input_audio_buffer.speech_stopped"});
assert.equal(window.PLUXArkheon.debug().state,"thinking");
lastSocket.receive({type:"response.created"});
lastSocket.receive({type:"response.output_audio.delta",delta:Buffer.alloc(4800).toString("base64")});
assert.equal(window.PLUXArkheon.debug().state,"talking");
lastSocket.receive({type:"conversation.item.input_audio_transcription.completed",transcript:"Привет"});
assert.equal(window.PLUXArkheon.debug().state,"talking","Late transcription must not interrupt talking animation");
lastSocket.receive({type:"response.done"});
await sleep(1650);
assert.equal(window.PLUXArkheon.debug().state,"happy","After the audio ends, the happy clip should show");
await sleep(2050);
assert.equal(window.PLUXArkheon.debug().state,"listening","After the happy clip, conversation should resume listening");
assert.deepEqual([...new Set(transitions)].slice(0,4),["listening","thinking","talking","happy"]);
lastSocket.receive({type:"response.created"});
lastSocket.receive({type:"response.output_audio.delta",delta:Buffer.alloc(24000).toString("base64")});
lastSocket.receive({type:"input_audio_buffer.speech_started"});
assert.equal(window.PLUXArkheon.debug().state,"listening","User interruption should stop speaking video");
await window.PLUXArkheon.stop();
assert.equal(window.PLUXArkheon.debug().state,"idle");
assert.ok(transitions.includes("idle"),"Idle video must show after the call ends");
console.log("PLUX V18 voice/video tests passed: 5 clips, response synchronization, barge-in, Russian-before-mic");
