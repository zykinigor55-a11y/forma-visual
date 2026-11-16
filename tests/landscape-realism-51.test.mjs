import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogFor,landscapePrompt} from '../forma-art-direction-core.js';
import {LANDSCAPE_REALISM,landscapePhysicalDetail} from '../forma-landscape-physical-details.js';
import {READY_HD_ASSETS} from '../forma-landscape-hd.js';
import {assetLayers,placementMarkup} from '../forma-landscape-catalog.js';

const kinds=['plant','tree','fill','path','edge','object','light'];
const objects=kinds.flatMap(kind=>catalogFor(kind).map(item=>({...item,kind})));

test('all 51 catalogue objects have their own physical realism constraints',()=>{
 assert.equal(objects.length,51);
 assert.equal(new Set(objects.map(x=>x.id)).size,51);
 assert.deepEqual(Object.keys(LANDSCAPE_REALISM).sort(),objects.map(x=>x.id).sort());
 for(const item of objects){
  const line=landscapePhysicalDetail(item.id);
  assert.ok(line.length>90,'unacceptably generic: '+item.id);
 }
});

test('all 18 shrub and tree botanical species are distinct, not just birches',()=>{
 const plants=objects.filter(x=>['plant','tree'].includes(x.kind));
 assert.equal(plants.length,18);
 assert.ok(plants.some(x=>x.id==='oak'));
 assert.ok(plants.some(x=>x.id==='pine-tall'));
 assert.ok(plants.some(x=>x.id==='spruce-tall'));
 assert.ok(plants.some(x=>x.id==='juniper'));
 assert.ok(plants.some(x=>x.id==='willow-nana'));
 assert.ok(plants.some(x=>x.id==='miscanthus'));
 assert.match(landscapePhysicalDetail('birch'),/Betula pendula/);
 assert.match(landscapePhysicalDetail('oak'),/Quercus robur/);
 assert.match(landscapePhysicalDetail('juniper'),/Juniperus horizontalis/);
 assert.notEqual(landscapePhysicalDetail('pine-tall'),landscapePhysicalDetail('pine-branch'));
});

test('a 2K master is never invented for a small local WebP thumbnail',()=>{
 assert.ok(Array.isArray(READY_HD_ASSETS));
 assert.equal(new Set(READY_HD_ASSETS).size,READY_HD_ASSETS.length);
 for(const [kind,id] of [['tree','birch'],['plant','juniper']]){
  const source=assetLayers(catalogFor(kind).find(x=>x.id===id),{detail:true})[0].url;
  const folder=READY_HD_ASSETS.includes(id)?'hd':'items';
  assert.equal(source,'assets/landscape/'+folder+'/'+id+'.webp');
 }
 assert.match(placementMarkup(catalogFor('plant').find(x=>x.id==='juniper')),/items\/juniper\.webp/);
});

test('grass, groundcover, tree and shrub instructions reach the actual AI request',()=>{
 const samples=[
  ['tree','pine-tall'],['tree','oak'],['tree','birch'],
  ['plant','juniper'],['plant','willow-nana'],
  ['fill','grass'],['fill','groundcover']
 ];
 const items=samples.map(([kind,catalogId],i)=>kind==='fill'?
  {kind,catalogId,strokes:[{size:.03,points:[{x:.2+i*.05,y:.9}]}]}:
  {kind,catalogId,x:.15+i*.1,y:.8,w:.07,h:.2});
 const prompt=landscapePrompt({items});
 for(const [,id] of samples){
  assert.ok(prompt.includes(landscapePhysicalDetail(id)),'missing realism text for '+id);
 }
 assert.match(prompt,/NOT sharpen/i);
 assert.match(prompt,/real photographed objects/i);
});
