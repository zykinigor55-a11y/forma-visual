import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const server='http://127.0.0.1:3000';
const key='forma-landscape-masterplan-v1-landscape';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(key=>{
  localStorage.setItem(key,JSON.stringify({
   version:1,title:'Desktop pine click regression',
   site:{width:30,height:40},house:{x:15,y:15,width:10,height:7,rotation:0,type:'house',roof:'gable'},
   objects:[
    {id:'pine-desktop-a',catalogId:'pine',type:'trees',x:20,y:29,height:14,diameter:7,variant:1,rotation:0},
    {id:'pine-desktop-b',catalogId:'pine',type:'trees',x:4,y:31,height:9,diameter:4.5,variant:1,rotation:0}
   ],buildings:[],atmosphere:{time:'day',season:'summer',weather:'sunny'}
  }));
 },key);
 await page.goto(server+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await page.locator('[data-quick-tool="select"]').click();
 await page.locator('[data-select-pine="pine-desktop-a"]').click();
 await page.locator('#focusSelected').click();
 await page.locator('#selectMainHouse').click();
 assert.equal(await page.locator('#pineAge').count(),0,'house selection clears pine editor');

 const box=await page.locator('#viewport').boundingBox();
 const x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.click(x,y,{button:'left'});
 await page.locator('#pineAge').waitFor({state:'attached',timeout:20000});
 assert.equal(await page.locator('#pineHeight').inputValue(),'14','desktop click selects first pine');
 assert.equal(await page.locator('#pineInspectorShortcut').isVisible(),true,'pine inspector shortcut displayed');
 const visibility=await page.evaluate(()=>{
  const parent=document.querySelector('#right').getBoundingClientRect();
  const props=document.querySelector('#properties').getBoundingClientRect();
  const age=document.querySelector('#pineAge').getBoundingClientRect();
  return {scrollTop:document.querySelector('#right').scrollTop,
    ageTop:age.top,ageBottom:age.bottom,rightTop:parent.top,rightBottom:parent.bottom,
    propsTop:props.top};
 });
 assert.ok(visibility.scrollTop>100,'desktop right panel must scroll to the pine controls: '+JSON.stringify(visibility));
 assert.ok(visibility.ageTop>=visibility.rightTop && visibility.ageBottom<=visibility.rightBottom,
   'age setting actually visible inside the desktop panel: '+JSON.stringify(visibility));
 await page.screenshot({path:'artifacts/landscape-editor/pine-desktop-click-settings.png',timeout:12000});
 // Change the SAME tree, not an extra pine.
 await page.locator('#pineAge').fill('75');
 await page.locator('#pineAge').dispatchEvent('change');
 await page.waitForFunction(key=>
  JSON.parse(localStorage.getItem(key)||'{}').objects?.find(o=>o.id==='pine-desktop-a')?.pine?.age===75,
 key,{timeout:15000});
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.equal(saved.objects.length,2,'updating age does not plant duplicates');
 assert.equal(saved.objects.find(o=>o.id==='pine-desktop-b').height,9);

 // Clicking the tree while the planting palette is selected must switch
 // to editing instead of stamping another pine.
 await page.locator('#selectMainHouse').click();
 await page.locator('[data-quick-tool="plant"]').click();
 await page.locator('[data-item="pine"]').click();
 await page.mouse.click(x,y,{button:'left'});
 await page.locator('#pineAge').waitFor({state:'attached',timeout:20000});
 assert.equal(await page.locator('#pineAge').inputValue(),'75');
 assert.equal(await page.locator('[data-quick-tool="select"]').getAttribute('aria-pressed'),'true');
 const count=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).objects.length,key);
 assert.equal(count,2,'clicking existing pine in planting mode must not create a third tree');
 await page.screenshot({path:'artifacts/landscape-editor/pine-desktop-from-plant-palette.png',timeout:12000});
 assert.deepEqual(errors,[],'no JavaScript errors during desktop pine selection');
 console.log('FORMA DESKTOP PINE CLICK AND INSPECTOR PASS',JSON.stringify(visibility));
}finally{await browser.close()}
