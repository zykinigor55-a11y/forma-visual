/* Procedural landscape tools: no placeholder low-res PNGs.
   The UI draws accurate editable vectors; image AI rebuilds real volumetric scene effects. */
export const SPECIAL_LANDSCAPE_TOOLS=Object.freeze([
 {id:'ivy',kind:'climber',group:'climber',name:'Плющ',description:'Вечнозелёный плющ по стене',prompt:'Hedera helix English ivy growing as a genuinely climbing woody vine across the exact user-painted WALL/GARDEN STRUCTURE PATH: fine adventitious rootlets grip mortar/wood/stone, branching thin stems, distinct glossy lobed leaves at multiple distances, truthful occlusion of facade texture; keep windows, doors, gutters, roof and all structural geometry unobstructed; never float a flat green sticker on glass.',color:'#4c7259'},
 {id:'virginia-creeper',kind:'climber',group:'climber',name:'Девичий виноград',description:'Пятилисточковый, осенью краснеет',prompt:'Parthenocissus quinquefolia climbing vine attached to the selected facade or trellis, accurate compound five-leaflet leaves, delicate attached stems and tendrils; match season (green summer, crimson autumn, leafless winter), physically follow perspective and architectural edges, no generic green texture.',color:'#7f8060'},
 {id:'clematis',kind:'climber',group:'climber',name:'Клематис',description:'Вьющееся цветущее растение',prompt:'Clematis climbing flowering vine with slender wrapping stems and season-accurate leaves and restrained violet-white flowers; attached to the explicitly painted pergola/trellis line with correct botanical branching, depth and real cast shadows.',color:'#818b71'},
 {id:'climbing-rose',kind:'climber',group:'climber',name:'Плетистая роза',description:'Тонкие побеги и цветы',prompt:'Climbing Rosa shrub supported by the designated garden trellis or pergola, long woody canes, small leaflets, realistic occasional pink-white flowers at appropriate season and plant density, original support remains intact and visible.',color:'#957f76'},
 {id:'hops',kind:'climber',group:'climber',name:'Хмель',description:'Мягкая плотная зелень',prompt:'Humulus lupulus hop bines that spiral around the selected cable/trellis, correctly lobed leaves with delicate hop cones in late summer, attached roots and realistic shadow separation.',color:'#708356'},
 {id:'garland-fairy',kind:'garland',group:'light',name:'Микрогирлянда',description:'Тонкий тёплый провод · точки',prompt:'Extremely slender dark wire garland draped along the user-specified 3D tree branches or architectural anchor path, miniature warm-white 2700K LED pinlights spaced regularly, clearly supported by visible twigs or hanging points, natural gravity sag, real micro-reflections and faint bloom at dusk only; in daytime nearly invisible, NOT an illuminated golden drawn line.',color:'#d1a26f'},
 {id:'garland-festoon',kind:'garland',group:'light',name:'Ретролампы',description:'Лампы на тросе · провисание',prompt:'Realistic outdoor festoon string of small glass vintage warm 2400K bulbs with thin visible suspended cable, user-marked anchor points and believable downward catenary sag, correct perspective, no impossible unsupported wires or huge oversized bulbs, subtle localized practical-light halos only at night.',color:'#c69a69'},
 {id:'garland-icicle',kind:'garland',group:'light',name:'Гирлянда-сосульки',description:'Тонкие вертикальные подвесы',prompt:'Decorative icicle string lights attached along exactly the selected pergola/eaves/branches curve, fine primary cable with delicate short hanging vertical LED threads, discrete warm-white points and gravity-aligned lengths; physically plausible fasteners and minimal controlled glow.',color:'#bbc4ca'},
 {id:'garland-cool',kind:'garland',group:'light',name:'Холодная нить',description:'Миниатюрные холодно-белые огни',prompt:'Very thin dark green fine-wire LED string attached along the user-marked branch curve; tiny discreet cool-white 5000K bulbs at correct scale, physically supported, plausible glow ONLY in blue-hour and night scenes.',color:'#9daeb5'},
 {id:'leaf-mixed',kind:'scatter',group:'leaves',name:'Смешанная листва',description:'Разноразмерный листовой опад',prompt:'Scatter physically real autumn leaf litter over the user's BRUSHED GROUND PATCH ONLY: irregular dry and semi-damp assorted native leaves, correct physical scale, bent edges, occasional partial grass burial, variation in orientation and realistic contact shadows; no uniform carpet or floating leaves.',color:'#947753'},
 {id:'leaf-oak',kind:'scatter',group:'leaves',name:'Дубовые листья',description:'Фактурный коричневый лист',prompt:'A sparse to medium distribution of individual Quercus robur fallen oak leaves with correct lobed leaf morphology, varying curl and natural russet-brown shades, grounded in selected grass or paving area.',color:'#8d6748'},
 {id:'leaf-maple',kind:'scatter',group:'leaves',name:'Кленовые листья',description:'Золотистые и красные',prompt:'Scattered fallen Acer platanoides maple leaves with correctly pointed lobes, variable orange, pale yellow, burgundy and brown seasonal tones, realistic contact and occlusion in user-selected ground area.',color:'#ae7950'},
 {id:'leaf-birch',kind:'scatter',group:'leaves',name:'Берёзовые листья',description:'Мелкая золотистая россыпь',prompt:'Tiny individual Betula pendula fallen birch leaves with real serrated oval shape, yellow-ochre tones, partially nestled in grass, located ONLY inside specified ground mask.',color:'#b7a06e'},
 {id:'snow-dusting',kind:'scatter',group:'snow',name:'Лёгкий снег',description:'Тонкий природный слой',prompt:'Light natural snow dusting on precisely selected ground or plant surfaces, physically settles on upward-facing facets with fine granular crystals, original ground and plant details still visible through thin discontinuous snow.',color:'#c7d2d6'},
 {id:'snow-cover',kind:'scatter',group:'snow',name:'Свежий снег',description:'Мягкий снежный покров',prompt:'Natural fresh powder snow settling in the painted region; true subtle micro-relief, coherent snowpack edges, fine wind-shaped texture and physically plausible contact, with crisp architectural surfaces, original paths and geometry unaltered.',color:'#e0e4e5'},
 {id:'snow-drifts',kind:'scatter',group:'snow',name:'Сугробы',description:'У бордюров и ограждений',prompt:'Natural uneven winter snowdrifts accumulated along the specifically painted ground boundaries and already-existing landscape edges, credible wind deposition, softened layered mound contours, original ground level and hardscape locations unchanged.',color:'#c4d1d9'},
 {id:'snow-frost',kind:'scatter',group:'snow',name:'Иней',description:'На ветвях, камнях и траве',prompt:'Localized fine hoarfrost on painted EXISTING branches, plant stems or stones only, tiny crystalline deposits following the actual surface normals, no complete fake white outlines, retain original silhouette.',color:'#cbd5d8'},
 {id:'snow-cleared',kind:'scatter',group:'snow',name:'Расчищенная дорожка',description:'Следы уборки и снег по краям',prompt:'Realistic cleared snow on an EXISTING walkway precisely inside the selection, retaining all original path stones or paving, subtle scraped damp exposed paving and displaced low snow edge, no new paths or geometry.',color:'#aebdc3'},
 {id:'pine-litter',kind:'scatter',group:'details',name:'Хвоя и шишки',description:'Под соснами и елями',prompt:'Naturally scattered fallen dry pine needles, a few small realistic pine cones and tiny fine sticks in the painted forest-floor area, physically correct size and no heavy fake texture repetition.',color:'#8b795b'},
 {id:'moss',kind:'scatter',group:'details',name:'Мох и патина',description:'В швах и на камне',prompt:'Localized botanical moss and restrained natural patina only on painted plausibly moist cracks of existing stones or between paving joints; subtle 3D tufts, original masonry edges visible, no redesign.',color:'#5f7f5d'},
 {id:'puddles',kind:'scatter',group:'details',name:'Лужи',description:'Небольшие природные отражения',prompt:'Shallow physically plausible puddles only in selected ground depressions on existing paved surface, accurate mirror-like reflections matching existing sky and nearby objects, damp rim and fine contact; no new pond, no flood, no impossible reflections.',color:'#81949a'},
 {id:'damp-grass',kind:'scatter',group:'details',name:'Влажный газон',description:'Роса · насыщенный цвет травы',prompt:'Local physically realistic dampness and tiny dewdrops on already existing lawn blades in painted patch, coherent darkened color and occasional natural low specular highlight, do not replace or move grass or soil.',color:'#748a62'}
]);
const index=new Map(SPECIAL_LANDSCAPE_TOOLS.map(x=>[x.id,x]));
export const specialById=id=>index.get(id)||null;
export const specialForGroup=group=>SPECIAL_LANDSCAPE_TOOLS.filter(x=>x.group===group);
export const isCurveKind=k=>k==='climber'||k==='garland';
export const isBrushKind=k=>k==='scatter'||k==='fill';
export function curvePath(points,tension=.7){
 if(!Array.isArray(points)||points.length===0)return '';
 const p=points.map(v=>({x:v.x*1000,y:v.y*1000}));
 if(p.length===1)return 'M'+p[0].x+' '+p[0].y;
 let s='M'+p[0].x+' '+p[0].y;
 const t=Math.max(0,Math.min(1,Number(tension)||0));
 for(let i=0;i<p.length-1;i++){
  const a=p[Math.max(0,i-1)],b=p[i],c=p[i+1],d=p[Math.min(p.length-1,i+2)];
  const cp1={x:b.x+(c.x-a.x)*t/6,y:b.y+(c.y-a.y)*t/6};
  const cp2={x:c.x-(d.x-b.x)*t/6,y:c.y-(d.y-b.y)*t/6};
  s+=' C'+cp1.x+' '+cp1.y+' '+cp2.x+' '+cp2.y+' '+c.x+' '+c.y;
 }
 return s;
}
export function pointOnPolyline(points,ratio){
 const coords=points.map(p=>({x:p.x,y:p.y}));
 if(!coords.length)return {x:0,y:0};
 if(coords.length===1)return coords[0];
 const ds=coords.slice(1).map((p,i)=>Math.hypot(p.x-coords[i].x,p.y-coords[i].y)),total=ds.reduce((a,b)=>a+b,0)||1;
 let left=Math.min(1,Math.max(0,ratio))*total;
 for(let i=0;i<ds.length;i++){if(left<=ds[i]){const t=ds[i]?left/ds[i]:0;return {x:coords[i].x+(coords[i+1].x-coords[i].x)*t,y:coords[i].y+(coords[i+1].y-coords[i].y)*t};}left-=ds[i];}
 return coords[coords.length-1];
}
