/* Self-contained A4/A3 landscape project album. Measurements come ONLY from the 2D model.
 * Rasterized Cyrillic text ensures reliable browser PDF rendering without a remote font.
 */
import {normalizeProject,report,byId} from './forma-landscape-project-core.js';
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
   let s=String(v??'');c.font='9px Arial';while(s.length>1&&c.measureText(s).width>width-16)s=s.slice(0,-2)+'…';
   text(c,s,xx+8,yy+18,9);xx+=width;
  });c.fillStyle='#e1dfd9';c.fillRect(38,yy+27,519,.5);yy+=27;
 });
}
function jpeg(c){
 const b64=c.toDataURL('image/jpeg',.85).split(',')[1],str=atob(b64),out=new Uint8Array(str.length);
 for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i);
 return out;
}
export const landscapePaperSize=(format='A4')=>format==='A3'?{width:842,height:1191}:{width:595,height:842};
function assemble(canvases,format='A4'){
 const {width:pageW,height:pageH}=landscapePaperSize(format);
 const encode=new TextEncoder(),parts=[],offset=[0];let length=0;
 const add=b=>{parts.push(b);length+=b.byteLength};
 const put=s=>add(encode.encode(s));
 const obj=(id,fn)=>{offset[id]=length;put(id+' 0 obj\n');fn();put('\nendobj\n')};
 put('%PDF-1.4\n%FOR\n');
 obj(1,()=>put('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>put('<< /Type /Pages /Count '+canvases.length+' /Kids ['+canvases.map((_,i)=>(5+3*i)+' 0 R').join(' ')+'] >>'));
 canvases.forEach((canvas,i)=>{
  const im=jpeg(canvas),imageId=3+3*i,contentId=4+3*i,pageId=5+3*i;
  obj(imageId,()=>{put('<< /Type /XObject /Subtype /Image /Width '+(WIDTH*SCALE)+' /Height '+(HEIGHT*SCALE)+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+im.length+' >>\nstream\n');add(im);put('\nendstream')});
  const draw='q '+pageW+' 0 0 '+pageH+' 0 0 cm /I'+i+' Do Q\n';
  obj(contentId,()=>put('<< /Length '+encode.encode(draw).length+' >>\nstream\n'+draw+'endstream'));
  obj(pageId,()=>put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pageW+' '+pageH+'] /Resources << /XObject << /I'+i+' '+imageId+' 0 R >> >> /Contents '+contentId+' 0 R >>'));
 });
 const xref=length,count=3+canvases.length*3;
 put('xref\n0 '+count+'\n0000000000 65535 f \n');
 for(let i=1;i<count;i++)put(String(offset[i]).padStart(10,'0')+' 00000 n \n');
 put('trailer\n<< /Size '+count+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
 return new Blob(parts,{type:'application/pdf'});
}
const chunks=(arr,n=19)=>arr.length?Array.from({length:Math.ceil(arr.length/n)},(_,i)=>arr.slice(i*n,(i+1)*n)):[];
export async function buildLandscapeAlbum(project,planImage,aiImage=null,{format='A4'}={}){
 const d=normalizeProject(project),summary=report(d),canvases=[],push=(name,sub)=>page(name,sub,canvases.length+1);
 const cover=push('Ландшафтный проект','Комплект генплана и спецификаций');
 text(cover.c,d.title,38,177,24,ink,true);
 text(cover.c,'Площадь участка '+fmt(summary.siteArea)+' м²',38,208,14,gold,true);
 text(cover.c,'Габариты '+fmt(d.site.width)+' × '+fmt(d.site.height)+' м',38,235,12);
 text(cover.c,'Объектов '+d.objects.length+' · Строений '+(d.buildings.length+1),38,260,11);
 await picture(cover.c,planImage,38,287,519,414);warning(cover.c,d.verified);canvases.push(cover.cv);
 const plan=push('Генеральный план · вид сверху','Границы, строения, растения, покрытия и освещение');
 await picture(plan.c,planImage,38,139,519,550);
 text(plan.c,'Периметр участка: '+fmt(summary.sitePerimeter)+' м',38,717,11);
 warning(plan.c,d.verified);canvases.push(plan.cv);
 const trees=d.objects.filter(x=>['trees','shrubs'].includes(byId(x.catalogId)?.group));
 for(const group of chunks(trees,19)){
  const p=push('Дендроплан','Координаты центров и диаметры крон (в метрах)');
  const rows=group.map(o=>[trees.indexOf(o)+1,byId(o.catalogId)?.name,fmt(o.x)+' / '+fmt(o.y),fmt(o.diameter)]);
  table(p.c,[['№',38],['Растение',230],['X / Y',139],['Крона',95]],rows);
  text(p.c,'Всего растений: '+trees.length+' шт.',38,716,11,ink,true);
  warning(p.c,d.verified);canvases.push(p.cv);
 }
 if(trees.length){
  const species=new Map();
  for(const o of trees){
   const entry=byId(o.catalogId);if(!entry)continue;
   const row=species.get(entry.id)||{name:entry.name,latin:entry.latin||'—',count:0,diameter:entry.diameter||0};
   row.count++;species.set(entry.id,row);
  }
  for(const group of chunks([...species.values()],19)){
   const p=push('Ведомость растений','Породы, ботанические наименования и количество');
   table(p.c,[['Название',160],['Латинское наименование',190],['Кол-во',60],['Крона, м',85]],
    group.map(o=>[o.name,o.latin,o.count,fmt(o.diameter)]));
   warning(p.c,d.verified);canvases.push(p.cv);
  }
 }
 const surfaces=Object.entries(summary.areas).map(([id,a])=>[byId(id)?.name,fmt(a)+' м²',summary.lengths[id]==null?'—':fmt(summary.lengths[id])+' м']);
 for(const group of chunks(surfaces,19)){
  const p=push('Покрытия и водоёмы','Чистые площади без двойного учёта наложений');
  table(p.c,[['Материал',295],['Площадь',115],['Длина',105]],group);
  text(p.c,summary.areaPrecision==='polygon'?'Пересечения учтены; скругления дорожек приближённые.':'Сложные пересечения: численный расчёт площади.',38,716,10,muted);
  warning(p.c,d.verified);canvases.push(p.cv);
 }
 const lamps=d.objects.filter(x=>byId(x.catalogId)?.group==='lights');
 if(lamps.length)for(const group of chunks(lamps,19)){
  const p=push('План освещения','Все размещённые светильники, типы и координаты');
  table(p.c,[['№',38],['Светильник',235],['X / Y',139],['Шт.',90]],group.map(o=>[lamps.indexOf(o)+1,byId(o.catalogId)?.name,fmt(o.x)+' / '+fmt(o.y),1]));
  text(p.c,'Всего светильников: '+lamps.length+' шт.',38,716,11,ink,true);
  warning(p.c,d.verified);canvases.push(p.cv);
 }
 if(aiImage){
  const p=push('Фотореалистичный генплан','AI-изображение справочное, не предназначено для измерений');
  await picture(p.c,aiImage,38,139,519,562);
  warning(p.c,d.verified);canvases.push(p.cv);
 }
 return assemble(canvases,format);
}
