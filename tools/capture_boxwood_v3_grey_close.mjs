import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const base='http://127.0.0.1:3000';
const expectedSha='46ca248559075f5893c928b3e8d4bf7d64426c6c5ed9ce6df434834612dd9d76';
const out='assets/landscape-screenshots';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({
  headless:true,
  args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']
});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1320},deviceScaleFactor:1,locale:'ru-RU'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>errors.push(r.url()+' '+(r.failure()?.errorText||'')));
 const proofs=[];
 for(const spec of [
   {form:'BOXWOOD_NATURAL',detail:false,file:'boxwood-v3-real-photo-grey-close.png'},
   {form:'BOXWOOD_NATURAL',detail:true,file:'boxwood-v3-real-photo-grey-leaf-macro.png'},
   {form:'BOXWOOD_SPHERE',detail:false,file:'boxwood-v3-real-photo-grey-sphere.png'}
 ]){
  const response=await page.goto(base+'/forma-boxwood-v3-grey-studio.html?form='+spec.form+(spec.detail?'&detail=macro':''),{waitUntil:'domcontentloaded',timeout:60000});
  if(response?.status()!==200)throw Error('Grey studio HTML failed to load');
  await page.waitForFunction(()=>window.__BOXWOOD_REAL_GLB_READY__||window.__BOXWOOD_ERROR__,null,{timeout:105000});
  const info=await page.evaluate(()=>({ready:window.__BOXWOOD_REAL_GLB_READY__,error:window.__BOXWOOD_ERROR__}));
  if(info.error||!info.ready||info.ready.photoMaterialCount<1||info.ready.normalMaterialCount<1)
    throw Error('Real photo material not rendered: '+JSON.stringify(info));
  await page.waitForTimeout(750);
  const pathName=path.join(out,spec.file);
  await page.screenshot({path:pathName,animations:'disabled',timeout:90000});
  const bytes=(await fs.stat(pathName)).size;
  if(bytes<100000)throw Error('No meaningful screenshot output: '+bytes);
  proofs.push({...spec,ready:info.ready,file:pathName,bytes});
  console.log('Captured genuine photo-textured Buxus GLB',JSON.stringify(proofs[proofs.length-1]));
 }
 const checksum=await page.evaluate(async()=>{
  const result=await fetch('/assets/landscape-models/boxwood-sempervirens-forma-original.glb');
  if(!result.ok)throw Error('GLB http '+result.status);
  const digest=await crypto.subtle.digest('SHA-256',await result.arrayBuffer());
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
 });
 if(checksum!==expectedSha)throw Error('Fetched photo-GLB SHA mismatch '+checksum);
 await fs.writeFile(path.join(out,'boxwood-v3-grey-close-evidence.json'),
   JSON.stringify({model:'Buxus sempervirens v3 REAL photographed UV and normal-map GLB',
   source:'Actual scene GLB loaded via THREE.js GLTFLoader, no generative image',
   screenshotType:'local dedicated grey studio GLB model renderer, not original landscape editor screenshot',
   actualSha256:checksum,photoTextureSource:'https://commons.wikimedia.org/wiki/File:Buxus_sempervirens-1.jpg',
   proofs,errors,timestamp:new Date().toISOString()},null,2)+'\n');
 console.log('SHA verified '+checksum);
} finally {await browser.close();}
