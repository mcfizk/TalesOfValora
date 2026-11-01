// Temporary encounter fixtures for reviewing discovery and presentation.
// All DCs and distances below are placeholders awaiting author tuning.
// See docs/PERCEPTION-EVENTS.md for the event and zone format.
export const PERCEPTION_MODE='passive';
export const PERCEPTION_EVENTS=[
  {id:'placeholder-rustle',placeholder:true,x:760,y:650,dc:10,triggerRadius:35,
    zones:[{id:'outer',radius:320,dcModifier:8},{id:'near',radius:170,dcModifier:0}],
    title:'Leaves stirring',discovered:'Something small moves beneath the leaves ahead.',
    aware:'A mouse slips beneath a root as you approach.',surprised:'Leaves scatter beside your feet. A mouse darts beneath a root.',
    examine:'A narrow opening beneath the root disappears into the earth.'},
  {id:'placeholder-branch',audio:{discovered:'creaking',surprised:'twig-snap'},placeholder:true,x:530,y:435,dc:14,triggerRadius:30,
    zones:[{id:'outer',radius:300,dcModifier:6},{id:'near',radius:140,dcModifier:0}],
    title:'A loose branch',discovered:'A cracked branch hangs low above the path.',
    aware:'You pass the hanging branch with room to spare.',surprised:'A branch snaps loose beside you, scattering bark across the ground.',
    examine:'Pale wood shows through the broken bark.'},
  {id:'placeholder-deer',unitId:'deer',audio:{discovered:'deer-noticed',aware:'deer-fleeing',surprised:'deer-warning'},placeholder:true,x:1040,y:420,dc:10,triggerRadius:45,
    zones:[{id:'outer',radius:700,dcModifier:4},{id:'middle',radius:350,dcModifier:2},{id:'near',radius:100,dcModifier:0}],
    title:'Movement among the trees',discovered:'Beyond the trees, a deer lifts its head. Its ears turn toward you.',
    aware:'The deer watches for a moment, then bounds away through the undergrowth.',surprised:'A deer bursts from the undergrowth close beside you and vanishes into the trees.',
    examine:'Fresh hoofprints mark the soft ground. The deer has moved on.'}
];
