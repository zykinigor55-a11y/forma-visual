import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REFERENCE_CANOPIES,ADDITIONAL_GROWTH_TRAITS,speciesGrowthProfile,referenceBranchTips,referenceCanopy,referenceFoliageDensity} from '../forma-landscape-3d-reference-canopies.js';
import {normalizeProject,freshProject} from '../forma-landscape-project-core.js';
import {BOTANICAL_QUALITY,enableBotanicalLod,setFoliageTier,pickBotanicalLod} from '../forma-landscape-3d-foliage-lod.js';
const source=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');

test('the three reference plants differ in growth habit and leaf budget',()=>{
 assert.deepEqual(Object.keys(REFERENCE_CANOPIES),['birch','oak','spirea']);
 for(const id of ['birch','oak','spirea']){
  const p=referenceCanopy(id);
  assert.ok(p.latin&&p.shootsPerBranch>=3&&p.crownAsymmetry>.1);
  assert.ok(referenceFoliageDensity(id,.3)>0);
  assert.equal(referenceFoliageDensity(id,.8),referenceFoliageDensity(id,.8));
 }
 assert.ok(referenceCanopy('oak').layeredFoliage>referenceCanopy('birch').layeredFoliage);
 assert.ok(referenceCanopy('spirea').leafClusterScale<referenceCanopy('oak').leafClusterScale);
 assert.ok(referenceCanopy('birch').droop>0);
});
test('secondary branch endpoints remain inside measured crown width, no random hovering leaves',()=>{
 for(const id of ['birch','oak','spirea']){
  const height=id==='spirea'?1.1:14,crown=id==='spirea'?.65:3.2;
  const start=[0,height*.32,0],end=[crown*.72,height*.78,0];
  const shoots=referenceBranchTips(id,{start,end,stage:.42,crownRadius:crown,plantHeight:height,seed:37});
  assert.equal(shoots.length,REFERENCE_CANOPIES[id].shootsPerBranch);
  for(const shoot of shoots){
   assert.ok(shoot.tip.every(Number.isFinite));
   assert.ok(Math.abs(shoot.tip[0])<=crown);
   assert.ok(Math.abs(shoot.tip[2])<=crown);
   assert.ok(shoot.tip[1]>0&&shoot.tip[1]<=height);
   assert.ok(Math.hypot(shoot.base[0]-start[0],shoot.base[2]-start[2])<
     Math.hypot(end[0]-start[0],end[2]-start[2]));
  }
 }
 for(const token of ['referenceBranchTips(id,{start:[0,stemY,0],end:tip',
  'referenceBranchTips(id,{start:[0,.045,0],end:pt',
  'referenceFoliageDensity(id,quality)'])assert.ok(source.includes(token),token);
});
test('reference species keep exact 2D/3D coordinates, dimensions, type and variant after save',()=>{
 const doc=freshProject();
 doc.objects=['birch','oak','spirea'].map((id,i)=>({id:'reference-'+i,catalogId:id,
  type:id==='spirea'?'shrubs':'trees',x:5+i*7,y:4+i*3,height:id==='spirea'?1:14,
  diameter:id==='spirea'?1.4:7,rotation:19*i,variant:2}));
 const saved=normalizeProject(JSON.parse(JSON.stringify(doc)));
 for(let i=0;i<3;i++){
  const a=doc.objects[i],b=saved.objects[i];
  for(const name of ['catalogId','type','x','y','height','diameter','rotation','variant'])
   assert.equal(b[name],a[name],name+' of '+a.catalogId);
 }
});
test('LOD uses three distinct layers; middle retains a small branch silhouette and hysteresis',()=>{
 assert.deepEqual(Object.keys(BOTANICAL_QUALITY),['speed','standard','premium']);
 const make=(layer)=>({isMesh:true,isInstancedMesh:true,count:100,
  userData:{botanicalLayer:layer}});
 const m=['branches','micro','volume','sprays'].map(make),group={userData:{},traverse(fn){m.forEach(fn)}};
 enableBotanicalLod(group,'premium');setFoliageTier(group,'near');
 assert.deepEqual(m.map(x=>x.visible),[true,true,true,false]);
 setFoliageTier(group,'middle');
 assert.deepEqual(m.map(x=>x.visible),[true,false,true,true]);
 assert.ok(m[3].count<50,'partial distance silhouette');
 setFoliageTier(group,'far');
 assert.deepEqual(m.map(x=>x.visible),[true,false,false,true]);
 assert.ok(m[3].count>m[2].count,'distant spray budget replaces expensive 3D volume');
 assert.equal(pickBotanicalLod({pixelHeight:110,mode:'premium',previous:'near'}),'near');
});

test('each additional catalogue tree and shrub has a distinct authored growth profile',async()=>{
 const {VEGETATION_SPECIES}=await import('../forma-landscape-3d-vegetation.js');
 const nativeIds=Object.keys(VEGETATION_SPECIES);
 const referenced=Object.keys(REFERENCE_CANOPIES);
 const additional=Object.keys(ADDITIONAL_GROWTH_TRAITS);
 for(const id of additional){
  assert.ok(nativeIds.includes(id),'growth profile must be existing catalog species '+id);
  const p=speciesGrowthProfile(id);
  assert.ok(p.shootsPerBranch>=2&&p.shootsPerBranch<=5);
  assert.ok(p.layeredFoliage>=.8&&p.layeredFoliage<=1.5);
  assert.ok(p.leafClusterScale>=.45&&p.leafClusterScale<=1.1);
 }
 for(const id of referenced)assert.ok(nativeIds.includes(id));
 assert.ok(nativeIds.every(id=>id==='pine'||id==='spruce'||speciesGrowthProfile(id)),'all native deciduous and shrubs use species-specific growth');
 for(const id of ['maple','willow','linden','rowan','apple','sakura','ash','aspen','hydrangea','barberry','juniper','boxwood']){
  const p=referenceBranchTips(id,{start:[0,.15,0],end:[.5,.8,0],plantHeight:1,crownRadius:1.5,seed:3});
  assert.ok(p.length>=2,id+' must have genuine secondary twigs');
  assert.ok(p.every(o=>o.tip.every(Number.isFinite)&&o.base.every(Number.isFinite)));
 }
});
