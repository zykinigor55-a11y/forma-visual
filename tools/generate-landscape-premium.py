#!/usr/bin/env python3
"""FORMA Landscape · detailed deterministic 1080x1080 overhead raster assets.
Offline preview library; not claimed to be AI photographic renders.
All plants/boulders/lights have transparent edges, ground tiles are seamless-ish
square photographic-style textures. Geometry stays controlled by the CAD editor.
"""
from __future__ import annotations
import hashlib, math, random, os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE=1080
ROOT=Path("assets/landscape-premium")
ROOT.mkdir(parents=True,exist_ok=True)
GROUPS={
"shrubs":["juniper","hydrangea","spirea","barberry","dogwood","thuja-globe","lavender","boxwood"],
"trees":["pine","spruce","birch","oak","maple","linden","willow","rowan","apple","sakura"],
"pavers":["concrete-pavers","granite-setts","clinker-herringbone","slate-pavers","radial-setts","grass-grid"],
"fills":["marble-chips","granite-chips","river-pebble","slate-chips","pine-bark"],
"lights":["bollard","ground","spot","low-post","deck-light","linear"],
"lawns":["formal","universal","shade","meadow"],
"ponds":["natural","formal-pond","bio-pond"],
"boulders":["granite-boulder","limestone-boulder","slate-boulder","sandstone-boulder"],
}
PALETTE={
"juniper":(65,105,87),"hydrangea":(104,126,68),"spirea":(124,154,72),"barberry":(127,60,68),
"dogwood":(91,126,69),"thuja-globe":(47,102,64),"lavender":(102,108,103),"boxwood":(61,100,58),
"pine":(70,107,68),"spruce":(39,80,64),"birch":(150,178,111),"oak":(78,120,55),
"maple":(114,142,60),"linden":(119,161,71),"willow":(121,150,80),"rowan":(90,137,74),
"apple":(102,139,74),"sakura":(136,159,97),
"granite-boulder":(108,111,108),"limestone-boulder":(187,174,145),"slate-boulder":(69,76,80),"sandstone-boulder":(166,128,91),
"concrete-pavers":(171,166,155),"granite-setts":(126,124,121),"clinker-herringbone":(163,106,80),"slate-pavers":(75,84,83),"radial-setts":(166,155,138),"grass-grid":(130,141,116),
"marble-chips":(204,200,187),"granite-chips":(138,137,131),"river-pebble":(155,140,119),"slate-chips":(72,80,82),"pine-bark":(107,71,48),
"formal":(96,140,66),"universal":(100,142,75),"shade":(64,111,65),"meadow":(106,146,79),
"natural":(37,91,93),"formal-pond":(37,88,105),"bio-pond":(44,102,92),
"bollard":(58,58,58),"ground":(65,65,62),"spot":(68,67,65),"low-post":(62,66,67),"deck-light":(63,65,69),"linear":(62,66,68)
}
assert sum(map(len,GROUPS.values()))==46
def rnd(label): return random.Random(int(hashlib.sha256(label.encode()).hexdigest()[:12],16))
def ch(v):return max(0,min(255,int(v)))
def tint(c,noise):return tuple(ch(v+noise) for v in c)
def px(v):return round(v)
def ellipse(draw,x,y,rx,ry,color,angle=None):
 if angle is None:
  draw.ellipse((px(x-rx),px(y-ry),px(x+rx),px(y+ry)),fill=color)
 else:
  # Tiny oblique leaf with soft self-shading.
  t=math.radians(angle);vx=math.cos(t)*rx;vy=math.sin(t)*rx
  wx=-math.sin(t)*ry;wy=math.cos(t)*ry
  draw.polygon([(px(x-vx-wx),px(y-vy-wy)),(px(x+vx-wx),px(y+vy-wy)),(px(x+vx+wx),px(y+vy+wy)),(px(x-vx+wx),px(y-vy+wy))],fill=color)
def plant(name,kind):
 r=rnd(name);c=PALETTE[name];im=Image.new("RGBA",(SIZE,SIZE));d=ImageDraw.Draw(im,"RGBA")
 cx=535+r.uniform(-12,12);cy=525+r.uniform(-12,12)
 radius=kind=="trees" and 440 or 395
 if name=="willow": radius=475
 evergreen=name in ("pine","spruce","juniper","thuja-globe","boxwood")
 flowering=name in ("hydrangea","spirea","lavender","apple","sakura")
 shady=Image.new("RGBA",(SIZE,SIZE));sh=ImageDraw.Draw(shady,"RGBA")
 for i in range(200):
  a=i*2*math.pi/200
  rad=radius*(.82+.10*math.sin(a*7+r.random()*.6)+.06*math.sin(a*13))
  x=cx+rad*.13+rad*math.cos(a);y=cy+rad*.12+rad*math.sin(a)
  sh.ellipse((x-40,y-40,x+40,y+40),fill=(13,24,16,24))
 im=Image.alpha_composite(im,shady.filter(ImageFilter.GaussianBlur(15)))
 d=ImageDraw.Draw(im,"RGBA")
 # A naturally irregular perimeter built from intersecting leaf canopies.
 for i in range(470):
  a=r.uniform(0,2*math.pi);rr=radius*math.sqrt(r.random())
  shape=.88+.10*math.sin(a*6)+.08*math.sin(a*11+2)
  x=cx+math.cos(a)*rr*shape;y=cy+math.sin(a)*rr*shape
  r0=r.uniform(22,71) if kind=="trees" else r.uniform(17,51)
  col=tint(c,r.uniform(-57,-8))
  d.ellipse((x-r0,y-r0*.77,x+r0,y+r0*.77),fill=(*col,255))
 # Visible woody branching, from central trunk outward. Not vertical trees.
 woody=(57,48,34,155) if name!="birch" else (217,209,184,180)
 for i in range(155 if kind=="trees" else 30):
  a=r.uniform(0,2*math.pi);rr=r.uniform(20,radius*.84)
  x=cx+math.cos(a)*rr;y=cy+math.sin(a)*rr
  d.line((cx+r.uniform(-12,12),cy+r.uniform(-12,12),x,y),fill=woody,width=r.randint(1,4))
 # Individual leaves, needles, shadows, highlights and crown parallax.
 total=17000 if kind=="trees" else 12000
 for i in range(total):
  a=r.uniform(0,math.tau);distance=radius*math.sqrt(r.random())
  silhouette=.87+.12*math.sin(a*6+1.2)+.07*math.sin(a*11+3.1)
  if distance>radius*silhouette:continue
  x=cx+math.cos(a)*distance;y=cy+math.sin(a)*distance
  shade= r.uniform(-55,65)+ (1-distance/radius)*35
  shade+= (cy-y)*.035 + (cx-x)*.025
  rgb=tint(c,shade)
  if name in ("pine","spruce","juniper"):
   length=r.uniform(5,17) if name=="pine" else r.uniform(3,12)
   angle=r.uniform(-math.pi,math.pi)
   d.line((px(x),px(y),px(x+math.cos(angle)*length),px(y+math.sin(angle)*length)),fill=(*rgb,230),width=r.randint(1,3))
   if i%3==0:
    j=r.uniform(0,math.pi)
    d.line((px(x),px(y),px(x+math.cos(j)*length*.65),px(y+math.sin(j)*length*.65)),fill=(*tint(rgb,25),240),width=1)
  elif name=="willow":
   length=r.uniform(7,23);angle=a+math.pi/2+r.uniform(-.6,.6)
   d.line((px(x),px(y),px(x+math.cos(angle)*length),px(y+math.sin(angle)*length)),fill=(*rgb,200),width=r.randint(1,3))
  else:
   w=r.uniform(2.4,7.5) if kind=="trees" else r.uniform(2,6)
   ellh=r.uniform(1.8,5.3);ellipse(d,x,y,w,ellh,(*rgb,250),r.uniform(0,180))
   if i%8==0:ellipse(d,x-w*.2,y-ellh*.4,w*.35,ellh*.25,(*tint(rgb,36),220))
 # Species-defining blossoms, seed heads, berries.
 colors={"hydrangea":(237,231,213),"spirea":(231,175,185),"lavender":(163,144,209),"sakura":(242,201,216),"apple":(244,217,213)}
 if flowering:
  for i in range(1400 if kind=="shrubs" else 900):
   a=r.uniform(0,math.tau);rr=radius*math.sqrt(r.random())*.86
   x=cx+math.cos(a)*rr;y=cy+math.sin(a)*rr
   col=colors[name];rad=r.uniform(1.3,4.2) if name=="lavender" else r.uniform(2,8)
   ellipse(d,x,y,rad,rad*.7,(*tint(col,r.uniform(-15,18)),255))
 if name in ("barberry","rowan"):
  for i in range(650):
   a=r.uniform(0,math.tau);rr=r.uniform(10,radius*.82)
   x=cx+math.cos(a)*rr;y=cy+math.sin(a)*rr
   rad=r.uniform(2.2,5.3)
   d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(195,69,48,240))
 if name=="birch":
  d.ellipse((cx-13,cy-13,cx+13,cy+13),fill=(225,219,210,245))
 elif kind=="trees":
  d.ellipse((cx-11,cy-11,cx+11,cy+11),fill=(78,61,43,210))
 return im

def noise_background(name):
 r=rnd(name);base=np.array(PALETTE[name],dtype=np.float32)
 small=np.random.default_rng(int(hashlib.md5(name.encode()).hexdigest()[:8],16))
 n=small.normal(0,9,(SIZE,SIZE,1))
 # Granular cloud-like speckle plus subtle lighting and edge diffraction.
 large=small.normal(0,1,(68,68));tex=Image.fromarray(np.uint8(np.clip((large+3)*40,0,255)),'L').resize((SIZE,SIZE),Image.Resampling.BICUBIC)
 cloud=(np.asarray(tex,dtype=np.float32)-120)[...,None]*.16
 yy,xx=np.ogrid[:SIZE,:SIZE];light=((SIZE-xx)/SIZE*.12+(SIZE-yy)/SIZE*.12)*22
 arr=np.clip(base+n+cloud+light[...,None],0,255).astype(np.uint8)
 return Image.fromarray(arr,'RGB').convert('RGBA')

def ground(name,kind):
 im=noise_background(name);d=ImageDraw.Draw(im,"RGBA");r=rnd(name)
 if kind=="pavers":
  if name=="clinker-herringbone":
   step=86
   for y in range(-120,SIZE+step,step):
    for x in range(-120,SIZE+step,step):
     ang=45 if (int(x/step)+int(y/step))%2 else -45
     center=(x+r.uniform(-4,4),y+r.uniform(-4,4));w=step*.44;h=step*.86
     rr=(center[0]-w,center[1]-h/2,center[0]+w,center[1]+h/2)
     d.rectangle(rr,fill=(*tint(PALETTE[name],r.uniform(-25,30)),240),outline=(69,47,36,130),width=3)
     d.line((rr[0]+5,rr[1]+3,rr[2]-6,rr[1]+3),fill=(253,212,168,65),width=3)
  elif name=="radial-setts":
   for rad in range(40,730,60):
    d.arc((540-rad,540-rad,540+rad,540+rad),start=0,end=360,fill=(51,52,51,125),width=5)
    seg=int(2*math.pi*rad/58)
    for a in range(seg):
     theta=a*math.tau/seg
     x=540+math.cos(theta)*rad;y=540+math.sin(theta)*rad
     d.line((x,y,x+math.cos(theta)*50,y+math.sin(theta)*50),fill=(46,42,39,110),width=3)
  else:
   cell={"concrete-pavers":180,"granite-setts":75,"slate-pavers":150,"grass-grid":95}.get(name,80)
   for yi,y in enumerate(range(-cell,SIZE+cell,cell)):
    for x in range(-cell,SIZE+cell,cell):
     shift=cell/2 if yi%2 else 0;px0=x+shift
     wiggle=r.uniform(-3,3)
     color=tint(PALETTE[name],r.uniform(-28,25))
     d.rounded_rectangle((px0+5,y+5,px0+cell-6,y+cell-6),radius=3 if name!="slate-pavers" else 16,fill=(*color,235),outline=(*tint(color,-34),210),width=3)
     d.line((px0+7,y+6,px0+cell-9,y+6),fill=(*tint(color,25),65),width=3)
     if name=="grass-grid":
      d.rounded_rectangle((px0+24,y+24,px0+cell-25,y+cell-25),radius=9,fill=(64,126,70,240))
  # distinct stone grain
  for i in range(24000):
   x=r.randint(0,SIZE-1);y=r.randint(0,SIZE-1)
   d.point((x,y),fill=(r.randint(40,230),r.randint(40,220),r.randint(40,200),r.randint(30,95)))
 elif kind=="fills":
  for i in range(48000):
   x=r.randint(0,SIZE);y=r.randint(0,SIZE);sz=r.uniform(1.5,10) if name!="pine-bark" else r.uniform(2,14)
   col=tint(PALETTE[name],r.uniform(-45,55))
   if name=="pine-bark":
    d.line((x-sz,y-sz*.3,x+sz,y+sz*.7),fill=(*col,215),width=r.randint(2,9))
   else:
    d.ellipse((x-sz*.8,y-sz*.55,x+sz*.8,y+sz*.55),fill=(*col,210),outline=(*tint(col,-38),120),width=1)
 elif kind=="lawns":
  for i in range(65000):
   x=r.randint(0,SIZE);y=r.randint(0,SIZE);sz=r.uniform(1,8)
   col=tint(PALETTE[name],r.uniform(-35,45))
   d.line((x,y,x+r.uniform(-3,3),y-sz),fill=(*col,195),width=r.choice([1,1,2]))
   if name=="meadow" and i%275==0:
    d.ellipse((x-3,y-3,x+3,y+3),fill=r.choice([(221,218,174,220),(213,181,222,220),(244,214,169,255)]))
 elif kind=="ponds":
  # On-plan water surface, no side viewpoint.
  for i in range(26000):
   x=r.randint(0,SIZE);y=r.randint(0,SIZE);length=r.uniform(3,38)
   c=(140+r.randint(-27,27),192+r.randint(-27,27),186+r.randint(-27,27),r.randint(10,72))
   d.arc((x-length,y-3,x+length,y+8),start=194,end=338,fill=tuple(ch(v) for v in c),width=r.choice([1,2,3]))
  if name!="formal-pond":
   for i in range(70 if name=="bio-pond" else 40):
    x=r.randint(25,SIZE-25);y=r.randint(25,SIZE-25);sz=r.randint(8,24)
    d.ellipse((x-sz,y-sz,x+sz,y+sz),fill=(65,115,75,150),outline=(28,74,50,165),width=3)
    d.polygon(((x,y),(x+sz,y-8),(x,y-8)),fill=(150,181,105,205))
 return im

def stone(name):
 r=rnd(name);color=PALETTE[name]
 im=Image.new("RGBA",(SIZE,SIZE),(0,0,0,0))
 shadow=Image.new("RGBA",(SIZE,SIZE));sd=ImageDraw.Draw(shadow,"RGBA")
 a=[]
 for i in range(37):
  theta=math.tau*i/37
  radius=390*(.75+.20*math.sin(theta*5+1)+.10*math.sin(theta*13)+r.uniform(-.08,.08))
  a.append((540+math.cos(theta)*radius,531+math.sin(theta)*radius))
 sd.polygon([(x+25,y+31) for x,y in a],fill=(17,18,19,140))
 im=Image.alpha_composite(im,shadow.filter(ImageFilter.GaussianBlur(24)))
 d=ImageDraw.Draw(im,"RGBA")
 d.polygon(a,fill=(*color,255),outline=(*tint(color,-35),255),width=8)
 # Stone planes, crack paths and speckled mineral microstructure.
 for i in range(80):
  idx=r.randint(0,len(a)-1);p=a[idx];mid=(r.randint(390,675),r.randint(385,660))
  shade=r.uniform(-60,55)
  q=a[(idx+r.randint(1,6))%len(a)]
  d.polygon((p,mid,q),fill=(*tint(color,shade),r.randint(95,210)))
 for i in range(135):
  x=r.randint(215,860);y=r.randint(205,850)
  pts=[(x,y)];ang=r.uniform(0,math.tau)
  for j in range(r.randint(2,5)):
   ang+=r.uniform(-.65,.65);dd=r.uniform(3,29)
   xx=pts[-1][0]+math.cos(ang)*dd;yy=pts[-1][1]+math.sin(ang)*dd
   pts.append((xx,yy))
  d.line(pts,fill=(*tint(color,-57),r.randint(40,160)),width=r.choice([1,2,3]))
 # apply polygon alpha mask to remove stray features, keeping blurred shadow outside
 mask=Image.new("L",(SIZE,SIZE));ImageDraw.Draw(mask).polygon(a,fill=255)
 mineral=Image.new("RGBA",(SIZE,SIZE));pmin=ImageDraw.Draw(mineral,"RGBA")
 for i in range(18000):
  x=r.randint(125,940);y=r.randint(130,940)
  if mask.getpixel((x,y))==0:continue
  rad=r.uniform(.4,4.5)
  shade=r.uniform(-100,110)
  pmin.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(*tint(color,shade),r.randint(40,165)))
 mineral.putalpha(Image.fromarray(np.minimum(np.asarray(mineral.getchannel('A')),np.asarray(mask)).astype(np.uint8)))
 im=Image.alpha_composite(im,mineral)
 if name=="slate-boulder":
  d=ImageDraw.Draw(im,"RGBA")
  for i in range(13):
   yy=220+i*45+r.uniform(-15,15)
   d.line((170,yy,400,yy+r.uniform(-10,25),660,yy+r.uniform(-20,22),870,yy+30),fill=(21,28,32,95),width=r.randint(3,10),joint="curve")
 return im

def fixture(name):
 im=Image.new("RGBA",(SIZE,SIZE));c=PALETTE[name];r=rnd(name)
 light=Image.new("RGBA",(SIZE,SIZE));lightarr=np.zeros((SIZE,SIZE,4),dtype=np.uint8)
 yy,xx=np.ogrid[:SIZE,:SIZE];rad=np.sqrt((xx-540)**2+(yy-540)**2)
 atten=np.exp(-((rad/280)**2)*2.5)
 lightarr[:,:,0]=250;lightarr[:,:,1]=207;lightarr[:,:,2]=147;lightarr[:,:,3]=np.uint8(atten*95)
 im=Image.alpha_composite(im,Image.fromarray(lightarr,"RGBA"))
 d=ImageDraw.Draw(im,"RGBA")
 d.ellipse((442,463,646,663),fill=(14,20,21,95))
 if name=="linear":
  d.rounded_rectangle((210,510,870,584),radius=24,fill=(27,32,35,255),outline=(192,178,149,240),width=7)
  d.rounded_rectangle((240,529,840,564),radius=12,fill=(255,224,158,253))
 elif name=="deck-light":
  d.rounded_rectangle((422,422,658,658),radius=18,fill=(28,33,36,255),outline=(194,190,164,255),width=10)
  d.rounded_rectangle((477,477,603,603),radius=8,fill=(255,235,175,250))
 elif name=="spot":
  d.pieslice((365,355,715,725),start=60,end=300,fill=(36,41,43,245),outline=(175,173,160,255),width=9)
  d.ellipse((471,472,609,608),fill=(255,221,145,255),outline=(75,72,62,255),width=10)
 elif name=="ground":
  for rad,col in ((126,(184,177,161,255)),(110,(39,43,46,255)),(85,(239,211,151,255)),(72,(252,239,193,255))):
   d.ellipse((540-rad,540-rad,540+rad,540+rad),fill=col)
 else:
  rad=130 if name=="bollard" else 114
  d.rounded_rectangle((540-rad,540-rad,540+rad,540+rad),radius=33,fill=(24,30,33,255),outline=(180,170,151,255),width=10)
  for i in range(8):
   th=i*math.tau/8
   x=540+math.cos(th)*95;y=540+math.sin(th)*95
   d.ellipse((x-7,y-7,x+7,y+7),fill=(220,213,191,245))
  d.ellipse((489,489,591,591),fill=(255,224,174,252))
 return im

def run():
 from PIL import ImageOps
 produced=[]
 for group,names in GROUPS.items():
  for name in names:
   if group in ("trees","shrubs"):img=plant(name,group)
   elif group=="boulders":img=stone(name)
   elif group=="lights":img=fixture(name)
   else:img=ground(name,group)
   # Unpremultiply and preserve source alpha where appropriate.
   if img.size!=(SIZE,SIZE):img=img.resize((SIZE,SIZE),Image.Resampling.LANCZOS)
   out=ROOT/(name+".webp");img.save(out,"WEBP",quality=88,method=5,exact=True)
   produced.append((name,group,str(out),out.stat().st_size))
   print(f"{group}/{name}: {out.stat().st_size//1024} KiB",flush=True)
 # Preview: 46 accurately named outputs, contact-sheet for human QA.
 cols=8;th=208;pad=24;label=36;rows=math.ceil(len(produced)/cols)
 sheet=Image.new("RGB",(cols*(th+pad)+pad,rows*(th+label+pad)+pad),(29,30,31))
 dr=ImageDraw.Draw(sheet)
 for i,(name,group,path,size) in enumerate(produced):
  x=pad+(i%cols)*(th+pad);y=pad+(i//cols)*(th+label+pad)
  tile=Image.open(path).convert("RGBA");tile.thumbnail((th,th),Image.Resampling.LANCZOS)
  bg=Image.new("RGBA",(th,th),(224,226,218,255));bg.alpha_composite(tile,((th-tile.width)//2,(th-tile.height)//2))
  sheet.paste(bg.convert("RGB"),(x,y))
  dr.text((x,y+th+7),name,fill=(237,225,209))
 sheet.save(ROOT/"_contact-sheet.jpg",quality=88,optimize=True)
 print("GENERATED",len(produced),"ASSETS",flush=True)
if __name__=="__main__":run()
