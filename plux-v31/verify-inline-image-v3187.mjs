/* PLUX V31.8.7: a generated picture must be VISIBLE inside chat, not only
 * metadata. Uses mocked API routes — no paid generation or external image. */
import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const api="https://pluh-voice-demo.onrender.com";
const id="a".repeat(32);
const url=api+"/api/download/image/PLUX-MOCK-IMAGE";
function crc32(buffer){let n=0xffffffff;for(const b of buffer){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^(0xedb88320&-(n&1))}return (n^0xffffffff)>>>0}
function png(w,h){
 const pixels=Buffer.alloc(h*(w*4+1));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let i=y*(w*4+1)+1+x*4;
  pixels[i]=Math.round(x/w*255);pixels[i+1]=Math.round(y/h*255);pixels[i+2]=110;pixels[i+3]=255;
 }
 const chunk=(tag,data)=>{
  const name=Buffer.from(tag),n=Buffer.alloc(4),crc=Buffer.alloc(4);
  n.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([n,name,data,crc]);
 };
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from("89504e470d0a1a0a","hex"),
  chunk("IHDR",ihdr),chunk("IDAT",deflateSync(pixels)),chunk("IEND",Buffer.alloc(0))]);
}
const binary=png(24,18);
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 let requests=0,statuses=0;
 await page.route("**/plux-chat-v128.js*",route=>route.fulfill({status:200,contentType:"text/javascript",body:"/* injected updated local script */"}));
 await page.route("**/api/chat",route=>{
  if(route.request().method()==="OPTIONS")
   return route.fulfill({status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS"}});
  requests++;
  const body=JSON.parse(route.request().postData()||"{}");
  assert.equal(body.requestedArtifact,"image");
  return route.fulfill({status:202,contentType:"application/json",
   headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type"},
   body:JSON.stringify({job:{id,kind:"image"}})});
 });
 await page.route("**/api/generation/status?*",route=>{
  statuses++;
  const payload=statuses%3===0?
   {id,kind:"image",state:"complete",artifact:{type:"image",filename:"PLUX-GPT-Image-2.png",mime:"image/png",url},reply:"Создал изображение с GPT Image 2."}
   :{id,kind:"image",state:"working"};
  return route.fulfill({status:200,contentType:"application/json",
   headers:{"Access-Control-Allow-Origin":origin},
   body:JSON.stringify(payload)});
 });
 let failPreview=false,photoFetches=0;
 await page.route("**/api/download/image/PLUX-MOCK-IMAGE",route=>{
  photoFetches++;
  return route.fulfill({status:failPreview?404:200,contentType:"image/png",
   headers:{"Access-Control-Allow-Origin":origin,"Cross-Origin-Resource-Policy":"cross-origin"},
   body:failPreview?"Not found":binary});
 });
 const res=await page.goto(origin+"/?mobile=1&v=3186",{waitUntil:"domcontentloaded",timeout:60000});
 assert.equal(res.status(),200);
 await page.waitForSelector("#chat-form",{state:"attached",timeout:28000});
 await page.evaluate(()=>{
  for(const el of document.querySelectorAll(".screen")){
   const show=el.id==="screen-chat";
   el.hidden=!show;el.style.setProperty("display",show?"flex":"none","important");
  }
  for(const node of document.querySelectorAll("#screen-onboard,#plux127-intro,#onboarding-screen,.onboard-overlay")){
   node.hidden=true;node.style.setProperty("display","none","important");
  }
 });
 await page.addStyleTag({path:"plux-v14-overlay/plux-artifacts-v14.css"});
 await page.addStyleTag({path:"plux-v31/chat-image-v3187.css"});
 await page.addScriptTag({path:"plux-v128-overlay/plux-chat-v128.js"});
 assert(await page.evaluate(()=>!!window.PLUXChatAPI));
 async function send(prompt){
  await page.evaluate(p=>{
   document.getElementById("chat-input").value=p;
   document.getElementById("chat-form").requestSubmit();
  },prompt);
 }
 await send("Нарисуй красивую лошадь");
 await page.locator(".plux3187-percent").waitFor({timeout:10000});
 const start=await page.locator(".plux3187-percent").last().textContent();
 assert.match(start,/\d+%/);
 assert(!start.includes("100%"));
 await page.waitForFunction(()=>{const p=document.querySelector(".plux3187-percent");
  return p&&Number(p.textContent.replace("%",""))>=7},{timeout:7500});
 const progress=await page.locator(".plux3187-percent").last().textContent();
 const caption=await page.locator(".plux3187-percent-note").last().textContent();
 assert.match(caption,/Примерный/);
 await page.locator(".plux3187-image-open img").waitFor({timeout:30000});
 const detail=await page.evaluate(()=>{
  const image=document.querySelector(".plux3187-image-open img");
  const card=document.querySelector(".plux3187-image-card");
  return {complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,
   visible:getComputedStyle(image).display!=="none"&&getComputedStyle(image).visibility!=="hidden",
   src:image.currentSrc.slice(0,5),text:card.textContent,button:!!card.querySelector(".plux3187-image-save")};
 });
 assert(detail.complete&&detail.width===24&&detail.height===18,JSON.stringify(detail));
 assert(detail.visible);
 assert.equal(detail.src,"blob:");
 assert(detail.button);
 assert(!detail.text.includes("Примерный прогресс"));
 assert.equal(await page.locator(".plux3187-image-card").count(),1);
 console.log("PLUX3187_INLINE_PASS "+JSON.stringify({start,progress,...detail,requests,statuses,photoFetches}));
 // On a bad/expired remote link, show an explicit visible error, not a fake preview.
 failPreview=true;
 await send("Нарисуй еще одну лошадь");
 await page.locator(".plux3187-failed").waitFor({timeout:30000});
 const errorText=await page.locator(".plux3187-failed").last().textContent();
 assert(/Не удалось|Ошибка/i.test(errorText));
 console.log("PLUX3187_FAILED_PREVIEW_VISIBLE "+errorText.slice(0,160));
 assert.equal(errors.length,0,errors.join(" | "));
}finally{await browser.close()}
