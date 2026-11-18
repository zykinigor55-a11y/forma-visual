import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foliageSprayWidth} from '../forma-landscape-3d-botany.js';
test('leaf sprays scale with surveyed crown diameter without gigantic billboard leaves',()=>{
 for(const id of ['pine','spruce','birch','oak','maple','willow','juniper','hydrangea','lavender']){
  const sapling=foliageSprayWidth(id,1),adult=foliageSprayWidth(id,6);
  assert.ok(Number.isFinite(sapling)&&Number.isFinite(adult)&&sapling>0);
  assert.ok(adult>=sapling,id+' grows monotonically');
  assert.ok(adult<.85,id+' avoids oversized foliage slabs');
 }
 assert.ok(foliageSprayWidth('spruce',6)<foliageSprayWidth('oak',6),'spruce needle tufts stay finer');
 assert.ok(foliageSprayWidth('lavender',1)<foliageSprayWidth('hydrangea',1),'lavender heads are compact');
 assert.ok(foliageSprayWidth('oak',.4)<foliageSprayWidth('oak',6),'juvenile canopy is not full-size');
 assert.equal(foliageSprayWidth('pine',6),foliageSprayWidth('pine',6),'deterministic');
});
test('tree and shrub renderer use measured diameter for real 3D terminal foliage',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(src,/const w=foliageSprayWidth\(id,diameter\)/);
 assert.match(src,/addFoliageSprays\(g,T,leafPoints,id,season,Math\.floor\(r\(\)\*4294967295\),quality,diameter\)/);
 assert.match(src,/addFoliageSprays\(g,T,points,id,season,Math\.floor\(r\(\)\*4294967295\),quality,diameter\)/);
});
