from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
base=Path('assets/landscape-screenshots')
fixtures=[
 ('01','Прожектор на колышке','spike-spot'),
 ('02','Чёрный столбик с 3 поясами','square-bollard'),
 ('03','Столбик с матовым стеклом','low-post'),
 ('04','Светильник-шар','globe'),
 ('05','Поворотный на стойке','spot'),
 ('06','Открытая прямоугольная рама','garden-lantern'),
 ('07','Цилиндр с ребристым стеклом','bollard')
]
def font(n,b=False):
 paths=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if b else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
 '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf']
 for p in paths:
  try:return ImageFont.truetype(p,n)
  except OSError:pass
 return ImageFont.load_default()
CELL_W=740;CELL_H=790;X=56;Y=185;GAP=20
w=X*2+CELL_W*4+GAP*3;h=Y+CELL_H*2+GAP+84
out=Image.new('RGB',(w,h),(23,26,29));pen=ImageDraw.Draw(out)
pen.text((X,48),'DOM.RENDER  /  7 СВЕТИЛЬНИКОВ',font=font(52,True),fill=(239,237,231))
pen.text((X,119),'Из реального проекта Three.js  ·  Геометрия по загруженным фотографиям',font=font(23),fill=(169,181,187))
pen.text((w-280,75),'FORMA  /  3D',font=font(23,True),fill=(215,184,141))
for i,(num,label,key) in enumerate(fixtures):
 col=i%4;row=i//4;left=X+col*(CELL_W+GAP);top=Y+row*(CELL_H+GAP)
 pen.rounded_rectangle((left,top,left+CELL_W,top+CELL_H),radius=20,fill=(42,47,49),outline=(78,85,89),width=2)
 p=base/f'luminaire-v4-{key}-real-render.png'
 if not p.is_file():raise FileNotFoundError(str(p))
 im=ImageOps.contain(Image.open(p).convert('RGB'),(CELL_W-28,CELL_H-105),Image.Resampling.LANCZOS)
 out.paste(im,(left+(CELL_W-im.width)//2,top+13))
 pen.rounded_rectangle((left+14,top+CELL_H-82,left+CELL_W-14,top+CELL_H-18),radius=9,fill=(26,30,32))
 pen.text((left+25,top+CELL_H-69),num+' · '+label,font=font(22,True),fill=(237,234,229))
pen.text((X,h-52),'Основание: реальные снимки WebGL из программы; не иллюстрации нейросети',font=font(19),fill=(151,166,169))
final=base/'lighting-v4-user-photo-7-models-board.png'
out.save(final,optimize=True)
if final.stat().st_size<250_000:raise RuntimeError('board png invalid')
print(f'REAL 7-LAMP BOARD: {final}, {w}x{h}, {final.stat().st_size} bytes')
