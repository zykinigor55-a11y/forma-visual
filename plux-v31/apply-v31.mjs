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
 ['plux-v31/intro-asmr-v313.js','intro-asmr-v313.js'],
 ['plux-v31/home-fix-v314.css','home-fix-v314.css'],
 ['plux-v31/quick-orbs-v314.js','quick-orbs-v314.js'],
 ['plux-v31/oled-v315.css','oled-v315.css'],
 ['plux-v31/mascot-fullscreen-v316.css','mascot-fullscreen-v316.css'],
 ['plux-v31/microphone-permission-v318.js','microphone-permission-v318.js'],
 ['plux-v31/microdust-enhanced-v318.js','microdust-enhanced-v318.js'],
 ['plux-v31/microdust-enhanced-v318.css','microdust-enhanced-v318.css'],
 ['plux-v31/theme-motion-v318.css','theme-motion-v318.css'],
 ['plux-v31/ai-cognition-v318.js','ai-cognition-v318.js'],
 ['plux-v31/ai-cognition-v318.css','ai-cognition-v318.css'],
 ['plux-v31/video-hub-v318.js','video-hub-v318.js'],
 ['plux-v31/video-hub-v318.css','video-hub-v318.css']
];
for(const [src,dest]of modules){
 if(!existsSync(src))throw Error('V30/V31 dependency missing: '+src);
 copyFileSync(src,join(root,dest));
}
let html=readFileSync(htmlFile,'utf8');
if(!html.includes('id="speech-button"')||!html.includes('class="bottom-nav"'))
 throw Error('Original approved V30 layout changed; stop rather than overwrite');
const styles=['plux-themes-v23.css','plux-gallery-v24.css','plux-music-v24.css',
 'plux-v25-style.css','plux-v26.css','plux-v30.css','music-player-v31.css','drop-colors-v31.css','home-contrast-v313.css','home-fix-v314.css','oled-v315.css','mascot-fullscreen-v316.css','theme-motion-v318.css','microdust-enhanced-v318.css','ai-cognition-v318.css','video-hub-v318.css'];
const scripts=['plux-gallery-v24.js','plux-music-v24.js','plux-modes-v26.js',
 'plux-v26-images.js','tools-v30-bridge-v31.js','plux-themes-v31.js','drop-colors-v31.js','music-player-v31.js','intro-asmr-v313.js','quick-orbs-v314.js','microphone-permission-v318.js','microdust-enhanced-v318.js','ai-cognition-v318.js','video-hub-v318.js'];
for(const file of styles){
 if(!html.includes('/'+file))html=html.replace('</head>',`<link rel="stylesheet" href="/${file}?v=3182"></head>`);
}
for(const file of scripts){
 if(!html.includes('/'+file))html=html.replace('</body>',`<script defer src="/${file}?v=3182"></script></body>`);
}
if(!html.includes('name="theme-color"'))html=html.replace('</head>','<meta name="theme-color" content="#000000"></head>');
if(!html.includes('plux-release-v31'))html=html.replace('</head>',
 '<meta name="plux-release-v31" content="V30-fullscreen-mascot-8-themes-friends-asmr-glass-orbs-OLED"></head>');
writeFileSync(htmlFile,html);
console.log('PLUX V31.8 OLED: original V31.7 + video, avatars, cognition, particles and microphone permission.');
