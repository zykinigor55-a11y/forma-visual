import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const ctx=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#formaProjectPanel').waitFor({state:'visible',timeout:10000});
 assert.equal(await page.locator('.fa-home-tool').count(),16,'All tools should be visible');
 assert.equal(await page.locator('.fa-home-tool.selected').getAttribute('data-tool-id'),'upscale');
 assert.equal(await page.locator('#faProUpscaleUpload').count(),1);

 // Work with an uploaded local image, not API, proving the embedded upscale is interactive.
 await page.locator('#faProUpscaleUpload').setInputFiles('assets/residence-render-bluehour-fixed.webp');
 await page.locator('#faProUpscalePreview').waitFor({state:'visible'});
 assert.match(await page.locator('#faProUpscaleInfo').textContent(),/residence-render-bluehour-fixed/);
 const original=await page.locator('#faProUpscalePreview').evaluate(img=>({src:img.src.slice(0,80),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
 console.log('Upscale source',JSON.stringify(original));
 const result=page.waitForEvent('download',{timeout:12000});
 await page.locator('#faProjectToolContent [data-fa-pro="resize4k"]').click();
 let downloaded;
 try{downloaded=await result}
 catch(err){
  const diag=await page.evaluate(()=>({status:document.querySelector('#faProjectStatus')?.textContent,script:!!window.FORMA_PRO,img:document.querySelector('#faProUpscalePreview')?.naturalWidth}));
  console.error('Upscale diagnostic',JSON.stringify(diag),'pageErrors',JSON.stringify(errors));
  throw err;
 }
 assert.match(downloaded.suggestedFilename(),/forma-4k-\d+x\d+\.png/);

 // Switching tools must replace their inline settings, not open a modal.
 await page.locator('[data-tool-id="camera"]').click();
 await page.locator('#faProCamera').selectOption({label:'Canon EOS R5'});
 await page.locator('#faProNotes').fill('Фасад, ракурс с дорожки');
 await page.locator('#faProjectToolContent [data-fa-pro="saveShot"]').click();
 assert.match(await page.locator('.fa-pro-shotlist').textContent(),/Фасад, ракурс с дорожки/);
 assert.equal(await page.locator('#faProBackdrop').count(),0);

 await page.locator('[data-tool-id="preview"]').click();
 await page.locator('[data-fa-color="brightness"]').evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.match(await page.locator('#faProValue-brightness').textContent(),/120/);
 await page.locator('[data-filter="edit"]').click();
 assert.equal(await page.locator('.fa-home-tool:not([hidden])').count(),4);
 await page.locator('[data-filter="all"]').click();
 assert.equal(await page.locator('.fa-home-tool:not([hidden])').count(),16);

 await page.locator('[data-tool-id="image3d"]').click();
 assert.match(await page.locator('#faProjectToolContent').textContent(),/отдельной 3D-модели/);
 await page.locator('[data-tool-id="upscale"]').click();
 assert.equal(await page.locator('#faProUpscaleUpload').count(),1);
 assert.deepEqual(errors,[],'No JavaScript runtime errors during tool usage');

 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const mp=await mobile.newPage();await mp.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded'});
 await mp.locator('#formaProjectPanel').waitFor({state:'visible'});
 const dim=await mp.locator('#formaProjectPanel').evaluate(el=>({sw:el.scrollWidth,cw:el.clientWidth}));
 assert.ok(dim.sw<=dim.cw+2,'Project tools must fit inside mobile viewport: '+JSON.stringify(dim));
 assert.equal(await mp.locator('.fa-home-tool').count(),16);
 await mobile.close();
 await ctx.close();
 console.log('Project panel verified: all 16 tools, inline config, local 4K download, camera, filters, mobile.');
}finally{await browser.close()}
