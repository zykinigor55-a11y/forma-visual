import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const out='artifacts/landscape-editor/trees-realism';
await mkdir(out,{recursive:true});
const key='forma-landscape-masterplan-v1-landscape';
const base={
 title:'Dense PBR tree scene QA',site:{width:50,height:40},
 house:{x:25,y:20,width:10,height:7,type:'house',roof:'gable'},
 objects:[
  {id:'spruce-1',catalogId:'spruce',type:'trees',x:12,y:16,height:16,diameter:9,spruce:{type:'ordinary'},rotation:0},
  {id:'spruce-2',catalogId:'spruce',type:'trees',x:32,y:16,height:7,diameter:3.1,spruce:{type:'young'},rotation:12},
  {id:'pine-1',catalogId:'pine',type:'trees',x:41,y:26,height:14,diameter:7,pine:{age:45,pineType:'solitary'},rotation:0}
 ],atmosphere:{season:'summer',time:'day',weather:'sunny'}
};
async function ready(page,species){
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:120000});
 await page.waitForFunction(names=>{
  const stats=window.FORMA_TREE_MODEL_DIAGNOSTICS?.()||[];
  return names.every(name=>stats.filter(t=>t.species===name).every(t=>t.status==='glb')&&stats.some(t=>t.species===name));
 },species,{timeout:120000});
 return page.evaluate(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS());
}
try{
 const ctx=await browser.newContext({viewport:{width:430,height:870},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,source})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(source));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
  localStorage.setItem('forma-prefer-real-glb-trees-v2','1');
 },{key,source:base});
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:45000});
 const before=await ready(page,['spruce','pine']);
 assert.equal(before.filter(x=>x.species==='spruce').length,2);
 assert.ok(before.every(x=>x.status==='glb'),'baseline trees must be authentic GLBs');
 assert.ok(before.every(x=>x.foliageMeshes>=1),'original PBR alpha foliage must be visible');
 // Add a new birch and a shrub to reproduce the user's real mobile regression:
 // 5 planted objects trigger preview adaptation. All existing spruces must
 // keep their same high-detail Tevy model, location, height and spruce type.
 await page.evaluate((key,base)=>{
  const doc=JSON.parse(localStorage.getItem(key));
  doc.objects.push(
   {id:'birch-1',catalogId:'birch',type:'trees',x:21,y:30,height:14,diameter:7,rotation:0},
   {id:'shrub-1',catalogId:'spirea',type:'shrubs',x:36,y:28,height:.85,diameter:1.2,rotation:0}
  );
  localStorage.setItem(key,JSON.stringify(doc));
 },key,base);
 await page.reload({waitUntil:'domcontentloaded',timeout:45000});
 const after=await ready(page,['spruce','pine','birch']);
 assert.equal(after.filter(x=>x.species==='spruce'&&x.status==='glb').length,2);
 assert.equal(after.filter(x=>x.species==='birch'&&x.status==='glb').length,1);
 assert.ok(after.filter(x=>x.species==='spruce'||x.species==='birch').every(x=>x.foliageMaterials>=1));
 const all=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.equal(all.objects.length,5);
 assert.equal(all.objects[0].height,16);assert.equal(all.objects[1].height,7);
 assert.equal(all.objects[0].x,12);assert.equal(all.objects[3].x,21);
 await page.screenshot({path:out+'/android-after-birch.png',timeout:14000}).catch(()=>{});
 assert.deepEqual(errors,[],'no uncaught WebGL or UI exceptions');
 console.log('PBR QUALITY SURVIVED BIRCH ADDITION',JSON.stringify(after));

 // A broken new GLB must NOT show the obsolete spruce; report an error
 // rather than disguising bad branches as an automatic "optimized" tree.
 const broken=await browser.newContext({viewport:{width:430,height:850},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await broken.route('**/assets/landscape-models/spruce-tevy-cc0.glb',route=>route.abort('failed'));
 const failPage=await broken.newPage();
 await failPage.addInitScript(({key,source})=>{
  localStorage.setItem(key,JSON.stringify({...source,objects:[source.objects[0]]}));
  localStorage.setItem('forma-botanical-code3d-source-v1','glb');
  localStorage.setItem('forma-prefer-real-glb-trees-v2','1');
 },{key,source:base});
 await failPage.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:45000});
 await failPage.waitForFunction(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS?.().some(s=>s.species==='spruce'&&s.status==='glb-error'),null,{timeout:65000});
 const failed=await failPage.evaluate(()=>window.FORMA_TREE_MODEL_DIAGNOSTICS());
 assert.equal(failed[0].status,'glb-error');
 assert.ok((await failPage.locator('#modelHealth').innerText()).includes('Повторить загрузку'));
 console.log('BROKEN GLB IS REPORTED, NOT SUBSTITUTED',JSON.stringify(failed));
 await broken.close();
}finally{await browser.close()}
