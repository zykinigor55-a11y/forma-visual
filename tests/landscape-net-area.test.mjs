import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProject,normalizeProject,report,coordinateSummary} from '../forma-landscape-project-core.js';
import {visibleSurfaceAreas} from '../forma-landscape-area.js';

const p=(x,y)=>({x,y});
const poly=(id,material,type,points,extra={})=>({id,catalogId:material,type,points,width:1.5,...extra});
const project=()=>{const d=freshProject();d.house.x=25;d.house.y=35;d.house.width=2;d.house.height=2;return d;};
const eq=(a,b)=>assert.ok(Math.abs(a-b)<.03,'expected '+b+'m², found '+a+'m²');

test('overlapping polygons of same pond type count only occupied area',()=>{
 const d=project();
 d.objects=[poly('p1','natural','ponds',[p(2,2),p(4,2),p(4,6),p(2,6)],{geometry:'paint'}),
            poly('p2','natural','ponds',[p(3,3),p(5,3),p(5,6),p(3,6)])];
 eq(report(d).areas.natural,11); // previously 8 + 6 = 14 (wrong).
 eq(coordinateSummary(d).measured.areas.natural,11);
 assert.equal(report(d).areaPrecision,'polygon');
});

test('offset 3x3 pond squares overlap by 2x2, 9 + 9 - 4 = 14m²',()=>{
 const d=project();d.objects=[
 poly('p1','natural','ponds',[p(0,0),p(3,0),p(3,3),p(0,3)]),
 poly('p2','natural','ponds',[p(1,1),p(4,1),p(4,4),p(1,4)])
 ];
 eq(report(d).areas.natural,14);
});

test('higher surfaces replace lawns and lower fill; no double count',()=>{
 const d=project();d.objects=[
 poly('l','formal','lawns',[p(0,0),p(10,0),p(10,10),p(0,10)],{autoFill:true}),
 poly('gravel','granite-chips','fills',[p(1,1),p(3,1),p(3,3),p(1,3)]),
 poly('pond','natural','ponds',[p(2,2),p(8,2),p(8,8),p(2,8)])
 ];
 const a=report(d).areas;
 eq(a.natural,36);eq(a['granite-chips'],3);eq(a.formal,61);
 eq(Object.values(a).reduce((sum,n)=>sum+n,0),100);
});

test('mask the plot and house; correct clipping against irregular boundary',()=>{
 const d=project();d.site.boundary=[p(0,0),p(5,0),p(5,5),p(0,5)];
 d.objects=[poly('p','natural','ponds',[p(2,2),p(8,2),p(8,8),p(2,8)])];
 eq(report(d).areas.natural,9);
 const h=project();h.house={...h.house,x:5,y:5,width:4,height:4};
 h.objects=[poly('p','natural','ponds',[p(2,2),p(8,2),p(8,8),p(2,8)])];
 eq(report(h).areas.natural,20);
});

test('polygon eraser holes subtract from actual region',()=>{
 const d=project();d.objects=[poly('p','natural','ponds',[p(0,0),p(10,0),p(10,10),p(0,10)],{
  holes:[[p(2,2),p(4,2),p(4,4),p(2,4)]]
 })];
 eq(report(d).areas.natural,96);
});

test('paved crossing masks lawn, area includes rounded caps, not just width × length',()=>{
 const d=project();d.objects=[
 poly('l','formal','lawns',[p(0,0),p(10,0),p(10,10),p(0,10)]),
 poly('path','concrete-pavers','pavers',[p(2,5),p(8,5)],{width:2})
 ];
 const r=report(d);
 eq(r.areas['concrete-pavers'],15.10582854);
 eq(r.areas.formal+r.areas['concrete-pavers'],100);
 eq(r.lengths['concrete-pavers'],6);
});

test('clear everything but path retains house dimensions and measured paving',()=>{
 const d=project();d.objects=[
 poly('p','natural','ponds',[p(1,1),p(3,1),p(3,3),p(1,3)]),
 poly('path','concrete-pavers','pavers',[p(5,5),p(14,5)],{width:1.5})
 ];
 const original=normalizeProject(d);
 const cleared=normalizeProject({...original,objects:original.objects.filter(x=>x.type==='pavers'),buildings:[]});
 assert.equal(cleared.objects.length,1);
 assert.equal(cleared.objects[0].catalogId,'concrete-pavers');
 assert.deepEqual(cleared.house,original.house);
 assert.equal(report(cleared).areas.natural,undefined);
});

test('large model exposes precision status instead of pretending exact',()=>{
 const d=project();d.objects=[];
 for(let i=0;i<40;i++)d.objects.push(poly('a'+i,'natural','ponds',[
 p(i%20+.1,5),p(i%20+.7,5),p(i%20+.7,5.5),p(i%20+.1,5.5)
 ]));
 const r=visibleSurfaceAreas(d);
 assert.ok(['polygon','estimated'].includes(r.precision));
 assert.ok(r.areas.natural>=0);
});
