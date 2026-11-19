import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {byId,coordinateSummary,freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {treeInstancePhotoDetail,sprucePromptStage} from '../forma-landscape-tree-photo-identity.js';
import {masterplanPrompt,perspectiveLandscapePrompt} from '../forma-landscape-project-prompts.js';

const tree=(id,catalogId,x,age,type,height,diameter)=>({
 id,catalogId,type:'trees',x,y:15,height,diameter,rotation:0,
 ...(catalogId==='pine'?{pine:{age,pineType:type}}:{}),
 ...(catalogId==='spruce'?{spruce:{type,age}}:{})
});
const authored=()=>{
 const project=freshProject();
 project.objects=[
  tree('pine-young','pine',4,8,'garden',5,2.5),
  tree('pine-old','pine',9,95,'forest',20,8.8),
  tree('spruce-young','spruce',14,null,'young',5,2),
  tree('spruce-usual','spruce',20,null,'ordinary',12,5),
  tree('spruce-centenarian','spruce',25,110,'century',27,12),
  {id:'birch-a',catalogId:'birch',type:'trees',x:28,y:28,height:15,diameter:6,rotation:0}
 ];
 return coordinateSummary(project);
};
test('only real selected pine ages are expressed, with exact Latin species and crown dimensions',()=>{
 const input=authored();
 const young=input.objects[0],old=input.objects[1];
 const y=treeInstancePhotoDetail(young,byId('pine'));
 const o=treeInstancePhotoDetail(old,byId('pine'));
 assert.match(y,/SPECIES Pinus sylvestris/);
 assert.match(y,/age 8 years/);
 assert.match(y,/5\.00m and crown diameter 2\.50m/);
 assert.match(y,/fuller natural lower branches/);
 assert.match(o,/age 95 years/);
 assert.match(o,/slender forest-grown Scots pine/);
 assert.doesNotMatch(y,/Picea abies/);
 const missing=treeInstancePhotoDetail({catalogId:'pine',height:14,diameter:7},byId('pine'));
 assert.doesNotMatch(missing,/age \d+ years/,'unspecified age may not be invented');
});
test('spruce young / ordinary / century types are distinct and survive saving',()=>{
 const input=authored();
 assert.deepEqual(input.objects.filter(o=>o.catalogId==='spruce').map(o=>o.spruce.type),['young','ordinary','century']);
 assert.equal(sprucePromptStage({spruceType:'ancient'}),'century');
 assert.equal(sprucePromptStage({spruce:{type:'unknown'}}),'ordinary');
 const descriptions=input.objects.filter(o=>o.catalogId==='spruce').map(o=>treeInstancePhotoDetail(o,byId('spruce')));
 assert.match(descriptions[0],/YOUNG LOW Norway spruce/);
 assert.match(descriptions[1],/ORDINARY Norway spruce/);
 assert.match(descriptions[2],/CENTURY-OLD Norway spruce/);
 assert.match(descriptions[2],/user-authored age 110 years/);
 assert.doesNotMatch(descriptions[0],/age 110/);
 assert.match(descriptions[0],/SPECIES Picea abies/);
 assert.match(descriptions[2],/same Picea abies/i);
 const reloaded=coordinateSummary(normalizeProject(JSON.parse(JSON.stringify(input))));
 assert.deepEqual(reloaded.objects.filter(o=>o.catalogId==='spruce').map(o=>o.spruce.type),['young','ordinary','century']);
 assert.equal(reloaded.objects.find(o=>o.id==='spruce-centenarian').spruce.age,110);
 assert.equal(reloaded.objects.find(o=>o.id==='spruce-young').spruce.age,undefined);
});
test('Nano Banana perspective prompt follows every specific GLB species, age and position',()=>{
 const src=authored();
 const prompt=perspectiveLandscapePrompt({...src,cameraMode:'3d-perspective',cameraView:'3d'});
 assert.match(prompt,/INDIVIDUAL TREE IDENTITY CONTRACT FOR NANO BANANA/);
 assert.match(prompt,/Pinus sylvestris/);
 assert.match(prompt,/Picea abies/);
 assert.match(prompt,/Betula pendula/);
 assert.match(prompt,/age 8 years/);
 assert.match(prompt,/age 95 years/);
 assert.match(prompt,/YOUNG LOW Norway spruce/);
 assert.match(prompt,/CENTURY-OLD Norway spruce/);
 assert.match(prompt,/X=14\.00m Y=15\.00m/);
 assert.match(prompt,/X=25\.00m Y=15\.00m/);
 assert.match(prompt,/no species substitution, no extra trees, no resizing, no tree relocation/);
});
test('orthographic prompt contains the same exact tree-specific life stages',()=>{
 const prompt=masterplanPrompt(authored());
 assert.match(prompt,/TREE LIFE STAGE LOCK/);
 assert.match(prompt,/age 8 years/);
 assert.match(prompt,/age 95 years/);
 assert.match(prompt,/YOUNG LOW Norway spruce/);
 assert.match(prompt,/ORDINARY Norway spruce/);
 assert.match(prompt,/CENTURY-OLD Norway spruce/);
 assert.match(prompt,/Betula pendula/);
 assert.match(prompt,/no species substitution, no extra trees/);
});
test('3D editor sends normalized scene objects to the actual render server',async()=>{
 const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
 assert.match(editor,/landscapeMasterplan:sceneInfo/);
 assert.match(editor,/coordinateSummary\(doc\)/);
 assert.match(server,/p\.landscapeMasterplan\.cameraMode==='3d-perspective'\?perspectiveLandscapePrompt/);
 assert.match(server,/p\.landscapeModel==='nano-banana-2\.1'\?MODEL/);
});
