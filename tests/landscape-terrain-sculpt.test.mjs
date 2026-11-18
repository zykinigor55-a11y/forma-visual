import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainBrushFalloff,applyTerrainBrush} from '../forma-landscape-3d-terrain-brush.js';

const GRID=10,WIDTH=20,LENGTH=20;
const empty=()=>Array((GRID+1)*(GRID+1)).fill(0);
const brush=(heights,options={})=>applyTerrainBrush({
 heights,grid:GRID,width:WIDTH,length:LENGTH,world:{x:0,z:0},
 mode:'raise',radius:4,strength:.5,softness:75,shape:'circle',...options
});
const at=(h,i,j)=>h[i*(GRID+1)+j];

test('round, soft terrain brush raises center but does not alter outer vertices',()=>{
 const input=empty(),result=brush(input);
 assert.equal(at(input,5,5),0,'the editor must not mutate undo snapshots');
 assert.ok(at(result,5,5)>.08&&at(result,5,5)<.13,'each brush event should produce a gentle centimetre-scale change');
 assert.equal(at(result,0,0),0);
 assert.equal(at(result,5,8),0);
 assert.ok(at(result,5,6)<at(result,5,5));
});
test('square brush includes corner cells beyond the circular radius, with soft edges',()=>{
 const square=brush(empty(),{radius:5,shape:'square',softness:0});
 const circle=brush(empty(),{radius:5,shape:'circle',softness:0});
 assert.ok(at(square,7,7)>0);
 assert.equal(at(circle,7,7),0);
 assert.equal(terrainBrushFalloff(0,0,3,75),1);
 assert.equal(terrainBrushFalloff(3,0,3,75),0);
});
test('lower, flatten, smooth and roughen are distinct, finite and clamped modes',()=>{
 const hill=brush(empty(),{mode:'raise',radius:5,strength:1});
 const lowered=brush(hill,{mode:'lower',radius:5,strength:.3});
 assert.ok(at(lowered,5,5)<at(hill,5,5));
 const flattened=brush(hill,{mode:'flatten',radius:5,strength:.8,world:{x:3,z:0}});
 assert.ok(flattened.every(Number.isFinite));
 const smooth=brush(hill,{mode:'smooth',radius:5,strength:.9});
 const range=h=>Math.max(...h)-Math.min(...h);
 assert.ok(range(smooth)<range(hill));
 const rough=brush(empty(),{mode:'roughen',radius:5,strength:.8});
 assert.ok(rough.some(x=>x>0)&&rough.some(x=>x<0));
});
test('brush respects irregular surveyed parcel, even when radius overlaps the boundary',()=>{
 const result=brush(empty(),{radius:8,contains:(x,y)=>x<=10});
 assert.equal(at(result,5,7),0);
 assert.ok(at(result,5,4)>0);
});
test('repeated strokes cannot exceed safe terrain vertical bounds',()=>{
 let terrain=empty();
 for(let n=0;n<50;n++)terrain=brush(terrain,{strength:2,softness:0,radius:9});
 assert.ok(Math.max(...terrain)<=12);
 for(let n=0;n<50;n++)terrain=brush(terrain,{mode:'lower',strength:2,softness:0,radius:9});
 assert.ok(Math.min(...terrain)>=-8);
});
