// High-end architectural art-direction references. Only verified public Behance projects.
// These are QUALITY REFERENCES, not nearest-neighbour image matches.
// The source image is still used for Google Lens context; a similarity score is never
// allowed to promote catalogue floorplans, Sketchfab models, or low-poly projects.
const KNOWN=[
  {id:'255467603',slug:'The-Understorey',title:'The Understorey',owner:'ANT Archviz',
    mood:'overcast',note:'Мягкий рассеянный свет, зрелые деревья и глубина природного окружения'},
  {id:'254721349',slug:'Dark-Clearing',title:'Dark Clearing',owner:'ANT Archviz',
    mood:'overcast',note:'Тональная глубина и правдоподобное взаимодействие здания с ландшафтом'},
  {id:'255105661',slug:'White-Hollow',title:'White Hollow',owner:'ANT Archviz',
    mood:'overcast',note:'Свет сквозь ветви, многоплановость растительности, детальные фасады'},
  {id:'255105949',slug:'Stillness-in-the-Wild',title:'Stillness in the Wild',owner:'ANT Archviz',
    mood:'sunny',note:'Художественная подача архитектуры и естественного окружения'},
  {id:'245891571',slug:'Modern-Woodland-House',title:'Modern Woodland House',owner:'Anton Moroz',
    mood:'sunny',note:'Премиальная архитектурная визуализация, Corona Renderer'},
  {id:'245285893',slug:'Forest-House-A-Tropical-Modern-Architecture-Archviz',title:'Forest House — Tropical Modern',owner:'Gabriel Gomes',
    mood:'sunny',note:'Реалистичная тропическая растительность, свет, натуральный камень и дерево'},
  {id:'246923201',slug:'Modern-Forest-House',title:'Modern Forest House',owner:'Vadym ArchViz',
    mood:'overcast',note:'Кинематографичный пасмурный день, мокрые фактуры и фотодетали'},
  {id:'242130159',slug:'Forest-House-Photoreal-Architectural-Visualization',title:'Forest House — Photoreal',owner:'Kamila Pająk',
    mood:'overcast',note:'Естественный рассеянный свет, фактуры и реалистичные отражения'},
  {id:'134852707',slug:'CGI-HOUSE-OF-SAND-',title:'House of Sand — morning / overcast / blue hour',owner:'Pedro Gomes Ferreira',
    mood:'morning_blue',note:'Серия профессиональных кадров с рассветом, утром, пасмурным светом и синим часом'},
  {id:'242978607',slug:'Exterior-Blue-Hour',title:'Exterior — Blue Hour',owner:'In Studio LLC',
    mood:'morning_blue',note:'Пример цвета и атмосферы синего часа; для FORMA выбираем именно утренний вариант'},
  {id:'97371063',slug:'Nocturnes-Mirages',title:'Nocturnes & Mirages — Early Dawn',owner:'Bartosz Domiczek',
    mood:'morning_blue',note:'Художественное исследование предрассветного света — вдохновение для света, не геометрии'},
  {id:'255956745',slug:'WHERE-THE-FOREST-HOLDS-THE-HOUSE',title:'Where the Forest Holds the House',owner:'ANT Archviz',
    mood:'sunny',note:'Реалистичная архитектура в лесном рельефе и выразительные светотени'}
];
const CACHE_MS=45*60*1000;
let cache=new Map();

function modeName(mood){
  return mood==='overcast'?'ПАСМУРНЫЙ ДЕНЬ':mood==='morning_blue'?'РАННИЙ СИНИЙ ЧАС':'ДНЕВНОЙ СВЕТ';
}
function selectWorks(mood='auto'){
  if(mood==='sunny'||mood==='overcast'||mood==='morning_blue')
    return KNOWN.filter(x=>x.mood===mood).slice(0,7);
  // balanced, editorial-first: no forced resemblance to uploaded building
  return [KNOWN[0],KNOWN[4],KNOWN[6],KNOWN[8],KNOWN[1],KNOWN[5],KNOWN[9],KNOWN[7]];
}
function officialEmbed(raw,id){
  if(typeof raw!=='string'||raw.length>4000)return null;
  const found=raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if(!found)return null;
  try{
    const url=new URL(found[1].replace(/&amp;/g,'&'),'https://www.behance.net');
    if(url.protocol!=='https:'||url.hostname!=='www.behance.net')return null;
    const regex=new RegExp('^/embed/project/'+id+'(?:/|$)');
    if(!regex.test(url.pathname))return null;
    return url.href;
  }catch{return null;}
}
async function verifiedPublication(x){
  const until=Date.now();
  const old=cache.get(x.id);
  if(old&&old.until>until)return old.item;
  const link='https://www.behance.net/gallery/'+x.id+'/'+x.slug;
  const original={source:x.owner==='ANT Archviz'?'ant':'behance',sourceLabel:x.owner,
    title:x.title,link,description:x.note,mood:x.mood,moodLabel:modeName(x.mood),
    thumbnail:null,embedUrl:null,visualMatch:false,visualVerified:false,
    qualityEditorial:true,selectionBasis:'curated-published-project',
    architectureRelated:true};
  let candidate=original;
  try{
    const endpoint=new URL('https://www.behance.net/services/oembed');
    endpoint.searchParams.set('url',link);
    endpoint.searchParams.set('format','json');
    const response=await fetch(endpoint,{headers:{accept:'application/json'},signal:AbortSignal.timeout(9000)});
    if(response.ok){
      const data=await response.json();
      const author=String(data.author_name||'').toLowerCase();
      const expected=x.owner.toLowerCase();
      // Never label unrelated authors as ANT.
      if(x.owner==='ANT Archviz'&&!author.includes('ant'))throw Error('ANT author mismatch');
      if(author && !author.includes(expected.split(' ')[0]) && x.owner!=='ANT Archviz'){
        // Preserve the verified public project link but don't claim returned embed authenticity.
        throw Error('Author metadata mismatch');
      }
      candidate={...original,embedUrl:officialEmbed(data.html,x.id),
        title:String(data.title||x.title).slice(0,140),
        verifiedOembed:true};
    }
  }catch{
    // Keep publication link; never invent thumbnail or image associated with project.
  }
  cache.set(x.id,{until:Date.now()+CACHE_MS,item:candidate});
  return candidate;
}
export async function editorialReferences(mood='auto'){
  const selected=selectWorks(mood);
  const items=await Promise.all(selected.map(verifiedPublication));
  return {
    works:items,
    mode:mood,
    source:'curated Behance / ANT editorial portfolio',
    message:'Отобраны профессиональные публикации Behance и ANT по уровню художественной подачи, а не по сходству кровли. Содержимое каждого проекта доступно по оригинальной ссылке; авторство и вложенный просмотр подтверждаются через Behance, где это доступно.'
  };
}
export function qualityCatalog(){return KNOWN.map(({id,title,owner,mood})=>({id,title,owner,mood}));}
