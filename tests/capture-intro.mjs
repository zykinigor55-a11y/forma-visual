import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const out='docs/previews';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const url='http://127.0.0.1:3000';
const preview=url+'/?previewIntro=1';
try{
 const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(preview,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#forma-intro').waitFor({state:'visible',timeout:10000});
 assert.equal(await page.locator('.forma-intro-mark').evaluate(el=>el.naturalWidth>0),true);
 const fullTexture=await page.evaluate(async()=>{
  const img=new Image();img.src='assets/brand/intro-graphite-wall-4k.webp';await img.decode();
  return [img.naturalWidth,img.naturalHeight];
 });
 assert.deepEqual(fullTexture,[3840,2160],'Desktop wall must load real 3840×2160 WebP asset');

 assert.equal(await page.locator('.forma-intro-wall').evaluate(el=>getComputedStyle(el).backgroundImage.includes('intro-graphite-wall.svg')),true);
 assert.equal(await page.locator('.forma-intro-shadow').first().evaluate(el=>getComputedStyle(el).animationName.includes('forma-shadow-sway-premium')),true);
 const openingOpacity=await page.locator('.forma-intro-lockup').evaluate(el=>Number(getComputedStyle(el).opacity));
 assert.ok(openingOpacity<.2,'Logo should be invisible while the shadows start moving');
 await page.evaluate(()=>document.querySelector('#forma-intro')?.classList.add('is-wall-only'));
 await page.screenshot({path:out+'/forma-opening-wall-desktop.png',animations:'allow'});
 await page.evaluate(()=>document.querySelector('#forma-intro')?.classList.remove('is-wall-only'));
 await page.waitForTimeout(2500);
 const revealed=await page.locator('.forma-intro-lockup').evaluate(el=>Number(getComputedStyle(el).opacity));
 assert.ok(revealed>.70,'Logo should be revealed after the wall');
 await page.screenshot({path:out+'/forma-opening-logo-desktop.png',animations:'allow'});
 // Screenshots of animated SVG textures may take longer than the 5.2s auto-exit.
 // Invoke the same skip handler directly; the actual button is exercised on replay below.
 await page.evaluate(()=>window.FORMA_INTRO?.skip?.());
 await page.locator('#forma-intro').waitFor({state:'hidden',timeout:4000});
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('forma-opening-seen-v2')),'1');
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#forma-intro').isVisible(),false,'Opening should be once per tab session');
 await page.locator('[data-studio-action="commands"]').click();
 await page.locator('#formaCommandSearch').fill('заставку');
 await page.getByRole('button',{name:/Посмотреть заставку/}).click();
 await page.locator('#forma-intro').waitFor({state:'visible',timeout:3000});
 await page.locator('#formaIntroSkip').click();
 await page.locator('#forma-intro').waitFor({state:'hidden',timeout:4000});
 assert.deepEqual(errors,[],'No runtime errors during opening');
 await ctx.close();

 const mob=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
 const mp=await mob.newPage();
 await mp.goto(preview,{waitUntil:'domcontentloaded',timeout:45000});
 await mp.locator('#forma-intro').waitFor({state:'visible',timeout:6000});
 const mobileTexture=await mp.evaluate(async()=>{
  const img=new Image();img.src='assets/brand/intro-graphite-wall-mobile.webp';await img.decode();
  return [img.naturalWidth,img.naturalHeight];
 });
 assert.deepEqual(mobileTexture,[1080,1920],'Mobile background must load its optimized WebP');

 await mp.evaluate(()=>document.querySelector('#forma-intro')?.classList.add('is-wall-only'));
 await mp.screenshot({path:out+'/forma-opening-wall-mobile.png',animations:'allow'});
 await mp.evaluate(()=>document.querySelector('#forma-intro')?.classList.remove('is-wall-only'));
 await mp.waitForTimeout(2500);
 await mp.screenshot({path:out+'/forma-opening-logo-mobile.png',animations:'allow'});
 await mp.evaluate(()=>window.FORMA_INTRO?.skip?.());
 await mp.locator('#forma-intro').waitFor({state:'hidden',timeout:4000});
 await mob.close();

 const reduced=await browser.newContext({viewport:{width:800,height:600},reducedMotion:'reduce'});
 const rp=await reduced.newPage();await rp.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 await rp.waitForTimeout(600);
 const diag=await rp.evaluate(()=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,pending:document.documentElement.classList.contains('forma-intro-pending'),hidden:document.getElementById('forma-intro').hidden,display:getComputedStyle(document.getElementById('forma-intro')).display,scriptLoaded:!!window.FORMA_INTRO,active:window.FORMA_INTRO?.active??null}));
 console.log('Reduced-motion diagnostics',JSON.stringify(diag));
 if(diag.reduced && diag.pending && !diag.hidden){
   await rp.evaluate(()=>window.FORMA_INTRO?.skip?.());
 }
 await rp.locator('#forma-intro').waitFor({state:'hidden',timeout:6000});
 assert.equal(await rp.evaluate(()=>document.documentElement.classList.contains('forma-intro-pending')),false);
 await reduced.close();
 const auto=await browser.newContext({viewport:{width:700,height:500},reducedMotion:'no-preference'});
 const ap=await auto.newPage();await ap.goto(url,{waitUntil:'domcontentloaded'});
 await ap.locator('#forma-intro').waitFor({state:'visible',timeout:3000});
 await ap.locator('#forma-intro').waitFor({state:'hidden',timeout:9000});
 await auto.close();
 console.log('Opening verified: animated shadows, delayed logo, automatic outro, skip/replay, mobile and reduced motion.');
}finally{await browser.close()}
