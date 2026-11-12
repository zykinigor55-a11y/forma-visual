#!/usr/bin/env python3
"""PLUX V31 Capacitor 7: install native MediaStore gallery bridge for Android 10+.
Runs AFTER patch-native.py android and BEFORE cap sync android.
No dangerous broad storage permission; saves with MediaStore scoped storage.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
folder=root/"android/app/src/main/java/com/plux/assistant"
main=folder/"MainActivity.java"
if not main.exists():
    raise SystemExit("MainActivity missing after npx cap add android")
code=main.read_text()
registration="registerPlugin(PLUXMediaSaver.class);"
if registration not in code:
    old="super.onCreate(state);"
    if old not in code:
        raise SystemExit("Expected Capacitor MainActivity onCreate(state) after patch-native.py")
    code=code.replace(old,registration+"\n        "+old,1)
    main.write_text(code)

java=r'''package com.plux.assistant;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name="PLUXMediaSaver")
public final class PLUXMediaSaver extends Plugin {
    private static final long MAX_BYTES=75L*1024L*1024L;

    private String safeName(String n,String mime){
        if(n==null)n="PLUX-media";
        n=n.replaceAll("[^a-zA-Z0-9А-Яа-я_.-]","_");
        if(n.length()>100)n=n.substring(0,100);
        if(n.isEmpty())n="PLUX-media";
        String ext=mime.equals("video/mp4")?".mp4":mime.equals("image/png")?".png":
             mime.equals("image/webp")?".webp":".jpg";
        if(!n.toLowerCase().endsWith(ext))n+=ext;
        return n;
    }
    private boolean supported(String mime){
        return "image/png".equals(mime)||"image/jpeg".equals(mime)||
               "image/webp".equals(mime)||"video/mp4".equals(mime);
    }
    private Uri writeMedia(String fileName,String mime,InputStream source) throws Exception{
        if(Build.VERSION.SDK_INT<29)throw new IllegalArgumentException("Требуется Android 10 или новее");
        if(!supported(mime))throw new IllegalArgumentException("Формат не поддерживается");
        ContentResolver resolver=getContext().getContentResolver();
        boolean video=mime.startsWith("video/");
        Uri collection=video?MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY):
                              MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        ContentValues values=new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME,safeName(fileName,mime));
        values.put(MediaStore.MediaColumns.MIME_TYPE,mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH,(video?"Movies":"Pictures")+"/PLUX");
        values.put(MediaStore.MediaColumns.IS_PENDING,1);
        Uri uri=resolver.insert(collection,values);
        if(uri==null)throw new IllegalStateException("Не удалось создать файл в галерее");
        try{
            try(OutputStream output=resolver.openOutputStream(uri)){
                if(output==null)throw new IllegalStateException("Нет доступа к галерее");
                byte[] buffer=new byte[64*1024];long total=0;
                int len;
                while((len=source.read(buffer))!=-1){
                    total+=len;if(total>MAX_BYTES)throw new IllegalArgumentException("Файл больше 75 МБ");
                    output.write(buffer,0,len);
                }
                if(total==0)throw new IllegalArgumentException("Файл пустой");
                output.flush();
            }
            ContentValues ready=new ContentValues();ready.put(MediaStore.MediaColumns.IS_PENDING,0);
            resolver.update(uri,ready,null,null);
            return uri;
        }catch(Exception e){resolver.delete(uri,null,null);throw e;}
    }
    private void done(PluginCall call,Uri uri){
        JSObject reply=new JSObject();reply.put("uri",uri.toString());reply.put("saved",true);call.resolve(reply);
    }
    @PluginMethod
    public void saveBase64(PluginCall call){
        String data=call.getString("data"),mime=call.getString("mimeType"),name=call.getString("fileName");
        if(data==null||mime==null||!supported(mime)||data.length()>MAX_BYTES*4/3+64){
            call.reject("Неверный формат или большой файл");return;
        }
        new Thread(()->{
            try{
                byte[] bytes=Base64.decode(data,Base64.DEFAULT);
                try(InputStream stream=new java.io.ByteArrayInputStream(bytes)){
                    Uri uri=writeMedia(name,mime,stream);done(call,uri);
                }
            }catch(Exception e){call.reject("Не удалось сохранить: "+e.getMessage());}
        },"plux-media-save").start();
    }
    @PluginMethod
    public void saveRemote(PluginCall call){
        String link=call.getString("url"),name=call.getString("fileName");
        if(link==null){call.reject("Нет адреса файла");return;}
        try{
            URL validated=new URL(link);
            if(!"https".equalsIgnoreCase(validated.getProtocol())||
               !"pluh-voice-demo.onrender.com".equalsIgnoreCase(validated.getHost())||
               (!validated.getPath().startsWith("/api/video/file/")&&
                !validated.getPath().startsWith("/api/download/image/"))){
                call.reject("Этот адрес не разрешён");return;
            }
        }catch(Exception e){call.reject("Неправильный адрес");return;}
        new Thread(()->{
            HttpURLConnection conn=null;
            try{
                conn=(HttpURLConnection)new URL(link).openConnection();
                conn.setInstanceFollowRedirects(false);
                conn.setConnectTimeout(25000);conn.setReadTimeout(180000);
                conn.setRequestProperty("Accept","image/*,video/mp4");
                int code=conn.getResponseCode();
                if(code!=200)throw new IllegalStateException("Сервер вернул "+code);
                String mime=conn.getContentType();if(mime!=null)mime=mime.split(";")[0].trim().toLowerCase();
                if(!supported(mime))throw new IllegalArgumentException("Формат "+mime+" не поддерживается");
                if(conn.getContentLengthLong()>MAX_BYTES)throw new IllegalArgumentException("Файл больше 75 МБ");
                try(InputStream stream=conn.getInputStream()){
                    Uri uri=writeMedia(name,mime,stream);done(call,uri);
                }
            }catch(Exception e){call.reject("Не удалось сохранить: "+e.getMessage());}
            finally{if(conn!=null)conn.disconnect();}
        },"plux-media-download").start();
    }
}
'''
out=folder/"PLUXMediaSaver.java"
out.write_text(java)
print("V31 Android MediaStore saver registered")
