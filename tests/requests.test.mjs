import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readJsonBody,parseImage} from '../lib/validation.ts';
import {readFileSync} from 'node:fs';
test('oversized chunked JSON is stopped before full buffering',async()=>{
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"data":"'+'x'.repeat(100)+'"}'));c.close();}});
 await assert.rejects(()=>readJsonBody(new Request('https://app.test',{method:'POST',body,duplex:'half'}),32),RangeError);
});
test('normal bounded JSON requests remain readable',async()=>{
 assert.deepEqual(await readJsonBody(new Request('https://app.test',{method:'POST',body:'{"action":"save"}'}),64),{action:'save'});
});
test('JPEG dimensions are checked and truncated end marker rejected',()=>{
 const b=readFileSync(new URL('./fixtures/source.jpg',import.meta.url));
 assert.throws(()=>parseImage('data:image/jpeg;base64,'+b.subarray(0,-2).toString('base64')));
});
