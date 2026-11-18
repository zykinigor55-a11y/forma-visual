import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bundledPlantIsTrueScale} from '../forma-landscape-3d-botany.js';

test('sapling meshes stay juvenile; full-size trees use mature native branch architecture',()=>{
 for(const species of ['pine','spruce']){
  assert.equal(bundledPlantIsTrueScale(species,3.5,2.1),true);
  assert.equal(bundledPlantIsTrueScale(species,5.5,4),true);
  assert.equal(bundledPlantIsTrueScale(species,14,6),false);
  assert.equal(bundledPlantIsTrueScale(species,7,6),false);
  assert.equal(bundledPlantIsTrueScale(species,5,6),false);
 }
 assert.equal(bundledPlantIsTrueScale('birch',14,6),true);
});
test('mature conifer source is never a stretched pine sapling, user GLB still overrides',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(html,/bundledPlantIsTrueScale\(o\.catalogId,o\.height,o\.diameter\)/);
 assert.match(html,/const source=imported\|\|\(!performanceFallback&&bundledPlantIsTrueScale/);
 assert.match(html,/createVegetation\(THREE,o,\{season:doc\.atmosphere\.season,quality,/);
 assert.match(html,/mode:renderQuality==='high'\?'premium'/);
});
