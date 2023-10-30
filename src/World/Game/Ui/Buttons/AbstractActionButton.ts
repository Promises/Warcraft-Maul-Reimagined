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
        this._buttonHandle = Frame.createType(
            name,
            gameFrame,
            0,
            'StandardButtonTemplate',
            'BUTTON',
        )!;


        this._backdropHandle = Frame.createType(`${name}BackDrop`, gameFrame, 0, 'BACKDROP', 'ButtonBackdropTemplate')!

        this._buttonHandle.setSize(size, size);
        this._backdropHandle.setSize(size, size)
        this._backdropHandle.setTexture(icon, 0, true)
        // BlzFrameSetTexture(this._buttonHandle, 'uiImport\\CommandButtons\\BTNNone.dds', 0, true);
        this._buttonHandle.setAlpha(0);
        this._buttonHandle.setAbsPoint(FRAMEPOINT_CENTER, x, y);
        this._buttonHandle.setPoint(FRAMEPOINT_CENTER, this._buttonHandle, FRAMEPOINT_CENTER, 0.0, 0.0);

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

