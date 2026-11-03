import sharp from '../node_modules/.pnpm/sharp@0.35.4_@types+node@22.19.19/node_modules/sharp/dist/index.mjs';
import {applyWeatherMaterial,applyWeatherLighting}from'../lib/demo-weather.ts';
import {recolorFacade}from'../lib/demo-facade.ts';
const season=process.argv[2]||'autumn',color=process.argv[3]||'original';
const read=async path=>{const r=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data:new Uint8ClampedArray(r.data),info:r.info};};
const ref=await read(`public/images/demo/plaster-${season}.webp`);
for(const weather of ['cloudy','fog','rain']){
 const base=await read(`public/images/weather/house-${season}-${weather}.webp`),items=[];let i=0;
 for(const material of ['plaster','brick','wood','stone']){
  const day=await read(`public/images/demo/${material}-${season}.webp`);recolorFacade(day.data,1448,1086,material,color);
  for(const time of ['day','evening','night']){
   const photo=new Uint8ClampedArray(base.data),start=performance.now();
   if(material!=='plaster'||color!=='original')applyWeatherMaterial(photo,ref.data,day.data,1448,1086);
   if(time!=='day'){const lit=await read(`public/images/demo/${material}-${season}-${time}.webp`);recolorFacade(lit.data,1448,1086,material,color,true);applyWeatherLighting(photo,day.data,lit.data,1448,1086,time,weather);}
   if(material==='brick')console.log(JSON.stringify({weather,time,milliseconds:Math.round(performance.now()-start)}));
   items.push({input:await sharp(photo,{raw:base.info}).resize(480,360).png().toBuffer(),left:i%3*480,top:Math.floor(i/3)*360});i++;
  }
 }
 await sharp({create:{width:1440,height:1440,channels:3,background:'#fff'}}).composite(items).jpeg({quality:91}).toFile(`../qa-weather-${season}-${color.replace("#","")}-${weather}.jpg`);
}
