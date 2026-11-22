/* FORMA VISUAL · deterministic architectural presentation sheet.
 * All spatial geometry comes from the source SVG/project, never the AI.
 * A graphic scale represents measured metres; no invented print scale.
 */
import {byId,report} from './forma-landscape-project-core.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('ru-RU',{maximumFractionDigits:2});
const modes={
 presentation:{heading:'ПРЕЗЕНТАЦИОННЫЙ ГЕНПЛАН',subtitle:'Ландшафтная концепция · архитектурная подача',background:'#eeeae2',paper:'#fcfbf7',ink:'#282e2d',accent:'#6b7965',mapFilter:'saturate(.82)'},
 planting:{heading:'ПОСАДОЧНЫЙ ПЛАН',subtitle:'Породный состав и ведомость посадок',background:'#f0efe9',paper:'#ffffff',ink:'#27362d',accent:'#53715b',mapFilter:'saturate(.64) contrast(1.08)'},
 technical:{heading:'ТЕХНИЧЕСКИЙ ГЕНПЛАН',subtitle:'Границы, размеры, материалы и объекты',background:'#f1f0ec',paper:'#ffffff',ink:'#242a2e',accent:'#636b73',mapFilter:'grayscale(.85) contrast(1.16)'}
};
export const PLAN_PRESENTATION_MODES=Object.freeze(Object.keys(modes));
export function professionalPlanMode(value){return PLAN_PRESENTATION_MODES.includes(value)?value:'presentation'}
export function professionalPlanPrompt(input={}){
 const mode=professionalPlanMode(input.presentationMode);
 const site=input.site||{},house=input.house||{};
 const objects=Array.isArray(input.objects)?input.objects:[];
 const counts={};
 for(const item of objects){const catalog=byId(item.catalogId);if(catalog)counts[catalog.name]=(counts[catalog.name]||0)+1;}
 const schedule=Object.entries(counts).slice(0,90).map(([name,count])=>name+' ×'+count).join('; ')||'no planted features';
 const style={
  presentation:'premium editorial landscape architecture presentation board; nuanced watercolour-tinted architectural plan illustration, finely textured organic tree canopy symbols, realistic low-saturation grass and paving material swatches, slight coherent shadows, quiet cream-paper aesthetic, controlled sage green palette, thin graphite outlines',
  planting:'professional planting plan for landscape architects, clean botanical top-view silhouettes with distinct crowns and real species arrangement, botanical group labels, restrained greens, accurate plant grouping, clear paths, sharp legible plant symbols and faint hatching',
  technical:'professional CAD-inspired landscape general arrangement drawing, precise technical lineweight hierarchy and fine hatching for material zones, almost monochrome graphite strokes with muted neutral site materials, no atmospheric aerial photography'
 }[mode];
 return [
  'FORMA VISUAL · PROFESSIONAL LANDSCAPE ARCHITECTURE MASTER PLAN, STRICT TRUE-ORTHOGRAPHIC 90-DEGREE TOP VIEW.',
  'The SOURCE IMAGE is an exact measured planting/site plan. THIS IS NOT A NEW LANDSCAPE DESIGN. Return the same plot at EXACTLY the same framing, pixel-space layout, scale, north direction, building footprint and every already drawn object.',
  'PRESENTATION STYLE: '+style+'. Deliver polished professional architectural design-studio quality suitable for an A3 landscape master plan presentation.',
  'GEOMETRY LOCK (NON-NEGOTIABLE): retain the exact parcel silhouette, measured site '+Number(site.width).toFixed(2)+'m × '+Number(site.height).toFixed(2)+'m, main house footprint '+Number(house.width).toFixed(2)+'m × '+Number(house.height).toFixed(2)+'m, building orientation, count and placement of all paths, paved zones, planting beds, all tree and shrub centres, respective crown diameters, lawn, gravel, bark, water, stones and luminaires. Never add new features, trees or contours; do not crop, perspective-tilt, beautify by rearranging or create fictional planting masses.',
  'EXISTING PLANT SCHEDULE: '+schedule+'. This list is a locked inventory, not a suggestion to add further objects.',
  'Render every grass, stone, paving and mulch type visually distinct and at human scale; planting symbols are species-specific and readable. Preserve empty unplanted zones and any deliberately erased polygons.',
  'Use subtle scale-aware canopy shadows and natural colours ONLY for existing planting. Keep roof graphics clean. Draw as genuine landscape architecture masterplan, NOT 3D aerial photograph or isometric building render.',
  'KEEP TEXT OUT OF THE AI-RENDERED SITE IMAGE. The application adds the exact north arrow, measured graphic scale, title block, plant inventory and legend in a deterministic editable vector layer; never hallucinate illegible captions, fake measurement labels, legends, scale ratios or a second border inside the project frame.',
  'Background should remain continuous, very high visual clarity, clean anti-aliasing, no brand logos, no cropped portion of the lot, no misleading new geometry. The measured project remains the sole source of truth.'
 ].join('\n\n');
}
export function composeProfessionalPlanSheet(sourceSvg,documentModel,requestedMode='presentation'){
 const mode=professionalPlanMode(requestedMode),style=modes[mode],doc=documentModel||{},site=doc.site||{};
 const width=Number(site.width)||30,height=Number(site.height)||40;
 const mapW=1580,mapH=1190,mapX=95,mapY=244;
 const content=String(sourceSvg||'').replace(/^\s*<svg\b[^>]*>/i,'').replace(/<\/svg>\s*$/i,'');
 if(!content||/<!DOCTYPE|<!ENTITY/i.test(content))throw Error('Недопустимое содержимое SVG');
 const mapSvg='<svg xmlns="http://www.w3.org/2000/svg" x="'+mapX+'" y="'+mapY+'" width="'+mapW+'" height="'+mapH+'" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="xMidYMid meet">'+content+'</svg>';
 const metrics=report(doc),catalogue={};
 for(const obj of Array.isArray(doc.objects)?doc.objects:[]){
  const item=byId(obj.catalogId);if(!item)continue;
  if(!catalogue[item.id])catalogue[item.id]={name:item.name,latin:item.latin||'',count:0,color:item.color||'#748875',group:item.group};
  catalogue[item.id].count++;
 }
 const all=Object.values(catalogue).sort((a,b)=>a.group.localeCompare(b.group)||a.name.localeCompare(b.name));
 const plants=all.filter(x=>['trees','shrubs'].includes(x.group)),surfaces=all.filter(x=>!['trees','shrubs'].includes(x.group));
 const listing=(items,offset,limit)=>items.slice(0,limit).map((x,i)=>{
  const y=offset+i*42,area=metrics.areas?.[x.id],length=metrics.lengths?.[x.id];
  const label=Number.isFinite(Number(area))&&area>0?Number(area).toFixed(1)+' м²':
   x.group==='pavers'&&Number.isFinite(Number(length))&&length>0?Number(length).toFixed(1)+' м':
   '× '+x.count;
  return '<rect x="1784" y="'+(y-15)+'" width="15" height="15" rx="3" fill="'+esc(x.color)+'" stroke="'+style.accent+'"/>'+
   '<text x="1814" y="'+(y-5)+'" font-size="19" font-weight="600" fill="'+style.ink+'">'+esc(x.name.length>27?x.name.slice(0,26)+'…':x.name)+'</text>'+
   (x.latin&&['trees','shrubs'].includes(x.group)?'<text x="1814" y="'+(y+15)+'" font-size="14" font-style="italic" fill="'+style.accent+'">'+esc(x.latin.slice(0,45))+'</text>':'')+
   '<text x="2306" y="'+y+'" text-anchor="end" font-size="20" fill="'+style.ink+'">'+esc(label)+'</text>';
 }).join('');
 const metres=[1,2,5,10,20,50,100].filter(x=>x<=width/3&&x<=height/2).at(-1)||1;
 const unit=Math.min(mapW/width,mapH/height),barWidth=metres*unit;
 const north=Number.isFinite(Number(doc.north))?Number(doc.north):0;
 const northStatus=doc.northVerified===true?'СЕВЕР · ПОДТВЕРЖДЁН':'СЕВЕР · УСЛОВНЫЙ';
 const outer='<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1680" viewBox="0 0 2400 1680">'+
 '<rect width="2400" height="1680" fill="'+style.background+'"/>'+
 '<rect x="42" y="42" width="2316" height="1596" fill="'+style.paper+'" stroke="#cbc9c0" stroke-width="2"/>'+
 '<text x="98" y="112" font-size="32" letter-spacing="7" font-weight="700" fill="'+style.ink+'">FORMA VISUAL</text>'+
 '<text x="98" y="175" font-size="51" font-weight="600" fill="'+style.ink+'">'+style.heading+'</text>'+
 '<text x="98" y="213" font-size="22" fill="'+style.accent+'">'+style.subtitle+'</text>'+
 '<rect x="87" y="237" width="1596" height="1204" fill="#eff0eb" stroke="'+style.accent+'" stroke-width="2"/>'+
 '<g style="filter:'+style.mapFilter+'">'+mapSvg+'</g>'+
 '<line x1="1734" y1="247" x2="1734" y2="1430" stroke="#c2c2ba" stroke-width="2"/>'+
 '<text x="1784" y="294" font-size="28" font-weight="700" fill="'+style.ink+'">ЭКСПЛИКАЦИЯ И ПОСАДКИ</text>'+
 '<text x="1784" y="342" font-size="21" fill="'+style.accent+'">Фактические позиции из модели · '+(doc.objects?.length||0)+' объектов</text>'+
 '<line x1="1784" y1="370" x2="2309" y2="370" stroke="'+style.accent+'"/>'+
 '<text x="1784" y="409" font-size="24" font-weight="700" fill="'+style.ink+'">РАСТЕНИЯ</text>'+
 (plants.length?listing(plants,448,13):'<text x="1784" y="448" font-size="21" fill="'+style.accent+'">Посадки отсутствуют</text>')+
 (plants.length>13?'<text x="1784" y="1012" font-size="19" fill="'+style.accent+'">Дополнительно '+(plants.length-13)+' позиций · см. CSV</text>':'')+
 '<line x1="1784" y1="1044" x2="2309" y2="1044" stroke="#bbb"/>'+
 '<text x="1784" y="1086" font-size="24" font-weight="700" fill="'+style.ink+'">ПОКРЫТИЯ И ОБЪЕКТЫ</text>'+
 listing(surfaces,1128,5)+
 (surfaces.length>5?'<text x="1784" y="1375" font-size="19" fill="'+style.accent+'">Ещё '+(surfaces.length-5)+' позиций · см. CSV</text>':'')+
 '<line x1="98" y1="1490" x2="2303" y2="1490" stroke="#bcbcb2" stroke-width="2"/>'+
 '<text x="98" y="1544" font-size="24" font-weight="650" fill="'+style.ink+'">'+esc(doc.title||'Ландшафтный проект')+'</text>'+
 '<text x="98" y="1581" font-size="20" fill="'+style.accent+'">Участок '+fmt(width)+' × '+fmt(height)+' м · масштабная геометрия сохранена</text>'+
 '<g transform="translate(850 1503)"><line x1="0" y1="25" x2="'+barWidth+'" y2="25" stroke="'+style.ink+'" stroke-width="5"/>'+
 '<line x1="0" y1="18" x2="0" y2="32" stroke="'+style.ink+'" stroke-width="4"/>'+
 '<line x1="'+(barWidth/2)+'" y1="18" x2="'+(barWidth/2)+'" y2="32" stroke="'+style.ink+'" stroke-width="3"/>'+
 '<line x1="'+barWidth+'" y1="18" x2="'+barWidth+'" y2="32" stroke="'+style.ink+'" stroke-width="4"/>'+
 '<text x="0" y="59" font-size="20" fill="'+style.ink+'">0</text><text x="'+barWidth+'" y="59" font-size="20" fill="'+style.ink+'" text-anchor="end">'+metres+' м</text></g>'+
 '<g transform="translate(1920 1538) rotate('+(-north)+')"><path d="M0 -50L17 18L0 10L-17 18Z" fill="'+style.ink+'"/></g>'+
 '<text x="1920" y="1595" font-size="17" fill="'+style.accent+'" text-anchor="middle">'+northStatus+'</text>'+
 '<text x="2303" y="1551" font-size="21" fill="'+style.ink+'" text-anchor="end">СХЕМА · '+(mode==='technical'?'ТЕХ.':mode==='planting'?'ПОСАДКИ':'КОНЦЕПЦИЯ')+'</text>'+
 '<text x="2303" y="1590" font-size="19" fill="'+style.accent+'" text-anchor="end">Графическая шкала · не менять пропорции при печати</text>'+
 '</svg>';
 return outer;
}
