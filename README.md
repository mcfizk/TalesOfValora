# Fenris Awakening

The active local prototype is a **2D pixel-art opening**. Fenris wakes in a forest clearing, receives the existing voice cues as subtitles, and can explore and examine his surroundings. The user authors the story. Spoken voice playback is disabled and wind is at 50% of its previous level; audio production will be a separate project.

## Current opening

The forest uses deeper dusk shading with a faint canopy light and warm embers. The stream has no bridge and can be waded through at 30% of normal movement speed, including when running.

Run `npm start` here and open **http://127.0.0.1:8766/**. The local server opens `private-opening/index.html` automatically. It binds only to loopback. If the 2D folder is absent, the server opens the earlier 3D prototype.

The scene uses the approved white-and-grey Fenris with brown shorts, an eight-frame idle, and eight-frame walking loops in all eight directions. Walking runs at 8 fps; Shift accelerates the same gait to match running speed. Left/right idle uses the 4 fps breathing loop; other directions hold a gathered-foot pose when stopped so Fenris keeps facing the last movement direction. Reconstructed forest scenery, animated water and fire, collision-aware click movement, keyboard controls, touch controls, subtitles, ambience, a journal, pause, and restart remain available. Controls: WASD/arrows to move, Shift to run, E to examine, J for journal, I for pack, Escape to pause, mouse wheel to zoom, or click ground to walk. Touch devices have a movement stick and examine button.

`private-opening/` contains the complete playable 2D scene, runtime artwork, and browser checks. The folder name is retained to preserve paths and URLs. A clone contains everything needed to play with `npm start`. Generated QA captures, local backups, and credentials are excluded. There is no cloud connection or save service; discoveries last for the current visit. `deploy.ps1` targets the historical 3D website; the 2D game has a separate deployment workflow.

The local art manifest is `private-opening/assets/manifest.json`. Browser validation is recorded in `private-opening/qa/functional-report.json`; desktop and mobile screenshots are in that same folder.

Custom character sheets live in `private-opening/assets/fenris/`. Run `node private-opening/import-fenris.cjs` to recopy the approved exports from the sibling `Sprites/Fenris white` folder and refresh their frame dimensions, anchors, and timing. `node --test private-opening/fenris-animation.test.mjs` checks directions, animation selection, timing, and sprite-sheet bounds. `node private-opening/animation-check.cjs` checks the integration in a locally running browser preview.

The forest generates 384-pixel sections around the player, with no fixed map boundary. A new page load selects a random seed; revisiting an area or restarting the awakening within that visit preserves its terrain. Distant sections and ground textures are discarded and regenerated from the seed, keeping loaded terrain memory bounded. Groves, fern hollows, rocky patches, clearings, winding trails and recurring streams provide variation.

The voices appear before Fenris begins rising. His first objective is to seek their source, and the search remains open after examining objects. Finding the source takes a couple of days, potentially including visits to a nearby village; the village visit is playable, while the later search and spirit encounters remain to be authored. Faint glowing baubles mark camp details, weathered stones, old stumps, flowers and undergrowth. Click or tap a bauble to approach and examine; E and the mobile interaction button also work nearby. Descriptions appear only after interaction and are kept in the session journal. Floating E prompts and object labels have been removed.

Run `node --test private-opening/world.test.mjs private-opening/fenris-animation.test.mjs` for generation, water speed, collision, reachability and animation checks. Run `node private-opening/forest-check.cjs` for streamed terrain and interaction browser checks.

The bottom-right party HUD crops Fenris's existing sprite to his face, with health and power bars underneath. Cards support future companions and per-character mana, energy, rage or another resource. Fenris's power bar is inactive until a resource is established.

The exploration clock starts at 22:00 on Day 1. One second of actual movement advances one game minute; idle, blocked movement, awakening and pauses do not advance it. The sun/moon dial follows the time, and forest light gently changes with dawn. At the first 06:00, a stable, seed-derived village waypoint appears on the compass. It shows direction and approximate paces (22 world pixels per pace); clicking toggles its screen marker. The waypoint leads to the playable village described below. The source-of-voices objective remains open. Restart resets the clock and waypoint discovery. Clock tuning is in `private-opening/game-clock.js`; run `node private-opening/hud-clock-check.cjs` for desktop/mobile HUD, movement-clock and morning-reveal checks.

## Village visit

The seeded settlement has an inn, general store, smithy, apothecary, produce stall, well, tool shed, and two homes. Its streets and building footprints are reserved during forest generation. Four businesses have walkable interiors with exits; private homes stay barred. Interactions use the same faint baubles as the forest, without floating labels or E prompts.

Eleven named townspeople cover residents, craftspeople and shopkeepers. Harl is a carpenter and Edra a weaver; the village has no guards. Humans are drawn at 28 world pixels tall compared with Fenris at 36. Residents turn to watch and give him space; traders demand payment and offer no credit, and the innkeeper refuses a room. Outdoor activity and shop access follow the movement-driven clock. Residents return home at night. The names and incidental dialogue are first-pass village content, with no revelation about Fenris's origins or the voices.

Fenris starts with an empty pack and no copper. Torren the woodcutter offers twelve copper to stack the firewood south of the smithy; the job can be paid only once per visit. Fallen wood from forest stumps can also be collected once per object and sold. Shops track stock, copper, purchases and sales. Bread, apples, herbs and bandages restore health through the pack (I); full-health use is disabled. The well restores one health once per game day when needed. The inn offers a seat and paid wound dressing. Sitting freezes time like other idle actions; movement begins only after the stand transition. None of these actions grants a class, weapon or magical power.

The building atlas is `private-opening/assets/village/buildings.png`. Townspeople use a small code-drawn pixel rig in `village-people.js`, generating all six standard clips and eight walking directions into canvas atlases at load time. These are simple prototype human sprites; approved Fenris artwork remains unchanged. `village-layout.js`, `village-economy.js`, `village-ui.js` and `village-renderer.js` separate geography, transactions, interaction and drawing. Village stock, task progress and inventory are session-only and reset with the awakening.

Run `npm run test:private` for forest, animation, clock and village unit checks. `node private-opening/village-check.cjs` checks the paid job, cross-square click movement, all four interiors, purchases, healing, shop hours, sitting, restart and mobile UI in Edge. Scenario placement is injected only into test responses; the production game retains read-only diagnostics and begins at the forest camp. Screenshots and the report are in `private-opening/qa/village-*`.

All characters have persistent stat sheets. The village uses level-1 humans: an editable d8/10-score commoner baseline with occupational proficiencies, plus tougher physical scores for the blacksmith and woodcutter. `world-characters.js` owns their sheets independently of visible sprites. Every future character or creature must register a stat definition; even off-screen NPCs retain health and resources. Combat is planned as turn-based and is not implemented yet. Exploration movement is not a combat action loop. See [stats and combat direction](docs/STATS.md).

## Branching village conversations

Every villager now offers several responses, with follow-up topics and remembered attitudes. Peaceful or practical replies remain available without dice. Optional Persuasion, Intimidation, Insight, Athletics, Survival, Nature, Medicine and Perception checks use the shared character sheet, including proficiency and current modifiers. Choices show the bonus, DC and material risks before rolling; results show the d20, bonus, total and success or failure. A skill check succeeds when its total meets the DC; natural 1 and 20 do not override that comparison.

Consequences include shop-specific discounts or surcharges, supplies, a four-copper job bonus, cheaper wound dressing, changed attitudes and follow-up information. Insight can unlock an easier negotiation with Dain. Threatening villagers spreads alarm among their neighbours, adding two to later Persuasion DCs. Failures do not lock basic shopping, movement or the main search. The conversations do not reveal the voices' identity or Fenris's past.

Each check is attempted once per visit, with mutually exclusive negotiations sharing one attempt. Reopening a conversation cannot reroll or duplicate rewards. Non-roll answers can be reread, and the journal records responses and check outcomes. Restart clears dialogue history, attitudes, flags, rewards and negotiated terms along with the rest of the visit. Conversations pause the movement clock.

`private-opening/conversations.js` holds the dialogue data and pure resolution state. Effects feed the existing economy and inventory through `village-ui.js`. `npm run test:private` includes dialogue and economy tests. `node private-opening/conversations-check.cjs` covers branching, successful and failed checks, paid outcomes, journal entries, restart and mobile layout. Deterministic rolls and village placement are injected only by the browser test; normal gameplay uses the shared random d20 roller.

## Start here for another session

All characters share the [character animation standard](docs/CHARACTER-ANIMATIONS.md): idle, eight-direction walking, sleeping, sitting, sleep-to-sit, and sit-to-stand. Fenris's opening now plays sleep → sit → stand using authored sprites rather than rotating the standing image. Sleep and sitting have their own breathing loops; these added actions support left/right views. Run `node private-opening/awakening-check.cjs` to check the sequence in the local game.

Read [Fenris and his world — lore handoff](docs/FENRIS-AND-WORLD.md) for the opening facts, Lupera identity, characterization, setting, era boundaries, and reference material. It is a curated summary of the author's Valora archive, with later lore clearly separated from Fenris's knowledge around 1468 DR.

The author selected sprite-based pixel art in October 2026, superseding the earlier 3D modeling direction. The older renderer and model files remain as historical prototype work. The 3D-specific descriptions below refer to that earlier version.

## Authoritative facts

- Fenris is a large Lupera.
- He has no knowledge of who he is or where he came from.
- He begins without weapons or magical abilities.
- The opening is around 1468 DR, before Valora and before meeting Croft.
- Current playable scope: voices wake Fenris; seek their source through an expanding forest. Environmental discoveries do not finish the search.

These facts override older manuscripts and previous prototypes. Do not introduce parents, a clan, remembered military service, known identity, spellcasting, equipment, or reveal the voices' nature before the author directs that revelation.

The attached `01-The Story Begins.txt` inspires a forest awakening and voices. Its older shaman, weapon, ancestry, and species details are NOT current canon. No dream battle or elemental trial is implemented.

## Authoring boundaries

`story.js` holds explicitly temporary voice lines and observations. "Do you hear them calling?" comes from the older manuscript; its context is not established. "Listen…" is temporary connective text. Campsite details, the brook, and forest path are replaceable scenery. The interface names Fenris for the player; dialogue does not reveal his identity to him.

`character.js` renders a continuous, skin-weighted Lupera mesh built by `sculpt-model.cjs`. The 17-bone skeleton drives idle, wake, walk, and run motion. The model follows the supplied grey-white wolf reference with a connected muscular torso, tapered muzzle, recessed pale eyes, curved ears, clawed hands and paws, and rope-tied brown shorts. It remains a procedural prototype, not a production sculpt matching the reference's fidelity. No weapons, armour, or magical effects are present.

`assets/fenris-sculpt.json` contains the prebuilt indexed geometry, normals, UVs, weights, and skeleton. Regenerate with `node sculpt-model.cjs`, then check with `node validate-model.cjs`. No remeshing happens in the browser. `model-study.html` provides rotation, walking, and an untextured shape view to review anatomy independently of the forest lighting. `inspect-model.cjs` captures front, side, rear, and three-quarter views.

`forest.js` creates the environment. Fur, bark, and leaf-litter textures are listed in `art-manifest.json`. The full Valora manuscripts and royal portraits are not included. The repository contains only the curated lore handoff linked above; it is not part of the public game deployment.

## Stats

Both the current 2D opening and the older 3D prototype load the shared D&D 5e (2014 SRD) scaffolding. `stats.js` holds the rules; `data/stats/*.csv` holds the numbers. Run `npm run stats` after editing the tables. Fenris now uses the confirmed starting ability scores, derived AC 12 and HP 13, and one d10 hit die. Shaman is the technical class direction; no active class or powers are granted at the opening. Stats do not yet determine exploration speed. The 2D diagnostics expose `window.__fenris2d.snapshot().stats`; restarting creates a fresh sheet. See [docs/STATS.md](docs/STATS.md).

## Running the earlier 3D prototype

Run `node serve.cjs` from this directory, then open http://127.0.0.1:8766/index.html for the earlier 3D version. HTTP is required for JavaScript modules. The server binds only to loopback. No installation or API keys are required. Three.js 0.180.0 is included under `vendor/`. Renderer setup: https://threejs.org/manual/pages/installation.html.

This uses browser 3D to make the opening playable on the existing IIS website. It does not establish that Godot is insufficient or lock the eventual CRPG to this renderer. Story, movement, character, and environment modules are separate.

## Controls

- WASD / arrows: walk relative to camera. Shift: run.
- Click clear ground: walk there using obstacle-aware pathfinding.
- Drag: orbit camera. Scroll: zoom.
- E: examine. J: journal. Escape: pause / close dialog.
- Touch: left joystick to move; drag elsewhere to look; E to examine.

Subtitles are always available. The start screen offers ambient audio and it can be toggled. Spoken voice playback is disabled pending the separate audio project. Wind is at half its previous gain; water and footsteps retain their existing levels. Audio suspends while paused. Graphics can be reduced in the menu. Position and discoveries are session-only; restart or reload resets them.

## Verification

`npm test` runs `tests/world.test.mjs` (the historical 3D boundaries, obstacles, sliding, water restrictions and bridge) and `tests/stats.test.mjs` (5e derived values, damage, death saves, rests, levelling, and that `stats-data.js` matches the CSVs). `browser-test.cjs` uses the bundled Playwright and installed Edge to test wake-up, keyboard/click movement, voices/subtitles, observations, journal, pause, audio activation, camera, performance mode, restart, and mobile touch. `test-results.json` records the latest run. `window.__fenris` offers read-only diagnostics.

## Historical 3D deployment

`deploy.ps1` describes the older 3D website workflow and contains historical source paths. It is not the workflow for the 2D opening. It backs up the existing game files and game shelf under `backups/`, copies its explicit list of public 3D game files and renderer into `D:\UlfheimData\games\FenrisAwakening\`, and adds a prototype card to the shelf. Source, tests, scripts, lore documents, and the private opening are outside its publication list.

URL: https://ulfheim.dk/games/FenrisAwakening/
