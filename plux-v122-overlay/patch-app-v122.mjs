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
