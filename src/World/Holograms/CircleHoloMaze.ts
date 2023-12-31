import { AbstractHologramMaze } from './AbstractHologramMaze';
import { HologramCheckpointDistance } from './HologramCheckpointDistance';
import {createImage} from "../../lib/translators";

export class CircleHoloMaze extends AbstractHologramMaze {
    constructor(imagePath: string,
                firstCheckpointX: number, firstCheckpointY: number,
                secondCheckpointX: number, secondCheckpointY: number) {
        super();
        const dist: HologramCheckpointDistance = new HologramCheckpointDistance(
            secondCheckpointX - firstCheckpointX,
            secondCheckpointY - firstCheckpointY);

        this.images = [createImage(imagePath, 192,
                                 firstCheckpointX + dist.yDividedBy9,
                                 firstCheckpointY + dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + dist.xDividedBy9,
                      firstCheckpointY + dist.yDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.yDividedBy9,
                      firstCheckpointY - dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.xDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.xDividedBy9 - dist.xDividedBy18 + dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 - dist.yDividedBy18 + dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.xDividedBy9 - dist.xDividedBy18 + 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 - dist.yDividedBy18 + 2 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.xDividedBy18 + 3 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy18 + 3 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + dist.xDividedBy18 + 3 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy18 + 3 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + dist.xDividedBy9 + dist.xDividedBy18 + 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy9 + dist.yDividedBy18 + 2 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + 2 * dist.xDividedBy9 + dist.xDividedBy18 + dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + 2 * dist.yDividedBy9 + dist.yDividedBy18 + dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + 2 * dist.xDividedBy9 + dist.xDividedBy18 - dist.yDividedBy18,
                      firstCheckpointY + 2 * dist.yDividedBy9 + dist.yDividedBy18 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + dist.xDividedBy9 + dist.xDividedBy18 - dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy9 + dist.yDividedBy18 - dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX + dist.xDividedBy18 - 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy18 - 2 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - dist.xDividedBy9 + dist.xDividedBy18 - 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 + dist.yDividedBy18 - 2 * dist.xDividedBy9 - dist.xDividedBy18, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 2 * dist.xDividedBy9 + dist.xDividedBy18 - 2 * dist.yDividedBy9,
                      firstCheckpointY - 2 * dist.yDividedBy9 + dist.yDividedBy18 - 2 * dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 3 * dist.xDividedBy9 + dist.xDividedBy18 - dist.yDividedBy9,
                      firstCheckpointY - 3 * dist.yDividedBy9 + dist.yDividedBy18 - dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 3 * dist.xDividedBy9,
                      firstCheckpointY - 3 * dist.yDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 3 * dist.xDividedBy9 + dist.yDividedBy9,
                      firstCheckpointY - 3 * dist.yDividedBy9 + dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 3 * dist.xDividedBy9 + 2 * dist.yDividedBy9,
                      firstCheckpointY - 3 * dist.yDividedBy9 + 2 * dist.xDividedBy9, 0.00),
            createImage(imagePath, 192,
                      firstCheckpointX - 2 * dist.xDividedBy9 + 3 * dist.yDividedBy9,
                      firstCheckpointY - 2 * dist.yDividedBy9 + 3 * dist.xDividedBy9, 0.00)];

        this.images.forEach((img) => {
            img.setRender(true);
            img.show(true);
        });
    }
}
