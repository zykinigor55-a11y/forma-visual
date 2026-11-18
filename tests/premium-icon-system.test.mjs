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
  assert.match(svg,/linearGradient id="forma-icon-gradient-\d+"/);
  assert.match(svg,/<rect x="2.5" y="2.5" width="43" height="43"/);
  assert.match(svg,/<path|<ellipse|<circle/);
  assert.match(svg,/<path d=|<ellipse|<circle/,'SVG must contain an actual vector silhouette: '+id);
 }
 const unique=new Set(ids.map(id=>premiumIcon(id).split('</defs>')[1]?.split('</svg>')[0]));
 assert.equal(unique.size,ids.length,'Distinct tool pictograms—not one recycled icon');
});

test('original 8 landscape category illustrations are retained in all workspaces',()=>{
 for(const id of ['trees','shrubs','pavers','fills','lights','lawns','ponds','boulders'])
  assert.match(premiumIcon(id),/url\(#forma-icon-gradient-\d+\)|stroke="#/);
 const normalize=svg=>svg.replace(/forma-icon-gradient-\d+/g,'GRADIENT');
 assert.equal(normalize(premiumIcon('plant')),normalize(premiumIcon('trees')));
 assert.equal(normalize(premiumIcon('surface')),normalize(premiumIcon('pavers')));
 assert.equal(normalize(premiumIcon('water')),normalize(premiumIcon('ponds')));
});

test('main website 17 cards, rail, mobile navigation and studio tool headers use dimensional icons',()=>{
 const main=read('forma-preview.html'),home=read('forma-home-tools.js'),site=read('forma-site-premium-icons.js'),css=read('forma-premium-icons.css');
 assert.match(main,/forma-premium-icons\.css/);
 assert.match(main,/forma-site-premium-icons\.js/);
 assert.match(home,/forma:home-tools-ready/);
 assert.match(site,/\.rail-nav \[data-nav\]/);
 assert.match(site,/\.mobile-nav \[data-mobile\]/);
 assert.match(site,/\.fa-home-tool\[data-tool-id\]/);
 assert.match(site,/\.tool-btn\[data-tool\]/);
 for(const id of ['upscale','render','interior','materials','animation','nodes','camera','preview','geometry','cad','image3d','world','presentation','gallery','models','account','release']){
  const svg=premiumIcon(id);
  assert.match(svg,/forma-premium-icon/);
  assert.match(svg,/<path d=|<ellipse|<circle/,'Tool icon must have real vector geometry: '+id);
 }
 assert.match(css,/\.fa-home-panel \.fa-home-tool-icon/);
 assert.match(css,/\.rail-nav \.rail-btn svg\.forma-premium-icon/);
});

test('premium icon gradients are individually namespaced even when repeated in one toolbar',()=>{
 const icons=['trees','trees','surface','plant','brush','eraser','polygon','wand'].map(premiumIcon);
 const ids=icons.map(svg=>svg.match(/linearGradient id="([^"]+)"/)?.[1]);
 assert.equal(new Set(ids).size,icons.length,'No duplicate gradients in multi-icon UI');
 icons.forEach((svg,i)=>{
  assert.ok(ids[i], 'Icon '+i+' needs a visible material gradient');
  assert.ok(svg.includes('url(#'+ids[i]+')'),'Icon '+i+' must reference only its local material gradient');
  assert.ok(!svg.includes('url(#lpiFill)'),'No shared mutable SVG IDs may leak');
 });
});
test('3D action bar has no legacy emoji and the material editor uses the same bronze pictograms',()=>{
 const html=read('forma-landscape-3d.html');
 assert.match(html,/data-quick-tool="plant" type="button" aria-pressed="false">Озеленение/);
 assert.match(html,/data-quick-tool="terrain" type="button" aria-pressed="false">Рельеф/);
 assert.match(html,/\['focusHouse','build'\]/);
 for(const id of ['brush','eraser','polygon','wand']){
  const svg=premiumIcon(id);
  assert.match(svg,/forma-premium-icon/);
 }
 const css=read('forma-premium-icons.css');
 assert.match(css,/\.tool-btn svg\.forma-premium-icon/);
});

test('professional-tool palette and launchers use the common icons, not legacy monochrome glyphs',()=>{
 const pro=read('forma-pro-tools.js');
 const css=read('forma-premium-icons.css');
 assert.match(pro,/import\('\.\/forma-premium-icons\.js'\)/);
 assert.match(pro,/class="fa-pro-icon"/);
 assert.match(pro,/proIcon\(id,icon\)/);
 assert.match(pro,/proIcon\('settings'/);
 assert.match(css,/\.fa-pro-nav i\.fa-pro-icon/);
 const ids=['project','camera','preview','geometry','cad','models','upscale','image3d','presentation','account','release'];
 for(const id of ids){
  const svg=premiumIcon(id);
  assert.match(svg,/forma-premium-icon/,id);
  assert.match(svg,/<path|<ellipse|<circle/,id);
 }
});
