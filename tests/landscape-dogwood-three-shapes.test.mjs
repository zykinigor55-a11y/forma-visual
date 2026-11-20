import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {shrubEditorMarkup} from '../forma-landscape-shrub-editor.js';
import {CATALOG,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
const src=JSON.parse(readFileSync(new URL('../assets/landscape-models/dogwood-elegantissima-forma-original.source.json',import.meta.url),'utf8'));
const bytes=readFileSync(new URL('../assets/landscape-models/dogwood-elegantissima-forma-original.glb',import.meta.url));
const glen=bytes.readUInt32LE(12);const gltf=JSON.parse(bytes.toString('utf8',20,20+glen));
const modelJs=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('original dogwood GLB is real, independently authored, verified and has 3 crowns',()=>{
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),src.sha256);
 assert.equal(bytes.length,src.sizeBytes);
 assert.equal(src.license,'Original FORMA-authored geometry and PBR texture, no purchased assets');
 assert.equal(src.triangles,320508);
 const names=gltf.nodes.map(x=>x.name);
 for(const shape of ['DOGWOOD_NATURAL','DOGWOOD_SPHERE','DOGWOOD_BOX']){
  assert.ok(names.includes(shape),shape);
  assert.ok(names.some(x=>['plum','burgundy','ruby','copper','dusk','olive'].some(id=>x===shape+'-'+id)),shape+' foliage mesh');
  assert.ok(names.some(x=>['bark','twig'].some(id=>x===shape+'-'+id)),shape+' dark branch mesh');
 }
 assert.equal(gltf.meshes.length,24);
 assert.equal(gltf.materials.length,8);
 assert.ok(gltf.materials.filter(m=>m.alphaMode==='MASK').length>=5);
 assert.ok(gltf.images.length>=6);
 assert.equal(SHRUB_3D_MODELS.dogwood.season,'summer');
 assert.equal(SHRUB_3D_MODELS.dogwood.path,'/assets/landscape-models/dogwood-elegantissima-forma-original.glb');
});
test('dogwood native WebGL switch chooses actual geometry node and correct physical dimensions',()=>{
 assert.match(modelJs,/source\.getObjectByName\(variants\[variant-1\]\)/);
 assert.match(html,/species:o\.catalogId/);
 assert.match(html,/o\.catalogId==='dogwood'/);
 const ui=shrubEditorMarkup({species:'dogwood',id:'Дёрен белый',variant:2,real:true});
 for(const label of ['Природный','Шар','Изгородь'])assert.ok(ui.includes(label));
 assert.match(ui,/data-shrub-variant="2" aria-pressed="true"/);
 assert.equal(CATALOG.find(x=>x.id==='dogwood').diameter,2.91);
 const p=freshProject();
 p.objects=[{id:'dog-1',catalogId:'dogwood',type:'shrubs',x:8,y:11,height:1.55,diameter:1.58,variant:2}];
 const normalized=normalizeProject(p);
 assert.equal(normalized.objects[0].variant,2);
 assert.equal(normalized.objects[0].height,1.55);
 assert.equal(normalized.objects[0].diameter,1.58);
});
