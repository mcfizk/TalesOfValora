// Provisional Valora rules. Completion hooks intentionally do not heal or repair gear yet.
export const REST_RULES=Object.freeze({shortMinutes:60,longMinutes:480,sleepMinutes:480,cooldownMinutes:1440,exhaustionMinutes:1440,waitThreshold:60,waitPerception:-1,waitInitiative:-1,exhaustionCheck:-2,exhaustionSpeed:.8});
const kinds=['wait','short','long','sleep'];
export function createRestTracker(now){
 let s;
 const reset=at=>{s={version:1,lastRestAt:at,lastSleepStart:null,waitMinutes:0,waitPenalty:false,exhausted:false,completed:{short:0,long:0,sleep:0}};};reset(now);
 const eligibleAt=()=>s.lastSleepStart===null?null:s.lastSleepStart+REST_RULES.cooldownMinutes;
 return {
  reset,
  available(kind,at){return !['long','sleep'].includes(kind)||eligibleAt()===null||at>=eligibleAt();},
  begin(kind,at,minutes){
   if(!kinds.includes(kind)||!Number.isFinite(at)||!Number.isFinite(minutes)||minutes<=0)throw Error('Invalid rest activity');
   if(!this.available(kind,at))throw Error('Sleep and long rest are available once every 24 hours.');
   const duration=kind==='wait'?minutes:REST_RULES[kind+'Minutes'];
   // Reserve the shared rolling window on starting, including interrupted attempts.
   if(kind==='long'||kind==='sleep')s.lastSleepStart=at;
   return {kind,start:at,target:at+duration};
  },
  tick(at,{kind=null,elapsed=0,moving=false}={}){
   if(moving)s.waitMinutes=0;
   if(kind==='wait')s.waitMinutes+=Math.max(0,elapsed);
   if(s.waitMinutes>REST_RULES.waitThreshold+1e-7)s.waitPenalty=true;
   if(at-s.lastRestAt>=REST_RULES.exhaustionMinutes)s.exhausted=true;
  },
  complete(kind,at){
   if(kind==='wait')return;
   if(!['short','long','sleep'].includes(kind))throw Error('Invalid completed rest');
   s.lastRestAt=at;s.waitMinutes=0;s.waitPenalty=false;s.completed[kind]++;
   if(kind==='long'||kind==='sleep')s.exhausted=false;
   return {kind,at};
  },
  snapshot(){return {...structuredClone(s),nextSleepAt:eligibleAt(),speedMultiplier:s.exhausted?REST_RULES.exhaustionSpeed:1};},
  serialize:()=>structuredClone(s),
  load(data,at){
   if(!data){reset(at);return;}
   const nonnegative=n=>Number.isFinite(n)&&n>=0;
   if(data.version!==1||!nonnegative(data.lastRestAt)||data.lastRestAt>at||(data.lastSleepStart!==null&&(!nonnegative(data.lastSleepStart)||data.lastSleepStart>at))||!nonnegative(data.waitMinutes)||typeof data.waitPenalty!=='boolean'||typeof data.exhausted!=='boolean'||!['short','long','sleep'].every(k=>Number.isInteger(data.completed?.[k])&&data.completed[k]>=0))throw Error('Invalid saved rest state');
   s=structuredClone(data);this.tick(at);
  }
 };
}
export function applyRestEffects(sheet,rest){
 const prefix='rest:',remove=id=>sheet.removeModifier(prefix+id),add=(id,target,value)=>sheet.addModifier({id:prefix+id,target,add:value,source:'Rest and fatigue'});
 for(const id of ['wait:perception','wait:initiative','exhaustion:speed',...['str','dex','con','int','wis','cha'].map(a=>'exhaustion:'+a)])remove(id);
 if(rest.waitPenalty){add('wait:perception','skill:perception',REST_RULES.waitPerception);add('wait:initiative','initiative',REST_RULES.waitInitiative);}
 if(rest.exhausted){
  for(const ability of ['str','dex','con','int','wis','cha'])add('exhaustion:'+ability,'check:'+ability,REST_RULES.exhaustionCheck);
  add('exhaustion:speed','speed',-sheet.speed*(1-REST_RULES.exhaustionSpeed));
 }
}
