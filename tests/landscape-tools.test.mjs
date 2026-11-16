import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeLandscape,catalogFor} from '../forma-art-direction-core.js';
import {itemBounds} from '../forma-local-composite.js';
const t=await import('../forma-landscape-tools.js').catch(()=>({}));
test('plant scaling preserves the ratio and the ground anchor',()=>{assert.equal(typeof t.scalePlacement,'function');const a={x:.5,y:.7,w:.1,h:.3};const b=t.scalePlacement(a,2);assert.equal(b.w/b.h,a.w/a.h);assert.equal(b.y,.7);});
test('fill brush strokes retain their operation and thickness',()=>{const v=normalizeLandscape({items:[{id:'b',kind:'fill',catalogId:'gravel',strokes:[{size:.03,erase:false,points:[{x:.2,y:.4},{x:.3,y:.5}]}]}]});assert.equal(v.items[0].strokes[0].size,.03);});
test('influence mask includes reflection below the placed object',()=>{const b=itemBounds({kind:'plant',x:.5,y:.6,w:.1,h:.2,influence:{shadow:.15,reflection:.3}});assert.ok(b.bottom>=.9-.000001);assert.ok(b.right>=.7);});
test('tree and garden lighting catalog has tall tree variants and more outdoor fixtures',()=>{assert.ok(catalogFor('tree').some(v=>v.id==='pine-tall'));assert.ok(catalogFor('tree').some(v=>v.id==='birch'));assert.ok(catalogFor('light').length>=10);});
test('moving a group retains relative positions at the image boundary',()=>{assert.equal(typeof t.translateGroup,'function');const list=[{id:'a',kind:'plant',x:.8,y:.7,w:.1,h:.2},{id:'b',kind:'plant',x:.9,y:.7,w:.1,h:.2}];const result=t.translateGroup(list,new Set(['a','b']),.3,0);assert.ok(result[1].x<=1);assert.ok(Math.abs(result[1].x-result[0].x-.1)<1e-9);});
test('planted planters contain a named plant in their generation prompt',()=>{const pot=catalogFor('object').find(v=>v.id==='concrete-pot');assert.match(pot.prompt,/planted.*pine/i);assert.ok(pot.planted);});
test('large foreground trees keep proportions above the old ninety percent ceiling',()=>{const a={kind:'tree',catalogId:'spruce-tall',x:.5,y:.9,w:.2,h:.48};const b=t.scalePlacement(a,6);assert.ok(b.h>2);assert.ok(Math.abs(b.w/b.h-a.w/a.h)<1e-12);assert.equal(normalizeLandscape({items:[b]}).items[0].h,b.h);const influence=t.automaticInfluence(b);assert.equal(influence.shadow,.4);assert.equal(influence.reflection,.7);});
test('5000 percent scaling survives normalization without shrinking or changing proportions',()=>{
 const a={kind:'tree',catalogId:'pine-tall',x:.9,y:.95,w:.1,h:.2};
 const b=t.scalePlacement(a,50);assert.equal(b.h,10);assert.equal(b.w,5);assert.equal(b.y,a.y);
 const n=normalizeLandscape({items:[b]}).items[0];assert.equal(n.h,10);assert.equal(n.w,5);
});
