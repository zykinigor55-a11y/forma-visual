/* FORMA LIGHT STUDIO — camera-relative visual light editing.
   Visual preview is an artistic estimate, not ray tracing or photometry.
   Canvas/handles are editor-only; never included in generated or exported images. */
(() => {
 'use strict';
 const $=(selector,root=document)=>root.querySelector(selector);
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 let stage=null,overlay=null,canvas=null,handles=null,hitplane=null,toolbar=null;
 let selected=-1,drag=null,draft=null,frame=0,previewOn=true,observer=null;
 const sources=()=>window.FORMA_INTERIORS?.normalizeLights(window.FORMA_INTERIORS.state().lightSources)||[];
 function canEdit(){
  const dialog=$('#formaStudioWorkspace[data-tool="interior"]');
  return Boolean(dialog?.open && !dialog.classList.contains('needs-source') &&
   !$('#faInteriorLightEditor')?.hidden && document.body.classList.contains('forma-interior-mode'));
 }
 function lightColor(temperature){
  const t=clamp((temperature-2200)/4300,0,1);
  return [Math.round(255-20*t),Math.round(170+75*t),Math.round(97+153*t)];
 }
 function rgba(rgb,alpha){return 'rgba('+rgb.join(',')+','+clamp(alpha,0,1).toFixed(3)+')'}
 function point(event){
  const rect=stage.getBoundingClientRect();
  return {x:clamp((event.clientX-rect.left)/Math.max(rect.width,1)*100,2,98),
          y:clamp((event.clientY-rect.top)/Math.max(rect.height,1)*100,2,98)};
 }
 function draw(){
  frame=0;
  if(!canvas||!stage||!overlay||overlay.hidden)return;
  const bounds=stage.getBoundingClientRect(),w=bounds.width,h=bounds.height;
  if(w<5||h<5)return;
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const cw=Math.round(w*ratio),ch=Math.round(h*ratio);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  if(!previewOn)return;
  for(const source of draft||sources()){
   if(source.intensity<=0)continue;
   const x=source.x*w/100,y=source.y*h/100;
   const tx=source.targetX*w/100,ty=source.targetY*h/100;
   const dx=tx-x,dy=ty-y,distance=Math.max(35,Math.hypot(dx,dy));
   const angle=Math.atan2(dy,dx),half=clamp(source.cone*Math.PI/360,.1,1.04);
   const strength=clamp(source.intensity/100,0,2);
   const color=lightColor(source.temperature);
   const radius=clamp(distance*1.65,55,Math.max(w,h)*.83);
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);
   const grad=ctx.createRadialGradient(0,0,4,0,0,radius);
   grad.addColorStop(0,rgba(color,.23*strength));
   grad.addColorStop(.34,rgba(color,.145*strength));
   grad.addColorStop(1,rgba(color,0));
   ctx.beginPath();ctx.moveTo(0,0);
   ctx.arc(0,0,radius,-half,half,false);ctx.closePath();
   ctx.fillStyle=grad;ctx.fill();
   ctx.restore();
   ctx.save();ctx.translate(tx,ty);
   const spread=clamp(18+Math.tan(half)*distance*.40,25,Math.max(w,h)*.33);
   ctx.scale(1,.52);
   const floor=ctx.createRadialGradient(0,0,1,0,0,spread);
   floor.addColorStop(0,rgba(color,.22*strength));
   floor.addColorStop(.45,rgba(color,.09*strength));
   floor.addColorStop(1,rgba(color,0));
   ctx.beginPath();ctx.arc(0,0,spread,0,Math.PI*2);ctx.fillStyle=floor;ctx.fill();ctx.restore();
  }
 }
 function paint(){if(!frame)frame=requestAnimationFrame(draw)}
 function moveHandles(){
  if(!handles||!stage)return;
  const items=draft||sources(),rect=stage.getBoundingClientRect(),w=rect.width,h=rect.height;
  handles.querySelectorAll('.fa-light-pair').forEach(node=>{
   const index=Number(node.dataset.lightIndex),source=items[index];if(!source)return;
   const marker=node.querySelector('.fa-light-marker'),aim=node.querySelector('.fa-light-aim'),line=node.querySelector('.fa-light-direction');
   const x=source.x*w/100,y=source.y*h/100,tx=source.targetX*w/100,ty=source.targetY*h/100;
   const dx=tx-x,dy=ty-y;
   marker.style.left=x+'px';marker.style.top=y+'px';
   aim.style.left=tx+'px';aim.style.top=ty+'px';
   line.style.left=x+'px';line.style.top=y+'px';line.style.width=Math.hypot(dx,dy)+'px';line.style.transform='rotate('+Math.atan2(dy,dx)+'rad)';
  });
  paint();
 }
 function makeButton(cls,label,text,index,part){
  const button=document.createElement('button');
  button.type='button';button.className=cls;
  button.setAttribute('aria-label',label);
  button.dataset.lightPart=part;button.dataset.lightIndex=String(index);
  button.textContent=text;return button;
 }
 function repaint(){
  if(!overlay)return;
  const items=draft||sources();
  selected=items.length?clamp(selected<0?0:selected,0,items.length-1):-1;
  handles.replaceChildren();
  items.forEach((source,index)=>{
   const group=document.createElement('div');group.className='fa-light-pair'+(index===selected?' is-selected':'');
   group.dataset.lightIndex=String(index);
   const line=document.createElement('span');line.className='fa-light-direction';
   const marker=makeButton('fa-light-marker','Источник '+(index+1)+'. Перемещайте стрелками или перетаскиванием.',String(index+1),index,'source');
   marker.title=source.mode==='fixture'?'Видимый светильник':'Невидимый источник света';
   marker.dataset.fixture=source.mode;
   const aim=makeButton('fa-light-aim','Направление луча '+(index+1)+'. Перемещайте стрелками или перетаскиванием.','+',index,'aim');
   group.append(line,marker,aim);handles.append(group);
  });
  overlay.classList.toggle('fa-light-has-sources',items.length>0);
  overlay.classList.toggle('fa-light-preview-off',!previewOn);
  if(toolbar)toolbar.querySelector('[data-light-preview-toggle]').textContent=previewOn?'◉ Свет включён':'○ Показать свет';
  moveHandles();
 }
 function mount(){
  const next=$('#formaStudioWorkspace[data-tool="interior"] #stage');
  if(!next||!canEdit()){if(overlay)overlay.hidden=true;return}
  if(next!==stage){stage=next;if(overlay)overlay.remove();if(observer)observer.disconnect();}
  if(!overlay){
   overlay=document.createElement('div');overlay.id='faLightCanvasOverlay';
   overlay.className='fa-light-overlay';
   overlay.innerHTML='<canvas class="fa-light-preview" aria-hidden="true"></canvas>'+
     '<div class="fa-light-hitplane" aria-label="Область размещения источников света"></div>'+
     '<div class="fa-light-handles"></div>'+
     '<div class="fa-light-overlay-toolbar"><strong>LIGHT STUDIO <span>· ЖИВОЙ ПРЕДПРОСМОТР</span></strong>'+
     '<button type="button" data-light-preview-toggle aria-pressed="true">◉ Свет включён</button></div>'+
     '<p class="fa-light-overlay-help">Перетаскивайте номер источника и точку + для направления луча</p>';
   canvas=$('.fa-light-preview',overlay);handles=$('.fa-light-handles',overlay);
   hitplane=$('.fa-light-hitplane',overlay);toolbar=$('.fa-light-overlay-toolbar',overlay);
   overlay.addEventListener('pointerdown',pointerDown);
   overlay.addEventListener('pointermove',pointerMove);
   overlay.addEventListener('pointerup',pointerUp);
   overlay.addEventListener('pointercancel',pointerUp);
   overlay.addEventListener('keydown',keyMove);
   $('[data-light-preview-toggle]',overlay).addEventListener('click',event=>{
    previewOn=!previewOn;event.currentTarget.setAttribute('aria-pressed',String(previewOn));repaint();
   });
  }
  if(overlay.parentElement!==stage)stage.append(overlay);
  overlay.hidden=false;
  if(!observer && typeof ResizeObserver!=='undefined')observer=new ResizeObserver(()=>{moveHandles();paint()});
  observer?.observe(stage);
  repaint();
 }
 function setSelection(index,scroll=false){
  const all=sources();if(!all.length){selected=-1;repaint();return}
  selected=clamp(Number(index)||0,0,all.length-1);
  if(!canEdit())window.FORMA_INTERIORS?.openLighting();
  mount();repaint();
  if(scroll&&stage?.isConnected)stage.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function pointerDown(event){
  if(!canEdit()||event.button!==0||!sources().length)return;
  const part=event.target.closest('[data-light-part]');
  const onImage=event.target===hitplane;
  if(!part&&!onImage)return;
  event.preventDefault();event.stopPropagation();
  const index=part?Number(part.dataset.lightIndex):clamp(selected,0,sources().length-1);
  selected=index;
  draft=sources();const start=point(event);
  const item=draft[index],kind=part?.dataset.lightPart||'source';
  drag={pointer:event.pointerId,index,kind,host:part||hitplane,start,
    origin:{x:item.x,y:item.y,targetX:item.targetX,targetY:item.targetY}};
  if(onImage){item.x=start.x;item.y=start.y;
    const dx=start.x-drag.origin.x,dy=start.y-drag.origin.y;
    item.targetX=clamp(drag.origin.targetX+dx,2,98);item.targetY=clamp(drag.origin.targetY+dy,2,98);
    item.placement='custom';
  }
  try{drag.host.setPointerCapture(event.pointerId)}catch{}
  handles.querySelectorAll('.fa-light-pair').forEach((pair,i)=>pair.classList.toggle('is-selected',i===selected));
  moveHandles();
 }
 function pointerMove(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  event.preventDefault();
  const source=draft[drag.index],current=point(event);
  if(drag.kind==='aim'){source.targetX=current.x;source.targetY=current.y;}
  else{
   const dx=current.x-drag.start.x,dy=current.y-drag.start.y;
   const offsetX=drag.host===hitplane?current.x-drag.origin.x:dx;
   const offsetY=drag.host===hitplane?current.y-drag.origin.y:dy;
   source.x=clamp(drag.origin.x+offsetX,2,98);source.y=clamp(drag.origin.y+offsetY,2,98);
   source.targetX=clamp(drag.origin.targetX+offsetX,2,98);source.targetY=clamp(drag.origin.targetY+offsetY,2,98);
  }
  source.placement='custom';
  moveHandles();
 }
 function pointerUp(event){
  if(!drag||event.pointerId!==drag.pointer)return;
  event.preventDefault();event.stopPropagation();
  try{drag.host.releasePointerCapture(event.pointerId)}catch{}
  const saved=draft;drag=null;draft=null;
  if(saved)window.FORMA_INTERIORS?.setLights(saved);
  repaint();
 }
 function keyMove(event){
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  const node=event.target.closest('[data-light-part]');if(!node)return;
  const index=Number(node.dataset.lightIndex),all=sources(),item=all[index];if(!item)return;
  event.preventDefault();const delta=event.shiftKey?5:1;
  const dx=(event.key==='ArrowRight'?delta:event.key==='ArrowLeft'?-delta:0);
  const dy=(event.key==='ArrowDown'?delta:event.key==='ArrowUp'?-delta:0);
  if(node.dataset.lightPart==='aim'){item.targetX=clamp(item.targetX+dx,2,98);item.targetY=clamp(item.targetY+dy,2,98)}
  else{item.x=clamp(item.x+dx,2,98);item.y=clamp(item.y+dy,2,98);item.targetX=clamp(item.targetX+dx,2,98);item.targetY=clamp(item.targetY+dy,2,98)}
  item.placement='custom';selected=index;window.FORMA_INTERIORS?.setLights(all);repaint();
  const newNode=handles.querySelector('[data-light-index="'+index+'"][data-light-part="'+node.dataset.lightPart+'"]');
  newNode?.focus({preventScroll:true});
 }
 function sync(){if(!canEdit()){if(overlay)overlay.hidden=true;return}mount()}
 document.addEventListener('forma:interior-lighting-opened',sync);
 document.addEventListener('forma:interior-lights-changed',sync);
 document.addEventListener('forma:interior-mode-changed',sync);
 document.addEventListener('forma:interior-light-selected',event=>setSelection(event.detail?.index,event.detail?.scroll));
 document.addEventListener('forma:workspace-open',event=>{if(event.detail?.id==='interior')sync()});
 document.addEventListener('forma:workspace-close',()=>{drag=null;draft=null;if(overlay)overlay.hidden=true});
 document.addEventListener('forma:project-updated',()=>{selected=-1;sync()});
 window.addEventListener('resize',()=>{moveHandles();paint()});
 window.FORMA_LIGHT_CANVAS={open:()=>{window.FORMA_INTERIORS?.openLighting();sync()},get active(){return Boolean(overlay&&!overlay.hidden)}};
})();