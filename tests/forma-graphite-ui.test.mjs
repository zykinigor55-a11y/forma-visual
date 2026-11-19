import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pages=['index.html','forma-preview.html','forma-landscape-3d.html','forma-world.html',
 'forma-mature-trees-preview.html','forma-pine-glb-preview.html','forma-tree-lineup.html',
 'plan-to-interior.html','privacy.html'];
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('every website page loads the same unified graphite stylesheet LAST',()=>{
 for(const file of pages){
  const html=text(file);
  const link='<link rel="stylesheet" href="forma-graphite-unified-v2.css?v=graphite-universal-20261119">';
  const pos=html.lastIndexOf(link);
  assert.ok(pos>0,file+' missing graphite link');
  assert.ok(pos<html.indexOf('</head>'),file+' CSS must be in head');
  assert.equal(html.indexOf(link),pos,file+' exactly one stylesheet link');
  const styles=(html.slice(0,html.indexOf('</head>')).match(/<link[^>]+rel="stylesheet"[^>]*>/gi)||[]);
  const graphiteAt=styles.findIndex(x=>x.includes('forma-graphite-unified-v2.css'));
  assert.ok(graphiteAt>=0,file+' graphite base must load');
  const after=styles.slice(graphiteAt+1);
  assert.ok(after.every(x=>x.includes('forma-graphite-only-v3.css')),
   file+' any later CSS must be the compatible graphite finishing layer');
 }
});
test('neutral graphite chrome cannot recolor the actual 3D tree canopy or renders',()=>{
 const css=text('forma-graphite-unified-v2.css');
 assert.match(css,/--forma-g-0:#121316/);
 assert.match(css,/--fa-panel:#202228/);
 assert.match(css,/body:has\(#shell #viewport\) #tools button/);
 assert.match(css,/body:has\(#shell #viewport\) #right/);
 assert.match(css,/body:has\(#shell #viewport\) #mobileWorkspaceTabs/);
 assert.match(css,/body:has\(#shell #viewport\) :is\(#viewport,canvas,img,.choice.has-preview img\)\{filter:none\}/);
 assert.match(css,/--green:#c7ac86/);
 assert.match(css,/body:has\(#shell #viewport\) #properties \.spruce-native-editor/);
});
test('spruce and birch cannot regress to procedural twigs when added to crowded Android project',()=>{
 const editor=text('forma-landscape-3d.html');
 assert.match(editor,/const denseMobileTree=window.innerWidth<=720&&!\['pine','aspen','spruce','birch'\]\.includes\(o\.catalogId\)/);
 assert.match(editor,/const performanceFallback=!\['pine','aspen','spruce','birch'\]\.includes\(o\.catalogId\)/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
});
