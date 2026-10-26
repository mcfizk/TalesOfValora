import test from 'node:test';
import assert from 'node:assert/strict';
import {STATS} from '../stats-data.js';
import {createCharacterRoster} from '../world-characters.js';

test('all villagers have level-one human sheets and the blacksmith is tougher without extra levels',()=>{
 const ids=Object.keys(STATS.actors).filter(id=>id!=='fenris'),roster=createCharacterRoster(ids);assert.equal(ids.length,11);
 for(const id of ids){const s=roster.get(id);assert.equal(s.species,'human');assert.equal(s.level,1);assert.equal(s.hitDie,8);assert.equal(s.hitDice,1);assert.equal(s.proficiency,2);assert.equal(s.power.active,false);assert.equal(s.speed,30);assert.equal(s.ac,10);assert.ok(Number.isFinite(s.initiative));for(const ability of STATS.abilities)assert.ok(Number.isFinite(s.saveBonus(ability.id)));}
 const ordinary=roster.get('resident'),smith=roster.get('blacksmith'),woodcutter=roster.get('woodcutter');assert.equal(ordinary.maxHp,8);assert.equal(smith.maxHp,10);assert.equal(woodcutter.maxHp,9);assert.equal(smith.score('str'),14);assert.equal(smith.score('con'),14);assert.equal(smith.skillBonus('athletics'),4);
 assert.equal(roster.get('herbalist').skillBonus('medicine'),2);assert.equal(roster.get('trader').skillBonus('persuasion'),2);
});
test('an entity without stats cannot enter the roster; instances require unique stable identities',()=>{
 const roster=createCharacterRoster(['fenris']);assert.throws(()=>roster.register('missing'),/no stats/);assert.throws(()=>roster.get('missing'),/Unregistered/);assert.throws(()=>roster.register('fenris'),/Duplicate/);assert.throws(()=>roster.register({id:'',statId:'resident'}),/stable instance id/);
});
test('two future NPC instances can share a stat template without sharing health',()=>{
 const roster=createCharacterRoster([{id:'visitor-a',statId:'resident',name:'Visitor A'},{id:'visitor-b',statId:'resident',name:'Visitor B'}]);roster.get('visitor-a').damage(3);assert.equal(roster.get('visitor-a').hp,5);assert.equal(roster.get('visitor-b').hp,8);assert.equal(roster.get('visitor-a').name,'Visitor A');
 const copy=roster.snapshot();copy['visitor-a'].abilities.str.score=30;assert.equal(roster.get('visitor-a').score('str'),10);
});
test('persistent NPC sheets use the same damage, death saves, healing and reset rules as Fenris',()=>{
 const roster=createCharacterRoster(['fenris','blacksmith']),smith=roster.get('blacksmith');smith.damage(10);assert.equal(smith.status,'dying');smith.deathSave(()=>.5);assert.equal(smith.deathSaves.successes,1);assert.equal(roster.get('blacksmith'),smith);smith.heal(2);assert.equal(smith.status,'conscious');assert.equal(smith.hp,2);assert.equal(roster.get('fenris').hp,13);
 roster.reset();assert.notEqual(roster.get('blacksmith'),smith);assert.equal(roster.get('blacksmith').hp,10);assert.deepEqual(roster.get('blacksmith').deathSaves,{successes:0,failures:0});
});
