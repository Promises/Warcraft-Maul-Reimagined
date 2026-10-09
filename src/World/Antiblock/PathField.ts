// A step to a side cell, and a diagonal one, in game units on the 64 grid
const STRAIGHT = 64;
const DIAGONAL = 90.51;
const STEPS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/**
 * The distance along the ground from every cell of a grid to one target cell: Dijkstra over the
 * open cells, in eight directions, never cutting the corner of a closed cell (a creep cannot slip
 * diagonally between two towers). Indexed x + y * width; -1 where the target cannot be reached.
 * Pure: no game state, so the unit tests can run it.
 */
export function distanceField(width: number, height: number, open: (this: void, x: number, y: number) => boolean,
                              targetX: number, targetY: number): number[] {
    const distance: number[] = [];
    for (let i = 0; i < width * height; i++) {
        distance.push(-1);
    }
    if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height || !open(targetX, targetY)) {
        return distance;
    }
    // A binary heap of [distance, cell]
    const heap: [number, number][] = [];
    const push = (d: number, cell: number) => {
        heap.push([d, cell]);
        let i = heap.length - 1;
        while (i > 0) {
            const parent = math.floor((i - 1) / 2);
            if (heap[parent][0] <= heap[i][0]) {
                break;
            }
            const swap = heap[parent];
            heap[parent] = heap[i];
            heap[i] = swap;
            i = parent;
        }
    };
    const pop = (): [number, number] => {
        const top = heap[0];
        const last = heap.pop()!;
        if (heap.length > 0) {
            heap[0] = last;
            let i = 0;
            while (true) {
                const left = 2 * i + 1;
                const right = left + 1;
                let smallest = i;
                if (left < heap.length && heap[left][0] < heap[smallest][0]) {
                    smallest = left;
                }
                if (right < heap.length && heap[right][0] < heap[smallest][0]) {
                    smallest = right;
                }
                if (smallest === i) {
                    break;
                }
                const swap = heap[smallest];
                heap[smallest] = heap[i];
                heap[i] = swap;
                i = smallest;
            }
        }
        return top;
    };

    distance[targetX + targetY * width] = 0;
    push(0, targetX + targetY * width);
    while (heap.length > 0) {
        const [d, cell] = pop();
        if (d > distance[cell]) {
            continue;
        }
        const x = cell % width;
        const y = math.floor(cell / width);
        for (const [dx, dy] of STEPS) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height || !open(nx, ny)) {
                continue;
            }
            if (dx !== 0 && dy !== 0 && (!open(x + dx, y) || !open(x, y + dy))) {
                continue;
            }
            const next = d + (dx !== 0 && dy !== 0 ? DIAGONAL : STRAIGHT);
            const index = nx + ny * width;
            if (distance[index] < 0 || next < distance[index]) {
                distance[index] = next;
                push(next, index);
            }
        }
    }
    return distance;
}
