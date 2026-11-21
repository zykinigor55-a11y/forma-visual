import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';

const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const source=JSON.parse(read('assets/landscape-models/pennisetum-hameln-forma-original.source.json').toString());
const glb=read('assets/landscape-models/pennisetum-hameln-forma-original.glb');
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
const native=read('forma-landscape-3d-models.js').toString();
const editor=read('forma-landscape-3d.html').toString();

test('replace ninebark, not merely add an extra plant, keep former XY and rotation',()=>{
 assert.equal(CATALOG.some(c=>c.id==='ninebark'),false);
 const item=CATALOG.find(c=>c.id==='pennisetum');
 assert.ok(item);
 assert.equal(item.group,'shrubs');
 assert.equal(item.diameter,.87);
 assert.equal(SHRUB_HEIGHT_M.pennisetum,.76);
 const doc=freshProject();
 doc.objects=[{id:'old-shrub',catalogId:'ninebark',x:17.7,y:25.2,rotation:32,variant:2,diameter:2.1,height:1.9,type:'shrubs'}];
 const migrated=normalizeProject(doc).objects[0];
 assert.equal(migrated.catalogId,'pennisetum');
 assert.equal(migrated.x,17.7);
 assert.equal(migrated.y,25.2);
 assert.equal(migrated.rotation,32);
 assert.equal(migrated.variant,2);
 assert.equal(migrated.diameter,.87);
 assert.equal(migrated.height,.76);
});

test('actual original three-form Hameln GLB has curved foliage and thousands of mesh bristles',()=>{
 assert.equal(glb.toString('ascii',0,4),'glTF');
 assert.equal(glb.readUInt32LE(4),2);
 assert.equal(glb.readUInt32LE(8),glb.length);
 assert.equal(createHash('sha256').update(glb).digest('hex'),source.sha256);
 assert.equal(SHRUB_3D_MODELS.pennisetum.sha256,source.sha256);
 assert.equal(source.triangleCount,195876);
 assert.equal(source.meshCount,36);
 assert.equal(gltf.materials.length,12);
 assert.equal(glb.length,7021132);
 const names=new Set(gltf.nodes.map(n=>n.name));
 for(const form of ['PENNISETUM_NATURAL','PENNISETUM_COMPACT','PENNISETUM_MATURE']){
  assert.ok(names.has(form),form);
  assert.ok(names.has(form+'-foliage-green'));
  assert.ok(names.has(form+'-plume-cream'));
  assert.ok(names.has(form+'-seed-core'));
  assert.ok(source.forms[form].plumeBristles>18000);
 }
 assert.equal(source.forms.PENNISETUM_NATURAL.plumes,112);
 assert.equal(source.forms.PENNISETUM_COMPACT.plumes,73);
 assert.equal(source.forms.PENNISETUM_MATURE.plumes,163);
});

test('same active Three.js editor selects original 3D forms, sizes and correct shrub inspector',()=>{
 assert.match(native,/PENNISETUM_NATURAL/);
 assert.match(native,/getObjectByName\(variants\[variant-1\]\)/);
 assert.match(editor,/o\.catalogId==='pennisetum'/);
 const ui=shrubEditorMarkup({species:'pennisetum',id:'Пеннисетум Хамельн',variant:2,season:'summer',real:true});
 for(const t of ['Пушистый','Компактный','Взрослый','РЕДАКТОР КУСТАРНИКА'])assert.ok(ui.includes(t),t);
 const doc=freshProject();
 doc.objects=[{id:'gr-1',catalogId:'pennisetum',x:8.2,y:17.4,rotation:12,diameter:.69,height:.58,variant:2,type:'shrubs'}];
 const item=normalizeProject(doc).objects[0];
 assert.deepEqual([item.x,item.y,item.rotation,item.variant,item.height,item.diameter],[8.2,17.4,12,2,.58,.69]);
});
