import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG,TREE_HEIGHT_M,byId} from '../forma-landscape-project-core.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
import {leafOutline} from '../forma-landscape-3d-botany.js';

test('orchard apple remains, while columnar poplar and forest beech are selectable',()=>{
 const trees=CATALOG.filter(x=>x.group==='trees');
 assert.equal(trees.length,13);
 assert.ok(trees.some(x=>x.id==='apple'&&x.latin==='Malus ornamental'));
 assert.ok(trees.some(x=>x.id==='beech'&&x.latin==='Fagus sylvatica'));
 const poplar=trees.find(x=>x.id==='poplar');
 assert.equal(poplar.latin,'Populus nigra var. italica');
 assert.equal(TREE_HEIGHT_M.poplar,25);
 assert.equal(TREE_HEIGHT_M.apple,6);
 assert.ok(byId('linden'),'saved landscape with legacy linden remains readable');
 assert.ok(VEGETATION_SPECIES.poplar);
 const leaf=leafOutline('poplar',20);
 assert.equal(leaf.length,20);
 assert.notDeepEqual(leaf,leafOutline('oak',20));
});
test('author-provided 3 LODs are real local CC0 GLB binaries with pinned hashes',()=>{
 const model=MATURE_TREE_MODELS.poplar;
 assert.equal(model.sourcePage,'https://tevy.dev/models/lombardy-poplar');
 assert.equal(model.license,'CC0 1.0');
 assert.equal(model.lods.length,3);
 const meta=JSON.parse(readFileSync(new URL('../assets/landscape-models/poplar-tevy-cc0.source.json',import.meta.url)));
 assert.equal(meta.license,'CC0 1.0');
 assert.equal(meta.species,'poplar');
 for(const [i,path] of model.lods.entries()){
  const b=readFileSync(new URL('..'+path,import.meta.url));
  assert.equal(b.toString('ascii',0,4),'glTF');
  assert.equal(b.readUInt32LE(4),2);
  assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(createHash('sha256').update(b).digest('hex'),meta.lods[i].sha256);
 }
});
test('poplar retains original PBR/real GLB and stripped winter foliage',()=>{
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(editor,/doc\.atmosphere\.season==='winter'&&o\.catalogId==='poplar'/);
 assert.match(editor,/o\.catalogId==='poplar'/);
 assert.match(editor,/entry\.lods\?\.\[1\]/);
});
