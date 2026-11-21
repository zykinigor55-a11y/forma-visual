import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG, freshProject, normalizeProject} from '../forma-landscape-project-core.js';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';

const root=new URL('../',import.meta.url);
const src=readFileSync(new URL('assets/landscape-models/polyhaven-fern-02-source.glb',root));
const audit=JSON.parse(readFileSync(new URL('assets/landscape-models/polyhaven-fern-02-source.audit.json',root),'utf8'));
const gltf=JSON.parse(src.subarray(20,20+src.readUInt32LE(12)).toString('utf8'));
const models=readFileSync(new URL('forma-landscape-3d-models.js',root),'utf8');
const html=readFileSync(new URL('forma-landscape-3d.html',root),'utf8');
const keys=['fern','fern-02','fern-03','fern-04'];
const names=['fern_02_a','fern_02_b','fern_02_c','fern_02_d'];

test('exact real CC0 Poly Haven GLB contains 4 independently-authored unique fern meshes',()=>{
 assert.equal(src.toString('ascii',0,4),'glTF');
 assert.equal(src.readUInt32LE(4),2);
 assert.equal(src.readUInt32LE(8),src.length);
 assert.equal(src.length,3390352);
 assert.equal(createHash('sha256').update(src).digest('hex'),audit.sha256);
 assert.equal(audit.sha256,'3f5de1969d029db133986123aa5be6bff0137443800f53a209c6b25bcd8aab4c');
 assert.equal(gltf.meshes.length,4);
 assert.equal(gltf.materials.length,1);
 assert.ok(gltf.images.length>=3);
 const mapped=new Map(gltf.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.name,n.mesh]));
 assert.equal(mapped.size,4);
 for(const name of names)assert.ok(mapped.has(name),name);
 assert.equal(new Set(names.map(name=>mapped.get(name))).size,4);
 const materials=gltf.meshes.flatMap(mesh=>mesh.primitives.map(p=>p.material));
 assert.ok(materials.every(m=>m===0),'all four parts preserve original shared PBR material');
 const triangles=gltf.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);
 assert.equal(triangles,6232);
});

test('four separate catalogue objects each reference the correct mesh and own real dimensions',()=>{
 assert.equal(keys.filter(k=>CATALOG.some(c=>c.id===k)).length,4);
 assert.deepEqual(keys.map(k=>SHRUB_HEIGHT_M[k]),[.29,.43,.35,.22]);
 assert.deepEqual(keys.map(k=>CATALOG.find(c=>c.id===k).diameter),[.62,1,.88,.6]);
 for(let i=0;i<keys.length;i++){
  const config=SHRUB_3D_MODELS[keys[i]];
  assert.ok(config);
  assert.equal(config.path,'/assets/landscape-models/polyhaven-fern-02-source.glb');
  assert.equal(config.sha256,audit.sha256);
  assert.deepEqual(config.variants,[names[i]]);
  assert.equal(config.season,'summer');
  assert.match(config.license,/CC0/);
  assert.ok(models.includes(keys[i])&&models.includes(names[i]));
 }
 assert.match(models,/Missing independent Fern 02 mesh/);
 assert.match(html,/const fernIds=\['fern','fern-02','fern-03','fern-04'\]/);
});

test('inspector switches all FOUR visible clumps separately and does not alter site coordinates',()=>{
 const editor=shrubEditorMarkup({id:'Папоротник',species:'fern-04',variant:1,real:true,season:'summer'});
 for(const [i,label] of ['Папоротник 01','Папоротник 02','Папоротник 03','Папоротник 04'].entries()){
  assert.ok(editor.includes(label));
  assert.ok(editor.includes('data-shrub-variant="'+(i+1)+'"'));
 }
 assert.ok(editor.includes('data-shrub-variant="4" aria-pressed="true"'));
 const doc=freshProject();
 doc.house.x=4;doc.house.y=6;
 doc.objects=keys.map((k,i)=>({id:'fern-'+i,catalogId:k,type:'shrubs',x:7+i,y:12+i,rotation:30*i,height:SHRUB_HEIGHT_M[k],diameter:CATALOG.find(c=>c.id===k).diameter,variant:1}));
 const saved=normalizeProject(doc);
 assert.equal(saved.house.x,4);
 assert.equal(saved.house.y,6);
 assert.deepEqual(saved.objects.map(o=>o.catalogId),keys);
 assert.deepEqual(saved.objects.map(o=>[o.x,o.y]),[[7,12],[8,13],[9,14],[10,15]]);
});
