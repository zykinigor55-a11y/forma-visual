import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:100000});
 const icons=await page.locator('#tools [data-tool]').count();
 assert.equal(icons,14,'all 14 interactive tools must appear in left sidebar');
 const seen=await page.locator('#tools [data-tool]').evaluateAll(buttons=>buttons.map(button=>{
  const span=button.querySelector('.glyph'),svg=span?.querySelector('svg');
  const bounds=svg?.getBoundingClientRect();
  const style=svg?getComputedStyle(svg):null;
  return {tool:button.dataset.tool,svg:!!svg,paths:svg?.querySelectorAll('path,rect,circle,ellipse').length||0,
   width:bounds?.width||0,height:bounds?.height||0,visible:style?.visibility,opacity:style?.opacity,
   id:svg?.querySelector('linearGradient')?.id||null};
 }));
 assert.ok(seen.every(i=>i.svg&&i.paths>2&&i.width>=27&&i.height>=27&&i.visible==='visible'&&Number(i.opacity)===1),'Every tool icon must be visible on desktop: '+JSON.stringify(seen));
 assert.equal(new Set(seen.map(x=>x.id)).size,14,'No conflicting shared SVG gradient IDs');
 await page.screenshot({path:'artifacts/landscape-editor/forma-atelier-icons-desktop.png',timeout:20000});
 await page.locator('[data-tool="plant"]').click();
 assert.ok(await page.locator('#library [data-item="pine"]').isVisible(),'Plant icon activates real planting tools');
 await page.locator('[data-tool="select"]').click();
 assert.equal(await page.locator('[data-tool="select"]').getAttribute('class')?.then(c=>c.includes('active')),true);
 await page.setViewportSize({width:430,height:850});
 const mobile=await page.locator('#tools [data-tool]').first().evaluate(b=>{const r=b.querySelector('svg').getBoundingClientRect();return [r.width,r.height]});
 assert.ok(mobile[0]>=27&&mobile[1]>=27,'Responsive SVG icons remain visible on phone');
 await page.screenshot({path:'artifacts/landscape-editor/forma-atelier-icons-mobile.png',timeout:20000});
 assert.deepEqual(errors,[],'No JS errors after switching tools');
 console.log('FORMA PREMIUM SVG ICONS PASS',JSON.stringify(seen));
}finally{await browser.close()}
