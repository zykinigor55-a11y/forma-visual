import test from 'node:test';
import assert from 'node:assert/strict';
const workflows=await import('../forma-image-workflows.js').catch(()=>({}));
test('detail frame rejects an off-image crop and keeps its camera',()=>{
 assert.equal(typeof workflows.normalizeImageTask,'function');
 assert.throws(()=>workflows.normalizeImageTask({kind:'detail',crop:{x:.9,y:0,w:.3,h:.2}}),/област/);
 const v=workflows.normalizeImageTask({kind:'detail',crop:{x:.1,y:.2,w:.3,h:.4}});
 assert.equal(v.kind,'detail');assert.match(workflows.imageTaskPrompt(v),/never reveal|NEVER reveal/i);
});
test('plan style and presentation are allowlisted independently',()=>{
 assert.equal(typeof workflows.normalizeImageTask,'function');
 const v=workflows.normalizeImageTask({kind:'plan',style:'japandi',presentation:'top'});
 assert.equal(v.presentation,'top');assert.equal(v.style,'japandi');
 assert.throws(()=>workflows.normalizeImageTask({kind:'plan',style:'unknown'}),/стил/);
});
test('room view needs marked room and a camera direction',()=>{
 assert.equal(typeof workflows.normalizeImageTask,'function');
 assert.throws(()=>workflows.normalizeImageTask({kind:'room',style:'japandi'}),/комнат/);
 const v=workflows.normalizeImageTask({kind:'room',style:'japandi',room:{x:.2,y:.3,w:.3,h:.3},direction:'north'});
 assert.match(workflows.imageTaskPrompt(v),/original 2D plan/i);
});
test('a frontal reconstruction is refused without its own source',()=>{
 assert.equal(typeof workflows.assertSeriesSource,'function');
 assert.throws(()=>workflows.assertSeriesSource({batchShot:'front',batchFrontProvided:false}),/исходник/);
 assert.doesNotThrow(()=>workflows.assertSeriesSource({batchShot:'front',batchFrontProvided:true}));
});
test('image tasks always use one request even when quantity is supplied as four',async()=>{const {renderQuantity,createPrompt}=await import('../server.mjs');assert.equal(renderQuantity({imageTask:{kind:'detail'},quantity:4}),1);assert.throws(()=>createPrompt({batchShot:'front',batchFrontProvided:false}),/исходник/);});
test('2D and 3D plans are forced to server-authorized GPT Image without browser engine selection',()=>{assert.equal(workflows.normalizeImageTask({kind:'plan',engine:'nano-banana-2.1'}).engine,'gpt-image-2.6-sunburst');assert.equal(workflows.normalizeImageTask({kind:'plan2d',engine:'untrusted-model'}).engine,'gpt-image-2.6-sunburst');});
