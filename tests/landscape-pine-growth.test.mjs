import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {PINE_TYPES,normalizePineGrowth,pineGrowthMarkup,pineGrowthEquals,pineDimensions} from '../forma-landscape-pine-growth.js';
import {nativePineProfile,reshapeNativePine} from '../forma-landscape-pine-native.js';

test('only age, height and type are exposed to the user',()=>{
 const markup=pineGrowthMarkup({age:42,pineType:'forest'},{height:17});
 for(const id of ['pineAge','pineHeight','pineType'])assert.match(markup,new RegExp('id="'+id+'"'));
 assert.match(markup,/value="42"/);assert.match(markup,/value="17"/);
 assert.doesNotMatch(markup,/type="range"|data-pine-growth-preset|pineNaturalRandom|pineGrow-branchDensity/);
 assert.equal(PINE_TYPES.length,3);
 assert.deepEqual(PINE_TYPES.map(x=>x.id),['solitary','forest','garden']);
});
test('age and type are normalized safely and persisted separately per original pine',()=>{
 assert.equal(normalizePineGrowth({age:500,pineType:'invalid'}).age,150);
 assert.equal(normalizePineGrowth({age:1}).age,3);
 assert.equal(normalizePineGrowth({age:35,pineType:'garden'}).pineType,'garden');
 assert.equal(pineGrowthEquals({age:35,pineType:'garden'},{age:35,pineType:'forest'}),false);
 const plot=freshProject();
 const saved=normalizeProject({...plot,objects:[
  {id:'a',catalogId:'pine',type:'trees',x:7,y:12,height:14,diameter:7,pine:{age:55,pineType:'garden'}},
  {id:'b',catalogId:'pine',type:'trees',x:17,y:12,height:9,diameter:4,pine:{age:14,pineType:'forest'}}
 ]});
 const again=normalizeProject(JSON.parse(JSON.stringify(saved)));
 assert.deepEqual(again.objects.map(o=>[o.pine.age,o.pine.pineType]),[[55,'garden'],[14,'forest']]);
 assert.equal(saved.objects[0].x,7);
});
test('pine dimensions follow actual height and selected crown type',()=>{
 assert.equal(pineDimensions(18,80,'forest').height,18);
 assert.ok(pineDimensions(18,80,'garden').diameter>pineDimensions(18,80,'forest').diameter);
 assert.ok(pineDimensions(18,80,'solitary').diameter>pineDimensions(18,8,'solitary').diameter);
 assert.ok(nativePineProfile({age:80,pineType:'garden'}).copies>=nativePineProfile({age:10,pineType:'garden'}).copies);
 assert.ok(nativePineProfile({age:60,pineType:'forest'}).copies<nativePineProfile({age:60,pineType:'garden'}).copies);
});
test('modification uses the exact native GLB needle/branch materials, no overlay tree',()=>{
 const native=readFileSync(new URL('../forma-landscape-pine-native.js',import.meta.url),'utf8');
 const model=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.equal(typeof reshapeNativePine,'function');
 assert.match(native,/pine_needles/);
 assert.match(native,/pine_branch/);
 assert.match(native,/mesh\.geometry=replacement/);
 assert.match(native,/mesh\.userData\.pineNativeSculpted=true/);
 assert.match(model,/reshapeNativePine\(T,clone,pineGrowth\)/);
 assert.doesNotMatch(model,/makePineExtraGrowth/);
 assert.match(editor,/canopyCopies:0/);
 assert.match(editor,/pineGrowthMarkup\(o\.pine,o\)/);
 assert.match(editor,/commitSelectedPineGrowth\(o,value\)/);
 assert.doesNotMatch(editor,/mountPineSizing\(|pineScaleHeight|makePineExtraGrowth\(/);
});
