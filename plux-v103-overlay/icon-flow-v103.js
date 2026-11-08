/** PLUX V10.3: animated liquid-light glyphs; preserve card artwork/text. */
const tiles=[...document.querySelectorAll('#screen-modes .mode-card')];
const areas=[[68,35,193,133],[88,29,174,132],[79,35,180,131],[75,40,189,125],[70,30,178,147],[72,30,191,134]];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clip=x=>Math.max(0,Math.min(1,x));
function makeMask(image,i){
  const canvas=document.createElement('canvas');canvas.width=260;canvas.height=250;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
  ctx.drawImage(image,0,0,260,250);const pix=ctx.getImageData(0,0,260,250),d=pix.data;
  const [l,t,r,bottom]=areas[i];
  for(let y=0;y<250;y++)for(let x=0;x<260;x++){
    const p=(y*260+x)*4,red=d[p],green=d[p+1],blue=d[p+2];
    const bright=Math.max(red,green,blue);
    const chroma=i===3?blue-green*.68:green-red*.68;
    const edge=clip(Math.min(x-l,r-x,y-t,bottom-y)/7);
    const a=edge*clip((bright-43)/105)*clip((chroma-12)/42);
    d[p]=d[p+1]=d[p+2]=255;d[p+3]=Math.round(235*a);
  }
  ctx.putImageData(pix,0,0);
  return canvas.toDataURL('image/png');
}
tiles.forEach((card,i)=>{
  const light=document.createElement('span');light.className='mode-icon-shimmer';
  light.setAttribute('aria-hidden','true');light.style.setProperty('--phase',i*-.77+'s');
  card.appendChild(light);if(reduce)return;
  const image=new Image();image.decoding='async';image.onload=()=>{
    try{
      const mask=makeMask(image,i);if(!mask)return;
      light.style.webkitMaskImage="url('"+mask+"')";
      light.style.maskImage="url('"+mask+"')";
      light.classList.add('is-ready');
    }catch(e){console.warn('PLUX cosmetic icon effect unavailable',e);}
  };
  image.src='/assets/mode-tiles/mode-'+(i+1)+'.webp';
});
