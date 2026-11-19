import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

await mkdir('artifacts/forma-main-atelier',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1680,height:960},deviceScaleFactor:1});
 const browserErrors=[];
 page.on('pageerror',e=>browserErrors.push(String(e)));
 await page.goto('http://127.0.0.1:3000/forma-preview.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>{
  const panel=document.querySelector('#formaStudioHome');
  return Boolean(panel&&document.body.classList.contains('fa-unified-studio')
   &&document.querySelectorAll('#formaStudioHome .fa-studio-task[data-studio-tool]').length>=9);
 },null,{timeout:90000});
 await page.waitForFunction(()=>document.querySelectorAll('.rail-nav .rail-btn svg.forma-premium-icon[data-forma-rev="main-atelier-v3"]').length>=6,null,{timeout:25000});
 await page.waitForFunction(()=>document.querySelectorAll('#formaStudioHome .fa-studio-task>svg.forma-premium-icon[data-forma-rev="main-atelier-v2"]').length>=9,null,{timeout:25000});
 // Regression: the user's screenshot showed the entire center missing.
 // Mere presence in DOM is insufficient; assert actual onscreen visibility.
 const center=page.locator('#formaStudioHome');
 assert.ok(await center.isVisible(),'Main content panel must be visible, not blank');
 const box=await center.boundingBox();
 assert.ok(box&&box.width>300&&box.height>350,'Main cards must occupy real screen area: '+JSON.stringify(box));
 const firstCard=page.locator('#formaStudioHome .fa-studio-task').first();
 assert.ok(await firstCard.isVisible(),'At least one main card must be painted');
 await page.waitForFunction(()=>{
  const rail=document.querySelector('.rail-nav');
  return rail?.querySelector('.fa-interior-nav svg.forma-premium-icon[data-forma-rev="main-atelier-v3"]')
   &&rail.querySelector('[data-art-open="landscape"] svg.forma-premium-icon[data-forma-rev="main-atelier-v3"]')
   &&rail.querySelector('[data-art-open="atmosphere"] svg.forma-premium-icon[data-forma-rev="main-atelier-v3"]');
 },null,{timeout:25000});
 const desktop=await page.evaluate(()=>{
  const select=(selector)=>[...document.querySelectorAll(selector)].map(el=>{
   const icon=el.querySelector('svg.forma-premium-icon'),style=icon?getComputedStyle(icon):null,rect=icon?.getBoundingClientRect();
   return {label:el.textContent?.trim().slice(0,60),hasSvg:!!icon,role:el.getAttribute('role'),
    width:rect?.width,height:rect?.height,visibility:style?.visibility,opacity:style?.opacity,
    revision:icon?.dataset.formaRev,gradient:icon?.querySelector('linearGradient')?.id};
  });
  return {rail:select('.rail-nav [data-nav],.rail-nav .fa-interior-nav,.rail-nav [data-art-open],.rail-nav .fa-flow-rail,.rail-nav .fa-pro-nav-launch'),cards:select('#formaStudioHome .fa-studio-task[data-studio-tool]'),
   cssLoaded:[...document.styleSheets].some(s=>s.href?.includes('forma-main-atelier-icons.css'))};
 });
 assert.ok(desktop.rail.length>=9,'Main rail includes 6 original and 3 dynamically injected tools');
 assert.ok(desktop.rail.some(x=>x.label?.includes('Интерьеры')),'Interior exists in rail');
 assert.ok(desktop.rail.some(x=>x.label?.includes('Благоустройство')),'Landscape exists in rail');
 assert.ok(desktop.rail.some(x=>x.label?.includes('Атмосфера')),'Atmosphere exists in rail');
 assert.ok(desktop.rail.some(x=>x.label?.includes('Сценарии')),'Scenarios exists in rail');
 assert.equal(desktop.cards.length,9,'All 9 original studio cards remain present');
 assert.ok(desktop.cssLoaded,'New main-page premium stylesheet is active');
 for(const [section,items,minimum] of [['rail',desktop.rail,27],['card',desktop.cards,43]]){
  for(const item of items){
   assert.ok(item.hasSvg&&item.width>=minimum&&item.height>=minimum&&item.visibility==='visible'&&Number(item.opacity)===1,
    section+' premium icon invisible: '+JSON.stringify(item));
   assert.equal(item.revision,section==='rail'?'main-atelier-v3':'main-atelier-v2');
  }
 }

 // Compact navigation must remain usable in a standard 1366x768 desktop.
 await page.setViewportSize({width:1366,height:768});
 const compact=await page.evaluate(()=>{
  const rail=document.querySelector('.rail-nav');
  const nav=[...rail.querySelectorAll('.rail-btn')];
  const rect=rail.getBoundingClientRect();
  const buttons=nav.map(b=>{
   const bounds=b.getBoundingClientRect(),icon=b.querySelector('svg.forma-main-nav-icon');
   const label=b.querySelector('.rail-name'),lb=label?.getBoundingClientRect();
   return {h:bounds.height,
    icon:icon?.getBoundingClientRect().height||0,
    svgCount:b.querySelectorAll('svg').length,
    label:label?.textContent?.trim()||'',
    labelFits:!lb||lb.bottom<=bounds.bottom+1&&lb.top>=bounds.top-1
   };
  });
  return {width:rect.width,height:rect.height,scrollHeight:rail.scrollHeight,
   background:getComputedStyle(document.querySelector('.rail')).backgroundColor,
   visible:nav.length,buttons};
 });
 assert.ok(compact.visible>=10,'expected all main navigation actions');
 assert.ok(compact.width<=80,'sidebar returns to compact original 76px: '+JSON.stringify(compact));
 assert.ok(compact.buttons.every(x=>x.h<=54&&x.icon>=26&&x.icon<=34),'premium rail pictograms must be compact: '+JSON.stringify(compact));
 assert.ok(compact.buttons.every(x=>x.svgCount===1),'old and new rail SVGs must never overlap: '+JSON.stringify(compact));
 assert.ok(compact.buttons.every(x=>x.labelFits),'long navigation labels must remain inside their own button: '+JSON.stringify(compact));
 assert.ok(compact.scrollHeight<=compact.height+30,'sidebar should fit standard desktop with minimal scrolling: '+JSON.stringify(compact));
 await page.screenshot({path:'artifacts/forma-main-atelier/main-studio-1366x768.png',fullPage:false});
 await page.setViewportSize({width:1680,height:960});
 await page.screenshot({path:'artifacts/forma-main-atelier/main-studio-desktop.png',fullPage:false});
 // Interaction must be unchanged: click navigation, still opens the real tool.
 const renderRail=page.locator('.rail-nav [data-nav="environment"]');
 assert.ok(await renderRail.isEnabled());
 // Ensure clicking a task in home has the original interactive handler.
 const settings=page.locator('#faStudioTool-materials');
 assert.ok(await settings.isEnabled());
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(500);
 const phone=await page.evaluate(()=>{
  const tasks=[...document.querySelectorAll('#formaStudioHome .fa-studio-task>svg.forma-premium-icon')]
   .map(icon=>({width:icon.getBoundingClientRect().width,height:icon.getBoundingClientRect().height,vis:getComputedStyle(icon).visibility}));
  return {tasks,screenWidth:window.innerWidth};
 });
 assert.equal(phone.tasks.length,9);
 assert.ok(phone.tasks.every(x=>x.width>=40&&x.height>=40&&x.vis==='visible'),JSON.stringify(phone));
 await page.screenshot({path:'artifacts/forma-main-atelier/main-studio-mobile.png',fullPage:false});
 assert.equal(browserErrors.filter(x=>x.includes('forma-main-atelier')||x.includes('forma-site-premium-icons')).length,0,
  'Premium main-page icons must produce no browser errors');
 console.log('FORMA MAIN PAGE ICON DESIGN QA PASS',JSON.stringify({desktop,phone}));
}finally{await browser.close()}
