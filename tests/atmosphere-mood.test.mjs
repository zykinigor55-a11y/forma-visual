import test from 'node:test';
import assert from 'node:assert/strict';
import {atmospherePrompt,normalizeAtmosphere,LOOKS} from '../forma-art-direction-core.js';
import {createPrompt} from '../server.mjs';

test('atmosphere creates spatial mood and named edge planting instead of forbidding all scene edits',()=>{
 const p=createPrompt({atmosphereOnly:true,brief:{atmosphere:{preset:'cinema',vegetation:'pine',foreground:55,depth:30}}});
 assert.match(p,/Pinus sylvestris/);
 assert.match(p,/left.*right.*edges/i);
 assert.match(p,/foreground.*middle.*background/is);
 assert.match(p,/same.*sun direction/i);
 assert.match(p,/openings|windows/i);
 assert.doesNotMatch(p,/Color grade only|Do not add objects/);
});
test('each mood has its own lighting and spatial direction',()=>{
 for(const look of LOOKS){
  assert.ok(look.scene?.length>70,look.id);
  assert.match(atmospherePrompt({preset:look.id}),new RegExp(look.scene.slice(0,35).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
});
test('vegetation can be matched to existing species or disabled without changing site layout',()=>{
 const match=atmospherePrompt({preset:'editorial'});
 assert.match(match,/identify.*existing.*species/i);
 assert.match(match,/Betula pendula/);
 assert.match(match,/no vegetation.*interior/i);
 const none=atmospherePrompt({preset:'cinema',vegetation:'none'});
 assert.match(none,/Do not add any trees, branches or plants/);
 assert.doesNotMatch(none,/Pinus sylvestris/);
 const zero=atmospherePrompt({preset:'cinema',vegetation:'pine',foreground:0});
 assert.match(zero,/Do not add any trees, branches or plants/);
 assert.equal(atmospherePrompt({preset:'cinema',strength:0}),'');
});
test('new atmosphere controls normalize old drafts, reject unknown species and survive roundtrip',()=>{
 const old=normalizeAtmosphere({preset:'natural'});
 assert.equal(old.vegetation,'match');assert.equal(old.foreground,35);
 const value=normalizeAtmosphere({preset:'dramatic',vegetation:'birch',foreground:99});
 assert.equal(value.foreground,70);
 assert.deepEqual(normalizeAtmosphere(JSON.parse(JSON.stringify(value))),value);
 assert.throws(()=>normalizeAtmosphere({preset:'natural',vegetation:'palm'}));
});
test('atmosphere respects selected resulting conditions and zero depth disables added haze',()=>{
 const p=atmospherePrompt({preset:'nordic',depth:0},{preserveScene:false});
 assert.match(p,/requested resulting scene conditions/);
 assert.match(p,/No added aerial haze/);
 assert.match(p,/do not.*new.*weather|do not.*change.*weather/i);
});
