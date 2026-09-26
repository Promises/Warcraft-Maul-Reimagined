#!/usr/bin/env python3
"""Says which part of the game state the two local instances disagreed about.

Every client writes Logs/<machine>_<stamp>_Desync.log when the game falls out of sync: the
checksums it had for the last few turns, grouped by subsystem. On its own one file says
nothing - the point is the comparison, so this reads the newest one from each data root
(the main account's and the alt client's) and prints only what differs.

    python3 tools/desync-report.py [dir-to-keep-a-copy-in]

Subsystems seen so far: gwar (the game's handles - units, effects, timers), rand (the random
generator), ipse (per player counters), cust (the map's own data), cnet, misc, absl, chea,
slkd, upsl.
"""
import re
import shutil
import struct
import sys
from pathlib import Path

ROOTS = [
    Path.home() / 'Library/Application Support/Blizzard/Warcraft III',
    Path.home() / 'BattleNet-alt/Library/Application Support/Blizzard/Warcraft III',
]
HEADER = re.compile(r'\[Desync - (\d+) - Turn\((\d+)\) = (\d+)\]')


def newest_desync(root):
    logs = sorted(root.glob('Logs/*_Desync.log'), key=lambda path: path.stat().st_mtime)
    return logs[-1] if logs else None


def read(path):
    """{(subsystem, turn): [total, [line, ...]]} for one client."""
    sums, key = {}, None
    for line in path.read_text(errors='replace').splitlines():
        found = HEADER.match(line.strip())
        if found:
            key = (int(found.group(1)), int(found.group(2)))
            sums[key] = [int(found.group(3)), []]
        elif line.strip().startswith('#') and key:
            sums[key][1].append(line.strip())
    return sums


def name(tag):
    try:
        return struct.pack('>I', tag).decode('ascii')
    except (struct.error, UnicodeDecodeError):
        return str(tag)


def main():
    files = [(root, newest_desync(root)) for root in ROOTS]
    for root, path in files:
        if path is None:
            sys.exit('No desync log under %s - nothing to compare' % root)
        print('%s  (%s)' % (path.name, root.name if root == ROOTS[0] else 'alt client'))

    keep = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if keep:
        keep.mkdir(parents=True, exist_ok=True)
        for side, (root, path) in zip(('host', 'alt'), files):
            shutil.copy(path, keep / ('%s-desync.log' % side))
            replay = path.with_name(path.name.replace('_Desync.log', '_replay.w3g'))
            if replay.exists():
                shutil.copy(replay, keep / ('%s-replay.w3g' % side))
        print('copied into %s' % keep)

    left, right = read(files[0][1]), read(files[1][1])
    turns = sorted({turn for _, turn in left} & {turn for _, turn in right})
    print('\nturns %s' % ', '.join(str(turn) for turn in turns))

    differed = False
    for tag in sorted({tag for tag, _ in left} | {tag for tag, _ in right}):
        for turn in turns:
            mine, theirs = left.get((tag, turn)), right.get((tag, turn))
            if not mine or not theirs or mine[0] == theirs[0]:
                continue
            differed = True
            print('\n%s at turn %d: host %d, alt %d' % (name(tag), turn, mine[0], theirs[0]))
            for a, b in zip(mine[1], theirs[1]):
                if a != b:
                    print('    %-40s %-40s  <- differs' % (a, b))
            extra = abs(len(mine[1]) - len(theirs[1]))
            if extra:
                print('    and %d line(s) only one of them has' % extra)
    if not differed:
        print('\nThe two logs agree, so they are from different games; play them again together.')


main()
