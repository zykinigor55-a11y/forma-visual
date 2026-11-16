import test from 'node:test';
import assert from 'node:assert/strict';
import {atmospherePrompt,normalizeAtmosphere} from '../forma-art-direction-core.js';
import {ATMOSPHERE_SCENARIOS} from '../forma-atmosphere-scenes.js';
import {createPrompt} from '../server.mjs';

test('atmosphere creates spatial mood and named edge planting instead of forbidding all scene edits',()=>{
 const p=createPrompt({atmosphereOnly:true,brief:{atmosphere:{preset:'cinema',vegetation:'pine',foreground:55,depth:30}}});
 assert.match(p,/Pinus sylvestris/);
 assert.match(p,/LEFT IMAGE EDGE/);
 assert.match(p,/LOWER-RIGHT/);
 assert.match(p,/FRONT-TO-BACK COMPOSITION/);
 assert.match(p,/same sunlight direction/i);
 assert.match(p,/openings|windows/i);
 assert.doesNotMatch(p,/Color grade only|Do not add objects/);
});
test('each of nine scenes has a distinct authored lighting, exposure and spatial direction',()=>{
 assert.equal(ATMOSPHERE_SCENARIOS.length,9);
 for(const scene of ATMOSPHERE_SCENARIOS){
  const prompt=atmospherePrompt({scenario:scene.id,vegetation:'match'});
  assert.ok(prompt.includes(scene.light),scene.id+' lighting');
  assert.ok(prompt.includes(scene.exposure),scene.id+' exposure');
  assert.match(prompt,/AUTHORED FOREGROUND LAYOUT/);
 }
});
test('vegetation can be matched to existing species or disabled without changing site layout',()=>{
 const match=atmospherePrompt({preset:'editorial'});
 assert.match(match,/identify the existing visible tree species/i);
 assert.match(match,/Betula pendula/);
 assert.match(match,/No exterior shrubs or trees added to an indoor image/i);
 const none=atmospherePrompt({preset:'cinema',vegetation:'none'});
 assert.match(none,/Do not add any new plants/);
 assert.doesNotMatch(none,/Pinus sylvestris/);
 const zero=atmospherePrompt({preset:'cinema',vegetation:'pine',foreground:0});
 assert.match(zero,/Do not add any new plants/);
 assert.equal(atmospherePrompt({preset:'cinema',strength:0}),'');
});
test('new atmosphere controls normalize old drafts, reject unknown species and survive roundtrip',()=>{
 const old=normalizeAtmosphere({preset:'natural'});
 assert.equal(old.vegetation,'match');assert.equal(old.foreground,53);
 const value=normalizeAtmosphere({preset:'dramatic',vegetation:'birch',foreground:99});
 assert.equal(value.foreground,70);
 assert.deepEqual(normalizeAtmosphere(JSON.parse(JSON.stringify(value))),value);
 assert.throws(()=>normalizeAtmosphere({preset:'natural',vegetation:'palm'}));
});
test('atmosphere respects selected resulting conditions and zero depth disables added haze',()=>{
 const p=atmospherePrompt({preset:'nordic',depth:0},{preserveScene:false});
 assert.match(p,/Respect any explicit scene weather and sun direction/);
 assert.match(p,/No added aerial haze/);
 assert.doesNotMatch(p,/background softened by distance/);
});
