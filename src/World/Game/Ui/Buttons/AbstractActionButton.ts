import {Log} from '../../../../lib/Serilog/Serilog';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame, Trigger} from "w3ts";

export abstract class AbstractActionButton {


    private _buttonHandle: Frame;
    private _backdropHandle: Frame;
    private trig: Trigger;
    private _game: WarcraftMaul;

    constructor(game: WarcraftMaul, name: string, icon: string, x: number, y: number, size: number) {
        this._game = game;
        const gameFrame = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;

        // Create button
        this._buttonHandle = Frame.createType(
            name,
            gameFrame,
            0,
            'BUTTON',
            'StandardButtonTemplate',
        )!;

        // Create backdrop as child of button
        this._backdropHandle = Frame.createType(
            `${name}BackDrop`,
            this._buttonHandle,  // Make backdrop a child of button
            0,
            'BACKDROP',
            'ButtonBackdropTemplate'
        )!;

        // Set sizes
        this._buttonHandle.setSize(size, size);
        this._backdropHandle.setSize(size, size);

        // Set texture
        this._backdropHandle.setTexture(icon, 0, true);

        // Position the button (backdrop will follow)
        this._buttonHandle.setAbsPoint(FRAMEPOINT_CENTER, x, y);

        // Don't set alpha to 0
        // this._buttonHandle.setAlpha(0);

        // Set up click trigger
        this.trig = Trigger.create();
        this.trig.addAction(() => this.clickAction());
        this.trig.triggerRegisterFrameEvent(this._buttonHandle, FRAMEEVENT_CONTROL_CLICK);
    }

    public disable(): void {
        this._buttonHandle.setEnabled(false);
    }

    public enable(): void {
        this._buttonHandle.setEnabled(true);
    }

    get game(): WarcraftMaul {
        return this._game;
    }

    get backdropHandle(): Frame {
        return this._backdropHandle;
    }

    get buttonHandle(): Frame {
        return this._buttonHandle;
    }


    public abstract clickAction(): void;
}

