#!/usr/bin/env python3
"""FORMA original Cornus alba 'Elegantissima' v2 (summer), three native crowns.
Original independently generated mesh/texels; botanical references only.
DO NOT incorporate copyrighted third-party 3D Warehouse geometry or textures.
Geometry uses opposite leaves, asymmetric arching canes, branching shoots,
cream-variegated foliage and red-burgundy young stems; no thorns.
"""
from __future__ import annotations
import sys, os, math, random, hashlib, json, struct
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from PIL import Image, ImageDraw, ImageFilter

PI=math.pi
UP=np.array([0.,1.,0.])
LEAF_KEYS=('plum','burgundy','ruby','copper','dusk','olive')  # stable existing material IDs
MATS=(*LEAF_KEYS,'bark','twig')
FOLIAGE_COLORS={
 'plum':(40,75,48),'burgundy':(76,112,65),'ruby':(52,90,58),
 'copper':(103,136,91),'dusk':(69,108,89),'olive':(132,157,112),
}
FOLIAGE_WEIGHTS=(19,28,23,14,10,6)


def texture_leaf(center, seed):
 """RGBA ovate elliptic leaf, asymmetric pale-cream variegation and veins."""
 w,h=256,384
 rng=np.random.default_rng(seed)
 yy,xx=np.mgrid[0:h,0:w]
 u=xx/(w-1);t=yy/(h-1)
 # pointed tip at top, slightly narrowed base; curved outline
 width=.487*np.power(np.clip(np.sin(PI*t),0,1),.72)*(0.85+0.16*t)
 mid=.50+.018*np.sin(PI*t*1.25)
 q=np.abs(u-mid)/np.maximum(.002,width)
 border=(.55+.064*np.sin(10*t+17*u)+.034*np.sin(38*t+16*u)+.018*np.sin(59*t+10*u))
 band=np.clip((q-border)*13,0,1);band=band*band*(3-2*band)
 noise=rng.normal(0,3.0,(h,w)) + 2.8*np.sin(u*26+t*12) + 2*np.sin(t*52)
 base=np.zeros((h,w,3),float)
 base[:]=center
 base+=noise[...,None]
 # smoky grey/green center with pronounced irregular ivory edges
 ivory=np.array([241,241,226.])
 base=base*(1-band[...,None])+ivory*band[...,None]
 # bright central vein and subtle lateral venation branching from midrib
 rib=np.abs(u-mid)<(.010+.008*np.sin(PI*t))
 base[rib]=base[rib]*.65+np.array([178,195,143])* .35
 vein=np.abs(np.sin((u-mid)*21+t*23))<.09
 base[vein & (q<.80)] *=.968
 alpha=np.clip((1-q)*55,0,1)
 alpha=np.where(q<.975,1.,alpha)
 alpha[(t<.01)|(t>.995)]=0
 out=np.empty((h,w,4),dtype=np.uint8)
 out[:,:,:3]=np.clip(base,0,255).astype('uint8')
 out[:,:,3]=(alpha*255).astype('uint8')
 return Image.fromarray(out,'RGBA')


def texture_wood(base,seed):
 rng=np.random.default_rng(seed)
 h=w=256
 col=rng.normal(0,7,w)
 y,x=np.mgrid[:h,:w]
 variation=col[None,:]+5*np.sin(x*.25 + 1.7*np.sin(y*.02)) + rng.normal(0,3,(h,w))
 pic=np.empty((h,w,4),dtype=np.uint8)
 for k in range(3): pic[:,:,k]=np.clip(base[k]+variation,0,255).astype(np.uint8)
 pic[:,:,3]=255
 return Image.fromarray(pic,'RGBA')

LEAF_TEX={key:texture_leaf(FOLIAGE_COLORS[key],20261120+i*59) for i,key in enumerate(LEAF_KEYS)}
WOOD_TEX={'bark':texture_wood((67,55,47),91),'twig':texture_wood((104,51,58),96)}


def normalize(p):
 p=np.asarray(p,float); n=np.linalg.norm(p)
 return p/max(1e-8,n)

class MeshAccumulator:
 def __init__(self,shape):
  self.shape=shape
  self.vertices={k:[] for k in MATS}
  self.faces={k:[] for k in MATS}
  self.uv={k:[] for k in MATS}
  self.stats={'leaves':0,'stems':0,'twig_segments':0}
 def add(self,k,vertices,faces,uv):
  nv=len(self.vertices[k]);self.vertices[k].extend(vertices)
  self.faces[k].extend(tuple(nv+i for i in f) for f in faces)
  self.uv[k].extend(uv)
 def wood(self,a,b,rad0,rad1,key,sides=5):
  a=np.asarray(a,float);b=np.asarray(b,float)
  axis=normalize(b-a)
  side=normalize(np.cross(axis,UP if abs(axis[1])<.95 else [1.,0.,0.]))
  other=normalize(np.cross(axis,side))
  verts=[]
  for pt,r in ((a,rad0),(b,rad1)):
   for j in range(sides): verts.append(pt+r*(side*np.cos(2*PI*j/sides)+other*np.sin(2*PI*j/sides)))
  faces=[(j,(j+1)%sides,sides+(j+1)%sides) for j in range(sides)]
  faces += [(j,sides+(j+1)%sides,sides+j) for j in range(sides)]
  uv=[(j/sides,row) for row in (0,1) for j in range(sides)]
  self.add(key,verts,faces,uv)
  self.stats['twig_segments' if key=='twig' else 'stems']+=1
 def leaf(self,p,d,lc,w,material,roll=0):
  p=np.asarray(p,float);d=normalize(d)
  right=normalize(np.cross(d,UP if abs(d[1])<.92 else [1.,0.,0.]))
  normal=normalize(np.cross(right,d))
  right=normalize(right*math.cos(roll)+normal*math.sin(roll))
  normal=normalize(np.cross(right,d))
  # moderately cupped leaf, with base, broad middle and tapered pointed apex
  verts=[p-right*w*.28,
         p+right*w*.28,
         p+d*(lc*.43)-right*w*.51+normal*(lc*.055),
         p+d*(lc*.43)+right*w*.51+normal*(lc*.055),
         p+d*lc-right*w*.07+normal*(lc*.022),
         p+d*lc+right*w*.07+normal*(lc*.022)]
  faces=((0,1,2),(1,3,2),(2,3,4),(3,5,4))
  uv=((.28,0),(.72,0),(0,.47),(1,.47),(.43,1),(.57,1))
  self.add(material,verts,faces,uv)
  self.stats['leaves']+=1
 def to_scene(self, scene):
  for key in MATS:
   vertices=self.vertices[key];faces=self.faces[key]
   if not faces:continue
   geom=trimesh.Trimesh(vertices=np.asarray(vertices,dtype=np.float32),faces=np.asarray(faces,dtype=np.int32),process=False)
   leaf=key in LEAF_KEYS
   material=PBRMaterial(name='FORMA-'+key,metallicFactor=0.0,
    roughnessFactor=.8 if leaf else .93, doubleSided=leaf,
    baseColorFactor=[255,255,255,255] if leaf else [255,255,255,255],
    baseColorTexture=LEAF_TEX[key] if leaf else WOOD_TEX[key],
    alphaMode='MASK' if leaf else 'OPAQUE',alphaCutoff=.45 if leaf else None)
   geom.visual=TextureVisuals(uv=np.asarray(self.uv[key],dtype=np.float32),material=material)
   scene.add_geometry(geom,geom_name=self.shape+'-'+key,node_name=self.shape+'-'+key,parent_node_name=self.shape)


def bezier(cp,t):
 a,b,c,d=cp;s=1-t
 return s**3*a+3*s*s*t*b+3*s*t*t*c+t**3*d


def canopy_envelope(shape,y,H,W,D):
 """Natural crown side elevation with a soft skirt and rounded roof."""
 if shape=='DOGWOOD_NATURAL':
  profile=((.11,.19),(.20,.54),(.32,.82),(.49,1.0),(.65,.95),(.79,.80),(.92,.52),(1.0,.035))
 elif shape=='DOGWOOD_SPHERE':
  profile=((.10,.27),(.20,.60),(.38,.89),(.55,.98),(.70,.89),(.86,.61),(1.0,.05))
 else:
  return W*.47,D*.47
 yfrac=y/H
 for (y0,r0),(y1,r1) in zip(profile,profile[1:]):
  if yfrac<=y1:
   f=max(0,min(1,(yfrac-y0)/(y1-y0)))
   radius=r0+(r1-r0)*f
   return W*.5*radius,D*.5*radius
 return W*.025,D*.025


def sample_point(shape,rng,W,D,H):
 if shape=='DOGWOOD_BOX':
  # Trimmed hedge: boxy foliage and broad, almost level upper face.
  y=H*(.14+.82*rng.betavariate(1.55,1.55))
  x=(rng.random()*2-1)*W*.455
  z=(rng.random()*2-1)*D*.455
  return np.array([x,y,z])
 frac=rng.betavariate(1.85,1.65)
 # one in eight sprigs fills the shaded lower skirt instead of a bare stem cone
 if rng.random()<.20:frac=rng.uniform(.00,.28)
 y=H*(.10+.86*frac)
 rx,rz=canopy_envelope(shape,y,H,W,D)
 phi=rng.random()*2*PI
 radial=(rng.random()**.33)*(.99 if rng.random()<.88 else .70)
 # tiny natural crown undulations prevent a perfectly computer-generated oval
 radial*=.92+.10*math.sin(4*phi+1.7*y)+.073*math.sin(9*phi-4*y)+.038*math.cos(16*phi+11*y)
 return np.array([math.cos(phi)*rx*radial,y,math.sin(phi)*rz*radial])


def generate(shape,seed):
 rng=random.Random(seed)
 mesh=MeshAccumulator(shape)
 if shape=='DOGWOOD_NATURAL':
  W,D,H=2.91,2.97,2.25;canes=20;clumps=900
 elif shape=='DOGWOOD_SPHERE':
  W,D,H=1.58,1.55,1.55;canes=16;clumps=500
 else:
  W,D,H=1.02,1.24,1.11;canes=18;clumps=520
 # Primary multistemmed architecture, 2–4 cm mature basal wood,
 # tapered burgundy young shoot tips. Unlike the v1 mesh there is no broom of
 # eighty-plus straight black stems.
 anchors=[]
 for j in range(canes):
  tip=sample_point(shape,rng,W,D,H)
  if j%4 != 0: tip[1]=min(H*.94,max(H*.65,tip[1]+H*.07))
  base=np.array([rng.uniform(-W*.048,W*.048),.01+rng.random()*.015,rng.uniform(-D*.048,D*.048)])
  shift=tip-base
  cp=(base,
      base+np.array([shift[0]*.13,tip[1]*.32,shift[2]*.13]),
      base+np.array([shift[0]*.72,tip[1]*.76,shift[2]*.72]),
      tip)
  last=base
  nsteps=12
  r0=.0057+rng.random()*.0033
  for s in range(1,nsteps+1):
   t=s/nsteps
   pos=bezier(cp,t)
   prev=(s-1)/nsteps
   mesh.wood(last,pos,max(.0013,r0*(1-prev*.86)),max(.0012,r0*(1-t*.86)),
             'bark' if t<.52 else 'twig',sides=6 if s<5 else 5)
   if s%2==0: anchors.append(pos.copy())
   last=pos
 # Distributed, genuinely three-dimensional variegated leaf crown. Every
 # sprig is connected by an independently generated slender woody branch.
 anchors=np.asarray(anchors)
 for i in range(clumps):
  center=sample_point(shape,rng,W,D,H)
  near=np.argmin(((anchors-center)**2).sum(axis=1))
  begin=anchors[near]
  if np.linalg.norm(center-begin)>.018:
   dis=center-begin
   # Three curved segments with a subtle gravity bend rather than one ruler-straight line.
   sway=np.array([rng.uniform(-.035,.035),-rng.uniform(.012,.045),rng.uniform(-.035,.035)])
   p1=begin+dis*.32+sway*.4
   p2=begin+dis*.71+sway
   mesh.wood(begin,p1,.0029,.00225,'twig',sides=5)
   mesh.wood(p1,p2,.00225,.00145,'twig',sides=5)
   mesh.wood(p2,center,.00145,.0008,'twig',sides=5)
  radial=normalize(np.array([center[0],.1,center[2]]))
  for arm in range(1 if rng.random()<.6 else 2):
   phase=2*PI*(arm/2+rng.uniform(-.12,.12))
   tangent=np.array([math.cos(phase),rng.uniform(-.08,.24),math.sin(phase)])
   direction=normalize(tangent*.60 + radial*.45 + UP*rng.uniform(.02,.23))
   length=rng.uniform(.118,.235) * (1 if shape=='DOGWOOD_NATURAL' else .86)
   shoot_mid=center+direction*length*.48+UP*rng.uniform(.004,.024)
   tip=center+direction*length
   if shape=='DOGWOOD_BOX':
    tip[0]=np.clip(tip[0],-W*.475,W*.475)
    tip[1]=np.clip(tip[1],H*.10,H*.975)
    tip[2]=np.clip(tip[2],-D*.475,D*.475)
    shoot_mid=center*.50+tip*.50+UP*.008
   mesh.wood(center,shoot_mid,.0018,.0012,'twig',sides=4)
   mesh.wood(shoot_mid,tip,.0012,.00065,'twig',sides=4)
   axis=normalize(tip-center)
   lateral=normalize(np.cross(axis,UP if abs(axis[1])<.9 else [1.,0.,0.]))
   # Cornus leaves are opposite and decussate — successive paired nodes
   # rotate, preserving characteristic opposite broad leaves.
   for pair in range(5):
    f=(pair+.20+rng.random()*.10)/5.40
    p=center*(1-f)+tip*f+UP*.002
    turn=rng.uniform(-.28,.28)+(PI*.46 if pair%2 else 0)
    side=normalize(lateral*math.cos(turn)+np.cross(lateral,axis)*math.sin(turn))
    for sign in (-1,1):
     d=normalize(side*sign*.8+axis*(.20+rng.random()*.30)+UP*rng.uniform(-.08,.29))
     ll=rng.uniform(.070,.114) * (1 if shape=='DOGWOOD_NATURAL' else .92)
     ww=ll*rng.uniform(.62,.81)
     # Soft shoot attached to the stem by a slender petiole; not a floating leaf.
     petiole=side*sign*rng.uniform(.007,.014)+axis*.003
     stem_tip=p+petiole
     mesh.wood(p,stem_tip,.0008,.0004,'twig',sides=3)
     # More shaded green internal foliage, lighter creamy edge in the outer layers.
     rx,rz=canopy_envelope(shape,p[1],H,W,D)
     depth=math.sqrt((p[0]/max(.15,rx))**2+(p[2]/max(.15,rz))**2)
     mat=rng.choices(('plum','ruby','dusk') if depth<.62 else ('burgundy','copper','olive','dusk'),(30,50,20) if depth<.62 else (39,28,12,21))[0]
     mesh.leaf(stem_tip,d,ll,ww,mat,rng.uniform(-PI*.57,PI*.57))
   # Tiny fresh terminal cluster closes the silhouette, no protruding rods.
   for q in range(2):
    ang=2*PI*(q/2+.13*rng.random())
    d=normalize(direction*.27+np.array([math.cos(ang),rng.uniform(.15,.46),math.sin(ang)])*.73)
    ll=rng.uniform(.06,.09)
    mesh.leaf(tip,d,ll,ll*rng.uniform(.50,.63),rng.choices(LEAF_KEYS,FOLIAGE_WEIGHTS)[0],rng.uniform(-PI*.6,PI*.6))
 return mesh


def main():
 out=Path(sys.argv[1]);out.parent.mkdir(exist_ok=True,parents=True)
 scene=trimesh.Scene()
 results={}
 for shape,seed in [('DOGWOOD_NATURAL',3810),('DOGWOOD_SPHERE',3811),('DOGWOOD_BOX',3812)]:
  scene.graph.update(frame_to=shape,frame_from=scene.graph.base_frame,matrix=np.eye(4))
  obj=generate(shape,seed);results[shape]=obj.stats
  obj.to_scene(scene)
 blob=scene.export(file_type='glb')
 out.write_bytes(blob)
 glen=struct.unpack_from('<I',blob,12)[0]
 gltf=json.loads(blob[20:20+glen].decode('utf-8'))
 names={n.get('name') for n in gltf['nodes']}
 assert {'DOGWOOD_NATURAL','DOGWOOD_SPHERE','DOGWOOD_BOX'} <= names
 assert all(k in names for k in ['DOGWOOD_NATURAL-'+m for m in ('plum','twig','bark')])
 info={
 'sizeBytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),
 'triangles':sum(gltf['accessors'][part['indices']]['count']//3 for m in gltf['meshes'] for part in m['primitives']),
 'meshCount':len(gltf['meshes']),'materialCount':len(gltf['materials']),
 'textureCount':len(gltf.get('textures',[])), 'stats':results,
 'version':'9.0-vertical-cane-bases-cream-edge-petioles-ambient-occlusion-ready'
 }
 print(json.dumps(info,ensure_ascii=False))
 if len(sys.argv)>2:
  Path(sys.argv[2]).write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
