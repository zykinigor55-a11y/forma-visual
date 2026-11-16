import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalogFor,landscapePrompt} from '../forma-art-direction-core.js';
import {LANDSCAPE_REALISM,landscapePhysicalDetail} from '../forma-landscape-physical-details.js';
import {LANDSCAPE_GROUPS,catalogGroup,assetLayers,placementMarkup} from '../forma-landscape-catalog.js';
import {READY_HD_ASSETS} from '../forma-landscape-hd.js';

const categories=['plant','tree','fill','path','edge','object','light'];
const entries=categories.flatMap(kind=>catalogFor(kind).map(entry=>({kind,...entry})));
const kinds={plant:8,tree:10,fill:5,path:6,edge:5,object:5,light:12};

test('all 51 landscape catalog assets exist in complete categorized inventory',()=>{
 assert.equal(entries.length,51);
 for(const [kind,count] of Object.entries(kinds))assert.equal(catalogFor(kind).length,count,kind);
 assert.equal(new Set(entries.map(x=>x.id)).size,51);
 assert.deepEqual(Object.keys(LANDSCAPE_REALISM).sort(),entries.map(x=>x.id).sort());
 for(const e of entries){
  assert.ok(e.name?.trim(),e.id+' name');
  assert.ok(e.prompt?.trim(),e.id+' object specification');
  assert.ok(landscapePhysicalDetail(e.id).length>60,e.id+' photoreal detail');
  assert.ok(!/\b(undefined|null)\b/i.test(landscapePhysicalDetail(e.id)),e.id+' prompt corruption');
 }
});

test('all eight landscape navigation groups account for every item without duplication',()=>{
 assert.equal(LANDSCAPE_GROUPS.length,8);
 const ids=LANDSCAPE_GROUPS.flatMap(g=>catalogGroup(g.id).map(x=>x.id));
 assert.deepEqual(ids.slice().sort(),entries.map(e=>e.id).sort());
});

test('all 51 assets have individual paths and composite pots reference their live plant',()=>{
 for(const e of entries){
  const layers=assetLayers(e);
  assert.ok(layers.length>=1,e.id);
  assert.ok(layers.every(x=>/^assets\/landscape\/items\/[\w-]+\.webp$/.test(x.url)),e.id);
  const markup=placementMarkup(e,{x:2,y:3,w:100,h:150});
  assert.match(markup,/preserveAspectRatio="none"/);
  if(e.planted){
   assert.equal(layers.length,3,e.id);
   assert.ok(layers.some(x=>x.url.includes('/'+e.planted+'.webp')),e.id);
  }
 }
});

test('native HD manifest must never contain nonexistent or duplicate approvals',()=>{
 assert.equal(new Set(READY_HD_ASSETS).size,READY_HD_ASSETS.length);
 for(const id of READY_HD_ASSETS){
  assert.ok(entries.some(e=>e.id===id),id);
  const path=new URL('../assets/landscape/hd/'+id+'.webp',import.meta.url);
  assert.ok(readFileSync(path).length>50000,id+' is suspiciously small for 2K');
 }
});

test('realism instructions appear in exact species/object-specific AI prompts, not sticker placement',()=>{
 for(const e of entries){
  const item=e.kind==='fill'?
    {kind:e.kind,catalogId:e.id,strokes:[{size:.05,points:[{x:.2,y:.7}]}]}:
    e.kind==='edge' || e.kind==='path'?
    {kind:e.kind,catalogId:e.id,points:[{x:.1,y:.8},{x:.3,y:.8},{x:.3,y:.9}],edgeWidth:.01}:
    {kind:e.kind,catalogId:e.id,x:.25,y:.75,w:.12,h:.32};
  const prompt=landscapePrompt({items:[item]});
  assert.ok(prompt.includes(landscapePhysicalDetail(e.id)),e.id+' missing species detail');
  assert.match(prompt,/Regenerate ALL placed object pixels/);
  assert.match(prompt,/Match the scene camera perspective/);
 }
});

test('editor selects approved genuine 2K master only in high-detail layers; fallback remains intact',()=>{
 const entry=catalogFor('tree').find(e=>e.id==='birch');
 const preview=assetLayers(entry)[0].url;
 const detail=assetLayers(entry,{detail:true})[0].url;
 assert.match(preview,/\/items\/birch\.webp$/);
 assert.match(detail,READY_HD_ASSETS.includes('birch')?/\/hd\/birch\.webp$/:/\/items\/birch\.webp$/);
});
