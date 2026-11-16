/* Shared, allowlisted art-direction contract. No provider or browser dependencies. */
import {ATMOSPHERE_SCENARIOS} from './forma-atmosphere-scenes.js';
import {authoredAtmospherePrompt} from './forma-atmosphere-prompt.js';
export const PLANTS=Object.freeze([
 {id:'juniper',name:'Можжевельник',description:'Низкий хвойный куст',prompt:'low spreading Juniperus horizontalis Blue Chip, fine natural blue-green needles',color:'#637b68'},
 {id:'willow-nana',name:'Ива Nana',description:'Округлая воздушная крона',prompt:'compact Salix purpurea Nana shrub with fine silvery-green leaves',color:'#9da886'},
 {id:'hydrangea',name:'Гортензия',description:'Светлые соцветия',prompt:'Hydrangea paniculata Limelight, season-appropriate flower clusters',color:'#d2d4b4'},
 {id:'barberry',name:'Барбарис',description:'Бордовая листва',prompt:'compact Berberis thunbergii Atropurpurea, burgundy leaves',color:'#81535a'},
 {id:'hosta',name:'Хоста',description:'Крупные фактурные листья',prompt:'Hosta sieboldiana clump with broad veined green leaves',color:'#708c61'},
 {id:'lavender',name:'Лаванда',description:'Низкая цветущая посадка',prompt:'Lavandula angustifolia clump with fine stems and season-appropriate violet flowers',color:'#9690aa'},
 {id:'miscanthus',name:'Мискантус',description:'Злаки и лёгкие метёлки',prompt:'Miscanthus sinensis ornamental grass with fine naturally arching blades',color:'#b6ad87'},
 {id:'thuja',name:'Туя',description:'Вертикальный хвойный акцент',prompt:'slender upright Thuja occidentalis Smaragd evergreen with detailed non-repeating foliage',color:'#4d6953'}
]);
export const PAVINGS=Object.freeze([
 {id:'clinker',name:'Клинкер',description:'Серо-коричневый · ёлочка',prompt:'grey-brown natural clay clinker brick pavers in a herringbone pattern, fine realistic joints',color:'#aa7c64'},
 {id:'granite',name:'Гранит',description:'Колотая серая брусчатка',prompt:'small grey granite setts with subtly irregular split natural faces',color:'#92938e'},
 {id:'concrete',name:'Бетон',description:'Крупные светлые плиты',prompt:'large light-grey concrete paving slabs with narrow joints and fine aggregate',color:'#c6c4ba'},
 {id:'slate',name:'Сланец',description:'Тёмный камень · живой рисунок',prompt:'charcoal slate paving with naturally varied slab shapes with layered mineral texture',color:'#555d5e'},
 {id:'limestone',name:'Каменные плиты',description:'Серо-бежевый природный камень',prompt:'natural grey-beige sandstone paving slabs with subtly irregular edges and fine mineral texture',color:'#d3c8af'},
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
export const TREES=Object.freeze([
 {id:'pine-tall',name:'Сосна высокая',description:'Открытый ствол · крона наверху',prompt:'very tall mature Scots pine (Pinus sylvestris), long bare orange-brown trunk with no low branches, airy irregular crown high at top',color:'#718360',atlas:2,cell:0},
 {id:'spruce-tall',name:'Ель высокая',description:'Высокая узкая хвойная крона',prompt:'very tall mature Norway spruce (Picea abies) with elegant narrow conical crown and detailed dark-green needles',color:'#52634f',atlas:2,cell:1},
 {id:'birch',name:'Берёза высокая',description:'Белый ствол · воздушная крона',prompt:'tall mature silver birch (Betula pendula), clearly exposed white bark trunk and airy high leaf crown',color:'#a6b393',atlas:2,cell:2},
 {id:'birch-young',name:'Берёза молодая',description:'Лёгкая посадка',prompt:'young slender silver birch (Betula pendula) sapling with white bark and delicate green leaves',color:'#a6b393',atlas:2,cell:3},
 {id:'pine',name:'Сосна раскидистая',description:'Живописная зрелая крона',prompt:'mature spreading Scots pine (Pinus sylvestris) with irregular branches and fine needles',color:'#738368',cell:8},
 {id:'pine-branch',name:'Сосна ветвистая',description:'Широкая живописная крона',prompt:'mature branching Scots pine (Pinus sylvestris) with expressive irregular lateral limbs and airy wide crown',color:'#718360',atlas:3,cell:0},
 {id:'poplar',name:'Тополь пирамидальный',description:'Высокий узкий силуэт',prompt:'tall narrow columnar Lombardy poplar (Populus nigra Italica) with detailed foliage',color:'#718360',atlas:3,cell:1},
 {id:'oak',name:'Дуб',description:'Мощный ствол · широкая крона',prompt:'mature pedunculate oak (Quercus robur) with thick trunk, irregular spreading branches and realistic foliage',color:'#718360',atlas:3,cell:2},
 {id:'poplar-spread',name:'Тополь раскидистый',description:'Высокая свободная крона',prompt:'mature black poplar (Populus nigra) with high loose crown and exposed trunk',color:'#718360',atlas:3,cell:3},
 {id:'maple',name:'Клён',description:'Широкая лиственная крона',prompt:'mature Norway maple (Acer platanoides) with natural detailed foliage',color:'#71835e',cell:11}
]);
export const FILLS=Object.freeze([
 {id:'gravel',name:'Гравий серый',description:'Мелкая природная отсыпка',prompt:'natural grey fine gravel ground cover, realistic small stones',color:'#93938a'},
 {id:'white-gravel',name:'Светлая галька',description:'Светлая округлая фракция',prompt:'warm pale rounded river pebbles ground cover',color:'#d0cbbd'},
 {id:'bark',name:'Кора и мульча',description:'Тёмная натуральная кора',prompt:'dark natural chipped pine bark mulch ground cover',color:'#6b5441'},
 {id:'grass',name:'Газон',description:'Живой ровный газон',prompt:'healthy natural trimmed lawn with individual fine grass blades and subtle color variation',color:'#708552'},
 {id:'groundcover',name:'Почвопокровные',description:'Низкая зелень · светлое цветение',prompt:'low natural flowering green groundcover plants, small leaves, tiny pale flower clusters and organic non-repeating growth',color:'#607b48'}
]);
export const OBJECTS=Object.freeze([
 {id:'granite-rock',name:'Валуны гранитные',description:'Природная группа камней',prompt:'irregular group of large natural dark granite boulders, embedded in the ground',color:'#888987',cell:12},
 {id:'limestone-rock',name:'Валун светлый',description:'Природный известняк',prompt:'rounded large pale limestone boulder with mineral pores',color:'#b9b19f',cell:13},
 {id:'concrete-pot',name:'Кашпо бетонное',description:'С небольшой ветвистой сосной',planted:'pine-branch',prompt:'minimal matte natural concrete cylindrical garden planter with a planted small branching Scots pine (Pinus sylvestris), visible soil, natural root contact and realistic container thickness',color:'#aaa99d',atlas:3,cell:8},
 {id:'stone-pot',name:'Кашпо каменное',description:'С лиственным деревом',planted:'birch-young',prompt:'minimal carved warm natural stone garden planter with a planted small multi-stem leafy silver birch (Betula pendula) tree, natural soil and trunk contact',color:'#b5a58e',atlas:3,cell:9},
 {id:'metal-pot',name:'Кашпо металлическое',description:'Матовый графит · туя',planted:'thuja',prompt:'minimal cubic matte charcoal powder-coated metal garden planter with a planted slender Thuja occidentalis Smaragd conifer, visible soil and natural plant-container proportions',color:'#45494a',atlas:3,cell:10}
]);
export const EDGES=Object.freeze([
 {id:'steel-edge',name:'Металлический бордюр',description:'Тонкий край по контуру',prompt:'thin dark metal landscape edging along marked boundary, following terrain',color:'#555b5b'},
 {id:'stone-edge',name:'Каменный бордюр',description:'Натуральный камень',prompt:'low natural stone curb edging along marked boundary',color:'#a69d8c'},
 {id:'concrete-edge',name:'Бетонный бордюр',description:'Чёткая геометрия',prompt:'minimal smooth concrete curb along marked boundary',color:'#a6a79e'},
 {id:'steps',name:'Ступени',description:'В отмеченной области',prompt:'landscape stone steps strictly inside the marked ground polygon, plausible levels and contact shadows, preserve building architecture',color:'#a69f8f'},
 {id:'retaining',name:'Подпорная стенка',description:'Низкая каменная стенка',prompt:'low natural stone retaining landscape wall strictly within marked polygon, correct terrain contact, no changes to building architecture',color:'#89877b'}
]);
export const EXTRA_LIGHTS=Object.freeze([
 {id:'pole',name:'Высокая опора',description:'Лаконичный уличный свет',prompt:'tall slender matte-black modern streetlight pole',color:'#343a3b',atlas:2,cell:5},
 {id:'wallwash',name:'Садовая подсветка',description:'Широкий свет на поверхность',prompt:'small black outdoor landscape wall-washer luminaire',color:'#343a3b',atlas:2,cell:9},
 {id:'step',name:'Подсветка ступеней',description:'Горизонтальный тёплый свет',prompt:'minimal recessed horizontal exterior step light with warm downward illumination',color:'#343a3b',atlas:2,cell:10},
 {id:'sphere',name:'Шар матовый',description:'Опаловый · мягкий рассеянный свет',prompt:'matte frosted opal-white garden sphere resting on ground, no glossy glass, evenly diffused soft warm glow only in night conditions',color:'#deddd3',atlas:2,cell:12},
 {id:'sphere-pole',name:'Шар на стойке',description:'Матовый опал · тонкая стойка',prompt:'matte frosted opal-white sphere garden light on slim matte-black pole, soft diffused warm glow only at night, no glossy transparent glass',color:'#deddd3',atlas:2,cell:13},
 {id:'lantern-low',name:'Фонарь низкий',description:'Матовый чёрный корпус',prompt:'low minimal matte-black rectangular glass outdoor garden lantern',color:'#343a3b',atlas:2,cell:15}
]);
export const LOOKS=Object.freeze([
 {id:'natural',scene:'Open clear architectural light with balanced sky fill, gentle contact shadows and clean separation of nearby foliage, the building and distant trees; keep the source light character.',name:'Чистая фотография',description:'Нейтральный цвет · живая фактура',prompt:'neutral full-frame architectural photography, true material colors, natural tonal separation, restrained optical microcontrast',temperature:0,saturation:0,contrast:0},
 {id:'editorial',scene:'Quiet editorial daylight: soften the existing highlight transitions through cloud diffusion, open facade shadows with natural sky fill and separate an airy foreground from a calm distant tree layer.',name:'Архитектурный журнал',description:'Мягкие света · спокойная палитра',prompt:'refined architectural editorial photograph, muted organic palette, soft highlight roll-off, lifted readable shadows and elegant restrained contrast',temperature:3,saturation:-10,contrast:-5},
 {id:'cinema',scene:'Cinematic spatial lighting: sculpt existing light into a stronger side-lit facade, darker framing branches and luminous middle-distance foliage, with a gentle atmospheric falloff behind the building.',name:'Кинематографичный',description:'Глубокие тени · тёплые акценты',prompt:'cinematic photographic color separation, subtly cool shadow neutrals and warm existing highlights, deep readable blacks, controlled saturation, no excessive teal-orange tint',temperature:-3,saturation:-6,contrast:12},
 {id:'warm-film',scene:'Intimate warm photographic light: honey highlights on existing sun-facing leaves, soft translucent leaf edges and warm reflected ground bounce, balanced by neutral shaded building materials.',name:'Тёплая плёнка',description:'Медовые полутона · мягкий контраст',prompt:'subtle warm analog-film response, honey midtones, gentle highlight shoulder and refined restrained greens; preserve material identity',temperature:12,saturation:-5,contrast:3},
 {id:'nordic',scene:'Spacious northern light: broad cool sky fill, gentle readable facade modelling and clear near foliage against increasingly pale distant trees; retain a restrained quiet sky and believable local vegetation.',name:'Северная сдержанность',description:'Холодные нейтрали · воздух',prompt:'restrained Nordic editorial color grade, cool clean neutrals, subtle green desaturation, spacious natural tonal transitions; do not change geographic setting or weather',temperature:-10,saturation:-13,contrast:2},
 {id:'dramatic',scene:'Dramatic architectural light: deepen cloud modelling within the current weather, strengthen the existing light-to-shadow separation on the facade and edge foliage, and retain readable rich shadows with layered distant air.',name:'Выразительный кадр',description:'Плотный чёрный · точный свет',prompt:'dramatic fine-art architectural photographic tonal response, strong but readable chiaroscuro from the existing light, controlled highlights and rich natural textures',temperature:0,saturation:-8,contrast:22}
]);

export const ATMOSPHERE_VEGETATION=Object.freeze([
 {id:'match',name:'Как в исходнике',prompt:'First identify the existing visible tree species. Extend ONLY that species at the edges: Scots pine (Pinus sylvestris) with irregular needles if pines are present; silver birch (Betula pendula) with fine white-bark twigs if birches are present; Norway spruce (Picea abies) with hanging needle branches if spruces are present; Norway maple (Acer platanoides) with lobed leaves if maples are present. For another recognizable species use that same species, not this example list. If existing species is unclear, choose a plausible species matching the region and existing vegetation rather than omitting an explicitly requested near foreground tree.'},
 {id:'pine',name:'Сосна обыкновенная',prompt:'Scots pine (Pinus sylvestris): irregular sparse lateral branches, orange-brown bark, fine paired needles, airy asymmetric crown; never a dense conical spruce.'},
 {id:'spruce',name:'Ель обыкновенная',prompt:'Norway spruce (Picea abies): narrow irregular conical crown, downward-hanging lateral boughs, fine individual dark-green needles; never a pine crown.'},
 {id:'birch',name:'Берёза повислая',prompt:'Silver birch (Betula pendula): slender white trunk with dark bark fissures, delicate hanging twigs and small serrated leaves, airy translucent canopy.'},
 {id:'maple',name:'Клён остролистный',prompt:'Norway maple (Acer platanoides): broad irregular deciduous crown, five-lobed leaves, natural branching and plausible leaf size.'},
 {id:'willow',name:'Ива белая',prompt:'White willow (Salix alba): fine flexible hanging twigs with narrow silvery-green leaves, light open crown.'},
 {id:'none',name:'Без добавления зелени',prompt:''}
]);

const invalid=message=>{throw Object.assign(new Error(message),{status:400});};
const finite=(value,fallback,min,max)=>{if(value==null)return fallback;const n=Number(value);if(!Number.isFinite(n))invalid('Параметр должен быть числом');return Math.min(max,Math.max(min,n));};
const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)invalid('Точка должна находиться внутри изображения');return {x:p.x,y:p.y};};
export const catalogFor=kind=>({plant:PLANTS,tree:TREES,path:PAVINGS,fill:FILLS,object:OBJECTS,edge:EDGES,light:[...LIGHTS,...EXTRA_LIGHTS]})[kind]||[];
export const isLinearEdge=item=>item?.kind==='edge'&&['steel-edge','stone-edge','concrete-edge'].includes(item.catalogId);
export function normalizeLandscape(value){
 if(!value||!Array.isArray(value.items)||!value.items.length||value.items.length>80)invalid('Добавьте от 1 до 80 объектов ландшафта');
 return {placementGuide:value.placementGuide===true,speciesBoard:value.speciesBoard===true,items:value.items.map((raw,i)=>{
  if(!catalogFor(raw?.kind).some(v=>v.id===raw.catalogId))invalid('Неизвестный объект ландшафта');
  const item={id:typeof raw.id==='string'?raw.id.slice(0,48):String(i),kind:raw.kind,catalogId:raw.catalogId};
  if(raw.kind==='fill'){
   if(!Array.isArray(raw.strokes)||!raw.strokes.length||raw.strokes.length>200)invalid('Нарисуйте область кистью');
   let total=0;item.strokes=raw.strokes.map(st=>{if(!Array.isArray(st.points)||!st.points.length||(total+=st.points.length)>12000)invalid('Слишком сложная кистевая область');return {size:finite(st.size,.03,.003,.3),erase:st.erase===true,points:st.points.map(point)};});
  }else if(raw.kind==='path'||raw.kind==='edge'){
   const linear=isLinearEdge(item),minimum=linear?2:3;
   if(!Array.isArray(raw.points)||raw.points.length<minimum||raw.points.length>32)invalid(`Нужно от ${minimum} до 32 точек`);
   item.points=raw.points.map(point);item.rotation=finite(raw.rotation,0,-180,180);item.tileScale=finite(raw.tileScale,100,10,300);
   if(linear){item.edgeWidth=finite(raw.edgeWidth,.015,.003,.1);if(!item.points.some(p=>Math.hypot(p.x-item.points[0].x,p.y-item.points[0].y)>.003))invalid('Линия бордюра слишком короткая');}
   else{const area=Math.abs(item.points.reduce((s,p,j)=>{const q=item.points[(j+1)%item.points.length];return s+p.x*q.y-q.x*p.y},0))/2;if(area<.00001)invalid('Контур дорожки слишком мал или пересекается');}
  }else{Object.assign(item,point(raw));if(raw.influence)item.influence={shadow:finite(raw.influence.shadow,0,0,.4),reflection:finite(raw.influence.reflection,0,0,.7)};item.rotation=finite(raw.rotation,0,-180,180);item.w=finite(raw.w,.1,.001,50);item.h=finite(raw.h,.18,.001,50);}
  return item;
 })};
}
const pct=n=>+(n*100).toFixed(2);
export function landscapePrompt(value){
 const {items,speciesBoard,placementGuide}=normalizeLandscape(value);
 const references=[...new Set(items.map(i=>i.catalogId))];
 const instructions=items.map((item,i)=>{
  const entry=catalogFor(item.kind).find(x=>x.id===item.catalogId);
  const shape=isLinearEdge(item)?'open curb centreline '+item.points.map(p=>`(${pct(p.x)}%, ${pct(p.y)}%)`).join(' → ')+', strip width '+pct(item.edgeWidth)+'% of crop; build a continuous raised curb with a readable vertical face, NOT a tiled paved area':item.kind==='fill'?'painted ground area with brush strokes '+JSON.stringify(item.strokes):['path','edge'].includes(item.kind)?'ground polygon vertices, paving rotation '+(item.rotation||0)+' degrees, repeat scale '+(item.tileScale||100)+' percent, crop percentages '+item.points.map(p=>`(${pct(p.x)}, ${pct(p.y)})`).join(', '):`bottom-centre at (${pct(item.x)}%, ${pct(item.y)}%), width ${pct(item.w)}%, height ${pct(item.h)}% of crop`;
  return `${i+1}. ${entry.prompt}; ${entry.planted?'ONE integrated planted container: container bottom is the ground anchor; plant root is INSIDE the pot soil, never at the ground anchor. Centre the stem in the opening; soil sits below the lip; the front rim must occlude the lower stem. Rebuild plant, soil and pot together with coherent perspective, scale and lighting. ':''} ${speciesBoard?'reference #'+(references.indexOf(item.catalogId)+1)+' on Image '+(placementGuide?'3':'2')+'; ':''}${shape}.`;
 }).join('\n');
 return 'LOCAL LANDSCAPE EDIT ONLY. Image 1 is a clean crop of the current photograph, the transparent PNG mask is the only editable region. The crop is centred in a square canvas; return the exact same square framing and object alignment. Keep any neutral padding opaque and unchanged. Do not expand to the full reference photo or crop/zoom the image. Coordinates below are relative to this square canvas, origin top-left. '+
  'Preserve architecture, house geometry, facade materials, camera, light direction, existing terrain and every object outside the mask. No text, diagrams, selection outlines or UI. Replace the indicated region with real photographed objects, do not paint an icon or a sticker. Respect depth ordering from the requested placement. A new foreground plant may occlude background architecture where it is drawn, while existing nearer objects must still occlude the new plant. Do not relocate it to avoid covering a background facade. '+
  (placementGuide||speciesBoard?'All supplied cutouts are species/shape references only. ':'TEXT-DESCRIBED LANDSCAPE GENERATION: The numbered botanical descriptions and numeric anchors below are the authoritative object specifications. No plant screenshot, editor preview, stock cutout or species board is supplied or needed. ')+
  'Regenerate ALL placed object pixels as a coherent photograph, including containers and soil. Never preserve stock cutout lighting or sharpness. Match the scene camera perspective, light direction, exposure, white balance, optical sharpness and depth of field at the object distance; resolve natural needles and leaves without halos or artificial blur. A planted pot is a single physical assembly with root inside soil, rim occlusion, contact darkening and a container base supported by the existing surface.  Reconstruct real volumetric photographed foliage, NEVER paste a flat cutout or icon into the output. The editable influence region includes user-authorized cast shadows and reflections; make them consistent with existing light and water only, do not invent water. '+
  'BOTANICAL HYPERREALISM — GENERATE NEW OPTICAL DETAIL, NOT SHARPENING: at 2K inspection distance every visible plant retains its actual selected species and original trunk anchor. On near mature trees resolve species-correct rough and smooth bark patches, dark fissures, bark plate intersections, knots, age variation, slender layered secondary and tertiary twigs, naturally variable leaf size, leaf veins and translucent backlit edges. On conifers resolve distinct needle clusters and airy gaps between branches rather than a solid cone or green paint. On planted shrubs construct physically connected roots, branches and individual leaf clusters with varied foliage density, irregular silhouettes, dark inner cavities, bright tip leaves and actual crown depth. For lawn and meadow patches produce distinct individual grass blades and small clumps at appropriate scale, varied lengths, subtle greener and drier strands, biological irregularity and realistic contact with soil along paving edges, never a smooth green carpet, synthetic fur or repeating texture tile. Keep the exact existing building, lighting, season, paths and terrain; use the selected mask only. Build genuine photoreal surface reconstruction, NOT CSS sharpness, super-resolution illusion, noisy edge enhancement, decals, or pasted low-resolution cutouts. Do not invent extra planting beyond the chosen item positions. '+
  'Match current season, weather and time exactly. In daytime fixtures remain unlit or very subtle; never turn daytime into night. At night warm 2700–3000K light has physically plausible falloff within the selected region. '+
  (placementGuide?'Image 2 is a spatial placement guide ALIGNED EXACTLY with clean Image 1. Use ONLY its object locations, scales and numbered root anchors. Its cutouts, crosshairs, numbers and outlines are instructions, NEVER output pixels. Image 3 is the numbered species and material reference board, not a scene or output camera. For ground-planted trees the root contacts the drawn ground anchor. For planted containers ONLY the container bottom contacts this anchor; the root stays inside the pot. Preserve requested silhouette and size. Never relocate the root to a terrace, balcony, roof or another ground plane. Keep the crown at its requested size; if its drawn bounds extend outside the original photograph, retain that natural frame clipping rather than shrinking or moving the tree. Rebuild the placed flat guide as a fully volumetric photograph with physically matched light, contact and cast shadows. ':speciesBoard?'Image 2 is a numbered botanical, fixture and material reference board, never the scene; Image 3 is the clean full scene for context only. ':'Image 2 if present is the clean full scene for context only. ')+
  'Do not shrink a tree to fit the frame. Keep the requested full size and bottom-centre ground anchor even if most of the crown naturally extends beyond the frame. Never move the root onto a terrace, balcony or roof. Paving follows ground perspective and has believable joints and thickness. Preserve the drawn path boundary. Resolve individual foliage, natural size variation, root contact and physically consistent contact and cast shadows on the ground, matching the original scene light direction, softness and color. Keep cast shadows entirely inside the transparent edit mask; do not omit ground contact. Treat numbered reference tiles as material or object examples only; never reproduce their sheet layout. The clean cropped Image 1 remains the exact output camera.\n'+instructions;
}
export function normalizeAtmosphere(value){
 if(value==null)return null;
 const scene=ATMOSPHERE_SCENARIOS.find(x=>x.id===(value.scenario||'day-soft'));if(!scene)invalid('Неизвестный сценарий атмосферы');
 if(!LOOKS.some(x=>x.id===(value.preset??scene.look)))invalid('Неизвестная атмосфера');
 if(value.vegetation!=null&&!ATMOSPHERE_VEGETATION.some(x=>x.id===value.vegetation))invalid('Неизвестная порода для атмосферы');
 return {preset:value.preset??scene.look,scenario:scene.id,vegetation:value.vegetation??'match',foreground:finite(value.foreground,scene.defaults.foreground,0,70),trunks:finite(value.trunks,scene.defaults.trunks,0,100),shrubs:finite(value.shrubs,scene.defaults.shrubs,0,100),grounding:finite(value.grounding,scene.defaults.grounding,0,100),vignette:finite(value.vignette,scene.defaults.vignette,0,30),strength:finite(value.strength,scene.defaults.strength,0,100),contrast:finite(value.contrast,0,-30,30),saturation:finite(value.saturation,0,-30,30),temperature:finite(value.temperature,scene.defaults.temperature,-30,30),dof:finite(value.dof,scene.defaults.dof,0,100),depth:finite(value.depth,scene.defaults.depth,0,40),bloom:finite(value.bloom,scene.defaults.bloom,0,30),grain:finite(value.grain,0,0,20),focus:value.focus?point(value.focus):{x:.5,y:.5}};
}
export function sameView(a,b){return !!a&&!!b&&a.projectId===b.projectId&&a.sourceKey===b.sourceKey&&(a.renderId||null)===(b.renderId||null);}
export function atmospherePrompt(value,{preserveScene=true}={}){
 const a=normalizeAtmosphere(value);if(!a||a.strength===0)return '';
 return authoredAtmospherePrompt(a,ATMOSPHERE_VEGETATION.find(v=>v.id===a.vegetation),{preserveScene});
 const look=LOOKS.find(x=>x.id===a.preset);
 const focus=a.dof>0?`Selective photographic depth of field at strength ${a.dof}/100. Focus on the actual architectural subject nearest (${pct(a.focus.x)}%, ${pct(a.focus.y)}%) of the FULL image. Keep the primary building and its facade microdetail sharply resolved; apply natural optical defocus only to nearer foreground and far background according to physical distance. No uniform Gaussian blur, tilt-shift miniature effect or blurred building.`:'Deep architectural depth of field, building and landscape optically resolved, no artificial bokeh.';
 const sceneLock=preserveScene?'Preserve existing weather, season, time of day, sun direction and environment':'Use the explicitly requested resulting scene conditions (weather, season, time and sun), never override those selected conditions';
 const vegetation=a.vegetation==='none'||a.foreground===0?'Do not add any trees, branches or plants; use only existing planting for spatial separation.':
  `EDGE VEGETATION — TEXT-DESCRIBED BOTANICAL DIRECTION: ${ATMOSPHERE_VEGETATION.find(x=>x.id===a.vegetation).prompt} Add only a few natural partial branches or one partially frame-clipped tree at the left and right image edges where clear space permits, at ${a.foreground}/70 framing density scaled by overall intensity. Match the existing planting character, season, species scale, lighting and ground plane. Keep the central view, facade, windows, doors, entrance and roof silhouette unobstructed; reduce or omit additions if space is insufficient. Frame edges may naturally clip branches; do not move the camera, existing trees or the house to make room. Do not introduce a new forest, uniform hedges, tropical vegetation, new lawns or a redesigned garden. Add no vegetation in an interior image; never place exterior trees inside rooms, on roofs or terraces. Existing bare winter branches stay bare; conifers retain needles.`;
 const depth=a.depth>0?`AERIAL PERSPECTIVE ${a.depth}/40: foreground has crisp local contrast, middle distance retains material detail, far background progressively loses a little contrast and saturation with distance. Use subtle volumetric air only where physically plausible for the existing weather; no uniform white veil, dense new fog, god rays in overcast light or haze over the building.`:'No added aerial haze; create foreground, middle distance and background separation using lighting and existing spatial occlusion only.';
 return `PHOTOGRAPHIC ATMOSPHERE / ART DIRECTION (${a.strength}/100 intensity): ${look.prompt}.
SCENE MOOD: ${look.scene} This is a coherent relighting and depth treatment, not merely a global tint. Scale all changes by the overall intensity.
SCENE LOCK: ${sceneLock}. Keep the same sun direction and physically consistent shadows; vary sky fill, light softness and contrast only within these conditions. Do not change weather, season, geographic setting or day into night. At night use existing artificial light and ambient sky; no invented sunlight. Preserve all architecture, material identity, existing landscaping positions, hardscape layout, viewpoint, framing and image dimensions.
${vegetation}
SPATIAL COMPOSITION: Build foreground, middle distance and background layers: near edge foliage, sharp primary architecture, then existing distant planting. Keep the site's recognizable landmarks. ${depth}
Additional tonal contrast ${a.contrast}, saturation ${a.saturation}, warm/cool balance ${a.temperature} on a -30 to +30 scale; keep facade material hues credible. ${focus} Optical highlight bloom ${a.bloom}/30, limited to existing brightest light sources. Fine film grain ${a.grain}/20, no loss of material detail. Preserve full resolution and natural texture; no oversharpening, HDR halos, plastic surfaces or cinematic black bars.`;
}
export function gradePixel(r,g,b,value){
 const a=normalizeAtmosphere(value);if(!a)return [r,g,b];const look=LOOKS.find(x=>x.id===a.preset),s=a.strength/100;
 const t=(a.temperature+look.temperature)*s, sat=1+(a.saturation+look.saturation)*s/100, contrast=1+(a.contrast+look.contrast)*s/100;
 const l=.2126*r+.7152*g+.0722*b;
 return [r,g,b].map((v,i)=>Math.max(0,Math.min(255,Math.round(((l+(v-l)*sat)-127.5)*contrast+127.5+(i===0?t:i===2?-t:0)))));
}

export function appendPathPoint(points,cursor){return [...points,{x:cursor.x,y:cursor.y}];}

export function materialTextPrompt(value,options={}){
 const request=String(value||'').trim().slice(0,600);if(!request)invalid('Напишите, что изменить в материале');
 const newMaterial=/(?:^|\s)на\s+(.+)/i.exec(request)?.[1]||'';
 const material=/песчаник|мрамор|травертин|кирпич|планкен|дерев|сланц|гранит|штукатур|бетон|керамогранит|металл|камень|камен|пробк/i.test(newMaterial);
 const colorObject=/(?:замен|поменя)[^.!?]{0,20}(?:цвет|оттенок|тон)\s/i.test(request);
 const replace=material&&!colorObject&&/замен|поменя|облиц|отдел/i.test(request);
 const color=options.editAction==='color'||(/цвет|оттен|перекрас|песоч|беж|сер[аоыуё]|черн|чёрн|бел[аоыу]|графит|коричнев|светл|т[её]мн/i.test(request)&&!replace);
 const selected=options.zoneId&&options.zoneId!=='custom'?String(options.selectedZone||'').slice(0,100):'';
 const hex=/^#[0-9a-f]{6}$/i.test(options.targetColor||'')?options.targetColor:null;
 const explicit=(selected?' Explicitly selected component: '+selected+'. ':'')+(hex&&options.editAction==='color'?'User-selected exact target shade: '+hex+'. Use this color for the named component while retaining its texture. ':'');
 const action=replace?'MATERIAL REPLACEMENT ONLY: change the named surface finish to the explicitly requested new material, preserving the physical surface geometry and all openings.':color?'COLOR ONLY: keep the existing material identity and texture. Recolor only its surface finish; preserve grout layout, relief, tile sizes, roughness and existing construction joints.':'Infer whether the wording requests color only or explicit material replacement. A shade name alone NEVER authorizes changing material or geometry.';
 const clarification=/песоч/i.test(request)?'The Russian shade “песочный/песочная” means a restrained natural sand-beige COLOR, not loose sand, not a new sand surface and not sandstone. Keep existing tile or paving texture and grout.':'';
 return explicit+'SEMANTIC MATERIAL EDIT / NO MANUAL MASK. The original Image 1 is the exact authoritative current photograph. User request in Russian: '+JSON.stringify(request)+'. '+
  'First visually locate the EXISTING surface explicitly named in this request, using object meaning, boundaries, perspective, occlusion and material continuity, never just matching similar pixel colors. The target comes from the user words, not an internal “custom zone” label. Tile / paving means the actual existing tiled surface in the indicated area; do not tint all beige/grey objects in the scene. Apply consistently to the visible connected faces of that named component. '+
  action+' '+clarification+' Preserve source shading and reflections, microtexture, dirt variation, grout and joint geometry, contact shadows, edge bevels and depth. Keep windows, glazing, frames, adjacent walls, roof and vegetation untouched unless the request explicitly names those as the target. Preserve all remaining image regions, sky, season, weather, time, lighting direction, site layout, building dimensions, openings, camera and crop exactly. Do not beautify or redesign the rest of the image. If the named surface is absent, preserve the image instead of inventing it or editing an unrelated surface. If multiple plausible surfaces exist, obey any location qualifier such as terrace, path, floor or wall, and avoid extending to unrelated tiled objects. No text, arrows or comparison collage in output. Output the same full-frame aspect ratio. This is semantic localization, not guaranteed pixel-exact segmentation; the user reviews the result.';
}

export function materialCropPrompt(p){
 if(!p.mask)invalid('Для точной замены нужна маска');
 const b=p.brief||{},instruction=String(p.materialInstruction||'').slice(0,600),name=String(p.materialName||'').slice(0,120);
 const recolor=p.editMode==='recolor';if(recolor&&!/^#[0-9a-f]{6}$/i.test(p.targetColor||''))invalid('Выберите корректный цвет');
 const dimensions=p.materialDimensions&&Number(p.materialDimensions.width)>0?`${Math.min(10000,Number(p.materialDimensions.width))} × ${Math.min(10000,Number(p.materialDimensions.height)||Number(p.materialDimensions.width))} mm`:'';
 return 'LOCAL MASKED MATERIAL EDIT. The PRIMARY IMAGE is a clean SQUARE crop of the existing photograph, centred with neutral padding; return EXACTLY the same square framing, aspect, camera alignment and object positions. Never crop, zoom or expand to context. Only transparent pixels in the PNG mask may change. All opaque mask regions, windows, frames, edges and surrounding materials remain identical. '+
 (recolor?`COLOR ONLY: recolor the masked existing surface to ${p.targetColor}. Preserve original material identity, grain, grout, seams, relief and roughness.`:`Apply ONLY the requested material ${JSON.stringify(name||instruction)} to the selected surface. Use the supplied texture reference for its identity, scale and appearance; it is not the building. `)+
 (instruction?' User instruction scoped to the masked surface: '+JSON.stringify(instruction)+'. ':'')+
 `Texture repeat scale ${String(b.textureScale||'100%').slice(0,20)}; pattern rotation ${String(b.textureRotation||'0°').slice(0,20)}. `+(dimensions?'Physical size of one texture sample: '+dimensions+'. ':'')+
 'Fit texture perspective to each existing facade plane, preserving exact openings, tile and board boundaries where retained, physical shading, contact shadows, highlights and source illumination. Match the SOURCE season, weather, time and lighting exactly. The full-photo reference is only lighting/material context; do not use it as output framing. Keep padding intact. No text, UI, arrows or new architectural details.';
}
