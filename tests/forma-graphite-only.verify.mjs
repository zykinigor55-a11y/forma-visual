import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const folder='artifacts/graphite-v3';
await mkdir(folder,{recursive:true});
const sites=[
 ['landscape-3d','forma-landscape-3d.html','#right',['#left','#right','#mobileWorkspaceTabs']],
 ['home','index.html','body',[]],
 ['studio','forma-preview.html','body',[]],
 ['tree-gallery','forma-tree-lineup.html','body',[]]
];
function rgb(s){const m=/rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(s);return m?m.slice(1,4).map(Number):null}
function greenCast(str){
 const val=rgb(str);return Boolean(val&&val[1]>val[0]+8&&val[1]>val[2]+5);
}
const failures=[];
try{
 const context=await browser.newContext({viewport:{width:430,height:870},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 for(const [id,route,selector,samples] of sites){
  await page.goto('http://127.0.0.1:3000/'+route,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>Array.from(document.styleSheets).some(x=>x.href?.includes('forma-graphite-only-v3.css')),{timeout:20000});
  if(id==='landscape-3d')await page.waitForFunction(()=>window.FORMA_3D_READY===true,{timeout:90000});
  const all=await page.evaluate(selectors=>{
   return selectors.map(sel=>{
    const e=document.querySelector(sel);
    if(!e)return {selector:sel,exists:false};
    const st=getComputedStyle(e);
    return {selector:sel,exists:true,background:st.backgroundColor,color:st.color,border:st.borderTopColor}
   });
  },[selector,...samples]);
  for(const row of all){
   assert.ok(row.exists,'missing '+id+' '+row.selector);
   assert.ok(!greenCast(row.background),'green background in '+id+' '+JSON.stringify(row));
  }
  if(id==='landscape-3d'){
   await page.locator('[data-mobile-panel="details"]').click();
   const data=await page.evaluate(()=>{
    const c=getComputedStyle(document.querySelector('#viewport'));
    const ui=getComputedStyle(document.querySelector('#right'));
    const tab=getComputedStyle(document.querySelector('#mobileWorkspaceTabs'));
    return {canvasFilter:c.filter,uiBackground:ui.backgroundColor,tabs:tab.backgroundColor};
   });
   assert.equal(data.canvasFilter,'none','real trees must remain unmodified');
   assert.ok(!greenCast(data.uiBackground),'details panel not graphite');
   assert.ok(!greenCast(data.tabs),'mobile tabs not graphite');
  }
  await page.screenshot({path:folder+'/'+id+'-mobile.png',timeout:30000}).catch(()=>{});
  console.log('GRAPHITE PAGE OK '+id+' '+JSON.stringify(all));
 }
}finally{await browser.close()}
assert.deepEqual(failures,[]);
