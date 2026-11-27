"""Prepare local transparent photo belts from official CC0 downloads."""
from pathlib import Path
from PIL import Image, ImageChops
from urllib.request import Request, urlopen
import io, zipfile
out=Path('assets/panoramas/r197')
out.mkdir(parents=True,exist_ok=True)
for asset in ('Backdrop001','Backdrop004'):
    url='https://ambientcg.com/get?file='+asset+'_8K-PNG.zip'
    with urlopen(Request(url,headers={'User-Agent':'FORMA-asset-import/1.0'}),timeout=120) as r:
        z=zipfile.ZipFile(io.BytesIO(r.read()))
    names=[n for n in z.namelist() if n.lower().endswith('.png') and '__macosx' not in n.lower()]
    if not names: raise RuntimeError(f'{asset}: no PNG')
    imgs=[(n,Image.open(io.BytesIO(z.read(n)))) for n in names]
    imgs.sort(key=lambda q:q[1].width*q[1].height,reverse=True)
    masks=[(n,i) for n,i in imgs if any(k in n.lower() for k in ('opacity','alpha','mask'))]
    candidates=[(n,i) for n,i in imgs if not any(k in n.lower() for k in ('opacity','alpha','mask','normal','roughness','height'))]
    if not candidates: raise RuntimeError(f'{asset}: no color PNG: {names}')
    name,im=candidates[0];im=im.convert('RGBA')
    if im.getchannel('A').getextrema()[0]==255:
        if not masks: raise RuntimeError(f'{asset}: no transparency: {names}')
        mask=masks[0][1].convert('L').resize(im.size,Image.Resampling.LANCZOS);im.putalpha(mask)
    if im.getchannel('A').getextrema()[0]>=250: raise RuntimeError(f'{asset}: opaque photo rejected')
    box=im.getchannel('A').getbbox()
    if not box: raise RuntimeError(f'{asset}: empty alpha')
    im=im.crop((0,box[1],im.width,box[3]))
    for w,tag in [(4096,'4k'),(8192,'8k')]:
        width=min(im.width,w);height=max(1,round(im.height*width/im.width))
        im.resize((width,height),Image.Resampling.LANCZOS).save(out/f'{asset}-{tag}.webp',quality=91,method=6)
        print(asset,tag,width,height)
