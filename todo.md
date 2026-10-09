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

- [ ] Async (zero-latency) local clicks (hiveworkshop.com/threads/async-zero-latency-buttons.357700):
  onLocalClick watches an EscMenuButtonTemplate button's pushed backdrop (child 1) and highlight
  (child 5) and runs its handler as the button is let go, instead of a round trip later with the
  synced click; the synced click still runs it when the watch did not. 24 buttons watched (race
  picker, vote, host settings' vote/confirm, gray claim); the host settings rows (plain BUTTONs)
  keep the synced click. Clicked through by hand in two-client games (host settings, player
  vote, race picks): no desync, the clients' traces agree, one pick each. (2026-09-29)
  - [x] The host settings rows: a template of our own (CustomRowButton) loaded fine, but looking
    up its children (BlzFrameGetName, then Frame.fromName) crashed the game as the map loaded. The
    rows are now CustomTextButtons drawn with alpha 0 (children 1 and 5 as everywhere else): the
    map loads, and all 22 text buttons are watched. Not clicked by hand yet. (2026-09-29)
- [x] Pay the Toll (A0BF; Void husks, Elementalists' Depleted Rocks) did nothing, in silence, for a
  player with less than 50 gold, and the cast still went off. Now it says it costs 50 gold and the
  cast is called off. test_pay_the_toll_on_a_depleted_rock (wc3-slop-lan races.py): a rock made by
  Siphon Energy, refused at 10 gold, paid (50) and gone at 100. (2026-09-29)
- [x] Void Restoration (A095, the Void Priest h02F): its class was named PayTheToll and never
  registered, so it never did anything. Now VoidRestoration, registered: +10 void fragments (capped)
  when it heals a tower bought with fragments. Its targeting (organic, not invulnerable) already
  keeps it to those (Being and up); the engine refuses it on a Worshipper. test_void_restoration
  (wc3-slop-lan races.py) sees both; a restoration that pays is untested (the harness cannot buy a
  Void Being: items). (2026-09-29)
- [ ] Elementalists fall off late: their best towers are ~1,300-1,400 dps (Sandstorm L2 on up to
  5 targets, Life Rune L3, Undead L2 by round 30); wave 34 is 825,000 hp a lane at 100%. Redesign
  in progress ("Elementalist Improvements": Attunement, Primal fusions, Ascension), on the
  `elementalist` branch. Measured (wc3-slop-lan measure.py, 2026-09-29): finishers 3,750-41,250
  dps (Giant Revenant, Blademaster, Dalaran ~6 attacks/s, Illidan, ...), Elementalist L3 runes
  133-1,441; Sandstorm L2 ~6,900 on 5 targets, Tree 373, Air L3 352. Income from the code:
  ~1,600 gold by wave 20, ~3,100 by 30, ~3,900 by 34.
  - [x] Lich prototype (branch): Attunement (AttunedTower: +2%/wave to 15, flat per-wave growth,
    carried through Tower.Upgrade and into fusions), mature pieces, the Lich unit (uP01, made at
    build time in ElementalistPrimals.ts), Siphon's fee checked at cast. test_lich (wc3-slop-lan
    measure.py) passes: fee refused and taken, Undead's damage kept, +25/wave. Measured ~330 dps
    after 5 rounds: flat +25/wave was far too slow for the late game; now +100 (~680 dps after 5
    rounds, ~5,000 by wave 35 from a wave-15 Lich).
  - [x] Thunderhead (uP02, branch): Air Rune L3 + Water Rune L3, 600 gold (no per-player limit);
    Dalaran's weapon with chaos damage (~1,500), air only; the Pandarian Storm Spire model (Remixer)
    with a lightning-ball missile. test_thunderhead: fee refused and taken, never hits ground;
    8,827 dps against air (Dalaran 12,118).
  - [x] Undead L1 -> L2 threw its +5 stacks away (ReplaceUnit reset the damage); now carried.
  - [x] Ascend (AP01) and Surge (AP02), abilities added to the built map by
    scripts/primal-abilities.js; the Ascended Lich King (uA01, +160/wave) and Eye of the Storm (uA02,
    ~2,100 a hit), +5% of base a wave uncapped, one of each per player. test_ascension: Surge 10
    levels (60 each) then refused, Ascend refused below Attunement 15, made at 15 for 500; the Eye
    gains 79 a wave (5% of its 1,576 base, before Attunement); 17,129 dps against air right after ascending - it keeps its
    +30% Attunement, so it starts well past Dalaran, not at parity: tune.
  - [x] The other Primals and their Ascended forms (branch), from the design plan's numbers:
    Haboob uP03 (Sandstorm L2 + Air L3, 400; Barrage set per tower to 8 targets, range 500) ->
    Endless Storm uA03; Heart of Life uP04 (two Life L3, 500) -> Avatar of Life uA04 (+50% in the
    boss waves 35-37); World Tree uP05 (Tree + Nature L3, 400; siege splash 250) -> Nordrassil uA05
    (every 5th attack roots 1 s, not in boss waves); Inferno uP06 (Purgatory L2 + Fire L3, 350;
    burns 400/s within 400, in code) -> Firelord uA06 (900/s within 450). test_primals (wc3-slop-lan
    measure.py) puts the ingredients down with the map's .tower hook, and checks fees, classes,
    Barrage count, splash, burn, roots and the boss bonus. Remixer is credited for the Storm Spire.
  - [x] Models for the four new Primals and their Ascended forms: Haboob Sand Elemental (MiniMage,
    icewolf055), Endless Storm Al'Akir (Explobomb), Heart of Life Heart Crystal (Tranquil), Avatar of
    Life Demigod Cenarius (FerSZ), all from Hive; World Tree, Nordrassil, Inferno and Firelord on
    the game's Ancient Protector, Tree of Life, Lava Spawn and Avatar of Flame. Credits in
    asset-credits.md and the changelog. All six Elementalist tests pass with them (M1, 2026-10-09).
  - [x] Looked at in game (test_primal_looks, M1 screenshots, 2026-10-09): the Lich and the Lich
    King were invisible (units\Undead\Lich\Lich does not exist); now the Lich hero and Kel'Thuzad.
    The Heart Crystal overflowed its tile at 0.9 and filled it at 0.6; now 0.45. The rest fit.
  - [x] Midgame bridge (branch): Purgatory and Decay burn in code, Mist (+10% to a magic tower's
    target), Tornado's Updraft (+20% attack speed nearby), Blaze and Bubbles back to Uncharged
    Runes, Recharge (Depleted Rock to Uncharged Rune, 8 gold), Plague (a creep dying in the lane
    infects those within 300). test_midgame (wc3-slop-lan measure.py) passes on the M1 (2026-10-09):
    burns 21/158/16 a second (20/150/15), Mist +9%, Updraft 2.50 -> 2.98 attacks a second, Plague
    infects the targets beside a dying creep.
  - [x] Sandstorm L2's tooltip said "up to 5 targets"; its Barrage (A0E4, field 5) hits 7 (the
    field is extra targets minus one, measured on the Haboob). Now says 7.
  - [ ] Other "attacks up to N targets" tooltips (Barrage-based multishots of other races) may be
    off the same way; unmeasured.
  - [x] Recipe discovery, as in the "Elementalist Recipe Tree" design doc (branch): the first Siphon
    on an undiscovered Primal pair reveals it for free and the next makes it; a pair with no recipe
    says "Nothing stirs", with a hint when a tower goes into an undiscovered Primal; the first of
    each Primal in a game is announced; Siphon's tooltip lists the Primal recipes the player knows.
    Debug command -forget empties the book. test_recipe_discovery (wc3-slop-lan measure.py).
  - [x] Saves (docs/save-format.md): src/lib/Save (bit-packed sections,
    signed and scrambled with a key tied to the battletag), src/World/Game/Saves.ts (read by the
    owner's client a second in, synced through PlayerSync, written on change; unknown sections
    kept). The recipe book is section 1. Codec unit tests: `npm run test:lua`, on a 32-bit Lua 5.3
    like the game's (math.maxinteger is 2^31-1 in game; a desktop Lua hid a float-constant bug).
    test_recipe_discovery: a file written in one game loads on both clients in the next, and an
    edited file is rejected.
  - [x] The recipe book panel: an action bar button (Elementalists only) or -book opens the
    player's book, Primals with recipe, fee and role, first fusions in two columns, the rest as
    "???". A local view; test_recipe_discovery checks the button and -book on both clients.
    It was never drawn: its backdrop was anchored to its own Close button, and a frame anchored to
    its own child is not drawn, though BlzFrameIsVisible says it is (so the test passed). Now the
    box is the texts' sibling under an undrawn frame; looked at on the M1 (test_primal_looks).
  - [x] The book redesigned as the Fusion Table (Claude Design handoff, `../Wc3 buttons/recipe-book/SPEC.md`,
    direction B): the Rune table with the 21 first fusions, the Primal ledger with the Ascended,
    tier frames and sealed plates (uiImport\RecipeBook\*.dds), and one Primal free for a player
    who has found all 21 first fusions (the spec's free reveals of first fusions left out, by
    choice: only the stuck player gets help; RecipeRules.ts), what was given and the Ascended made
    kept in the save (section 1 grows by two bit sets). Debug command -learn sets a book up.
    test_recipe_book (wc3-slop-lan measure.py): the four states as screenshots, clicks by both
    players, in step, the save round trip; `npm run test:lua` covers the offer and old saves.
  - [ ] Look at the book's tooltips in game (hover cannot be scripted; placement is from a corner so
    the top rows' stay on screen).

- [x] The mode and difficulty votes end as soon as every player has voted, instead of always
  waiting their 10 s (the timer still ends them for players who do not vote). The results go to
  the trace ('vote'). test_vote_ends_when_everyone_voted (wc3-slop-lan tests.py): mode within 2 s
  of the host leaving it to a vote, difficulty 1 s after both voted. (2026-09-29)

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
  - [x] Its scoreboard never followed the wave (level, armour, creep type stayed wave 1's): the
    update was Classic's, private, and Blitz had two more copies of it. One shared
    ShowWaveOnScoreboard in AbstractGameRound now, which Sandbox calls with its clock (Classic's
    copy also capitalised only the first letter). test_scoreboard_follows_the_wave: screenshots
    show Hero (Boss) on wave 35 and Medium on wave 12 (2026-10-09).
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
- [x] Found by the race tests (2026-09-26), each seen in a real two-client game:
  - [x] Forest Troll High Priest (n03I): ForestTrollHighPriest ordered a monsoon on every attack,
    which cancelled the attack - only monsoons, its own magic attack never landed (confirmed in
    play). Casting only when ready did not help (channel 12 s, cooldown 10 s). Fixed: a dummy
    (u008) casts the monsoon on the attacked unit's spot whenever the tower's A03P is off cooldown
    (the tower's button shows the cooldown), and the tower attacks throughout. Race test passes:
    54 magic attacks and a monsoon every ~10.5 s in one round. (2026-09-26)
  - [x] Monsoon (A03P, from ANmo): measured again with hits traced (test_monsoon_strikes_every_cast,
    wc3-slop-lan measure.py, 2026-10-09), the old notes were wrong: it strikes for its 12 s (6
    strikes in 9 s with a caster living 25 s) and a later Monsoon strikes the same unit again (7).
    What holds: two Monsoons at once do not stack (6 strikes and 0), so two High Priests on the
    same creeps deal one Monsoon, and one Priest's casts overlap 2 s (cooldown 10, duration 12).
    That is the game's Monsoon; stacking would mean striking from a trigger, and more damage for
    several Priests. Decided (2026-10-09): left as the game has it - one Priest loses only the 2 s
    overlap, and stacking would mean re-tuning every multi-Priest build. The test logs the
    overlap; revisit only if players ask for several Priests to stack.
  - [x] Corrupted Night Elves' Roots (n02H): its aura A08E never put its buff on a creep. Not a
    bug: Thorns needs the Den's research R000 ("Research Thorns"; Roots' tooltip says "requires
    research!"), which the test never did. race-data.js now gives each aura its requirements and
    the race test researches them first; the race test passes (2026-10-09).
  - [x] Berserker (o00E, A03K) and Flesh Golem (o00G, A03R): their berserk (from Absk) kept Absk's
    requirement (the Berserker Upgrade research), so it never cast. Fixed: areq cleared on both
    in war3map.w3a.
- [ ] Off-by-one audit (2026-09-26), checked in the code:
  - [x] CreepAbilityHandler.ts dropped the last creep ability (MorningPerson) and handed out one
    ability too few (none at 200%, one at 300%). Fixed; test_creep_abilities_by_difficulty
    (wc3-slop-lan tests.py) sees 0/1/2/3 at 100-400% and all 10 on a boss wave. (2026-09-28)
  - [x] UnchargedRune.ts:17 looped to `ELEMENTALIST_ABILITIES.length - 1`, so the 6th element
    (A0C3, Life Rune) was never rolled - nor its five combinations. Seen in a game: 0 Life in
    20 runes. Fixed; test_elementalist_runes (wc3-slop-lan) now gets Life on 8 of 20. (2026-09-28)
  - [x] MultiBoard.ts wrote the first player to row 7, over the "Player / Kills" header, and the
    board was a row short. Rows now come from MultiBoard.playerRow (players from row 8), in
    Defender and Commands too, and the header has its width and style. Seen in a game. (2026-09-29)
  - [x] Defender.GiveKillCount after a leave wrote to row 6 (the creep-type cell): guarded.
  - [x] Votekick needed `players.size / 2 + 1` votes, a fraction (2.5 of 2 possible voters with 3
    players): now a majority, `Math.floor(size / 2) + 1`. Also: a new votekick kept the last one's
    votes (its voters could not vote again), and a votekick's 5-minute expiry could end a later
    one. Seen in a game with a third player (the harness host seated at teal, which the map now
    takes as a defender when seated in a lane): 2 votes of 3 kicked blue. (2026-09-29)
  - [x] Wyvern spared waves 34-35 (`currentWave + 1`) instead of the bosses: now the boss waves
    (35-37, by creep type). Its lightning also skipped Navy's creeps (`owner > NAVY`), and made a
    boolexpr on every attack. Fixed; test_wyvern_lightning (wc3-slop-lan races.py): all four
    creep players struck on wave 1, none on wave 35. (2026-09-29)
  - [x] LootBoxerHandler.ts looked the tier up after ReplaceUnit, got -1 and always gave the
    tier-1 item. Fixed (see Loot Boxer loot below).
  - DamageEngine.ts:285/297 purge loops are inverted (dormant: nothing deals damage from a damage
    handler today).
  - Open: creep ability level is `currentWave + 1` (CreepAbility.ts:54 and others), while
    Creep.MorningPerson uses `currentWave` - one of the two is off by one.
- [x] VenomTower (h045) ordered itself to 'stop' after each attack (an old try at attacking at
  random). Now it attacks a random enemy in range, a new one each attack
  (Specs/RandomTargeting.ts); the race test gives it 8 targets and checks the spread. Human race
  test passes: 77 attacks over all 8 targets, at most 16 on one. (2026-09-27)
  - [x] It rolled every second attack, not every attack: each rolled creep took two in a row. Now
    every attack rolls the next (Venom is the only RandomTargeting tower, and the order does not
    stop its swing). The race test's spread check also counts attacks that follow onto the same
    target (at most 35%; ~1 in 8 at random, 50% before); the Human race test passes (2026-10-09).
  - [x] A creep that walks out of range while the tower is ordered onto it: not a bug. The game
    drops the order and the tower attacks another at once (test_venom_target_leaves_range,
    wc3-slop-lan measure.py: the creep of its latest order moved away, three times). Its first
    runs seemed to show the tower idle; that was the test reading the trace before it was written.
- [x] Cold Tower (h04B, Human, 300 gold) always attacks the creep in range furthest along the path
  (FrontmostTargeting.ts): the fewest checkpoints left (the lanes' paths join into one, so the
  count compares any two creeps), and of those the one that reached its last checkpoint first
  (a maze winds, so distance would not tell). The order goes at the start of a swing and costs
  that swing's windup, ~0.1-0.2 s, only when the front changes hands. test_cold_tower_targets_the_frontmost
  (wc3-slop-lan measure.py): a wave on red's straight leg, every pick the westmost creep, each
  followed by an attack on it (2026-10-09). Its tooltip said range 650 and splash 150; the data
  has 900 and 200, now in the tooltip (its "air only" splash note is unchecked).
- [x] Cold Tower's slow (asked 2026-10-09: the stronger of the two frost attacks, without many of
  them stopping creeps). The two: A08X (the Frost Tower's, a dummy's Slow A02U, buff B017) slows
  ground units only; A0EU (Workers Union's frost attack, from Afr2) air only, its targets being
  "air,enemies". The Cold Tower got A0EU copied as AC01 with ground added (scripts/copy-abilities.js,
  at build time; A0EU stays as it is). test_cold_tower_frost: a footman 275 -> 200, a gryphon
  320 -> 237 past one Cold Tower, and the same past six (one buff, refreshed: no stacking, no
  stop). Whether it reaches the splash is not settled (two side-by-side footmen: frosted once, not
  once). The frost broke the first frontmost ranking (who reached their checkpoint first): it
  slows the leader and the creep behind walks past. Now the ground left to the next checkpoint
  decides, from a distance field over the lane's antiblock maze (PathField.ts, cached per
  checkpoint until a cell changes; unit-tested in tests/lua/pathfield.test.ts).
- [ ] Workers Union's Undead Acolyte (h03I) attacks ground only, but its frost attack A0EU targets
  "air,enemies": it can never slow anything. Not yet seen in a game with a wave.
- [x] IceTrollPriest leaked: a boolexpr (Condition) every tick, and a `targets` list that was
  never emptied, so it grew with every creep ever seen, dead ones included. Now one group for all,
  no filter, and this tick's live creeps only. test_ice_troll_priest_frost_nova (wc3-slop-lan
  races.py) keeps it casting on live creeps; the leak itself is not visible to a test. (2026-09-29)
- [x] -repick didn't forget the pick: the same race was refused ("You already have ..."), and
  Hybrid Random after a chosen race. Defender.forgetRacePicks clears the races, the chosen flag,
  the builders and the Loot Boxer / Void builder. Hybrid Random now asks only that the player has
  no race, so a repick opens it whatever was picked before; there is still no repick from it.
  repickCounter stays: it shrinks the normal random's gold and bars Hardcore after a normal
  random. test_repick_starts_over (wc3-slop-lan tests.py) passes. (2026-09-29)
- [x] Loot Boxer loot, found while writing its test (all fixed; the items tried in game too):
  - [x] Boxes of tier 4-9 gave tier-1 loot, in practice always I02F: UpgradeToTower read the
    tier from the unit after replacing the box with its tower (indexOf gave -1, and tier -1
    gives I02F for every roll). The tier is now read from the box.
  - [x] I02F's charges went to GetLastCreatedItem(), which UnitAddItemById does not set: the
    charges were never on the item given. Now set on it.
  - [x] Each roll is logged (Log.Info, in the log file after -log): player, tier, roll 1-100,
    item and charges; a tester asked to see that it really rolls up to 100.
  - [x] Race test test_loot_boxer (wc3-slop-lan races.py): 38 boxes, tiers 1-9, checks tier,
    roll range, the exact item for each roll, charges and the tower left in each box's place.
    Passes (rolls 1-100 seen across runs). Tier 4-9 boxes open only with mana (1-6, regen
    0.01/s, or the Stick/Coin/MaulKoinz items); the test sets it.
  - [x] Tiers 6-9 always gave Rocks (I02F), and tier 5 more than tier 4: the thresholds
    `100 - 20 + 10 * (tier - 4 + 1)` and `100 - 10 + 5 * (...)` grew with the tier (100-130 for
    tiers 6-9, past any roll). Now `-`: Rocks 80/70/60% for tiers 4-6, and tiers 7-9 give no
    Rocks at all, only their Stick/Coin/Lootbag/MaulKoinz tables. The test checks every roll
    against the exact table. (2026-09-28)
  - [x] Tried in a game with `.lua UnitUseItem` (test_loot_boxer_items, wc3-slop-lan measure.py,
    2026-10-09): Wooden Sticks, Gold Coin and Platinum Token give an opened-tier box 1, 2 and 6
    mana, nothing when the builder uses them. Rocks were broken: the game takes the used charge
    before the map sees it, so a stack of 9 read 8 and only got its charge back - no Lootbag ever
    came from 9. Now 9 make a Lootbag, a bigger stack keeps the rest, a smaller one stays.
- [x] Loot Boxer (I02D) showed in the Advanced tab (its tooltip says Advanced) and could be picked
  there. Now random-only (Race.randomOnly): rolled by the random picks, shown only in the Dev tab.
  (2026-09-27)

## Backlog
- [x] Audit follow-ups from the Buildtools comparison: Wyvern radius 128 vs 500 (TODOs in code), Iron Golem spike angles, `-killall` uses RemoveUnit instead of KillUnit.
- [x] `war3map.imp` regeneration defect in the build (imports listed twice / stale entries). The build now generates it from the archive contents.
- [x] Lobby stamp carrier: the lobby timestamp rides in the `ANcl` (Channel) tooltip on the local client. Verified no unit type in the map carries the base `ANcl` (28 custom abilities derive from it, each with its own tooltip), so nothing can show it. A dedicated ability is not possible from the build (abilities are not part of the compile-time object data), so this stays as is; revisit only if a unit ever gets plain Channel.
- [ ] Two clients on one user account share `CustomMapData/wm-lobby.txt`, so the lobby host source ties on a single machine (race and disk still work). Only matters for local testing; the lobby pass has no natives, so the file cannot be keyed by player. Accepted limitation.
