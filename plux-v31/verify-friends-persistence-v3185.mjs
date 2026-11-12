import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const uid="11111111-1111-4111-8111-111111111111";
const avatar=uid+"/22222222-2222-4222-8222-222222222222.webp";
const photo=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==","base64");
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:860},isMobile:true});
 const page=await ctx.newPage();let refreshes=0;const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.route("**/plux-friends-v17.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"/* mocked local V3185 version */"}));
 await page.route("**/auth/v1/**",r=>{
  if(r.request().method()==="OPTIONS")return r.fulfill({status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"*"}});
  refreshes++;
  const body={access_token:"test.token.v3185",refresh_token:"mock-rotated-token",expires_in:3600,
   user:{id:uid,email:"test@example.invalid"}};
  return r.fulfill({status:200,contentType:"application/json",
   headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify(body)});
 });
 await page.route("**/rest/v1/**",r=>{
  let body=[];
  if(r.request().url().includes("/plux_profiles"))body=[{id:uid,handle:"example_user",display_name:"Тестовый профиль",avatar_path:avatar}];
  return r.fulfill({status:200,contentType:"application/json",
   headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS"},
   body:JSON.stringify(body)});
 });
 await page.route("**/storage/v1/object/public/plux-avatars/**",r=>r.fulfill({status:200,body:photo,
  headers:{"Content-Type":"image/png","Access-Control-Allow-Origin":"*"}}));
 await page.addInitScript(({uid})=>{
  const key="plux_friends_session_v3185";
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   access_token:"old.access.token",refresh_token:"persisted-refresh-token",expires_at:1,user:{id:uid,email:"test@example.invalid"}
  }));
 },{uid});
 async function check(label){
  await page.addScriptTag({path:"plux-v17-friends/plux-friends-v17.js"});
  await page.waitForFunction(()=>!!window.PLUXFriendsV17,{timeout:8000});
  await page.evaluate(()=>window.PLUXFriendsV17.open());
  const state=await page.evaluate(()=>{
   const avatar=document.querySelector("#pf-myavatar img");
   return {name:document.querySelector("#pf-myname")?.textContent,login:!document.querySelector("#pf-signin")?.hidden,
    avatar:!!avatar,avatarLoaded:!!avatar?.complete&&avatar.naturalWidth>0,
    saved:JSON.parse(localStorage.getItem("plux_friends_session_v3185")||"null")?.refresh_token};
  });
  assert.equal(state.name,"Тестовый профиль",label+": profile name");
  assert.equal(state.login,false,label+": no login screen");
  assert.equal(state.saved,"mock-rotated-token",label+": rotated token persisted");
  assert(state.avatar,label+": avatar drawn in own profile");
  console.log("PLUX3185_FRIENDS_"+label+" "+JSON.stringify(state));
 }
 const response=await page.goto(origin+"/?mobile=1&v=3184",{waitUntil:"domcontentloaded",timeout:60000});
 assert.equal(response.status(),200);
 await check("FIRST");
 await page.reload({waitUntil:"domcontentloaded",timeout:60000});
 await check("REOPEN");
 assert(refreshes>=1,"Expired persisted session refreshed automatically");
 assert.equal(errors.length,0,errors.join("; "));
 console.log("PLUX3185_FRIENDS_PASS "+JSON.stringify({refreshes}));
}finally{await browser.close()}
