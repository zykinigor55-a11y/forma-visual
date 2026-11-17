import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPECIAL_LANDSCAPE_TOOLS,specialById,curvePath,drapedGarlandPoints,isCurveKind} from '../forma-landscape-special-tools.js';
import {catalogGroup,LANDSCAPE_GROUPS} from '../forma-landscape-catalog.js';
import {normalizeLandscape,landscapePrompt} from '../forma-art-direction-core.js';
import {specialCardArt,landscapeMethod} from '../forma-landscape-card-art.js';

test('landscape has five climbing plants and four editable garland types',()=>{
 const climbers=catalogGroup('climber'),lights=catalogGroup('light');
 assert.equal(climbers.length,5);
 assert.deepEqual(climbers.map(e=>e.id),['ivy','virginia-creeper','clematis','climbing-rose','hops']);
 assert.ok(lights.some(e=>e.id==='garland-fairy'));
 assert.equal(lights.filter(x=>x.kind==='garland').length,4);
 assert.ok(LANDSCAPE_GROUPS.find(g=>g.id==='climber'));
 assert.ok(LANDSCAPE_GROUPS.find(g=>g.id==='light'));
 assert.equal(isCurveKind('climber'),true);
 assert.equal(isCurveKind('garland'),true);
});

test('ivy follows actual wall and has correct climbing morphology in AI prompt',()=>{
 const item={id:'i1',kind:'climber',catalogId:'ivy',points:[{x:.2,y:.9},{x:.23,y:.5},{x:.4,y:.25}],tension:.7,density:65};
 const normalized=normalizeLandscape({items:[item]});
 assert.equal(normalized.items[0].kind,'climber');
 assert.equal(normalized.items[0].points.length,3);
 const prompt=landscapePrompt({items:[item]});
 assert.match(prompt,/Hedera helix/);
 assert.match(prompt,/wall|WALL/);
 assert.match(prompt,/editable gently curved physical centreline/);
 assert.match(prompt,/Preserve architecture/);
 assert.throws(()=>normalizeLandscape({items:[{...item,kind:'object'}]}),/Тип инструмента/);
 assert.throws(()=>normalizeLandscape({items:[{...item,points:[{x:.1,y:.3}]}]}),/двух|от 2/);
});

test('garlands have wire sag, bulbs and no daylight glow in AI specification',()=>{
 const item={id:'g1',kind:'garland',catalogId:'garland-fairy',points:[{x:.1,y:.3},{x:.38,y:.4},{x:.65,y:.36}],tension:.6,density:64,bulbSpacing:.025,sag:.3,brightness:75};
 const parsed=normalizeLandscape({items:[item]});
 assert.equal(parsed.items[0].bulbSpacing,.025);
 const prompt=landscapePrompt({items:[item]});
 assert.match(prompt,/2700K/);
 assert.match(prompt,/gravity sag|sag/);
 assert.match(prompt,/daytime decorative lights remain unlit or subtle/);
 assert.match(prompt,/natural cable sag/);
 const original=item.points;
 const draped=drapedGarlandPoints(original,.3);
 assert.equal(draped[0].x,original[0].x);
 assert.equal(draped[0].y,original[0].y);
 assert.equal(draped.at(-1).x,original.at(-1).x);
 assert.equal(draped.at(-1).y,original.at(-1).y);
 assert.ok(draped.length>original.length);
 assert.ok(draped.some((p,i)=>i>0&&i<8&&p.y>original[0].y+(original[1].y-original[0].y)*i/8),'cable has gravity sag');
 assert.match(curvePath(item.points,.6),/ C/);
});

test('premium special-tool miniatures are actual scalable SVG, not emoji placeholders',()=>{
 const ivy=specialCardArt(specialById('ivy'));
 const fairy=specialCardArt(specialById('garland-fairy'));
 assert.match(ivy,/fa-landscape-card-vector/);
 assert.match(ivy,/scene-ivy/);
 assert.match(fairy,/halo-garland-fairy/);
 assert.match(fairy,/ellipse/);
 assert.doesNotMatch(ivy,/🍃|🍂|✧··/);
 assert.equal(landscapeMethod('garland'),'КРИВАЯ · СВЕТ');
 assert.equal(landscapeMethod('climber'),'КРИВАЯ · РАСТЕНИЕ');
});

test('landscape UI enables brush-drawn curves, adjustable vertices, category cards and mobile touch',()=>{
 const view=readFileSync(new URL('../forma-landscape-atmosphere.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../forma-landscape-premium-cards.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
 assert.match(view,/curveDrawMode==='brush'/);
 assert.match(view,/type:'curve-brush'/);
 assert.match(view,/if\(dragging.type==='curve-brush'\)/);
 assert.match(view,/action==='add-vertex'\|\|action==='remove-vertex'/);
 assert.match(view,/data-art="curve-mode"/);
 assert.match(view,/data-art="finish-path"/);
 assert.match(view,/fa-art-preview-frame/);
 assert.match(view,/fa-art-card-method/);
 assert.match(css,/touch-action:none/);
 assert.match(css,/data-forma-theme="dark"/);
 assert.match(css,/fa-art-categories/);
 assert.match(html,/forma-landscape-premium-cards\.css\?v=photographic-cards-20261117/);
  assert.match(html,/forma-landscape-atmosphere\.js\?v=[^"']*premium-v1-20261117/);
});
