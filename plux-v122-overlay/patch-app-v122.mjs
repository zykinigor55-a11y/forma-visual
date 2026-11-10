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
p130=p130.replace(/(<meta name="plux-version" content=")[^"]+/,'$113.0');
writeFileSync(v130html,p130);
const v130sw=join(root,'sw.js');
let p130sw=readFileSync(v130sw,'utf8').replace(/plux-emerald-v12\\d+/g,'plux-emerald-v130');
if(!p130sw.includes("'/plux-v130.css'"))p130sw=p130sw.replace("'/plux-v129.js'","'/plux-v129.js','/plux-v130.css'");
writeFileSync(v130sw,p130sw);
console.log('PLUX V13.0 hidden fake status/chrome, logo subtitle removed, gallery drift restored');
