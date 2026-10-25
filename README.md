# Fenris Awakening

Playable 3D opening prototype. The user authors the story.

## Start here for another session

Read [Fenris and his world — lore handoff](docs/FENRIS-AND-WORLD.md) for the opening facts, Lupera identity, characterization, setting, era boundaries, and source provenance. It is a curated summary of the author's Valora archive, with later lore clearly separated from Fenris's knowledge around 1468 DR.

The author's current visual priority is the character's anatomy and model quality, rather than additional texture detail. The existing model is a prototype; do not treat it as the final visual reference.

## Authoritative facts

- Fenris is a large Lupera.
- He has no knowledge of who he is or where he came from.
- He begins without weapons or magical abilities.
- The opening is around 1468 DR, before Valora and before meeting Croft.
- Current playable scope: wake up, hear voices, move around the scene.

These facts override older manuscripts and previous prototypes. Do not introduce parents, a clan, remembered military service, known identity, spellcasting, equipment, or an explanation for the voices without the author's direction.

The attached `01-The Story Begins.txt` inspires a forest awakening and voices. Its older shaman, weapon, ancestry, and species details are NOT current canon. No dream battle or elemental trial is implemented.

## Authoring boundaries

`story.js` holds explicitly temporary voice lines and observations. "Do you hear them calling?" comes from the older manuscript; its context is not established. "Listen…" is temporary connective text. Campsite details, the brook, bridge, and forest path are replaceable scenery. The interface names Fenris for the player; dialogue does not reveal his identity to him.

`character.js` renders a continuous, skin-weighted Lupera mesh built by `sculpt-model.cjs`. The 17-bone skeleton drives idle, wake, walk, and run motion. The model follows the supplied grey-white wolf reference with a connected muscular torso, tapered muzzle, recessed pale eyes, curved ears, clawed hands and paws, and rope-tied brown shorts. It remains a procedural prototype, not a production sculpt matching the reference's fidelity. No weapons, armour, or magical effects are present.

`assets/fenris-sculpt.json` contains the prebuilt indexed geometry, normals, UVs, weights, and skeleton. Regenerate with `node sculpt-model.cjs`, then check with `node validate-model.cjs`. No remeshing happens in the browser. `model-study.html` provides rotation, walking, and an untextured shape view to review anatomy independently of the forest lighting. `inspect-model.cjs` captures front, side, rear, and three-quarter views.

`forest.js` creates the environment. Fur, bark, and leaf-litter image assets were generated with built-in image generation; exact prompts and local asset paths are recorded in `art-manifest.json`. The supplied character image guides the model and is not published. The full Valora manuscripts and royal portraits are not included. The repository contains only the curated lore handoff linked above; it is not part of the public game deployment.

## Stats

Characters use D&D 5e (2014 SRD) rules. `stats.js` holds the rules; `data/stats/*.csv` holds the numbers. After editing a CSV, run `node build-stats.cjs` to regenerate `stats-data.js`. Fenris's current row is a placeholder, not canon. See [docs/STATS.md](docs/STATS.md) for the columns, implemented rules, open decisions and Codex handoff.

## Running locally

Run `node serve.cjs` from this directory, then open http://127.0.0.1:8766. HTTP is required for JavaScript modules. The server binds only to loopback. No installation or API keys are required. Three.js 0.180.0 is included under `vendor/` with its MIT license. Renderer setup: https://threejs.org/manual/pages/installation.html.

This uses browser 3D to make the opening playable on the existing IIS website. It does not establish that Godot is insufficient or lock the eventual CRPG to this renderer. Story, movement, character, and environment modules are separate.

## Controls

- WASD / arrows: walk relative to camera. Shift: run.
- Click clear ground: walk there using obstacle-aware pathfinding.
- Drag: orbit camera. Scroll: zoom.
- E: examine. J: journal. Escape: pause / close dialog.
- Touch: left joystick to move; drag elsewhere to look; E to examine.

Subtitles are always available. The start screen offers audio and it can be toggled. Browser speech synthesis supplies temporary voice audio; availability and voice quality depend on the device. Audio suspends while paused. Graphics can be reduced in the menu. Position and discoveries are session-only; restart or reload resets them.

## Verification

`npm test` runs `tests/world.test.mjs` (boundaries, obstacles, sliding, water restrictions, paths including the bridge) and `tests/stats.test.mjs` (5e derived values, damage, death saves, rests, levelling, and that `stats-data.js` matches the CSVs). `browser-test.cjs` uses the bundled Playwright and installed Edge to test wake-up, keyboard/click movement, voices/subtitles, observations, journal, pause, audio activation, camera, performance mode, restart, and mobile touch. `test-results.json` records the latest run. `window.__fenris` offers read-only diagnostics.

## Deployment

`deploy.ps1` backs up the existing game files and game shelf under `backups/`, copies only public game files and the renderer into `D:\UlfheimData\games\FenrisAwakening\`, and adds a prototype card to the shelf. The existing Godot game remains available. Source, tests, scripts, and lore documents are not published.

URL: https://ulfheim.dk/games/FenrisAwakening/
