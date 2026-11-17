import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProject,normalizeProject,report,areaFor,coordinateSummary} from '../forma-landscape-project-core.js';

const point=(x,y)=>({x,y});
const base=()=>{const d=freshProject();d.objects=[];return d;};

test('linear gravel strip persists with two vertices, measured width and type',()=>{
 const d=base();d.objects.push({id:'gravel-01',catalogId:'pine-bark',type:'fills',geometry:'strip',points:[point(1,2),point(11,2)],width:2});
 const saved=normalizeProject(JSON.parse(JSON.stringify(d)));
 assert.equal(saved.objects.length,1);
 assert.equal(saved.objects[0].geometry,'strip');
 assert.equal(saved.objects[0].width,2);
 assert.equal(areaFor(saved,saved.objects[0]),20);
 assert.equal(report(saved).lengths['pine-bark'],10);
 assert.equal(coordinateSummary(saved).objects[0].geometry,'strip');
});

test('closed gravel area fills its entire polygon and cannot be confused with a strip',()=>{
 const d=base();d.objects.push({id:'gravel-02',catalogId:'granite-chips',type:'fills',points:[point(2,3),point(12,3),point(12,8),point(2,8)],width:1.5});
 const saved=normalizeProject(d);
 assert.equal(saved.objects[0].geometry,undefined);
 assert.equal(areaFor(saved,saved.objects[0]),50);
 assert.equal(report(saved).areas['granite-chips'],50);
});

test('pond remains an area and two-point pond outlines are rejected',()=>{
 const d=base();d.objects=[
  {id:'pond-01',catalogId:'natural',type:'ponds',points:[point(1,1),point(9,1),point(9,7),point(1,7)],width:1.2},
  {id:'pond-02',catalogId:'natural',type:'ponds',points:[point(10,10),point(14,14)],width:1.2}
 ];
 const saved=normalizeProject(d);
 assert.equal(saved.objects.length,1);
 assert.equal(areaFor(saved,saved.objects[0]),48);
});

test('gravel strip eraser holes are preserved and measured lawn subtracts strips',()=>{
 const d=base();
 d.house.width=2;d.house.height=2;
 d.objects=[
  {id:'lawn-01',catalogId:'formal',type:'lawns',points:[point(0,0),point(30,0),point(30,40),point(0,40)],width:1.2,autoFill:true},
  {id:'gravel-03',catalogId:'river-pebble',type:'fills',geometry:'strip',points:[point(2,10),point(12,10)],width:2,holes:[[point(4,9),point(5,9),point(5,11),point(4,11)]]}
 ];
 const saved=normalizeProject(d);
 assert.equal(saved.objects[1].holes.length,1);
 assert.equal(areaFor(saved,saved.objects[0]),1176);
});

test('legacy polygon materials retain old shape semantics',()=>{
 const d=base();d.objects.push({id:'old-fill',catalogId:'pine-bark',type:'fills',points:[point(1,1),point(2,2)],width:1.2});
 assert.equal(normalizeProject(d).objects.length,0);
});
