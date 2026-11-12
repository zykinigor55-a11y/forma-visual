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
    main=next((root/"android/app/src/main/java").rglob("MainActivity.java"), None)
    if main and main.exists():
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
    # Restore the approved V30 Android WebView media setting: requested audio
    # can start after an asynchronous welcome animation or AI/music response.
    if main and main.exists():
        code=main.read_text()
        setting="getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);"
        if setting not in code:
            anchor="super.onCreate(state);"
            if anchor not in code:raise SystemExit("Android onCreate missing for audio settings")
            code=code.replace(anchor,anchor+"\n        "+setting,1)
            main.write_text(code)
    # V31.5 OLED: true black system and gesture navigation bars, white icons.
    # Modern Android versions keep their own gesture navigation policy.
    if main and main.exists():
        code=main.read_text()
        if "setNavigationBarColor(android.graphics.Color.BLACK)" not in code:
            line="super.onCreate(state);"
            addon="""getWindow().setNavigationBarColor(android.graphics.Color.BLACK);
        getWindow().setStatusBarColor(android.graphics.Color.BLACK);
        if(android.os.Build.VERSION.SDK_INT>=29)
            getWindow().setNavigationBarContrastEnforced(false);"""
            if line not in code:raise SystemExit("PLUX native OLED: onCreate missing")
            code=code.replace(line,line+"\n        "+addon,1)
            main.write_text(code)
    # V31: Capacitor bridge into MediaStore for actual Android gallery saving.
    media_template=root/"scripts/plux-media-saver.java.txt"
    media_target=root/"android/app/src/main/java/com/plux/assistant/PLUXMediaSaver.java"
    if not media_template.exists():
        raise SystemExit("Missing V31 MediaStore Java plugin")
    media_target.parent.mkdir(parents=True, exist_ok=True)
    media_target.write_text(media_template.read_text())
    if main.exists():
        code=main.read_text()
        if "registerPlugin(PLUXMediaSaver.class)" not in code:
            if "super.onCreate(state);" not in code:
                raise SystemExit("Cannot find Android onCreate insertion point")
            code=code.replace(
                "super.onCreate(state);",
                "registerPlugin(PLUXMediaSaver.class);\n        super.onCreate(state);",1)
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
        "UIStatusBarHidden":True,
        "UIUserInterfaceStyle":"Dark",
        "UIStatusBarStyle":"UIStatusBarStyleLightContent"
    })
    with plist.open("wb") as f:plistlib.dump(content,f,fmt=plistlib.FMT_XML)
else:
    raise SystemExit("unknown platform")
