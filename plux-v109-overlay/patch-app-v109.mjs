/** PLUX V10.9 is a visual overlay on V10.8; preserve every existing handler/video/audio. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2]||'plux-published',path=join(dir,'index.html');
let html=readFileSync(path,'utf8');
if(!html.includes('crystal-vessels-v108.css'))throw Error('Missing V10.8 base');
if(!html.includes('app.js?v=108'))throw Error('Unexpected app version');
if(html.includes('crystal-depth-v109.css'))throw Error('V10.9 already patched');
html=html.replace('</head>','<meta name="plux-release-v109" content="crystal-depth"><link rel="stylesheet" href="/crystal-depth-v109.css?v=109"></head>');
html=html.replace('</body>','<script src="/crystal-depth-v109.js?v=109"></script></body>');
html=html.replace('app.js?v=108','app.js?v=109');
writeFileSync(path,html);
for(const name of ['crystal-depth-v109.js','crystal-depth-v109.css']){
 if(readFileSync(join(dir,name),'utf8').length<1000)throw Error('Invalid '+name);
}
console.log('PLUX V10.9 CRYSTAL DEPTH: refraction shells, thick walls, live mic light; V10.8 functionality retained');
