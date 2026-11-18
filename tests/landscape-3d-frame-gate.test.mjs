import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameGate} from '../forma-landscape-3d-frame-gate.js';
import {readFileSync} from 'node:fs';

test('one initial render, no busy-loop while scene and camera remain still',()=>{
 const gate=createFrameGate();
 assert.equal(gate.allow(0,{interval:20}),true);
 for(let i=1;i<1000;i++)assert.equal(gate.allow(i*20,{interval:20}),false);
 assert.equal(gate.stats.rendered,1);
 assert.equal(gate.stats.skipped,999);
});
test('camera orbit/damping always schedules redraw, respecting frame budget',()=>{
 const gate=createFrameGate();
 assert.equal(gate.allow(0,{interval:20}),true);
 assert.equal(gate.allow(5,{cameraMoved:true,interval:20}),false);
 assert.equal(gate.allow(25,{interval:20}),true,'Pending camera move is preserved');
 assert.equal(gate.allow(50,{cameraMoved:true,interval:20}),true);
});
test('brush, selection and glTF replacement invalidate a settled frame',()=>{
 const gate=createFrameGate();
 assert.equal(gate.allow(0),true);
 assert.equal(gate.allow(25),false);
 gate.invalidate();
 assert.equal(gate.allow(30),true);
 assert.equal(gate.allow(40,{walking:true,interval:10}),true);
});
test('resize and context restoration can reset draw scheduling',()=>{
 const gate=createFrameGate();
 assert.equal(gate.allow(0),true);
 gate.reset();
 assert.equal(gate.allow(2),true);
});
test('3D editor uses demand-driven rendering in perspective, plan and walk modes',()=>{
 const s=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(s,/createFrameGate\(\)/);
 assert.match(s,/renderGate\.allow\(now,\{cameraMoved,walking:activeWalk,interval\}\)/);
 for(const phrase of ['function rebuild(){\n renderGate.invalidate()','function setView(view){\n renderGate.invalidate()','function updateBrushCursor(event){\n renderGate.invalidate()','function resize(){renderGate.invalidate()'])assert.ok(s.includes(phrase),phrase);
});
