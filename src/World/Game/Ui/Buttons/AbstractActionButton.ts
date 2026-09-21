import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame, Trigger} from "w3ts";
import {trackHover} from '../UiHover';

// The icon frame art (design handoff, imported as uiImport\CommandButtons\frame-icon*.dds):
// a bevelled well the icon sits in, a gold version for a toggle that is on
const WELL_TEXTURE = 'uiImport\\CommandButtons\\frame-icon.dds';
const WELL_ON_TEXTURE = 'uiImport\\CommandButtons\\frame-icon-on.dds';
// The frame art's border is 11 px of 96, the icon is inset that much
const WELL_BORDER = 11 / 96;
const TOOLTIP_WIDTH = 0.20;
const TOOLTIP_PADDING = 0.0315;

/**
 * One button on the action bar: a BUTTON hanging off the rail, its icon inset in a bevelled
 * well, and a boxed tooltip. Subclasses implement clickAction(); the click event fires on
 * every client with the clicking player (see the README in "Wc3 buttons/action-bar").
 */
export abstract class AbstractActionButton {
    private readonly _buttonHandle: Frame;
    private readonly _backdropHandle: Frame;
    private readonly well: Frame;
    private readonly onRim: Frame;
    private readonly tooltip: Frame | undefined;
    private readonly trig: Trigger;
    private readonly _game: WarcraftMaul;

    constructor(game: WarcraftMaul, name: string, icon: string, rail: Frame, offsetX: number, size: number) {
        this._game = game;

        this._buttonHandle = Frame.createType(name, rail, 0, 'BUTTON', 'StandardButtonTemplate')!;
        this._buttonHandle.setSize(size, size);
        this._buttonHandle.setPoint(FRAMEPOINT_CENTER, rail, FRAMEPOINT_CENTER, offsetX, 0);

        this.well = Frame.createType(`${name}Well`, this._buttonHandle, 0, 'BACKDROP', '')!;
        this.well.setAllPoints(this._buttonHandle);
        this.well.setTexture(WELL_TEXTURE, 0, true);

        const inset = size * WELL_BORDER;
        this._backdropHandle = Frame.createType(`${name}BackDrop`, this._buttonHandle, 0, 'BACKDROP', 'ButtonBackdropTemplate')!;
        this._backdropHandle.setPoint(FRAMEPOINT_TOPLEFT, this._buttonHandle, FRAMEPOINT_TOPLEFT, inset, -inset);
        this._backdropHandle.setPoint(FRAMEPOINT_BOTTOMRIGHT, this._buttonHandle, FRAMEPOINT_BOTTOMRIGHT, -inset, inset);
        this._backdropHandle.setTexture(icon, 0, true);

        // Drawn over the well while a toggle is on; created last so it renders on top
        this.onRim = Frame.createType(`${name}On`, this._buttonHandle, 0, 'BACKDROP', '')!;
        this.onRim.setAllPoints(this._buttonHandle);
        this.onRim.setTexture(WELL_ON_TEXTURE, 0, true);
        this.onRim.setVisible(false);

        // BoxedText from war3mapImported\ui\CustomTextButton.fdf: title, description
        this.tooltip = Frame.create('BoxedText', this._buttonHandle, 0, 0);
        if (this.tooltip) {
            this.tooltip.setPoint(FRAMEPOINT_BOTTOM, this._buttonHandle, FRAMEPOINT_TOP, 0, 0.008);
            this._buttonHandle.setTooltip(this.tooltip);
        }

        this.trig = Trigger.create();
        this.trig.addAction(() => this.clickAction());
        this.trig.triggerRegisterFrameEvent(this._buttonHandle, FRAMEEVENT_CONTROL_CLICK);
        trackHover(game, this._buttonHandle);
    }

    /** Tooltip contents; the same on every client, so no gating needed. */
    protected setTooltip(title: string, description: string): void {
        if (!this.tooltip) {
            return;
        }
        const titleFrame = this.tooltip.getChild(0);
        const descriptionFrame = this.tooltip.getChild(1);
        titleFrame?.setText(title);
        descriptionFrame?.setText(description);
        for (const text of [titleFrame, descriptionFrame]) {
            text?.setSize(TOOLTIP_WIDTH - 0.01, 0);
        }
        // The gold line (child 3) is unused here; keep it out of the box
        this.tooltip.getChild(3)?.setText('');
        const height = (titleFrame?.height ?? 0) + (descriptionFrame?.height ?? 0);
        this.tooltip.setSize(TOOLTIP_WIDTH, height + TOOLTIP_PADDING);
    }

    /** Gold rim while a toggle is on. View only: call for the acting player, it applies locally. */
    protected setOn(on: boolean, local: boolean): void {
        if (local) {
            this.onRim.setVisible(on);
        }
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
