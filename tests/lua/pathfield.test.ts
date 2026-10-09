import {distanceField} from '../../src/World/Antiblock/PathField';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

/** A grid from rows of text, top row first: '#' closed, anything else open. */
function grid(rows: string[]): {width: number, height: number, open: (this: void, x: number, y: number) => boolean} {
    const height = rows.length;
    const width = rows[0].length;
    return {width, height, open: (x, y) => string.sub(rows[height - 1 - y], x + 1, x + 1) !== '#'};
}

export function pathFieldTests(check: Check): void {
    // Open ground: straight steps of 64, diagonals of about 90.5
    const open = grid(['.....', '.....', '.....']);
    const d = distanceField(open.width, open.height, open.open, 0, 0);
    check('the target is 0', d[0] === 0);
    check('four cells along is 256', d[4] === 256, `${d[4]}`);
    check('two up and two along is two diagonals', math.abs(d[2 + 2 * 5] - 181.02) < 0.01, `${d[2 + 2 * 5]}`);

    // A wall with its gap at the top: the far side is reached round it, not through it
    const walled = grid(['..#..', '..#..', '.....']);
    const w = distanceField(walled.width, walled.height, walled.open, 0, 2);
    // From (0, 2) to (4, 2): down two, along four, up two - the gap is the bottom row
    check('round the wall', w[4 + 2 * 5] > 4 * 64, `${w[4 + 2 * 5]}`);
    check('a closed cell is unreachable', w[2 + 2 * 5] === -1);

    // No corner cutting: two closed cells meeting at a corner block the diagonal between them
    const corner = grid(['.#', '#.']);
    const c = distanceField(corner.width, corner.height, corner.open, 0, 1);
    check('no slipping between two corners', c[1] === -1, `${c[1]}`);

    // A closed target reaches nothing
    const closed = distanceField(walled.width, walled.height, walled.open, 2, 2);
    check('a closed target reaches nothing', closed.every(v => v === -1));
}
