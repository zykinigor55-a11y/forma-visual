import assert from 'node:assert/strict';
import {appOrigin,isAppOrigin} from './allowed-origins-v31.mjs';
const old='https://plux-v12-2-2k-fixed.onrender.com';
const preview='https://plux-v17-friends-preview.onrender.com';
assert.equal(appOrigin({headers:{origin:old}}),old);
assert.equal(appOrigin({headers:{origin:preview}}),preview);
for(const x of [
 'https://random.example.net',
 'https://plux-v17-friends-preview.onrender.com.evil.test',
 'http://plux-v17-friends-preview.onrender.com',
 'https://plux-v12-2-2k-fixed.onrender.com/',
 '',null
])assert.equal(isAppOrigin(x),false);
assert.equal(appOrigin({headers:{origin:'https://invalid.example'}}),null);
console.log('V31 CORS: original V30 preserved, preview allowed, spoofed origins rejected');
