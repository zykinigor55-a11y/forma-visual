import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SHRUB_3D_MODELS} from '../forma-landscape-3d-shrub-models.js';

const root=new URL('../',import.meta.url);
const bytes=readFileSync(new URL('assets/landscape-models/boxwood-sempervirens-forma-original.glb',root));
const source=JSON.parse(readFileSync(new URL('assets/landscape-models/boxwood-sempervirens-forma-original.source.json',root),'utf8'));
const len=bytes.readUInt32LE(12);
const meta=JSON.parse(bytes.subarray(20,20+len).toString('utf8'));

test('Every real Buxus leaf crown has UV-mapped CC0 photographic albedo and photometric normal maps',()=>{
 assert.equal(source.version,'v3.0-CC0-real-leaf-PBR-textures');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
 assert.equal(SHRUB_3D_MODELS.boxwood.sha256,source.sha256);
 assert.equal(source.photoTexture.license,'Public domain, Wikimedia Commons');
 assert.equal(source.photoTexture.author,'Karduelis');
 assert.equal(source.photoTexture.sourceDimensions[0],2589);
 assert.equal(source.photoTexture.sourceDimensions[1],1714);
 assert.ok(source.photoTexture.sampledLeafPhotoPatch.every(Number.isFinite));
 assert.equal(source.photoTexture.sourceSHA256.length,64);
 assert.equal(source.triangles,720940);
 assert.equal(source.meshCount,30);
 assert.equal(meta.materials.length,10);
 assert.equal(meta.images.length,16,'8 distinct leaf material slots, real albedo + normal texture each');
 assert.equal(meta.textures.length,16);
 const withUV=meta.meshes.flatMap(m=>m.primitives).filter(p=>'TEXCOORD_0' in p.attributes);
 assert.equal(withUV.length,24,'8 foliage types across 3 real crown variants are UV mapped');
 const photo=meta.materials.filter(m=>m.name?.includes('CC0-photo-'));
 assert.equal(photo.length,8);
 for(const mat of photo){
  assert.ok(mat.pbrMetallicRoughness?.baseColorTexture);
  assert.ok(mat.normalTexture);
  assert.ok(mat.pbrMetallicRoughness?.roughnessFactor>=.45);
 }
 for(const form of ['BOXWOOD_NATURAL','BOXWOOD_SPHERE','BOXWOOD_HEDGE']){
  assert.ok(meta.nodes.some(n=>n.name===form));
  assert.equal(source.forms[form].height>0,true);
 }
});
