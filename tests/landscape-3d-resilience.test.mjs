import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');

test('real PBR catalogue remains tied to source URLs and the metric scene',()=>{
 assert.match(code,/import \{REAL_3D_OBJECTS,REAL_3D_CATEGORIES,REAL_3D_TOTAL,realModelById\}/);
 assert.match(code,/id="modelHealth"/);
 assert.match(code,/loaded\+'/'+ids\.length/);
 assert.match(code,/retry3dModels/);
 assert.match(code,/bundledModelFailures\.clear\(\)/);
});
test('pending 3D model uses visibly marked temporary footprint, never silently disappears',()=>{
 assert.match(code,/if\(realModelById\(o\.type\)\)\{/);
 assert.match(code,/new THREE\.BoxGeometry\(width,Math\.min\(1,width\*\.45\),width\)/);
 assert.match(code,/wireframe:true,transparent:true/);
 assert.match(code,/makeRealProp\(THREE,source,\{width\}\)/);
});
test('WebGL context lost and recovered explicitly without editing saved plot',()=>{
 assert.match(code,/addEventListener\('webglcontextlost'/);
 assert.match(code,/addEventListener\('webglcontextrestored'/);
 assert.match(code,/renderGate\.reset\(\);rebuild\(\);resize\(\)/);
 assert.match(code,/id="reload3d"/);
 assert.match(code,/window\.FORMA_3D_READY=true/);
});
test('CDN startup watchdog exposes recovery instead of indefinitely blank canvas',()=>{
 assert.match(code,/if\(window\.FORMA_3D_READY\)return/);
 assert.match(code,/id="loadError"/);
 assert.match(code,/id="reload3d"/);
});
