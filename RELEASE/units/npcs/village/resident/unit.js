export default {
  "id": "resident",
  "kind": "npc",
  "name": "Oren",
  "stats": {
    "template": "resident"
  },
  "information": {
    "species": "dwarf",
    "role": "Villager",
    "description": "Oren, a dwarf village resident.",
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
    "animation": "npc-walks",
    "walkBase": "dwarf-male"
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
