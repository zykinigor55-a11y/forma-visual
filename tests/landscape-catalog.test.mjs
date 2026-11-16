import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {catalogFor,landscapePrompt} from '../forma-art-direction-core.js';
import {itemBounds} from '../forma-local-composite.js';
const ui=await import('../forma-landscape-catalog.js').catch(()=>({}));
test('one placed spruce renders only its own image, never a contact sheet',()=>{
 assert.equal(typeof ui.placementMarkup,'function');
 const markup=ui.placementMarkup(catalogFor('tree').find(e=>e.id==='spruce-tall'),{x:100,y:200,w:180,h:300});
 assert.equal((markup.match(/<image\b/g)||[]).length,1);
 assert.match(markup,/spruce-tall\.webp/);assert.doesNotMatch(markup,/atlas|<svg/);
 assert.match(markup,/x="100"/);assert.match(markup,/height="300"/);
});
test('lawn and loose aggregate are separate discoverable groups using the same paint tool',()=>{
 assert.equal(typeof ui.catalogGroup,'function');
 assert.deepEqual(ui.catalogGroup('lawn').map(x=>x.id),['grass','groundcover']);
 assert.deepEqual(ui.catalogGroup('fill').map(x=>x.id),['gravel','white-gravel','bark']);
});
test('reference board includes paving and groundcover, deduplicates repeated species',()=>{
 assert.equal(typeof ui.referenceEntries,'function');
 const refs=ui.referenceEntries([{kind:'tree',catalogId:'spruce-tall'},{kind:'fill',catalogId:'grass'},{kind:'edge',catalogId:'stone-edge'},{kind:'tree',catalogId:'spruce-tall'}]);
 assert.deepEqual(refs.map(x=>x.entry.id),['spruce-tall','grass','stone-edge']);
});
test('every selectable landscape entry has a nonempty individual asset, including curbs',()=>{
 assert.equal(typeof ui.assetLayers,'function');
 for(const kind of ['plant','tree','fill','path','edge','object','light'])for(const entry of catalogFor(kind)){
  const layers=ui.assetLayers(entry);
  assert.ok(layers.length,entry.id);
  for(const l of layers)assert.ok(existsSync(new URL('../'+l.url,import.meta.url)),l.url);
 }
});
test('cast-shadow authorization reaches the ground beyond the plant anchor',()=>{
 const b=itemBounds({kind:'tree',x:.5,y:.6,w:.08,h:.4,influence:{shadow:.16}});
 assert.ok(b.bottom>=.76-1e-9,'old half-radius clipped the cast shadow');
});
test('landscape prompt maps each instance to its own reference and requires contact plus cast shadows',()=>{
 const p=landscapePrompt({speciesBoard:true,items:[{kind:'tree',catalogId:'spruce-tall',x:.4,y:.7,w:.1,h:.3},{kind:'tree',catalogId:'spruce-tall',x:.7,y:.7,w:.1,h:.3},{kind:'fill',catalogId:'grass',strokes:[{size:.04,points:[{x:.5,y:.8}]}]}]});
 assert.equal((p.match(/reference #1/g)||[]).length,2);
 assert.match(p,/reference #2/);assert.match(p,/contact and cast shadows/i);
});
test('a curb follows an open two-point line and reserves its actual strip width',async()=>{
 const {normalizeLandscape}=await import('../forma-art-direction-core.js');
 const item=normalizeLandscape({items:[{kind:'edge',catalogId:'stone-edge',points:[{x:.2,y:.7},{x:.8,y:.7}],edgeWidth:.04}]}).items[0];
 assert.equal(item.edgeWidth,.04);const b=itemBounds(item);assert.ok(b.y<=.68+1e-9);assert.ok(b.bottom>=.72-1e-9);
 assert.throws(()=>normalizeLandscape({items:[{...item,points:[{x:.4,y:.4},{x:.4,y:.4}]}]}));
});
