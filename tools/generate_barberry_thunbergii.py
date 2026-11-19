#!/usr/bin/env python3
"""FORMA authored 3D Berberis thunbergii 'Atropurpurea' (self-generated).
No third-party meshes, textures, photos or CC-restricted assets are copied.
Natural scale: approximately 1.15m high, 1.4m spread; original branching,
many small pointed-oval leaves, spines, fruit, metallic-roughness PBR material.
"""
import math, random, numpy as np, trimesh, sys, json, hashlib, struct
from pathlib import Path
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals
from PIL import Image
r=random.Random(20261120);up=np.array([0.,1.,0.]);pi=math.pi
# Dense, broad-domed Atropurpurea with original clumps of short-shot leaves.

colors={'plum':(66,37,53),'burgundy':(104,38,58),'ruby':(136,47,61),'copper':(162,75,70),'dusk':(85,46,66),'olive':(94,80,62),'bark':(66,51,45),'twig':(97,59,56),'thorn':(123,74,59),'fruit':(154,22,39)}
data={name:[[],[]] for name in colors}
uvs={name:[] for name in colors}
LEAF_MATS={'plum','burgundy','ruby','copper','dusk','olive'}
def leaf_texture():
 # Self-authored PBR albedo/opacity: botanically shaped small obovate leaves,
 # fine central vein, secondary pigment mottling and naturally uneven edges.
 pixels=np.zeros((512,256,4),dtype=np.uint8)
 noise=random.Random(31021)
 for y in range(512):
  t=1-y/511
  radius=.46*max(0,(t**.62)*((1-t)**.38))*1.83
  mid=.505+.013*math.sin(3.6*t)
  for x in range(256):
   u=x/255
   edge=abs(u-mid)/max(.001,radius)
   if edge>=1:continue
   vein=abs(u-mid)
   variation=noise.uniform(-10,10)
   side=(math.cos(62*t+32*vein)*3 if vein>.015 else 0)
   fine=(math.sin(110*t+u*65)*math.sin(75*u+t*45))*3
   brightness=226-25*edge**3+variation+side+fine+(14 if vein<.009 else 0)
   b=max(110,min(255,int(brightness)))
   pixels[y,x]=(min(255,b+8),max(70,b-5),max(50,b-15),255)
 return Image.fromarray(pixels,mode='RGBA')
LEAF_TEXTURE=leaf_texture()
def bark_texture():
 # Tiny self-created subtle longitudinal woody grooving, without photographs.
 noise=random.Random(20261121)
 a=np.zeros((256,256,4),dtype=np.uint8)
 columns=[noise.uniform(-23,20) for _ in range(256)]
 for y in range(256):
  for x in range(256):
   n=columns[x]*.55+noise.uniform(-7,7)+math.sin(x*.38+math.sin(y*.052)) * 8 +math.sin(x*.95+y*.17)*3
   c=int(max(125,min(245,216+n)))
   a[y,x]=(c, max(115,c-7),max(115,c-13),255)
 return Image.fromarray(a,mode='RGBA')
BARK_TEXTURE=bark_texture()
def unit(v):
 v=np.asarray(v,dtype=float);return v/max(1e-9,np.linalg.norm(v))
def add(key,pts,faces,tex=None):
 v,f=data[key];n=len(v);v.extend(pts);f.extend(tuple(n+i for i in face) for face in faces)
 uvs[key].extend(tex if tex is not None else [(0,0)]*len(pts))
def tube(a,b,ra,rb,key,sides=5):
 a=np.asarray(a);b=np.asarray(b);d=unit(b-a);side=unit(np.cross(d,up if abs(d[1])<.92 else [1,0,0]));other=unit(np.cross(d,side));points=[]
 for p,radius in [(a,ra),(b,rb)]:
  for i in range(sides):points.append(p+radius*(side*math.cos(2*pi*i/sides)+other*math.sin(2*pi*i/sides)))
 add(key,points,[(i,(i+1)%sides,sides+(i+1)%sides) for i in range(sides)]+[(i,sides+(i+1)%sides,sides+i) for i in range(sides)],[(i/sides,j) for j in (0,1) for i in range(sides)])
def leaf(pos,d,length,width):
 # Curved alpha-masked 3D ribbon, not jagged triangular 3D leaf geometry.
 d=unit(d);s=unit(np.cross(d,up));z=unit(np.cross(s,d));p=np.asarray(pos)
 v=[p-s*width*.51,p+s*width*.51,
  p+d*length*.53-s*width*.53+z*length*.075,
  p+d*length*.53+s*width*.53+z*length*.075,
  p+d*length-s*width*.1+z*length*.025,
  p+d*length+s*width*.1+z*length*.025]
 key=r.choices(['plum','burgundy','ruby','copper','dusk','olive'],[15,36,25,11,9,4])[0]
 add(key,v,[(0,1,2),(1,3,2),(2,3,4),(3,5,4)],[(0,0),(1,0),(0,.53),(1,.53),(0,1),(1,1)])
def thorn(p,d):
 p=np.asarray(p);d=unit(d);s=unit(np.cross(d,up));w=.0018;h=.014+r.random()*.014
 add('thorn',[p-s*w,p+s*w,p+up*.0025,p+d*h],[(0,1,3),(1,2,3),(2,0,3),(0,2,1)])
def fruit(p):
 p=np.asarray(p);w=.0048+r.random()*.0031
 add('fruit',[p+[0,w,0],p+[w,0,0],p+[0,0,w],p+[-w,0,0],p+[0,0,-w],p+[0,-w*1.5,0]],[(0,1,2),(0,2,3),(0,3,4),(0,4,1),(5,2,1),(5,3,2),(5,4,3),(5,1,4)])
for j in range(115):
 a=j*pi*(3-math.sqrt(5))+r.uniform(-.08,.08);out=np.array([math.cos(a),0,math.sin(a)])
 reach=.69*(.18+.80*r.random())*(.91+.08*math.sin(a*3.1+j*.02))
 crown=math.sqrt(max(.08,1-(reach/.77)**2))
 h=1.15*(.48+.47*crown)*(.92+.08*r.random())*(.89 if j%13==0 else 1)
 base=np.array([r.uniform(-.085,.085),.025,r.uniform(-.085,.085)]);control=[base,base+out*reach*.21+up*h*.43,base+out*reach*.70+up*h*1.02,base+out*reach+up*h]
 def bend(t):
  s=1-t;return s**3*control[0]+3*s*s*t*control[1]+3*s*t*t*control[2]+t**3*control[3]
 previous=base
 for z in range(1,9):
  t=z/8;v=bend(t);tube(previous,v,.003*(1-t*.52)+.0011,.003*(1-t*.56)+.001,'bark' if z<5 else 'twig');previous=v
  if z in (3,5,7) and j%3==0:thorn(v,out+r.uniform(-.3,.3)*up)
 for k in range(9):
  t=.14+k*.088+r.uniform(-.013,.013);start=bend(t);direction=unit(out*math.cos(r.uniform(-.7,.7))+np.cross(out,up)*r.uniform(-.8,.8))
  length=.067+.10*r.random();elev=r.uniform(-.27,.18)-(t>.74)*.20
  v1=start+direction*length*.55+up*(length*elev+.016);v2=start+direction*length+up*(length*(elev+.05))
  for aa,bb,w0,w1 in [(start,v1,.0022,.0016),(v1,v2,.0016,.0009)]:
   bb[1]=min(1.13,max(.12,bb[1]));xz=np.linalg.norm(bb[[0,2]])
   if xz>.69:bb[[0,2]]*=.69/xz
   tube(aa,bb,w0,w1,'twig')
  if k%2==0:thorn(v1,direction+up*.2)
  for n in range(8):
   f=.09+(n+.37)*.109;p=start*(1-f)+v2*f
   if np.linalg.norm(p[[0,2]])>.66:continue
   # Alternate short spurs; 3 or 4 leaves in a whorl, as on real barberry.
   sides=4 if (n+k+j)%4 else 3
   for leafNo in range(sides):
    spin=2*pi*(leafNo+.2*r.random())/sides
    axis=unit(.32*direction+math.cos(spin)*np.cross(up,direction)+math.sin(spin)*up)
    d=unit(axis*.79+up*.18+direction*.13)
    length=.022+.013*r.random();w=length*(.57+.19*r.random())
    leaf(p+axis*.0026,d,length,w)
  if j%7==0 and k in (4,6):fruit(v2+up*.004)
 # Miniature leaves growing from terminal buds soften exposed twig ends.
 tip=bend(1)
 for q in range(7):
  phi=2*pi*(q+.21*r.random())/7
  axis=unit(out*.32+np.cross(up,out)*math.cos(phi)*.66+up*math.sin(phi)*.66)
  leaf(tip+axis*.004,axis+up*.16,.020+.010*r.random(),.011+.005*r.random())
# Every leaf is attached to a real twig. No floating leaf particles.
scene=trimesh.Scene();tris=0
for key,(verts,faces) in data.items():
 if not faces:continue
 mesh=trimesh.Trimesh(vertices=np.array(verts,dtype=np.float32),faces=np.array(faces),process=False)
 rgb=colors[key]
 material=PBRMaterial(name='FORMA-'+key,baseColorFactor=[*rgb,255],metallicFactor=0.,roughnessFactor=.76 if key in LEAF_MATS else .94,
  doubleSided=key in LEAF_MATS,
  baseColorTexture=LEAF_TEXTURE if key in LEAF_MATS else (BARK_TEXTURE if key in {'bark','twig'} else None),
  alphaMode='MASK' if key in LEAF_MATS else 'OPAQUE',
  alphaCutoff=.42 if key in LEAF_MATS else None)
 mesh.visual=TextureVisuals(uv=np.array(uvs[key],dtype=np.float32),material=material) if key in (LEAF_MATS|{'bark','twig'}) else TextureVisuals(material=material)
 scene.add_geometry(mesh,geom_name=key,node_name=key);tris+=len(faces)
out=Path(sys.argv[1]);out.parent.mkdir(parents=True,exist_ok=True);blob=scene.export(file_type='glb');out.write_bytes(blob)
assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,4)[0]==2 and struct.unpack_from('<I',blob,8)[0]==len(blob)
print(json.dumps({'sizeBytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'triangles':tris,'parts':len(scene.geometry),'boundsMeters':scene.bounds.round(4).tolist()}))
