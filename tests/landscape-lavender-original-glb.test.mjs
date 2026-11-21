import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';
import {CATALOG,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';

const root=new URL('../',import.meta.url);
const info=JSON.parse(readFileSync(new URL('assets/landscape-models/lavender-angustifolia-forma-original.source.json',root),'utf8'));
const blob=readFileSync(new URL('assets/landscape-models/lavender-angustifolia-forma-original.glb',root));
const glen=blob.readUInt32LE(12);
const gltf=JSON.parse(blob.subarray(20,20+glen).toString('utf8'));
const modelCode=readFileSync(new URL('forma-landscape-3d-models.js',root),'utf8');
const editor=readFileSync(new URL('forma-landscape-3d.html',root),'utf8');

test('original PBR Lavender GLB is real and contains 3 independently sculpted floral forms',()=>{
 assert.equal(blob.toString('ascii',0,4),'glTF');
 assert.equal(blob.readUInt32LE(4),2);
 assert.equal(blob.readUInt32LE(8),blob.length);
 assert.equal(createHash('sha256').update(blob).digest('hex'),info.sha256);
 assert.equal(SHRUB_3D_MODELS.lavender.sha256,info.sha256);
 assert.ok(blob.length > 6_000_000);
 assert.ok(gltf.materials.length >= 13);
 assert.ok(gltf.meshes.length >= 39);
 assert.ok(info.triangles >= 350_000);
 const names=new Set(gltf.nodes.map(n=>n.name));
 for(const name of ['LAVENDER_NATURAL','LAVENDER_COMPACT','LAVENDER_MATURE']){
   assert.ok(names.has(name),name);
   for(const suffix of ['flower-purple','foliage-silver','stem','wood']){
     assert.ok(names.has(name+'-'+suffix),name+'-'+suffix);
   }
   assert.ok(info.forms[name].flowerStems>=140);
 }
});

test('lavender appears in the genuine landscape catalogue and right inspector',()=>{
 const c=CATALOG.find(x=>x.id==='lavender');
 assert.equal(c.group,'shrubs');
 assert.equal(c.diameter,.88);
 assert.equal(SHRUB_HEIGHT_M.lavender,.63);
 const markup=shrubEditorMarkup({species:'lavender',id:c.name,variant:2,real:true});
 for(const text of ['Цветущая','Компактная','Взрослая','РЕДАКТОР КУСТАРНИКА'])assert.ok(markup.includes(text),text);
 assert.match(modelCode,/LAVENDER_NATURAL/);
 assert.match(modelCode,/getObjectByName\(variants\[variant-1\]\)/);
 assert.match(editor,/o\.catalogId==='lavender'/);
 const project=freshProject();
 project.objects=[{id:'lav-1',catalogId:'lavender',type:'shrubs',x:11,y:9,height:.47,diameter:.70,variant:2}];
 const saved=normalizeProject(project);
 assert.deepEqual([saved.objects[0].variant,saved.objects[0].height,saved.objects[0].diameter],[2,.47,.70]);
});
