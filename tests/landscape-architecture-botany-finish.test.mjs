import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
import {foliageDepthTone,foliageSprayWidth} from '../forma-landscape-3d-botany.js';

test('all architecture presets retain unique names, readable materials, roof types',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 assert.equal(new Set(HOUSE_PRESETS.map(p=>p.id)).size,18);
 for(const preset of HOUSE_PRESETS){
  assert.ok(preset.name&&preset.wall&&preset.roof&&preset.roofFinish);
  assert.ok(['flat','gable','hip'].includes(preset.roof),preset.id);
 }
});
test('three-dimensional window reveal and PBR relief exist; footprint remains survey-defined',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
 assert.match(src,/const frame=mat\(T,[^\n]+recess=mat/);
 assert.match(src,/box\(g,T,w,h,\.035,0,0,\.035,recess\)/);
 assert.match(src,/box\(g,T,edge,h\+edge\*2,tripleGlazed\?\.076:\.16/);
 assert.match(src,/wallMaterial\.bumpMap=wallTex/);
 assert.match(src,/roofMaterial\.bumpMap=roofTex/);
 assert.match(src,/g\.userData\.footprint=\{width:w,height:d\}/);
});
test('species-dependent crown material variations are bounded',()=>{
 for(const id of ['pine','spruce','birch','oak','hydrangea','juniper']){
  const shade=foliageDepthTone(id,.5,.5),width=foliageSprayWidth(id,2);
  assert.ok(shade>.7&&shade<1.1);
  assert.ok(width>.05&&width<.85);
 }
});
