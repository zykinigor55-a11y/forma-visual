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
