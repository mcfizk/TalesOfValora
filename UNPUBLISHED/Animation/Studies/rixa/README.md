# Rixa animation production

Reference: `reference/approved.png`, the user's approved barefoot 1470 appearance. The Queen design and existing game assets are unchanged.

The complete requested set is exported for review: 30 clips and 156 frame slots, including reused endpoints and reverse transitions. It is not installed in the game. `review.json` lists every clip; technical checks do not replace the user's visual review.

## Scope

Eight separately drawn standing and walking directions preserve camera-specific clothing and accessories. Each walk has eight phases: contact, settling, passing, reaching, opposite contact, opposite settling, opposite passing, opposite reaching. Target playback is eight frames per second.

The user confirmed the established standard: eight-direction walking and standing; left/right idle (8 frames at 4 fps), sitting (4 at 2 fps), sleeping (4 at 2 fps), sleep-to-sit (5 at 4 fps), and sit-to-stand (8 at 4 fps), plus exact reversed sit-to-sleep and stand-to-sit transitions.

## Artwork and review

The built-in image generator produced walking and transition poses individually in small batches; subtle idle/sit/sleep loops were generated as sheets and separated into source frames. Saved batch JSON files contain exact prompts and references. Approved Fenris walking poses provide limb-position guidance; they do not define Rixa's anatomy or clothing. No rig warping or artificial interpolation is used. Opposite walking views were drawn separately rather than mirroring Rixa's asymmetric costume.

Preserve green eyes, feline muzzle, tousled dark hair, upright ears, hoop, dark fur, pale tail tip, worn vest/tunic, patches, bare feline feet, and sheathed knife. Check accessory sides as the camera changes. Use planted/passing feet and consistent limb overlap to judge phase identity; pixel hashes alone are insufficient.

The review exports use 640 x 640 cells, a (320, 610) foot anchor, uniform whole-image scaling, and nearest-neighbor pixel sampling. The wider transparent canvas accommodates her tail without stretching anatomy. Resting poses have explicit scale registration rather than being normalized to standing height. Original source images remain untouched.

`node build.cjs` rebuilds the exports using the saved registration. `node check.cjs --browser` checks PNG integrity, alpha, dimensions, distinct walking frames, source preservation, atlases, GIF frame counts, and browser playback. `node check-joins.cjs` verifies pixel-identical rest endpoints and reverse transitions. Both checks passed for the full set on 2026-10-29.

Open `preview.html` for action/direction selection, frame stepping, speed control, and previous-frame overlay. All source frames and final sheets/GIFs are included. Small changes in fur, patch outlines, clothing folds, and tail contours remain between independently generated poses; a final pixel-cleanup pass may be useful after motion review. No combat or running animations were requested or added.
