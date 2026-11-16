import test from 'node:test';
import assert from 'node:assert/strict';
import {ATMOSPHERE_SCENARIOS,ATMOSPHERE_SCENE_GROUPS} from '../forma-atmosphere-scenes.js';
import {normalizeAtmosphere,atmospherePrompt} from '../forma-art-direction-core.js';
import {scalePlacement} from '../forma-landscape-tools.js';

test('nine atmospheric directions: 3 day, 2 autumn, 2 winter, 2 blue hour',()=>{
 assert.equal(ATMOSPHERE_SCENARIOS.length,9);
 assert.deepEqual(ATMOSPHERE_SCENE_GROUPS.map(g=>ATMOSPHERE_SCENARIOS.filter(x=>x.group===g.id).length),[3,2,2,2]);
 assert.equal(new Set(ATMOSPHERE_SCENARIOS.map(x=>x.id)).size,9);
});

test('every scenario has unique light and composition and physically grounded foreground',()=>{
 assert.equal(new Set(ATMOSPHERE_SCENARIOS.map(x=>x.light)).size,9);
 assert.equal(new Set(ATMOSPHERE_SCENARIOS.map(x=>x.composition)).size,9);
 for(const scene of ATMOSPHERE_SCENARIOS){
  const a=normalizeAtmosphere({scenario:scene.id,vegetation:'birch'});
  const p=atmospherePrompt(a);
  assert.match(p,/SOURCE LOCK: Keep EXACT approved architectural geometry/);
  assert.ok(p.includes(scene.light));
  assert.ok(p.includes(scene.exposure));
  assert.match(p,/TRUNK AMOUNT/);
  assert.match(p,/SHRUB AMOUNT/);
  assert.match(p,/GROUND CONTACT/);
  assert.match(p,/LENS VIGNETTE/);
 }
});

test('winter, autumn and blue hour are actual scene directions, not just color filters',()=>{
 assert.match(atmospherePrompt({scenario:'winter-clear',vegetation:'pine',strength:80}),/bare deciduous twigs/);
 assert.match(atmospherePrompt({scenario:'autumn-gold',vegetation:'birch',strength:80}),/autumn season/);
 assert.match(atmospherePrompt({scenario:'blue-calm',vegetation:'birch',strength:80}),/blue-hour/);
 assert.match(atmospherePrompt({scenario:'blue-cinema',vegetation:'pine',strength:80}),/civil twilight/);
});

test('foreground controls sanitize invalid values and explicit no greenery disables additions',()=>{
 const v=normalizeAtmosphere({scenario:'day-soft',vegetation:'none',trunks:999,shrubs:-4,grounding:900,vignette:80});
 assert.equal(v.trunks,100);assert.equal(v.shrubs,0);assert.equal(v.grounding,100);assert.equal(v.vignette,30);
 assert.match(atmospherePrompt(v),/Do not add any new plants/);
});

test('landscape object scale cannot exceed 200%',()=>{
 const item={w:.2,h:.3,baseW:.2,baseH:.3};
 const out=scalePlacement(item,50);
 assert.equal(out.w,.4);assert.equal(out.h,.6);
});
