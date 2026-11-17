import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('FORMA emblem is a visible light SVG on dark graphite',()=>{
 const mark=read('assets/brand/forma-fa-mark.svg');
 assert.match(mark,/fill="#F8F8F6"/i,'main monogram must be bright ivory');
 assert.doesNotMatch(mark,/fill="#(?:1a2627|1a2527|293b30|2b4535)"/i,'no green logo fill');
 assert.match(mark,/viewBox="0 0 270 265"/,'geometry must remain unchanged');
 const css=read('forma-brand-identity.css');
 assert.match(css,/\.forma-brand-symbol\{[^}]*background:#222326!important/);
 assert.match(css,/\.studio-wordmark \.studio-wordmark-icon\{[^}]*background:#222326!important/);
 assert.match(css,/\.mobile-header \.forma-brand-mobile-logo\{[^}]*background:#222326/);
 assert.doesNotMatch(css,/background:#1a2627/i,'no green-tinted logo badge');
 const favicon=read('assets/brand/forma-preview-favicon.svg');
 assert.match(favicon,/fill="#222326"/);
 assert.match(favicon,/fill="#F8F8F6"/);
});
test('all desktop, mobile, sidebar and progress emblems use the refreshed logo',()=>{
 const page=read('forma-preview.html');
 assert.match(page,/forma-brand-identity\.css\?v=ivory-logo-20261117/);
 assert.match(page,/forma-preview-favicon\.svg\?v=ivory-logo-20261117/);
 for(const [label,token] of [['mobile','forma-brand-mobile-logo'],['desktop','forma-ui-mark'],['side','rail-monogram'],['progress','render-progress-brand']]){
  assert.ok(page.includes(token),'missing '+label+' brand');
 }
 assert.ok(page.includes('assets/brand/forma-fa-mark.svg?v=ivory-logo-20261117'));
 const shell=read('forma-archviz-studio.js');
 assert.ok(shell.includes('assets/brand/forma-fa-mark.svg?v=ivory-logo-20261117'));
});
