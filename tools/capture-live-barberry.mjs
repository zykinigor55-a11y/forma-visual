import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import crypto from 'node:crypto';

const out='screenshots/forma-webgl-barberry.png';
const qaPath='screenshots/forma-webgl-barberry-qa.json';
await mkdir('screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,ignoreHTTPSErrors:true});
const project={
 version:1,title:'Барбарис Тунберга · тест WebGL',
 site:{width:30,height:40,orientation:0,boundary:null},
 house:{x:15,y:16,width:12,height:8,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e',ridge:0,entry:'south',photo:null},
 objects:[
  {id:'barberry-main',catalogId:'barberry',type:'shrubs',x:15,y:25.8,diameter:2.7,height:2.0,variant:1,rotation:0},
  {id:'barberry-left',catalogId:'barberry',type:'shrubs',x:12,y:25.9,diameter:1.9,height:1.4,variant:2,rotation:22},
  {id:'barberry-right',catalogId:'barberry',type:'shrubs',x:18,y:25.9,diameter:1.85,height:1.45,variant:3,rotation:-25}
 ],buildings:[],underlay:null,underlayOpacity:.25,north:0,verified:false,style:'natural',atmosphere:{time:'day',season:'summer',weather:'sunny'}
};
await context.addInitScript((project)=>{
 try{
  if(location.hostname==='dom-render-nanobanana.onrender.com'){
   localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'forma-webgl-barberry-qa'}));
   localStorage.setItem('forma-landscape-masterplan-v1-forma-webgl-barberry-qa',JSON.stringify(project));
  }
 }catch(e){console.warn('Could not seed isolated QA plan',e)}
},project);
const page=await context.newPage();
const failures=[];
page.on('console',message=>{if(message.type()==='error')failures.push('console: '+message.text())});
page.on('pageerror',error=>failures.push('pageerror: '+String(error.message)));
await page.route('**/forma-landscape-3d.html',async route=>{
 const r=await route.fetch(),body=await r.text();
 // Tiny QA-only bridge inside the UNCHANGED application module; never
 // changes the geometry/rendering and is NOT committed to production HTML.
 const marker="window.FORMA_TREE_MODEL_DIAGNOSTICS=treeModelDiagnostics;";
 if(!body.includes(marker))throw Error('Editor QA hook marker not found');
 const injected=body.replace(marker,marker+"\nwindow.FORMA_QA_SELECT_BARBERIS=()=>{state.selected='object:barberry-main';renderProps();revealSelectedInspector();focusSelectedPlant();renderGate.invalidate();};");
 await route.fulfill({response:r,body:injected});
});
console.log('Opening live Render WebGL editor...');
await page.goto('https://dom-render-nanobanana.onrender.com/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForFunction(()=>typeof window.FORMA_SHRUB_MODEL_DIAGNOSTICS==='function'&&typeof window.FORMA_QA_SELECT_BARBERIS==='function',{timeout:100000});
await page.waitForFunction(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS().filter(x=>x.species==='barberry').length===3,{timeout:35000});
await page.waitForFunction(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS().some(x=>x.species==='barberry'&&x.status==='glb'),{timeout:100000});
await page.evaluate(()=>window.FORMA_QA_SELECT_BARBERIS());
await page.waitForTimeout(2500);
const info=await page.evaluate(()=>{
 const canvas=document.querySelector('#viewport');
 const panel=document.querySelector('#properties');
 return {loaded:window.FORMA_SHRUB_MODEL_DIAGNOSTICS(),
  webglVersion:canvas.getContext('webgl2')?.getParameter(canvas.getContext('webgl2').VERSION)||null,
  inspector:panel?.innerText.slice(0,1200),
  canvasWidth:canvas.width,canvasHeight:canvas.height,
  selectedBarberry:panel?.innerText.includes('Барбарис')};
});
if(!info.loaded.some(x=>x.species==='barberry'&&x.status==='glb'))throw Error('Scene did not render original GLB '+JSON.stringify(info));
if(!info.selectedBarberry)throw Error('Inspector missing barberry selection '+JSON.stringify(info));
await page.screenshot({path:out,animations:'disabled',timeout:30000});
const data=await (await import('node:fs/promises')).readFile(out);
const qa={source:'Real Chromium/Playwright screenshot of Render WebGL editor, screenshot not AI-generated',sourcePage:page.url(),timestampUtc:new Date().toISOString(),testOnlyPlan:true,screenshotBytes:data.length,screenshotSha256:crypto.createHash('sha256').update(data).digest('hex'),diagnostics:info,consoleErrors:failures.slice(0,12)};
await writeFile(qaPath,JSON.stringify(qa,null,2)+'\n');
console.log('REAL SCREENSHOT OK '+JSON.stringify({bytes:qa.screenshotBytes,sha256:qa.screenshotSha256,diagnostics:info.loaded,selectedBarberry:info.selectedBarberry,errors:failures.slice(0,5)}));
await browser.close();
