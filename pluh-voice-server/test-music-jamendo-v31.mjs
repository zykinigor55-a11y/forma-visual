import assert from 'node:assert/strict';
import {normalizeJamendoTrack,handleJamendo} from './music-jamendo-v31.mjs';

const sample={
 id:'248238',name:'Night Forest',artist_name:'Example Artist',
 audio:'https://cdn.jamendo.com/audio/sample.mp3',
 image:'https://jamendo.com/cover.png',
 shareurl:'https://www.jamendo.com/track/248238',
 duration:200,license_ccurl:'https://creativecommons.org/licenses/by/4.0/'
};
assert.equal(normalizeJamendoTrack(sample).stream,sample.audio);
assert.equal(normalizeJamendoTrack(sample).provider,'Jamendo');
assert.equal(normalizeJamendoTrack({...sample,audio:'http://insecure/music.mp3'}),null);
assert.equal(normalizeJamendoTrack({...sample,id:'abc'}),null);
assert.equal(normalizeJamendoTrack({...sample,shareurl:'https://fakejamendo.com/track'}).url,null);
function makeResponse(){return {status:0,headers:{},body:null,setHeader(k,v){this.headers[k]=v},
 writeHead(s,h={}){this.status=s;Object.assign(this.headers,h)},end(t){this.body=t?JSON.parse(t):null}}}
function req(origin,path='/api/music/jamendo'){return {method:'GET',url:path,headers:{origin,'x-forwarded-for':'198.51.100.19'},socket:{remoteAddress:'198.51.100.19'}}}
const wrong=makeResponse();await handleJamendo(req('https://untrusted.example'),wrong);assert.equal(wrong.status,403);
const old=process.env.JAMENDO_CLIENT_ID;
try {
 delete process.env.JAMENDO_CLIENT_ID;
 let res=makeResponse();await handleJamendo(req('https://plux-v17-friends-preview.onrender.com'),res);
 assert.equal(res.status,503);
 process.env.JAMENDO_CLIENT_ID='testclient123';
 const upstream=globalThis.fetch;
 let requests=0;
 globalThis.fetch=async url=>{
  requests++;
  const u=new URL(url);
  assert.equal(u.hostname,'api.jamendo.com');
  assert.equal(u.searchParams.get('client_id'),'testclient123');
  return {ok:true,async json(){return {headers:{status:'success'},results:[sample]}}};
 };
 try{
  res=makeResponse();await handleJamendo(req('https://plux-v17-friends-preview.onrender.com','/api/music/jamendo?q=forest'),res);
  assert.equal(res.status,200);
  assert.equal(res.headers['Access-Control-Allow-Origin'],'https://plux-v17-friends-preview.onrender.com');
  assert.equal(res.body.tracks.length,1);
  const next=makeResponse();await handleJamendo(req('https://plux-v17-friends-preview.onrender.com','/api/music/jamendo?q=forest'),next);
  assert.equal(requests,1,'Metadata requests are cached; no audio is cached');
  assert.equal(next.body.tracks[0].title,'Night Forest');
 }finally{globalThis.fetch=upstream;}
}finally{if(old===undefined)delete process.env.JAMENDO_CLIENT_ID;else process.env.JAMENDO_CLIENT_ID=old;}
console.log('PLUX V31 Jamendo: security and read-only streaming tests passed');
