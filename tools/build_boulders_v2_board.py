from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
root=Path('assets/landscape-screenshots')
names=[
 ('ГРАНИТ · скальный валун','granite-boulder'),
 ('ИЗВЕСТНЯК · выветренный','limestone-boulder'),
 ('СЛАНЕЦ · пластовый','slate-boulder'),
 ('ПЕСЧАНИК · тёплый','sandstone-boulder')
]
CARD=1030;HEIGHT=890;GAP=24;PAD=54;TITLE=158
W=PAD*2+2*CARD+GAP
H=TITLE+2*HEIGHT+GAP+PAD+40
canvas=Image.new('RGB',(W,H),(22,25,27));d=ImageDraw.Draw(canvas)
def font(size,bold=False):
 for path in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  try:return ImageFont.truetype(path,size)
  except OSError:pass
 return ImageFont.load_default()
d.text((PAD,32),'DOM.RENDER  /  ВАЛУНЫ  ·  РЕАЛЬНЫЕ 3D-СКАНЫ',font=font(40,True),fill=(235,237,237))
d.text((PAD,98),'Четыре разных природных камня · сохранённые CC0 GLB / фотографические PBR-материалы',font=font(19),fill=(173,183,187))
for i,(name,slug) in enumerate(names):
 x=PAD+(i%2)*(CARD+GAP);y=TITLE+(i//2)*(HEIGHT+GAP)
 d.rounded_rectangle((x,y,x+CARD,y+HEIGHT),radius=20,fill=(45,50,52),outline=(84,91,93),width=2)
 src=root/f'boulder-v3-{slug}-actual-pbr-webgl.png'
 if not src.is_file():raise FileNotFoundError(src)
 im=Image.open(src).convert('RGB');im=ImageOps.fit(im,(CARD-24,HEIGHT-90),Image.Resampling.LANCZOS,centering=(.5,.52))
 canvas.paste(im,(x+12,y+11))
 d.rounded_rectangle((x+12,y+HEIGHT-70,x+CARD-12,y+HEIGHT-14),radius=9,fill=(26,30,32))
 d.text((x+30,y+HEIGHT-60),f'{i+1:02d}   {name}',font=font(27,True),fill=(241,237,228))
d.text((PAD,H-53),'Не нейрогенерация. Настоящие 3D-меши и фототекстуры Poly Haven, WebGL DOM.RENDER.',font=font(20),fill=(174,184,185))
out=root/'boulder-v3-all-four-real-PBR-WebGL-board.png'
canvas.save(out,optimize=True)
assert out.stat().st_size>160000
print('CREATED',out,out.stat().st_size,W,H)
