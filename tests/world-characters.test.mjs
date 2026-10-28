import test from 'node:test';
import assert from 'node:assert/strict';
import {STATS} from '../stats-data.js';
import {createCharacterRoster} from '../world-characters.js';
import {UNIT_DEFINITIONS} from '../units/catalog.js';
import {validateUnitDefinitions} from '../units/schema.js';
import {createUnitState} from '../units/unit-state.js';
import fs from 'node:fs';

test('creature units preserve all supplied JSON stats, natural armour, hit dice, senses and actions',()=>{
 const reference=JSON.parse(fs.readFileSync(new URL('../data/stats/reference/critters.json',import.meta.url),'utf8'));
 const roster=createCharacterRoster(Object.keys(reference));
 for(const [id,c]of Object.entries(reference)){
  const sheet=roster.get(id);assert.equal(sheet.ac,c.ac);assert.equal(sheet.maxHp,c.hp.average);assert.equal(sheet.speed,c.speed.walk);
  assert.deepEqual(sheet.movement,c.speed);assert.deepEqual(sheet.creature,c);assert.equal(sheet.passive('perception'),c.senses.passive_perception);
  for(const [skill,total]of Object.entries(c.skills))assert.equal(sheet.skillBonus(skill),total);
 }
 assert.equal(roster.get('wolf').hitDice,2);assert.equal(roster.get('hare').hitDie,4);assert.equal(roster.get('owl').hitDie,4);
 roster.get('wolf').damage(3);roster.get('wolf').spendHitDie(()=>.5);const data=roster.serialize();const restored=createCharacterRoster();restored.load(data);assert.deepEqual(restored.serialize(),data);
 const copy=roster.get('wolf').creature;copy.actions.length=0;assert.ok(roster.get('wolf').creature.actions.length>0);
});

test('all villagers have level-one human sheets and the blacksmith is tougher without extra levels',()=>{
 const ids=Object.keys(UNIT_DEFINITIONS).filter(id=>UNIT_DEFINITIONS[id].kind==='npc'),roster=createCharacterRoster(ids);assert.equal(ids.length,11);
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

test('every existing actor has an immutable authored unit with a valid stat reference',()=>{
 assert.equal(Object.keys(UNIT_DEFINITIONS).length,16);
 assert.deepEqual(Object.keys(UNIT_DEFINITIONS).sort(),Object.keys(STATS.actors).sort());
 assert.equal(validateUnitDefinitions(UNIT_DEFINITIONS,STATS.actors),UNIT_DEFINITIONS);
 assert.throws(()=>{UNIT_DEFINITIONS.fenris.information.species='human';},TypeError);
 const invalid=structuredClone(UNIT_DEFINITIONS);invalid.fenris.stats.template='missing';assert.throws(()=>validateUnitDefinitions(invalid,STATS.actors),/stat template/);
});
test('instances share a definition while keeping stats, memory, knowledge and affinity independent',()=>{
 const r=createCharacterRoster([{id:'a',unitId:'resident',name:'A'},{id:'b',unitId:'resident',name:'B'}]);
 const a=r.unit('a'),b=r.unit('b');assert.equal(a.stats,r.get('a'));assert.equal(a.snapshot().definitionId,'resident');
 const memory={id:'meeting',text:'Met Fenris.',participants:['a','fenris']};assert.equal(a.remember(memory),true);assert.equal(a.remember(memory),false);memory.text='Changed outside';
 assert.equal(a.snapshot().memories[0].text,'Met Fenris.');assert.equal(b.recalls('meeting'),false);assert.equal(a.knows('meeting'),false);
 a.learn({id:'crossing',text:'A path crosses the stream.'});a.setAffinity('b',2);a.setFlag('met-fenris');
 assert.equal(b.knows('crossing'),false);assert.equal(a.affinityTo('b'),2);assert.equal(b.affinityTo('a'),0);
 const snapshot=r.unitSnapshot();snapshot.a.memories[0].participants.push('b');snapshot.a.flags['met-fenris']=false;assert.deepEqual(a.snapshot().memories[0].participants,['a','fenris']);assert.equal(a.snapshot().flags['met-fenris'],true);
 assert.throws(()=>a.remember({text:'No ID'}),/id and text/);assert.throws(()=>a.setAffinity('b',NaN),/finite/);
 assert.throws(()=>r.register({id:'c',unitId:'missing',statId:'resident'}),/Unknown unit/);
});
test('author-only lore never becomes runtime knowledge and reset clears all individual experiences',()=>{
 const r=createCharacterRoster(['fenris','woodcutter']),u=r.unit('fenris');
 const authored=structuredClone(UNIT_DEFINITIONS.fenris);authored.story.authorOnly=['SECRET_TEST'];
 const isolated=createUnitState(authored,r.get('fenris'));assert.ok(!JSON.stringify(isolated.snapshot()).includes('SECRET_TEST'));assert.deepEqual(isolated.snapshot().knowledge,[]);
 u.remember({id:'meeting',text:'Met Torren.'});u.learn({id:'name',text:'Learned a name.'});u.setAffinity('woodcutter',1);u.stats.damage(2);
 r.reset();assert.notEqual(r.unit('fenris'),u);assert.equal(r.unit('fenris').stats,r.get('fenris'));assert.equal(r.get('fenris').hp,13);assert.deepEqual(r.unit('fenris').snapshot().memories,[]);assert.equal(r.unit('fenris').affinityTo('woodcutter'),0);
 assert.deepEqual(JSON.parse(JSON.stringify(r.unitSnapshot())),r.unitSnapshot());
});
