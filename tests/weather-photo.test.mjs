import {test} from 'node:test';import assert from 'node:assert/strict';
import {getDemoPlan} from '../lib/demo.ts';
test('clouds rain and fog select seasonal weather photographs for house and landscape',()=>{
 for(const weather of ['cloudy','rain','fog']){
 const p=getDemoPlan({material:'brick',season:'autumn',environment:'lake',time:'day',weather});
 assert.equal(p.weatherBaseUrl,`/images/weather/house-autumn-${weather}.webp`);
 assert.equal(p.weatherBackgroundUrl,`/images/weather/lake-autumn-${weather}.webp`);
 assert.equal(p.filter,'none');
 }
});
test('weather photos combine with every material, season and lighting selection',()=>{
 for(const material of ['plaster','brick','wood','stone'])for(const season of ['spring','summer','autumn','winter'])for(const time of ['morning','day','evening','night']){
 const p=getDemoPlan({material,season,time,weather:'rain',environment:'garden'});
 assert.equal(p.dayBaseUrl,`/images/demo/${material}-${season}.webp`);
 assert.equal(p.referenceBaseUrl,`/images/demo/plaster-${season}.webp`);
 assert.equal(p.weatherBaseUrl,`/images/weather/house-${season}-rain.webp`);
 assert.equal(p.settings.time,time);
 }
});
import * as shader from '../lib/demo-weather.ts';
test('weather transfer changes illumination while retaining material texture',()=>{
 assert.equal(typeof shader.materialUnderWeather,'function');
 const a=shader.materialUnderWeather([160,165,170],[220,215,200],[100,65,40]);
 const b=shader.materialUnderWeather([160,165,170],[220,215,200],[140,95,60]);
 assert.ok(b.every((v,i)=>v>a[i]));assert.ok(a[0]>a[2]);
});
test('fog attenuates distant lamps without adding a white veil to the foreground',()=>{
 assert.equal(typeof shader.weatherLightingPixel,'function');
 const near=shader.weatherLightingPixel([150,155,160],[100,100,100],[250,170,70],'night','fog',.5,.6);
 const far=shader.weatherLightingPixel([150,155,160],[100,100,100],[250,170,70],'night','fog',.06,.3);
 assert.ok(near[0]>far[0]);assert.ok(near[0]>near[2]);
 const sky=shader.weatherLightingPixel([160,165,170],[120,170,220],[255,255,255],'night','cloudy',.5,.1);
 assert.ok(Math.max(...sky)<90,'clouds must not inherit the clear-night moon');
});
test('evening weather has no horizontal atmosphere seam at the tree line',()=>{
 const a=shader.weatherLightingPixel([180,180,180],[100,100,100],[220,160,80],'evening','rain',.06,.279);
 const b=shader.weatherLightingPixel([180,180,180],[100,100,100],[220,160,80],'evening','rain',.06,.281);
 assert.ok(a.every((v,i)=>Math.abs(v-b[i])<3),`${a}/${b}`);
});
test('cool clear-night ambient detail cannot erase the distant fog',()=>{
 const out=shader.weatherLightingPixel([180,180,180],[100,100,100],[90,100,120],'night','fog',.06,.3);
 assert.deepEqual(out,[40,49,68]);
});
test('neutral-white facade downlights remain luminous without dark holes',()=>{
 const out=shader.weatherLightingPixel([180,185,190],[200,200,200],[240,235,225],'night','cloudy',.6,.6);
 assert.ok(out.every(v=>v>210),String(out));
});
test('every weather master and seasonal landscape is packaged',async()=>{
 const {existsSync}=await import('node:fs');
 for(const material of ['plaster','brick','wood','stone'])for(const season of ['spring','summer','autumn','winter'])for(const environment of ['forest','original','lake','village','garden'])for(const time of ['day','evening','night'])for(const weather of ['cloudy','fog','rain']){
  const p=getDemoPlan({material,season,environment,time,weather});
  for(const path of [p.weatherBaseUrl,p.weatherBackgroundUrl,p.dayBaseUrl,p.referenceBaseUrl,p.dayBackgroundUrl].filter(Boolean))assert.ok(existsSync(new URL('../public'+path,import.meta.url)),path);
 }
});
test('photographic weather still has a distinct morning rendering',()=>{
 const day=new Uint8ClampedArray([160,165,170,255]),morning=new Uint8ClampedArray(day);
 shader.applyWeatherLighting(morning,day,day,1,1,'morning','cloudy');
 assert.notDeepEqual(morning,day);assert.equal(morning[3],255);
});
test('a bright wall behind the fire does not become a white rectangular patch',()=>{
 const w=360,h=270,weather=new Uint8ClampedArray(w*h*4).fill(240),ref=new Uint8ClampedArray(w*h*4).fill(220),material=new Uint8ClampedArray(w*h*4);
 for(let i=0;i<material.length;i+=4)material.set([130,80,60,255],i);
 shader.applyWeatherMaterial(weather,ref,material,w,h);
 const i=(Math.floor(740/1086*h)*w+Math.floor(860/1448*w))*4;
 assert.ok(weather[i]<170&&weather[i+1]<110&&weather[i+2]<90,String(weather.slice(i,i+3)));
});
test('fog light transmission changes smoothly through the foreground',()=>{
 const a=shader.weatherLightingPixel([180,180,180],[100,100,100],[220,160,80],'evening','fog',.04,.649);
 const b=shader.weatherLightingPixel([180,180,180],[100,100,100],[220,160,80],'evening','fog',.04,.651);
 assert.ok(a.every((v,i)=>Math.abs(v-b[i])<3),`${a}/${b}`);
});
