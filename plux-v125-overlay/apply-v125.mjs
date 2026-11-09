/** Apply PLUX V12.5 after the installed V12.4 motion+glass patches. */
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2] || 'plux-published';
for(const name of ['plux-v125.js','plux-v125.css']){
  if(statSync(join(root,name)).size<1200)throw Error('Missing PLUX V12.5 resource: '+name);
}
const indexPath=join(root,'index.html');
let html=readFileSync(indexPath,'utf8');
if(!html.includes('plux-release-v124'))throw Error('Expected V12.4 motion system before V12.5');
if(!html.includes('oled-reference-v124.css'))throw Error('Expected V12.4 glass reference before V12.5');
if(!html.includes('plux-release-v125')){
  html=html.replace('</head>', '<meta name="plux-release-v125" content="personal-first-launch-fixed-controls"><link rel="stylesheet" href="/plux-v125.css?v=1253"></head>');
  html=html.replace('</body>', '<script src="/plux-v125.js?v=1253"></script></body>');
}
writeFileSync(indexPath,html);
// Respect the current original sound synthesis, merely add user-settable amplitude.
const sfxPath=join(root,'aurora-sfx-v107.js');
let sound=readFileSync(sfxPath,'utf8');
if(!sound.includes("plux_v125_volume")){
  const levelPattern=/spec\.level\*g\/\(1\+i\*\.9(?:0)?\)/;\n  if(!levelPattern.test(sound))throw Error('Unexpected sound engine: do not replace blindly');
  sound=sound.replace(levelPattern,"spec.level*g*(Math.max(0,Math.min(100,Number(localStorage.getItem('plux_v125_volume')??70)))/100)/(1+i*.90)");
  sound=sound.replace('spec.level*spec.noise*g)',"spec.level*spec.noise*g*(Math.max(0,Math.min(100,Number(localStorage.getItem('plux_v125_volume')??70)))/100))");
  writeFileSync(sfxPath,sound);
}
// New PWA cache; old 12.4 resources must not serve stale icons after rollout.
const swPath=join(root,'sw.js');
let worker=readFileSync(swPath,'utf8');
worker=worker.replace(/plux-emerald-v12\d+/g,'plux-emerald-v125');
if(!worker.includes('plux-v125.css'))worker=worker.replace("'/app.js'", "'/plux-v125.css','/plux-v125.js','/app.js'");
writeFileSync(swPath,worker);
if(!html.includes('plux-v125.js')||!html.includes('plux-v125.css'))throw Error('V12.5 injection failed');
console.log('PLUX V12.5 personal onboarding + centered glass controls + optional sound installed');