import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {facadeOpeningSchedule,buildingHeights,rainwaterDrainPlan,scandiRoofOverhang} from '../forma-landscape-3d-architecture-geometry.js';
import {scandiGableOpening,SCANDI_DETAIL} from '../forma-landscape-3d-scandinavian-detail.js';
import {scandiTerracePlan,scandiSnowGuardPlan} from '../forma-landscape-3d-scandi-reference-extras.js';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
const buildings=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const facades=readFileSync(new URL('../forma-landscape-3d-scandinavian-detail.js',import.meta.url),'utf8');
const extras=readFileSync(new URL('../forma-landscape-3d-scandi-reference-extras.js',import.meta.url),'utf8');

test('user photos: one-storey Scandinavian frontage includes real tall glazed apertures and a separate entrance',()=>{
 const style=HOUSE_PRESETS.find(p=>p.id==='scandi');
 assert.ok(style&&style.roof==='gable');
 for(const [w,d] of [[6,5],[8,6],[12,8],[18,12]]){
  const y=buildingHeights({archStyle:'scandi',width:w}).eave;
  const o=facadeOpeningSchedule({width:w,depth:d,height:y,style:'scandi',type:'house'});
  const door=o.front.find(x=>x.kind==='door');
  const glazing=o.front.filter(x=>x.kind==='window');
  assert.ok(door&&glazing.length>=1);
  assert.ok(glazing.some(x=>x.height>=2.1&&x.bottom<.7&&x.panoramic));
  assert.ok(o.left.some(x=>x.width>=1.4&&x.bottom<.7));
  assert.ok(o.right.some(x=>x.width>=1.4&&x.bottom<.7));
  const all=[door,...glazing].sort((a,b)=>a.x-b.x);
  for(let i=1;i<all.length;i++)
   assert.ok(all[i-1].x+all[i-1].width*.5<=all[i].x-all[i].width*.5,
    JSON.stringify({width:w,overlap:[all[i-1],all[i]]}));
 }
 assert.match(buildings,/windowGroup\(T,opening\.width,opening\.height,night,opening\.panoramic,style==='scandi'\)/);
});
test('user photos: real skylight/gable glass passes through timber envelope and has black PVC profiles',()=>{
 for(const w of [6,9,12,18]){
  const rise=Math.min(w*.22,2.6),h=3.5;
  const g=scandiGableOpening(w,rise,h);
  assert.ok(g.width>1.2&&g.height>.3);
  const half=(w+scandiRoofOverhang(w,8)*2)/2;
  const limitingRoof=h+rise*(1-g.width/(half*2));
  assert.ok(g.top<limitingRoof);
  assert.equal(g.glassLeaves,3);
 }
 assert.match(facades,/shape\.holes\.push\(h\)/);
 assert.match(facades,/new T\.ShapeGeometry\(shape,8\)/);
 for(const tag of ['scandi-gable-pvc-side-frame','scandi-gable-pvc-head-sill',
  'scandi-gable-fixed-glass-mullion','scandi-gable-epdm-glazing-seal'])
  assert.ok(facades.includes(tag),tag);
 assert.match(buildings,/if\(b\.archStyle!=='scandi'\)/);
});
test('user photos: standing-seam snow-retaining bars are near eaves and held by clamps',()=>{
 const roof=scandiSnowGuardPlan(12,8,1.7,scandiRoofOverhang(12,8));
 assert.equal(roof.length,4,'two rows on two roof slopes');
 const small=scandiSnowGuardPlan(6,5,1.1,scandiRoofOverhang(6,5));
 assert.equal(small.length,2,'small roof has one row on each slope');
 for(const p of roof){
  assert.ok(Math.abs(p.roofX)<12*.5+.7);
  assert.ok(p.zFrom<0&&p.zTo>0);
  assert.ok(p.snowRailRadius<.03);
 }
 for(const tag of ['scandi-standing-seam-snow-guard-tube',
  'scandi-snow-guard-seam-bracket','scandi-snow-guard-upper-tube-clamp'])
  assert.ok(extras.includes(tag),tag);
 assert.match(buildings,/addScandiRoofSnowGuards\(THREE,g/);
});
test('user photos: supported deck stops before existing entrance stair; board instancing avoids heavy GLBs',()=>{
 for(const [w,d] of [[6,5],[8,7],[12,8],[18,12]]){
  const plan=facadeOpeningSchedule({width:w,depth:d,height:3.5,style:'scandi'}).front;
  const door=plan.find(x=>x.kind==='door');
  const deck=scandiTerracePlan(w,d,door);
  assert.ok(deck);
  assert.ok(deck.span>1.65);
  assert.ok(deck.right<deck.stepLeft);
  assert.equal(deck.level,.48);
  assert.ok(deck.depth>=1.5&&deck.depth<=2.2);
 }
 for(const tag of ['scandi-deck-longitudinal-joist','scandi-deck-cross-joist',
  'scandi-deck-ground-pedestal','scandi-terrace-horizontal-deck-boards',
  'scandi-deck-front-fascia','scandi-deck-supported-approach-step'])
  assert.ok(extras.includes(tag),tag);
 assert.match(extras,/new T\.InstancedMesh\(geo,timber,count\)/);
 assert.match(buildings,/addScandiTerrace\(THREE,g/);
});
test('user photo construction: roof and downpipes follow same eave width',()=>{
 for(const [w,d] of [[6,5],[12,8],[18,13]]){
  const actual=scandiRoofOverhang(w,d);
  assert.ok(actual>=.5&&actual<=.72);
  const drains=rainwaterDrainPlan({width:w,depth:d,style:'scandi',roof:'gable'});
  assert.equal(drains.length,2);
  assert.ok(drains.every(p=>p.overhang===actual));
  assert.ok(drains.every(p=>['left','right'].includes(p.facade)));
 }
 assert.match(buildings,/const overhang=scandiRoofOverhang\(w,d\)/);
 assert.equal(SCANDI_DETAIL.windowFrame,'#222A2D');
 assert.equal(HOUSE_PRESETS.length,18,'do not add duplicate house presets');
});
