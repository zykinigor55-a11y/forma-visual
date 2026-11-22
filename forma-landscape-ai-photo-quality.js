/* FORMA AI: fast, honest quality check of photo output and WebGL reference.
 * Operates on 96x96 thumbnail pixels. It cannot score photorealism and must
 * NEVER silently trigger another chargeable image-provider request.
 */
export function inspectRenderImagePixels(imageData,{season='summer'}={}){
 const width=Math.max(0,Math.round(Number(imageData?.width)||0)),
  height=Math.max(0,Math.round(Number(imageData?.height)||0)),
  bytes=imageData?.data;
 if(width<16||height<16||!bytes||bytes.length<width*height*4)
  return {ok:false,reason:'Не удалось проверить целостность кадра'};
 let total=0,pale=0,nearWhite=0,transparent=0,uniform=0;
 const firstY=Math.floor(height*.74);
 let prior=null;
 for(let y=firstY;y<height;y++){
  for(let x=0;x<width;x++){
   const i=(y*width+x)*4,r=bytes[i],g=bytes[i+1],b=bytes[i+2],a=bytes[i+3];
   total++;
   if(a<16)transparent++;
   if(r>246&&g>246&&b>246&&a>245)nearWhite++;
   if(r>234&&g>234&&b>234&&Math.max(r,g,b)-Math.min(r,g,b)<12)pale++;
   if(prior&&Math.abs(r-prior[0])+Math.abs(g-prior[1])+Math.abs(b-prior[2])<6)uniform++;
   prior=[r,g,b];
  }
 }
 const whiteFraction=nearWhite/Math.max(1,total),
  transparentFraction=transparent/Math.max(1,total),
  nearlyUniformFraction=uniform/Math.max(1,total);
 // Snow in an intentionally winter scene may legitimately be white.
 const suspicious=season!=='winter'&&whiteFraction>.91&&nearlyUniformFraction>.90;
 const missing=transparentFraction>.60;
 return {ok:!suspicious&&!missing,
  whiteFraction:Math.round(whiteFraction*1000)/1000,
  transparentFraction:Math.round(transparentFraction*1000)/1000,
  nearlyUniformFraction:Math.round(nearlyUniformFraction*1000)/1000,
  reason:missing?'Нижняя часть кадра прозрачная или не отрисовалась':
   suspicious?'Нижняя четверть кадра почти полностью белая и пустая':
   'Нижняя часть кадра содержит данные изображения'};
}
export async function inspectRenderDataURL(dataUrl,{season='summer'}={}){
 if(typeof document==='undefined'||typeof Image==='undefined'||!String(dataUrl).startsWith('data:image/'))
  return {ok:false,reason:'Изображение недоступно для проверки'};
 try{
  const image=new Image();
  image.src=dataUrl;
  if(image.decode)await image.decode();
  else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject});
  const canvas=document.createElement('canvas');
  canvas.width=96;canvas.height=96;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw Error('Canvas context missing');
  context.drawImage(image,0,0,96,96);
  return inspectRenderImagePixels(context.getImageData(0,0,96,96),{season});
 }catch(e){
  return {ok:false,reason:'Проверка изображения завершилась ошибкой: '+String(e?.message||e)};
 }
}
