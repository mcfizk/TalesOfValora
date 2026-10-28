# Units

One model covers protagonists, companions, village NPCs, enemies and wildlife. Definitions describe authored characters or reusable creature types. Instances represent actual individuals with their own stats and experiences. Rendering, perception and future combat use the same instance rather than creating temporary character sheets.

```text
units/
  catalog.js                   Registered definitions, validated at load time
  schema.js                    Shared validation and immutable definitions
  unit-state.js                Individual knowledge, memory, affinity and flags
  characters/
    fenris/unit.js             Approved opening identity and story
  npcs/
    village/
      harl/unit.js             One folder per named NPC
      edra/unit.js
      woodcutter/unit.js       Torren; stable existing ID retained
      ...                      All eleven existing villagers
  enemies/                     Future authored opponents
  critters/                    Future authored wildlife
  templates/unit.template.json
```

Folders organize authorship. An enemy becoming friendly does not change its ID or require moving files. Future companions can reference an existing unit and change party membership rather than duplicating that person.

## Each unit's authoring file

| Section | Contains |
| --- | --- |
| `id`, `kind`, `name` | Stable definition ID, authoring category and display name. |
| `stats.template` | Reference to the actual numbers in `data/stats/actors.csv`. |
| `information` | Species, occupation, description and descriptive traits. Traits do not silently grant numerical bonuses. |
| `story` | Approved biography, authoring status, source reference and author-only notes. Never copied automatically into knowledge or journal entries. |
| `presentation` | Portrait, animation reference or appearance colours. Existing animation contracts remain in effect. |
| `behaviour` | Tags and scene-specific placement/routine/dialogue references. Current village placement and greetings now live here. |
| `initialState` | Explicit starting knowledge, memories, affinity and flags, normally empty until authored. |

The numeric stat tables remain the single source of truth so spreadsheet editing and the existing validator continue working. A unit contains the reference rather than a second conflicting set of numbers. Edit a stat row and run `node build-stats.cjs`; never edit generated `stats-data.js`. Rules and calculations stay in `stats.js`.

Each unit folder can grow with `story.js`, `dialogue.js`, behaviour modules, or art references when needed. The starting records keep the sections together instead of creating empty files for every possible feature. Village conversation trees remain in `private-opening/conversations.js`.

## Individuals and runtime state

`world-characters.js` owns both the stat sheet and unit state. Existing `roster.get(id)` still returns the original stat API. `roster.unit(id)` returns the individual's knowledge, memories, affinity and that exact same sheet.

```js
const deer = roster.register({id:'deer:clearing-7', unitId:'deer'});
// Requires an authored, registered deer definition and valid stat template first.
const individual = roster.unit('deer:clearing-7');
individual.remember({id:'saw-fenris', type:'sighting', text:'Saw a large Lupera.', at:clock.totalMinutes});
individual.learn({id:'safe-crossing', text:'Knows a crossing upstream.', source:'observation'});
individual.setAffinity('fenris', -1);
```

Memory and knowledge entries require stable `id` and `text`; extra fields can hold participants, source, game time, or encounter IDs. Duplicate entry IDs are ignored so revisiting a scene does not duplicate experiences. `remember()` records an experience; `learn()` explicitly adds knowledge. Neither grants omniscience or automatically tells other units. Knowledge can be a belief; it is not proof that the authoring lore is true.

Affinity is **directed**: Torren's attitude toward Fenris says nothing about Fenris's attitude toward Torren. Zero is the default for an unrecorded relationship; that default does not overwrite authored cautious dialogue or make a villager behave warmly. The shared state stores finite scores without imposing a new universal relationship scale. Current conversation attitudes keep their existing -3 to +3 range and gameplay consequences.

The game now records fresh conversations in both participants' memories, syncs each NPC's conversation attitude toward Fenris, and records Fenris's perception discoveries and encounter outcomes. Re-reading a choice cannot duplicate its memory or affinity effect. Existing journal and conversation mechanics continue to control their own UI and rewards.

Definitions are immutable. Instances never write back into unit files. `unitSnapshot()` produces detached, serializable runtime data and excludes author-only story and behaviour records. This prevents accidental journal/diagnostic disclosure; it is not a security boundary because authored JavaScript files are delivered to the browser. Do not ship confidential material in them.

Health, memories and relationships persist across loaded/unloaded scenery and interiors. The game's three local save slots serialize each individual's stats, modifiers, resources, knowledge, memories, affinity and flags. Continue restores them after a reload. New Game and Restart create fresh instances; the active slot then records that fresh journey. Saves live in browser storage for this site, not in the authoring files or a cloud account.

## Adding a unit

1. Copy `templates/unit.template.json` into the appropriate `<id>/unit.js`, replacing placeholders and exporting the object with `export default`.
2. Add a complete stat row to `data/stats/actors.csv` and regenerate `stats-data.js`. Species must match the unit's information.
3. Import and register the definition in `catalog.js`. Draft templates are never automatically discovered or spawned.
4. Register actual individuals in the roster with stable IDs. A reused definition produces independent instances, not shared health or memory.
5. Add authored presentation, encounters and behaviour through their existing systems. Registration alone does not place a sprite in the world.

Do not invent Fenris's history, grant starting memories of his identity, or turn later lore into opening knowledge. The author's rules in `docs/FENRIS-AND-WORLD.md` continue to apply.
