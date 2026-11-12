import assert from 'node:assert/strict';
import {normalizeStation} from './music-radio-v31.mjs';
const t=normalizeStation({stationuuid:'00e4ab81-1111-2222-3333-abcdeffedcba',
 name:'Тестовое радио',url_resolved:'https://example.com/stream.mp3',
 countrycode:'RU',favicon:'https://example.com/logo.png',lastcheckok:true});
assert.equal(t.title,'Тестовое радио');
assert.equal(t.stream,'https://example.com/stream.mp3');
assert.equal(normalizeStation({stationuuid:'00e4ab81-1111-2222-3333-abcdeffedcba',
 name:'HTTP',url_resolved:'http://example.com/audio',lastcheckok:true}),null);
assert.equal(normalizeStation({stationuuid:'invalid',url:'https://example.com'}),null);
console.log('V31 radio: sanitizes station streams and accepts HTTPS only');
