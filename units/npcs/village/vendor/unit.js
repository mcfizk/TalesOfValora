export default {
  "id": "vendor",
  "kind": "npc",
  "name": "Bessa",
  "stats": {
    "template": "vendor"
  },
  "information": {
    "species": "human",
    "role": "Produce seller",
    "description": "Bessa, the village produce seller.",
    "traits": []
  },
  "story": {
    "status": "prototype",
    "summary": "Existing village character; biography and personal story await the author.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "coat": "#9e7153",
    "hair": "#514135",
    "animation": "npc-walks",
    "walkBase": "human-female"
  },
  "behaviour": {
    "tags": [
      "village-resident"
    ],
    "village": {
      "dx": -36,
      "dy": -163,
      "shop": "market",
      "line": "Coin first. Take what you pay for and keep your paws off the rest."
    }
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
