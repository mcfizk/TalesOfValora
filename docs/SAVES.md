# Local saved games

The active 2D game has **Continue** and **New Game** on its title screen, with three independent local slots. New Game chooses a slot and a new forest seed. An occupied or unreadable slot requires explicit confirmation before replacement. Continue lists the slots, shows their date, game day/time and location, and disables empty or unsupported slots.

The pause menu includes Save Game, Load Game, New Game and Save and return to title. Progress autosaves every ten seconds of unpaused play, on opening a dialog/pause, when the page becomes hidden and when leaving it. Autosaves belong to the selected journey's slot. Restart the awakening resets the current journey in that slot; it does not reset the other slots.

Saving includes the forest seed, position and facing, awakening progress, seating state, current interior, movement-driven clock, village discovery/tracking, observations and journal notes, voice cue progress, inventory, money, stock, negotiated prices, paid work, harvested resources and daily well usage. It also includes resolved conversations and rewards, perception outcomes, and all registered units' health, XP, resources, modifiers, memories, knowledge, flags and affinity. Dialogs, held input and pending click paths are closed/cleared on load.

The forest regenerates from its seed instead of storing every scenery chunk. Interiors regenerate from their building ID. Event and conversation state prevents rewards, harvesting and encounters from repeating after load.

`private-opening/saves.js` owns the versioned envelope, slot storage and validation. Keys are `tales-of-valora:save:1` through `:3`. Each slot is stored with one `localStorage.setItem` operation. Every subsystem is validated on fresh instances before the active game is restored. Malformed or unsupported saves remain stored until the player explicitly replaces them; one damaged slot does not block the other two. A failed storage write reports the problem and retains the previous save.

Saves belong to the browser profile and exact site origin, including port. Localhost saves do not appear automatically on the published website, another device, another browser or a different port. Clearing site data removes them; private browsing may discard them. There is no cloud synchronization or export/import UI yet.

Run `node --test private-opening/saves.test.mjs` for serialization, slot isolation, failed writes, malformed saves and duplicate-reward protection. `node private-opening/saves-check.cjs` verifies the player-facing flow, reload and Continue, interior and unit restoration, confirmation/cancellation, damaged slots and mobile layout. Screenshots and reports are in `private-opening/qa/`.

## Rest / Wait

Use Rest / Wait beneath the clock, the pause menu, or T after awakening. Choose 15 minutes, 1/4/8 hours, or the next 06:00. Fenris sits while the world clock passes one hour per real second; daylight, village discovery, residents and shop opening hours use that clock. Movement, interaction or Stop waiting cancels the remaining duration. Waiting requires dry ground outdoors. This time-passage feature does not apply healing or spend hit dice.

Pausing or losing focus freezes accelerated time. Saves keep the time already passed and the seated pose. Loading a save ends the remaining wait, so acceleration never starts unexpectedly after Continue. Existing version-one saves remain compatible.
