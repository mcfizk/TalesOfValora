import test from 'node:test';
import assert from 'node:assert/strict';
import {riverX,walkable,move,findPath,makeWorld,SPAWN,POINTS,generateChunk,terrainAt,movementScale,CHUNK_SIZE} from './world.js';

test('water is traversable at exactly 30% of land speed, including running',()=>{
  const y=352,x=riverX(y);
  assert.ok(walkable(x,y,[]));
  for(const speed of [68,112]){
    const request=speed*.1,wet=move({x,y},request,0,[]),dry=move({x:x-100,y},request,0,[]);
    assert.ok(Math.abs((wet.x-x)/(dry.x-(x-100))-.3)<1e-10);
  }
  assert.equal(movementScale(x,y),.3);assert.equal(movementScale(x-100,y),1);
  const route=findPath({x:x-60,y},{x:x+60,y},[]);assert.ok(route.length>0);
  let p={x:x-60,y};for(let i=0;i<90;i++)p=move(p,3,0,[]);assert.ok(p.x>x+22);
});

test('negative coordinates and former map edges remain traversable',()=>{
  for(const p of [{x:-5000,y:-4000},{x:8000,y:9000}]){assert.ok(walkable(p.x,p.y));assert.equal(move(p,0,10).y,p.y+10);}
  assert.equal(walkable(NaN,0),false);
});

test('all opening observations remain reachable across varied seeds',()=>{
  for(const seed of [1468,1,77391,4294967295]){
    const {colliders}=makeWorld(seed);
    for(const point of POINTS){
      const approaches=Array.from({length:8},(_,i)=>({x:point.x+32*Math.cos(i*Math.PI/4),y:point.y+32*Math.sin(i*Math.PI/4)}));
      assert.ok(approaches.some(target=>findPath(SPAWN,target,colliders).length>0),`${seed}: ${point.id}`);
    }
  }
});

test('unloaded chunks regenerate identically and memory stays bounded',()=>{
  const world=makeWorld(73),original=JSON.stringify(world.chunks.get('1:1'));
  for(let i=1;i<=60;i++){
    world.update(i*CHUNK_SIZE*3,-i*CHUNK_SIZE*2);
    assert.ok(world.chunks.size<=36);
    assert.ok(world.trees.length>0);assert.ok(world.points.length>0);
  }
  assert.equal(world.chunks.has('1:1'),false);
  world.update(SPAWN.x,SPAWN.y);assert.equal(JSON.stringify(world.chunks.get('1:1')),original);
  assert.deepEqual(generateChunk(-14,32,73),generateChunk(-14,32,73));
  assert.notDeepEqual(generateChunk(-14,32,73),generateChunk(-14,32,74));
});

test('forest includes groves, fern hollows, rocky patches and clearings',()=>{
  const types=new Set();
  for(let y=-5000;y<=5000;y+=200)for(let x=-5000;x<=5000;x+=200)types.add(terrainAt(x,y));
  assert.deepEqual([...types].sort(),['clearing','fern','grove','rocky']);
});

test('tree collisions still block movement on land',()=>{
  const p=move({x:600,y:660},80,0,[{x:640,y:660,r:10}]);assert.ok(p.x<=622);
});
