import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1180,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:75000});
 await page.evaluate(async()=>{
  const T=await import('three');
  const {createVegetation}=await import('./forma-landscape-3d-vegetation.js');
  const {setFoliageTier}=await import('./forma-landscape-3d-foliage-lod.js');
  const shell=document.getElementById('shell');if(shell)shell.remove();
  document.body.style.cssText='margin:0;background:#d8e0db;overflow:hidden';
  const canvas=document.createElement('canvas');canvas.id='botanyReferenceCanvas';
  canvas.style.cssText='width:1100px;height:760px;display:block;margin:0 auto';
  document.body.append(canvas);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1100,760,false);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#d8e0db');
  const sun=new T.DirectionalLight(0xfff2dc,2.85);sun.position.set(-10,23,16);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;
  sun.shadow.camera.right=18;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-18;
  sun.shadow.normalBias=.03;sun.shadow.bias=-.0002;scene.add(sun);
  scene.add(new T.HemisphereLight(0xe5f0ff,0x777d65,2));
  const ground=new T.Mesh(new T.PlaneGeometry(50,50),
   new T.MeshStandardMaterial({color:'#93a77e',roughness:.94}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const camera=new T.PerspectiveCamera(37,1100/760,.1,200);
  let current=null;
  const render=(id,season='summer')=>{
   if(current){
    scene.remove(current);current.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){
     const materials=Array.isArray(n.material)?n.material:[n.material];
     for(const mat of materials)mat?.dispose?.();
    }});
   }
   const dimensions={
    birch:[16,6.8],oak:[15,9.4],spirea:[.85,1.3],pine:[14,7],spruce:[12,5],
    ash:[16,8],aspen:[18,6],fern:[.85,1.2],periwinkle:[.24,1.1],
    'wild-shrub':[1.7,1.9]
   };
   const [height,diameter]=dimensions[id]||[12,7];
   const model=createVegetation(T,{id:'reference-'+id,catalogId:id,height,diameter,variant:2},
    {season,quality:1,mode:'premium'});
   model.userData.botanicalMode='premium';setFoliageTier(model,'near');
   scene.add(model);current=model;
   camera.position.set(Math.max(.45,height*.60),Math.max(.70,height*.67),Math.max(1.8,height*1.32));
   camera.lookAt(0,height*.52,0);
   sun.shadow.camera.updateProjectionMatrix();
   renderer.render(scene,camera);
   const layerCounts={};model.traverse(node=>{
    if(node.userData.botanicalLayer){
     const key=node.userData.botanicalLayer;layerCounts[key]=(layerCounts[key]||0)+1;
    }
   });
   window.__botanyState={id,season,height,diameter,layerCounts,visibleLayers:[]};
   model.traverse(n=>{if(n.isMesh&&n.visible&&n.userData.botanicalLayer)
    window.__botanyState.visibleLayers.push(n.userData.botanicalLayer)});
   return window.__botanyState;
  };
  window.__renderBotanyRef=render;
  return render('birch','summer');
 });
 await mkdir('artifacts/landscape-editor',{recursive:true});
 const observations=[];
 for(const [id,season] of [
  ['birch','summer'],['oak','summer'],['spirea','summer'],
  ['birch','autumn'],['oak','autumn'],['spirea','autumn'],
  ['pine','summer'],['spruce','summer'],['ash','summer'],['aspen','summer'],
  ['fern','summer'],['periwinkle','summer'],['wild-shrub','summer'],
  ['ash','autumn'],['aspen','autumn']
 ]){
  const facts=await page.evaluate(({id,season})=>window.__renderBotanyRef(id,season),{id,season});
  assert.ok(facts.visibleLayers.includes('micro')&&facts.visibleLayers.includes('volume'),
   id+' must use genuine 3D instanced leaf and twig geometry near camera');
  assert.ok(facts.visibleLayers.includes('sprays'),id+' close-up blends genuine 3D leaves with attached photographic cutouts');
  assert.equal(facts.height,{birch:16,oak:15,spirea:.85,pine:14,spruce:12,ash:16,aspen:18,fern:.85,periwinkle:.24,'wild-shrub':1.7}[id]);
  assert.ok(facts.layerCounts.branches>=1);
  await page.locator('#botanyReferenceCanvas').screenshot({
   path:'artifacts/landscape-editor/botany-reference-'+id+'-'+season+'.png',timeout:30000});
  observations.push({id,season,layers:facts.layerCounts});
 }
 assert.deepEqual(errors,[],'no WebGL/Three.js runtime errors with fifteen high-resolution reference views');
 console.log('Premium reference botanical QA PASS:',JSON.stringify(observations));
}finally{await browser.close()}
