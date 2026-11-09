/** PLUX V12.0 — published from the proven OLED V11.7 base, NOT the broken V11.9 layer. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published',page=join(root,'index.html');
let html=readFileSync(page,'utf8');
if(!html.includes('oled-cinema-v117.css')||!html.includes('app.js'))throw Error('V11.7 base not found');
if(html.includes('crystal-system-v119'))throw Error('Bad V11.9 global skin still present');
if(statSync(join(root,'reference-restored-v120.css')).size<1000)throw Error('Reference CSS missing');
html=html.replace('</head>','<meta name="plux-release-v120" content="reference-restored-icons-aligned"><meta name="theme-color" content="#000000"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/reference-restored-v120.css?v=120"></head>');
writeFileSync(page,html);
writeFileSync(join(root,'manifest.webmanifest'),JSON.stringify({name:'PLUX — твой AI-друг',short_name:'PLUX',lang:'ru',start_url:'/',scope:'/',display:'standalone',background_color:'#000000',theme_color:'#000000',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,2));
console.log('PLUX V12 reference lock installed; V11.9 duplicate icon/layout rules absent');
