import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1600,height:950},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:3000/forma-boulders-qa.html',{waitUntil:'domcontentloaded',timeout:80000});
 if(response.status()!==200)throw Error('HTTP '+response.status());
 await page.waitForFunction(()=>window.FORMA_ROCK_SCAN_READY===true,null,{timeout:110000});
 const proof=await page.evaluate(()=>window.FORMA_ROCK_SCAN_PROOF);
 if(proof.length!==4||proof.some(x=>x.meshes===0||x.triangles<100))throw Error('invalid photogrammetry models '+JSON.stringify(proof));
 if(errors.length)throw Error(errors.join('|'));
 await fs.mkdir('assets/landscape-screenshots',{recursive:true});
 const file='assets/landscape-screenshots/boulder-cc0-four-existing-scans-qa.png';
 await page.screenshot({path:file,animations:'disabled',timeout:95000});
 await fs.writeFile('assets/landscape-screenshots/boulder-cc0-scans-proof.json',JSON.stringify({proof,errors,timestamp:new Date().toISOString()},null,2)+'\n');
 console.log('VERIFIED PBR ROCK GLBS',JSON.stringify(proof));
}finally{await browser.close();}
