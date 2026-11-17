
 const {chromium}=await import('playwright');
 const {mkdir}=await import('node:fs/promises');
 const folder='artifacts/landscape-screens';
 await mkdir(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const project={
  version:1,title:'Сад у загородного дома',site:{width:30,height:40,orientation:0,boundary:null},north:0,verified:true,style:'modern',
  house:{x:15,y:15,width:12,height:8,rotation:-12,type:'house',roof:'gable',roofColor:'#383c42',ridge:0,entry:'south',photo:null},
  buildings:[{id:'bath-1',x:24,y:32,width:6,height:4,rotation:6,type:'bath',roof:'hip',roofColor:'#424343',photo:null}],
  objects:[
   {id:'lawn-1',catalogId:'universal',points:[{x:0,y:0},{x:30,y:0},{x:30,y:40},{x:0,y:40}]},
   {id:'path-1',catalogId:'granite-setts',width:1.6,points:[{x:14,y:40},{x:14,y:33},{x:13,y:28},{x:15,y:21},{x:15,y:19}]},
   {id:'path-2',catalogId:'concrete-pavers',width:1.2,points:[{x:15,y:24},{x:19,y:28},{x:24,y:30},{x:24,y:32}]},
   {id:'pond-1',catalogId:'natural',points:[{x:3,y:27},{x:6,y:25},{x:9,y:26},{x:11,y:30},{x:9,y:34},{x:5,y:33}]},
   {id:'mulch-1',catalogId:'pine-bark',points:[{x:1,y:2},{x:10,y:2},{x:10,y:8},{x:7,y:10},{x:1,y:8}]},
   {id:'pine-1',catalogId:'pine',x:5,y:5,diameter:7,rotation:0},
   {id:'pine-2',catalogId:'spruce',x:25,y:5,diameter:5,rotation:0},
   {id:'birch-1',catalogId:'birch',x:6,y:17,diameter:6,rotation:0},
   {id:'oak-1',catalogId:'oak',x:25,y:21,diameter:7,rotation:0},
   {id:'hydra-1',catalogId:'hydrangea',x:8,y:21,diameter:1.8,rotation:0},
   {id:'hydra-2',catalogId:'hydrangea',x:10,y:23,diameter:1.8,rotation:0},
   {id:'spirea-1',catalogId:'spirea',x:23,y:15,diameter:1.2,rotation:0},
   {id:'barb-1',catalogId:'barberry',x:26,y:15,diameter:1.2,rotation:0},
   {id:'light-1',catalogId:'bollard',x:13,y:32,diameter:.3,rotation:0},
   {id:'light-2',catalogId:'bollard',x:15.2,y:27,diameter:.3,rotation:0},
   {id:'rock-1',catalogId:'granite-boulder',x:5,y:37,diameter:2.2,rotation:0},
   {id:'rock-2',catalogId:'slate-boulder',x:8,y:37,diameter:2.0,rotation:0}
  ]};
 async function setup(page){
  await page.addInitScript(p=>{
   localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'landscape',projects:[]}));
   localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(p));
  },project);
  page.on('pageerror',e=>console.error('PAGEERROR',e.message));
  page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text().slice(0,400))});
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.FORMA_LANDSCAPE_PROJECT,{timeout:45000});
  await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.open());
  await page.waitForSelector('#faLandscapeMasterplan[open]',{timeout:20000});
  await page.waitForFunction(()=>document.querySelector('.lp-assets img')?.src.includes('/assets/landscape-photo/'),{timeout:15000});
  await page.waitForFunction(()=>[...document.querySelectorAll('.lp-assets img')].every(x=>x.complete&&x.naturalWidth>0),{timeout:12000});
  await page.waitForTimeout(450);
 }
 const desktop=await browser.newPage({viewport:{width:1680,height:1040},deviceScaleFactor:1});
 await setup(desktop);
 await desktop.screenshot({path:`${folder}/forma-landscape-project-desktop.png`,fullPage:false});
 await desktop.locator('[data-category="boulders"]').first().click();
 await desktop.waitForFunction(()=>[...document.querySelectorAll('.lp-assets img')].length===4&&[...document.querySelectorAll('.lp-assets img')].every(img=>img.complete&&img.naturalWidth>=1080),{timeout:20000});
 await desktop.waitForFunction(()=>document.querySelector('[data-asset="granite-boulder"] img')?.currentSrc.includes('/landscape-card-photo/granite-boulder.jpg?'),null,{timeout:20000});
 await desktop.waitForTimeout(200);
 await desktop.screenshot({path:`${folder}/forma-landscape-boulders.png`,fullPage:false});
 await desktop.locator('[data-category="lights"]').click();
 await desktop.waitForFunction(()=>(()=>{const i=document.querySelector('[data-asset="bollard"] img');return i?.complete&&i.naturalWidth===1080&&i.currentSrc.includes('/landscape-card-photo/bollard.jpg?')})(),null,{timeout:20000});
 await desktop.screenshot({path:`${folder}/forma-landscape-lights.png`,fullPage:false});
 await desktop.locator('[data-category="ponds"]').click();
 await desktop.waitForFunction(()=>(()=>{const i=document.querySelector('[data-asset="natural"] img');return i?.complete&&i.naturalWidth===1080&&i.currentSrc.includes('/landscape-card-photo/natural.jpg?')})(),null,{timeout:20000});
 await desktop.screenshot({path:`${folder}/forma-landscape-ponds.png`,fullPage:false});
 await desktop.locator('[data-category="boulders"]').click();
 await desktop.waitForFunction(()=>document.querySelector('[data-asset="granite-boulder"] img')?.currentSrc.includes('/landscape-card-photo/granite-boulder.jpg?'),null,{timeout:20000});

 const mobile=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await setup(mobile);
 await mobile.screenshot({path:`${folder}/forma-landscape-project-mobile.png`,fullPage:false});
 await mobile.locator('.lp-sidebar').scrollIntoViewIfNeeded();
 await mobile.waitForTimeout(350);
 await mobile.screenshot({path:`${folder}/forma-landscape-premium-cards-mobile.png`,fullPage:false});
 const checks={
  desktopPremium:await desktop.locator('.lp-assets img').first().evaluate(img=>img.currentSrc.includes('/landscape-card-photo/granite-boulder.jpg?')),
  mobileCardWidth:await mobile.locator('.lp-assets button').first().evaluate(e=>Math.round(e.getBoundingClientRect().width)),
  mobileImagesOk:await mobile.locator('.lp-assets img').first().evaluate(img=>img.naturalWidth>=1000)
 };
 if(!checks.desktopPremium||!checks.mobileImagesOk||checks.mobileCardWidth<130)throw Error('Invalid premium library screenshot checks: '+JSON.stringify(checks));
 console.log(JSON.stringify({status:'ok',files:['desktop','boulders','mobile','premium-mobile'],checks}));
 await browser.close();
