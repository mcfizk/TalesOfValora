import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import build from '../build-stats.cjs';
import {STATS} from '../stats-data.js';
import {abilityMod,proficiencyFor,levelForXp,averageHp,createCharacter,rollD20} from '../stats.js';
const {parseCsv,source,OUT}=build;
const rolls=(...values)=>{let i=0;return ()=>(values[i++]-1)/20;}; // rng that makes a d20 land on the given faces
const actor=(over={})=>({id:'test',name:'Test',level:1,hitDie:10,abilities:{str:10,dex:14,con:14,int:10,wis:12,cha:8},speed:30,saves:['str','con'],skills:['perception'],expertise:[],resistances:[],immunities:[],vulnerabilities:[],maxHp:null,...over});

test('stats-data.js is regenerated from the CSV files',()=>{assert.equal(fs.readFileSync(OUT,'utf8'),source(build.build()),'Run `node build-stats.cjs` after editing data/stats/*.csv');});
test('CSV parser handles quotes, commas, CRLF and blank lines',()=>{assert.deepEqual(parseCsv('id,notes\r\na,"x, ""y"""\r\n\r\nb,\n'),[{id:'a',notes:'x, "y"'},{id:'b',notes:''}]);});
test('invalid rows fail the build with their location',()=>{const files={'abilities.csv':'id,name\nstr,S','skills.csv':'id,name,ability\nathletics,A,str','damage-types.csv':'id,name\nfire,F','levels.csv':'level,xp,proficiency\n'+STATS.levels.map(l=>`${l.level},${l.xp},${l.proficiency}`).join('\n')};
 const bad=row=>()=>build.build(f=>f==='actors.csv'?'id,name,level,hit_die,str,speed,saves,skills,expertise,resistances,immunities,vulnerabilities,max_hp\n'+row:files[f]);
 assert.doesNotThrow(bad('a,A,1,10,10,30,str,athletics,,fire,,,'));
 assert.throws(bad('a,A,1,10,31,30,,,,,,,'),/actors.csv row 2: str/);assert.throws(bad('a,A,1,7,10,30,,,,,,,'),/hit_die/);
 assert.throws(bad('a,A,1,10,10,30,,stealth,,,,,'),/unknown id "stealth"/);assert.throws(bad('a,A,1,10,10,30,,,athletics,,,,'),/expertise/);});

test('5e ability modifiers and proficiency table',()=>{assert.deepEqual([1,8,9,10,11,15,20,30].map(abilityMod),[-5,-1,-1,0,0,2,5,10]);assert.deepEqual([1,4,5,9,13,17,20].map(l=>proficiencyFor(l)),[2,2,3,4,5,6,6]);assert.equal(levelForXp(0),1);assert.equal(levelForXp(899),2);assert.equal(levelForXp(900),3);assert.equal(levelForXp(1e7),20);});
test('average hit points follow the fixed-value rule',()=>{assert.equal(averageHp(10,1,2),12);assert.equal(averageHp(10,3,2),28);assert.equal(averageHp(6,2,-5),2);});
test('Fenris loads from the CSV and derives a full sheet',()=>{const f=createCharacter('fenris'),s=f.snapshot();assert.equal(f.maxHp,averageHp(STATS.actors.fenris.hitDie,f.level,f.mod('con')));assert.equal(s.hp,s.maxHp);assert.equal(s.ac,10+f.mod('dex'));assert.equal(s.passivePerception,10+f.skillBonus('perception'));assert.equal(s.status,'conscious');assert.equal(Object.keys(s.abilities).length,6);});
test('saves, skills and expertise add proficiency',()=>{const c=createCharacter(actor({skills:['perception','stealth'],expertise:['stealth']}));assert.equal(c.saveBonus('con'),2+2);assert.equal(c.saveBonus('dex'),2);assert.equal(c.skillBonus('perception'),1+2);assert.equal(c.skillBonus('stealth'),2+4);assert.equal(c.skillBonus('athletics'),0);assert.equal(c.passive('perception'),13);});
test('d20 rolls apply advantage and disadvantage',()=>{assert.equal(rollD20({advantage:true,rng:rolls(4,17)}).roll,17);assert.equal(rollD20({disadvantage:true,rng:rolls(4,17)}).roll,4);assert.deepEqual(rollD20({advantage:true,disadvantage:true,rng:rolls(9)}).rolls,[9]);const c=createCharacter(actor()).roll('skill','perception',{rng:rolls(20)});assert.equal(c.total,23);assert.ok(c.natural20);});

test('temporary HP absorbs damage first and does not stack',()=>{const c=createCharacter(actor());c.grantTempHp(5);c.grantTempHp(3);assert.equal(c.tempHp,5);c.damage(7);assert.equal(c.tempHp,0);assert.equal(c.hp,10);});
test('resistance, vulnerability and immunity',()=>{const c=createCharacter(actor({resistances:['fire'],vulnerabilities:['cold'],immunities:['poison']}));assert.equal(c.damage(5,'fire'),2);assert.equal(c.damage(3,'cold'),6);assert.equal(c.damage(9,'poison'),0);assert.equal(c.hp,4);});
test('dropping to 0 HP starts death saves; three successes stabilise',()=>{const c=createCharacter(actor());c.damage(15);assert.equal(c.status,'dying');for(const r of [10,15,12])c.deathSave(rolls(r));assert.equal(c.status,'stable');c.damage(1);assert.equal(c.status,'dying');assert.equal(c.deathSaves.failures,1);});
test('natural 1 counts twice, critical hits while down count twice, three failures kill',()=>{const c=createCharacter(actor());c.damage(12);c.deathSave(rolls(1));assert.equal(c.deathSaves.failures,2);c.damage(1,null,{critical:false});assert.equal(c.status,'dead');assert.equal(c.heal(5),0);const d=createCharacter(actor());d.damage(12);d.damage(1,null,{critical:true});d.deathSave(rolls(9));assert.equal(d.status,'dead');});
test('natural 20 revives with 1 HP; healing at 0 HP clears death saves',()=>{const c=createCharacter(actor());c.damage(12);c.deathSave(rolls(5));c.deathSave(rolls(20));assert.equal(c.hp,1);assert.equal(c.deathSaves.failures,0);c.damage(1);c.deathSave(rolls(3));c.heal(4);assert.equal(c.status,'conscious');assert.equal(c.deathSaves.failures,0);});
test('massive damage kills outright',()=>{const c=createCharacter(actor());c.damage(c.maxHp*2);assert.equal(c.status,'dead');const d=createCharacter(actor());d.damage(d.maxHp*2-1);assert.equal(d.status,'dying');});
test('hit dice heal on a short rest; a long rest restores HP and half the dice',()=>{const c=createCharacter(actor({level:4}));c.damage(20);assert.equal(c.spendHitDie(()=>.5),6+2);assert.equal(c.hitDice,3);c.spendHitDie();c.spendHitDie();c.spendHitDie();assert.equal(c.spendHitDie(),0);c.longRest();assert.equal(c.hp,c.maxHp);assert.equal(c.hitDice,2);const down=createCharacter(actor());down.damage(12);assert.equal(down.longRest(),false);});
test('experience levels up and raises HP and hit dice',()=>{const c=createCharacter(actor());c.damage(4);assert.equal(c.addXp(900),3);assert.equal(c.maxHp,28);assert.equal(c.hp,24);assert.equal(c.hitDice,3);assert.equal(c.proficiency,2);});
test('modifiers adjust derived values and clamp HP when removed',()=>{const c=createCharacter(actor());c.addModifier({id:'belt',target:'con',add:4});assert.equal(c.maxHp,14);c.heal(99);assert.equal(c.hp,14);c.addModifier({id:'shield',target:'ac',add:2});assert.equal(c.ac,14);c.addModifier({id:'tired',target:'speed',add:-40});assert.equal(c.speed,0);c.removeModifier('belt');assert.equal(c.hp,12);assert.deepEqual(c.snapshot().modifiers,['shield','tired']);});
test('change listeners report events',()=>{const c=createCharacter(actor()),events=[];const off=c.onChange(e=>events.push(e));c.damage(12);off();c.heal(1);assert.deepEqual(events,['down','damage']);});


test('stabilizing clears both death-save counters before later damage',()=>{
 for(const method of ['saves','firstAid']){
  const c=createCharacter(actor());c.damage(c.maxHp);c.deathSave(rolls(1));c.deathSave(rolls(10));
  if(method==='saves'){c.deathSave(rolls(10));c.deathSave(rolls(10));}else c.stabilize();
  assert.equal(c.status,'stable');assert.deepEqual(c.deathSaves,{successes:0,failures:0});
  c.damage(1);assert.equal(c.status,'dying');assert.deepEqual(c.deathSaves,{successes:0,failures:1});
  c.deathSave(rolls(10));assert.equal(c.status,'dying');assert.deepEqual(c.deathSaves,{successes:1,failures:1});
 }
});

test('diagnostic snapshots cannot mutate character state',()=>{
 const c=createCharacter('fenris'),before=c.snapshot(),copy=c.snapshot();
 copy.hp=0;copy.abilities.str.score=30;copy.deathSaves.failures=3;copy.modifiers.push('fake');
 assert.deepEqual(c.snapshot(),before);
});
