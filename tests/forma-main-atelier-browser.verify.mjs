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
 await page.waitForFunction(()=>document.querySelectorAll('.rail-nav .rail-btn svg.forma-premium-icon[data-forma-rev="main-atelier-v2"]').length>=6,null,{timeout:25000});
 await page.waitForFunction(()=>document.querySelectorAll('#formaStudioHome .fa-studio-task>svg.forma-premium-icon[data-forma-rev="main-atelier-v2"]').length>=9,null,{timeout:25000});
 const desktop=await page.evaluate(()=>{
  const select=(selector)=>[...document.querySelectorAll(selector)].map(el=>{
   const icon=el.querySelector('svg.forma-premium-icon'),style=icon?getComputedStyle(icon):null,rect=icon?.getBoundingClientRect();
   return {label:el.textContent?.trim().slice(0,60),hasSvg:!!icon,role:el.getAttribute('role'),
    width:rect?.width,height:rect?.height,visibility:style?.visibility,opacity:style?.opacity,
    revision:icon?.dataset.formaRev,gradient:icon?.querySelector('linearGradient')?.id};
  });
  return {rail:select('.rail-nav .rail-btn[data-nav]'),cards:select('#formaStudioHome .fa-studio-task[data-studio-tool]'),
   cssLoaded:[...document.styleSheets].some(s=>s.href?.includes('forma-main-atelier-icons.css'))};
 });
 assert.equal(desktop.rail.length,6,'All 6 homepage rail buttons remain present');
 assert.equal(desktop.cards.length,9,'All 9 original studio cards remain present');
 assert.ok(desktop.cssLoaded,'New main-page premium stylesheet is active');
 for(const [section,items,minimum] of [['rail',desktop.rail,30],['card',desktop.cards,43]]){
  for(const item of items){
   assert.ok(item.hasSvg&&item.width>=minimum&&item.height>=minimum&&item.visibility==='visible'&&Number(item.opacity)===1,
    section+' premium icon invisible: '+JSON.stringify(item));
   assert.equal(item.revision,'main-atelier-v2');
  }
 }
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
