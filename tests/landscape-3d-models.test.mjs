import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vegetationFit} from '../forma-landscape-3d-models.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';

test('high-resolution GLB foliage fits measured height and crown diameter without moving site points',()=>{
 const plant={catalogId:'pine',x:12,y:8,height:14,diameter:6};
 const result=vegetationFit({width:4,height:7,depth:3},plant);
 assert.equal(result.scaleXZ,1.5);
 assert.equal(result.scaleY,2);
 assert.equal(result.physicalHeight,14);
 assert.equal(result.crownDiameter,6);
 assert.equal(plant.x,12);assert.equal(plant.y,8);
});

test('asymmetric imported GLB uses maximal width to respect crown metric',()=>{
 const result=vegetationFit({width:1,height:3,depth:5},{height:9,diameter:8});
 assert.equal(result.scaleXZ,1.6);
 assert.equal(result.scaleY,3);
});

test('all catalogue vegetation species can accept an imported GLB and keep built-in fallback',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.equal(Object.keys(VEGETATION_SPECIES).length,18);
 for(const species of Object.keys(VEGETATION_SPECIES))assert.match(species,/^[a-z-]+$/);
 assert.match(html,/id="vegetationGlb"/);
 assert.match(html,/id="removePlantGlb"/);
 assert.match(html,/async function importPlantGlb/);
 assert.match(html,/async function restorePlantGlbs/);
 assert.match(html,/importedPlantModels\.get\(o\.catalogId\)/);
 assert.match(html,/g=source\?makeRealVegetation\(THREE,source,o,\{shareGeometry:!imported\}\):/);
 assert.match(html,/createVegetation\(THREE,o,\{season:doc\.atmosphere\.season,quality/);
 assert.match(html,/bundledModelSources\.get\(o\.catalogId\)/);
 assert.match(html,/localStorage\.setItem\(FLORA/);
 assert.match(html,/await storeGlb\('plant:'\+species,bytes\)/);
});
