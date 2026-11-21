import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base='http://127.0.0.1:3000';
const out='assets/landscape-screenshots';
const expectedSha='3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c';
const keys=['fern','fern-02','fern-03','fern-04'];
const names=['fern_02_a','fern_02_b','fern_02_c','fern_02_d'];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
const proof={source:'Actual CC0 Poly Haven Fern 02 GLB in REAL original DOM.RENDER WebGL 3D editor',sha256:expectedSha,original:'https://polyhaven.com/a/fern_02',fourDistinctMeshNames:names,siteObjects:[],screenshots:[],browserErrors:[],timestamp:new Date().toISOString()};
try{
 const context=await browser.newContext({viewport:{width:1600,height:940},deviceScaleFactor:1,locale:'ru-RU',colorScheme:'dark'});
 const page=await context.newPage();
 page.setDefaultTimeout(30000);
 page.on('pageerror',e=>proof.browserErrors.push('pageerror: '+e.message));
 const objects=keys.map((k,i)=>({
   id:'fern-polyhaven-'+(i+1),
   catalogId:k,type:'shrubs',x:9.4+i*3.1,y:15.5+(i%2)*.45,
   height:[.29,.43,.35,.22][i],diameter:[.62,1,.88,.6][i],rotation:0,variant:1
 }));
 await page.addInitScript((preload)=>{
  if(!location.pathname.endsWith('/forma-landscape-3d.html'))return;
  const project={
    version:1,title:'FORMA · 4 самостоятельных папоротника Fern 02 (CC0)',
    site:{width:30,height:26,orientation:0,boundary:null},
    house:{x:3,y:3,width:4,height:4,rotation:0,type:'house',roof:'gable',roofColor:'#393c3e',ridge:0,entry:'south',photo:null},
    objects:preload,buildings:[],underlay:null,underlayOpacity:.25,north:0,verified:false,style:'natural',
    atmosphere:{time:'day',season:'summer',weather:'sunny'}
  };
  localStorage.setItem('domrender_mvp_projects_v1',JSON.stringify({activeId:'polyhaven-ferns-test'}));
  localStorage.setItem('forma-landscape-masterplan-v1-polyhaven-ferns-test',JSON.stringify(project));
 },objects);
 const res=await page.goto(base+'/forma-landscape-3d.html',{waitUntil:'domcontentloaded',timeout:75000});
 if(res?.status()!==200)throw Error('DOM.RENDER editor failed HTTP '+res?.status());
 await page.waitForFunction(()=>window.FORMA_3D_READY===true,null,{timeout:105000});
 await page.waitForFunction((expected)=>{
  const rows=window.FORMA_SHRUB_MODEL_DIAGNOSTICS?.()||[];
  return expected.every(id=>rows.some(r=>r.species===id&&r.status==='glb'));
 },keys,{timeout:150000});
 const diagnostics=await page.evaluate(()=>window.FORMA_SHRUB_MODEL_DIAGNOSTICS());
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('forma-landscape-masterplan-v1-polyhaven-ferns-test')||'{}').objects||[]);
 if(!keys.every(id=>stored.some(o=>o.catalogId===id)))throw Error('Not all four ferns planted in native app');
 const digest=await page.evaluate(async()=>{
  const response=await fetch('/assets/landscape-models/polyhaven-fern-02-source.glb');
  if(!response.ok)throw Error('Fern GLB response '+response.status);
  const hash=await crypto.subtle.digest('SHA-256',await response.arrayBuffer());
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
 });
 if(digest!==expectedSha)throw Error('GLB binary differs from licensed original '+digest);
 const webgl=await page.evaluate(()=>{const c=document.querySelector('#viewport');return {valid:!!(c?.getContext('webgl2')||c?.getContext('webgl')),width:c?.width,height:c?.height}});
 if(!webgl.valid)throw Error('No live native WebGL context');
 await page.waitForTimeout(2000);
 const sceneImage=path.join(out,'polyhaven-four-ferns-real-editor.png');
 await page.screenshot({path:sceneImage,animations:'disabled'});
 if((await fs.stat(sceneImage)).size<90000)throw Error('Suspiciously small native editor screenshot');
 proof.editorScreenshot=sceneImage;
 proof.webgl=webgl;proof.diagnostics=diagnostics;proof.siteObjects=stored.filter(o=>keys.includes(o.catalogId));
 console.log('Verified 4 separate GLB originals in real app',JSON.stringify(proof.diagnostics));
 for(let i=0;i<4;i++){
  const part=String(i+1).padStart(2,'0');
  const url=base+'/forma-polyhaven-fern-studio.html?part='+part;
  const renderPage=await context.newPage();
  renderPage.on('pageerror',e=>proof.browserErrors.push('studio: '+e.message));
  const response=await renderPage.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
  if(response?.status()!==200)throw Error('Studio viewer '+part+' missing');
  await renderPage.waitForFunction(()=>window.__FORMA_POLYHAVEN_FERN_READY__||window.__FORMA_POLYHAVEN_FERN_ERROR__,null,{timeout:100000});
  const state=await renderPage.evaluate(()=>({ready:window.__FORMA_POLYHAVEN_FERN_READY__,error:window.__FORMA_POLYHAVEN_FERN_ERROR__}));
  if(state.error||state.ready?.name!==names[i]||state.ready.texturedMaterials<1)throw Error('Model '+part+' not real PBR mesh: '+JSON.stringify(state));
  const image=path.join(out,'polyhaven-fern-'+part+'-real-glb-grey.png');
  await renderPage.screenshot({path:image,animations:'disabled',timeout:90000});
  const size=(await fs.stat(image)).size;
  if(size<40000)throw Error('Studio screenshot suspiciously small '+part);
  proof.screenshots.push({part,catalogId:keys[i],path:image,bytes:size,meshName:state.ready.name,dimensions:[state.ready.width,state.ready.height,state.ready.depth],texturedMaterials:state.ready.texturedMaterials});
  await renderPage.close();
 }
 if(proof.browserErrors.length)console.warn('Browser warnings',proof.browserErrors);
 await fs.writeFile(path.join(out,'polyhaven-fern-four-webgl-evidence.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('Four REAL PBR fern preview screenshots and app screenshot captured',proof.screenshots.map(x=>x.path));
}finally{await browser.close();}
