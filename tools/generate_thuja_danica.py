"""FORMA original Thuja occidentalis 'Danica'. Procedural 3D fan foliage, not a third-party mesh.
Generates three separately modelled silhouette variants. Geometry units: metres, Y up.
Completely original masked texture painting, branch geometry, materials. Reproducible seed.
"""
import json, math, random, struct, hashlib, sys
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFilter
from trimesh.visual.texture import TextureVisuals
from trimesh.visual.material import PBRMaterial
R=random.Random(20261120)
PI=math.pi
UP=np.array([0.,1.,0.])
GREEN_PALETTE=[(45,93,45),(59,114,54),(67,130,59),(76,141,66),(87,151,69),(45,101,50),(94,140,66)]

def paint_spray(seed, base):
    rnd=random.Random(381+seed)
    W,H=256,512
    im=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(im,'RGBA')
    cx=W/2 + rnd.uniform(-5,5)
    d.line([(cx,H-4),(cx+8,18)],fill=(*tuple(int(c*.65) for c in base),255),width=6)
    for level in range(32):
        t=(level+.5)/32 # 0 from root toward tip
        y=int(H-26-t*(H-37)); bow=12*math.sin(t*2.8)
        centre=cx+bow
        width=(26+80*(math.sin(PI*(t*.83+.08))**.78))*(1-t*.57)
        width*=rnd.uniform(.90,1.11)
        for side in (-1,1):
            extension=width*(.83+rnd.random()*.21)
            endpoint=(centre+side*extension+rnd.uniform(-2,2),y-10-rnd.uniform(0,13))
            px=centre+side*(7+rnd.uniform(0,7)); py=y+1+rnd.uniform(-3,3)
            twig_color=tuple(max(0,int(v*.77)) for v in base)
            seg=np.array([endpoint[0]-px,endpoint[1]-py],float)
            perp=np.array([-seg[1],seg[0]]) / max(1e-6,np.linalg.norm(seg))
            upper=[];lower=[]
            for q in range(13):
                f=q/12; c=np.array([px,py])+seg*f
                radius=9.1*(.24+.76*math.sin(PI*f)**.75)*(1-f*.41)
                radius*=rnd.uniform(.84,1.14)
                upper.append(tuple(c+perp*radius))
                lower.append(tuple(c-perp*radius))
            fill=tuple(min(255,int(v*rnd.uniform(.94,1.04))) for v in base)
            d.polygon(upper+list(reversed(lower)), fill=(*fill,255))
            d.line([(px,py),endpoint],fill=(*twig_color,205),width=2)
            for k in range(5):
                frac=(k+.3)/5
                stemx=px*(1-frac)+endpoint[0]*frac
                stemy=py*(1-frac)+endpoint[1]*frac
                nscale=(.87-frac*.47)
                jit=rnd.uniform(-4,4)
                c=tuple(min(255,max(0,int(v+rnd.uniform(-14,17)+level*.15))) for v in base)
                span=14*nscale
                d.polygon([(stemx-side*2,stemy+3),
                           (stemx+side*(span*.64)+jit,stemy-7),
                           (stemx+side*(span+3)+jit,stemy-17-rnd.uniform(0,6)),
                           (stemx+side*span*.60,stemy-12)], fill=(*c,255))
                shine=tuple(min(255,int(v*1.15)) for v in c)
                d.line([(stemx+side*.5,stemy-1),(stemx+side*span*.38,stemy-8)], fill=(*shine,190),width=1)
        c=tuple(min(255,int(v*(1.01+rnd.uniform(-.07,.07)))) for v in base)
        d.polygon([(centre-10,y+4),(centre+4,y+1),(centre+6,y-16),(centre-2,y-21)], fill=(*c,255))
        d.polygon([(centre+8,y+4),(centre-3,y-1),(centre-6,y-13),(centre+3,y-19)],fill=(*tuple(max(0,int(v*.94)) for v in c),255))
    d.polygon([(cx+7,43),(cx-5,40),(cx+8,7)],fill=(*base,255))
    return im

TEXTURES=[paint_spray(i,c) for i,c in enumerate(GREEN_PALETTE)]
PALETTE=['deep','moss','green','emerald','tips','shadow','warm']
COLORS=dict(zip(PALETTE,GREEN_PALETTE))
COLORS.update(wood=(79,58,42),twig=(91,75,48))

class Batch:
    def __init__(self): self.points=[];self.faces=[];self.uv=[]
    def quad(self,p,axis_x,axis_y,scale_x,scale_y,flex=0):
        k=len(self.points)
        x=axis_x*scale_x;y=axis_y*scale_y
        n=np.cross(axis_x,axis_y)
        n/=max(np.linalg.norm(n),1e-8)
        for tx,ty in [(-.5,0),(.5,0),(-.5,.54),(.5,.54),(-.5,1),(.5,1)]:
            curl=(.5-abs(tx))*.0015 + flex*math.sin(PI*ty)
            v=p+x*tx+y*ty+n*curl
            self.points.append(v.tolist());self.uv.append([tx+.5,1-ty])
        self.faces.extend([(k,k+1,k+2),(k+1,k+3,k+2),(k+2,k+3,k+4),(k+3,k+5,k+4)])
    def taper(self,a,b,r1,r2):
        a=np.array(a);b=np.array(b);vec=b-a
        tangent=vec/max(1e-9,np.linalg.norm(vec))
        lateral=np.cross(tangent,UP if abs(tangent[1])<.91 else np.array([1.,0.,0.])); lateral/=max(1e-9,np.linalg.norm(lateral))
        other=np.cross(lateral,tangent)
        k=len(self.points)
        for origin,rad in [(a,r1),(b,r2)]:
            for i in range(5):
                angle=2*PI*i/5
                self.points.append((origin+rad*(math.cos(angle)*lateral+math.sin(angle)*other)).tolist())
                self.uv.append([i/4,0.5])
        for i in range(5):
            j=(i+1)%5
            self.faces.extend([(k+i,k+j,k+5+j),(k+i,k+5+j,k+5+i)])
    def mesh(self,mat):
        if not self.faces:return None
        m=trimesh.Trimesh(vertices=np.asarray(self.points,dtype=np.float32),faces=np.asarray(self.faces,dtype=np.int32),process=False)
        m.visual=TextureVisuals(uv=np.asarray(self.uv,dtype=np.float32),material=mat)
        return m

def unit(v):
    a=np.array(v,dtype=float);return a/max(1e-9,float(np.linalg.norm(a)))

def generate_form(form,number):
    rr=random.Random(92100+number*13)
    specs=[dict(width=1.02,height=.89,depth=1.00,radius=.52,plumes=5100,irregular=.055),
           dict(width=.78,height=.68,depth=.79,radius=.40,plumes=3200,irregular=.025),
           dict(width=1.30,height=1.04,depth=1.27,radius=.66,plumes=6900,irregular=.09)]
    cfg=specs[number]
    mats={name:Batch() for name in COLORS}
    foliage={name:mats[name] for name in PALETTE}
    wood=mats['wood'];twig=mats['twig']
    W=cfg['width']/2;D=cfg['depth']/2;H=cfg['height']
    for j in range(5):
        base=np.array([rr.uniform(-.055,.055),0.,rr.uniform(-.055,.055)])
        tip=np.array([rr.uniform(-.13,.13),H*.48,rr.uniform(-.13,.13)])
        mid=base*.58+tip*.42+np.array([rr.uniform(-.02,.02),0.,rr.uniform(-.02,.02)])
        wood.taper(base,mid,.012,.007);wood.taper(mid,tip,.007,.0025)
    n=cfg['plumes']
    for i in range(n):
        t=(i+.5)/n
        yn=1-2*t
        ring=math.sqrt(max(0,1-yn*yn))
        angle=i*(PI*(3-math.sqrt(5)))+rr.uniform(-.19,.19)
        xn=math.cos(angle)*ring;zn=math.sin(angle)*ring
        sector=1 + cfg['irregular']*math.sin(angle*6.7+yn*4.9)+.02*math.sin(angle*15+yn*13)
        surf=np.array([xn*W*sector,H*(.51+yn*.49),zn*D*sector])
        if surf[1]<.04:surf[1]=.035+rr.random()*.012
        surf+=np.array([rr.uniform(-.018,.018),rr.uniform(-.013,.013),rr.uniform(-.018,.018)])
        normal=unit([xn*.83,yn*.70,zn*.83]);tangent=unit(np.cross(UP,normal))
        if np.linalg.norm(tangent)<.0001:tangent=unit([math.cos(angle),0,math.sin(angle)])
        backdepth=rr.uniform(.004,.055) if i%4 else rr.uniform(.06,.14)
        root=surf-normal*backdepth
        lean=rr.uniform(.15,.38);direction=unit(UP*(1-lean)+normal*lean+rr.uniform(-.32,.32)*tangent)
        sideways=unit(np.cross(direction,normal+unit(tangent)*rr.uniform(-.85,.85)))
        if np.linalg.norm(sideways)<.5:sideways=tangent
        L=rr.uniform(.066,.116) * (1.13 if i%11==0 else 1)
        width=rr.uniform(.050,.080)
        if i%5==0:L*=.76
        root=root-direction*L*.36
        if root[1]<.015:root[1]=.015
        tip=root+direction*L
        if i%3==0:
            p0=root-normal*rr.uniform(.012,.05)
            twig.taper(p0,root,.0017,.0010)
        colorindex=rr.choices(range(len(PALETTE)),[7,13,19,22,11,12,7])[0]
        if i%13==0: colorindex=0
        foliage[PALETTE[colorindex]].quad(root,sideways,direction,width,L,flex=rr.uniform(-.006,.009))
        if i%5==0:
            direction2=unit(direction*.66+tangent*rr.uniform(-.50,.50)+normal*.18)
            sideways2=unit(np.cross(direction2,normal+up if False else normal+UP*.31))
            if np.linalg.norm(sideways2)<.3:sideways2=sideways
            foliage[PALETTE[colorindex]].quad(root+direction*L*.49,sideways2,direction2,width*.53,L*.47,flex=.002)
    return mats, cfg

def make_scene():
    scene=trimesh.Scene(); stats={}; total_tri=0
    for number,form in enumerate(['THUJA_DANICA_NATURAL','THUJA_DANICA_COMPACT','THUJA_DANICA_MATURE']):
        mats,cfg=generate_form(form,number)
        scene.graph.update(frame_to=form,frame_from=scene.graph.base_frame,matrix=np.eye(4))
        subtotal=0
        for name,batch in mats.items():
            if not batch.faces:continue
            rgb=COLORS[name]
            if name in PALETTE:
                material=PBRMaterial(name='FORMA-thuja-'+name,baseColorFactor=[255,255,255,255],baseColorTexture=TEXTURES[PALETTE.index(name)],roughnessFactor=.79,metallicFactor=0.,alphaMode='MASK',alphaCutoff=.38,doubleSided=True)
            else:
                material=PBRMaterial(name='FORMA-thuja-'+name,baseColorFactor=[*rgb,255],roughnessFactor=.92,metallicFactor=0.,doubleSided=False)
            mesh=batch.mesh(material)
            if mesh is None:continue
            scene.add_geometry(mesh,geom_name=form+'-'+name,node_name=form+'-'+name,parent_node_name=form)
            subtotal+=len(batch.faces)
        total_tri+=subtotal
        stats[form]={**cfg,'triangles':subtotal}
    return scene,stats,total_tri

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/thuja-danica-forma-original.glb')
    out.parent.mkdir(parents=True,exist_ok=True)
    scene,stats,tris=make_scene();blob=scene.export(file_type='glb');out.write_bytes(blob)
    assert blob[:4]==b'glTF' and struct.unpack_from('<I',blob,8)[0]==len(blob)
    glen=struct.unpack_from('<I',blob,12)[0];gltf=json.loads(blob[20:20+glen])
    assert all(any(node.get('name')==key for node in gltf['nodes']) for key in stats)
    info={'species':'Thuja occidentalis Danica','version':'v1-real-scale-spray',
          'sha256':hashlib.sha256(blob).hexdigest(),'sizeBytes':len(blob),'triangles':tris,
          'meshCount':len(gltf['meshes']),'materials':len(gltf['materials']),
          'textures':len(gltf.get('textures',[])), 'forms':stats,
          'license':'FORMA-original procedural mesh, procedural foliage texture'}
    jpath=Path(sys.argv[2]) if len(sys.argv)>2 else out.with_suffix('.source.json')
    jpath.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(info,ensure_ascii=False))
if __name__=='__main__':main()
