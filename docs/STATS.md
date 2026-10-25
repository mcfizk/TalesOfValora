# Stats system (D&D 5e)

Characters use D&D 5e rules, based on the **2014 System Reference Document (SRD 5.1)**. The rules live in code (`stats.js`). The numbers live in spreadsheets (`data/stats/*.csv`). Nothing in the opening uses the sheet yet. It is only exposed for diagnostics as `window.__fenris.snapshot().stats`.

## Editing numbers

1. Edit a CSV in `data/stats/` with any spreadsheet program. Save it as CSV (UTF-8).
2. Run `node build-stats.cjs` (or `npm run stats`). This validates every row and regenerates `stats-data.js`. A bad value fails with its file and row, e.g. `actors.csv row 2: str must be a whole number from 1 to 30`.
3. Run `npm test`. A test fails if `stats-data.js` is out of date with the CSVs.

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

## Rules implemented (`stats.js`)

- **Ability modifier**: `floor((score − 10) / 2)`.
- **Proficiency bonus**: from `levels.csv`. Applied to proficient saves and skills, and doubled for expertise.
- **Checks, saves, skills**: d20 + bonus, with advantage/disadvantage; reports natural 1 and 20. **Passive** = 10 + skill bonus.
- **Hit points**: fixed average. Full hit die at level 1, then die/2 + 1 per level, plus the CON modifier each level, at least 1 per level. Level-ups raise current HP by the gain.
- **AC**: unarmored, 10 + DEX modifier. **Initiative**: DEX modifier.
- **Damage**: immunity, then resistance (halve, round down), then vulnerability (double). Temporary HP absorbs damage first; temporary HP doesn't stack (the higher value wins).
- **0 HP**: the character is *dying*.
  - Death save: 10+ succeeds; natural 1 counts as two failures; natural 20 revives with 1 HP.
  - Three successes stabilise; three failures kill.
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

- Classes and class features (Fenris has no class: `hit_die 10` is a placeholder)
- Lupera species traits (size, darkvision, senses, natural weapons). Fenris is listed as *Medium-sized by default*; 5e "Large" has rules consequences
- Equipment, armor and attacks (the opening has none)
- Spellcasting (Fenris has no magic)
- Conditions (prone, grappled, exhaustion and so on), concentration, and monster CR/XP awards
- A HUD or character sheet panel, and saving between sessions

## Open author decisions

- [ ] Fenris's real ability scores, level, hit die, proficiencies (current row is **PLACEHOLDER**)
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
