import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS,entranceDetailPlan} from '../forma-landscape-3d-buildings.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
import {NATIVE_UNDERSTORY} from '../forma-landscape-3d-understory.js';
import {specimenCrownVariation} from '../forma-landscape-3d-reference-canopies.js';
import {atmosphereLighting,normalizeSceneAtmosphere} from '../forma-landscape-3d-atmosphere.js';
import {outdoorReflectionPalette} from '../forma-landscape-3d-environment.js';
const buildingSource=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');
const vegetationSource=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
const understorySource=readFileSync(new URL('../forma-landscape-3d-understory.js',import.meta.url),'utf8');
const uiSource=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('quality improvements retain 18 measured houses and 27 current species and archived linden',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 assert.equal(Object.keys(VEGETATION_SPECIES).length,28);
 for(const id of Object.keys(NATIVE_UNDERSTORY))assert.ok(VEGETATION_SPECIES[id]);
 for(const id of ['pine','spruce','birch','oak','spirea']){
  assert.ok(VEGETATION_SPECIES[id],id);
 }
});

test('existing house roof slabs and log crowns are physical but measured footprints unchanged',()=>{
 assert.match(buildingSource,/new T\.BoxGeometry\(slopeLength,\.32,depth\)/);
 assert.match(buildingSource,/function thickHipRoofFace\(/);
 assert.match(buildingSource,/roof\.userData\.roofThickness=\.32/);
 assert.match(buildingSource,/roundPipeBetween\(g,T,hub,middle,\.079,metal,'gutter-elbow'\)/);
 assert.match(buildingSource,/new T\.CylinderGeometry\(\.12,\.12,depth-\.05,22,1,true,Math\.PI,Math\.PI\)/);
 for(const facade of ['front','rear','left','right'])
  assert.ok(buildingSource.includes("'"+facade+"'"),facade+' has authored log crown coursing');
 assert.match(buildingSource,/const openings=facadePlan\[face\]/);
 assert.match(buildingSource,/g\.userData\.footprint=\{width:w,height:d\}/);
 const doors=[{kind:'door',x:1.2,width:1.1,height:2,bottom:.48},
  {kind:'window',x:-2,width:1.4,height:1.3,bottom:1.2}];
 const plan=entranceDetailPlan('brick',doors,12,8);
 assert.equal(plan.length,1);
 assert.equal(plan[0].x,1.2);
 assert.equal(plan[0].front,4);
 assert.deepEqual(entranceDetailPlan('none',doors,12,8),[]);
});

test('conifers retain adult branch-connected needle geometry with bounded instance counts',()=>{
 assert.ok(VEGETATION_SPECIES.pine.density>=1600);
 assert.ok(VEGETATION_SPECIES.spruce.density>=2000);
 assert.match(vegetationSource,/Math\.round\(points\.length\*quality\*\(needle\?2\.5:2\.45\)\)/);
 assert.match(vegetationSource,/shrub\?1650:needle\?2900:5400/);
 assert.match(vegetationSource,/const leafLength=conifer\?/);
 for(const id of ['pine','spruce','birch','oak','spirea']){
  for(const a of [0,.7,2.3,5.9])for(const t of [.2,.5,.8]){
   const radius=specimenCrownVariation(id,t,a,73);
   assert.ok(radius>=.72&&radius<=1.015,id+' bounded asymmetric silhouette');
  }
 }
 assert.match(understorySource,/form==='fronds'\?\.115/);
 assert.match(understorySource,/form==='fronds'\?height\*\(\.55\+r\(\)\*\.13\)/);
 assert.match(understorySource,/function fernPinnaeGeometry\(T\)/);
 assert.match(understorySource,/if\(form==='fronds'&&k<steps\)continue/);
});

test('more sky light does not blow out day materials and night scene is visible',()=>{
 const day=atmosphereLighting({time:'day',weather:'sunny',siteSize:50});
 const night=atmosphereLighting({time:'night',weather:'sunny',siteSize:50});
 const dim=atmosphereLighting({time:'night',weather:'sunny',siteSize:50,settings:{nightGlow:0}});
 assert.ok(day.skyFillIntensity>1.5&&day.skyFillIntensity<2.5);
 assert.ok(night.skyFillIntensity>.4&&night.skyFillIntensity<day.skyFillIntensity);
 assert.ok(night.bouncedFillIntensity>dim.bouncedFillIntensity);
 assert.ok(day.fogNear>0&&day.fogFar>day.fogNear);
 assert.ok(night.fogFar>night.fogNear);
 assert.ok(outdoorReflectionPalette('night').horizon!==outdoorReflectionPalette('day').horizon);
 assert.equal(normalizeSceneAtmosphere({clouds:1000}).clouds,100);
});

test('water ripple changes its shaded surface, never measured waterline or shape',()=>{
 assert.match(uiSource,/if\(water\)\{o\.userData\.formaWater=true/);
 assert.match(uiSource,/bumpMap:waterRippleTexture/);
 assert.match(uiSource,/bumpScale:sceneAtmosphere\.ripples\*\.00023/);
 assert.match(uiSource,/const waterLevel=water\?Math\.min/);
 assert.match(uiSource,/animateWaterRipple\(waterRippleTexture,now,sceneAtmosphere\.ripples\)/);
});
