/* FORMA Landscape · authored weather intensity state shared by 2D, 3D and AI.
 * All intensities are user-defined percentages, never interpreted as rainfall mm/h
 * or depth in centimetres. Geometry and planted positions are invariant.
 */
export const WEATHER_EFFECT_DEFAULTS=Object.freeze({
 snowTrees:22,snowGround:52,snowDepth:18,snowRelief:65,snowDrifts:45,snowfall:0,winterHaze:18,
 rainIntensity:42,surfaceWetness:65,puddles:20,rainMist:25
});
export const WEATHER_EFFECT_GROUPS=Object.freeze({
 snow:['snowTrees','snowGround','snowDepth','snowRelief','snowDrifts','snowfall','winterHaze'],
 rain:['rainIntensity','surfaceWetness','puddles','rainMist']
});
const integer=(v,def)=>v==null||v===''||!Number.isFinite(Number(v))
 ?def:Math.max(0,Math.min(100,Math.round(Number(v))));
export function normalizeWeatherEffects(raw){
 const s=raw&&typeof raw==='object'?raw:{};
 return Object.fromEntries(Object.keys(WEATHER_EFFECT_DEFAULTS)
  .map(k=>[k,k==='snowDepth'?Math.min(60,integer(s[k],WEATHER_EFFECT_DEFAULTS[k])):integer(s[k],WEATHER_EFFECT_DEFAULTS[k])]));
}
export function weatherEffectsVisible({season,weather}={}){
 return {snow:season==='winter'||weather==='snow',
  rain:weather==='rain'||weather==='after-rain'};
}
export function weatherEffectState(atmosphere={}){
 const visibility=weatherEffectsVisible(atmosphere);
 const controls=normalizeWeatherEffects(atmosphere.effects||atmosphere.weatherEffects);
 return {visibility,controls,
  snow:visibility.snow?controls:null,
  rain:visibility.rain?controls:null
 };
}
const level=v=>v<=10?'trace / virtually none':v<=30?'light / sparse':
 v<=60?'moderate':v<=85?'strong':'very heavy';
export function weatherPhotoContract(input){
 const a=input?.atmosphere||{},
  {visibility,controls}=weatherEffectState(a);
 if(!visibility.snow&&!visibility.rain)
  return 'AUTHOR WEATHER INTENSITY: neither snow nor rain effects selected. Never add snowfall, snowdrifts, precipitation or wet reflective surfaces except explicitly present in reference.';
 const lines=['AUTHOR WEATHER INTENSITY — HARD NUMERIC CONTRACT (0–100% user interface strength, NOT weather measurements). Source 3D geometry/plant identity and positions remain fixed; only weather materials and atmospheric appearance may change.'];
 if(visibility.snow){
  const {snowTrees,snowGround,snowDepth,snowRelief,snowDrifts,snowfall,winterHaze}=controls;
  lines.push('SNOW ON ALL EXISTING TREES '+snowTrees+'% ('+level(snowTrees)+'). This EXACT same coverage target applies to foreground AND BACKGROUND / DISTANT pine and spruce. Snow sits on upper-facing living conifer boughs, not uniform white painted crowns. Scots pine remains airy with visible reddish trunks; Norway spruce has realistic irregular drooping layered needle boughs. At 0%, zero adherent snow anywhere; at 20%, only small intermittent natural white dusting. NEVER silently increase remote pines or foreground spruce; respect each species, canopy silhouette, trunk position, count and height.');
  lines.push('GROUND SNOW '+snowGround+'% ('+level(snowGround)+'). Cover only existing ground/grass/soil and appropriately existing non-vertical roof/terrace/path surfaces. At 0%, no newly created snow; at low intensity preserve underlying ground and paths, expose footprints/soil and uneven snow patches. At 100%, widespread settled ground snow but still preserve EXACT path alignments, roof edges, terrain and all objects; do not invent snowbanks or move contours.');
  lines.push('SNOW DEPTH '+snowDepth+' cm (design preview setting), SURFACE RELIEF '+snowRelief+'%, SOFT DRIFTS '+snowDrifts+'%. At 100% ground coverage do not expose green grass. Matte powder snow, no glitter, no artificial crystal sparkle. Only snow layer thickness changes, never the surveyed ground.');
  lines.push('FALLING SNOW '+snowfall+'% ('+level(snowfall)+'). Distinguish actual flakes IN THE AIR from settled snow on branches and ground. At 0%, NO falling flakes even if ground is snowy. Higher intensities increase fine particles with correct camera depth; never replace trees with snow sculptures.');
  lines.push('WINTER HAZE '+winterHaze+'% ('+level(winterHaze)+'). Fine cold atmospheric perspective only. Distant trees remain recognisable individually, not erased into a white rectangle; preserve weather-selected physical sky, solar settings and composition.');
 }
 if(visibility.rain){
  const {rainIntensity,surfaceWetness,puddles,rainMist}=controls;
  const falling=a.weather==='after-rain'?0:rainIntensity;
  lines.push('VISIBLE FALLING RAIN '+falling+'% ('+level(falling)+'). '+(a.weather==='after-rain'?'AFTER RAIN selected: falling rain stays at ZERO, irrespective of the stored rain slider; use it only if rain mode becomes active.':'At 0%, no visible falling streaks. Higher levels add appropriately scaled real fine droplets and streaks, not artificial lines across the whole image.')+' Existing paths, tree crowns, building and sun positions unchanged.');
  lines.push('WET MATERIALS '+surfaceWetness+'% ('+level(surfaceWetness)+'). Existing roof, glass, graphite timber, terrace, paving and leaves have physically plausible damp darkening, roughness/gloss and restrained wet contact reflections. Wetness is independent of whether rain is currently falling; do not change material identities.');
  lines.push('PUDDLES AND REFLECTIONS '+puddles+'% ('+level(puddles)+'). At 0%, no new puddles. Only naturally shallow water on EXISTING flat ground/pavement low points, not across sloped roofs, inside buildings, on tree trunks or invented new paths. No changing land plot or boundary shapes.');
  lines.push('HUMID MIST '+rainMist+'% ('+level(rainMist)+'). Distance-dependent atmospheric humidity, subtle realistic sky contrast and distant foliage readability; keep same measured scene and selected sunlight position.');
 }
 return lines.join('\n\n');
}
