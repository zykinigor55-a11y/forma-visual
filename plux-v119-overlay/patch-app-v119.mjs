/** PLUX V11.9: additive visual patch onto the verified V11.7 deploy. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'plux-published';
const file=join(root,'index.html');
let html=readFileSync(file,'utf8');
if(!html.includes('oled-cinema-v117.css')||!html.includes('app.js'))throw Error('Expected PLUX OLED V11.7 base');
if(html.includes('crystal-system-v119.css'))throw Error('V11.9 already installed');
for(const name of ['crystal-system-v119.css','crystal-system-v119.js']){
 if(statSync(join(root,name)).size<1000)throw Error('Missing '+name);
}
html=html.replace('</head>','<meta name="plux-release-v119" content="approved-black-crystal">'+
 '<meta name="mobile-web-app-capable" content="yes">'+
 '<link rel="manifest" href="/manifest.webmanifest">'+
 '<link rel="stylesheet" href="/crystal-system-v119.css?v=119"></head>');
html=html.replace('</body>','<script src="/crystal-system-v119.js?v=119"></script></body>');
writeFileSync(file,html);
writeFileSync(join(root,'manifest.webmanifest'),JSON.stringify({
 name:'PLUX — твой AI-друг',
 short_name:'PLUX',lang:'ru',start_url:'/',scope:'/',display:'standalone',
 background_color:'#000000',theme_color:'#000000',
 description:'PLUX — живой AI-друг с голосом, чатом и творческими режимами',
 icons:[
  {src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
  {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
 ]
},null,2));
console.log('PLUX V11.9 approved crystal buttons installed; PWA manifest created; existing apps and videos preserved');
