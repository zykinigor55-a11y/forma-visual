/* PLUX 31.8.9: integration test of email signup without sending any real email.
   The app must never turn a pending confirmation into repeated new signups. */
import assert from "node:assert/strict";
import {chromium} from "playwright-core";
const origin="https://plux-v17-friends-preview.onrender.com";
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
try{
 const ctx=await browser.newContext({viewport:{width:390,height:860},isMobile:true,hasTouch:true});
 const page=await ctx.newPage();
 let signupCount=0,resendCount=0,loginCount=0;
 let loginConfirmed=false;
 const errors=[];page.on("pageerror",x=>errors.push(String(x.message)));
 await page.route("**/plux-friends-v17.js*",r=>r.fulfill({status:200,contentType:"text/javascript",body:"/* local test script will be injected */"}));
 await page.route("**/auth/v1/**",async r=>{
  const url=r.request().url(),headers={"Access-Control-Allow-Origin":"*","Content-Type":"application/json",
   "Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
  if(r.request().method()==="OPTIONS")return r.fulfill({status:204,headers});
  if(url.includes("/signup")){
   signupCount++;
   return r.fulfill({status:200,headers,body:JSON.stringify({
    user:{id:"11111111-1111-4111-8111-111111111111",email:"example@example.com"},session:null
   })});
  }
  if(url.includes("/resend")){
   resendCount++;
   return r.fulfill({status:429,headers,body:JSON.stringify({
    code:"over_email_send_rate_limit",message:"email rate limit exceeded"
   })});
  }
  if(url.includes("/token?grant_type=password")){
   loginCount++;
   if(!loginConfirmed)return r.fulfill({status:400,headers,body:JSON.stringify({
    code:"email_not_confirmed",message:"Email not confirmed"
   })});
   return r.fulfill({status:200,headers,body:JSON.stringify({
    access_token:"test-access-token",refresh_token:"test-refresh-token",expires_in:3600,
    user:{id:"11111111-1111-4111-8111-111111111111",email:"example@example.com"}
   })});
  }
  return r.fulfill({status:404,headers,body:"{}"});
 });
 await page.route("**/rest/v1/**",r=>{
  const url=r.request().url(),headers={"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  const data=url.includes("/plux_profiles")?[{id:"11111111-1111-4111-8111-111111111111",handle:"example",display_name:"Тестовый пользователь",avatar_path:null}]:[];
  return r.fulfill({status:200,headers,body:JSON.stringify(data)});
 });
 const r=await page.goto(origin+"/?mobile=1&v=3188",{waitUntil:"domcontentloaded",timeout:60000});
 assert.equal(r.status(),200);
 await page.addScriptTag({path:"plux-v17-friends/plux-friends-v17.js"});
 await page.waitForFunction(()=>!!window.PLUXFriendsV17,{timeout:10000});
 await page.evaluate(()=>window.PLUXFriendsV17.open());
 await page.locator("#pf-email").fill("example@example.com");
 await page.locator("#pf-password").fill("test-password-123");
 await page.locator("#pf-register").click();
 await page.waitForFunction(()=>!document.getElementById("pf-confirm").hidden,{timeout:10000});
 assert.equal(signupCount,1);
 assert.equal(await page.locator("#pf-confirm-address").textContent(),"example@example.com");
 assert.match(await page.locator("#pf-confirm").textContent(),/подтверди|подтвержд/i);
 // Dismissing the friends panel and reopening must restore the pending state.
 await page.evaluate(()=>window.PLUXFriendsV17.close());
 await page.evaluate(()=>window.PLUXFriendsV17.open());
 await page.waitForFunction(()=>!document.getElementById("pf-confirm").hidden,{timeout:10000});
 assert.equal(signupCount,1);
 await page.locator("#pf-resend").click();
 await page.waitForFunction(()=>document.querySelector("#pf-alert")?.textContent?.includes("Слишком много"),{timeout:10000});
 assert.equal(resendCount,1);
 assert.equal(signupCount,1,"Resend must never submit /signup again");
 await page.locator("#pf-confirm-login").click();
 await page.locator("#pf-login button").first().click();
 await page.waitForFunction(()=>!document.getElementById("pf-confirm").hidden,{timeout:10000});
 assert.equal(loginCount,1,"Email not confirmed returns to confirmation screen");
 loginConfirmed=true;
 await page.locator("#pf-confirm-login").click();
 await page.locator("#pf-login button").first().click();
 await page.waitForFunction(()=>!document.getElementById("pf-content").hidden,{timeout:10000});
 assert.equal(loginCount,2);
 assert.equal(await page.evaluate(()=>localStorage.getItem("plux_friends_pending_email_v3189")),null);
 assert.equal(signupCount,1);
 assert.equal(errors.length,0,errors.join(" | "));
 console.log("PLUX3189_SIGNUP_FLOW_PASS "+JSON.stringify({signupCount,resendCount,loginCount,confirmed:true}));
}finally{await browser.close()}
