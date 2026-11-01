export const UNIT_KINDS=Object.freeze(['character','npc','enemy','critter']);
export function validateUnitDefinitions(definitions,actors){
  for(const [id,u] of Object.entries(definitions)){
    if(u.id!==id||!u.name||!UNIT_KINDS.includes(u.kind))throw new Error(`Invalid unit identity: ${id}`);
    const stats=actors[u.stats?.template];if(!stats)throw new Error(`Unit ${id} needs a valid stat template`);
    if(!u.information?.species||u.information.species!==stats.species)throw new Error(`Unit ${id} species differs from its stats`);
    if(!u.story||!u.presentation||!u.behaviour||!u.initialState)throw new Error(`Unit ${id} is missing an authoring section`);
    for(const field of ['knowledge','memories']){
      const entries=u.initialState[field];if(!Array.isArray(entries)||new Set(entries.map(e=>e.id)).size!==entries.length||entries.some(e=>!e.id||typeof e.text!=='string'))throw new Error(`Unit ${id} has invalid initial ${field}`);
    }
    if(!u.initialState.affinity||Object.values(u.initialState.affinity).some(n=>!Number.isFinite(n))||!u.initialState.flags)throw new Error(`Unit ${id} has invalid initial state`);
  }
  return definitions;
}
export function freezeDefinitions(value){
  if(value&&typeof value==='object'){for(const child of Object.values(value))freezeDefinitions(child);Object.freeze(value);}
  return value;
}
