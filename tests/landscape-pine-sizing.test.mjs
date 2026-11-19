import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pineDimensions,pineGrowthMarkup,normalizePineGrowth} from '../forma-landscape-pine-growth.js';

test('age, height and pine shape replace metric density sliders',()=>{
 const p=pineGrowthMarkup({age:40,pineType:'solitary'},{height:14});
 assert.match(p,/id="pineAge"/);
 assert.match(p,/id="pineHeight"/);
 assert.match(p,/id="pineType"/);
 assert.doesNotMatch(p,/type="range"|pineScaleLock|pineScaleCrown|pineGrow-needleDensity/);
 const shape=pineDimensions(14,40,'solitary');
 assert.equal(shape.height,14);
 assert.ok(shape.diameter>0);
 assert.equal(normalizePineGrowth({age:40}).age,40);
});
test('3D editor keeps the native GLB model but removes legacy pine resize components',()=>{
 const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
 assert.match(html,/const MATURE_SCOTS_PINE_GLB='\/assets\/landscape-models\/pine-mature-cc0\.glb'/);
 assert.match(html,/mountPineGrowth\(el,o,/);
 assert.match(html,/pineDimensions\(height,next\.age,next\.pineType\)/);
 assert.doesNotMatch(html,/pineSizeMarkup\(|pineScaleLocks|mountPineSizing\(/);
});
