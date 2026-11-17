import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {landscapePaperSize} from '../forma-landscape-pdf.js';

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
 assert.match(pdf,/if\(trees\.length\)/);
 assert.match(pdf,/Латинское наименование/);
 assert.match(pdf,/Предварительные размеры · масштаб не подтверждён/);
 assert.match(pdf,/assemble\(canvases,format\)/);
 assert.match(editor,/id="lpPdfFormat"/);
 assert.match(editor,/buildLandscapeAlbum\(doc,plan,validPhoto,\{format\}\)/);
});
