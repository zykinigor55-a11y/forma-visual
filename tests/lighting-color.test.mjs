import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getDemoPlan} from '../lib/demo.ts';

test('evening and night use photographed illumination instead of darkening the day image',()=>{
 for(const time of ['evening','night']){
  const p=getDemoPlan({material:'plaster',season:'winter',environment:'lake',time});
  assert.match(p.baseUrl,new RegExp(`plaster-winter-${time}\\.webp$`));
  assert.match(p.backgroundUrl,new RegExp(`lake-winter-${time}\\.webp$`));
  assert.equal(p.filter,'none');
 }
});
test('live instructions request luminous rooms and physically illuminated surroundings',async()=>{
 const {buildPrompt}=await import('../lib/prompts.ts');
 for(const time of ['evening','night']){
  const prompt=buildPrompt({time});assert.match(prompt,/bright warm.white interiors/i);assert.match(prompt,/light spill/i);assert.match(prompt,/foreground.*readable/i);
 }
});
