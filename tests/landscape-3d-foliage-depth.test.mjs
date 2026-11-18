import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {foliageDepthTone} from '../forma-landscape-3d-botany.js';

test('inner lower crown stays subtly darker than sunlit outer tips for evergreen and deciduous trees',()=>{
 for(const species of ['pine','spruce','birch','oak','maple','willow','hydrangea','juniper']){
  const inside=foliageDepthTone(species,.2,.15);
  const outside=foliageDepthTone(species,.9,.9);
  assert.ok(inside<outside,species+': depth gradient');
  assert.ok(inside>=.72&&outside<=1.08,species+': subtle plausible shading');
  assert.equal(outside,foliageDepthTone(species,.9,.9),'deterministic shader parameters');
 }
});
test('depth color is clamped for incomplete or extreme imported measurements',()=>{
 for(const t of [foliageDepthTone('pine',-100,-3),foliageDepthTone('oak',99,20),foliageDepthTone('birch',NaN,NaN)])
  assert.ok(Number.isFinite(t)&&t>=.72&&t<=1.08);
});
test('real-metre foliage placement feeds both microgeometry and sprays',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(src,/foliageDepthTone\(id,p\.y\/Math\.max\(\.25,height\),Math\.hypot\(p\.x,p\.z\)\/Math\.max\(\.1,diameter\*\.5\)\)/);
 assert.equal(src.split('foliageDepthTone(id,p.y/').length-1,2);
 assert.match(src,/addFoliageSprays\(g,T,leafPoints,id,season,Math\.floor\(r\(\)\*4294967295\),quality,diameter,height\)/);
});
