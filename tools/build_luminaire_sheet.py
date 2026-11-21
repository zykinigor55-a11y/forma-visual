from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path

root=Path("assets/landscape-screenshots")
names=[
 ("01","Цилиндрический боллард","bollard"),
 ("02","Грунтовый","ground"),
 ("03","Поворотный прожектор","spot"),
 ("04","Световой столбик","low-post"),
 ("05","Террасный","deck-light"),
 ("06","Линейный в мощении","linear"),
 ("07","Грибовидный","mushroom"),
 ("08","Corten / RUSTY SLOT","square-bollard"),
 ("09","Садовый фонарь","garden-lantern"),
 ("10","Прожектор на колышке","spike-spot"),
 ("11","Светильник-шар","globe"),
]
SCALE=1
CW=770;CH=790;GAP=23;MARGIN=58;TITLE=170
width=MARGIN*2+4*CW+3*GAP
height=TITLE+MARGIN+3*CH+2*GAP+64
canvas=Image.new("RGB",(width,height),(22,25,28))
d=ImageDraw.Draw(canvas)
def font(sz,bold=False):
 files=["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"]
 for f in files:
  try:return ImageFont.truetype(f,sz)
  except OSError:continue
 return ImageFont.load_default()
ft=font(53,True);subtitle=font(24);count=font(21,True)
d.text((MARGIN,38),"DOM.RENDER   /   СВЕТИЛЬНИКИ",font=ft,fill=(237,239,238))
d.text((MARGIN,111),"11 оригинальных WebGL-рендеров моделей из каталога FORMA VISUAL",font=subtitle,fill=(169,180,184))
d.text((width-MARGIN-215,65),"3D  •  PBR",font=count,fill=(217,188,144))
for i,(num,label,ident) in enumerate(names):
 r=i//4;c=i%4
 x=MARGIN+c*(CW+GAP);y=TITLE+r*(CH+GAP)
 d.rounded_rectangle((x,y,x+CW,y+CH),radius=22,fill=(37,41,44),outline=(71,78,82),width=2)
 image_path=root/f"luminaire-v3-{ident}-real-render.png"
 if not image_path.is_file(): raise FileNotFoundError(image_path)
 im=Image.open(image_path).convert("RGB")
 # Retain the entire true WebGL image; no geometry is moved or repainted.
 im=ImageOps.contain(im,(CW-24,CH-105),Image.Resampling.LANCZOS)
 im_x=x+(CW-im.width)//2; im_y=y+13
 canvas.paste(im,(im_x,im_y))
 d.rounded_rectangle((x+16,y+CH-82,x+CW-16,y+CH-18),radius=10,fill=(28,32,34))
 d.text((x+32,y+CH-72),num+"   "+label,font=font(25,True),fill=(243,240,232))
 if ident=="globe":
  d.text((x+CW-138,y+CH-67),"Ø 40 см",font=font(16),fill=(204,179,146))
d.text((MARGIN,height-55),"Исходные изображения: настоящий Three.js WebGL проекта • без нейрогенерации",font=font(19),fill=(153,166,173))
d.text((width-210,height-55),"FORMA / 2026",font=font(17),fill=(200,181,155))
out=root/"lighting-v3-all-11-genuine-WebGL-sheet.png"
canvas.save(out,optimize=True)
assert out.stat().st_size>160_000
print(f"CREATED {out} {width}x{height} bytes={out.stat().st_size}")
