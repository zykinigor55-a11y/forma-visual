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
 if(!entry.planted)return [{url:asset(entry.id),x:0,y:0,w:1,h:1}];
 const pot={url:asset(entry.id),x:.15,y:.60,w:.70,h:.40};
 // Draw the back of the container, insert the stem into its mouth, then occlude it with the front rim.
 const lips={'metal-pot':[[.08,.24],[.75,.25],[.94,.12],[.94,1],[.08,1]],'concrete-pot':[[.025,.38],[.25,.46],[.75,.46],[.975,.38],[.975,1],[.025,1]],'stone-pot':[[.025,.30],[.30,.38],[.75,.38],[.975,.30],[.975,1],[.025,1]]};
 return [pot,{url:asset(entry.planted),x:.15,y:0,w:.70,h:entry.id==='metal-pot'?.69:.73},{...pot,clip:lips[entry.id]}];
}
let clipSequence=0;
export function placementMarkup(entry,{x=0,y=0,w=320,h=320}={}){
 return assetLayers(entry).map(l=>{
  const id='planter-rim-'+(++clipSequence),clip=l.clip?`<defs><clipPath id="${id}"><polygon points="${l.clip.map(([px,py])=>`${x+(l.x+px*l.w)*w},${y+(l.y+py*l.h)*h}`).join(' ')}"/></clipPath></defs>`:'';
  return clip+`<image href="${l.url}" x="${x+l.x*w}" y="${y+l.y*h}" width="${l.w*w}" height="${l.h*h}" preserveAspectRatio="none"${l.clip?` clip-path="url(#${id})"`:''}/>`;
 }).join('');
}
export function drawAssetLayer(ctx,picture,layer,x,y,w,h){
 ctx.save();
 if(layer.clip){ctx.beginPath();layer.clip.forEach(([px,py],i)=>ctx[i?'lineTo':'moveTo'](x+(layer.x+px*layer.w)*w,y+(layer.y+py*layer.h)*h));ctx.closePath();ctx.clip();}
 ctx.drawImage(picture,x+layer.x*w,y+layer.y*h,layer.w*w,layer.h*h);ctx.restore();
}
export function referenceEntries(items){
 return [...new Map(items.map(i=>[i.catalogId,{kind:i.kind,entry:catalogFor(i.kind).find(e=>e.id===i.catalogId)}])).values()];
}
export function placementGuideGeometry(items,width,height){
 return items.flatMap((item,i)=>['fill','edge','path'].includes(item.kind)?[]:[{
  number:i+1,catalogId:item.catalogId,x:(item.x-item.w/2)*width,y:(item.y-item.h)*height,w:item.w*width,h:item.h*height,anchor:{x:item.x*width,y:item.y*height}
 }]);
}
