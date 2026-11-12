import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:860},isMobile:true,hasTouch:true,permissions:['microphone']});
 const page=await ctx.newPage();let oldVoiceCalls=0,geminiCalls=0;
 await page.route('**/api/voice/token',r=>{oldVoiceCalls++;return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Legacy ElevenLabs must not be called'})})});
 await page.route('**/api/arkheon/token',r=>{geminiCalls++;return r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'https://plux-v17-friends-preview.onrender.com','Access-Control-Allow-Headers':'content-type'},body:JSON.stringify({token:'ek_plux_fake_token_test_1234567890',wsUrl:'wss://arkheonchat.com/v1/realtime?model=google%2Fgemini-2.5-flash-lite'})})});
 await page.addInitScript(()=>{
  window.__geminiSent=[];const ActualWS=window.WebSocket;
  class FakeWS{
   static OPEN=1;static CONNECTING=0;static CLOSED=3;
   constructor(url,protocols){this.url=url;this.protocols=protocols;this.readyState=0;window.__geminiProtocols=protocols;
    queueMicrotask(()=>{this.readyState=1;this.onopen?.({})})}
   send(raw){window.__geminiSent.push(JSON.parse(raw))}
   close(){this.readyState=3;this.onclose?.({code:1000})}
  }
  window.WebSocket=FakeWS;
  window.PLUXMockRealWS=ActualWS;
 });
 const errors=[];page.on('pageerror',e=>errors.push(String(e.message)));
 let res=await page.goto('https://plux-v17-friends-preview.onrender.com/?mobile=1&v=3182',{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(res.status(),200);
 await page.waitForFunction(()=>document.getElementById('voice-toggle')&&!!window.PLUXMicPermissionV318,{timeout:25000});
 await page.evaluate(()=>{
  for(const e of document.querySelectorAll('.screen')){e.hidden=e.id!=='screen-voice';e.style.setProperty('display',e.id==='screen-voice'?'flex':'none','important')}
  for(const sel of ['#screen-onboard','#plux127-intro','#onboarding-screen','.onboard-overlay'])for(const e of document.querySelectorAll(sel)){e.hidden=true;e.style.setProperty('display','none','important')}
 });
 await page.addScriptTag({path:'plux-v31/gemini-voice-v3183.js'});
 await page.waitForFunction(()=>!!window.PLUXGeminiVoiceV3183);
 assert.equal(await page.locator('#voice-toplabel').textContent(),'Голосовой режим · Gemini');
 await page.locator('#voice-toggle').click({force:true});
 await page.waitForFunction(()=>window.PLUXGeminiVoiceV3183?.ready(),{timeout:12000});
 const info=await page.evaluate(()=>({title:document.getElementById('voice-toplabel').textContent,
  status:document.getElementById('voice-status').textContent,
  events:window.__geminiSent.filter(x=>x.type==='session.update').map(x=>({type:x.type,voice:x.session.voice})),
  protocols:window.__geminiProtocols,button:document.getElementById('voice-toggle').classList.contains('live')}));
 console.log('PLUX3183_GEMINI_MOCK '+JSON.stringify(info));
 assert.equal(geminiCalls,1);assert.equal(oldVoiceCalls,0);
 assert.equal(info.button,true);
 assert.equal(info.events.length,1);
 assert(info.protocols.includes('openai-insecure-api-key.ek_plux_fake_token_test_1234567890'));
 await page.locator('#voice-toggle').click({force:true});
 assert.equal(await page.locator('#voice-toggle').getAttribute('aria-pressed'),'false');
 console.log('PLUX3183_PASS no ElevenLabs calls, Gemini realtime tokens and microphone state');
 console.log('PLUX3183_PAGE_ERRORS '+JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0);
}finally{await browser.close()}
