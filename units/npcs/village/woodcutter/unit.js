export default {
  "id": "woodcutter",
  "kind": "npc",
  "name": "Torren",
  "stats": {
    "template": "woodcutter"
  },
  "information": {
    "species": "human",
    "role": "Woodcutter",
    "description": "Torren, the village woodcutter.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#8c6642",
    "hair": "#6b4831",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": -191,
      "dy": 181,
      "line": "You look strong enough. Stack that firewood beside the smithy and I will pay twelve copper. Work outside. Leave the axe alone."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
