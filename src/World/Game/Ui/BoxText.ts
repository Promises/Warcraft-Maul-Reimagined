import { Frame } from "w3ts";

export class BoxText {
    private frame: Frame | undefined;
    private textFrame: Frame | undefined;

    constructor(description: string) {
        // Get the game UI as parent
        const gameUI = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
        if (!gameUI) {
            print('NO UI')
            return;
        };

        // Create the main frame
        this.frame = Frame.create("BoxedText", gameUI, 0, 0);
        this.textFrame = Frame.createType(
            "textFrame",
            this.frame!,
            0,
            "TEXT",
            ""
        );

        // this.textFrame?.setSize(0.25, 0);
        this.textFrame?.setPoint(FRAMEPOINT_BOTTOM, this.frame!, FRAMEPOINT_TOP, 0, -0.015);
        this.textFrame?.setEnabled(false);
        this.textFrame?.setText(description);

        print('Mainframe ' + BlzFrameGetName(this.frame?.handle!))
        print('TextFrame ' + BlzFrameGetName(this.textFrame?.handle!) + this.textFrame?.text);

        if (!this.frame) {
            print('NO FRAME')
            return;
        };
    }

    public setText(text: string): this {
        this.textFrame?.setText(text);
        return this;
    }

    public setPosition(x: number, y: number): this {
        this.frame?.setAbsPoint(FRAMEPOINT_CENTER, x, y);
        return this;
    }

    public setSize(width: number, height: number): this {
        this.frame?.setSize(width, height);
        return this;
    }

    public show(): this {
        this.frame?.setVisible(true);
        this.frame!.visible = true;
        print(`visible ${this.frame?.visible ? 'true' : 'false'}, frame? ${!!this.frame ? 'true' : 'false'}` )
        return this;
    }

    public hide(): this {
        this.frame?.setVisible(false);
        return this;
    }

    public destroy(): void {
        this.textFrame?.destroy();
        this.frame?.destroy();
        this.frame = undefined;
        this.textFrame = undefined;
    }
}
