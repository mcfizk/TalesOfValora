# Perception events

Forest events exist independently of whether Fenris has noticed them. The game uses **passive Perception**, read from the live character sheet: `10 + skillBonus('perception')`. Fenris currently has 15. A total meeting the DC succeeds; there is no automatic discovery merely because the event is on screen.

Definitions live in `private-opening/perception-events.js`. Three explicitly marked placeholder events currently demonstrate rustling leaves, a loose branch and a deer. Their DCs, distances and text are temporary values awaiting author tuning. Existing scenery observations and villagers retain their current interactions. These placeholders use markers and narrative outcomes; they do not add creature sprites, AI, damage or combat surprise effects.

## Authoring

Each event needs the following fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable, unique event ID, distinct from scenery and villager IDs. |
| `x`, `y` | Event centre in world pixels. |
| `dc` | Base difficulty due to the event's subtlety. |
| `zones` | Outer-to-inner list of `{id, radius, dcModifier}`. |
| `triggerRadius` | Distance at which the encounter happens, whether noticed or not. Must be inside the innermost discovery zone. |
| `title` | Journal and examination title. |
| `discovered` | Message when Fenris notices the event before its trigger. |
| `aware` | Message when he reaches the trigger having noticed it. |
| `surprised` | Message when he reaches the trigger without noticing it. |
| `examine` | Optional description shown when inspecting the revealed marker. |
| `availableAfterDay` | Optional earliest game day; omitted events are available immediately. |

Effective difficulty is **base DC + zone modifier**. Radii strictly decrease toward the centre; modifiers are nonnegative and cannot increase toward the centre. Any number of rings is supported. All distances use the existing world coordinates (currently approximately 22 pixels per displayed pace). Validation rejects missing or inconsistent definitions before gameplay.

Approaching into an easier ring gives the same passive score a lower DC. A miss creates no notification, marker, clickable target, or journal entry. Success reveals an interaction bauble and records the discovery. Crossing the inner trigger produces either the aware or surprised outcome, once per event per visit. The encounter remains recorded when leaving and returning; restarting the awakening resets it. Event memory is separate from streamed terrain chunks.

Checks run during forest exploration, including while stationary. Pausing, title, awakening and interiors do not process encounters. Interior relocations clear the movement segment so entering or exiting does not trigger events along a fictional path. Actual movement uses segment distance to avoid skipping a small zone between frames. On the first update inside a trigger, perception resolves against the nearest zone before deciding awareness. Awareness here selects narrative outcomes; it does not yet impose combat effects.

The `update()` result contains structured `discovered` and `encountered` outcomes for future creature behaviour. The current opening shows their messages as temporary text anchored to the event and records journal entries. Noticed events outside the viewport have directional arrows; hidden events have neither arrows nor markers. Creature rendering and AI should consume the event outcome when authored; hidden event markers are not a substitute for a creature sprite.

## Future listening state

An activated listening state is planned, not implemented. Give its bonus through `stats.addModifier({id:'listening', target:'skill:perception', add:AUTHOR_BONUS})` and remove that modifier on exit. The existing passive checks immediately use the modified score without rerolling or resetting events. Duration, movement restrictions and bonus remain author decisions.

## Verification

`node --test private-opening/perception.test.mjs` covers distance rings, exact DC matches, live modifiers, hidden failures, awareness branches, persistent outcomes, restart, skipped rings and inactive states. `node private-opening/perception-check.cjs` exercises discovery, markers, the journal, pause and restart in the browser using injected test encounters. Test values are fixtures, not production tuning.

The engine also supports a single hidden roll per event for reuse elsewhere, but this game's configured mode is passive. Standing still or repeatedly entering a ring never generates extra rolls.

## Inline observations

Scenery descriptions now appear on or below the inspected object without pausing or opening a dialog. Up to three recent text cards follow the camera and zoom, expire after reading time, and can be recalled by interacting again. Text is retained in the journal and saved unit memory. Plain village descriptions (barred houses, closed shops and action feedback) use the same presentation. Optional wood gathering remains an inline button; shopping, conversations, inventory and actions requiring a decision retain their controls. Cards are transient and are not replayed on Continue.

`event-overlay.js` positions the cards and off-screen arrows. `event-overlay.test.mjs` checks indicator bounds and placeholder discovery; `event-overlay-check.cjs` checks both outcome branches, hidden-event secrecy, campfire text, movement, gathering and mobile layout.
