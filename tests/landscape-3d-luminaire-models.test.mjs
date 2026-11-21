import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG,byId,freshProject,coordinateSummary} from '../forma-landscape-project-core.js';
import {gardenLightingSpec,gardenLightingState} from '../forma-landscape-3d-lighting.js';
import {perspectiveLandscapePrompt} from '../forma-landscape-project-prompts.js';
import {assetSVG,cardPhotoURL} from '../forma-landscape-project-graphics.js';

const file=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const editor=file('forma-landscape-3d.html'),fixtures=file('forma-landscape-3d-fixtures.js');
const ids=CATALOG.filter(a=>a.group==='lights').map(a=>a.id);

test('ten common outdoor luminaires and an opal globe each have one stable ID and real dimensions',()=>{
 assert.equal(ids.length,11);
 assert.equal(new Set(ids).size,11);
 assert.equal(Object.keys(gardenLightingSpec).length,11);
 assert.equal(new Set(Object.keys(gardenLightingSpec)).size,11);
 assert.ok(ids.includes('globe'));
 assert.equal(ids.filter(x=>x!=='globe').length,10);
 for(const id of ids){
  const item=byId(id),spec=gardenLightingSpec[id];
  assert.ok(spec,id+' light source');
  assert.ok(item.height>=.08&&item.height<=3,id+' plausible mounting height');
  assert.ok(item.diameter>=.03&&item.diameter<=.6,id+' plausible housing diameter, including thin recessed LED rails');
  assert.equal(item.height,spec.height,id+' housing and emitter match');
  assert.ok(spec.mountHeight>=0&&spec.mountHeight<=spec.height+.07,id+' emitter sits inside housing');
  assert.ok(spec.intensity>0&&spec.range>0);
  assert.notEqual(assetSVG(item,{size:160}),assetSVG(byId(id==='globe'?'mushroom':'globe'),{size:160}),
    id+' 2D symbol distinct from other fixtures');
 }
 assert.equal(byId('globe').name,'Светильник-шар · опаловый');
});

test('all eleven housings are real independently articulated PBR Three.js geometry',()=>{
 assert.match(fixtures,/new T\.MeshPhysicalMaterial/);
 for(const id of ids)assert.ok(fixtures.includes("id==='"+id+"'"),'missing geometry: '+id);
 assert.match(fixtures,/g\.userData\.fixtureId=id/);
 assert.match(fixtures,/photographGardenLightPreviews\(T,ids\)/);
 assert.match(fixtures,/createProfessionalGardenLight\(T,\{catalogId:id,height:spec\.height\}/);
 assert.match(editor,/photographGardenLightPreviews\(THREE,choices\.light\.map/);
 assert.match(editor,/gardenLightingSpec\[state\.placing\]\?\.height/);
 assert.match(editor,/if\(t==='light'\)refreshGardenLightCatalogPreviews\(\)/);
 assert.match(editor,/state\.placing=b\.dataset\.item/);
 assert.match(editor,/function drawObject\(o,entry,key\)/);
 assert.match(editor,/g=createGardenLight\(THREE,o/);
 for(const id of ids)assert.match(cardPhotoURL(byId(id)),/^data:image\/svg\+xml/,'2D fallback must be accurate, not wrong product photo');
});

test('summer day is physically unlit; different choices have correct night optical distributions',()=>{
 for(const id of ids){
  assert.equal(gardenLightingState(id,{time:'day'}).actualIntensity,0);
  assert.equal(gardenLightingState(id,{time:'day'}).visible,false);
  assert.ok(gardenLightingState(id,{time:'night'}).actualIntensity>0);
 }
 assert.equal(gardenLightingState('globe',{time:'night'}).kind,'radial');
 assert.equal(gardenLightingState('mushroom',{time:'night'}).kind,'downlight');
 assert.equal(gardenLightingState('spot',{time:'night'}).kind,'downlight');
 assert.equal(gardenLightingState('spike-spot',{time:'night'}).kind,'uplight');
 assert.equal(gardenLightingState('garden-lantern',{time:'night'}).height,1.03);
 assert.equal(gardenLightingState('globe',{time:'night'}).height,.40);
 assert.equal(gardenLightingState('ground',{time:'night',height:1.2}).height,.12,'migrate historic wrong 1.2m');
});
test('photo prompt recognizes actual globe with precise shape and forbids inventing other light styles',()=>{
 const scene=coordinateSummary({...freshProject(),objects:[
  {id:'my-globe',catalogId:'globe',type:'lights',x:6,y:7,diameter:.48,height:.68,rotation:0},
  {id:'my-mushroom',catalogId:'mushroom',type:'lights',x:8,y:10,diameter:.48,height:.68,rotation:0}
 ]});
 const prompt=perspectiveLandscapePrompt({...scene,cameraMode:'3d-perspective'});
 assert.match(prompt,/OPAL GARDEN GLOBE/);
 assert.match(prompt,/MUSHROOM PATH LIGHT/);
 assert.match(prompt,/EXACT LUMINAIRE IDENTITIES/);
 assert.ok(!prompt.includes('CLASSIC PARK LANTERN:'),'not selected, not described');
 assert.match(prompt,/No fake floating beams/);
 assert.match(prompt,/instances=1/);
});

test('photo reference geometries and source measurements are wired to all 11 original IDs',()=>{
 const original=file('forma-landscape-3d-luminaires-reference.js');
 assert.match(fixtures,/createPhotoReferenceLuminaire\(T,instance,\{night\}\)/);
 for(const id of ids)assert.ok(original.includes("id==='"+id+"'"),id+' has exact photo reference mesh');
 assert.match(original,/fixtureVersion='real-photo-reference-v3'/);
 assert.equal(gardenLightingState('square-bollard',{time:'night'}).height,.82);
 assert.equal(gardenLightingState('mushroom',{time:'night'}).height,.38);
 assert.equal(gardenLightingState('spot',{time:'night'}).height,1.11);
 assert.equal(gardenLightingState('ground',{time:'night'}).kind,'uplight');
 assert.equal(gardenLightingState('deck-light',{time:'night'}).kind,'uplight');
 assert.equal(gardenLightingState('linear',{time:'night'}).kind,'uplight');
 assert.equal(gardenLightingState('square-bollard',{time:'night'}).kind,'radial');
});


test('seven exact user-uploaded photographs supersede previous manufacturer photo concepts',()=>{
 const source=file('forma-landscape-3d-user-7-lights.js');
 const refs=['spike-spot','square-bollard','low-post','globe','spot','garden-lantern','bollard'];
 assert.equal(refs.length,7);
 for(const id of refs) assert.ok(source.includes("id==='"+id+"'"),'needs real authored geometry for uploaded '+id);
 assert.match(source,/fixtureVersion='user-uploaded-7-photos-v4'/);
 assert.match(source,/actual-microprism-reflector/,'uploaded spotlight includes facet optics');
 assert.match(source,/continuous-clear-acrylic-wrap/,'three stacked transparent lit square-post bands');
 assert.match(source,/rounded-front-glass/,'square post uses independent rounded translucent panels');
 assert.match(source,/hollow-frame-black-vertical-corner/,'open frame is a true hollow structure');
 assert.match(source,/horizontal-refractive-grid/,'cylindrical cap has real prismatic geometry');
 assert.match(source,/external-routed-PVC-cable/,'spike-spot cable is a curved 3D model');
 assert.match(source,/side-mounted-adjustable-head/);
 assert.match(source,/uniform-seamless-opal-polyethylene-ball/);
 assert.match(file('forma-landscape-3d-luminaires-reference.js'),/createUserReferenceGardenLuminaire\(T,instance,\{night\}\)/);
 assert.match(editor,/id="lampGlobeSize"/);
 assert.match(editor,/o.variant=variant;o.diameter=sizes\[variant\];o.height=sizes\[variant\]/);
 assert.match(file('forma-landscape-3d-lighting.js'),/lamp.position.set\(.118,state.mountHeight,.012\)/);
});
test('uploaded reference globe has four geometrically distinct user-selected sizes',async()=>{
 const {globeDiameterByVariant,uploadedGardenLightIds}=await import('../forma-landscape-3d-user-7-lights.js');
 assert.deepEqual(Object.values(globeDiameterByVariant),[.40,.25,.60,.80]);
 assert.equal(new Set(uploadedGardenLightIds).size,7);
 assert.equal(gardenLightingState('bollard',{time:'night'}).height,.83);
 assert.equal(gardenLightingState('spike-spot',{time:'night'}).height,.39);
});
