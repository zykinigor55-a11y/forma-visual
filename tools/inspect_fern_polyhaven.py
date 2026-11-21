#!/usr/bin/env python3
"""Inspect source Poly Haven Fern 02 GLB; do not assume its 4 meshes are one object."""
import json, struct, hashlib, sys
from pathlib import Path
p=Path(sys.argv[1])
buf=p.read_bytes()
assert buf[:4]==b'glTF' and struct.unpack_from('<I',buf,4)[0]==2
assert struct.unpack_from('<I',buf,8)[0]==len(buf)
chunk_size=struct.unpack_from('<I',buf,12)[0]
assert buf[16:20]==b'JSON'
gltf=json.loads(buf[20:20+chunk_size])
def mini(node,i):
 d={k:node.get(k) for k in ('name','mesh','children','translation','rotation','scale','matrix') if k in node}
 d['id']=i
 if 'mesh' in node:
  mesh=gltf['meshes'][node['mesh']]
  d['meshName']=mesh.get('name')
  d['primitives']=[{
   'material':p.get('material'),'attributes':list(p.get('attributes',{})),
   'accessor':p.get('attributes',{}).get('POSITION'),
   'positionsBounds':{
    k:gltf['accessors'][p['attributes']['POSITION']].get(k) for k in ('min','max')
   } if 'POSITION' in p.get('attributes',{}) else None
  } for p in mesh['primitives']]
 return d
out={
 'originalSource':'https://polyhaven.com/a/fern_02',
 'downloadUrl':'https://www.innerscene.com/api/library/fern-clumps-82a87bea/download',
 'license':'CC0 1.0 Universal, Poly Haven; Rob Tuytel & Rico Cilliers',
 'sha256':hashlib.sha256(buf).hexdigest(),
 'bytes':len(buf),
 'generator':'tools/inspect_fern_polyhaven.py',
 'scene':gltf.get('scene'),
 'scenes':gltf.get('scenes'),
 'nodes':[mini(x,i) for i,x in enumerate(gltf.get('nodes',[]))],
 'meshes':len(gltf.get('meshes',[])),
 'materials':[x.get('name') for x in gltf.get('materials',[])],
 'images':len(gltf.get('images',[])),
 'textures':len(gltf.get('textures',[])),
 'extensionsUsed':gltf.get('extensionsUsed',[]),
 'accessors':len(gltf.get('accessors',[])),
 'buffers':gltf.get('buffers')
}
print(json.dumps(out,ensure_ascii=False,indent=2))
if len([n for n in gltf.get('nodes',[]) if 'mesh' in n])<4:raise RuntimeError('Expected four individual real fern mesh nodes')
Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
