import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const server=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('nonsecret release endpoint identifies exact deployed Render branch and SHA',()=>{
 assert.match(server,/req\.url==='\/api\/build'/);
 assert.match(server,/process\.env\.RENDER_GIT_BRANCH/);
 assert.match(server,/process\.env\.RENDER_GIT_COMMIT/);
 assert.match(server,/process\.env\.RENDER_GIT_REPO_SLUG/);
 assert.ok(!server.includes("process.env.API_MARKET_KEY||null}"),'Release API never returns the AI key');
});
test('editor visibly warns if deployment tracks a different branch',()=>{
 assert.match(editor,/id="buildInfo"/);
 assert.match(editor,/fetch\('\/api\/build',\{cache:'no-store'\}\)/);
 assert.match(editor,/branch==='dom-render-nanobanana'/);
 assert.match(editor,/\.classList\.toggle\('stale',!valid\)/);
});
