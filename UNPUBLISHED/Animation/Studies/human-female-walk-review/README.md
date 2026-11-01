# Human female walk review

Eight left-facing walking poses based on the approved Fenris sequence and Humans/Female/base.png. This review is separate from the playable game.

Open preview.html for playback, speed adjustment, single-frame stepping, and a previous-frame overlay. The normal cycle lasts one second at 8 fps. The GIF uses alternating 120/130 ms delays to fit its timing precision.

Sequence: near contact, settle near, far passing, far reach, far contact, settle far, near passing, near reach. Near means the viewer-facing limb. Frame 06 was redrawn to correct its shoulder-to-elbow connection.

The eight transparent PNGs are 512 by 640, the atlas is 2048 by 1280, and the ground baseline is y=610. A common 0.44 scale and nearest-neighbor sampling onto a two-pixel grid preserve natural pose-height changes. Horizontal registration uses the waist. No mesh warping or limb stretching is applied.

Artwork was generated with the built-in image generator. Exact prompts and selected source paths are in poses.json; retained source PNGs are under source/. build.cjs assembles the animation. validation.json records dimensions, source hashes, distinct frame hashes, transparency, and GIF timing; playback-validation.json records preview checks.

For evaluation: the leg sequence and lift-off are distinct, but independently drawn poses still have small differences in hair, tunic folds, and torso shape. The passing poses have a relatively high knee lift. Review the bounce, stride, and arm swing before using this cycle as a template for additional characters or directions.
