#!/usr/bin/env python3
"""Generate consistent local photographic preset cards, without buildings.
Use Unsplash/Pexels remote assets only as input; publish optimized local JPEGs.
Run inside GitHub Actions to make site independent of third-party hotlinks.
"""
import io
import json
import os
import sys
import time
import urllib.request
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageFilter, ImageDraw

PHOTOS = json.loads(r'''{"env-garden":"photo-1416879595882-3373a0480b5b","env-forest":"photo-1441974231531-c6227db76b6e","env-lake":"photo-1501785888041-af3ef285b470","env-mountains":"photo-1464822759023-fed622ff2c3b","env-city":"photo-1519501025264-65ba15a82390","env-courtyard":"photo-1494438639946-1ebd1d20bf85","env-nordic":"photo-1470770841072-f978cf4d019e","env-coast":"photo-1507525428034-b723cf961d3e","env-minimal":"photo-1500534623283-312aade485b7","env-mist":"photo-1483347756197-71ef80e95f73","time-morning":"photo-1470252649378-9c29740c9fa8","time-day":"photo-1500534623283-312aade485b7","time-golden":"photo-1500534314209-a25ddb2bd429","time-night":"photo-1519608487953-e999c86e7455","season-spring":"photo-1490750967868-88aa4486c946","season-summer":"photo-1470252649378-9c29740c9fa8","season-autumn":"photo-1507371341162-763b5e419408","season-winter":"photo-1455156218388-5e61b526818b","weather-clear":"photo-1500534623283-312aade485b7","weather-cloud":"photo-1500534314209-a25ddb2bd429","weather-rain":"photo-1515694346937-94d85e41e6f0","weather-fog":"photo-1483347756197-71ef80e95f73","weather-snow":"photo-1455156218388-5e61b526818b","plants-minimal":"photo-1500534623283-312aade485b7","plants-decorative":"photo-1416879595882-3373a0480b5b","plants-forest":"photo-1441974231531-c6227db76b6e","plants-mediterranean":"photo-1416879595882-3373a0480b5b","plants-tropical":"photo-1502082553048-f009c37129b9"}''')
BACKUP = json.loads(r'''{"env-garden":10610731,"env-forest":29863712,"env-lake":32665591,"env-mountains":35757664,"env-city":33783264,"env-courtyard":31979505,"env-nordic":35552479,"env-coast":36899281,"env-minimal":9976121,"env-mist":17497197,"season-spring":16215927,"season-summer":7601179,"season-autumn":9665012,"season-winter":35830070,"weather-clear":8996637,"weather-cloud":18154963,"weather-rain":28447782,"weather-fog":6697824,"weather-snow":6533455,"time-morning":17807979,"time-day":35382739,"time-golden":785734,"time-night":5518647,"plants-minimal":297954,"plants-decorative":4846304,"plants-forest":32166001,"plants-mediterranean":28450914,"plants-tropical":927414}''')
OVERRIDES = json.loads(r'''{"env-garden":"https://images.pexels.com/photos/37302772/pexels-photo-37302772.jpeg","env-courtyard":"https://images.pexels.com/photos/32229517/pexels-photo-32229517.jpeg","env-city":"https://images.pexels.com/photos/13399314/pexels-photo-13399314.jpeg","env-minimal":"https://images.pexels.com/photos/35298174/pexels-photo-35298174.jpeg","time-night":"https://images.unsplash.com/photo-1627842468152-62f95538037a?auto=format&fit=crop&w=1280&h=800&q=90","plants-minimal":"https://images.pexels.com/photos/35145770/pexels-photo-35145770.jpeg","plants-decorative":"https://images.pexels.com/photos/37818503/pexels-photo-37818503.jpeg","plants-mediterranean":"https://images.pexels.com/photos/28450914/pexels-photo-28450914.jpeg","plants-tropical":"https://images.pexels.com/photos/2336788/pexels-photo-2336788.jpeg"}''')
OUT = Path("assets/thumbs")
OUT.mkdir(parents=True, exist_ok=True)
WIDTH, HEIGHT = 960, 600

def download(url):
    request = urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; DOM-RENDER/2.1; architecture-preset-builder)"})
    with urllib.request.urlopen(request, timeout=25) as resp:
        return resp.read()

def photo_for(key, ident):
    urls = ([OVERRIDES[key]] if key in OVERRIDES else []) + [
      "https://images.unsplash.com/"+ident+"?auto=format&fit=crop&w=1280&h=800&q=90",
    ]
    if key in BACKUP:
        n = BACKUP[key]
        urls.append("https://images.pexels.com/photos/"+str(n)+"/pexels-photo-"+str(n)+".jpeg?auto=compress&cs=tinysrgb&w=1280&h=800&fit=crop")
    for url in urls:
        try:
            image=Image.open(io.BytesIO(download(url))).convert("RGB")
            if image.width<400 or image.height<220:
                raise ValueError("Source image too small")
            return image
        except Exception as exc:
            print("Source unavailable",key,str(exc),file=sys.stderr)
            time.sleep(.25)
    return None

created=0
missing=[]
for key, ident in PHOTOS.items():
    image=photo_for(key, ident)
    if image is None:
        missing.append(key)
        continue
    # Same crop, tonal range and paper-warm cinematic color grade for all presets.
    image=ImageOps.fit(image,(WIDTH,HEIGHT),method=Image.Resampling.LANCZOS,centering=(.5,.48))
    image=ImageEnhance.Color(image).enhance(.85)
    image=ImageEnhance.Contrast(image).enhance(1.065)
    image=ImageEnhance.Brightness(image).enhance(.99)
    image=image.filter(ImageFilter.UnsharpMask(radius=1.4,percent=90,threshold=3))
    # Subtle bottom photographic shadow. Labels are owned by HTML, never baked into image.
    overlay=Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    draw=ImageDraw.Draw(overlay)
    for y in range(int(HEIGHT*.60),HEIGHT):
        t=(y/HEIGHT-.6)/.4
        draw.line([(0,y),(WIDTH,y)],fill=(13,29,22,int(70*t*t)),width=1)
    image=Image.alpha_composite(image.convert("RGBA"),overlay).convert("RGB")
    outfile=OUT/(key+".jpg")
    image.save(outfile,"JPEG",quality=88,optimize=True,progressive=True,subsampling=0)
    created+=1
    print("Saved",outfile)
print("Created",created,"presets; missing",missing)
if created<24:
    raise RuntimeError("Not enough assets, do not publish a partially broken set")
