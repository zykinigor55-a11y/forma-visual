import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin='http://127.0.0.1:3000';
const output='docs/previews';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const context=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.forma-hero').waitFor({state:'visible',timeout:15000});
 await page.locator('.forma-rail-brand').waitFor({state:'visible',timeout:15000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForTimeout(1700);
 assert.match(await page.title(),/FORMA ARCHVIZ/);
 assert.equal(await page.locator('.forma-hero').count(),1);
 assert.equal(await page.locator('.forma-hero-emblem img').evaluate(el=>el.naturalWidth>0),true);
 await page.screenshot({path:output+'/forma-archviz-home-desktop.png',fullPage:false,animations:'disabled'});
 await page.screenshot({path:output+'/forma-archviz-home-full.png',fullPage:true,animations:'disabled'});
 const nodes=page.locator('.fa-flow-launch');
 await nodes.click();
 await page.locator('#faFlowBackdrop').waitFor({state:'visible'});
 assert.ok(await page.locator('.fa-node').count()>0);
 await page.locator('#faFlowClose').click();
 const pro=page.locator('.fa-pro-launch');await pro.click();
 await page.locator('#faProBackdrop').waitFor({state:'visible'});
 await page.locator('#faProClose').click();
 const interior=page.locator('[data-studio-action="interior"]');
 await interior.click();
 await page.locator('#faInteriorPanel').waitFor({state:'visible',timeout:9000});
 await page.locator('[data-fa-space="exterior"]').click();
 console.log('Interior hero action is working');
 console.log('Desktop capture complete; '+errors.length+' page errors. '+errors.slice(0,4).join(' | '));
 await context.close();

 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const mp=await mobile.newPage();
 await mp.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});
 await mp.locator('.forma-hero').waitFor({state:'visible'});
 await mp.evaluate(()=>document.fonts.ready);
 await mp.waitForTimeout(1500);
 await mp.screenshot({path:output+'/forma-archviz-home-mobile.png',fullPage:false,animations:'disabled'});
 console.log('Mobile capture complete');
 await mobile.close();
} finally {await browser.close();}
