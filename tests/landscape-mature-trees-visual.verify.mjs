import {strict as assert} from 'node:assert';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const folder='artifacts/landscape-editor/mature-cc0-trees';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:820},deviceScaleFactor:1});
 const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error)));
 for(const species of ['birch','spruce','oak']){
  await page.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species='+species,
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),{timeout:90000});
  const result=await page.evaluate(()=>({error:window.__treeError||null,details:window.__treeDetails||null}));
  assert.equal(result.error,null,species+' WebGL loader');
  assert.ok(result.details.meshes>1,species+' should have real multi-part 3D geometry');
  assert.ok(result.details.materials>0,species+' should have PBR materials');
  assert.ok(result.details.textures>0||species==='oak',species+' should have embedded textures');
  assert.ok(result.details.height>8,species+' physical tree height');
  for(const [angle,yaw] of [['front',0],['three-quarter',Math.PI/4],['rear',Math.PI]]){
   await page.evaluate(yaw=>window.__treeView(yaw,.15),yaw);
   await page.screenshot({path:folder+'/'+species+'-'+angle+'.png'});
  }
  await page.setViewportSize({width:430,height:760});
  await page.evaluate(()=>window.__treeView(.65,.12));
  await page.screenshot({path:folder+'/'+species+'-mobile.png'});
  await page.setViewportSize({width:1024,height:820});
  console.log('Verified adult tree',JSON.stringify(result.details));
 }
 assert.deepEqual(pageErrors,[],'No browser JavaScript errors');
}finally{await browser.close()}
