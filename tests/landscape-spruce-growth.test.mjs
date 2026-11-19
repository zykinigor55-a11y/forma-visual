import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {SPRUCE_STAGES,normalizeSpruceGrowth,spruceStageForAge,spruceDimensions,spruceGrowthMarkup} from '../forma-landscape-spruce-growth.js';
import {spruceNativeProfile,reshapeNativeSpruce} from '../forma-landscape-spruce-native.js';

test('the three exact species stages are young low, original ordinary and century-old',()=>{
 assert.deepEqual(SPRUCE_STAGES.map(x=>x.id),['young','ordinary','century']);
 assert.deepEqual(SPRUCE_STAGES.map(x=>x.height),[5,16,28]);
 assert.equal(spruceStageForAge(12),'young');
 assert.equal(spruceStageForAge(48),'ordinary');
 assert.equal(spruceStageForAge(115),'century');
 assert.equal(normalizeSpruceGrowth({type:'century',age:115}).age,115);
 assert.equal(normalizeSpruceGrowth({type:'bad'}).type,'ordinary');
 assert.equal(spruceDimensions(5,'young').height,5);
 assert.equal(spruceDimensions(16,'ordinary').diameter,9);
 assert.equal(spruceDimensions(28,'century').diameter,13.5);
});
test('only 3 inputs, no density sliders or duplicate-tree controls',()=>{
 const m=spruceGrowthMarkup({type:'century',age:115},{height:28});
 for(const id of ['spruceType','spruceAge','spruceHeight'])assert.ok(m.includes('id="'+id+'"'),id);
 assert.match(m,/Вековая/);
 assert.match(m,/value="28"/);
 assert.match(m,/value="115"/);
 assert.doesNotMatch(m,/type="range"|density|data-spruce-preset/);
});
test('spruce profile grows lower native crown and trunk, preserving ordinary source',()=>{
 const young=spruceNativeProfile({type:'young'}),normal=spruceNativeProfile({type:'ordinary'}),old=spruceNativeProfile({type:'century'});
 assert.equal(normal.stage,'ordinary');
 assert.equal(normal.lowerCrown,1);
 assert.ok(young.lowerCrown<1);
 assert.ok(old.lowerCrown>1);
 assert.ok(old.trunk>1);
 assert.equal(typeof reshapeNativeSpruce,'function');
});
test('age, type, world height and location survive plan serialization without clones',()=>{
 const d=freshProject();
 const objects=[
  {id:'spruce-young',type:'trees',catalogId:'spruce',x:4,y:8,height:5,diameter:2.7,spruce:{type:'young',age:12}},
  {id:'spruce-normal',type:'trees',catalogId:'spruce',x:13,y:8,height:16,diameter:9,spruce:{type:'ordinary',age:48}},
  {id:'spruce-old',type:'trees',catalogId:'spruce',x:24,y:8,height:28,diameter:13.5,spruce:{type:'century',age:115}},
  {id:'birch',type:'trees',catalogId:'birch',x:35,y:8,height:14,diameter:8}
 ];
 const saved=normalizeProject({...d,objects});
 const restored=normalizeProject(JSON.parse(JSON.stringify(saved)));
 assert.equal(restored.objects.length,4);
 assert.deepEqual(restored.objects.filter(o=>o.catalogId==='spruce').map(o=>o.spruce.type),['young','ordinary','century']);
 assert.deepEqual(restored.objects.filter(o=>o.catalogId==='spruce').map(o=>o.height),[5,16,28]);
 assert.deepEqual(restored.objects.filter(o=>o.catalogId==='spruce').map(o=>o.x),[4,13,24]);
 assert.equal(restored.objects[3].spruce,undefined);
});
test('existing GLB buffers are morphed instead of extra model and planted dimensions are exact',()=>{
 const adapter=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 const native=readFileSync(new URL('../forma-landscape-spruce-native.js',import.meta.url),'utf8');
 assert.match(adapter,/reshapeNativeSpruce\(T,clone,spruceGrowth\)/);
 assert.match(adapter,/placementBounds=new T\.Box3\(\)\.setFromObject\(clone\)/);
 assert.match(adapter,/fit=vegetationFit\(\{width:sculptedSize\.x/);
 assert.match(native,/mesh\.geometry=edited/);
 assert.match(native,/mesh\.userData\.bundledSharedGeometry=false/);
 assert.match(native,/profile\.stage==='ordinary'/);
 assert.match(editor,/spruceGrowth:o\.catalogId==='spruce'\?normalizeSpruceGrowth\(o\.spruce\):null/);
 assert.match(editor,/if\(isSpruce\)mountSpruceGrowth\(el,o,/);
 assert.match(editor,/commitSelectedSpruceGrowth\(o,value\)/);
 assert.match(editor,/push\(\);o\.spruce=next;o\.height=dims\.height;o\.diameter=dims\.diameter/);
 assert.match(editor,/if\(\['pine','spruce','birch'\]\.includes\(selected\?\.catalogId\)\)/);
});
