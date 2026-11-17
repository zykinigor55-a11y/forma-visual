/** FORMA / LIGHT STUDIO. Camera-relative AI instructions, not a physical IES simulator. */
const profiles={downlight:{label:'recessed downlight',cone:60},spot:{label:'accent spotlight',cone:25},'wall-wash':{label:'wall-washing luminaire',cone:90},linear:{label:'linear luminaire',cone:110},pendant:{label:'pendant luminaire',cone:70},floor:{label:'floor lamp',cone:100}};
const placements={ceiling:'at the existing ceiling',left:'on the left of the frame',right:'on the right of the frame',back:'near the existing back wall',foreground:'in the foreground',window:'near an existing window',custom:'at the user-marked image point'};
const preset={ceiling:[50,20,50,65],left:[22,40,48,70],right:[78,40,52,70],back:[50,40,50,80],foreground:[50,67,50,92],window:[18,37,43,68]};
const heights={downlight:2.7,spot:2.6,'wall-wash':1.8,linear:2.6,pendant:2.25,floor:1.5};
const lengths={downlight:1.0,spot:0.8,'wall-wash':2.4,linear:2.4,pendant:1.4,floor:1.2};
const opticalBehavior={
 downlight:'RECESSED DOWNLIGHT: symmetric, soft-edged downward circular pool on surfaces below, modest cone from existing ceiling, natural falloff, short contact shadows; not a long stripe.',
 spot:'ADJUSTABLE SPOTLIGHT: tight directional cone with clearly localized elliptical/circular hotspot along the selected aim direction and rapid edge attenuation; emphasize the intended artwork or surface only, never light an entire wall.',
 'wall-wash':'WALL WASHER: emit a broad, continuous, almost RECTANGULAR vertical wash uniformly across a section of the existing wall. No triangular flashlight cone, no separate circular spot, no individual scallops if using a continuous wall washer. The width is determined by requested linear coverage and the wall geometry.',
 linear:'LINEAR LUMINAIRE / LED PROFILE: continuous elongated uniform strip or ribbon of emitted light along the source line, with a SOFT EXTENDED BAND of illumination parallel to the bar, coherent reflections along the same length, and a subtle gradient across its width. Absolutely NO conical flashlight beam, triangular fan or round spotlight pool; light MUST READ AS A LINE and its length matters.',
 pendant:'PENDANT: soft, downward diffuse pool and gentle ambient bounce under the actual suspended shade, with plausible penumbra and broad radial falloff. A diffuser shade does not project a focused flashlight cone.',
 floor:'FLOOR LAMP / TORCHERE: warm diffuse asymmetric illumination extending sideways and up the nearby wall or seating; local shadowed shade, no ceiling downlight cone or triangular stage spotlight.'
};
const number=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export function normalizeInteriorLights(value){
 const raw=Array.isArray(value)?value:value?.sources;
 return (Array.isArray(raw)?raw:[]).slice(0,8).filter(x=>x&&Object.hasOwn(profiles,x.profile)).map(x=>{
  const placement=Object.hasOwn(placements,x.placement)?x.placement:'ceiling';
  const p=preset[placement]||preset.ceiling;
  return {profile:x.profile,intensity:number(x.intensity,0,200,80),temperature:number(x.temperature,2200,6500,3000),
   cone:number(x.cone,10,120,profiles[x.profile].cone),height:number(x.height,.2,6,heights[x.profile]),length:number(x.length,.4,6,lengths[x.profile]),placement,mode:x.mode==='fixture'?'fixture':'effect',
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
 'MANDATORY PHOTOMETRIC TYPE DIFFERENTIATION: six categories produce SIX DISTINCT spatial patterns. Never use the same fan-shaped cone with different labels. Linear and wall-wash NEVER show a spotlight cone. Spot is narrowly directional, downlight is a symmetric pool, pendant diffuse, floor lamp local ambient. Physically coherent shadows and occlusion. '+
 'Use realistic light attenuation, shadow softness, bounced light, reflections, mixed color temperature and exposure. Do not flatten or overexpose the photograph. '+
 'The on-screen numbered pins, plus-sign handles, lines, glows and editing overlays are CONTROL ELEMENTS ONLY; NEVER render these controls in the output. '+
 'Keep camera viewpoint, room layout, doors, windows, furniture and materials unchanged. A light marked 0% is off. '+
 sources.map((s,i)=>{
  const visual=s.mode==='fixture'?
   'VISIBLE FIXTURE MODE: show one discreet, plausible real '+profiles[s.profile].label+' at source coordinates, attached to existing surfaces or furniture where architecturally possible; do not create new walls, ceilings or openings.' :
   'INVISIBLE LIGHT MODE: produce the light effect only; do NOT add a visible luminaire, lamp, bulb, ceiling cutout, wire or other new fixture.';
  return 'LIGHT '+(i+1)+': '+profiles[s.profile].label+'; '+placements[s.placement]+
   '; source center (x '+s.x.toFixed(1)+'%, y '+s.y.toFixed(1)+'%); beam targets (x '+s.targetX.toFixed(1)+'%, y '+s.targetY.toFixed(1)+'%). '+
   'Relative intensity '+s.intensity+'%, color temperature '+s.temperature+' Kelvin, '+(['linear','wall-wash'].includes(s.profile)?'continuous luminous coverage width/length '+s.length.toFixed(1)+' metres (approximate; should be constrained by visible existing surfaces); NO conical beam. ':'beam spread '+s.cone+' degrees. ')+
   'Mounting height '+s.height.toFixed(1)+' metres (approximate, inferred from photograph). '+opticalBehavior[s.profile]+' '+visual;
 }).join(' ');
}
