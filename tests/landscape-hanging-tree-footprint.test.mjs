import test from 'node:test';
import assert from 'node:assert/strict';
import {hangingTreeTerminal} from '../forma-landscape-3d-vegetation.js';

test('long willow and birch shoots bend downward without leaving surveyed crown diameter',()=>{
 const radius=3.4;
 for(const spread of [1.02,1.09,1.10]){
  for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI,5*Math.PI/4]){
   const x=Math.cos(angle)*radius*.97,z=Math.sin(angle)*radius*.97;
   const [px,y,pz]=hangingTreeTerminal(x,8,z,{radius,spread,drop:3.2});
   assert.ok(Math.hypot(px,pz)<=radius+1e-9,'terminal must stay within user measured crown');
   assert.ok(y<8,'terminal hangs below its own supporting branch');
   assert.ok(y>=.12,'foliage never goes below terrain');
  }
 }
});
test('metric crown sag stays finite and stable on saplings and very small crowns',()=>{
 const [x,y,z]=hangingTreeTerminal(2,.15,2,{radius:.2,drop:10,spread:1.1});
 assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
 assert.ok(Math.hypot(x,z)<=.20000001);
 assert.equal(y,.12);
 const neutral=hangingTreeTerminal(.3,4,-.1,{radius:1,drop:0,spread:1});
 assert.deepEqual(neutral,[.3,4,-.1]);
});
