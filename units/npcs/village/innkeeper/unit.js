export default {
  "id": "innkeeper",
  "kind": "npc",
  "name": "Vera",
  "stats": {
    "template": "innkeeper"
  },
  "information": {
    "species": "human",
    "role": "Innkeeper",
    "description": "Vera, the village innkeeper.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#81594c",
    "hair": "#777064",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "shop": "inn",
      "line": "No room for one your size. You can sit by the door, and I can dress a scrape for six copper. Keep clear of my guests."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
