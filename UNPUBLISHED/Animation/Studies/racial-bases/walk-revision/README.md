# Walking correction

The user identified a skipping/shuffling quality in the first walking pass. Inspection confirms repeated near-forward leg poses, weak or absent opposite contacts, and missing narrow passing poses. A count of eight unique PNG frames is not evidence of a coherent two-step cycle.

The user approved a painted sprite rig. All four racial bases now use 16-frame, one-second walking cycles in all eight directions. Each view starts from one stable painted pose; the two legs follow alternating planted and lifted phases, separated by half a cycle. Hip and knee controls deform the leg mesh while feet retain their painted shape. A complete visible leg supplies both limbs, with rear-limb shading and mirrored front/back feet. Continuous arm deformation prevents gaps at sleeves. Body bob and dress sway are restrained.

Frames use a 2px grid, binary alpha, and 640 x 640 cells. Right-facing directions are exact mirrors. Sitting, sleeping, idle, and transition PNGs are untouched. Earlier image-generation experiments remain isolated here and are not used in the current preview.

Open [before/after playback](preview.html) or [the full comparison](../index.html). `originals/` retains previous walks, manifests, previews, and a checksum snapshot. `rigged/` contains current cutouts, atlases, contact-review sheets, and joint trajectories. To rebuild from the parent directory, run `node walk-revision/rig-walks.cjs <character-id>`, then `node walk-revision/export-rig.cjs <character-id>`, then `node finalize-review.cjs`. A direction argument on the rig script is for experiments; regenerate all five unique views before exporting a full package.

The exporter verifies 16 distinct frames, half-cycle leg separation, alternating positive foot lift, zero lift during stance, loop closure, canvas bounds, PNG integrity, dimensions, and binary alpha. It creates exact mirrors and validates the game animation contract. Checksums verify all 28 non-walk animation PNGs remain unchanged.

This is a corrected review pass. A cutout rig retains some stiffness, especially in front/back views, and does not add freshly painted toe-roll or changing foot perspective. Ground travel should be matched to stride during integration; an in-place preview cannot establish absence of sliding in the game.

The shared comparison preview now includes Fenris animations and static approved human male/female references, with equal-height captions so their canvas ground lines align within each row. Humans do not yet have painted animation sheets. No game integration or Git push has been performed.
