import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const dir='assets/landscape-screenshots';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1400,height:1100},deviceScaleFactor:1});
 page.on('pageerror',err=>errors.push(err.message));
 const r=await page.goto('http://127.0.0.1:3000/forma-luminaire-01-render.html?id=bollard',{waitUntil:'domcontentloaded',timeout:60000});
 if(r?.status()!==200)throw Error('Fixture page HTTP '+r?.status());
 await page.waitForFunction(()=>window.FORMA_LAMP_READY===true,null,{timeout:90000});
 await page.waitForTimeout(1000);
 const proof=await page.evaluate(()=>window.FORMA_LAMP_PROOF);
 if(proof.fixtureId!=='bollard'||proof.modelPartCount<10||!proof.webgl)throw Error('Invalid real original bollard model '+JSON.stringify(proof));
 if(errors.length)throw Error('Browser errors: '+errors.join(', '));
 const filename=dir+'/luminaire-01-bollard-real-pbr-render.png';
 await page.locator('canvas').screenshot({path:filename,animations:'disabled',timeout:90000});
 if((await fs.stat(filename)).size<65000)throw Error('Render output unexpectedly small');
 await fs.writeFile(dir+'/luminaire-01-bollard-proof.json',JSON.stringify({...proof,filename,errors,timestamp:new Date().toISOString()},null,2)+'\n');
 console.log('GENUINE 3D LIGHT RENDER SAVED',filename,JSON.stringify(proof));
}finally{await browser.close();}
