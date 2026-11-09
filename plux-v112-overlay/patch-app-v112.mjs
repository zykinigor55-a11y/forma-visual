/** PLUX V11.2: start with clean V10.7 video scene — deliberately do NOT load the
 * V10.8/V10.9/V11 optical overlays that caused white duplicated frames. */
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published';
const file=join(root,'index.html');
let html=readFileSync(file,'utf8');
if(!html.includes('app.js?v=107')||!html.includes('aurora-v107.css'))throw Error('Expected clean PLUX V10.7 base');
for(const banned of ['crystal-vessels-v108.css','crystal-depth-v109.css','reference-glass-v11.css']){
 if(html.includes(banned))throw Error('Conflicting glass overlay found: '+banned);
}
html=html.replace('</head>','<meta name="plux-release" content="11.2-single-reference-glass">'+
 '<link rel="stylesheet" href="/balance-modes-v111.css?v=112">'+
 '<link rel="stylesheet" href="/reference-exact-v112.css?v=112"></head>');
html=html.replace('</body>','<script src="/balance-modes-v111.js?v=112"></script>'+
 '<script src="/reference-exact-v112.js?v=112"></script></body>');
html=html.replace('app.js?v=107','app.js?v=112');
writeFileSync(file,html);
for(const filename of ['reference-exact-v112.css','reference-exact-v112.js','balance-modes-v111.css','balance-modes-v111.js']){
 if(readFileSync(join(root,filename),'utf8').length<400)throw Error('Missing/short '+filename);
}
console.log('PLUX V11.2: ONE glass skin, NO V10.8/V10.9 wrappers; original 5 videos + profile balance + modes retained');
