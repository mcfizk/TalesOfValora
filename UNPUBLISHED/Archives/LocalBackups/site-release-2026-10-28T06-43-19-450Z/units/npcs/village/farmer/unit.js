export default {
  "id": "farmer",
  "kind": "npc",
  "name": "Mara",
  "stats": {
    "template": "farmer"
  },
  "information": {
    "species": "human",
    "role": "Farmer",
    "description": "Mara, the village farmer.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#85804c",
    "hair": "#6f4a32",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": 73,
      "dy": 12,
      "wander": 18,
      "line": "Mind where you tread. Those beds feed people. There is a stall if you need food."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
