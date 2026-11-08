/** PLUX V10.8 overlay applied after V10.6 and V10.7 build patches. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2]||'plux-published';
const path=join(dir,'index.html'),source=readFileSync(path,'utf8');
if(!source.includes('/aurora-v107.css?v=107'))throw Error('PLUX V10.7 base not found');
if(!source.includes('seamless-v106.js'))throw Error('PLUX video controller missing');
if(source.includes('crystal-vessels-v108.css'))throw Error('PLUX V10.8 already installed');
const html=source
 .replace('</head>','<meta name="plux-release-v108" content="crystal-vessels"><link rel="stylesheet" href="/crystal-vessels-v108.css?v=108"></head>')
 .replace('</body>','<script src="/crystal-vessels-v108.js?v=108"></script></body>')
 .replace('app.js?v=107','app.js?v=108');
writeFileSync(path,html);
console.log('PLUX V10.8 crystal vessel glass installed; five videos, navigation and ASMR unchanged');
