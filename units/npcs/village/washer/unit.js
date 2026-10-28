export default {
  "id": "washer",
  "kind": "npc",
  "name": "Sella",
  "stats": {
    "template": "washer"
  },
  "information": {
    "species": "human",
    "role": "Washerwoman",
    "description": "Sella, the village washerwoman.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#6a8084",
    "hair": "#3f312c",
    "animation": "npc-walks",
    "walkBase": "human-female"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": 38,
      "dy": 164,
      "wander": 12,
      "line": "Not so close. The water is for everyone, but do not put those claws in the bucket."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
