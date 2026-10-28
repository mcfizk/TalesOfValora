import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacter} from '../stats.js';
import {createPerception,validatePerceptionEvents} from './perception.js';

// Test fixtures only: the author supplies production distances, DCs and encounters.
const event={id:'test-deer',x:0,y:0,dc:10,triggerRadius:10,zones:[{id:'far',radius:100,dcModifier:10},{id:'near',radius:50,dcModifier:2}],title:'A deer',discovered:'You spot a deer.',aware:'The deer moves away.',surprised:'A deer bursts out beside you.'};
const setup=(options={})=>createPerception({events:[event],...options});
const at=x=>({x,y:0});

test('outer failure reveals nothing; closer zone uses the live character Perception and succeeds at equality',()=>{
 const p=setup(),sheet=createCharacter('fenris');assert.equal(sheet.passive('perception'),15);
 assert.deepEqual(p.update(at(110),sheet),[]);assert.deepEqual(p.snapshot().events,[]);assert.deepEqual(p.update(at(90),sheet),[]);assert.deepEqual(p.visible(),[]);
 sheet.addModifier({id:'penalty',target:'skill:perception',add:-3});
 const found=p.update(at(45),sheet);assert.equal(found[0].type,'discovered');assert.equal(found[0].check.total,12);assert.equal(found[0].check.dc,12);assert.equal(p.visible().length,1);
 assert.deepEqual(p.update(at(45),sheet),[]);
 const outcome=p.update(at(5),sheet);assert.equal(outcome[0].awareness,'aware');assert.deepEqual(p.update(at(0),sheet),[]);
});
test('unnoticed encounter fires the surprised outcome exactly once; leaving and returning does not reset it',()=>{
 const p=setup(),sheet=createCharacter('fenris');sheet.addModifier({id:'penalty',target:'skill:perception',add:-20});
 p.update(at(90),sheet);const result=p.update(at(0),sheet);assert.equal(result.length,1);assert.equal(result[0].awareness,'surprised');assert.equal(p.visible().length,1);
 p.update(at(200),sheet);assert.deepEqual(p.update(at(0),sheet),[]);p.reset();assert.equal(p.update(at(0),sheet).length,1);
});
test('hidden roll is once per event, reused at lower DCs; standing and zone re-entry cannot farm rolls',()=>{
 let rolls=0;const p=setup({mode:'roll',rng:()=>{rolls++;return .45;}}),sheet=createCharacter('fenris');
 p.update(at(90),sheet);p.update(at(200),sheet);p.update(at(90),sheet);p.update(at(90),sheet);assert.equal(rolls,1);
 assert.equal(p.update(at(40),sheet)[0].type,'discovered');assert.equal(rolls,1);
});
test('travel across an entire event cannot skip its trigger; inactive transitions do not sweep across the map',()=>{
 const sheet=createCharacter('fenris'),p=setup();p.update(at(150),sheet);const result=p.update(at(-150),sheet);
 assert.deepEqual(result.map(o=>o.type),['discovered','encountered']);assert.equal(result[1].awareness,'aware');
 const q=setup();q.update(at(150),sheet);q.update(at(150),sheet,{active:false});assert.deepEqual(q.update(at(-150),sheet),[]);
});
test('ineligible events stay dormant; snapshots cannot change internal state',()=>{
 const sheet=createCharacter('fenris'),p=setup();assert.deepEqual(p.update(at(0),sheet,{eligible:()=>false}),[]);assert.deepEqual(p.snapshot().events,[]);
 p.update(at(0),sheet);const snapshot=p.snapshot();snapshot.events[0].status='hidden';assert.equal(p.snapshot().events[0].status,'encountered');
});
test('invalid authoring fails clearly before play',()=>{
 assert.throws(()=>validatePerceptionEvents([event,event]),/unique IDs/);
 for(const change of [{dc:undefined},{triggerRadius:60},{zones:[...event.zones].reverse()},{zones:[{id:'a',radius:100,dcModifier:0},{id:'b',radius:50,dcModifier:5}]}])assert.throws(()=>validatePerceptionEvents([{...event,...change}]));
 assert.throws(()=>setup({mode:'unknown'}),/mode/);
});
test('a future listening bonus can reveal a hidden event while stationary without resetting it',()=>{
 const p=setup(),sheet=createCharacter('fenris');assert.deepEqual(p.update(at(90),sheet),[]);
 sheet.addModifier({id:'listening',target:'skill:perception',add:5});
 const results=p.update(at(90),sheet);assert.equal(results[0].type,'discovered');assert.equal(results[0].check.total,20);
 sheet.removeModifier('listening');assert.deepEqual(p.update(at(90),sheet),[]);assert.equal(p.visible().length,1);
});
