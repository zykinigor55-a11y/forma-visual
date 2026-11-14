import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000';
const tiny='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p/8AAAAASUVORK5CYII=';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 const context=await browser.newContext({viewport:{width:1450,height:900},reducedMotion:'reduce'});
 const page=await context.newPage();
 const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.route('**/api/status',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ready:true,dailyRemaining:25,provider:'TEST MOCK',model:'test-image'})}));
 await page.route('**/api/render',async r=>{
  const p=r.request().postDataJSON();requests.push(p);
  await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({images:[tiny],mimes:['image/png'],model:'MOCK'})});
 });
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#sourceFile').setInputFiles('assets/residence-render-bluehour-fixed.webp');
 await page.waitForFunction(()=>{const x=JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}');return x.activeId && x.activeId!=='demo';},null,{timeout:25000});
 await page.evaluate(()=>window.FORMA_NODES?.open());
 await page.locator('#faFlowBackdrop').waitFor({state:'visible',timeout:9000});
 await page.locator('.fa-flow-node-settings').waitFor({state:'visible',timeout:7000});
 // Select the interior node and configure it. A real request is intercepted with a deterministic mock.
 await page.locator('[data-node="n3"] .fa-node-top').click();
 await page.locator('[data-node-option="room"]').selectOption('kitchen');
 await page.locator('[data-node-option="style"]').selectOption('japandi');
 await page.locator('[data-node="n3"] [data-run-node]').click();
 await page.locator('[data-node="n3"] .fa-run-state[data-state="done"]').waitFor({timeout:30000});
 assert.equal(requests.length,1);
 assert.equal(requests[0].brief.sceneType,'interior');
 assert.equal(requests[0].brief.room,'kitchen');
 assert.equal(requests[0].brief.style,'japandi');
 assert.equal(requests[0].quantity,1);
 assert.equal(requests[0].image.startsWith('data:image/'),true);
 // The material node must refuse to consume a credit without a user instruction.
 await page.locator('[data-node="n5"] [data-run-node]').click();
 await page.waitForTimeout(300);
 assert.equal(requests.length,1,'An unspecified material edit must not call API');
 assert.match(await page.locator('#faFlowStatus').textContent(),/напишите конкретную инструкцию/i);
 await page.locator('[data-node="n5"] .fa-node-top').click();
 await page.locator('[data-node-option="zone"]').selectOption('main');
 await page.locator('[data-node-option="instruction"]').fill('Заменить только отделку существующей стены на светлый травертин. Сохранить геометрию и камеры.');
 await page.locator('[data-node="n5"] [data-run-node]').click();
 await page.locator('[data-node="n5"] .fa-run-state[data-state="done"]').waitFor({timeout:30000});
 assert.equal(requests.length,3,'Source -> interior -> materials must create 2 more AI calls');
 assert.equal(requests[2].brief.sceneType,'interior');
 assert.equal(requests[2].editMode,'text');
 assert.match(requests[2].materialInstruction,/травертин/);
 // Unsupported video must be honestly blocked before any AI call.
 await page.locator('[data-node="n6"] [data-run-node]').click();
 assert.equal(requests.length,3);
 assert.match(await page.locator('#faFlowStatus').textContent(),/требует отдельного движка/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('domrender_mvp_projects_v1')||'{}'));
 assert.ok(saved.projects?.find(x=>x.id===saved.activeId)?.renders?.length>=2,'AI outputs were persisted to the project gallery');
 assert.deepEqual(errors,[], 'No uncaught browser errors');
 console.log('PASS: interior render + material edit (3 mocked API calls), no unsanctioned calls, project gallery persistence.');
 await context.close();

 // The published preview must not accidentally send API calls.
 const previewCtx=await browser.newContext({viewport:{width:1120,height:800},reducedMotion:'reduce'});
 const p=await previewCtx.newPage();let sent=0;
 await p.route('**/api/render',r=>{sent++;return r.abort()});
 await p.goto(base,{waitUntil:'domcontentloaded'});
 await p.evaluate(()=>document.documentElement.classList.add('forma-static-preview'));
 await p.evaluate(()=>window.FORMA_NODES?.open());
 await p.locator('[data-node="n2"] [data-run-node]').click();
 await p.waitForTimeout(150);
 assert.equal(sent,0,'Preview must not call paid AI');
 console.log('PASS: preview invokes zero paid API calls');
 await previewCtx.close();
}finally {await browser.close()}
