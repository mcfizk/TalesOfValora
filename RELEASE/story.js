// Canon is authored by the user. This file contains ONLY temporary scene cues.
export const OPENING = {
  facts: ['Fenris is a large Lupera.', 'He does not know who he is or where he came from.', 'He has no weapons and no magical abilities.'],
  voices: [
    { id:'first', at:.25, text:'Do you hear them calling?', duration:5 },
    { id:'second', at:14, text:'Listen…', duration:4 }
  ],
  observations: {
    embers:{title:'Dying embers',text:'The last embers give off a little warmth. Nothing here tells you whose fire this was.'},
    water:{title:'Running water',text:'Water moves over the stones. For a moment, its sound covers the voices.'},
    trail:{title:'An opening in the trees',text:'The trees thin ahead. You can see a way through, but you do not know where it leads.'},
    stone:{title:'Weathered stone',text:'Moisture fills the shallow cracks. Patches of moss soften the cold surface.'},
    stump:{title:'An old stump',text:'The outer wood gives beneath your fingers. Small roots thread through the hollow centre.'},
    flowers:{title:'Forest flowers',text:'Small pale flowers grow close to the ground. Their faint scent mixes with the damp earth.'},
    fern:{title:'Thick undergrowth',text:'Damp fronds brush your hands. Beneath them, fallen leaves cover the soft earth.'}
  }
};
