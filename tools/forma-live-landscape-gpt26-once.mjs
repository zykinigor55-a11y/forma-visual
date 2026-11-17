/**
 * One-time, explicitly user-authorised LIVE FORMA GPT Image 2.6 smoke render.
 * One click, one POST maximum. No retry, no provider bypass, no standalone model.
 * All images are produced by https://dom-render-nanobanana.onrender.com/.
 */
import { chromium } from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const ORIGIN='https://dom-render-nanobanana.onrender.com';
const DIR='artifacts/forma-live-masterplan-gpt26';
await mkdir(DIR,{recursive:true});
const projectId='landscape';
const site={width:30,height:40,boundary:null,orientation:0};
const project={
 version:1,title:'FORMA — тестовый ландшафт 30×40',site,north:0,verified:false,style:'modern',
 house:{x:15,y:15,width:12,height:8,rotation:0,type:'house',roof:'gable',roofColor:'#363a3c',ridge:0,entry:'south',photo:null},
 buildings:[{id:'bath-demo-1',x:25,y:32,width:6,height:4,rotation:0,type:'bath',roof:'hip',roofColor:'#444847',photo:null}],
 objects:[
  {id:'lawn-1',catalogId:'universal',type:'lawns',points:[{x:0,y:0},{x:30,y:0},{x:30,y:40},{x:0,y:40}]},
  {id:'path-1',catalogId:'granite-setts',type:'pavers',width:1.2,points:[{x:14,y:40},{x:14,y:33},{x:13,y:27},{x:15,y:20}]},
  {id:'path-2',catalogId:'concrete-pavers',type:'pavers',width:1.1,points:[{x:14,y:32},{x:20,y:33},{x:25,y:32}]},
  {id:'pond-1',catalogId:'natural',type:'ponds',points:[{x:3,y:27},{x:5,y:25},{x:9,y:26},{x:11,y:31},{x:8,y:35},{x:4,y:34}]},
  {id:'mulch-1',catalogId:'pine-bark',type:'fills',points:[{x:1,y:2},{x:10,y:2},{x:10,y:8},{x:7,y:10},{x:1,y:8}]},
  {id:'pine-1',catalogId:'pine',type:'trees',x:5,y:5,diameter:7,rotation:0},
  {id:'spruce-1',catalogId:'spruce',type:'trees',x:25,y:6,diameter:5,rotation:0},
  {id:'birch-1',catalogId:'birch',type:'trees',x:5,y:18,diameter:6,rotation:0},
  {id:'oak-1',catalogId:'oak',type:'trees',x:25,y:20,diameter:8,rotation:0},
  {id:'hydrangea-1',catalogId:'hydrangea',type:'shrubs',x:9,y:21,diameter:1.8,rotation:0},
  {id:'hydrangea-2',catalogId:'hydrangea',type:'shrubs',x:10.5,y:23,diameter:1.8,rotation:0},
  {id:'juniper-1',catalogId:'juniper',type:'shrubs',x:23,y:15,diameter:1.8,rotation:0},
  {id:'juniper-2',catalogId:'juniper',type:'shrubs',x:26,y:15,diameter:1.8,rotation:0},
  {id:'lamp-1',catalogId:'bollard',type:'lights',x:13,y:34,diameter:.25,rotation:0},
  {id:'lamp-2',catalogId:'ground',type:'lights',x:14,y:26,diameter:.25,rotation:0},
  {id:'granite-1',catalogId:'granite-boulder',type:'boulders',x:5,y:38,diameter:2,rotation:0},
  {id:'slate-1',catalogId:'slate-boulder',type:'boulders',x:9,y:38,diameter:1.7,rotation:0}
 ]
};
let browser=null;let requests=0;const log=[];let status='unknown';let error=null;let providerCode=null;
const watch=(msg)=>{const t=String(msg).slice(0,500);log.push(t);process.stdout.write(t+'\n')};
try{
 const response=await fetch(ORIGIN+'/api/status',{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Production /api/status returns HTTP '+response.status);
 const backend=await response.json();watch('LIVE backend: '+JSON.stringify({ready:backend.ready,planImageReady:backend.planImageReady,provider:backend.provider,planImageModel:backend.planImageModel,dailyRemaining:backend.dailyRemaining}));
 if(!backend.ready||backend.planImageModel!=='gpt-image-2.6-sunburst')throw Error('GPT Image 2.6 provider not confirmed ready on LIVE site. Paid POST will not be sent.');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1640,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>watch('Browser JS error: '+e.message));
 page.on('dialog',async dialog=>{
   watch('Browser confirmation: '+dialog.message());
   if(dialog.type()==='confirm')await dialog.accept();
   else await dialog.dismiss();
 });
 page.on('request',request=>{
   if(request.url().includes('/api/render')&&request.method()==='POST'){
    requests++;
    watch('LIVE paid POST count='+requests);
    if(requests>1)throw Error('Safety limit violated: repeated paid request.');
   }
 });
 page.on('response',response=>{
   if(response.url().endsWith('/api/render')&&response.request().method()==='POST'){
     providerCode=response.status();watch('LIVE render HTTP='+providerCode);
   }
 });
 await page.addInitScript(({project,projectId})=>{
   localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:projectId,projects:[]}));
   localStorage.setItem('forma-landscape-masterplan-v1-'+projectId,JSON.stringify(project));
 },{project,projectId});
 await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>Boolean(window.FORMA_LANDSCAPE_PROJECT?.open),{timeout:50000});
 await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.open());
 await page.waitForSelector('#faLandscapeMasterplan[open]',{timeout:12000});
 await page.waitForSelector('#lpAi',{timeout:10000});
 await page.locator('#lpAi').scrollIntoViewIfNeeded();
 await page.screenshot({path:DIR+'/before.png',fullPage:false});
 watch('Measured layout in the LIVE editor: '+JSON.stringify(await page.evaluate(()=>({plot:window.FORMA_LANDSCAPE_PROJECT.getReport().siteArea,building:window.FORMA_LANDSCAPE_PROJECT.getReport().buildingArea,objectCount:window.FORMA_LANDSCAPE_PROJECT.getProject().objects.length}))));
 // The following is the ONLY paid click. Never repeat it.
 await page.locator('#lpAi').click({timeout:15000});
 status='submitted';
 try{
  await page.waitForFunction(()=>{
   const text=document.querySelector('#lpStatus')?.textContent||'';
   const btn=document.querySelector('#lpAi');
   return btn&&!btn.disabled&&(/Фотореалистичная подача создана|не выдал изображение|Ошибка|Истекло время|Превышено|не удалось|Ошибка генерации|HTTP|AI не настроен|Ошибка запроса|Ошибка провайдера/i.test(text));
  },{timeout:260000});
 }catch(e){watch('Render UI did not complete inside single wait window: '+String(e).slice(0,300));}
 await page.waitForTimeout(500);
 const result=await page.evaluate(()=>({text:document.querySelector('#lpStatus')?.textContent||'',report:window.FORMA_LANDSCAPE_PROJECT?.getReport()}));
 watch('LIVE UI status: '+result.text);
 await page.screenshot({path:DIR+'/after.png',fullPage:false});
 const image=await page.evaluate(async projectId=>new Promise(resolve=>{
  const r=indexedDB.open('forma-landscape-masterplan-assets',1);
  r.onerror=()=>resolve(null);
  r.onsuccess=()=>{
   const db=r.result;
   if(!db.objectStoreNames.contains('media')){resolve(null);db.close();return}
   const tx=db.transaction('media','readonly');
   const req=tx.objectStore('media').get(projectId+':preview');
   req.onsuccess=()=>{resolve(req.result||null);db.close()};
   req.onerror=()=>{resolve(null);db.close()};
  };
 }),projectId);
 if(image&&/^data:image\/(?:png|jpeg|webp);base64,/.test(image)){
   const mime=image.match(/^data:image\/([^;]+);/)[1],ext=mime==='jpeg'?'jpg':mime;
   await writeFile(DIR+'/gpt-image-2.6-result.'+ext,Buffer.from(image.split(',')[1],'base64'));
   status='success';
   watch('SUCCESS: actual paid LIVE FORMA GPT Image 2.6 image saved '+ext);
 }else{
   status='failed_or_pending';
   error='No image returned to the editor or saved in IndexedDB. '+result.text;
   watch(error);
 }
 await writeFile(DIR+'/measured-geometry.json',JSON.stringify({before:project,after:await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.getProject()),report:result.report},null,2));
}catch(e){error=String(e?.stack||e);watch('ERROR: '+error.slice(0,1800));status=requests>0?'failed_or_pending':'not_submitted';}
finally{
 const receipt={origin:ORIGIN,datetime:new Date().toISOString(),status,requests,providerCode,error,log,source:'actual live FORMA website',model:'gpt-image-2.6-sunburst'};
 await writeFile(DIR+'/receipt.json',JSON.stringify(receipt,null,2));
 await browser?.close().catch(()=>{});
 watch('Final receipt: '+JSON.stringify({status,requests,providerCode,error:error?.slice(0,300)}));
 if(status!=='success')process.exitCode=1;
}
