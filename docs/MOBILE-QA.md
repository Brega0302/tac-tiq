# Mobile verification — 22 October 2026

## Completed

- All 54 tests pass, including denied audio-unlock retry, synchronous priming/resume, interrupted-state recovery, visibility transitions, independent effects/music, unavailable audio and missed-beat handling.
- TypeScript and Vite production build pass.
- Browser viewport checks: 320, 375, 390 and 430 px portrait; 844 x 390 landscape; desktop 1280 px. No horizontal page overflow in the inspected game layouts.
- A same-colour L/M/S stack was played through to victory on the narrow layout. The rings stay circular with consistent gaps at 320 and 390 px. Portrait ring cell widths measured about 80 and 105 px respectively.
- Classic X/O symbols, current player cards, score badges and primary actions checked on narrow screens. Classic cell widths ranged from about 80 px at 320 to 117 px at 430.
- Ultimate enlarged view: selected board 5, placed cell 6, confirmed board 6 became forced; reopened enlarged view on board 6, placed centre and confirmed routing back to board 5. Enlarged cells measured about 101 px at a 390 px viewport.
- Music starts with its first control tap, the next tap disables it, and effects stay enabled. UI reflects the runtime readiness rather than assuming audio started. Browser/device hardware output is not verified by this check.

These visual checks ran in the desktop browser at mobile viewport sizes. They do not replace Safari running on physical iPhone hardware.

## Physical iPhone checklist

1. Open the published site in Safari, refresh once, and tap the music play button. Check audible music and move/win effects at normal media volume.
2. Toggle music and effects independently. Confirm preferences survive refresh.
3. Switch to another app, lock/unlock, return to Safari and tap again. Check recovery without duplicate music loops.
4. Rotate portrait/landscape. Check circular rings, board proportions, button reachability and screen cutouts.
5. Play every variant, including Ultimate's Enlarge board, in English and Bosanski. Check its closed-board/free-choice behavior in a longer match.
6. On older iOS versions without AudioSession playback support, also check the device silent switch and Bluetooth/AirPlay output routing if the page reports audio ready but nothing is audible.

References for the implemented Safari recovery and optional playback session:
- https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#resuming_interrupted_play_states_in_ios_safari
- https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
- https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/User_activation
