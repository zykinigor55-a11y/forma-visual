import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendBrushPoint,strokeSample,plantScatterPositions,strokeDistance,strokeRibbon} from '../forma-landscape-3d-strokes.js';

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
 assert.match(s,/controls\\.mouseButtons\\.LEFT=null/);
 assert.match(s,/e\\.pointerId!==state\\.activePointer/);
 assert.match(s,/strokeRibbon\\(pts,o\\.width\\|\\|1\\.2\\)/);
 assert.match(s,/geometry:'strip'/);
});
test('2D/3D project normalizer persists lawn ribbon geometry',async()=>{
 const {normalizeProject,freshProject}=await import('../forma-landscape-project-core.js');
 const d=freshProject();d.objects.push({id:'paint-1',catalogId:'universal',type:'lawns',geometry:'strip',width:2.5,points:[{x:1,y:2},{x:5,y:4}]});
 const saved=normalizeProject(d);const ribbon=saved.objects.find(x=>x.id==='paint-1');
 assert.equal(ribbon?.geometry,'strip');assert.equal(ribbon?.width,2.5);assert.equal(ribbon?.points?.length,2);
});

function area(pts){return Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%pts.length];return a+p.x*q.y-q.x*p.y},0))/2}
test('2m lawn ribbon renders as one smooth round-capped metric surface',()=>{
 const outline=strokeRibbon([{x:0,y:0},{x:10,y:0}],2,24);
 assert.ok(outline.length>35);
 assert.ok(outline.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.ok(Math.abs(area(outline)-(20+Math.PI))<.08,'Actual area '+area(outline));
 assert.ok(Math.max(...outline.map(x=>x.x))>10.9);
 assert.ok(Math.min(...outline.map(x=>x.x))<-.9);
});
test('painted corner and duplicate points create finite seamless ribbons',()=>{
 const poly=strokeRibbon([{x:2,y:2},{x:8,y:2},{x:8,y:9}],1.8);
 assert.ok(poly.length>=30&&area(poly)>18);
 assert.ok(poly.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.ok(strokeRibbon([{x:2,y:2},{x:2,y:2}],1).length>0);
});
test('300-point brush stroke survives 2D/3D model normalization',async()=>{
 const {normalizeProject,freshProject}=await import('../forma-landscape-project-core.js');
 const doc=freshProject();
 doc.objects.push({id:'o-lawnbrush',catalogId:'universal',type:'lawns',geometry:'strip',width:2,
  points:Array.from({length:300},(_,i)=>({x:2+i*.05,y:12+Math.sin(i/8)*.5}))});
 const obj=normalizeProject(doc).objects.find(x=>x.id==='o-lawnbrush');
 assert.equal(obj.points.length,300);
 assert.equal(obj.points[299].x,2+299*.05);
 assert.equal(obj.width,2);
});
