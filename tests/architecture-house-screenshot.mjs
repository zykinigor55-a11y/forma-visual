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
 await page.waitForTimeout(6500);
 const focused=page.locator('#focusHouse');
 if(await focused.isVisible()){await focused.click();await page.waitForTimeout(2600);}
 await page.screenshot({path:dir+'/FORMA-HOUSE-EDITOR-ACTUAL.jpg',type:'jpeg',quality:85,timeout:65000});
 const rect=await page.locator('#viewport').boundingBox();
 if(rect&&rect.width>200&&rect.height>200)
  await page.locator('#viewport').screenshot({path:dir+'/FORMA-HOUSE-VIEWPORT-ACTUAL.jpg',type:'jpeg',quality:90,timeout:65000});
 const result=await page.evaluate(()=>({
  title:document.title,ready:window.FORMA_3D_READY,
  canvas:!!document.querySelector('#viewport'),
  status:document.querySelector('#status')?.textContent?.slice(0,200),
  build:document.querySelector('#buildInfo')?.textContent?.slice(0,200)
 }));
 console.log('REAL_EDITOR_SCREENSHOT',JSON.stringify({result,errors}));
 if(!result.ready)process.exitCode=1;
}finally{await browser.close()}
