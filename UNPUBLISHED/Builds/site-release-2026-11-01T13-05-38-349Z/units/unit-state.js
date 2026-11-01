// An individual owns its experiences. Definitions and stat templates stay immutable.
export function createUnitState(definition,stats){
  const initial=structuredClone(definition.initialState||{});
  const memories=new Map((initial.memories||[]).map(m=>[m.id,m]));
  const knowledge=new Map((initial.knowledge||[]).map(k=>[k.id,k]));
  const affinity=new Map(Object.entries(initial.affinity||{}));
  const flags=new Map(Object.entries(initial.flags||{}));
  const identity={id:stats.id,definitionId:definition.id,name:stats.name,kind:definition.kind,species:stats.species};
  const copy=value=>structuredClone(value);
  const entry=(map,item)=>{
    if(!item?.id||typeof item.text!=='string')throw new Error('Knowledge and memories need an id and text');
    if(map.has(item.id))return false;
    map.set(item.id,copy(item));return true;
  };
  return Object.freeze({stats,
    load(saved){
      if(saved?.id!==identity.id||saved.definitionId!==identity.definitionId)throw new Error('Saved unit identity differs');
      for(const field of ['memories','knowledge'])if(!Array.isArray(saved[field])||new Set(saved[field].map(e=>e.id)).size!==saved[field].length||saved[field].some(e=>!e.id||typeof e.text!=='string'))throw new Error('Invalid saved unit experiences');
      if(!saved.affinity||Object.values(saved.affinity).some(n=>!Number.isFinite(n))||!saved.flags||Array.isArray(saved.flags))throw new Error('Invalid saved unit relationships');
      memories.clear();knowledge.clear();affinity.clear();flags.clear();
      for(const m of saved.memories)memories.set(m.id,copy(m));for(const k of saved.knowledge)knowledge.set(k.id,copy(k));
      for(const [id,n]of Object.entries(saved.affinity))affinity.set(id,n);for(const [id,value]of Object.entries(saved.flags))flags.set(id,copy(value));
    },
    remember:item=>entry(memories,item),learn:item=>entry(knowledge,item),
    knows:id=>knowledge.has(id),recalls:id=>memories.has(id),
    affinityTo:target=>affinity.get(target)??0,
    setAffinity(target,value){if(typeof target!=='string'||!target||!Number.isFinite(value))throw new Error('Affinity needs a target instance ID and finite value');affinity.set(target,value);},
    setFlag(key,value=true){if(typeof key!=='string'||!key)throw new Error('A flag needs an ID');flags.set(key,copy(value));},
    snapshot:()=>({...identity,stats:stats.snapshot(),knowledge:copy([...knowledge.values()]),memories:copy([...memories.values()]),affinity:Object.fromEntries(affinity),flags:copy(Object.fromEntries(flags))})
  });
}
