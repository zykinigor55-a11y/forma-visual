import {catalogFor} from './forma-art-direction-core.js';
// One file per object. Neither canvas placements nor thumbnails expose an atlas.
export const LANDSCAPE_GROUPS=Object.freeze([
 {id:'plant',name:'Кусты',kind:'plant'}, {id:'tree',name:'Деревья',kind:'tree'},
 {id:'lawn',name:'Газон',kind:'fill'}, {id:'fill',name:'Отсыпки',kind:'fill'},
 {id:'path',name:'Мощение',kind:'path'}, {id:'edge',name:'Бордюры · ступени',kind:'edge'},
 {id:'object',name:'Камни · кашпо',kind:'object'}, {id:'light',name:'Свет',kind:'light'}
]);
export function catalogGroup(group){
 const kind=LANDSCAPE_GROUPS.find(g=>g.id===group)?.kind;
 return catalogFor(kind).filter(e=>kind!=='fill'||(['grass','groundcover'].includes(e.id)===(group==='lawn')));
}
const asset=id=>'assets/landscape/items/'+id+'.webp';
export function assetLayers(entry){
 if(!entry)return [];
 return entry.planted?[
  {url:asset(entry.planted),x:.04,y:0,w:.92,h:.78},
  {url:asset(entry.id),x:.22,y:.59,w:.56,h:.41}
 ]:[{url:asset(entry.id),x:0,y:0,w:1,h:1}];
}
export function placementMarkup(entry,{x=0,y=0,w=320,h=320}={}){
 return assetLayers(entry).map(l=>`<image href="${l.url}" x="${x+l.x*w}" y="${y+l.y*h}" width="${l.w*w}" height="${l.h*h}" preserveAspectRatio="none"/>`).join('');
}
export function referenceEntries(items){
 return [...new Map(items.map(i=>[i.catalogId,{kind:i.kind,entry:catalogFor(i.kind).find(e=>e.id===i.catalogId)}])).values()];
}
