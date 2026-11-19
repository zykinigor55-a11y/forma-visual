import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const folder='artifacts/landscape-editor/poplar-original-tevy';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const preview=await browser.newPage({viewport:{width:1120,height:870},deviceScaleFactor:1});
 const errors=[];preview.on('pageerror',e=>errors.push(String(e)));
 await preview.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=poplar',
  {waitUntil:'domcontentloaded',timeout:65000});
 await preview.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),null,{timeout:90000});
 const state=await preview.evaluate(()=>({details:window.__treeDetails,error:window.__treeError||null}));
 assert.equal(state.error,null,'source GLB should decode Meshopt geometry + KTX2 textures');
 assert.equal(state.details.name,'poplar');
 assert.ok(Math.abs(state.details.height-25)<.06);
 assert.ok(Math.abs(state.details.diameter-6)<.06);
 assert.ok(state.details.meshes>0);
 assert.ok(state.details.materials>0);
 assert.ok(state.details.textures>0,'LOD0 must have genuine textured material');
 for(const [name,yaw] of [['front',0],['three-quarter',.75],['rear',3.14]]){
  await preview.evaluate(a=>window.__treeView(a,.12),yaw);
  await preview.screenshot({path:folder+'/poplar-'+name+'.png'});
 }
 await preview.evaluate(()=>window.__oakBarkView(.42));
 await preview.screenshot({path:folder+'/poplar-bark-close.png'});
 await preview.setViewportSize({width:430,height:900});
 await preview.evaluate(()=>window.__treeView(.75,.09));
 await preview.screenshot({path:folder+'/poplar-preview-mobile.png'});
 assert.deepEqual(errors,[]);
 const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const mobileErrors=[];page.on('pageerror',e=>mobileErrors.push(String(e)));
 await page.addInitScript(model=>{
  localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(model));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
 },{title:'European poplar QA',site:{width:45,height:40},
   house:{x:22,y:22,width:8,height:9},
   objects:[{id:'qa-poplar',type:'trees',catalogId:'poplar',x:16,y:19,height:20,diameter:14,rotation:0}],
   atmosphere:{season:'summer',time:'day',weather:'sunny'}});
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',
  {waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await page.waitForFunction(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS?.().some(x=>x.species==='poplar'&&x.status==='glb'),
  null,{timeout:90000});
 const details=await page.evaluate(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS().find(x=>x.species==='poplar'));
 assert.equal(details.status,'glb');
 assert.equal(details.height,25);assert.equal(details.diameter,6);
 await page.screenshot({path:folder+'/poplar-editor-android.png'});
 assert.deepEqual(mobileErrors,[]);
 await writeFile(folder+'/qa.json',JSON.stringify({preview:state.details,editor:details},null,2));
 console.log('PASS: native poplar LOD0 in WebGL, real 3D editor Android, canopy, bark, 5 screenshots');
}finally{await browser.close()}
