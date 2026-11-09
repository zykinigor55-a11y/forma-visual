/** PLUX V11 reference-first buttons: preserve videos/voice/events, change only final skin. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2]||'plux-published',file=join(dir,'index.html');
let html=readFileSync(file,'utf8');
if(!html.includes('crystal-depth-v109.css'))throw Error('V11 requires V10.9 source');
if(!html.includes('app.js?v=109'))throw Error('Unexpected PLUX entrypoint');
if(html.includes('reference-glass-v11.css'))throw Error('V11 already patched');
html=html.replace('</head>','<meta name="plux-release-v11" content="reference-glass"><link rel="stylesheet" href="/reference-glass-v11.css?v=110"></head>');
html=html.replace('app.js?v=109','app.js?v=110');
writeFileSync(file,html);
const css=readFileSync(join(dir,'reference-glass-v11.css'),'utf8');
for(const s of ['glass-keyboard.png','glass-camera.png','glass-mic.png','nav-shell.png']){
 if(!css.includes(s))throw Error('Missing glass skin '+s);
}
console.log('PLUX V11: source-glass skins, single dock, original five videos, ASMR preserved');
