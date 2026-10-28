# Current 2D website deployment

Repository: `https://github.com/mcfizk/TalesOfValora`, branch `main`.

Public game: `https://ulfheim.dk/games/FenrisAwakening/`.

Verified host: Heimdal, `10.0.0.248`, with the game at `D:\UlfheimData\games\FenrisAwakening`. Connect from Odin in the normal `Mcfiz` Windows context using PowerShell remoting, Negotiate, and the existing `McFizkCreds` PSCredential in `FizVault`. The sandbox account cannot use that account's Git or vault credentials. Never put credential values in files or command output.

## Build and test

Run the unit suites, recorded-audio browser check and relevant gameplay checks. Then run:

```powershell
node site-build-check.cjs
```

This builds a flat release under the ignored `backups/site-release-*` directory and tests it in a browser at the production URL path. The exact tested folder/version is recorded in `backups/tested-site-release.json`.

`build-site.cjs` copies only runtime JavaScript, CSS, unit definitions, the artwork manifest, PNGs and MP3s. It adjusts module imports for the existing flat website layout. Source references, tests, prompts, working backups, draft sprite studies and credentials are not included. A content-based release ID versions the entry script and stylesheet. IIS configuration disables stale caching and explicitly serves MP3 as `audio/mpeg`.

## Publish

After committing and pushing the authorized changes, use the tested directory:

```powershell
./deploy-site.ps1 -ReleaseDirectory '<the tested release directory>'
```

The script validates the local build path, transfers a ZIP through the remoting session, verifies staging hashes, backs up the existing game outside the public site, copies dependencies before the entry page, and verifies every published SHA-256 hash. Staging is under `C:\ProgramData\TalesOfValora\releases` on Heimdal; backups are under `C:\ProgramData\TalesOfValora\backups`. It does not change the games shelf or other games.

Verify the public `release.json`, title/slot flow, artwork, runtime modules and recorded audio in a browser. A local preview passing is not proof of a successful public deployment.

`deploy.ps1` is the historical 3D workflow and should not be used for this release. Browser saves remain on the same public origin, so a code deployment does not clear the player's local slots.
