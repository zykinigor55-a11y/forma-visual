import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CATALOG, freshProject, normalizeProject} from '../forma-landscape-project-core.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';

const root=new URL('../',import.meta.url);
const get=p=>readFileSync(new URL(p,root));
const meta=JSON.parse(get('assets/landscape-models/fern-dryopteris-filix-mas.source.json').toString());
const file=get('assets/landscape-models/fern-dryopteris-filix-mas-forma-original.glb');
const gltf=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString());
const modelCode=get('forma-landscape-3d-models.js').toString();
const editorCode=get('forma-landscape-3d.html').toString();

test('Original genuine Dryopteris GLB: 3 unique high-detail fern forms with PBR albedo/normal',()=>{
 assert.equal(file.toString('ascii',0,4),'glTF');
 assert.equal(file.readUInt32LE(4),2);
 assert.equal(file.readUInt32LE(8),file.length);
 assert.ok(file.length>14_000_000 && file.length<21_000_000,'photo-textured GLB remains bounded in size');
 assert.equal(createHash('sha256').update(file).digest('hex'),meta.sha256);
 assert.equal(SHRUB_3D_MODELS.fern.sha256,meta.sha256);
 assert.equal(meta.triangleCount,507704);
 assert.equal(meta.meshCount,30);
 assert.equal(gltf.materials.length,10);
 assert.ok(gltf.images.length>=14);
 const textured=gltf.materials.filter(x=>x.name?.includes('fern original PBR leaf'));
 assert.equal(textured.length,7);
 for(const m of textured){
  assert.ok(m.pbrMetallicRoughness?.baseColorTexture);
  assert.ok(m.normalTexture);
  assert.equal(m.doubleSided,true);
 }
 const nodeNames=new Set(gltf.nodes.map(x=>x.name));
 for(const [name,fronds,pinnules] of [
   ['FERN_NATURAL',23,16192],['FERN_YOUNG',15,7980],['FERN_MATURE',32,28800]
 ]){
  assert.ok(nodeNames.has(name),name);
  for(const mesh of ['forest','shadow','middle','luminous','stem','scale']){
    assert.ok(nodeNames.has(name+'-'+mesh),name+'-'+mesh);
  }
  assert.equal(meta.forms[name].fronds,fronds);
  assert.equal(meta.forms[name].pinnules,pinnules);
  assert.ok(meta.forms[name].pinnae>=570);
 }
});

test('Real-size fern inspector variant, seasonal behavior, and unchanged planted coordinates',()=>{
 const catalog=CATALOG.find(x=>x.id==='fern');
 assert.ok(catalog);
 assert.equal(catalog.group,'shrubs');
 assert.equal(catalog.diameter,1.2);
 assert.equal(SHRUB_HEIGHT_M.fern,.87);
 assert.equal(SHRUB_3D_MODELS.fern.season,'summer');
 assert.match(modelCode,/FERN_NATURAL/);
 assert.match(modelCode,/getObjectByName\(variants\[variant-1\]\)/);
 assert.match(editorCode,/o\.catalogId==='fern'/);
 const markup=shrubEditorMarkup({id:'Щитовник мужской',species:'fern',variant:3,season:'summer',real:true});
 for(const s of ['Естественный','Молодой','Взрослый','РЕДАКТОР КУСТАРНИКА'])assert.ok(markup.includes(s),s);
 const doc=freshProject();
 doc.objects=[{id:'fr-1',catalogId:'fern',type:'shrubs',x:17.3,y:9.4,rotation:33,variant:2,diameter:.8,height:.58}];
 const actual=normalizeProject(doc).objects[0];
 assert.deepEqual([actual.x,actual.y,actual.rotation,actual.variant,actual.diameter,actual.height],[17.3,9.4,33,2,.8,.58]);
});
