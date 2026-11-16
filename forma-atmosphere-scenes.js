/* Nine authored exterior atmosphere directions. Prompts deliberately describe optics,
   placement and physical grounding, never request a changed camera or building. */
export const ATMOSPHERE_SCENARIOS=Object.freeze([
 {id:'day-soft',group:'day',name:'День · Мягкий свет',description:'Рассеянный дневной свет · спокойная экспозиция',look:'editorial',season:'summer',daypart:'day',
  light:'Bright soft diffused daytime sky, broad softbox-like skylight and clean detailed open shadows. Neutral 5600K white balance, no hard midday glint; preserve true material colors and soft penumbrae.',
  exposure:'Expose for architecture and sky at once: highlights retain texture, shadows stay open, midtones nuanced. No flattened HDR.',
  composition:'One mature lateral trunk close to one edge, a few fine backlit twigs above, sparse organically spreading shrubs in a lower corner. Airy asymmetrical gallery composition.',
  optics:'Fine-detail sharp building; slightly quieter closest leaves; very restrained optical edge falloff.',
  defaults:{strength:75,foreground:53,trunks:70,shrubs:45,grounding:75,depth:17,vignette:8,bloom:1,dof:12,temperature:0}},
 {id:'day-side',group:'day',name:'День · Боковое солнце',description:'Объёмный боковой свет · длинные тени',look:'cinema',season:'summer',daypart:'day',
  light:'Low-to-medium angle directional DAYLIGHT from the same physical sun side as the source whenever evident, assertive but realistic modelling of bark and facade, patterned leaf shadows, no invented second sun.',
  exposure:'Protect sunlit facade highlights, retain deep but legible shade and realistic shadow softness, no orange filter.',
  composition:'A strong off-centre textured foreground trunk at the camera-left or camera-right edge; upper side branches catch warm-edged daylight; one low botanical shrub cluster ties near ground to the midground.',
  optics:'Architectural subject tack-sharp, foreground bark microdetail crisp, nearest leaves may have mild lens defocus, very subtle vignette.',
  defaults:{strength:85,foreground:60,trunks:86,shrubs:50,grounding:85,depth:20,vignette:12,bloom:2,dof:18,temperature:4}},
 {id:'day-backlit',group:'day',name:'День · Контровой свет',description:'Свет сквозь листву · естественная глубина',look:'warm-film',season:'summer',daypart:'day',
  light:'Physically plausible gentle DAYTIME backlight from the existing sun direction, narrow warm translucency on leaf margins, cooler shadow-side bark, clean sky fill and restrained lens flare only if source sky enables it.',
  exposure:'Expose for glowing foliage without clipped highlights, retain facade details through open shadows. Avoid artificial god rays.',
  composition:'Tapered foreground tree trunk partly clipped at one edge, a translucent leaf veil across a top corner, dark irregular shrubs grazing the near bottom edge, distinct layered middle distance.',
  optics:'Natural light falloff, warm leaf transmission with dimensional branches, very subtle lens veiling-glare and mild asymmetric vignette.',
  defaults:{strength:82,foreground:58,trunks:78,shrubs:55,grounding:82,depth:24,vignette:14,bloom:5,dof:15,temperature:5}},
 {id:'autumn-gold',group:'autumn',name:'Осень · Золотой свет',description:'Низкое солнце · янтарная листва',look:'warm-film',season:'autumn',daypart:'day',
  light:'Realistic clear autumn afternoon, low warm sunlight consistent with existing spatial orientation; controlled golden highlights against cool shadow fill, no uniform yellow cast.',
  exposure:'Hold detail in golden leaves and sunlit bark, natural deep midtones, bright but textured sky.',
  composition:'A grounded foreground deciduous trunk and uneven amber leaves at image edges; low mixed ochre-green shrubs, a restrained amount of fallen leaves upon existing terrain.',
  optics:'Detailed irregular autumn leaf edges and bark, soft-distance separation, faint warm corner falloff.',
  defaults:{strength:84,foreground:62,trunks:83,shrubs:55,grounding:88,depth:23,vignette:13,bloom:2,dof:10,temperature:7}},
 {id:'autumn-overcast',group:'autumn',name:'Осень · Тихая пасмурность',description:'Влажный воздух · приглушённые цвета',look:'editorial',season:'autumn',daypart:'day',
  light:'Overcast late-autumn daylight, broad cloud-diffused soft illumination, damp-feeling low contrast without automatically making surfaces wet, coherent subtle sky fill.',
  exposure:'Rich dark bark with fully readable shadow detail, muted autumn greens and russets, softly graded distant tones, no fake dense fog.',
  composition:'One rain-darkened-looking trunk if visually consistent with existing weather, fine sparse twigs, sparse rusty and evergreen edge shrubs and authentic uneven leaf litter where plausible.',
  optics:'Natural atmospheric separation and restrained cool lens falloff, no blur across the house.',
  defaults:{strength:78,foreground:58,trunks:80,shrubs:49,grounding:82,depth:28,vignette:9,bloom:0,dof:8,temperature:-3}},
 {id:'winter-clear',group:'winter',name:'Зима · Солнечный мороз',description:'Холодное солнце · хрустальная фактура',look:'nordic',season:'winter',daypart:'day',
  light:'Clear cold winter midday with low crisp sun angle and cool blue sky fill, realistic hard-edged winter shadows matched to sun direction. Snow is neither plastic nor overexposed.',
  exposure:'Bright white snow with retained crystalline texture, dark readable timber and bark, naturally controlled blue-gray shadows.',
  composition:'Deciduous foreground trunk with exposed intricate bark and leafless thin twigs, lightly snow-dusted conifer if source setting allows, bare structural shrubs at the camera-side foreground.',
  optics:'High natural clarity in frozen near bark, subtle wintry distance haze, almost invisible vignette.',
  defaults:{strength:85,foreground:57,trunks:85,shrubs:38,grounding:92,depth:15,vignette:7,bloom:1,dof:9,temperature:-8}},
 {id:'winter-soft',group:'winter',name:'Зима · Мягкий снег',description:'Облачное небо · объём без пересветов',look:'editorial',season:'winter',daypart:'day',
  light:'Quiet overcast winter daylight with luminous snow as diffuse ground bounce, faint cool ambient fill, physically soft shadows; no snowfall unless already present.',
  exposure:'Preserve texture and tonal relief in white snow, avoid gray sludge, keep façade readable and delicate atmospheric depth.',
  composition:'Near-ground snow-framed shrub silhouettes with individual woody twigs; a partly frame-clipped frosted deciduous trunk plus sparse fir branches only where botanically valid.',
  optics:'Fine subtle aerial perspective and mild lens falloff; close branches dimensional but do not blur building.',
  defaults:{strength:80,foreground:58,trunks:78,shrubs:48,grounding:89,depth:27,vignette:10,bloom:1,dof:10,temperature:-6}},
 {id:'blue-calm',group:'blue',name:'Синий час · Тихий',description:'Синий небосвод · мягкое тепло окон',look:'nordic',season:'preserve',daypart:'blue-hour',
  light:'Natural blue-hour civil twilight shortly after sunset: deep ultramarine-to-cobalt sky gradient, soft cool open shade, realistic low outdoor exposure, existing windows and fixtures glow softly only where physically plausible. No night-black sky.',
  exposure:'Expose for architecture, preserving deep cobalt sky and restrained warm 2700–3000K window glow, no blown-out windows or orange oversaturation.',
  composition:'Dark naturally textured near-edge trunk with a faint cool sky rim, shadowy sparse shrubs near lens bottom, visibly separate the building from the foreground without blocking doors and windows.',
  optics:'Subtle lens vignetting, low-light highlight rolloff and natural cool air, no fake bokeh blobs.',
  defaults:{strength:85,foreground:55,trunks:82,shrubs:44,grounding:73,depth:27,vignette:14,bloom:8,dof:12,temperature:-7}},
 {id:'blue-cinema',group:'blue',name:'Синий час · Кинематографичный',description:'Глубокий кобальт · световые акценты',look:'cinema',season:'preserve',daypart:'blue-hour',
  light:'A dramatic yet physically grounded deep-blue civil twilight, still enough ambient sky to see all facades, subtle practical exterior and interior warm lights where fixtures/windows already exist, cool blue shadows; preserve light placement.',
  exposure:'Cinema-grade restrained highlight rolloff, rich low-key midtones, glowing practical lights with natural falloff; avoid pitch black facades or fake daylight.',
  composition:'A bold partially cut-off textured trunk on the near left/right border, selective dark leaf silhouettes at a top corner, sculptural near-lens shrubs on opposite lower edge; pronounced near/mid/far layering without moving the camera.',
  optics:'Natural asymmetric optical vignette, gently softened extreme foreground leaf tips, small physically plausible glow only around true light sources, deep crisp building.',
  defaults:{strength:90,foreground:64,trunks:90,shrubs:62,grounding:84,depth:32,vignette:20,bloom:10,dof:22,temperature:-11}}
]);
export const ATMOSPHERE_SCENE_GROUPS=Object.freeze([
 {id:'day',name:'День',description:'3 варианта света'},
 {id:'autumn',name:'Осень',description:'2 сценария'},
 {id:'winter',name:'Зима',description:'2 сценария'},
 {id:'blue',name:'Синий час',description:'2 сценария'}
]);

/* Placement is a spatial priority for ADDED near-camera greenery only.
   Plants already visible in a user's source always retain their actual roots,
   positions, silhouettes and garden layout. Coordinates are a composition
   guide in percent of the original uncropped frame, not a 2D overlay. */
export const ATMOSPHERE_FOREGROUND_PLANS=Object.freeze({
 'day-soft':{
  label:'Ствол слева · куст справа',
  trunk:'LEFT IMAGE EDGE: natural visible tree trunk along x=2–9% of full image, occupying a slender vertical band from near the bottom frame to the upper third; root below left frame on continuous soil if not visible.',
  canopy:'Few delicate branches enter from TOP-LEFT, no curtain across sky.',
  shrubs:'LOWER-RIGHT foreground: one free-growing, see-through shrub cluster centered x=89%, y=93% on visible soil, reaching up no higher than the bottom 18% of the image.',
  occlusion:'An airy, quiet near-camera layer with wide open view toward building; never obscure the main facade.'
 },
 'day-side':{
  label:'Ствол справа · куст слева',
  trunk:'RIGHT IMAGE EDGE: textured mature trunk at x=91–98% from bottom frame through upper-right edge, side-lit bark surface and restrained crown.',
  canopy:'Small physical leafy boughs entering from TOP-RIGHT, lit on their actual sun-facing side.',
  shrubs:'LOWER-LEFT: a dimensional asymmetrical shrub mass centered x=12%, y=94% rooted on foreground ground, with individual small stems and leaf gaps.',
  occlusion:'Use an open diagonal line-of-sight through the centre; cast shadows follow the existing sun direction.'
 },
 'day-backlit':{
  label:'Тонкий ствол справа · листья сверху',
  trunk:'RIGHT image periphery x=94–99%: narrow near-lens mature trunk with an appreciable bark-textured visible section, naturally disappearing beyond the lower edge.',
  canopy:'TOP-RIGHT x=73–98%: a small highly translucent canopy with individual backlit leaves, generous sky openings and thin visible branches.',
  shrubs:'BOTTOM-LEFT x=6–23%, y=88–99%: a low darker bush shape with open twig structure, grounded on existing foreground terrain.',
  occlusion:'Preserve a clear central view; luminous physical transmission through foliage rather than fake glow.'
 },
 'autumn-gold':{
  label:'Янтарная крона слева · куст справа',
  trunk:'LEFT border x=1–8%: substantial aged deciduous trunk with bark fissures reaching above frame, sunlit only on a plausible side.',
  canopy:'TOP-LEFT x=3–31%: sparse warm amber leaves with visible thin woody stems, no repeated decorative leaf pattern.',
  shrubs:'BOTTOM-RIGHT centered x=88%, y=94%: two unequal late-season shrub clusters with russet and evergreen leaves, correctly rooted.',
  occlusion:'Use orange foliage as a small natural visual accent, not a global golden filter.'
 },
 'autumn-overcast':{
  label:'Ствол справа · редкий подлесок слева',
  trunk:'RIGHT border x=94–99%: partially cropped dark-bark trunk with wet-looking age texture only when wetness is physically justified.',
  canopy:'TOP-RIGHT: thin leaf-sparse branches, irregular late-autumn silhouette with larger clear gaps.',
  shrubs:'BOTTOM-LEFT x=5–25%, y=91–99%: sparse mixed shrubs with visible woody architecture and late-season leaves, mostly low and open.',
  occlusion:'A restrained reportage-style foreground; architectural walls retain full exposure.'
 },
 'winter-clear':{
  label:'Морозный ствол слева · сухие кусты справа',
  trunk:'LEFT border x=2–8%: strongly readable leafless deciduous trunk, detailed bark relief and slight snow only in physically plausible crevices.',
  canopy:'TOP-LEFT: fine naked twigs and sparse crystalline ice, no broad green leaves.',
  shrubs:'LOWER-RIGHT x=80–95%, y=89–99%: low, twiggy winter shrubs emerging from snow with accurate cool shadow contact.',
  occlusion:'Clean sharp winter air and clear views to the facade; do not block the house with tree crowns.'
 },
 'winter-soft':{
  label:'Ствол справа · заснеженные кусты слева',
  trunk:'RIGHT border x=93–99%: a restrained bare trunk with snow-softened bark, continuing below the near camera frame.',
  canopy:'Only a small network of thin twig silhouettes high on TOP-RIGHT, no out-of-season leaf masses.',
  shrubs:'BOTTOM-LEFT x=7–24%, y=91–99%: one layered low branchy shrub partly covered by snow, attached to soil/real snowpack with subtle occlusion and soft shadows.',
  occlusion:'Soft, quiet layered visual depth without dense fog or an artificial white border.'
 },
 'blue-calm':{
  label:'Ствол слева · лёгкие кусты справа',
  trunk:'LEFT border x=3–10%: dark foreground trunk, dim but readable texture from blue skylight, not a black sticker.',
  canopy:'Small leaf groups enter TOP-LEFT as cool silhouettes with plausible still-detectable branch structure.',
  shrubs:'BOTTOM-RIGHT x=86–98%, y=93–99%: a single quiet near-camera shrub cluster, not lit by nonexistent lamps.',
  occlusion:'Wide clear center, readable building and restrained luminous existing windows.'
 },
 'blue-cinema':{
  label:'Массивный ствол справа · кусты слева',
  trunk:'RIGHT border x=90–99%: bold close-up trunk with clear vertical bark structure and tactile illumination from existing sky/practicals.',
  canopy:'Asymmetric hanging branches in TOP-RIGHT 72–97%, translucent only where an actual light source passes through.',
  shrubs:'BOTTOM-LEFT x=2–28%, y=87–99%: two unequal sculptural shrubs with stronger depth occlusion and irregular foliage silhouettes.',
  occlusion:'Deep but controlled editorial layering and slightly more pronounced natural corner falloff; never black out main facade.'
 }
});
