/** PLUX V11.4 — compatible with V11.3 local archive and Render build naming. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published';
const htmlFile=join(root,'index.html');
let html=readFileSync(htmlFile,'utf8');
if(!html.includes('liquid-metal-v113.css') || !(html.includes('chat-v105.js') || html.includes('chat-glass-v105.js')))throw Error('PLUX V11.3 chat or style base missing');
if(html.includes('touch-life-v114.css'))throw Error('V11.4 already installed');
for(const file of ['touch-life-v114.css','touch-life-v114.js']){
 if(statSync(join(root,file)).size<400)throw Error('Missing V11.4 asset '+file);
}
html=html.replace('</head>','<meta name="plux-version-v114" content="chat-avatar-touch-life"><link rel="stylesheet" href="/touch-life-v114.css?v=114"></head>');
html=html.replace('</body>','<script src="/touch-life-v114.js?v=114"></script></body>');
writeFileSync(htmlFile,html);
console.log('PLUX V11.4: larger live chat avatars, finger-only glow, animated microphone and greeting; all previous features preserved');
