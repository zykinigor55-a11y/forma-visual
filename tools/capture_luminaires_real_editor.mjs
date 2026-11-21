import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const out='assets/landscape-screenshots';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
const errors=[],ctx=await browser.newContext({viewport:{width:1680,height:1024},deviceScaleFactor:1,locale:'ru-RU'});
const page=await ctx.newPage();page.setDefaultTimeout(30000);
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',req=>errors.push(req.url()+' '+req.failure()?.errorText));
try{
 await page.addInitScript(()=>{
  if(!location.pathname.endsWith('/forma-landscape-3d.html'))return;
  const ids=['bollard','ground','spot','low-post','mushroom','square-bollard','globe','garden-lantern','spike-spot','deck-light','linear'];
  const H=[.85,.12,.30,1.2,.38,.50,.38,.995,.36,.10,.08];
  const lights=ids.map((catalogId,i)=>({id:'lamp-'+i,catalogId,type:'lights',x:4+(i%6)*2.45,y:i<6?8:12,height:H[i],diameter:.3,rotation:0,brightness:1,kelvin:2700,variant:1}));
  const doc={version:1,title:'FORMA · 11 фотопрототипов · настоящая сцена',site:{width:20,height:20,orientation:0,boundary:null},
   house:{x:10,y:3,width:5,height:4,rotation:0,type:'house',roof:'flat',roofColor:'#33383c',ridge:0,entry:'south',photo:null},
   objects:lights,buildings:[],underlay:null,underlayOpacity:.25,north:0,verified:false,style:'minimal',
   atmosphere:{time:'night',season:'summer',weather:'sunny'}};
  localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'lighting-v3-all-proof'}));
  localStorage.setItem('forma-landscape-masterplan-v1-lighting-v3-all-proof',JSON.stringify(doc));
 });
 const r=await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 if(r?.status()!==200)throw Error('Editor HTTP status: '+r?.status());
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:110000});
 await page.locator('[data-tool="light"]').first().click();
 await page.waitForFunction(()=>{
  const imgs=[...document.querySelectorAll('#library .light-choice img')];
  return imgs.length===11&&imgs.every(i=>i.src.startsWith('data:image/png'));
 },null,{timeout:80000});
 await page.waitForTimeout(1200);
 const canvas=page.locator('#viewport');
 const gl=await canvas.evaluate(el=>({w:el.width,h:el.height,ok:!!(el.getContext('webgl2')||el.getContext('webgl'))}));
 if(!gl.ok||gl.w<400)throw Error('No real WebGL canvas');
 const choices=await page.locator('#library .light-choice').evaluateAll(a=>a.map(b=>b.dataset.item));
 if(new Set(choices).size!==11||!choices.includes('globe'))throw Error('Not 11 distinct light models');
 const files=['lighting-v3-real-editor-all-11-night.png','lighting-v3-real-webgl-all-11-night.png'];
 await page.screenshot({path:path.join(out,files[0]),animations:'disabled',timeout:90000});
 await canvas.screenshot({path:path.join(out,files[1]),animations:'disabled',timeout:90000});
 const proof={source:'actual DOM.RENDER WebGL editor from project branch',files,choices,canvas:gl,night:true,realPhotoModelVersion:'real-photo-reference-v3',errors,timestamp:new Date().toISOString()};
 await fs.writeFile(path.join(out,'lighting-v3-real-editor-all-11-evidence.json'),JSON.stringify(proof,null,2)+'\n');
 if((await fs.stat(path.join(out,files[0]))).size<45000)throw Error('Screenshot too small');
 console.log('REAL DOM.RENDER SCREENSHOT CAPTURED',JSON.stringify(proof));
}finally{await browser.close();if(errors.length)console.warn('Page issues',errors);}
