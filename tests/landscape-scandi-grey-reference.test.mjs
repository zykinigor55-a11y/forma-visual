import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {SCANDI_DETAIL,scandiEntranceBand,scandiEntryStairSpec} from '../forma-landscape-3d-scandinavian-detail.js';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
import {windowTrimProfile,facadeOpeningSchedule} from '../forma-landscape-3d-architecture-geometry.js';

const source=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const timber=readFileSync(new URL('../forma-landscape-3d-scandinavian-detail.js',import.meta.url),'utf8');

function hex(rgb){return /^#[0-9A-F]{6}$/.test(rgb)}
function channels(value){return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16))}

test('approved Nordic house takes its palette from photographed grey vertical timber, not plaster',()=>{
 const preset=HOUSE_PRESETS.find(x=>x.id==='scandi');
 assert.ok(preset);
 assert.equal(preset.wall,'lightwood');
 assert.equal(preset.roof,'gable');
 assert.equal(preset.roofFinish,'standing');
 assert.match(preset.subtitle,/Серый вертикальный планкен/);
 assert.deepEqual(HOUSE_PRESETS.length,18);
 assert.ok(hex(SCANDI_DETAIL.mainWood)&&hex(SCANDI_DETAIL.accentWood));
 const a=channels(SCANDI_DETAIL.mainWood),b=channels(SCANDI_DETAIL.accentWood);
 assert.ok(a.every(v=>v>117&&v<182),'weathered silver grey');
 assert.ok(b.every(v=>v>52&&v<112),'graphite smoke grey');
 assert.ok(Math.max(...a)-Math.min(...a)<21,'main wood is neutral grey');
 assert.ok(Math.max(...b)-Math.min(...b)<22,'accent wood is neutral graphite grey');
 assert.ok(a.every((v,i)=>v>b[i]+35));
 assert.match(source,/facadeMaterials:\['vertical-weathered-silver-grey-timber','vertical-smoked-graphite-grey-timber'\]/);
 assert.match(source,/style==='scandi'\?new THREE\.MeshStandardMaterial\(\{\s*color:'#424A4C'/);
});
test('dark 76mm nonmetallic PVC frame and thin anthracite casing are preserved',()=>{
 const trim=windowTrimProfile('scandi');
 assert.equal(trim.material,'#2D3437');
 assert.ok(trim.width<=.05);
 assert.equal(SCANDI_DETAIL.windowFrame,'#222A2D');
 assert.match(source,/SCANDI_DETAIL\.windowFrame:'#181E20'/);
 assert.match(source,/const pvc=mat\(T,SCANDI_DETAIL\.windowFrame,\.43,0\)/);
 assert.match(source,/triple glazed 4-16-4-16-4/);
 assert.match(source,/['"]ig-unit-warm-edge-spacer['"]/);
 assert.match(source,/['"]upvc-drainage-weep-hole['"]/);
 assert.match(source,/scandi\?'#50585A'/);
});
test('vertical grey boards have local photographed CC0 wood fibres, not high-memory 3D cladding GLBs',()=>{
 const maps=['wood-nor_gl-1k.jpg','wood-rough-1k.jpg'];
 for(const filename of maps){
  const url=new URL('../assets/house-pbr/'+filename,import.meta.url);
  assert.ok(existsSync(url),filename);
 }
 assert.match(timber,/function timberTexture\(T,channel\)/);
 assert.match(timber,/wood-'\+channel\+'-1k\.jpg'/);
 assert.match(timber,/scandiTimberMaterial\(T,color\)/);
 assert.match(timber,/normalMap=timberTexture\(T,'nor_gl'\)/);
 assert.match(timber,/roughnessMap=timberTexture\(T,'rough'\)/);
 assert.match(timber,/new T\.InstancedMesh\(geometry,material,segments\.length\)/);
 assert.match(timber,/mesh\.setColorAt\(i,boardColor\.setRGB\(light,light,light\)\)/);
 assert.match(timber,/scandi-vertical-cladding-main/);
 assert.match(timber,/scandi-vertical-cladding-accent/);
 assert.match(timber,/scandi-gable-vertical-boards/);
});
test('roof eaves, concrete-supported timber stairs and water-safe sills do not shift the original house',()=>{
 const openings=facadeOpeningSchedule({width:11,depth:8,height:3.6,style:'scandi'}).front;
 const door=openings.find(x=>x.kind==='door');
 assert.ok(door);
 const band=scandiEntranceBand(openings,11);
 assert.ok(band.left<door.x&&band.right>door.x);
 const stair=scandiEntryStairSpec(door,11,8);
 assert.equal(stair.x,door.x);
 assert.deepEqual(stair.levels,[.16,.32,.48]);
 assert.ok(stair.landingDepth>=1.2);
 for(const part of ['gable-wind-board','gable-wind-flashing','wind-flashing-folded-return',
  'standing-seam-ridge-cap','entry-stair-supported-riser','entry-landing-core',
  'entry-canopy-drip-edge','rainscreen-corner-termination-x'])
  assert.ok(timber.includes(part),part);
 assert.match(source,/sill\.userData\.dripClearanceBeyondCladdingMm=52/);
 assert.match(source,/g\.userData\.footprint=\{width:w,height:d\}/);
});
