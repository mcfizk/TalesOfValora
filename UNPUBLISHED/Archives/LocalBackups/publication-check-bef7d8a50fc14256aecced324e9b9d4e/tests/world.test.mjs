import test from 'node:test';import assert from 'node:assert/strict';
import {walkable,moveWithCollision,findPath,riverX,SPAWN,BOUNDS} from '../world.js';
test('spawn is walkable and world boundary contains movement',()=>{assert.ok(walkable(SPAWN.x,SPAWN.z));assert.equal(walkable(BOUNDS+1,0),false);const p=moveWithCollision({x:25,z:0},15,0,[]);assert.ok(Math.hypot(p.x,p.z)<=BOUNDS-.45);});
test('fast movement cannot tunnel through an obstacle',()=>{const p=moveWithCollision({x:-4,z:0},9,0,[{x:0,z:0,r:1}]);assert.ok(p.x<-1.4);});
test('movement slides past a trunk without entering it',()=>{const c=[{x:0,z:0,r:1}],p=moveWithCollision({x:-2,z:0},3,3,c);assert.ok(walkable(p.x,p.z,c));assert.ok(p.z>1);});
test('brook blocks movement except at the bridge',()=>{assert.equal(walkable(riverX(0),0),false);assert.ok(walkable(riverX(-9),-9));const p=moveWithCollision({x:13,z:0},10,0,[]);assert.ok(p.x<15);const b=moveWithCollision({x:12,z:-9},10,0,[]);assert.ok(b.x>20);});
test('pathfinding routes around obstacles',()=>{const c=[{x:0,z:0,r:1.5}],path=findPath({x:-4,z:0},{x:4,z:0},c);assert.ok(path.length>0);assert.ok(path.every(p=>walkable(p.x,p.z,c)));let p={x:-4,z:0};for(const next of path){const d=Math.hypot(next.x-p.x,next.z-p.z);p=moveWithCollision(p,next.x-p.x,next.z-p.z,c);assert.ok(Math.hypot(p.x-next.x,p.z-next.z)<.01,`path segment of ${d} was blocked`);}assert.equal(p.x,4);});
test('path to water or outside scene is rejected',()=>{assert.deepEqual(findPath(SPAWN,{x:riverX(0),z:0},[]),[]);assert.deepEqual(findPath(SPAWN,{x:100,z:100},[]),[]);assert.equal(walkable(NaN,0),false);});
test('path crosses the brook using the bridge',()=>{const path=findPath({x:12,z:-9},{x:22,z:-9},[]);assert.ok(path.length>0);assert.ok(path.every(p=>walkable(p.x,p.z)));});
