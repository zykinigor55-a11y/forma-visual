/* DOM.RENDER premium card artwork v40: purpose-made scalable SVG thumbnails.
 * Dark studio product artwork for cameras/lenses; architectural diagrams for
 * moves; one invariant building with six different color treatments. */
(function(root){
'use strict';
const X=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const gradients=`<defs>
 <linearGradient id="back" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0c1719"/><stop offset=".52" stop-color="#1e292a"/><stop offset="1" stop-color="#0b1214"/></linearGradient>
 <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#637074"/><stop offset=".17" stop-color="#303b40"/><stop offset=".55" stop-color="#111719"/><stop offset=".83" stop-color="#263136"/><stop offset="1" stop-color="#0b1012"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#142c32"/><stop offset=".24" stop-color="#45676a"/><stop offset=".47" stop-color="#122328"/><stop offset=".71" stop-color="#0c1c20"/><stop offset=".89" stop-color="#345657"/><stop offset="1" stop-color="#0c171a"/></linearGradient>
 <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#101719"/><stop offset=".13" stop-color="#647176"/><stop offset=".28" stop-color="#141c1f"/><stop offset=".71" stop-color="#303d41"/><stop offset=".9" stop-color="#12191b"/><stop offset="1" stop-color="#6b767a"/></linearGradient>
 <radialGradient id="halo"><stop stop-color="#668d75" stop-opacity=".35"/><stop offset=".6" stop-color="#2c5346" stop-opacity=".08"/><stop offset="1" stop-color="#132421" stop-opacity="0"/></radialGradient>
 <filter id="shadow"><feGaussianBlur stdDeviation="11"/></filter>
 </defs>`;
function wrap(body,opts={}){
 const bg=opts.bg||`<rect width="540" height="330" rx="22" fill="url(#back)"/><ellipse cx="280" cy="155" rx="248" ry="160" fill="url(#halo)"/><path d="M25 275 H515" stroke="#789287" stroke-opacity=".11"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 330" width="540" height="330" role="img" aria-label="${X(opts.label||'Cinematic preview')}">${gradients}${bg}${body}</svg>`;
}
function lensRings(x,y,rx,ry,flared=false){
 const bw=flared?18:12;
 return `<ellipse cx="${x}" cy="${y}" rx="${rx+bw}" ry="${ry+bw}" fill="#101719" stroke="#707e7e" stroke-width="2.2"/>
 <ellipse cx="${x}" cy="${y}" rx="${rx+4}" ry="${ry+4}" fill="#1a2428" stroke="#343d41" stroke-width="8"/>
 <ellipse cx="${x}" cy="${y}" rx="${rx-6}" ry="${ry-6}" fill="url(#glass)" stroke="#89a6a0" stroke-opacity=".35" stroke-width="2"/>
 <ellipse cx="${x-8}" cy="${y-8}" rx="${Math.max(rx*.28,12)}" ry="${Math.max(ry*.28,12)}" fill="#102025" opacity=".6"/>
 <path d="M${x-rx*.47} ${y-ry*.56} Q${x-rx*.15} ${y-ry*.88} ${x+rx*.2} ${y-ry*.65}" stroke="#c6ebe1" stroke-opacity=".54" stroke-width="5" stroke-linecap="round" fill="none"/>
 <path d="M${x+rx*.18} ${y+ry*.51} Q${x+rx*.55} ${y+ry*.34} ${x+rx*.65} ${y+ry*.12}" stroke="#5a938b" stroke-opacity=".26" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}
function camera(id){
 const opts={
  alexa35:{type:'cine',body:195,bias:0},
  venice2:{type:'cine',body:183,bias:1},
  vraptor:{type:'cine',body:148,bias:2},
  ursa:{type:'cine',body:202,bias:3},
  c400:{type:'mid',body:148,bias:4},
  fx6:{type:'mid',body:137,bias:5},
  ronin4d:{type:'gimbal',body:143,bias:6},
  s1h:{type:'dslr',body:138,bias:7}
 };
 const s=opts[id]||opts.alexa35;
 const cx=s.type==='dslr'?307:318, cy=179;
 const casing=s.type==='dslr'?
 `<path d="M166 150h33l14-26h91l12 26h38v116H165z" fill="url(#body)" stroke="#7f8d90" stroke-opacity=".68" stroke-width="2.5" />
 <path d="M212 125h85l8 22h-100z" fill="#1b2528"/><rect x="179" y="164" width="23" height="18" rx="3" fill="#29353a"/>`:
 `<path d="M132 133l${s.body} 0 23 25v107H130z" fill="url(#body)" stroke="#657578" stroke-width="2.5"/>
 <path d="M135 133l22-12h${s.body+108}l20 12z" fill="#334044" stroke="#738183" stroke-opacity=".5"/>
 <path d="M148 154h120v80H148z" rx="4" fill="#0e171a" stroke="#56656b" stroke-opacity=".5"/>
 <path d="M156 164h${s.body*0.5} M156 177h${s.body*.56} M156 190h${s.body*.45}" stroke="#627275" stroke-width="2.2" stroke-opacity=".65" />
 <rect x="142" y="246" width="100" height="8" rx="3" fill="#4c595c" opacity=".45"/>`;
 const handle=s.type==='dslr'?'':`<path d="M167 126v-28h111v28 M176 102h105" stroke="#39484b" stroke-width="14" fill="none" stroke-linejoin="round"/><path d="M173 100h98" stroke="#6c7d7c" stroke-width="2.5"/><rect x="155" y="109" width="31" height="14" rx="3" fill="#111c1f"/>`;
 const bottom=`<rect x="191" y="263" width="101" height="8" rx="3" fill="#212c30" stroke="#4c5b5c"/><path d="M204 271l-9 11h88l-8-11" fill="#121c1e"/>`;
 const gimbal=s.type==='gimbal'? `<path d="M127 133v-16m0 0 23-17m130 1 19 17 10 60" fill="none" stroke="#5e6d71" stroke-width="13" stroke-linecap="round"/><path d="M133 116h-20v160m0 0 30 9" stroke="#374c52" stroke-width="10" stroke-linecap="round" fill="none"/>`:'';
 const front=`<path d="M${cx-35} 140h62l37 16v99l-37 9h-62z" fill="url(#metal)" stroke="#576466" stroke-width="2"/><ellipse cx="${cx+45}" cy="${cy+23}" rx="57" ry="67" fill="#11191c" stroke="#4b5c62" stroke-width="7"/>${lensRings(cx+49,cy+23,43,54,s.bias===2)}`;
 const tiny=`<circle cx="150" cy="145" r="3" fill="#a6bdb0" opacity=".55"/><circle cx="160" cy="145" r="3" fill="#a6bdb0" opacity=".55"/><rect x="171" y="239" width="26" height="4" rx="2" fill="#8ca394" opacity=".55"/>`;
 const floor=`<ellipse cx="269" cy="286" rx="192" ry="18" fill="#000" opacity=".46" filter="url(#shadow)"/>`;
 return wrap(floor+gimbal+handle+casing+bottom+tiny+front,{label:id+' premium cinema camera'});
}
function lens(id){
 const data={
  ultra14:[110,77,54,1.2],shift17:[142,69,50,1.0],shift24:[141,64,48,1.1],
  cine24:[138,64,47,1],cine35:[159,61,48,1],cine50:[185,60,48,1],
  portrait85:[218,57,49,.9],macro100:[238,52,46,.85],tele135:[256,53,45,.78],ana40:[204,70,43,1.5]
 };
 const [len,rx,ry,flare]=data[id]||data.cine50;
 const left=350-len,centerY=177;
 let ridges='';
 for(let i=0;i<6;i++){let x=left+Math.round(len*(.16+i*.095));ridges+=`<path d="M${x} 118v109" stroke="#738082" stroke-opacity=".33" stroke-width="3"/><path d="M${x+4} 123v99" stroke="#050b0c" stroke-opacity=".7" stroke-width="6"/>`;}
 const body=`<ellipse cx="266" cy="278" rx="194" ry="18" fill="#000" opacity=".48" filter="url(#shadow)"/>
 <path d="M${left} 112H340v130H${left}z" fill="url(#metal)" stroke="#637171" stroke-width="2.5"/>
 <path d="M${left} 119H340" stroke="#a1b3ad" stroke-opacity=".28" stroke-width="3"/>
 <path d="M${left} 235H340" stroke="#020809" stroke-opacity=".8" stroke-width="5"/>
 ${ridges}
 <path d="M${left+len*.3} 115v124" stroke="#83938c" stroke-opacity=".65" stroke-width="2"/>
 <path d="M${left+len*.4} 115v124" stroke="#080e0f" stroke-width="5"/>
 <ellipse cx="340" cy="177" rx="${rx+14}" ry="${ry+24}" fill="#141c20" stroke="#728482" stroke-width="5"/>
 ${lensRings(342,177,rx,ry,flare>1.3)}
 <ellipse cx="${left}" cy="177" rx="19" ry="60" fill="#1b2527" stroke="#7e9290" stroke-opacity=".34"/>
 <path d="M${left+18} 132h30 M${left+18} 220h30" stroke="#a0b1ad" stroke-opacity=".34" stroke-width="2"/>`;
 return wrap(body,{label:id+' camera lens illustration'});
}
const grades={
 neutral:['#6e8e9b','#b0b4a0','#385548','#4b4e4c','#b4a17f','#f5c58e'],
 filmic:['#8c8580','#b5a28a','#4a5149','#434341','#b8a184','#d7b792'],
 contrast:['#3d5d73','#8195a2','#233a32','#282f33','#b8ad95','#fccb87'],
 warm:['#c49a73','#f0c797','#6a6742','#51443c','#caa584','#ffd38e'],
 cool:['#496f83','#b0bdc2','#2f5152','#344650','#9faea4','#d8d8cf'],
 bw:['#888888','#c2c2c2','#464646','#484848','#9c9c9c','#dedede']
};
function buildingScene(grade,mode){
 const palette=grades[grade]||grades.neutral;
 const [sky1,sky2,ground,facade,wall,lit]=palette;
 const sc=`<defs><linearGradient id="sky" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient><linearGradient id="land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${ground}"/><stop offset="1" stop-color="#202e2e"/></linearGradient></defs>
 <rect x="0" y="0" width="540" height="330" fill="url(#sky)"/>
 <path d="M0 211q120-15 239 6t301-16V330H0z" fill="url(#land)"/>
 <path d="M24 218v-91m0 46-19-29m19 10 19-35M497 217V109m0 48 24-35m-24 29-26-34" stroke="${ground}" stroke-width="9" fill="none"/>
 <g fill="${ground}" opacity=".62"><circle cx="32" cy="110" r="48"/><circle cx="3" cy="151" r="49"/><circle cx="487" cy="89" r="57"/><circle cx="539" cy="138" r="45"/></g>
 <ellipse cx="269" cy="270" rx="178" ry="18" fill="#000" opacity=".2"/>
 <path d="M113 137l52-45 220 0 39 41-10 14-299 3z" fill="${facade}" stroke="#aab2ac" stroke-opacity=".7" stroke-width="2"/>
 <path d="M124 148h278v112H124z" fill="${wall}" stroke="#a8b4ae" stroke-opacity=".68" stroke-width="2"/>
 <path d="M125 148h77v113h-77z" fill="${facade}"/>
 <path d="M205 148v112M270 148v112M339 148v112" stroke="#111e24" stroke-opacity=".4" stroke-width="3"/>
 <path d="M219 165h100v73H219z" fill="#17262a" stroke="#96a3a5" stroke-opacity=".76" stroke-width="3"/>
 <path d="M224 170h90v63h-90z" fill="${lit}" opacity=".47"/>
 <path d="M268 169v64" stroke="#1c2e31" stroke-width="4"/>
 <path d="M335 171h46v89h-46z" fill="#101b20" stroke="#9da9a5" stroke-opacity=".8" stroke-width="2"/>
 <path d="M345 178h27v63h-27z" fill="${lit}" opacity=".22"/>
 <path d="M123 260H415l22 13H104z" fill="${facade}" stroke="#b9c1b4" stroke-opacity=".65" stroke-width="2"/>
 <path d="M106 279h336l13 8H95z" fill="${facade}"/>
 <path d="M72 286q100 14 167 10t230-4" stroke="#b8c5a9" stroke-opacity=".4" stroke-width="2" fill="none"/>
 <g opacity=".6" fill="${ground}"><ellipse cx="84" cy="273" rx="33" ry="12"/><ellipse cx="462" cy="266" rx="30" ry="16"/></g>`;
 if(mode==='grade')return sc;
 return sc+`<rect width="540" height="330" fill="#061019" opacity=".23"/>`;
}
function moveArt(id){
 const paths={
  dolly:'<path d="M270 291V240m-14 12 14-15 14 15" />',
  orbit:'<path d="M103 264Q245 327 430 254m-25-6 27 5-13 22" />',
  slider:'<path d="M114 286H418m-15-13 17 13-17 13M131 273l-17 13 17 13" />',
  crane:'<path d="M449 266V108m-12 16 12-18 12 18" />',
  drone:'<path d="M450 100Q384 142 319 220m20-7-22 10 4-23" />',
  walk:'<path d="M186 296Q225 278 279 254m-22-3 23 1-14 19" />',
  tilt:'<path d="M453 270Q474 220 446 160m-9 17 7-20 16 8" />',
  macro:'<path d="M171 209H356m-15-11 16 11-16 11" />'
 };
 const line=paths[id]||paths.dolly;
 const accent=`<g fill="none" stroke="#e0ffe2" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)" opacity=".42">${line}</g><g fill="none" stroke="#d8f8e0" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round">${line}</g>`;
 return wrap(buildingScene('neutral','move')+accent,{bg:'',label:id+' architectural camera trajectory'});
}
function gradeArt(id){return wrap(buildingScene(id,'grade'),{bg:'',label:id+' architectural color grade example'});}
function src(kind,id){
 let svg=kind==='camera'?camera(id):kind==='lens'?lens(id):kind==='motion'?moveArt(id):gradeArt(id);
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
root.DOM_RENDER_ANIMATION_ART={src,camera,lens,moveArt,gradeArt,version:40};
})(window);
