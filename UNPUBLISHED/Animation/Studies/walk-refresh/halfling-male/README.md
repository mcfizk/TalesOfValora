# halfling male left/right walking review

Eight individually generated left-facing phases; right is an exact frame-wise mirror. Built-in image generation uses the selected refined base for identity and the approved walking sequence for limb timing. Exact prompts and selected sources are in left/poses.json, with batch manifests retained alongside.

Assembly uses nearest-neighbor sampling and uniform whole-image scaling per frame to correct generator framing differences. Small phase-dependent rise and fall is retained. No limb deformation or interpolation is used. Frames are 512 by 640, aligned to ground y=610. The comparison uses 16.8 world units against human height 28.

Small-adult halfling anatomy and bare feet are preserved. The male retains loose trousers, a rumpled olive tunic and cord belt, with no beard.

Installed in the game animation library; assigned through unit presentation.walkBase. Minor independently drawn hair, face and garment contour variation remains. Sitting, sleeping, standing, idle and transitions are untouched. Up/down and diagonal production are deferred.


