export default {
  "id": "fenris",
  "kind": "character",
  "name": "Fenris",
  "stats": {
    "template": "fenris"
  },
  "information": {
    "species": "lupera",
    "role": "Protagonist",
    "description": "A large, white-and-grey Lupera wearing brown shorts.",
    "traits": []
  },
  "story": {
    "status": "author-confirmed-opening",
    "summary": "Wakes alone in a forest, without knowledge of his identity or origins. Seeks the source of the voices. Begins without weapons, magic or active class powers.",
    "reference": "docs/FENRIS-AND-WORLD.md",
    "authorOnly": []
  },
  "presentation": {
    "portrait": "private-opening/assets/fenris/portrait.png",
    "animation": "private-opening/assets/manifest.json#fenrisAnimations"
  },
  "behaviour": {
    "tags": [
      "player-controlled"
    ]
  },
  "initialState": {
    "knowledge": [],
    "memories": [],
    "affinity": {},
    "flags": {}
  }
};
