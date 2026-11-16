/** Local-light brief contract. Visual AI direction, never a photometric IES solver. */
const profiles={downlight:{label:'recessed downlight',cone:60},spot:{label:'accent spotlight',cone:25},'wall-wash':{label:'wall-washing luminaire',cone:90},linear:{label:'linear luminaire',cone:110},pendant:{label:'pendant luminaire',cone:70},floor:{label:'floor lamp',cone:100}};
const placements={ceiling:'at the center of the existing ceiling',left:'on the left of the current camera frame',right:'on the right of the current camera frame',back:'near the existing back wall',foreground:'in the foreground of the current camera frame',window:'near an existing window'};
const number=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export function normalizeInteriorLights(value){
 const raw=Array.isArray(value)?value:value?.sources;
 return (Array.isArray(raw)?raw:[]).slice(0,8).filter(x=>x&&Object.hasOwn(profiles,x.profile)).map(x=>({profile:x.profile,intensity:number(x.intensity,0,200,80),temperature:number(x.temperature,2200,6500,3000),cone:number(x.cone,10,120,profiles[x.profile].cone),placement:Object.hasOwn(placements,x.placement)?x.placement:'ceiling'}));
}
export function interiorLightsPrompt(value){
 const sources=normalizeInteriorLights(value);if(!sources.length)return '';
 return 'INTERIOR LOCAL LIGHT SOURCES: The following profiles describe visual AI lighting direction, NOT imported IES files or an exact photometric simulation. Interpret intensity as a relative percentage; 0% means this added source is off. Preserve the existing room, camera, openings, furniture and finishes. Add or adjust ONLY the requested local luminaires at plausible positions, without rebuilding architecture; preserve existing fixtures not targeted. Existing window daylight may remain, but do not impose exterior sun-disc position or solar-height controls. Produce believable local falloff, light pools, material response and mixed color temperatures. '+sources.map((s,i)=>`Source ${i+1}: ${profiles[s.profile].label}, ${placements[s.placement]}, relative intensity ${s.intensity}%, color temperature ${s.temperature} K, beam cone ${s.cone} degrees.`).join(' ');
}
