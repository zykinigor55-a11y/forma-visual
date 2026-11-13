import assert from 'node:assert/strict';
import {editorialReferences,qualityCatalog} from './quality.mjs';
const works=qualityCatalog();
assert.ok(works.length>=10);
assert.ok(works.some(x=>x.mood==='morning_blue'));
assert.ok(works.some(x=>x.mood==='overcast'));
assert.ok(works.some(x=>x.mood==='sunny'));
assert.ok(works.every(x=>!/(low.poly|catalog|sketchfab|lowpoly)/i.test(x.title)));
const fetchBefore=globalThis.fetch;
let calls=0;
try{
  globalThis.fetch=async url=>{
    calls++;
    const path=new URL(url).searchParams.get('url');
    const id=path.match(/\/gallery\/(\d+)/)?.[1];
    assert.ok(id);
    const listed=works.find(x=>x.id===id);
    assert.ok(listed);
    return {ok:true,status:200,json:async()=>({
      title:listed.title+' - '+listed.owner,
      author_name:listed.owner,
      html:'<iframe src="https://www.behance.net/embed/project/'+id+'?ilo0=1" height="400" width="400"></iframe>'
    })};
  };
  const auto=await editorialReferences('auto');
  assert.equal(auto.works.length,8);
  assert.ok(auto.works.every(x=>x.embedUrl?.includes('/embed/project/')));
  assert.ok(auto.works.every(x=>x.link.startsWith('https://www.behance.net/gallery/')));
  assert.ok(auto.works.some(x=>x.mood==='morning_blue'));
  assert.ok(auto.works.some(x=>x.mood==='overcast'));
  const count=calls;
  const again=await editorialReferences('auto');
  assert.equal(again.works.length,8);
  assert.equal(calls,count,'cached official oEmbed lookups should not be repeated');
  const fog=await editorialReferences('overcast');
  assert.ok(fog.works.every(x=>x.mood==='overcast'));
  const blue=await editorialReferences('morning_blue');
  assert.ok(blue.works.every(x=>x.mood==='morning_blue'));
  const sun=await editorialReferences('sunny');
  assert.ok(sun.works.every(x=>x.mood==='sunny'));
  console.log('FORMA editorial: authentic Behance embeds, balanced modes including overcast and early blue hour, source URLs and caching passed');
}finally{globalThis.fetch=fetchBefore;}
