import assert from 'node:assert/strict';
import {createLensSearcher} from './lens.mjs';

const jpeg=Buffer.alloc(360,19);jpeg[0]=255;jpeg[1]=216;jpeg[2]=255;
const photo='data:image/jpeg;base64,'+jpeg.toString('base64');
const lens=createLensSearcher({serperKey:'FAKE-TEST-ONLY',origin:'https://forma-studio-architect.onrender.com'});
const oldFetch=globalThis.fetch;
let requests=0,served=false;
try{
  globalThis.fetch=async(url,options)=>{
    requests++;
    assert.equal(url,'https://google.serper.dev/lens');
    const body=JSON.parse(options.body);
    assert.match(body.url,/^https:\/\/forma-studio-architect\.onrender\.com\/api\/lens-photo\/[a-f0-9-]+\.jpg$/);
    const match=body.url.match(/\/api\/lens-photo\/([^/]+)\.jpg$/);
    assert.ok(match);
    const collected={status:0,headers:null,data:null,
      writeHead(status,headers){this.status=status;this.headers=headers;},
      end(data){this.data=data;}};
    lens.serve({method:'GET'},collected,match[1],'jpeg');
    assert.equal(collected.status,200);
    assert.equal(collected.headers['content-type'],'image/jpeg');
    assert.ok(collected.data.equals(jpeg));
    served=true;
    return {ok:true,status:200,json:async()=>({
      searchParameters:{type:'lens'},
      organic:[
        {title:'The Understorey - architecture photoreal daylight',source:'ANT',
          link:'https://www.behance.net/gallery/255467603/The-Understorey',
          thumbnailUrl:'https://encrypted-tbn0.gstatic.com/images?q=test'},
        {title:'Modern house architecture exterior photo',source:'Architecture Daily',
          link:'https://www.archdaily.com/example',thumbnailUrl:'https://example.com/architecture.jpg'},
        {title:'Completely irrelevant product',source:'Retailer',
          link:'https://example.com/random-product',thumbnailUrl:'https://example.com/product.jpg'}
      ],
      credits:3
    })};
  };
  const first=await lens.search(photo);
  assert.equal(first.available,true);
  assert.ok(served);
  assert.equal(requests,1);
  assert.equal(first.matchCount,3);
  assert.equal(first.architectureMatchCount,2);
  assert.equal(first.matches.length,2);
  assert.equal(first.matches[0].source,'ant');
  assert.equal(first.matches[0].sourceLabel,'ANT Archviz');
  assert.equal(first.matches[0].visualMatch,true);
  assert.equal(first.matches[0].visualVerified,false);
  const second=await lens.search(photo);
  assert.equal(second.cached,true);
  assert.equal(requests,1,'Repeated identical images must not spend Serper credits again');
  await assert.rejects(()=>lens.search('data:image/jpeg;base64,AAAA'),e=>e.status===413||e.status===415);
  console.log('FORMA Lens: encrypted temporary image relay, real organic result parsing, ANT attribution, and cache passed');
}finally{globalThis.fetch=oldFetch}
