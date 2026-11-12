/* PLUX v17: optional-compatible rendering features on top of approved build.
 * Does not alter the base HTML screen layout or main app's original modules.
 */
import {existsSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dest=process.argv[2]||'plux-published';
const files=[
 ['plux-v129-overlay/plux-v129.css','plux-v129.css'],
 ['plux-v129-overlay/plux-v129.js','plux-v129.js'],
 ['plux-v16-overlay/plux-video-v16.css','plux-video-v16.css'],
 ['plux-v16-overlay/plux-video-v16.js','plux-video-v16.js'],
 ['plux-v17-friends/plux-save-v17.js','plux-save-v17.js']
];
for(const [from,to]of files){
 if(!existsSync(from))throw Error('Missing build dependency '+from);
 copyFileSync(from,join(dest,to));
}
const indexPath=join(dest,'index.html');
let html=readFileSync(indexPath,'utf8');
const check=html.includes('id="screen-modes"')&&html.includes('id="screen-create"')
  &&html.includes('id="create-art-button"')&&html.includes('id="screen-chat"');
if(!check)throw Error('PLUX original screen contract changed. Refuse to patch unexpectedly.');
const styles=['plux-v129.css','plux-video-v16.css'];
const scripts=['plux-save-v17.js','plux-v129.js','plux-video-v16.js'];
for(const f of styles){
 if(!html.includes('/'+f))html=html.replace('</head>', '<link rel="stylesheet" href="/'+f+'?v=3185"></head>');
}
for(const f of scripts){
 if(!html.includes('/'+f))html=html.replace('</body>', '<script defer src="/'+f+'?v=3185"></script></body>');
}
writeFileSync(indexPath,html);
console.log('PLUX v17 image & video modules: installed. Existing design unchanged.');
