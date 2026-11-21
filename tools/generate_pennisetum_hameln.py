#!/usr/bin/env python3
"""Original FORMA VISUAL Pennisetum alopecuroides 'Hameln' three-form GLB.
Curved slender 3D grass ribbons and physically meshed brush-like foxtail hairs.
All mesh coordinates are plant-local and planted world X/Z are untouched.
"""
import hashlib, json, math, sys, time
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

PI=math.pi
SEED=20261121
rng=np.random.default_rng(SEED)

class MeshBucket:
    def __init__(self):
        self.vertices=[]; self.faces=[]
    def add(self,vertices,faces):
        offset=len(self.vertices)
        self.vertices.extend(tuple(map(float,v)) for v in vertices)
        self.faces.extend((a+offset,b+offset,c+offset) for a,b,c in faces)
    def triangle(self,a,b,c):self.add([a,b,c],[(0,1,2)])
    def ribbon(self,positions,widths,seed=0.):
        V=[];F=[]
        for i,(p,w) in enumerate(zip(positions,widths)):
            z=(np.array(positions[min(i+1,len(positions)-1)])-np.array(positions[max(0,i-1)]))
            z=z/max(np.linalg.norm(z),.00001)
            sideways=np.cross(z,[0.,1.,0.]); sideways/=max(np.linalg.norm(sideways),.00001)
            f=i/(len(positions)-1)
            angle=.20*math.sin(f*PI*1.1+seed) + .28*f
            sideways=sideways*math.cos(angle)+np.cross(z,sideways)*math.sin(angle)
            V.extend([np.array(p)-sideways*w*.5,np.array(p)+sideways*w*.5])
            if i:
                a=2*(i-1);b=2*i
                F.extend([(a,a+1,b),(a+1,b+1,b)])
        self.add(V,F)
    def tube(self,points,radius,facets=3):
        vertices=[];faces=[]
        for j,p in enumerate(points):
            tang=np.array(points[min(len(points)-1,j+1)])-np.array(points[max(0,j-1)])
            tang=tang/max(np.linalg.norm(tang),1e-8)
            u=np.cross(tang,[0.,0.,1.]);u=u/max(np.linalg.norm(u),1e-8)
            v=np.cross(tang,u)
            rr=radius*(1-.43*j/max(1,len(points)-1))
            for k in range(facets):vertices.append(np.array(p)+rr*(math.cos(2*PI*k/facets)*u+math.sin(2*PI*k/facets)*v))
            if j:
                for k in range(facets):
                    a=(j-1)*facets+k;b=(j-1)*facets+(k+1)%facets;c=j*facets+k;d=j*facets+(k+1)%facets
                    faces.extend([(a,b,c),(b,d,c)])
        self.add(vertices,faces)

def smoothstep(t):return t*t*(3.-2.*t)
def bezier3(p0,p1,p2,p3,t):
    q=1-t
    return q*q*q*p0+3*q*q*t*p1+3*q*t*t*p2+t*t*t*p3

MATS={
 'foliage-shadow':([34,67,46,255],.93),
 'foliage-deep':([58,86,53,255],.89),
 'foliage-green':([80,115,67,255],.83),
 'foliage-sage':([111,135,81,255],.87),
 'foliage-lime':([145,157,93,255],.92),
 'foliage-warm':([154,153,98,255],.94),
 'culms':([109,124,77,255],.95),
 'seed-core':([133,113,84,255],.98),
 'plume-cream':([232,222,191,255],.98),
 'plume-silver':([222,225,199,255],.98),
 'plume-rose':([199,174,158,255],.98),
 'plume-beige':([208,194,163,255],.98)
}
CONFIGS=[
 ('PENNISETUM_NATURAL',.87,.76,2250,112,0.35,1.0),
 ('PENNISETUM_COMPACT',.69,.58,1430,73,0.27,.82),
 ('PENNISETUM_MATURE',1.15,.94,3160,163,0.47,1.20)
]

def generate_form(name,diam,height,blades,spikes,spread,scale):
    B={k:MeshBucket() for k in MATS}
    # Carpet of long, curved, thin 3D blade strips; no cones or generic bush hemispheres.
    for i in range(blades):
        angle=rng.uniform(0,2*PI);direction=np.array([math.cos(angle),0.,math.sin(angle)])
        right=np.array([-direction[2],0.,direction[0]])
        origin_r=spread*rng.uniform(.0,.22)
        root=direction*origin_r+right*rng.normal(0,spread*.055)
        length=rng.uniform(.35,.72)*scale
        tipspread=spread*rng.uniform(.68,1.33)
        lift=rng.uniform(.22,.50)*scale
        if rng.random()<.18:tipspread*=.62;lift*=.8
        endy=rng.uniform(.07,.28)*scale
        p0=root+np.array([0.,.007,0.]);p1=p0+np.array([0.,lift*.78,0.])+direction*(tipspread*.10)
        p2=p0+np.array([0.,lift*1.20,0.])+direction*(tipspread*.60)
        p3=p0+np.array([0.,endy,0.])+direction*(tipspread*1.34)
        def curve(t):
            p=bezier3(p0,p1,p2,p3,t)
            p+=right*(.018*scale*math.sin(t*PI*1.1+i*.23))
            return p
        pts=[curve(t) for t in np.linspace(0,1,7)]
        maxwidth=rng.uniform(.003,.0068)*scale
        widths=[maxwidth*max(.03,math.sin(PI*t)**.62) for t in np.linspace(0,1,7)]
        shade=rng.choice(['foliage-shadow','foliage-deep','foliage-green','foliage-sage','foliage-lime','foliage-warm'],p=[.10,.18,.32,.24,.11,.05])
        B[shade].ribbon(pts,widths,seed=i*.17)
    # Slender flower culms reach above the greenery, with naturally tilted plush fox-tails.
    for i in range(spikes):
        az=rng.uniform(0,2*PI)
        d=np.array([math.cos(az),0.,math.sin(az)])
        ort=np.array([-d[2],0.,d[0]])
        origin=d*rng.uniform(.01,spread*.22)+ort*rng.normal(0,spread*.045)
        lean=rng.uniform(.20,.59)
        topheight=rng.uniform(.62,.88)*height
        end=origin+d*(spread*lean)+np.array([0.,topheight,0.])
        p0=origin+np.array([0.,.022,0.]);p1=p0+np.array([0.,height*.34,0.])+d*spread*.12
        p2=end+np.array([0.,height*.13,0.])-d*spread*.27
        base=end
        stempts=[bezier3(p0,p1,p2,base,t) for t in np.linspace(0,1,5)]
        B['culms'].tube(stempts,.00085*scale,3)
        # Fox-tail lengths vary; fluffy filaments fan from a central seed-bearing shaft.
        plume_length=rng.uniform(.080,.148)*scale
        plume_width=rng.uniform(.022,.036)*scale
        leanvec=d*rng.uniform(.18,.46)+np.array([0.,1.,0.]);leanvec/=np.linalg.norm(leanvec)
        tip=end+leanvec*plume_length
        plumepts=[end+leanvec*plume_length*t+ort*(.009*scale*t*t) for t in np.linspace(0,1,5)]
        B['seed-core'].tube(plumepts,.0020*scale,4)
        # Each thin terminal bristle is a real triangle mesh, not a particle image.
        # Hair lengths and colours follow the tapered fox-tail silhouette.
        tone=rng.choice(['plume-cream','plume-silver','plume-rose','plume-beige'],p=[.47,.26,.11,.16])
        u=np.cross(leanvec,[0.,0.,1.]);u=u/max(np.linalg.norm(u),1e-9);v=np.cross(leanvec,u)
        for j in range(31):
            t=(j+.43)/31
            center=end+leanvec*plume_length*t+ort*(.009*scale*t*t)
            taper=max(.08,math.sin(PI*t)**.65)
            for k in range(7):
                aa=2*PI*(k+rng.uniform(-.2,.2))/7+j*2.39996
                radial=math.cos(aa)*u+math.sin(aa)*v
                wind=rng.uniform(.55,1.38)
                fil_len=plume_width*taper*wind
                hair_base=center+radial*(.0015*scale)
                hair_tip=hair_base+radial*fil_len+leanvec*(plume_length*.06)+ort*(rng.normal(0,.002)*scale)
                hair_mid=hair_base+radial*fil_len*.45+leanvec*(plume_length*.015)
                side=np.cross(radial,leanvec);side/=max(np.linalg.norm(side),1e-9)
                width=.0007*scale
                B[tone].triangle(hair_base-side*width,hair_base+side*width,hair_tip)
                # Small secondary soft filament flares from selected seeds.
                if (j+k)%4==0:
                    child_tip=hair_mid+radial*(fil_len*.42)+leanvec*(plume_length*.039)
                    B[tone].triangle(hair_mid-side*width*.53,hair_mid+side*width*.53,child_tip)
    glbmeshes=[]
    for namekey,b in B.items():
        if not b.faces:continue
        mesh=trimesh.Trimesh(vertices=np.asarray(b.vertices,np.float32),faces=np.asarray(b.faces,np.int64),process=False)
        rgba,rough=MATS[namekey]
        mat=PBRMaterial(name=namekey+' PBR original',baseColorFactor=rgba,metallicFactor=0.,roughnessFactor=rough,doubleSided=True)
        mesh.visual=TextureVisuals(material=mat)
        mesh.metadata['name']=name+'-'+namekey
        glbmeshes.append((name+'-'+namekey,mesh))
    stats={'blades':blades,'plumes':spikes,'plumeBristles':spikes*(31*7+55),'triangles':sum(len(m.faces) for _,m in glbmeshes),'meshes':len(glbmeshes),'requestedDiameter':diam,'requestedHeight':height}
    return glbmeshes,stats

def main(dest='/mnt/data/pennisetum_v1/pennisetum-hameln-forma-original.glb',meta='/mnt/data/pennisetum_v1/pennisetum-hameln-forma-original.source.json'):
    dest=Path(dest);meta=Path(meta);dest.parent.mkdir(parents=True,exist_ok=True);meta.parent.mkdir(parents=True,exist_ok=True)
    full=trimesh.Scene();stats={}
    for nam,diam,height,blades,spikes,spread,scale in CONFIGS:
        meshes,st=generate_form(nam,diam,height,blades,spikes,spread,scale)
        # Group children under form-specific named parent, selected natively by renderer.
        graphname=nam
        full.graph.update(frame_to=graphname,frame_from='world',matrix=np.eye(4))
        for child,mesh in meshes:full.add_geometry(mesh,geom_name=child,node_name=child,parent_node_name=graphname)
        stats[nam]=st
    binary=full.export(file_type='glb');dest.write_bytes(binary)
    d={'species':'Pennisetum alopecuroides Hameln','alias':'Cenchrus alopecuroides','version':'1.0 FORMA original fountain grass with fuzzy foxtail plumes','source':'Original procedural meshes; research RHS / UF IFAS','sha256':hashlib.sha256(binary).hexdigest(),'sizeBytes':len(binary),'triangleCount':sum(x['triangles'] for x in stats.values()),'meshCount':sum(x['meshes'] for x in stats.values()),'forms':stats,'modelFile':dest.name}
    meta.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(d,ensure_ascii=False,indent=2))
if __name__=='__main__':main(*(sys.argv[1:3]))
