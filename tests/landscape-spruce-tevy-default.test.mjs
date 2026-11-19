import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MATURE_TREE_MODELS} from '../forma-landscape-3d-mature-trees.js';
const path=new URL('../assets/landscape-models/spruce-tevy-cc0.glb',import.meta.url);
const provenance=new URL('../assets/landscape-models/spruce-tevy-cc0.source.json',import.meta.url);
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
function parseGlb(path){
 const buffer=readFileSync(path);
 assert.equal(buffer.toString('ascii',0,4),'glTF');
 assert.equal(buffer.readUInt32LE(4),2);
 assert.equal(buffer.readUInt32LE(8),buffer.length);
 assert.equal(buffer.toString('ascii',16,20),'JSON');
 const chunkSize=buffer.readUInt32LE(12);
 return {buffer,json:JSON.parse(buffer.subarray(20,20+chunkSize).toString('utf8'))};
}
test('live spruce is a CC0 original dense Norway spruce with masked foliage',()=>{
 const {json,buffer}=parseGlb(path);
 assert.ok(buffer.length>4_000_000);
 const triangles=(json.meshes||[]).flatMap(x=>x.primitives||[]).reduce((sum,primitive)=>{
  const key=primitive.indices??primitive.attributes?.POSITION;
  return sum+Math.floor(json.accessors[key].count/3);
 },0);
 assert.ok(triangles>=40_000);
 assert.equal(json.meshes.length,3);
 assert.ok(json.materials.some(x=>['MASK','BLEND'].includes(x.alphaMode)),'photographic cutout needles');
 assert.ok(json.images.length>=4,'bark and foliage PBR textures');
 assert.ok((json.extensionsUsed||[]).includes('KHR_texture_basisu'));
 const meta=JSON.parse(readFileSync(provenance,'utf8'));
 assert.equal(meta.license,'CC0 1.0');
 assert.equal(meta.sourcePage,'https://tevy.dev/models/norway-spruce');
 assert.equal(meta.analysis.triangles,triangles);
});
test('editor uses new self-hosted spruce GLB with fall back to old CC0 mesh',()=>{
 assert.equal(MATURE_TREE_MODELS.spruce.path,'/assets/landscape-models/spruce-tevy-cc0.glb');
 assert.equal(MATURE_TREE_MODELS.spruce.fallbackPath,'/assets/landscape-models/spruce-mature-cc0.glb');
 assert.match(editor,/loadAsync\(entry\.path\)\.catch\(error=>\{/);
 assert.match(editor,/matureTreeLoader\.loadAsync\(entry\.fallbackPath\)/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(editor,/const performanceFallback=!\['pine','aspen'\]/);
});
