import assert from 'node:assert/strict';
import * as T from 'three';
import {createNaturalSakura,sakuraStage} from '../forma-landscape-3d-sakura-r203.js';
for (const age of [10,35,75]) for (const mobile of [true,false]) {
 const d=sakuraStage(age),g=createNaturalSakura(T,{...d,variant:1,sakura:{age}},{season:'spring',mobile});
 const stats=g.userData.formaSakuraStats; assert(stats.flowers>0); assert(stats.flowers<=(mobile?59000:76000)); assert(stats.translucency); assert(stats.woodTriangles>0);
 for(const m of g.children){const a=m.geometry.attributes.position.array;assert(a.every(Number.isFinite));m.geometry.dispose();m.material.map?.dispose();m.material.bumpMap?.dispose();m.material.dispose();}
 console.log(JSON.stringify(stats));
}
