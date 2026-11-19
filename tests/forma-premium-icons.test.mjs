import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {premiumIcon} from '../forma-premium-icons.js';
const source=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const toolNames=['select','site','surface','terrain','build','fence','plant','water','landscape','small','furniture','transport','light','models40'];
test('all fourteen studio tools have self-contained dimensional SVG icons',()=>{
 const gradients=new Set();
 for(const name of toolNames){
  const result=premiumIcon(name);
  assert.match(result,/<svg[^>]+class="lp-3d-icon forma-premium-icon"/);
  assert.match(result,/<\/svg>$/);
  assert.match(result,/<defs>/);
  assert.match(result,/linearGradient/);
  assert.match(result,/radialGradient/);
  assert.match(result,/width="48" height="48"/);
  assert.doesNotMatch(result,/<(?:image|use|foreignObject)\b/i,'external images or sprite dependencies forbidden');
  const id=result.match(/id="(forma-metal-[0-9]+)"/)?.[1];
  assert.ok(id,'Missing metallic gradient for '+name);
  assert.ok(result.includes('url(#'+id+')'),'Gradient must actually be used in icon '+name);
  assert.ok(!gradients.has(id),'SVG gradient must have unique id to avoid blank icons');
  gradients.add(id);
 }
 assert.equal(gradients.size,14);
});
test('left sidebar never depends on external icons or decorative inert buttons',()=>{
 assert.match(source,/function safeToolIcon\(tool\)/);
 assert.match(source,/const svg=premiumIcon\(tool\)/);
 assert.match(source,/data-tool="'\+a\[0\]/);
 assert.match(source,/class="glyph" aria-hidden="true"/);
 assert.match(source,/class="tool-name"/);
 assert.match(source,/#tools button .glyph>svg/);
 assert.match(source,/#tools button .glyph:empty::before/);
});
