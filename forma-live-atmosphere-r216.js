// R216: one normalized atmosphere snapshot for photo and motion generation.
const clamp=(n,min,max,def=0)=>n==null||n===''||!Number.isFinite(Number(n))?def:Math.max(min,Math.min(max,Number(n)));
const pc=(n,d=0)=>Math.round(clamp(n,0,100,d));
export const LIVE_FOG_DEFAULTS={groundDensity:0,groundHeight:.8,waterDensity:0,waterHeight:.6,driftSpeed:20};
export function normalizeLiveFog(v={}){
 return {groundDensity:pc(v.groundDensity),groundHeight:clamp(v.groundHeight,.1,5,.8),waterDensity:pc(v.waterDensity),waterHeight:clamp(v.waterHeight,.1,5,.6),driftSpeed:pc(v.driftSpeed,20)};
}
export function liveAtmosphereSnapshot({atmosphere={},solar={},sky={},wind=0,fog={},hasWater=false}={}){
 const weather=['sunny','overcast','after-rain','rain','fog','snow'].includes(atmosphere.weather)?atmosphere.weather:'sunny';
 const season=['winter','spring','summer','autumn'].includes(atmosphere.season)?atmosphere.season:'summer';
 const e=atmosphere.effects||{},snow=season==='winter'||weather==='snow',wet=weather==='rain'||weather==='after-rain';
 return {version:1,weather,season,sunElevation:clamp(solar.elevation,-18,85,45),sunAzimuth:clamp(solar.azimuth,0,359,0),sunStrength:clamp(solar.strength,.3,1.7,1),shadowSoftness:clamp(solar.softness,1,5,2.6),
 clouds:pc(sky.clouds,35),cloudDensity:pc(sky.cloudDensity,65),cloudScale:clamp(sky.cloudScale,40,200,100),cloudHeight:clamp(sky.cloudHeight,40,220,100),cloudThickness:clamp(sky.cloudThickness,25,200,100),cloudTransmission:pc(sky.cloudTransmission,65),haze:pc(sky.haze,30),wind:pc(wind),ripples:pc(sky.ripples,30),
 snowTrees:snow?pc(e.snowTrees,22):0,snowGround:snow?pc(e.snowGround,52):0,snowfall:snow?pc(e.snowfall):0,rain:weather==='rain'?pc(e.rainIntensity,42):0,wetness:wet?pc(e.surfaceWetness,65):0,puddles:wet?pc(e.puddles,20):0,rainMist:wet?pc(e.rainMist,25):0,winterHaze:snow?pc(e.winterHaze,18):0,
 ...normalizeLiveFog(fog),hasWater:hasWater===true};
}
export function liveAtmospherePrompt(s,mode='photo'){
 if(!s||s.version!==1)return '';
 const v=mode==='video',p=n=>pc(n)+'%',m=n=>clamp(n,.1,5,.8).toFixed(1)+' m',wind=pc(s.wind),e=clamp(s.sunElevation,-18,85,45),clouds=pc(s.clouds);
 const weather=['sunny','overcast','after-rain','rain','fog','snow'].includes(s.weather)?s.weather:'sunny',season=['winter','spring','summer','autumn'].includes(s.season)?s.season:'summer';
 const out=['LIVE ATMOSPHERE — AUTHOR SETTINGS. Preserve exact architecture, planted positions, materials, water boundaries and camera '+(v?'path if supplied':'framing')+'. Restrained natural photographic colors. No morphing, no new objects.',
 'Weather '+weather+'; season '+season+'; sun azimuth '+clamp(s.sunAzimuth,0,359,0)+' deg, elevation '+e+' deg, relative strength '+clamp(s.sunStrength,.3,1.7,1).toFixed(2)+'. '+(e<=0?'Sun below/on horizon: no visible direct solar disk or direct solar shadows.':'One coherent solar direction, consistent shadows and reflections.')+' Match sky scattering and ambient color to the authored elevation; '+(v?'keep selected time of day stable unless a time transition is explicitly requested.':'capture the selected instant without changing exposure arbitrarily.'),
 'Cloud cover '+p(clouds)+', density '+p(s.cloudDensity)+', scale '+clamp(s.cloudScale,40,200,100)+'%, relative height '+clamp(s.cloudHeight,40,220,100)+'%, thickness '+clamp(s.cloudThickness,25,200,100)+'%, transmission '+p(s.cloudTransmission)+'. '+(clouds?(v?'Clouds drift continuously as ONE coherent field, without doubling or ghosting.':'One coherent cloud field, no duplicates.'):'No added clouds.')+' General haze '+p(s.haze)+'.',
 'Wind '+p(wind)+'. '+(wind?(v?'Branches bend at joints; trunks and roots stay fixed. Leaves flutter, grass waves and shrubs sway with varied timing. All moving weather shares coherent wind direction visible in reference; do not randomly reverse direction.':'Show natural wind deflection in foliage and grass without moving trunks or changing crown identity.'):'Keep vegetation still; no invented wind.')];
 if(pc(s.rain)>0&&weather==='rain')out.push('Falling rain '+p(s.rain)+'. '+(v?'Fine depth-layered droplets fall continuously, slant with wind, impact existing surfaces and create expanding ripples.':'Visible realistic rain streaks, scaled by depth and aligned to wind.'));
 else out.push('No falling rain.');
 if(pc(s.wetness)||pc(s.puddles))out.push('Existing surface wetness '+p(s.wetness)+', shallow puddles '+p(s.puddles)+', rain mist '+p(s.rainMist)+'. Retain material identity and path geometry; '+(v?'reflections remain temporally stable, ripple only when precipitation is active.':'natural wet roughness and subtle reflections.'));
 out.push('Settled snow on trees '+p(s.snowTrees)+', ground/roof '+p(s.snowGround)+', falling flakes '+p(s.snowfall)+', winter haze '+p(s.winterHaze)+'. '+(pc(s.snowfall)?(v?'Snowflakes fall continuously with parallax, wind and individual trajectories. Keep authored accumulation stable over the short clip.':'Depth-layered natural flakes at the captured instant.'):'No falling flakes.')+' Preserve each tree silhouette; zero accumulation means no added snow.');
 if(pc(s.groundDensity))out.push('Low GROUND fog density '+p(s.groundDensity)+', height '+m(s.groundHeight)+', drift '+p(s.driftSpeed)+'. '+(v?(pc(s.driftSpeed)?'Fog visibly FLOWS horizontally across the terrain, curls around fixed obstacles, follows slopes and hollows, with continuous soft eddies, never a stationary white overlay.':'Keep low fog nearly still, with soft local variation.'):'Show soft layered terrain-following fog with translucent edges and spatial depth; no full-screen white overlay.'));
 else out.push('No added ground fog.');
 if(s.hasWater===true){out.push('Existing water ripple setting '+p(s.ripples)+'. '+(v?'Water responds to wind and active precipitation with continuous coherent reflections.':'Match water surface ripples and reflected sky.'));if(pc(s.waterDensity))out.push('WATER mist density '+p(s.waterDensity)+', height '+m(s.waterHeight)+', drift '+p(s.driftSpeed)+'. '+(v?(pc(s.driftSpeed)?'Mist visibly glides along the existing water surface and disperses at the banks, never static.':'Keep water mist nearly still.'):'Low translucent layered mist hugs existing water, softly dissipating at banks.')+' Never invent or enlarge water.');else out.push('No added water mist.');}
 else out.push('No existing water: do not invent water or water mist.');
 if(v)out.push('Motion must be clearly readable yet natural and continuous through the clip. No time-lapse, flicker, duplicated clouds, rigid whole-tree wobble or random camera cuts. Keep all effects consistent in direction and intensity.');
 return out.join('\n');
}
