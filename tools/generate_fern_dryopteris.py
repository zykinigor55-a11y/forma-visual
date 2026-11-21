#!/usr/bin/env python3
"""FORMA original native Dryopteris filix-mas PBR 3-form model.
Real 3D subdivided fern pinnules, secondary pinna rachillae, curved frond axes,
scaly rhizome. Independent natural/young/mature shapes, world-space center fixed.
No external mesh or ripped photography; original procedural textures.
"""
from __future__ import annotations
import json,hashlib,sys,math,time
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageFilter
from trimesh.visual.texture import TextureVisuals
from trimesh.visual.material import PBRMaterial

PI=math.pi
SEED=20261121
rng=np.random.default_rng(SEED)
COLORS={
 'forest':([175,190,172,255],.82),
 'shadow':([112,150,122,255],.93),
 'middle':([183,204,173,255],.84),
 'luminous':([219,224,174,255],.83),
 'young':([226,232,184,255],.78),
 'sage':([180,208,177,255],.87),
 'warm':([185,198,164,255],.90),
 'stem':([79,103,64,255],.90),
 'stem-light':([126,135,91,255],.93),
 'scale':([151,113,65,255],.97),
}
CONFIGS=[
 ('FERN_NATURAL',.87,1.2,23,22,8,0.52,1.0),
 ('FERN_YOUNG',.58,.80,15,19,7,0.35,.73),
 ('FERN_MATURE',1.08,1.60,32,25,9,0.69,1.20),
]
class Bucket:
 def __init__(self):self.verts=[];self.faces=[];self.uvs=[]
 def add(self,verts,faces,uvs=None):
  off=len(self.verts);self.verts.extend(tuple(map(float,v)) for v in verts)
  self.faces.extend((a+off,b+off,c+off) for a,b,c in faces)
  if uvs is None:self.uvs.extend([(0.0,0.0)]*len(verts))
  else:self.uvs.extend(uvs)
 def tube(self,points,radius,facets=3):
  if len(points)<2:return
  vs=[];fs=[]
  for i,p in enumerate(points):
   tangent=np.asarray(points[min(len(points)-1,i+1)])-np.asarray(points[max(i-1,0)])
   tangent/=max(1e-8,np.linalg.norm(tangent))
   u=np.cross(tangent,np.array([0.,0.,1.]));u/=max(1e-8,np.linalg.norm(u))
   v=np.cross(tangent,u)
   rr=radius*(1.0-.74*i/max(1,len(points)-1))
   for k in range(facets):vs.append(np.asarray(p)+rr*(math.cos(2*PI*k/facets)*u+math.sin(2*PI*k/facets)*v))
   if i:
    for k in range(facets):
     a=(i-1)*facets+k;b=(i-1)*facets+(k+1)%facets;c=i*facets+k;d=i*facets+(k+1)%facets
     fs.extend([(a,b,c),(b,d,c)])
  self.add(vs,fs)

def atlas_png(size=512):
 y,x=np.mgrid[0:size,0:size].astype(np.float32)
 X=x/(size-1);Y=y/(size-1)
 coarse=rng.normal(0,1,(size//12+2,size//12+2)).astype(np.float32)
 coarse=Image.fromarray(np.uint8(np.clip((coarse+3)*37,0,255))).resize((size,size),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(4))
 low=(np.asarray(coarse,dtype=np.float32)-110.)/110.
 fine=rng.normal(0,1,(size,size))
 midrib=np.exp(-((Y-.5)/.035)**2)*.17
 secondary=np.sin((Y-.5)*24*np.pi+np.sign(Y-.5)*X*32.)*.024
 texture=np.clip(.85+.14*np.sin(X*2.8)+.075*low+.025*fine + midrib + secondary,.3,1.28)
 rgb=np.stack([46*texture+7,105*texture+4,57*texture+4],axis=-1).clip(0,255).astype(np.uint8)
 albedo=Image.fromarray(rgb,'RGB')
 # Fine vein normals for distance and grazing-angle realism.
 elev=.4+midrib+secondary*.7+fine*.013
 dy,dx=np.gradient(elev)
 nm=np.stack([(-dx*5).clip(-1,1)*127+128,(-dy*5).clip(-1,1)*127+128,np.full_like(elev,250)],axis=-1).clip(0,255).astype(np.uint8)
 normal=Image.fromarray(nm,'RGB')
 return albedo,normal

def bezier(a,b,c,d,t):
 s=1-t;return a*s**3 + b*3*s*s*t + c*3*s*t*t + d*t**3

def add_pinnule(bucket,base,axis,blade_dir,L,w,curve,variation=0):
 """Physical notched/raised leaf-blade: six connected triangular facets with real bent normal."""
 v=blade_dir/max(1e-9,np.linalg.norm(blade_dir));a=axis/max(1e-9,np.linalg.norm(axis))
 n=np.cross(a,v);n/=max(1e-8,np.linalg.norm(n))
 width=w
 # little jagged/notched outline and raised center for highlights
 v0=base
 v1=base+v*(.23*L)-a*(width*.65)+n*curve*.3
 v2=base+v*(.48*L)-a*(width*(.97+.06*variation))+n*curve*.18
 v3=base+v*(.76*L)-a*(width*.52)+n*curve*.2
 tip=base+v*L+n*curve*.16+a*L*.04
 v5=base+v*(.76*L)+a*(width*.52)+n*curve*.2
 v6=base+v*(.48*L)+a*(width*(1.02-.05*variation))+n*curve*.18
 v7=base+v*(.23*L)+a*(width*.65)+n*curve*.3
 ridge=base+v*(.48*L)+n*(curve+.0015)
 # axis oriented toward the frond center remains open at the leaflet base.
 faces=[(0,1,8),(1,2,8),(2,3,8),(3,4,8),(4,5,8),(5,6,8),(6,7,8),(7,0,8)]
 uvs=[(0,.5),(.23,.15),(.48,0),(.76,.28),(1,.5),(.76,.72),(.48,1),(.23,.85),(.48,.5)]
 bucket.add([v0,v1,v2,v3,tip,v5,v6,v7,ridge],faces,uvs)

def form_geometry(name,height,diam,fronds,pairs,pinnules,spread,scale,albedo,normal):
 B={k:Bucket() for k in COLORS}
 # root object at world-local (0,0,0); x/y or site placement never changed.
 stats={'fronds':fronds,'pinnaePairsPerFrond':pairs,'pinnulePairsPerPinna':pinnules,
        'requestedDiameter':diam,'requestedHeight':height,'pinnules':0,'pinnae':0,'rhizomeScales':0}
 for i in range(fronds):
  az=2*PI*(i/fronds)+rng.normal(0,.09)
  d=np.array([math.cos(az),0.,math.sin(az)])
  lateral=np.array([-math.sin(az),0.,math.cos(az)])
  root=d*rng.uniform(.0,.038)*scale+lateral*rng.normal(0,.018)*scale
  # Back and edge fronds lean outward, inner fronds are taller and more vertical.
  lean=float(rng.uniform(.50,1.03));lift=float(rng.uniform(.78,1.1))
  tip_radius=(spread*.92)*lean
  frond_h=height*.96*lift*(1.05-.15*lean)
  rootp=root+np.array([0.,.008,0.])
  bend_side=float(rng.normal(0,.065))*scale
  def fp(t):
   r=(.06*t+.94*(t**1.13))*tip_radius
   y=frond_h*(2.05*t-1.23*t*t)
   return rootp+d*r+lateral*(bend_side*math.sin(PI*t)) +np.array([0.,y,0.])
  guide=[fp(float(t)) for t in np.linspace(0,1,14)]
  B['stem' if i%3 else 'stem-light'].tube(guide,radius=.0031*scale,facets=4)
  for pair_i,t in enumerate(np.linspace(.13,.956,pairs)):
   t=float(t);base=fp(t)
   ft=fp(min(1,t+.015))-fp(max(0,t-.015));ft/=max(np.linalg.norm(ft),1e-8)
   # Width peaks around the midpoint, tapers toward both ends (lanceolate frond).
   env=(max(.04,math.sin(PI*(.04+.94*t))))**.65
   env*=.80+.20*math.sin(min(1,t)*PI)
   for sign in (-1,1):
    pinlen=(.145*scale)*env*(.85+.28*rng.random())
    axis=lateral*sign + d*.15 + np.array([0.,-.08+.05*rng.random(),0.])
    axis/=max(1e-8,np.linalg.norm(axis))
    p_end=base + axis*pinlen+ft*(.008*scale) + np.array([0.,-.011*scale,0.])
    def pin(s):
     return base*(1-s)+p_end*s+ft*(.007*scale*math.sin(PI*s))
    B['stem-light'].tube([pin(float(x)) for x in np.linspace(0,1,5)],radius=.0011*scale,facets=3)
    stats['pinnae']+=1
    for q,s in enumerate(np.linspace(.14,.94,pinnules)):
     s=float(s)
     tipfade=math.sin(PI*(s*.92+.04))**.48
     position=pin(s)
     # Distinct short, toothed pinnules on either side of each pinna;
     # not a single broad leaf/sprite pretending to be a true fern.
     for side in (-1,1):
      length=(.030*scale)*(1.05-.30*t)*tipfade*(.72+.32*rng.random())
      width=(.0065*scale)*tipfade*(.80+.42*rng.random())
      front=ft*side+axis*(.16+.04*rng.random())
      color=rng.choice(['forest','shadow','middle','luminous','young','sage','warm'],
                       p=[.17,.15,.31,.15,.06,.11,.05])
      # Low-lying and interior pinnae are darker; tips catch light.
      if t<.29 and rng.random()<.45:color='shadow'
      if t>.75 and rng.random()<.25:color='young'
      add_pinnule(B[color],position,axis,front,length,width,curve=.0022*scale,variation=rng.uniform(-1,1))
      stats['pinnules']+=1
  # brown papery scales at the rhizome / stipe base
  for k in range(4):
   rr=.007+.005*rng.random();ang=2*PI*rng.random()
   pp=rootp+d*(.002*k)+lateral*(.005*(k-1.5))
   tail=pp+np.array([math.cos(ang)*rr*.8,.009*scale,math.sin(ang)*rr*.8])
   B['scale'].add([pp,tail,tail+np.array([.0015,.006,0.])],[(0,1,2)])
   stats['rhizomeScales']+=1
 meshes=[]
 for key,b in B.items():
  if not b.faces:continue
  mesh=trimesh.Trimesh(vertices=np.asarray(b.verts,dtype=np.float32),faces=np.asarray(b.faces,dtype=np.int64),process=False)
  rgba,rough=COLORS[key]
  if key in ['stem','stem-light','scale']:
   mat=PBRMaterial(name=key+' FORMA original',baseColorFactor=rgba,metallicFactor=0.0,roughnessFactor=rough,doubleSided=True)
   mesh.visual=TextureVisuals(material=mat)
  else:
   mat=PBRMaterial(name=key+' fern original PBR leaf epidermis',baseColorFactor=rgba,
             baseColorTexture=albedo,normalTexture=normal,roughnessFactor=rough,metallicFactor=0.,doubleSided=True)
   mesh.visual=TextureVisuals(uv=np.asarray(b.uvs,dtype=np.float32),material=mat)
  mesh.metadata['name']=name+'-'+key
  meshes.append((name+'-'+key,mesh))
 stats['triangles']=sum(len(m.faces) for _,m in meshes)
 stats['meshCount']=len(meshes)
 return meshes,stats

def generate(dest='/mnt/data/fern_v1/fern-dryopteris-filix-mas-forma-original.glb',meta='/mnt/data/fern_v1/fern-dryopteris-filix-mas.source.json'):
 t0=time.monotonic();dest=Path(dest);meta=Path(meta)
 dest.parent.mkdir(parents=True,exist_ok=True);meta.parent.mkdir(parents=True,exist_ok=True)
 albedo,normal=atlas_png()
 atlas_dir=meta.parent
 albedo.save(atlas_dir/'fern-original-epidermis-albedo.png')
 normal.save(atlas_dir/'fern-original-epidermis-normal.png')
 scene=trimesh.Scene();forms={}
 for form,h,d,n,p,q,spread,scale in CONFIGS:
  meshes,stats=form_geometry(form,h,d,n,p,q,spread,scale,albedo,normal)
  scene.graph.update(frame_to=form,frame_from='world',matrix=np.eye(4))
  for name,m in meshes:scene.add_geometry(m,geom_name=name,node_name=name,parent_node_name=form)
  forms[form]=stats
  print('BUILT',form,stats,flush=True)
 data=scene.export(file_type='glb')
 dest.write_bytes(data)
 manifest={'version':'1.0 FORMA realistic curved fern fronds, pinnate pinnae and textured 3D serrated pinnules',
 'species':'Dryopteris filix-mas','englishName':'Male fern','source':'Original FORMA 3D meshes and original procedural PBR maps. Botanical refs RHS and World Flora Online',
 'sha256':hashlib.sha256(data).hexdigest(),'sizeBytes':len(data),'triangleCount':sum(f['triangles'] for f in forms.values()),
 'meshCount':sum(f['meshCount'] for f in forms.values()),'forms':forms,'modelFile':dest.name,
 'materialNotes':'Native glTF 2.0 double-sided leaf PBR with epidermis albedo and normal map; geometry is genuine 3D'}
 meta.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('TOTAL',manifest['sizeBytes'],manifest['triangleCount'],manifest['sha256'],'time',time.monotonic()-t0,flush=True)
 return manifest
if __name__=='__main__':generate(*(sys.argv[1:3]))
