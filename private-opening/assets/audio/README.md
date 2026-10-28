# Audio assets

Copied from the AudioGeneration repo (`ToV/`), where the generator scripts, prompts and credit log live.
The recorded clips are wired through `audio-catalog.js` and `audio.js`. Wind is a quiet loop at 50% gain; forest walking uses the dry-leaf footsteps; water keeps its procedural sound.

Files are named after what is said (voice) or what is heard (SFX). All are MP3, 44.1 kHz, 128 kbps, from ElevenLabs.

| Folder | Contents |
|---|---|
| `voice/fenris/barks/` | Short world-interaction lines ("Hmm...", "Stand back!", "This way.") for examining, discoveries and warnings |
| `voice/fenris/dialogue/` | Full spoken lines |
| `voice/rixa/dialogue/` | Rixa's profile lines, for when she is implemented |
| `sfx/forest/` | Dark-forest sounds: wind, twig snap, distant howl, crows, footsteps, creaking, wings, growl, heavy steps |
| `sfx/creatures/<id>/` | Wildlife sounds per critter unit (`deer`, `wolf`, `hare`, `owl`): noticed, fleeing, warning/threat, hurt |

New characters get `voice/<name>/{barks,dialogue}/`; new areas get `sfx/<area>/` (e.g. `sfx/village/`).

## Runtime use

Fenris barks accompany new observations, perception discoveries, surprises, gathering wood and tracking the village. A single voice channel, five seconds of quiet after a line and per-line cooldowns prevent overlapping or repeated chatter. Voice text appears beside Fenris. The mysterious opening voices remain subtitle-only; they are not replaced with Fenris or Rixa recordings.

Forest ambience uses wind, creaking, distant howls, wings and whistles at night, with crows during daylight. Branch events creak when noticed and snap on a surprise. The placeholder deer uses browsing, fleeing or alarm sounds only after the relevant perception outcome. Sounds do not reveal hidden encounters before their perception checks. Direction and distance attenuate event sounds. Pause, mute, restart and scene changes stop loops and discard pending playback. Missing audio never blocks play.

All 42 supplied clips are catalogued. Creature sound sets are associated with their unit IDs. Warning, threat and hurt sounds remain available for authored creature behaviour; growls and heavy steps do not fabricate a hostile encounter. Rixa and full dialogue recordings remain reserved for their intended story scenes. No new character or dialogue scene is introduced just to play a file.

`node private-opening/audio-check.cjs` verifies real playback/decoding, footsteps, voice captions/cooldowns, pause, mute and asynchronous cancellation. The local server and IIS release serve MP3 as `audio/mpeg`.
