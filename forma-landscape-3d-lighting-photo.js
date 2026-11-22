/* FORMA AI: precise real-time lighting identity, supplied by the editor.
 * This is scene-local artistic sun (azimuth 0 = +Z north, 90 = +X east),
 * NOT GPS/ephemeris or absolute illuminance in lux.
 * Never invent absent values: the screenshot remains authoritative.
 */
const f=(v,n=2)=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v).toFixed(n):null);
const safe=(v)=>String(v??'').replace(/[\r\n<>]/g,' ').slice(0,120);
const measure=(v,unit='',n=2)=>{const q=f(v,n);return q===null?'not supplied':q+unit};
const bool=v=>typeof v==='boolean'?(v?'enabled':'disabled'):'not supplied';
const friendlyTime={day:'daylight',morning:'morning',evening:'sunset','blue-hour':'blue hour',night:'night'};
const friendlyWeather={sunny:'clear sunny sky',overcast:'overcast sky','after-rain':'after rain',rain:'rain',fog:'fog',snow:'snow'};
const validColor=v=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v.toUpperCase():'not supplied';
export function photoLightingContract(input){
 const l=input?.lightingRig;
 if(!l||typeof l!=='object')return 'LIGHTING METADATA: No full live lighting rig was sent. Reconstruct illumination ONLY from reference pixels; do not invent sun angle, cloud coverage, exposure, lamp intensity or direction.';
 const a=l.atmosphere||{},sun=l.sun||{},sky=l.sky||{},cloud=l.clouds||{},
 fill=l.fill||{},fog=l.fog||{},render=l.renderer||{},season=safe(l.season||input?.atmosphere?.season||'unknown'),
 time=friendlyTime[l.time]||safe(l.time||'unspecified'),
 weather=friendlyWeather[l.weather]||safe(l.weather||'unspecified');
 const az=f(sun.azimuthDeg,1),el=f(sun.elevationDeg,1),
  v=sun.position||{},d=[f(v.x,2),f(v.y,2),f(v.z,2)].every(x=>x!==null);
 const exactDirection=az!==null&&el!==null?
  'Sun direction defined in LOCAL MODEL coordinates: AZIMUTH '+az+
  '° clockwise from NORTH +Z towards EAST +X; ELEVATION '+el+
  '° above the horizontal (this is NOT geographic true solar time). ':
  'Solar angles not provided: infer only from shadows in image 1. ';
 const sunVector=d?'Existing scene sun vector X='+f(v.x,2)+' Y='+f(v.y,2)+
  ' Z='+f(v.z,2)+' scene units. ':'';
 const noSolar=['night','blue-hour'].includes(input?.atmosphere?.time||l.time);
 return [
  'AUTHORITATIVE SCENE LIGHTING CONTRACT — CAMERA AND LIGHTING ARE ALREADY APPROVED. Reproduce the actual existing scene illumination, not the pretty default sunshine. Time '+time+'; weather '+weather+'; season '+season+'. When direct sunlight is visible, explicit azimuth and elevation define its direction. Weather still controls diffusion. No invented sunrise direction or extra sun.',
  noSolar?'SUN: Below horizon. No solar disk, direct solar rays or directional solar shadows.':
  'SUN: '+exactDirection+sunVector+
   'SUN LIGHT THREE.JS RELATIVE INTENSITY '+measure(sun.intensity,'',3)+
   '; authored solar strength multiplier '+measure(sun.strength,'×',2)+
   '; author-selected shadow softness '+measure(sun.softness,' scene control units',2)+
   '; displayed solar light RGB '+validColor(sun.color)+
   '. Sun shadow map enabled '+bool(sun.shadowEnabled)+
   ', shadow map size '+measure(sun.shadowMapWidth,'px',0)+' × '+measure(sun.shadowMapHeight,'px',0)+
   ', radius '+measure(sun.shadowRadius,'',2)+'. Render natural contact shadows of the exact existing trees, building and garden lights with the correct vector, their length from the elevation and softness matching the selected source controls. Intensities are RELATIVE renderer parameters, NOT lux.',
  'SKY / CLOUDS: Three.js procedural sky visible '+bool(sky.visible)+
   '; sky turbidity '+measure(sky.turbidity,'',2)+
   '; Rayleigh coefficient '+measure(sky.rayleigh,'',2)+
   '; Mie coefficient '+measure(sky.mieCoefficient,'',4)+
   '; Mie directional g '+measure(sky.mieDirectionalG,'',2)+
   '; user cloud setting '+measure(a.clouds,'%',0)+
   '; calculated shader cover '+measure(cloud.coverage,'',3)+
   '; cloud opacity '+measure(cloud.opacity,'',3)+
   '; cloud layer visible '+bool(cloud.visible)+
   '. Preserve the source sky brightness, cloud softness and colour; do not change a selected overcast/fog scene to bright clear sunshine.',
  'INDIRECT / AMBIENT: Hemisphere skylight colour '+validColor(fill.hemisphereColor)+
   ', ground colour '+validColor(fill.groundColor)+
   ', intensity '+measure(fill.hemisphereIntensity,' THREE relative',3)+
   '; bounced directional fill colour '+validColor(fill.bounceColor)+
   ', intensity '+measure(fill.bounceIntensity,' THREE relative',3)+
   '; local atmosphere global fill '+measure(a.globalFill,'%',0)+
   '; outdoor reflection/environment intensity '+measure(render.environmentIntensity,'',3)+
   '. Apply soft physically believable reflected illumination to shaded spruce branches and building glazing without adding new suns.',
  'EXPOSURE / AIR / FOG: Renderer ACES exposure '+measure(render.exposure,'',3)+
   ', tone mapping '+safe(render.toneMapping||'not supplied')+
   ', background '+validColor(render.background)+
   ', fog colour '+validColor(fog.color)+
   ', fog near '+measure(fog.near,'m',2)+
   ', fog far '+measure(fog.far,'m',2)+
   ', author haze '+measure(a.haze,'%',0)+
   ', night glow '+measure(a.nightGlow,'%',0)+
   ', water ripple strength '+measure(a.ripples,'%',0)+
   '. Honor the current existing aerial perspective/contrast and wetness; do not invent a different season or weather.',
  'LIGHT PRIORITY AND ABSOLUTE PHOTOGRAPHIC RULE: '+(noSolar?
   'Sun below horizon. Preserve diffuse twilight or night sky glow as selected and light only from existing enabled luminaires.':
   'Use exactly ONE source-consistent sun direction, the existing fill and authored weather; never move the light merely to make an attractive render.')+
   ' No extra shadows, heavy bloom, lens flare streaks, duplicated sun, random cinematic spotlights or changed window exposure. Preserve night versus day, measured geometry, tree species and source framing.'
 ].join('\n\n');
}
