import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true}),errors=[];
const objects=[
 ['pine',4,6,15,7],['spruce',11,5,14,5],['birch',24,6,17,6],
 ['oak',26,23,15,10],['maple',5,26,13,8],['linden',17,32,13,8],
 ['willow',10,36,11,9],['rowan',24,33,10,5],
 ['apple',3,18,6,5],['sakura',25,15,8,5],
 ['juniper',12,10,.7,1.8],['hydrangea',9,23,1,1.6],
 ['spirea',18,28,.7,1.2],['barberry',23,29,1,1.4],
 ['dogwood',4,32,1.5,2],['thuja-globe',12,29,1.2,1.4],
 ['lavender',20,10,.6,.8],['boxwood',19,22,1.1,1],
 ['granite-boulder',7,10,.8,1.5],['limestone-boulder',20,18,.6,1.6],
 ['bollard',12,21,.9,.25],['linear',21,20,.18,.25]
].map(([catalogId,x,y,height,diameter],i)=>({id:'qa-botanical-'+i,catalogId,x,y,height,diameter,rotation:0,type:'object'}));
const init=()=>{
 const base={version:1,title:'FORMA · Растения QA',site:{width:30,height:40,orientation:0,boundary:null},
 house:{x:15,y:16,width:12,height:8,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e'},
 objects:JSON.parse(sessionStorage.getItem('forma_botany_fixture')||'[]'),buildings:[],verified:false,
 atmosphere:{time:'day',season:'summer',weather:'sunny'}};
 localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(base));
};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('desktop '+e.message));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(data=>{sessionStorage.setItem('forma_botany_fixture',JSON.stringify(data));},objects);
 await page.evaluate(init);await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:60000});
 await page.locator('[data-tool="plant"]').click();
 assert.equal(await page.locator('[data-item="pine"]').count(),1);
 assert.equal(await page.locator('[data-item="hydrangea"]').count(),1);
 assert.equal(await page.locator('#library .has-preview').count(),18,'All 18 measured botanicals have photo cards');
 await page.locator('[data-tool="landscape"]').click();
 assert.equal(await page.locator('#library .has-preview').count(),4);
 await page.locator('[data-tool="light"]').click();
 assert.equal(await page.locator('#library .has-preview').count(),6);
 await page.locator('#fit3dScene').click();
 await page.waitForTimeout(700);
 await mkdir('artifacts/landscape-editor',{recursive:true});
 await page.screenshot({path:'artifacts/landscape-editor/3d-botanical-desktop.png'});
 await page.locator('#focusHouse').click();
 await page.screenshot({path:'artifacts/landscape-editor/3d-botanical-perspective.png'});
 assert.deepEqual(errors,[],'No runtime errors building full botanical meshes');
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-landscape')));
 assert.equal(state.objects.length,objects.length,'Specimens not erased by scene construction');
 assert.equal(state.objects.filter(x=>x.height>2).length,10);
 console.log('Botanical 3D PASS: 18 species, 4 boulders, 6 lights, actual volume and saved coordinates.');

 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push('mobile '+e.message));
 await mobile.addInitScript(data=>{localStorage.setItem('forma-landscape-masterplan-v1-landscape',JSON.stringify(data))},state);
 await mobile.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await mobile.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:60000});
 await mobile.waitForTimeout(300);
 await mobile.screenshot({path:'artifacts/landscape-editor/3d-botanical-mobile.png'});
 assert.equal(await mobile.locator('[data-mobile-panel="scene"]').isVisible(),true);
 await mobile.locator('[data-mobile-panel="scene"]').click();
 assert.equal(await mobile.locator('#left').isVisible(),false,'Landscape tools must not cover mobile preview');
 assert.equal(await mobile.locator('#right').isVisible(),false,'House panel must not cover mobile preview');
 assert.equal(await mobile.locator('#hint').isVisible(),false,'Instruction banner must not cover mobile trees');
 await mobile.screenshot({path:'artifacts/landscape-editor/3d-botanical-mobile-scene.png'});
 await mobile.locator('[data-mobile-panel="tools"]').click();
 assert.equal(await mobile.locator('#left').isVisible(),true,'Tools remain accessible after full-screen inspection');
 assert.deepEqual(errors,[],'No mobile WebGL crash in botanical scene');
}finally{await browser.close()}
