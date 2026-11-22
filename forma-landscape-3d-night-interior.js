/* FORMA: persistent house interior light controls (0..100 UI strengths).
 * House lights are authored scene lights, not invented outdoor fixtures.
 * Preview never edits facade placement or the user's 3D scene coordinates.
 */
export const INTERIOR_NIGHT_DEFAULTS=Object.freeze({
 lightsEnabled:false,visibility:'partial',brightness:65,
 temperature:'warm',windowGlow:45
});
const clamp=(n,fallback)=>n==null||n===''||!Number.isFinite(Number(n))
 ?fallback:Math.round(Math.min(100,Math.max(0,Number(n))));
export function normalizeNightInterior(raw){
 const o=raw&&typeof raw==='object'?raw:{};
 return {
  lightsEnabled:o.lightsEnabled===true,
  visibility:['off','partial','full'].includes(o.visibility)?o.visibility:INTERIOR_NIGHT_DEFAULTS.visibility,
  brightness:clamp(o.brightness,INTERIOR_NIGHT_DEFAULTS.brightness),
  temperature:['warm','neutral','cool'].includes(o.temperature)?o.temperature:INTERIOR_NIGHT_DEFAULTS.temperature,
  windowGlow:clamp(o.windowGlow,INTERIOR_NIGHT_DEFAULTS.windowGlow)
 };
}
export function nightInteriorMode(time){
 return time==='night'||time==='evening'||time==='blue-hour';
}
export function interiorLightColor(temperature){
 return {warm:'#FFD2A0',neutral:'#EEE8DA',cool:'#C7E4FF'}[temperature]||'#FFD2A0';
}
/** Perceptually progressive, intentionally restrained physically visible night lighting.
 * Both sliders matter: brightness controls fixture power and indirect light,
 * while windowGlow controls the emission through already-authored glazing.
 * No new windows, lamps outside the building, or footprint changes.
 */
export function interiorLightLevels(raw){
 const c=normalizeNightInterior(raw);
 const enabled=c.lightsEnabled&&c.brightness>0;
 const b=Math.pow(c.brightness/100,1.32);
 const g=Math.pow(c.windowGlow/100,1.08);
 return {
  enabled,
  pointIntensity:enabled?0.5+17*b:0,
  fixtureEmission:enabled?0.15+4.9*b:0,
  windowEmission:enabled?(0.035+0.65*b)*(0.12+0.88*g):0,
  floorEmission:enabled?0.035+0.21*b:0,
  glassClarity:enabled?Math.min(.25,.15*b):0
 };
}
export function nightInteriorPhotoContract(input){
 const time=input?.atmosphere?.time;
 const cfg=normalizeNightInterior(input?.atmosphere?.interior);
 if(!nightInteriorMode(time))
  return 'HOUSE INTERIOR LIGHTING: Day mode. Do not invent switched-on indoor lights; preserve windows and existing interior exactly as the source.';
 const enabled=cfg.lightsEnabled&&cfg.brightness>0;
 const mode=cfg.visibility==='off'?'hidden':cfg.visibility==='full'?'clearly readable':'partially readable';
 return 'AUTHOR-CONTROLLED HOUSE INTERIOR AT '+String(time).toUpperCase()+
  ': existing interior lights '+(enabled?'ON':'OFF')+
  '; interior display mode '+cfg.visibility+' ('+mode+')'+
  '; selected authored brightness '+cfg.brightness+'%'+
  '; selected colour temperature '+cfg.temperature+
  '; selected window glow '+(enabled?cfg.windowGlow:0)+'%. '+
  (enabled?
   'Place soft physically plausible illumination ONLY INSIDE the already modelled house, using the existing architectural interiors and their existing visible fixtures. Exterior reflection and light spill through the EXISTING glazing must match the selected brightness and glow; keep dark smoke-tinted glazing; never invent extra windows, extra lamps outside the house, or change the roof.':
   'HOUSE REMAINS DARK. Do not invent warmly glowing windows, interior spotlights or furnished rooms through dark glass. Exterior garden lights remain governed by their existing independent scene controls.')+
  (cfg.visibility==='off'?' Hide interior furnishing details behind the existing glazing.':
   cfg.visibility==='partial'?' Show only a subdued glimpse of the actual existing furniture through the glass.':
   ' Make the existing interior furniture and structural beams readable through the existing glazing, not overexposed.')+
  ' House coordinates and roof, front windows and spatial composition remain 100% unchanged.';
}
