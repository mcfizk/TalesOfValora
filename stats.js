// D&D 5e character rules (2014 SRD 5.1 baseline; see docs/STATS.md). Pure logic: no DOM or Three.js, so it runs in node --test.
// Numbers come from stats-data.js, generated from data/stats/*.csv. Pass `rng` (returns 0..1) to make rolls repeatable in tests.
import {STATS} from './stats-data.js';
export const abilityMod=score=>Math.floor((score-10)/2);
export const die=(sides,rng=Math.random)=>1+Math.floor(rng()*sides);
export function rollD20({advantage=false,disadvantage=false,rng=Math.random}={}){const a=die(20,rng);if(advantage===disadvantage)return {roll:a,rolls:[a]};const b=die(20,rng);return {roll:advantage?Math.max(a,b):Math.min(a,b),rolls:[a,b]};}
export const proficiencyFor=(level,data=STATS)=>data.levels[level-1].proficiency;
export function levelForXp(xp,data=STATS){let level=1;for(const l of data.levels)if(xp>=l.xp)level=l.level;return level;}
// Fixed-average hit points: full hit die at level 1, then (die/2 + 1) per level, plus CON modifier each level, at least 1 per level.
export const averageHp=(hitDie,level,conMod)=>Math.max(1,hitDie+conMod)+Math.max(1,hitDie/2+1+conMod)*(level-1);

export function createCharacter(idOrDef,data=STATS){
 const def=typeof idOrDef==='string'?data.actors[idOrDef]:idOrDef;if(!def)throw new Error(`Unknown actor "${idOrDef}"`);
 const skillAbility=Object.fromEntries(data.skills.map(s=>[s.id,s.ability])),mods=new Map(),listeners=new Set();
 let level=def.level,xp=data.levels[level-1].xp;
 // Modifier targets: an ability id ('str'), 'ac', 'speed', 'maxHp', 'initiative', 'check:<ability>', 'save:<ability>', 'skill:<skill>'.
 const bonus=target=>{let n=0;for(const m of mods.values())if(m.target===target)n+=m.add;return n;};
 const score=id=>Math.min(30,Math.max(1,def.abilities[id]+bonus(id))),mod=id=>abilityMod(score(id)),prof=()=>proficiencyFor(level,data);
 const maxHp=()=>Math.max(1,(def.maxHp??averageHp(def.hitDie,level,mod('con')))+bonus('maxHp'));
 const s={hp:0,tempHp:0,hitDice:level,successes:0,failures:0,stable:false,dead:false};s.hp=maxHp();
 const status=()=>s.dead?'dead':s.hp>0?'conscious':s.stable?'stable':'dying';
 const emit=(event,detail={})=>{for(const f of listeners)f(event,detail,sheet);};
 const resetSaves=()=>{s.successes=0;s.failures=0;s.stable=false;};
 const kill=reason=>{s.dead=true;s.hp=0;s.tempHp=0;emit('died',{reason});};
 const fail=n=>{s.failures+=n;s.stable=false;if(s.failures>=3)kill('death saves');};
 const checkBonus=id=>mod(id)+bonus('check:'+id);
 const skillBonus=id=>{const ability=skillAbility[id];if(!ability)throw new Error(`Unknown skill "${id}"`);return checkBonus(ability)+prof()*(def.expertise.includes(id)?2:def.skills.includes(id)?1:0)+bonus('skill:'+id);};
 const saveBonus=id=>mod(id)+(def.saves.includes(id)?prof():0)+bonus('save:'+id);
 const sheet={
  id:def.id,name:def.name,
  get level(){return level;},get xp(){return xp;},get proficiency(){return prof();},
  get hp(){return s.hp;},get tempHp(){return s.tempHp;},get maxHp(){return maxHp();},get hitDice(){return s.hitDice;},get hitDie(){return def.hitDie;},
  get ac(){return 10+mod('dex')+bonus('ac');}, // Unarmored. Armor and shields replace this once equipment exists.
  get initiative(){return mod('dex')+bonus('initiative');},get speed(){return Math.max(0,def.speed+bonus('speed'));},
  get status(){return status();},get deathSaves(){return {successes:s.successes,failures:s.failures};},
  score,mod,checkBonus,skillBonus,saveBonus,passive:id=>10+skillBonus(id),
  // kind: 'check' (ability), 'skill' or 'save'. Returns the natural roll so callers can apply crit rules.
  roll(kind,id,opts={}){const b=kind==='skill'?skillBonus(id):kind==='save'?saveBonus(id):checkBonus(id),r=rollD20(opts);return {...r,bonus:b,total:r.roll+b,natural20:r.roll===20,natural1:r.roll===1};},
  damage(amount,type,{critical=false}={}){
   if(s.dead)return 0;amount=Math.max(0,Math.floor(amount));
   if(type&&def.immunities.includes(type))amount=0;if(type&&def.resistances.includes(type))amount=Math.floor(amount/2);if(type&&def.vulnerabilities.includes(type))amount*=2;
   if(!amount)return 0;const dealt=amount,absorbed=Math.min(s.tempHp,amount);s.tempHp-=absorbed;amount-=absorbed;
   if(amount>0){
    if(s.hp===0){if(amount>=maxHp())kill('massive damage');else fail(critical?2:1);} // Hit while down: a failed death save, two on a critical.
    else{const overflow=amount-s.hp;s.hp=Math.max(0,s.hp-amount);if(s.hp===0){resetSaves();if(overflow>=maxHp())kill('massive damage');else emit('down');}}
   }
   emit('damage',{amount:dealt,type});return dealt;},
  heal(amount){if(s.dead||amount<=0)return 0;const before=s.hp;s.hp=Math.min(maxHp(),s.hp+Math.floor(amount));if(before===0&&s.hp>0)resetSaves();emit('heal',{amount:s.hp-before});return s.hp-before;},
  grantTempHp(amount){if(s.dead)return;s.tempHp=Math.max(s.tempHp,Math.floor(amount));emit('tempHp');}, // Temporary HP never stacks; keep the higher.
  deathSave(rng=Math.random){
   if(status()!=='dying')return null;const roll=die(20,rng);
   if(roll===20){resetSaves();s.hp=1;emit('revived');}else if(roll===1)fail(2);else if(roll>=10){if(++s.successes>=3){s.stable=true;emit('stable');}}else fail(1);
   emit('deathSave',{roll});return roll;},
  stabilize(){if(status()==='dying'){s.stable=true;emit('stable');}},
  spendHitDie(rng=Math.random){if(s.dead||s.hp===0||s.hitDice<=0)return 0;s.hitDice--;return sheet.heal(Math.max(0,die(def.hitDie,rng)+mod('con')));}, // Short rest.
  longRest(){if(s.dead||s.hp===0)return false;s.hp=maxHp();s.tempHp=0;s.hitDice=Math.min(level,s.hitDice+Math.max(1,Math.floor(level/2)));resetSaves();emit('longRest');return true;},
  addXp(amount){xp+=Math.max(0,Math.floor(amount));const next=levelForXp(xp,data);if(next>level){const before=maxHp(),gained=next-level;level=next;s.hitDice+=gained;if(s.hp>0)s.hp+=maxHp()-before;emit('levelUp',{level});}return level;},
  addModifier({id,target,add,source=''}){mods.set(id,{target,add,source});s.hp=Math.min(s.hp,maxHp());emit('modifiers');},
  removeModifier(id){mods.delete(id);s.hp=Math.min(s.hp,maxHp());emit('modifiers');},
  onChange(f){listeners.add(f);return()=>listeners.delete(f);},
  snapshot:()=>({id:def.id,level,xp,proficiency:prof(),hp:s.hp,tempHp:s.tempHp,maxHp:maxHp(),hitDice:s.hitDice,ac:sheet.ac,initiative:sheet.initiative,speed:sheet.speed,status:status(),deathSaves:sheet.deathSaves,
   abilities:Object.fromEntries(data.abilities.map(a=>[a.id,{score:score(a.id),mod:mod(a.id),save:saveBonus(a.id)}])),passivePerception:10+skillBonus('perception'),modifiers:[...mods.keys()]})
 };
 return sheet;
}
