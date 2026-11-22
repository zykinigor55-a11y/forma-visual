import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='screenshots/architecture-current';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
 '--disable-dev-shm-usage','--ignore-gpu-blocklist'
]});
try{
 const page=await browser.newPage({viewport:{width:1640,height:1000},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',
  {waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:120000});
 await page.waitForTimeout(1800);
 // Isolated Chromium profile: switch only this preview project to the
 // approved Scandinavian preset; never touch the user's stored projects.
 await page.locator('#selectMainHouse').click();
 await page.locator('#houseCatalog').evaluate(el=>{el.open=true});
 await page.locator('[data-house-preset="scandi"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-house-preset="scandi"]')?.getAttribute('aria-pressed')==='true',
  null,{timeout:20000});
 await page.waitForTimeout(4800);
 const focused=page.locator('#focusHouse');
 if(await focused.isVisible()){await focused.click();await page.waitForTimeout(2600);}
 await page.screenshot({path:dir+'/FORMA-HOUSE-EDITOR-ACTUAL.jpg',type:'jpeg',quality:85,timeout:65000});
 const rect=await page.locator('#viewport').boundingBox();
 if(rect&&rect.width>200&&rect.height>200){
  await page.locator('#viewport').screenshot({path:dir+'/FORMA-HOUSE-VIEWPORT-ACTUAL.jpg',type:'jpeg',quality:90,timeout:65000});
  await page.locator('#viewport').screenshot({path:dir+'/SCANDI-HOUSE-TWO-TIMBERS-3D.jpg',type:'jpeg',quality:90,timeout:65000});
  await page.locator('#viewport').screenshot({path:dir+'/SCANDI-GREY-VERTICAL-BOARDS-REAL-WEBGL.jpg',type:'jpeg',quality:91,timeout:65000});
 }
 const result=await page.evaluate(()=>({
  title:document.title,ready:window.FORMA_3D_READY,
  style:document.querySelector('[data-house-preset="scandi"]')?.getAttribute('aria-pressed'),
  canvas:!!document.querySelector('#viewport'),
  ref:'Mocopinus Oldenburg silbergrau grey vertical wood + black windows',
  status:document.querySelector('#status')?.textContent?.slice(0,200),
  build:document.querySelector('#buildInfo')?.textContent?.slice(0,200)
 }));
 console.log('REAL_EDITOR_SCREENSHOT',JSON.stringify({result,errors}));
 if(!result.ready||result.style!=='true'||errors.length)process.exitCode=1;
}finally{await browser.close()}
