#!/usr/bin/env python3
"""FORMA VISUAL · original Buxus sempervirens: 3 crown forms.
Fully original deterministic PBR geometry. Real metres/Y-up and rooted ground pivot.
Small opposite glossy ovate leaves, short petioles, woody branches, no borrowed 3D assets.
"""
import sys,json,hashlib,struct,math,random
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
PI=math.pi
UP=np.array([0.,1.,0.])
TONES={
 'leaf-dark':(33,76,35),
 'leaf-shadow':(43,89,38),
 'leaf-olive':(62,106,43),
 'leaf-green':(53,121,48),
 'leaf-mid':(71,132,52),
 'leaf-tip':(104,152,66),
 'leaf-young':(137,173,83),
 'leaf-under':(116,139,74),
 'wood':(87,72,49),
 'twig':(88,93,53),
}
LEAF_KEYS=list(TONES)[:8]

def unit(v):
 v=np.asarray(v,dtype=float)
 n=np.linalg.norm(v)
 return v/(n if n>1e-8 else 1.0)

class Builder:
 def __init__(self):
  self.v=[];self.f=[]
 def leaf(self,base,direction,side,length,width,curl=0.0):
  """A five-vertex convex ovate leaf, 4 triangles, geometric fold+rolled apex."""
  base=np.asarray(base,float); d=unit(direction);s=unit(side - d*np.dot(side,d));
  n=unit(np.cross(d,s))
  p0=base
  p1=base+d*length*.42-s*width*.53+n*curl
  p2=base+d*length*.45+s*width*.53+n*curl
  p3=base+d*length*.54+n*(width*.24+curl*.5)
  p4=base+d*length+n*(curl*.50)
  k=len(self.v);self.v.extend(p.tolist() for p in (p0,p1,p2,p3,p4))
  self.f.extend([(k,k+1,k+3),(k,k+3,k+2),(k+1,k+4,k+3),(k+3,k+4,k+2)])
 def segment(self,a,b,r0,r1,sides=4):
  a=np.asarray(a,float);b=np.asarray(b,float);d=unit(b-a)
  ax=unit(np.cross(d,[0,1,0] if abs(d[1])<.94 else [1,0,0]))
  az=unit(np.cross(ax,d));k=len(self.v)
  for p,r in ((a,r0),(b,r1)):
   for j in range(sides):
    th=2*PI*j/sides
    self.v.append((p+r*(math.cos(th)*ax+math.sin(th)*az)).tolist())
  for j in range(sides):
   q=(j+1)%sides
   self.f.extend(((k+j,k+q,k+sides+q),(k+j,k+sides+q,k+sides+j)))
 def build(self,name):
  if not self.f:return None
  vertices=np.asarray(self.v,dtype=np.float32)
  faces=np.asarray(self.f,dtype=np.int32)
  mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=False)
  rgb=TONES[name]
  rough=.64 if name.startswith('leaf') else .89
  material=PBRMaterial(name='FORMA-Buxus-'+name,baseColorFactor=[*rgb,255],roughnessFactor=rough,metallicFactor=0.0,doubleSided=name.startswith('leaf'))
  mesh.visual=TextureVisuals(material=material)
  return mesh

FORMS={
 'BOXWOOD_NATURAL':{'width':1.00,'height':.95,'depth':.96,'sprays':1710,'radius':.52,'irregular':.085},
 'BOXWOOD_SPHERE':{'width':.80,'height':.79,'depth':.78,'sprays':1350,'radius':.40,'irregular':.022},
 'BOXWOOD_HEDGE':{'width':1.18,'height':.88,'depth':.77,'sprays':2060,'radius':.60,'irregular':.017},
}

def make_form(name,idx):
 cfg=FORMS[name];rr=random.Random(20261121+idx*79)
 meshes={key:Builder() for key in TONES}
 W=cfg['width']/2; D=cfg['depth']/2;H=cfg['height']; N=cfg['sprays'];count=0
 # Independent, tapering woody architecture, all rooted to the soil at exact y=0.
 for i in range(14):
  ang=2*PI*i/14+rr.uniform(-.15,.15)
  base=np.array([rr.uniform(-.045,.045),0.,rr.uniform(-.045,.045)])
  mid=np.array([math.cos(ang)*W*.24,H*.26,math.sin(ang)*D*.24])
  tip=np.array([math.cos(ang)*W*.45,H*(.44+rr.uniform(-.1,.04)),math.sin(ang)*D*.45])
  meshes['wood'].segment(base,mid,.012,.006,5)
  meshes['wood'].segment(mid,tip,.006,.0025,5)

 # Deterministic spatial sampling of 3D crown; overlapping ellipsoidal
 # branches create authentic leaf layers, not opaque solid-primitive balls.
 golden=PI*(3-math.sqrt(5))
 for i in range(N+N//2):
  inner=i>=N
  y_norm=1-2*((i%N)+.5)/N
  a=golden*i+rr.uniform(-.20,.20)
  rad=math.sqrt(max(0.,1-y_norm*y_norm))
  xn,zn=math.cos(a)*rad,math.sin(a)*rad
  if name=='BOXWOOD_HEDGE':
   # Superellipse/rounded cuboid topiary; no perfectly straight foam corners.
   theta=math.atan2(zn,xn)
   m=max(abs(math.cos(theta))**5+abs(math.sin(theta))**5,.03)**(-1/5)
   xn=xn*m;zn=zn*m
   y_norm=math.copysign(abs(y_norm)**.55,y_norm)
  elif name=='BOXWOOD_SPHERE':
   y_norm=math.copysign(abs(y_norm)**.94,y_norm)
  asym=(1+cfg['irregular']*math.sin(a*5.6+y_norm*3.1)+.025*math.sin(a*13+y_norm*7))
  surf=np.array([xn*W*asym,H*(y_norm+.99)/1.99,zn*D*asym])
  if inner:
   surf[0]*=.61;surf[2]*=.61; surf[1]=H*(.48+y_norm*.33)
  surf+=np.array([rr.uniform(-.012,.012),rr.uniform(-.012,.012),rr.uniform(-.012,.012)])
  normal=unit([xn,.82*y_norm,zn]);normal=unit(normal + rr.uniform(-.08,.08)*UP)
  t=unit(np.cross(UP,normal))
  if np.linalg.norm(t)<.2:t=unit([math.cos(a),0.,math.sin(a)])
  # Interior twigs receive dark leaves; bright new growth only on tips.
  depth=rr.uniform(0,.035) if inner else rr.choices([rr.uniform(.002,.035),rr.uniform(.035,.095),rr.uniform(.085,.17)],weights=[7,2,1])[0]
  shoot_end=surf-normal*depth
  shoot_dir=unit(normal*.36+UP*.42+t*rr.uniform(-.38,.38))
  shoot_len=rr.uniform(.05,.098)
  shoot_root=shoot_end-shoot_dir*shoot_len
  shoot_root[1]=max(.012,shoot_root[1])
  shoot_end=shoot_root+shoot_dir*shoot_len
  if shoot_end[1]>H*.995:shoot_end[1]=H*.995
  mesh=meshes['twig'] if i%7==0 else meshes['wood']
  if i%14==0:mesh.segment(shoot_root,shoot_end,.0019,.00065,4)
  # Leaf pairs emerge opposite on the same slender twig. Curved single-leaf
  # geometry avoids uniform X-cards while keeping total GPU triangles low.
  orth=unit(np.cross(shoot_dir,t))
  for j in range(6):
   f=(j+.34)/6
   origin=shoot_root+shoot_dir*shoot_len*f
   for sign in (-1,1):
    lean=rr.uniform(.06,.18)
    leafdir=unit(UP*rr.uniform(.20,.55)+normal*lean+sign*t*rr.uniform(.28,.66)+orth*rr.uniform(-.18,.18))
    lateral=unit(np.cross(normal,leafdir))
    leaflen=rr.uniform(.018,.032)*(1-.13*f)
    leafwidth=leaflen*rr.uniform(.53,.77)
    outerness=1-depth/.17
    if outerness>.60 and f>.65:
     tone=rr.choices(['leaf-mid','leaf-green','leaf-tip','leaf-young'],weights=[24,37,30,9])[0]
    elif outerness<.40:
     tone=rr.choices(['leaf-dark','leaf-shadow','leaf-olive','leaf-under'],weights=[22,43,30,5])[0]
    else:
     tone=rr.choices(['leaf-shadow','leaf-olive','leaf-green','leaf-mid'],weights=[18,24,33,25])[0]
    # Base of leaves remains inside the same formal silhouette.
    base=origin+sign*orth*rr.uniform(.0015,.004)
    if (base[1]+leaflen*leafdir[1])>H*.995:base[1]=H*.995-leaflen*max(0,leafdir[1])
    if base[1]<.009:base[1]=.009
    meshes[tone].leaf(base,leafdir,lateral,leaflen,leafwidth,rr.uniform(-.0006,.0014))
    count+=1
 return meshes,count

def make_scene():
 scene=trimesh.Scene();meta={};total=0
 for idx,name in enumerate(FORMS):
  batches,count=make_form(name,idx)
  scene.graph.update(frame_to=name,frame_from=scene.graph.base_frame,matrix=np.eye(4))
  tris=0
  for material,batch in batches.items():
   mesh=batch.build(material)
   if mesh is None:continue
   scene.add_geometry(mesh,geom_name=name+'-'+material,node_name=name+'-'+material,parent_node_name=name)
   tris+=len(mesh.faces)
  meta[name]={**FORMS[name],'leafCount':count,'triangles':tris}
  total+=tris
 return scene,meta,total

def main():
 path=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/boxwood_v1/boxwood-sempervirens-original.glb')
 path.parent.mkdir(parents=True,exist_ok=True)
 scene,forms,total=make_scene();binary=scene.export(file_type='glb')
 path.write_bytes(binary)
 h=struct.unpack_from('<I',binary,12)[0];gltf=json.loads(binary[20:20+h]);sha=hashlib.sha256(binary).hexdigest()
 assert binary[:4]==b'glTF'
 assert struct.unpack_from('<I',binary,8)[0]==len(binary)
 assert all(any(n.get('name')==key for n in gltf['nodes']) for key in FORMS)
 info={'species':'Buxus sempervirens','version':'v1-forma-original-2026-11-21',
       'sha256':sha,'sizeBytes':len(binary),'triangles':total,
       'meshCount':len(gltf['meshes']),'materialCount':len(gltf['materials']),
       'forms':forms,'license':'Original procedural mesh and materials by FORMA, no borrowed geometry',
       'sourceCode':'tools/generate_boxwood_sempervirens.py',
       'modelPath':'/assets/landscape-models/boxwood-sempervirens-forma-original.glb'}
 jpath=Path(sys.argv[2]) if len(sys.argv)>2 else path.with_suffix('.source.json')
 jpath.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps(info,ensure_ascii=False))
if __name__=='__main__':main()
