# Local saved games

The active 2D game has **Continue** and **New Game** on its title screen, with three independent local slots. New Game chooses a slot and a new forest seed. An occupied or unreadable slot requires explicit confirmation before replacement. Continue lists the slots, shows their date, game day/time and location, and disables empty or unsupported slots.

The pause menu includes Save Game, Load Game, New Game and Save and return to title. Progress autosaves every ten seconds of unpaused play, on opening a dialog/pause, when the page becomes hidden and when leaving it. Autosaves belong to the selected journey's slot. Restart the awakening resets the current journey in that slot; it does not reset the other slots.

Saving includes the forest seed, position and facing, awakening progress, seating state, current interior, movement-driven clock, village discovery/tracking, observations and journal notes, voice cue progress, inventory, money, stock, negotiated prices, paid work, harvested resources and daily well usage. It also includes resolved conversations and rewards, perception outcomes, and all registered units' health, XP, resources, modifiers, memories, knowledge, flags and affinity. Dialogs, held input and pending click paths are closed/cleared on load.

The forest regenerates from its seed instead of storing every scenery chunk. Interiors regenerate from their building ID. Event and conversation state prevents rewards, harvesting and encounters from repeating after load.

`private-opening/saves.js` owns the versioned envelope, slot storage and validation. Keys are `tales-of-valora:save:1` through `:3`. Each slot is stored with one `localStorage.setItem` operation. Every subsystem is validated on fresh instances before the active game is restored. Malformed or unsupported saves remain stored until the player explicitly replaces them; one damaged slot does not block the other two. A failed storage write reports the problem and retains the previous save.

Saves belong to the browser profile and exact site origin, including port. Localhost saves do not appear automatically on the published website, another device, another browser or a different port. Clearing site data removes them; private browsing may discard them. There is no cloud synchronization or export/import UI yet.

Run `node --test private-opening/saves.test.mjs` for serialization, slot isolation, failed writes, malformed saves and duplicate-reward protection. `node private-opening/saves-check.cjs` verifies the player-facing flow, reload and Continue, interior and unit restoration, confirmation/cancellation, damaged slots and mobile layout. Screenshots and reports are in `private-opening/qa/`.

## Rest / Wait

Use Rest / Wait beneath the clock, the pause menu, or T after awakening. Choose a 1-hour short rest, an 8-hour long rest, 8 hours of sleep, or simply wait 15 minutes, 1/4/8 hours, or until the next 06:00. The world clock passes one hour per real second; daylight, village discovery, residents and shop opening hours follow that clock. Movement, interaction or Stop waiting interrupts without rest completion credit. Outdoors, all activities require dry ground and a conscious character.

Provisional rules live in `private-opening/resting.js`:

- Over 60 minutes of continuous waiting causes Restless: −1 Perception and −1 Initiative. Moving resets the continuous-wait counter, but an existing penalty lasts until a completed rest. Consecutive waits accumulate, including across saves.
- Completing a short rest clears Restless and resets the 24-hour no-rest timer. It does not clear existing exhaustion.
- Sleep and long rest share a rolling 24-hour limit measured from starting either. Starting reserves the window even if interrupted or reloaded. The menu displays the next allowed start time; midnight does not reset it.
- After 24 world hours without a completed rest, exhaustion applies −2 ability checks (including skills) and 20% slower movement. It is a single, non-stacking debuff. Completed sleep or long rest clears both penalties and resets the no-rest timer.
- Perception penalties apply to live passive discovery; exhaustion affects actual walking/running speed, as well as the stats sheet. The two deficits stack when both are active. Ability scores, saving throws, HP, hit dice and gear remain unchanged. Completion counts and unit memories provide hooks for later restoration/maintenance.

Pausing or losing focus freezes accelerated time. Saves keep elapsed time, fatigue, the continuous-wait counter, cooldown reservations and completion history. Loading ends the remaining activity without awarding completion, and plays sleep-to-sit for a saved sleeping pose. Existing version-one saves without rest state receive a fresh 24-hour grace period at their saved clock time. New journeys begin with that same grace period.

Run `node --test private-opening/resting.test.mjs private-opening/saves.test.mjs`, `node private-opening/resting-check.cjs`, and `node private-opening/waiting-check.cjs`. The browser checks cover live deficits, rest completion, cooldowns, animations, reload, pause, interruption and phone layouts. Reports/screenshots are under the ignored `private-opening/qa/` directory.
