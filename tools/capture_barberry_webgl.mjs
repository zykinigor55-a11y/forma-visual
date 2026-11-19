import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const site='https://dom-render-nanobanana.onrender.com/forma-landscape-3d.html';
const outDir='assets/landscape-screenshots';
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({
  headless:true,
  args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']
});
const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,locale:'ru-RU',colorScheme:'dark'});
const page=await context.newPage();
page.setDefaultTimeout(20000);
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,260))});
page.on('requestfailed',r=>errors.push('network: '+r.url()+' / '+r.failure()?.errorText));
let screenshotMade=false;
try{
  // Only the isolated CI browser receives this demonstration project.
  // Never alter a user's saved projects in their own browser.
  await page.addInitScript(()=>{
    if(!location.pathname.endsWith('/forma-landscape-3d.html'))return;
    const project={
      version:1,title:'FORMA · Барбарис Тунберга · 3D-просмотр',
      site:{width:22,height:22,orientation:0,boundary:null},
      house:{x:3,y:3,width:4,height:4,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e',ridge:0,entry:'south',photo:null},
      objects:[],buildings:[],underlay:null,underlayOpacity:.25,north:0,verified:false,style:'natural',
      atmosphere:{time:'day',season:'summer',weather:'sunny'}
    };
    localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'barberry-capture'}));
    localStorage.setItem('forma-landscape-masterplan-v1-barberry-capture',JSON.stringify(project));
  });
  const response=await page.goto(site,{waitUntil:'domcontentloaded',timeout:120000});
  console.log('Editor HTTP',response?.status());
  await page.waitForFunction(()=>window.FORMA_3D_READY===true,{timeout:100000});
  console.log('Renderer ready');
  await page.locator('[data-tool="plant"]').first().click();
  await page.locator('#library [data-item="barberry"]').click();
  const brush=page.locator('#useLandscapeBrush');
  if(await brush.isChecked())await brush.uncheck();
  const canvas=page.locator('#viewport');
  const rect=await canvas.boundingBox();
  console.log('Real WebGL canvas area',JSON.stringify(rect));
  if(!rect||rect.width<300||rect.height<300)throw Error('Canvas was not rendered');
  const candidatePlaces=[[.63,.73],[.53,.74],[.72,.67],[.68,.80],[.47,.69],[.58,.82]];
  let plantedPoint=null;
  for(const [px,py] of candidatePlaces){
    const x=rect.x+px*rect.width,y=rect.y+py*rect.height;
    await page.mouse.click(x,y);
    await page.waitForTimeout(450);
    const n=await page.evaluate(()=>{let obj=JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-barberry-capture')||'{}');return obj.objects?.filter(p=>p.catalogId==='barberry').length||0});
    console.log('Place attempt',px,py,'barberries saved',n);
    if(n>0){plantedPoint={x,y,px,py};break;}
  }
  if(!plantedPoint)throw Error('The live editor did not save any barberry after genuine canvas placement');
  await page.waitForFunction(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS?.().some(x=>x.species==='barberry'&&x.status==='glb'),{timeout:115000});
  const diag=await page.evaluate(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS());
  console.log('Verified actual GLB renderer',JSON.stringify(diag));
  // Clicking an existing shrub while in planting mode should switch to its
  // right-side editor; try the projected crown and ground contact positions.
  const shifts=[[0,-22],[0,-12],[0,-33],[0,0],[-12,-16],[12,-16],[0,-44],[0,12]];
  let selected=false;
  for(const [dx,dy] of shifts){
    const clickX=plantedPoint.x+dx,clickY=plantedPoint.y+dy;
    if(clickX<rect.x+4||clickY<rect.y+4||clickX>rect.x+rect.width-4||clickY>rect.y+rect.height-4)continue;
    await page.mouse.click(clickX,clickY);
    await page.waitForTimeout(350);
    selected=await page.locator('#properties').innerText().then(s=>s.includes('РЕДАКТОР КУСТАРНИКА')).catch(()=>false);
    console.log('Select offset',dx,dy,'editor open:',selected);
    if(selected)break;
  }
  if(selected){
    const focused=page.locator('#shrubFocus');
    if(await focused.count()){await focused.click();await page.waitForTimeout(1800);}
  }else{
    console.log('Selection panel did not open; screenshot remains real 3D program evidence');
    await page.locator('[data-tool="select"]').first().click();
  }
  await page.waitForTimeout(2000);
  await page.screenshot({path:path.join(outDir,'barberry-from-live-editor.png'),animations:'disabled',timeout:90000});
  await canvas.screenshot({path:path.join(outDir,'barberry-webgl-scene.png'),animations:'disabled',timeout:90000});
  const glStats=await page.evaluate(()=>{
    const c=document.querySelector('#viewport');
    const gl=c.getContext('webgl2')||c.getContext('webgl');
    if(!gl)return {webgl:false,canvasPixels:[c.width,c.height]};
    const samples=[];
    for(const [u,v] of [[.2,.2],[.5,.5],[.5,.7],[.8,.3],[.7,.8]]){
      const p=new Uint8Array(4);
      gl.readPixels(Math.floor(c.width*u),Math.floor(c.height*v),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);
      samples.push([...p]);
    }
    return {webgl:true,canvasPixels:[c.width,c.height],samples};
  });
  const evidence={capturedFrom:site,source:'automated Chromium/Playwright screenshot of live Render WebGL program',glbVerified:diag.some(x=>x.species==='barberry'&&x.status==='glb'),diagnostics:diag,shrubsEditorOpened:selected,gl:glStats,errorLog:errors.slice(0,20),timestamp:new Date().toISOString()};
  await fs.writeFile(path.join(outDir,'barberry-live-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('Screenshot saved',JSON.stringify(evidence));
  if(!glStats.webgl)throw Error('Screenshot exists but the browser had no real WebGL context');
  if(!evidence.glbVerified)throw Error('Original GLB was not loaded');
  if((await fs.stat(path.join(outDir,'barberry-from-live-editor.png'))).size<50000)throw Error('Real screenshot is unexpectedly small');
  screenshotMade=true;
}finally{
  await browser.close();
  if(!screenshotMade)console.error('Barberry screenshot run did not pass verified browser conditions',errors.slice(0,10));
}
