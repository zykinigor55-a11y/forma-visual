import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';
import {SHRUB_HEIGHT_M} from '../forma-landscape-3d-botany.js';
import {CATALOG} from '../forma-landscape-project-core.js';

const source=JSON.parse(readFileSync(new URL('../assets/landscape-models/hydrangea-flowering-innerscene-cc0.source.json',import.meta.url),'utf8'));
const bytes=readFileSync(new URL('../assets/landscape-models/hydrangea-flowering-innerscene-cc0.glb',import.meta.url));
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('the user-provided original flowering hydrangea is a valid, SHA-pinned glTF 2.0 asset',()=>{
 assert.equal(source.license,'CC0 1.0');
 assert.equal(source.sizeBytes,2754612);
 assert.equal(bytes.length,source.sizeBytes);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 const jsonLen=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.toString('utf8',20,20+jsonLen));
 assert.match(gltf.asset.copyright,/CC0 1\.0/);
 assert.equal(gltf.meshes.length,25);
 assert.equal(gltf.materials.length,3);
 assert.ok(gltf.materials.some(m=>/petal/i.test(m.name)));
});
test('existing hydrangea receives a real GLB in summer with seasonal botanical fallback',()=>{
 assert.equal(SHRUB_3D_MODELS.hydrangea.path,'/assets/landscape-models/hydrangea-flowering-innerscene-cc0.glb');
 assert.equal(SHRUB_3D_MODELS.hydrangea.season,'summer');
 assert.ok(CATALOG.some(x=>x.id==='hydrangea'&&x.group==='shrubs'));
 assert.equal(SHRUB_HEIGHT_M.hydrangea,1.55);
 assert.match(html,/const entry=MATURE_TREE_MODELS\[species\]\|\|SHRUB_3D_MODELS\[species\]/);
 assert.match(html,/if\(SHRUB_3D_MODELS\[o\.catalogId\]&&!imported&&doc\.atmosphere\.season==='summer'\)loadCuratedAdultTree/);
 assert.match(html,/SHRUB_3D_MODELS\[o\.catalogId\]&&doc\.atmosphere\.season!=='summer'/);
 assert.match(html,/const bundledAdult=\(MATURE_TREE_MODELS\[o\.catalogId\]\|\|SHRUB_3D_MODELS\[o\.catalogId\]\)/);
 assert.match(html,/window\.FORMA_SHRUB_MODEL_DIAGNOSTICS/);
 assert.match(html,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
});
