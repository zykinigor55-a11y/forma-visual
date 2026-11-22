import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshProject,byId} from '../forma-landscape-project-core.js';
import {landscapePaperSize,buildLandscapeAlbum} from '../forma-landscape-pdf.js';

test('A4/A3 album uses standard portrait PDF page sizes',()=>{
 assert.deepEqual(landscapePaperSize('A4'),{width:595,height:842});
 assert.deepEqual(landscapePaperSize('A3'),{width:842,height:1191});
 assert.deepEqual(landscapePaperSize('unexpected'),{width:595,height:842});
});

test('album remains geometry-only and omits empty specification sections',()=>{
 const pdf=readFileSync(new URL('../forma-landscape-pdf.js',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../forma-landscape-project.js',import.meta.url),'utf8');
 assert.match(pdf,/chunks=\(arr,n=19\)=>arr\.length\?/);
 assert.match(pdf,/\):\[\];/);
 assert.match(pdf,/if\(!items\.length\)continue/);
 assert.match(pdf,/Ботаническое название/);
 assert.match(pdf,/Предварительные размеры · масштаб не подтверждён/);
 assert.match(pdf,/assemble\(images,format\)/);
 assert.match(editor,/id="lpPdfFormat"/);
 assert.match(editor,/buildLandscapeAlbum\(albumProject,plan,validPhoto,\{format,nightImage:/);
});

test('album counts shrubs by exact catalog name and continues instance rows onto later pages',async()=>{
 const previous=globalThis.document,lines=[];
 globalThis.document={createElement:()=>({
  toDataURL:()=> 'data:image/jpeg;base64,AAAA',
  getContext:()=>({scale(){},fillRect(){},fillText(value){lines.push(value)},measureText:value=>({width:value.length*4})})
 })};
 try{
  const project=freshProject();
  project.objects=Array.from({length:22},(_,i)=>({id:'shrub'+i,catalogId:'barberry',x:i+1,y:4,diameter:1.4,height:.9}));
  project.objects.push({id:'other',catalogId:'juniper',x:10,y:8,diameter:1.8,height:.9});
  const pdf=await buildLandscapeAlbum(project,null,null,{format:'A3'});
  assert.ok(lines.includes(byId('barberry').name));
  assert.ok(lines.includes(byId('juniper').name));
  assert.ok(lines.includes('Всего 23 шт. · позиций 2'));
  assert.ok(lines.includes('22'));
  assert.ok(lines.includes('Кустарники · размещение · 2'));
  assert.ok(!lines.includes('Ведомость · Деревья'));
  assert.match(await pdf.text(),/\/MediaBox \[0 0 842 1191\]/);
 }finally{globalThis.document=previous}
});
