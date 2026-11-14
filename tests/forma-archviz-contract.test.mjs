import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const fromRoot = path => readFile(new URL('../'+path,import.meta.url),'utf8');

test('FORMA ARCHVIZ shell mounts all independent tool modules', async () => {
 const html = await fromRoot('index.html');
 for(const asset of [
   'forma-archviz-studio.js','forma-archviz-studio.css',
   'forma-interiors.js','forma-interiors.css',
   'forma-nodes.js','forma-nodes.css',
   'forma-pro-tools.js','forma-pro-tools.css'
 ])assert.ok(html.includes(asset),'Missing asset: '+asset);
 assert.match(html,/<title>FORMA ARCHVIZ/);
});

test('interior sketch-to-photo settings reach the existing API render request', async () => {
 const app=await fromRoot('app.js');
 const server=await fromRoot('server.mjs');
 const client=await fromRoot('forma-interiors.js');
 assert.match(app,/window\.FORMA_INTERIORS\?\.briefForProject\(project\.id\)/);
 assert.match(client,/sceneType:'interior'/);
 assert.match(server,/function createInteriorPrompt\(p\)/);
 assert.match(server,/p\.brief\?\.sceneType==='interior'/);
 assert.match(server,/OUTPUT|Output|same view|same exact room/);
});

test('node graph persists outputs independently from workflow JSON', async () => {
 const js=await fromRoot('forma-nodes.js');
 assert.match(js,/forma-archviz-node-media-v1/);
 assert.match(js,/function canLink\(from,to\)/);
 assert.match(js,/function pinImage\(id\)/);
 assert.match(js,/window\.FORMA_INTERIORS\?\.open\?\.\(\)/);
 assert.match(js,/function exportJSON\(\)/);
});

test('PRO tools clearly label unimplemented provider features', async () => {
 const js=await fromRoot('forma-pro-tools.js');
 assert.match(js,/AI Super Resolution/);
 assert.match(js,/Ожидает нового API/);
 assert.match(js,/пока не/i);
 assert.match(js,/window\.FORMA_PRO=/);
});

test('no new frontend module exposes literal secret assignment', async () => {
 for(const file of ['forma-archviz-studio.js','forma-interiors.js','forma-nodes.js','forma-pro-tools.js']){
  const text=await fromRoot(file);
  assert.doesNotMatch(text,/API_MARKET_KEY\s*=\s*['"][^'"]+['"]/);
 }
});


test('selected FA vector identity is applied consistently', async () => {
 const html=await fromRoot('index.html');
 const js=await fromRoot('forma-archviz-studio.js');
 const nodeJs=await fromRoot('forma-nodes.js');
 const proJs=await fromRoot('forma-pro-tools.js');
 const favicon=await fromRoot('favicon.svg');
 const mark=await fromRoot('assets/brand/forma-fa-mark.svg');
 assert.match(html,/forma-fa-mark\.svg/);
 assert.match(html,/forma-brand-identity\.css/);
 assert.match(html,/favicon\.svg/);
 assert.match(js,/forma-fa-mark\.svg/);
 assert.match(nodeJs,/forma-fa-mark\.svg/);
 assert.match(proJs,/forma-fa-mark\.svg/);
 assert.match(mark,/viewBox="0 0 270 265"/);
 assert.match(favicon,/<svg/);
});
