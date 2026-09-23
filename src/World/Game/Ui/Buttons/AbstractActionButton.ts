import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from "w3ts";
import {trackUiPress} from '../UiPress';
import {createBackdrop, createText, onClick, Tooltip} from '../Frames';

// The icon frame art (design handoff, imported as uiImport\CommandButtons\frame-icon*.dds):
// a bevelled well the icon sits in, a gold version for a toggle that is on
const WELL_TEXTURE = 'uiImport\\CommandButtons\\frame-icon.dds';
const WELL_ON_TEXTURE = 'uiImport\\CommandButtons\\frame-icon-on.dds';
// The frame art's border is 11 px of 96, the icon is inset that much
const WELL_BORDER = 11 / 96;
const TOOLTIP_WIDTH = 0.20;

/**
 * One button on the action bar, built bottom-up (see Frames): the bevelled well on the rail,
 * the icon inset in it, and a CustomIconButton (our FDF: a BUTTON with the standard
 * mouse-over glow) covering the icon, with the hotkey label and a boxed tooltip the engine
 * shows. The gold rim for a toggle that is on sits over the icon.
 * Subclasses implement clickAction(); the click event fires on every client with the
 * clicking player (see the README in "Wc3 buttons/action-bar").
 */
export abstract class AbstractActionButton {
    private readonly _buttonHandle: Frame;
    private readonly _backdropHandle: Frame;
    private readonly well: Frame;
    private readonly onRim: Frame;
    private readonly hotkeyLabel: Frame;
    private readonly tooltip: Tooltip;
    private readonly _game: WarcraftMaul;

    constructor(game: WarcraftMaul, name: string, icon: string, rail: Frame, offsetX: number, size: number) {
        this._game = game;

        this.well = createBackdrop(`${name}Well`, rail, WELL_TEXTURE);
        this.well.setSize(size, size);
        this.well.setPoint(FRAMEPOINT_CENTER, rail, FRAMEPOINT_CENTER, offsetX, 0);

        const iconSize = size * (1 - 2 * WELL_BORDER);
        this._backdropHandle = createBackdrop(`${name}BackDrop`, this.well, icon);
        this._backdropHandle.setSize(iconSize, iconSize);
        this._backdropHandle.setPoint(FRAMEPOINT_CENTER, this.well, FRAMEPOINT_CENTER, 0, 0);

        this._buttonHandle = Frame.createType(name, this._backdropHandle, 0, 'BUTTON', 'CustomIconButton')!;
        this._buttonHandle.setAllPoints(this._backdropHandle);

        this.hotkeyLabel = createText(`${name}Hotkey`, this._buttonHandle, '', TEXT_JUSTIFY_BOTTOM, TEXT_JUSTIFY_RIGHT);
        this.hotkeyLabel.setSize(iconSize, iconSize * 0.45);
        this.hotkeyLabel.setPoint(FRAMEPOINT_BOTTOMRIGHT, this._buttonHandle, FRAMEPOINT_BOTTOMRIGHT, -0.001, 0.0005);

        // Shown over the icon while a toggle is on; created after the button so it draws above it
        this.onRim = createBackdrop(`${name}On`, this._backdropHandle, WELL_ON_TEXTURE);
        this.onRim.setAllPoints(this.well);
        this.onRim.setVisible(false);

        this.tooltip = new Tooltip(name, this._buttonHandle, TOOLTIP_WIDTH, this.well);

        onClick(this._buttonHandle, () => this.clickAction());
        trackUiPress(game, this._buttonHandle);
    }

    /** Tooltip contents; the same on every client, so no gating needed. */
    protected setTooltip(title: string, description: string): void {
        this.tooltip.setText(title, description);
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

    /** Local view: the button, its well and rim. */
    public setVisible(visible: boolean): void {
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
