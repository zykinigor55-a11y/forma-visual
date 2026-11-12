import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const browser=await chromium.launch({channel:"chrome",headless:true,
 args:["--no-sandbox","--disable-dev-shm-usage","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});
try{
 const context=await browser.newContext({viewport:{width:390,height:860},isMobile:true,hasTouch:true,permissions:["microphone"]});
 const page=await context.newPage();
 let oldCalls=0,geminiCalls=0;const errors=[];
 page.on("pageerror",e=>errors.push(String(e.message)));
 await page.route("**/gemini-voice-v3183.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"// injected local V3185 script instead"}));
 await page.route("**/plux-live-v151.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"// obsolete realtime ElevenLabs disabled"}));
 await page.route("**/api/voice/token",r=>{oldCalls++;return r.fulfill({status:503,contentType:"application/json",body:'{"error":"Legacy route was invoked"}'})});
 await page.route("**/api/arkheon/token",r=>{
  geminiCalls++;
  return r.fulfill({status:200,contentType:"application/json",
    headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type"},
    body:JSON.stringify({token:"ek_plux_mock_voice_123456789012345",wsUrl:"wss://arkheonchat.com/v1/realtime?model=google%2Fgemini-2.5-flash-lite"})});
 });
 await page.addInitScript(()=>{
  window.__pluxSent=[];
  class WS{
   static OPEN=1;
   static CONNECTING=0;
   constructor(url,protocols){this.url=url;this.protocols=protocols;this.readyState=0;window.__pluxSocket=this;
    queueMicrotask(()=>{this.readyState=1;this.onopen?.({})})}
   send(msg){window.__pluxSent.push(JSON.parse(msg))}
   close(){this.readyState=3;this.onclose?.({code:1000})}
  }
  window.WebSocket=WS;
 });
 const response=await page.goto(origin+"/?mobile=1&v=3184",{waitUntil:"domcontentloaded",timeout:60000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>!!document.getElementById("voice-toggle")&&!!window.PLUXMicPermissionV318,{timeout:30000});
 await page.evaluate(()=>{
  for(const el of document.querySelectorAll(".screen")){el.hidden=el.id!=="screen-voice";
   el.style.setProperty("display",el.id==="screen-voice"?"flex":"none","important")}
  for(const el of document.querySelectorAll("#screen-onboard,#plux127-intro,#onboarding-screen,.onboard-overlay")){
   el.hidden=true;el.style.setProperty("display","none","important")
  }
 });
 await page.addScriptTag({path:"plux-v31/gemini-voice-v3183.js"});
 await page.waitForFunction(()=>!!window.PLUXGeminiVoiceV3183,{timeout:5000});
 await page.locator("#voice-toggle").click({force:true});
 await page.waitForFunction(()=>window.PLUXGeminiVoiceV3183?.isListening(),{timeout:12000});
 assert.equal(await page.locator("#voice-toplabel").textContent(),"Слушаю");
 assert.equal(geminiCalls,1);assert.equal(oldCalls,0);
 await page.evaluate(()=>{
  window.__pluxSocket.onmessage({data:JSON.stringify({type:"input_audio_buffer.speech_stopped"})});
  window.__pluxSocket.onmessage({data:JSON.stringify({type:"response.created"})});
 });
 assert.equal(await page.locator("#voice-toplabel").textContent(),"Думаю");
 assert.equal(await page.evaluate(()=>window.PLUXGeminiVoiceV3183.isListening()),false);
 await page.evaluate(()=>{
  const pcm=btoa("\0".repeat(5760));
  window.__pluxSocket.onmessage({data:JSON.stringify({type:"response.audio.delta",delta:pcm})});
  window.__pluxSocket.onmessage({data:JSON.stringify({type:"response.done"})});
 });
 assert.equal(await page.locator("#voice-toplabel").textContent(),"Отвечаю");
 assert.equal(await page.evaluate(()=>window.PLUXGeminiVoiceV3183.isListening()),false);
 await page.waitForFunction(()=>window.PLUXGeminiVoiceV3183.isListening(),{timeout:3500});
 assert.equal(await page.locator("#voice-toplabel").textContent(),"Слушаю");
 const state=await page.evaluate(()=>({sent:window.__pluxSent.filter(x=>x.type==="session.update").length,
  vad:window.__pluxSent.find(x=>x.type==="session.update")?.session?.turn_detection}));
 assert.equal(state.sent,1);
 await page.locator("#voice-toggle").click({force:true});
 assert.equal(await page.evaluate(()=>window.PLUXGeminiVoiceV3183.isListening()),false);
 console.log("PLUX3185_VOICE_PASS "+JSON.stringify({geminiCalls,oldCalls,states:["Слушаю","Думаю","Отвечаю","Слушаю"],vad:state.vad,errorCount:errors.length}));
 assert.equal(errors.length,0,errors.join("; "));
}finally{await browser.close()}
