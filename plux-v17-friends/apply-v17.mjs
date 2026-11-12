/** Integrate PLUX Friends V17 into an existing PLUX static build.
 * Usage: node plux-v17-friends/apply-v17.mjs plux-published
 * Safe: the live version is unchanged until a Render deploy explicitly runs this.
 * Only publishable project keys are embedded; never service_role.
 */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.argv[2]||'plux-published');
const htmlFile=join(root,'index.html');
if(!existsSync(htmlFile))throw Error('PLUX index.html not found: '+htmlFile);
const assets=['plux-friends-v17.js','plux-friends-v17.css','plux-create-v17.css','plux-microdust-v17.js','plux-microdust-v17.css'];
for(const file of assets){const source=join(here,file);if(existsSync(source))copyFileSync(source,join(root,file));}
const base=String(process.env.PLUX_FRIENDS_SUPABASE_URL||'').trim();
const key=String(process.env.PLUX_FRIENDS_SUPABASE_PUBLISHABLE_KEY||'').trim();
const okay=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base)&&/^(sb_publishable_|eyJ)/.test(key);
const config=okay?{url:base,anonKey:key}:{};
writeFileSync(join(root,'plux-friends-config-v17.js'),
  'window.PLUX_FRIENDS_CONFIG='+JSON.stringify(config).replace(/</g,'\\u003c')+';\n');
let html=readFileSync(htmlFile,'utf8');
if(!html.includes('plux-friends-v17.css')){
 html=html.replace('</head>',
  '<meta name="plux-friends-v17" content="private-chat-and-friend-requests"><link rel="stylesheet" href="/plux-friends-v17.css?v=3183"><link rel="stylesheet" href="/plux-create-v17.css?v=3183"><link rel="stylesheet" href="/plux-microdust-v17.css?v=3183"></head>');
}
if(!html.includes('plux-friends-v17.js')){
 html=html.replace('</body>',
 '<script src="/plux-friends-config-v17.js?v=3183"></script><script defer src="/plux-friends-v17.js?v=3183"></script><script defer src="/plux-microdust-v17.js?v=3183"></script></body>');
}
writeFileSync(htmlFile,html);
console.log('PLUX Friends V17: UI installed; Supabase configured:',okay);
