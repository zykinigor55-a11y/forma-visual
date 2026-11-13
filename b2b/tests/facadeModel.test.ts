import test from "node:test";
import assert from "node:assert/strict";
import {INITIAL,estimate,frontOpenings,panelParts,subtractOpenings} from "../src/model";

test("Architectural openings never overlap installed facade panels",()=>{
 const w=INITIAL.width,h=INITIAL.height,holes=frontOpenings(w,h);
 const parts=panelParts(w,h,INITIAL.panelWidth,INITIAL.gap,INITIAL.orientation,holes);
 assert.ok(parts.length>15);
 for(const p of parts)for(const o of holes){
  const overlapX=Math.max(0,Math.min(p.x1,o.x1)-Math.max(p.x0,o.x0));
  const overlapY=Math.max(0,Math.min(p.y1,o.y1)-Math.max(p.y0,o.y0));
  assert.equal(overlapX*overlapY,0,"Panel must not cover a window or door");
 }
});
test("Facade parts are kept inside the source boundary",()=>{
 const parts=panelParts(INITIAL.width,INITIAL.height,.18,.01,"horizontal",frontOpenings(INITIAL.width,INITIAL.height));
 assert.ok(parts.length>3);
 for(const p of parts){
  assert.ok(p.x0>=-INITIAL.width/2-.00001);
  assert.ok(p.x1<=INITIAL.width/2+.00001);
  assert.ok(p.y0>=0);
  assert.ok(p.y1<=INITIAL.height+.00001);
 }
});
test("Subtracting a hole yields correct rectangular free area",()=>{
 const hole={x0:1,x1:2,y0:1,y1:2};
 const pieces=subtractOpenings({x0:0,x1:3,y0:0,y1:3},[hole]);
 const area=pieces.reduce((n,p)=>n+(p.x1-p.x0)*(p.y1-p.y0),0);
 assert.ok(Math.abs(area-8)<1e-8);
});
test("Illustrative estimate reports net area smaller than gross",()=>{
 const s=estimate(INITIAL);
 assert.ok(s.net>0&&s.net<s.gross);
 assert.ok(s.actualCoverage<=s.net+1e-6);
 assert.ok(s.illustrativeCost>0);
});
