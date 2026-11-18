import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gardenLightingSpec,gardenLightingState} from '../forma-landscape-3d-lighting.js';
import {barkPalette,foliageProfile,VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';

test('all eleven real catalogue lights have distinct emissions but none glow under midday sun',()=>{
 const ids=['bollard','ground','spot','low-post','deck-light','linear','mushroom','square-bollard','garden-lantern','spike-spot','globe'];
 assert.deepEqual(Object.keys(gardenLightingSpec).sort(),ids.sort());
 for(const id of ids){
  const day=gardenLightingState(id,{time:'day'});
  const night=gardenLightingState(id,{time:'night'});
  assert.equal(day.visible,false);
  assert.equal(day.actualIntensity,0);
  assert.equal(night.visible,true);
  assert.ok(night.actualIntensity>0&&night.range>=3);
  assert.ok(night.mountHeight<3);
 }
 assert.equal(gardenLightingState('unrecognized',{time:'night'}),null);
});

test('dusk lighting is weaker than night and spotlights have a different physical beam',()=>{
 const dusk=gardenLightingState('bollard',{time:'evening'});
 const night=gardenLightingState('bollard',{time:'night'});
 const uplight=gardenLightingState('spot',{time:'night'});
 assert.ok(dusk.actualIntensity<night.actualIntensity);
 assert.equal(uplight.kind,'uplight');assert.ok(uplight.beam>0);
 const adjustable=gardenLightingState('low-post',{time:'night',height:1.6});
 assert.equal(adjustable.height,1.6);
 assert.ok(adjustable.mountHeight>1&&adjustable.mountHeight<1.6);
 assert.equal(gardenLightingState('mushroom',{time:'night'}).kind,'downlight');
 assert.equal(gardenLightingState('spike-spot',{time:'night'}).kind,'uplight');
});

test('all 18 vegetation species have deterministic seasonal PBR bark palettes',()=>{
 const ids=Object.keys(VEGETATION_SPECIES);
 assert.equal(ids.length,18);
 for(const id of ids){
  const palette=barkPalette(id);
  assert.match(palette.base,/^#[0-9A-F]{6}$/i);
  assert.match(palette.dark,/^#[0-9A-F]{6}$/i);
  assert.match(palette.light,/^#[0-9A-F]{6}$/i);
  assert.ok(foliageProfile(id,'summer').color);
 }
 assert.equal(barkPalette('birch').cross,true);
 assert.notEqual(barkPalette('pine').base,barkPalette('birch').base);
 assert.equal(foliageProfile('birch','winter').leafless,true);
 assert.equal(foliageProfile('spruce','winter').leafless,false);
});

test('light sources are instantiated only for placed fixtures, independent of sun',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(html,/group==='lights'/);
 assert.match(html,/addRealGardenEmission\(THREE,g,o,/);
 assert.match(html,/gardenLightingState\(o\.catalogId/);
 assert.match(html,/renderer\.toneMapping=THREE\.ACESFilmicToneMapping/);
 assert.match(html,/scene\.getObjectByName\('forma-sky-fill'\)/);
});
