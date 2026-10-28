export default {
  "id": "edra",
  "kind": "npc",
  "name": "Edra",
  "stats": {
    "template": "edra"
  },
  "information": {
    "species": "human",
    "role": "Weaver",
    "description": "Edra, the village weaver.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#727981",
    "hair": "#43352c",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": 30,
      "dy": -235,
      "line": "You stand a head above most folk here. Give us room. My neighbours are frightened enough already."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
