/* Shared, allowlisted art-direction contract. No provider or browser dependencies. */
export const PLANTS=Object.freeze([
 {id:'juniper',name:'Можжевельник',description:'Низкий хвойный куст',prompt:'low spreading juniper, fine natural blue-green needles',color:'#637b68'},
 {id:'willow-nana',name:'Ива Nana',description:'Округлая воздушная крона',prompt:'compact Salix purpurea Nana shrub with fine silvery-green leaves',color:'#9da886'},
 {id:'hydrangea',name:'Гортензия',description:'Светлые соцветия',prompt:'Hydrangea paniculata Limelight, season-appropriate flower clusters',color:'#d2d4b4'},
 {id:'barberry',name:'Барбарис',description:'Бордовая листва',prompt:'compact Berberis Atropurpurea, burgundy leaves',color:'#81535a'},
 {id:'hosta',name:'Хоста',description:'Крупные фактурные листья',prompt:'hosta clump with broad veined green leaves',color:'#708c61'},
 {id:'lavender',name:'Лаванда',description:'Низкая цветущая посадка',prompt:'lavender clump with fine stems and season-appropriate violet flowers',color:'#9690aa'},
 {id:'miscanthus',name:'Мискантус',description:'Злаки и лёгкие метёлки',prompt:'Miscanthus ornamental grass with fine naturally arching blades',color:'#b6ad87'},
 {id:'thuja',name:'Туя',description:'Вертикальный хвойный акцент',prompt:'slender upright Thuja evergreen with detailed non-repeating foliage',color:'#4d6953'}
]);
export const PAVINGS=Object.freeze([
 {id:'clinker',name:'Клинкер',description:'Тёплый кирпич · ёлочка',prompt:'warm natural clay clinker brick pavers in a herringbone pattern, fine realistic joints',color:'#aa7c64'},
 {id:'granite',name:'Гранит',description:'Колотая серая брусчатка',prompt:'small grey granite setts with subtly irregular split natural faces',color:'#92938e'},
 {id:'concrete',name:'Бетон',description:'Крупные светлые плиты',prompt:'large light-grey concrete paving slabs with narrow joints and fine aggregate',color:'#c6c4ba'},
 {id:'slate',name:'Сланец',description:'Тёмные вытянутые плиты',prompt:'elongated charcoal slate paving with layered mineral texture',color:'#555d5e'},
 {id:'limestone',name:'Известняк',description:'Светлый природный камень',prompt:'warm pale limestone paving with subtle pores and restrained natural variation',color:'#d3c8af'},
 {id:'mix',name:'Мультиформат',description:'Серая брусчатка трёх размеров',prompt:'three-size neutral grey concrete pavers laid in an offset random modular bond',color:'#9b9c95'}
]);
export const LIGHTS=Object.freeze([
 {id:'bollard',name:'Боллард',description:'Низкий столбик',prompt:'slim matte-black bollard path light with concealed downward optic',color:'#30383a'},
 {id:'blade',name:'Световая пластина',description:'Тонкий прямоугольный корпус',prompt:'minimal black rectangular blade garden light with recessed vertical warm LED',color:'#30383a'},
 {id:'mushroom',name:'Грибок',description:'Мягкий свет вниз',prompt:'minimal bronze mushroom path luminaire with a shallow disc shade',color:'#857661'},
 {id:'spot',name:'Прожектор',description:'Акцент на посадки',prompt:'small black ground-mounted adjustable landscape spotlight',color:'#30383a'},
 {id:'lantern',name:'Садовый фонарь',description:'Лаконичный высокий фонарь',prompt:'slender modern black garden lantern, clear rectangular glass enclosure',color:'#30383a'},
 {id:'recessed',name:'Встроенный',description:'Светильник в мощении',prompt:'small flush recessed in-ground luminaire with metal trim',color:'#8a8b83'}
]);
export const LOOKS=Object.freeze([
 {id:'natural',name:'Чистая фотография',description:'Нейтральный цвет · живая фактура',prompt:'neutral full-frame architectural photography, true material colors, natural tonal separation, restrained optical microcontrast',temperature:0,saturation:0,contrast:0},
 {id:'editorial',name:'Архитектурный журнал',description:'Мягкие света · спокойная палитра',prompt:'refined architectural editorial photograph, muted organic palette, soft highlight roll-off, lifted readable shadows and elegant restrained contrast',temperature:3,saturation:-10,contrast:-5},
 {id:'cinema',name:'Кинематографичный',description:'Глубокие тени · тёплые акценты',prompt:'cinematic photographic color separation, subtly cool shadow neutrals and warm existing highlights, deep readable blacks, controlled saturation, no excessive teal-orange tint',temperature:-3,saturation:-6,contrast:12},
 {id:'warm-film',name:'Тёплая плёнка',description:'Медовые полутона · мягкий контраст',prompt:'subtle warm analog-film response, honey midtones, gentle highlight shoulder and refined restrained greens; preserve material identity',temperature:12,saturation:-5,contrast:3},
 {id:'nordic',name:'Северная сдержанность',description:'Холодные нейтрали · воздух',prompt:'restrained Nordic editorial color grade, cool clean neutrals, subtle green desaturation, spacious natural tonal transitions; do not change geographic setting or weather',temperature:-10,saturation:-13,contrast:2},
 {id:'dramatic',name:'Выразительный кадр',description:'Плотный чёрный · точный свет',prompt:'dramatic fine-art architectural photographic tonal response, strong but readable chiaroscuro from the existing light, controlled highlights and rich natural textures',temperature:0,saturation:-8,contrast:22}
]);
const invalid=message=>{throw Object.assign(new Error(message),{status:400});};
const finite=(value,fallback,min,max)=>{if(value==null)return fallback;const n=Number(value);if(!Number.isFinite(n))invalid('Параметр должен быть числом');return Math.min(max,Math.max(min,n));};
const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)invalid('Точка должна находиться внутри изображения');return {x:p.x,y:p.y};};
export const catalogFor=kind=>kind==='plant'?PLANTS:kind==='path'?PAVINGS:kind==='light'?LIGHTS:[];
export function normalizeLandscape(value){
 if(!value||!Array.isArray(value.items)||!value.items.length||value.items.length>80)invalid('Добавьте от 1 до 80 объектов ландшафта');
 return {items:value.items.map((raw,i)=>{
  if(!catalogFor(raw?.kind).some(v=>v.id===raw.catalogId))invalid('Неизвестный объект ландшафта');
  const item={id:typeof raw.id==='string'?raw.id.slice(0,48):String(i),kind:raw.kind,catalogId:raw.catalogId};
  if(raw.kind==='path'){
   if(!Array.isArray(raw.points)||raw.points.length<3||raw.points.length>32)invalid('Для дорожки нужно от 3 до 32 точек');
   item.points=raw.points.map(point);
   const area=Math.abs(item.points.reduce((s,p,j)=>{const q=item.points[(j+1)%item.points.length];return s+p.x*q.y-q.x*p.y},0))/2;
   if(area<.00001)invalid('Контур дорожки слишком мал или пересекается');
  }else{Object.assign(item,point(raw));item.w=finite(raw.w,.1,.001,1);item.h=finite(raw.h,.18,.001,1);}
  return item;
 })};
}
const pct=n=>+(n*100).toFixed(2);
export function landscapePrompt(value){
 const {items}=normalizeLandscape(value);
 const instructions=items.map((item,i)=>{
  const entry=catalogFor(item.kind).find(x=>x.id===item.catalogId);
  const shape=item.kind==='path'?'ground polygon vertices in crop percentages '+item.points.map(p=>`(${pct(p.x)}, ${pct(p.y)})`).join(', '):`bottom-centre at (${pct(item.x)}%, ${pct(item.y)}%), width ${pct(item.w)}%, height ${pct(item.h)}% of crop`;
  return `${i+1}. ${entry.prompt}; ${shape}.`;
 }).join('\n');
 return 'LOCAL LANDSCAPE EDIT ONLY. Image 1 is a clean crop of the current photograph, the transparent PNG mask is the only editable region. The crop is centred in a square canvas; return the exact same square framing and object alignment. Keep any neutral padding opaque and unchanged. Do not expand to the full reference photo or crop/zoom the image. Coordinates below are relative to this square canvas, origin top-left. '+
  'Preserve architecture, house geometry, facade materials, camera, light direction, existing terrain and every object outside the mask. No text, diagrams, selection outlines or UI. Replace the indicated region with real photographed objects, do not paint an icon or a sticker. Respect existing occlusion; do not cover foreground walls with plants. '+
  'Match current season, weather and time exactly. In daytime fixtures remain unlit or very subtle; never turn daytime into night. At night warm 2700–3000K light has physically plausible falloff within the selected region. '+
  'Paving follows ground perspective and has believable joints and thickness. Preserve the drawn path boundary. Resolve individual foliage, natural size variation, root contact and restrained contact shadows. The second image if present is the full scene for context only.\n'+instructions;
}
export function normalizeAtmosphere(value){
 if(value==null)return null;
 if(!LOOKS.some(x=>x.id===value.preset))invalid('Неизвестная атмосфера');
 return {preset:value.preset,strength:finite(value.strength,65,0,100),contrast:finite(value.contrast,0,-30,30),saturation:finite(value.saturation,0,-30,30),temperature:finite(value.temperature,0,-30,30),dof:finite(value.dof,0,0,100),depth:finite(value.depth,10,0,40),bloom:finite(value.bloom,0,0,30),grain:finite(value.grain,0,0,20),focus:value.focus?point(value.focus):{x:.5,y:.5}};
}
export function sameView(a,b){return !!a&&!!b&&a.projectId===b.projectId&&a.sourceKey===b.sourceKey&&(a.renderId||null)===(b.renderId||null);}
export function atmospherePrompt(value,{preserveScene=true}={}){
 const a=normalizeAtmosphere(value);if(!a||a.strength===0)return '';
 const look=LOOKS.find(x=>x.id===a.preset);
 const focus=a.dof>0?`Selective photographic depth of field at strength ${a.dof}/100. Focus on the actual architectural subject nearest (${pct(a.focus.x)}%, ${pct(a.focus.y)}%) of the FULL image. Keep the primary building and its facade microdetail sharply resolved; apply natural optical defocus only to nearer foreground and far background according to physical distance. No uniform Gaussian blur, tilt-shift miniature effect or blurred building.`:'Deep architectural depth of field, building and landscape optically resolved, no artificial bokeh.';
 const sceneLock=preserveScene?'Preserve existing weather, season, time of day, sun direction and environment':'Apply this grade to the explicitly requested resulting scene conditions (weather, season, time and sun), never override those selected conditions';
 return `PHOTOGRAPHIC ATMOSPHERE / ART DIRECTION (${a.strength}/100 intensity): ${look.prompt}. ${sceneLock}; preserve all architecture, material identity, landscaping positions, viewpoint, framing and image dimensions. Do not add objects or change the scene. Color grade only, not a repaint or a new location. Additional tonal contrast ${a.contrast}, saturation ${a.saturation}, warm/cool balance ${a.temperature} on a -30 to +30 scale; keep facade material hues credible. ${focus} Atmospheric distance separation ${a.depth}/40: restrained depth-dependent reduction of far-background contrast only, not a fog/weather change or a white veil over the building. Optical highlight bloom ${a.bloom}/30, limited to existing brightest light sources. Fine film grain ${a.grain}/20, no loss of material detail. Preserve full resolution and natural texture; no oversharpening, HDR halos, plastic surfaces or cinematic black bars.`;
}
export function gradePixel(r,g,b,value){
 const a=normalizeAtmosphere(value);if(!a)return [r,g,b];const look=LOOKS.find(x=>x.id===a.preset),s=a.strength/100;
 const t=(a.temperature+look.temperature)*s, sat=1+(a.saturation+look.saturation)*s/100, contrast=1+(a.contrast+look.contrast)*s/100;
 const l=.2126*r+.7152*g+.0722*b;
 return [r,g,b].map((v,i)=>Math.max(0,Math.min(255,Math.round(((l+(v-l)*sat)-127.5)*contrast+127.5+(i===0?t:i===2?-t:0)))));
}
