export const MAX_IMAGE_BYTES=8*1024*1024;
export function parseImage(value:unknown):{bytes:Uint8Array;mimeType:string;data:string} {
 if(typeof value!=='string'||value.length>Math.ceil(MAX_IMAGE_BYTES*4/3)+128)throw new Error('Изображение должно быть не больше 8 МБ.');
 const m=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!m||m[2].length%4!==0)throw new Error('Загрузите PNG, JPG или WebP.');
 let raw:string;try{raw=atob(m[2]);}catch{throw new Error('Файл повреждён.');}
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(bytes.length>MAX_IMAGE_BYTES||bytes.length<16)throw new Error('Файл слишком большой или повреждён.');
 const png=[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const ascii=(i:number,n:number)=>String.fromCharCode(...bytes.slice(i,i+n));
 const webp=ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP';
 if(!(m[1]==='image/png'&&png||m[1]==='image/jpeg'&&jpeg||m[1]==='image/webp'&&webp))throw new Error('Содержимое не соответствует формату изображения.');
 imageDimensions(bytes,m[1]);
 return {bytes,mimeType:m[1],data:m[2]};
}
export function safeTitle(value:unknown):string {return typeof value==='string'?(value.trim().slice(0,80)||'Новый проект'):'Новый проект';}
export async function readJsonBody(request:Request,max=12*1024*1024):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)throw new Error('Пустой запрос.');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new RangeError('Запрос слишком большой. Максимум изображения — 8 МБ.');}chunks.push(value);}}finally{reader.releaseLock();}
 const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body));
}
export function imageDimensions(bytes:Uint8Array,mime:string):{width:number;height:number}{
 const bad=()=>{throw new Error('Изображение повреждено или имеет неподдерживаемую структуру.');};
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const ascii=(p:number,n:number)=>String.fromCharCode(...bytes.slice(p,p+n));
 let width=0,height=0;
 if(mime==='image/png'){
  let p=8,ihdr=false,idat=false,ended=false;
  while(p+12<=bytes.length){
   const size=view.getUint32(p),kind=ascii(p+4,4);
   if(p+12+size>bytes.length)bad();
   if(!ihdr&&kind!=='IHDR')bad();
   if(kind==='IHDR'){if(ihdr||size!==13)bad();width=view.getUint32(p+8);height=view.getUint32(p+12);ihdr=true;}
   if(kind==='IDAT'&&size>0)idat=true;
   p+=12+size;
   if(kind==='IEND'){if(size!==0||p!==bytes.length)bad();ended=true;break;}
  }
  if(!ihdr||!idat||!ended)bad();
 }else if(mime==='image/jpeg'){
  if(bytes.at(-2)!==255||bytes.at(-1)!==217)bad();
  let p=2,scan=false;
  while(p+3<bytes.length){
   if(bytes[p++]!==255)bad();while(bytes[p]===255)p++;
   const marker=bytes[p++];
   if(marker===218){scan=true;break;}
   if(marker===1||marker>=208&&marker<=217)continue;
   if(p+2>bytes.length)bad();const size=view.getUint16(p);
   if(size<2||p+size>bytes.length)bad();
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
    if(size<8)bad();height=view.getUint16(p+3);width=view.getUint16(p+5);
   }
   p+=size;
  }
  if(!scan)bad();
 }else if(mime==='image/webp'){
  if(view.getUint32(4,true)+8!==bytes.length)bad();
  let p=12,content=false;
  while(p+8<=bytes.length){
   const kind=ascii(p,4),size=view.getUint32(p+4,true),q=p+8;
   if(q+size>bytes.length)bad();
   if(kind==='VP8 '){if(size<10||ascii(q+3,3)!=='\u009d\u0001\u002a')bad();width=view.getUint16(q+6,true)&16383;height=view.getUint16(q+8,true)&16383;content=true;}
   if(kind==='VP8L'){if(size<5||bytes[q]!==47)bad();const bits=view.getUint32(q+1,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;content=true;}
   p=q+size+(size%2);
  }
  if(!content)bad();
 }
 if(!width||!height)bad();
 if(width>16384||height>16384||width*height>32000000)throw new Error('Уменьшите изображение: максимум 32 Мп и 16 384 пикселя по стороне.');
 return {width,height};
}
