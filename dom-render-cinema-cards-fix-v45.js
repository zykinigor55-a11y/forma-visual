/* DOM.RENDER v45: reliable independent cinema card hydration.
   Approved 6x4 image atlas; use individual 1024x768 canvas copies.
   Does not depend on project loading or the animation renderer. */
(function(){
 'use strict';
 const groups=[
  {id:'animCameras',kind:'camera',labels:[['alexa35','ARRI ALEXA 35'],['alexamini','ARRI ALEXA Mini LF'],['venice2','Sony VENICE 2'],['vraptor','RED V-RAPTOR [X]'],['komodox','Canon EOS C400'],['ursa','Blackmagic URSA Cine 12K LF']]},
  {id:'animLenses',kind:'lens',labels:[['ultra14','18 мм'],['shift24','25 мм'],['cine35','35 мм'],['cine50','47 мм'],['portrait85','75 мм'],['macro100','95 мм']]},
  {id:'animMoves',kind:'motion',labels:[['orbit','Orbit'],['dolly','Dolly In'],['drone','Dolly Out'],['slider','Truck'],['crane','Crane Up'],['walk','Fly-by']]},
  {id:'animGrades',kind:'grade',labels:[['neutral','Clean'],['filmic','Black Pro-Mist 1/8'],['contrast','Glimmerglass 1/4'],['warm','CPL'],['cool','ND 0.9'],['bw','Blue Streak']]}
 ];
 const assets={};
 let atlasLoaded=false;
 const fallback=(kind,id)=>'/assets/cinema/'+({camera:'cameras',lens:'lenses',motion:'motions',grade:'grades'}[kind])+'/'+id+'.svg';
 function hydrate(){
  const lib=window.DOM_RENDER_ANIMATION;
  for(const g of groups){
   const el=document.getElementById(g.id);if(!el)return;
   const catalog=lib?.[({camera:'cameras',lens:'lenses',motion:'moves',grade:'grades'})[g.kind]]||[];
   const picked=lib?.defaults?.[g.kind==='motion'?'motion':g.kind==='grade'?'grade':g.kind]||g.labels[0][0];
   if(!el.querySelector('.anim-option-card')){
    el.innerHTML=g.labels.map(([id,name])=>{
     const info=catalog.find(x=>x.id===id)||{};
     const img=assets[g.kind+':'+id]||fallback(g.kind,id);
     return '<button type="button" class="anim-option-card '+(picked===id?'active':'')+'" data-anim-kind="'+g.kind+'" data-anim-id="'+id+'" aria-pressed="'+(picked===id)+'"><span class="anim-option-photo"><img src="'+img+'" alt="'+name+'" loading="eager" decoding="async"><span class="anim-option-check" aria-hidden="true">✓</span></span><span class="anim-option-copy"><strong>'+name+'</strong><em>'+(info.tag||'')+'</em><small>'+(info.desc||'')+'</small></span></button>';
    }).join('');
   }
   for(const [id] of g.labels){
    const card=Array.from(el.querySelectorAll('.anim-option-card')).find(x=>x.dataset.animId===id);
    const img=card?.querySelector('.anim-option-photo img');
    if(img&&assets[g.kind+':'+id]&&img.src!==assets[g.kind+':'+id]){img.src=assets[g.kind+':'+id];img.style.filter='none';}
   }
  }
  document.querySelectorAll('#animationPanel details.anim-section').forEach(el=>el.open=true);
 }
 function loadAtlas(){
  if(atlasLoaded)return;
  atlasLoaded=true;
  const img=new Image();
  img.onload=function(){
   try{
    for(let row=0;row<groups.length;row++)for(let col=0;col<6;col++){
     const g=groups[row],id=g.labels[col][0],canvas=document.createElement('canvas');
     canvas.width=1024;canvas.height=768;
     const c=canvas.getContext('2d');
     if(!c)continue;
     c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
     c.drawImage(img,img.naturalWidth*col/6,img.naturalHeight*row/4,img.naturalWidth/6,img.naturalHeight/4,0,0,1024,768);
     assets[g.kind+':'+id]=canvas.toDataURL('image/webp',.94);
    }
    hydrate();
   }catch(e){console.warn('Cinema atlas:',e)}
  };
  img.onerror=()=>console.warn('Approved cinema atlas unavailable, using fallback');
  img.src='/assets/cinema/forma-cinema-atlas.webp?v=approved-v45';
 }
 function start(){
  hydrate();
  loadAtlas();
  document.querySelectorAll('[data-mobile="animation"],[data-nav="animation"],[data-tab="animation"]').forEach(el=>el.addEventListener('click',()=>queueMicrotask(hydrate)));
  window.addEventListener('pageshow',hydrate);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();