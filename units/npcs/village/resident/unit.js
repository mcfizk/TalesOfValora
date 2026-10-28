export default {
  "id": "resident",
  "kind": "npc",
  "name": "Oren",
  "stats": {
    "template": "resident"
  },
  "information": {
    "species": "human",
    "role": "Villager",
    "description": "Oren, the village villager.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#686b81",
    "hair": "#998777",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": -70,
      "dy": 78,
      "wander": 15,
      "line": "I have nothing for you. Please move along."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
