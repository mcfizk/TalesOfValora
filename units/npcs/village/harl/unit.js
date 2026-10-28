export default {
  "id": "harl",
  "kind": "npc",
  "name": "Harl",
  "stats": {
    "template": "harl"
  },
  "information": {
    "species": "human",
    "role": "Carpenter",
    "description": "Harl, the village carpenter.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#777d7d",
    "hair": "#4b3d32",
    "animation": "npc-walks",
    "walkBase": "human-male"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": -25,
      "dy": 277,
      "line": "A Lupera? Mind the timber. I have work to finish, and I would rather you kept your distance."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
