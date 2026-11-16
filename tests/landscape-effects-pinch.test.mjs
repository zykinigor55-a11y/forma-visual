import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPECIAL_LANDSCAPE_TOOLS,specialById,specialForGroup,isCurveKind,isBrushKind,curvePath,pointOnPolyline} from '../forma-landscape-special-tools.js';
import {normalizeLandscape,landscapePrompt} from '../forma-art-direction-core.js';
import {LANDSCAPE_GROUPS,catalogGroup} from '../forma-landscape-catalog.js';
import {itemBounds} from '../forma-local-composite.js';

test('catalog includes 5 climbers, 4 light garlands, 4 leaf styles, 5 snow types and 4 details',()=>{
 const expected={climber:5,light:4,leaves:4,snow:5,details:4};
 for(const [group,n] of Object.entries(expected))assert.equal(specialForGroup(group).length,n,group);
 assert.equal(SPECIAL_LANDSCAPE_TOOLS.length,22);
 assert.equal(new Set(SPECIAL_LANDSCAPE_TOOLS.map(x=>x.id)).size,22);
 for(const group of ['climber','light','leaves','snow','details']){
  assert.ok(LANDSCAPE_GROUPS.find(g=>g.id===group));
  for(const tool of specialForGroup(group))assert.ok(catalogGroup(group).find(e=>e.id===tool.id));
 }
 assert.equal(specialById('ivy').name,'Плющ');
 assert.equal(specialById('garland-fairy').kind,'garland');
});

test('garland curves have validated editable control points, sag and lamp spacing',()=>{
 const p=[{x:.1,y:.2},{x:.2,y:.3},{x:.4,y:.35},{x:.7,y:.31}];
 const item=normalizeLandscape({items:[{kind:'garland',catalogId:'garland-fairy',points:p,bulbSpacing:.025,sag:.2,tension:.8,brightness:88}]}).items[0];
 assert.equal(item.points.length,4);assert.equal(item.sag,.2);assert.equal(item.bulbSpacing,.025);
 const curve=curvePath(item.points,item.tension);assert.match(curve,/^M/);assert.match(curve,/ C/);
 const mid=pointOnPolyline(item.points,.5);assert.ok(mid.x>.1&&mid.x<.7);
 const b=itemBounds(item);assert.ok(b.x<.1&&b.right>.7);
 const prompt=landscapePrompt({items:[item]});
 assert.match(prompt,/LED|garland|warm-white/i);
 assert.match(prompt,/editable gently curved physical centreline/);
 assert.match(prompt,/bulb spacing/);
 assert.match(prompt,/brightness 88%/);
 assert.match(prompt,/3D path rather than floating/);
 assert.throws(()=>normalizeLandscape({items:[{kind:'garland',catalogId:'garland-fairy',points:[p[0]]}]}),/2 до 100/);
 assert.throws(()=>normalizeLandscape({items:[{kind:'garland',catalogId:'ivy',points:p}]}),/Тип инструмента/);
});

test('climbing ivy is attached to facade with botanical realism and preserves openings',()=>{
 const item={kind:'climber',catalogId:'ivy',points:[{x:.1,y:.9},{x:.15,y:.55},{x:.13,y:.2}],tension:.75,density:68};
 const normalized=normalizeLandscape({items:[item]}).items[0];
 assert.equal(normalized.density,68);
 const p=landscapePrompt({items:[item]});
 assert.match(p,/Hedera helix/);
 assert.match(p,/rootlets/);
 assert.match(p,/windows, doors, gutters/);
 assert.match(p,/wall|facade/i);
});

test('brush-scattered leaves snow frost pine needles and moss remain local masked effects',()=>{
 for(const id of ['leaf-mixed','leaf-oak','leaf-maple','leaf-birch','snow-dusting','snow-cover','snow-drifts','snow-frost','snow-cleared','pine-litter','moss','puddles','damp-grass']){
  const tool=specialById(id),item={kind:'scatter',catalogId:id,strokes:[{size:.07,erase:false,points:[{x:.35,y:.7},{x:.5,y:.8}]}],density:64,wind:22};
  assert.equal(tool.kind,'scatter');assert.equal(normalizeLandscape({items:[item]}).items[0].wind,22);
  const p=landscapePrompt({items:[item]});
  assert.ok(p.includes(tool.prompt),id+' missing explicit natural prompt');
  assert.match(p,/painted LOCAL surface mask/);
  const b=itemBounds(item);assert.ok(b.right>.5&&b.bottom>.8);
 }
 assert.ok(isBrushKind('scatter'));assert.ok(isCurveKind('climber'));
});

test('editor supports node dragging, 200% resizing both on desktop and two-finger mobile',()=>{
 const c=readFileSync(new URL('../forma-landscape-atmosphere.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 assert.match(c,/activePointers=new Map\(\),pinchStart=null/);
 assert.match(c,/activePointers\.size===2/);
 assert.match(c,/dragging=\{type:'pinch'/);
 assert.match(c,/dragging=\{type:'resize'/);
 assert.match(c,/Math\.min\(2,Math\.max\(\.2,/);
 assert.match(c,/scalePlacement\(item,factor\)/);
 assert.match(c,/data-art="add-vertex"/);
 assert.match(c,/data-art="remove-vertex"/);
 assert.match(c,/curvePath\(/);assert.match(c,/drapedGarlandPoints/);
 assert.match(c,/makeCustomReferenceBoard/);
 assert.match(html,/forma-landscape-effects-v1\.css/);
 assert.match(html,/ivy-garland-pinch-v1/);
});
