import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../forma-preview.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../forma-main-atelier-icons.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../forma-site-premium-icons.js',import.meta.url),'utf8');
test('only true main FORMA studio loads new luxury icons after all existing CSS',()=>{
 const after=html.indexOf('forma-main-atelier-icons.css?v=main-atelier-bronze-20261119-v2');
 assert.ok(after>html.indexOf('forma-studio-shell.css'));
 assert.ok(after>html.indexOf('forma-premium-icons.css'));
 assert.match(html,/forma-site-premium-icons\.js\?v=main-atelier-bronze-20261119-v2/);
 assert.match(css,/#formaStudioHome \.fa-studio-task>svg\.forma-premium-icon/);
 assert.match(css,/\.rail-nav>\.rail-btn svg\.forma-premium-icon/);
 assert.match(js,/MutationObserver/);
 assert.match(js,/#formaStudioHome \.fa-studio-task\[data-studio-tool\]/);
 assert.match(js,/data-forma-rev="main-atelier-v2"/);
 assert.match(js,/legacy\.outerHTML=markup/);
});
