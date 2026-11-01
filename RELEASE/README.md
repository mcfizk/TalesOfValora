# Supported game source

This folder contains the supported 2D Book of Fenris opening and release tooling. Use the npm commands in the project root or run the same commands here.

- `private-opening/`: playable game, installed sprites/audio, manifests and regression/browser checks. Existing browser URLs are retained.
- Shared audio, stats, resources, story and world-character modules: systems imported by the scene.
- `units/`, `data/`, `docs/`: actor definitions, editable stats and current world/gameplay guidance.
- `tests/`: regression coverage for shared systems. The old 3D collision tests remain with `../UNPUBLISHED/Legacy3D/`.
- Build/deployment scripts: bundle only runtime content. Outputs go to `../UNPUBLISHED/Builds/`.

Source exports, unfinished animations, concepts and experiments belong in `../UNPUBLISHED/`. Copy approved assets into `private-opening/assets/` when integrating them. The Fenris importer reads exports from `../UNPUBLISHED/Animation/Exports/Fenris white/`. Browser checks write to `../UNPUBLISHED/QA/`.

[Project commands and layout](../README.md)
