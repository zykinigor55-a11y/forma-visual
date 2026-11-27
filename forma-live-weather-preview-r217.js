/* R217 · animated miniature of current scene weather. No extra WebGL context.
 * Draw only while a panel is visible; reduced motion preference is respected.
 */
export function mountLiveWeatherPreviewR217(host,read){
 if(!host)return null;
 const canvas=document.createElement('canvas');canvas.width=560;canvas.height=200;canvas.style.cssText='display:block;width:100%;height:auto;aspect-ratio:2.8;border-radius:9px;background:#26313b';canvas.setAttribute('aria-label','Анимированная миниатюра текущей погоды');
 const note=document.createElement('small');note.style.cssText='display:block;color:#adb8bd;font-size:10px;margin-top:5px';host.append(canvas,note);
 const c=canvas.getContext('2d');if(!c)return null;
 const w=560,h=200,wrap=(a,b)=>((a%b)+b)%b;
 let last=0,clock=0;
 function frame(now){
  requestAnimationFrame(frame);
  if(document.hidden||!host.getClientRects().length||host.offsetWidth===0||now-last<65){last=host.getClientRects().length?last:0;return;}
  clock+=last?Math.min(.1,(now-last)/1000):0;last=now;
  const t=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:clock,s=read();if(!s)return;
  const e=s.sunElevation,day=Math.max(0,Math.min(1,(e+14)/35)),warm=Math.max(0,1-Math.abs(e-3)/22);
  const rgb=(a,b,f)=>'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*f)).join(',')+')';
  const sky=c.createLinearGradient(0,0,0,h*.77);sky.addColorStop(0,rgb([18,31,50],[89,132,168],day));sky.addColorStop(1,rgb([53+55*warm,67+30*warm,94],[210,218-32*warm,219-55*warm],day));c.fillStyle=sky;c.fillRect(0,0,w,h);
  if(e>0){const x=w*.76,y=h*.60-Math.min(85,e)*1.1;c.fillStyle='#f5dfb8';c.globalAlpha=.85*(1-s.clouds/160);c.beginPath();c.arc(x,y,8,0,7);c.fill();c.globalAlpha=1;}
  for(let i=0;i<9;i++){const x=wrap(i*109+t*(2+s.wind*.17),w+180)-90,y=18+(i*29)%55;const g=c.createRadialGradient(x,y,2,x,y,65);g.addColorStop(0,day>.5?'#e6e9e8aa':'#8492ad88');g.addColorStop(1,'#b8c6d000');c.globalAlpha=s.clouds/100;c.save();c.translate(x,y);c.scale(1,.26);c.translate(-x,-y);c.fillStyle=g;c.fillRect(x-66,y-66,132,132);c.restore();}c.globalAlpha=1;
  c.fillStyle=rgb([29,44,49],[80,105,97],day);c.beginPath();c.moveTo(0,133);for(let x=0;x<=w;x+=5)c.lineTo(x,113+10*Math.sin(x*.027)+5*Math.cos(x*.067));c.lineTo(w,h);c.lineTo(0,h);c.fill();
  c.fillStyle=rgb([25,38,38],[69,87,70],day);c.fillRect(0,145,w,55);
  if(s.snowGround){c.fillStyle='rgba(222,232,235,'+s.snowGround/130+')';c.fillRect(0,145,w,55);}
  if(s.hasWater){c.fillStyle=rgb([37,52,65],[112,145,152],day);c.beginPath();c.moveTo(242,145);c.lineTo(335,145);c.lineTo(468,200);c.lineTo(121,200);c.fill();c.save();c.clip();for(let j=0;j<12;j++){const y=151+j*4.5,x=wrap(j*81+t*(3+s.wind*.16),w);c.strokeStyle='rgba(210,225,226,'+s.ripples/250+')';c.beginPath();c.moveTo(x-80,y);c.lineTo(x+32,y);c.stroke();}c.restore();}
  for(let i=0;i<13;i++){const x=20+i*42,y=145+(i%3)*4,hh=39+(i*31)%51,bend=Math.sin(t*1.7+i)*s.wind*.06;
   c.strokeStyle='#4a4941';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x,y-hh*.55,x+bend,y-hh);c.stroke();
   for(let j=0;j<4;j++){const yy=y-hh+j*hh*.18,xx=x+bend*(1-j*.2);c.fillStyle=rgb([29,48,44],[56,83,64],day);c.beginPath();c.moveTo(xx,yy-12);c.lineTo(xx-8-j*3,yy+12);c.lineTo(xx+9+j*3,yy+12);c.closePath();c.fill();if(s.snowTrees){c.strokeStyle='rgba(220,232,235,'+s.snowTrees/110+')';c.beginPath();c.moveTo(xx-5-j*2,yy+3);c.lineTo(xx,yy-6);c.lineTo(xx+5+j*2,yy+3);c.stroke();}}
  }
  for(const [density,height,water] of [[s.groundDensity,s.groundHeight,false],[s.hasWater?s.waterDensity:0,s.waterHeight,true]]){
   if(!density)continue;c.save();if(water){c.beginPath();c.moveTo(242,139-height*5);c.lineTo(335,139-height*5);c.lineTo(468,200);c.lineTo(121,200);c.closePath();c.clip();}
   for(let i=0;i<17;i++){const x=wrap(i*89+t*s.driftSpeed*.82,w+200)-100,y=148+(i%4)*12-height*4,r=45+(i%4)*12;c.save();c.translate(x,y);c.scale(1,.12+height*.12);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,'rgba(221,232,234,'+density/230+')');g.addColorStop(1,'rgba(221,232,234,0)');c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();}c.restore();
  }
  c.fillStyle='rgba(200,211,217,'+s.haze/450+')';c.fillRect(0,88,w,112);
  if(s.rain){c.strokeStyle='rgba(213,228,238,.55)';c.lineWidth=.8;for(let i=0;i<s.rain*1.4;i++){const x=wrap(i*73.17+t*s.wind*1.6,w),y=wrap(i*41.3+t*210,h);c.beginPath();c.moveTo(x,y);c.lineTo(x+s.wind*.09,y+10);c.stroke();}}
  if(s.snowfall){c.fillStyle='#eff2f2';for(let i=0;i<s.snowfall*1.1;i++){const x=wrap(i*61.7+t*s.wind*.58+Math.sin(t+i)*3,w),y=wrap(i*47.3+t*(19+i%10),h);c.globalAlpha=.45+(i%3)*.2;c.beginPath();c.arc(x,y,.75+(i%3)*.35,0,7);c.fill();}c.globalAlpha=1;}
  note.textContent='Ветер '+s.wind+'% · Облака '+s.clouds+'%'+(s.rain?' · Дождь '+s.rain+'%':'')+(s.snowfall?' · Снег '+s.snowfall+'%':'')+(s.groundDensity?' · Туман '+s.groundDensity+'%':'')+(s.hasWater&&s.waterDensity?' · Над водой '+s.waterDensity+'%':'');
 }
 requestAnimationFrame(frame);return canvas;
}
