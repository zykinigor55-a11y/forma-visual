import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../forma-result-focus.js',import.meta.url),'utf8');
const graphite=readFileSync(new URL('../forma-graphite-neutral-v1.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');

test('post-render quick variants regenerate the exact completed image, not SketchUp source',()=>{
 assert.match(app,/async function generateQuickResultVariant\(changes,finishedImage\)/);
 assert.match(app,/const image=await urlToDataURL\(finishedImage\)/);
 assert.match(app,/sceneTransformOnly:true,sceneChanges:safe/);
 assert.match(app,/await setMedia\(mediaKey\('input_'\+id,projectId\),image\)/);
 assert.match(app,/await setMedia\(mediaKey\('render_'\+id,projectId\),url\)/);
 assert.match(app,/project\.renders\.push|owner\.renders\.push/);
 assert.match(app,/return \{id,image:url\}/);
});

test('quick option selection is side-effect free until the user confirms one AI request',()=>{
 const pick=ui.slice(ui.indexOf(' function pick(button){'),ui.indexOf(' function close(',ui.indexOf(' function pick(button){')));
 assert.ok(pick.length>200);
 assert.doesNotMatch(pick,/setQuickOption\(/);
 assert.match(pick,/pending\[group\]=id/);
 const action=ui.slice(ui.indexOf("   if(type==='make'){"),ui.indexOf("   if(type==='close')",ui.indexOf("   if(type==='make'){")));
 assert.match(action,/await bridge\.generateVariant\(changes,source\.image\)/);
 assert.match(action,/if\(status\)status\.textContent='Ошибка:/);
 assert.match(action,/btn\.disabled=false/);
 assert.ok(action.indexOf('close(false)')>action.indexOf('await bridge.generateVariant'),'close only after successful render');
});

test('client prevents duplicate jobs and retains exact scene changes on saved result',()=>{
 assert.match(app,/if\(rendering\|\|uploadBusy\)throw Error/);
 assert.match(app,/if\(!safe\.length\)throw Error/);
 assert.match(app,/owner\.renders\.push\(\{id,number:/);
 assert.match(app,/sceneChanges:safe/);
 assert.match(app,/cfg\.sceneMood=null/);
 assert.match(app,/if\(project!==owner\|\|project\.id!==projectId/);
});

test('dark appearance uses neutral graphite RGB values, not olive/green, light remains separate',()=>{
 const tokenColors=Object.fromEntries([...graphite.matchAll(/--(fs-bg|fs-panel|fs-raised|fa-back):#([0-9a-f]{6})/g)].map(x=>[x[1],x[2]]));
 for(const name of ['fs-bg','fs-panel','fs-raised','fa-back']){
  const hex=tokenColors[name];assert.ok(hex,name+' token');
  const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
  assert.ok(Math.max(r,g,b)-Math.min(r,g,b)<=9,name+' has a colored cast');
 }
 assert.match(graphite,/html\[data-forma-theme="dark"\]/);
 assert.doesNotMatch(graphite,/html\[data-forma-theme="light"\]/);
 assert.match(html,/forma-graphite-neutral-v1\.css/);
 assert.match(html,/app\.js\?v=quick-result-graphite-v1/);
 assert.match(html,/forma-result-focus\.js\?v=quick-result-graphite-v1/);
});
