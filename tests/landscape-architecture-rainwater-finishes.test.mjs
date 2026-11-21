import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
import {rainwaterDrainPlan,windowTrimProfile,facadeOpeningSchedule,buildingHeights} from '../forma-landscape-3d-architecture-geometry.js';

const houses=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const drain=readFileSync(new URL('../forma-landscape-3d-roof-drainage.js',import.meta.url),'utf8');

test('every gable and hip roof gets actual side-wall gutters with diagonal eave outlets, NOT front downpipes',()=>{
 for(const p of HOUSE_PRESETS)for(const [width,depth] of [[3,3],[6,5],[12,8],[18,13]]){
  for(const roof of ['gable','hip']){
   const sites=rainwaterDrainPlan({width,depth,roof,style:p.id});
   assert.equal(sites.length,2);
   assert.deepEqual(sites.map(x=>x.facade),['left','right']);
   assert.deepEqual(sites.map(x=>x.end),[-1,1]);
   for(const x of sites){
    assert.ok(Math.sign(x.pipeX)===x.side);
    assert.ok(Math.abs(x.pipeX)>width/2+.10);
    assert.ok(Math.abs(x.pipeZ)<depth/2);
    assert.ok(Math.abs(x.outletX)>width/2+x.overhang);
    assert.ok(Math.abs(x.outletZ)>depth/2);
    assert.ok(x.pipeBottom>=.48);
    // The planned downpipe on a SIDE wall cannot pass through its windows.
    const h=buildingHeights({archStyle:p.id,width}).eave;
    const openings=facadeOpeningSchedule({width,depth,height:h,style:p.id})[x.facade];
    for(const o of openings){
     const edge=Math.abs(x.pipeZ-o.x)-o.width/2;
     assert.ok(edge>.08,JSON.stringify({style:p.id,roof,width,depth,site:x,opening:o}));
    }
   }
  }
 }
});
test('flat roof places scuppers and downpipes on the rear facade, away from entrance and main windows',()=>{
 for(const style of ['modern','japandi','hightech','modular','panoramic']){
  const sites=rainwaterDrainPlan({width:12,depth:9,roof:'flat',style});
  assert.equal(sites.length,2);
  assert.ok(sites.every(x=>x.facade==='rear'&&x.end===-1));
  assert.ok(sites.every(x=>x.pipeZ< -9/2));
  assert.ok(sites.every(x=>x.outletZ< -9/2));
 }
});
test('all window casings fit a true 190mm masonry wall, with correct outward slope and measured projection',()=>{
 for(const p of HOUSE_PRESETS){
  const trim=windowTrimProfile(p.id);
  assert.ok(trim.width>=.025&&trim.width<.12);
  assert.ok(trim.revealDepth>=.15&&trim.revealDepth<=.19);
  assert.ok(trim.sillSlopeRadians>0&&trim.sillSlopeRadians<.11);
  assert.ok(trim.sillProjection>=.04&&trim.sillProjection<=.09);
  assert.equal(trim.recessedWindowMm,110);
 }
 assert.match(houses,/sill\.rotation\.x=p\.sillSlopeRadians/);
 assert.match(houses,/window-casing-side/);
 assert.match(houses,/window-casing-head/);
 assert.match(houses,/window-head-flashing/);
 assert.match(houses,/window-side-reveal/);
 assert.match(houses,/window-head-reveal/);
 assert.match(houses,/interior-windowsill/);
 assert.match(houses,/window-pitched-sill/);
 assert.match(houses,/sill-end-cap/);
 assert.match(houses,/sill\.userData\.wallExteriorFace=\.095/);
 assert.match(houses,/sill\.userData\.sillExteriorNose=\.158/);
});
test('open U-section roof gutter has caps, fixing brackets and fall to outlet',()=>{
 assert.match(drain,/new T\.ExtrudeGeometry/);
 assert.match(drain,/new T\.ShapeGeometry\(cap\)/);
 assert.match(drain,/architecturePart='gutter-hanger'/);
 assert.match(drain,/fallMmPerMeter=4/);
 assert.match(houses,/if\(b\.archStyle!=='aframe'\)/);
 assert.match(houses,/axis:'x'/,'hip roof must have front and rear gutters');
 assert.match(houses,/g\.userData\.roofDrainagePlan=sites/);
 assert.match(houses,/architecturePart='flat-roof-scupper'/);
 assert.match(houses,/architecturePart='downpipe-clamp'/);
 assert.match(houses,/architecturePart='downpipe-wall-bracket'/);
 assert.match(houses,/roundPipeBetween\(g,T,shoeA,shoeB,\.069,metal,'downpipe-shoe'\)/);
 assert.match(houses,/connectedToGutter=true/);
});
test('house foundation and measured footprint remain exactly defined by original input',()=>{
 assert.match(houses,/g\.userData\.footprint=\{width:w,height:d\}/);
 assert.match(houses,/wallPatches\(span,\.48,h-\.09,openings\)/);
 assert.match(houses,/measuredFacadePatchGeometry\(T,patch,span/);
 assert.match(houses,/addMeasuredFacades\(g,THREE/);
 assert.equal(HOUSE_PRESETS.length,18);
});
