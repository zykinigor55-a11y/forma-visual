import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coniferNeedleProfile} from '../forma-landscape-3d-botany.js';

test('conifer texture needles are anatomically distinct and deterministic',()=>{
 const pine=coniferNeedleProfile('pine'),spruce=coniferNeedleProfile('spruce');
 const juniper=coniferNeedleProfile('juniper'),thuja=coniferNeedleProfile('thuja-globe');
 assert.ok(pine.length>spruce.length,'pine needles are longer than spruce');
 assert.ok(pine.spread>spruce.spread,'pine needles fan out more openly');
 assert.ok(pine.arms<spruce.arms,'spruce has denser branchlets');
 assert.ok(pine.needlesPerSide<spruce.needlesPerSide,'spruce carries more short needles');
 assert.ok(thuja.length<juniper.length,'thuja foliage is compact');
 for(const cfg of [pine,spruce,juniper,thuja]){
  assert.ok(cfg.arms>=8&&cfg.arms<=24);
  assert.ok(cfg.length>.2&&cfg.length<1.5);
  assert.ok(cfg.needlesPerSide>=2&&cfg.needlesPerSide<=6);
 }
 assert.deepEqual(coniferNeedleProfile('pine'),pine);
});
test('branch anchored foliage uses conifer-specific physical atlas proportions',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(src,/profile=needles\?coniferNeedleProfile\(id\):null/);
 assert.match(src,/const arms=profile\?\.arms\|\|13/);
 assert.match(src,/n<profile\.needlesPerSide/);
 assert.match(src,/foliageSprayWidth\(id,diameter\)/);
});
