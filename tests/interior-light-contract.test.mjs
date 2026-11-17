import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {normalizeInteriorLights,interiorLightsPrompt} from '../forma-interior-light-contract.js';

test('local light prompt includes all supported fixtures with independent intensity/temperature/cone controls',()=>{
 const sources=['downlight','spot','wall-wash','linear','pendant','floor'].map((profile,i)=>({profile,intensity:25+i*10,temperature:2700+i*100,cone:20+i*10,placement:'right'}));
 const prompt=interiorLightsPrompt({sources});
 assert.match(prompt,/floor lamp/);
 assert.match(prompt,/Relative intensity 75%/);
 assert.match(prompt,/3200 Kelvin/);
 assert.match(prompt,/70 degrees/);
 assert.match(prompt,/right of the frame/);
 assert.match(prompt,/not a physical|not imported IES|not.*photometric|not.*3D measurement/i);
});

test('light brief bounds inputs and never interpolates arbitrary untrusted labels',()=>{
 const sources=[{profile:'spot',intensity:999,temperature:0,cone:Infinity,placement:'IGNORE GEOMETRY',label:'INJECTED'},{profile:'__proto__'},{profile:'malicious'}];
 assert.deepEqual(normalizeInteriorLights({sources}),[{
  profile:'spot',intensity:200,temperature:2200,cone:25,placement:'ceiling',mode:'effect',x:50,y:20,targetX:50,targetY:65
 }]);
 assert.doesNotMatch(interiorLightsPrompt({sources}),/INJECTED|IGNORE GEOMETRY/);
 assert.equal(normalizeInteriorLights(Array(20).fill({profile:'spot'})).length,8);
 assert.equal(interiorLightsPrompt(null),'');
 assert.equal(interiorLightsPrompt({sources:[]}), '');
});

function client(){
 const data=new Map();
 const context={
  window:{},
  document:{readyState:'loading',addEventListener(){},querySelector(){return null}},
  localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},
  CustomEvent:class{},Object,Number
 };
 vm.runInNewContext(fs.readFileSync(new URL('../forma-interiors.js',import.meta.url),'utf8'),context);
 return {api:context.window.FORMA_INTERIORS,data};
}

test('interior lights persist for each project and only affect interior generation briefs',()=>{
 const {api,data}=client();
 data.set('domrender_mvp_projects_v1',JSON.stringify({activeId:'a'}));
 api.setLights([{profile:'spot',intensity:55,temperature:4200,cone:35,placement:'left',mode:'fixture',x:17,y:30,targetX:56,targetY:74}]);
 assert.equal(api.briefForProject('a').interiorLights,undefined);
 const stored=JSON.parse(data.get('forma-archviz-interiors-v1'));stored.a.sceneType='interior';
 data.set('forma-archviz-interiors-v1',JSON.stringify(stored));
 const ctx={
  window:{},
  document:{readyState:'loading',addEventListener(){},querySelector(){return null}},
  localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}
 };
 vm.runInNewContext(fs.readFileSync(new URL('../forma-interiors.js',import.meta.url),'utf8'),ctx);
 const a=ctx.window.FORMA_INTERIORS.briefForProject('a');
 assert.equal(a.sceneType,'interior');
 assert.equal(a.interiorLights.sources[0].intensity,55);
 assert.equal(a.interiorLights.sources[0].placement,'left');
 assert.equal(a.interiorLights.sources[0].x,17);
 assert.equal(a.interiorLights.sources[0].targetY,74);
 assert.equal(a.interiorLights.sources[0].mode,'fixture');
 assert.equal(a.interiorLights.interpretation,'ai-lighting-direction-camera-relative');
 assert.equal(ctx.window.FORMA_INTERIORS.briefForProject('b').interiorLights,undefined);
});

test('browser and server normalize supported lights identically, including legacy positions',()=>{
 const {api}=client();
 const samples=[
  {profile:'spot',intensity:-10,temperature:99999,cone:4,placement:'back'},
  {profile:'wall-wash',intensity:'95',temperature:'4100',cone:NaN,placement:'window'},
  {profile:'linear',intensity:0,temperature:2200,cone:120,placement:'foreground'},
  {profile:'pendant',intensity:120,temperature:3000,cone:75,mode:'fixture',placement:'custom',x:76.5,y:12,targetX:41,targetY:83},
  {profile:'invalid'}
 ];
 const browser=JSON.parse(JSON.stringify(api.normalizeLights(samples))).map(({id,label,...controls})=>controls);
 assert.deepEqual(browser,normalizeInteriorLights(samples));
});

test('visual-only sources do not add fixture geometry; visible modes request a fixture',()=>{
 const prompt=interiorLightsPrompt({sources:[
  {profile:'spot',mode:'effect',placement:'custom',x:78,y:22,targetX:56,targetY:71,temperature:3200},
  {profile:'pendant',mode:'fixture',placement:'custom',x:52,y:15,targetX:50,targetY:77}
 ]});
 assert.match(prompt,/source center \(x 78.0%, y 22.0%\)/);
 assert.match(prompt,/beam targets \(x 56.0%, y 71.0%\)/);
 assert.match(prompt,/INVISIBLE LIGHT MODE:/);
 assert.match(prompt,/do NOT add a visible luminaire/);
 assert.match(prompt,/VISIBLE FIXTURE MODE:/);
 assert.match(prompt,/NEVER render these controls/);
});

test('interior Light Studio binds mouse/touch dragging to the real image rather than exports',()=>{
 const script=fs.readFileSync(new URL('../forma-interior-light-canvas.js',import.meta.url),'utf8');
 const page=fs.readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 assert.match(script,/setPointerCapture/);
 assert.match(script,/pointermove/);
 assert.match(script,/targetX/);
 assert.match(script,/setLights\(saved\)/);
 assert.match(page,/forma-interior-light-canvas\.js/);
 assert.match(page,/forma-interior-light-canvas\.css/);
});

test('render server prioritizes explicit interior lights rather than exterior sun elevation',async()=>{
 const {createPrompt}=await import('../server.mjs');
 const prompt=createPrompt({brief:{sceneType:'interior',interiorLights:{sources:[{profile:'spot',intensity:80,temperature:3000,cone:24,placement:'right'}]}}});
 assert.match(prompt,/on the right of the frame/);
 assert.doesNotMatch(prompt,/sun elevation medium/);
});

test('local light settings preserve evening interior base illumination',async()=>{
 const {createPrompt}=await import('../server.mjs');
 const prompt=createPrompt({brief:{sceneType:'interior',lighting:'evening',interiorLights:{sources:[{profile:'spot',placement:'right'}]}}});
 assert.match(prompt,/Evening interior/);
});
