import test from 'node:test';
import assert from 'node:assert/strict';
import {makeWorld,walkable,findPath,inWater,move} from './world.js';
import {createVillageLayout,makeInterior,isOpen,inVillage} from './village-layout.js';
import {createVillageEconomy} from './village-economy.js';
import {ALL_PEOPLE,humanConfig,villagePeople} from './village-people.js';
import {CHARACTER_ACTIONS,DIRECTIONS,characterFrame,validateCharacterAnimations} from './character-animation.js';
import {createCharacter} from '../stats.js';
import {createCharacterRoster} from '../world-characters.js';

test('village has dry streets, no trees inside and a path to every interaction',()=>{
 for(const seed of [0,1,1468,77391,4294967295]){
  const w=makeWorld(seed),v=w.village;w.update(v.x,v.y,700);assert.equal(v.buildings.length,9);
  assert.ok(w.trees.every(t=>!inVillage(t.x,t.y,seed)));
  for(const point of v.points){assert.ok(!inWater(point.x,point.y));assert.ok(walkable(point.x,point.y,w.colliders),point.id);assert.ok(findPath(v,point,w.colliders).length,point.id);}
  for(const b of v.buildings)assert.ok(!walkable(b.x,b.y-15,w.colliders));
 }
});
test('interior exit and keeper remain reachable while furniture and walls block movement',()=>{
 const b=createVillageLayout(1).buildings[0],room=makeInterior(b),start={x:120,y:155};
 assert.ok(findPath(start,{x:120,y:92},room.colliders).length);assert.ok(findPath(start,{x:120,y:180},room.colliders).length);
 const end=move(start,-300,0,room.colliders);assert.ok(end.x>=68);assert.ok(!walkable(120,50,room.colliders));assert.ok(!walkable(10,100,room.colliders));
});
test('residents return home at night; there is no standing guard',()=>{
 const v=createVillageLayout(1),player={x:v.x,y:v.y};assert.ok(isOpen('store',6));assert.ok(!isOpen('store',19));assert.ok(!isOpen('smith',6));
 assert.equal(villagePeople(v,{hour:2},0,player,null).length,0);assert.equal(villagePeople(v,{hour:8},0,player,null).length,7);
 assert.equal(villagePeople(v,{hour:8},0,player,makeInterior(v.buildings[0]))[0].shop,'inn');
});
test('every human supports all six actions and eight walking directions with valid frame bounds',()=>{
 for(const person of ALL_PEOPLE){const c=validateCharacterAnimations(humanConfig(person.id));assert.ok(c.displayHeight<36);
  for(const action of CHARACTER_ACTIONS)for(const direction of DIRECTIONS){const f=characterFrame({action,direction,moving:action==='walk',actionTime:1.6,animation:1.6},c);assert.ok(f.sx>=0&&f.sx+f.width<=256);assert.ok(f.sy+f.height<=40);}
 }
});
test('work pays once only; trading enforces money, stock and sell prices',()=>{
 const e=createVillageEconomy();assert.equal(e.snapshot().copper,0);assert.equal(e.buy('store','bread'),false);assert.equal(e.claimPay(),false);assert.equal(e.stackWood(),false);
 assert.ok(e.acceptJob());assert.equal(e.acceptJob(),false);assert.ok(e.stackWood());assert.ok(e.claimPay());assert.equal(e.claimPay(),false);assert.equal(e.snapshot().copper,12);
 assert.ok(e.buy('store','bandage'));assert.equal(e.snapshot().copper,4);assert.equal(e.buy('store','bandage'),false);assert.equal(e.snapshot().stock.store.bandage,2);
 assert.ok(e.sell('smith','bandage'));assert.equal(e.snapshot().copper,7);assert.equal(e.sell('smith','bandage'),false);
 const s=e.snapshot();s.bag.cup=100;s.stock.store.bandage=100;assert.equal(e.snapshot().bag.cup,undefined);assert.equal(e.snapshot().stock.store.bandage,2);
});
test('gathered resources cannot be duplicated; healing consumes only useful items',()=>{
 const e=createVillageEconomy(),c=createCharacter('fenris');assert.ok(e.gatherWood('stump:1'));assert.equal(e.gatherWood('stump:1'),false);assert.ok(e.sell('store','firewood'));assert.ok(e.buy('market','apple'));
 assert.equal(e.consume('apple',c),0);assert.equal(e.snapshot().bag.apple,1);c.damage(3);assert.equal(e.consume('apple',c),1);assert.equal(e.snapshot().bag.apple,0);
 assert.ok(e.drink(2,c));assert.equal(e.drink(2,c),false);assert.ok(e.drink(3,c));assert.equal(c.hp,13);
});
test('treatment cannot charge at full health or without funds; a new visit resets economy',()=>{
 const e=createVillageEconomy(),c=createCharacter('fenris');e.acceptJob();e.stackWood();e.claimPay();assert.equal(e.treatment(c),false);assert.equal(e.snapshot().copper,12);
 c.damage(8);assert.ok(e.treatment(c));assert.ok(e.treatment(c));assert.equal(c.hp,13);assert.equal(e.snapshot().copper,0);assert.equal(createVillageEconomy().snapshot().job,'available');
});

test('every authored NPC is backed by an independent human sheet regardless of visibility',()=>{
 const roster=createCharacterRoster(['fenris',...ALL_PEOPLE.map(p=>p.id)]);
 for(const person of ALL_PEOPLE){const sheet=roster.get(person.id);assert.equal(sheet.name,person.name);assert.equal(sheet.species,'human');assert.equal(sheet.level,1);assert.ok(!person.guard);assert.ok(!/guard|watch/i.test(person.role));}
 assert.equal(Object.keys(roster.snapshot()).length,12);assert.ok(createVillageLayout(1).buildings.some(b=>b.id==='shed'));assert.ok(!createVillageLayout(1).buildings.some(b=>b.id==='watch'));
});
