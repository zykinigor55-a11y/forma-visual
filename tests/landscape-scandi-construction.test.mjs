import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCANDI_DETAIL,scandiEntranceBand,scandiEntryStairSpec} from '../forma-landscape-3d-scandinavian-detail.js';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
import {facadeOpeningSchedule,buildingHeights,windowTrimProfile} from '../forma-landscape-3d-architecture-geometry.js';

const house=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const scandi=readFileSync(new URL('../forma-landscape-3d-scandinavian-detail.js',import.meta.url),'utf8');

test('Scandinavian house retains vertical natural timber throughout and a darker second timber at entry',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 const spec=HOUSE_PRESETS.find(p=>p.id==='scandi');
 assert.equal(spec.wall,'lightwood');
 assert.equal(spec.roof,'gable');
 assert.equal(spec.roofFinish,'standing');
 assert.match(spec.subtitle,/Вертикальный планкен двух оттенков/);
 assert.equal(SCANDI_DETAIL.boardPitch,.132);
 assert.ok(SCANDI_DETAIL.boardWidth<SCANDI_DETAIL.boardPitch);
 assert.notEqual(SCANDI_DETAIL.mainWood,SCANDI_DETAIL.accentWood);
 assert.match(scandi,/new T\.InstancedMesh\(/);
 assert.match(scandi,/scandi-vertical-cladding-main/);
 assert.match(scandi,/scandi-vertical-cladding-accent/);
 assert.match(scandi,/scandi-gable-vertical-boards/);
 assert.match(scandi,/scandi-second-wood-backing/);
 assert.match(scandi,/scandi-vertical-cladding-main',\.135/);
 assert.match(scandi,/measuredAirGapFromWallFace:\.030/);
 assert.match(house,/style==='scandi'&&\(type==='house'\|\|!type\)/);
});

test('entry stairs align exactly to the original door, three equal risers and sufficient landing',()=>{
 for(const [width,depth] of [[6,5],[8,7],[12,8],[18,12]]){
  const eave=buildingHeights({archStyle:'scandi',type:'house',width}).eave;
  const openings=facadeOpeningSchedule({width,depth,height:eave,style:'scandi'}).front;
  const originalDoor=openings.find(o=>o.kind==='door');
  assert.ok(originalDoor);
  const band=scandiEntranceBand(openings,width);
  assert.ok(band.left<originalDoor.x-originalDoor.width*.5);
  assert.ok(band.right>originalDoor.x+originalDoor.width*.5);
  const stair=scandiEntryStairSpec(originalDoor,width,depth);
  assert.equal(stair.x,originalDoor.x);
  assert.equal(stair.facade,depth/2);
  assert.deepEqual(stair.levels,[.16,.32,.48]);
  assert.equal(stair.riser,.16);
  assert.equal(stair.going,.32);
  assert.ok(stair.landingDepth>=1.2);
  assert.ok(stair.stepWidth>originalDoor.width);
 }
 assert.match(house,/addScandiEntrance\(T,g,\{door:frontOpenings\.find/);
 assert.match(scandi,/entry-stair-supported-riser/);
 assert.match(scandi,/entry-stair-stringer/);
 assert.match(scandi,/entry-stair-tread/);
 assert.match(scandi,/entry-tread-nosing/);
 assert.match(scandi,/entry-landing-core/);
 assert.match(scandi,/entry-drained-door-threshold/);
 assert.match(scandi,/entry-canopy-metal-cassette/);
 assert.match(scandi,/entry-canopy-drip-edge/);
});

test('scandinavian 76mm PVC profile includes separated triple glazing, warm edge and seals',()=>{
 assert.match(house,/function windowGroup\(T,width,height,night=false,panoramic=false,tripleGlazed=false\)/);
 assert.match(house,/style==='scandi'\);/);
 for(const part of ['ig-unit-outer-pane','ig-unit-middle-pane','ig-unit-inner-pane','ig-unit-warm-edge-spacer',
  'upvc-sash-76mm','outer-glazing-gasket','upvc-drainage-weep-hole'])
  assert.ok(house.includes(part),'missing '+part);
 assert.match(house,/nominalPaneThicknessMm:4/);
 assert.match(house,/unit:'triple glazed 4-16-4-16-4'/);
 assert.match(house,/tripleGlazed\?0:\.5/,'PVC is non-metallic');
 assert.match(house,/tripleGlazed\?\.076:\.16/,'PVC frame is 76mm deep');
 assert.match(house,/tripleGlazed\?\.089:\.065/,'separate glazing center');
});
test('verge metal, wind board, ridge, drip and correctly projected exterior windowsills',()=>{
 const s=windowTrimProfile('scandi');
 assert.equal(s.recessedWindowMm,110);
 assert.equal(s.revealDepth,.16);
 assert.ok(s.sillSlopeRadians>0);
 for(const part of ['gable-wind-board','gable-wind-flashing','wind-flashing-folded-return',
  'standing-seam-ridge-cap','scandi-eave-edge-flashing','rainscreen-corner-termination-x',
  'rainscreen-corner-termination-z'])assert.ok(scandi.includes(part),part);
 for(const part of ['window-installation-weather-seal','rainscreen-window-side-return',
   'rainscreen-window-head-return','window-head-waterproof-tape',
   'sill-wind-rain-end-upstand','interior-windowsill','window-pitched-sill'])
  assert.ok(house.includes(part),part);
 assert.match(house,/const nose=scandi\?\.197:\.158/);
 assert.match(house,/sill\.userData\.dripClearanceBeyondCladdingMm=52/);
 assert.match(house,/sill\.rotation\.x=p\.sillSlopeRadians/);
 assert.match(house,/addScandiRoofEdgeDetails\(THREE,g/);
 assert.match(house,/addScandiGableCladding\(THREE,g/);
});
test('no change to surveyed roof dimensions, facades or project coordinates',()=>{
 assert.match(house,/g\.userData\.footprint=\{width:w,height:d\}/);
 assert.match(house,/wallPatches\(span,\.48,h-\.09,openings\)/);
 assert.match(house,/if\(style==='scandi'&&\(!b\.type\|\|b\.type==='house'\)/);
 assert.deepEqual(HOUSE_PRESETS.map(x=>x.id).filter(x=>x==='scandi'),['scandi']);
});
