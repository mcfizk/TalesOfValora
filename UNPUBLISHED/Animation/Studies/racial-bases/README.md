# Approved racial bases: animation review

Sequential production batches, at most two generated source sheets per batch. `progress.json` records saved work. Each finished character has a standalone `preview.html`, transparent PNG atlases, `animations.json`, and `validation.json`. These assets are isolated from the playable game.

All four packages are exported: **60 sheets and 680 frame slots**, including mirrored directions and reverse transitions. Walks were rebuilt with the user-approved sprite rig. Open [the shared playback review](index.html) to compare them with Fenris and approved human bases at consistent world scale. Humans are static references because their animation sheets do not yet exist. [Original vs revised walks](walk-revision/preview.html) provides synchronized comparison. Individual galleries: [dwarf male](dwarf-male/preview.html), [dwarf female](dwarf-female/preview.html), [halfling male](halfling-male/preview.html), [halfling female](halfling-female/preview.html).

## Animation standard

- Idle: 8 frames, 4 fps.
- Walk: 16 distinct frames per direction, 8 directions, 16 fps (one second per cycle). Right and both right diagonals are exact per-frame mirrors. Up and down are unique. Walk atlases are 2560 x 2560, four columns and four rows.
- Sleeping and ground sitting: 4-frame loops, 2 fps.
- Sleep to sit: 5 frames, 4 fps. Sit to stand: 8 frames, 4 fps.
- Sit to sleep and stand to sit: reverse transition exports. These are extra clips; the current game helper does not implement those actions yet.
- 640 x 640 padded cells, anchor (320,600), nearest-neighbor sampling on a 2px grid, binary alpha. Common body heights: dwarf male 480, dwarf female 448, halflings 384, relative to a 640px human. Lower poses retain the standing reference scale.

Source sheets were created with the built-in image generation tool using approved refined base references. Character identity prompts are in `progress.json`; action prompts are in `source-clips.json`. Generated source art is retained under each character's `generation/` directory. Revised walks use painted leg pieces controlled by hip, knee, and foot positions, with rigid foot shapes and continuous deformation around the arms. Each view uses a stable source pose to prevent costume and body-volume fluctuations. Final PNGs are game-format-compatible review assets, not automatically approved animation art.

## Review notes

- Dwarf male: full initial animation package checked in the browser at multiple playback times. Long sectioned beard, blue cloth tunic, boots and broad build retained. Five unique walk directions and the rest sequence are recognizable.
- Dwarf female: full initial package exported and checked at two playback times. Three distinct seated source poses form a four-frame forward/back breathing loop.
- Halfling male: full initial package exported and checked. Regenerated the side walk so all frames face left. Loose trousers, cord belt, clean-shaven adult face, and bare feet retained. Rest source uses row counts 3, 2, 4.
- Halfling female: full initial package exported and checked. Teal dress stays continuous through sitting and rising, with bare feet visible. Three distinct seated poses use a forward/back breathing loop. Two sleeping source poses were drawn larger; those two receive uniform nearest-neighbor scale correction to match the first sleeping pose's width, with factors recorded in `validation.json`. No anatomy is stretched.
- The original walks had uneven leg progression. Their replacements use alternating stance/swing phases, opposed arm movement, restrained body bob, and additional intermediate samples. Both legs use the same complete painted leg cutout, with depth shading and mirrored front/back feet. This retains some stiffness and cannot invent new toe-roll or foreshortening detail. Review the rhythm at game movement speed before integration.
- Idle, sitting, sleeping, and transitions remain byte-for-byte unchanged. Original walks and manifests are saved in `walk-revision/originals/`.
- Exact endpoint reuse prevents changes at clip boundaries, but intermediate poses may still benefit from a manual polish pass.

Rebuild a revised walk with `node walk-revision/rig-walks.cjs <character-id>`, then `node walk-revision/export-rig.cjs <character-id>`, followed by `node finalize-review.cjs`. The rig reads saved originals, so repeated runs do not deform an already rigged image. The older `build-package.cjs` recreates the initial generation pass; rerun the rig exporter afterward if using it. `check-preview.cjs` checks preview images and captures two playback times. Scripts use the installed local dependency runtime.

`finalize-review.cjs` reopens all 60 exported PNGs with CRC checking, verifies dimensions and binary transparency, compares every mirrored pixel, confirms shared endpoints and exact reverse transitions, writes SHA-256 hashes to `validation-summary.json`, and builds the shared playback page. The existing game animation contract also validates all four manifests. Reverse clips remain additional metadata until the renderer supports those actions.
