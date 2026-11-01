# Tales of Valora

This is the active project and Git root. The former `BookOfFenris` folder is gone; its contents are organized here.

## Folder layout

- **RELEASE/** — the supported game: installed runtime artwork/audio, game code, unit definitions, stats, world guidance, regression tests and build/deployment tools. This is the source for website builds.
- **UNPUBLISHED/** — development work and retained history, versioned in Git but excluded from website builds.
  - **Animation/Studies/** — unfinished/review animation packages and tools.
  - **Animation/Animals/** — animal animation studies.
  - **Animation/Bases/** — human, dwarf and halfling source bases.
  - **Animation/Exports/** — original sprite exports, including Fenris.
  - **Concepts/** — visual concepts; Rixa's approved barefoot 1470 design and animation handoff are in `Concepts/rixa/`.
  - **Sounds/** — sound experiments and future audio work.
  - **References/** — original resource imports and the old extracted-asset review library. Retention does not approve use in the game.
  - **Legacy3D/** — the earlier 3D prototype and development scripts.
  - **QA/** — browser reports and screenshots.
  - **Builds/** — new website bundles, release archives and the tested-release record.
  - **Archives/** — previous backups, patches and the former project README.
  - **Organization/** — move records and before/after verification.

Both folders are pushed to Git, including unfinished assets, references and archives. Installed dependencies, caches and local secret files are excluded. Some historical metadata retains old absolute paths as provenance; consult `UNPUBLISHED/Organization/moves.json` for the new locations.

## Run and check

From this folder:

```powershell
npm start
npm test
npm run test:game
npm run stats
npm run test:site
```

Open **http://127.0.0.1:8766/**. The preview serves the game from `RELEASE` while retaining `/private-opening/` and its existing module URLs. Explicit `/UNPUBLISHED/` paths are available only in the loopback development preview for review pages; they are not copied into website builds.

Run a browser check with `node RELEASE/private-opening/dialogue-dock-check.cjs`. Output goes to `UNPUBLISHED/QA/`.

## Publish

`npm run test:site` builds and tests a flat website bundle in `UNPUBLISHED/Builds/`. The exact tested directory is recorded in `UNPUBLISHED/Builds/tested-site-release.json`.

```powershell
./RELEASE/deploy-site.ps1 -ReleaseDirectory '<tested directory>'
```

Only runtime content from `RELEASE` is bundled. Pushing development files to Git does not publish them on the game site. See [deployment](RELEASE/docs/DEPLOYMENT.md), [saves](RELEASE/docs/SAVES.md), [units](RELEASE/units/README.md), and [world guidance](RELEASE/docs/FENRIS-AND-WORLD.md).

On Windows, enable `git config core.longpaths true` when needed for retained source/backup paths. Prefer a short checkout path for new clones.
