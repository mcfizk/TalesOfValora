# Rixa animation review — findings (2026-10-30)

Visual review of all 30 exported clips. `check.cjs` and `check-joins.cjs` pass, but they only test file integrity
and endpoint joins; none of the issues below are caught by them. Nothing has been changed yet.

Comparison grids for every multi-frame clip are in `review-grids/` (red line = foot baseline y=610, green line =
standing head height y=70, blue line = cell centre).

## 1. Character size pumps between frames (build/registration issue)

`build.cjs:54-55` scales every walk frame so its silhouette is 540 px tall (±4 px bob). Wide-stride poses have a
shorter silhouette, so they get scaled up and Rixa visibly grows on those frames.

| Clip | Frames that grow | Scale vs. rest of clip |
|---|---|---|
| walk/down | 8, 4 | 0.443 / 0.407 vs ~0.36 (~20% bigger) |
| walk/up-right | 3, 4 | 0.47 / 0.48 vs ~0.38 |
| walk/up-left | 1, 4 | 0.444 vs ~0.37–0.42 |
| walk/down-left, walk/down-right, walk/left | stride frames | same effect, smaller |

The bob table (`[0,-4,0,4,…]`) also puts the highest head position on the reaching frames (4/8) rather than
the passing frames (3/7).

Rest transitions have the same problem via the hand-set `targetHeight` values in `registration.json`:

- **right sleepToSit / sitToSleep:** frames 2–3 are noticeably smaller (scale 0.26–0.28), then frame 4 jumps back to full size.
- **left sleepToSit:** frame 3 is small (0.285).
- **sitToStand, both sides:** the head is larger in the crouch frames (3–5) than in frames 6–8 (right frame 5 = 0.310, frame 6 = 0.335, vs ~0.37).
- **left sleep loop:** frame 3 is wider (0.623 vs 0.577) and has a different tail curl, so the loop jumps once per cycle.

Suggested fix: scale each frame by a stable feature (head or torso width) or a per-clip median with manual overrides,
instead of silhouette height.

## 2. Camera angle drifts within a direction

- **walk/down-right:** frames 4 and 6 are near-profile; the rest are 3/4 views.
- **walk/down-left:** frames 3 and 7 face the camera almost head-on.
- **walk/up-left:** frame 1 reads as a pure left profile.
- **walk/left:** frames 2 and 4 turn the face toward the camera.
- **Left side:** `stand/left` and `rest/left/idle` are 3/4 views, but `walk/left` is a pure profile, so starting or
  stopping a walk switches the angle. The right side is profile throughout.

## 3. Costume continuity

- **Knife missing:** walk/up #1, walk/up-right #1, walk/up-left #1.
- **Knife moves:** in walk/down-left it sits on the back hip (#1–2), the front right (#4–6) and the centre (#7).
- **Stray mark:** walk/right #8 has an orange patch at the crotch that no other frame has.

## 4. Frames that pop

- **rest/left/idle:** frame 4's tail flicks straight up, out of step with frames 3 and 5.
- **rest/right/sitToStand:** frames 1→2 rearrange the legs completely (folded, then knees up).
- **rest/left/sitToStand:** frames 1→2 have the same problem, less severely.

## Looks clean

Right-side idle, sit and sleep loops; left sit loop; walk/up apart from the missing knife on #1.

## What fixes what

- **#1:** fixable in `build.cjs` / `registration.json` without new art. It likely accounts for most of the jumpiness.
- **#2, #3:** need the listed frames regenerated.
- **#4:** need the listed frames regenerated, or a cleanup pass on them.
