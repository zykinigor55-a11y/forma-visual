import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";

const artifacts="e2e-artifacts";
const base="http://127.0.0.1:4173";
const server=spawn("npm",["run","preview","--","--host","127.0.0.1","--port","4173","--strictPort"],{stdio:"inherit",detached:false});
let browser;
const pause=(n)=>new Promise(resolve=>setTimeout(resolve,n));
try{
 let up=false;
 for(let i=0;i<65;i++){
  try{const result=await fetch(base);if(result.ok){up=true;break}}catch{}
  await pause(350);
 }
 assert.ok(up,"Vite preview failed to start");
 await mkdir(artifacts,{recursive:true});
 browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--enable-unsafe-swiftshader","--disable-dev-shm-usage","--no-sandbox"]});
 const page=await browser.newPage({viewport:{width:1536,height:930},deviceScaleFactor:1});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.goto(base+"/?view=studio",{waitUntil:"networkidle",timeout:45000});
 await page.locator("canvas").first().waitFor({state:"visible",timeout:25000});
 await page.locator(".cad-explorer").getByText("SCENE EXPLORER").waitFor({timeout:15000});
 await page.locator(".camera-chooser button").nth(1).click();
 await page.locator(".cad-tray .finish-card").nth(1).click();
 await page.screenshot({path:artifacts+"/studio-desktop.png",fullPage:true});
 const dimension=await page.locator(".field-row input").first().inputValue();
 assert.ok(Number(dimension)>1000,"Studio dimension inputs are in millimeters");
 await page.locator(".global-switch button").nth(1).click();
 await page.locator(".home-heading h1").waitFor({state:"visible",timeout:15000});
 await page.locator(".home-zone-picker button").nth(1).click();
 await page.locator(".home-palette .finish-card").nth(4).click();
 await page.locator(".home-primary").click();
 assert.equal(await page.locator(".variant-card").count(),1,"Home can save a variant");
 await page.screenshot({path:artifacts+"/home-desktop.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:artifacts+"/home-mobile.png",fullPage:true});
 await page.locator(".global-switch button").first().click();
 await page.locator(".cad-viewport canvas").waitFor({state:"visible",timeout:15000});
 await page.screenshot({path:artifacts+"/studio-mobile.png",fullPage:true});
 assert.equal(errors.length,0,"Browser application errors: "+errors.join("; "));
 console.log("PASS studio desktop + home desktop + responsive mobile; screenshots saved.");
} finally {
 await browser?.close();
 server.kill("SIGTERM");
}
