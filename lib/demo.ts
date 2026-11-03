import {normalizeSettings,defaults,materials,seasons,times,weatherOptions,type Settings} from './prompts.ts';
export const demoDefaults:Settings={...defaults,time:'day',color:'original'};
export function getDemoPlan(input:unknown){
 const s=normalizeSettings(input);
 const timeFilters:Record<string,string>={morning:'brightness(.92) saturate(.96)',day:'none',evening:'none',night:'none'};
 const photoWeather=['cloudy','rain','fog'].includes(s.weather);
 const weatherFilters:Record<string,string>={clear:'',cloudy:'',rain:'',fog:'',snow:'brightness(.92) saturate(.7)'};
 const light=['evening','night'].includes(s.time)?`-${s.time}`:'';
 const landscape=!['forest','original'].includes(s.environment);
 return {settings:s,dayBaseUrl:`/images/demo/${s.material}-${s.season}.webp`,referenceBaseUrl:`/images/demo/plaster-${s.season}.webp`,
 dayBackgroundUrl:landscape?`/images/demo/background-${s.environment}-${s.season}.webp`:null,
 weatherBaseUrl:photoWeather?`/images/weather/house-${s.season}-${s.weather}.webp`:null,
 weatherBackgroundUrl:photoWeather&&landscape?`/images/weather/${s.environment}-${s.season}-${s.weather}.webp`:null,
 baseUrl:`/images/demo/${s.material}-${s.season}${light}.webp`,
 backgroundUrl:['forest','original'].includes(s.environment)?null:`/images/demo/background-${s.environment}-${s.season}${light}.webp`,
 filter:photoWeather?'none':[timeFilters[s.time],weatherFilters[s.weather]].filter(x=>x&&x!=='none').join(' ')||'none',weather:s.weather,color:s.color};
}
export function demoLabel(input:unknown){const s=normalizeSettings(input);return [materials.find(x=>x.id===s.material)?.label,seasons.find(x=>x.id===s.season)?.label,times.find(x=>x.id===s.time)?.label,weatherOptions.find(x=>x.id===s.weather)?.label].join(' · ');}
export function demoSignature(input:unknown){return Object.values(normalizeSettings(input)).join('|');}
export const demoSeeds=[
 {id:'demo-day',settings:demoDefaults},
 {id:'demo-autumn',settings:{...demoDefaults,material:'brick',season:'autumn',time:'evening'}},
 {id:'demo-winter',settings:{...demoDefaults,material:'wood',season:'winter',time:'night',weather:'snow'}},
];
export function mergeSavedDemoViews(stored:unknown,current:unknown):{id:string;settings:Settings}[]{
 const result:{id:string;settings:Settings}[]=[],seen=new Set<string>();
 for(const value of [...(Array.isArray(current)?current:[]),...(Array.isArray(stored)?stored:[])]){
  if(!value||typeof value!=='object'||typeof value.id!=='string'||!/^demo-view-[0-9]+$/.test(value.id)||seen.has(value.id))continue;
  seen.add(value.id);result.push({id:value.id,settings:normalizeSettings(value.settings)});if(result.length===20)break;
 }
 return result;
}
