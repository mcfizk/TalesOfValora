import {createCharacter} from './stats.js';
import {STATS} from './stats-data.js';
import {UNIT_DEFINITIONS} from './units/catalog.js';
import {createUnitState} from './units/unit-state.js';

// World entities own sheets independently of their visible sprite or current scene.
// Future turn-based encounters must use these same sheets, never temporary copies.
export function createCharacterRoster(initial=[]){
  const definitions=new Map(),sheets=new Map(),units=new Map();
  function register(entity){
    const request=typeof entity==='string'?{id:entity}:entity;
    const {id,name}=request;
    const authored=request.unitId?UNIT_DEFINITIONS[request.unitId]:UNIT_DEFINITIONS[id]||UNIT_DEFINITIONS[request.statId];
    if(request.unitId&&!authored)throw new Error(`Unknown unit definition: ${request.unitId}`);
    const statId=request.statId||authored?.stats.template||id;
    if(typeof id!=='string'||!id)throw new Error('A world character needs a stable instance id.');
    if(definitions.has(id))throw new Error(`Duplicate world character: ${id}`);
    const template=STATS.actors[statId];if(!template)throw new Error(`World character ${id} has no stats: ${statId}`);
    if(!template.species)throw new Error(`World character ${id} needs a species in its stat definition.`);
    const definition={...structuredClone(template),id,name:name||template.name};
    const unit=authored||{id:statId,kind:'npc',initialState:{}};
    definitions.set(id,{statId,stats:definition,unit:structuredClone(unit)});const sheet=createCharacter(definition);sheets.set(id,sheet);units.set(id,createUnitState(unit,sheet));return sheet;
  }
  function get(id){if(!sheets.has(id))throw new Error(`Unregistered world character: ${id}`);return sheets.get(id);}
  for(const entity of initial)register(entity);
  return Object.freeze({register,get,has:id=>sheets.has(id),
    serialize:()=>({version:1,units:[...definitions].map(([id,d])=>({id,statId:d.statId,unitId:UNIT_DEFINITIONS[d.unit.id]?d.unit.id:undefined,name:d.stats.name,stats:sheets.get(id).serialize(),state:units.get(id).snapshot()}))}),
    load(saved){
      if(saved?.version!==1||!Array.isArray(saved.units))throw new Error('Invalid saved roster');
      const staged=createCharacterRoster(saved.units.map(({id,statId,unitId,name})=>({id,statId,unitId,name})));
      for(const u of saved.units){staged.get(u.id).load(u.stats);staged.unit(u.id).load(u.state);}
      // Commit only after every unit and stat sheet has loaded successfully.
      definitions.clear();sheets.clear();units.clear();
      for(const u of saved.units){register({id:u.id,statId:u.statId,unitId:u.unitId,name:u.name});sheets.set(u.id,staged.get(u.id));units.set(u.id,staged.unit(u.id));}
    },
    unit(id){get(id);return units.get(id);},
    unitSnapshot:()=>Object.fromEntries([...units].map(([id,unit])=>[id,unit.snapshot()])),
    snapshot:()=>Object.fromEntries([...sheets].map(([id,sheet])=>[id,sheet.snapshot()])),
    reset(){for(const [id,definition] of definitions){const sheet=createCharacter(structuredClone(definition.stats));sheets.set(id,sheet);units.set(id,createUnitState(definition.unit,sheet));}}
  });
}
