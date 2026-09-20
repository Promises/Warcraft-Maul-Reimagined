import { AbstractHologramMaze } from './AbstractHologramMaze';
import { HologramCheckpointDistance } from './HologramCheckpointDistance';

export class AdvancedHoloMaze extends AbstractHologramMaze {
    constructor(imagePath: string,
                firstCheckpointX: number, firstCheckpointY: number, secondCheckpointX: number, secondCheckpointY: number) {
        super(imagePath);
        const dist: HologramCheckpointDistance = new HologramCheckpointDistance(
            secondCheckpointX - firstCheckpointX,
            secondCheckpointY - firstCheckpointY);

        this.images = [this.place( firstCheckpointX + dist.xDividedBy9, firstCheckpointY + dist.yDividedBy9),
            this.place( firstCheckpointX - dist.yDividedBy9, firstCheckpointY - dist.xDividedBy9),
            this.place( firstCheckpointX - dist.xDividedBy9, firstCheckpointY - dist.yDividedBy9),
            this.place(
                      firstCheckpointX + 2 * dist.xDividedBy9 + dist.yDividedBy9,
                      firstCheckpointY + 2 * dist.yDividedBy9 + dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 3 * dist.xDividedBy9 + 2 * dist.yDividedBy9,
                      firstCheckpointY + 3 * dist.yDividedBy9 + 2 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 4 * dist.xDividedBy9 + 3 * dist.yDividedBy9,
                      firstCheckpointY + 4 * dist.yDividedBy9 + 3 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 5 * dist.xDividedBy9 + 4 * dist.yDividedBy9,
                      firstCheckpointY + 5 * dist.yDividedBy9 + 4 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 6 * dist.xDividedBy9 + 5 * dist.yDividedBy9,
                      firstCheckpointY + 6 * dist.yDividedBy9 + 5 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 7 * dist.xDividedBy9 + 5 * dist.yDividedBy9,
                      firstCheckpointY + 7 * dist.yDividedBy9 + 5 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 8 * dist.xDividedBy9 + 4 * dist.yDividedBy9,
                      firstCheckpointY + 8 * dist.yDividedBy9 + 4 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 9 * dist.xDividedBy9 + 3 * dist.yDividedBy9,
                      firstCheckpointY + 9 * dist.yDividedBy9 + 3 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 10 * dist.xDividedBy9 + 2 * dist.yDividedBy9,
                      firstCheckpointY + 10 * dist.yDividedBy9 + 2 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 11 * dist.xDividedBy9 + dist.yDividedBy9,
                      firstCheckpointY + 11 * dist.yDividedBy9 + dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 12 * dist.xDividedBy9,
                      firstCheckpointY + 12 * dist.yDividedBy9),
            this.place(
                      firstCheckpointX + 13 * dist.xDividedBy9 - dist.yDividedBy9,
                      firstCheckpointY + 13 * dist.yDividedBy9 - dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 13 * dist.xDividedBy9 + dist.xDividedBy18 - 2 * dist.yDividedBy9,
                      firstCheckpointY + 13 * dist.yDividedBy9 + dist.yDividedBy18 - 2 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX - dist.xDividedBy18 + dist.yDividedBy9,
                      firstCheckpointY - dist.yDividedBy18 + dist.xDividedBy9),
            this.place(
                      firstCheckpointX + dist.xDividedBy18 + dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy18 + dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + dist.xDividedBy9 + dist.xDividedBy18 + 2 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy9 + dist.yDividedBy18 + 2 * dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 2 * dist.xDividedBy9 + dist.xDividedBy18 + 3 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + 2 * dist.yDividedBy9 + dist.yDividedBy18 + 3 * dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 3 * dist.xDividedBy9 + dist.xDividedBy18 + 4 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + 3 * dist.yDividedBy9 + dist.yDividedBy18 + 4 * dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 2 * dist.xDividedBy9 + 5 * dist.yDividedBy9,
                      firstCheckpointY + 2 * dist.yDividedBy9 + 5 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + dist.xDividedBy9 + 4 * dist.yDividedBy9,
                      firstCheckpointY + dist.yDividedBy9 + 4 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + 3 * dist.yDividedBy9,
                      firstCheckpointY + 3 * dist.xDividedBy9),
            this.place(
                      firstCheckpointX + dist.xDividedBy9 + 5 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy9 + 5 * dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX - dist.xDividedBy9 + 3 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 + 3 * dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX - 2 * dist.xDividedBy9 + 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - 2 * dist.yDividedBy9 + 2 * dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX - 2 * dist.xDividedBy9 - dist.xDividedBy18 + dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - 2 * dist.yDividedBy9 - dist.yDividedBy18 + dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX - 2 * dist.xDividedBy9 - dist.xDividedBy18 - dist.yDividedBy18,
                      firstCheckpointY - 2 * dist.yDividedBy9 - dist.yDividedBy18 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX - dist.xDividedBy9 - dist.xDividedBy18 - dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy9 - dist.yDividedBy18 - dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX - dist.xDividedBy18 - 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY - dist.yDividedBy18 - 2 * dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX + dist.xDividedBy9 - dist.xDividedBy18 - 2 * dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + dist.yDividedBy9 - dist.yDividedBy18 - 2 * dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 2 * dist.xDividedBy9 - dist.xDividedBy18 - dist.yDividedBy9 - dist.yDividedBy18,
                      firstCheckpointY + 2 * dist.yDividedBy9 - dist.yDividedBy18 - dist.xDividedBy9 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 3 * dist.xDividedBy9 - dist.xDividedBy18 - dist.yDividedBy18,
                      firstCheckpointY + 3 * dist.yDividedBy9 - dist.yDividedBy18 - dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 4 * dist.xDividedBy9 - dist.xDividedBy18 + dist.yDividedBy18,
                      firstCheckpointY + 4 * dist.yDividedBy9 - dist.yDividedBy18 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 5 * dist.xDividedBy9 - dist.xDividedBy18 + dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + 5 * dist.yDividedBy9 - dist.yDividedBy18 + dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 6 * dist.xDividedBy9 - dist.xDividedBy18 + 2 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + 6 * dist.yDividedBy9 - dist.yDividedBy18 + 2 * dist.xDividedBy9 + dist.xDividedBy18),
            this.place(
                      firstCheckpointX + 7 * dist.xDividedBy9 - dist.xDividedBy18 + 3 * dist.yDividedBy9 + dist.yDividedBy18,
                      firstCheckpointY + 7 * dist.yDividedBy9 - dist.yDividedBy18 + 3 * dist.xDividedBy9 + dist.xDividedBy18)];

        this.images.forEach((img) => {
            img.setRender(true);
            img.show(true);
        });
    }
}
