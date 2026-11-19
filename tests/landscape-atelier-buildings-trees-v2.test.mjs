import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
const buildings=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const trees=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('all 18 houses retain surveyed roof, recessed glazing and authentic metal construction profiles',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 assert.match(buildings,/architecturePart='parapet-metal-coping'/);
 assert.match(buildings,/architecturePart='gable-roof-drip-flashing'/);
 assert.match(buildings,/architecturePart='roof-underside'/);
 assert.match(buildings,/architecturePart='window-hinge'/);
 assert.match(buildings,/architecturePart='window-trickle-vent'/);
 assert.match(buildings,/new T\.BoxGeometry\(slopeLength,\.32,depth\)/);
 assert.match(buildings,/part\.userData\.recessDepth=\.16/);
 assert.match(buildings,/g\.userData\.footprint=\{width:w,height:d\}/);
});
test('real broadleaf GLB clones reuse a small set of PBR materials rather than making hundreds of duplicates',()=>{
 assert.match(trees,/const materialCache=new Map\(\)/);
 assert.match(trees,/materialCache\.get\(material\)/);
 assert.match(trees,/materialCache\.set\(material,copy\)/);
 assert.match(trees,/node\.material=Array\.isArray\(node\.material\)\?node\.material\.map\(copyMaterial\):copyMaterial\(node\.material\)/);
 assert.match(trees,/group\.userData\.uniquePbrMaterials=materialCache\.size/);
 assert.match(trees,/material\.clone\(\)/);
 assert.match(trees,/node\.castShadow=true;node\.receiveShadow=true/);
});
test('desktop selects curated CC0 GLBs and waits for authentic materials rather than flashing old trees',()=>{
 assert.match(editor,/const bundledAdult=MATURE_TREE_MODELS\[o\.catalogId\]/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(editor,/waitingForReal\?new THREE\.Group\(\)/);
 assert.match(editor,/if\(MATURE_TREE_MODELS\[o\.catalogId\]&&!imported\)loadCuratedAdultTree\(o\.catalogId\)/);
});
