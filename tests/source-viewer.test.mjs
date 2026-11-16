import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');const fn=source.slice(source.indexOf('function setViewerMode(mode){'),source.indexOf('/* Two clear studio modes:'));
test('uploaded input remains visible without a missing-result curtain',()=>{
 const els=new Map();const $=id=>{if(!els.has(id))els.set(id,{style:{},dataset:{},classList:{toggle(){}},hidden:false,textContent:''});return els.get(id);};
 const context={$,project:{hasSource:true,demo:false},renderURL:'',maskVisible:false,wandPreviewMask:null,rendering:false,localStorage:{setItem(){}},document:{querySelectorAll:()=>[]}};vm.createContext(context);vm.runInContext(fn+';setViewerMode("result");',context);assert.equal($('noRender').hidden,true);
});
