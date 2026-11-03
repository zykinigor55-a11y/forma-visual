import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finalGeneratedImage} from '../lib/provider.ts';
test('only a final image can be persisted or charged, never a thought draft',()=>{
 const reply={candidates:[{finishReason:'STOP',content:{parts:[{thought:true,inlineData:{mimeType:'image/png',data:'draft'}},{inlineData:{mimeType:'image/png',data:'final'}}]}}]};
 assert.equal(finalGeneratedImage(reply).data,'final');
});
test('thought-only and blocked responses do not become a finished visualization',()=>{
 for(const reply of [{candidates:[{content:{parts:[{thought:true,inlineData:{mimeType:'image/png',data:'draft'}}]}}]},{candidates:[{finishReason:'SAFETY',content:{parts:[]}}]}])assert.throws(()=>finalGeneratedImage(reply));
});
