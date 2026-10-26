import {createCharacter} from './stats.js';
import {STATS} from './stats-data.js';

// World entities own sheets independently of their visible sprite or current scene.
// Future turn-based encounters must use these same sheets, never temporary copies.
export function createCharacterRoster(initial=[]){
  const definitions=new Map(),sheets=new Map();
  function register(entity){
    const {id,statId=id,name}=typeof entity==='string'?{id:entity}:entity;
    if(typeof id!=='string'||!id)throw new Error('A world character needs a stable instance id.');
    if(definitions.has(id))throw new Error(`Duplicate world character: ${id}`);
    const template=STATS.actors[statId];if(!template)throw new Error(`World character ${id} has no stats: ${statId}`);
    if(!template.species)throw new Error(`World character ${id} needs a species in its stat definition.`);
    const definition={...structuredClone(template),id,name:name||template.name};
    definitions.set(id,definition);const sheet=createCharacter(definition);sheets.set(id,sheet);return sheet;
  }
  function get(id){if(!sheets.has(id))throw new Error(`Unregistered world character: ${id}`);return sheets.get(id);}
  for(const entity of initial)register(entity);
  return Object.freeze({register,get,has:id=>sheets.has(id),
    snapshot:()=>Object.fromEntries([...sheets].map(([id,sheet])=>[id,sheet.snapshot()])),
    reset(){for(const [id,definition] of definitions)sheets.set(id,createCharacter(structuredClone(definition)));}
  });
}
