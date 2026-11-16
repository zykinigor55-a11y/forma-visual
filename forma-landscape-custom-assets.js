/* User-supplied landscape objects: metadata is stored in the draft, pixels
 * in the project's IndexedDB media store. No base64 is embedded in localStorage. */
export const CUSTOM_LANDSCAPE_ID='custom-image';
export const CUSTOM_ASSET_LIMIT=12;
export const CUSTOM_REFERENCE_LIMIT=8;
export const CUSTOM_FILE_LIMIT=10*1024*1024;
export function customAssetKey(uuid){
 const clean=String(uuid||'').replace(/-/g,'');
 if(!/^[a-f0-9]{32}$/i.test(clean))throw Error('Не удалось создать номер своего изображения');
 return 'landscape_'+clean.toLowerCase();
}
export function cleanCustomName(value){
 return String(value||'Своё изображение').replace(/[<>\r\n\t"']/g,' ').replace(/\s+/g,' ').trim().slice(0,70)||'Своё изображение';
}
export function validateCustomFile(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Поддерживаются только PNG, JPG и WebP.');
 if(file.size<=0||file.size>CUSTOM_FILE_LIMIT)throw Error('Изображение должно быть не более 10 МБ.');
 return cleanCustomName(file.name.replace(/\.(png|jpe?g|webp)$/i,''));
}
export async function decodeLandscapeFile(file){
 const name=validateCustomFile(file);
 const url=URL.createObjectURL(file);
 try{
  const picture=await new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Не удалось открыть выбранное изображение.'));img.src=url;
  });
  const iw=picture.naturalWidth,ih=picture.naturalHeight;
  if(iw<64||ih<64||iw>12000||ih>12000||iw*ih>70000000)throw Error('Допустимые размеры: от 64 до 12000 пикселей по стороне.');
  const scale=Math.min(1,2048/Math.max(iw,ih)),width=Math.max(1,Math.round(iw*scale)),height=Math.max(1,Math.round(ih*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:true});ctx.clearRect(0,0,width,height);ctx.imageSmoothingQuality='high';ctx.drawImage(picture,0,0,width,height);
  const image=canvas.toDataURL('image/webp',.93);
  if(!image.startsWith('data:image/webp;base64,')||image.length>10*1024*1024)throw Error('Не удалось оптимизировать изображение. Попробуйте меньший файл.');
  return {name,image,width,height,lowResolution:Math.max(iw,ih)<900};
 }finally{URL.revokeObjectURL(url)}
}
export async function makeCustomReferenceBoard(entries,{resolveImage}={}){
 if(!Array.isArray(entries)||!entries.length)return null;
 if(entries.length>CUSTOM_REFERENCE_LIMIT)throw Error('За один AI-рендер можно передать не более 8 разных пользовательских изображений.');
 const w=1024,tile=256,rows=Math.ceil(entries.length/4),c=document.createElement('canvas');c.width=w;c.height=rows*tile;
 const ctx=c.getContext('2d');ctx.fillStyle='#ecebe8';ctx.fillRect(0,0,c.width,c.height);
 const load=async(src)=>await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('Не удалось восстановить свой объект из проекта'));i.src=src;});
 for(let n=0;n<entries.length;n++){
  const e=entries[n],x=(n%4)*tile,y=Math.floor(n/4)*tile;
  const src=typeof resolveImage==='function'?await resolveImage(e.key):e.image;
  if(!src)throw Error('Своё изображение «'+cleanCustomName(e.name)+'» отсутствует в проекте. Загрузите его ещё раз.');
  const img=await load(src),scale=Math.min((tile-28)/img.naturalWidth,(tile-55)/img.naturalHeight);
  ctx.fillStyle='#f7f6f3';ctx.fillRect(x+3,y+3,tile-6,tile-6);
  ctx.drawImage(img,x+(tile-img.naturalWidth*scale)/2,y+7,img.naturalWidth*scale,img.naturalHeight*scale);
  ctx.fillStyle='#24272b';ctx.font='bold 15px Arial';ctx.fillText('REFERENCE '+(n+1),x+12,y+tile-32);
  ctx.fillStyle='#515359';ctx.font='12px Arial';ctx.fillText(cleanCustomName(e.name).slice(0,30),x+12,y+tile-13);
 }
 return c.toDataURL('image/png');
}
