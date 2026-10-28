# Stats system (D&D 5e)

Characters use D&D 5e rules, based on the **2014 System Reference Document (SRD 5.1)**. The rules live in code (`stats.js`). The numbers live in spreadsheets (`data/stats/*.csv`). The current 2D opening and the historical 3D prototype each create a Fenris sheet and reset it when restarting. Read-only diagnostic snapshots expose it as `window.__fenris2d.snapshot().stats` (2D) and `window.__fenris.snapshot().stats` (3D). The party HUD reads health and power from each character sheet. Exploration does not consume health or power; village supplies and wound dressing can restore health; the walking-speed field does not change pixel movement speeds or the 30% water multiplier.

## Editing numbers

1. Edit a CSV in `data/stats/` with any spreadsheet program. Save it as CSV (UTF-8).
2. Run `node build-stats.cjs` (or `npm run stats`). This validates every row and regenerates `stats-data.js`. A bad value fails with its file and row, e.g. `actors.csv row 2: str must be a whole number from 1 to 30`.
3. Run `npm test`. A test fails if `stats-data.js` is out of date with the CSVs. On the local art workstation, also run `npm run test:private` and `node private-opening/stats-check.cjs` to check the current build.

Do not edit `stats-data.js` by hand.

| File | Contents | Edit? |
|---|---|---|
| `actors.csv` | One row per character or creature | Yes: this is where your numbers go |
| `levels.csv` | XP thresholds and proficiency bonus, levels 1–20 (5e table) | Only to house-rule |
| `abilities.csv`, `skills.csv`, `damage-types.csv` | 5e reference lists; other files refer to these ids | Rarely |

### `actors.csv` columns

| Column | Meaning |
|---|---|
| `id`, `name` | Code id (`fenris`) and display name |
| `species` | Species identity (`human`, `halfling`, `dwarf`, `lupera`); required for a registered world character |
| `level` | 1–20. XP starts at that level's threshold |
| `hit_die` | 6, 8, 10 or 12 |
| `str` `dex` `con` `int` `wis` `cha` | Ability scores, 1–30 |
| `speed` | Walking speed in feet. It does not yet drive in-game movement speed |
| `saves` | Proficient saving throws, separated by spaces: `str con` |
| `skills` | Proficient skills, separated by spaces, using ids from `skills.csv`: `athletics perception` |
| `expertise` | Skills with double proficiency (must also be in `skills`) |
| `resistances` `immunities` `vulnerabilities` | Damage type ids, separated by spaces |
| `max_hp` | Leave blank to use average HP. Set a number to override it (fixed; it ignores level-ups) |
| `notes` | Free text, not used by code |
| `power_kind` | Resource label such as `mana`, `energy` or `rage`; blank means no active resource |
| `power_max` | Capacity, 0–99999; blank defaults to 0 |
| `power_start` | Initial amount, 0–capacity; blank starts full, while rage can explicitly start at 0 |

## Fenris at the opening

Author-confirmed on 25 October 2026: level 1, STR 14, DEX 14, CON 16, INT 14, WIS 16, CHA 14; unarmored AC 12; maximum HP 13 (the full first-level d10 plus CON +3); one d10 hit die. No fixed HP override is needed. The supplied sheet's AC 20, HP 35, and 3d8 were stale values and are not imported.

Shaman is the technical class direction, but Fenris currently has no active class, magic, or power resource. The supplied saving-throw and skill proficiencies are retained. His health bar begins at 13/13; the second bar reads Power and remains inactive. Future actors can name and populate their own resource without changing the party HUD.

`resources.js` provides bounded power pools. `spendPower(amount)` refuses an unaffordable cost; `restorePower(amount)` clamps to capacity. Changes emit a `power` event and snapshots return copies.

## World characters and future combat

Author direction, 26 October 2026: **every character in the world needs stats**, including non-hostile NPCs, because anyone could potentially become involved in combat. **Combat will be turn-based**, not a real-time attack loop. Initiative order, turns, actions, attacks and combat movement are not implemented by this change. Exploration retains its current continuous movement; the same persistent character sheets will be used when turn-based combat is added.

The village has no guards. Harl is a carpenter, Edra a weaver, and the former watch building is a communal tool shed. Threats spread alarm among neighbours rather than summoning a guard force.

The eleven villagers use level-1 commoner baselines with one d8 hit die, speed 30 and no active class, armor, weapon or power pool. The author-approved demographic implementation has nine humans, Mara as a halfling, and Oren as a dwarf. Species identity and sprites match; no extra ancestry bonuses, movement rules or traits are inferred from that choice. The editable implementation baseline is six ability scores of 10: HP 8, unarmored AC 10, proficiency +2, and occupation-based skill proficiencies. This is a game baseline, not a claim that an official commoner stat block is a player-class character. Prominent or physically robust villagers can have stronger abilities without gaining levels:

| Villager | STR | CON | HP | AC | Level |
|---|---:|---:|---:|---:|---:|
| Ordinary resident | 10 | 10 | 8 | 10 | 1 |
| Torren, woodcutter | 12 | 12 | 9 | 10 | 1 |
| Rusk, blacksmith | 14 | 14 | 10 | 10 | 1 |

These exact NPC numbers are initial tuning choices implementing the author's direction; edit `actors.csv` to balance them. Role proficiencies distinguish craftspeople: for example Rusk has Athletics, Ilen has Medicine/Nature, and Dain has Insight/Persuasion. They do not receive class saving-throw proficiencies or magical abilities.

`world-characters.js` provides `createCharacterRoster`. Register every world character with a stable instance id and a CSV stat definition; missing definitions and duplicate ids fail immediately. Multiple future characters can share a stat template while keeping independent sheets. Sprite updates, shop entry/exit and off-screen scheduling must reuse the roster's sheet rather than recreate it. Restart resets the roster. The current 2D scene registers Fenris and all villagers before play and validates each visible NPC against that roster.

The shared sheet includes abilities, saves, skills, AC, initiative, HP, hit dice, speed, damage handling, death saves and power. Read-only diagnostics expose all persistent sheets at `window.__fenris2d.snapshot().characters`; each visible NPC also has `characterId` and `stats`. No attack control, encounter, or automatic combat is added. `tests/world-characters.test.mjs` verifies coverage, baseline values, missing-definition rejection, independent instances, damage/healing/death saves and resets.

## Rules implemented (`stats.js`)

- **Ability modifier**: `floor((score − 10) / 2)`.
- **Proficiency bonus**: from `levels.csv`. Applied to proficient saves and skills, and doubled for expertise.
- **Checks, saves, skills**: d20 + bonus, with advantage/disadvantage; reports natural 1 and 20. **Passive** = 10 + skill bonus.
- **Hit points**: fixed average. Full hit die at level 1, then die/2 + 1 per level, plus the CON modifier each level, at least 1 per level. Level-ups raise current HP by the gain.
- **AC**: unarmored, 10 + DEX modifier. **Initiative**: DEX modifier.
- **Damage**: immunity, then resistance (halve, round down), then vulnerability (double). Temporary HP absorbs damage first; temporary HP doesn't stack (the higher value wins).
- **0 HP**: the character is *dying*.
  - Death save: 10+ succeeds; natural 1 counts as two failures; natural 20 revives with 1 HP.
  - Three successes stabilise; three failures kill. Becoming stable clears both death-save counters, including when first aid stabilizes a character. See the [2014 basic rules](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat#DeathSavingThrows).
  - Damage while down counts as one failure, or two on a critical hit.
  - Massive damage: if the damage left over after dropping to 0 HP is at least max HP, the character dies outright.
  - Any healing above 0 HP clears the death saves.
- **Rests**: a short rest spends hit dice (roll + CON modifier). A long rest needs at least 1 HP; it restores all HP, clears temporary HP, and regains half the total hit dice (minimum 1).
- **Modifiers**: `addModifier({id, target, add})` for temporary or item effects. Targets: an ability id, `ac`, `speed`, `maxHp`, `initiative`, `check:<ability>`, `save:<ability>`, `skill:<skill>`. Max HP changes clamp current HP.
- **Events**: `onChange((event, detail, sheet) => …)` fires `damage`, `heal`, `down`, `stable`, `revived`, `deathSave`, `died`, `tempHp`, `longRest`, `levelUp` and `modifiers`. Use it for HUD updates.

All randomness takes an optional `rng` function (returns 0–1), so tests can force exact rolls.

### 2014 vs 2024 rules

The code follows 2014 rules where the editions differ. The differences that affect this module: a 2024 long rest regains **all** hit dice, not half; 2024 Exhaustion is a −2 per level penalty to d20 tests. Tell Codex if you want 2024.

## Not built yet

These need author decisions first, and canon currently excludes several of them for the opening:

- Turn-based combat scheduling, actions, attacks, targeting and encounter transitions (turn-based direction is confirmed)
- Classes and class features (technical Shaman direction; no active class in the opening)
- Lupera species traits (size, darkvision, senses, natural weapons). Fenris is listed as *Medium-sized by default*; 5e "Large" has rules consequences
- Equipment, armor and attacks (the opening has none)
- Spellcasting (Fenris has no magic)
- Conditions (prone, grappled, exhaustion and so on), concentration, and monster CR/XP awards
- A detailed character sheet panel and saving between sessions (the local 2D party HUD now shows health and power)

## Open author decisions

- [x] Starting ability scores, level and d10 established; supplied sheet proficiencies retained
- [ ] Lupera traits and size category
- [ ] 2014 or 2024 rules
- [ ] Average or rolled HP on level-up (currently average)
- [ ] What 0 HP means in story terms during the opening

## Handing work to Codex

Give Codex the CSV row(s) plus a short note of anything this document doesn't already say. For example:

> Fill in `data/stats/actors.csv` with the attached rows, run `node build-stats.cjs` and `npm test`. Rules follow `docs/STATS.md`; do not add classes, species traits, equipment or magic unless listed here. New rules go in `stats.js` with tests in `tests/stats.test.mjs`, using a fixed `rng` for any roll.

For a new rule (e.g. conditions), describe it in this file first. Then Codex adds the code, the tests and, where needed, a new CSV.

## License

Rules text and tables such as the skill list, XP thresholds and death-save rules come from the System Reference Document 5.1 by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document, licensed under the Creative Commons Attribution 4.0 International License (https://creativecommons.org/licenses/by/4.0/legalcode).

## Creature reference import

`data/stats/reference/critters.json` is authoritative for the supplied deer, wolf, hare and owl blocks. `node build-stats.cjs` combines it with stable actor IDs/proficiencies from the CSVs. It preserves source abilities, HP, AC (including natural armour), hit-die size/count and walking speed, and checks skill bonuses for consistency. Source senses, extra movement types, traits, actions, CR and XP remain available through each creature sheet’s `creature` data and `movement` getter. These are author-supplied reference values; attack effects and flight/burrowing AI are data for future combat/behaviour, not automatically implemented mechanics. Fenris and villagers keep their existing rules and numbers.
