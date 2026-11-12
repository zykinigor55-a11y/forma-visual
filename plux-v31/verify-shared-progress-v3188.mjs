/* PLUX V31.8.7: a generated picture must be VISIBLE inside chat, not only
 * metadata. Uses mocked API routes — no paid generation or external image. */
import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {readFileSync} from "node:fs";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const api="https://pluh-voice-demo.onrender.com";
let id=null;
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
 // The old V12.4 typewriter deleted generated images and progress DOM.
 // Test the corrected version in the real, still-old published page.
 await page.route("**/plux-typewriter-v124.js*",route=>route.fulfill({
  status:200,contentType:"text/javascript",
  body:readFileSync("plux-v124-overlay/plux-typewriter-v124.js","utf8")
 }));
 await page.route("**/api/chat",route=>{
  if(route.request().method()==="OPTIONS")
   return route.fulfill({status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS"}});
  requests++;
  const body=JSON.parse(route.request().postData()||"{}");
  assert.equal(body.requestedArtifact,"image");
  assert.match(body.clientJobId,/^[A-Za-z0-9_-]{32}$/);
  id=body.clientJobId;
  // Simulate mobile losing the FIRST response after Render accepted the job.
  if(requests===1)return route.abort("failed");
  return route.fulfill({status:202,contentType:"application/json",
   headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type"},
   body:JSON.stringify({job:{id,kind:"image"}})});
 });
 await page.route("**/api/generation/status?*",route=>{
  statuses++;
  const queried=new URL(route.request().url()).searchParams.get("id");
  assert.equal(queried,id,"resume checks the same job rather than creating a new paid one");
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
 await page.addStyleTag({path:"plux-v31/generation-progress-v3188.css"});
 await page.addScriptTag({path:"plux-v31/generation-progress-v3188.js"});
 await page.addScriptTag({path:"plux-v128-overlay/plux-chat-v128.js"});
 assert(await page.evaluate(()=>!!window.PLUXChatAPI));
 async function send(prompt){
  await page.evaluate(p=>{
   document.getElementById("chat-input").value=p;
   document.getElementById("chat-form").requestSubmit();
  },prompt);
 }
 await send("Нарисуй красивую лошадь");
 await page.waitForTimeout(600);
 const debug=await page.evaluate(()=>{
  const form=document.getElementById("chat-form"),feed=document.getElementById("chat-messages"),chat=document.getElementById("screen-chat");
  return {formHidden:!!form?.hidden,screenHidden:!!chat?.hidden,formStyle:getComputedStyle(form).display,
   content:feed?.textContent?.slice(-700),markup:feed?.innerHTML?.slice(-900),
   generated:feed?.querySelectorAll(".plux3188-progress-value").length,
   api:!!window.PLUXChatAPI,forms:document.querySelectorAll("#chat-form").length};
 });
 console.log("PLUX3188_DEBUG "+JSON.stringify({debug,requests,statuses,errors}));
 await page.locator(".plux3188-progress-value").waitFor({state:"attached",timeout:10000});
 const start=await page.locator(".plux3188-progress-value").last().textContent();
 assert.match(start,/\d+%/);
 assert(!start.includes("100%"));
 await page.waitForFunction(()=>{const p=document.querySelector(".plux3188-progress-value");
  return p&&Number(p.textContent.replace("%",""))>=7},{timeout:7500});
 const progress=await page.locator(".plux3188-progress-value").last().textContent();
 const caption=await page.locator(".plux3188-progress-numbers span").last().textContent();
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
 // The same shared card is used in the separate Create screen.
 const identical=await page.evaluate(()=>{
   const chatTarget=document.createElement("div");const createTarget=document.createElement("div");
   document.getElementById("screen-chat").append(chatTarget);
   document.getElementById("screen-create").append(createTarget);
   const x=window.PLUXGenerationProgressV3188.mount(chatTarget,{kind:"image",model:"GPT Image 2"});
   const y=window.PLUXGenerationProgressV3188.mount(createTarget,{kind:"image",model:"GPT Image 2"});
   const same=x.root.innerHTML===y.root.innerHTML;
   const sameStyles=["padding","borderRadius","backgroundImage","gap"].every(key=>
     getComputedStyle(x.root)[key]===getComputedStyle(y.root)[key]);
   x.end();y.end();chatTarget.remove();createTarget.remove();
   return {same,sameStyles};
 });
 assert(identical.same&&identical.sameStyles,"Chat and Create must share pixel-identical percent cards");
 assert.equal(await page.locator(".plux3187-image-card").count(),1);
 assert.equal(requests,1,"Lost POST response must NOT launch another paid request");
 console.log("PLUX3188_INLINE_PASS "+JSON.stringify({start,progress,...detail,requests,statuses,photoFetches}));
 // On a bad/expired remote link, show an explicit visible error, not a fake preview.
 failPreview=true;
 await send("Нарисуй еще одну лошадь");
 await page.locator(".plux3188-progress-error").waitFor({timeout:30000});
 const errorText=await page.locator(".plux3188-progress-error").last().textContent();
 assert(/Не удалось|Ошибка/i.test(errorText));
 console.log("PLUX3188_FAILED_PREVIEW_VISIBLE "+errorText.slice(0,160));
 assert.equal(errors.length,0,errors.join(" | "));
}finally{await browser.close()}
