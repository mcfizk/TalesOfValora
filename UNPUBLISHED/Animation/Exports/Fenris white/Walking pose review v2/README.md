# Fenris: eight left-facing walking poses

Eight individual transparent PNG stills, numbered 01–08. Open `Fenris_walk_left_pose-review.png` to inspect the sequence, or [the animation preview](animation-left/preview.html) for playback. The animation export is isolated in `animation-left/`; existing game assets have not been replaced. Frame 06 now uses `Fenris_walk_left_06_settle-far-v2.png`, with a more visible weight shift and lifted trailing paw. The earlier version is retained.

| Frame | Pose | Supporting / moving leg |
| --- | --- | --- |
| 01 | Contact | Near leg leads; far leg trails |
| 02 | Weight settles | Near leg bears weight; far heel lifts |
| 03 | Passing | Near leg supports; far leg passes airborne |
| 04 | Reaching / up | Near toes support; far paw reaches toward its next landing |
| 05 | Opposite contact | Far leg leads; near leg trails |
| 06 | Weight settles | Far leg bears weight; near heel lifts |
| 07 | Opposite passing | Far leg supports; near leg passes airborne |
| 08 | Reaching / up | Far toes support; near paw reaches toward frame 01 |

Near means the viewer-facing side of the body, identified by the large visible shorts panel. It does not always mean the leg on the left of the image. Arms oppose the reaching leg and pass through neutral near the passing poses.

Generated with the built-in image tool, using the existing Fenris artwork as reference and separate edits for each phase. Prompts and generation records are in `poses.json`. An extra-arm error in frame 07 and an unintended planted reaching paw in frame 08 were corrected before this review export. The first contact candidate was generated while requesting the opposite contact, but retained as frame 01 because that is the pose it actually depicts.

Each PNG retains its generated 1122 x 1402 dimensions and original transparency. The contact sheet uses a uniform one-third scale, nearest-neighbor display, and aligns the lowest visible paw to each row's baseline. It does not warp limbs or independently resize body heights. Native transparency contains partial alpha and is not a final binary-alpha game export.

Review the poses before timing, final registration, pixel-grid cleanup, atlas packing, or work on other characters. The generated drawings still have small changes in contours and fur shading that would need attention during animation preparation. `validation.json` checks file integrity, dimensions, transparency, bounds, and distinct files; those checks do not certify motion quality.
