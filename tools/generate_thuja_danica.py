"""FORMA original Thuja occidentalis 'Danica' v2.
Independently generated geometry, seven custom PBR leaf atlases, three separate three-dimensional crowns.
All plant dimensions in metres, Y up. No copyrighted meshes or foliage photographs.
"""
import json, math, random, struct, hashlib, sys
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFilter
from trimesh.visual.texture import TextureVisuals
from trimesh.visual.material import PBRMaterial
PI=math.pi
UP=np.array((0.,1.,0.),dtype=float)
PALETTE={
 'inner':(43,88,42), 'forest':(56,112,50),'moss':(70,133,58),
 'green':(84,151,68),'fresh':(104,169,79),'tips':(126,188,90),'cool':(79,140,75)
}
COLORS={**PALETTE,'wood':(67,54,39),'twigs':(68,75,44)}

# Paint actual Thuja scale sprays: a central flexible axis and hundreds of
# short imbricated scale-leaflets / sub-branchlets, with transparent gaps.
def paint_spray(seed, base):
    rng=random.Random(81002+seed*41)
    W,H=384,512
    image=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(image,'RGBA')
    cx=W*.50+rng.uniform(-12,12)
    curve=rng.uniform(-14,14)
    def origin(t):
        return (cx+curve*math.sin(t*2.2)+rng.uniform(-.7,.7), H-12-t*(H-38))
    main=tuple(max(0,int(v*.68)) for v in base)
    last=origin(0)
    for j in range(28):
        now=origin((j+1)/28)
        d.line([last,now],fill=(*main,255),width=2 if j>8 else 3);last=now
    for level in range(31):
        t=(level+.7)/32
        basep=np.array(origin(t))
        width=132*(math.sin(PI*(.07+.84*t))**.78) * (1-.49*t)
        width*=rng.uniform(.81,1.08)
        for side in [-1,1]:
            # Alternating asymmetric, distinctly dissected fan branchlets.
            sx=basep[0]+side*rng.uniform(1,4);sy=basep[1]+rng.uniform(-3,3)
            ex=sx+side*width*rng.uniform(.78,1.13)
            ey=sy-rng.uniform(9,36)*(1-.4*t)
            if not 5<ex<W-5:continue
            stemshade=tuple(int(v*.75) for v in base)
            d.line([(sx,sy),(ex,ey)],fill=(*stemshade,240),width=2)
            dx=ex-sx;dy=ey-sy;L=math.hypot(dx,dy)
            if L<2:continue
            nx=-dy/L;ny=dx/L
            # Scale leaves overlapping in opposing rows: serrated and fernlike.
            for step in range(14):
                f=(step+.7)/15
                x=sx+dx*f;y=sy+dy*f
                spread=(9.0+7.0*(1-f))*(.4+.6*math.sin(PI*f)**.57)
                spread*=rng.uniform(.72,1.23)
                for side2 in [-1,1]:
                    x1=x+nx*spread*side2;y1=y+ny*spread*side2-rng.uniform(0,2)
                    x2=x+nx*spread*.12*side2+dx/L*4.5
                    y2=y+ny*spread*.12*side2+dy/L*4.5
                    color=tuple(max(0,min(255,int(v*rng.uniform(.86,1.14)+rng.randint(-2,3)))) for v in base)
                    d.polygon([(x-1.5,y+2),(x2,y2),(x1,y1-5),(x+.8,y-5)],fill=(*color,255))
            # A little leaf mass near lateral tip, no solid oval ribbons.
            color=tuple(max(0,min(255,int(v*1.06))) for v in base)
            d.ellipse((ex-2,ey-5,ex+2,ey),fill=(*color,255))
    # Terminal scale sprays in tight overlapping pairs.
    for i in range(8):
        t=.79+i*.025
        x,y=origin(t)
        for side in (-1,1):
            dx=side*(11-7*(t-.79)/.21)
            col=tuple(max(0,min(255,int(v*(1.08 if side>0 else .96)))) for v in base)
            d.polygon([(x,y+2),(x+dx*.55,y-7),(x+dx,y-14),(x+dx*.2,y-11)],fill=(*col,255))
    return image

TEXTURES={k:paint_spray(i,c) for i,(k,c) in enumerate(PALETTE.items())}

class Batch:
    def __init__(self):self.v=[];self.f=[];self.uv=[]
    def fan(self, p, width_dir, length_dir, width, length, twist, cup):
        p=np.asarray(p,dtype=float);u=unit(width_dir);v=unit(length_dir)
        n=unit(np.cross(u,v));k=len(self.v)
        # Curved fan with physical non-flat mid-body, double-sided PBR card.
        for tx,ty in [(-.5,0),(.5,0),(-.5,.48),(.5,.48),(-.5,1),(.5,1)]:
            pt=p+u*width*(tx+twist*ty*ty)+v*length*ty+n*(cup*math.sin(PI*ty)*(1-2*abs(tx)))
            self.v.append(pt.tolist());self.uv.append((tx+.5,1-ty))
        self.f.extend(((k,k+1,k+2),(k+1,k+3,k+2),(k+2,k+3,k+4),(k+3,k+5,k+4)))
    def tube(self,p,q,r0,r1,sides=5):
        p=np.asarray(p,dtype=float);q=np.asarray(q,dtype=float);dv=unit(q-p)
        tangent=unit(np.cross(dv,UP if abs(dv[1])<.94 else np.array((1.,0,0))))
        bitangent=unit(np.cross(dv,tangent));k=len(self.v)
        for pos,radius,v in ((p,r0,0),(q,r1,1)):
            for a in range(sides):
                phi=2*PI*a/sides
                self.v.append((pos+radius*(math.cos(phi)*tangent+math.sin(phi)*bitangent)).tolist())
                self.uv.append((a/sides,v))
        for i in range(sides):
            j=(i+1)%sides
            self.f.extend(((k+i,k+j,k+5+j),(k+i,k+5+j,k+5+i)))
    def mesh(self,material):
        if not self.f:return None
        m=trimesh.Trimesh(vertices=np.asarray(self.v,dtype=np.float32),faces=np.asarray(self.f,dtype=np.int32),process=False)
        m.visual=TextureVisuals(uv=np.asarray(self.uv,dtype=np.float32),material=material)
        return m

def unit(v):
    v=np.asarray(v,dtype=float)
    return v/max(1e-10,np.linalg.norm(v))

FORMS={
 'THUJA_DANICA_NATURAL':dict(width=1.04,height=.87,depth=1.00,outer=5500,inner=3500,deep=2200,base=1900,accents=1700,rough=.057,seed=119),
 'THUJA_DANICA_COMPACT':dict(width=.80,height=.68,depth=.78,outer=3750,inner=2450,deep=1500,base=1150,accents=1100,rough=.025,seed=220),
 'THUJA_DANICA_MATURE':dict(width=1.32,height=1.02,depth=1.25,outer=6500,inner=4250,deep=2600,base=2250,accents=2250,rough=.079,seed=321)
}

def build_crown(name,cfg):
    rng=random.Random(cfg['seed']);bat={k:Batch() for k in COLORS}
    w=cfg['width']*.5;d=cfg['depth']*.5;h=cfg['height']
    # Main internal wood axis is concealed in the canopy, supported by natural forks.
    for j in range(8):
        theta=2*PI*j/8+rng.uniform(-.27,.27)
        a=np.array((rng.uniform(-.05,.05),.005,rng.uniform(-.05,.05)))
        p1=np.array((math.cos(theta)*w*.16,h*.25,math.sin(theta)*d*.16))
        p2=np.array((math.cos(theta)*w*.38,h*.37,math.sin(theta)*d*.38))
        bat['wood'].tube(a,p1,.0085,.0065)
        bat['wood'].tube(p1,p2,.0065,.0031)
        for k in range(4):
            side=theta+rng.uniform(-.62,.62)
            q=p1*(1-k/6)+p2*(k/6)+np.array((math.cos(side)*w*.22,h*.045,math.sin(side)*d*.20))
            bat['twigs'].tube(p1*(1-k/6)+p2*(k/6),q,.0025,.0012)
    counts={}
    for layer,count in [('outer',cfg['outer']),('inner',cfg['inner']),('deep',cfg['deep']),('base',cfg['base']),('accents',cfg['accents'])]:
        counts[layer]=0
        for i in range(count):
            # Crossed, asymmetric crown layers; no monotonous vertical poles.
            v=(i+.49)/count
            yn=1-1.78*v  # crown roof complete, modestly flattened underside.
            ring=math.sqrt(max(0.,1-yn*yn))
            angle=i*(PI*(3-math.sqrt(5)))+rng.uniform(-.25,.25)
            ripple=(cfg['rough']*math.sin(6*angle+3*yn)+.023*math.sin(11*angle-4*yn))
            offset={'outer':0,'inner':-.080,'deep':-.16,'base':-.17,'accents':.009}[layer]
            a=(ring+ripple+offset)*w
            b=(ring+ripple+offset)*d
            y=h*((yn+.78)/1.78)*.96+.020
            if y<h*.10:y=h*.10+rng.uniform(-.015,.015)
            y+=rng.uniform(-.017,.017) if layer in ('outer','accents') else rng.uniform(-.022,.020)
            if layer=='base':
                # Interior lower shoots create a natural full skirt without a solid green filler sphere.
                angle=rng.uniform(-PI,PI)
                a=w*rng.uniform(.08,.56);b=d*rng.uniform(.08,.56)
                y=h*rng.uniform(.09,.36)
            if layer=='deep':
                a*=rng.uniform(.65,.95);b*=rng.uniform(.65,.95)
                y=h*rng.uniform(.20,.86)
            crownpoint=np.array((math.cos(angle)*a,y,math.sin(angle)*b))
            normal=unit((math.cos(angle)*ring*.92,yn*.55,math.sin(angle)*ring*.92))
            if np.linalg.norm(normal)<.1:normal=UP
            tangent=unit(np.array((-math.sin(angle),.08,math.cos(angle))))
            # Orientation follows biological upright flat sprays but rotates individual
            # fans in-plane, introducing overlap and irregular lacy rosettes.
            lean=rng.uniform(.29,.82) if layer in ('outer','accents') else rng.uniform(.18,.75)
            aim=unit(UP*(1-lean)+normal*lean+tangent*rng.uniform(-.47,.47))
            face=unit(np.cross(tangent,aim))
            roll=rng.uniform(-PI,PI)
            across=unit(tangent*math.cos(roll)+face*math.sin(roll))
            # different small and large scales, do not overfill terminal silhouette.
            length=rng.uniform(.050,.101)*({'inner':.95,'deep':.85,'base':.91,'outer':1.0,'accents':1.06}[layer])
            if yn>.62 and layer in ('outer','accents'):length*=.79
            width=length*rng.uniform(.49,.78)
            if rng.random()<.17:length*=.72
            root=crownpoint-aim*(length*rng.uniform(.36,.87))
            root-=normal*rng.uniform(.005,.020)
            root[1]=max(.015,root[1])
            key=rng.choices(list(PALETTE),[17,22,20,18,11,8,7] if layer=='inner' else [6,13,20,24,18,12,7])[0]
            if layer in ('deep','base'):key=rng.choices(list(PALETTE),[28,25,18,13,7,3,6])[0]
            if layer=='accents':key=rng.choices(list(PALETTE),[3,6,14,20,28,23,6])[0]
            # Tonal patches follow branch clusters rather than independent noise.
            tone=math.sin(angle*6.1+yn*5.8)+.43*math.sin(angle*11.3-yn*8.2)
            if layer in ('outer','accents') and tone>1.11 and key in ('forest','moss','green'):
                key=rng.choice(['fresh','green','tips'])
            elif layer in ('outer','accents') and tone<-.98 and key in ('tips','fresh','cool'):
                key=rng.choice(['moss','green','forest'])
            bat[key].fan(root,across,aim,width,length,twist=rng.uniform(-.16,.16),cup=rng.uniform(.001,.012))
            counts[layer]+=1
            # Short lateral shoots attach real 3D fan cards; no detached floating blobs.
            if i%13==0:
                p=root-aim*length*.27-normal*.018
                bat['twigs'].tube(p,root,.00125,.00065)
            # Paired off-axis secondary terminal fans that create actual lobes.
            if layer=='outer' and i%7==0:
                aim2=unit(aim*.58+across*rng.choice([-1,1])*.61+normal*.15)
                across2=unit(np.cross(aim2,normal+UP*.23))
                bat[key].fan(root+aim*length*.32,across2,aim2,width*.49,length*.52,twist=rng.uniform(-.09,.09),cup=.002)
    return bat,counts

def main():
    out=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/thuja-v2.glb');out.parent.mkdir(parents=True,exist_ok=True)
    scene=trimesh.Scene();total=0;stats={}
    for name,cfg in FORMS.items():
        bat,counts=build_crown(name,cfg)
        scene.graph.update(frame_to=name,frame_from=scene.graph.base_frame,matrix=np.eye(4))
        tris=0
        for matname,batch in bat.items():
            if not batch.f:continue
            if matname in PALETTE:
                material=PBRMaterial(name='FORMA-danica-'+matname,baseColorFactor=[255,255,255,255],
                    baseColorTexture=TEXTURES[matname],metallicFactor=0.,roughnessFactor=.84,
                    alphaMode='MASK',alphaCutoff=.41,doubleSided=True)
            else:
                material=PBRMaterial(name='FORMA-danica-'+matname,baseColorFactor=[*COLORS[matname],255],
                     roughnessFactor=.91,metallicFactor=0.)
            mesh=batch.mesh(material)
            scene.add_geometry(mesh,geom_name=name+'-'+matname,node_name=name+'-'+matname,parent_node_name=name)
            tris+=len(batch.f)
        stats[name]={'sizeMeters':{key:cfg[key] for key in ['width','depth','height']},'sprays':counts,'triangles':tris}
        total+=tris
    blob=scene.export(file_type='glb');out.write_bytes(blob)
    glen=struct.unpack_from('<I',blob,12)[0];gt=json.loads(blob[20:20+glen])
    doc={'species':"Thuja occidentalis 'Danica'",'version':'v4-sculpted-danica-fan-sprays-tonal-2026-11-20',
        'sha256':hashlib.sha256(blob).hexdigest(),'sizeBytes':len(blob),'triangles':total,
        'meshCount':len(gt['meshes']),'materialCount':len(gt['materials']),
        'textures':len(gt.get('textures',[])),'forms':stats,
        'license':'Original FORMA procedural geometry and leaf-spray texture atlas, no 3rd-party meshes'}
    p=Path(sys.argv[2]) if len(sys.argv)>2 else out.with_suffix('.source.json')
    p.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(doc,ensure_ascii=False))
if __name__=='__main__':main()
