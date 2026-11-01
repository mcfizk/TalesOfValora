// Converts the author-edited tables in data/stats/*.csv into stats-data.js, which the game and tests import.
// Run `node build-stats.cjs` after editing a CSV. Rows are validated so a typo fails here instead of in the browser.
const fs=require('node:fs'),path=require('node:path');
const DIR=path.join(__dirname,'data','stats'),OUT=path.join(__dirname,'stats-data.js');
const HIT_DICE=[6,8,10,12];

// RFC 4180-style: commas, quoted fields with "" escapes, CRLF or LF. Spreadsheet exports need nothing else.
function parseCsv(text){
 const rows=[];let row=[],field='',quoted=false;text=text.replace(/^﻿/,'');
 for(let i=0;i<text.length;i++){const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
  else if(c==='"')quoted=true;else if(c===','){row.push(field);field='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
  else field+=c;}
 if(field||row.length){row.push(field);rows.push(row);}
 const [header,...body]=rows.filter(r=>r.some(v=>v.trim()));
 return body.map(r=>Object.fromEntries(header.map((h,i)=>[h.trim(),(r[i]??'').trim()])));
}

function build(read=file=>fs.readFileSync(path.join(DIR,file),'utf8')){
 const table=file=>parseCsv(read(file)).map((r,i)=>({...r,_where:`${file} row ${i+2}`}));
 const fail=(r,msg)=>{throw new Error(`${r._where}: ${msg}`);};
 const int=(r,key,min,max)=>{const v=Number(r[key]);if(!Number.isInteger(v)||v<min||v>max)fail(r,`${key} must be a whole number from ${min} to ${max}, got "${r[key]}"`);return v;};
 const unique=(rows,key='id')=>{const seen=new Set();for(const r of rows){if(!r[key])fail(r,`missing ${key}`);if(seen.has(r[key]))fail(r,`duplicate ${key} "${r[key]}"`);seen.add(r[key]);}return rows;};
 const strip=({_where,...r})=>r;
 const abilities=unique(table('abilities.csv')).map(strip),abilityIds=abilities.map(a=>a.id);
 const skills=unique(table('skills.csv')).map(r=>{if(!abilityIds.includes(r.ability))fail(r,`unknown ability "${r.ability}"`);return strip(r);}),skillIds=skills.map(s=>s.id);
 const damageTypes=unique(table('damage-types.csv')).map(r=>r.id);
 const levels=table('levels.csv').map((r,i)=>{const level=int(r,'level',1,20);if(level!==i+1)fail(r,'levels must be listed 1, 2, 3… in order');return {level,xp:int(r,'xp',0,1e9),proficiency:int(r,'proficiency',2,6)};});
 if(levels.length!==20)throw new Error('levels.csv must list levels 1 to 20');
 const list=(r,key,allowed)=>{const ids=r[key]?r[key].split(/\s+/):[];for(const id of ids)if(!allowed.includes(id))fail(r,`${key}: unknown id "${id}"`);return ids;};
 const actors=Object.fromEntries(unique(table('actors.csv')).map(r=>{
  const skillsList=list(r,'skills',skillIds),expertise=list(r,'expertise',skillIds);
  for(const id of expertise)if(!skillsList.includes(id))fail(r,`expertise "${id}" also needs to be in skills`);
  const hitDie=int(r,'hit_die',4,20);if(!HIT_DICE.includes(hitDie))fail(r,`hit_die must be one of ${HIT_DICE.join(', ')}`);
  const powerKind=r.power_kind||null,powerMax=r.power_max?int(r,'power_max',0,99999):0;
  if(powerMax>0&&!powerKind)fail(r,'power_kind is required when power_max is positive');
  const powerCurrent=r.power_start?int(r,'power_start',0,powerMax):powerMax;
  return [r.id,{id:r.id,name:r.name||r.id,species:r.species||null,level:int(r,'level',1,20),hitDie,
   abilities:Object.fromEntries(abilityIds.map(id=>[id,int(r,id,1,30)])),speed:int(r,'speed',0,200),
   saves:list(r,'saves',abilityIds),skills:skillsList,expertise,
   resistances:list(r,'resistances',damageTypes),immunities:list(r,'immunities',damageTypes),vulnerabilities:list(r,'vulnerabilities',damageTypes),
   power:{kind:powerKind,max:powerMax,current:powerCurrent},
   maxHp:r.max_hp?int(r,'max_hp',1,9999):null,notes:r.notes||''}];}));
 // The supplied creature JSON is authoritative for creature-specific values;
 // CSV rows retain stable actor IDs and the common character-rule scaffolding.
 if(['deer','wolf','hare','owl'].some(id=>actors[id])){
  const creatures=JSON.parse(read('reference/critters.json'));
  for(const [id,c]of Object.entries(creatures)){
   if(!actors[id])continue;
   const dice=/^(\d+)d(\d+)/.exec(c.hp?.formula||'');
   if(!dice||![4,6,8,10,12].includes(Number(dice[2]))||!Number.isInteger(c.ac)||!Number.isInteger(c.hp.average)||!Object.values(c.abilities||{}).every(n=>Number.isInteger(n)&&n>=1&&n<=30))throw new Error(`Invalid creature reference: ${id}`);
   const actor=actors[id];Object.assign(actor,{abilities:c.abilities,maxHp:c.hp.average,hitDie:Number(dice[2]),hitDiceMax:Number(dice[1]),speed:c.speed.walk,baseAc:c.ac-Math.floor((c.abilities.dex-10)/2),statBlock:c});
   for(const [skill,total]of Object.entries(c.skills||{})){
    const ability=skills.find(s=>s.id===skill)?.ability;if(!ability)throw new Error(`Unknown creature skill: ${id}.${skill}`);
    const derived=Math.floor((c.abilities[ability]-10)/2)+(actor.expertise.includes(skill)?2:actor.skills.includes(skill)?1:0)*levels[actor.level-1].proficiency;
    if(derived!==total)throw new Error(`Creature skill ${id}.${skill} differs from its CSV proficiencies`);
   }
  }
 }
 return {abilities,skills,levels,damageTypes,actors};
}

const source=data=>`// Generated by build-stats.cjs from data/stats/*.csv and reference/critters.json. Edit sources, then run \`node build-stats.cjs\`.\nexport const STATS=${JSON.stringify(data,null,1)};\n`;
module.exports={parseCsv,build,source,OUT};
if(require.main===module){const data=build();fs.writeFileSync(OUT,source(data));console.log(`stats-data.js: ${Object.keys(data.actors).length} actor(s), ${data.skills.length} skills`);}
