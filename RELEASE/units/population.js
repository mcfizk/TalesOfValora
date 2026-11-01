// Author-supplied Valora baseline; regional profiles may override these percentages.
// This describes permanent residents, not travelers or quotas for named characters.
export const WORLD_POPULATION=Object.freeze({human:86,halfling:5,'half-elf':4,dwarf:3,elf:1,other:1});
export const POPULATION_SPRITES=Object.freeze({human:Object.freeze({male:'human-male',female:'human-female'}),dwarf:Object.freeze({male:'dwarf-male',female:'dwarf-female'}),halfling:Object.freeze({male:'halfling-male',female:'halfling-female'})});
export function populationTemplate(overrides={}){
 const profile={...WORLD_POPULATION,...overrides};
 if(Object.entries(profile).some(([id,n])=>!(id in WORLD_POPULATION)||!Number.isFinite(n)||n<0)||Math.abs(Object.values(profile).reduce((a,b)=>a+b,0)-100)>1e-7)throw Error('Population percentages must total 100');
 return Object.freeze(profile);
}
export function populationSprite(species,gender){return POPULATION_SPRITES[species]?.[gender]||null;}
