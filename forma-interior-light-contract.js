/** FORMA / LIGHT STUDIO. Camera-relative AI instructions, not a physical IES simulator. */
const profiles={downlight:{label:'recessed downlight',cone:60},spot:{label:'accent spotlight',cone:25},'wall-wash':{label:'wall-washing luminaire',cone:90},linear:{label:'linear luminaire',cone:110},pendant:{label:'pendant luminaire',cone:70},floor:{label:'floor lamp',cone:100}};
const placements={ceiling:'at the existing ceiling',left:'on the left of the frame',right:'on the right of the frame',back:'near the existing back wall',foreground:'in the foreground',window:'near an existing window',custom:'at the user-marked image point'};
const preset={ceiling:[50,20,50,65],left:[22,40,48,70],right:[78,40,52,70],back:[50,40,50,80],foreground:[50,67,50,92],window:[18,37,43,68]};
const heights={downlight:2.7,spot:2.6,'wall-wash':1.8,linear:2.6,pendant:2.25,floor:1.5};
const number=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export function normalizeInteriorLights(value){
 const raw=Array.isArray(value)?value:value?.sources;
 return (Array.isArray(raw)?raw:[]).slice(0,8).filter(x=>x&&Object.hasOwn(profiles,x.profile)).map(x=>{
  const placement=Object.hasOwn(placements,x.placement)?x.placement:'ceiling';
  const p=preset[placement]||preset.ceiling;
  return {profile:x.profile,intensity:number(x.intensity,0,200,80),temperature:number(x.temperature,2200,6500,3000),
   cone:number(x.cone,10,120,profiles[x.profile].cone),height:number(x.height,.2,6,heights[x.profile]),placement,mode:x.mode==='fixture'?'fixture':'effect',
   x:number(x.x,2,98,p[0]),y:number(x.y,2,98,p[1]),
   targetX:number(x.targetX,2,98,p[2]),targetY:number(x.targetY,2,98,p[3])};
 });
}
export function interiorLightsPrompt(value){
 const sources=normalizeInteriorLights(value);if(!sources.length)return '';
 return 'INTERIOR LIGHT STUDIO — APPLY USER-PLACED LIGHTS: These are camera-relative directions placed DIRECTLY on reference image 1. '+
 'Image coordinates are percent of full frame, origin top-left (0,0), bottom-right (100,100). '+
 'Each source x/y is a desired location of an actual or invisible light emitter in the depicted space; targetX/targetY is the approximate area it illuminates and the beam direction in image projection. '+
 'Reconstruct plausible depth, surface orientation and occlusion conservatively from the image. Do not treat 2D coordinates as physical 3D measurements or guarantee physically exact beam geometry. '+
 'Use realistic light attenuation, shadow softness, bounced light, reflections, mixed color temperature and exposure. Do not flatten or overexpose the photograph. '+
 'The on-screen numbered pins, plus-sign handles, lines, glows and editing overlays are CONTROL ELEMENTS ONLY; NEVER render these controls in the output. '+
 'Keep camera viewpoint, room layout, doors, windows, furniture and materials unchanged. A light marked 0% is off. '+
 sources.map((s,i)=>{
  const visual=s.mode==='fixture'?
   'VISIBLE FIXTURE MODE: show one discreet, plausible real '+profiles[s.profile].label+' at source coordinates, attached to existing surfaces or furniture where architecturally possible; do not create new walls, ceilings or openings.' :
   'INVISIBLE LIGHT MODE: produce the light effect only; do NOT add a visible luminaire, lamp, bulb, ceiling cutout, wire or other new fixture.';
  return 'LIGHT '+(i+1)+': '+profiles[s.profile].label+'; '+placements[s.placement]+
   '; source center (x '+s.x.toFixed(1)+'%, y '+s.y.toFixed(1)+'%); beam targets (x '+s.targetX.toFixed(1)+'%, y '+s.targetY.toFixed(1)+'%). '+
   'Relative intensity '+s.intensity+'%, color temperature '+s.temperature+' Kelvin, approximate cone '+s.cone+' degrees, mounting height '+s.height.toFixed(1)+' meters (approximate, inferred from photograph). '+visual;
 }).join(' ');
}
