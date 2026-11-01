# Fenris left walk — animation review

Open `preview.html` for playback with pause, previous/next frame, speed, and previous-pose overlay controls. `Fenris_walk_left.gif` is a portable looping preview. `Fenris_walk_left_sheet.png` is the 4 x 2 atlas, with `animation.json` describing 512 x 640 frames, 8 fps, a one-second cycle, and anchor (256,610).

The eight source drawings remain in the parent directory. Frame 06 uses the revised `settle-far-v2` source after feedback that the first version looked too similar to frame 05. Its supporting far knee now bends more clearly and the trailing near paw lifts. The earlier frame 06 is preserved.

All frames use one uniform scale (0.44), waist registration, and a supporting-paw baseline of y=610. Nearest-neighbor sampling uses a 2px grid and binary alpha for these exports. No limbs were stretched, rigged, or synthesized between the approved pose drawings. The natural body-height differences remain visible. The GIF alternates 120/130 ms delays to represent a one-second loop within GIF timing precision; browser playback uses exact 125 ms frames.

This is a review preview, not a game replacement. Drawing-to-drawing contour and proportion variation remains; timing controls allow the walking rhythm to be assessed before another artwork pass. No other characters or directions were changed.

Run `node build.cjs` to rebuild and `node check.cjs` to validate browser playback. `validation.json` records alignment, bounds, source hashes, and PNG/GIF checks. `playback-validation.json` records loaded frames, stepping, wrapping, and playback advancement.
