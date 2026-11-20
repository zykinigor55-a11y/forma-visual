#!/usr/bin/env python3
"""Original FORMA three-form Cornus alba Elegantissima (self-generated).
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

colors={'plum':(89,120,82),'burgundy':(99,132,91),'ruby':(75,106,72),'copper':(112,142,108),'dusk':(64,99,66),'olive':(107,139,98),'bark':(48,31,35),'twig':(61,31,36),'thorn':(68,39,42),'fruit':(194,206,172)}
data={name:[[],[]] for name in colors}
uvs={name:[] for name in colors}
LEAF_MATS={'plum','burgundy','ruby','copper','dusk','olive'}
def leaf_texture(base,seed):
 # Original variegated Cornus leaf (no purchased or downloaded maps).
 # Oval alpha mask, muted green center and softly uneven cream-white edge.
 pixels=np.zeros((384,256,4),dtype=np.uint8);noise=random.Random(seed)
 for y in range(384):
  t=1-y/383
  radius=.49*max(0,math.sin(math.pi*t))**.73
  mid=.502+.008*math.sin(4*t)
  for x in range(256):
   u=x/255;w=abs(u-mid)/max(.001,radius)
   if w>=1:continue
   boundary=.66+.052*math.sin(t*9+u*18)+.019*math.sin(t*47+u*41)
   rim=min(1,max(0,(w-boundary)*12))
   rim=rim*rim*(3-2*rim)
   grain=noise.uniform(-6,6)+3*math.cos(t*35+u*19)
   internal=np.array(base)+grain
   cream=np.array([213,218,186])
   rgb=internal*(1-rim)+cream*rim
   if abs(u-mid)<.008:rgb=rgb*.79+np.array([200,219,175])*.21
   pixels[y,x]=(*np.clip(rgb,0,255).astype(np.uint8),255)
 return Image.fromarray(pixels,mode='RGBA')
LEAF_TEXTURES={name:leaf_texture(colors[name],20261120+i*47) for i,name in enumerate(['plum','burgundy','ruby','copper','dusk','olive'])}
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
for j in range(87):
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
  # Cornus has dark twig nodes, not barberry thorns.
 for k in range(8):
  t=.14+k*.088+r.uniform(-.013,.013);start=bend(t);direction=unit(out*math.cos(r.uniform(-.7,.7))+np.cross(out,up)*r.uniform(-.8,.8))
  length=.067+.10*r.random();elev=r.uniform(-.27,.18)-(t>.74)*.20
  v1=start+direction*length*.55+up*(length*elev+.016);v2=start+direction*length+up*(length*(elev+.05))
  for aa,bb,w0,w1 in [(start,v1,.0022,.0016),(v1,v2,.0016,.0009)]:
   bb[1]=min(1.13,max(.12,bb[1]));xz=np.linalg.norm(bb[[0,2]])
   if xz>.69:bb[[0,2]]*=.69/xz
   tube(aa,bb,w0,w1,'twig')
  # Dark woody leaf-bearing twigs.
  for n in range(8):
   f=.09+(n+.37)*.109;p=start*(1-f)+v2*f
   if np.linalg.norm(p[[0,2]])>.66:continue
   # Alternate short spurs; 3 or 4 leaves in a whorl, as on real barberry.
   sides=4 if (n+k+j)%4 else 3
   for leafNo in range(sides):
    spin=2*pi*(leafNo+.2*r.random())/sides
    axis=unit(.32*direction+math.cos(spin)*np.cross(up,direction)+math.sin(spin)*up)
    d=unit(axis*.79+up*.18+direction*.13)
    length=.030+.020*r.random();w=length*(.53+.20*r.random())
    leaf(p+axis*.0026,d,length,w)
  # The main ornamental characteristic is variegated summer foliage.
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
 material=PBRMaterial(name='FORMA-'+key,baseColorFactor=[255,255,255,255] if key in LEAF_MATS else [*rgb,255],metallicFactor=0.,roughnessFactor=.78 if key in LEAF_MATS else .93,
  doubleSided=key in LEAF_MATS,
  baseColorTexture=LEAF_TEXTURES[key] if key in LEAF_MATS else (BARK_TEXTURE if key in {'bark','twig'} else None),
  alphaMode='MASK' if key in LEAF_MATS else 'OPAQUE',
  alphaCutoff=.42 if key in LEAF_MATS else None)
 mesh.visual=TextureVisuals(uv=np.array(uvs[key],dtype=np.float32),material=material) if key in (LEAF_MATS|{'bark','twig'}) else TextureVisuals(material=material)
 scene.add_geometry(mesh,geom_name=key,node_name=key);tris+=len(faces)
# One GLB containing three genuine geometric crown variants. The paid 3DDD
# mesh/material files have not been used: source assets are authored from scratch.
srcMeshes={name:mesh.copy() for name,mesh in scene.geometry.items()}
allVertices=np.concatenate([mesh.vertices for mesh in srcMeshes.values()],axis=0)
lo=allVertices.min(axis=0);hi=allVertices.max(axis=0);span=np.maximum(hi-lo,.001)
shapes={
 'DOGWOOD_NATURAL':(2.91,2.25,2.97),
 'DOGWOOD_SPHERE':(1.58,1.55,1.55),
 'DOGWOOD_BOX':(1.02,1.11,1.24)
}
combined=trimesh.Scene()
for form,(wide,high,deep) in shapes.items():
 combined.graph.update(frame_to=form,frame_from=combined.graph.base_frame,matrix=np.eye(4))
 for key,source in srcMeshes.items():
  mesh=source.copy()
  p=np.asarray(mesh.vertices,dtype=np.float64)
  normalized=(p-lo)/span
  x=(normalized[:,0]-.5)*2
  z=(normalized[:,2]-.5)*2
  y=normalized[:,1]
  if form=='DOGWOOD_NATURAL':
   # Tall loose shrub with asymmetric upright leading shoots.
   px=x*(.86+.14*y);pz=z*(.82+.18*y)
   py=y
  elif form=='DOGWOOD_SPHERE':
   # Distinct rounded crown. Not merely the original bush rotated.
   dome=np.maximum(.22,1-((y-.56)/.75)**2)**.47
   px=x*dome;pz=z*dome;py=y
  else:
   # Distinct trimmed hedge block with flatish broad crown.
   px=np.sign(x)*np.abs(x)**.67
   pz=np.sign(z)*np.abs(z)**.67
   py=np.where(y>.82,.82+(y-.82)*.42,y)
  p[:,0]=px*wide*.50
  p[:,1]=py*high
  p[:,2]=pz*deep*.50
  mesh.vertices=p
  combined.add_geometry(mesh,geom_name=form+'-'+key,node_name=form+'-'+key,parent_node_name=form)
out=Path(sys.argv[1]);out.parent.mkdir(parents=True,exist_ok=True)
blob=combined.export(file_type='glb');out.write_bytes(blob)
assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,4)[0]==2 and struct.unpack_from('<I',blob,8)[0]==len(blob)
glen=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+glen].decode('utf8'))
names={n.get('name') for n in gltf['nodes']}
assert set(shapes)<=names,names
triangles=sum(gltf['accessors'][part['indices']]['count']//3 for m in gltf['meshes'] for part in m['primitives'])
print(json.dumps({'sizeBytes':len(blob),'sha256':hashlib.sha256(blob).hexdigest(),'triangles':triangles,'meshes':len(gltf['meshes']),'materials':len(gltf['materials']),'textures':len(gltf.get('textures',[])),'shapes':list(shapes)}))
