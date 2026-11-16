import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('node preparation errors restore the Run button and show a recovery message',async()=>{
 const controls=[{disabled:false},{disabled:false}],run={disabled:false},stop={disabled:true},status=[];
 const host={innerHTML:'',addEventListener(){},querySelector:()=>controls[0],querySelectorAll:()=>controls};
 const elements={'#faFlowBackdrop':{querySelectorAll:()=>[]},'#faFlowRunChain':run,'#faFlowStopChain':stop,'#faFlowNodeSettings':host};
 const graph={selected:'source',nodes:[{id:'source',type:'source',title:'Исходник',options:{}}],edges:[]};
 const document={querySelector:s=>elements[s]||null,querySelectorAll:()=>[]};
 const window={FORMA_NODES:{graph:()=>graph,showStatus:s=>status.push(s)},FORMA_RENDER_BRIDGE:{capture:async()=>{throw Error('Загрузите собственный исходник')}}};
 const context={window,document,location:{protocol:'https:',hostname:'forma.test'},console,Set,Map,Error,Number,String,Date,JSON};
 vm.runInNewContext(readFileSync(new URL('../forma-node-engine.js',import.meta.url),'utf8'),context);
 await assert.doesNotReject(()=>window.FORMA_NODE_ENGINE.runTo('source'));
 assert.equal(window.FORMA_NODE_ENGINE.preparing,false);assert.equal(run.disabled,false);assert.equal(stop.disabled,true);
 assert.match(status.at(-1),/Загрузите собственный исходник/);
});
test('separate source branches retain their own cache fingerprints',async()=>{
 const invalidated=[],graph={selected:'ea',nodes:[{id:'sa',type:'source',options:{}},{id:'sb',type:'source',options:{}},{id:'ea',type:'exterior',options:{}},{id:'eb',type:'exterior',options:{}}],edges:[{from:'sa',to:'ea'},{from:'sb',to:'eb'}]};
 const elements={'#faFlowBackdrop':{querySelectorAll:()=>[]},'#faFlowRunChain':{},'#faFlowStopChain':{}};
 const window={FORMA_NODES:{graph:()=>graph,invalidateFrom:id=>invalidated.push(id),save(){},showStatus(){},getSnapshot:id=>id==='sa'?'data:image/png;base64,AAA':id==='sb'?'data:image/png;base64,BBB':null},FORMA_RENDER_BRIDGE:{capture:async()=>({source:'data:image/png;base64,AAA',projectId:'p',brief:{}})}};
 const document={querySelector:s=>elements[s]||null,querySelectorAll:()=>[]};
 vm.runInNewContext(readFileSync(new URL('../forma-node-engine.js',import.meta.url),'utf8'),{window,document,location:{protocol:'https:',hostname:'forma.test'},fetch:async()=>({ok:true,json:async()=>({ready:true,dailyRemaining:100})}),confirm:()=>false,console,Set,Map,Error,Number,String,Date,JSON});
 await window.FORMA_NODE_ENGINE.runTo('ea');await window.FORMA_NODE_ENGINE.runTo('eb');await window.FORMA_NODE_ENGINE.runTo('ea');
 assert.deepEqual(invalidated,['sa','sb']);
});
