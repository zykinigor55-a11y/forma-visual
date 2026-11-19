import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCodeTree} from '../forma-code-3d-trees.js';
const code=readFileSync(new URL('../forma-code-3d-trees.js',import.meta.url),'utf8');
const editor=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
const preview=readFileSync(new URL('../forma-tree-lineup.html',import.meta.url),'utf8');
test('code-built pine and silver birch are real editable Three.js geometry, never 2D images',()=>{
 assert.equal(typeof createCodeTree,'function');
 assert.match(code,/new T\.BufferGeometry\(\)/);
 assert.match(code,/new T\.InstancedMesh\(leafGeo/);
 assert.match(code,/setMatrixAt\(index,object\.matrix\)/);
 assert.match(code,/setColorAt\(index,leafColor\)/);
 assert.match(code,/new T\.Mesh\(batchTubeGeometry\(T,mainwood\)/);
 assert.match(code,/new T\.Mesh\(batchTubeGeometry\(T,woody\)/);
 assert.match(code,/root\.userData=\{textures:\[bark\]/);
 assert.doesNotMatch(code,/(?:Sprite|Billboard|PlaneGeometry|TextureLoader|GLTFLoader)\s*\(/i);
});
test('Code3D geometry respects measured tree metres and seeded morphology',()=>{
 assert.match(code,/const rootSeed=hash\(/);
 assert.match(code,/H=clamp\(Number\(tree\.height\)\|\|14,2,40\)/);
 assert.match(code,/D=clamp\(Number\(tree\.diameter\)\|\|6\.5,\.5,30\)/);
 assert.match(code,/branchCount:outerBranches\+tips\.length/);
});
test('the live 3D editor loads code geometry by default but preserves imported user GLB',()=>{
 assert.match(editor,/import \{createCodeTree\} from '\.\/forma-code-3d-trees\.js'/);
 assert.match(editor,/const codeRebuilt=!imported&&treeSourceChoice\(\)==='code'/);
 assert.match(editor,/g=codeRebuilt\?createCodeTree\(THREE,o/);
 assert.match(editor,/const source=imported\|\|bundledPine\|\|bundledAdult\|\|null/);
 assert.match(editor,/id="treeSource3d"/);
 assert.match(editor,/localStorage\.setItem\(CODE_TREE_KEY,choice\)/);
 assert.match(preview,/CODE 3D \+ 8 GLB/);
 assert.match(preview,/source=glb/);
});
