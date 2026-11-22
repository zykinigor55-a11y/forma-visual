/* Self-contained A4/A3 landscape project album. Measurements come ONLY from the 2D model.
 * Rasterized Cyrillic text ensures reliable browser PDF rendering without a remote font.
 */
import {normalizeProject,report,byId,areaFor,lineLength,rectBoundary,segmentLength} from './forma-landscape-project-core.js';
const WIDTH=595,HEIGHT=842,SCALE=2;
const fmt=x=>Number(x||0).toFixed(2);
const ink='#222527',gold='#a88c64',muted='#666b6c',pale='#f5f4f1';
function text(c,s,x,y,size=10,color=ink,bold=false){
 c.font=(bold?'700 ':'400 ')+size+'px Arial,sans-serif';c.fillStyle=color;c.fillText(String(s??''),x,y);
}
function page(name,description,n){
 const cv=document.createElement('canvas');cv.width=WIDTH*SCALE;cv.height=HEIGHT*SCALE;
 const c=cv.getContext('2d',{alpha:false});c.scale(SCALE,SCALE);
 c.fillStyle='#ffffff';c.fillRect(0,0,WIDTH,HEIGHT);c.fillStyle=ink;c.fillRect(0,0,WIDTH,10);
 text(c,'F O R M A',38,43,20,ink,true);
 text(c,'ЛАНДШАФТНЫЙ ПРОЕКТ',377,43,9,gold,true);
 c.fillStyle='#deddd8';c.fillRect(38,57,519,1);
 text(c,name,38,92,22,ink,true);text(c,description,38,111,10,muted);
 c.fillStyle='#deddd8';c.fillRect(38,791,519,1);
 text(c,'FORMA VISUAL · 2D-модель — источник размеров',38,808,8,muted);
 text(c,'Лист '+n,515,808,8,muted);
 return {cv,c};
}
function warning(c,verified,y=752){
 c.fillStyle=pale;c.fillRect(38,y-17,519,29);
 text(c,verified?'Размеры подтверждены пользователем.':'Предварительные размеры · масштаб не подтверждён',47,y,10,verified?ink:'#9a6743',true);
}
async function picture(c,url,x,y,w,h){
 if(!url)return;
 const img=new Image();img.src=url;
 try{await new Promise((ok,fail)=>{if(img.complete&&img.naturalWidth)return ok();img.onload=ok;img.onerror=fail});}
 catch{return;}
 const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight);
 const dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;
 c.fillStyle='#ecece8';c.fillRect(x,y,w,h);
 c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function table(c,heads,rows,y=152){
 const widths=heads.map(h=>h[1]),total=widths.reduce((a,b)=>a+b,0);
 c.fillStyle=ink;c.fillRect(38,y,519,27);
 let x=38;heads.forEach((h,i)=>{text(c,h[0],x+8,y+18,8,'#ffffff',true);x+=519*widths[i]/total;});
 let yy=y+27;
 rows.slice(0,20).forEach((row,k)=>{
  c.fillStyle=k%2?pale:'#ffffff';c.fillRect(38,yy,519,27);
  let xx=38;row.forEach((v,i)=>{const width=519*widths[i]/total;
   const value=String(v??'');
   c.font='9px Arial';c.fillStyle=ink;
   const available=width-16;
   if(c.measureText(value).width>available&&value.includes(' ')){
    const words=value.split(' ');let split=1;
    while(split<words.length-1&&c.measureText(words.slice(0,split+1).join(' ')).width<=available)split++;
    c.fillText(words.slice(0,split).join(' '),xx+8,yy+11,available);
    c.fillText(words.slice(split).join(' '),xx+8,yy+22,available);
   }else c.fillText(value,xx+8,yy+18,available);
   xx+=width;
  });c.fillStyle='#e1dfd9';c.fillRect(38,yy+27,519,.5);yy+=27;
 });
}
function jpeg(c){
 const b64=c.toDataURL('image/jpeg',.85).split(',')[1],str=atob(b64),out=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i);
 return out;
}
export const landscapePaperSize=(format='A4')=>format==='A3'?{width:842,height:1191}:{width:595,height:842};
function assemble(images,format='A4'){
 const {width:pageW,height:pageH}=landscapePaperSize(format);
 const encode=new TextEncoder(),parts=[],offset=[0];let length=0;
 const add=b=>{parts.push(b);length+=b.byteLength};
 const put=s=>add(encode.encode(s));
 const obj=(id,fn)=>{offset[id]=length;put(id+' 0 obj\n');fn();put('\nendobj\n')};
 put('%PDF-1.4\n%FOR\n');
 obj(1,()=>put('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>put('<< /Type /Pages /Count '+images.length+' /Kids ['+images.map((_,i)=>(5+3*i)+' 0 R').join(' ')+'] >>'));
 images.forEach((im,i)=>{
  const imageId=3+3*i,contentId=4+3*i,pageId=5+3*i;
  obj(imageId,()=>{put('<< /Type /XObject /Subtype /Image /Width '+(WIDTH*SCALE)+' /Height '+(HEIGHT*SCALE)+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+im.length+' >>\nstream\n');add(im);put('\nendstream')});
  const draw='q '+pageW+' 0 0 '+pageH+' 0 0 cm /I'+i+' Do Q\n';
  obj(contentId,()=>put('<< /Length '+encode.encode(draw).length+' >>\nstream\n'+draw+'endstream'));
  obj(pageId,()=>put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pageW+' '+pageH+'] /Resources << /XObject << /I'+i+' '+imageId+' 0 R >> >> /Contents '+contentId+' 0 R >>'));
 });
 const xref=length,count=3+images.length*3;
 put('xref\n0 '+count+'\n0000000000 65535 f \n');
 for(let i=1;i<count;i++)put(String(offset[i]).padStart(10,'0')+' 00000 n \n');
 put('trailer\n<< /Size '+count+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 return new Blob(parts,{type:'application/pdf'});
}
const chunks=(arr,n=19)=>arr.length?Array.from({length:Math.ceil(arr.length/n)},(_,i)=>arr.slice(i*n,(i+1)*n)):[];
const groups={
 trees:'Деревья',shrubs:'Кустарники',pavers:'Дорожки и мощение',fills:'Отсыпки и мульча',
 lawns:'Газоны',ponds:'Водоёмы',lights:'Светильники',boulders:'Камни'
};
const buildings={house:'Дом',bath:'Баня',garage:'Гараж',gazebo:'Беседка',outbuilding:'Хозпостройка',greenhouse:'Теплица',carport:'Навес'};
export async function buildLandscapeAlbum(project,planImage,aiImage=null,{format='A4',nightImage=null}={}){
 const d=normalizeProject(project),summary=report(d),images=[];
 const push=(name,sub)=>page(name,sub,images.length+1);
 const add=p=>{warning(p.c,d.verified);images.push(jpeg(p.cv));};
 const entries=d.objects.flatMap((item,index)=>{
  const entry=byId(item.catalogId);
  return entry?[{item,entry,number:index+1}]:[];
 });
 const sections=(name,sub,heads,rows)=>{
  for(const [index,group] of chunks(rows).entries()){
   const p=push(name+(index?' · '+(index+1):''),sub);
   table(p.c,heads,group);
   add(p);
  }
 };
 const cover=push('Ландшафтный проект','Генплан, размеры и спецификации участка');
 text(cover.c,d.title,38,167,24,ink,true);
 text(cover.c,'Площадь участка '+fmt(summary.siteArea)+' м²',38,200,14,gold,true);
 text(cover.c,'Габариты '+fmt(d.site.width)+' × '+fmt(d.site.height)+' м',38,224,12);
 text(cover.c,'Объектов '+d.objects.length+' · Строений '+(d.buildings.length+1),38,248,11);
 await picture(cover.c,planImage,38,270,519,433);add(cover);
 const plan=push('Генеральный план · вид сверху','Размерная схема. Номера объектов соответствуют ведомостям.');
 await picture(plan.c,planImage,38,135,519,555);
 text(plan.c,'Периметр участка '+fmt(summary.sitePerimeter)+' м',38,715,11);
 add(plan);
 const boundary=d.site.boundary||rectBoundary(d.site.width,d.site.height);
 sections('Границы участка','Вершины контура и длины сторон в метрах',
  [['Сторона',82],['Начало X / Y',160],['Конец X / Y',160],['Длина, м',105]],
  boundary.map((point,i)=>{
   const next=boundary[(i+1)%boundary.length];
   return [(i+1)+' → '+((i+1)%boundary.length+1),fmt(point.x)+' / '+fmt(point.y),fmt(next.x)+' / '+fmt(next.y),fmt(segmentLength(point,next))];
  }));
 sections('Строения','Габариты, положение и ориентация в координатах проекта',
  [['Строение',145],['X / Y, м',136],['Ширина × глубина, м',151],['Поворот',80]],
  [d.house,...d.buildings].map(b=>[buildings[b.type]||'Постройка',fmt(b.x)+' / '+fmt(b.y),fmt(b.width)+' × '+fmt(b.height),fmt(b.rotation)+'°']));
 for(const [group,title] of Object.entries(groups)){
  const items=entries.filter(x=>x.entry.group===group);
  if(!items.length)continue;
  const counts=new Map();
  for(const {entry} of items){
   const count=counts.get(entry.id)||{entry,n:0};
   count.n++;counts.set(entry.id,count);
  }
  const plants=group==='trees'||group==='shrubs',areas=['pavers','fills','lawns','ponds'].includes(group);
  const total='Всего '+items.length+' шт. · позиций '+counts.size;
  const inventory=[...counts.values()].sort((a,b)=>a.entry.name.localeCompare(b.entry.name,'ru'));
  sections('Ведомость · '+title,total,
   [['Название по каталогу',215],[plants?'Ботаническое название':areas?'Площадь / длина':'',220],['Кол-во, шт.',77]],
   inventory.map(({entry,n})=>{
    const net=summary.areas[entry.id],length=summary.lengths[entry.id];
    return [entry.name,plants?(entry.latin||'—'):areas?[net==null?'':fmt(net)+' м²',length==null?'':fmt(length)+' м'].filter(Boolean).join(' / '):'',n];
   }));
  if(areas){
   sections(title+' · размеры','По каждому объекту. Площадь контура может включать пересечения.',
    [['№',38],['Материал / объект',223],['Длина / ширина, м',145],['Площадь, м²',100]],
    items.map(({item,entry,number})=>[number,entry.name,
     group==='pavers'||item.geometry==='strip'?fmt(lineLength(item.points))+' / '+fmt(item.width):'—',fmt(areaFor(d,item))]));
  }else{
   sections(title+' · размещение','Координаты и размеры каждого объекта по номеру на плане',
    [['№',38],['Название по каталогу',191],['X / Y, м',132],[plants?'Крона, м':'Диаметр, м',80],['Высота, м',78]],
    items.map(({item,entry,number})=>[number,entry.name,fmt(item.x)+' / '+fmt(item.y),
     item.diameter>0?fmt(item.diameter):'—',item.height>0?fmt(item.height):'—']));
  }
 }
 if(aiImage){
  const p=push('Вид сверху · летний день','Справочное изображение. Размеры указаны на генеральном плане.');
  await picture(p.c,aiImage,38,139,519,562);add(p);
 }
 if(nightImage){
  const p=push('Вид сверху · ночное освещение','Фотореалистичное представление размещённого освещения.');
  await picture(p.c,nightImage,38,139,519,562);add(p);
 }
 return assemble(images,format);
}
