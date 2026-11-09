/** PLUX V12.1 · preserve original navigation, mount reference-matched animated tools menu. */
import {readFileSync, writeFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published';
const page=join(root,'index.html');
let html=readFileSync(page,'utf8');
if(!html.includes('reference-restored-v120.css'))throw Error('V12.0 reference-restored base required');
if(html.includes('crystal-system-v119'))throw Error('Conflicting V11.9 optical overlay detected');
if(html.includes('reference-motion-v121.css'))throw Error('V12.1 already installed');
for(const [name,min] of [['reference-motion-v121.css',8000],['reference-motion-v121.js',1200],['assets/modes-reference-atlas-v121.webp',18000]]){
 if(statSync(join(root,name)).size<min)throw Error('V12.1 asset too small: '+name);
}
html=html.replace('</head>','<meta name="plux-release-v121" content="approved-animated-tools"><link rel="stylesheet" href="/reference-motion-v121.css?v=121"></head>');
html=html.replace('</body>','<script src="/reference-motion-v121.js?v=121"></script></body>');
writeFileSync(page,html);
console.log('PLUX 12.1: reference atlas, living-tools dock, 6 animated tiles, navigation unchanged.');