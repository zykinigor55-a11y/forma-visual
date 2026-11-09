/* DOM.RENDER — Architectural Animation Studio v39.
 * Camera and lens emulation are optical/cinematic PROMPT profiles.
 * These do not reproduce proprietary hardware or perform AI video rendering. */
(function(root){
 'use strict';
 const cameras=[
  {id:'alexa35',name:'ARRI ALEXA 35',tag:'Super 35 · Cinema',sensor:'Super 35',desc:'Мягкие света и богатые полутона',prompt:'ARRI ALEXA 35 inspired Super 35 cinema color science, exceptionally smooth highlight roll-off, organic midtones, true-to-source facade colors, detailed shadows without crushing blacks and restrained natural contrast.'},
  {id:'alexamini',name:'ARRI ALEXA Mini LF',tag:'Large Format · Cinema',sensor:'Large Format',desc:'Объёмный кинематографичный кадр',prompt:'ARRI ALEXA Mini LF inspired large-format cinematic imaging, nuanced dimensionality, pleasant highlight shoulder, subtle natural texture, soft cinematic roll-off, precise material hues and clean architectural details.'},
  {id:'venice2',name:'Sony VENICE 2',tag:'Full Frame · Cinema',sensor:'Full Frame',desc:'Чистые тени и точные цвета',prompt:'Sony VENICE 2 inspired cinema tonal latitude, clean low-noise shadows, true neutral whites, pleasing midtone definition, smooth specular highlights and restrained premium commercial architectural contrast.'},
  {id:'burano',name:'Sony BURANO',tag:'8.6K · Cinema',sensor:'Full Frame',desc:'Естественная резкость и светотень',prompt:'Sony BURANO inspired full-frame digital cinema clarity, credible daylight color and soft filmic transitions, sophisticated highlight handling, highly detailed true-to-source materials without artificial sharpening.'},
  {id:'vraptor',name:'RED V-RAPTOR XL',tag:'8K VV · Cinema',sensor:'VV',desc:'Рекламная детализация фасадов',prompt:'RED V-RAPTOR XL inspired 8K VV cinema resolution, very clean fine architectural edges and detailed surfaces, vivid but controlled tonal separation, high dynamic range without halos or altered materials.'},
  {id:'komodox',name:'RED KOMODO-X',tag:'6K · Cinema',sensor:'Super 35',desc:'Выразительный контраст и фактуры',prompt:'RED KOMODO-X inspired Super 35 cinema imaging, crisp authentic material microdetail and modern precise contrast, natural color separation and high-quality stable motion, no excessive texture generation.'},
  {id:'ursa',name:'Blackmagic URSA Cine 12K',tag:'12K · Cinema',sensor:'Large Format',desc:'Глубина фактур и плавные переходы',prompt:'Blackmagic URSA Cine 12K inspired large-format cinematic image, subtle organic texture, wide tonal latitude, natural colors, excellent resolved detail and believable highlight and shadow separation.'},
  {id:'ronin4d',name:'DJI Ronin 4D 8K',tag:'8K · Stabilized Cinema',sensor:'Cinema',desc:'Плавные пролёты без дрожания',prompt:'DJI Ronin 4D 8K inspired high-detail cinematic capture with very smooth stabilized gimbal motion, level horizon, naturally accurate exposure, rich but neutral material reproduction and minimal unwanted shake.'}
 ];
 const lenses=[
  {id:'ultra14',name:'14 мм',tag:'Сверхширокий',desc:'Полный дом в кадре',prompt:'14mm rectilinear ultra-wide perspective with naturally expanded near-far spacing and restrained barrel distortion; keep vertical building lines straight, do not invent larger facade planes or alter topology.'},
  {id:'shift17',name:'17 мм Tilt-Shift',tag:'Архитектура',desc:'Широкий фасад, ровные вертикали',prompt:'17mm tilt-shift architectural optics: correct perspective control and perfectly vertical lines; broad framing without keystoning; crisp edges across the field with physically plausible peripheral behavior.'},
  {id:'shift24',name:'24 мм Tilt-Shift',tag:'Фасад фронтально',desc:'Профессиональные вертикали',prompt:'24mm tilt-shift architectural perspective with lens shift preserving straight parallel verticals, minimal geometric distortion, clean even sharpness and elegant framing, no invented geometry or viewpoint change.'},
  {id:'cine24',name:'24 мм Cinema',tag:'Общий план',desc:'Простор и естественное восприятие',prompt:'24mm rectilinear cinema prime perspective, natural wide framing, gently expanded depth with straight architectural edges, controlled flare, moderate falloff, realistic near-to-far sharpness.'},
  {id:'cine35',name:'35 мм Cinema',tag:'Универсальный',desc:'Естественный фасадный ракурс',prompt:'35mm cinema prime perspective, realistic human-scale framing and natural spatial relationships, clean mid-distance separation, soft natural out-of-focus rendering away from the building, no exaggerated distortion.'},
  {id:'cine50',name:'50 мм Cinema',tag:'Фактура и детали',desc:'Нейтральные пропорции и объём',prompt:'50mm cinema prime optics: neutral perspective, restrained background compression, extremely realistic proportions, tactile surface separation and modest shallow depth of field only where consistent with focus.'},
  {id:'portrait85',name:'85 мм',tag:'Акцент',desc:'Окна, вход и отдельные элементы',prompt:'85mm short telephoto prime framing with naturally compressed background, focused architectural detail and softly isolated background; keep the actual facade element and its physical proportions intact.'},
  {id:'macro100',name:'100 мм Macro',tag:'Макро',desc:'Швы, текстура, стыки крупно',prompt:'100mm macro lens look for close-up inspection of an ALREADY VISIBLE material detail: very short focus distance, controlled depth of field, high-frequency authentic surface microtextures, no fictional nails, scratches, seams or structural additions.'},
  {id:'tele135',name:'135 мм Telephoto',tag:'Телеобъектив',desc:'Компрессия глубины и фасадные детали',prompt:'135mm telephoto viewpoint with compressed background spacing, clean selective framing of visible architectural surfaces, soft natural background separation, no new objects outside the provided reference view.'},
  {id:'ana40',name:'40 мм Anamorphic',tag:'Кинематографичный',desc:'Мягкая оптика, широкая подача',prompt:'40mm anamorphic-inspired cinematic rendering: subtle horizontal flare from EXISTING bright light only, oval bokeh in genuine out-of-focus areas, delicate edge fall-off; correct architecture without geometric stretching, no fake light fixtures.'}
 ];
 const moves=[
  {id:'dolly',name:'Плавное приближение',tag:'Dolly-in',desc:'Камера медленно приближается к дому',prompt:'One smooth slow controlled physical dolly-in toward the already visible building, 25–60 centimeters of apparent camera travel, almost no perspective change; stable center framing, no abrupt speed-up.',preview:'dolly'},
  {id:'orbit',name:'Мягкий облёт',tag:'Orbit',desc:'Минимальная дуга без перестройки дома',prompt:'A very small gentle orbit arc, less than 4 degrees of apparent yaw around an already visible corner; prioritize original silhouette, do not synthesize hidden side facades or new windows. If parallax cannot be reliable, remain near-static.',preview:'orbit'},
  {id:'slider',name:'Проезд вдоль фасада',tag:'Slider',desc:'Горизонтальное движение параллельно стене',prompt:'Subtle lateral slider movement parallel to the visible facade, level horizon, restrained parallax, consistent wall plane and existing openings, no object morphing.',preview:'slider'},
  {id:'crane',name:'Подъём камеры',tag:'Crane-up',desc:'Плавный подъём с раскрытием общего вида',prompt:'Slow gentle crane-up with level camera, lifting only enough to reveal existing visible architecture; preserve roof plane exactly and do not hallucinate an unseen roof layout.',preview:'crane'},
  {id:'drone',name:'Подлёт с дрона',tag:'Drone approach',desc:'Плавное приближение с высоты',prompt:'Very stable low-altitude drone approach, gently closing distance with slightly elevated line of sight, cinematic smooth motor motion; avoid reconstructing roof or surroundings not shown in the source.',preview:'drone'},
  {id:'walk',name:'Стедикам у дома',tag:'Gimbal walk',desc:'Движение оператора по участку',prompt:'Elegant stabilized gimbal walk, restrained cinematic forward movement with subtle human-scale inertia, no shake or rolling shutter artifacts, keep camera on the same visible architectural approach.',preview:'walk'},
  {id:'tilt',name:'Вертикальное раскрытие',tag:'Tilt reveal',desc:'От земли к крыше',prompt:'Slow tripod-head tilt up from the already visible ground-level portion of the frame toward visible roof and sky, without camera translation or changing perspective geometry.',preview:'tilt'},
  {id:'macro',name:'Макропролёт',tag:'Detail slide',desc:'Очень медленно вдоль фактуры',prompt:'Slow micro slider move across an ALREADY VISIBLE facade material surface, with physically credible grazing light and subtle shallow depth of field; no change to the material type, seam count or construction details.',preview:'macro'}
 ];
 const grades=[
  {id:'neutral',name:'Natural Luxury',desc:'Чистый архитектурный цвет',prompt:'Natural Luxury editorial color grade, credible white balance, muted natural saturation, precise neutral facade color, fine detail without halos.'},
  {id:'filmic',name:'Soft Cinema',desc:'Мягкая плёночная тональность',prompt:'Soft cinema grade, refined roll-off, subtle organic grain, delicate contrast, no washed-out architecture.'},
  {id:'contrast',name:'Cinematic Contrast',desc:'Выразительный светотеневой объём',prompt:'Measured cinematic contrast, deep but recoverable shadows, gentle highlight contrast, no black clipping or fake HDR.'},
  {id:'warm',name:'Warm Heritage',desc:'Тепло и спокойный свет',prompt:'Slightly warmer cinematic white balance without changing true material colors, luminous soft highlights, gentle amber daylight tones.'},
  {id:'cool',name:'Cool Editorial',desc:'Прохладная современная подача',prompt:'Cool neutral editorial color balance, refined blue-gray ambience, preserve actual material hues and whites, no excessive cyan cast.'},
  {id:'bw',name:'Monochrome Film',desc:'Архитектура в чёрно-белом кино',prompt:'Black-and-white photographic grading, controlled tonal separation, visible facade materials through texture and luminance, no flattening of detail.'}
 ];
 const defaults={camera:'alexa35',lens:'shift24',motion:'dolly',grade:'neutral',duration:6,ratio:'16:9',fps:24,intensity:'low',promptExtra:''};
 const one=(arr,id)=>arr.find(x=>x.id===id)||arr[0];
 const sanitize=txt=>String(txt||'').replace(/[\x00-\x1f]/g,' ').replace(/\s+/g,' ').trim().slice(0,350);
 function normalize(settings){
  const s={...defaults,...(settings||{})};
  for(const [field,arr] of [['camera',cameras],['lens',lenses],['motion',moves],['grade',grades]])if(!arr.some(x=>x.id===s[field]))s[field]=defaults[field];
  s.duration=[5,6,8,10].includes(Number(s.duration))?Number(s.duration):6;
  s.fps=[24,25,30].includes(Number(s.fps))?Number(s.fps):24;
  s.ratio=['16:9','9:16'].includes(s.ratio)?s.ratio:'16:9';
  s.intensity=['low','moderate'].includes(s.intensity)?s.intensity:'low';
  s.promptExtra=sanitize(s.promptExtra);
  return s;
 }
 function buildPrompt(settings){
  const s=normalize(settings),c=one(cameras,s.camera),l=one(lenses,s.lens),m=one(moves,s.motion),g=one(grades,s.grade);
  const movement=s.intensity==='low'?'Movement strength is minimal: prioritize accurate structure over parallax.':'Movement is moderately noticeable but still conservative. Never reveal unsupported unseen geometry.';
  return [
   'ARCHITECTURAL IMAGE-TO-VIDEO / SINGLE CONTINUOUS TAKE',
   'Create a truly photorealistic architectural film from the supplied IMAGE of this exact approved house. The image is the absolute architectural ground truth. Preserve the exact existing massing, roof contours, window and door counts/positions, facade proportions, terrace and site elements, colors, textures, cladding, joints and landscaping. Do not change building geometry, original materials or architecture. No added doors, windows, fixtures, steps, trees, furniture or structural elements. No remodeling, no scene cuts, no object morphing, no inconsistent reflections.',
   'CAMERA AESTHETIC — emulation only, not actual camera metadata: '+c.prompt,
   'LENS / PERSPECTIVE — visual simulation: '+l.prompt,
   'CAMERA PATH: '+m.prompt+' '+movement,
   'COLOR GRADE: '+g.prompt,
   'LIVING LANDSCAPE: Any vegetation ALREADY PRESENT in the source must show gentle plausible natural motion: tree crowns softly swaying, individual leaves lightly fluttering, shrubs subtly rustling, small branches and ornamental grasses moving independently with a mild coherent breeze. Respect original plant shapes and locations. If there is water, allow faint coherent ripples and natural reflections. If no plants exist, do not add any. Do not animate walls, roof, windows, paved surfaces or structural objects. No extreme wind, no flicker, no vegetation morphing.',
   'PHYSICS: Match original sun direction, time, sky and season. Natural realistic lens exposure, physically credible parallax ONLY from geometrically evidenced features. Straight building verticals, constant roof and window shape, stable edges throughout. Shadows may shift subtly from camera movement but building materials and composition must not mutate. Never fabricate hidden elevations from a single frame.',
   'RECORDING: '+s.duration+' seconds, '+s.fps+' frames per second, '+s.ratio+' output aspect, one shot, smooth ease-in/ease-out, no cuts, no zoom-jump, no distracting motion blur, no titles, captions, music, logos, people or voiceover.',
   s.promptExtra?'ADDITIONAL USER DIRECTION (only if compatible with architectural fidelity): '+s.promptExtra:'',
   'NEGATIVE: warped facade, shifting walls, melting roof, moving windows, material swaps, invented geometry, variable number of openings, surreal landscape changes, artificial CGI sheen, flicker, jerky motion, focus hunting, excessive lens distortion, duplicated facade details.'
  ].filter(Boolean).join('\n\n');
 }
 root.DOM_RENDER_ANIMATION={cameras,lenses,moves,grades,defaults,normalize,buildPrompt,version:'39'};
})(window);
