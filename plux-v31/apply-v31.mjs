/* PLUX V31: additive features, the approved V30-derived layout is never replaced. */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.argv[2]||'plux-published');
const htmlFile=join(root,'index.html');
if(!existsSync(htmlFile))throw Error('PLUX page missing');
// Restore the exact V30 six-card tools, gallery, music and theme dependencies
// in the same order as the approved original. Do not rebuild card DOM.
const modules=[
 ['plux-v23-overlay/plux-themes-v23.css','plux-themes-v23.css'],
 ['plux-v24-overlay/plux-gallery-v24.css','plux-gallery-v24.css'],
 ['plux-v24-overlay/plux-music-v24.css','plux-music-v24.css'],
 ['plux-v24-overlay/plux-gallery-v24.js','plux-gallery-v24.js'],
 ['plux-v24-overlay/plux-music-v24.js','plux-music-v24.js'],
 ['plux-v25-overlay/plux-v25-style.css','plux-v25-style.css'],
 ['plux-v26-overlay/plux-v26.css','plux-v26.css'],
 ['plux-v26-overlay/plux-modes-v26.js','plux-modes-v26.js'],
 ['plux-v26-overlay/plux-v26-images.js','plux-v26-images.js'],
 ['plux-v30-overlay/plux-v30.css','plux-v30.css'],
 ['plux-v31/tools-v30-bridge-v31.js','tools-v30-bridge-v31.js'],
 ['plux-v31/plux-themes-v31.js','plux-themes-v31.js'],
 ['plux-v31/music-player-v31.js','music-player-v31.js'],
 ['plux-v31/music-player-v31.css','music-player-v31.css'],
 ['plux-v31/drop-colors-v31.js','drop-colors-v31.js'],
 ['plux-v31/drop-colors-v31.css','drop-colors-v31.css'],
 ['plux-v31/home-contrast-v313.css','home-contrast-v313.css'],
 ['plux-v31/intro-asmr-v313.js','intro-asmr-v313.js']
];
for(const [src,dest]of modules){
 if(!existsSync(src))throw Error('V30/V31 dependency missing: '+src);
 copyFileSync(src,join(root,dest));
}
let html=readFileSync(htmlFile,'utf8');
if(!html.includes('id="speech-button"')||!html.includes('class="bottom-nav"'))
 throw Error('Original approved V30 layout changed; stop rather than overwrite');
const styles=['plux-themes-v23.css','plux-gallery-v24.css','plux-music-v24.css',
 'plux-v25-style.css','plux-v26.css','plux-v30.css','music-player-v31.css','drop-colors-v31.css','home-contrast-v313.css'];
const scripts=['plux-gallery-v24.js','plux-music-v24.js','plux-modes-v26.js',
 'plux-v26-images.js','tools-v30-bridge-v31.js','plux-themes-v31.js','drop-colors-v31.js','music-player-v31.js','intro-asmr-v313.js'];
for(const file of styles){
 if(!html.includes('/'+file))html=html.replace('</head>',`<link rel="stylesheet" href="/${file}?v=3132"></head>`);
}
for(const file of scripts){
 if(!html.includes('/'+file))html=html.replace('</body>',`<script defer src="/${file}?v=3132"></script></body>`);
}
if(!html.includes('plux-release-v31'))html=html.replace('</head>',
 '<meta name="plux-release-v31" content="V30-six-tools-eight-accurate-colors-friends-home-contrast-asmr"></head>');
writeFileSync(htmlFile,html);
console.log('PLUX V31.3: V30 tools and Friends preserved; Home centered, contrast background and ASMR greeting installed.');
