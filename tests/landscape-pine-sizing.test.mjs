import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PINE_SIZE_PRESETS,pineCrownAtHeight,pineSizeMarkup} from '../forma-landscape-pine-sizing.js';

const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const styles=readFileSync(new URL('../forma-landscape-pine-sizing.css',import.meta.url),'utf8');

test('pine resizing preserves species proportions and supports real metric dimensions',()=>{
 assert.equal(pineCrownAtHeight(14,.5),7);
 assert.equal(pineCrownAtHeight(20,.5),10);
 assert.equal(pineCrownAtHeight(7.5,.5),3.8);
 assert.equal(pineCrownAtHeight(45,1),30,'crown does not exceed renderer upper bound');
 assert.equal(pineCrownAtHeight(-1,.5),null);
 assert.equal(pineCrownAtHeight(10,NaN),null);
 assert.deepEqual(PINE_SIZE_PRESETS.map(p=>p.height),[5,9,14,20]);
 assert.deepEqual(PINE_SIZE_PRESETS.map(p=>p.diameter),[2.5,4.5,7,10]);
});
test('live pine inspector has real GLB size controls, proportional lock and presets',()=>{
 const markup=pineSizeMarkup({height:14,diameter:7},true);
 for(const id of ['pineScaleHeight','pineScaleCrown','pineScaleLock','pineScaleReset'])assert.ok(markup.includes('id="'+id+'"'),id);
 assert.match(markup,/max="40"/);assert.match(markup,/max="30"/);
 assert.match(markup,/checked/);
 assert.match(pineSizeMarkup({height:9,diameter:4.5},false),/4\.5 м/);
 assert.ok(!pineSizeMarkup({height:9,diameter:4.5},false).includes('checked'));
 assert.ok(styles.includes('touch-action:pan-x'));
});
test('pine sliders render instantly, then save through normal measured undoable editor path',()=>{
 assert.match(editor,/import \{pineSizeMarkup,mountPineSizing\} from '\.\/forma-landscape-pine-sizing\.js'/);
 assert.match(editor,/isPine\?pineSizeMarkup\(o,pineScaleLocks\.get\(o\.id\)!==false\)/);
 assert.match(editor,/if\(isPine\)mountPineSizing\(el,o,/);
 assert.match(editor,/model\.scale\.set\(diameter\/Math\.max\(\.01,Number\(o\.diameter\)/);
 assert.match(editor,/onCommit:\(\)=>el\.querySelector\('#applyProps'\)\?\.click\(\)/);
 assert.match(editor,/push\(\);Object\.assign\(o,updated\);save\(\);rebuild\(\)/);
 assert.match(editor,/const MATURE_SCOTS_PINE_GLB='\/assets\/landscape-models\/pine-mature-cc0\.glb'/);
});
