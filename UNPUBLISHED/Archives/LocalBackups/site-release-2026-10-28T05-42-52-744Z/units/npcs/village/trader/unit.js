export default {
  "id": "trader",
  "kind": "npc",
  "name": "Dain",
  "stats": {
    "template": "trader"
  },
  "information": {
    "species": "human",
    "role": "Shopkeeper",
    "description": "Dain, the village shopkeeper.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#6d7954",
    "hair": "#624630",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "shop": "store",
      "line": "Coin on the counter. No credit. And give me some room."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
