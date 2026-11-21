import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';
import {freshProject,normalizeProject,CATALOG} from '../forma-landscape-project-core.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';

const root=new URL('../',import.meta.url);
const path=new URL('assets/landscape-models/boxwood-sempervirens-forma-original.glb',root);
const info=JSON.parse(readFileSync(new URL('assets/landscape-models/boxwood-sempervirens-forma-original.source.json',root),'utf8'));
const buf=readFileSync(path);
const gltf=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
const code=readFileSync(new URL('forma-landscape-3d-models.js',root),'utf8');
const html=readFileSync(new URL('forma-landscape-3d.html',root),'utf8');

test('original boxwood GLB has 3 real independent evergreen geometries and authentic PBR leaves',()=>{
 assert.equal(buf.toString('ascii',0,4),'glTF');
 assert.equal(buf.readUInt32LE(4),2);
 assert.equal(buf.readUInt32LE(8),buf.length);
 assert.equal(createHash('sha256').update(buf).digest('hex'),info.sha256);
 assert.equal(info.sha256,SHRUB_3D_MODELS.boxwood.sha256);
 assert.ok(buf.length>8_000_000 && buf.length<13_000_000);
 assert.equal(gltf.meshes.length,30);
 assert.equal(gltf.materials.length,10);
 assert.equal(info.triangles,373880);
 const nodeNames=new Set(gltf.nodes.map(n=>n.name));
 for(const form of ['BOXWOOD_NATURAL','BOXWOOD_SPHERE','BOXWOOD_HEDGE']){
  assert.ok(nodeNames.has(form),form);
  for(const part of ['leaf-green','leaf-tip','leaf-dark','wood','twig'])assert.ok(nodeNames.has(form+'-'+part),part);
  assert.ok(info.forms[form].leafCount>22000);
 }
 assert.ok(info.forms.BOXWOOD_NATURAL.leafCount>30000);
});
test('boxwood uses genuine editor variants, year-round foliage and fixed planted x/y',()=>{
 assert.equal(SHRUB_3D_MODELS.boxwood.season,'evergreen');
 assert.equal(CATALOG.find(x=>x.id==='boxwood')?.diameter,1);
 assert.equal(SHRUB_HEIGHT_M.boxwood,.95);
 assert.match(code,/BOXWOOD_NATURAL/);
 assert.match(code,/getObjectByName\(variants\[variant-1\]\)/);
 assert.match(html,/\['thuja-globe','boxwood'\]\.includes\(o.catalogId\)/);
 assert.match(html,/if\(o.catalogId==='boxwood'\)/);
 const ui=shrubEditorMarkup({id:'Самшит',species:'boxwood',variant:3,season:'winter',real:true});
 for(const text of ['Природный','Шар','Изгородь','РЕДАКТОР КУСТАРНИКА'])assert.ok(ui.includes(text));
 assert.ok(!ui.includes('сезонный вид'));
 const doc=freshProject();
 doc.objects=[{id:'buxus-1',catalogId:'boxwood',type:'shrubs',x:13,y:17,height:.88,diameter:1.18,variant:3}];
 const normalized=normalizeProject(doc);
 assert.deepEqual([normalized.objects[0].x,normalized.objects[0].y,normalized.objects[0].variant],[13,17,3]);
});
