import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG,TREE_HEIGHT_M,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {POLY_HAVEN_TREE_MODELS} from '../forma-landscape-3d-polyhaven-trees.js';

const manifest=JSON.parse(readFileSync(new URL('../assets/landscape-models/polyhaven-trees-manifest.json',import.meta.url)));
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const ids=Object.keys(POLY_HAVEN_TREE_MODELS);

test('four real new models are independently catalogued, not revisions of approved trees',()=>{
 assert.deepEqual(ids,['ph-fir-sapling','ph-pine-sapling','ph-quiver-01','ph-quiver-02']);
 assert.equal(CATALOG.filter(x=>x.group==='trees').length,17);
 assert.ok(CATALOG.some(x=>x.id==='pine'));
 assert.ok(CATALOG.some(x=>x.id==='spruce'));
 assert.ok(CATALOG.some(x=>x.id==='birch'));
 for(const id of ids){
  const entry=CATALOG.find(x=>x.id===id);
  assert.equal(entry?.group,'trees');
  assert.ok(TREE_HEIGHT_M[id]>.5);
  assert.match(POLY_HAVEN_TREE_MODELS[id].sourcePage,/^https:\/\/polyhaven\.com\/a\//);
  assert.equal(POLY_HAVEN_TREE_MODELS[id].license,'CC0 1.0');
 }
});
test('actual photographed GLB geometry is stored locally and hash-verified against Poly Haven installer',()=>{
 assert.equal(manifest.license,'CC0 1.0');
 for(const id of ids){
  const tree=POLY_HAVEN_TREE_MODELS[id];
  const file=new URL('..'+tree.path,import.meta.url);
  const source=manifest.installed.find(x=>x.id===id);
  assert.ok(source,'not installed: '+id);
  assert.ok(existsSync(file),'missing real 3D file: '+id);
  const blob=readFileSync(file);
  assert.equal(blob.toString('utf8',0,4),'glTF');
  assert.equal(blob.readUInt32LE(4),2);
  assert.equal(blob.readUInt32LE(8),blob.length);
  assert.equal(createHash('sha256').update(blob).digest('hex'),source.sha256);
  assert.ok(source.gltf.triangles>1_000);
  assert.ok(source.gltf.texturedMaterials>=1);
  assert.ok(source.gltf.images>0);
  assert.ok(existsSync(new URL('..'+tree.thumbnail,import.meta.url)));
 }
});
test('catalogue coordinates and saved instance size survive 2D/3D normalization',()=>{
 const doc=freshProject();
 doc.objects.push({id:'ph1',type:'trees',catalogId:'ph-quiver-01',
    x:7.25,y:14.2,height:4.5,diameter:2.5,rotation:23,variant:2});
 const restored=normalizeProject(JSON.parse(JSON.stringify(normalizeProject(doc))));
 const got=restored.objects[0];
 for(const field of ['id','catalogId','x','y','height','diameter','rotation','variant'])
  assert.equal(got[field],doc.objects[0][field],field);
});
test('3D editor autoloads real Poly Haven tree scans on demand and guards against fake fallback',()=>{
 assert.match(editor,/import \{POLY_HAVEN_TREE_MODELS\}/);
 assert.match(editor,/if\(POLY_HAVEN_TREE_MODELS\[o\.catalogId\]&&!imported\)loadCuratedAdultTree/);
 assert.match(editor,/const waitingForReal=/);
 assert.match(editor,/POLY_HAVEN_TREE_MODELS\[o\.catalogId\]/);
 assert.match(editor,/POLY_HAVEN_TREE_MODELS\[c\[0\]\]\?\.thumbnail/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
});
