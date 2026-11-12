package app.scena.karaoke;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;
import android.widget.Toast;
import android.view.View;
import android.view.WindowInsets;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public final class MainActivity extends Activity {
    private static final String HOME="https://appassets.androidplatform.net/assets/index.html";
    private static final int PICK_FILE=210;
    private static final int MICROPHONE=211;
    private WebView browser;
    private ValueCallback<Uri[]> chosenFiles;
    private PermissionRequest microphoneRequest;
    private WebViewAssetLoader loader;

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(8,10,13));
        getWindow().setNavigationBarColor(Color.rgb(8,10,13));
        loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        browser=new WebView(this);
        browser.setBackgroundColor(Color.rgb(8,10,13));
        WebSettings options=browser.getSettings();
        options.setJavaScriptEnabled(true);
        options.setDomStorageEnabled(true);
        options.setAllowFileAccess(false);
        options.setAllowContentAccess(true);
        options.setMediaPlaybackRequiresUserGesture(true);
        options.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        options.setSupportMultipleWindows(false);
        browser.setWebViewClient(new WebViewClientCompat(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if("appassets.androidplatform.net".equalsIgnoreCase(uri.getHost()) && "https".equals(uri.getScheme())) return false;
                if("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())){
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException error){
                        Toast.makeText(MainActivity.this,"Браузер не найден",Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });
        browser.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(chosenFiles!=null)chosenFiles.onReceiveValue(null);
                chosenFiles=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("audio/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try{startActivityForResult(intent,PICK_FILE);}
                catch(Exception error){chosenFiles.onReceiveValue(null);chosenFiles=null;Toast.makeText(MainActivity.this,"Не удалось открыть файлы",Toast.LENGTH_SHORT).show();}
                return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request){
                Uri origin=request.getOrigin();
                if(origin==null || !"appassets.androidplatform.net".equalsIgnoreCase(origin.getHost())){
                    request.deny();return;
                }
                boolean audio=false;
                for(String resource:request.getResources()){
                    if(PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource))audio=true;
                    else{request.deny();return;}
                }
                if(!audio){request.deny();return;}
                runOnUiThread(()->{
                    if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    else{microphoneRequest=request;requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MICROPHONE);}
                });
            }
        });
        setContentView(browser);
        if(Build.VERSION.SDK_INT>=35){
            getWindow().getDecorView().setOnApplyWindowInsetsListener((view,insets)->{
                android.graphics.Insets system=insets.getInsets(WindowInsets.Type.systemBars());
                browser.setPadding(0,system.top,0,system.bottom);
                return insets;
            });
        }
        browser.loadUrl(HOME);
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_FILE && chosenFiles!=null){
            Uri[] files=(result==RESULT_OK && data!=null && data.getData()!=null)?new Uri[]{data.getData()}:null;
            chosenFiles.onReceiveValue(files);
            chosenFiles=null;
        }
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==MICROPHONE && microphoneRequest!=null){
            PermissionRequest req=microphoneRequest;microphoneRequest=null;
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED)req.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            else req.deny();
        }
    }
    @Override public void onBackPressed(){
        if(browser!=null && browser.canGoBack())browser.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(chosenFiles!=null){chosenFiles.onReceiveValue(null);chosenFiles=null;}
        if(microphoneRequest!=null){microphoneRequest.deny();microphoneRequest=null;}
        if(browser!=null){browser.destroy();browser=null;}
        super.onDestroy();
    }
}