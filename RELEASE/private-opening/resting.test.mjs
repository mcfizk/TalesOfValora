import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestTracker,REST_RULES,applyRestEffects} from './resting.js';
import {createCharacter} from '../stats.js';

test('waiting penalties start strictly after an hour and persist until completed rest',()=>{
 const r=createRestTracker(1320),s=createCharacter('fenris'),perception=s.passive('perception'),initiative=s.initiative;
 r.tick(1380,{kind:'wait',elapsed:60});assert.equal(r.snapshot().waitPenalty,false);
 r.tick(1381,{kind:'wait',elapsed:1});applyRestEffects(s,r.snapshot());assert.equal(s.passive('perception'),perception-1);assert.equal(s.initiative,initiative-1);
 r.tick(1382,{moving:true});assert.equal(r.snapshot().waitMinutes,0);assert.equal(r.snapshot().waitPenalty,true);
 r.complete('short',1442);applyRestEffects(s,r.snapshot());assert.equal(s.passive('perception'),perception);assert.equal(s.initiative,initiative);
});
test('short rest lasts an hour; sleep and long rest share a rolling 24-hour reservation',()=>{
 const r=createRestTracker(1320);assert.deepEqual(r.begin('short',1320,60),{kind:'short',start:1320,target:1380});
 const sleep=r.begin('sleep',1380,480);assert.equal(sleep.target,1860);assert.equal(r.available('long',2819),false);assert.throws(()=>r.begin('long',2819,480),/24 hours/);
 // An interrupted attempt still reserves the shared window, across midnight and reload.
 const loaded=createRestTracker(1400);loaded.load(r.serialize(),1400);assert.equal(loaded.available('sleep',2819),false);assert.equal(loaded.available('long',2820),true);
 assert.equal(loaded.begin('long',2820,480).target,3300);assert.equal(loaded.available('short',2820),true);
});
test('exhaustion affects actual skill bonuses and speed without changing scores, HP or saves',()=>{
 const r=createRestTracker(1320),s=createCharacter('fenris'),original=s.snapshot(),athletics=s.skillBonus('athletics'),wis=s.checkBonus('wis');s.damage(3);
 r.tick(2759.99);assert.equal(r.snapshot().exhausted,false);r.tick(2760);assert.equal(r.snapshot().exhausted,true);
 applyRestEffects(s,r.snapshot());assert.equal(s.skillBonus('athletics'),athletics-2);assert.equal(s.checkBonus('wis'),wis-2);assert.equal(s.snapshot().abilities.wis.score,original.abilities.wis.score);assert.equal(s.saveBonus('wis'),original.abilities.wis.save);assert.ok(Math.abs(s.speed-original.speed*.8)<1e-6);assert.equal(s.hp,original.hp-3);
 applyRestEffects(s,r.snapshot());assert.ok(Math.abs(s.speed-original.speed*.8)<1e-6);
 r.complete('short',2820);assert.equal(r.snapshot().exhausted,true);assert.equal(r.snapshot().lastRestAt,2820);
 r.complete('long',3300);applyRestEffects(s,r.snapshot());assert.equal(r.snapshot().exhausted,false);assert.equal(s.speed,original.speed);assert.equal(s.hp,original.hp-3);assert.equal(r.snapshot().completed.long,1);
});
test('waiting cannot reset exhaustion, short rests prevent it, and effects stack once',()=>{
 const r=createRestTracker(1320),s=createCharacter('fenris'),base=s.passive('perception');
 r.tick(2760,{kind:'wait',elapsed:1440});r.complete('wait',2760);applyRestEffects(s,r.snapshot());assert.equal(s.passive('perception'),base-3);
 const newer=createRestTracker(1320);newer.complete('short',2700);newer.tick(2760);assert.equal(newer.snapshot().exhausted,false);
 r.complete('sleep',3240);applyRestEffects(s,r.snapshot());assert.equal(s.passive('perception'),base);
});
test('rest state round-trips, old saves receive a grace period and invalid saves fail',()=>{
 const r=createRestTracker(1320);r.begin('long',1320,480);r.tick(1400,{kind:'wait',elapsed:80});const saved=r.serialize(),copy=createRestTracker(1400);copy.load(saved,1400);assert.deepEqual(copy.serialize(),saved);
 assert.throws(()=>copy.load({...saved,lastRestAt:2000},1400),/saved rest/);assert.deepEqual(copy.serialize(),saved);
 copy.load(undefined,5000);assert.equal(copy.snapshot().lastRestAt,5000);assert.equal(copy.snapshot().exhausted,false);copy.tick(5000+REST_RULES.exhaustionMinutes);assert.equal(copy.snapshot().exhausted,true);
});
