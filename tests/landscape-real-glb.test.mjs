import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {modelPath,PREMIUM_LANDSCAPE_MODELS,PREMIUM_RESERVED_MODELS} from '../forma-landscape-3d-premium.js';
import {vegetationFit} from '../forma-landscape-3d-models.js';

test('premium 3D flora is supplied from verified self-hosted CC0 GLB paths',()=>{
 assert.equal(modelPath('pine'),'assets/landscape-models/pine.glb');
 assert.equal(modelPath('spruce'),'assets/landscape-models/spruce.glb');
 assert.equal(modelPath('granite-boulder'),'assets/landscape-models/granite-boulder.glb');
 assert.equal(PREMIUM_RESERVED_MODELS.fern,'assets/landscape-models/fern.glb');
 assert.equal(modelPath('oak'),null); // Do not substitute a different botanical species.
 assert.ok(Object.keys(PREMIUM_LANDSCAPE_MODELS).length>=3);
});

test('real GLBs are autoloaded in the editable scene and defer to user GLB imports',()=>{
 const page=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 const models=readFileSync(new URL('../forma-landscape-3d-models.js',import.meta.url),'utf8');
 assert.match(page,/loadBundledLandscapeModel\(o.catalogId\)/);
 assert.match(page,/new GLTFLoader\(\).loadAsync\(path\)/);
 assert.match(page,/importedPlantModels.get\(o.catalogId\),source=imported\|\|bundledModelSources.get/);
 assert.match(page,/if\(n.geometry&&!n.userData\?\.bundledSharedGeometry\)/);
 assert.match(models,/node.userData.bundledSharedGeometry=true/);
 assert.match(page,/makeRealVegetation\(THREE,source/);
});

test('imported tree GLB is normalized to site metres without moving root coordinates',()=>{
 const fit=vegetationFit({width:3.2,height:4.1,depth:2.8},{catalogId:'pine',diameter:7,height:14});
 assert.equal(fit.physicalHeight,14);
 assert.equal(fit.crownDiameter,7);
 assert.ok(Math.abs(fit.scaleY-14/4.1)<.000001);
 assert.ok(Math.abs(fit.scaleXZ-7/3.2)<.000001);
});

test('installed GLB assets are valid glTF 2.0 files when generated',()=>{
 for(const path of [...Object.values(PREMIUM_LANDSCAPE_MODELS),...Object.values(PREMIUM_RESERVED_MODELS)]){
  const file=new URL('../'+path,import.meta.url);
  if(!existsSync(file))continue; // Installer runs after initial source commit.
  const bytes=readFileSync(file);
  assert.ok(bytes.length>100_000,path);
  assert.equal(bytes.toString('utf8',0,4),'glTF',path);
  assert.equal(bytes.readUInt32LE(4),2,path);
  assert.equal(bytes.readUInt32LE(8),bytes.length,path);
 }
});
