export default {
  "id": "herbalist",
  "kind": "npc",
  "name": "Ilen",
  "stats": {
    "template": "herbalist"
  },
  "information": {
    "species": "human",
    "role": "Herbalist",
    "description": "Ilen, the village herbalist.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#70816b",
    "hair": "#b2a08b",
    "animation": "generated-human"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "shop": "apothecary",
      "line": "Clean hands, and stand back from the shelves. I sell remedies, not favours."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
