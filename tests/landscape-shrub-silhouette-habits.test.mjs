import test from 'node:test';
import assert from 'node:assert/strict';
import {SHRUB_ARCHITECTURE,shrubArchitecture} from '../forma-landscape-3d-vegetation.js';
import {NATIVE_UNDERSTORY} from '../forma-landscape-3d-understory.js';

test('the nine individual woody shrub forms have valid and distinct architectural habits',()=>{
 const ids=['juniper','hydrangea','spirea','barberry','dogwood','thuja-globe','lavender','boxwood','ninebark'];
 assert.deepEqual(Object.keys(SHRUB_ARCHITECTURE).sort(),ids.sort());
 const signatures=new Set();
 for(const id of ids){
  const p=shrubArchitecture(id);
  assert.ok(p,p?.habit||id);
  assert.ok(p.width>.5&&p.width<=1,id+': physical lateral reach');
  assert.ok(p.low>=0&&p.low<1,id+': plausible branching start');
  assert.ok(p.span>.1&&p.low+p.span<=1.01,id+': grows within measured height');
  assert.ok(p.branchlets>=8&&p.branchlets<=20,id+': shrub twig density budget');
  assert.ok(p.curve>=-.02&&p.curve<=.2,id+': natural stem curve');
  signatures.add(p.habit);
 }
 assert.equal(signatures.size,ids.length,'no shrub types share a generic form');
 assert.equal(shrubArchitecture('oak'),null,'mature tree does not accidentally use shrub form');
 assert.equal(shrubArchitecture('not-a-tree'),null);
});
test('arching species and creeping/compact species have natural branching differences',()=>{
 assert.ok(shrubArchitecture('dogwood').curve>shrubArchitecture('boxwood').curve);
 assert.ok(shrubArchitecture('spirea').branchlets>shrubArchitecture('hydrangea').branchlets);
 assert.ok(shrubArchitecture('juniper').low<shrubArchitecture('hydrangea').low);
 assert.ok(shrubArchitecture('thuja-globe').width<shrubArchitecture('ninebark').width);
 assert.ok(shrubArchitecture('lavender').branchlets<shrubArchitecture('barberry').branchlets);
});
test('native fern, hosta, periwinkle, grass and woodland shrub remain separate genuine geometry',()=>{
 assert.deepEqual(Object.keys(NATIVE_UNDERSTORY).sort(),
  ['fern','hosta','ornamental-grass','periwinkle','wild-shrub'].sort());
 for(const species of Object.keys(NATIVE_UNDERSTORY))
  assert.equal(shrubArchitecture(species),null,'never downgrade native 3D understory to generic shrub');
});
