import test from 'node:test';
import assert from 'node:assert/strict';
import {createCharacter} from '../stats.js';
import {ALL_PEOPLE} from './village-people.js';
import {CONVERSATIONS,createConversations} from './conversations.js';
import {createVillageEconomy} from './village-economy.js';

test('every villager has multiple choices, valid skills, unique IDs and reachable outcome nodes',()=>{
 const sheet=createCharacter('fenris');
 for(const person of ALL_PEOPLE){const nodes=CONVERSATIONS[person.id];assert.ok(nodes);assert.ok(nodes.root.choices.length>=3);const ids=new Set();
  for(const node of Object.values(nodes))for(const option of node.choices){assert.ok(!ids.has(option.id));ids.add(option.id);if(option.check)assert.ok(Number.isFinite(sheet.skillBonus(option.check.skill)));
   for(const outcome of option.check?[option.success,option.failure]:[option.result])assert.ok(nodes[outcome.next]);
  }
 }
});
test('checks use current proficiency and modifiers; totals meet the DC without special critical rules',()=>{
 const sheet=createCharacter('fenris'),c=createConversations({rng:()=>.35}); // d20 8 + Athletics 4 = 12
 const result=c.choose('woodcutter','root','lift',sheet,{job:'available'});assert.equal(result.roll.bonus,4);assert.equal(result.roll.total,12);assert.ok(result.success);
 sheet.addModifier({id:'test',target:'skill:medicine',add:-20});const natural20=createConversations({rng:()=>.999}).choose('herbalist','root','binding',sheet);assert.equal(natural20.roll.roll,20);assert.equal(natural20.success,false);
 sheet.addModifier({id:'test2',target:'skill:medicine',add:40});const natural1=createConversations({rng:()=>0}).choose('herbalist','root','binding',sheet);assert.equal(natural1.roll.roll,1);assert.equal(natural1.success,true);
});
test('a failed check and alternative negotiations cannot be rerolled; rewards cannot repeat',()=>{
 let rolls=0;const c=createConversations({rng:()=>{rolls++;return 0;}}),sheet=createCharacter('fenris');
 const a=c.choose('trader','bargain','discount',sheet),b=c.choose('trader','bargain','pressure',sheet);assert.equal(a.success,false);assert.equal(b.fresh,false);assert.equal(rolls,1);
 assert.ok(c.view('trader','bargain',sheet).choices.every(o=>o.resolved));
 const e=createVillageEconomy();assert.ok(e.applyConversation('gift',{items:{bread:1}},'store'));assert.equal(e.applyConversation('gift',{items:{bread:1}},'store'),false);assert.equal(e.snapshot().bag.bread,1);
});
test('insight unlocks a lower difficulty branch, threats make later persuasion harder',()=>{
 const c=createConversations({rng:()=>.999}),sheet=createCharacter('fenris');assert.ok(!c.view('trader','bargain',sheet).choices.some(o=>o.id==='fair'));
 assert.equal(c.choose('trader','bargain','fair',sheet),null);c.choose('trader','root','read',sheet);assert.equal(c.view('trader','bargain',sheet).choices.find(o=>o.id==='fair').check.dc,10);
 c.choose('harl','root','threat',sheet);assert.equal(c.view('trader','bargain',sheet).choices.find(o=>o.id==='fair').check.dc,12);
 assert.equal(c.view('woodcutter','root',sheet,{job:'available'}).choices.find(o=>o.id==='lift').check.dc,12);
});
test('successful bargains and failed intimidation actually change transaction prices',()=>{
 const sheet=createCharacter('fenris'),e=createVillageEconomy(),c=createConversations({rng:()=>.999});const result=c.choose('trader','bargain','discount',sheet);e.applyConversation(result.key,result.effects,'store');
 assert.equal(e.price('store','bread'),2);assert.equal(e.price('market','bread'),3);e.acceptJob();e.stackWood();e.claimPay();e.buy('store','bread');assert.equal(e.snapshot().copper,10);
 const f=createVillageEconomy(),failure=createConversations({rng:()=>0}).choose('trader','bargain','pressure',sheet);f.applyConversation(failure.key,failure.effects,'store');assert.equal(f.price('store','bandage'),9);
 e.applyConversation('market-discount',{discount:1},'market');assert.equal(e.price('market','apple'),1);
});
test('job bonus pays once and cannot be negotiated after stacking or payment',()=>{
 const c=createConversations({rng:()=>.999}),e=createVillageEconomy(),sheet=createCharacter('fenris');e.acceptJob();const result=c.choose('woodcutter','root','lift',sheet,e.snapshot());e.applyConversation(result.key,result.effects);
 e.stackWood();assert.equal(c.choose('woodcutter','root','lift',sheet,e.snapshot()),null);e.claimPay();assert.equal(e.snapshot().copper,16);assert.equal(e.claimPay(),false);
});
test('non-roll responses change attitude once; a new visit resets flags, rolls and history',()=>{
 const sheet=createCharacter('fenris'),c=createConversations();const a=c.choose('resident','root','space',sheet),b=c.choose('resident','root','space',sheet);assert.equal(a.roll,null);assert.equal(b.fresh,false);assert.equal(c.snapshot().attitudes.resident,1);assert.equal(c.snapshot().history.length,1);
 const detached=c.snapshot();detached.history[0].effects.attitude=100;assert.equal(c.snapshot().history[0].effects.attitude,1);assert.deepEqual(createConversations().snapshot(),{flags:[],attitudes:{},history:[]});
});
test('care discount affects paid healing while full-health treatment stays free of charges',()=>{
 const sheet=createCharacter('fenris'),c=createConversations({rng:()=>.999}),e=createVillageEconomy(),result=c.choose('innkeeper','root','care',sheet);e.applyConversation(result.key,result.effects,'inn');e.acceptJob();e.stackWood();e.claimPay();assert.equal(e.treatment(sheet),false);sheet.damage(5);assert.ok(e.treatment(sheet));assert.equal(e.snapshot().copper,9);assert.equal(sheet.hp,12);
});
