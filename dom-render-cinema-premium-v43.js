/* ДОМ.РЕНДЕР · Cinema premium profiles v44 optical distinctions. Physical equipment is a VISUAL reference, not actual camera capture. */
(function(){
'use strict';
const api=window.DOM_RENDER_ANIMATION;
if(!api)return;
const lookup=(items,id)=>items.find(x=>x.id===id)||items[0];
const c=api.cameras, l=api.lenses, m=api.moves, g=api.grades;
const camera=[
 {...lookup(c,'alexa35'),name:'ARRI ALEXA 35',tag:'SUPER 35',desc:'Точные полутона и мягкие света'},
 {...lookup(c,'alexamini'),name:'ARRI ALEXA Mini LF',tag:'LARGE FORMAT',desc:'Кинематографичный объём пространства'},
 {...lookup(c,'venice2'),name:'Sony VENICE 2',tag:'8.6K FULL FRAME',desc:'Чистая глубина и точная передача цвета'},
 {...lookup(c,'vraptor'),name:'RED V-RAPTOR [X]',tag:'8K VISTA VISION',desc:'Высокая детализация архитектуры'},
 {...lookup(c,'komodox'),name:'Canon EOS C400',tag:'6K FULL FRAME',desc:'Естественный свет и достоверные фактуры',prompt:'Canon EOS C400 inspired full-frame cinema colors, clean architectural detail, realistic skin of materials, restrained tonal contrast and softly rolled highlights. Do not change architectural geometry.'},
 {...lookup(c,'ursa'),name:'Blackmagic URSA Cine 12K LF',tag:'LARGE FORMAT',desc:'Широкий диапазон света и микрофактура'}
];
const lensNames=[
 ['ultra14','18 мм','ULTRA WIDE','Общий план дома и окружения',18],
 ['shift24','25 мм','WIDE','Выразительная архитектурная перспектива',25],
 ['cine35','35 мм','NATURAL WIDE','Универсальный план фасада',35],
 ['cine50','47 мм','NORMAL','Нейтральное кадрирование',47],
 ['portrait85','75 мм','PORTRAIT','Спокойное выделение фасада',75],
 ['macro100','95 мм','TELE','Детали и умеренная компрессия',95]
];
const lens=lensNames.map(([id,name,tag,desc,mm])=>({
 ...lookup(l,String(id)),name:String(name),tag:String(tag),desc:String(desc),
 prompt:'ARRI Signature Prime '+name+' cinema prime look, precise natural rectilinear rendering at '+mm+'mm on a large-format sensor. Keep existing windows, roof and all facade contours fixed. Professional smooth focus and soft highlights without inventing material detail.'
}));
const moves=[
 {...lookup(m,'orbit'),name:'Orbit',tag:'Облёт по дуге',desc:'Мягкая дуга вокруг дома'},
 {...lookup(m,'dolly'),name:'Dolly In',tag:'Плавный наезд',desc:'Постепенное приближение'},
 {...lookup(m,'drone'),name:'Dolly Out',tag:'Плавный отъезд',desc:'Раскрытие дома и окружения',prompt:'Smooth slow physical dolly-out from the building, revealing only already visible exterior context; consistent building massing, no newly invented sides or facade openings.',preview:'dolly'},
 {...lookup(m,'slider'),name:'Truck',tag:'Проезд вбок',desc:'Параллельно фасаду'},
 {...lookup(m,'crane'),name:'Crane Up',tag:'Вертикальный подъём',desc:'Плавное раскрытие кровли'},
 {...lookup(m,'walk'),name:'Fly-by',tag:'Диагональный пролёт',desc:'Кинематографичная траектория',prompt:'One continuous smooth diagonal fly-by across the supplied house view, with subtly changing viewpoint and gentle parallax only where geometry is already visually supported. No invented hidden walls, roofs or windows.',preview:'walk'}
];
const grades=[
 {id:'neutral',name:'Clean',tag:'Нейтральный',desc:'Чистая оптика без эффекта',prompt:'Clean optical glass; no diffusion, no stylized flare, physically plausible contrast and true-to-reference neutral material colors.'},
 {id:'filmic',name:'Black Pro-Mist 1/8',tag:'Soft Highlights',desc:'Лёгкое свечение в бликах',prompt:'Subtle Tiffen Black Pro-Mist 1/8 inspired optical diffusion, mild halation ONLY around existing bright light sources. Preserve sharp building geometry, realistic contrast and authentic surface materials.'},
 {id:'contrast',name:'Glimmerglass 1/4',tag:'Gentle Glow',desc:'Мягкий свет и полутон',prompt:'Light Glimmerglass 1/4 inspired gentle optical diffusion in specular highlights, fine controlled glow and mild reduction of digital harshness; sharp vertical architectural lines remain unchanged.'},
 {id:'warm',name:'CPL',tag:'Polarizer',desc:'Контроль отражений на стекле',prompt:'Circular polarizer inspired natural reduction of glare in appropriate outdoor reflections, balanced blue sky and believable real-world window reflection. Never erase glazing or alter facade openings.'},
 {id:'cool',name:'ND 0.9',tag:'3 Stops',desc:'Нейтральное затемнение',prompt:'Neutral density ND 0.9 inspired optical exposure reduction with naturally controlled highlights, no false color cast and no blocked architectural shadows.'},
 {id:'bw',name:'Blue Streak',tag:'Anamorphic',desc:'Тонкий горизонтальный блик',prompt:'Subtle blue streak anamorphic-inspired flare only when existing visible bright lights warrant it. Very restrained and never add invented lights, neon or structural elements.'}
];

/* V44: Distinct camera and optic emulation. Manufacturer specifications are
   reference metadata, not a claim of physical camera capture or actual 8K/12K output.
   Frame from one still image; do not invent hidden building geometry. */
const detailedCameras={
 alexa35:{spec:'Super 35 · 4.6K · 17 stops',prompt:'SIMULATED ARRI ALEXA 35 image character: Super 35 ALEV 4 sensor, 4.6K capture reference, approximately 17-stop claimed dynamic range. Use a characteristic gentle highlight shoulder with exceptionally gradual clipping, warm-neutral organic midtones, rich recoverable shadow separation and restrained saturation. This is the softest highlight-rendering preset; fine texture is natural rather than digitally sharpened. A coherent S35 field of view is calculated separately from the selected lens. Camera emulation only; do not claim real ARRIRAW or actual 4.6K output.'},
 alexamini:{spec:'Large Format · 4.5K',prompt:'SIMULATED ARRI ALEXA Mini LF image character: approximately 4.5K large-format sensor reference. Create notably open airy large-format spatial rendering, silky tonal transitions, generous midtone softness, relaxed warm highlight roll-off and quiet natural microcontrast. Compared with ALEXA 35 this must feel wider and more spacious at the same lens focal length, not more saturated or sharpened. Keep source building geometry unchanged. Emulation only, not physical camera capture.'},
 venice2:{spec:'Full Frame · 8.6K · Dual Base ISO',prompt:'SIMULATED Sony VENICE 2 image character: 8.6K full-frame sensor reference, dual-base ISO capability (not a claim of actual exposure settings). Noticeably cleaner blue-neutral shadows and precise neutral whites; cooler contemporary premium commercial look, transparent crisp midtones, excellent low-light tonal separation and finely controlled highlight detail. Clearly cooler and clinically cleaner than the two ARRI looks, but no blue tint on original materials and no plastic HDR.'},
 vraptor:{spec:'Vista Vision · 8K · Global Shutter',prompt:'SIMULATED RED V-RAPTOR [X] image character: 8K Vista Vision global-shutter sensor reference. Emphasize bold high-frequency detail separation, firm but realistic edge acuity, punchy locally contrasted stone/wood grain, deep controlled blacks, specular highlights with precise separation and very stable straight edges in motion. Strongest modern high-definition advertising look of these presets, never oversharpened or artificially high saturation. Global shutter means no rolling-shutter skew; it does not guarantee real 8K generation.'},
 komodox:{spec:'Full Frame · 6K · Triple Base ISO',prompt:'SIMULATED Canon EOS C400 image character: 6K full-frame back-illuminated CMOS and triple base ISO reference (800/3200/12800 for Canon Log 2). Deliberately warmer, softer humanistic commercial palette; creamy medium-highlights, gentle amber-neutral transitions and moderate edge sharpness. Natural bright interior-window light, well-preserved facade colors and low-noise dark areas. Contrasts perceptibly with Sony colder precision and RED punchiness. Never fabricate illumination or change time of day.'},
 ursa:{spec:'Large Format · 12K',prompt:'SIMULATED Blackmagic URSA Cine 12K LF image character: large-format 12K RGBW sensor reference; use broad cinematic tonal separation, highly resolved tactile material grain without edge halos, balanced saturated-but-real greens and earth tones, deep yet legible shadows and luminous soft sky detail. Compared with ARRI, stronger true material microtexture and slightly richer natural color; compared with RED, less hard-edged contrast. Simulated visual interpretation, not real 12K output.'}
};
const detailedLenses={
 ultra14:{mm:18,hfov:91.4,role:'ULTRA WIDE',prompt:'ARRI Signature Prime 18mm T1.8 LF optical reference, LF Open Gate horizontal view approx 91.4 degrees. Use an unmistakably wide establishing architectural composition: much more site and sky visible, smaller house within frame, pronounced foreground/background scale separation. Maintain rectilinear lines and visible building proportions. Preserve viewpoint when possible: widening beyond the supplied still can reveal unsupported regions; do not invent hidden elevations, fill unknown areas conservatively.'},
 shift24:{mm:25,hfov:73.0,role:'WIDE',prompt:'ARRI Signature Prime 25mm T1.8 LF optical reference, LF Open Gate horizontal view approx 73 degrees. Wide full-house establishing view with contextual landscaping; 18mm is noticeably wider, 25mm reduces edge expansion. Signature Prime is NOT a tilt-shift lens; keep camera level for straight verticals, do not imply real shift mechanics. Preserve facade geometry.'},
 cine35:{mm:35,hfov:55.5,role:'NATURAL WIDE',prompt:'ARRI Signature Prime 35mm T1.8 LF optical reference, LF Open Gate horizontal view approx 55.5 degrees. Medium-wide natural human-scale architectural frame, house occupies noticeably more width than 25mm, foreground less exaggerated, surroundings still visible. Focus plane on building, only distant/background vegetation may gently soften. Straight construction lines and unchanged openings.'},
 cine50:{mm:47,hfov:42.6,role:'NORMAL',prompt:'ARRI Signature Prime 47mm T1.8 LF optical reference, LF Open Gate horizontal view approx 42.6 degrees. Medium tightened composition, facade dominates the frame and much less landscape remains than at 35mm. Faithful optical perspective: field-of-view crop alone does not create telephoto spatial compression without viewpoint changes. Focus precisely on the architecture, gentle falloff away from it; never blur visible windows or wall texture.'},
 portrait85:{mm:75,hfov:27.5,role:'SHORT TELE',prompt:'ARRI Signature Prime 75mm T1.8 LF optical reference, LF Open Gate horizontal view approx 27.5 degrees. Clearly tight view isolating entrance, main glazing or one facade section already visible. Crop significantly tighter than 47mm with comparatively little site context. High architectural detail and tasteful shallow separation ONLY behind the focused plane. Keep facade details anatomically exact; never invent an unseen wall.'},
 macro100:{mm:95,hfov:21.6,role:'TELE DETAIL',prompt:'ARRI Signature Prime 95mm T1.8 LF optical reference, LF Open Gate horizontal view approx 21.6 degrees. Very tight telephoto composition, select a visible window or facade material detail; crop much tighter than 75mm. Narrow depth of field only away from chosen focal wall plane; keep wall joint pattern and window proportions exactly unchanged. This is NOT a macro lens: do not claim 1:1 reproduction or invent tiny construction details.'}
};
const detailedGrades={
 neutral:{spec:'Clear glass · no filter',prompt:'UNFILTERED CLEAN optical reference: neutral true-to-original white balance, crisp microcontrast, clean bright existing light sources and untinted reflections. Explicitly NO bloom, NO light streak, NO polarizer and NO darkening. This baseline must look clearest.'},
 filmic:{spec:'Tiffen Black Pro-Mist 1/8',prompt:'Tiffen Black Pro-Mist 1/8 optical diffusion simulation: subtle but readily visible warm-white halation halo around EXISTING windows, practical lights and sun glints, slightly softened hard digital highlights and a mild reduction in global contrast. Maintain crisp facade silhouette and textural detail; no new light sources. Clearly different from Clean, but 1/8 is a gentle real-world filter density.'},
 contrast:{spec:'Tiffen Glimmerglass 1/4',prompt:'Tiffen Glimmerglass 1/4 optical simulation: visible yet delicate pearlescent glimmer surrounding EXISTING isolated specular highlights, softer highlights with relatively retained dark-area contrast, cleaner blacks than Black Pro-Mist. Glimmerglass subtly diffuses, it does not alter building color or add sparkle to matte stone. Make visual character distinguishable from Black Pro-Mist without strong fog.'},
 warm:{spec:'Circular polarizer · variable by angle',prompt:'CPL circular polarizer simulation: stronger natural color separation in an existing blue sky and foliage plus reduced polarized glare on suitable existing glass, water and nonmetallic surfaces, but NEVER remove all reflections. IMPORTANT: actual CPL strength depends on sun and camera angle, and may be weak on frontal glazing or overcast scenes. Avoid cinematic warm tint; this is a polarizer, not warming glass.'},
 cool:{spec:'ND 0.9 · 3 stops',prompt:'Neutral density ND 0.9 physical reference: transmittance about 12.5 percent, THREE stops of reduced incident light. For a visibly different preview, simulate three stops underexposure with same ISO, iris and shutter settings: markedly darker image and restrained existing highlights, but neutral colors. In a properly exposure-compensated camera ND would not darken final image; do NOT claim this darkness is an inherent graded look. Keep usable shadow detail.'},
 bw:{spec:'Anamorphic-style blue streak',prompt:'Blue-streak anamorphic-style flare simulation from EXISTING point-like bright lights: clear narrow horizontal cobalt-blue streaks aligned with visible luminaires or strong sun reflections, restrained falloff and modest anamorphic oval bokeh in genuinely defocused background. Never draw streaks across dark scenes with no bright light, never add neon or fake lights, and never turn image black-and-white.'}
};
for(const item of camera){const d=detailedCameras[item.id];if(d)Object.assign(item,{spec:d.spec,tag:d.spec,prompt:d.prompt});}
for(const item of lens){const d=detailedLenses[item.id];if(d)Object.assign(item,{spec:'ARRI Signature Prime '+d.mm+'mm / T1.8 · LF H-FOV '+d.hfov+'°',tag:d.role,prompt:d.prompt});}
for(const item of grades){const d=detailedGrades[item.id];if(d)Object.assign(item,{spec:d.spec,prompt:d.prompt});}

c.splice(0,c.length,...camera);
l.splice(0,l.length,...lens);
m.splice(0,m.length,...moves);
g.splice(0,g.length,...grades);
api.defaults.lens='cine35';
api.defaults.motion='orbit';
api.version='44';
const panel=document.getElementById('animationPanel');
if(panel){
 const info=[
  ['animCameras','6 профессиональных кинокамер'],
  ['animLenses','6 кинообъективов ARRI Signature Prime'],
  ['animMoves','6 режиссёрских движений'],
  ['animGrades','6 настоящих типов оптических фильтров']
 ];
 for(const [id,label] of info){const sec=document.getElementById(id)?.closest('.anim-section');const summary=sec?.querySelector('.anim-section-title small');if(summary)summary.textContent=label;}
 const section=document.getElementById('animGrades')?.closest('.anim-section');
 const header=section?.querySelector('.anim-section-title strong');
 if(header)header.textContent='Оптические фильтры';
 const top=panel.querySelector('.anim-hero p');
 if(top)top.textContent='Реальные кинокамеры, оптика, движения и фильтры для профессиональной архитектурной анимации.';
}
})();