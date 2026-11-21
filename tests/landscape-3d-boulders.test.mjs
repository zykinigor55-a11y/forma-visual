import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {CATALOG,byId,normalizeProject,freshProject} from '../forma-landscape-project-core.js';
import {ROCK_SCAN_SOURCES,ROCK_GEOLOGICAL_PROFILES,landscapeRockSize} from '../forma-landscape-3d-rocks.js';

const source=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const ROCKS=['granite-boulder','limestone-boulder','slate-boulder','sandstone-boulder'];

test('exactly four stable geological catalog IDs mapped to real local CC0 scans',()=>{
 assert.deepEqual(CATALOG.filter(x=>x.group==='boulders').map(x=>x.id),ROCKS);
 assert.deepEqual(Object.keys(ROCK_SCAN_SOURCES),ROCKS);
 assert.equal(ROCK_SCAN_SOURCES['sandstone-boulder'],'assets/landscape-models/sandstone-boulder.glb');
 assert.equal(ROCK_GEOLOGICAL_PROFILES['sandstone-boulder'].reference,'namaqualand_boulder_05');
 assert.equal(Object.keys(ROCK_GEOLOGICAL_PROFILES).length,4);
 for(const id of ROCKS){
  assert.equal(byId(id).group,'boulders');
  assert.equal(ROCK_GEOLOGICAL_PROFILES[id].roughness>.84,true);
  assert.match(ROCK_SCAN_SOURCES[id],/^assets\/landscape-models\/[a-z-]+\.glb$/);
  const file=new URL('../'+ROCK_SCAN_SOURCES[id],import.meta.url);
  assert.ok(existsSync(file),'Missing actual local 3D CC0 scan '+id);
  const bytes=readFileSync(file);
  assert.ok(bytes.length>100_000,'Scan must be a real binary 3D asset');
  assert.equal(bytes.toString('utf8',0,4),'glTF','GLB magic required');
  assert.equal(bytes.readUInt32LE(4),2,'GLB v2 required');
 }
});
test('position, rotation and manual size survive changing model geometry and project reload',()=>{
 const saved=freshProject();
 saved.objects=ROCKS.map((catalogId,i)=>({
  id:'rock-stable-'+i,type:'boulders',catalogId,
  x:4+i*3,y:9+i,diameter:1.3+i*.2,height:.70+i*.09,
  rotation:15+i*11,variant:i+1,burial:.04+i*.08
 }));
 const first=normalizeProject(saved);
 const second=normalizeProject(JSON.parse(JSON.stringify(first)));
 assert.equal(first.objects.length,4);
 for(let i=0;i<4;i++){
  const got=second.objects[i],raw=saved.objects[i];
  for(const key of ['id','catalogId','x','y','diameter','height','rotation','variant','burial'])
   assert.equal(got[key],raw[key],key+' should survive reload for '+raw.catalogId);
  const options=landscapeRockSize(got);
  assert.equal(options.diameter,raw.diameter);
  assert.equal(options.height,raw.height);
  assert.equal(options.variant,raw.variant);
  assert.equal(options.burial,raw.burial);
 }
});
test('real uploaded GLBs are reused and expose full PBR maps with per-type shape variations',()=>{
 const rocks=source('forma-landscape-3d-rocks.js');
 const editor=source('forma-landscape-3d.html');
 assert.match(rocks,/createPhotogrammetryBoulder\(T,source,instance\)/);
 assert.doesNotMatch(rocks,/copy\\.color\\.multiply\\(new T\\.Color\\(profile\\.tint\\)\\)/);
 assert.match(rocks,/keepSourcePBR/);
 assert.match(rocks,/if\\(!copy\\.roughnessMap\\)/);
 assert.match(rocks,/normalMaps,roughnessMaps,occlusionMaps/);
 assert.match(rocks,/node\.castShadow=true;node\.receiveShadow=true/);
 assert.match(rocks,/if\(instance\.catalogId==='limestone-boulder'\)dominantRockMesh/);
 assert.match(rocks,/rock\.userData\.scanStats/);
 assert.match(editor,/function loadGeologicalScan\(id\)/);
 assert.match(editor,/new GLTFLoader\(\)\.loadAsync\('\/'\+path\)/);
 assert.match(editor,/createPhotogrammetryBoulder\(THREE,source,o\)/);
 assert.match(editor,/createGeologicalFallbackBoulder\(THREE,o\)/);
 assert.match(editor,/id="rockShapeVariant"/);
 assert.match(editor,/id="rockBurial"/);
 // Don't replant or shift the original rocks when changing their mesh.
 assert.match(editor,/g\.position\.set\(p\.x,groundH,p\.z\);g\.rotation\.y=\(o\.rotation\|\|0\)\*Math\.PI\/180/);
});
test('light settings are not deleted by normalizing a project with boulders',()=>{
 const doc=freshProject();doc.objects=[
 {id:'lamp-1',catalogId:'globe',type:'lights',x:5,y:5,diameter:.8,height:.8,
  rotation:30,brightness:.85,kelvin:3000,variant:4}
 ];
 const loaded=normalizeProject(doc).objects[0];
 assert.equal(loaded.variant,4);assert.equal(loaded.brightness,.85);
 assert.equal(loaded.kelvin,3000);
});
