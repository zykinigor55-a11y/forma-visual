/* PLUX V12.2: overlay patch after verified V12.1. No UI API-secret field. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published',p=join(root,'index.html');
let html=readFileSync(p,'utf8');
if(!html.includes('reference-motion-v121.css'))throw Error('Expected V12.1 approved artwork');
if(html.includes('plux-release-v122'))throw Error('V12.2 already patched');
for(const f of ['plux-fix-v122.css','plux-fix-v122.js']){
 if(statSync(join(root,f)).size<1000)throw Error('Missing V12.2 fix '+f);
}
const row='<label for="demo-code">Код тестового доступа (не API-ключ)</label><input id="demo-code" type="password" autocomplete="off" placeholder="Код из Render Environment"/>';
if(!html.includes(row))throw Error('Unexpected account settings markup');
html=html.replace(row,'<input id="demo-code" type="hidden" autocomplete="off"/>');
html=html.replace('<p class="dialog-mini">API-ключ хранится только на сервере, не в этом поле.</p>','');
html=html.replace('Меня можно называть по имени, а голосовую сессию подключить через ElevenLabs.','Здесь можно изменить имя и настроить звуки PLUX.');
html=html.replace('</head>','<meta name="plux-release-v122" content="2k-icons-aligned-complete-buttons"><link rel="stylesheet" href="/plux-fix-v122.css?v=122"></head>');
html=html.replace('</body>','<script src="/plux-fix-v122.js?v=122"></script></body>');
writeFileSync(p,html);
const appPath=join(root,'app.js');
let js=readFileSync(appPath,'utf8');
js=js.replace('Добавь код доступа в настройках PLUX (не API-ключ)','Голосовой диалог пока недоступен: серверное подключение не настроено');
writeFileSync(appPath,js);
const cssPath=join(root,'plux-fix-v122.css');
let css=readFileSync(cssPath,'utf8');
css=css.replace('ref-mic.webp','ref-mic-2k-v122.png');
writeFileSync(cssPath,css);
console.log('PLUX V12.2 installed: unique mode artwork, unclipped glass controls, settings cleaned, 2K graphics');

/* PLUX V12.3: the same verified assets used by the offline 360/393/412px visual tests. */
import {execFileSync as plux123Exec} from 'node:child_process';
const chunks=['part1.b64','part2.b64','part3.b64'].map(name=>readFileSync(join('plux-v123-overlay',name),'utf8').trim());
const packed=chunks.join('');
if(packed.length!==7040)throw Error('V12.3 optical package incomplete: '+packed.length);
plux123Exec('tar',['xzf','-','-C',root],{input:Buffer.from(packed,'base64')});
plux123Exec(process.execPath,[join(root,'patch-app-v123.mjs'),root],{stdio:'inherit'});
for(const asset of ['plux-optical-v123.css','plux-optical-v123.js','assets/plux-keyboard-vessel-v123.svg','assets/plux-camera-vessel-v123.svg']){
 if(statSync(join(root,asset)).size<500)throw Error('V12.3 missing '+asset);
}
console.log('PLUX V12.3 optical controls ready for publication');

/* PLUX V12.4 Motion System: preserve original five video sources and approved controls. */
plux123Exec(process.execPath,['plux-v124-overlay/apply-v124.mjs',root],{stdio:'inherit'});
for(const asset of ['plux-motion-v124.js','plux-typewriter-v124.js','plux-motion-v124.css']){
 if(statSync(join(root,asset)).size<1000)throw Error('V12.4 missing '+asset);
}
if(!readFileSync(join(root,'index.html'),'utf8').includes('plux-release-v124'))throw Error('V12.4 index patch missing');
console.log('PLUX V12.4 Motion System applied to all screens');


/* PLUX V12.4 Reference Glass: retain motion/typewriter system, replace only visible controls. */
import {brotliDecompressSync as pluxGlassDecompress} from 'node:zlib';
const glassBytes=Buffer.from(readFileSync('plux-v124-glass-overlay/patch.tar.br.b64','utf8').trim(),'base64');
plux123Exec('tar',['xf','-','-C',root],{input:pluxGlassDecompress(glassBytes)});
const glassIndex=join(root,'index.html');
let glassHtml=readFileSync(glassIndex,'utf8');
if(!glassHtml.includes('oled-reference-v124.css')){
  glassHtml=glassHtml.replace('</head>','<meta name="plux-glass-release" content="12.4-emerald-reference"><link rel="stylesheet" href="/oled-glass-v123.css?v=1248"><link rel="stylesheet" href="/oled-reference-v124.css?v=1248"></head>');
  glassHtml=glassHtml.replace('</body>','<script src="/oled-glass-v123.js?v=1248"></script><script src="/oled-reference-v124.js?v=1248"></script></body>');
  writeFileSync(glassIndex,glassHtml);
}
for(const asset of ['oled-glass-v123.css','oled-reference-v124.css','assets/crystal-orb-v124.svg','assets/chrome-mic-v124.svg','sw.js']){
 if(statSync(join(root,asset)).size<500)throw Error('Missing crystal glass asset: '+asset);
}
if(!glassHtml.includes('oled-reference-v124.css'))throw Error('Reference glass CSS not linked');
console.log('PLUX V12.4 Emerald Crystal reference buttons and OLED menu installed');


/* PLUX V12.5 onboarding and aligned controls. Motion/videos and prior icons are not replaced. */
const pluxV125Packed=Buffer.from(readFileSync('plux-v125-overlay/v125-assets.tgz.b64','utf8').trim(),'base64');
plux123Exec('tar',['xzf','-','-C',root],{input:pluxV125Packed});
plux123Exec(process.execPath,['plux-v125-overlay/apply-v125.mjs',root],{stdio:'inherit'});
for(const asset of ['plux-v125.css','plux-v125.js']){
 if(statSync(join(root,asset)).size<1200)throw Error('V12.5 missing '+asset);
}
if(!readFileSync(join(root,'index.html'),'utf8').includes('plux-release-v125'))throw Error('V12.5 index patch missing');
console.log('PLUX V12.5 onboarding and aligned controls published');


/* PLUX V12.6 quick icons + real mic permission meter; do not alter old videos. */
for(const asset of ['plux-v126.js','plux-v126.css']){
  const src=join('plux-v126-overlay',asset),dest=join(root,asset);
  const raw=readFileSync(src);
  if(raw.length<1000)throw Error('V12.6 file missing or incomplete: '+asset);
  writeFileSync(dest,raw);
}
const page126=join(root,'index.html');
let html126=readFileSync(page126,'utf8');
if(!html126.includes('plux-release-v125'))throw Error('V12.5 prerequisite missing');
if(!html126.includes('plux-release-v126')){
  html126=html126.replace('</head>','<meta name="plux-release-v126" content="real-mic-and-crystal-quick-glyphs"><link rel="stylesheet" href="/plux-v126.css?v=1261"></head>');
  html126=html126.replace('</body>','<script src="/plux-v126.js?v=1261"></script></body>');
  writeFileSync(page126,html126);
}
const sw126Path=join(root,'sw.js');
let sw126=readFileSync(sw126Path,'utf8');
sw126=sw126.replace(/plux-emerald-v12\d+/g,'plux-emerald-v126');
if(!sw126.includes("'/plux-v126.js'")){
  sw126=sw126.replace("'/plux-v125.js'", "'/plux-v125.js','/plux-v126.css','/plux-v126.js'");
}
writeFileSync(sw126Path,sw126);
console.log('PLUX V12.6 quick icons + microphone permission and live level meter installed');

/* PLUX V12.7 Fullscreen Welcome: full OLED video, typewriter and opt-in sounds. */
const packedV127=Buffer.from(readFileSync('plux-v127-overlay/v127_patch.tar.br.b64','utf8').trim(),'base64');
plux123Exec('tar',['xf','-','-C',root],{input:pluxGlassDecompress(packedV127)});
plux123Exec(process.execPath,[join(root,'patch-app-v127.mjs'),root],{stdio:'inherit'});
const path127=join(root,'index.html');
let html127=readFileSync(path127,'utf8');
html127=html127.replaceAll('/assets/onboard-idle-poster.webp','/assets/onboard-idle-poster.png');
writeFileSync(path127,html127);
for(const asset of ['plux-v127.css','plux-v127.js','assets/videos-v106/01_idle.mp4','assets/onboard-idle-poster.png']){
 if(statSync(join(root,asset)).size<1000)throw Error('PLUX V12.7 missing '+asset);
}
if(!html127.includes('plux127-intro')||!html127.includes('plux-release-v127'))throw Error('V12.7 intro not installed');
console.log('PLUX V12.7 Fullscreen Welcome installed successfully');


/* PLUX V12.8 Chat Proxy: only backend calls API Market, never the browser. */
const chat128File=join(root,'plux-chat-v128.js');
writeFileSync(chat128File,readFileSync('plux-v128-overlay/plux-chat-v128.js'));
if(statSync(chat128File).size<1500)throw Error('V12.8 chat script missing');
const html128File=join(root,'index.html');
let html128=readFileSync(html128File,'utf8');
if(!html128.includes('plux-v127.js'))throw Error('V12.7 introduction must be installed first');
html128=html128.replace('</body>','<script src="/plux-chat-v128.js?v=1281"></script></body>');
html128=html128.replace('</head>','<meta name="plux-release-v128" content="server-held-gpt-6-luna-chat"></head>');
writeFileSync(html128File,html128);
const sw128File=join(root,'sw.js');
let sw128=readFileSync(sw128File,'utf8').replace(/plux-emerald-v127/g,'plux-emerald-v128');
if(!sw128.includes("'/plux-chat-v128.js'"))sw128=sw128.replace("'/plux-v127.js'","'/plux-v127.js','/plux-chat-v128.js'");
writeFileSync(sw128File,sw128);
if(!html128.includes('/plux-chat-v128.js'))throw Error('V12.8 missing chat loader');
console.log('PLUX V12.8 Chat Proxy UI installed (server secret required)');

/* PLUX V12.9 MEDIA: augment approved OLED layout, keep video/persona untouched. */
for(const filename of ['plux-v129.js','plux-v129.css']){
  const bytes=readFileSync(join('plux-v129-overlay',filename));
  if(bytes.length<1500)throw Error('Incomplete V12.9 asset: '+filename);
  writeFileSync(join(root,filename),bytes);
}
plux123Exec(process.execPath,['--check',join(root,'plux-v129.js')],{stdio:'inherit'});
plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
const plux129Index=join(root,'index.html');
let plux129HTML=readFileSync(plux129Index,'utf8');
if(!plux129HTML.includes('plux-release-v129')){
  plux129HTML=plux129HTML.replace('</head>','<meta name="plux-release-v129" content="file-attachments-nano-banana"><link rel="stylesheet" href="/plux-v129.css?v=1291"></head>');
  plux129HTML=plux129HTML.replace('</body>','<script src="/plux-v129.js?v=1291" defer></script></body>');
  plux129HTML=plux129HTML.replace(/(<meta name="plux-version" content=")[^"]+/,'$112.9');
  writeFileSync(plux129Index,plux129HTML);
}
const plux129SW=join(root,'sw.js');
let sw129=readFileSync(plux129SW,'utf8').replace(/plux-emerald-v12\d+/g,'plux-emerald-v129');
if(!sw129.includes("'/plux-v129.js'")){
  sw129=sw129.replace("'/plux-chat-v128.js'","'/plux-chat-v128.js','/plux-v129.css','/plux-v129.js'");
}
writeFileSync(plux129SW,sw129);
if(!plux129HTML.includes('/plux-v129.js'))throw Error('PLUX V12.9 script missing');
console.log('PLUX V12.9 attachment picker and Nano Banana image generator ready');

/* PLUX V13.0 Clean Screen — stylesheet is ordered after all earlier versions. */
const v130css=readFileSync('plux-v130-overlay/plux-v130.css','utf8');
if(v130css.length<1500)throw Error('PLUX V13.0 CSS missing');
writeFileSync(join(root,'plux-v130.css'),v130css);
const v130html=join(root,'index.html');
let p130=readFileSync(v130html,'utf8');
p130=p130.replace('</head>','<meta name="plux-release-v130" content="clean-native-header-and-animated-gallery"><link rel="stylesheet" href="/plux-v130.css?v=1301"></head>');
p130=p130.replace(/(<meta name="plux-version" content=")[^"]+/,(all, prefix)=>prefix+'13.0');
writeFileSync(v130html,p130);
const v130sw=join(root,'sw.js');
let p130sw=readFileSync(v130sw,'utf8').replace(/plux-emerald-v12\d+/g,'plux-emerald-v130');
if(!p130sw.includes("'/plux-v130.css'"))p130sw=p130sw.replace("'/plux-v129.js'","'/plux-v129.js','/plux-v130.css'");
writeFileSync(v130sw,p130sw);
console.log('PLUX V13.0 hidden fake status/chrome, logo subtitle removed, gallery drift restored');

/* PLUX V14 CHAT ARTIFACTS: PDF / GPT Image 2 cards in existing OLED chat. */
const p14css=readFileSync('plux-v14-overlay/plux-artifacts-v14.css','utf8');
if(p14css.length<1200)throw Error('PLUX V14 artifact CSS not found');
writeFileSync(join(root,'plux-artifacts-v14.css'),p14css);
plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
const p14file=join(root,'index.html');
let p14html=readFileSync(p14file,'utf8');
if(!p14html.includes('plux-artifacts-v14.css')){
 p14html=p14html.replace('</head>','<meta name="plux-release-v14" content="gpt-image-2-and-pdf-chat"><link rel="stylesheet" href="/plux-artifacts-v14.css?v=1401"></head>');
 p14html=p14html.replace('/plux-chat-v128.js?v=1281','/plux-chat-v128.js?v=1401');
 writeFileSync(p14file,p14html);
}
const p14sw=join(root,'sw.js');
let p14worker=readFileSync(p14sw,'utf8').replace(/plux-emerald-v(?:12|13)\d*/g,'plux-emerald-v140');
if(!p14worker.includes("'/plux-artifacts-v14.css'"))
 p14worker=p14worker.replace("'/plux-v130.css'","'/plux-v130.css','/plux-artifacts-v14.css'");
writeFileSync(p14sw,p14worker);
console.log('PLUX V14 chat artifact renderer installed');


/* PLUX V15 CYHUB VOICE: paid narration is opt-in, API key remains server-side. */
for(const filename of ['plux-voice-v15.js','plux-voice-v15.css']){
  const bytes=readFileSync(join('plux-v15-overlay',filename));
  if(bytes.length<1200)throw Error('PLUX V15 asset not found: '+filename);
  writeFileSync(join(root,filename),bytes);
}
plux123Exec(process.execPath,['--check',join(root,'plux-voice-v15.js')],{stdio:'inherit'});
plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
const v15htmlPath=join(root,'index.html');
let v15html=readFileSync(v15htmlPath,'utf8');
if(!v15html.includes('plux-voice-v15.js')){
  v15html=v15html.replace('</head>','<meta name="plux-release-v15" content="cyhub-russian-elevenlabs-opt-in-tts"><link rel="stylesheet" href="/plux-voice-v15.css?v=1501"></head>');
  v15html=v15html.replace('</body>','<script src="/plux-voice-v15.js?v=1501"></script></body>');
  v15html=v15html.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=1501');
  writeFileSync(v15htmlPath,v15html);
}
const v15swPath=join(root,'sw.js');
let v15sw=readFileSync(v15swPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v150');
if(!v15sw.includes("'/plux-voice-v15.js'"))
  v15sw=v15sw.replace("'/plux-artifacts-v14.css'","'/plux-artifacts-v14.css','/plux-voice-v15.css','/plux-voice-v15.js'");
writeFileSync(v15swPath,v15sw);
console.log('PLUX V15 Cyhub voice playback controls installed, paid TTS remains opt-in');


/* PLUX V15.1 REALTIME VOICE — bundle official SDK at build-time, self-host client JS. */
for(const file of ['plux-live-v151.src.js','plux-live-v151.css','package.json']){
 if(statSync(join('plux-v151-overlay',file)).size<200)throw Error('Missing voice asset: '+file);
}
plux123Exec('npm',['install','--prefix','plux-v151-overlay','--no-audit','--no-fund'],{
 stdio:'inherit',timeout:180000
});
plux123Exec(join('plux-v151-overlay','node_modules','.bin','esbuild'),[
 'plux-v151-overlay/plux-live-v151.src.js',
 '--bundle','--minify','--platform=browser','--format=iife','--target=es2020',
 '--outfile='+join(root,'plux-live-v151.js')
],{stdio:'inherit',timeout:120000});
if(statSync(join(root,'plux-live-v151.js')).size<12000)throw Error('Voice client bundle is incomplete');
plux123Exec(process.execPath,['--check',join(root,'plux-live-v151.js')],{stdio:'inherit'});
writeFileSync(join(root,'plux-live-v151.css'),readFileSync('plux-v151-overlay/plux-live-v151.css'));
const liveIndex=join(root,'index.html');
let liveHTML=readFileSync(liveIndex,'utf8')
  .replace(/<script src="\/plux-voice-v15\.js\?v=1501"><\/script>/g,'')
  .replace(/<link rel="stylesheet" href="\/plux-voice-v15\.css\?v=1501">/g,'');
if(!liveHTML.includes('plux-live-v151.js')){
 liveHTML=liveHTML.replace('</head>','<meta name="plux-release-v151" content="realtime-voice-mode"><link rel="stylesheet" href="/plux-live-v151.css?v=1511"></head>');
 liveHTML=liveHTML.replace('</body>','<script src="/plux-live-v151.js?v=1511" defer></script></body>');
}
writeFileSync(liveIndex,liveHTML);
const liveSw=join(root,'sw.js');
let liveWorker=readFileSync(liveSw,'utf8')
 .replace(/plux-emerald-v(?:12|13|14)\d*/g,'plux-emerald-v151');
if(!liveWorker.includes("'/plux-live-v151.js'"))
 liveWorker=liveWorker.replace("'/plux-artifacts-v14.css'","'/plux-artifacts-v14.css','/plux-live-v151.css','/plux-live-v151.js'");
writeFileSync(liveSw,liveWorker);
console.log('PLUX V15.1: voice SDK bundled locally; crystal microphone starts audio conversation');


/* PLUX V16 CYHUB GROK LITE VIDEO — cheapest text-to-video, explicit price and confirmation. */
for(const filename of ['plux-video-v16.js','plux-video-v16.css']){
 const raw=readFileSync(join('plux-v16-overlay',filename));
 if(raw.length<1200)throw Error('Incomplete PLUX V16 video resource '+filename);
 writeFileSync(join(root,filename),raw);
}
plux123Exec(process.execPath,['--check',join(root,'plux-video-v16.js')],{stdio:'inherit'});
const video16Page=join(root,'index.html');
let video16Html=readFileSync(video16Page,'utf8');
if(!video16Html.includes('plux-release-v16')){
 video16Html=video16Html.replace('</head>',
  '<meta name="plux-release-v16" content="cyhub-grok-lite-video"><link rel="stylesheet" href="/plux-video-v16.css?v=1601"></head>');
 video16Html=video16Html.replace('</body>',
  '<script src="/plux-video-v16.js?v=1601" defer></script></body>');
 writeFileSync(video16Page,video16Html);
}
const video16SW=join(root,'sw.js');
let video16Worker=readFileSync(video16SW,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v160');
if(!video16Worker.includes("'/plux-video-v16.js'"))
 video16Worker=video16Worker.replace("'/plux-live-v151.js'","'/plux-live-v151.js','/plux-video-v16.css','/plux-video-v16.js'");
writeFileSync(video16SW,video16Worker);
console.log('PLUX V16 Cyhub Grok Lite video creation UI installed; paid requests require quote confirmation');


/* PLUX V17 PHOTO TO VIDEO + ARKHEON: keep OLED artwork intact and replace only the voice engine. */
for(const name of ['plux-arkheon-v17.js','plux-arkheon-processor-v17.js']){
 const data=readFileSync(join('plux-v17-overlay',name));
 if(data.length<1000)throw Error('Missing V17 Arkheon asset '+name);
 writeFileSync(join(root,name),data);
 plux123Exec(process.execPath,['--check',join(root,name)],{stdio:'inherit'});
}
plux123Exec(process.execPath,['--check',join(root,'plux-video-v16.js')],{stdio:'inherit'});
plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
plux123Exec(process.execPath,['--check',join(root,'plux-v129.js')],{stdio:'inherit'});
const pageV17=join(root,'index.html');
let markupV17=readFileSync(pageV17,'utf8');
markupV17=markupV17.replace(/<script\s+src="\/plux-live-v151\.js\?v=\d+"(?:\s+defer)?><\/script>/g,'');
markupV17=markupV17.replace(/(<script src="\/plux-video-v16\.js\?v=)1601/g,'$11702');
markupV17=markupV17.replace(/(<script src="\/plux-chat-v128\.js\?v=)\d+/g,'$11702');
markupV17=markupV17.replace(/(<script src="\/plux-v129\.js\?v=)1291/g,'$11702');
if(markupV17.includes('src="/plux-live-v151.js'))throw Error('Old ElevenLabs microphone handler still loaded');
if(!markupV17.includes('plux-arkheon-v17.js')){
 markupV17=markupV17.replace('</head>','<meta name="plux-release-v17" content="grok-image-to-video-arkheon-realtime"></head>');
 markupV17=markupV17.replace('</body>','<script src="/plux-arkheon-v17.js?v=1702" defer></script></body>');
}
if(!markupV17.includes('plux-arkheon-v17.js'))throw Error('Arkheon mic handler not installed');
// V18: refresh persistent browser/PWA caches for newly fixed Russian voice director.
markupV17=markupV17.replace('/plux-arkheon-v17.js?v=1702','/plux-arkheon-v17.js?v=1801');
markupV17=markupV17.replace('/plux-motion-v124.js?v=124','/plux-motion-v124.js?v=1801');
if(!markupV17.includes('plux-release-v18'))markupV17=markupV17.replace('</head>','<meta name="plux-release-v18" content="five-emotions-russian-first-voice"></head>');
writeFileSync(pageV17,markupV17);
for(const name of ['01_idle','02_listening','03_thinking','04_talking','05_happy']){
 const videoFile=join(root,'assets','videos-v106',name+'.mp4');
 const videoBytes=statSync(videoFile).size;
 if(videoBytes<65000)throw Error('V18 original mascot emotion video unavailable: '+name);
 console.log('PLUX V18 checked original video '+name+' ('+Math.round(videoBytes/1024)+' KiB)');
}
if(!readFileSync(join(root,'plux-motion-v124.js'),'utf8').includes('plux:emotion'))
 throw Error('PLUX emotion director is missing');
const swV17Path=join(root,'sw.js');
let swV17=readFileSync(swV17Path,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v1801');
if(!swV17.includes("'/plux-arkheon-v17.js'")){
 swV17=swV17.replace("'/plux-video-v16.js'","'/plux-video-v16.js','/plux-arkheon-v17.js','/plux-arkheon-processor-v17.js'");
}
writeFileSync(swV17Path,swV17);

// V19: new video presets and correctly encoded phone photo upload.
// Bump ALL independent HTML and service-worker cache keys so installed Android
// PWA copies do not keep the broken gallery handler from the old release.
const pageV19=join(root,'index.html');
let htmlV19=readFileSync(pageV19,'utf8');
htmlV19=htmlV19
 .replace(/\/plux-video-v16\.css\?v=\d+/g,'/plux-video-v16.css?v=1901')
 .replace(/\/plux-video-v16\.js\?v=\d+/g,'/plux-video-v16.js?v=1901');
if(!htmlV19.includes('plux-release-v19'))
 htmlV19=htmlV19.replace('</head>','<meta name="plux-release-v19" content="photo-upload-fix-3d-anime-video-presets"></head>');
if(!htmlV19.includes('/plux-video-v16.js?v=1901'))throw Error('V19 video controls not installed');
writeFileSync(pageV19,htmlV19);
const swV19Path=join(root,'sw.js');
const swV19=readFileSync(swV19Path,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v1901');
writeFileSync(swV19Path,swV19);
const v19Client=readFileSync(join(root,'plux-video-v16.js'),'utf8');
for(const marker of ['plux19-styles','plux19-motion','compatiblePhoto','image/jpeg']){
 if(!v19Client.includes(marker))throw Error('V19 missing video control: '+marker);
}
plux123Exec(process.execPath,['plux-v18-overlay/test-voice-v18.mjs'],{stdio:'inherit',timeout:35000});
console.log('PLUX V18 five mascot videos verified, Russian-first live speech director installed; live speech requires ARKHEON_API_KEY');


/* PLUX V20: use real audio queue lifecycle instead of network timeouts;
   raise false-echo barge-in threshold and flush only on confirmed speech. */
const v20Index=join(root,'index.html');
let v20Html=readFileSync(v20Index,'utf8');
v20Html=v20Html.replace(/\/plux-arkheon-v17\.js\?v=\d+/g,'/plux-arkheon-v17.js?v=2001');
if(!v20Html.includes('plux-release-v20'))
 v20Html=v20Html.replace('</head>','<meta name="plux-release-v20" content="stable-full-voice-speech-and-echo-filter"></head>');
if(!v20Html.includes('/plux-arkheon-v17.js?v=2001'))throw Error('PLUX V20 speech client not installed');
writeFileSync(v20Index,v20Html);
const v20SW=join(root,'sw.js');
writeFileSync(v20SW,readFileSync(v20SW,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2001'));
console.log('PLUX V20 stable Arkheon playback queue + echo-safe interrupt + completed speech installed');


/* PLUX V21 — identical home-screen typing sound on fullscreen welcome.
 * V12.5 owns the user-selected typing click: reuse it, do not synthesize another.
 * The first sound-button tap unlocks mobile audio and replays visible greeting.
 */
const homeV21Path=join(root,'plux-v125.js');
let homeV21=readFileSync(homeV21Path,'utf8');
const homeV21Original="window.PLUX125={version:'12.5',complete:()=>get(READY_KEY)==='yes',audioSettings:()=>({typing:auto.typingOn,volume:auto.volume})};";
if(!homeV21.includes(homeV21Original))throw Error('V21 shared typing oscillator not found');
homeV21=homeV21.replace(homeV21Original,
 "window.PLUX125={version:'12.5',complete:()=>get(READY_KEY)==='yes',audioSettings:()=>({typing:auto.typingOn,volume:auto.volume}),playTypeClick:typeClick};");
writeFileSync(homeV21Path,homeV21);
const introV21Path=join(root,'plux-v127.js');
let introV21=readFileSync(introV21Path,'utf8');
const introV21Original="if(chars[i].trim())beep('type');";
if(!introV21.includes(introV21Original))throw Error('V21 intro typewriter frame not found');
introV21=introV21.replace(introV21Original,"if(chars[i].trim()&&soundEnabled)window.PLUX125?.playTypeClick?.();");
const soundV21Setup="let active=true,stage='name',typing=0,ready=false,audio=null,gesture=false,lastSound=0;";
if(!introV21.includes(soundV21Setup))throw Error('V21 intro sound state missing');
introV21=introV21.replace(soundV21Setup,soundV21Setup+"\n  let soundButtonTouched=false;");
const soundV21Reflect="sound.querySelector('span').textContent=soundEnabled?'Звук вкл.':'Звук выкл.'";
if(!introV21.includes(soundV21Reflect))throw Error('V21 intro sound indicator missing');
introV21=introV21.replace(soundV21Reflect,
 "sound.querySelector('span').textContent=soundEnabled?(soundButtonTouched||navigator.userActivation?.hasBeenActive?'Звук вкл.':'Включить звук'):'Звук выкл.'");
const soundV21Toggle="unlock();soundEnabled=!soundEnabled;set('plux_sfx_enabled',soundEnabled?'on':'off');set('plux_v125_typing_enabled',soundEnabled?'on':'off');reflectSound();";
if(!introV21.includes(soundV21Toggle))throw Error('V21 intro sound control missing');
introV21=introV21.replace(soundV21Toggle,
 "const initialUnlock=!soundButtonTouched&&soundEnabled;soundButtonTouched=true;unlock();if(!initialUnlock)soundEnabled=!soundEnabled;set('plux_sfx_enabled',soundEnabled?'on':'off');set('plux_v125_typing_enabled',soundEnabled?'on':'off');reflectSound();");
writeFileSync(introV21Path,introV21);
plux123Exec(process.execPath,['--check',homeV21Path],{stdio:'inherit'});
plux123Exec(process.execPath,['--check',introV21Path],{stdio:'inherit'});
const pageV21=join(root,'index.html');let htmlV21=readFileSync(pageV21,'utf8');
htmlV21=htmlV21.replace(/\/plux-v125\.js\?v=\d+/g,'/plux-v125.js?v=2101');
htmlV21=htmlV21.replace(/\/plux-v127\.js\?v=\d+/g,'/plux-v127.js?v=2101');
if(!htmlV21.includes('plux-release-v21'))
 htmlV21=htmlV21.replace('</head>','<meta name="plux-release-v21" content="shared-onboarding-typing-sound"></head>');
if(!htmlV21.includes('/plux-v127.js?v=2101'))throw Error('V21 welcome audio not installed');
writeFileSync(pageV21,htmlV21);
const swV21=join(root,'sw.js');
writeFileSync(swV21,readFileSync(swV21,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2101'));
console.log('PLUX V21 shared home/intro soft typing sound; respect volume and one-tap audio unlock');


/* PLUX V22: real image completion in chat, glass Home icon, welcome keyboard
   replay after the first user gesture, Russian microphone label. */
const v22CssSource=join('plux-v22-overlay','plux-v22.css');
if(statSync(v22CssSource).size<1000)throw Error('Missing PLUX V22 stylesheet');
writeFileSync(join(root,'plux-v22.css'),readFileSync(v22CssSource));
const v22WelcomePath=join(root,'plux-v127.js');
let v22Welcome=readFileSync(v22WelcomePath,'utf8');
const v22WelcomeMarker="  root.addEventListener('pointerdown',unlock,{capture:true,passive:true});";
if(!v22Welcome.includes(v22WelcomeMarker))throw Error('PLUX welcome unlock hook absent');
const v22WelcomeHook=[
 "  // Mobile browsers require a real gesture before audible keyboard clicks.",
 "  let welcomeSoundReplay=false;",
 "  root.addEventListener('pointerdown',event=>{",
 "    if(welcomeSoundReplay||stage!=='name'||event.target?.closest?.('#plux127-sound'))return;",
 "    welcomeSoundReplay=true;",
 "    if(soundEnabled)void replayGreeting();",
 "  },{capture:true,passive:true});"
].join('\n');
v22Welcome=v22Welcome.replace(v22WelcomeMarker,v22WelcomeMarker+'\n'+v22WelcomeHook);
writeFileSync(v22WelcomePath,v22Welcome);
const v22AppPath=join(root,'app.js');
let v22App=readFileSync(v22AppPath,'utf8');
v22App=v22App.replaceAll('PLUX слушает...','ПЛЮХ слушает…');
writeFileSync(v22AppPath,v22App);
const v22PagePath=join(root,'index.html');
let v22Html=readFileSync(v22PagePath,'utf8');
if(!v22Html.includes('plux-release-v21'))throw Error('PLUX V21 required');
v22Html=v22Html.replaceAll('PLUX слушает...','ПЛЮХ слушает…');
if(!v22Html.includes('plux-release-v22'))
 v22Html=v22Html.replace('</head>','<meta name="plux-release-v22" content="image-progress-android-mic-centered-glass-home"><link rel="stylesheet" href="/plux-v22.css?v=2202"></head>');
v22Html=v22Html.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=2202');
v22Html=v22Html.replace(/\/plux-arkheon-v17\.js\?v=\d+/g,'/plux-arkheon-v17.js?v=2202');
v22Html=v22Html.replace(/\/plux-v127\.js\?v=\d+/g,'/plux-v127.js?v=2202');
writeFileSync(v22PagePath,v22Html);
const v22ServiceWorkerPath=join(root,'sw.js');
let v22Sw=readFileSync(v22ServiceWorkerPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2202');
if(!v22Sw.includes("'/plux-v22.css'"))v22Sw=v22Sw.replace("'/plux-artifacts-v14.css'","'/plux-artifacts-v14.css','/plux-v22.css'");
writeFileSync(v22ServiceWorkerPath,v22Sw);
for(const f of ['plux-v127.js','plux-chat-v128.js','plux-arkheon-v17.js','app.js']){
 plux123Exec(process.execPath,['--check',join(root,f)],{stdio:'inherit'});
}
if(!v22Html.includes('/plux-v22.css?v=2202'))throw Error('PLUX V22 not loaded');
console.log('PLUX V22: inline GPT Image 2 progress, Android voice, welcome type audio, centered glass Home');


/* PLUX V23: preserve square launcher proportions from the portrait master.
 * Previous ffmpeg scale=512:512 distorted the 540x960 mascot into a pancake.
 * Center-crop first (same scale on both axes), THEN resize square.
 */
const plux23Frame=join(root,'assets','videos-v106','01_idle.mp4');
const plux23FF=process.env.PLUX_FFMPEG||'ffmpeg';
for(const side of [192,512]){
  plux123Exec(plux23FF,[
    '-nostdin','-hide_banner','-loglevel','error','-y','-ss','0.3','-i',plux23Frame,
    '-frames:v','1',
    '-vf', 'crop=iw:iw:0:(ih-iw)*0.36,scale='+side+':'+side+':flags=lanczos',
    join(root,'icon-'+side+'.png')
  ],{stdio:'inherit',timeout:90000});
  if(statSync(join(root,'icon-'+side+'.png')).size<10000)
    throw Error('V23 undistorted launcher icon missing: '+side);
}
console.log('PLUX V23 aspect-correct green mascot icons 192/512 ready');


/* PLUX V23: four coordinated premium glass themes, including original video
 * tint. No new video calls, API keys or changes to microphone capture.
 */
for(const f of ['plux-themes-v23.js','plux-themes-v23.css']){
  const from=join('plux-v23-overlay',f);
  if(statSync(from).size<1800)throw Error('Missing PLUX V23 theme file: '+f);
  writeFileSync(join(root,f),readFileSync(from));
}
plux123Exec(process.execPath,['--check',join(root,'plux-themes-v23.js')],{stdio:'inherit'});
const v23ThemePage=join(root,'index.html');let v23ThemeHtml=readFileSync(v23ThemePage,'utf8');
if(!v23ThemeHtml.includes('plux-release-v22'))throw Error('V22 prerequisite missing');
v23ThemeHtml=v23ThemeHtml.replace('</head>',
 '<meta name="plux-release-v23" content="four-crystal-themes-and-voice-stability"><link rel="stylesheet" href="/plux-themes-v23.css?v=2301"></head>');
v23ThemeHtml=v23ThemeHtml.replace('</body>',
 '<script src="/plux-themes-v23.js?v=2301" defer></script></body>');
v23ThemeHtml=v23ThemeHtml.replace(/\/plux-arkheon-v17\.js\?v=\d+/g,'/plux-arkheon-v17.js?v=2301');
writeFileSync(v23ThemePage,v23ThemeHtml);
const v23SWPath=join(root,'sw.js');
let v23Sw=readFileSync(v23SWPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2301');
if(!v23Sw.includes("'/plux-themes-v23.js'"))
  v23Sw=v23Sw.replace("'/plux-v22.css'","'/plux-v22.css','/plux-themes-v23.js','/plux-themes-v23.css'");
writeFileSync(v23SWPath,v23Sw);
if(!v23ThemeHtml.includes('/plux-themes-v23.js?v=2301'))throw Error('V23 themes not loaded');
console.log('PLUX V23: four accessible themes with recolored five-state video, improved realtime conversation and undistorted launcher icon');


/* PLUX V24: local generated-media gallery, Audius free-streaming player,
 * theme-aware chat, responsive microphone and completed image previews.
 * Source content is copied by earlier V12.8/V12.9/V16/V17 patches.
 */
for(const name of ['plux-gallery-v24.js','plux-gallery-v24.css','plux-music-v24.js','plux-music-v24.css','plux-chat-v24.css']){
 const src=join('plux-v24-overlay',name);
 if(statSync(src).size<2100)throw Error('PLUX V24 release asset missing: '+name);
 writeFileSync(join(root,name),readFileSync(src));
 if(name.endsWith('.js'))plux123Exec(process.execPath,['--check',join(root,name)],{stdio:'inherit'});
}
const v24IndexPath=join(root,'index.html');
let v24HTML=readFileSync(v24IndexPath,'utf8');
if(!v24HTML.includes('plux-release-v23'))throw Error('V23 PLUX prerequisite is missing');
v24HTML=v24HTML.replace('</head>','<meta name="plux-release-v24" content="local-gallery-free-audius-chat-image-voice"><link rel="stylesheet" href="/plux-gallery-v24.css?v=2401"><link rel="stylesheet" href="/plux-music-v24.css?v=2401"><link rel="stylesheet" href="/plux-chat-v24.css?v=2401"></head>');
v24HTML=v24HTML.replace('</body>','<script src="/plux-gallery-v24.js?v=2401" defer></script><script src="/plux-music-v24.js?v=2401" defer></script></body>');
v24HTML=v24HTML.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=2401');
v24HTML=v24HTML.replace(/\/plux-v129\.js\?v=\d+/g,'/plux-v129.js?v=2401');
v24HTML=v24HTML.replace(/\/plux-video-v16\.js\?v=\d+/g,'/plux-video-v16.js?v=2401');
v24HTML=v24HTML.replace(/\/plux-arkheon-v17\.js\?v=\d+/g,'/plux-arkheon-v17.js?v=2401');
writeFileSync(v24IndexPath,v24HTML);
const v24SWPath=join(root,'sw.js');
let v24SW=readFileSync(v24SWPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2401');
const v24List="'/plux-gallery-v24.js','/plux-gallery-v24.css','/plux-music-v24.js','/plux-music-v24.css','/plux-chat-v24.css'";
if(!v24SW.includes("'/plux-gallery-v24.js'")){
 if(!v24SW.includes("'/plux-themes-v23.css'"))throw Error('V23 service worker insertion point missing');
 v24SW=v24SW.replace("'/plux-themes-v23.css'","'/plux-themes-v23.css',"+v24List);
}
writeFileSync(v24SWPath,v24SW);
for(const file of ['plux-chat-v128.js','plux-v129.js','plux-video-v16.js','plux-arkheon-v17.js'])plux123Exec(process.execPath,['--check',join(root,file)],{stdio:'inherit'});
if(!v24HTML.includes('/plux-gallery-v24.js?v=2401')||!v24HTML.includes('/plux-music-v24.js?v=2401'))throw Error('V24 scripts not installed');
console.log('PLUX V24: IndexedDB Gallery replaces More, Audius music, responsive voice, full image cards, four theme-aware chat colors');


/* PLUX direct Render APK mirror: Android in-app browsers sometimes fail
 * to download GitHub Releases (cross-domain redirects). During static-site
 * build, mirror the already published, exact V27 APK to the same origin.
 * A mirror failure must not break the already working PЛЮХ web app.
 */
{
 const release="https://github.com/zykinigor55-a11y/forma-visual/releases/download/plux-android-v27-20261110/PLUX-Android.apk";
 let ok=false;
 for(let attempt=1;attempt<=3&&!ok;attempt++){
  try{
   const response=await fetch(release,{redirect:'follow',signal:AbortSignal.timeout(50000),headers:{'Accept':'application/octet-stream','User-Agent':'PLUX-Render-APK-Mirror/1.0'}});
   if(!response.ok)throw Error('GitHub release download status '+response.status);
   const declared=Number(response.headers.get('content-length')||0);
   if(declared>20000000)throw Error('Oversize APK');
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.byteLength<2000000||bytes.byteLength>20000000||bytes[0]!==0x50||bytes[1]!==0x4b)
    throw Error('Invalid Android package payload');
   writeFileSync(join(root,'PLUX-Android-V27.apk'),bytes);
   console.log('PLUX Android V27 APK mirror ready:',bytes.byteLength,'bytes at /PLUX-Android-V27.apk');
   ok=true;
  }catch(e){console.warn('PLUX APK mirror attempt',attempt,'failed:',String(e?.message||e).slice(0,160));}
 }
 if(!ok)console.warn('PLUX APK mirror unavailable; app remains live; use official GitHub Release download.');
 // A stable in-app installation guide is accessible even if the mirror
 // download itself was temporarily blocked by GitHub's CDN.
 const site='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Установить ПЛЮХ на Android</title><style>body{min-height:100dvh;margin:0;background:#020b0c;color:#f1fff8;font:16px system-ui;display:grid;place-items:center;padding:20px;box-sizing:border-box}main{width:min(420px,100%);box-sizing:border-box;padding:28px 22px;border:1px solid #408b72;border-radius:28px;background:linear-gradient(145deg,#10362d,#030e11);box-shadow:0 0 60px #145b3a3b}h1{font-size:28px;margin:0 0 10px}p{color:#bddbd0;line-height:1.5}a{display:block;margin:13px 0;padding:15px;border-radius:16px;background:#154d3d;border:1px solid #70c7a6;color:#effff5;text-decoration:none;text-align:center;font-weight:650}small{color:#a4c2b9;line-height:1.4;display:block}</style></head><body><main><h1>ПЛЮХ для Android</h1><p>Версия V27. Выбери ссылку для скачивания установочного APK.</p><a href="/PLUX-Android-V27.apk" download="PLUX-Android-V27.apk">Скачать APK с Render</a><a href="https://github.com/zykinigor55-a11y/forma-visual/releases/download/plux-android-v27-20261110/PLUX-Android.apk" rel="noopener noreferrer">Запасная ссылка GitHub</a><small>Открывай в Chrome или Яндекс Браузере. Скачанный файл находится в папке «Загрузки». Для установки может понадобиться разрешение на установку из выбранного браузера.</small></main></body></html>';
 writeFileSync(join(root,'install-android.html'),site);
}


/* PLUX V25: correct color of home mascot in every state and unify
 * Gallery with original optical mode cards. The native WebView handles
 * a separately requested music playback gesture after async Audius search.
 */
const v25CssSource=join('plux-v25-overlay','plux-v25-style.css');
if(statSync(v25CssSource).size<2500)throw Error('PLUX V25 style asset missing');
writeFileSync(join(root,'plux-v25-style.css'),readFileSync(v25CssSource));
const v25Page=join(root,'index.html');
let v25Html=readFileSync(v25Page,'utf8');
if(!v25Html.includes('plux-release-v24'))throw Error('PLUX V24 required');
v25Html=v25Html.replace('</head>','<meta name="plux-release-v25" content="unified-six-card-modes-mascot-theme-audius-auto-play"><link rel="stylesheet" href="/plux-v25-style.css?v=2501"></head>');
v25Html=v25Html.replace(/\/plux-music-v24\.js\?v=\d+/g,'/plux-music-v24.js?v=2501');
writeFileSync(v25Page,v25Html);
const v25SWPath=join(root,'sw.js');
let v25SW=readFileSync(v25SWPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2501');
if(!v25SW.includes("'/plux-v25-style.css'")){
 if(!v25SW.includes("'/plux-chat-v24.css'"))throw Error('PLUX V24 SW list missing');
 v25SW=v25SW.replace("'/plux-chat-v24.css'","'/plux-chat-v24.css','/plux-v25-style.css'");
}
writeFileSync(v25SWPath,v25SW);
plux123Exec(process.execPath,['--check',join(root,'plux-music-v24.js')],{stdio:'inherit'});
if(!v25Html.includes('/plux-v25-style.css?v=2501'))throw Error('PLUX V25 stylesheet not linked');
console.log('PLUX V25: main mascot and bubbles follow theme, gallery aligns with modes, Audius user-requested playback');


/* PLUX V26: all six cards adopt the Gallery's satin-glass icon system,
 * real GPT Image 2 output is displayed and can be opened fullscreen,
 * glass-state cues confirm when the assistant listens/thinks/speaks.
 */
for(const name of ['plux-modes-v26.js','plux-v26-images.js','plux-v26.css']){
 const source=join('plux-v26-overlay',name);
 if(statSync(source).size<2100)throw Error('PLUX V26 asset missing: '+name);
 writeFileSync(join(root,name),readFileSync(source));
 if(name.endsWith('.js'))plux123Exec(process.execPath,['--check',join(root,name)],{stdio:'inherit'});
}
const v26Page=join(root,'index.html');
let v26HTML=readFileSync(v26Page,'utf8');
if(!v26HTML.includes('plux-release-v25'))throw Error('PLUX V25 prerequisite missing');
v26HTML=v26HTML.replace('</head>','<meta name="plux-release-v26" content="real-gpt-image-six-satin-cards-voice-cues"><link rel="stylesheet" href="/plux-v26.css?v=2601"></head>');
v26HTML=v26HTML.replace('</body>','<script src="/plux-v26-images.js?v=2601" defer></script><script src="/plux-modes-v26.js?v=2601" defer></script></body>');
v26HTML=v26HTML.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=2601');
v26HTML=v26HTML.replace(/\/plux-arkheon-v17\.js\?v=\d+/g,'/plux-arkheon-v17.js?v=2601');
writeFileSync(v26Page,v26HTML);
const v26SWPath=join(root,'sw.js');
let v26SW=readFileSync(v26SWPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2601');
if(!v26SW.includes("'/plux-modes-v26.js'")){
 if(!v26SW.includes("'/plux-v25-style.css'"))throw Error('PLUX V25 SW asset list missing');
 v26SW=v26SW.replace("'/plux-v25-style.css'","'/plux-v25-style.css','/plux-v26.css','/plux-modes-v26.js','/plux-v26-images.js'");
}
writeFileSync(v26SWPath,v26SW);
for(const name of ['plux-chat-v128.js','plux-arkheon-v17.js'])plux123Exec(process.execPath,['--check',join(root,name)],{stdio:'inherit'});
if(!v26HTML.includes('/plux-v26.css?v=2601')||!v26HTML.includes('/plux-modes-v26.js?v=2601'))
 throw Error('PLUX V26 not loaded');
console.log('PLUX V26 ready: photo viewer, genuine image generator, six unified cards, three state sounds');


/* PLUX V27 ZIP download for Samsung browsers: same-origin, plain ZIP file
 * avoids Android's .apk MIME handling, browser interstitials and GitHub CDN.
 * ZIP uses STORE for the signed APK binary; no external tools required.
 */
{
 const apk=join(root,'PLUX-Android-V27.apk');
 if(statSync(apk,{throwIfNoEntry:false})?.size>2_000_000){
  const data=readFileSync(apk), name=Buffer.from('PLUX-Android-V27.apk','utf8');
  let crc=0xffffffff;
  for(const byte of data){
   crc^=byte;
   for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  crc=(crc^0xffffffff)>>>0;
  const local=Buffer.alloc(30+name.length);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);
  local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
  name.copy(local,30);
  const central=Buffer.alloc(46+name.length);
  central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
  central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);
  central.writeUInt16LE(name.length,28);name.copy(central,46);
  const ending=Buffer.alloc(22);
  ending.writeUInt32LE(0x06054b50,0);ending.writeUInt16LE(1,8);ending.writeUInt16LE(1,10);
  ending.writeUInt32LE(central.length,12);ending.writeUInt32LE(local.length+data.length,16);
  const zipped=Buffer.concat([local,data,central,ending]);
  writeFileSync(join(root,'PLUX-Android-V27.zip'),zipped);
  console.log('PLUX V27 ZIP mirror ready:',zipped.length,'bytes at /PLUX-Android-V27.zip');
  const pageFile=join(root,'install-android.html');
  let page=readFileSync(pageFile,'utf8');
  const apkButton='<a href="/PLUX-Android-V27.apk" download="PLUX-Android-V27.apk">Скачать APK с Render</a>';
  const zipButton='<a href="/PLUX-Android-V27.zip" download="PLUX-Android-V27.zip">Скачать ZIP — если APK не скачивается</a>';
  if(!page.includes(zipButton)){
   if(!page.includes(apkButton))throw Error('PLUX V27 download page missing APK button');
   page=page.replace(apkButton,zipButton+apkButton);
  }
  writeFileSync(pageFile,page);
 }else{
  console.warn('PLUX V27 ZIP was not built because release APK mirror did not download.');
 }
}


/* PLUX V27: PDF downloads from real HTTPS URLs; fix empty image creation
 * icon, remove decorative stripes and inactive notification bell, and smooth
 * realtime speech on unreliable mobile connections. Native Android V27 adds
 * the system DownloadManager; web mode can use the same direct PDF link.
 */
const v27PagePath=join(root,'index.html');
let v27Html=readFileSync(v27PagePath,'utf8');
if(!v27Html.includes('plux-release-v26'))throw Error('V26 prerequisite required');
v27Html=v27Html.replace('</head>','<meta name="plux-release-v27" content="download-pdf-modes-icons-voice-stability"></head>');
for(const script of ['plux-chat-v128.js','plux-modes-v26.js','plux-arkheon-v17.js']){
 v27Html=v27Html.replace(new RegExp('/'+script.replaceAll('.','\\.')+'\\?v=\\d+','g'),'/'+script+'?v=2701');
}
v27Html=v27Html.replace(/\/plux-v26\.css\?v=\d+/g,'/plux-v26.css?v=2701');
writeFileSync(v27PagePath,v27Html);
const v27SwPath=join(root,'sw.js');
let v27Sw=readFileSync(v27SwPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2701');
writeFileSync(v27SwPath,v27Sw);
for(const file of ['plux-chat-v128.js','plux-modes-v26.js','plux-arkheon-v17.js']){
 plux123Exec(process.execPath,['--check',join(root,file)],{stdio:'inherit'});
}
if(!v27Html.includes('/plux-chat-v128.js?v=2701'))throw Error('PLUX V27 chat cache-bust missing');
console.log('PLUX V27: downloadable PDFs, no dead bell, proper image-create icon and low-bandwidth voice jitter recovery');


/* PLUX V28: asynchronous generation of real GPT Image 2 photos and PDF files.
 * Polling survives network disconnects and does not trigger duplicate paid jobs.
 * Web-only update: existing Android installations receive it from Render.
 */
{
 const path=join(root,'index.html');
 let html=readFileSync(path,'utf8');
 if(!html.includes('plux-release-v27'))throw Error('PLUX V27 prerequisite missing');
 html=html.replace('</head>','<meta name="plux-release-v28" content="reliable-async-gpt-image-and-pdf-jobs"></head>');
 html=html.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=2801');
 writeFileSync(path,html);
 const swFile=join(root,'sw.js');
 let sw=readFileSync(swFile,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2801');
 writeFileSync(swFile,sw);
 plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
 if(!html.includes('/plux-chat-v128.js?v=2801'))throw Error('PLUX V28 chat asset not loaded');
 console.log('PLUX V28 web ready: true GPT Image 2/PDF job polling, Russian intent, recovery after mobile disconnect');
}


/* PLUX V28 direct APK and ZIP mirrors for Samsung downloads. We mirror the
 * verified GitHub Release asset to our Render static host, avoiding the
 * browser redirect chain that blocked earlier downloads.
 */
{
 const assetUrl='https://github.com/zykinigor55-a11y/forma-visual/releases/download/plux-android-v28-20261110/PLUX-Android.apk';
 const name='PLUX-Android-V28.apk',target=join(root,name);
 let ready=false;
 for(let attempt=0;attempt<3&&!ready;attempt++){
  try{
   const response=await fetch(assetUrl,{redirect:'follow',headers:{'Accept':'application/octet-stream','User-Agent':'PLUX-Android-v28/1.0'},signal:AbortSignal.timeout(50000)});
   if(!response.ok)throw Error('Release APK unavailable: '+response.status);
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length<2_000_000||data.length>18_000_000||data[0]!==0x50||data[1]!==0x4b)
    throw Error('Invalid Android APK binary');
   writeFileSync(target,data);
   // Create a normal uncompressed ZIP containing one intact APK. This download
   // format is easier for some mobile browsers than application/vnd.android.package-archive.
   const entry=Buffer.from(name,'utf8');
   let crc=0xffffffff;
   for(const byte of data){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
   }
   crc=(crc^0xffffffff)>>>0;
   const local=Buffer.alloc(30+entry.length);
   local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
   local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);
   local.writeUInt16LE(entry.length,26);entry.copy(local,30);
   const central=Buffer.alloc(46+entry.length);
   central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
   central.writeUInt32LE(crc,16);central.writeUInt32LE(data.length,20);central.writeUInt32LE(data.length,24);
   central.writeUInt16LE(entry.length,28);entry.copy(central,46);
   const end=Buffer.alloc(22);
   end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
   end.writeUInt32LE(central.length,12);end.writeUInt32LE(local.length+data.length,16);
   writeFileSync(join(root,'PLUX-Android-V28.zip'),Buffer.concat([local,data,central,end]));
   ready=true;
   console.log('PLUX V28 APK + ZIP mirror published, verified payload:',data.length,'bytes');
  }catch(error){
   console.warn('PLUX V28 download mirror attempt '+(attempt+1)+': '+String(error.message||error).slice(0,180));
  }
 }
 const installHtml='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#020d0b"><title>Установить ПЛЮХ V28</title><style>body{background:#020b0d;color:#f5fff9;min-height:100dvh;margin:0;padding:20px;box-sizing:border-box;display:grid;place-items:center;font:16px/1.5 system-ui}main{width:min(470px,100%);padding:27px 22px;border-radius:25px;border:1px solid #42876c;background:linear-gradient(140deg,#114233,#040f12 70%);box-shadow:0 0 40px #206f4c35}h1{margin:0;font-size:27px}p,small{color:#beddd0}a{display:block;text-align:center;padding:15px;margin-top:14px;color:#f2fff8;border-radius:16px;border:1px solid #8aefc5;background:linear-gradient(145deg,#185a45,#09241f);font-weight:700;text-decoration:none}small{font-size:12px;display:block;margin-top:18px}</style></head><body><main><h1>ПЛЮХ V28</h1><p>Скачать и установить приложение на Android.</p><a href="/PLUX-Android-V28.apk" download>Скачать APK</a><a href="/PLUX-Android-V28.zip" download>Скачать ZIP (запасной вариант)</a><a href="'+assetUrl+'">Скачать с GitHub</a><small>Открой страницу через Chrome или Яндекс Браузер. ZIP нужно распаковать через «Мои файлы». Не удаляй предыдущую версию, пока не сохранишь файлы галереи.</small></main></body></html>';
 writeFileSync(join(root,'install-android.html'),installHtml);
 if(!ready)console.warn('PLUX V28 mirror pending release; only GitHub fallback is available in install page.');
}


/* PLUX V29: progressive chat typing with the original V12.5 optional typing
 * sound. Image and PDF generation still use the V28 background job path.
 * This web update is delivered to all existing Android wrappers via Render.
 */
{
 const cssSource=join('plux-v29-overlay','plux-chat-typing-v29.css');
 if(statSync(cssSource).size<900)throw Error('PLUX V29 glass typing CSS missing');
 writeFileSync(join(root,'plux-chat-typing-v29.css'),readFileSync(cssSource));
 const htmlPath=join(root,'index.html');
 let html=readFileSync(htmlPath,'utf8');
 if(!html.includes('plux-release-v28'))throw Error('PLUX V28 prerequisite required');
 html=html.replace('</head>','<meta name="plux-release-v29" content="streaming-chat-typing-original-glass-sound"><link rel="stylesheet" href="/plux-chat-typing-v29.css?v=2901"></head>');
 html=html.replace(/\/plux-chat-v128\.js\?v=\d+/g,'/plux-chat-v128.js?v=2901');
 writeFileSync(htmlPath,html);
 const workerPath=join(root,'sw.js');
 let worker=readFileSync(workerPath,'utf8').replace(/plux-emerald-v\d+/g,'plux-emerald-v2901');
 if(!worker.includes("'/plux-chat-typing-v29.css'")){
   if(!worker.includes("'/plux-chat-v128.js'"))throw Error('Chat script missing from service worker');
   worker=worker.replace("'/plux-chat-v128.js'","'/plux-chat-v128.js','/plux-chat-typing-v29.css'");
 }
 writeFileSync(workerPath,worker);
 plux123Exec(process.execPath,['--check',join(root,'plux-chat-v128.js')],{stdio:'inherit'});
 if(!html.includes('/plux-chat-v128.js?v=2901'))throw Error('PLUX V29 chat script not included');
 console.log('PLUX V29: gradual text appearance and original optional keyboard glass sound ready');
}
