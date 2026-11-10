#!/usr/bin/env python3
"""Patch generated Capacitor platform permissions and fullscreen OLED presentation."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

platform=sys.argv[1] if len(sys.argv)>1 else "android"
root=Path(__file__).resolve().parents[1]
if platform=="android":
    manifest=root/"android/app/src/main/AndroidManifest.xml"
    content=manifest.read_text()
    if "android.permission.RECORD_AUDIO" not in content:
        content=content.replace("<application", '<uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <application',1)
        manifest.write_text(content)
    ET.parse(manifest)
    main=root/"android/app/src/main/java/com/plux/assistant/MainActivity.java"
    if main.exists():
        code=main.read_text()
        if "FLAG_FULLSCREEN" not in code:
            code=code.replace("public class MainActivity extends BridgeActivity {}", """public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle state) {
        super.onCreate(state);
        getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,
            android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
    }
}""")
            main.write_text(code)
elif platform=="ios":
    import plistlib
    plist=root/"ios/App/App/Info.plist"
    if not plist.exists():raise SystemExit("Info.plist missing")
    with plist.open("rb") as f:content=plistlib.load(f)
    content.update({
        "NSMicrophoneUsageDescription":"ПЛЮХ включает микрофон только по запросу пользователя.",
        "NSCameraUsageDescription":"ПЛЮХ позволяет прикреплять фотографии с камеры.",
        "NSPhotoLibraryUsageDescription":"ПЛЮХ позволяет выбирать фотографии для анализа.",
        "UIViewControllerBasedStatusBarAppearance":False,
        "UIStatusBarHidden":True
    })
    with plist.open("wb") as f:plistlib.dump(content,f,fmt=plistlib.FMT_XML)
else:
    raise SystemExit("unknown platform")

def install_plux_icon(platform):
    """Use exactly the approved production PLUX video-frame icon on both OSes."""
    from io import BytesIO
    from urllib.request import Request, urlopen
    from PIL import Image, ImageDraw
    from time import sleep
    import re
    icon_url="https://plux-v12-2-2k-fixed.onrender.com/icon-512.png"
    source=None
    for attempt in range(3):
        try:
            req=Request(icon_url,headers={"User-Agent":"PLUX-Icon-Builder/1.0","Accept":"image/png"})
            with urlopen(req,timeout=35) as resp:
                if resp.status!=200:raise RuntimeError(f"Icon HTTP {resp.status}")
                raw=resp.read(3_000_000)
            source=Image.open(BytesIO(raw)).convert("RGBA")
            if min(source.size)<256:raise RuntimeError("Published icon is too small")
            break
        except Exception:
            if attempt==2:raise RuntimeError("Cannot fetch PLUX-approved phone icon from live site")
            sleep(3)
    side=min(source.size)
    x=(source.width-side)//2;y=(source.height-side)//2
    source=source.crop((x,y,x+side,y+side))
    def render(size):
        resized=source.resize((size,size),Image.Resampling.LANCZOS)
        base=Image.new("RGB",(size,size),(0,17,14))
        base.paste(resized,(0,0),resized.getchannel("A"))
        return base
    if platform=="android":
        dest=root/"android/app/src/main/res"
        sizes={"mdpi":48,"hdpi":72,"xhdpi":96,"xxhdpi":144,"xxxhdpi":192}
        for density,size in sizes.items():
            folder=dest/f"mipmap-{density}"
            folder.mkdir(parents=True,exist_ok=True)
            image=render(size)
            image.save(folder/"ic_launcher.png",format="PNG")
            circle=image.copy().convert("RGBA")
            mask=Image.new("L",(size,size),0)
            ImageDraw.Draw(mask).ellipse((0,0,size-1,size-1),fill=255)
            circle.putalpha(mask)
            circle.save(folder/"ic_launcher_round.png",format="PNG")
            fg_size=int(round(size*108/48))
            foreground=Image.new("RGBA",(fg_size,fg_size),(0,0,0,0))
            inner=int(fg_size*.70)
            image2=render(inner).convert("RGBA")
            foreground.alpha_composite(image2,((fg_size-inner)//2,(fg_size-inner)//2))
            foreground.save(folder/"ic_launcher_foreground.png",format="PNG")
        background=dest/"drawable/ic_launcher_background.xml"
        background.write_text('<?xml version="1.0" encoding="utf-8"?>\n<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#00110E"/></shape>\n')
        color_dir=dest/"values"
        color_dir.mkdir(parents=True,exist_ok=True)
        colors=color_dir/"colors.xml"
        value=colors.read_text() if colors.exists() else "<resources></resources>"
        if 'name="ic_launcher_background"' in value:
            value=re.sub(r'<color\s+name="ic_launcher_background"[^>]*>[^<]*</color>',
                         '<color name="ic_launcher_background">#00110E</color>',value)
        else:value=value.replace("</resources>",'<color name="ic_launcher_background">#00110E</color></resources>')
        colors.write_text(value)
    else:
        app_icon=root/"ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
        app_icon.parent.mkdir(parents=True,exist_ok=True)
        render(1024).save(app_icon,format="PNG")
    print(f"PLUX approved droplet launcher icon installed for {platform}")

install_plux_icon(platform)
