import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameClock} from './game-clock.js';
import {villageLocation,waypointReading} from './navigation.js';
import {generateChunk,CHUNK_SIZE,walkable,waterDistance} from './world.js';

test('clock advances only for actual movement and handles midnight',()=>{
 const c=createGameClock();c.advance(300,false);assert.equal(c.snapshot().time,'22:00');
 c.advance(119,true);assert.equal(c.snapshot().time,'23:59');c.advance(1,true);assert.equal(c.snapshot().day,2);assert.equal(c.snapshot().time,'00:00');
 c.advance(NaN,true);c.advance(-1,true);assert.equal(c.snapshot().time,'00:00');
});
test('morning reveals village once and discovery persists through later nights',()=>{
 const c=createGameClock();c.advance(479,true);assert.equal(c.snapshot().time,'05:59');assert.equal(c.snapshot().villageAvailable,false);
 c.advance(1,true);assert.equal(c.snapshot().time,'06:00');assert.ok(c.snapshot().daylight);assert.ok(c.snapshot().villageAvailable);
 c.advance(720,true);assert.equal(c.snapshot().daylight,false);assert.ok(c.snapshot().villageAvailable);
 c.advance(1440,true);assert.equal(c.snapshot().day,3);assert.ok(c.snapshot().villageAvailable);
 c.reset();assert.equal(c.snapshot().time,'22:00');assert.equal(c.snapshot().villageAvailable,false);
});
test('sun and moon progress and forest daylight remain bounded',()=>{
 const c=createGameClock();
 for(let i=0;i<1500;i++){const s=c.advance(1,true);assert.ok(s.arc>=0&&s.arc<=1);assert.ok(s.daylightStrength>=0&&s.daylightStrength<=1);}
});
test('seeded village destinations are stable and stand on reachable dry ground',()=>{
 for(const seed of [0,1,1468,77391,4294967295]){
  const v=villageLocation(seed);assert.deepEqual(v,villageLocation(seed));assert.ok(waterDistance(v.x,v.y)>45);
  const cx=Math.floor(v.x/CHUNK_SIZE),cy=Math.floor(v.y/CHUNK_SIZE),colliders=[];
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)colliders.push(...generateChunk(cx+x,cy+y,seed).trees.map(t=>({x:t.x,y:t.y-7,r:t.r})));
  assert.ok(walkable(v.x,v.y,colliders));assert.ok(waypointReading(v,v).arrived);
 }
 assert.equal(waypointReading({x:0,y:0},{x:0,y:-220}).direction,'N');assert.equal(waypointReading({x:0,y:0},{x:220,y:0}).paces,10);
});
