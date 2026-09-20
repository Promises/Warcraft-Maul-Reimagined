# Todo

## Bugs
- [ ] Void fragment-based buildings: when a build is cancelled by anti-juggle / anti-block, the fragment (mana) cost is not refunded. Gold is refunded by the cancel; the mana path needs the same.

## Backlog
- [ ] Audit follow-ups from the Buildtools comparison: Wyvern radius 128 vs 500 (TODOs in code), Iron Golem spike angles, `-killall` uses RemoveUnit instead of KillUnit.
- [ ] `war3map.imp` regeneration defect in the build (imports listed twice / stale entries).
- [ ] Lobby stamp carrier: the lobby timestamp rides in the `ANcl` (Channel) tooltip on the local client; harmless today, pick a dedicated dummy ability if Channel ever gets shown.
- [ ] Two clients on one user account share `CustomMapData/wm-lobby.txt`, so the lobby host source ties on a single machine (race and disk still work). Only matters for local testing.
