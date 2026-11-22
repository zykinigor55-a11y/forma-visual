/* True directional-sun controls in world-space metres.
 * Azimuth: 0° = north (+Z), 90° = east (+X).
 * Elevation: degrees above horizon. A light placed on this vector casts
 * shadows opposite to the solar azimuth. No false percentage or time-of-day
 * claims: this is a user-controlled design sun, not an ephemeris.
 */
const PRESETS=Object.freeze({
 day:{azimuth:311,elevation:67,strength:1,softness:2.6},
 morning:{azimuth:282,elevation:20,strength:1,softness:3},
 evening:{azimuth:73,elevation:6,strength:1,softness:3.5},
 'blue-hour':{azimuth:73,elevation:0,strength:1,softness:3.5},
 night:{azimuth:296,elevation:5,strength:1,softness:3.5}
});
export const solarPreset=time=>({...PRESETS[time]||PRESETS.day});
export function normalizeSolarSettings(settings={},time='day'){
 const preset=solarPreset(time);
 const bounded=(v,min,max,fallback)=>v!==null&&v!==undefined&&Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 return {
  azimuth:bounded(settings.azimuth,0,359,preset.azimuth),
  elevation:bounded(settings.elevation,2,85,preset.elevation),
  strength:bounded(settings.strength,.3,1.7,preset.strength),
  softness:bounded(settings.softness,1,5,preset.softness)
 };
}
export function solarVector(settings,radius=85){
 const p=normalizeSolarSettings(settings);
 const a=p.azimuth*Math.PI/180,e=p.elevation*Math.PI/180;
 return {
  x:radius*Math.cos(e)*Math.sin(a),
  y:radius*Math.sin(e),
  z:radius*Math.cos(e)*Math.cos(a)
 };
}
