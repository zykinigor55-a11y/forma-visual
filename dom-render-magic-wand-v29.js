/* DOM.RENDER magic wand v29. Connected, source-color-aware region only.
 * Fast mask proposal; not a semantic segmentation model. */
(function(){
 'use strict';
 function lab(r,g,b){
   const lin=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)};
   r=lin(r);g=lin(g);b=lin(b);
   const x=(0.4124564*r+0.3575761*g+0.1804375*b)/0.95047;
   const y=(0.2126729*r+0.7151522*g+0.0721750*b);
   const z=(0.0193339*r+0.1191920*g+0.9503041*b)/1.08883;
   const f=t=>t>0.00885645168?Math.cbrt(t):7.787037037*t+16/116;
   const fx=f(x),fy=f(y),fz=f(z);
   return [116*fy-16,500*(fx-fy),200*(fy-fz)];
 }
 function select(image,{x,y,tolerance=18,maxCoverage=0.42}={}){
   const w=image.width|0,h=image.height|0,n=w*h,p=image.data;
   if(!w||!h||!p||p.length<4*n)throw Error('Нет пикселей для выделения');
   const ix=Math.max(0,Math.min(w-1,Math.round(x))),iy=Math.max(0,Math.min(h-1,Math.round(y)));
   const seed=iy*w+ix;
   // Sample multiple pixels very close to the click to ignore one-off JPEG noise and highlights.
   const samples=[[],[],[]];
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=ix+dx,yy=iy+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
    const j=(yy*w+xx)*4,labPix=lab(p[j],p[j+1],p[j+2]);
    for(let k=0;k<3;k++)samples[k].push(labPix[k]);
   }
   const anchor=samples.map(a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)]);
   const tol=Math.max(7,Math.min(42,Number(tolerance)||18));
   const tolSq=tol*tol;
   const maxCount=Math.min(n-1,Math.floor(n*Math.max(.08,Math.min(.48,Number(maxCoverage)||.42))));
   const visited=new Uint8Array(n),region=new Uint8Array(n),queue=new Int32Array(n),colorCache=new Float32Array(n*3);
   // Only inspect neighbors reached by connected flood fill; never match every pixel in the scene.
   // Cache Lab channels for visited pixels to reduce repeated conversion work.
   const labAt=i=>{
     const c=i*3;
     if(!visited[i]){
       visited[i]=1;
       const j=i*4,v=lab(p[j],p[j+1],p[j+2]);
       colorCache[c]=v[0];colorCache[c+1]=v[1];colorCache[c+2]=v[2];
     }
     return c;
   };
   const fits=i=>{
     const j=labAt(i),dL=colorCache[j]-anchor[0],da=colorCache[j+1]-anchor[1],db=colorCache[j+2]-anchor[2];
     // L is weighted to avoid crossing dark timber/metal into lighter paving and foliage.
     return (1.25*dL*dL+da*da+db*db)<=tolSq;
   };
   if(!fits(seed))return {mask:region,count:0,width:w,height:h,overflow:false};
   let head=0,tail=0,count=0;
   queue[tail++]=seed;
   region[seed]=1;count=1;
   while(head<tail){
     const i=queue[head++],xx=i%w,yy=(i/w)|0;
     const neighbors=[xx?i-1:-1,xx<w-1?i+1:-1,yy?i-w:-1,yy<h-1?i+w:-1];
     for(let k=0;k<4;k++){
       const j=neighbors[k];if(j<0||region[j])continue;
       if(fits(j)){
         region[j]=1;queue[tail++]=j;count++;
         if(count>maxCount)return {mask:null,count,width:w,height:h,overflow:true};
         continue;
       }
       // For vertical battens/falz, allow crossing a *horizontal* gap of at
       // most two dark pixels when matching material continues immediately.
       // Never bridge 3+ pixels: window frames and material borders stay intact.
       if(k>1)continue;
       const dir=k===0?-1:1;
       for(let gap=1;gap<=2;gap++){
         const destX=xx+dir*(gap+1);
         if(destX<0||destX>=w)break;
         const dest=i+dir*(gap+1);
         if(!fits(dest))continue;
         if(!region[dest]){region[dest]=1;queue[tail++]=dest;count++}
         for(let t=1;t<=gap;t++){
           const gapIndex=i+dir*t;
           if(!region[gapIndex]){region[gapIndex]=1;count++}
         }
         if(count>maxCount)return {mask:null,count,width:w,height:h,overflow:true};
         break;
       }
     }
   }
   // Fill only 1–2 px hairline breaks enclosed by already-selected surface pixels.
   // This closes thin standing-seam shadows without crossing wide window/door frames.
   const completed=region.slice();
   let corrected=0;
   for(let yy=1;yy<h-1;yy++){
    const row=yy*w;
    for(let xx=1;xx<w-3;xx++){
     const i=row+xx;
     if(!region[i])continue;
     if(!region[i+1]&&region[i+2]){
      if(!completed[i+1]){completed[i+1]=1;corrected++}
     }else if(!region[i+1]&&!region[i+2]&&region[i+3]){
      if(!completed[i+1]){completed[i+1]=1;corrected++}
      if(!completed[i+2]){completed[i+2]=1;corrected++}
     }
    }
   }
   return {mask:completed,count:count+corrected,width:w,height:h,overflow:false};
 }
 window.DOM_RENDER_MAGIC_WAND={select,version:'30'};
})();