import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const ids=['granite-boulder','limestone-boulder','slate-boulder','sandstone-boulder'];
const dir='assets/landscape-screenshots';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader',
 '--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox'
]});
const all=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1120,height:950},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(error.message));
 for(const id of ids){
  const response=await page.goto('http://127.0.0.1:3000/forma-boulders-v2-studio.html?id='+id,{waitUntil:'domcontentloaded',timeout:110000});
  if(response?.status()!==200)throw Error('HTTP '+response?.status()+' for '+id);
  await page.waitForFunction(()=>window.FORMA_BOULDER_READY===true,null,{timeout:90000});
  await page.waitForTimeout(350);
  const proof=await page.evaluate(()=>window.FORMA_BOULDER_PROOF);
  if(!proof?.webgl||proof.id!==id||!proof.scanStats?.photoMaps||proof.scanStats.triangles<3000)
   throw Error('Not a genuine PBR photogrammetry boulder '+JSON.stringify(proof));
  const file=dir+'/boulder-v2-'+id+'-actual-pbr-webgl.png';
  await page.locator('canvas').screenshot({path:file,animations:'disabled',timeout:90000});
  const bytes=(await fs.stat(file)).size;
  if(bytes<50000)throw Error('Invalid screenshot size '+bytes+' '+id);
  all.push({...proof,file,bytes});
  console.log('REAL CC0 PHOTOGRAMMETRY STONE',id,proof.scanStats,bytes);
 }
 if(errors.length)throw Error('Browser errors: '+errors.join('|'));
 await fs.writeFile(dir+'/boulder-v2-genuine-3d-proof.json',
  JSON.stringify({source:'native FORMA DOM.RENDER Three.js WebGL plus self-hosted original CC0 PBR photogrammetry GLBs',
   count:all.length,boulders:all,errors,timestamp:new Date().toISOString()},null,2)+'\n');
 const editor=await browser.newPage({viewport:{width:1680,height:1024},deviceScaleFactor:1,locale:'ru-RU'});
 const editorErrors=[];editor.on('pageerror',error=>editorErrors.push(error.message));
 editor.on('requestfailed',req=>editorErrors.push(req.url()+' '+req.failure()?.errorText));
 await editor.addInitScript(()=>{
  if(!location.pathname.endsWith('/forma-landscape-3d.html'))return;
  const ids=['granite-boulder','limestone-boulder','slate-boulder','sandstone-boulder'];
  const objects=ids.map((catalogId,i)=>({
   id:'rock-demo-'+i,catalogId,type:'boulders',x:4.1+i*3.65,y:8.2,
   diameter:1.45+i*.12,height:.78+i*.05,rotation:0,variant:1,burial:.1
  }));
  const doc={
   version:1,title:'FORMA · Реальные CC0 валуны PBR',
   site:{width:24,height:22,orientation:0,boundary:null},
   house:{x:12,y:3,width:6,height:4,rotation:0,type:'house',roof:'flat',
    roofColor:'#454543',ridge:0,entry:'south',photo:null},
   objects,buildings:[],underlay:null,underlayOpacity:.25,north:0,
   verified:false,style:'minimal',
   atmosphere:{time:'day',season:'summer',weather:'sunny'}
  };
  localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'boulders-photogrammetry-v2'}));
  localStorage.setItem('forma-landscape-masterplan-v1-boulders-photogrammetry-v2',JSON.stringify(doc));
 });
 const r=await editor.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:90000});
 if(r.status()!==200)throw Error('Main editor HTTP '+r.status());
 await editor.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:110000});
 await editor.waitForFunction(()=>{
  const urls=performance.getEntriesByType('resource').map(x=>x.name);
  return ['granite-boulder.glb','rock-moss.glb','rock-rough.glb','rock-grey.glb'].every(name=>urls.some(u=>u.endsWith('/'+name)));
 },null,{timeout:90000});
 await editor.waitForTimeout(1800);
 const image=dir+'/boulder-v2-real-editor-four-photogrammetry-rocks.png';
 await editor.screenshot({path:image,animations:'disabled',timeout:90000});
 const canvas=editor.locator('#viewport');
 await canvas.screenshot({path:dir+'/boulder-v2-real-webgl-four-rocks.png',animations:'disabled',timeout:90000});
 const fileSize=(await fs.stat(image)).size;
 if(fileSize<50000||editorErrors.length)throw Error('Editor capture error '+fileSize+' '+editorErrors.join('|'));
 console.log('FOUR ROCKS VERIFIED INSIDE ACTUAL EDITOR',fileSize);
}finally{await browser.close();}
