import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';
import {CATALOG,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
const root=new URL('../',import.meta.url);
const source=JSON.parse(readFileSync(new URL('assets/landscape-models/thuja-danica-forma-original.source.json',root),'utf8'));
const glb=readFileSync(new URL('assets/landscape-models/thuja-danica-forma-original.glb',root));
const len=glb.readUInt32LE(12);
const meta=JSON.parse(glb.subarray(20,20+len).toString('utf8'));
const html=readFileSync(new URL('forma-landscape-3d.html',root),'utf8');
const native=readFileSync(new URL('forma-landscape-3d-models.js',root),'utf8');
test('original Danica PBR GLB is valid and has three distinct genuine meshes',()=>{
 assert.equal(glb.toString('ascii',0,4),'glTF');
 assert.equal(glb.readUInt32LE(4),2);
 assert.equal(glb.readUInt32LE(8),glb.length);
 assert.equal(createHash('sha256').update(glb).digest('hex'),source.sha256);
 assert.equal(source.sha256,SHRUB_3D_MODELS['thuja-globe'].sha256);
 assert.ok(glb.length>1_000_000);
 assert.ok(meta.meshes.length>=21);
 assert.ok(meta.materials.filter(m=>m.alphaMode==='MASK').length>=7);
 assert.ok(meta.images.length>=7);
 for(const shape of ['THUJA_DANICA_NATURAL','THUJA_DANICA_COMPACT','THUJA_DANICA_MATURE']){
  assert.ok(meta.nodes.some(n=>n.name===shape),shape);
  assert.ok(meta.nodes.some(n=>n.name===shape+'-green'),shape+'-green');
  assert.ok(meta.nodes.some(n=>n.name===shape+'-wood'),shape+'-wood');
 }
});
test('Danica is editable, true-scale and evergreen across seasons',()=>{
 const item=CATALOG.find(c=>c.id==='thuja-globe');
 assert.equal(item.diameter,1.02);
 assert.equal(SHRUB_3D_MODELS['thuja-globe'].season,'evergreen');
 const ui=shrubEditorMarkup({species:'thuja-globe',id:'Туя западная',variant:2,season:'winter',real:true});
 for(const label of ['Естественная','Компактная','Взрослая'])assert.ok(ui.includes(label));
 assert.ok(!ui.includes('сезонный вид'));
 assert.match(native,/THUJA_DANICA_COMPACT/);
 assert.match(native,/getObjectByName\(variants\[variant-1\]\)/);
 assert.match(html,/o\.catalogId!=='thuja-globe'/);
 assert.match(html,/o\.catalogId==='thuja-globe'\|\|doc\.atmosphere\.season==='summer'/);
 const d=freshProject();
 d.objects=[{id:'t-01',catalogId:'thuja-globe',type:'shrubs',x:12,y:10,height:.68,diameter:.79,variant:2}];
 const norm=normalizeProject(d);
 assert.equal(norm.objects[0].variant,2);
 assert.equal(norm.objects[0].diameter,.79);
 assert.equal(norm.objects[0].height,.68);
});