import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PLAN_2D_STYLES,normalizeImageTask,imageTaskPrompt,assertRoomReady} from '../forma-image-workflows.js';
import {normalizeLandscape,landscapePrompt} from '../forma-art-direction-core.js';
import {customAssetKey,validateCustomFile,cleanCustomName,CUSTOM_FILE_LIMIT} from '../forma-landscape-custom-assets.js';
import {apiMarketEdit} from '../api-market.mjs';

test('five selected 2D styles share exact original plan geometry lock',()=>{
 assert.equal(Object.keys(PLAN_2D_STYLES).length,5);
 const prompts=new Set();
 for(const planStyle of Object.keys(PLAN_2D_STYLES)){
  const p=imageTaskPrompt({kind:'plan2d',planStyle,notes:''});
  assert.match(p,/STRICT ORTHOGRAPHIC NADIR 2D PLAN/);
  assert.match(p,/Do not rotate, crop differently, tilt, change scale/);
  assert.match(p,/No geometry additions, no new balconies/);
  prompts.add(p);
 }
 assert.equal(prompts.size,5);
 assert.throws(()=>normalizeImageTask({kind:'plan2d',planStyle:'unknown'}),/2D-стилистика/);
});

test('plan and room generation cannot be switched to Nano Banana from browser',()=>{
 for(const task of [
  {kind:'plan2d',planStyle:'technical',engine:'nano-banana-2.1'},
  {kind:'plan',presentation:'axon',engine:'nano-banana-2.1'},
  {kind:'room',room:{x:.1,y:.2,w:.3,h:.4},direction:'north',engine:'nano-banana-2.1'}
 ])assert.equal(normalizeImageTask(task).engine,'gpt-image-2.6-sunburst');
 assert.match(imageTaskPrompt({kind:'room',room:{x:.2,y:.2,w:.35,h:.35},direction:'east'}),/Image 1 is the APPROVED 3D/);
 assert.match(imageTaskPrompt({kind:'room',room:{x:.2,y:.2,w:.35,h:.35},direction:'east'}),/Image 2 is a MARKED COPY/);
 assert.throws(()=>assertRoomReady({planResult:'image',planApproved:true,roomSelected:true,source:'old',viewImage:'old'}),/3D-плане/);
 assert.doesNotThrow(()=>assertRoomReady({planResult:'image',planApproved:true,roomSelected:true,viewImage:'image'}));
});

test('API Market GPT Image 2.6 edit explicitly requests 2K and native high quality',async()=>{
 const bytes=Buffer.alloc(120);bytes.set([137,80,78,71,13,10,26,10]);
 const source=new Blob([bytes],{type:'image/png'}),image=bytes.toString('base64');
 const observed=[];
 const fetchImpl=async(url,opts)=>{
  const fd=opts.body;
  observed.push({url,model:fd.get('model'),resolution:fd.get('resolution'),size:fd.get('size'),quality:fd.get('quality'),image:fd.get('image')||fd.get('image[]'),header:opts.headers.Authorization});
  return new Response(JSON.stringify({data:[{b64_json:image}]}),{status:200,headers:{'content-type':'application/json'}});
 };
 const first=await apiMarketEdit({apiKey:'test-server-only',source,prompt:'Test',model:'gpt-image-2.6-sunburst',fetchImpl});
 assert.equal(first.mimeType,'image/png');
 assert.equal(observed[0].resolution,'2K');
 assert.equal(observed[0].size,'auto');
 assert.equal(observed[0].quality,'high');
 assert.ok(observed[0].image);
 assert.equal(observed[0].header,'Bearer test-server-only');
 await apiMarketEdit({apiKey:'test-server-only',source,prompt:'Test',model:'nano-banana-2.1',fetchImpl});
 assert.equal(observed[1].resolution,null);
 assert.equal(observed[1].size,null);
});

test('landscape supports a safe custom user asset as a real AI reference, not a sticker',()=>{
 const key='landscape_'+'f'.repeat(32);
 const item={kind:'object',id:'custom-1',catalogId:'custom-image',customKey:key,customLabel:'Моя плакучая ива',customDescription:'Тонкие свисающие ветви',x:.33,y:.65,w:.2,h:.4};
 const normalized=normalizeLandscape({items:[item]});
 assert.equal(normalized.items[0].customKey,key);
 const prompt=landscapePrompt({items:[item]});
 assert.match(prompt,/numbered uploaded-object reference board/);
 assert.match(prompt,/reference tile 1 of Image 2/);
 assert.match(prompt,/physically present/);
 assert.throws(()=>normalizeLandscape({items:[{...item,customKey:'../../../secret'}]}),/идентификатор/);
 assert.equal(customAssetKey('12345678-aaaa-bbbb-cccc-123456789abc'),'landscape_12345678aaaabbbbcccc123456789abc');
 assert.equal(cleanCustomName('<test>\n image'),'test image');
 assert.throws(()=>validateCustomFile({type:'text/html',size:400,name:'index.html'}),/PNG/);
 assert.throws(()=>validateCustomFile({type:'image/png',size:CUSTOM_FILE_LIMIT+1,name:'plant.png'}),/10 МБ/);
});

test('plan UI has no model picker, draws room reference on approved 3D, and validates actual 2K',()=>{
 const ui=readFileSync(new URL('../forma-image-workspace.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/fsPlanEngine/);
 assert.match(ui,/data-plan-2d-style/);
 assert.match(ui,/fsPlan2DGenerate/);
 assert.match(ui,/markedRoomReference\(own\.planResult,own\.crop\)/);
 assert.match(ui,/setView\(state\.planResult\)/);
 assert.match(ui,/state\.roomSelected=state\.planApproved&&state\.viewImage===state\.planResult/);
 assert.match(ui,/photo\.naturalWidth/);
 assert.match(ui,/вместо запрошенного 2K/);
 assert.match(html,/forma-plan-2d-styles\.css/);
 assert.match(html,/forma-image-workspace\.js\?v=five-plan-concepts-v3-20261117/);
});
