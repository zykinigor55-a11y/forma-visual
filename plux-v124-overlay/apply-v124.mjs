/** Install PLUX V12.4 Motion System over the complete V12.3 public/ directory. */
import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2] || 'public';
const here=new URL('./',import.meta.url).pathname;
for(const file of ['plux-motion-v124.js','plux-motion-v124.css','plux-typewriter-v124.js']){
 copyFileSync(join(here,file),join(root,file));
}
const page=join(root,'index.html');
let html=readFileSync(page,'utf8');
if(!html.includes('plux-release-v123'))throw Error('V12.3 source required');
if(html.includes('plux-release-v124')){console.log('Already installed V12.4');process.exit(0)}
const welcomeFile=join(root,'onboard-cinematic-v116.js');
let welcome=readFileSync(welcomeFile,'utf8');
const marker='  void typeScript();';
if(!welcome.includes(marker))throw Error('Onboarding typewriter launch point missing');
welcome=welcome.replace(marker, `  // V12.4 start when route is truly visible.
  let introStarted=false;
  const startWhenVisible=()=>{if(introStarted||screen.hidden||document.hidden||cancelled)return;introStarted=true;void typeScript();};
  new MutationObserver(startWhenVisible).observe(screen,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',startWhenVisible);
  requestAnimationFrame(startWhenVisible);`);
writeFileSync(welcomeFile,welcome);
html=html.replace('<script src="/seamless-v106.js?v=106"></script>','<script src="/seamless-v106.js?v=106"></script><script src="/plux-motion-v124.js?v=124"></script>');
html=html.replace('</head>','<meta name="plux-release-v124" content="video-motion-and-typewriter"><link rel="stylesheet" href="/plux-motion-v124.css?v=124"></head>');
html=html.replace('</body>','<script src="/plux-typewriter-v124.js?v=124" defer></script></body>');
writeFileSync(page,html);
console.log('PLUX V12.4 Motion System installed');