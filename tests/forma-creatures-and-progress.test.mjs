import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CREATURE_ASSETS,creatureById,isCreatureId,creaturePhotoDescription} from '../forma-landscape-3d-creatures.js';
import {validatedLandscapeProps,duplicateLandscapeObject} from '../forma-landscape-3d-editing.js';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=read('forma-landscape-3d.html');
const server=read('server.mjs');
const prompt=read('forma-landscape-project-prompts.js');

test('eight licensed CC0 GLB subjects with local model URLs',()=>{
 assert.equal(CREATURE_ASSETS.length,8);
 assert.equal(new Set(CREATURE_ASSETS.map(a=>a.id)).size,8);
 for(const a of CREATURE_ASSETS){
  assert.equal(isCreatureId(a.id),true);
  assert.equal(creatureById(a.id),a);
  assert.equal(a.license,'CC0-1.0');
  assert.ok(a.nativeGLB.startsWith('https://tevy.dev/models/'));
  assert.ok(a.nativeGLB.endsWith('/v1/lod1.glb'));
  assert.equal(a.modelPath,'/api/creatures/'+a.id+'.glb');
  assert.ok(creaturePhotoDescription(a.id,a.height).includes(a.species));
 }
});
test('height, rotation, position, and duplication are metric and reversible',()=>{
 const obj={id:'original',type:'creature-red-fox',x:8,y:11,height:.43,rotation:0};
 const updated=validatedLandscapeProps(obj,{height:'0.65',rotation:'375'},
  {kind:'extra',plot:{width:30,height:40}});
 assert.deepEqual([updated.x,updated.y],[8,11]);
 assert.equal(updated.height,.65);assert.equal(updated.rotation,15);
 const clone=duplicateLandscapeObject(obj,{newId:'copy',plot:{width:30,height:40}});
 assert.ok(clone);assert.equal(clone.type,obj.type);assert.equal(obj.x,8);
});
test('character tool is real GLB, selectable, editable and has delete action',()=>{
 for(const text of [
  "['creatures','Персонажи и животные'",
  'function renderCreatureCatalog()',
  "state.placing=button.dataset.creatureId",
  "if(tool==='creatures')",
  'setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder)',
  "mark(placed,'extra:'+o.id)",
  "fields.push(['height','Рост / высота, м'",
  "else if(ref.type==='extra')extra=extra.filter"
 ])assert.ok(html.includes(text),'Missing '+text);
});
test('server allows only known real GLB and never arbitrary asset URLs',()=>{
 for(const text of [
  'async function serveCreatureGLB(req,res)',
  'const item=match&&creatureById(match[1])',
  'fetch(item.nativeGLB',
  "bytes.toString('ascii',0,4)!=='glTF'"
 ])assert.ok(server.includes(text),'Missing '+text);
});
test('AI photo prompt renders human/animal identities and physical height',()=>{
 assert.ok(html.includes('speciesLatin:creatureById(o.type)?.species'));
 assert.ok(prompt.includes('REAL LIVING SUBJECT'));
 assert.ok(prompt.includes('creaturePhotoDescription(o.type,o.height)'));
});
test('AI percent bar is labelled estimate and cannot reach 100 before image is returned',()=>{
 for(const text of ['id="aiProgressPercent"',
  'Проценты оценочные: AI не сообщает точную готовность',
  'Math.min(90,40',
  'showAiPercent(100,{estimated:false})'])
  assert.ok(html.includes(text),'Missing '+text);
 assert.ok(html.indexOf('showAiPercent(100,{estimated:false})')>
  html.indexOf("if(!response.ok||!data.images?.[0])"));
});
