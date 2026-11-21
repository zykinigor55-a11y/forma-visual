#!/usr/bin/env python3
"""FORMA · Buxus sempervirens v2 botanical crown and foliage sculpt.

Original, reproducible, true-scale geometry. Three separate selectable subtrees.
Small opposite pairs of thick, ovate, glabrous evergreen leaves with convex
central veins; mature woody arms under staggered dense leaf-bearing twigs.
Own geometry; real CC0 Buxus sempervirens leaf photograph photometric texture.
All dimensions are in metres (Y up) and plants remain rooted at Y=0.
"""
import json, math, random, sys, hashlib, struct
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

PI=math.pi
PHOTO_FILE=None
COLOR_TEXTURE=None
NORMAL_TEXTURE=None
PHOTO_INFO={}
UP=np.array((0.,1.,0.))
PHI=PI*(3-math.sqrt(5))
PALETTE={
 'leaf-shadow':(34,69,34),
 'leaf-dark':(39,82,36),
 'leaf-olive':(59,99,43),
 'leaf-green':(56,116,48),
 'leaf-mid':(70,127,52),
 'leaf-tip':(92,140,58),
 'leaf-young':(116,151,67),
 'leaf-under':(100,124,70),
 'wood':(77,66,49),
 'twig':(77,83,51),
}
LEAF_NAMES=list(PALETTE)[:8]
FORMS={
 'BOXWOOD_NATURAL':{'width':1.00,'height':.95,'depth':.96,'sprays':2650,'irregular':.098,'topRoughness':.65},
 'BOXWOOD_SPHERE':{'width':.80,'height':.79,'depth':.78,'sprays':1780,'irregular':.023,'topRoughness':.58},
 'BOXWOOD_HEDGE':{'width':1.18,'height':.88,'depth':.77,'sprays':3000,'irregular':.020,'topRoughness':.74},
}
def unit(v):
 v=np.asarray(v,dtype=np.float64)
 n=float(np.linalg.norm(v))
 return v/max(n,1e-9)

class Batch:
 def __init__(self):self.v=[];self.f=[];self.uv=[]
 def leaf(self,base,along,side,length,width,ridge):
  """Eight surface triangles; rounded obovate apex, glossy veined fold.
  Rounded Buxus tips unlike the pointed, jagged v1 leaf triangles.
  """
  base=np.asarray(base,float); along=unit(along); side=unit(side-along*np.dot(side,along))
  up=unit(np.cross(along,side))
  coords=[(0.,0.,0.),(.25,-.34,.03),(.52,-.54,.07),(.91,-.13,.01),
          (1.,0.,0.),(.91,.13,.01),(.52,.54,.07),(.25,.34,.03),(.53,0.,ridge)]
  k=len(self.v)
  self.v.extend((base+along*(t*length)+side*(w*width)+up*(h*width)).tolist() for t,w,h in coords)
  self.uv.extend((.5 + w*.82, .02 + t*.96) for t,w,h in coords)
  self.f.extend((k+i,k+(i+1)%8,k+8) for i in range(8))
 def stem(self,a,b,r0,r1,sides=4):
  a=np.asarray(a,float);b=np.asarray(b,float)
  d=unit(b-a);u=unit(np.cross(d,UP if abs(d[1])<.93 else [1.,0.,0.]));w=unit(np.cross(u,d));k=len(self.v)
  for p,r in ((a,r0),(b,r1)):
   for j in range(sides):
    alpha=2*PI*j/sides
    self.v.append((p+r*(math.cos(alpha)*u+math.sin(alpha)*w)).tolist())
    self.uv.append((0.,0.))
  for i in range(sides):
   j=(i+1)%sides
   self.f.extend(((k+i,k+j,k+sides+j),(k+i,k+sides+j,k+sides+i)))
 def mesh(self,kind):
  if not self.f:return None
  mesh=trimesh.Trimesh(vertices=np.array(self.v,dtype=np.float32),faces=np.array(self.f,dtype=np.int32),process=False)
  col=PALETTE[kind];leaf=kind.startswith('leaf')
  material=PBRMaterial(name='FORMA-Buxus-v2-'+kind,
      baseColorFactor=[*col,255],metallicFactor=0.0,
      roughnessFactor=(.59 if kind in ('leaf-tip','leaf-green','leaf-mid') else .73) if leaf else .94,
      doubleSided=leaf)
  if leaf and COLOR_TEXTURE is not None:
   # All eight leaf colours share the same PHOTO texture and tangent-space normal.
   # Subtle per-branch factors preserve botanical age while retaining real pixels.
   photo_targets={
     'leaf-shadow':(85,116,88),'leaf-dark':(111,136,103),
     'leaf-olive':(143,155,115),'leaf-green':(151,171,142),
     'leaf-mid':(165,184,145),'leaf-tip':(182,196,147),
     'leaf-young':(209,215,157),'leaf-under':(184,184,143)
   }
   material=PBRMaterial(name='FORMA-Buxus-v3-CC0-photo-'+kind,
    baseColorFactor=[*photo_targets[kind],255],
    baseColorTexture=COLOR_TEXTURE, normalTexture=NORMAL_TEXTURE,
    metallicFactor=0.0,roughnessFactor=.49 if kind in ('leaf-tip','leaf-green','leaf-mid') else .59,
    doubleSided=True)
   mesh.visual=TextureVisuals(uv=np.array(self.uv,dtype=np.float32),material=material)
  else:
   mesh.visual=TextureVisuals(material=material)
  return mesh

# Arc-length reparameterization prevents superellipsoid foliage clustering
# on corner seams and leaving broad, straight hedge sides partially bald.
HEDGE_ANGLE_SAMPLES=np.linspace(0.,2*PI,8193)
_HX=np.sign(np.cos(HEDGE_ANGLE_SAMPLES))*np.abs(np.cos(HEDGE_ANGLE_SAMPLES))**.39*FORMS['BOXWOOD_HEDGE']['width']*.5
_HZ=np.sign(np.sin(HEDGE_ANGLE_SAMPLES))*np.abs(np.sin(HEDGE_ANGLE_SAMPLES))**.39*FORMS['BOXWOOD_HEDGE']['depth']*.5
_HL=np.r_[0.,np.cumsum(np.hypot(np.diff(_HX),np.diff(_HZ)))]
HEDGE_CDF=_HL/_HL[-1]
def hedge_arc_angle(a):
 return float(np.interp((a%(2*PI))/(2*PI),HEDGE_CDF,HEDGE_ANGLE_SAMPLES))

def surface(form,a,h):
 """An organically irregular ovoid or smooth trimmed sphere/cuboid.
 All forms use the same bottom pivot and same editable physical dimensions.
 """
 cfg=FORMS[form]; W=cfg['width']/2;D=cfg['depth']/2;H=cfg['height']
 if form=='BOXWOOD_HEDGE':
  # Rounded-superellipsoid: flattish real clipped top and nearly vertical sides.
  ex=.33; ez=.39
  c=math.sqrt(max(0,1-h*h))
  ring=c**ex
  vx=math.copysign(abs(math.cos(a))**ez,math.cos(a))*ring
  vz=math.copysign(abs(math.sin(a))**ez,math.sin(a))*ring
  vy=.50+math.copysign(abs(h)**ex,h)*.49
 else:
  c=math.sqrt(max(0,1-h*h))
  vx=math.cos(a)*c;vz=math.sin(a)*c
  if form=='BOXWOOD_NATURAL':
   # Asymmetric clustered mature crown, a little broad across the shoulders.
   shoulder=1.0 + .075*(1-h*h) -.05*h
   vx*=shoulder;vz*=shoulder
  vy=.505+h*.485
 irregular=cfg['irregular']
 lobes=1 + irregular*(.53*math.sin(a*3.2+h*7.1)+.28*math.sin(a*7.3-h*8.8)+.19*math.sin(a*13.7+h*12.0))
 vx*=lobes;vz*=lobes
 return np.array([W*vx,H*vy,D*vz],float)

def make_form(name,form_index):
 cfg=FORMS[name];rr=random.Random(913701+form_index*53)
 mats={name:Batch() for name in PALETTE};H=cfg['height']
 # True tapering multi-stem architecture; short interior arms, NOT an exposed
 # umbrella made of straight branches. Leafy crowns wrap them.
 for i in range(16):
  a=2*PI*i/16+rr.uniform(-.24,.24)
  b=np.array([rr.uniform(-.035,.035),0.,rr.uniform(-.035,.035)])
  d=np.array([math.cos(a)*cfg['width']*.115,H*.22,math.sin(a)*cfg['depth']*.115])
  e=np.array([math.cos(a)*cfg['width']*.23,H*(.44+rr.uniform(-.06,.05)),math.sin(a)*cfg['depth']*.23])
  mats['wood'].stem(b,d,.009,.005,5)
  mats['wood'].stem(d,e,.005,.0019,5)

 sprays=cfg['sprays'];leaves=0;branches=0;layers={'surface':0,'recessed':0,'deep':0}
 for i in range(sprays):
  a=PHI*i+rr.uniform(-.25,.25)
  if name=='BOXWOOD_HEDGE':a=hedge_arc_angle(a)
  y=1-2*((i+.5)/sprays)
  if name=='BOXWOOD_HEDGE':
   # Invert the superellipsoid vertical exponent so leaf sprays are
   # uniformly distributed on the flat trimmed WALLS, not bunched
   # at the top and bottom with an empty waist.
   y=math.copysign(abs(y)**(1/.33),y)
  # Surface sampling runs over the entire botanical crown, with carefully
  # staggered radial layers. Critically, never collapse the interior to a
  # tiny .61 radius ring as in v1 (which created a black hole at its centre).
  shell=rr.choices([1.0,.915,.82],[.61,.28,.11])[0]
  if shell>=.99:layers['surface']+=1
  elif shell>.85:layers['recessed']+=1
  else:layers['deep']+=1
  p=surface(name,a,y)
  center=np.array([0.,H*.51,0.])
  p=center+(p-center)*shell
  p+=np.array([rr.uniform(-.010,.010),rr.uniform(-.008,.008),rr.uniform(-.010,.010)])
  outward=unit([math.cos(a)*math.sqrt(max(0,1-y*y)),y*.72,math.sin(a)*math.sqrt(max(0,1-y*y))])
  tangent=unit(np.cross(UP,outward))
  if np.linalg.norm(tangent)<.5:tangent=unit([math.cos(a),0,math.sin(a)])
  # Dense leafy twigs are loosely ascending, with a few arching across the
  # crown instead of all rigidly pointing up like needles.
  shoot_dir=unit(outward*rr.uniform(.26,.56)+UP*rr.uniform(.32,.58)+tangent*rr.uniform(-.58,.58))
  L=rr.uniform(.052,.096)
  if i%13==0:L*=1.3
  endpoint=p+outward*rr.uniform(-.006,.016)
  root=endpoint-shoot_dir*(L*.66)
  root[1]=max(.014,root[1]); endpoint=root+shoot_dir*L
  # At top and bottom, preserve planted silhouette exactly.
  if endpoint[1]>H*.992: endpoint[1]=H*.992
  if i%8==0:
   mats['twig'].stem(root,endpoint,.0011,.00035,3)
   branches+=1
  ortho=unit(np.cross(shoot_dir,tangent))
  # Opposite decussate leaf pairs. Alternating pair planes improve the volume
  # and avoid all foliage fanning the same way under grazing sunlight.
  for j in range(5):
   frac=(j+.38)/5
   node=root+(endpoint-root)*frac
   pair_tan=unit(tangent*math.cos(j*1.55+.21)+ortho*math.sin(j*1.55+.21))
   for sign in (-1,1):
    leaf_dir=unit(sign*pair_tan*rr.uniform(.70,.99)+outward*rr.uniform(.16,.52)+UP*rr.uniform(.12,.42))
    side=unit(np.cross(leaf_dir,shoot_dir+outward*.18))
    length=rr.uniform(.023,.035)
    # Clipped forms have occasional smaller glossy buds, as with trimmed Buxus.
    if name!='BOXWOOD_NATURAL' and rr.random()<.21:length*=rr.uniform(.69,.83)
    width=length*rr.uniform(.42,.61)
    newgrowth=(shell>.95 and frac>.67)
    if shell<.85:
     tone=rr.choices(['leaf-shadow','leaf-dark','leaf-olive','leaf-under'],[43,33,20,4])[0]
    elif shell<.95:
     tone=rr.choices(['leaf-dark','leaf-olive','leaf-green','leaf-mid'],[25,29,37,9])[0]
    elif newgrowth:
     tone=rr.choices(['leaf-green','leaf-mid','leaf-tip','leaf-young'],[37,30,27,6])[0]
    else:
     tone=rr.choices(['leaf-dark','leaf-olive','leaf-green','leaf-mid','leaf-tip'],[15,22,37,21,5])[0]
    b=node+sign*pair_tan*rr.uniform(.001,.004)
    b[1]=max(.011,min(H-.036,b[1]))
    mats[tone].leaf(b,leaf_dir,side,length,width,ridge=rr.uniform(.13,.22))
    leaves+=1
 if name=='BOXWOOD_HEDGE':
  # Natural clipped Buxus is not hollow. A final skin of outward-facing
  # *individual ovate leaf geometries* follows its pruned upright faces.
  # The leaf pairs above remain attached to 3D branching; this final flush
  # is dense short growth covering old interior stems under the trim line.
  for k in range(15000):
   angle=hedge_arc_angle(PHI*k+rr.uniform(-.12,.12))
   desired_y=1-2*((k+.5)/15000)
   h=math.copysign(abs(desired_y)**(1/.33),desired_y)
   base=surface(name,angle,h)
   normal=unit([math.cos(angle),.36*desired_y,math.sin(angle)])
   tangent=unit(np.cross(UP,normal))
   if np.linalg.norm(tangent)<.2:tangent=unit([math.cos(angle),0.,math.sin(angle)])
   along=unit(UP*rr.uniform(.38,.78)+tangent*rr.uniform(-.78,.78)+normal*.11)
   lateral=unit(np.cross(along,normal))
   length=rr.uniform(.023,.039)
   width=length*rr.uniform(.47,.63)
   leafbase=base-along*(length*.48)+normal*rr.uniform(-.007,.016)
   leafbase[1]=max(.011,min(H-.036,leafbase[1]))
   tone=rr.choices(['leaf-shadow','leaf-dark','leaf-olive','leaf-green','leaf-mid','leaf-tip','leaf-young'],[10,15,20,25,22,7,1])[0]
   mats[tone].leaf(leafbase,along,lateral,length,width,ridge=rr.uniform(.12,.20))
   leaves+=1
 return mats,dict(**cfg,leafCount=leaves,branches=branches,foliageLayers=layers)


def build_cc0_photo_texture(path):
 """Derive one reusable leaf-surface PBR albedo + bump/normal from real CC0
 botanical photo; do not project the whole bush/background onto a leaf.
 Photo: https://commons.wikimedia.org/wiki/File:Buxus_sempervirens-1.jpg
 Credit: Karduelis, public domain; 2589x1714 close-up.
 """
 img=Image.open(path).convert('RGB')
 arr=np.asarray(img,dtype=np.float32)
 h,w=arr.shape[:2]
 # Deterministic patch search. Only interior LIVING green-leaf pixels count.
 # Reject brown earth/twigs and blown highlights; prioritise fine photo grain.
 box=max(28,round(min(h,w)*.026))
 best=(-1e6,None)
 for y in range(int(h*.11),int(h*.87),max(13,box//3)):
  for x in range(int(w*.12),int(w*.9),max(13,box//3)):
   a=arr[y:y+box,x:x+box]
   if a.shape[:2]!=(box,box):continue
   r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
   leaves=(g>r*1.10)&(g>b*1.13)&(g>56)&(g<225)&(r<180)&(b<145)
   coverage=float(np.mean(leaves))
   if coverage<.84:continue
   gray=(r*.21+g*.72+b*.07)
   score=coverage*35 + min(float(np.std(gray)),23.)*.22 - abs(float(np.median(g))-105)*.036
   if score>best[0]:best=(score,(x,y,box))
 if best[1] is None:raise RuntimeError('Cannot identify clean individual Buxus photo pixels; do not fake a sourced texture')
 x,y,box=best[1]
 crop=img.crop((x,y,x+box,y+box)).resize((512,512),Image.Resampling.BICUBIC)
 pix=np.asarray(crop,dtype=np.float32)
 # Remove photo's broad flash/shadow patches, keep real high-frequency leaf surface.
 illumination=gaussian_filter(pix,sigma=(34,34,0))
 median=np.median(pix.reshape(-1,3),axis=0)
 corrected=pix-illumination*.64+median*.64
 # Albedo becomes a neutral *photo-derived* green, optionally tinted per leaf material.
 corrected=corrected*np.array([1.01,1.02,.96])[None,None,:]
 corrected=np.clip(corrected,0,255).astype(np.uint8)
 albedo=Image.fromarray(corrected,'RGB')
 # Delicate midrib/secondaries over the actual photo material; leaf geometry
 # already has an independent, visible 3D convex vein fold.
 overlay=Image.new('RGBA',albedo.size,(0,0,0,0));draw=ImageDraw.Draw(overlay)
 draw.line([(258,495),(255,430),(256,330),(251,215),(255,70)],fill=(200,224,173,30),width=7)
 draw.line([(254,485),(254,420),(255,320),(252,212),(254,70)],fill=(222,230,191,25),width=2)
 for i in range(12):
  yy=115+i*29
  spread=40*(1-abs(yy-260)/350)
  draw.line([(253,yy),(253-48-spread,yy-48)],fill=(195,219,172,15),width=2)
  draw.line([(254,yy+5),(254+50+spread,yy-45)],fill=(195,219,172,15),width=2)
 albedo=Image.alpha_composite(albedo.convert('RGBA'),overlay).convert('RGB')
 # Tangent-space normals from photograph's real luminance detail and a mild
 # physically plausible central vein, no repeating flat leaf photo planes.
 color=np.asarray(albedo,dtype=np.float32)
 lum=.29*color[:,:,0]+.59*color[:,:,1]+.12*color[:,:,2]
 micro=lum-gaussian_filter(lum,3.1)
 xx=np.linspace(-1,1,512)[None,:]
 yy=np.linspace(0,1,512)[:,None]
 rib=7.0*np.exp(-(xx/.037)**2)*(np.sin(np.pi*yy)**.64)
 height=gaussian_filter(micro*.40+rib,1.2)
 dy,dx=np.gradient(height)
 nx=-dx*.095;ny=-dy*.095
 nz=np.ones_like(nx)
 vec=np.stack([nx,ny,nz],axis=2)
 vec=vec/np.linalg.norm(vec,axis=2,keepdims=True)
 normal=Image.fromarray(np.clip((vec*.5+.5)*255,0,255).astype('uint8'),'RGB')
 meta={'license':'Public domain, Wikimedia Commons',
  'photo':'https://commons.wikimedia.org/wiki/File:Buxus_sempervirens-1.jpg',
  'author':'Karduelis','sourceDimensions':[w,h],
  'sampledLeafPhotoPatch':[x,y,box,box],
  'albedoTextureSize':[512,512],
  'sourceSHA256':hashlib.sha256(path.read_bytes()).hexdigest()}
 return albedo,normal,meta

def make_scene():
 scene=trimesh.Scene();meta={};triangles=0
 for idx,form in enumerate(FORMS):
  batches,stats=make_form(form,idx)
  scene.graph.update(frame_to=form,frame_from=scene.graph.base_frame,matrix=np.eye(4))
  tri=0
  for key,batch in batches.items():
   mesh=batch.mesh(key)
   if mesh is None: continue
   scene.add_geometry(mesh,geom_name=form+'-'+key,node_name=form+'-'+key,parent_node_name=form)
   tri+=len(mesh.faces)
  stats['triangles']=tri;triangles+=tri;meta[form]=stats
 return scene,meta,triangles

def main():
 global COLOR_TEXTURE,NORMAL_TEXTURE,PHOTO_INFO
 import os
 photo=os.environ.get('FORMA_BOXWOOD_CC0_PHOTO')
 if photo:
  COLOR_TEXTURE,NORMAL_TEXTURE,PHOTO_INFO=build_cc0_photo_texture(Path(photo))
 else:
  raise RuntimeError('Real Wikimedia CC0 source photograph required; FORMA_BOXWOOD_CC0_PHOTO=...')
 out=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/boxwood_v2/boxwood-sempervirens-forma-original.glb')
 out.parent.mkdir(parents=True,exist_ok=True)
 scene,forms,total=make_scene()
 binary=scene.export(file_type='glb');out.write_bytes(binary)
 glen=struct.unpack_from('<I',binary,12)[0];meta=json.loads(binary[20:20+glen]);digest=hashlib.sha256(binary).hexdigest()
 assert binary[:4]==b'glTF' and struct.unpack_from('<I',binary,8)[0]==len(binary)
 assert len(meta['meshes'])==len(PALETTE)*len(FORMS)
 info={'species':'Buxus sempervirens','version':'v3.0-CC0-real-leaf-PBR-textures',
       'sha256':digest,'sizeBytes':len(binary),'triangles':total,
       'meshCount':len(meta['meshes']),'materialCount':len(meta['materials']),
       'forms':forms,'license':'Original procedurally authored FORMA geometry and materials',
       'photoTexture':PHOTO_INFO, 'sourceCode':'tools/generate_boxwood_sempervirens.py','modelPath':'/assets/landscape-models/boxwood-sempervirens-forma-original.glb'}
 metaPath=Path(sys.argv[2] if len(sys.argv)>2 else out.with_suffix('.source.json'))
 metaPath.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:v for k,v in info.items() if k!='forms'},ensure_ascii=False));print(json.dumps(forms,ensure_ascii=False))
if __name__=='__main__':main()
