import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const browser=await chromium.launch({channel:"chrome",headless:true,
 args:["--no-sandbox","--disable-dev-shm-usage","--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:860},isMobile:true,hasTouch:true,permissions:["microphone"]});
 const page=await ctx.newPage();
 let oldCalls=0,geminiCalls=0;
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.route("**/voice-memory-v3186.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"/* mock the production asset while testing local source */"}));
 await page.route("**/gemini-voice-v3183.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"/* inject local V3186 integration */"}));
 await page.route("**/api/voice/token",r=>{oldCalls++;return r.fulfill({status:503,contentType:"application/json",body:"{}"})});
 await page.route("**/api/arkheon/token",r=>{
  geminiCalls++;
  return r.fulfill({status:200,contentType:"application/json",headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type"},
   body:JSON.stringify({token:"ek_plux_mock_1234567890123456789",wsUrl:"wss://arkheonchat.com/v1/realtime?model=google%2Fgemini-2.5-flash-lite"})});
 });
 await page.addInitScript(()=>{
  window.__pluxSent=[];
  class FakeWS{
   static OPEN=1;static CONNECTING=0;
   constructor(url,protocols){this.url=url;this.protocols=protocols;this.readyState=0;window.__pluxWS=this;
    queueMicrotask(()=>{this.readyState=1;this.onopen?.({})})}
   send(raw){window.__pluxSent.push(JSON.parse(raw))}
   close(){this.readyState=3;this.onclose?.({code:1000})}
  }
  window.WebSocket=FakeWS;
 });
 async function setup(){
  const res=await page.goto(origin+"/?mobile=1&v=3185",{waitUntil:"domcontentloaded",timeout:60000});
  assert.equal(res.status(),200);
  await page.waitForFunction(()=>!!document.getElementById("voice-toggle")&&!!window.PLUXMicPermissionV318,{timeout:30000});
  await page.evaluate(()=>{
   for(const el of document.querySelectorAll(".screen")){el.hidden=el.id!=="screen-voice";
    el.style.setProperty("display",el.id==="screen-voice"?"flex":"none","important")}
   for(const el of document.querySelectorAll("#screen-onboard,#plux127-intro,#onboarding-screen,.onboard-overlay")){
    el.hidden=true;el.style.setProperty("display","none","important")
   }
  });
  await page.addScriptTag({path:"plux-v31/voice-memory-v3186.js"});
  await page.addScriptTag({path:"plux-v31/gemini-voice-v3183.js"});
  await page.waitForFunction(()=>!!window.PLUXVoiceMemoryV3186&&!!window.PLUXGeminiVoiceV3183);
 }
 await setup();
 await page.evaluate(()=>window.PLUXVoiceMemoryV3186.clear());
 await page.locator("#voice-toggle").click({force:true});
 await page.waitForFunction(()=>window.PLUXGeminiVoiceV3183?.isListening(),{timeout:12000});
 await page.evaluate(()=>{
  window.__pluxWS.onmessage({data:JSON.stringify({
   type:"conversation.item.input_audio_transcription.completed",item_id:"user_1",transcript:"Меня зовут Иван и я хочу обсудить наш дом."
  })});
  window.__pluxWS.onmessage({data:JSON.stringify({
   type:"response.output_audio_transcript.done",item_id:"assistant_1",transcript:"Конечно, обсудим проект вашего дома."
  })});
  // Duplicate GA event for the same item must not create a duplicate memory.
  window.__pluxWS.onmessage({data:JSON.stringify({
   type:"conversation.item.done",item:{id:"assistant_1",role:"assistant",content:[{type:"output_audio",transcript:"Конечно, обсудим проект вашего дома."}]}
  })});
 });
 assert.equal(await page.evaluate(()=>window.PLUXVoiceMemoryV3186.count()),2);
 const sentFirst=await page.evaluate(()=>window.__pluxSent.filter(x=>x.type==="session.update").at(-1));
 assert.equal(sentFirst.session.input_audio_transcription?.model,"whisper-1");
 assert(!sentFirst.session.instructions.includes("Меня зовут Иван"));
 await page.locator("#voice-toggle").click({force:true});
 // Reload simulates a full Android WebView app re-entry.
 await setup();
 assert.equal(await page.evaluate(()=>window.PLUXVoiceMemoryV3186.count()),2,"Memory must survive page restart");
 await page.locator("#voice-toggle").click({force:true});
 await page.waitForFunction(()=>window.PLUXGeminiVoiceV3183?.isListening(),{timeout:12000});
 const sentSecond=await page.evaluate(()=>window.__pluxSent.filter(x=>x.type==="session.update").at(-1));
 assert(sentSecond.session.instructions.includes("Меня зовут Иван"),"Gemini gets past user's context");
 assert(sentSecond.session.instructions.includes("обсудим проект вашего дома"),"Gemini gets past assistant's reply");
 await page.locator("#voice-toggle").click({force:true});
 // The user can remove history from the device.
 await page.evaluate(()=>window.PLUXVoiceMemoryV3186.clear());
 assert.equal(await page.evaluate(()=>window.PLUXVoiceMemoryV3186.count()),0);
 assert.equal(await page.evaluate(()=>window.PLUXVoiceMemoryV3186.context()),"");
 assert.equal(oldCalls,0);
 assert.equal(geminiCalls,2);
 assert.equal(errors.length,0,errors.join("; "));
 console.log("PLUX3186_MEMORY_PASS "+JSON.stringify({
  afterRestart:true,storedRoles:2,contextInjected:true,clearWorking:true,geminiCalls,oldCalls,errors
 }));
}finally{await browser.close()}
