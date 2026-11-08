#!/usr/bin/env python3
"""Build sharp local 2K WebP preset photographs from high-resolution Unsplash originals.
No houses or demo architecture in atmosphere selector. Sources are credited in README.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import io, time, urllib.request
photos = {
"env-garden":"photo-1416879595882-3373a0480b5b",
"env-forest":"photo-1441974231531-c6227db76b6e",
"env-lake":"photo-1501785888041-af3ef285b470",
"env-mountains":"photo-1464822759023-fed622ff2c3b",
"env-city":"photo-1661976088440-7e12a111b149",
"env-courtyard":"photo-1416879595882-3373a0480b5b",
"env-nordic":"photo-1736266629422-4d172f852c96",
"env-coast":"photo-1507525428034-b723cf961d3e",
"env-minimal":"photo-1500534623283-312aade485b7",
"env-mist":"photo-1483347756197-71ef80e95f73",
"time-morning":"photo-1470252649378-9c29740c9fa8",
"time-day":"photo-1500534623283-312aade485b7",
"time-golden":"photo-1500534314209-a25ddb2bd429",
"time-night":"photo-1519608487953-e999c86e7455",
"season-spring":"photo-1490750967868-88aa4486c946",
"season-summer":"photo-1470252649378-9c29740c9fa8",
"season-autumn":"photo-1507371341162-763b5e419408",
"season-winter":"photo-1455156218388-5e61b526818b",
"weather-clear":"photo-1500534623283-312aade485b7",
"weather-cloud":"photo-1500534314209-a25ddb2bd429",
"weather-rain":"photo-1515694346937-94d85e41e6f0",
"weather-fog":"photo-1483347756197-71ef80e95f73",
"weather-snow":"photo-1455156218388-5e61b526818b",
"plants-minimal":"photo-1500534623283-312aade485b7",
"plants-decorative":"photo-1416879595882-3373a0480b5b",
"plants-forest":"photo-1441974231531-c6227db76b6e",
"plants-mediterranean":"photo-1416879595882-3373a0480b5b",
"plants-tropical":"photo-1502082553048-f009c37129b9",
}
out=Path("assets/thumbs/hd")
out.mkdir(parents=True,exist_ok=True)
success=[]
for name, photo_id in photos.items():
    source=f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=2400&h=1500&q=91"
    for attempt in range(3):
        try:
            req=urllib.request.Request(source,headers={"User-Agent":"Mozilla/5.0 (DOM.RENDER photo preset build)"})
            with urllib.request.urlopen(req,timeout=30) as res:
                raw=res.read()
            image=Image.open(io.BytesIO(raw)).convert("RGB")
            if image.width<1800 or image.height<1100:
                raise ValueError(f"Source too small: {image.size}")
            image=ImageOps.fit(image,(2048,1280),method=Image.Resampling.LANCZOS)
            image=ImageEnhance.Contrast(image).enhance(1.045)
            image=ImageEnhance.Color(image).enhance(.94)
            image=image.filter(ImageFilter.UnsharpMask(radius=1.2,percent=110,threshold=2))
            filename=out/(name+".webp")
            image.save(filename,"WEBP",quality=90,method=6)
            assert Image.open(filename).size==(2048,1280)
            print(f"OK {name}: {image.size}, {filename.stat().st_size//1024} KiB",flush=True)
            success.append(name)
            break
        except Exception as e:
            if attempt==2:
                raise RuntimeError(f"Unable to get 2K source for {name}: {e}") from e
            print(f"Retry {name}: {e}",flush=True)
            time.sleep(attempt+2)
if len(success)!=28:raise RuntimeError("Missing presets")
print(f"Built {len(success)} verified 2K photos")
