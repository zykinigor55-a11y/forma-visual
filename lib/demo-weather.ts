import {facadeSurfacePixels} from './demo-facade.ts';
type Point=readonly[number,number];
export const houseOutline:readonly Point[]=[[.105,.402],[.346,.295],[.388,.306],[.563,.248],[.863,.367],[.857,.395],[.832,.405],[.831,.449],[.979,.511],[.975,.535],[.956,.702],[.986,.758],[.973,.795],[.135,.763],[.138,.446],[.105,.429]];
function inHouse(x:number,y:number){let hit=false;for(let i=0,j=houseOutline.length-1;i<houseOutline.length;j=i++){const a=houseOutline[i],b=houseOutline[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const clamp=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
/** Registered plaster acts as the illumination reference, not a painted overlay. */
export function materialUnderWeather(weather:readonly number[],reference:readonly number[],material:readonly number[]){
 return weather.map((v,c)=>clamp(material[c]*Math.max(.3,Math.min(1.8,v/Math.max(35,reference[c])))));
}
export function applyWeatherMaterial(weather:Uint8ClampedArray,reference:Uint8ClampedArray,material:Uint8ClampedArray,width:number,height:number){
 for(const i of facadeSurfacePixels(width,height)){
  const y=Math.floor(i/4/width)/height,x=(i/4%width)/width,source=[material[i],material[i+1],material[i+2]];
  if(y>.635&&source[1]>source[0]*1.05&&source[1]>source[2]*1.12)continue;
  const w=[weather[i],weather[i+1],weather[i+2]];
  const out=materialUnderWeather(w,[reference[i],reference[i+1],reference[i+2]],source);
  let flame=0;
  if(x>.57&&x<.62&&y>.65)flame=Math.max(0,Math.min(1,Math.max((w[0]-w[2]-85)/80,Math.min(1,Math.max(0,(Math.min(w[0],w[1])-195)/25))*Math.min(1,Math.max(0,(w[0]-w[2]-45)/35)))));
  for(let c=0;c<3;c++)weather[i+c]=Math.round(out[c]*(1-flame)+w[c]*flame);
 }
}
/** Keep photographic artificial illumination, replacing only the ambient scene.
 * No clear-sky moon/star layer is transferred into an overcast sky. Fog limits
 * far-field lights more strongly than the house and immediate foreground.
 */
export function weatherLightingPixel(weather:readonly number[],day:readonly number[],lit:readonly number[],time:string,condition:string,x:number,y:number){
 if(time==='morning')return weather.map((v,c)=>clamp(v*[.93,.96,.99][c]+[0,1,2][c]));
 if(time!=='evening'&&time!=='night')return [...weather];
 const ambient=time==='night'?[.22,.27,.38]:[.48,.5,.57];
 const transmission=condition==='fog'?fogTransmission(x,y):1;
 const neutral=inHouse(x,y)?Math.max(0,Math.min(1,(Math.min(lit[0],lit[1],lit[2])-80)/100)):0;
 const artificial=Math.max(neutral,Math.max(0,Math.min(1,(lit[0]-lit[2]*1.1-8)/60)));
 return weather.map((v,c)=>clamp(v*ambient[c]+Math.max(0,lit[c]-day[c]*ambient[c])*transmission*artificial));
}
function fogTransmission(x:number,y:number){const depth=Math.max(0,Math.min(1,(y-.58)/.34));return inHouse(x,y)?.86:.2+.62*depth*depth*(3-2*depth);}
const fogMasks=new Map<string,Float32Array>();
function fogMask(width:number,height:number){
 const key=`${width}x${height}`;let mask=fogMasks.get(key);if(mask)return mask;
 mask=new Float32Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)mask[y*width+x]=fogTransmission((x+.5)/width,(y+.5)/height);
 fogMasks.set(key,mask);if(fogMasks.size>2)fogMasks.delete(fogMasks.keys().next().value!);return mask;
}
export function applyWeatherLighting(weather:Uint8ClampedArray,day:Uint8ClampedArray,lit:Uint8ClampedArray,width:number,height:number,time:string,condition:string){
 if(time==='morning'){for(let i=0;i<weather.length;i+=4){weather[i]=clamp(weather[i]*.93);weather[i+1]=clamp(weather[i+1]*.96+1);weather[i+2]=clamp(weather[i+2]*.99+2);}return;}
 if(time!=='evening'&&time!=='night')return;
 const ambient=time==='night'?[.22,.27,.38]:[.48,.5,.57],geometry=fogMask(width,height);
 for(let i=0;i<weather.length;i+=4){
  const neutral=geometry[i/4]>.85?Math.max(0,Math.min(1,(Math.min(lit[i],lit[i+1],lit[i+2])-80)/100)):0;
  const artificial=Math.max(neutral,Math.max(0,Math.min(1,(lit[i]-lit[i+2]*1.1-8)/60)))*(condition==='fog'?geometry[i/4]:1);
  for(let c=0;c<3;c++)weather[i+c]=clamp(weather[i+c]*ambient[c]+Math.max(0,lit[i+c]-day[i+c]*ambient[c])*artificial);
 }
}
