/* PLUX V31.8: crisp theme-synced micro-particles in three quick orbs, voice mic and around mascot. */
(()=>{
"use strict";
if(window.PLUXDustV318)return;
const ids=["open-chat-quick","open-voice-quick","open-create-quick"];
const home=document.getElementById("screen-home"),voice=document.getElementById("screen-voice");
const random=i=>{const x=Math.sin(i*74.13+11.22)*12983.211;return x-Math.floor(x)};
function fill(field,count,seed,extra=false){
 for(let i=0;i<count;i++){
  const t=random(seed+i*7),r=.17+.26*Math.sqrt(random(seed*3+i*5));
  const a=t*Math.PI*2;
  const dot=document.createElement("i");
  dot.className=(extra?"plux318-particle-extra":"plux17-microdust-dot")+" plux318-particle";
  dot.style.setProperty("--dust-x",(50+Math.cos(a)*r*100).toFixed(2)+"%");
  dot.style.setProperty("--dust-y",(50+Math.sin(a)*r*100).toFixed(2)+"%");
  dot.style.setProperty("--dust-size",(1.05+random(seed*2+i*19)*2.2).toFixed(2)+"px");
  dot.style.setProperty("--dust-shift",((random(seed*6+i*11)-.5)*14).toFixed(1)+"px");
  dot.style.setProperty("--dust-time",(4.7+random(i*9+seed)*8.3).toFixed(1)+"s");
  dot.style.setProperty("--dust-delay",(-random(i*13+seed)*12).toFixed(1)+"s");
  dot.style.setProperty("--dust-alpha",(.66+random(i*7+seed)*.30).toFixed(2));
  field.append(dot);
 }
}
function orb(id,seed){
 const b=document.getElementById(id),field=b?.querySelector(".plux17-microdust-field");
 if(!field||field.querySelector(".plux318-particle-extra"))return;
 fill(field,13,seed,true);
}
function mainVoiceButton(){
 if(!voice||voice.hidden)return null;
 const explicit=["#voice-mic-button","#voice-toggle","#voice-button","#start-voice","#voice-start","#voice-record",
  "#voice-talk-button","#voice-mic","#mic-button","#microphone-button",".voice-mic-button",".voice-main-mic",
  ".voice-microphone-button","[aria-label*='микрофон' i]","[aria-label*='говорить' i]"];
 for(const selector of explicit){const el=voice.querySelector(selector);if(el&&el.matches("button,[role='button']"))return el}
 const buttons=[...voice.querySelectorAll("button")].filter(b=>{
  const r=b.getBoundingClientRect();return r.width>=72&&r.height>=72&&!b.disabled&&getComputedStyle(b).display!=="none";
 });
 buttons.sort((a,b)=>{const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();return s.width*s.height-r.width*r.height});
 return buttons[0]||null;
}
function voiceOrb(){
 const b=mainVoiceButton();if(!b||b.classList.contains("plux318-voice-mic"))return;
 b.classList.add("plux318-voice-mic");
 let field=b.querySelector(".plux17-microdust-field");
 if(!field){field=document.createElement("span");field.className="plux17-microdust-field plux318-voice-particles";
 field.setAttribute("aria-hidden","true");b.insertBefore(field,b.firstChild);}
 fill(field,34,593,true);
}
function ambient(screen,seed){
 if(!screen||screen.querySelector(".plux318-ambient-dust"))return;
 const layer=document.createElement("div");layer.className="plux318-ambient-dust";layer.setAttribute("aria-hidden","true");
 for(let i=0;i<34;i++){
  const dot=document.createElement("i");dot.className="plux318-ambient-spark";
  dot.style.setProperty("--px",(6+random(seed+i*13)*88).toFixed(2)+"%");
  dot.style.setProperty("--py",(18+random(seed*4+i*9)*64).toFixed(2)+"%");
  dot.style.setProperty("--ps",(1+random(seed*7+i*5)*1.65).toFixed(2)+"px");
  dot.style.setProperty("--delay",(-random(seed+i*37)*12).toFixed(1)+"s");
  dot.style.setProperty("--duration",(5+random(seed*6+i*15)*9).toFixed(1)+"s");
  layer.append(dot);
 }
 screen.insertBefore(layer,screen.firstChild);
}
function sync(){
 for(let i=0;i<ids.length;i++)orb(ids[i],i*101+16);
 ambient(home?.querySelector("#home-scene"),141);
 ambient(voice,772);
 voiceOrb();
}
sync();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync,{once:true});
document.addEventListener("click",()=>{setTimeout(sync,90)},{passive:true});
const obs=new MutationObserver(records=>{
 if(records.some(r=>r.type==="attributes"&&(r.attributeName==="hidden"||r.attributeName==="class")))sync();
});
if(voice)obs.observe(voice,{attributes:true,attributeFilter:["hidden","class"]});
window.PLUXDustV318={sync};
})();