import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='artifacts/landscape-editor/spruce-phone';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(String(error)));
 const key='forma-landscape-masterplan-v1-landscape';
 const document={
  title:'Spruce mobile 3 ages & birch real GLB QA',
  site:{width:55,height:45},house:{x:26,y:23,width:9,height:8},
  objects:[
   {id:'test-young-spruce',catalogId:'spruce',type:'trees',x:9,y:14,height:5,diameter:2.7,spruce:{type:'young',age:12},rotation:0},
   {id:'test-ordinary-spruce',catalogId:'spruce',type:'trees',x:20,y:14,height:16,diameter:9,spruce:{type:'ordinary',age:48},rotation:0},
   {id:'test-century-spruce',catalogId:'spruce',type:'trees',x:39,y:14,height:28,diameter:13.5,spruce:{type:'century',age:115},rotation:0},
   {id:'test-birch',catalogId:'birch',type:'trees',x:27,y:34,height:15,diameter:7.6,rotation:0}
  ],
  atmosphere:{season:'summer',time:'day',weather:'sunny'}
 };
 await page.addInitScript(({key,document})=>{
  localStorage.setItem(key,JSON.stringify(document));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
  localStorage.setItem('forma-prefer-real-glb-trees-v2','1');
 },{key,document});
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:85000});
 await page.waitForFunction(()=>{
  return document.querySelector('#modelHealth')?.textContent?.includes('2/2 загружено');
 },null,{timeout:90000});
 assert.equal(await page.locator('#treeSource3d').inputValue(),'glb');
 assert.ok((await page.locator('#modelHealth').innerText()).includes('2/2 загружено'));
 assert.equal(await page.locator('#mobilePineSelect').innerText(),'🌲 Дерево');
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('#spruceType').inputValue(),'young');
 assert.equal(await page.locator('#spruceAge').inputValue(),'12');
 assert.equal(await page.locator('#spruceHeight').inputValue(),'5');
 await page.locator('#spruceType').evaluate(el=>{
  el.value='century';el.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await page.waitForFunction(key=>{
  const state=JSON.parse(localStorage.getItem(key)||'{}');
  const spruce=state.objects?.find(x=>x.id==='test-young-spruce');
  return spruce?.spruce?.type==='century'&&spruce?.height===28&&spruce?.diameter===13.5;
 },key,{timeout:20000});
 // The edit changes one actual GLB instance; no tree count/position changes.
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.equal(saved.objects.length,4);
 assert.equal(saved.objects[0].x,9);
 assert.equal(saved.objects[0].y,14);
 assert.equal(saved.objects[1].spruce.type,'ordinary');
 assert.equal(saved.objects[2].spruce.type,'century');
 assert.equal(saved.objects[3].catalogId,'birch');
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('#spruceType').inputValue(),'ordinary');
 await page.locator('#mobilePineSelect').tap();
 assert.equal(await page.locator('#spruceType').inputValue(),'century');
 await page.locator('[data-mobile-panel="scene"]').tap();
 await page.screenshot({path:dir+'/spruce-three-types-with-birch-mobile.png',timeout:10000});
 const bg=await page.locator('#mobileWorkspaceTabs').evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.notEqual(bg,'rgb(24, 35, 34)','green-styled old toolbar must be replaced');
 assert.deepEqual(pageErrors,[]);
 console.log('PASS: 3 SPRUCE STAGES, REAL SPRUCE+BIRCH GLBs, ONE-TREE EDIT, MOBILE GRAPHITE, '+bg);
}finally{await browser.close()}
