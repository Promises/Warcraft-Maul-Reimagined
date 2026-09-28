# Maze designer: spec

What a browser tool needs to know to design Warcraft Maul mazes (tower builds in one lane), and
the file it hands over, from which the wave 34 performance test builds real games. Everything
here is read from the map (file:line where it matters); numbers checked against the map's own
data on 2026-09-28.

## 1. The lane

All 13 lanes are the same lane, turned: 1536 x 2432 world units, with the same checkpoints, the
same unbuildable cells and the same route through them (`PLAYER_AREAS`,
src/World/WarcraftMaulSettings.ts:32-46; checked against the terrain's pathing map,
maps/map.w3x/war3map.wpm). So the tool designs in **one canonical lane**, and the test turns the
design into whichever lanes it builds in.

### Grid

- Cells of **64 x 64** world units: **24 columns x 38 rows**. `col` 0..23 left to right, `row`
  0..37 bottom to top, cell (0,0) at the bottom left. This is Blue's lane as it lies in the
  world: cell (col,row) spans x = -768 + 64*col .. +64, y = 2304 + 64*row .. +64.
- Creeps come in at the **top** (row 37) and leave at the **bottom** (row 0).
- The map's own maze grid is exactly this (src/World/WorldMap.ts:262-280, src/World/Antiblock/Maze.ts).

### Terrain

Every cell is walkable. Every cell is buildable except these 20 (walkable, but nothing can be built
on them):

| What | Cells (col,row) |
|---|---|
| Entry strip | row 37, cols 7-16 |
| Checkpoint 1 tile | cols 11-12, rows 27-28 |
| Checkpoint 2 tile | cols 11-12, rows 9-10 |
| Exit | row 0, cols 11-12 |

```
      012345678901234567890123          v  entry strip (unbuildable)
  37  .......vvvvvvvvvv.......          1  checkpoint 1 tile (unbuildable)
  36  ........................          2  checkpoint 2 tile (unbuildable)
  ..                                    x  exit (unbuildable)
  28  ...........11...........          .  buildable
  27  ...........11...........
  ..
  10  ...........22...........
   9  ...........22...........
  ..
   0  ...........xx...........
```

Outside the lane is wall, apart from the way in above row 37 (cols 6-17) and the way out below
row 0 (cols 10-13).

### The route

Creeps spawn above the top edge, two per row of the wave, 0.5 s apart: one above col 9.5 and one
above col 14.5 (world x -160 and +160). Each walks to the centre of **checkpoint 1**, then the
centre of **checkpoint 2**, then out through the **exit** (src/World/Entity/CheckPoint.ts,
src/World/Entity/PlayerSpawns.ts:95-129). They are not on rails: they path around towers with
the game's pathfinding, so a maze is a set of walls they walk around between those points.

| Point | Cell (col,row) | Grid corner at its centre |
|---|---|---|
| Spawn (as the map checks it) | (9,37) | - |
| Checkpoint 1 | (11-12, 27-28) | (12,28) |
| Checkpoint 2 | (11-12, 9-10) | (12,10) |
| Exit | (11-12, 0) | (12,0) |

After this lane the creeps go on through other players' lanes (Red → Brown → Orange → Green →
Gray, and so on; every route ends in Gray, then the ship). A lane only spawns creeps when its
player has picked a race.

## 2. Towers

### Footprint and placement

- **Every tower is 2 x 2 cells** (128 x 128): all 318 towers the builders can make use
  `PathTextures\4x4SimpleSolid.tga`, with collision 72. There are no other sizes.
- A tower stands **centred on a grid corner**. Name it by that corner `(cx, cy)`, with
  cx 0..24 and cy 0..38. It covers cells `cx-1..cx` x `cy-1..cy`
  (`Maze.setFootprint`, src/World/Antiblock/Maze.ts:117-127). So `cx` is 1..23 and `cy` 1..37.
- World position of Blue's corner: x = -768 + 64*cx, y = 2304 + 64*cy (the map snaps to this
  64 grid: `TowerConstruction.snap`, src/World/Entity/Tower/TowerConstruction.ts:222-225).

### Rules a design must keep (the tool should enforce all of them)

1. All 4 cells of every tower are inside the lane and **buildable** (not the 20 cells above).
2. Towers **do not overlap**.
3. **The way stays open**: with the towers' cells blocked, there is a path from the spawn cell
   (9,37) to (12,28), from there to (12,10), and from there to (12,0), stepping only
   **up/down/left/right** between free cells. Diagonal steps don't count: two towers that only
   touch at a corner close the gap between them. This is the map's anti-block check, run on
   every tower as it is started; a tower that would close the way is refused and refunded
   (src/World/Antiblock/AntiBlock.ts:90-142). Checking the finished design is enough: if the
   whole design leaves the way open, so does every part of it, built in any order.
4. The **gold** of all towers, upgrades included, is within the budget (section 3).
5. Only the towers of the design's **race(s)** (see "Races" below).
6. **Food** (High Elf Farm only): what the animals eat must not be more than the farms make.

### Maze length: the number to show

The map itself measures a maze as the sum of the three shortest 4-neighbour paths above, in cells
(`totalMazeLength`, AntiBlock.ts:135). The tool should show it, and draw the paths.

- An empty lane measures **40** (12 + 18 + 10).
- The map's own advanced example measures **312** (124 + 88 + 100).

Real creeps path more smoothly than this (they can move diagonally, on a finer grid), so it
measures the maze rather than predicting a creep's exact time in it.

### Costs, upgrades, selling

- A tower's `gold` is what **that step** costs: building the base form costs its `gold`, and each
  upgrade costs the next form's `gold`. A tower that went Headhunter (50) → Berserker (50)
  cost 100. The race tests check exactly this for every step (wc3-slop-lan
  maps/warcraft-maul/races.py:199-202).
- Selling gives back 75% (100% of what was paid in the same build phase), but a design shouldn't
  count on selling.

### Races

A player picks a race for 1 lumber. They start with 1 lumber and get 1 more after wave 14
(src/World/Game/ClassicMaul/ClassicGameRound.ts:188-190), so **by wave 34 a player can have two
races**. The tool should allow one or two.

- **Tower data:** `node scripts/race-data.js` in this repo prints every race with its towers as
  JSON (section 5). Leave these out:
  - races with `enabled: false`: Aviaries, Heros Altar, Dark Troll Hut;
  - Loot Boxer: its boxes turn into random towers;
  - Shrine of Buffs: it's a secondary race.
- **Base towers:** a race's base towers are the ones its builder builds. Those are the towers that
  are not in any other tower's `upgradesTo`. Each `upgradesTo` names the forms a tower can be
  upgraded to (usually one; sometimes a choice).
- **High Elf Farm** is the only race that uses food: `foodMade` on the farms (2, or 3 upgraded; an
  upgraded farm makes 3 in all, not 2 + 3), and `food` on the animals (1-32). Its animals may
  only stand in their owner's own lane (the homesick ability A0CR), which is where a design is
  anyway.

## 3. The budget at wave 34

The code has no interest and no per-wave income beyond the below. By the time wave 34 spawns
(Classic mode), a player (not gray) has had:

| Source | Gold | Where |
|---|---|---|
| Start | 100 | src/World/Entity/Players/Defender.ts:541-543 |
| End of waves 1-33: wave n pays 15 + 2n | 1,617 | ClassicGameRound.ts:17, 65-78 |
| Kill bounty, waves 1-33, if they kill every creep of one lane | ~4,020 | object data (e.g. wave 33: 20 x 12) |
| **Total** | **~5,737** | |

- A random race pick adds 30-50.
- Bounty goes to whoever kills the creep, and creeps cross several lanes, so a real player's bounty
  varies. The 4,020 is one lane's full worth.
- **Suggested default: 5,700**, adjustable in the tool.

For context, wave 34 is 20 **Zerglings** per open lane (10 rows of 2, 0.5 s apart). Each has
82,500 hp and 9 armour (unarmoured), with speed 330, at difficulty 100%. Difficulty scales hp and
armour: 200% doubles them. At 300% and up they also get random creep abilities
(src/World/Entity/Creep.ts:69-77; src/World/Entity/CreepAbilities/CreepAbilityHandler.ts).

## 4. What the tool hands over: a build file

One JSON file per design:

```json
{
  "format": "maul-build/1",
  "name": "Advanced maze, Orc Stronghold",
  "races": ["Orc Stronghold"],
  "budget": 5700,
  "towers": [
    {"at": [12, 26], "chain": ["oC19", "o00E"]},
    {"at": [14, 28], "chain": ["oC58"]}
  ],
  "notes": "free text"
}
```

| Field | Meaning |
|---|---|
| `format` | always `maul-build/1` (so a later format can be told apart) |
| `races` | 1 or 2 race names, exactly as `race-data.js` names them |
| `budget` | the gold limit it was designed against |
| `towers[].at` | the tower's grid corner `[cx, cy]` in the canonical lane (section 2) |
| `towers[].chain` | tower ids from the base form to the form it ends as. `chain[0]` is a base tower of one of the races; each next id is in the previous one's `upgradesTo`. Its cost is the sum of their `gold`. |
| `notes` | anything |

The order of `towers` is the order the test builds them in. It doesn't affect validity (rule 3).
The file holds only what can't be worked out from the map, so it keeps working when the map
changes; the test checks it again against the map's current data.

The test takes it from there: it turns the lane into whichever lanes it builds in (turned and
mirrored as the map does, src/World/Game/LaneTransfer.ts:220-260), builds each chain there, and
runs wave 34.

## 5. What the tool reads

- **The lane:** fixed, as in section 1. The tool can simply carry it:

  ```json
  {
    "cols": 24, "rows": 38,
    "unbuildable": [[7,37],[8,37],[9,37],[10,37],[11,37],[12,37],[13,37],[14,37],[15,37],[16,37],
                    [11,27],[12,27],[11,28],[12,28],[11,9],[12,9],[11,10],[12,10],[11,0],[12,0]],
    "route": [[9,37],[12,28],[12,10],[12,0]]
  }
  ```

  Here `route` lists cells: the spawn, then the checkpoint and exit cells the path check aims at.

- **The towers:** the output of `node scripts/race-data.js` (all races), a JSON list of:

  ```json
  {"builder": "nC03", "name": "Orc Stronghold", "item": "I007", "tier": "Beginner", "enabled": true,
   "towers": [
     {"id": "oC19", "name": "[Orc Stronghold] - Headhunter", "gold": 50, "lumber": 0,
      "food": 0, "foodMade": 0, "requires": [],
      "attacks": {"type": "pierce", "weapon": "msplash", "damageMin": 50, "damageMax": 100,
                  "range": 800, "cooldown": 0.8, "targets": ["air", "enemies", "ground"], "splash": 0},
      "abilities": ["A02D", "Avul"], "abilityBases": ["ANcl", "Avul"], "auras": [],
      "upgradesTo": ["o00E"], "tooltip": "..."}
   ]}
  ```

  - `attacks` is null for towers that don't attack (farms, walls).
  - `tier` is the race's tier: Beginner, Intermediate, Advanced, Other or Secondary.
  - `range` is useful for drawing range circles.

## 6. Presets: the map's own example mazes

The map draws these for players (the Example Maze button and `-maze 1|2|3`;
src/World/Holograms/). Here they are as corners in the canonical lane, all checked against
rules 1-3:

- **Circle** (20 towers, maze length 124):
  `[10,28] [12,26] [14,28] [13,30] [11,31] [9,31] [7,29] [7,27] [9,25] [11,23] [13,23] [15,25]
  [17,27] [17,29] [16,31] [14,33] [12,34] [10,34] [8,34] [6,32]`
- **Simple** (30 towers, maze length 174. The map's list has one tower twice, [9,27]; it's listed
  once here):
  `[12,26] [12,24] [12,22] [12,20] [12,18] [12,16] [12,14] [14,28] [12,30] [10,29] [9,27] [12,12]
  [10,10] [12,8] [14,9] [9,25] [9,23] [9,21] [9,19] [9,17] [9,15] [9,13] [15,11] [15,13] [15,15]
  [15,17] [15,19] [15,21] [15,23] [15,25]`
- **Advanced** (38 towers, maze length 312):
  `[12,26] [14,28] [12,30] [10,24] [8,22] [6,20] [4,18] [2,16] [2,14] [4,12] [6,10] [8,8] [10,6]
  [12,4] [14,2] [16,1] [10,29] [9,27] [7,25] [5,23] [3,21] [2,24] [4,26] [6,28] [1,26] [7,30]
  [9,32] [11,33] [13,33] [15,31] [17,29] [17,27] [15,25] [13,23] [11,21] [9,19] [7,17] [5,15]`

## 7. Suggested tool features

- A 24 x 38 grid in the orientation above (creeps top to bottom), with the unbuildable cells and
  the checkpoints shown.
- Pick 1-2 races. Show their base towers; click a corner to place one, and upgrade it through its
  chain.
- Show, as you go:
  - rule problems (the tower is refused there, with the reason);
  - the three shortest paths, and the maze length;
  - gold spent against the budget;
  - food, for High Elf Farm;
  - optionally, range circles.
- Load the presets. Import and export the build file (section 4).
