import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shrubEditorMarkup,shrubSizePreset,SHRUB_PRESETS} from '../forma-landscape-shrub-editor.js';
import {CATALOG,normalizeProject,freshProject} from '../forma-landscape-project-core.js';
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('all shrubs open the right-side editor, including four separate real fern variants',()=>{
 assert.equal(CATALOG.filter(c=>c.group==='shrubs').length,17);
 const src=shrubEditorMarkup({id:'Спирея японская',variant:2,real:true});
 assert.match(src,/РЕДАКТОР КУСТАРНИКА/);
 assert.match(src,/data-shrub-size="young"/);
 assert.match(src,/data-shrub-variant="2" aria-pressed="true"/);
 assert.match(src,/id="shrubFocus"/);
 assert.match(html,/isShrub=ref\.type==='object'/);
 assert.match(html,/el\.classList\.toggle\('forma-shrub-open',isShrub\)/);
 assert.match(html,/if\(found&&catalog\(found\.catalogId\)\?\.group==='shrubs'\)/);
 assert.match(html,/shrubSizePreset\(/);
 assert.equal(SHRUB_PRESETS.adult,1.3);
 assert.deepEqual(shrubSizePreset(.85,1.2,'young'),{height:.60,diameter:.84});
});
test('project save normalizes edited shrub variants, diameter, height',()=>{
 let d=freshProject();
 d.objects=[{id:'spirea-1',catalogId:'spirea',type:'shrubs',x:15,y:9,height:1.15,diameter:1.45,variant:3,rotation:25}];
 let m=normalizeProject(d);
 assert.equal(m.objects[0].variant,3);
 assert.equal(m.objects[0].diameter,1.45);
 assert.equal(m.objects[0].height,1.15);
});
