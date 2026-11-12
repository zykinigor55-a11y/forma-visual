package app.scena.karaoke;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.OpenableColumns;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Android shell. Web UI is local and sandboxed, music-site webview has no JS bridge. */
public class MainActivity extends Activity {
    private static final String APP_ORIGIN = "https://appassets.androidplatform.net";
    private static final int PICK_AUDIO = 9001;
    private final Object libraryLock = new Object();
    private final Map<Long, DownloadItem> pending = new HashMap<>();
    private WebView appView, siteView;
    private FrameLayout root;
    private LinearLayout siteOverlay;
    private ValueCallback<Uri[]> uploadCallback;
    private DownloadManager downloads;
    private WebViewAssetLoader assetLoader;
    private File musicDir;
    private boolean receiverRegistered = false;
    private final Set<String> allowedExt = new HashSet<>();

    private static final class DownloadItem {
        final String id, display, ext;
        DownloadItem(String id, String display, String ext) { this.id=id; this.display=display; this.ext=ext; }
        String filename() { return id+"."+ext; }
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(8,10,13));
        getWindow().setNavigationBarColor(Color.rgb(8,10,13));
        for (String e : new String[]{"mp3","wav","flac","m4a","aac","ogg","opus"}) allowedExt.add(e);
        musicDir = getExternalFilesDir(Environment.DIRECTORY_MUSIC);
        if (musicDir==null) musicDir = new File(getFilesDir(), "tracks");
        musicDir.mkdirs();
        downloads = (DownloadManager)getSystemService(DOWNLOAD_SERVICE);
        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/tracks/", path -> {
                if (!path.matches("[a-f0-9\\-]{36}\\.(mp3|wav|flac|m4a|aac|ogg|opus)")) return null;
                File file = new File(musicDir, path);
                if (!file.isFile() || !hasLibraryFile(path)) return null;
                try {
                    return new WebResourceResponse(mimeFor(path), null, new FileInputStream(file));
                } catch (Exception error) { return null; }
            })
            .build();
        root = new FrameLayout(this);
        appView = new WebView(this);
        appView.setBackgroundColor(Color.rgb(8,10,13));
        WebSettings appSettings=appView.getSettings();
        appSettings.setJavaScriptEnabled(true);
        appSettings.setDomStorageEnabled(true);
        appSettings.setAllowFileAccess(false);
        appSettings.setAllowContentAccess(false);
        appSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        appSettings.setMediaPlaybackRequiresUserGesture(true);
        appView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri=request.getUrl();
                if (APP_ORIGIN.equals(uri.getScheme()+"://"+uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) && "zaycev.net".equals(uri.getHost())) { openSite(); return true; }
                if ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(Exception ignored) {}
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){ emitLibraryRefresh(); }
        });
        appView.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if(uploadCallback!=null)uploadCallback.onReceiveValue(null);
                uploadCallback=cb;
                pickFile();
                return true;
            }
        });
        appView.addJavascriptInterface(new Bridge(),"ScenaAndroid");
        root.addView(appView,new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 35) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v,insets) -> {
                Insets sys=insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(0,sys.top,0,sys.bottom);
                return insets;
            });
        }
        appView.loadUrl(APP_ORIGIN+"/assets/index.html");
        IntentFilter filter=new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(downloadReceiver,filter,Context.RECEIVER_EXPORTED);
        else registerReceiver(downloadReceiver,filter);
        receiverRegistered=true;
    }

    private static String mimeFor(String file) {
        String ext=file.substring(file.lastIndexOf('.')+1).toLowerCase(Locale.ROOT);
        switch(ext){case "mp3":return "audio/mpeg";case "m4a":return "audio/mp4";case "wav":return "audio/wav";case "flac":return "audio/flac";case "ogg":return "audio/ogg";case "opus":return "audio/opus";case "aac":return "audio/aac";default:return "application/octet-stream";}
    }
    private File musicFile(String id,String ext){return new File(musicDir,id+"."+ext);}
    private String stripName(String name){
        String clean=(name==null?"Песня":name).replaceAll("[\\r\\n\\t\\u0000-\\u001f/\\\\]", " ").trim();
        return clean.length()>110?clean.substring(0,110):clean;
    }
    private String extFrom(String name,String mime){
        String v=name==null?"":name;
        int dot=v.lastIndexOf('.');
        String ext=dot>=0?v.substring(dot+1).toLowerCase(Locale.ROOT):"";
        if(!allowedExt.contains(ext)){
            String mapped = mime==null?null:MimeTypeMap.getSingleton().getExtensionFromMimeType(mime.toLowerCase(Locale.ROOT));
            if("mpeg".equals(mapped))mapped="mp3";
            ext=mapped!=null?mapped:"";
        }
        return allowedExt.contains(ext)?ext:null;
    }
    private JSONObject record(String id,String filename,String name){
        JSONObject obj=new JSONObject();
        try {obj.put("key",id);obj.put("name",name);obj.put("filename",filename);obj.put("url",APP_ORIGIN+"/tracks/"+filename);}catch(JSONException ignored){}
        return obj;
    }
    private JSONArray library(){
        String json=getPreferences(0).getString("tracks","[]");
        try{return new JSONArray(json);}catch(JSONException e){return new JSONArray();}
    }
    private boolean hasLibraryFile(String filename){
        synchronized(libraryLock){ JSONArray items=library();for(int i=0;i<items.length();i++){JSONObject v=items.optJSONObject(i);if(v!=null&&filename.equals(v.optString("filename")))return true;}return false;}
    }
    private JSONObject findTrack(String key){
        synchronized(libraryLock){JSONArray items=library();for(int i=0;i<items.length();i++){JSONObject v=items.optJSONObject(i);if(v!=null&&key.equals(v.optString("key")))return v;}return null;}
    }
    private void attachKaraoke(String sourceKey,String outputKey,String filename,JSONArray words){
        synchronized(libraryLock){
            JSONArray old=library(),next=new JSONArray();
            for(int i=0;i<old.length();i++){
                JSONObject v=old.optJSONObject(i);if(v==null)continue;
                if(outputKey.equals(v.optString("key"))){try{v.put("internal",true);}catch(JSONException ignored){}}
                if(sourceKey.equals(v.optString("key"))){
                    JSONObject obj=new JSONObject();
                    try {obj.put("instrumentalUrl",APP_ORIGIN+"/tracks/"+filename);obj.put("words",words);v.put("karaoke",obj);}catch(JSONException ignored){}
                }
                next.put(v);
            }
            getPreferences(0).edit().putString("tracks",next.toString()).apply();
        }
    }
    private JSONObject addToLibrary(String id,String file,String name){
        JSONObject item=record(id,file,name);
        synchronized(libraryLock){JSONArray old=library();JSONArray next=new JSONArray();next.put(item);for(int i=0;i<old.length();i++){
            JSONObject v=old.optJSONObject(i);if(v!=null&&!id.equals(v.optString("key")))next.put(v);}
            getPreferences(0).edit().putString("tracks",next.toString()).apply();}
        return item;
    }
    private void emitEvent(String event,JSONObject payload){
        runOnUiThread(()->{if(appView!=null){String js="window.dispatchEvent(new CustomEvent("+JSONObject.quote(event)+",{detail:"+payload.toString()+"}));";appView.evaluateJavascript(js,null);}});
    }
    private void emitLibraryRefresh(){runOnUiThread(()->appView.evaluateJavascript("window.dispatchEvent(new Event('scena:library-ready'))",null));}
    private void inform(String msg){runOnUiThread(()->Toast.makeText(this,msg,Toast.LENGTH_LONG).show());}
    private void error(String msg){JSONObject obj=new JSONObject();try{obj.put("error",msg);}catch(JSONException ignored){}emitEvent("scena:ai-error",obj);}
    private void stage(String msg){JSONObject obj=new JSONObject();try{obj.put("stage",msg);}catch(JSONException ignored){}emitEvent("scena:ai-stage",obj);}
    private void downloadedTrack(DownloadItem it){
        File file=musicFile(it.id,it.ext);
        if(!file.isFile()||file.length()<1000){inform("Скачанный файл не похож на аудио. Попробуй выбрать MP3 вручную.");return;}
        JSONObject item=addToLibrary(it.id,it.filename(),it.display);
        runOnUiThread(()->{closeSite();emitEvent("scena:import-audio",item);inform("Песня добавлена в СЦЕНУ");});
    }
    private final BroadcastReceiver downloadReceiver=new BroadcastReceiver(){
        @Override public void onReceive(Context ctx,Intent intent){
            if(!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction()))return;
            long downloadId=intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID,-1);
            final DownloadItem it;
            synchronized(pending){it=pending.remove(downloadId);}
            if(it==null)return;
            try(Cursor cursor=downloads.query(new DownloadManager.Query().setFilterById(downloadId))){
                if(cursor!=null&&cursor.moveToFirst()){
                    int status=cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                    if(status==DownloadManager.STATUS_SUCCESSFUL)downloadedTrack(it);
                    else inform("Скачивание не завершено. Можно добавить файл вручную.");
                }
            }catch(Exception e){inform("Загрузка завершена, но проверить файл не удалось.");}
        }
    };

    private void openSite(){
        runOnUiThread(()->{
            if(siteOverlay!=null){siteOverlay.setVisibility(View.VISIBLE);return;}
            siteOverlay=new LinearLayout(this);siteOverlay.setOrientation(LinearLayout.VERTICAL);siteOverlay.setBackgroundColor(Color.rgb(7,9,13));
            LinearLayout top=new LinearLayout(this);top.setGravity(Gravity.CENTER_VERTICAL);top.setPadding(dp(10),0,dp(10),0);top.setBackgroundColor(Color.rgb(19,22,27));
            TextView back=toolbarButton("‹ Назад");back.setOnClickListener(v->{if(siteView!=null&&siteView.canGoBack())siteView.goBack();else closeSite();});top.addView(back);
            TextView title=toolbarButton("Зайцев.нет");title.setGravity(Gravity.CENTER);title.setTextColor(Color.WHITE);top.addView(title,new LinearLayout.LayoutParams(0,dp(52),1));
            TextView outside=toolbarButton("В браузере ↗");outside.setOnClickListener(v->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(siteView.getUrl())));}catch(Exception e){inform("Не удалось открыть браузер");}});top.addView(outside);
            TextView close=toolbarButton("✕");close.setOnClickListener(v->closeSite());top.addView(close);
            siteOverlay.addView(top,new LinearLayout.LayoutParams(-1,dp(52)));
            siteView=new WebView(this);siteView.setBackgroundColor(Color.rgb(9,11,16));WebSettings ws=siteView.getSettings();ws.setJavaScriptEnabled(true);ws.setDomStorageEnabled(true);ws.setAllowFileAccess(false);ws.setAllowContentAccess(false);ws.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(siteView,false);
            siteView.setWebViewClient(new WebViewClient(){
                @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                    String scheme=request.getUrl().getScheme();
                    if("https".equals(scheme)||"http".equals(scheme))return false;
                    return true;
                }
            });
            siteView.setDownloadListener(new DownloadListener(){@Override public void onDownloadStart(String url,String userAgent,String disposition,String mime,long bytes){
                handleSiteDownload(url,userAgent,disposition,mime);
            }});
            siteOverlay.addView(siteView,new LinearLayout.LayoutParams(-1,0,1));
            root.addView(siteOverlay,new FrameLayout.LayoutParams(-1,-1));
            siteView.loadUrl("https://zaycev.net/");
        });
    }
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density+.5f);}
    private TextView toolbarButton(String text){TextView v=new TextView(this);v.setText(text);v.setTextSize(12);v.setTextColor(Color.rgb(225,192,156));v.setGravity(Gravity.CENTER);v.setPadding(dp(7),0,dp(7),0);return v;}
    private void closeSite(){runOnUiThread(()->{if(siteOverlay!=null)siteOverlay.setVisibility(View.GONE);});}
    private void handleSiteDownload(String url,String agent,String disposition,String mime){
        try {
            Uri u=Uri.parse(url);
            if(!"https".equals(u.getScheme())&&!"http".equals(u.getScheme())){inform("Этот тип ссылки нельзя импортировать автоматически. Скачай файл во внешнем браузере.");return;}
            String guess=URLUtil.guessFileName(url,disposition,mime);
            String ext=extFrom(guess,mime);
            if(ext==null){inform("Не распознан аудиофайл. Скачай MP3 и добавь через «Добавить песню».");return;}
            String name=stripName(guess);
            String id=UUID.randomUUID().toString();
            DownloadManager.Request req=new DownloadManager.Request(u);
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setTitle("СЦЕНА · "+name);
            req.setMimeType(mimeFor(id+"."+ext));
            req.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_MUSIC,id+"."+ext);
            if(agent!=null&&!agent.isEmpty())req.addRequestHeader("User-Agent",agent);
            String cookie=CookieManager.getInstance().getCookie(url);
            if(cookie!=null&&!cookie.isEmpty())req.addRequestHeader("Cookie",cookie);
            String referer=siteView!=null?siteView.getUrl():"https://zaycev.net/";
            if(referer!=null&&referer.startsWith("https://"))req.addRequestHeader("Referer",referer);
            long downloadId=downloads.enqueue(req);
            synchronized(pending){pending.put(downloadId,new DownloadItem(id,name,ext));}
            inform("Скачиваем песню. После завершения она появится в СЦЕНЕ.");
        }catch(Exception ex){inform("Не удалось начать загрузку: "+ex.getMessage());}
    }
    private void pickFile(){
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("audio/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"audio/mpeg","audio/mp3","audio/mp4","audio/wav","audio/flac","audio/ogg","audio/aac","audio/*"});
        startActivityForResult(intent,PICK_AUDIO);
    }
    private String filename(Uri uri){
        String name="Моя песня";
        try(Cursor c=getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){
            if(c!=null&&c.moveToFirst())name=c.getString(0);
        }catch(Exception ignored){}
        return stripName(name);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_AUDIO){
            Uri u=(result==RESULT_OK&&data!=null)?data.getData():null;
            if(uploadCallback!=null){uploadCallback.onReceiveValue(u==null?null:new Uri[]{u});uploadCallback=null;return;}
            if(u!=null)new Thread(()->{
                String name=filename(u),ext=extFrom(name,getContentResolver().getType(u));
                if(ext==null){inform("Поддерживаются MP3, WAV, M4A, FLAC, OGG");return;}
                String id=UUID.randomUUID().toString();File dest=musicFile(id,ext);
                try(InputStream in=getContentResolver().openInputStream(u);OutputStream out=new BufferedOutputStream(new FileOutputStream(dest))){
                    if(in==null)throw new Exception("Файл недоступен");
                    byte[] buf=new byte[32768];int n;long count=0;
                    while((n=in.read(buf))!=-1){count+=n;if(count>120L*1024*1024)throw new Exception("Файл превышает 120 МБ");out.write(buf,0,n);}
                    JSONObject item=addToLibrary(id,dest.getName(),name);
                    emitEvent("scena:import-audio",item);
                }catch(Exception ex){dest.delete();inform("Не удалось импортировать: "+ex.getMessage());}
            }).start();
        }
    }
    public class Bridge {
        @JavascriptInterface public void openMusicSite(){openSite();}
        @JavascriptInterface public void pickAudioFile(){runOnUiThread(()->pickFile());}
        @JavascriptInterface public String listTracks(){synchronized(libraryLock){return library().toString();}}
        @JavascriptInterface public void processTrack(String key,String host,String token){new Thread(()->processSong(key,host,token)).start();}
    }
    private String verifiedLocalServer(String value) throws Exception {
        Uri uri=Uri.parse(value==null?"":value.trim());
        String scheme=uri.getScheme();String host=uri.getHost();
        if(host==null||host.isEmpty()||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null)
            throw new Exception("Укажи HTTPS-адрес облачного ИИ-сервера");
        if("https".equals(scheme)) {
            // HTTPS only for public servers. Do not accept a deceptive URL with an embedded path.
            if(uri.getPath()!=null&&!uri.getPath().isEmpty()&&!"/".equals(uri.getPath()))
                throw new Exception("Укажи только адрес сервера без пути");
            if(uri.getPort()!=-1&&uri.getPort()!=443)
                throw new Exception("Для облака нужен стандартный HTTPS порт 443");
            if(!host.matches("[A-Za-z0-9.-]+") || host.endsWith("."))
                throw new Exception("Недопустимый адрес облака");
            return "https://"+host.toLowerCase(Locale.US);
        }
        if("http".equals(scheme)&&host.matches("[0-9.]+")) {
            InetAddress ip=InetAddress.getByName(host);
            if(!(ip.isSiteLocalAddress()||ip.isLoopbackAddress()))
                throw new Exception("Обычный HTTP допустим только внутри домашней сети");
            int port=uri.getPort();if(port<1||port>65535)throw new Exception("Укажи локальный порт сервера");
            return "http://"+host+":"+port;
        }
        throw new Exception("Для облака используй HTTPS");
    }
    private JSONObject requestJson(String method,String address,String token,File upload) throws Exception {
        HttpURLConnection conn=(HttpURLConnection)new URL(address).openConnection();
        conn.setRequestMethod(method);conn.setConnectTimeout(18000);conn.setReadTimeout(180000);
        conn.setInstanceFollowRedirects(false);
        if(token!=null&&!token.isEmpty())conn.setRequestProperty("Authorization","Bearer "+token);
        if(upload!=null){
            String boundary="----scena"+UUID.randomUUID();conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type","multipart/form-data; boundary="+boundary);
            conn.setChunkedStreamingMode(65536);
            try(OutputStream out=new BufferedOutputStream(conn.getOutputStream());InputStream in=new BufferedInputStream(new FileInputStream(upload))){
                out.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"song."+extFrom(upload.getName(),mimeFor(upload.getName()))+"\"\r\nContent-Type: "+mimeFor(upload.getName())+"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                byte[] buf=new byte[64*1024];int n;while((n=in.read(buf))>=0)out.write(buf,0,n);
                out.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
            }
        }
        int code=conn.getResponseCode();InputStream stream=code<400?conn.getInputStream():conn.getErrorStream();
        ByteArrayOutputStream bos=new ByteArrayOutputStream();if(stream!=null)try(InputStream in=stream){byte[] buf=new byte[4096];int n;while((n=in.read(buf))!=-1){bos.write(buf,0,n);if(bos.size()>3*1024*1024)throw new Exception("Слишком большой ответ сервера");}}
        conn.disconnect();String body=bos.toString("UTF-8");
        if(code>=400){try{throw new Exception(new JSONObject(body).optString("detail","Ошибка ИИ: "+code));}catch(JSONException e){throw new Exception("Ошибка ИИ: "+code+" "+body.substring(0,Math.min(body.length(),150)));}}
        return new JSONObject(body);
    }
    private void downloadOutput(String address,String token,File dest) throws Exception{
        HttpURLConnection conn=(HttpURLConnection)new URL(address).openConnection();conn.setConnectTimeout(18000);conn.setReadTimeout(90000);
        conn.setInstanceFollowRedirects(false);
        if(token!=null&&!token.isEmpty())conn.setRequestProperty("Authorization","Bearer "+token);
        if(conn.getResponseCode()!=200)throw new Exception("Не удалось скачать минусовку");
        try(InputStream in=conn.getInputStream();OutputStream out=new BufferedOutputStream(new FileOutputStream(dest))){byte[] b=new byte[32768];int n;long total=0;while((n=in.read(b))>=0){total+=n;if(total>125L*1024*1024)throw new Exception("Минусовка слишком большая");out.write(b,0,n);}}
        finally{conn.disconnect();}
    }
    private void processSong(String key,String endpoint,String token){
        try{
            JSONObject song=findTrack(key);if(song==null)throw new Exception("Песня не найдена в личной библиотеке");
            File source=new File(musicDir,song.optString("filename"));
            if(!source.isFile())throw new Exception("Файл песни удалён");
            String base=verifiedLocalServer(endpoint);stage("Отправляем трек на защищённый облачный сервер…");
            JSONObject started=requestJson("POST",base+"/api/process",token,source);
            String id=started.optString("job_id");if(id.isEmpty())throw new Exception("Сервер не вернул задачу");
            for(int i=0;i<1800;i++){
                Thread.sleep(2500);
                JSONObject status=requestJson("GET",base+"/api/jobs/"+id,token,null);
                String state=status.optString("status");
                stage(status.optString("stage","Создаём караоке…"));
                if("error".equals(state))throw new Exception(status.optString("error","Ошибка обработки"));
                if("ready".equals(state)){
                    File target=musicFile(UUID.randomUUID().toString(),"mp3");
                    try { downloadOutput(base+status.getString("instrumental_url"),token,target); }
                    catch(Exception ex){target.delete();throw ex;}
                    String newKey=target.getName().substring(0,36);
                    // Add output to trusted library so WebViewAssetLoader can serve it to the same-origin player.
                    addToLibrary(newKey,target.getName(),"Минусовка · "+song.optString("name"));
                    JSONArray words=status.optJSONArray("words")!=null?status.getJSONArray("words"):new JSONArray();
                    attachKaraoke(key,newKey,target.getName(),words);
                    JSONObject event=new JSONObject();event.put("key",key);event.put("instrumentalUrl",APP_ORIGIN+"/tracks/"+target.getName());event.put("words",words);
                    emitEvent("scena:ai-ready",event);return;
                }
            }
            throw new Exception("Обработка занимает больше времени. Попробуй позже.");
        }catch(Exception e){error(e.getMessage()==null?"Ошибка обработки":e.getMessage());}
    }
    @Override public void onBackPressed(){if(siteOverlay!=null&&siteOverlay.getVisibility()==View.VISIBLE){if(siteView.canGoBack())siteView.goBack();else closeSite();return;}super.onBackPressed();}
    @Override protected void onDestroy(){super.onDestroy();if(receiverRegistered)unregisterReceiver(downloadReceiver);if(siteView!=null)siteView.destroy();if(appView!=null)appView.destroy();}
}
