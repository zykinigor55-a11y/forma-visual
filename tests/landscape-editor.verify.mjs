import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:412,height:915}:{width:1600,height:1000},hasTouch:mobile,isMobile:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000');
  await page.waitForFunction(()=>window.FORMA_LANDSCAPE_PROJECT);
  await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.open());
  await page.locator('#lpSvg').waitFor();
  const pos=async(x,y)=>page.evaluate(({x,y})=>{const s=document.querySelector('#lpSvg'),p=s.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y}},{x,y});
  const tap=async(x,y)=>{const p=await pos(x,y);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y)};
  const model=()=>page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('forma-landscape-masterplan-v1-')))));
  await page.locator('[data-tool="path"]').click();
  await page.locator('[data-path-shape="diagonal"]').click();
  assert.equal(await page.locator('[data-path-shape="diagonal"]').getAttribute('aria-pressed'),'true');
  await tap(5,26);await tap(13,33);await page.locator('#lpFinish').click();
  let doc=await model();assert.equal(doc.objects.length,1);
  const [a,b]=doc.objects[0].points;assert.ok(Math.abs((b.x-a.x)-(b.y-a.y))<1e-6);
  await page.locator('button[data-delete]').first().click();assert.equal((await model()).objects.length,0);
  await page.locator('[data-quick-category="trees"]').click();await page.locator('[data-asset="pine"]').click();
  await tap(6,28);assert.equal(await page.locator('[data-tool="select"]').getAttribute('class'),'active');
  // Mouse drag exercises the same pointer handlers as touch drag; tap placement above uses actual touch on mobile.
  const start=await pos(6,28),end=await pos(9,31);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:6});await page.mouse.up();
  doc=await model();assert.ok(Math.abs(doc.objects[0].x-9)<.1);assert.ok(Math.abs(doc.objects[0].y-31)<.1);
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}.png`,fullPage:true});
  await page.keyboard.press('Delete');assert.equal((await model()).objects.length,0);
  await page.keyboard.press('Control+z');assert.equal((await model()).objects.length,1);
  assert.deepEqual(errors,[]);console.log(mobile?'Mobile PASS':'Desktop PASS');await page.close();
 }
}finally{await browser.close()}
