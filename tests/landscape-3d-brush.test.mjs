import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendBrushPoint,strokeSample,plantScatterPositions,strokeDistance} from '../forma-landscape-3d-strokes.js';

test('lawn brush creates smooth intermediate points in metres',()=>{
 const pts=[{x:1,y:1}];
 for(const v of strokeSample(pts.at(-1),{x:4,y:1},.5))appendBrushPoint(pts,v,.25);
 assert.ok(pts.length>=6,JSON.stringify(pts));
 assert.ok(pts.every(p=>p.y===1));
 assert.ok(pts.every((p,i)=>i===0||strokeDistance(p,pts[i-1])<=.55));
});

test('brush samples do not collapse zero-distance drags',()=>{
 const p=[{x:2,y:3}];
 assert.deepEqual(strokeSample({x:2,y:3},{x:2,y:3},.5),[]);
 assert.equal(appendBrushPoint(p,{x:2.01,y:3},.4),false);
 assert.equal(appendBrushPoint(p,{x:2.5,y:3},.4),true);
});

test('shrub brush respects real spacing and measured coordinates',()=>{
 const pts=plantScatterPositions({x:0,y:0},{x:7,y:0},1.5);
 assert.deepEqual(pts.map(p=>p.x),[1.5,3,4.5,6]);
 assert.ok(pts.every(p=>p.y===0));
});

test('3D editor maps left-drag to brush and right-drag to orbit',()=>{
 const s=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(s,/controls\.mouseButtons\.RIGHT=THREE\.MOUSE\.ROTATE/);
 assert.match(s,/e\.pointerType==='mouse'&&e\.button!==0/);
 assert.match(s,/function beginBrush\(/);
 assert.match(s,/function advanceBrush\(/);
 assert.match(s,/function finishBrush\(/);
 assert.match(s,/controls\.enabled=false/);
 assert.match(s,/geometry:'strip'/);
});
test('2D/3D project normalizer persists lawn ribbon geometry',async()=>{
 const {normalizeProject,freshProject}=await import('../forma-landscape-project-core.js');
 const d=freshProject();d.objects.push({id:'paint-1',catalogId:'universal',type:'lawns',geometry:'strip',width:2.5,points:[{x:1,y:2},{x:5,y:4}]});
 const saved=normalizeProject(d);const ribbon=saved.objects.find(x=>x.id==='paint-1');
 assert.equal(ribbon?.geometry,'strip');assert.equal(ribbon?.width,2.5);assert.equal(ribbon?.points?.length,2);
});
