import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../forma-art-direction-core.js';
import {compositePixels,cropBounds} from '../forma-local-composite.js';
test('landscape offers six pavings and named plant and fixture choices',()=>{
 assert.equal(core.PAVINGS.length,6); assert.ok(core.PLANTS.some(x=>x.id==='willow-nana')); assert.equal(core.LIGHTS.length,6);
});
test('landscape rejects malformed geometry and unknown catalog ids before generation',()=>{
 for(const items of [[{kind:'plant',catalogId:'fake',x:.4,y:.6,w:.1,h:.2}],[{kind:'plant',catalogId:'willow-nana',x:NaN,y:.6,w:.1,h:.2}],Array(81).fill({})])assert.throws(()=>core.normalizeLandscape({items}));
 assert.throws(()=>core.normalizeLandscape({items:[{kind:'path',catalogId:'clinker',points:[{x:.1,y:.2}]}]}));
});
test('landscape prompt respects placement, daylight and existing architecture',()=>{
 const p=core.landscapePrompt({items:[{kind:'light',catalogId:'bollard',x:.2,y:.8,w:.05,h:.15}]});
 assert.match(p,/20.*80/); assert.match(p,/daytime/i); assert.match(p,/architecture/i);
});
test('atmosphere normalizes finite controls and never overrides scene choices',()=>{
 const a=core.normalizeAtmosphere({preset:'cinema',strength:999,dof:50,focus:{x:.25,y:.4},season:'winter'});
 assert.equal(a.strength,100); assert.equal(a.season,undefined); assert.equal(a.focus.x,.25);
 assert.throws(()=>core.normalizeAtmosphere({preset:'unknown'}));
 const p=core.atmospherePrompt(a);assert.match(p,/depth of field/i);assert.match(p,/preserve.*weather/i);assert.match(p,/architecture/i);
 assert.equal(core.atmospherePrompt(null),'');
});
test('compositing retains every channel outside edit mask byte for byte',()=>{
 const base=Uint8ClampedArray.from([9,20,30,255,40,50,60,255,70,80,90,255]);
 const edit=Uint8ClampedArray.from([200,210,220,255,220,230,240,255,250,251,252,255]);
 const mask=Uint8ClampedArray.from([0,0,0,0,0,0,0,255,0,0,0,128]);
 const out=compositePixels(base,edit,mask);assert.deepEqual([...out.slice(0,4)],[9,20,30,255]);assert.deepEqual([...out.slice(4,8)],[220,230,240,255]);assert.ok(out[8]>70&&out[8]<250);assert.equal(base[4],40);
 assert.throws(()=>compositePixels(base,edit.slice(4),mask));
});
test('crop bounds cover edge placements and path with image-bound padding',()=>{
 const b=cropBounds([{kind:'plant',catalogId:'willow-nana',x:0,y:1,w:.2,h:.3}],1000,600);
 assert.equal(b.x,0);assert.equal(b.y+b.height,600);assert.ok(b.width>100);
 assert.throws(()=>cropBounds([],1000,600));
});

test('server routes local landscape and atmosphere without conflicting scene prompts',async()=>{
 const {createPrompt}=await import('../server.mjs');
 const a={preset:'cinema',dof:70,strength:75};
 const lp=createPrompt({landscapeEdit:{items:[{kind:'plant',catalogId:'juniper',x:.5,y:.7,w:.1,h:.2}]},mask:'data:image/png;base64,stub',brief:{weather:'Снег'}});
 assert.match(lp,/LOCAL LANDSCAPE/);assert.doesNotMatch(lp,/FULL SCENE ENHANCEMENT/);
 const ap=createPrompt({atmosphereOnly:true,brief:{atmosphere:a,environment:'Тропики',weather:'Дождь'}});
 assert.match(ap,/PHOTOGRAPHIC ATMOSPHERE/);assert.doesNotMatch(ap,/FULL SCENE ENHANCEMENT|FULL SCENE CONTEXT/);
 const first=createPrompt({brief:{atmosphere:a}});assert.match(first,/Selective photographic depth of field/);assert.doesNotMatch(first,/f\/8-style deep architectural depth/);
 assert.throws(()=>createPrompt({landscapeEdit:{items:[]}}));
 assert.throws(()=>createPrompt({atmosphereOnly:true,brief:{}}));
});

test('drafts belong to the exact uploaded source and selected result view',()=>{
 const a={projectId:'p',sourceKey:'v1',renderId:'front'};
 assert.equal(core.sameView(a,{...a}),true);
 assert.equal(core.sameView(a,{...a,renderId:'detail'}),false);
 assert.equal(core.sameView(a,{...a,sourceKey:'v2'}),false);
});
test('selective focus requires nonzero atmosphere intensity and removes conflicting exposures',async()=>{
 const {createPrompt}=await import('../server.mjs');
 const selective=createPrompt({brief:{atmosphere:{preset:'cinema',strength:60,dof:70}}});
 assert.doesNotMatch(selective,/f\/8|f\/11|f\/5.6|focus stacking|depth of field across the building and landscaping/);
 const disabled=createPrompt({brief:{atmosphere:{preset:'cinema',strength:0,dof:70}}});
 assert.match(disabled,/f\/8-style deep architectural depth/);
});

test('provider output framing is validated instead of stretched',async()=>{
 const {assertFraming}=await import('../forma-local-composite.js');
 assert.doesNotThrow(()=>assertFraming(1024,1024,1536,1536));
 assert.throws(()=>assertFraming(1536,1024,1536,1536),/пропорции/);
});
test('atmosphere grading follows explicitly requested resulting weather in an initial render',async()=>{
 const {createPrompt}=await import('../server.mjs');
 const result=createPrompt({brief:{weather:'Дождь',atmosphere:{preset:'cinema',strength:60}}});
 assert.match(result,/requested resulting scene conditions/);
 assert.doesNotMatch(result,/Preserve existing weather, season, time of day/);
});
