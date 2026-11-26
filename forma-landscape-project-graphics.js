import {prepareTreeAtlas,treeCanopyPNG,treeCanopyCount} from './forma-landscape-tree-atlas.js?v=generated-256px-v1';
/* FORMA Landscape Plan top-down vector previews. Every asset is orthographic,
   scale independent, same exact geometry in plan and 1080×1080 library export.
   These are deterministic previews; AI presentation is a separate layer. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const seeded=s=>{let x=0;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)%100000)/100000}};
const mix=(hex,change)=>{const n=parseInt(hex.slice(1),16),v=[n>>16&255,n>>8&255,n&255].map(c=>Math.max(0,Math.min(255,Math.round(c+change))));return '#'+v.map(c=>c.toString(16).padStart(2,'0')).join('')};
const f=n=>Number(n).toFixed(2);
const defs=()=>'<defs><radialGradient id="leaf"><stop stop-color="#e6edbe"/><stop offset=".45" stop-color="#9eae65"/><stop offset="1" stop-color="#45634b"/></radialGradient><radialGradient id="light"><stop stop-color="#fff7da" stop-opacity=".85"/><stop offset=".13" stop-color="#ffdc9c" stop-opacity=".5"/><stop offset="1" stop-color="#ffcb73" stop-opacity="0"/></radialGradient><radialGradient id="water"><stop stop-color="#6b9991"/><stop offset=".7" stop-color="#2c6167"/><stop offset="1" stop-color="#183c45"/></radialGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4"/></filter><linearGradient id="rock" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f3e7d4"/><stop offset=".4" stop-color="#9c998f"/><stop offset="1" stop-color="#4b514c"/></linearGradient></defs>';
const circle=(x,y,r,fill,extra='')=>'<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(r)+'" fill="'+fill+'" '+extra+'/>';
function grassPlan(entry){
 const rand=seeded(entry.id);
 let out=circle(82,85,53,'#111b17','opacity=".20" filter="url(#shadow)"');
 for(let i=0;i<135;i++){
  const angle=rand()*Math.PI*2,r=12+rand()*58,bend=(rand()-.5)*38;
  out+=`<g transform="translate(80 80) rotate(${f(angle*180/Math.PI)})">
   <path d="M0 0Q${f(r*.55)} ${f(bend)} ${f(r)} 0" fill="none" stroke="${mix(entry.color,(rand()-.5)*85)}" stroke-width="${f(.7+rand()*2.4)}" stroke-linecap="round"/>
   ${entry.id==='pennisetum'&&i%3===0?`<ellipse cx="${f(r)}" cy="0" rx="${f(3+rand()*5)}" ry="${f(1+rand()*1.3)}" fill="${mix('#bdaa80',(rand()-.5)*57)}"/>`:''}</g>`;
 }
 return out;
}
function foliage(entry){
 const rand=seeded(entry.id);const shrub=entry.group==='shrubs';const pine=['pine','conifer'].includes(entry.shape)||entry.id.includes('juniper')||entry.id.includes('thuja');
 const blossom=['hydrangea','spirea','lavender','flower'].some(w=>entry.id.includes(w)||entry.shape===w);
 const isBirch=entry.shape==='birch',isWillow=entry.shape==='willow';
 let out=circle(83,86,62,'#111b17','opacity=".22" filter="url(#shadow)"');
 const rings=shrub?3:4,radius=shrub?60:68;
 for(let k=rings;k>=0;k--){
  const rr=radius-(rings-k)*7;
  const count=(shrub?100:150)+(rings-k)*12;
  for(let i=0;i<count;i++){
   const a=rand()*Math.PI*2,d=Math.sqrt(rand())*rr;
   const x=80+Math.cos(a)*d,y=78+Math.sin(a)*d;
   const size=(pine?2.2:3.4)+rand()*(pine?5.2:6.2);
   const shade=mix(entry.color,(rand()-.5)*72+(k===rings?-18:16));
   if(pine){
    const len=size*(1.6+rand()),angle=rand()*360;
    out+='<path d="M'+f(x)+' '+f(y)+'l'+f(Math.cos(angle*Math.PI/180)*len)+' '+f(Math.sin(angle*Math.PI/180)*len)+'" stroke="'+shade+'" stroke-width="'+f(.5+rand()*1.5)+'" stroke-linecap="round" opacity=".94"/>';
   }else{
    const rot=rand()*180;
    out+='<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(size*.7)+'" ry="'+f(size*(isWillow?2.2:1.2))+'" fill="'+shade+'" stroke="'+mix(shade,-22)+'" stroke-width=".3" transform="rotate('+f(rot)+' '+f(x)+' '+f(y)+')" opacity=".95"/>';
   }
  }
 }
 if(!shrub){
  for(let i=0;i<14;i++){const a=rand()*6.28,l=10+rand()*43;
   out+='<path d="M80 78Q'+f(80+Math.cos(a)*l*.35)+' '+f(78+Math.sin(a)*l*.35)+' '+f(80+Math.cos(a)*l)+' '+f(78+Math.sin(a)*l)+'" fill="none" stroke="'+(isBirch?'#d2cfc3':'#4b3827')+'" stroke-width="'+f(1+rand()*1.4)+'" opacity=".65"/>';
  }
 }
 if(entry.id==='barberry'||entry.id==='rowan')for(let i=0;i<50;i++){const a=rand()*6.28,d=rand()*54;out+=circle(80+Math.cos(a)*d,78+Math.sin(a)*d,1.5+rand()*2.4,entry.id==='rowan'?'#b94924':'#9e3839','opacity=".95"')}
 if(blossom||entry.id==='apple'||entry.id==='sakura'){for(let i=0;i<(entry.id==='lavender'?92:125);i++){const a=rand()*6.28,d=Math.sqrt(rand())*50;const col=entry.id==='lavender'?'#b7a5ec':entry.id==='sakura'?'#fae1eb':entry.id==='spirea'?'#edb7c7':entry.id==='hydrangea'?'#f4f0dc':'#f2bcd0';out+=circle(80+Math.cos(a)*d,78+Math.sin(a)*d,1.5+rand()*2.4,col,'opacity=".88"')}}
 out+=circle(80,78,2,isBirch?'#f2ede0':'#58452f','opacity=".82"');
 return out;
}
function stone(entry){const rand=seeded(entry.id);let result=circle(83,86,61,'#080c0c','opacity=".26" filter="url(#shadow)"');
 const n=14,pts=Array.from({length:n},(_,i)=>{let a=i*2*Math.PI/n,r=45+rand()*23;return [80+Math.cos(a)*r,80+Math.sin(a)*r]});
 result+='<polygon points="'+pts.map(([x,y])=>f(x)+','+f(y)).join(' ')+'" fill="'+entry.color+'" stroke="'+mix(entry.color,-38)+'" stroke-width="2.5"/>';
 for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],mx=70+rand()*23,my=66+rand()*32;result+='<polygon points="'+f(a[0])+','+f(a[1])+' '+f(b[0])+','+f(b[1])+' '+f(mx)+','+f(my)+'" fill="'+mix(entry.color,(rand()-.65)*95)+'" stroke="'+mix(entry.color,-28)+'" stroke-width=".45"/>'}
 for(let i=0;i<230;i++){let a=rand()*6.283,d=Math.sqrt(rand())*49,x=80+Math.cos(a)*d,y=78+Math.sin(a)*d;result+=circle(x,y,.25+rand()*.8,rand()>.5?'#f0e6d1':'#262c2a','opacity=".28"')}
 return result;
}
function floorSample(entry){
 const rand=seeded(entry.id);let out='<rect x="7" y="7" width="146" height="146" rx="14" fill="'+entry.color+'"/>';
 const type=entry.texture;
 if(entry.group==='pavers'){
  if(type==='herringbone'){
   for(let y=0;y<10;y++)for(let x=0;x<11;x++){let px=x*18-9,py=y*18-9;out+='<rect x="'+px+'" y="'+py+'" width="17" height="9" fill="'+mix(entry.color,(rand()-.5)*36)+'" stroke="#e7dac8" stroke-opacity=".40" stroke-width="1" transform="rotate('+(x%2===0?45:-45)+' '+(px+8)+' '+(py+5)+')"/>'}
  }else if(type==='radial'){
   for(let ring=1;ring<7;ring++)for(let j=0;j<12+ring*6;j++){let count=12+ring*6,a=j/count*6.283,r=ring*15;out+='<path d="M80 80L'+f(80+Math.cos(a)*r)+' '+f(80+Math.sin(a)*r)+'" stroke="'+mix(entry.color,-22)+'" stroke-width=".5" opacity=".6"/>'}
   for(let r=15;r<99;r+=15)out+='<circle cx="80" cy="80" r="'+r+'" fill="none" stroke="#e7e2db" stroke-opacity=".55" stroke-width="1"/>';
  }else{
   const step=type==='slabs'?43:type==='slate'?32:type==='grid'?26:19;
   for(let y=-4;y<164;y+=step)for(let x=-4;x<164;x+=step){
    let off=type==='setts'?Math.round(rand()*4):0,xx=x+(Math.floor(y/step)%2?step/2:0);
    out+='<rect x="'+f(xx+1+off)+'" y="'+f(y+1)+'" width="'+f(step-3-off)+'" height="'+f(step-3)+'" rx="'+(type==='setts'?2:0)+'" fill="'+mix(entry.color,(rand()-.5)*37)+'" stroke="'+mix(entry.color,-21)+'" stroke-width=".7"/>';
    if(type==='grid')out+='<rect x="'+f(xx+8)+'" y="'+f(y+7)+'" width="'+f(step-15)+'" height="'+f(step-14)+'" fill="#628749" rx="3"/>';
   }
  }
 }else if(entry.group==='lawns'){
  for(let i=0;i<1700;i++){const x=9+rand()*142,y=9+rand()*142,l=1+rand()*5;
   out+='<path d="M'+f(x)+' '+f(y)+'l'+f((rand()-.5)*2)+' -'+f(l)+'" stroke="'+(rand()>.48?mix(entry.color,-36):mix(entry.color,30))+'" stroke-width=".7" opacity=".8"/>';
   if(type==='meadow'&&rand()>.94)out+=circle(x,y,1.2,rand()>.4?'#ece7c9':'#bdacd6');
  }
 }else if(entry.group==='ponds'){
  out='<rect x="7" y="7" width="146" height="146" rx="15" fill="url(#water)"/>';
  for(let i=0;i<60;i++){let x=10+rand()*140,y=10+rand()*140;out+='<path d="M'+f(x)+' '+f(y)+'q6 -1 13 0" stroke="#c7e0d7" stroke-width=".7" opacity="'+f(.07+rand()*.18)+'" fill="none"/>'}
  if(type==='bio'||type==='natural')for(let i=0;i<10;i++){let x=12+rand()*136,y=12+rand()*136;out+='<path d="M'+f(x)+' '+f(y)+'l4 -5 5 3-1 6-7 3Z" fill="#769c63" stroke="#3f6448" stroke-width=".6"/>'}
  if(type==='formal')out+='<rect x="9" y="9" width="142" height="142" rx="2" fill="none" stroke="#aaa9a3" stroke-width="6"/>';
 }else if(entry.group==='fills'){
  for(let i=0;i<550;i++){
   const x=9+rand()*142,y=9+rand()*142,r=(type==='bark'?1.5:1)+rand()*4;
   if(type==='bark')out+='<path d="M'+f(x-r)+' '+f(y)+'l'+f(r*1.3)+' -'+f(r*.6)+' '+f(r*1.2)+' '+f(r*.7)+' -'+f(r*.8)+' '+f(r*.6)+'Z" fill="'+mix(entry.color,(rand()-.5)*68)+'" stroke="#523b2c" stroke-width=".4"/>';
   else out+='<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(r)+'" ry="'+f(r*(.6+rand()*.8))+'" fill="'+mix(entry.color,(rand()-.5)*65)+'" stroke="'+mix(entry.color,-27)+'" stroke-width=".5"/>';
  }
 }
 return '<g clip-path="url(#tileclip)">'+out+'</g>';
}
function light(entry){
 // Accurate nadir silhouettes for the 2D plan; 3D picker thumbnails are
 // photographed from the exact mesh by the WebGL renderer.
 const t=entry.id;
 let out=circle(80,80,67,'url(#light)');
 const cap=(r,color='#343a3c')=>circle(80,80,r,color,'stroke="#bbaa90" stroke-width="2"');
 const inner=(r)=>circle(80,80,r,'#fae7c4');
 if(t==='linear'){
  out+='<rect x="26" y="70" width="108" height="20" rx="4" fill="#252e31" stroke="#afa58d" stroke-width="2"/><rect x="34" y="77" width="92" height="6" rx="3" fill="#ffe8b2"/>';
 }else if(t==='deck-light'){
  out+='<rect x="57" y="57" width="46" height="46" rx="2" fill="#252a2e" stroke="#bdb3a2" stroke-width="3"/><rect x="65" y="65" width="30" height="30" fill="#f4e6cb"/>';
 }else if(t==='ground'){
  out+=cap(26)+inner(17);
  for(let i=-2;i<=2;i++)out+='<path d="M'+(80+i*5)+' 64v32" stroke="#343a3d" stroke-width="2"/>';
  for(const [x,y] of [[80,57],[80,103],[57,80],[103,80]])out+=circle(x,y,1.5,'#b7bab6');
 }else if(t==='spot'||t==='spike-spot'){
  out+='<path d="M80 80L20 36Q7 80 20 124Z" fill="#f4dbad" opacity=".23"/>';
  out+=cap(t==='spike-spot'?13:20)+inner(t==='spike-spot'?8:13);
  out+='<path d="M68 80h-17" stroke="#a5aaad" stroke-width="5"/>';
 }else if(t==='mushroom'){
  out+=cap(35,'#384144')+circle(80,80,26,'#666c6c')+circle(80,80,13,'#2b3539');
 }else if(t==='square-bollard'){
  out+='<rect x="54" y="54" width="52" height="52" rx="3" fill="#303b42" stroke="#aaa48a" stroke-width="3"/>';
  out+='<rect x="60" y="60" width="40" height="8" fill="#f5dfa9"/><rect x="60" y="92" width="40" height="8" fill="#f5dfa9"/>';
 }else if(t==='low-post'){
  out+='<rect x="62" y="62" width="36" height="36" rx="2" fill="#273136" stroke="#a9a99a" stroke-width="3"/>';
  out+='<path d="M67 68h26" stroke="#f6dcaa" stroke-width="6"/>';
 }else if(t==='garden-lantern'){
  out+='<path d="M80 37l43 43-43 43-43-43Z" fill="#2b3438" stroke="#aaa58b" stroke-width="3"/>';
  out+='<path d="M80 52v56M52 80h56" stroke="#e5cfa5" stroke-width="3"/>';
  out+=circle(80,80,7,'#f8e3b8');
 }else if(t==='globe'){
  out+=circle(80,80,33,'#ded8c9','stroke="#bcae92" stroke-width="2"');
  out+=circle(69,67,12,'#faf2e2')+circle(80,80,24,'none','stroke="#f1e1c2" stroke-opacity=".65" stroke-width="3"');
 }else{
  out+=cap(24)+inner(17)+circle(80,80,7,'#e6c490');
 }
 return out;
}
export function assetGraphic(entry){
 if(!entry)return '';
 if(['pennisetum','ornamental-grass'].includes(entry.id))return grassPlan(entry);
 if(entry.group==='trees'||entry.group==='shrubs')return foliage(entry);
 if(entry.group==='boulders')return stone(entry);
 if(entry.group==='lights')return light(entry);
 if(entry.group==='pools'){
  const fixed=entry.id==='pool-fixed',frame=entry.id==='pool-frame';
  const body=fixed?'<rect x="13" y="37" width="134" height="86" rx="2" fill="#d3cdc0" stroke="#817d72" stroke-width="2"/><rect x="21" y="45" width="118" height="70" fill="#559caf" stroke="#d7e5e5" stroke-width="2"/><path d="M24 51 H44 V109 H24 M30 51 V109 M37 51 V109" fill="none" stroke="#b0d8e0" stroke-width="2"/>':'<circle cx="80" cy="80" r="62" fill="'+(frame?'#828b92':'#6aa8d3')+'" stroke="#d3dce1" stroke-width="2"/><circle cx="80" cy="80" r="'+(frame?55:49)+'" fill="#559caf" stroke="#bddae4" stroke-width="2"/>'+(frame?Array.from({length:12},(_,i)=>'<path d="M80 15 V25" stroke="#d5d7d7" stroke-width="4" transform="rotate('+(i*30)+' 80 80)"/>').join(''):'<circle cx="80" cy="80" r="55" fill="none" stroke="#a9d8ef" stroke-width="4"/>');
  return body+'<path d="M48 68 Q63 64 78 68 T108 68 M50 82 Q65 78 80 82 T110 82 M48 96 Q63 92 78 96 T108 96" stroke="#d7f0ed" stroke-width="1.5" opacity=".55" fill="none"/>';
 }
 return floorSample(entry);
}
export function assetSVG(entry,{size=1080,transparent=false}={}){
 const content=assetGraphic(entry);
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 160 160" role="img" aria-label="'+esc(entry.name)+'"><defs><clipPath id="tileclip"><rect x="7" y="7" width="146" height="146" rx="14"/></clipPath></defs>'+defs()+(transparent?'':'<rect x="0" y="0" width="160" height="160" fill="#222426"/>')+content+'</svg>';
}
// IDs with bundled orthographic PNGs in assets/landscape-premium.
const PREMIUM_PLAN_ASSETS=new Set([
 'apple','barberry','bio-pond','birch','bollard','boxwood','clinker-herringbone','concrete-pavers',
 'deck-light','dogwood','formal-pond','formal','granite-boulder','granite-chips','granite-setts',
 'grass-grid','ground','hydrangea','juniper','lavender','limestone-boulder','linden','linear',
 'low-post','maple','marble-chips','meadow','natural','oak','pine-bark','pine','radial-setts',
 'river-pebble','rowan','sakura','sandstone-boulder','shade','slate-boulder','slate-chips',
 'slate-pavers','spirea','spot','spruce','thuja-globe','universal','willow'
]);
// Staged 1080 top-view PNGs are individual synthetic previews, not photographs.
// JPG surface cards are photographic; never mislabel botanical previews as photos.
export const PHOTO_ASSETS=Object.freeze({
 spruce:'spruce.png',birch:'birch.png',oak:'oak.png',maple:'maple.png',linden:'linden.png',willow:'willow.png',rowan:'rowan.png',apple:'apple.png',sakura:'sakura.png',juniper:'juniper.png',hydrangea:'hydrangea.png',spirea:'spirea.png',barberry:'barberry.png',dogwood:'dogwood.png','thuja-globe':'thuja-globe.png',lavender:'lavender.png',boxwood:'boxwood.png',pine:'pine.png',
 formal:'formal.jpg',universal:'universal.jpg',shade:'shade.jpg',meadow:'meadow.jpg',
 'granite-chips':'granite-chips.jpg','marble-chips':'marble-chips.jpg',
 'river-pebble':'river-pebble.jpg','slate-chips':'slate-chips.jpg',
 'pine-bark':'pine-bark.jpg',
 'concrete-pavers':'concrete-pavers.jpg','granite-setts':'granite-setts.jpg',
 'clinker-herringbone':'clinker-herringbone.jpg','slate-pavers':'slate-pavers.jpg',
 'radial-setts':'radial-setts.jpg','grass-grid':'grass-grid.jpg'
});
const availablePhotos=new Set();
const CARD_PHOTO_IDS=new Set(['bollard','ground','spot','low-post','deck-light','linear','natural','formal-pond','bio-pond','granite-boulder','limestone-boulder','slate-boulder','sandstone-boulder']);
// The orthographic PNG stays on the plan. The picker prefers real photo cutouts
// of the exact species when a verified, separate side-view photograph exists.
const PHOTO_PLANT_CARD_IDS=new Set(['birch','oak','maple','juniper','hydrangea','barberry','lavender','pine']);
const availableCardPhotos=new Set();
export const cardPhotoCount=()=>availableCardPhotos.size;
export const cardPhotoURL=(entry)=>entry?.group==='trees'&&treeCanopyPNG(entry.id)?treeCanopyPNG(entry.id):PHOTO_PLANT_CARD_IDS.has(entry?.id)?'./assets/landscape/items/'+entry.id+'.webp?v=photographic-picker-20261117':availableCardPhotos.has(entry?.id)?'./assets/landscape-card-photo/'+entry.id+'.jpg?v=forma-premium-card-v1':iconURL(entry);
export const hasPhotographicCard=(entry)=>Boolean(entry&&((entry.group==='trees'&&treeCanopyPNG(entry.id))||PHOTO_PLANT_CARD_IDS.has(entry.id)||availableCardPhotos.has(entry.id)||(availablePhotos.has(entry.id)&&PHOTO_ASSETS[entry.id]?.endsWith('.jpg'))));

const photoUrl=(entry)=>'./assets/landscape-photo/'+PHOTO_ASSETS[entry.id]+'?v=photo-1080-18-staged-v2';
export const photographicAssetCount=()=>[...availablePhotos].filter(id=>PHOTO_ASSETS[id]?.endsWith('.jpg')).length;
export const photographicIconURL=(entry)=>PHOTO_ASSETS[entry.id]?photoUrl(entry):null;
export const fallbackIconURL=(entry)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(assetSVG(entry,{size:1080,transparent:true}));
export const premiumIconURL=(entry)=>PREMIUM_PLAN_ASSETS.has(entry.id)
 ?'./assets/landscape-premium/'+encodeURIComponent(entry.id)+'.png?v=1080-png-realgrass-v2'
 :fallbackIconURL(entry);
export const iconURL=(entry)=>entry?.group==='trees'&&treeCanopyPNG(entry.id)?treeCanopyPNG(entry.id)
 :availablePhotos.has(entry.id)?photoUrl(entry):premiumIconURL(entry);
export const isPhotographic=(entry)=>Boolean(entry&&availablePhotos.has(entry.id)&&PHOTO_ASSETS[entry.id]?.endsWith('.jpg'));
export async function enablePremiumAssets(){
 try{await prepareTreeAtlas()}catch{}
 // Only enable a new photo after verifying that exact species/material exists.
 // A missing 1080 file must never break plant placement, previews or AI exports.
 await Promise.all(Object.entries(PHOTO_ASSETS).map(async([id,ext])=>{
  try{
   const url='./assets/landscape-photo/'+ext+'?v=photo-1080-18-staged-v2';
   const r=await fetch(url,{method:'HEAD',cache:'no-cache'});
   const mime=(r.headers.get('Content-Type')||'').toLowerCase();
   if(r.ok&&(mime.startsWith('image/png')||mime.startsWith('image/jpeg')||!mime)){
    availablePhotos.add(id);
   }else availablePhotos.delete(id);
  }catch{availablePhotos.delete(id);}
 }));
 // Photo illustrations for the picker are independent of exact top-down map geometry.
 // For lamps, ponds and boulders a garden photograph belongs on the card only.
 await Promise.all([...CARD_PHOTO_IDS].map(async id=>{
   try{
     const url='./assets/landscape-card-photo/'+id+'.jpg?v=forma-premium-card-v1';
     const r=await fetch(url,{method:'HEAD',cache:'no-cache'});
     if(r.ok&&(r.headers.get('Content-Type')||'').toLowerCase().startsWith('image/jpeg'))availableCardPhotos.add(id);
     else availableCardPhotos.delete(id);
   }catch{availableCardPhotos.delete(id);}
 }));
 return PREMIUM_PLAN_ASSETS.size>0||availablePhotos.size>0;
}
export function roofingSVG(house){
 // Vector fallback is dimensioned, truly nadir. AI photograph is applied only as a surface texture.
 const w=Math.max(2,Number(house.width)||12),h=Math.max(2,Number(house.height)||8),
  hw=w/2,hh=h/2,roof=house.roof||'gable',r=/^#[a-f0-9]{6}$/i.test(house.roofColor||'')?house.roofColor:'#3e4142',
  ridge=Number(house.ridge)||0;
 const hex=n=>Math.max(0,Math.min(255,n|0)).toString(16).padStart(2,'0');
 const tone=(x)=>'#'+[1,3,5].map(i=>hex(parseInt(r.slice(i,i+2),16)+x)).join('');
 const id=('rf-'+String(house.id||house.type||'house')+'-'+w+'-'+h+'-'+r.slice(1)).replace(/[^a-z0-9-]/gi,'');
 let body='<defs><linearGradient id="'+id+'-up" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="'+tone(42)+'"/><stop offset="1" stop-color="'+tone(-3)+'"/></linearGradient><linearGradient id="'+id+'-down" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="'+tone(8)+'"/><stop offset="1" stop-color="'+tone(-43)+'"/></linearGradient><clipPath id="'+id+'-clip"><rect x="'+(-hw)+'" y="'+(-hh)+'" width="'+w+'" height="'+h+'"/></clipPath></defs>';
 body+='<rect x="'+(-hw-.09)+'" y="'+(-hh-.09)+'" width="'+(w+.18)+'" height="'+(h+.18)+'" rx=".035" fill="'+tone(-43)+'" stroke="'+tone(15)+'" stroke-width=".10"/>';
 body+='<g clip-path="url(#'+id+'-clip)">';
 if(roof==='gable'){
  body+='<rect x="'+(-hw)+'" y="'+(-hh)+'" width="'+w+'" height="'+hh+'" fill="url(#'+id+'-up)"/>';
  body+='<rect x="'+(-hw)+'" y="0" width="'+w+'" height="'+hh+'" fill="url(#'+id+'-down)"/>';
 }else if(roof==='hip'){
  const k=Math.max(0,hw-hh);
  body+='<polygon points="'+(-hw)+','+(-hh)+' '+hw+','+(-hh)+' '+k+',0 '+(-k)+',0" fill="url(#'+id+'-up)"/>';
  body+='<polygon points="'+(-hw)+','+hh+' '+hw+','+hh+' '+k+',0 '+(-k)+',0" fill="url(#'+id+'-down)"/>';
  body+='<polygon points="'+(-hw)+','+(-hh)+' '+(-k)+',0 '+(-hw)+','+hh+'" fill="'+tone(-12)+'"/>';
  body+='<polygon points="'+hw+','+(-hh)+' '+k+',0 '+hw+','+hh+'" fill="'+tone(10)+'"/>';
 }else{
  body+='<rect x="'+(-hw)+'" y="'+(-hh)+'" width="'+w+'" height="'+h+'" fill="'+tone(3)+'"/>';
  body+='<rect x="'+(-hw+.12)+'" y="'+(-hh+.12)+'" width="'+(w-.24)+'" height="'+(h-.24)+'" fill="none" stroke="'+tone(27)+'" stroke-width=".08"/>';
 }
 // Dark overlapping tile bands and micro seams — no new dormers, vents or imagined chimneys.
 const band=roof==='flat'?.7:.25,tiles=.63;
 for(let y=-hh+band;y<hh;y+=band){
  body+='<path d="M'+(-hw)+' '+y.toFixed(3)+' H'+hw+'" fill="none" stroke="'+tone(y<0?27:-67)+'" stroke-opacity="'+(roof==='flat'?.26:.33)+'" stroke-width=".055"/>';
  if(roof!=='flat'){
   const shift=((Math.round((y+hh)/band)%2)*tiles/2);
   for(let x=-hw+shift;x<hw;x+=tiles){
    body+='<path d="M'+x.toFixed(3)+' '+(y-band*.75).toFixed(3)+'v'+(band*.65).toFixed(3)+'" fill="none" stroke="'+tone(-40)+'" stroke-opacity=".35" stroke-width=".024"/>';
   }
  }
 }
 for(let x=-hw+.18;x<hw;x+=1.26){
  body+='<path d="M'+x.toFixed(2)+' '+(-hh)+'v'+h+'" stroke="'+tone(21)+'" stroke-opacity=".17" stroke-width=".035"/>';
 }
 body+='</g>';
 if(roof==='gable'){
  body+='<path d="M'+(-hw)+' 0 H'+hw+'" stroke="'+tone(80)+'" stroke-width=".10"/><path d="M'+(-hw)+' .08 H'+hw+'" stroke="'+tone(-77)+'" stroke-width=".075"/>';
 }else if(roof==='hip'){
  const k=Math.max(0,hw-hh);
  body+='<path d="M'+(-hw)+' '+(-hh)+'L'+(-k)+' 0L'+(-hw)+' '+hh+'M'+hw+' '+(-hh)+'L'+k+' 0L'+hw+' '+hh+'M'+(-k)+' 0H'+k+'" fill="none" stroke="'+tone(68)+'" stroke-width=".10"/>';
 }
 // Continuous gutters, visible overhang and an unobtrusive drip-shadow.
 body+='<rect x="'+(-hw+.045)+'" y="'+(-hh+.045)+'" width="'+(w-.09)+'" height="'+(h-.09)+'" fill="none" stroke="'+tone(72)+'" stroke-opacity=".65" stroke-width=".045"/>';
 body+='<rect x="'+(-hw)+'" y="'+(-hh)+'" width="'+w+'" height="'+h+'" fill="none" stroke="'+tone(-75)+'" stroke-width=".08"/>';
 return '<g transform="rotate('+ridge+')">'+body+'</g>';
}
