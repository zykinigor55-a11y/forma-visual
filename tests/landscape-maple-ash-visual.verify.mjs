import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='artifacts/landscape-editor/maple-ash';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']
});
try{
 const page=await browser.newPage({viewport:{width:1180,height:850},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:3000/forma-landscape-3d.html',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:90000});
 await page.evaluate(async()=>{
  const T=await import('three');
  const {createVegetation}=await import('./forma-landscape-3d-vegetation.js');
  const {setFoliageTier}=await import('./forma-landscape-3d-foliage-lod.js');
  const shell=document.querySelector('#shell');if(shell)shell.remove();
  document.body.style.cssText='margin:0;background:#e4e6e4;overflow:hidden';
  const canvas=document.createElement('canvas');
  canvas.id='species-qa-canvas';
  canvas.style.cssText='width:100%;height:100%;display:block';
  document.body.append(canvas);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#dce2de');
  scene.add(new T.HemisphereLight('#eaf4ff','#91947f',1.7));
  const sun=new T.DirectionalLight('#fff2dc',2.6);
  sun.position.set(-12,24,15);sun.castShadow=true;scene.add(sun);
  const ground=new T.Mesh(new T.PlaneGeometry(48,48),
   new T.MeshStandardMaterial({color:'#9bab91',roughness:.98}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const camera=new T.PerspectiveCamera(36,1,.1,200);
  let current=null;
  window.__renderSpecies=(id,angle=0)=>{
   if(current)scene.remove(current);
   const dimensions={ash:[16,8],maple:[13,8]};
   const [height,diameter]=dimensions[id];
   current=createVegetation(T,{id:'qa-'+id,catalogId:id,height,diameter,variant:2},
    {season:'summer',quality:1,mode:'premium'});
   setFoliageTier(current,'near');scene.add(current);
   const w=Math.max(360,innerWidth),h=Math.max(480,innerHeight);
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
   const distance=Math.max(26,height*1.95);
   camera.position.set(Math.sin(angle)*distance,height*.55+distance*.16,
    Math.cos(angle)*distance);
   camera.lookAt(0,height*.50,0);
   renderer.render(scene,camera);
   const nodes={};
   current.traverse(node=>{if(node.userData?.botanicalLayer){
    const k=node.userData.botanicalLayer;
    nodes[k]=(nodes[k]||0)+1;
   }});
   window.__speciesDetails={id,height,diameter,nodes};
   return window.__speciesDetails;
  };
  return window.__renderSpecies('ash',.6);
 });
 const ash=await page.evaluate(()=>window.__speciesDetails);
 assert.equal(ash.id,'ash');
 assert.equal(ash.height,16);
 for(const name of ['volume','micro','sprays','branches'])
  assert.ok(ash.nodes[name]>=1,'Ash retains '+name+' real botanical layers');
 await page.locator('#species-qa-canvas').screenshot({path:dir+'/ash-native-3d.png'});
 await page.evaluate(()=>window.__renderSpecies('ash',2.15));
 await page.locator('#species-qa-canvas').screenshot({path:dir+'/ash-native-back.png'});
 const nativeMaple=await page.evaluate(()=>window.__renderSpecies('maple',.65));
 assert.equal(nativeMaple.height,13);
 assert.ok(nativeMaple.nodes.volume>=1,'Maple fallback has real palmate 3D leaves');
 await page.locator('#species-qa-canvas').screenshot({path:dir+'/maple-native-fallback.png'});
 await page.setViewportSize({width:430,height:860});
 await page.evaluate(()=>window.__renderSpecies('ash',.75));
 await page.locator('#species-qa-canvas').screenshot({path:dir+'/ash-mobile.png'});
 assert.deepEqual(errors,[],'no WebGL runtime errors');

 const model=await browser.newPage({viewport:{width:1050,height:820},deviceScaleFactor:1});
 const errors2=[];model.on('pageerror',e=>errors2.push(String(e)));
 await model.goto('http://127.0.0.1:3000/forma-mature-trees-preview.html?species=maple',
  {waitUntil:'domcontentloaded',timeout:60000});
 await model.waitForFunction(()=>window.__treeReady===true||Boolean(window.__treeError),
  null,{timeout:90000});
 const m=await model.evaluate(()=>({info:window.__treeDetails,error:window.__treeError||null}));
 assert.equal(m.error,null,'original maple PBR GLB loads without replacing it');
 assert.equal(m.info.name,'maple');assert.ok(m.info.meshes>1);
 assert.ok(m.info.textures>0);
 await model.evaluate(()=>window.__treeView(.65,.16));
 await model.screenshot({path:dir+'/maple-original-glb.png'});
 assert.deepEqual(errors2,[]);
 console.log('FORMA MAPLE + ASH 3D GLB + PROCEDURAL MOBILE QA PASSED');
}finally{await browser.close()}
