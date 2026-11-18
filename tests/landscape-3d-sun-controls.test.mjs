import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {solarPreset,normalizeSolarSettings,solarVector} from '../forma-landscape-3d-sun.js';
const html=readFileSync(new URL('../forma-landscape-3d.html',import.meta.url),'utf8');
test('solar presets have physically plausible hemispherical vectors',()=>{
 for(const time of ['day','morning','evening','night']){
  const v=solarVector(solarPreset(time),85);
  assert.ok(v.y>0&&v.y<=85,time+' sun above horizon');
  assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-85)<1e-8,time+' same solar radius');
 }
 assert.ok(solarPreset('morning').elevation<solarPreset('day').elevation);
 assert.ok(solarPreset('evening').elevation<solarPreset('day').elevation);
});
test('azimuth and elevation determine real shadow directions rather than fake light strength',()=>{
 const east=solarVector({azimuth:90,elevation:45},100);
 assert.ok(east.x>70&&Math.abs(east.z)<1e-9);
 const north=solarVector({azimuth:0,elevation:45},100);
 assert.ok(north.z>70&&Math.abs(north.x)<1e-9);
 const low=solarVector({azimuth:0,elevation:10},100);
 assert.ok(low.y<north.y);
 const high=solarVector({azimuth:0,elevation:85},100);
 assert.ok(high.y>north.y);
});
test('sun sliders are safe, bounded and persist separately from measured site dimensions',()=>{
 assert.deepEqual(normalizeSolarSettings({azimuth:800,elevation:-10,strength:999,softness:0}),{azimuth:359,elevation:2,strength:1.7,softness:1});
 for(const name of ['sunAzimuth','sunElevation','sunStrength','sunSoftness','sunReset'])assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(html,/forma-landscape-3d-sun\.js/);
 assert.match(html,/forma-landscape-3d-sun-v1-/);
 assert.match(html,/sun\.position\.set\(solarPosition\.x,solarPosition\.y,solarPosition\.z\)/);
 assert.match(html,/uniforms\.sunPosition\.value\.copy\(sun\.position\)\.normalize\(\)/);
 assert.match(html,/sun\.shadow\.radius=solarSettings\.softness/);
 assert.match(html,/renderer\.shadowMap\.type=THREE\.PCFShadowMap/);
 assert.match(html,/localStorage\.setItem\(SOLAR/);
 assert.match(html,/sunPosition:sunlight\?/);
 assert.match(html,/solarAngles:\{azimuth:solarSettings\.azimuth,elevation:solarSettings\.elevation/);
});
