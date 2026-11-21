import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='assets/landscape-screenshots';
const ids=['bollard','ground','spot','low-post','deck-light','linear','mushroom','square-bollard','garden-lantern','spike-spot','globe'];
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
const report=[];
try{
 const context=await browser.newContext({viewport:{width:1080,height:1080},deviceScaleFactor:1,colorScheme:'dark'});
 const page=await context.newPage();page.setDefaultTimeout(35000);
 let errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const id of ids){
   errors=[];
   const url='http://127.0.0.1:3000/forma-luminaire-01-render.html?id='+encodeURIComponent(id);
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:70000});
   if(response?.status()!==200)throw Error(id+' HTTP '+response?.status());
   await page.waitForFunction(()=>window.FORMA_LAMP_READY===true,null,{timeout:110000});
   const proof=await page.evaluate(()=>window.FORMA_LAMP_PROOF);
   const userSeven=['bollard','square-bollard','low-post','spot','garden-lantern','spike-spot','globe'];
   const expectedVersion=userSeven.includes(id)?'user-uploaded-7-photos-v4':'real-photo-reference-v3';
   if(proof.fixtureId!==id||!proof.webgl||proof.fixtureVersion!==expectedVersion||proof.modelPartCount<(id==='globe'?3:5))throw Error('Wrong 3D mesh or version '+JSON.stringify(proof));
   if(errors.length)throw Error('WebGL errors '+id+': '+errors.join(','));
   const file=dir+'/luminaire-v4-'+id+'-real-render.png';
   await page.locator('canvas').screenshot({path:file,animations:'disabled',timeout:90000});
   const size=(await fs.stat(file)).size;
   if(size<(id==='linear'?12000:25000))throw Error('Empty screenshot '+id+' '+size);
   report.push({id,file,size,partCount:proof.modelPartCount,version:proof.fixtureVersion});
   console.log('REAL MODEL PASS',id,proof.modelPartCount,size);
 }
 await fs.writeFile(dir+'/luminaire-v4-photo-reference-proof.json',JSON.stringify({source:'11 original DOM.RENDER Three.js models, seven rebuilt from uploaded reference photographs, not AI imagery',count:report.length,models:report,timestamp:new Date().toISOString()},null,2)+'\n');
}finally{await browser.close();}
