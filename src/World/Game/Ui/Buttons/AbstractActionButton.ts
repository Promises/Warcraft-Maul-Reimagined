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
const TOOLTIP_LEVEL = 20;

/**
 * One button on the action bar: a BUTTON hanging off the rail, its icon inset in a bevelled
 * well, and a boxed tooltip. Subclasses implement clickAction(); the click event fires on
 * every client with the clicking player (see the README in "Wc3 buttons/action-bar").
 */
/**
 * Debug isolation of the hover flicker (-flick <n> rebuilds the bar):
 * 0 normal; 1 no well/rim frames; 2 tooltip as a plain TEXT like the old bar;
 * 3 plain BUTTON base (no StandardButtonTemplate); 4 no tooltip at all; 5 no hover tracking
 */
export let ACTION_BUTTON_VARIANT = 0;

export function setActionButtonVariant(variant: number): void {
    ACTION_BUTTON_VARIANT = variant;
}

export abstract class AbstractActionButton {
    private readonly _buttonHandle: Frame;
    private readonly _backdropHandle: Frame;
    private readonly well: Frame;
    private readonly onRim: Frame;
    private readonly hotkeyLabel: Frame;
    private readonly tooltip: Frame | undefined;
    private readonly trig: Trigger;
    private readonly _game: WarcraftMaul;

    constructor(game: WarcraftMaul, name: string, icon: string, rail: Frame, offsetX: number, size: number) {
        this._game = game;

        // The well and the gold rim are siblings of the button on the rail, not layers inside
        // it: extra frames stacked inside a button make its hover hit-test flap (cursor,
        // highlight and tooltip flicker). The button itself is the inset icon, exactly the
        // structure of the build panel's tiles.
        const variant = ACTION_BUTTON_VARIANT;
        this.well = Frame.createType(`${name}Well`, rail, 0, 'BACKDROP', '')!;
        this.well.setSize(size, size);
        this.well.setPoint(FRAMEPOINT_CENTER, rail, FRAMEPOINT_CENTER, offsetX, 0);
        this.well.setTexture(WELL_TEXTURE, 0, true);
        if (variant === 1) {
            this.well.setVisible(false);
        }

        const iconSize = size * (1 - 2 * WELL_BORDER);
        this._buttonHandle = Frame.createType(name, rail, 0, 'BUTTON', variant === 3 ? '' : 'StandardButtonTemplate')!;
        this._buttonHandle.setSize(iconSize, iconSize);
        this._buttonHandle.setPoint(FRAMEPOINT_CENTER, rail, FRAMEPOINT_CENTER, offsetX, 0);
        this._buttonHandle.setLevel(1);

        this._backdropHandle = Frame.createType(`${name}BackDrop`, this._buttonHandle, 0, 'BACKDROP', 'ButtonBackdropTemplate')!;
        this._backdropHandle.setAllPoints(this._buttonHandle);
        this._backdropHandle.setTexture(icon, 0, true);

        this.hotkeyLabel = Frame.createType(`${name}Hotkey`, this._buttonHandle, 0, 'TEXT', '')!;
        this.hotkeyLabel.setSize(iconSize, iconSize * 0.45);
        this.hotkeyLabel.setPoint(FRAMEPOINT_BOTTOMRIGHT, this._buttonHandle, FRAMEPOINT_BOTTOMRIGHT, -0.001, 0.0005);
        BlzFrameSetTextAlignment(this.hotkeyLabel.handle, TEXT_JUSTIFY_BOTTOM, TEXT_JUSTIFY_RIGHT);
        this.hotkeyLabel.setLevel(2);
        this.hotkeyLabel.setText('');

        // Shown over the well while a toggle is on; a backdrop takes no mouse input
        this.onRim = Frame.createType(`${name}On`, rail, 0, 'BACKDROP', '')!;
        this.onRim.setSize(size, size);
        this.onRim.setPoint(FRAMEPOINT_CENTER, rail, FRAMEPOINT_CENTER, offsetX, 0);
        this.onRim.setTexture(WELL_ON_TEXTURE, 0, true);
        this.onRim.setLevel(3);
        this.onRim.setVisible(false);

        // BoxedText from war3mapImported\ui\CustomTextButton.fdf: title, description
        this.tooltip = variant === 4 ? undefined : variant === 2
            ? Frame.createType(`${name}Tip`, this._buttonHandle, 0, 'TEXT', '')
            : Frame.create('BoxedText', this._buttonHandle, 0, 0);
        if (this.tooltip) {
            this.tooltip.setPoint(FRAMEPOINT_BOTTOM, this.well, FRAMEPOINT_TOP, 0, 0.010);
            this.tooltip.setLevel(TOOLTIP_LEVEL);
            this._buttonHandle.setTooltip(this.tooltip);
        }

        this.trig = Trigger.create();
        this.trig.addAction(() => this.clickAction());
        this.trig.triggerRegisterFrameEvent(this._buttonHandle, FRAMEEVENT_CONTROL_CLICK);
        if (variant !== 5) {
            trackHover(game, this._buttonHandle);
        }
    }

    /** Tooltip contents; the same on every client, so no gating needed. */
    protected setTooltip(title: string, description: string): void {
        if (!this.tooltip) {
            return;
        }
        if (ACTION_BUTTON_VARIANT === 2) {
            this.tooltip.setText(`${title}: ${description}`);
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

    /** The key label in the corner; the same on every client. */
    protected setHotkey(label: string): void {
        this.hotkeyLabel.setText(`|cffffcc00${label}|r`);
    }

    /** Gold rim while a toggle is on. View only: call for the acting player, it applies locally. */
    protected setOn(on: boolean, local: boolean): void {
        if (local) {
            this.onRim.setVisible(on);
        }
    }

    /** Removes every frame of the button (debug rebuilds). */
    public destroy(): void {
        this.tooltip?.destroy();
        this.hotkeyLabel.destroy();
        this._backdropHandle.destroy();
        this.onRim.destroy();
        this.well.destroy();
        this._buttonHandle.destroy();
        this.trig.destroy();
    }

    /** Local view: the button, its well and rim. */
    public setVisible(visible: boolean): void {
        this._buttonHandle.setVisible(visible);
        this.well.setVisible(visible);
        if (!visible) {
            this.onRim.setVisible(false);
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
