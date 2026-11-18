import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coniferNeedleProfile,foliageDepthTone} from '../forma-landscape-3d-botany.js';
test('pine/spruce needle forms are species distinct and opaque enough to survive distant mipmaps',()=>{
 const a=coniferNeedleProfile('pine'),b=coniferNeedleProfile('spruce');
 assert.notDeepEqual(a,b);
 assert.ok(a.length>b.length,'pine needle clusters are longer');
 assert.ok(b.needlesPerSide>a.needlesPerSide,'spruce has denser short needles');
 const source=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
 assert.match(source,/Individually tapered, filled needle bundles retain alpha coverage/);
 assert.match(source,/ctx\.quadraticCurveTo\(\(x\+tx\)\/2\+thick\*1\.4/);
 assert.match(source,/minimum=quality<\.3\?\(shrub\?220:620\):quality<\.45\?\(shrub\?390:1250\):\(shrub\?670:2250\)/);
 assert.ok(foliageDepthTone('pine',.8,.7)>foliageDepthTone('pine',.2,.2));
});
