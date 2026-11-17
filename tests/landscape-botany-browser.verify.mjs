import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1540,height:950},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:45000});
 const metrics=await page.evaluate(async()=>{
  const T=await import('three'),{createVegetation}=await import('./forma-landscape-3d-vegetation.js');
  const species=['pine','spruce','birch','oak','willow','juniper','hydrangea','lavender'];
  return species.map((id,i)=>{
   const shrub=i>=5,height=shrub?1.4:14,diameter=shrub?2:6;
   const model=createVegetation(T,{id:'qa-'+id,catalogId:id,height,diameter},{season:'summer',quality:.28});
   model.updateMatrixWorld(true);
   const meshes=[];model.traverse(n=>{if(n.isMesh)meshes.push(n)});
   const out={species:id,meshes:meshes.length,instanced:meshes.filter(m=>m.isInstancedMesh).length,height:model.userData.physicalHeight,diameter:model.userData.crownDiameter};
   model.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material?.dispose)n.material.dispose()});
   return out;
  });
 });
 assert.ok(metrics.every(m=>m.meshes>=2&&m.instanced>=2),'Every species must be real instanced 3D branches and foliage: '+JSON.stringify(metrics));
 assert.ok(metrics.every(m=>m.height>0&&m.diameter>0));
 const project=await page.evaluate(async()=>{
  const key='forma-landscape-masterplan-v1-landscape',stored=JSON.parse(localStorage.getItem(key)||'null');
  const {freshProject}=await import('./forma-landscape-project-core.js');
  const p=stored||freshProject();
  p.site={width:58,height:50,orientation:0,boundary:null};p.house={...p.house,x:29,y:11,width:10,height:7};
  const items=[['pine',7,35,14,7],['spruce',16,35,12,5],['birch',26,35,16,6],['oak',36,35,17,8],['willow',47,35,11,8],
   ['juniper',9,21,.55,1.8],['hydrangea',19,21,1.55,1.6],['spirea',29,21,.85,1.2],['barberry',39,21,1.15,1.4],['lavender',49,21,.55,.8]];
  p.objects=items.map(([id,x,y,h,d],i)=>({id:'flora-'+i,catalogId:id,type:i<5?'trees':'shrubs',x,y,height:h,diameter:d,rotation:0}));
  localStorage.setItem(key,JSON.stringify(p));return p;
 });
 assert.equal(project.objects.length,10);
 await page.reload({waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('3D-конструктор готов'),null,{timeout:50000});
 await page.locator('[data-view="3d"]').click();
 await mkdir('artifacts/landscape-editor',{recursive:true});
 await page.screenshot({path:'artifacts/landscape-editor/botanical-ten-species-3d.png'});
 await page.locator('[data-view="2d"]').click();
 await page.screenshot({path:'artifacts/landscape-editor/botanical-ten-species-nadir.png'});
 assert.deepEqual(errors,[],'Botanical generation must not cause browser exceptions');
 console.log('3D botanical species PASS',JSON.stringify(metrics));
}finally{await browser.close()}
