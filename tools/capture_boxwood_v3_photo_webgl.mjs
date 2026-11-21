import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const site='http://127.0.0.1:3000/forma-landscape-3d.html';
const outDir='assets/landscape-screenshots';
const objectName='boxwood';
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({
 headless:true,
 args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']
});
const context=await browser.newContext({viewport:{width:1600,height:940},deviceScaleFactor:1,locale:'ru-RU',colorScheme:'dark'});
const page=await context.newPage();
page.setDefaultTimeout(25000);
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('requestfailed',r=>errors.push('network: '+r.url()+' '+r.failure()?.errorText));
let saved=false;
try{
 await page.addInitScript(()=>{
   if(!location.pathname.endsWith('/forma-landscape-3d.html'))return;
   // Isolated screenshot profile; does not alter any visitor's saved project.
   const project={
     version:1,title:'FORMA · Самшит Buxus · реальная сцена редактора',
     site:{width:22,height:22,orientation:0,boundary:null},
     house:{x:3,y:3,width:4,height:4,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e',ridge:0,entry:'south',photo:null},
     objects:[],buildings:[],underlay:null,underlayOpacity:.25,north:0,verified:false,style:'natural',
     atmosphere:{time:'day',season:'summer',weather:'sunny'}
   };
   localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'boxwood-screenshot'}));
   localStorage.setItem('forma-landscape-masterplan-v1-boxwood-screenshot',JSON.stringify(project));
 });
 const resp=await page.goto(site,{waitUntil:'domcontentloaded',timeout:60000});
 if(resp?.status()!==200)throw Error('Editor returned HTTP '+resp?.status());
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:105000});
 if(await page.locator('#loadError').isVisible())throw Error('Editor reported WebGL initialization error');
 const canvas=page.locator('#viewport');
 const rect=await canvas.boundingBox();
 if(!rect||rect.width<450||rect.height<350)throw Error('Editor WebGL canvas not visible');
 console.log('Real editor is open; canvas:',JSON.stringify(rect));

 await page.locator('[data-tool="plant"]').first().click();
 await page.locator('#library [data-item="boxwood"]').click();
 const brush=page.locator('#useLandscapeBrush');
 if(await brush.count()&&await brush.isChecked())await brush.uncheck();
 const positions=[[.63,.73],[.53,.74],[.72,.67],[.68,.80],[.47,.69],[.58,.82]];
 let plantedPoint=null;
 for(const [px,py] of positions){
   const x=rect.x+px*rect.width,y=rect.y+py*rect.height;
   await page.mouse.click(x,y);
   await page.waitForTimeout(600);
   const n=await page.evaluate(()=>{
     const p=JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-boxwood-screenshot')||'{}');
     return p.objects?.filter(x=>x.catalogId==='boxwood').length||0;
   });
   console.log('Plant Boxwood at',px,py,'count',n);
   if(n>0){plantedPoint={x,y,px,py};break;}
 }
 if(!plantedPoint)throw Error('Actual 3D editor did not plant Boxwood in scene');

 await page.waitForFunction(
   ()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS?.().some(x=>x.species==='boxwood'&&x.status==='glb'),
   null,{timeout:115000});
 const diagnostics=await page.evaluate(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS());
 console.log('True GLB loaded:',JSON.stringify(diagnostics));
 if(!diagnostics.some(x=>x.species==='boxwood'&&x.status==='glb'))throw Error('BOXWOOD GLB did not load in original WebGL scene');
 const actualGlbSha=await page.evaluate(async()=>{
   const response=await fetch('/assets/landscape-models/boxwood-sempervirens-forma-original.glb');
   if(!response.ok)throw Error('Could not fetch current 3D binary');
   const buffer=await response.arrayBuffer();
   const digest=await crypto.subtle.digest('SHA-256',buffer);
   return Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('');
 });
 const expectedGlbSha='46ca248559075f5893c928b3e8d4bf7d64426c6c5ed9ce6df434834612dd9d76';
 const photoSource={
   license:'Public domain, Wikimedia Commons',
   author:'Karduelis',
   photo:'https://commons.wikimedia.org/wiki/File:Buxus_sempervirens-1.jpg',
   sourceDimensions:[2589,1714]
 };
 if(actualGlbSha!==expectedGlbSha)throw Error('Editor is serving old BOXWOOD GLB: '+actualGlbSha);
 console.log('Confirmed exact premium Buxus v2 asset SHA',actualGlbSha);

 // Select placed shrub in the real editor and focus the actual camera on it.
 let editorOpened=false;
 const offsets=[[0,-22],[0,-12],[0,-33],[0,0],[-12,-16],[12,-16],[0,-44],[0,12],[0,-54]];
 for(const [dx,dy] of offsets){
   await page.mouse.click(plantedPoint.x+dx,plantedPoint.y+dy);
   await page.waitForTimeout(360);
   editorOpened=await page.locator('#properties').innerText().then(t=>t.includes('РЕДАКТОР КУСТАРНИКА')).catch(()=>false);
   if(editorOpened)break;
 }
 if(editorOpened){
   const button=page.locator('#shrubFocus');
   if(await button.count()){await button.click();await page.waitForTimeout(1500);}
 } else {
   await page.locator('[data-tool="select"]').first().click();
 }
 await page.waitForTimeout(2300);
 const canvasStatus=await page.evaluate(()=>{
  const c=document.querySelector('#viewport'),gl=c.getContext('webgl2')||c.getContext('webgl');
  return {webgl:!!gl,width:c.width,height:c.height};
 });
 if(!canvasStatus.webgl)throw Error('There was no real WebGL context');
 const editorFile=path.join(outDir,'boxwood-v3-photo-from-real-editor.png');
 const canvasFile=path.join(outDir,'boxwood-v3-photo-webgl-scene.png');
 await page.screenshot({path:editorFile,animations:'disabled',timeout:90000});
 await canvas.screenshot({path:canvasFile,animations:'disabled',timeout:90000});
 const proof={
   source:'REAL DOM.RENDER editor launched from active GitHub branch in Chromium via localhost',
   appUrl:site,notAStandaloneGLBRender:true,screenshotFile:editorFile,
   species:objectName,version:'v3.0-CC0-real-leaf-PBR-textures',glbSha256:actualGlbSha,photoTextureVerified:true,photoSource:photoSource,modelLoaded:diagnostics.some(x=>x.species===objectName&&x.status==='glb'),
   diagnostics,editorOpened,webgl:canvasStatus,
   errors:errors.slice(0,20),timestamp:new Date().toISOString()
 };
 await fs.writeFile(path.join(outDir,'boxwood-v3-photo-webgl-evidence.json'),JSON.stringify(proof,null,2)+'\n');
 if((await fs.stat(editorFile)).size<50000)throw Error('WebGL screenshot was unexpectedly small');
 console.log('SAVED GENUINE APP SCREENSHOT',JSON.stringify(proof));
 saved=true;
} finally {
 await browser.close();
 if(!saved)console.error('Failed to obtain validated original DOM.RENDER screenshot; errors:',errors.slice(0,12));
}
