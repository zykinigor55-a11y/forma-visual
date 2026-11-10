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
