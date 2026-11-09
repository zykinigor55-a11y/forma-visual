/** PLUX V11.1: apply after V11 reference glass; keep routing/audio/media unchanged. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2]||'plux-published';
const htmlPath=join(dir,'index.html');
let html=readFileSync(htmlPath,'utf8');
if(!html.includes('reference-glass-v11.css'))throw Error('Missing V11 reference base');
if(!html.includes('app.js?v=110'))throw Error('Unexpected V11 JS entrypoint');
if(html.includes('balance-modes-v111'))throw Error('V11.1 already installed');
html=html.replace('</head>','<meta name="plux-version-v111" content="balance-liquid-modes"><link rel="stylesheet" href="/balance-modes-v111.css?v=111"></head>');
html=html.replace('</body>','<script src="/balance-modes-v111.js?v=111"></script></body>');
writeFileSync(htmlPath,html);
const cssPath=join(dir,'balance-modes-v111.css');
writeFileSync(cssPath,readFileSync(cssPath,'utf8')+'\n#prefs{max-height:calc(100dvh - 34px);overflow-y:auto;overscroll-behavior:contain}\n');
const code=readFileSync(join(dir,'balance-modes-v111.js'),'utf8');
if(!code.includes('Баланс PLUX')||!code.includes('mode-picking'))throw Error('New controls missing');
console.log('PLUX V11.1: profile demo credits, liquid modes, spring selections installed without billing or API calls');
