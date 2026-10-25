# Fenris Awakening

The active local prototype is a **private 2D pixel-art opening**. Fenris wakes in a forest clearing, receives the existing voice cues as subtitles, and can explore and examine his surroundings. The user authors the story. Spoken voice playback is disabled and wind is at 50% of its previous level; audio production will be a separate project.

## Current private opening

The forest uses deeper dusk shading with a faint canopy light and warm embers. The stream has no bridge and can be waded through at 30% of normal movement speed, including when running.

Run `npm start` here and open **http://127.0.0.1:8766/**. On this workstation the local server opens `private-opening/index.html` automatically. It binds only to loopback. If the private folder is absent, the server opens the earlier 3D prototype.

The scene uses the approved white-and-grey Fenris with brown shorts, an eight-frame idle, and eight-frame walking loops in all eight directions. Walking runs at 8 fps; Shift accelerates the same gait to match running speed. Left/right idle uses the 4 fps breathing loop; other directions hold a gathered-foot pose when stopped so Fenris keeps facing the last movement direction. Reconstructed forest scenery, animated water and fire, collision-aware click movement, keyboard controls, touch controls, subtitles, ambience, a journal, pause, and restart remain available. Controls: WASD/arrows to move, Shift to run, E to examine, J for journal, Escape to pause, mouse wheel to zoom, or click ground to walk. Touch devices have a movement stick and examine button.

`private-opening/` contains the local scene code, selected art, provenance, preparation script, and browser checks. It is excluded from Git because the user's asset permission is for private use. It is also outside the explicit file list in `deploy.ps1`. This version must remain local; do not add its assets to public source control or website deployment. There is no cloud connection or save service; discoveries last for the current visit.

The local art manifest is `private-opening/assets/manifest.json`. Browser validation is recorded in `private-opening/qa/functional-report.json`; desktop and mobile screenshots are in that same folder. `private-opening/prepare-art.py` can reproduce the selected images using the local extraction catalog and installed UnityPy tooling.

Custom character sheets live in `private-opening/assets/fenris/`. Run `node private-opening/import-fenris.cjs` to recopy the approved exports from the sibling `Sprites/Fenris white` folder and refresh their frame dimensions, anchors, and timing. The scenery preparation script also runs that import so it cannot silently restore the old brown character. `node --test private-opening/fenris-animation.test.mjs` checks directions, animation selection, timing, and sprite-sheet bounds. `node private-opening/animation-check.cjs` checks the integration in a locally running browser preview.

The forest generates 384-pixel sections around the player, with no fixed map boundary. A new page load selects a random seed; revisiting an area or restarting the awakening within that visit preserves its terrain. Distant sections and ground textures are discarded and regenerated from the seed, keeping loaded terrain memory bounded. Groves, fern hollows, rocky patches, clearings, winding trails and recurring streams provide variation.

The voices appear before Fenris begins rising. His first objective is to seek their source, and the search remains open after examining objects. Faint glowing baubles mark camp details, weathered stones, old stumps, flowers and undergrowth. Click or tap a bauble to approach and examine; E and the mobile interaction button also work nearby. Descriptions appear only after interaction and are kept in the session journal. Floating E prompts and object labels have been removed.

Run `node --test private-opening/world.test.mjs private-opening/fenris-animation.test.mjs` for generation, water speed, collision, reachability and animation checks. Run `node private-opening/forest-check.cjs` for streamed terrain and interaction browser checks.

## Start here for another session

All characters share the [character animation standard](docs/CHARACTER-ANIMATIONS.md): idle, eight-direction walking, sleeping, sitting, sleep-to-sit, and sit-to-stand. Fenris's opening now plays sleep → sit → stand using authored sprites rather than rotating the standing image. Sleep and sitting have their own breathing loops; these added actions support left/right views. Run `node private-opening/awakening-check.cjs` to check the sequence in the local game.

Read [Fenris and his world — lore handoff](docs/FENRIS-AND-WORLD.md) for the opening facts, Lupera identity, characterization, setting, era boundaries, and source provenance. It is a curated summary of the author's Valora archive, with later lore clearly separated from Fenris's knowledge around 1468 DR.

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

`forest.js` creates the environment. Fur, bark, and leaf-litter image assets were generated with built-in image generation; exact prompts and local asset paths are recorded in `art-manifest.json`. The supplied character image guides the model and is not published. The full Valora manuscripts and royal portraits are not included. The repository contains only the curated lore handoff linked above; it is not part of the public game deployment.

## Running the earlier 3D prototype

Run `node serve.cjs` from this directory, then open http://127.0.0.1:8766/index.html for the earlier 3D version. HTTP is required for JavaScript modules. The server binds only to loopback. No installation or API keys are required. Three.js 0.180.0 is included under `vendor/` with its MIT license. Renderer setup: https://threejs.org/manual/pages/installation.html.

This uses browser 3D to make the opening playable on the existing IIS website. It does not establish that Godot is insufficient or lock the eventual CRPG to this renderer. Story, movement, character, and environment modules are separate.

## Controls

- WASD / arrows: walk relative to camera. Shift: run.
- Click clear ground: walk there using obstacle-aware pathfinding.
- Drag: orbit camera. Scroll: zoom.
- E: examine. J: journal. Escape: pause / close dialog.
- Touch: left joystick to move; drag elsewhere to look; E to examine.

Subtitles are always available. The start screen offers ambient audio and it can be toggled. Spoken voice playback is disabled pending the separate audio project. Wind is at half its previous gain; water and footsteps retain their existing levels. Audio suspends while paused. Graphics can be reduced in the menu. Position and discoveries are session-only; restart or reload resets them.

## Verification

`node --test tests/world.test.mjs` checks boundaries, obstacles, sliding, water restrictions, and paths including the bridge. `browser-test.cjs` uses the bundled Playwright and installed Edge to test wake-up, keyboard/click movement, voices/subtitles, observations, journal, pause, audio activation, camera, performance mode, restart, and mobile touch. `test-results.json` records the latest run. `window.__fenris` offers read-only diagnostics.

## Historical 3D deployment

`deploy.ps1` describes the older 3D website workflow and contains historical source paths. It is not the workflow for the private 2D opening. It backs up the existing game files and game shelf under `backups/`, copies its explicit list of public 3D game files and renderer into `D:\UlfheimData\games\FenrisAwakening\`, and adds a prototype card to the shelf. Source, tests, scripts, lore documents, and the private opening are outside its publication list.

URL: https://ulfheim.dk/games/FenrisAwakening/
