/* PLUX V31 · faithful glass tinting for the five-state mascot.
   Luminance-to-pigment mapping keeps shadows and pure specular whites; red stays
   red and blue stays blue rather than shifting from the emerald source video.
   Additive settings component: no alterations to V30 character geometry/videos.
*/
(()=>{
 'use strict';
 if(window.PLUXColorsV31)return;
 const colors=[
  {id:'emerald',label:'Изумрудный',hex:'#00ba79',mid:[.04,.82,.42]},
  {id:'red',label:'Красный',hex:'#e52232',mid:[.98,.045,.055]},
  {id:'blue',label:'Синий',hex:'#1465e8',mid:[.06,.25,.98]},
  {id:'turquoise',label:'Бирюзовый',hex:'#02c7c8',mid:[.035,.85,.86]},
  {id:'purple',label:'Фиолетовый',hex:'#7b4cdd',mid:[.53,.15,.89]},
  {id:'rose',label:'Розовый',hex:'#ee6aab',mid:[.97,.32,.66]},
  {id:'gold',label:'Золотой',hex:'#e3b94f',mid:[.9,.65,.12]},
  {id:'silver',label:'Серебристый',hex:'#d0e6e4',mid:[.79,.86,.86]}
 ];
 const ids=new Set(colors.map(c=>c.id));
 let current='emerald';
 try{const saved=localStorage.getItem('plux31_drop_color');if(ids.has(saved))current=saved;}catch{}
 const ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('aria-hidden','true');
 svg.setAttribute('focusable','false');
 svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
 const defs=document.createElementNS(ns,'defs');
 for(const c of colors){
  const filter=document.createElementNS(ns,'filter');
  filter.setAttribute('id','plux31-tint-'+c.id);
  filter.setAttribute('color-interpolation-filters','sRGB');
  filter.setAttribute('x','-10%');filter.setAttribute('y','-10%');
  filter.setAttribute('width','120%');filter.setAttribute('height','120%');
  const gray=document.createElementNS(ns,'feColorMatrix');
  gray.setAttribute('type','saturate');
  gray.setAttribute('values','0');gray.setAttribute('in','SourceGraphic');
  gray.setAttribute('result','mono');
  filter.append(gray);
  const convert=document.createElementNS(ns,'feComponentTransfer');
  convert.setAttribute('in','mono');
  for(let i=0;i<3;i++){
   const ch=document.createElementNS(ns,['feFuncR','feFuncG','feFuncB'][i]);
   ch.setAttribute('type','table');
   ch.setAttribute('tableValues','0 '+c.mid[i]+' 1');
   convert.append(ch);
  }
  const alpha=document.createElementNS(ns,'feFuncA');alpha.setAttribute('type','identity');convert.append(alpha);
  filter.append(convert);defs.append(filter);
 }
 svg.append(defs);
 (document.body||document.documentElement).append(svg);
 const mediaSelectors=[
  '#home-mascot img','#home-mascot video',
  '#screen-voice #voice-image','#screen-voice #state-video',
  '#screen-voice .voice-image-layer img','#screen-voice .voice-image-layer video',
  '#screen-home .plux-v106-video','#screen-voice .plux-v106-video',
  '#screen-chat .plux-v106-video'
 ];
 const selector=mediaSelectors.join(',');
 function apply(){
  const effect='url("#plux31-tint-'+current+'")';
  document.querySelectorAll(selector).forEach(el=>{
    if(el.dataset.plux31Tint===current)return;
    el.style.setProperty('filter',effect,'important');
    el.dataset.plux31Tint=current;
  });
 }
 const panel=document.createElement('section');
 panel.id='plux31-color-panel';panel.className='plux31-color-panel';
 const title=document.createElement('h3');title.textContent='Цвет капли';
 const sub=document.createElement('p');sub.textContent='Чистые оттенки с сохранением глубины и бликов стекла';
 const grid=document.createElement('div');grid.className='plux31-color-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Выбрать цвет капли');
 const name=document.createElement('div');name.className='plux31-color-current';
 for(const c of colors){
  const b=document.createElement('button');b.type='button';
  b.className='plux31-color-option';b.dataset.color=c.id;
  b.title=c.label;b.setAttribute('aria-label','Цвет капли: '+c.label);
  const swatch=document.createElement('span');swatch.className='plux31-color-swatch';swatch.style.setProperty('--plux31-chip',c.hex);
  const text=document.createElement('span');text.className='plux31-color-label';text.textContent=c.label;
  b.append(swatch,text);
  b.addEventListener('click',()=>{
   current=c.id;
   try{localStorage.setItem('plux31_drop_color',current)}catch{}
   render();apply();
  });
  grid.append(b);
 }
 panel.append(title,sub,grid,name);
 function render(){
  const c=colors.find(x=>x.id===current)||colors[0];
  name.textContent='Выбран: '+c.label;
  grid.querySelectorAll('button').forEach(b=>{
   const selected=b.dataset.color===current;
   b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
  });
 }
 function mount(){
  const screen=document.getElementById('screen-settings')||document.querySelector('[data-screen="settings"]');
  if(!screen)return;
  if(!panel.isConnected){
   const wrapper=screen.querySelector('.settings-content,.settings-panel,.settings-list,.settings-body')||screen;
   wrapper.append(panel);
  }
  render();
 }
 mount();apply();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();apply()},{once:true});
 const observer=new MutationObserver(muts=>{
   // Only reapply for newly inserted character frames, never per animation frame.
   if(muts.some(m=>m.addedNodes.length)){
      mount();apply();
   }
 });
 if(document.body)observer.observe(document.body,{childList:true,subtree:true});
 window.PLUXColorsV31={choose(id){if(!ids.has(id))return false;current=id;render();apply();return true},get:()=>current};
})();