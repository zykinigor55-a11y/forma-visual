/* Align-aware Clean SketchUp grade: uses the already aligned, furniture-free model; no geometry changes. */
(function(){
 'use strict';
 const key='assets/residence-model-sketch.jpg';
 const src=window.DOM_RENDER_ASSETS?.[key];
 if(!src)return;
 const img=new Image();
 img.onload=()=>{
   try{
     const w=img.naturalWidth,h=img.naturalHeight;
     const cn=document.createElement('canvas');cn.width=w;cn.height=h;
     const c=cn.getContext('2d',{alpha:false});
     c.filter='contrast(1.09) brightness(1.015) saturate(1.07)';
     c.drawImage(img,0,0,w,h);
     c.filter='none';
     const sx=w/2048,sy=h/1143;
     c.save();c.scale(sx,sy);
     // Subtle construction strokes on the retained wood soffit.
     c.beginPath();c.moveTo(270,363);c.lineTo(465,126);c.lineTo(1025,236);c.lineTo(1037,295);c.lineTo(535,379);c.lineTo(270,452);c.closePath();
     c.clip();c.strokeStyle='rgba(78,70,58,.24)';c.lineWidth=1.5;
     for(let i=0;i<24;i++){
       const x=284+i*34;
       c.beginPath();c.moveTo(x,128);c.lineTo(x,458);c.stroke();
     }
     c.restore();
     // Draw only architecture strokes - no inserted furniture, people, or trees.
     c.strokeStyle='rgba(55,67,73,.33)';c.lineWidth=1.7*sx;
     for(const line of [
       [[1040,447],[1211,420],[1846,486]],[[1040,519],[1211,488],[1846,550]],
       [[232,465],[518,380],[1040,445]],[[465,40],[1220,194]],
       [[248,743],[1002,751]],[[1183,753],[1835,755]]
     ]){c.beginPath();line.forEach(([x,y],i)=>i?c.lineTo(x*sx,y*sy):c.moveTo(x*sx,y*sy));c.stroke()}
     const data=cn.toDataURL('image/webp',.88);
     window.DOM_RENDER_ASSETS[key]=data;
     // Do not overwrite a user-uploaded source image.
     if(typeof project!=='undefined' && project?.demo){
       const before=document.getElementById('beforeImg');
       if(before)before.src=data;
     }
   }catch(e){console.warn('Clean SketchUp grade unavailable; original aligned model retained.')}
 };
 img.src=src;
})();
