import {Image} from "w3ts";
import {createImage} from "../../lib/translators";

export interface MazePoint {
    x: number;
    y: number;
}

/**
 * A suggested maze drawn as placement splats. Every splat centre is a grid corner where a
 * 2x2 tower would stand, so `points` doubles as a build plan (see -fillmaze).
 */
export abstract class AbstractHologramMaze {
    protected images: Image[] = [];
    private readonly _points: MazePoint[] = [];

    protected constructor(private readonly imagePath: string) {
    }

    get points(): MazePoint[] {
        return this._points;
    }

    protected place(x: number, y: number): Image {
        this._points.push({x, y});
        return createImage(this.imagePath, 192, x, y, 0.00);
    }

    public Destroy(): void {
        let img: Image | undefined = this.images.pop();
        while (img !== undefined) {
            img.destroy();
            img = this.images.pop();
        }
    }
}
