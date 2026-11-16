/* Premium vector previews for procedural landscape tools.
 * Separate from the AI output: previews illustrate placement method, not a
 * claim that a generated image looks exactly like this miniature. */
const tag=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&quot;'}[c]));
const leaf=(x,y,rotate=0,fill='#547657',scale=1)=>`<path d="M0 0 Q-12 -12 -8 -21 Q2 -24 9 -14 Q11 -5 0 0" transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" fill="${fill}" stroke="#283e33" stroke-width=".55"/>`;
export function specialCardArt(entry){
 const color=tag(entry.color||'#637766');
 const id=String(entry.id||'');
 const isGarland=entry.kind==='garland',isClimber=entry.kind==='climber';
 const leafColor=id==='virginia-creeper'?'#b87854':id==='climbing-rose'?'#738b62':id==='clematis'?'#758f71':color;
 const bg=isGarland?'#21252a':isClimber?'#d9d2c5':entry.group==='snow'?'#bdcbd1':entry.group==='leaves'?'#a5a590':'#8d9992';
 const base=`<svg class="fa-landscape-card-vector" viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
 <defs><linearGradient id="scene" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${isGarland?'#111519':isClimber?'#b5ad9d':'#65746e'}"/></linearGradient>
 <radialGradient id="halo"><stop stop-color="#ffe6a9" stop-opacity=".75"/><stop offset=".3" stop-color="#edbd67" stop-opacity=".17"/><stop offset="1" stop-color="#ffc66f" stop-opacity="0"/></radialGradient></defs>
 <rect width="240" height="150" fill="url(#scene)"/>
 <path d="M0 117 Q65 108 124 118 T240 113 L240 150 H0Z" fill="${isGarland?'#1a2024':isClimber?'#c4beb0':'#a9ada7'}" opacity=".52"/>
 `;
 let artwork='';
 if(isGarland){
  artwork+=`<path d="M0 37 C39 39 42 86 91 76 S158 33 240 66" fill="none" stroke="#707472" stroke-width="1.7"/>`;
  const lights=[[18,47],[48,61],[83,76],[116,65],[147,52],[181,51],[214,59]];
  artwork+=lights.map(([x,y],i)=>{
   const cold=id==='garland-cool'||id==='garland-icicle',bulb=cold?'#e0ecf8':'#f6cea0';
   const icicle=id==='garland-icicle',retro=id==='garland-festoon';
   return `<circle cx="${x}" cy="${y+(i%2?2:0)}" r="${retro?17:10}" fill="url(#halo)"/>
   ${icicle?`<path d="M${x} ${y}v${17+i%3*4}" stroke="#718c98" stroke-width="1"/>`:''}
   <ellipse cx="${x}" cy="${y+(icicle?14:retro?5:1)}" rx="${retro?4.1:2.5}" ry="${retro?5.5:3}" fill="${bulb}" stroke="#fff9" stroke-width=".7"/>`;
  }).join('');
  artwork+=`<path d="M9 107 Q39 88 65 112 T135 100 T232 112" stroke="#8d9278" stroke-width="2" fill="none" opacity=".65"/>`;
 }else if(isClimber){
  artwork+=`<path d="M0 18 H240 M28 0 V150 M93 0V150 M168 0V150 M230 0V150 M0 86H240" stroke="#aaa190" stroke-width="2" fill="none" opacity=".8"/>`;
  artwork+=`<path d="M32 148 C50 116 18 92 62 77 S91 44 62 11 M90 150 Q115 104 91 66 T124 1" stroke="#516344" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  for(let i=0;i<21;i++){
   const x=i%2?35+i*3:73+i*2.2, y=141-i*6.1;
   artwork+=leaf(x,y,i%2?45:-40,leafColor,.58+(i%4)*.08);
  }
  if(id==='clematis'||id==='climbing-rose'){
   artwork+=[[78,30],[52,72],[98,106]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="${id==='clematis'?'#bdb4cb':'#d7b9aa'}"/><circle cx="${x}" cy="${y}" r="2" fill="#eadc9d"/>`).join('');
  }
 }else{
  if(entry.group==='snow')artwork+=`<path d="M0 90 Q30 88 68 96 Q117 104 159 92 Q196 82 240 91" stroke="#eef2f1" stroke-width="20" stroke-linecap="round" fill="none" opacity=".83"/>`;
  if(entry.group==='leaves')artwork+=`<path d="M0 105 Q61 95 111 109T240 111" stroke="#6b705b" stroke-width="4" fill="none" opacity=".6"/>`;
  for(let i=0;i<22;i++){
   const x=13+(i*47)%220,y=24+(i*31)%106;
   if(entry.group==='snow')artwork+=`<path d="M${x-4} ${y}h8 M${x} ${y-4}v8 M${x-3} ${y-3}l6 6 M${x-3} ${y+3}l6 -6" stroke="#fff" stroke-width="1.6" opacity=".65"/>`;
   else if(entry.group==='leaves')artwork+=leaf(x,y,(i*33)%90,'#8b633f',.46+(i%4)*.09);
   else artwork+=`<ellipse cx="${x}" cy="${y}" rx="${i%3+2}" ry="${i%4+1.5}" transform="rotate(${i*17} ${x} ${y})" fill="${color}" opacity=".65"/>`;
  }
 }
 return base+artwork+`<path d="M0 .5H240" stroke="#fff" stroke-opacity=".1"/></svg>`;
}
export const landscapeMethod=(kind)=>kind==='garland'?'КРИВАЯ · СВЕТ':kind==='climber'?'КРИВАЯ · РАСТЕНИЕ':kind==='scatter'||kind==='fill'?'НАНЕСЕНИЕ КИСТЬЮ':['path','edge'].includes(kind)?'ПО КОНТУРУ':'РАЗМЕЩЕНИЕ';
