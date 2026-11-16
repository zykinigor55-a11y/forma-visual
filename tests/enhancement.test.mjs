import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnhancementPrompt} from '../forma-enhancement-prompt.js';

test('enhancement is a generative reconstruction, not a sharpening filter or simple upscale',()=>{
 const p=createEnhancementPrompt({brief:{sceneType:'exterior'}});
 assert.match(p,/NOT AN UPSCALE/);
 assert.match(p,/Do NOT merely sharpen/);
 assert.match(p,/REGENERATE/);
 assert.match(p,/bark cracks/);
 assert.match(p,/Grass has coherent/);
 assert.match(p,/Shrubs have non-repetitive/);
});

test('enhancement locks architecture and the approved camera',()=>{
 const p=createEnhancementPrompt({brief:{sceneType:'exterior'}});
 for(const phrase of ['same camera position','exact building silhouette','same daypart','Do NOT add plants','never crop','same species']){
  assert.ok(p.includes(phrase),phrase);
 }
});

test('enhancement adapts to interiors and preserves technical plans',()=>{
 assert.match(createEnhancementPrompt({brief:{sceneType:'interior'}}),/Scene type guidance: INTERIOR/);
 assert.match(createEnhancementPrompt({brief:{sceneType:'auto'}}),/FOR 2D FLOOR PLANS/);
 assert.match(createEnhancementPrompt({brief:{sceneType:'exterior'}}),/Scene type guidance: EXTERIOR/);
});
