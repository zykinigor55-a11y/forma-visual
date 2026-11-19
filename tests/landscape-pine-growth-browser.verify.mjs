import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const key='forma-landscape-masterplan-v1-landscape',errors=[];
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1365,height:900},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(key=>{
  if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify({
   version:1,title:'Проверка сосны',site:{width:30,height:40},
   house:{x:15,y:15,width:10,height:7,rotation:0,type:'house',roof:'gable'},
   objects:[
    {id:'qa-pine-a',catalogId:'pine',type:'trees',x:20,y:29,height:14,diameter:7,rotation:0,variant:1},
    {id:'qa-pine-b',catalogId:'pine',type:'trees',x:4,y:30,height:9,diameter:4.5,rotation:0,variant:1}
   ],buildings:[],atmosphere:{time:'day',season:'summer',weather:'sunny'}
  }));
 },key);
 async function selectPine(){
  if((await page.viewportSize()).width<=850)await page.locator('[data-mobile-panel="tools"]').click();
  await page.locator('[data-quick-tool="select"]').click();
  await page.locator('[data-select-pine="qa-pine-a"]').click();
  await page.locator('#pineGrow-branchDensity').waitFor({state:'attached',timeout:15000});
 }
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await selectPine();
 assert.equal(await page.locator('#pineGrow-branchDensity').inputValue(),'75');
 await page.locator('#focusSelected').click();
 await page.screenshot({path:'artifacts/landscape-editor/pine-growth-before.png',timeout:7000}).catch(()=>{});
 const change=async(id,value)=>page.locator(id).evaluate((el,v)=>{
  el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
 },value);
 await change('#pineGrow-branchDensity',175);
 await change('#pineGrow-needleDensity',225);
 await change('#pineGrow-crownBase',30);
 await page.waitForFunction(key=>{
  const d=JSON.parse(localStorage.getItem(key)||'{}');
  const p=d.objects?.find(o=>o.id==='qa-pine-a')?.pine;
  return p?.branchDensity===175&&p?.needleDensity===225&&p?.crownBase===30;
 },key,{timeout:20000});
 await page.screenshot({path:'artifacts/landscape-editor/pine-growth-dense.png',timeout:7000}).catch(()=>{});
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 const a=saved.objects.find(o=>o.id==='qa-pine-a'),b=saved.objects.find(o=>o.id==='qa-pine-b');
 assert.equal(a.height,14);assert.equal(a.diameter,7);assert.equal(a.x,20);assert.equal(a.y,29);
 assert.equal(b.pine.branchDensity,75);assert.equal(b.pine.needleDensity,110);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await selectPine();
 assert.equal(await page.locator('#pineGrow-branchDensity').inputValue(),'175');
 assert.equal(await page.locator('#pineGrow-needleDensity').inputValue(),'225');
 await page.setViewportSize({width:430,height:900});
 await selectPine();
 assert.equal(await page.locator('body').getAttribute('data-mobile-panel'),'details');
 assert.ok(await page.locator('#pineGrow-branchDensity').isVisible());
 await page.screenshot({path:'artifacts/landscape-editor/pine-growth-mobile-panel.png',timeout:7000}).catch(()=>{});
 assert.deepEqual(errors,[]);
 console.log('FORMA PINE GROWTH QA PASSED',JSON.stringify(a.pine));
}finally{await browser.close()}
