import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {freshProject,normalizeProject} from '../forma-landscape-project-core.js';
import {WEATHER_EFFECT_DEFAULTS,WEATHER_EFFECT_GROUPS,normalizeWeatherEffects,weatherEffectsVisible,weatherPhotoContract} from '../forma-landscape-weather-effects.js';

test('eight independent snow/rain controls survive old project migration',()=>{
 assert.deepEqual(freshProject().atmosphere.effects,WEATHER_EFFECT_DEFAULTS);
 assert.deepEqual(normalizeProject({}).atmosphere.effects,WEATHER_EFFECT_DEFAULTS);
 assert.equal(WEATHER_EFFECT_GROUPS.snow.length,4);
 assert.equal(WEATHER_EFFECT_GROUPS.rain.length,4);
});
test('weather settings persist with unmodified tree positions',()=>{
 const project=freshProject();
 project.atmosphere={time:'morning',season:'winter',weather:'snow',
  effects:{snowTrees:10,snowGround:70,snowfall:0,winterHaze:20,rainIntensity:60,surfaceWetness:80,puddles:10,rainMist:35}};
 project.objects=[{id:'pine01',catalogId:'pine',x:9,y:13,height:12,diameter:4}];
 const saved=normalizeProject(project);
 const loaded=normalizeProject(JSON.parse(JSON.stringify(saved)));
 assert.deepEqual(loaded.atmosphere.effects,project.atmosphere.effects);
 assert.equal(loaded.objects[0].x,9);
 assert.equal(loaded.objects[0].y,13);
});
test('invalid intensities clamp to 0–100 and unknown keys are rejected',()=>{
 const a=normalizeWeatherEffects({snowTrees:-10,snowGround:130,snowfall:34.7,rainMist:'bad',evilKey:100});
 assert.equal(a.snowTrees,0);assert.equal(a.snowGround,100);assert.equal(a.snowfall,35);
 assert.equal(a.rainMist,WEATHER_EFFECT_DEFAULTS.rainMist);
 assert.equal(Object.hasOwn(a,'evilKey'),false);
});
test('photo contract specifies pine/spruce coverage even for remote trees',()=>{
 const prompt=weatherPhotoContract({atmosphere:{season:'winter',weather:'snow',
  effects:{snowTrees:10,snowGround:70,snowfall:0,winterHaze:20}}});
 for(const value of ['SNOW ON ALL EXISTING TREES 10%','BACKGROUND / DISTANT pine and spruce',
  'GROUND SNOW 70%','FALLING SNOW 0%','WINTER HAZE 20%'])
  assert.ok(prompt.includes(value),'Missing '+value);
 assert.match(prompt,/At 0%, NO falling flakes/);
});
test('rain and after-rain keep wetness but after-rain has no precipitation',()=>{
 const effects={rainIntensity:80,surfaceWetness:90,puddles:30,rainMist:45};
 const rain=weatherPhotoContract({atmosphere:{season:'summer',weather:'rain',effects}});
 const after=weatherPhotoContract({atmosphere:{season:'summer',weather:'after-rain',effects}});
 assert.match(rain,/VISIBLE FALLING RAIN 80%/);assert.match(rain,/WET MATERIALS 90%/);
 assert.match(rain,/PUDDLES AND REFLECTIONS 30%/);assert.match(rain,/HUMID MIST 45%/);
 assert.match(after,/VISIBLE FALLING RAIN 0%/);assert.match(after,/AFTER RAIN selected/);
});
test('winter and rain modes show their independent UI groups',()=>{
 assert.deepEqual(weatherEffectsVisible({season:'winter',weather:'sunny'}),{snow:true,rain:false});
 assert.deepEqual(weatherEffectsVisible({season:'winter',weather:'rain'}),{snow:true,rain:true});
 assert.deepEqual(weatherEffectsVisible({season:'summer',weather:'after-rain'}),{snow:false,rain:true});
 assert.deepEqual(weatherEffectsVisible({season:'summer',weather:'sunny'}),{snow:false,rain:false});
});
test('mobile and desktop have 8 wired weather slider IDs each',()=>{
 const html=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),'../forma-landscape-3d.html'),'utf8');
 for(const key of Object.keys(WEATHER_EFFECT_DEFAULTS)){
  const name=key[0].toUpperCase()+key.slice(1);
  for(const prefix of ['weather','quickWeather']){
   const id=prefix+name;
   assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique '+id);
  }
 }
 assert.match(html,/function setupWeatherIntensityControls\(\)/);
 assert.match(html,/function syncWeatherIntensityControls\(\)/);
 assert.match(html,/addWeatherSceneVisuals\(THREE,root,terrainMesh,doc,terrainAt\)/);
 assert.match(html,/addSnowToPlant\(THREE,g,o,doc.atmosphere\)/);
});
