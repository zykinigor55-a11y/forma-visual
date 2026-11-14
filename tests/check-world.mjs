import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const screenshots='docs/previews';
await mkdir(screenshots,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:3000/';
function miniGLB(){
 const vertices=new Float32Array([0,0,0,1,0,0,0,1,0]);
 const binary=Buffer.from(vertices.buffer);
 const gltf={asset:{version:'2.0',generator:'FORMA integration test'},scene:0,scenes:[{nodes:[0]}],
  nodes:[{mesh:0,name:'Test triangle'}],
  meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
  buffers:[{byteLength:binary.length}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:binary.length,target:34962}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}]};
 const json=Buffer.from(JSON.stringify(gltf),'utf8');
 const jsonPad=(4-json.length%4)%4;
 const j=Buffer.concat([json,Buffer.alloc(jsonPad,0x20)]);
 const binaryPad=(4-binary.length%4)%4;
 const b=Buffer.concat([binary,Buffer.alloc(binaryPad)]);
 const h=Buffer.alloc(12);h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(12+8+j.length+8+b.length,8);
 const jc=Buffer.alloc(8);jc.writeUInt32LE(j.length,0);jc.writeUInt32LE(0x4e4f534a,4);
 const bc=Buffer.alloc(8);bc.writeUInt32LE(b.length,0);bc.writeUInt32LE(0x004e4942,4);
 return Buffer.concat([h,jc,j,bc,b]);
}
try {
 const ctx=await browser.newContext({viewport:{width:1500,height:950},acceptDownloads:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text().slice(0,160))});
 await page.goto(base+'forma-world.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>!!window.FORMA_WORLD,null,{timeout:30000});
 assert.equal(await page.locator('#fwLight').count(),1);
 await page.waitForFunction(()=>/отключен|не включен|отключена|предпросмотре/i.test(document.querySelector('#fwAIStatus')?.textContent||''),null,{timeout:9000});
 assert.equal(await page.locator('#fwCreateWorld').isDisabled(),true);
 assert.equal(await page.locator('#fwCreateObject').isDisabled(),true);
 assert.equal(await page.evaluate(()=>window.FORMA_WORLD.mode),'orbit');
 assert.equal(await page.evaluate(()=>window.FORMA_WORLD.loadedFile),null);
 await page.locator('#fwLight').selectOption('golden');
 assert.equal(await page.locator('#fwShot4K').count(),1);
 assert.equal(await page.locator('#fwHDRFile').count(),1);
 await page.locator('#fwWalk').click();
 assert.equal(await page.evaluate(()=>window.FORMA_WORLD.mode),'walk');
 await page.locator('#fwOrbit').click();
 const png=page.waitForEvent('download',{timeout:12000});
 await page.locator('#fwShot').click();
 const download=await png;
 assert.match(download.suggestedFilename(),/^FORMA-3D-.*\.png$/);
 const worldScreenshot=screenshots+'/forma-world-desktop.png';
 await page.screenshot({path:worldScreenshot,animations:'disabled'});
 const glb=miniGLB();
 await page.locator('#fwFile').setInputFiles({name:'Test-triangle.glb',mimeType:'model/gltf-binary',buffer:glb});
 await page.waitForFunction(()=>window.FORMA_WORLD?.loadedFile?.name==='Test-triangle.glb',null,{timeout:18000});
 assert.equal(await page.evaluate(()=>window.FORMA_WORLD.loadedFile.meshes),1);
 await page.locator('#fwBookmark').click();
 assert.match(await page.locator('#fwStatus').textContent(),/Ракурс сохранён/);
 await page.locator('#fwReturn').click();
 assert.match(await page.locator('#fwStatus').textContent(),/Ракурс восстановлен/);
 assert.deepEqual(errors,[], 'No runtime or CDN errors in 3D World');

 const m=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const mobile=await m.newPage();
 await mobile.goto(base+'forma-world.html',{waitUntil:'domcontentloaded',timeout:45000});
 await mobile.waitForFunction(()=>!!window.FORMA_WORLD,null,{timeout:30000});
 await mobile.screenshot({path:screenshots+'/forma-world-mobile.png',animations:'disabled'});
 await mobile.locator('#fwWalk').click();
 assert.equal(await mobile.locator('#fwTouchMove').isVisible(),true);
 await m.close();
 console.log('PASS 3D world: demo geometry, lights, orbit/walk, PNG capture, imported GLB, bookmarks, mobile.');
 await ctx.close();
} finally {await browser.close()}
