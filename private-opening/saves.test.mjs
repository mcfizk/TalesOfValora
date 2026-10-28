import {createRestTracker} from './resting.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSaveSlots,validateGameSave} from './saves.js';
import {createCharacterRoster} from '../world-characters.js';
import {UNIT_DEFINITIONS} from '../units/catalog.js';
import {createVillageEconomy} from './village-economy.js';
import {createConversations} from './conversations.js';
import {createPerception} from './perception.js';
import {makeWorld,SPAWN} from './world.js';

function fixture(){
 const roster=createCharacterRoster(Object.keys(UNIT_DEFINITIONS)),economy=createVillageEconomy(),conversations=createConversations();
 return {seed:123,phase:'explore',age:20,time:25,distance:50,player:{...SPAWN,direction:'left',action:null,actionTime:0,animation:1},minutes:1350,found:[],notes:[],voices:['first'],subtitleUntil:10,visitedVillage:false,seated:false,villageDiscovered:false,villageTracking:true,interior:null,audioOn:false,reduced:false,characters:roster.serialize(),town:{economy:economy.serialize(),conversations:conversations.snapshot()},perception:{mode:'passive',events:[]}};
}
test('three versioned slots remain independent; failed writes preserve prior saves',()=>{
 const records=new Map(),storage={getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v)},slots=createSaveSlots(storage);
 assert.deepEqual(slots.list().map(s=>s.status),['empty','empty','empty']);
 const a=fixture();slots.write(1,a);a.seed=99;slots.write(2,a);assert.equal(slots.read(1).data.seed,123);assert.equal(slots.read(2).data.seed,99);assert.equal(slots.read(3),null);
 assert.throws(()=>slots.write(4,a),/1 to 3/);storage.setItem=()=>{throw Error('quota');};assert.throws(()=>slots.write(1,a),/previous save/);assert.equal(slots.read(1).data.seed,123);
});
test('corrupt and unsupported slots are isolated; malformed subsystem data cannot be loaded',()=>{
 const records=new Map(),slots=createSaveSlots({getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)});slots.write(2,fixture());records.set('tales-of-valora:save:1','{broken');
 assert.deepEqual(slots.list().map(s=>s.status),['unavailable','saved','empty']);const envelope=JSON.parse(records.get('tales-of-valora:save:2'));envelope.version=999;records.set('tales-of-valora:save:2',JSON.stringify(envelope));assert.equal(slots.list()[1].status,'unavailable');
 for(const change of [{minutes:0},{player:{}},{interior:'missing'},{characters:{version:1,units:[]}},{found:['missing-note']},{town:{}}])assert.throws(()=>validateGameSave({...fixture(),...change}));
});
test('all unit stats and experiences round-trip, including damage, modifiers, resources and death saves',()=>{
 const r=createCharacterRoster(['fenris','blacksmith']);r.get('fenris').addModifier({id:'listen',target:'skill:perception',add:4});r.get('fenris').damage(2);r.get('blacksmith').damage(10);r.get('blacksmith').deathSave(()=>.5);
 r.unit('fenris').remember({id:'deer',text:'Saw a deer.'});r.unit('fenris').learn({id:'path',text:'Found a path.'});r.unit('blacksmith').setAffinity('fenris',-2);
 const saved=JSON.parse(JSON.stringify(r.serialize())),restored=createCharacterRoster();restored.load(saved);assert.deepEqual(restored.serialize(),saved);assert.equal(restored.get('fenris').passive('perception'),19);assert.equal(restored.get('blacksmith').deathSaves.successes,1);
 const bad=structuredClone(saved);bad.units[1].state.memories=[{}];assert.throws(()=>restored.load(bad));assert.deepEqual(restored.serialize(),saved);
});
test('loading preserves exhausted resources, paid work and resolved conversations without duplicating rewards',()=>{
 const r=createCharacterRoster(['fenris']),e=createVillageEconomy(),c=createConversations({rng:()=>.999});
 const result=c.choose('woodcutter','root','lift',r.get('fenris'),e.snapshot());e.applyConversation(result.key,result.effects);e.acceptJob();e.stackWood();e.claimPay();e.gatherWood('stump-1');r.get('fenris').damage(3);e.drink(1,r.get('fenris'));
 const saved=e.serialize(),loaded=createVillageEconomy();loaded.load(saved);assert.deepEqual(loaded.serialize(),saved);assert.equal(loaded.claimPay(),false);assert.equal(loaded.gatherWood('stump-1'),false);assert.equal(loaded.drink(1,r.get('fenris')),false);assert.equal(loaded.applyConversation(result.key,result.effects),false);
 const dialogue=createConversations();dialogue.load(c.snapshot());assert.equal(dialogue.choose('woodcutter','root','lift',r.get('fenris'),{job:'available'}).fresh,false);assert.deepEqual(dialogue.snapshot(),c.snapshot());
});
test('perception memory survives loading without a second encounter; world reset restores seed-derived scenery',()=>{
 const event={id:'test',x:0,y:0,dc:1,triggerRadius:5,zones:[{id:'near',radius:30,dcModifier:0}],title:'Test',discovered:'Seen',aware:'Ready',surprised:'Startled'},p=createPerception({events:[event]}),sheet=createCharacterRoster(['fenris']).get('fenris');p.update({x:0,y:0},sheet);
 const loaded=createPerception({events:[event]});loaded.load(p.snapshot());assert.deepEqual(loaded.update({x:0,y:0},sheet),[]);
 const w=makeWorld(123),before=structuredClone(w.trees);w.reset(999);assert.notDeepEqual(w.trees,before);w.reset(123);assert.deepEqual(w.trees,before);
});

test('rest penalties, cooldowns and completion history survive save slots',()=>{
 const data=fixture(),r=createRestTracker(1320);r.begin('sleep',1320,480);r.tick(1400,{kind:'wait',elapsed:80});data.minutes=1400;data.rest=r.serialize();
 const records=new Map(),slots=createSaveSlots({getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v)});slots.write(1,data);
 const restored=createRestTracker(1400);restored.load(slots.read(1).data.rest,1400);assert.equal(restored.snapshot().waitPenalty,true);assert.equal(restored.available('long',1400),false);
 assert.throws(()=>validateGameSave({...data,rest:{}}),/saved rest/);
});
