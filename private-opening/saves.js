import {createCharacterRoster} from '../world-characters.js';
import {VILLAGE_UNITS} from '../units/catalog.js';
import {createVillageEconomy} from './village-economy.js';
import {createConversations} from './conversations.js';
import {createPerception} from './perception.js';
import {PERCEPTION_EVENTS,PERCEPTION_MODE} from './perception-events.js';
import {createGameClock} from './game-clock.js';
import {createVillageLayout,makeInterior} from './village-layout.js';

export const SAVE_VERSION=1,SAVE_SLOTS=3;
const prefix='tales-of-valora:save:';
export function validateGameSave(data){
  const nonnegative=n=>Number.isFinite(n)&&n>=0;
  if(!data||!Number.isInteger(data.seed)||data.seed<0||data.seed>0xffffffff||!['waking','explore'].includes(data.phase)||!['age','time','distance','minutes','subtitleUntil'].every(k=>nonnegative(data[k])))throw new Error('Invalid saved journey');
  const p=data.player;
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!['left','right','up','down','up-left','up-right','down-left','down-right'].includes(p.direction)||![null,'sleep','sleepToSit','sit','sitToStand'].includes(p.action)||!nonnegative(p.actionTime)||!nonnegative(p.animation))throw new Error('Invalid saved player');
  if(!Array.isArray(data.notes)||data.notes.some(e=>!Array.isArray(e)||typeof e[0]!=='string'||typeof e[1]?.title!=='string'||typeof e[1]?.text!=='string')||!Array.isArray(data.found)||data.found.some(id=>!data.notes.some(([key])=>key===id))||!Array.isArray(data.voices)||data.voices.some(id=>typeof id!=='string'))throw new Error('Invalid saved discoveries');
  if(!['visitedVillage','seated','villageDiscovered','villageTracking','audioOn','reduced'].every(k=>typeof data[k]==='boolean'))throw new Error('Invalid saved settings');
  const roster=createCharacterRoster();roster.load(data.characters);
  for(const id of ['fenris',...VILLAGE_UNITS.map(u=>u.id)])if(!roster.has(id))throw new Error(`Save is missing ${id}`);
  const economy=createVillageEconomy();economy.load(data.town?.economy);
  const conversations=createConversations();conversations.load(data.town?.conversations);
  const perception=createPerception({events:PERCEPTION_EVENTS,mode:PERCEPTION_MODE});perception.load(data.perception);
  createGameClock().load(data.minutes);
  if(data.interior!==null){const b=createVillageLayout(data.seed).buildings.find(b=>b.id===data.interior);if(!b||!['inn','store','smith','apothecary'].includes(b.id))throw new Error('Invalid saved interior');makeInterior(b);}
  return data;
}
export function createSaveSlots(storage,{now=()=>new Date().toISOString(),validate=validateGameSave}={}){
  const key=slot=>{if(!Number.isInteger(slot)||slot<1||slot>SAVE_SLOTS)throw new Error('Choose a slot from 1 to 3');return prefix+slot;};
  function read(slot){
    let raw;try{raw=storage.getItem(key(slot));}catch{throw new Error('Browser storage is unavailable. Saving needs storage enabled for this site.');}
    if(!raw)return null;
    let save;try{save=JSON.parse(raw);}catch{throw new Error('This save could not be read. Choose another slot or replace it with a new game.');}
    if(save?.version!==SAVE_VERSION||save.game!=='TalesOfValora'||save.slot!==slot||typeof save.savedAt!=='string'||!Number.isFinite(Date.parse(save.savedAt)))throw new Error('This slot is damaged or uses an unsupported save version.');
    validate(save.data);return save;
  }
  return {
    read,
    list:()=>Array.from({length:SAVE_SLOTS},(_,i)=>{const slot=i+1;try{const save=read(slot);return {slot,status:save?'saved':'empty',save};}catch(error){return {slot,status:'unavailable',error:error.message};}}),
    write(slot,data){
      const storageKey=key(slot);validate(data);const save={game:'TalesOfValora',version:SAVE_VERSION,slot,savedAt:now(),data:structuredClone(data)};
      try{storage.setItem(storageKey,JSON.stringify(save));}catch{throw new Error('Could not save. Browser storage may be full or disabled; your previous save was kept.');}
      return save;
    }
  };
}
