/* ДОМ.РЕНДЕР v31: free masked color preview + tentative local zone selection.
 * Zone proposals use image heuristics, not semantic AI. Always verify the mask. */
(function(){
 'use strict';
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function recolor(base,mask,hex){
  if(!base?.data||!mask?.data||!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Укажите цвет и выберите область');
  const n=base.width*base.height,src=base.data,m=mask.data,out=new Uint8ClampedArray(n*4);
  const target=[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));
  let sum=0,count=0;
  for(let i=0;i<n;i++){const j=i*4;if(m[j+3]>80){sum+=src[j]*.2126+src[j+1]*.7152+src[j+2]*.0722;count++}}
  if(count<8)return {width:base.width,height:base.height,data:out,count:0};
  const avg=Math.max(12,sum/count);
  for(let i=0;i<n;i++){
   const j=i*4;if(m[j+3]<=80)continue;
   const lum=src[j]*.2126+src[j+1]*.7152+src[j+2]*.0722;
   const f=clamp(.56+.44*lum/avg,.36,1.6);
   for(let k=0;k<3;k++)out[j+k]=clamp(target[k]*f,0,255);
   out[j+3]=236;
  }
  return {width:base.width,height:base.height,data:out,count};
 }
 function guess(image,zone){
  const {width:w,height:h,data:p}=image,n=w*h;
  if(!w||!h||!p||p.length!==n*4)return null;
  const out=new Uint8Array(n),dark=new Uint8Array(n);let count=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,j=i*4,r=p[j],g=p[j+1],b=p[j+2],l=.2126*r+.7152*g+.0722*b;
   const xn=x/w,yn=y/h,neutral=Math.max(r,g,b)-Math.min(r,g,b)<35,warm=r>g*1.10&&g>b*1.06&&r>65&&r<228;
   dark[i]=neutral&&l<115&&xn>.09&&xn<.92&&yn>.16&&yn<.82?1:0;
   let found=false;
   if(zone==='terrace')found=warm&&yn>.55&&yn<.91&&xn>.055&&xn<.96;
   if(zone==='steps')found=warm&&yn>.67&&yn<.92&&xn>.055&&xn<.96;
   if(zone==='roof')found=neutral&&l>20&&l<166&&yn>.07&&yn<.29&&xn>.06&&xn<.94;
   if(zone==='main')found=neutral&&l>20&&l<160&&yn>.16&&yn<.81&&xn>.055&&xn<.53;
   if(zone==='accent')found=warm&&yn>.18&&yn<.79&&xn>.26&&xn<.87;
   if(zone==='base')found=neutral&&l>20&&l<155&&yn>.68&&yn<.88&&xn>.04&&xn<.92;
   if(found){out[i]=1;count++}
  }
  if(zone==='windows'||zone==='doors'){
   const visited=new Uint8Array(n),queue=new Int32Array(n);
   for(let k=0;k<n;k++){
    if(!dark[k]||visited[k])continue;
    let head=0,tail=1,xmin=k%w,xmax=xmin,ymin=(k/w)|0,ymax=ymin;
    queue[0]=k;visited[k]=1;
    while(head<tail){
     const i=queue[head++],x=i%w,y=(i/w)|0;
     xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);
     const adj=[x?i-1:-1,x<w-1?i+1:-1,y?i-w:-1,y<h-1?i+w:-1];
     for(const a of adj)if(a>=0&&dark[a]&&!visited[a]){visited[a]=1;queue[tail++]=a}
    }
    const bw=xmax-xmin+1,bh=ymax-ymin+1,aspect=bh/bw;
    if(bw<w*.018||bw>w*.23||bh<h*.09||bh>h*.53||xmin<w*.09||ymin<h*.15)continue;
    if((zone==='windows'&&!(aspect>.65&&aspect<3.3))||(zone==='doors'&&!(aspect>2&&aspect<7&&bh>h*.18)))continue;
    if(tail<.08*bw*bh)continue;
    const thick=Math.max(2,Math.round(Math.min(bw,bh)*.14));
    for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
     const i=y*w+x;
     if(!dark[i])continue;
     const frame=x<xmin+thick||x>xmax-thick||y<ymin+thick||y>ymax-thick;
     if((zone==='doors'||frame)&&!out[i]){out[i]=1;count++}
    }
   }
  }
  if(count<Math.max(50,n*.001)||count>n*.43)return null;
  return {width:w,height:h,mask:out,count,coverage:count/n,confidence:'low'};
 }
 window.DOM_RENDER_MATERIAL_PREVIEW={recolor,guess,version:31};
})();