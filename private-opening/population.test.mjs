import test from 'node:test';
import assert from 'node:assert/strict';
import {WORLD_POPULATION,populationTemplate,populationSprite} from '../units/population.js';
import {createVillageLayout} from './village-layout.js';
import {VILLAGE_UNITS} from '../units/catalog.js';
import {ALL_PEOPLE,npcConfig} from './village-people.js';
test('world population baseline remains authored, with validated regional variation',()=>{
 assert.deepEqual(WORLD_POPULATION,{human:86,halfling:5,'half-elf':4,dwarf:3,elf:1,other:1});
 assert.deepEqual(createVillageLayout(123).populationTemplate,WORLD_POPULATION);
 assert.equal(createVillageLayout(123,{demographics:{human:80,halfling:11}}).populationTemplate.halfling,11);
 assert.throws(()=>populationTemplate({human:100}),/total 100/);assert.throws(()=>populationTemplate({elf:-1,other:3}),/total 100/);
 assert.throws(()=>npcConfig({id:'future-elf',species:'elf',walkBase:'human-female'}),/No installed NPC sprite/);
 assert.equal(WORLD_POPULATION.human,86);assert.equal(populationSprite('elf','female'),null);
});
test('named villagers remain stable and use all three available ancestries without forcing census quotas',()=>{
 assert.equal(ALL_PEOPLE.length,11);const counts={};
 for(const u of VILLAGE_UNITS){counts[u.information.species]=(counts[u.information.species]||0)+1;const gender=u.presentation.walkBase.endsWith('-female')?'female':'male';assert.equal(u.presentation.walkBase,populationSprite(u.information.species,gender));}
 assert.deepEqual(counts,{human:9,halfling:1,dwarf:1});
 assert.equal(VILLAGE_UNITS.find(u=>u.id==='farmer').name,'Mara');assert.equal(VILLAGE_UNITS.find(u=>u.id==='resident').name,'Oren');
});
