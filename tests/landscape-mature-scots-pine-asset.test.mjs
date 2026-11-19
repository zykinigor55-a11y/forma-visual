import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const assetUrl=new URL('../assets/landscape-models/pine-mature-cc0.glb',import.meta.url);
const sourceUrl=new URL('../assets/landscape-models/pine-mature-cc0.source.json',import.meta.url);
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('mature adult Scots pine GLB is local, textured, clipped and light enough for mobile',()=>{
 const bytes=readFileSync(assetUrl);
 assert.ok(statSync(assetUrl).size>=500_000&&bytes.length<9_000_000,'Mobile-friendly 3D model');
 assert.equal(bytes.toString('ascii',0,4),'glTF','GLB magic');
 assert.equal(bytes.readUInt32LE(4),2,'glTF 2');
 assert.equal(bytes.readUInt32LE(8),bytes.length,'GLB length');
 const jsonLength=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
 assert.ok(gltf.meshes.length>=2,'Separate trunk and conifer needle meshes');
 assert.ok(gltf.images.length>=2,'Bark/needle photographic images are embedded');
 assert.ok(gltf.materials.length>=2,'Photorealistic PBR material slots');
 const alphas=gltf.materials.filter(x=>x.alphaMode==='MASK'||x.alphaMode==='BLEND');
 assert.ok(alphas.length,'Real texture-cutout needles');
 const triangles=gltf.meshes.reduce((total,mesh)=>total+mesh.primitives.reduce((sub,p)=>{
  const accessor=gltf.accessors[p.indices??p.attributes.POSITION];
  return sub+Math.floor(accessor.count/3);
 },0),0);
 assert.ok(triangles>10000&&triangles<500000,'Real needle volume without millions of mobile triangles');
});
test('CC0 origin is recorded and pine is the only automatic native-species override',()=>{
 const meta=JSON.parse(readFileSync(sourceUrl,'utf8'));
 assert.equal(meta.license,'CC0 1.0');
 assert.ok(/^https:\/\//.test(meta.sourcePage));
 assert.equal(meta.name,'Mature Scots pine (Pinus sylvestris)');
 assert.match(editor,/const MATURE_SCOTS_PINE_GLB='\/assets\/landscape-models\/pine-mature-cc0\.glb'/);
 assert.match(editor,/function loadMatureScotsPine\(\)/);
 assert.match(editor,/if\(o\.catalogId==='pine'&&!imported\)loadMatureScotsPine\(\)/);
 assert.match(editor,/const bundledPine=o\.catalogId==='pine'/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(editor,/makeRealVegetation\(THREE,source,o,/);
 assert.match(editor,/setTranscoderPath\('\/assets\/three-basis\/'\)/);
 assert.match(editor,/setKTX2Loader\(pineKtx2\)/);
 assert.match(editor,/setMeshoptDecoder\(MeshoptDecoder\)/);
 const basis=readFileSync(new URL('../assets/three-basis/basis_transcoder.wasm',import.meta.url));
 assert.deepEqual([...basis.subarray(0,4)],[0,97,115,109],'WebAssembly decoder is self-hosted');
 assert.ok(basis.length>50000,'Bundled Basis transcoder must be intact');
});
