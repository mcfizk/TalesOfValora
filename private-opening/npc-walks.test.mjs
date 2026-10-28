import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NPC_WALKS} from './npc-walks.js';
import {ALL_PEOPLE,npcConfig,humanConfig} from './village-people.js';
import {characterFrame,DIRECTIONS} from './character-animation.js';
test('six reviewed NPC bases provide installed eight-frame horizontal walks',()=>{
 assert.equal(Object.keys(NPC_WALKS).length,6);
 for(const [id,p] of Object.entries(NPC_WALKS)){
  const c=npcConfig({id:'test',walkBase:id});assert.equal(c.walk.frames,8);assert.equal(c.walk.fps,8);assert.equal(c.displayHeight,p.displayHeight);
  for(const d of ['left','right'])assert.ok(fs.existsSync(new URL('./assets/'+p.walk.files[d],import.meta.url)));
  for(const direction of DIRECTIONS)for(let i=0;i<8;i++){const f=characterFrame({moving:true,direction,walkFacing:'right',animation:i/8},c);assert.ok(['left','right'].includes(f.direction));assert.equal(f.index,i);assert.equal(f.width,512);assert.ok(f.sy+f.height<=1280);}
 }
});
test('villagers retain ancestry and proportions while switching between walking and standing',()=>{
 for(const p of ALL_PEOPLE){assert.ok(p.walkBase.startsWith(p.species+'-'));const c=npcConfig(p),old=humanConfig(p.id);
  for(const action of ['sleep','sit','sleepToSit','sitToStand'])assert.deepEqual(c[action],old[action]);
  assert.equal(c.idle.frames,1);assert.equal(c.directionalRest.frames,1);
  const rest=characterFrame({moving:false,direction:'up'},c);assert.equal(rest.asset,p.id+'-rest-up');assert.equal(rest.width,512);
  const idle=characterFrame({moving:false,direction:'left',animation:10},c);assert.equal(idle.index,0);assert.equal(idle.scale,rest.scale);
  const walk=characterFrame({moving:true,direction:'up',walkFacing:'right'},c);assert.equal(walk.asset,p.id+'-walk-right');assert.equal(walk.scale,rest.scale);
 }
});
