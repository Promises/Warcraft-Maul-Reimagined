import {WarcraftMaul} from '../WarcraftMaul';
import {CheckPoint} from '../Entity/CheckPoint';
import {AbstractHologramMaze} from './AbstractHologramMaze';
import {CircleHoloMaze} from './CircleHoloMaze';
import {SimpleHoloMaze} from './SimpleHoloMaze';
import {AdvancedHoloMaze} from './AdvancedHoloMaze';

const IMAGE_PATH: string = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';

interface SampleMaze {
    name: string;
    create(x1: number, y1: number, x2: number, y2: number): AbstractHologramMaze;
    shows(maze: AbstractHologramMaze): boolean;
}

/** The sample mazes, simplest first: -maze 1, 2 and 3, and the order the sample maze button shows them in. */
export const SAMPLE_MAZES: SampleMaze[] = [
    {
        name: 'a very simple circled maze',
        create: (x1, y1, x2, y2) => new CircleHoloMaze(IMAGE_PATH, x1, y1, x2, y2),
        shows: maze => maze instanceof CircleHoloMaze,
    },
    {
        name: 'a basic maze',
        create: (x1, y1, x2, y2) => new SimpleHoloMaze(IMAGE_PATH, x1, y1, x2, y2),
        shows: maze => maze instanceof SimpleHoloMaze,
    },
    {
        name: 'a more advanced maze',
        create: (x1, y1, x2, y2) => new AdvancedHoloMaze(IMAGE_PATH, x1, y1, x2, y2),
        shows: maze => maze instanceof AdvancedHoloMaze,
    },
];

/** Sample maze `index` (0 the simplest) drawn between a lane's two checkpoints, or undefined if the lane has none. */
export function createSampleMaze(game: WarcraftMaul, lane: number, index: number): AbstractHologramMaze | undefined {
    const firstCheckpoint: CheckPoint | undefined = game.worldMap.playerSpawns[lane].spawnOne?.next;
    const secondCheckpoint: CheckPoint | undefined = firstCheckpoint?.next;
    const sample: SampleMaze | undefined = SAMPLE_MAZES[index];
    if (!firstCheckpoint || !secondCheckpoint || !sample) {
        return undefined;
    }
    return sample.create(
        GetRectCenterX(firstCheckpoint.rectangle), GetRectCenterY(firstCheckpoint.rectangle),
        GetRectCenterX(secondCheckpoint.rectangle), GetRectCenterY(secondCheckpoint.rectangle));
}

/** Which sample maze this is (0 the simplest), or -1 for none or another hologram. */
export function sampleMazeIndex(maze: AbstractHologramMaze | undefined): number {
    if (maze === undefined) {
        return -1;
    }
    return SAMPLE_MAZES.findIndex(sample => sample.shows(maze));
}
