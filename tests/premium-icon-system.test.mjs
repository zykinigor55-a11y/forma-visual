import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {premiumIcon} from '../forma-premium-icons.js';

const read=filename=>readFileSync(new URL('../'+filename,import.meta.url),'utf8');
test('3D, 2D and studio all share exactly the same bronze dimensional SVG system',()=>{
 const two=read('forma-landscape-project.js');
 const three=read('forma-landscape-3d.html');
 const shell=read('forma-studio-shell.js');
 assert.match(two,/premiumIcon as categoryIcon/);
 assert.match(three,/import \{premiumIcon\} from '\.\/forma-premium-icons\.js'/);
 assert.match(three,/premiumIcon\(a\[0\]\)/);
 assert.match(three,/premiumIcon\(button\.dataset\.quickTool\)/);
 assert.match(shell,/export const studioIcon=id=>premiumIcon\(id\)/);
});

test('all 13 native 3D tools get the exact glossy-graphite tile silhouette',()=>{
 const ids=['select','site','surface','terrain','build','fence','plant','water','landscape','small','furniture','transport','light'];
 for(const id of ids){
  const svg=premiumIcon(id);
  assert.match(svg,/<svg class="lp-3d-icon forma-premium-icon"/);
  assert.match(svg,/viewBox="0 0 48 48"/);
  assert.match(svg,/linearGradient id="lpiFill"/);
  assert.match(svg,/<rect x="2.5" y="2.5" width="43" height="43"/);
  assert.match(svg,/<path|<ellipse|<circle/);
  assert.ok(svg.length>620,id+' must have real dimensional geometry rather than an emoji');
 }
 const unique=new Set(ids.map(id=>premiumIcon(id).split('</defs>')[1]?.split('</svg>')[0]));
 assert.equal(unique.size,ids.length,'Distinct tool pictograms—not one recycled icon');
});

test('original 8 landscape category illustrations are retained in all workspaces',()=>{
 for(const id of ['trees','shrubs','pavers','fills','lights','lawns','ponds','boulders'])
  assert.match(premiumIcon(id),/url\(#lpiFill\)|stroke="#/);
 assert.equal(premiumIcon('plant'),premiumIcon('trees'));
 assert.equal(premiumIcon('surface'),premiumIcon('pavers'));
 assert.equal(premiumIcon('water'),premiumIcon('ponds'));
});

test('main website 17 cards, rail, mobile navigation and studio tool headers use dimensional icons',()=>{
 const main=read('forma-preview.html'),home=read('forma-home-tools.js'),site=read('forma-site-premium-icons.js'),css=read('forma-premium-icons.css');
 assert.match(main,/forma-premium-icons\.css/);
 assert.match(main,/forma-site-premium-icons\.js/);
 assert.match(home,/forma:home-tools-ready/);
 assert.match(site,/\.rail-nav \[data-nav\]/);
 assert.match(site,/\.mobile-nav \[data-mobile\]/);
 assert.match(site,/\.fa-home-tool\[data-tool-id\]/);
 for(const id of ['upscale','render','interior','materials','animation','nodes','camera','preview','geometry','cad','image3d','world','presentation','gallery','models','account','release']){
  const svg=premiumIcon(id);
  assert.match(svg,/forma-premium-icon/);
  assert.ok(svg.length>620);
 }
 assert.match(css,/\.fa-home-panel \.fa-home-tool-icon/);
 assert.match(css,/\.rail-nav \.rail-btn svg\.forma-premium-icon/);
});
