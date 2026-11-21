#!/usr/bin/env python3
"""Install a SMALL, self-hosted 1K set of genuine CC0 Poly Haven house materials.
No models, no remote runtime dependency, no pre-existing textures overwritten.
Each JPEG is validated and recorded with its SHA256 and author source page.
"""
import hashlib
import json
from pathlib import Path
from urllib.request import Request,urlopen

OUT=Path('assets/house-pbr')
SRC={
 'brick':'brick_wall_003',
 'wood':'wooden_planks',
 'stucco':'white_stucco_02',
 'tile':'roof_tiles'
}
CHANNELS=('diff','nor_gl','rough')
MAX_BYTES=2_500_000
def fetch(url):
 with urlopen(Request(url,headers={'User-Agent':'FORMA-Visual-CC0-PBR-Installer/1.0'}),timeout=50) as r:
  b=r.read(MAX_BYTES+1)
 if len(b)>MAX_BYTES or len(b)<8000 or not b.startswith(b'\xff\xd8') or not b.rstrip().endswith(b'\xff\xd9'):
  raise ValueError('Invalid JPEG or texture outside acceptable 1K-size budget: '+url)
 return b

def main():
 OUT.mkdir(exist_ok=True,parents=True)
 manifest={'license':'CC0 1.0','source':'https://polyhaven.com/license','materials':{},'failed':{}}
 for name,slug in SRC.items():
  pending={}
  try:
   for ch in CHANNELS:
    p=OUT/f'{name}-{ch}-1k.jpg'
    url=f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{slug}/{slug}_{ch}_1k.jpg'
    blob=p.read_bytes() if p.exists() else fetch(url)
    if not blob.startswith(b'\xff\xd8'):raise ValueError('Bad JPEG')
    pending[ch]={'name':p.name,'url':url,'bytes':len(blob),
      'sha256':hashlib.sha256(blob).hexdigest()}
    if not p.exists():p.write_bytes(blob)
   manifest['materials'][name]={'page':'https://polyhaven.com/a/'+slug,'maps':pending}
   print('VERIFIED',name,slug,sum(v['bytes'] for v in pending.values()),flush=True)
  except Exception as exc:
   manifest['failed'][name]=str(exc)
   print('SKIPPED',name,slug,str(exc),flush=True)
 (OUT/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 if len(manifest['materials'])<3:raise SystemExit('No usable CC0 material library; keep existing procedural fallback')
if __name__=='__main__':main()
