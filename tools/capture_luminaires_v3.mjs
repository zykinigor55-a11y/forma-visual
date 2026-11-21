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
   if(proof.fixtureId!==id||!proof.webgl||proof.modelPartCount<(id==='globe'?3:5))throw Error('Invalid geometry '+JSON.stringify(proof));
   if(errors.length)throw Error('WebGL errors '+id+': '+errors.join(','));
   const file=dir+'/luminaire-v3-'+id+'-real-render.png';
   await page.locator('canvas').screenshot({path:file,animations:'disabled',timeout:90000});
   const size=(await fs.stat(file)).size;
   if(size<(id==='linear'?12000:25000))throw Error('Empty screenshot '+id+' '+size);
   report.push({id,file,size,partCount:proof.modelPartCount,version:proof.fixtureVersion});
   console.log('REAL MODEL PASS',id,proof.modelPartCount,size);
 }
 await fs.writeFile(dir+'/luminaire-v3-photo-reference-proof.json',JSON.stringify({source:'original DOM.RENDER Three.js geometry, not AI imagery',count:report.length,models:report,timestamp:new Date().toISOString()},null,2)+'\n');
}finally{await browser.close();}
