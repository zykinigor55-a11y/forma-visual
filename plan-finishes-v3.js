/* FORMA / object-based finishes and architectural material presets */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const INTERIOR_STYLES={
 'warm-modern':{name:'Тёплый современный',walls:'#e7dfd1',floor:'#af9172',frame:'#303633'},
 japandi:{name:'Japandi',walls:'#dcd8ca',floor:'#b39a78',frame:'#424644'},
 contemporary:{name:'Contemporary luxury',walls:'#e8e5e0',floor:'#8c867d',frame:'#292a2a'},
 minimal:{name:'Минимализм',walls:'#f1efe8',floor:'#c4c5c0',frame:'#303432'},
 scandinavian:{name:'Скандинавский',walls:'#f0ede4',floor:'#c7a986',frame:'#ecece9'}
};
export function materialZonesForWall(zones,segments){
 const result=[];
 for(const zone of zones||[]){
  if(!zone.wallId)continue;
  const rawStart=Number(zone.centerM)-Number(zone.widthM)/2,rawEnd=Number(zone.centerM)+Number(zone.widthM)/2;
  const base=Number(zone.bottomM),top=base+Number(zone.heightM),side=zone.side===-1?-1:1;
  if(![rawStart,rawEnd,base,top].every(Number.isFinite)||rawEnd<=rawStart||top<=base)continue;
  for(const segment of segments.filter(s=>s.wallId===zone.wallId)){
   const lo=Math.max(rawStart,segment.startM),hi=Math.min(rawEnd,segment.endM);
   const bottom=Math.max(base,segment.bottomM),upper=Math.min(top,segment.topM);
   if(hi-lo<.01||upper-bottom<.01)continue;
   const mid=(lo+hi)/2,delta=mid-(segment.startM+segment.endM)/2;
   const angle=segment.rotation,normal=(segment.thickness/2+.006)*side;
   const cos=Math.cos(angle),sin=Math.sin(angle);
   result.push({
    zoneId:zone.id,wallId:zone.wallId,
    x:segment.x+cos*delta+sin*normal,
    z:segment.z-sin*delta+cos*normal,
    y:(bottom+upper)/2,
    width:hi-lo,height:upper-bottom,depth:.007,rotation:angle,
    color:zone.color,texture:zone.texture,textureScale:zone.textureScale||1
   });
  }
 }
 return result;
}
export function materialTargetName(surface){
 if(surface?.type==='floor')return 'Пол';
 if(surface?.type==='wall')return 'Стена';
 if(surface?.type==='zone')return 'Участок стены';
 return 'Объект не выбран';
}
export function normalizeMaterial(v){
 return {color:/^#[0-9a-f]{6}$/i.test(String(v?.color||''))?v.color:'#e7dfd1',
  texture:typeof v?.texture==='string'&&v.texture.startsWith('data:image/')?v.texture:null,
  textureScale:clamp(Number(v?.textureScale)||1,.25,8)};
}
