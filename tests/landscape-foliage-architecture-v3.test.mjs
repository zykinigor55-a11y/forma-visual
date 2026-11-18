import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOUSE_PRESETS} from '../forma-landscape-3d-buildings.js';
import {VEGETATION_SPECIES} from '../forma-landscape-3d-vegetation.js';

const flora=readFileSync(new URL('../forma-landscape-3d-vegetation.js',import.meta.url),'utf8');
const architecture=readFileSync(new URL('../forma-landscape-3d-buildings.js',import.meta.url),'utf8');

test('mature conifer shoots grow from parent branch with measured crown limits',()=>{
 assert.match(flora,/if\(conifer\)\{[\s\S]{0,650}const shoots=kind==='spruce'\?4:3/);
 assert.match(flora,/curveBranch\(branches,base,end,Math\.max\(\.003,trunkRadius\*\.024/);
 assert.match(flora,/clamp\(base\[0\]-Math\.sin\(direction\)\*sideways,-radius,radius\)/);
 assert.ok(VEGETATION_SPECIES.spruce.branches>=12);
 assert.ok(VEGETATION_SPECIES.pine.branches>=10);
});
test('shrub terminal foliage grows only from actual side branch geometry',()=>{
 assert.match(flora,/if\(k%3===0&&!isSpike\)/);
 assert.match(flora,/branches\.push\(\[tip,end,Math\.max\(\.0025,radiusStem\*\.20\)\]\)/);
 assert.match(flora,/points\.push\(\{x:end\[0\],y:end\[1\],z:end\[2\]/);
 assert.match(flora,/clamp\(tip\[1\]\+actual\*\(r\(\)-\.55\)\*\.035,\.04,actual\)/);
});
test('architectural rainfall and foundation details do not alter measured house footprint',()=>{
 assert.equal(HOUSE_PRESETS.length,18);
 assert.match(architecture,/function addFacadeFinish\(/);
 assert.match(architecture,/new T\.CylinderGeometry\(\.046,\.046,Math\.max\(\.35,gutterY-\.64\),10\)/);
 assert.match(architecture,/if\(!isGazebo&&!isCarport&&!isGreenhouse&&style!=='aframe'\)\{/);
 assert.match(architecture,/addFacadeFinish\(g,THREE,/);
 assert.match(architecture,/addEntranceDetails\(g,THREE,/);
 assert.match(architecture,/g\.userData\.footprint=\{width:w,height:d\}/);
});
