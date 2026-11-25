import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const out='assets/landscape-screenshots/pools-preview';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:940},locale:'ru-RU'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const ids=['pool-frame','pool-inflatable','pool-inground'];
const proof=[];
try{
 await page.addInitScript(()=>{
  const project={version:1,title:'FORMA · Бассейны / проверка WebGL',site:{width:30,height:30},house:{x:6,y:5,width:6,height:5,type:'house',roof:'gable'},objects:[
   {id:'frame',catalogId:'pool-frame',type:'pools',x:10,y:15,diameter:3.05,height:1,rotation:0},
   {id:'inflatable',catalogId:'pool-inflatable',type:'pools',x:18,y:15,diameter:3.05,height:.76,rotation:0},
   {id:'inground',catalogId:'pool-inground',type:'pools',x:16,y:24,diameter:6,width:3,height:1.5,rotation:15}
  ],buildings:[],atmosphere:{time:'day',season:'summer',weather:'sunny'}};
  localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'pool-qa'}));
  localStorage.setItem('forma-landscape-masterplan-v1-pool-qa',JSON.stringify(project));
 });
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html?poolQA=1',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.FORMA_3D_READY&&window.FORMA_POOL_QA,null,{timeout:120000});
 await page.locator('[data-tool="landscape"]').first().click();
 for(const id of ids){
  const card=page.locator('#library [data-item="'+id+'"]');if(!await card.count())throw Error('Catalog missing '+id);
  const detail=await page.evaluate(id=>window.FORMA_POOL_QA(id),id);
  if(detail.meshes<4||detail.groundHole===false)throw Error('Geometry check failed '+JSON.stringify(detail));
  await page.waitForTimeout(1000);
  await page.screenshot({path:out+'/'+id+'.png',animations:'disabled',timeout:90000});
  proof.push(detail);
 }
 await fs.writeFile(out+'/evidence.json',JSON.stringify({source:'Actual FORMA editor WebGL',proof,errors},null,2));
 if(errors.length)throw Error(errors.join('; '));
}finally{await browser.close()}
