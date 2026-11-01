# Book of Fenris project guidance

## Interface direction (author confirmed 29 October 2026)

- Avoid pop-ups, browser alerts and modal dialogs. Prefer in-world text, banners, notifications, flags and docked panels.
- Villager conversations belong in a dialogue panel at the bottom of the screen, with a portrait for each speaker. Use the existing Fenris portrait and temporary face crops of the NPC sprites.
- Keep the world visible without a backdrop. Use docked side panels for menus, inventory, trading, journal entries and save-slot controls.
- Preserve authored dialogue, choice/check mechanics, rewards, memories and affinity when changing presentation. Interface changes do not authorize new story or character knowledge.

## Project organization (author confirmed 1 November 2026)

- This directory is the Git root. The old BookOfFenris subfolder is gone.
- RELEASE contains the supported game, installed assets, current stats/lore, regression tests and release tooling. Keep runtime changes here.
- UNPUBLISHED contains unfinished animations, source exports, concepts, sound experiments, reference imports, QA output, builds, backups and the historical 3D prototype. Do not silently ship these files.
- Both folders are tracked and pushed to Git, including development work. Do not reintroduce broad ignores for artwork, QA or archives. Exclude only local secrets, dependencies and caches.
- Run npm commands from this root. The local preview preserves the /private-opening/ URL; website bundles contain only RELEASE runtime files.
- Preserve original generation prompts and historical provenance. UNPUBLISHED/Organization/moves.json maps previous locations to their new homes.
