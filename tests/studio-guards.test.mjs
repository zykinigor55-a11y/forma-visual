import test from 'node:test';import assert from 'node:assert/strict';
import * as flow from '../forma-image-workflows.js';
const tools=await import('../forma-landscape-tools.js');
test('custom angle task survives the server normalize-then-prompt pipeline',()=>{const task=flow.normalizeImageTask({kind:'view',hasOwnSource:true});assert.doesNotThrow(()=>flow.imageTaskPrompt(task));});
test('frame binding rejects a replaced source or another project',()=>{assert.equal(typeof flow.assertFrameBinding,'function');const a={projectId:'a',sourceKey:'v1',renderId:'r1',hasSource:true,demo:false};assert.doesNotThrow(()=>flow.assertFrameBinding(a,a));for(const change of [{projectId:'b'},{sourceKey:'v2'},{renderId:'r2'},{demo:true},{hasSource:false}])assert.throws(()=>flow.assertFrameBinding({...a,...change},a));});
test('room generation needs approved plan and a deliberate room selection',()=>{assert.equal(typeof flow.assertRoomReady,'function');assert.throws(()=>flow.assertRoomReady({planResult:'image',planApproved:false,roomSelected:true}),/план/);assert.throws(()=>flow.assertRoomReady({planResult:'image',planApproved:true,roomSelected:false}),/комнат/);assert.doesNotThrow(()=>flow.assertRoomReady({planResult:'image',planApproved:true,roomSelected:true}));});
test('an erased selection has no payable image edit coverage',()=>{assert.equal(typeof tools.selectionHasCoverage,'function');assert.equal(tools.selectionHasCoverage(new Uint8ClampedArray([0,0,0,0,255,255,255,0])),false);assert.equal(tools.selectionHasCoverage(new Uint8ClampedArray([255,255,255,255])),true);});
test('a rejected frame action cannot release another operation lock',async()=>{
 const {default:vm}=await import('node:vm');const {readFileSync}=await import('node:fs');let releases=0;
 const source=readFileSync(new URL('../forma-image-workspace.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('async function execute('),source.indexOf('\nfunction drawSeries'));
 const context={state:{source:null},run:false,token:1,bridge:()=>({snapshot:()=>({projectId:'p',sourceKey:'s'}),acquire:()=>false,release:()=>releases++}),status(){},lock(){},Error};
 vm.runInNewContext(code+';this.execute=execute;',context);await context.execute('detail');assert.equal(releases,0);
});
test('source picker refuses uploads while a scenario is running',async()=>{
 const {default:vm}=await import('node:vm');const {readFileSync}=await import('node:fs');const status=[];
 const source=readFileSync(new URL('../forma-workflow-ux.js',import.meta.url),'utf8'),code=source.slice(source.indexOf('async function uploadSource('),source.indexOf('\nfunction enhanceSettings'));
 const context={window:{FORMA_NODE_ENGINE:{busy:true},FORMA_NODES:{showStatus:s=>status.push(s)}},uploadNode:null,uploading:false,document:{createElement(){throw Error('Picker should not open while running');}}};
 vm.runInNewContext(code+';this.uploadSource=uploadSource;',context);await assert.doesNotReject(()=>context.uploadSource('n1'));assert.equal(status.length,1);
});
test('animation duration choices match the supported video durations',async()=>{const {default:vm}=await import('node:vm');const {readFileSync}=await import('node:fs');const window={};vm.runInNewContext(readFileSync(new URL('../dom-render-animation-v39.js',import.meta.url),'utf8'),{window});assert.equal(window.DOM_RENDER_ANIMATION.normalize({duration:6}).duration,5);assert.equal(window.DOM_RENDER_ANIMATION.normalize({duration:10}).duration,10);});
