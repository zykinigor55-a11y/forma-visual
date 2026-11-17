import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('artifacts/landscape-editor',{recursive:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:412,height:915}:{width:1600,height:1000},hasTouch:mobile,isMobile:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3000');
  await page.waitForFunction(()=>window.FORMA_LANDSCAPE_PROJECT);
  await page.evaluate(()=>window.FORMA_LANDSCAPE_PROJECT.open());
  await page.locator('#lpSvg').waitFor();
  if(mobile){
    // Regression: the road/pond material panels must not collapse the drawing
    // into a few pixels when switching modes on an Android-sized viewport.
    const canvasMetrics=()=>page.evaluate(()=>{
      const layout=document.querySelector('#faLandscapeMasterplan .lp-layout');
      const canvas=document.querySelector('#faLandscapeMasterplan .lp-canvas');
      const svg=document.querySelector('#lpSvg');
      const a=canvas.getBoundingClientRect(),b=layout.getBoundingClientRect(),v=svg.getBoundingClientRect();
      return {height:a.height,width:a.width,top:a.top-b.top+layout.scrollTop,
              svgHeight:v.height,canvasOrder:getComputedStyle(canvas).order,
              panelsOrder:getComputedStyle(document.querySelector('.lp-path-controls')).order};
    });
    const initial=await canvasMetrics();
    assert.ok(initial.height>=320, 'Map must be at least 320px high on mobile');
    assert.ok(initial.svgHeight>=320,'Actual SVG must not collapse on mobile');
    assert.equal(initial.canvasOrder,'2','Map must precede expandable tool palettes');
    assert.equal(initial.panelsOrder,'3','Expandable palettes must follow the fixed map');
    for(const step of [
      ['[data-tool="path"]','path'],
      ['[data-quick-category="ponds"]','pond'],
      ['[data-area-tool="brush"]','brush'],
      ['[data-area-tool="polygon"]','lasso'],
      ['[data-quick-category="lawns"]','lawn'],
      ['[data-quick-category="pavers"]','paving']
    ]){
      await page.locator(step[0]).click();
      const after=await canvasMetrics();
      assert.ok(Math.abs(after.height-initial.height)<2,step[1]+': canvas changed height');
      assert.ok(Math.abs(after.top-initial.top)<2,step[1]+': canvas was pushed down by controls');
      assert.ok(after.svgHeight>=320,step[1]+': map content collapsed');
    }
    await page.evaluate(()=>document.querySelector('#faLandscapeMasterplan .lp-layout').scrollTop=0);
    await page.screenshot({path:'artifacts/landscape-editor/mobile-fixed-map-pavers.png',fullPage:false});
    await page.locator('[data-quick-category="ponds"]').click();
    await page.evaluate(()=>document.querySelector('#faLandscapeMasterplan .lp-layout').scrollTop=0);
    await page.screenshot({path:'artifacts/landscape-editor/mobile-fixed-map-ponds.png',fullPage:false});
  }
  const pos=async(x,y)=>page.evaluate(({x,y})=>{const s=document.querySelector('#lpSvg'),p=s.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y}},{x,y});
  const tap=async(x,y)=>{const p=await pos(x,y);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y)};
  const model=()=>page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('forma-landscape-masterplan-v1-')))));
  await page.locator('[data-tool="path"]').click();
  await page.locator('[data-path-shape="diagonal"]').click();
  assert.equal(await page.locator('[data-path-shape="diagonal"]').getAttribute('aria-pressed'),'true');
  await tap(5,26);await tap(13,33);await page.locator('#lpFinish').click();
  let doc=await model();assert.equal(doc.objects.length,1);
  const [a,b]=doc.objects[0].points;assert.ok(Math.abs((b.x-a.x)-(b.y-a.y))<1e-6);
  await page.locator('button[data-delete]').first().click();assert.equal((await model()).objects.length,0);
  await page.locator('[data-quick-category="trees"]').click();await page.locator('[data-asset="pine"]').click();
  await tap(6,28);assert.equal(await page.locator('[data-tool="select"]').getAttribute('class'),'active');
  // Mouse drag exercises the same pointer handlers as touch drag; tap placement above uses actual touch on mobile.
  const start=await pos(6,28),end=await pos(9,31);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:6});await page.mouse.up();
  doc=await model();assert.ok(Math.abs(doc.objects[0].x-9)<.1);assert.ok(Math.abs(doc.objects[0].y-31)<.1);
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}.png`,fullPage:true});
  await page.keyboard.press('Delete');assert.equal((await model()).objects.length,0);
  await page.keyboard.press('Control+z');assert.equal((await model()).objects.length,1);
  // The overlay must remain hidden until the user starts a render.
  assert.equal(await page.locator('#lpRenderOverlay').isVisible(),false);
  await page.locator('[data-category="lawns"]').click();
  await page.locator('[data-asset="formal"] img').waitFor({state:'visible'});
  await page.waitForFunction(()=>{const img=document.querySelector('[data-asset="formal"] img');return !!img&&img.complete&&img.naturalWidth===1080&&img.getAttribute('src')?.includes('formal.');},null,{timeout:30000});
  const photo=await page.locator('[data-asset="formal"] img').evaluate(img=>({src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight}));
  console.log('Lawn preview URL:',photo.src);
  const diagnostics=await page.evaluate(async()=>{const r=await fetch('/assets/landscape-photo/formal.jpg',{method:'HEAD'});const x=await import('./forma-landscape-project-graphics.js?v=photo-light-pond-v6');return {head:r.status,mime:r.headers.get('content-type'),photoCount:x.photographicAssetCount(),source:x.photographicIconURL({id:'formal'})};});
  console.log('Photo asset diagnostics:',JSON.stringify(diagnostics));
  assert.ok(photo.src.includes('/assets/landscape-photo/formal.jpg?'),photo.src);
  assert.equal(photo.width,1080);assert.equal(photo.height,1080);
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}-lawns.png`,fullPage:true});
  // Premium photo previews must display actual photo JPG while the measured plan
  // continues using top-down PNG. Run on desktop and on touch Android emulation.
  await page.locator('[data-category="lights"]').click();
  await page.waitForFunction(()=>{const i=document.querySelector('[data-asset="bollard"] img');return !!i&&i.complete&&i.naturalWidth===1080&&i.currentSrc.includes('/landscape-card-photo/bollard.jpg?');},null,{timeout:30000});
  assert.equal(await page.locator('[data-asset="bollard"]').getAttribute('data-photo-ready'),'true');
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}-premium-light.png`,fullPage:true});
  await page.locator('[data-category="ponds"]').click();
  await page.waitForFunction(()=>{const i=document.querySelector('[data-asset="natural"] img');return !!i&&i.complete&&i.naturalWidth===1080&&i.currentSrc.includes('/landscape-card-photo/natural.jpg?');},null,{timeout:30000});
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}-premium-pond.png`,fullPage:true});
  await page.locator('[data-category="boulders"]').click();
  await page.waitForFunction(()=>{const i=document.querySelector('[data-asset="granite-boulder"] img');return !!i&&i.complete&&i.naturalWidth===1080&&i.currentSrc.includes('/landscape-card-photo/granite-boulder.jpg?');},null,{timeout:30000});
  assert.equal((await model()).objects.length,2,'Choosing lawn should add precisely one complete coverage while preserving existing placements');
   assert.equal((await model()).objects.filter(o=>o.type==='lawns'&&o.autoFill===true).length,1);

  // Never make a paid call in CI: replace the queue client with a local fake.
  await page.evaluate(()=>{window.FORMA_RENDER_QUEUE={fetch:async(_url,options)=>{await new Promise(r=>setTimeout(r,500));const input=JSON.parse(options.body).image;return new Response(JSON.stringify({
    images:[input.split(',')[1]],mimes:['image/png']
  }),{status:200,headers:{'Content-Type':'application/json'}});}}});
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#lpAi').click();
  await page.locator('#lpRenderOverlay').waitFor({state:'visible'});
  await page.waitForFunction(()=>['success','error'].includes(document.querySelector('#lpRenderOverlay')?.dataset.stage),{timeout:30000});
  assert.equal(await page.locator('#lpRenderOverlay').getAttribute('data-stage'),'success');
  assert.equal(await page.locator('#lpRenderOutputImage').isVisible(),true);
  await page.screenshot({path:`artifacts/landscape-editor/${mobile?'mobile':'desktop'}-render-popup.png`,fullPage:true});
  await page.locator('[data-render-close]').click();
  assert.equal(await page.locator('#lpRenderOverlay').isVisible(),false);
  assert.deepEqual(errors,[]);console.log(mobile?'Mobile PASS':'Desktop PASS');await page.close();
 }
}finally{await browser.close()}
