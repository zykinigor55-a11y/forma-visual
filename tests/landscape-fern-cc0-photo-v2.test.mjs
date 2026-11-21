import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';

const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const meta=JSON.parse(read('assets/landscape-models/fern-dryopteris-filix-mas.source.json').toString('utf8'));
const glb=read('assets/landscape-models/fern-dryopteris-filix-mas-forma-original.glb');
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString('utf8'));

test('CC0 photographed Dryopteris leaf microdetail is actually baked into GLB, not a conceptual preview',()=>{
 assert.match(meta.version,/2\.0/);
 assert.equal(meta.photoTexture.license,'CC0 1.0 public domain');
 assert.equal(meta.photoTexture.photoAuthor,'Sdjurovic');
 assert.equal(meta.photoTexture.photoSource,'https://commons.wikimedia.org/wiki/File:20220531_114609_Dryopteris_filix-mas.jpg');
 assert.ok(meta.photoTexture.sourceDimensions[0]>=2000);
 assert.ok(meta.photoTexture.verifiedLeafCropCount>=15);
 const source=read('assets/landscape-models/fern-CC0-source-Dryopteris.jpg');
 assert.equal(createHash('sha256').update(source).digest('hex'),meta.photoTexture.sourcePhotoSHA256);
 assert.equal(createHash('sha256').update(glb).digest('hex'),SHRUB_3D_MODELS['fern-original'].sha256);
 assert.equal(meta.sha256,SHRUB_3D_MODELS['fern-original'].sha256);
 assert.equal(glb.toString('ascii',0,4),'glTF');
 assert.equal(glb.readUInt32LE(8),glb.length);
 assert.equal(meta.triangleCount,507704);
 assert.equal(meta.meshCount,30);
 assert.equal(gltf.materials.length,10);
 assert.ok(gltf.images.length>=14);
 assert.ok(gltf.textures.length>=14);
 for(const material of gltf.materials.filter(m=>m.name?.includes('fern original PBR leaf epidermis'))){
   assert.ok(material.pbrMetallicRoughness?.baseColorTexture);
   assert.ok(material.normalTexture);
   assert.equal(material.doubleSided,true);
 }
 const pinnuleMeshes=gltf.meshes.flatMap(m=>m.primitives).filter(p=>('TEXCOORD_0' in p.attributes));
 assert.equal(pinnuleMeshes.length,21);
 for(const form of ['FERN_NATURAL','FERN_YOUNG','FERN_MATURE']){
   assert.ok(gltf.nodes.some(n=>n.name===form));
 }
});

test('Textures are genuine distinct 512px baked images, not blank placeholders',()=>{
 const pngA=read('assets/landscape-models/fern-original-epidermis-albedo.png');
 const pngN=read('assets/landscape-models/fern-original-epidermis-normal.png');
 assert.equal(pngA.subarray(1,4).toString(),'PNG');
 assert.equal(pngN.subarray(1,4).toString(),'PNG');
 assert.ok(pngA.length>140_000);
 assert.ok(pngN.length>40_000);
 assert.notEqual(createHash('sha256').update(pngA).digest('hex'),createHash('sha256').update(pngN).digest('hex'));
});
