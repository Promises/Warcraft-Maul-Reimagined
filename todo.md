# Todo

## Bugs
- [x] Void fragment-based buildings: when a build is cancelled by anti-juggle / anti-block, the fragment (mana) cost is not refunded. Gold is refunded by the cancel; the mana path needs the same. (f2de51b)

## Features
- [x] Range check mode (`-range` / action bar button): a toggle (action bar button and/or chat command, per player, local) that draws the attack range around the currently selected tower while enabled. Selection events already exist per player (`Defender.SelectUnit`); range from `BlzGetUnitWeaponRealField(ATTACK_RANGE)`; render as a local-only image/effect ring like the maze grid.

## Backlog
- [x] Audit follow-ups from the Buildtools comparison: Wyvern radius 128 vs 500 (TODOs in code), Iron Golem spike angles, `-killall` uses RemoveUnit instead of KillUnit.
- [x] `war3map.imp` regeneration defect in the build (imports listed twice / stale entries). The build now generates it from the archive contents.
- [x] Lobby stamp carrier: the lobby timestamp rides in the `ANcl` (Channel) tooltip on the local client. Verified no unit type in the map carries the base `ANcl` (28 custom abilities derive from it, each with its own tooltip), so nothing can show it. A dedicated ability is not possible from the build (abilities are not part of the compile-time object data), so this stays as is; revisit only if a unit ever gets plain Channel.
- [ ] Two clients on one user account share `CustomMapData/wm-lobby.txt`, so the lobby host source ties on a single machine (race and disk still work). Only matters for local testing; the lobby pass has no natives, so the file cannot be keyed by player. Accepted limitation.
