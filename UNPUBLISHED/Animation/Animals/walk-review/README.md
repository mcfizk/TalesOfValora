# Animal movement review

Static bases live in `../static-review/`, including the new antlerless adult doe.

Each animal has eight original left-facing poses, a mirrored right-facing sheet, individual 640 x 640 PNG frames, and looping GIF previews at eight frames per second. Sheets use four columns and two rows (2560 x 1280). The foot anchor is (320, 600); the hare rises above this baseline during flight.

- Stag: relaxed quadruped walk, with the antlers and upright neck retained.
- Doe: the same movement phases adapted to an antlerless, lighter-necked adult deer.
- Wolf: lower horizontal body, canine paws and hocks, and a low bushy tail.
- Hare: a short hop with compression, push-off, flight, landing, and recovery.

Open `preview.html` to play, pause, step through poses, adjust speed, and switch direction. The preview uses provisional relative world sizes; it does not independently normalize every animal to equal height.

Artwork was created with the built-in image generator in batches of four. Exact prompts are retained in each animal's batch JSON files and `animation.json`. Source PNGs are retained under `source/`. Assembly applies uniform whole-image scaling and nearest-neighbor sampling, with no joint rig or stretched body parts. Right-facing frames are exact mirrors.

These are review assets, not installed game animations. Generated shading and small contour differences may still need pixel cleanup after motion approval. `validate.cjs` checks PNG integrity, dimensions, transparency, distinct frame hashes, exact mirroring and GIF frame counts; these checks do not establish anatomical quality. `check-preview.cjs` checks image loading, direction controls, frame stepping, and playback.
