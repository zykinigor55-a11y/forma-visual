import {createHash, randomUUID} from 'node:crypto';

const IMAGE_TTL=3*60*1000;
const CACHE_TTL=12*60*1000;
const MAX_IMAGE_BYTES=3*1024*1024;
const ARCHITECTURE=/architect|archviz|architecture|house|home|villa|residen|exterior|building|facade|timber|wooden|cottage|contemporary|modern|дом|фасад|здани|коттедж|вилл|архитект/i;
const PHOTOGRAPHY=/photo|realistic|render|corona|visualization|sunlight|daylight|landscape|archviz|nature|lighting/i;

export function createLensSearcher({serperKey,origin}){
  const photos=new Map(),cache=new Map();
  const base=new URL(origin);
  if(base.protocol!=='https:')throw new Error('Lens requires public HTTPS origin');
  function cleanup(){
    const now=Date.now();
    for(const [key,value] of photos)if(value.until<now)photos.delete(key);
    for(const [key,value] of cache)if(value.until<now)cache.delete(key);
    if(cache.size>60)cache.clear();
    if(photos.size>30)for(const id of [...photos.keys()].slice(0,photos.size-30))photos.delete(id);
  }
  function decode(image){
    const matched=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(image||'');
    if(!matched)throw Object.assign(new Error('Недопустимое изображение.'),{status:400});
    const bytes=Buffer.from(matched[2],'base64'),format=matched[1].toLowerCase();
    if(bytes.length<100||bytes.length>MAX_IMAGE_BYTES)throw Object.assign(new Error('Изображение для Lens больше 3 МБ.'),{status:413});
    if(!(format==='jpeg'&&bytes[0]===255&&bytes[1]===216||
      format==='png'&&bytes[0]===137&&bytes[1]===80||
      format==='webp'&&bytes.toString('ascii',0,4)==='RIFF'))
      throw Object.assign(new Error('Изображение повреждено.'),{status:415});
    return {bytes,format,mime:'image/'+format};
  }
  function serve(req,res,id,ext){
    cleanup();
    const photo=photos.get(id);
    if(!photo||photo.format!==ext){
      res.writeHead(404,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
      return res.end('Image link expired');
    }
    res.writeHead(200,{
      'content-type':photo.mime,'content-length':photo.bytes.length,
      'cache-control':'no-store','referrer-policy':'no-referrer',
      'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'
    });
    return req.method==='HEAD'?res.end():res.end(photo.bytes);
  }
  function normalize(item){
    try{
      const target=new URL(item.link||item.url||'');
      if(target.protocol!=='https:'||target.username||target.password)return null;
      if(/(^|\.)google\./.test(target.hostname.toLowerCase()))return null;
      const host=target.hostname.toLowerCase();
      const isBehance=/(^|\.)behance\.net$/.test(host)&&/^\/gallery\/\d+/.test(target.pathname);
      const title=String(item.title||item.description||'Архитектурная публикация').slice(0,150);
      const source=String(item.source||host).slice(0,80);
      const thumbRaw=item.thumbnailUrl||item.thumbnail||item.imageUrl||item.image||null;
      const thumb=typeof thumbRaw==='string'&&/^https:\/\//i.test(thumbRaw)?thumbRaw:null;
      const relevant=ARCHITECTURE.test(title+' '+source)||isBehance;
      return {source:isBehance?'behance':'lens',
        sourceLabel:isBehance?'Behance':source,
        title,link:target.href,thumbnail:thumb,
        visualMatch:true,visualVerified:false,architectureRelated:relevant,
        selectionBasis:'google-lens-visual-match',description:'Визуальное совпадение Google Lens; качество света не проверено'};
    }catch{return null;}
  }
  async function search(image,progress=()=>{}){
    if(!serperKey)return {available:false,matches:[],method:'google-lens',error:'Нет ключа Serper.'};
    const photo=decode(image);
    cleanup();
    const digest=createHash('sha256').update(photo.bytes).digest('hex');
    const cached=cache.get(digest);
    if(cached&&cached.until>Date.now()){
      progress('ranking',75,'Результаты Google Lens взяты из кэша…');
      return {...cached.value,cached:true};
    }
    const id=randomUUID();
    photos.set(id,{...photo,until:Date.now()+IMAGE_TTL});
    const url=base.origin+'/api/lens-photo/'+id+'.'+(photo.format==='jpeg'?'jpg':photo.format);
    progress('lens',38,'Google Lens ищет реальные страницы с визуально похожей архитектурой…');
    try{
      const response=await fetch('https://google.serper.dev/lens',{
        method:'POST',
        headers:{'X-API-KEY':serperKey,'content-type':'application/json'},
        body:JSON.stringify({url,hl:'en',gl:'us'}),signal:AbortSignal.timeout(45000)
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>({}));
        const reason=String(payload?.message||payload?.error?.message||payload?.error||'').slice(0,130);
        throw new Error('Serper Lens: HTTP '+response.status+(reason?' '+reason:''));
      }
      const body=await response.json();
      const raw=[
        ...(Array.isArray(body.organic)?body.organic:[]),
        ...(Array.isArray(body.visualMatches)?body.visualMatches:[]),
        ...(Array.isArray(body.visual_matches)?body.visual_matches:[]),
        ...(Array.isArray(body.results)?body.results:[])
      ];
      const unique=new Map();
      for(const item of raw){
        const result=normalize(item);
        if(result&&!unique.has(result.link))unique.set(result.link,result);
      }
      const all=[...unique.values()];
      const relevant=all.filter(x=>x.architectureRelated);
      const candidates=relevant.length?relevant:all; // Preserve genuine visual matches even if a page title omits architectural words.
      candidates.sort((a,b)=>{
        const score=x=>(x.source==='behance'?30:0)+(x.thumbnail?8:0)+(PHOTOGRAPHY.test(x.title)?5:0);
        return score(b)-score(a);
      });
      const value={available:true,method:'google-lens',matches:candidates.slice(0,10),
        matchCount:all.length,architectureMatchCount:relevant.length,
        message:candidates.length?
          'Google Lens нашёл визуально похожие архитектурные публикации. Фото и ссылки настоящие; качество света требуется оценить отдельно.':
          'Google Lens не нашёл архитектурных совпадений. Предложим отдельные профессиональные примеры, не выдавая их за поиск по фото.'};
      cache.set(digest,{until:Date.now()+CACHE_TTL,value});
      return value;
    }catch(error){
      return {available:false,matches:[],method:'google-lens',
        error:String(error?.name==='TimeoutError'?'Google Lens превысил время ожидания':error?.message||'Ошибка').slice(0,190)};
    }finally{
      const stored=photos.get(id);
      if(stored)stored.until=Math.min(stored.until,Date.now()+45000);
    }
  }
  return {serve,search};
}
