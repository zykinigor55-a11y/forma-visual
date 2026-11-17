import test from 'node:test';
import assert from 'node:assert/strict';
import {snapPathPoint,translatePoints} from '../forma-landscape-project-core.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const site={width:30,height:40,boundary:null};
test('parallel segments retain exact axes and diagonal segments retain equal deltas at borders',()=>{
 const a={x:4,y:6};const p=snapPathPoint(a,{x:17,y:9},'orthogonal',site);near(p.y,6);
 const d=snapPathPoint(a,{x:29,y:38},'diagonal',site);near(d.x-a.x,d.y-a.y);near(d.x,30);
 assert.deepEqual(snapPathPoint(a,{x:13,y:9},'free',site),{x:13,y:9});
});
test('irregular parcel reference edge rotates parallel and diagonal directions',()=>{
 const rotated={...site,boundary:[{x:0,y:0},{x:20,y:10},{x:30,y:40},{x:0,y:40}]};
 const a={x:4,y:8},b=snapPathPoint(a,{x:18,y:13},'orthogonal',rotated);
 near((b.y-a.y)/(b.x-a.x),.5);
});
test('moving entire path to a border keeps every segment length and angle',()=>{
 const pts=[{x:3,y:4},{x:10,y:4},{x:10,y:12}];
 const moved=translatePoints(pts,100,-100,site);
 assert.deepEqual(moved,[{x:23,y:0},{x:30,y:0},{x:30,y:8}]);
});
