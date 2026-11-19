import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const dir='artifacts/landscape-editor/oak-pbr-compare';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 async function load(candidate){
  await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=oak&candidate='+candidate,
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),null,{timeout:90000});
  const result=await page.evaluate(()=>({error:window.__treeError||null,info:window.__treeDetails||null}));
  assert.equal(result.error,null,'oak GLB must load: '+result.error);
  assert.ok(result.info&&result.info.name==='oak');
  assert.ok(Math.abs(result.info.height-8.6)<.08,'same height for both oak models');
  assert.ok(Math.abs(result.info.diameter-7.8)<.08,'same spread for both oak models');
  return result.info;
 }
 const existing=await load('innerscene');
 assert.ok(existing.meshes>80,'baseline should be the existing detailed native-mesh oak');
 await page.evaluate(()=>window.__treeView(.65,.17));
 await page.screenshot({path:dir+'/oak-original-interscene.png'});
 const improved=await load('terraintale');
 assert.equal(improved.candidate,'terraintale');
 assert.ok(improved.meshes>=1,'new GLB has real geometry');
 assert.ok(improved.textures>=1,'new GLB preserves bark and foliage textures');
 assert.ok(improved.meshes<existing.meshes,'new GLB reduces draw calls');
 for(const [name,yaw] of [['front',0],['diagonal',.65],['back',2.55]]){
  await page.evaluate(a=>window.__treeView(a,.18),yaw);
  await page.screenshot({path:dir+'/oak-textured-'+name+'.png'});
 }
 await page.evaluate(()=>window.__oakBarkView(.60));
 await page.screenshot({path:dir+'/oak-textured-bark-close.png'});
 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>window.__treeView(.65,.18));
 await page.screenshot({path:dir+'/oak-textured-mobile.png'});
 await writeFile(dir+'/metrics.json',JSON.stringify({existing,improved,errors},null,2));
 assert.deepEqual(errors,[]);
 console.log('OAK A/B WEBGL PASS',JSON.stringify({existing,improved}));
}finally{await browser.close()}
