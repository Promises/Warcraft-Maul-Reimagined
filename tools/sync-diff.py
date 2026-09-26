#!/usr/bin/env python3
"""Finds where two clients stopped running the same game.

Both clients write the lockstep trace (wc3-slop-lan's map library, which the harness and
play-two.sh put into the staged map) under CustomMapData, each under its own player's name
(slop-trace-p<slot>-NNNN.txt). While the two games agree the traces match line for line, so
the first line that differs is the divergence and everything after it is fallout. Handle ids
are left out of the comparison: local-only code (UI, effects one player sees) makes and frees
handles on one client only.

    python3 tools/sync-diff.py [--keep <dir>] [data folder ...]

Looks in the main account's data folder and the alt client's (play-two.sh) unless given
others. Run it after a game; the traces stay on disk until the next one.
"""
import re
import shutil
import sys
from pathlib import Path

ROOTS = [
    Path.home() / 'Library/Application Support/Blizzard/Warcraft III',
    Path.home() / 'BattleNet-alt/Library/Application Support/Blizzard/Warcraft III',
]
PRELOAD = re.compile(r'^\s*call Preload\( "(.*)" \)\s*$')
CHUNK = re.compile(r'slop-trace-p(\d+)-\d+\.txt$')
CONTEXT = 12


def without_handles(line):
    return re.sub(r'handles=\d+ ?', '', re.sub(r'^(\d+ t\d+) h\d+', r'\1', line))


def traces(roots):
    """Every player's trace found under the roots: {slot: (chunks, lines)}."""
    found = {}
    for root in roots:
        for chunk in sorted((root / 'CustomMapData').glob('slop-trace-p*-*.txt')):
            slot = int(CHUNK.search(chunk.name).group(1))
            found.setdefault(slot, []).append(chunk)
    result = {}
    for slot, chunks in sorted(found.items()):
        lines = []
        for chunk in sorted(chunks, key=lambda c: c.name):
            for line in chunk.read_text(errors='replace').splitlines():
                match = PRELOAD.match(line)
                if match:
                    lines.append(match.group(1))
        result[slot] = (chunks, lines)
    return result


def main():
    args = sys.argv[1:]
    keep = None
    if args[:1] == ['--keep']:
        keep, args = Path(args[1]), args[2:]
    roots = [Path(a) for a in args] or [root for root in ROOTS if root.exists()]
    sides = traces(roots)
    if len(sides) < 2:
        sys.exit('Found traces for %d player(s) under %s - play a game with the library in first'
                 % (len(sides), ', '.join(map(str, roots))))
    for slot, (chunks, lines) in sides.items():
        print('p%-3d %d lines in %d chunks' % (slot, len(lines), len(chunks)))
    if keep:
        keep.mkdir(parents=True, exist_ok=True)
        for chunks, _ in sides.values():
            for chunk in chunks:
                shutil.copy(chunk, keep / chunk.name)
        print('copied into %s' % keep)

    (a_slot, (_, a)), (b_slot, (_, b)) = list(sides.items())[:2]
    for index in range(min(len(a), len(b))):
        if without_handles(a[index]) == without_handles(b[index]):
            continue
        print('\nThe two games parted at line %d:\n' % (index + 1))
        for back in a[max(0, index - CONTEXT):index]:
            print('    %s' % back)
        print('\n  p%d: %s\n  p%d: %s\n' % (a_slot, a[index], b_slot, b[index]))
        for slot, lines in ((a_slot, a), (b_slot, b)):
            print('  p%d carried on:' % slot)
            for ahead in lines[index + 1:index + 1 + CONTEXT]:
                print('      %s' % ahead)
        return
    print('\nNo difference in the %d lines they share (handle ids aside).' % min(len(a), len(b)))
    if len(a) != len(b):
        print('One of them simply wrote more (%d against %d): it lived longer.' % (len(a), len(b)))


main()
