#!/usr/bin/env python3
"""PLUX V31.8: runtime audio permission bridge for Capacitor 7 Android.
Run after patch-native.py and patch-native-save-v31.py, before cap sync.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
main=next((root/"android/app/src/main/java").rglob("MainActivity.java"),None)
if not main:raise SystemExit("Missing MainActivity")
code=main.read_text()
package_match=re.search(r"(?m)^\s*package\s+([\w.]+)\s*;",code)
if not package_match:raise SystemExit("Missing Java package")
package=package_match.group(1)
reg="registerPlugin(PLUXMicrophonePermission.class);"
if reg not in code:
    token="super.onCreate(state);"
    if token not in code:raise SystemExit("Capacitor MainActivity.onCreate not found")
    code=code.replace(token,reg+"\n        "+token,1)
    main.write_text(code)
template=r'''package PACKAGE;
import android.Manifest;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "PLUXMicrophonePermission", permissions = {
    @Permission(alias = "microphone", strings = {Manifest.permission.RECORD_AUDIO})
})
public class PLUXMicrophonePermission extends Plugin {
    private void success(PluginCall call) {
        JSObject result=new JSObject();
        result.put("granted",true);
        call.resolve(result);
    }
    @PluginMethod
    public void requestMicrophone(PluginCall call) {
        if(getPermissionState("microphone")==PermissionState.GRANTED) {
            success(call);return;
        }
        requestPermissionForAlias("microphone",call,"onMicrophonePermission");
    }
    @PermissionCallback
    private void onMicrophonePermission(PluginCall call) {
        if(getPermissionState("microphone")==PermissionState.GRANTED)success(call);
        else call.reject("Микрофон запрещён. Разреши доступ в настройках Android → Приложения → PLUX → Разрешения.");
    }
}
'''
out=main.parent/"PLUXMicrophonePermission.java"
out.write_text(template.replace("PACKAGE",package))
manifest=root/"android/app/src/main/AndroidManifest.xml"
if "android.permission.RECORD_AUDIO" not in manifest.read_text():
    raise SystemExit("RECORD_AUDIO manifest permission missing")
print("PLUX v31.8 runtime microphone permission plugin ready")
