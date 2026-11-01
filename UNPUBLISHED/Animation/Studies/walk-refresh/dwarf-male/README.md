# Dwarf male left/right walking review

Eight poses based on the approved dwarf male refinement, using the human walk phase sequence. Right is an exact frame-wise mirror of left. All other directions are deferred.

Built-in image generation produced the artwork. The passing poses and far reach were corrected for limb assignment, then redrawn with shorter dwarf legs. Prompts and selected sources are recorded in left/poses.json; intermediate batch manifests retain the correction history.

Nearest-neighbor assembly uses uniform whole-image scaling for each frame to correct generated size differences without stretching anatomy. Contact height is 482 pixels; settle is 474, passing 492, reach 488. Every frame is 512 by 640, grounded at y=610. Preview world height is 21 versus human 28. Minor beard, face and clothing contour variations remain and should be evaluated in playback.

Installed in the game animation library; assigned through unit presentation.walkBase. Sitting, sleeping, standing, idle and transitions are unchanged. Next: dwarf female left/right, then both halflings.

