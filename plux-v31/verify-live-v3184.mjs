import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto("https://plux-v17-friends-preview.onrender.com/?mobile=1&v=3184",{waitUntil:"domcontentloaded",timeout:60000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>!!window.PLUXPaletteSymmetryV3184&&!!window.PLUXCognitionV318&&!!document.getElementById("plux3184-prompt-count"),{timeout:25000});
 await page.evaluate(()=>{
  const home=document.getElementById("screen-home");
  for(const other of document.querySelectorAll(".screen")){other.hidden=other!==home;other.style.setProperty("display",other===home?"flex":"none","important")}
  for(const sel of ["#screen-onboard","#plux127-intro","#onboarding-screen",".onboard-overlay"])
   for(const other of document.querySelectorAll(sel)){other.hidden=true;other.style.setProperty("display","none","important")}
  window.PLUXPaletteSymmetryV3184.sync();
 });
 await page.waitForTimeout(300);
 const home=await page.evaluate(()=>{
  const header=document.querySelector("#screen-home .home-head");
  const controls=[...header.querySelectorAll("button")].map(x=>({id:x.id,label:x.getAttribute("aria-label"),x:Math.round(x.getBoundingClientRect().x),w:Math.round(x.getBoundingClientRect().width)}));
  const palette=document.querySelector("#plux-theme-trigger").getBoundingClientRect();
  const profile=document.querySelector("#open-profile")?.getBoundingClientRect();
  const box=header.getBoundingClientRect();
  return {controls,paletteX:palette.x,paletteRight:box.right-palette.right,profileLeft:profile?profile.left-box.left:null,coreText:document.querySelector("#plux318-cognition")?.textContent};
 });
 console.log("PLUX3184_HEADER "+JSON.stringify(home));
 assert(!home.coreText?.includes("PLUX"),"header is animation only");
 assert(home.profileLeft!==null,"profile control must be locatable for symmetrical palette");
 assert(Math.abs(home.paletteRight-home.profileLeft)<=3,"profile and palette must have equal edge margins");
 await page.evaluate(()=>{
  const target=document.querySelector("#screen-create");
  for(const other of document.querySelectorAll(".screen")){other.hidden=other!==target;other.style.setProperty("display",other===target?"flex":"none","important")}
  const area=document.getElementById("image-prompt");area.value="а".repeat(1350);area.dispatchEvent(new Event("input",{bubbles:true}));
 });
 const state=await page.evaluate(()=>({counter:document.getElementById("plux3184-prompt-count")?.textContent,
  disabled:document.getElementById("create-art-button")?.disabled,
  shorten:!document.querySelector(".plux3184-prompt-shorten")?.hidden}));
 console.log("PLUX3184_COUNTER "+JSON.stringify(state));
 assert.equal(state.counter,"1350 / 1300");assert.equal(state.disabled,true);assert.equal(state.shorten,true);
 await page.locator(".plux3184-prompt-shorten").click({force:true});
 const shorten=await page.evaluate(()=>({length:document.getElementById("image-prompt")?.value.length,
  count:document.getElementById("plux3184-prompt-count")?.textContent,disabled:document.getElementById("create-art-button")?.disabled}));
 console.log("PLUX3184_SHORTEN "+JSON.stringify(shorten));
 assert.equal(shorten.length,1300);assert.equal(shorten.count,"1300 / 1300");assert.equal(shorten.disabled,false);
 console.log("PLUX3184_PASS header symmetry, prompt length limits, explicit shortening and AI-only logo");
 console.log("PLUX3184_PAGE_ERRORS "+JSON.stringify(errors.slice(0,8)));
 assert.equal(errors.length,0);
}finally{await browser.close()}
