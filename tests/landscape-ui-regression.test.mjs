import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const editor=readFileSync(new URL('../forma-landscape-project.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('../forma-studio-shell.js',import.meta.url),'utf8');

test('category and tool buttons iterate a NodeList, never a single element',()=>{
 assert.ok(editor.includes("$$('[data-quick-category]',modal).forEach("));
 assert.ok(editor.includes("$$('.lp-tools button[data-tool]',modal).forEach("));
 assert.ok(!editor.includes("  $('[data-quick-category]',modal).forEach("));
 assert.ok(!editor.includes("  $('.lp-tools button[data-tool]',modal).forEach("));
});

test('pond materials cannot show lawn or gravel options in the area picker',()=>{
 assert.ok(editor.includes("const g=category;areaMaterials.innerHTML="));
 assert.ok(editor.includes("CATALOG.filter(x=>x.group===g)"));
 assert.ok(editor.includes("ponds:'ВОДОЁМЫ · ВЫБЕРИТЕ ТИП ВОДЫ'"));
});

test('pond uses freehand brush by default, trees stay in continuous placement mode',()=>{
 assert.ok(editor.includes("group==='ponds'||group==='lawns')?'brush':'polygon'"));
 assert.ok(editor.includes('placementCount++;save();draw()'));
 assert.ok(!editor.includes("selected=obj.id;mode='select';save()"));
});

test('clear preserves paved paths, dimensions and supports undo',()=>{
 assert.ok(editor.includes("checkpoint();doc.objects=doc.objects.filter(x=>x.type==='pavers')"));
 assert.ok(!editor.includes('doc.house=null'));
 assert.ok(editor.includes("data-clear-landscape"));
 assert.ok(editor.includes("if(!confirm('Очистить участок?"));
});

test('deep link opens exact top-down planner, never photo enhancement',()=>{
 assert.ok(shell.includes("get('tool')==='landscape-project'"));
 assert.ok(shell.includes("openWorkspace('landscape-project')"));
 assert.ok(shell.includes("window.FORMA_LANDSCAPE_PROJECT.open()"));
});
