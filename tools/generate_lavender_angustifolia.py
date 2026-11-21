#!/usr/bin/env python3
"""FORMA original flowering Lavandula angustifolia, physically-scaled GLB.
v3 optimized: precise botanically-shaped silhouettes with reduced polygon density and unneeded UVs.
Procedural geometry and PBR materials; no copied images or third-party meshes.
"""
import json, math, random, sys, hashlib, struct
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

PI=math.pi
UP=np.array([0.,1.,0.])
FOLIAGE={
 'foliage-silver':(127,143,135),
 'foliage-sage':(111,129,118),
 'foliage-deep':(83,106,98),
 'foliage-light':(146,160,146),
 'foliage-blue':(116,138,138),
}
FLORAL={
 'flower-purple':(116,91,157),
 'flower-royal':(88,73,130),
 'flower-lavender':(150,123,180),
 'flower-dusk':(101,87,128),
 'flower-pale':(174,155,197),
}
STEMS={'stem':(109,121,99),'wood':(74,68,58),'flower-stem':(101,117,100)}
COLORS={**FOLIAGE,**FLORAL,**STEMS}

class Batch:
 def __init__(self):self.vertices=[];self.faces=[]
 def polygon(self,verts,triangles=None):
  n=len(self.vertices)
  self.vertices.extend([np.asarray(v).tolist() for v in verts])
  if triangles is None:triangles=[(0,i,i+1) for i in range(1,len(verts)-1)]
  self.faces.extend([(n+a,n+b,n+c) for a,b,c in triangles])
 def tube(self,p0,p1,r0,r1,sides=4):
  a=np.asarray(p0,dtype=float);b=np.asarray(p1,dtype=float)
  axis=b-a;d=float(np.linalg.norm(axis))
  if d<1e-6:return
  axis/=d
  x=unit(np.cross(axis,UP if abs(axis[1])<.93 else np.array([1.,0,0])))
  y=unit(np.cross(axis,x))
  verts=[]
  for origin,r in [(a,r0),(b,r1)]:
   for k in range(sides):
    ang=2*PI*k/sides
    verts.append(origin+r*(x*math.cos(ang)+y*math.sin(ang)))
  tri=[]
  for k in range(sides):
   q=(k+1)%sides
   tri.extend([(k,q,sides+q),(k,sides+q,sides+k)])
  self.polygon(verts,tri)
 def leaf(self,root,axis,length,width,roll=0):
  """Pointed lanceolate lavender blade, 3-D midrib & subtle central curl."""
  d=unit(axis)
  x=unit(np.cross(d,UP if abs(d[1])<.90 else np.array([1.,0,0])))
  bend=unit(np.cross(x,d))
  x=unit(x*math.cos(roll)+bend*math.sin(roll))
  bend=unit(np.cross(x,d))
  p=np.asarray(root,float)
  tip=p+d*length+bend*length*.065
  shoulder=p+d*length*.36
  verts=[p,shoulder-x*width*.52,shoulder+bend*width*.12,shoulder+x*width*.52,tip]
  tri=[(0,1,2),(0,2,3),(1,4,2),(2,4,3)]
  self.polygon(verts,tri)
 def bud(self,center,stem_axis,height,rad,seed):
  """Eight-triangle tapered five-sepal calyx, not a sphere or dense cylinder."""
  p=np.asarray(center,float);d=unit(stem_axis)
  x=unit(np.cross(d,UP if abs(d[1])<.9 else np.array([1.,0,0])))
  y=unit(np.cross(d,x))
  verts=[p-d*height*.34]
  for k in range(4):
   a=2*PI*k/4+seed*.19
   verts.append(p+rad*(x*math.cos(a)+y*math.sin(a)))
  verts.append(p+d*height*.80)
  tri=[]
  for k in range(4):tri.extend([(0,1+(k+1)%4,1+k),(1+k,1+(k+1)%4,5)])
  self.polygon(verts,tri)
 def petals(self,p,axis,length,rad):
  p=np.asarray(p,float);d=unit(axis)
  x=unit(np.cross(d,UP if abs(d[1])<.94 else np.array([0.,0.,1.])))
  y=unit(np.cross(d,x))
  end=p+d*length
  tri=[];verts=[]
  # Two-lipped five-lobed lavender corolla retained with one shaped triangle per petal.
  for n,phi in enumerate((0,1.1,2.4,3.7,5.1)):
   ang=phi+.3;vec=x*math.cos(ang)+y*math.sin(ang)
   side=unit(np.cross(d,vec))
   center=end+vec*(rad*.42)
   k=len(verts)
   verts.extend([p+d*length*.32,center+vec*rad*1.04,center+side*rad*.78])
   tri.append((k,k+1,k+2))
  self.polygon(verts,tri)

def unit(a):
 a=np.array(a,dtype=float)
 return a/max(1e-9,float(np.linalg.norm(a)))

def lerp(a,b,f):return a*(1-f)+b*f

def build_form(form,index):
 cfg=[
  dict(height=.63,width=.88,depth=.87,dome=.38,stems=197,leafBranches=420,leafCount=25,tufts=1480,seed=267),
  dict(height=.47,width=.70,depth=.69,dome=.285,stems=122,leafBranches=294,leafCount=24,tufts=1010,seed=389),
  dict(height=.77,width=1.12,depth=1.09,dome=.465,stems=254,leafBranches=540,leafCount=26,tufts=1870,seed=478)
 ][index]
 rr=random.Random(cfg['seed']);mats={name:Batch() for name in COLORS}
 radiusX=cfg['width']*.5;radiusZ=cfg['depth']*.5;H=cfg['height'];dome=cfg['dome']
 # One real woody plant: branching lower scaffold, not floating clumps.
 for k in range(78 if index==2 else 62):
  phi=(2*PI*k/61)+rr.uniform(-.18,.18)
  r=rr.uniform(.012,.11)*([1,.74,1.3][index])
  a=np.array([math.cos(phi)*.017, .014, math.sin(phi)*.017])
  b=np.array([math.cos(phi)*r*.55,.07+rr.random()*.045,math.sin(phi)*r*.55])
  c=np.array([math.cos(phi)*r,rr.uniform(.11,.19),math.sin(phi)*r])
  mats['wood'].tube(a,b,.0035,.0028)
  mats['wood'].tube(b,c,.0028,.00135)
 # Opposite narrow leaves on a broad low silver-grey cushion.
 GOLD=PI*(3-math.sqrt(5))
 for j in range(cfg['leafBranches']):
  angle=j*GOLD+rr.uniform(-.22,.22)
  u=rr.random()**.55
  outer=.07+.87*u
  radius=outer*rr.uniform(.88,1.04)
  crownHeight=(.07+dome*math.sqrt(max(.045,1-outer**2)))
  crownHeight*=rr.uniform(.90,1.06)
  end=np.array([math.cos(angle)*radiusX*radius,crownHeight,math.sin(angle)*radiusZ*radius])
  # Curved fibrous stems radiate from the authentic shrub base.
  root=np.array([math.cos(angle)*rr.uniform(.020,.11),.02,math.sin(angle)*rr.uniform(.020,.11)])
  mid=lerp(root,end,.51);mid[1]+=rr.uniform(.003,.027)
  mats['stem'].tube(root,mid,.00185,.0012)
  mats['stem'].tube(mid,end,.0012,.00062)
  axis=unit(end-root)
  side=unit(np.cross(axis,UP if abs(axis[1])<.91 else np.array([1.,0,0])))
  for q in range(cfg['leafCount']):
   t=.19+(q+.28)*(.79/cfg['leafCount'])
   pos=(1-t)**2*root+2*t*(1-t)*mid+t*t*end
   baseAngle=PI*(q%2)+(PI*.5*((q//2)%2))+rr.uniform(-.32,.32)
   leafAxis=unit(side*math.cos(baseAngle)*rr.uniform(.28,.68)+UP*rr.uniform(.42,.80)+axis*.36+np.cross(side,axis)*math.sin(baseAngle)*rr.uniform(.25,.55))
   # Inner darker growth, exterior silver and pale foliage.
   color=rr.choices(list(FOLIAGE),weights=[29,26,14,21,10])[0]
   if t>.70 and q%3==0:color='foliage-light'
   if t<.52 and q%6==0:color='foliage-deep'
   length=rr.uniform(.018,.032)*([1,.91,1.07][index])
   width=length*rr.uniform(.17,.23)
   mats[color].leaf(pos,leafAxis,length,width,roll=rr.uniform(-.35,.35))
  for q in range(2):
   tipdir=unit(axis*.35+UP*.55+side*(q-.5)*.65)
   mats[rr.choice(['foliage-silver','foliage-light','foliage-sage'])].leaf(end,tipdir,rr.uniform(.021,.033),rr.uniform(.0032,.0052))
 # Mature Lavandula has a rounded, dense, overlapping silvery foliage cushion,
 # not one set of bare straight stalks forming a fan from a single point.
 # Clusters are individually placed IN the volume; each has 3-D narrow blades.
 for j in range(cfg['tufts']):
  theta=j*GOLD+rr.uniform(-.36,.36)
  rho=rr.random()**.57 * .89
  x=math.cos(theta);z=math.sin(theta)
  crown=.06+dome*math.sqrt(max(.012,1-rho*rho))
  centre=np.array([x*radiusX*rho*rr.uniform(.91,1.03),
                   crown*rr.uniform(.81,.99)-rr.uniform(.004,.018),
                   z*radiusZ*rho*rr.uniform(.91,1.03)])
  outward=unit([x*rr.uniform(.33,.75),rr.uniform(.65,1.06),z*rr.uniform(.33,.75)])
  nLeaves=rr.choice([4,5,5,6])
  spread=rr.uniform(.30,.68)
  # Small textured lavender sprig, rather than radial disconnected star leaves:
  # an inward woody connection with paired leaves staggered along it.
  inner=centre-outward*rr.uniform(.012,.023)
  mats['stem'].tube(inner,centre,.00075,.00043,sides=3)
  for q in range(nLeaves):
   alpha=PI*q + .45*(q//2) + rr.uniform(-.36,.36)
   along=outward*(q/max(1,nLeaves-1))*.009
   vec=unit(outward*.56+np.array([math.cos(alpha)*spread,
                                  rr.uniform(-.04,.20),
                                  math.sin(alpha)*spread]))
   tcol=rr.choices(list(FOLIAGE),weights=[33,27,13,17,10])[0]
   if rho<.5 and rr.random()<.22:tcol='foliage-deep'
   l=rr.uniform(.017,.029)*([1,.91,1.10][index])
   mats[tcol].leaf(centre-outward*.008+along,vec,l,l*rr.uniform(.14,.20),roll=rr.uniform(-PI,PI))
 # Curved, independently branching lavender flowering peduncles rise above
 # foliage; irregular lengths, occasional faded heads, NO even flat top.

 for i in range(cfg['stems']):
  ang=i*GOLD+rr.uniform(-.40,.40)
  r=math.sqrt(rr.random())*.92
  px=math.cos(ang)*radiusX*r; pz=math.sin(ang)*radiusZ*r
  baseY=.055+dome*math.sqrt(max(.012,1-r*r))*rr.uniform(.83,.98)
  base=np.array([px*.88,baseY,pz*.88])
  lean=(r*.098+rr.uniform(-.025,.035))*([1,.85,1.12][index])
  shift=np.array([math.cos(ang)*lean,0,math.sin(ang)*lean])
  spikeLength=rr.uniform(.036,.069)*([1,.83,1.10][index])
  tipY=H*(.72+.21*math.sqrt(max(.0,1-r*r))+rr.uniform(-.090,.085))
  if i%13==0:tipY*=rr.uniform(.75,.92)
  if i%17==0:tipY*=rr.uniform(.88,.99)
  tip=np.array([px+shift[0],tipY,pz+shift[2]])
  tip[1]=max(min(H*.992,tip[1]),base[1]+spikeLength+.038)
  flowerBase=tip.copy();flowerBase[1]-=spikeLength
  mid1=lerp(base,flowerBase,.32)
  mid2=lerp(base,flowerBase,.68)
  sway=np.array([rr.uniform(-.018,.018),0,rr.uniform(-.018,.018)])
  mid1+=sway*.58;mid2+=sway
  mats['flower-stem'].tube(base,mid1,.00122,.00102)
  mats['flower-stem'].tube(mid1,mid2,.00102,.00072)
  mats['flower-stem'].tube(mid2,flowerBase,.00072,.00043)
  tilt=unit(tip-flowerBase+np.array([rr.uniform(-.016,.016),0,rr.uniform(-.016,.016)]))
  # Each terminal spike has separated verticillasters, not violet cylinders.
  nlevels=rr.randint(5,10)
  color_base=rr.choices(['flower-purple','flower-royal','flower-lavender','flower-dusk'],weights=[35,30,18,17])[0]
  for level in range(nlevels):
   f=(level+.3)/(nlevels+.4)
   whorlCenter=lerp(flowerBase,tip,f)
   band=.47+.53*math.sin(PI*f)**.65
   ringCount=rr.choice([3,4,5,5])
   for b in range(ringCount):
    petalAngle=2*PI*(b+.1*rr.random())/ringCount + ang*.17 + level*1.42
    angleAxis=np.array([math.cos(petalAngle),.22+rr.random()*.32,math.sin(petalAngle)])
    radial=unit(angleAxis)
    radius=rr.uniform(.0030,.0064)*band
    point=whorlCenter+radial*radius
    d=unit(radial*.30+UP*.7)
    height=rr.uniform(.0058,.0135)*band
    col=color_base if rr.random()<.62 else rr.choices(list(FLORAL),weights=[28,30,17,19,6])[0]
    mats[col].bud(point,d,height,rr.uniform(.0026,.0045)*band,i*701+level*31+b)
    if rr.random()<.16 and level>1:
     # True lavender two-lipped flower tips in varying directions.
     mats['flower-pale' if rr.random()<.22 else 'flower-lavender'].petals(point+d*height*.5,d,.0060*band,.0031*band)
  if i%5==0: # Delicate pale green floral leaf on a few stems
   smallbase=lerp(base,mid,rr.uniform(.52,.77))
   mats['foliage-sage'].leaf(smallbase,unit([rr.uniform(-1,1),.5,rr.uniform(-1,1)]),.016,.0025)
 return mats,cfg

def main():
 outfile=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/lavender-angustifolia-forma-original.glb')
 outfile.parent.mkdir(parents=True,exist_ok=True)
 metaPath=Path(sys.argv[2]) if len(sys.argv)>2 else outfile.with_suffix('.source.json')
 scene=trimesh.Scene();stats={};materials=0
 for i,form in enumerate(['LAVENDER_NATURAL','LAVENDER_COMPACT','LAVENDER_MATURE']):
  scene.graph.update(frame_to=form,frame_from=scene.graph.base_frame,matrix=np.eye(4))
  batches,cfg=build_form(form,i);tris=0
  for name,batch in batches.items():
   if not batch.faces:continue
   color=COLORS[name]
   material=PBRMaterial(name='FORMA-lavender-'+name,
     baseColorFactor=[*color,255],metallicFactor=0,roughnessFactor=.86 if name in FLORAL else .94,
     doubleSided=name not in STEMS)
   mesh=trimesh.Trimesh(vertices=np.array(batch.vertices,dtype=np.float32),faces=np.array(batch.faces,dtype=np.int32),process=False)
   mesh.visual=TextureVisuals(material=material) # no UV: materials are solid PBR colours
   scene.add_geometry(mesh,geom_name=form+'-'+name,node_name=form+'-'+name,parent_node_name=form)
   tris+=len(batch.faces);materials+=1
  stats[form]={'width':cfg['width'],'height':cfg['height'],'depth':cfg['depth'],'flowerStems':cfg['stems'],'foliageStems':cfg['leafBranches'],'foliageTufts':cfg['tufts'],'triangles':tris}
 data=scene.export(file_type='glb');outfile.write_bytes(data)
 assert data[:4]==b'glTF' and struct.unpack_from('<I',data,8)[0]==len(data)
 glen=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+glen])
 names={n.get('name') for n in gltf['nodes']}
 assert set(stats)<=names
 doc={'species':'Lavandula angustifolia','version':'3.0 FORMA optimized PBR geometry: same size and count of real leaves and floral stems, fewer polygons, no unused UVs',
      'modelPath':'assets/landscape-models/lavender-angustifolia-forma-original.glb',
      'sourceCode':'tools/generate_lavender_angustifolia.py',
      'season':'summer flowering','license':'Original FORMA-authored mesh and procedural geometry; no copied external assets',
      'sha256':hashlib.sha256(data).hexdigest(),'sizeBytes':len(data),
      'triangles':sum(k['triangles'] for k in stats.values()),
      'meshCount':len(gltf['meshes']),'materialCount':len(gltf['materials']),
      'forms':stats}
 metaPath.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(doc,ensure_ascii=False))

if __name__=='__main__':main()
