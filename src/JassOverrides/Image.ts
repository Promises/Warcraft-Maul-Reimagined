
export class Image {
    readonly img: image;
    private _colour: { red: uint8, green: uint8, blue: uint8, alpha: uint8 } = {red: 0, alpha: 255, blue: 0, green: 0};
    private _shown: boolean =false;

    constructor(imagePath: string, size: number, x: number, y: number, z: number) {
        // (file: string, sizeX: number, sizeY: number, sizeZ: number, posX: number, posY: number, posZ: number, originX: number, originY: number, originZ: number, imageType: number)
        this.img = CreateImage(imagePath, size, size, 0, x - (size / 2), y - (size / 2), z, 0, 0, 0, 2)!;
    }

    public Destroy(): void {
        DestroyImage(this.img);
    }

    public SetImageRenderAlways(flag: boolean): void {
        SetImageRenderAlways(this.img, flag);
    }
    public get visible(): boolean {
        return this._shown;
    }
    public set visible(visible: boolean) {
        ShowImage(this.img, visible);

        this._shown = visible;
    }

    public get colour() {
        return this._colour;
    }


    public set colour(col: {red: uint8, green: uint8, blue: uint8, alpha: uint8}) {
        this._colour = col;
        SetImageColor(this.img, col.red, col.green, col.blue, col.alpha);
    }
}
