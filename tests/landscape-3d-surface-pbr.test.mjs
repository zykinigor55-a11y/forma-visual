import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CATALOG,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {GROUND_PBR_SOURCES,SURFACE_PHOTO_IDS,surfacePreviewURL} from '../forma-landscape-3d-surfaces.js';

const ids=['sand-fine','gravel-natural','crushed-stone','sandy-gravel'];
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const materials=readFileSync(new URL('../forma-landscape-3d-surfaces.js',import.meta.url),'utf8');

test('photographed sand, gravel, crushed aggregate and sandy gravel are distinct fill assets',()=>{
 assert.deepEqual(Object.keys(GROUND_PBR_SOURCES),ids);
 assert.equal(CATALOG.filter(x=>x.group==='fills').length,9);
 for(const id of ids){
  const entry=CATALOG.find(x=>x.id===id);
  assert.equal(entry.group,'fills');
  assert.ok(entry.name.length>4);
  assert.match(GROUND_PBR_SOURCES[id].slug,/^[a-z0-9_]+$/);
  assert.ok(GROUND_PBR_SOURCES[id].scale>.2&&GROUND_PBR_SOURCES[id].scale<2);
  assert.ok(SURFACE_PHOTO_IDS.includes(GROUND_PBR_SOURCES[id].fallback));
  assert.match(surfacePreviewURL(id),/^https:\/\/cdn\.polyhaven\.com\/asset_img\/thumbs\//);
 }
});

test('true photographed diffuse, OpenGL normals and roughness are loaded with safe local fallbacks',()=>{
 assert.match(materials,/Textures\/jpg\/1k/);
 assert.match(materials,/pbrAsset\(data\.slug,channel\)/);
 assert.match(materials,/make\('diff'/);
 assert.match(materials,/make\('nor_gl'/);
 assert.match(materials,/make\('rough'/);
 assert.match(materials,/new T\.CanvasTexture\(pixel\)/);
 assert.match(materials,/normalMap:maps\.normal/);
 assert.match(materials,/roughnessMap:maps\.roughness/);
 assert.match(materials,/data\.fallback\+'\.jpg'/);
});

test('the existing metric brush paints all new materials and survives a reload unchanged',()=>{
 const doc=freshProject();
 ids.forEach((catalogId,i)=>doc.objects.push({
  id:'new-pbr-'+i,catalogId,type:'fills',geometry:'strip',width:2+i*.3,
  points:[{x:1+i,y:2+i},{x:7+i,y:4+i}]
 }));
 const restored=normalizeProject(JSON.parse(JSON.stringify(normalizeProject(doc))));
 assert.equal(restored.objects.length,4);
 ids.forEach((id,i)=>{
  const item=restored.objects[i];
  assert.equal(item.catalogId,id);
  assert.equal(item.type,'fills');
  assert.equal(item.geometry,'strip');
  assert.equal(item.width,2+i*.3);
  assert.deepEqual(item.points,doc.objects[i].points);
 });
 assert.match(editor,/surfacePreviewURL\(c\[0\]\)/);
 assert.match(editor,/id="landscapeBrushRadius"/);
 assert.match(editor,/function beginBrush\(/);
 assert.match(editor,/function advanceBrush\(/);
 assert.match(editor,/function finishBrush\(/);
 assert.match(editor,/surfaceMaterial\(THREE,materialId,color\)/);
});

test('asynchronous photograph loading repaints the renderer rather than showing white ground',()=>{
 assert.match(materials,/forma-surface-texture-ready/);
 assert.match(editor,/addEventListener\('forma-surface-texture-ready'/);
});
