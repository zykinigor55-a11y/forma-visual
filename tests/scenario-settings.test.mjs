import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
const source=readFileSync(new URL('../forma-node-engine.js',import.meta.url),'utf8');
function engine(){const window={FORMA_NODES:{getTexture:()=>null}};vm.runInNewContext(source,{window,document:{querySelector:()=>null},location:{protocol:'https:',hostname:'test'},Map,Set,console});return window.FORMA_NODE_ENGINE;}
test('scenario catalogs include exactly the regular app options, plus preserve-source',()=>{
 const e=engine(),app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const environments=vm.runInNewContext(app.match(/const environments = (\[.*?\]);/s)[1]);
 const choices=vm.runInNewContext('('+app.match(/const choices = (\{.*?\n\});/s)[1]+')');
 for(const [group,rows] of Object.entries({environment:environments,...choices}))assert.deepEqual(Object.keys(e.catalogs[group]).filter(x=>x!=='keep'),Array.from(rows,r=>r[0]));
 for(const [env,variants] of Object.entries(e.catalogs.landscapes))for(const [id] of variants)assert.ok(existsSync(new URL('../assets/thumbs/landscapes/'+env+'-'+id+'.webp',import.meta.url)),env+'/'+id);
});
test('lake and every scene setting are reflected in the actual render brief',()=>{
 const e=engine(),o={environment:'lake',environmentSubtype:'reeds',weather:'cloud',season:'autumn',time:'day',plants:'mediterranean',lens:'35mm',ratio:'4:3',quality:'medium',lockGeometry:false,preserveMaterials:false,changes:'Сохранить дорожки'};
 const b=e.briefFor({brief:{sceneMood:'night',lockGeometry:true,homeChanges:'Old instructions'}},'exterior',{type:'exterior',options:o});
 assert.match(b.environment,/озера/);assert.equal(b.weather,'Облачно');assert.equal(b.time,'День');assert.equal(b.plants,'Средиземноморская');assert.equal(b.lockGeometry,false);assert.equal(b.preserveMaterials,false);assert.equal(b.output.ratio,'4:3');assert.equal(b.output.quality,'medium');assert.match(b.homeChanges,/35mm/);assert.doesNotMatch(b.homeChanges,/Old instructions/);assert.notEqual(b.sceneMood,'night');
});
test('preserve-source scene options do not reuse stale main-project atmosphere',()=>{
 const b=engine().briefFor({brief:{environment:'Горы',weather:'Снег',sceneMood:'winter',time:'Ночь',output:{ratio:'1:1',quality:'medium'}}},'exterior',{type:'lighting',options:{environment:'keep',weather:'keep',time:'keep'}});
 assert.equal(b.environment,null);assert.equal(b.weather,null);assert.equal(b.time,null);assert.equal(b.sceneMood,null);assert.equal(b.output.ratio,'16:9');assert.equal(b.output.quality,'high');
});
test('interior sources are independent per-node settings passed into render brief',()=>{
 const lights=[{profile:'spot',placement:'left',intensity:125,temperature:3200,cone:25}];
 const e=engine(),b=e.briefFor({brief:{interiorLights:[{profile:'floor'}]}},'exterior',{type:'interior',options:{interiorLights:lights}});
 assert.equal(b.interiorLights,lights);const html=e.settingsHTML({id:'n3',type:'interior',options:{interiorLights:lights}});assert.match(html,/data-light-field="profile"/);assert.match(html,/data-light-field="temperature"/);assert.match(html,/data-scenario-add-light/);
});
test('material dialog exposes supported sources and texture controls only for texture edits',()=>{
 const e=engine(),html=e.settingsHTML({id:'n4',type:'materials',options:{materialSource:'texture'}});assert.match(html,/data-fa-material-texture/);assert.match(html,/textureRotation/);assert.match(html,/textureScale/);assert.doesNotMatch(html,/data-node-option="material"/);
 const text=e.settingsHTML({id:'n4',type:'materials',options:{materialSource:'text'}});assert.match(text,/data-node-option="instruction"/);assert.doesNotMatch(text,/data-fa-material-texture/);
});
test('uploaded material reference and texture transforms reach the render request',async()=>{
 const graph={selected:'m',nodes:[{id:'s',type:'source',options:{}},{id:'m',type:'materials',options:{materialSource:'texture',textureScale:'150',textureRotation:'90',textureName:'stone.webp',zone:'base'}}],edges:[{from:'s',to:'m'}]},requests=[],snapshots=new Map([['s','data:image/png;base64,AAA']]),status=[];
 const window={FORMA_NODES:{graph:()=>graph,getTexture:()=> 'data:image/webp;base64,TEXTURE',getSnapshot:id=>snapshots.get(id),setSnapshot:async(id,image)=>snapshots.set(id,image),showStatus:s=>status.push(s),save(){},invalidateFrom(){},markFresh(){}},FORMA_RENDER_BRIDGE:{capture:async()=>({source:'data:image/png;base64,AAA',projectId:'p',brief:{sceneType:'exterior'},size:'1536x864',quality:'high'})}};
 const document={querySelector:s=>s==='#faFlowBackdrop'?{querySelectorAll:()=>[]}:null,querySelectorAll:()=>[]};
 const fetch=async(url,init)=>url==='/api/render'?(requests.push(JSON.parse(init.body)),{ok:true,json:async()=>({images:['RESULT'],mimes:['image/png']})}):({ok:true,json:async()=>({ready:true,dailyRemaining:100})});
 vm.runInNewContext(source,{window,document,location:{protocol:'https:',hostname:'test'},fetch,confirm:()=>true,AbortController,setTimeout,clearTimeout,Map,Set,console});
 await window.FORMA_NODE_ENGINE.runTo('m');assert.equal(requests.length,1,status.join('\n'));const p=requests[0];assert.equal(p.material,'data:image/webp;base64,TEXTURE');assert.equal(p.zoneId,'base');assert.equal(p.selectedZone,'Цоколь');assert.equal(p.editMode,'text');assert.equal(p.brief.textureScale,'150%');assert.equal(p.brief.textureRotation,'90°');assert.match(p.materialInstruction,/150%/);assert.equal(snapshots.get('m'),'data:image/png;base64,RESULT');
});

test('node lake reeds replace inherited garden subtype and conflicting global atmosphere',()=>{
 const e=engine(),variant=e.catalogs.landscapes.lake.find(v=>v[0]==='reeds');
 const inherited={environment:'Сад и газон',environmentSubtype:'Парадный газон',environmentSubtypeInstructions:'Газон и подстриженные кусты',environmentInstructions:'Только ровный газон',sceneMood:'winter',atmosphere:{fog:90,strength:100},sunLighting:{azimuth:90},lightingPreset:'dramatic'};
 const b=e.briefFor({brief:inherited},'exterior',{type:'exterior',options:{environment:'lake',environmentSubtype:'reeds',environmentInstructions:'Сохранить существующую дорожку'}});
 assert.equal(b.environment,e.catalogs.environment.lake);assert.equal(b.environmentSubtype,variant[1]);assert.equal(b.environmentSubtypeInstructions,variant[2]);assert.match(b.environmentInstructions,/Сохранить существующую дорожку/);assert.ok(b.environmentInstructions.startsWith(variant[2]));
 assert.doesNotMatch(JSON.stringify(b),/Парадный газон|Только ровный газон|Газон и подстриженные кусты/);
 for(const key of ['atmosphere','sunLighting','lightingPreset','sceneMood'])assert.equal(b[key],null,key);
 const keep=e.briefFor({brief:inherited},'exterior',{type:'lighting',options:{environment:'keep'}});assert.equal(keep.environmentSubtype,null);assert.equal(keep.environmentSubtypeInstructions,null);assert.equal(keep.environmentInstructions,'');
});
