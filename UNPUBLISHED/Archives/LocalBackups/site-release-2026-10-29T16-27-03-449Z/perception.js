// Exploration discovery: an event exists before Fenris notices it.
// Distances are world pixels; each zone adds difficulty to the event's base DC.
export function validatePerceptionEvents(events){
  const ids=new Set();
  for(const e of events){
    if(!e.id||ids.has(e.id))throw new Error('Perception events need unique IDs');
    ids.add(e.id);
    if(!Number.isFinite(e.x)||!Number.isFinite(e.y)||!Number.isFinite(e.dc))throw new Error(`${e.id}: position and base DC are required`);
    if(!Number.isFinite(e.triggerRadius)||e.triggerRadius<=0||!e.zones?.length)throw new Error(`${e.id}: trigger radius and discovery zones are required`);
    let radius=Infinity,modifier=Infinity;
    for(const z of e.zones){
      if(!z.id||!Number.isFinite(z.radius)||z.radius<=0||z.radius>=radius||!Number.isFinite(z.dcModifier)||z.dcModifier<0||z.dcModifier>modifier)throw new Error(`${e.id}: zones must run outer to inner, with decreasing radii and nonincreasing difficulty`);
      radius=z.radius;modifier=z.dcModifier;
    }
    if(new Set(e.zones.map(z=>z.id)).size!==e.zones.length||e.triggerRadius>radius)throw new Error(`${e.id}: unique zones must enclose the encounter trigger`);
    if(!e.title||!e.discovered||!e.aware||!e.surprised)throw new Error(`${e.id}: title and outcome messages are required`);
  }
  return events;
}
function distanceToTravel(event,position,previous){
  if(!previous)return Math.hypot(event.x-position.x,event.y-position.y);
  const dx=position.x-previous.x,dy=position.y-previous.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((event.x-previous.x)*dx+(event.y-previous.y)*dy)/length)):0;
  return Math.hypot(event.x-previous.x-t*dx,event.y-previous.y-t*dy);
}
export function createPerception({events=[],mode='passive',rng=Math.random}={}){
  // Copy definitions so authoring changes cannot silently reset an ongoing encounter.
  events=structuredClone(validatePerceptionEvents(events));
  if(!['passive','roll'].includes(mode))throw new Error('Unknown perception mode');
  const memory=new Map();let previous=null;
  function update(position,sheet,{active=true,eligible=()=>true}={}){
    if(!active){previous=null;return [];}
    const outcomes=[];
    for(const e of events){
      if(!eligible(e))continue;
      let m=memory.get(e.id);
      if(m?.status==='encountered')continue;
      const distance=distanceToTravel(e,position,previous);
      if(distance>e.zones[0].radius)continue;
      if(!m){m={id:e.id,status:'hidden',zone:null,check:null,awareness:null};memory.set(e.id,m);}
      // Choose the closest zone reached, including when a large step crosses a ring.
      const zone=e.zones.findLast(z=>distance<=z.radius);
      if(m.status==='hidden'){
        if(mode==='roll'&&!m.check)m.check=sheet.roll('skill','perception',{rng});
        const total=mode==='passive'?sheet.passive('perception'):m.check.total;
        const dc=e.dc+zone.dcModifier;m.zone=zone.id;
        m.check={...(mode==='roll'?m.check:{}),mode,total,dc};
        if(total>=dc){m.status='noticed';outcomes.push({id:e.id,type:'discovered',title:e.title,text:e.discovered,zone:zone.id,check:{...m.check}});}
      }
      if(distance<=e.triggerRadius){
        m.awareness=m.status==='noticed'?'aware':'surprised';m.status='encountered';
        outcomes.push({id:e.id,type:'encountered',awareness:m.awareness,title:e.title,text:e[m.awareness],check:{...m.check}});
      }
    }
    previous={x:position.x,y:position.y};return outcomes;
  }
  return {update,reset(){memory.clear();previous=null;},
    load(saved){
      if(saved?.mode!==mode||!Array.isArray(saved.events))throw new Error('Invalid saved perception');
      const restored=new Map();for(const m of saved.events){
        const event=events.find(e=>e.id===m.id);
        if(!event||restored.has(m.id)||!['hidden','noticed','encountered'].includes(m.status)||!event.zones.some(z=>z.id===m.zone)||!['aware','surprised',null].includes(m.awareness))throw new Error('Invalid saved perception event');
        if(!m.check||!Number.isFinite(m.check.total)||!Number.isFinite(m.check.dc))throw new Error('Invalid saved perception check');
        restored.set(m.id,structuredClone(m));
      }
      memory.clear();for(const [id,m]of restored)memory.set(id,m);previous=null;
    },
    visible:()=>events.filter(e=>memory.get(e.id)?.status&&memory.get(e.id).status!=='hidden').map(e=>({id:e.id,type:'perception-event',x:e.x,y:e.y,status:memory.get(e.id).status,label:e.title,title:e.title,text:memory.get(e.id).status==='noticed'?e.discovered:e.examine||(memory.get(e.id).awareness==='surprised'?e.surprised:e.aware)})),
    snapshot:()=>({mode,events:[...memory.values()].map(m=>structuredClone(m))})};
}
