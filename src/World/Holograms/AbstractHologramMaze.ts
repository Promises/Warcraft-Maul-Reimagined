import {Image} from "w3ts";

export abstract class AbstractHologramMaze {
    protected images: Image[] = [];

    public Destroy(): void {
        let img: Image | undefined = this.images.pop();
        while (img !== undefined) {
            img.destroy();
            img = this.images.pop();
        }
    }
}
