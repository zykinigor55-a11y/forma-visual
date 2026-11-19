import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({
 viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true
});
const page=await context.newPage();
const key='forma-landscape-masterplan-v1-landscape';
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
try{
 await page.addInitScript(key=>{
  if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify({
   version:1,title:'Мобильный выбор сосны',site:{width:30,height:40},
   house:{x:15,y:15,width:10,height:7,rotation:0,type:'house',roof:'gable'},
   objects:[
    {id:'mobile-pine-a',catalogId:'pine',type:'trees',x:15,y:27,height:14,diameter:7,variant:1,rotation:0},
    {id:'mobile-pine-b',catalogId:'pine',type:'trees',x:4,y:31,height:9,diameter:4.5,variant:1,rotation:0}
   ],atmosphere:{time:'day',season:'summer',weather:'sunny'}
  }));
 },key);
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 // Mobile emergency picker works even without tapping transparent needles.
 await page.locator('#mobilePineSelect').tap({timeout:15000});
 assert.equal(await page.locator('body').getAttribute('data-mobile-panel'),'details');
 assert.equal(await page.locator('body').getAttribute('data-mobile-pine'),'true');
 assert.equal(await page.locator('#pineGrow-needleDensity').count(),1);
 assert.equal(await page.locator('#pineGrow-branchDensity').inputValue(),'75');
 assert.equal(await page.locator('#pineScaleHeight').inputValue(),'14');
 // The toolbar selects the next planted pine; no new tree is created.
 await page.locator('#mobilePineSelect').tap({timeout:15000});
 assert.equal(await page.locator('#pineScaleHeight').inputValue(),'9');
 await page.locator('#mobilePineSelect').tap({timeout:15000});
 assert.equal(await page.locator('#pineScaleHeight').inputValue(),'14');
 // Change sliders and ensure the first tree persists its independent settings.
 await page.locator('#pineGrow-needleDensity').evaluate(el=>{
  el.value='220';el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForFunction(key=>{
  const raw=JSON.parse(localStorage.getItem(key)||'{}');
  return raw.objects?.find(o=>o.id==='mobile-pine-a')?.pine?.needleDensity===220;
 },key,{timeout:15000});
 const data=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.equal(data.objects.length,2);
 assert.equal(data.objects[0].height,14);
 assert.equal(data.objects[0].pine.needleDensity,220);
 assert.equal(data.objects[1].pine.needleDensity,110);
 // Switch to plan, tap the location of an existing pine with real touch input.
 await page.locator('[data-view="2d"]').tap({timeout:15000});
 await page.locator('[data-mobile-panel="scene"]').tap({timeout:15000});
 const canvas=await page.locator('#viewport').boundingBox();
 const half=40*.73,aspect=canvas.width/canvas.height;
 const sx=canvas.x+canvas.width*.5;
 const sy=canvas.y+canvas.height*(.5+7/(2*half));
 await page.touchscreen.tap(sx,sy);
 await page.waitForFunction(()=>document.body.dataset.mobilePanel==='details',null,{timeout:15000});
 assert.equal(await page.locator('#pineScaleHeight').inputValue(),'14');
 assert.equal(await page.locator('#pineGrow-needleDensity').inputValue(),'220');
 assert.ok((await page.locator('#right').evaluate(el=>el.scrollTop))>0,
  'the mobile inspector should automatically scroll to editable properties');
 assert.deepEqual(errors,[]);
 console.log('MOBILE PINE TOUCH + PICKER + EDIT PASS');
}finally{
 await browser.close();
}
