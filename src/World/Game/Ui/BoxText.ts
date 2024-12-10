import { Frame } from "w3ts";

export class BoxText {
    private frame: Frame | undefined;
    private titleFrame: Frame | undefined;
    private valueFrame: Frame | undefined;

    constructor(name: string) {
        // Load the template if not already loaded
        const loadToc = Frame.loadTOC("uiImport\\BoxText.toc");
        print(`loadToc: ${loadToc ? 'true' : 'false'}`)
        // Get the game UI as parent
        const gameUI = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
        if (!gameUI) {
            print('NO UI')
            return;
        };

        // Create the main frame
        this.frame = Frame.createType(
            name,                // Unique name for this instance
            gameUI,             // Parent frame
            0,                  // Create context
            "BoxedText",        // The frame type from FDF
            ""                  // No inheritance needed since it's defined in FDF
        );

        print('Mainframe ' + BlzFrameGetName(this.frame?.handle!))

        if (!this.frame) {
            print('NO FRAME')
            return;
        };

        // Get the child frames defined in the FDF
        this.titleFrame = Frame.fromName("BoxedTextTitle", 0);
        this.valueFrame = Frame.fromName("BoxedTextValue", 0);

        print(`tittle: ${!!this.titleFrame ? 'true' : 'false'}, value: ${!!this.valueFrame ? 'true' : 'false'}`)
        print('TitleFrame: ' + BlzFrameGetName(this.titleFrame!.handle!))
        print('childcount: ' + this.frame.childrenCount)

    }

    public setTitle(text: string): this {
        this.titleFrame?.setText(text);
        return this;
    }

    public setValue(text: string): this {
        this.valueFrame?.setText(text);
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
        this.frame?.destroy();
        this.frame = undefined;
        this.titleFrame = undefined;
        this.valueFrame = undefined;
    }
}
