# Saves: each player's progress, kept between games

Each player's progress is kept in a small file on their own machine, bit-packed, scrambled and
signed with a key tied to their battletag, and loaded and synced to every client when the map
loads. The Elementalist recipe book is its first user. Code: `src/lib/Save` (the format, pure Lua)
and `src/World/Game/Saves.ts` (reading, syncing, writing).

## Layers

A save is built in six layers, and read back in reverse; a file that fails any step loads as an
empty save.

| Layer | What it does |
|---|---|
| 1. Sections | Each part of the game writes its values into its own section with a bit writer (`Bits.ts`). |
| 2. Payload | The format version, then each section as its id, its length in bits and its bits, padded to whole bytes. |
| 3. Signature | A 32-bit keyed hash (FNV-1a) over the map's secret, the player's battletag and the payload, appended. A file copied from another player fails here. |
| 4. Scramble | Payload and signature are XORed with a keystream (xorshift32) seeded from the secret and the battletag, so the file cannot be read or edited by hand. |
| 5. Text | Bytes become text in a 64-letter alphabet (A–Z, a–z, 0–9, `-` and `_`), safe in preload files and sync messages: no quotes, backslashes or zero bytes. |
| 6. File | `CustomMapData\WarcraftMaul\save-<letters>-<hash>.txt`: the battletag's letters and digits, for a person looking at the folder, and a hash of the whole battletag, which tells apart names whose letters do not (Åse, Øse). The text is split into lines of at most 200 letters, each starting with `WM:` and read back through its own carrier ability's tooltip. |

The secret ships inside the map, which is open source: this stops casual editing and copying, not
someone willing to read the code.

## Sections and values

A part owns one section and only ever adds to the end of it, so any map version can read any save.

| Value | Bits |
|---|---|
| Bits | a fixed width, 1 to 32 |
| Flag | 1 |
| Small number (RuneScape's "smart") | 8 below 128, else 16 (up to 32,767) |
| Bit set | a small number for its length, then one bit each |
| Text | a small number for its length, then 8 bits a letter |

- **Section ids are never reused.** 1 is the Elementalist recipe book (`RecipeRules.ts`, `writeBook`):
  three bit sets, in this order. What is in the book, over the fixed, append-only list of fusion
  results in `RecipeBook.ts` (`RESULTS`); which of those were given (the free Primal) rather than
  found, over the same list; and which Ascended the player has made, over the six
  Primals in `RESULTS` order. The last two came later: a save without them reads them as empty, so
  an old book counts every entry as found.
- **Reading stops at the section's length.** A field an older save lacks takes its default.
- **Unknown sections are kept.** An older map version keeps a newer section's bits as they are and
  writes them back, so playing an old version never loses progress.
- **Only a new format version breaks old saves,** and it comes with code that converts them.

A part implements `SavePart` (`section`, `load(player, reader)`, `save(player, writer)`), registers
with `game.saves.register`, and calls `game.saves.changed(player)` when its data changes.

## Loading and saving

Files are read only by their owner's client and written only by it; everything the game acts on
arrives through sync, so every client holds the same state.

1. **Read.** A second into the game, each client reads its own player's file.
2. **Send.** It sends the file's text to everyone through PlayerSync (`save:<index>/<count>:<letters>`),
   in parts of at most 200 letters. A player with no file sends an empty save (`save:0/0:`), so
   everyone knows that player has finished.
3. **Apply.** Every client decodes and checks each player's save the same way and hands each section
   to its part; a save that fails the checks is logged and counts as empty. A player whose save has
   not arrived after 10 seconds, such as one who left, counts as empty.
4. **Write.** When a part's data changes, the owner's client rewrites the whole file on the next
   second, never before that player's save has loaded (an empty book would replace it).

Until a player's save has arrived, parts treat their data as empty. For the recipe book this is
harmless: the first Primal comes many waves later.

## Limits

A save holds about 1,200 bytes (8 lines of 200 letters); the recipe book needs about 10.

- **Size is load time.** Every byte is synced when the map loads, so parts keep their sections small.
- **Nothing competitive goes in a save.** A file on the player's machine cannot be made tamper-proof.
- **A new name starts empty.** Saves follow the battletag, so a renamed account or a new computer
  starts over.
- **Integers are 32-bit in game.** `math.maxinteger` is 2,147,483,647 there, and a constant of 2^31
  or more becomes a float, which a bitwise operation rejects. The codec builds such constants from
  halves, and its tests run on a 32-bit Lua.
- **Reading has quirks.**
    - A preload file is read in a preload pass of its own (`PreloadStart`, `Preloader`, `PreloadEnd`),
      or it does nothing once the game is on.
    - A file name found missing stays missing for the rest of that game, so each file is read once,
      at the start. The next game reads it again: a save written in a player's first game loads in
      their second.
    - A tooltip cannot be set to `''` (the ability's own text stays), so the carriers are set to `-`
      before the file runs and only lines starting with `WM:` count; their own tooltips are put back
      after.
- **Timer errors are logged.** A Lua error in a timer callback is otherwise lost without a trace, so
  the save timers run their work through `Saves.logged`.

## Tests

- Codec unit tests: `npm run test:lua`, on a Lua 5.3 built with 32-bit integers, as the game's is
  (`scripts/lua32.sh` builds it into `tools/lua32`): every value type and its limits, a round trip,
  an edited file, another player's file, an unknown section kept, the file names.
- `test_recipe_discovery` (wc3-slop-lan `maps/warcraft-maul/measure.py`), three games on two clients:
  no save file, a discovery writes it; the next game loads it on both clients; an edited file loads
  as empty. The debug command `-forget` empties a player's recipe book, so tests start from a known
  book.
