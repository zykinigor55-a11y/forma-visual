import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothPaintPath,simplifyPaintStroke,erasePaintedStrips,surfaceStrokeTouchesCircle} from '../forma-landscape-3d-surface-brush.js';
import {normalizeProject,freshProject} from '../forma-landscape-project-core.js';
import {readFileSync} from 'node:fs';

const lawn=(id='lawn')=>({id,catalogId:'universal',type:'lawns',geometry:'strip',width:2,points:[{x:1,y:5},{x:5,y:5},{x:10,y:5},{x:15,y:5}]});
test('fluid lawn stroke keeps precise endpoints, material, width, and smooths corners',()=>{
 const input=[{x:1,y:2},{x:5,y:2},{x:5,y:8},{x:7,y:9}];
 const output=smoothPaintPath(input);
 assert.ok(output.length>input.length);
 assert.deepEqual(output[0],input[0]);
 assert.deepEqual(output.at(-1),input.at(-1));
 assert.ok(output.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 assert.deepEqual(input[1],{x:5,y:2},'original GIS coordinates are preserved');
});
test('lawn eraser splits only the painted lawn into measured continuous fragments',()=>{
 const grass=lawn();const gravel={...lawn('gravel'),catalogId:'pine-bark',type:'fills'};
 const road={...lawn('road'),catalogId:'concrete-pavers',type:'pavers',geometry:'path'};
 const house={id:'house',type:'house',x:4,y:5};const tree={id:'tree',type:'trees',x:6,y:5};
 let n=0;
 const output=erasePaintedStrips([grass,gravel,road,house,tree],{
  point:{x:8,y:5},radius:.4,group:'lawns',makeId:()=>('split'+(++n))
 });
 assert.equal(output.changed,true);
 assert.equal(output.removed,1);
 assert.equal(output.objects.filter(x=>x.type==='lawns').length,2);
 assert.equal(output.objects.find(x=>x.type==='fills'),gravel);
 assert.equal(output.objects.find(x=>x.type==='pavers'),road);
 assert.equal(output.objects.find(x=>x.type==='house'),house);
 assert.equal(output.objects.find(x=>x.type==='trees'),tree);
 const halves=output.objects.filter(x=>x.type==='lawns');
 assert.equal(halves[0].catalogId,'universal');
 assert.equal(halves[1].width,2);
 assert.ok(halves.every(x=>x.points.length>2));
 assert.equal(new Set(halves.map(x=>x.id)).size,2);
});
test('erasing gravel never erases the surrounding lawn',()=>{
 const grass=lawn();const bark={...lawn('mulch'),catalogId:'pine-bark',type:'fills'};
 const out=erasePaintedStrips([grass,bark],{point:{x:8,y:5},radius:1,group:'fills',makeId:()=>Math.random().toString(36).slice(2)});
 assert.equal(out.objects.find(x=>x.type==='lawns'),grass);
 assert.ok(out.changed);
 assert.ok(out.objects.every(x=>x.type==='fills'||x===grass));
});
test('eraser leaves unrelated areas and paths intact and does not mutate input',()=>{
 const original=lawn(),objects=[original];
 assert.equal(surfaceStrokeTouchesCircle(original,{x:20,y:20},.5),false);
 const result=erasePaintedStrips(objects,{point:{x:20,y:20},radius:.5,group:'lawns',makeId:()=> 'x'});
 assert.equal(result.changed,false);
 assert.equal(result.objects,objects);
 assert.equal(objects[0].points.length,4);
});
test('split brush strokes survive saving between 2D and 3D',()=>{
 const d=freshProject();d.objects.push(lawn());
 let count=0;
 const result=erasePaintedStrips(d.objects,{point:{x:8,y:5},radius:.5,group:'lawns',makeId:()=> 'pt-'+(++count)});
 d.objects=result.objects;
 const normalized=normalizeProject(d);
 assert.equal(normalized.objects.length,2);
 assert.ok(normalized.objects.every(x=>x.geometry==='strip'&&x.width===2));
 assert.ok(normalized.objects.every(x=>x.points.length>=2));
});
test('actual 3D editor uses smooth surface geometry, local preview and disables camera while painting',()=>{
 const s=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(s,/smoothPaintPath\(o\.points\)/);
 assert.match(s,/function refreshActiveSurface\(\)/);
 assert.match(s,/drawArea\(o,entry,'object:'\+o\.id\)/);
 assert.match(s,/scheduleSurfacePreview\(\)/);
 assert.match(s,/erasePaintedStrips\(doc\.objects/);
 assert.match(s,/controls\.enabled=false;canvas\.setPointerCapture/);
 assert.match(s,/id="eraseSurfaceBrush"/);
 assert.match(s,/if\(state\.painting\)return;/);
});

test('long 1800-point gravel curves retain both endpoints and important bends within 512 saved points',()=>{
 const path=Array.from({length:1800},(_,i)=>({x:i*.02,y:10+Math.sin(i/33)*2}));
 const short=simplifyPaintStroke(path,512);
 assert.ok(short.length<=512,short.length);
 assert.deepEqual(short[0],path[0]);
 assert.deepEqual(short.at(-1),path.at(-1));
 assert.ok(short.some(p=>p.y>11.9),'important peak preserved');
 assert.ok(short.some(p=>p.y<8.1),'important trough preserved');
 const doc=freshProject();doc.objects.push({...lawn('long'),catalogId:'pine-bark',type:'fills',width:3.2,points:short});
 const saved=normalizeProject(doc);
 assert.equal(saved.objects[0].points.length,short.length);
 assert.equal(saved.objects[0].points.at(-1).x,path.at(-1).x);
});
test('brush completion stores simplified outlines rather than quietly truncating last metres',()=>{
 const src=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(src,/brushStroke\.object\.points=simplifyPaintStroke\(pts,512\)/);
});
