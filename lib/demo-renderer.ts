import {getDemoPlan,demoSignature} from './demo';
import {type Settings} from './prompts';
import {recolorFacade} from './demo-facade';
import {applyWeatherMaterial,applyWeatherLighting,houseOutline} from './demo-weather';

const cache=new Map<string,Promise<HTMLImageElement>>();
function load(url:string){let p=cache.get(url);if(!p){p=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{cache.delete(url);reject(new Error('Не удалось загрузить изображение примера.'));};image.src=url;});}cache.delete(url);cache.set(url,p);if(cache.size>8){const oldest=cache.keys().next().value;if(oldest)cache.delete(oldest);}return p;}
type Point=readonly[number,number];
const outline=houseOutline;
function polygon(ctx:CanvasRenderingContext2D,points:readonly Point[],w:number,h:number){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();}
function random(seed:number){let n=seed;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export async function renderDemo(canvas:HTMLCanvasElement,input:unknown,thumbnail=false):Promise<string>{
 const plan=getDemoPlan(input),s=plan.settings;
 const photoWeather=!!plan.weatherBaseUrl,lit=s.time==='evening'||s.time==='night';
 const [house,background,weatherHouse,weatherBackground,dayHouse,dayBackground,reference]=await Promise.all([
  load(plan.baseUrl),plan.backgroundUrl&&(!photoWeather||lit)?load(plan.backgroundUrl):Promise.resolve(null),
  plan.weatherBaseUrl?load(plan.weatherBaseUrl):Promise.resolve(null),plan.weatherBackgroundUrl?load(plan.weatherBackgroundUrl):Promise.resolve(null),
  photoWeather?load(plan.dayBaseUrl):Promise.resolve(null),photoWeather&&lit&&plan.dayBackgroundUrl?load(plan.dayBackgroundUrl):Promise.resolve(null),
  photoWeather?load(plan.referenceBaseUrl):Promise.resolve(null),
 ]);
 const w=thumbnail?360:1448,h=w*.75;canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Браузер не поддерживает просмотр изображения.');
 function surface(image:HTMLImageElement,colored=false){
  const c=document.createElement('canvas');c.width=w;c.height=h;const context=c.getContext('2d')!;context.drawImage(image,0,0,w,h);
  if(colored&&s.color!=='original'){const pixels=context.getImageData(0,0,w,h);recolorFacade(pixels.data,w,h,s.material,s.color,lit&&image===house);context.putImageData(pixels,0,0);}
  return c;
 }
 function scene(target:CanvasRenderingContext2D,building:HTMLCanvasElement,landscape:HTMLImageElement|null){
  if(landscape){target.drawImage(landscape,0,0,w,h);target.save();polygon(target,outline,w,h);target.clip();target.drawImage(building,0,0,w,h);target.restore();}else target.drawImage(building,0,0,w,h);
 }
 const houseSurface=surface(house,true);
 if(weatherHouse&&dayHouse&&reference){
  const weatherSurface=surface(weatherHouse),weatherCtx=weatherSurface.getContext('2d')!,daySurface=surface(dayHouse,true),refSurface=surface(reference);
  const weatherPixels=weatherCtx.getImageData(0,0,w,h),dayMaterial=daySurface.getContext('2d')!.getImageData(0,0,w,h);
  if(s.material!=='plaster'||s.color!=='original')applyWeatherMaterial(weatherPixels.data,refSurface.getContext('2d')!.getImageData(0,0,w,h).data,dayMaterial.data,w,h);
  weatherCtx.putImageData(weatherPixels,0,0);scene(ctx,weatherSurface,weatherBackground);
  if(lit){
   const dayScene=document.createElement('canvas');dayScene.width=w;dayScene.height=h;const dayCtx=dayScene.getContext('2d')!;scene(dayCtx,daySurface,dayBackground);
   const litScene=document.createElement('canvas');litScene.width=w;litScene.height=h;const litCtx=litScene.getContext('2d')!;scene(litCtx,houseSurface,background);
   const out=ctx.getImageData(0,0,w,h);applyWeatherLighting(out.data,dayCtx.getImageData(0,0,w,h).data,litCtx.getImageData(0,0,w,h).data,w,h,s.time,s.weather);ctx.putImageData(out,0,0);
  }else if(s.time==='morning'){const out=ctx.getImageData(0,0,w,h);applyWeatherLighting(out.data,out.data,out.data,w,h,s.time,s.weather);ctx.putImageData(out,0,0);}
 }else{ctx.save();ctx.filter=plan.filter;scene(ctx,houseSurface,background);ctx.restore();}
 if(s.roof!=='original'){
  ctx.save();ctx.globalAlpha=.7;ctx.strokeStyle=s.roof==='graphite'?'#263039':'#695143';ctx.lineWidth=9*w/1448;
  for(const segment of [[[.109,.417],[.347,.309],[.387,.321],[.563,.262],[.858,.38]],[[.36,.526],[.765,.469],[.977,.52]]] as Point[][]){ctx.beginPath();segment.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.stroke();}ctx.restore();
 }
 if(s.time==='morning'&&!photoWeather){
  ctx.save();ctx.globalCompositeOperation='soft-light';const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,209,132,.32)');g.addColorStop(1,'rgba(255,225,175,.03)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();
 }
 if(s.weather==='snow'){
  const rand=random(22);ctx.save();
  for(let i=0;i<260;i++){const r=(.6+rand()*2.7)*w/1448;ctx.fillStyle=`rgba(255,255,255,${.3+rand()*.6})`;ctx.beginPath();ctx.arc(rand()*w,rand()*h,r,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
 return demoSignature(s);
}
export async function exportDemo(settings:Settings){const canvas=document.createElement('canvas');await renderDemo(canvas,settings);return canvas.toDataURL('image/png');}
