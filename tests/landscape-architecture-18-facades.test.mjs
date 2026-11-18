import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS,housePreset,housePresetIds} from '../forma-landscape-3d-buildings.js';
import {NEW_HOUSE_STYLES,facadeOpeningSchedule,wallPatches,buildingHeights,validateMeasuredBuilding} from '../forma-landscape-3d-architecture-geometry.js';
const code=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('18 distinct architecture models have actual roof geometry and meaningful exterior materials',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 assert.equal(new Set(housePresetIds).size,18);
 assert.deepEqual(housePresetIds.slice(-6),NEW_HOUSE_STYLES);
 for(const p of HOUSE_PRESETS){
  assert.equal(housePreset(p.id),p);
  assert.ok(p.name&&p.subtitle&&p.wall&&p.accent,p.id);
  assert.ok(['gable','hip','flat'].includes(p.roof),p.id);
  assert.ok(['tile','standing','flat'].includes(p.roofFinish),p.id);
 }
});
test('building dimensions, eaves, ridge and measured area are numeric and consistent',()=>{
 for(const w of [2.5,4,8,12,20])for(const d of [3,7,14]){
  assert.deepEqual(validateMeasuredBuilding({width:w,height:d}),{valid:true,width:w,depth:d,footprintArea:w*d});
  for(const p of HOUSE_PRESETS){
   const profile=buildingHeights({archStyle:p.id,width:w,roofRise:p.id==='aframe'?5:1.5});
   assert.ok(profile.eave>=.6&&profile.eave<=6.5,p.id);
   assert.ok(profile.rise>=.5&&profile.rise<=8,p.id);
   assert.ok(profile.total===profile.eave+profile.rise);
  }
 }
 assert.equal(validateMeasuredBuilding({width:0,height:10}).valid,false);
 assert.equal(validateMeasuredBuilding({width:6,height:NaN}).valid,false);
});
test('façade meshing leaves genuine wall voids around glazing and doors',()=>{
 for(const p of HOUSE_PRESETS)if(p.id!=='aframe')for(const [w,d] of [[2.5,4],[5,5],[8,7],[15,12]]){
  const height=buildingHeights({archStyle:p.id,width:w,roofRise:1.5}).eave;
  const plan=facadeOpeningSchedule({width:w,depth:d,height,style:p.id,type:'house'});
  for(const [name,openings] of Object.entries(plan)){
   const span=['front','rear'].includes(name)?w:d;
   const patches=wallPatches(span,.48,height-.09,openings);
   assert.ok(patches.length>0,p.id+' '+name);
   for(const r of patches){
    assert.ok(r.width>0&&r.height>0);
    assert.ok(r.x-r.width/2>=-span/2-1e-7&&r.x+r.width/2<=span/2+1e-7);
    for(const opening of openings){
     const overlapX=Math.min(r.x+r.width/2,opening.x+opening.width/2)-Math.max(r.x-r.width/2,opening.x-opening.width/2);
     const overlapY=Math.min(r.y+r.height/2,opening.bottom+opening.height)-Math.max(r.y-r.height/2,opening.bottom);
     assert.ok(overlapX<=1e-6||overlapY<=1e-6,p.id+' '+name+' opening must not be filled by wall');
    }
   }
   for(let i=0;i<openings.length;i++)for(let j=i+1;j<openings.length;j++){
    const a=openings[i],b=openings[j];
    const overlapX=Math.min(a.x+a.width/2,b.x+b.width/2)-Math.max(a.x-a.width/2,b.x-b.width/2);
    const overlapY=Math.min(a.bottom+a.height,b.bottom+b.height)-Math.max(a.bottom,b.bottom);
    assert.ok(overlapX<=1e-5||overlapY<=1e-5,p.id+' '+name+' windows/doors overlap at width='+w);
   }
  }
 }
 assert.match(code,/function addMeasuredFacades\(/);
 assert.match(code,/wallPatches\(span,\.48,h-\.09,openings\)/);
 assert.match(code,/facade\.name='facade-'\+name/);
 assert.match(code,/segment\.userData\.architecturePart='solid-wall'/);
 assert.match(code,/part\.userData\.architectureOpening=/);
 assert.doesNotMatch(code,/box\(g,THREE,w,bodyHeight-\.48,d,0,\.48\+\(bodyHeight-\.48\)\/2,0,wallMaterial\)/,'no hidden solid box behind glass');
});
test('garage, greenhouse and carport construction type are mutually distinct',()=>{
 const garage=facadeOpeningSchedule({width:8,depth:7,height:2.85,type:'garage'});
 assert.ok(garage.front.some(o=>o.kind==='garage'));
 assert.match(code,/if\(isGreenhouse\)/);
 assert.match(code,/if\(isCarport\)/);
 assert.match(code,/transmission:\.62/);
 assert.match(code,/const greenhouseRoof=isGreenhouse/);
 assert.match(ui,/\['carport','Навес для автомобиля'\]/);
 assert.match(ui,/\['greenhouse','Теплица'\]/);
 assert.match(ui,/АРХИТЕКТУРА · 18 ТИПОВ ДОМОВ/);
 assert.match(ui,/data-house-preset/);
 assert.match(ui,/roof=targetType==='greenhouse'\?'gable'/);
});
