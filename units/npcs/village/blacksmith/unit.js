export default {
  "id": "blacksmith",
  "kind": "npc",
  "name": "Rusk",
  "stats": {
    "template": "blacksmith"
  },
  "information": {
    "species": "human",
    "role": "Smith",
    "description": "Rusk, the village smith.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#675648",
    "hair": "#49403a",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "shop": "smith",
      "line": "Do not touch the tools. Cups and firewood are for sale. I will buy spare supplies if the price is right."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
