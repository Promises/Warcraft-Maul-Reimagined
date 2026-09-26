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

## Tools
- [x] Launch straight into the map: the game's menus are a page it serves from `<install>/_retail_/webui`, so the page (now wc3-slop-lan's harness/webui/index.html) sits there and talks to the game on the same socket the menus use. `npm run play -- --auto` goes from build to in-game with no clicking.
- [ ] Two accounts in one game on this machine (`scripts/play-two.sh`). Working, with one caveat.

  How it fits together:
  - The management server (now wc3-slop-lan's harness/webui/server.py) is small. Each instance checks in, reports which screen it is on, and asks for work; wc3.sh (now wc3-slop-lan's harness/wc3.sh) sends the orders (`who`, `host`, `join`, `start`, `leave`, `raw`, `eval`, `reload`, `trace`, `log`, `ask`) so games can be started whenever and told what to do afterwards. `eval` runs any code inside a game's page and answers on the log, and `reload` re-reads the page after it is edited, so the driver can be changed without restarting anything.
  - The account is decided by which Battle.net client starts the game, and the only scripted way to ask a particular client is its dock menu (`scripts/launch-from-dock.applescript`): a client's own menus carry no launch action, `battlenet://launch/W3` only opens the window, and `--exec` spawns a fresh, logged out client. Pointing the game at another data root with `CFFIXED_USER_HOME`/`HOME` moves its files but not its session.
  - The second client is a copy of the app with its own bundle id, started once with `open -n -a "/Applications/Battle.net Alt.app" --env CFFIXED_USER_HOME=$ALT --env HOME=$ALT`. Its data root keeps its own preferences, logs and `CustomMapData`, with the Maps folder linked to the real one, which also settles the shared lobby stamp below.
  - Lobbies are made private with a password, since a Battle.net custom game is listed publicly while it exists.
  - The message order matters: `InitializeNetProvider` with an empty payload, then `GetMapList` for the map's own directory, then `CreateLobby`; a lobby naming a map the engine has not just listed is refused as "unavailable or corrupted". The joiner sends `JoinGameByGameName` with the password after the engine asks for one.
  - Do NOT send `InitializeLocalNetProvider` for a shared lobby: it switches the provider to LOOP (single player), and the lobby is then made locally - the engine reports it, the menus never open it, and the other account's game list stays empty. That is only for driving one instance into a map on its own (`wc3.sh solo`).

  The caveat: one game per account, and Battle.net sometimes bounces a session ("Login Queue"), which drops the host's lobby. Re-sending `host` and `join` picks it up again.

- [x] Desync on picking a race (2026-09-24), found with the two-account setup. The Pick button's
  handler runs on the clicking client only, and it started a game timer there to time out the
  in-flight pick. A timer running on one client and not the others is divergent state: it
  dropped that client the moment Pick was clicked, every single time. The wait is now a wall
  clock deadline watched by a timer every client starts (`RaceSelectPanel`).
  - How it was found, and what it was not: the engine's own desync logs (`tools/desync-report.py`)
    showed only the `ipse` counters differing, never units and never the generators. The
    lockstep trace then showed the surviving client living 13 seconds longer without ever
    receiving the pick, so the picking client died before its own message left the machine,
    which pointed at what the click does locally rather than at how the pick is applied.
  - Ruled out along the way: the random generators (both clients logged identical numbers from
    the game's and Lua's), and the unit selection handler (it never fired in the failing run).
    The rolls did go through `Math.random` instead of `GetRandomInt`, which is wrong and is now
    fixed in `Util.RandomInt`, `Util.ShuffleArray` and `RacePicking.randomChoice`, but it was
    not this bug.
  - Worth repeating on any handler gated to one client: frame clicks fire on every client and
    the gate is what makes them local, so anything inside the gate must touch nothing but
    frames and local fields. Timers, units, effects and orders are game state.

- [ ] Tooling from that hunt, worth keeping:
  - The lockstep trace: `src/lib/SyncTrace.ts` notes every synced message, creep spawn and
    death, tower built, race rolled and unit selected, and hands them to wc3-slop-lan's map
    library, which writes them (with a heartbeat of lives, wave, creeps, gold, kills, both
    generators' next number and the handle high-water mark) in numbered chunks in
    `CustomMapData`, per player. In games without the library it does nothing. `tools/sync-diff.py`
    prints the first line where two clients disagree; `tools/desync-report.py` compares the
    engine's own logs.
  - Driving a running game without keyboard or focus: the library's command channel (commands
    over sync data from the harness's host seat, or preload files read back with the
    `Preloader` trick LobbyStamp uses). What made the file channel work at all, both of which
    cost a while to find:
      - the read must sit in its OWN preload pass (`PreloadStart(); Preloader(f); PreloadEnd(1)`).
        Bare, it works during loading and silently does nothing once the match is running, which
        is why LobbyStamp never hit it. ScrewTheTrees' SaveLoadBigData is where this came from.
      - a name asked for while the file is missing is remembered as missing and is never read
        again. So each poll asks for a fresh name, and the writer aims a few names AHEAD of the
        one being polled, which the heartbeat publishes as `cmdpoll`.
  - How W3Champions reaches a running game, captured 2026-09-24 (the capture scripts were not
    kept):
    their client (Flo) runs a Warcraft III game host on loopback and the game joins it as a
    LAN game, with Flo sitting in a player slot. Every action and every chat line in the match
    passes through them, so they read `ChatToHost` and answer with `ChatFromHost` - that is the
    `[W3C]` line and the `-commands` reply, nothing to do with the web UI socket.
    Two things follow. Doing the same means being that host: the join handshake, slots, start
    and relaying every action in lockstep, which is days of work, not hours. And LAN hosting is
    not refused by Reforged after all, whatever the menus suggested, so a local host would also
    give two clients a game with no Battle.net at all: no public lobby and no login-queue kick.
  - Not usable: chat through the web UI socket, because the lobby chat channel is left at game
    start (`OnChannelLeave`) and after that `SendGameChatMessage` is dropped and
    `SendChatMessage` answers "Failed to deliver message"; `SendTeamMessage` still works but
    goes to the Battle.net party channel, which the map never sees. Synthetic key presses do
    reach the game, proven by typing `-log`, but need the window focused. Each game also listens
    on a second port beside the web UI one, binary and silent, which is what W3Champions
    connects to - unexplored.

- [ ] Testing with real clients lives in its own repo, ../wc3-slop-lan
  (github.com/Promises/wc3-slop-lan): a LAN host (Rust, on W3Champions' Flo crates), a map
  library (slop.lua, injected into a staged copy of the map, never built in) and a harness
  (`./slop` + slop.toml, Python tests, MCP). Warcraft Maul is its full example
  (maps/warcraft-maul there: slop.toml + tests.py; its map.file loads this repo's build); this repo only carries the hooks
  (src/World/Game/SlopHooks.ts: chat commands and "@" PlayerSync messages as any player, the
  heartbeat's lives/wave/creeps and kills/towers) and skips Slop.seat when seating defenders.
  Run: `../wc3-slop-lan/slop test warcraft-maul --build`;
  .mcp.json serves it as wc3-slop. The web UI page, its server and wc3.sh moved there too;
  play.sh and play-two.sh use them from ../wc3-slop-lan (or WC3_SLOP). TEST_BUILD and
  build:test are gone: no build contains test code any more. Proven 2026-09-25 on the old
  layout: two clients in lockstep for 714k ticks, commands landing on both; all four tests
  passed one by one. Run on the new layout since (2026-09-26): the race tests below.
  Not covered: UI itself (frames, clicks, hover) and UI handlers' own logic, since tests send
  the sync messages directly.

- [x] Debug game mode (GAME_MODES.DEBUG): the classic game without wave progression - no wave
  comes unless a player starts it (-start, in any build while in this mode), and after it the
  game stays on that wave (no next wave, reward or win). Set only with the host's settings
  command, -s / -settings / .s / .settings [n|normal / b|blitz / d|debug] [100-400] (any whole
  difficulty in between too), which host bots and the automated tests use; not on the host's
  panel or in the vote. The tests need it: in Classic, removing a creep player's last unit (a
  test target) ends the "round" - wave +1, round gold, and the next wave 20 s later.
  (2026-09-26)
  - [ ] Its scoreboard never fills the armour and creep-type cells (UpdateScoreboardForWave is
    Classic's, private).
  - [ ] Debug builds: the hidden Secondary tab keeps its slot, leaving a gap above Dev.
- [x] Secondary race: Shrine of Buffs (I026) is a secondary race (tier from its tooltip,
  RaceItems 'Secondary'). The race picker shows a Secondary tab to a player who has a race and
  opens on it then; a secondary pick costs a pick's lumber like any other and is refused before a
  first race. It stays out of the normal tabs, the random race picks and the Dev tab (its towers
  are still in the hybrid tower pool). (2026-09-26)
- [x] KodoBeast is dead code: it orders a devour on every attack, and the Chaos Kodo Beast (o006,
  only Command Aura) has no Devour, nor did the Barrelmaster (oC58) it was once registered on.
  Unregistered (the class is kept, the registration commented in ShrineOfBuffsTowers) until the
  Kodo gets a Devour. (2026-09-26)
- [x] WarcraftMaul's debug check did FourCC(red's name), which throws on a name shorter than four
  characters and stopped the map from starting for everyone seeing it (LAN/offline names). Fixed.
- [ ] Race tests (wc3-slop-lan maps/warcraft-maul/races.py, from scripts/race-data.js): every
  Beginner race - builder, every tower and upgrade built at its gold, farms' food, every form
  that attacks (base forms and upgrades alike) hitting with its attack type and for the damage
  its attack says (before armor), every aura reaching itself / a tower of the race next to it /
  the target and nothing in another lane, behaviour classes doing their thing - plus Rock Giant,
  Sea Giant, Ancient Golem, Iron Golem Statue and Ancient Protector on their own, and the
  secondary race. Red and blue both pick the race and build at once (about half the time, still
  one race per game). Towers are looked at in rounds spread over all 13 lanes (one in the middle
  of each, several in each player's own; homesick towers only there), so no tower reaches
  another's target; a tower upgrades in place between rounds and is sold when done. Games run in
  Debug mode, so no wave interferes.
  Not covered yet: Corrupted Tree of Life (needs its research), sold-tower refunds (Critters'
  Mazing Tower), the chance-based Thrall/Magtheridon casts beyond a sanity check, the size of an
  aura's effect (only that its buff lands), and the race picker's UI itself. Run:
  `../wc3-slop-lan/slop test warcraft-maul` or `--only <name>` for one.
- [ ] Found by the race tests (2026-09-26), each seen in a real two-client game:
  - [x] Forest Troll High Priest (n03I): ForestTrollHighPriest ordered a monsoon on every attack,
    which cancelled the attack - only monsoons, its own magic attack never landed (confirmed in
    play). Casting only when ready did not help (channel 12 s, cooldown 10 s). Fixed: a dummy
    (u008) casts the monsoon on the attacked unit's spot whenever the tower's A03P is off cooldown
    (the tower's button shows the cooldown), and the tower attacks throughout. Race test passes:
    54 magic attacks and a monsoon every ~10.5 s in one round. (2026-09-26)
  - [ ] Monsoon (A03P, from ANmo) strikes each unit through one monsoon only: a unit struck by
    one is never struck by a later one, even after the first caster is gone (probed with three
    targets and dummies living 13 s and 25 s). Its strikes also go on as long as the caster lives,
    not the 12 s it lasts. Creeps walking through rarely meet two, but a boss would take one
    monsoon and no more. Options: set A03P's duration fields and see, or strike from a trigger
    instead of the ability.
  - [x] Berserker (o00E, A03K) and Flesh Golem (o00G, A03R): their berserk (from Absk) kept Absk's
    requirement (the Berserker Upgrade research), so it never cast. Fixed: areq cleared on both
    in war3map.w3a.
- [ ] Off-by-one audit (2026-09-26), checked in the code:
  - CreepAbilityHandler.ts:87 `slice(0, length - 1)` drops the last creep ability (MorningPerson),
    and :102 `slice(0, IMinBJ(picks - 1, ...))` hands out one ability too few: Medium (200%)
    gets none, Hard one instead of two. Should be `slice(0)` and `slice(0, Math.min(picks, length))`.
  - UnchargedRune.ts:17 loops to `ELEMENTALIST_ABILITIES.length - 1`, so the 6th element (A0C3,
    Life Rune) is never rolled - nor are its five combinations.
  - MultiBoard.ts: the first player is written to row 7, over the "Player / Kills" header (rows
    are 1-based; players should start at 8, and the board needs size + 7 rows). Same base in
    Defender.ts:634/666 and Commands.ts:851.
  - Defender.ts:666 GiveKillCount after a leave writes to row 7 + (-1) = 6 (the creep-type cell):
    guard `_scoreSlot > -1`.
  - Commands.ts:841 votekick needs `players.size / 2 + 1` votes as a float: with 3 players 3.5
    votes out of 2 possible voters - a kick is impossible. `Math.floor(size / 2) + 1`.
  - Wyvern.ts:9 skips waves 34 and 35 instead of 35 and 36 (`currentWave + 1`); likely a port of a
    0-based counter.
  - LootBoxerHandler.ts:198-207 looks the tier up after ReplaceUnit, gets -1 and always gives the
    tier-1 item; the tier 3+ item table is unreachable.
  - DamageEngine.ts:285/297 purge loops are inverted (dormant: nothing deals damage from a damage
    handler today).
  - Open: creep ability level is `currentWave + 1` (CreepAbility.ts:54 and others), while
    Creep.MorningPerson uses `currentWave` - one of the two is off by one.
- [ ] VenomTower (h045) does nothing but order itself to 'stop' after each attack; its tooltip
  promises "25 dps + 30% slow for 3 s". Is the stop intended (a retarget?) or a leftover?
- [ ] -repick doesn't clear player.races, hasNormalPicked or repickCounter: re-picking the same
  race is refused ("You already have ...") and hybrid is blocked after a repick.
- [ ] Loot Boxer (I02D) shows in the Advanced tab (its tooltip says Advanced); comments in
  RaceSelectPanel say it only appears in the Dev tab.

## Backlog
- [x] Audit follow-ups from the Buildtools comparison: Wyvern radius 128 vs 500 (TODOs in code), Iron Golem spike angles, `-killall` uses RemoveUnit instead of KillUnit.
- [x] `war3map.imp` regeneration defect in the build (imports listed twice / stale entries). The build now generates it from the archive contents.
- [x] Lobby stamp carrier: the lobby timestamp rides in the `ANcl` (Channel) tooltip on the local client. Verified no unit type in the map carries the base `ANcl` (28 custom abilities derive from it, each with its own tooltip), so nothing can show it. A dedicated ability is not possible from the build (abilities are not part of the compile-time object data), so this stays as is; revisit only if a unit ever gets plain Channel.
- [ ] Two clients on one user account share `CustomMapData/wm-lobby.txt`, so the lobby host source ties on a single machine (race and disk still work). Only matters for local testing; the lobby pass has no natives, so the file cannot be keyed by player. Accepted limitation.
