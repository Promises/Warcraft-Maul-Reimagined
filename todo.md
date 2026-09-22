# Todo

## Bugs
- [x] Void fragment-based buildings: when a build is cancelled by anti-juggle / anti-block, the fragment (mana) cost is not refunded. Gold is refunded by the cancel; the mana path needs the same. (f2de51b)

## Features
- [x] Range check mode (`-range` / action bar button): a toggle (action bar button and/or chat command, per player, local) that draws the attack range around the currently selected tower while enabled. Selection events already exist per player (`Defender.SelectUnit`); range from `BlzGetUnitWeaponRealField(ATTACK_RANGE)`; render as a local-only image/effect ring like the maze grid.

## Features
- [ ] Randomised waypoints on extreme difficulty. Each lane's two in-area checkpoints move by a random offset, so the maze cannot be copied from memory. Inspected in game with the debug commands `-wptest [n]` (marker tiles at random spots in the red lane) and `-hidewp` (hide and restore the real two); the tile is Cityscape white marble `Ywmb` on Icecrown rough dirt `Idtr`, one 128 tile per waypoint, 26 in the map.

  What it includes:
  - Roll the offset when the difficulty is known (the vote resolves before wave 1), not at map init.
  - Rebuild each checkpoint rather than move it: the enter-region event binds to the rectangle when it is registered, so a moved rectangle keeps firing at the old place.
  - Repaint the marker: the old tile back to `Idtr`, the new one to `Ywmb`, snapped to the 128 grid. The tile's unbuildable flag travels with it, which keeps towers off the new spot and frees the old one.
  - Rebuild the footprint arrows. They are created once at init from the checkpoint positions, live five minutes, and are held in a local variable in `WorldMap.setupArrows`.
  - Keep the lanes congruent: one offset for every lane. `LaneTransfer` carries a maze between lanes by measuring from the checkpoints, so per-lane offsets would land towers wrong on a gray takeover or `-swap`, and would make some lanes plainly easier to maze than others.
  - Constrain the roll: waypoints sit 1152 apart with 768 to each side, so keep a minimum clearance from the area edge and between the two. Start around 384 rather than the 640 (five tower widths) first considered.

  Follows for free: the sample maze and the "you cannot build on a checkpoint" rule read the rectangles live, as do creep orders.

## Backlog
- [x] Audit follow-ups from the Buildtools comparison: Wyvern radius 128 vs 500 (TODOs in code), Iron Golem spike angles, `-killall` uses RemoveUnit instead of KillUnit.
- [x] `war3map.imp` regeneration defect in the build (imports listed twice / stale entries). The build now generates it from the archive contents.
- [x] Lobby stamp carrier: the lobby timestamp rides in the `ANcl` (Channel) tooltip on the local client. Verified no unit type in the map carries the base `ANcl` (28 custom abilities derive from it, each with its own tooltip), so nothing can show it. A dedicated ability is not possible from the build (abilities are not part of the compile-time object data), so this stays as is; revisit only if a unit ever gets plain Channel.
- [ ] Two clients on one user account share `CustomMapData/wm-lobby.txt`, so the lobby host source ties on a single machine (race and disk still work). Only matters for local testing; the lobby pass has no natives, so the file cannot be keyed by player. Accepted limitation.
