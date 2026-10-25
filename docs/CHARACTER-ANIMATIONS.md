# Character animation standard

All upcoming characters use the version 1 contract in `private-opening/character-animation.js`. Character identity and sprite files come from the manifest; playback is not tied to Fenris's artwork.

| Clip | Playback | Current Fenris frames / rate | Direction coverage |
| --- | --- | --- | --- |
| `idle` | Loop | 8 / 4 fps | Left and mirrored right |
| `walk` | Loop | 8 / 8 fps | All eight directions |
| `sleep` | Loop | 4 / 2 fps | Left and mirrored right |
| `sit` | Loop | 4 / 2 fps | Left and mirrored right |
| `sleepToSit` | Play once, hold final frame | 4 / 4 fps | Left and mirrored right |
| `sitToStand` | Play once, hold final frame | 6 / 4 fps | Left and mirrored right |

The required action names and loop behavior are shared. Frame counts and rates are metadata rather than hardcoded requirements. Running currently accelerates the walk cycle to match movement speed; it is not a separate run clip. Up/down and diagonal standing rests currently hold a gathered-foot walking pose because directional idle loops have not yet been authored.

## Asset contract

- Use transparent PNG sprite sheets, in row-major order, with equal-size cells within each sheet.
- Every character declares `id`, `formatVersion: 1`, `displayHeight`, `restFrame`, the six required clips, and `wakeSequence`.
- Each clip declares `frameWidth`, `frameHeight`, `columns`, `frames`, `fps`, `loop`, `anchor: [x,y]`, and `bodyHeight`.
- Single-view clips use `file`; walking uses `files` keyed by `left`, `right`, `up-left`, `up-right`, `down-left`, `down-right`, `up`, and `down`.
- Fenris's added actions use 640 × 640 cells, ground anchor [320,610], and standing-reference `bodyHeight: 550`. Other clip dimensions are supported by the same renderer.
- `bodyHeight` always describes the same character's standing scale, even for a curled sleeping pose. Do not enlarge sleeping or seated bodies to fill their cells.
- Rest clips set `directions: ["left","right"]` and `mirrorRight: true`. Right-facing PNG exports are exact mirrors; the game can mirror the left sheet at draw time. Walking sheets already contain their mirrored variants and must not be flipped again.
- Match proportions, palette, body markings, clothing, and ground position across all clips. Keep ample transparent padding around hands, ears, feet, and tails.
- Reuse matching endpoint images across transitions and loops. `sleepToSit` begins on the sleep-loop pose and ends on the seated pose. `sitToStand` begins on that same seated pose and ends on the existing standing idle.

## Awakening sequence

The current opening uses sleep (2 seconds), sleep-to-sit (1 second), sitting (1.5 seconds), then sit-to-stand (1.5 seconds). Movement unlocks after standing at 6 seconds. The title screen loops sleeping. Pause freezes the sequence, and restart begins asleep. Transition frames clamp at their endpoint; they never wrap back to the starting pose.

The sequence is explicit manifest data. `validateCharacterAnimations` rejects missing clips, incomplete walking directions, invalid geometry/anchors, incorrect loop settings, and sequence durations that cut off transitions. `awakeningAt` selects the current stage without altering story or voice timing.

## Sources and verification

Fenris source exports live in the sibling `Sprites/Fenris white` folder. `Rest and awakening` includes left/right frames, sheets, GIF previews, the complete awakening preview, generation prompts, and reproducible export scripts. `node private-opening/import-fenris.cjs` copies these assets into the local game alongside the existing idle/walking sheets. Rebuilding scenery also runs this import.

Run `node --test private-opening/fenris-animation.test.mjs` for the shared contract and playback tests. With the local preview server running, `node private-opening/awakening-check.cjs` checks the sleep/sit/stand sequence, blocked movement, pause, restart, and mobile playback. Existing animation and functional browser checks cover directional movement and the rest of the opening.

The private scene and its imported artwork remain excluded from public source control and deployment.
