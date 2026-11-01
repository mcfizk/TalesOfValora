# Critters

Place each authored wildlife definition at `<species-or-unit-id>/unit.js`, using the template in `../templates/`. Create its stat template in `data/stats/actors.csv`, regenerate stats, then register it in `units/catalog.js`. Registered: `deer`, `wolf`, `hare` and `owl`, taken from the SRD stat blocks in `data/stats/reference/critters.json` (AC, CR/XP, traits, actions and extra speeds stay there until the rules use them; each row's notes say what differs). No encounters or spawns use them yet.

Spawn individuals with stable instance IDs, for example `deer:<encounter-id>`, referencing the shared authored unit. Each individual gets independent health, knowledge, memories and directed affinity. Perception encounter definitions remain in `private-opening/perception-events.js`; they can reference these units when the creature behaviour is authored.
