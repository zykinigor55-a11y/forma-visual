/* PLUX V31: additive features, the approved V30-derived layout is never replaced. */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.argv[2]||'plux-published');
const htmlFile=join(root,'index.html');
if(!existsSync(htmlFile))throw Error('PLUX page missing');
const files=['music-player-v31.js','music-player-v31.css'];
for(const file of files){
 const src=join(here,file);
 if(!existsSync(src))throw Error('Missing V31 file: '+file);
 copyFileSync(src,join(root,file));
}
let html=readFileSync(htmlFile,'utf8');
if(!html.includes('id="speech-button"')||!html.includes('class="bottom-nav"'))
 throw Error('Original approved V30 layout changed; stop rather than overwrite');
if(!html.includes('music-player-v31.css'))
 html=html.replace('</head>','<link rel="stylesheet" href="/music-player-v31.css?v=3102"></head>');
if(!html.includes('music-player-v31.js'))
 html=html.replace('</body>','<script defer src="/music-player-v31.js?v=3102"></script></body>');
writeFileSync(htmlFile,html);
console.log('PLUX V31: V30 original navigation intact, friends in fifth tab, music player linked.');
