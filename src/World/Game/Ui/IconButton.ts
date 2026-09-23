import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {trackUiPress} from './UiPress';
import {createText, onClick, Tooltip} from './Frames';

const TOOLTIP_WIDTH = 0.29;

export interface IconButtonContent {
    icon: string;
    title: string;
    description: string;
    /** Shown on the last line of the tooltip; omit to leave it out */
    goldCost?: number;
}

/**
 * A square icon button: the icon is a BACKDROP and a CustomIconButton (our FDF: a BUTTON with
 * the standard mouse-over glow) covers it as its child, with the hotkey label and the tooltip
 * on the button (see Frames). Place it through `frame`.
 * Frames are shared by all clients, so content is only ever set for the local player.
 * A click event fires on every client with the clicking player, so onClick runs everywhere
 * and gets that player: per-player game logic may run directly (it stays in step), but
 * anything visual must be gated to `player.isLocal()`.
 */
export class IconButton {
    /** The icon; the root of the button, to place and show/hide it */
    public readonly frame: Frame;
    private readonly button: Frame;
    private readonly tooltip: Tooltip | undefined;
    private readonly hotkeyLabel: Frame;

    constructor(game: WarcraftMaul, name: string, parent: Frame, size: number,
                handler: (this: void, player: Defender) => void, showTooltip: boolean = true) {
        this.frame = Frame.createType(`${name}Icon`, parent, 0, 'BACKDROP', '')!;
        this.frame.setSize(size, size);

        this.button = Frame.createType(name, this.frame, 0, 'BUTTON', 'CustomIconButton')!;
        this.button.setAllPoints(this.frame);

        // Hotkey letter in the corner, like the command card's; empty until setHotkey
        this.hotkeyLabel = createText(`${name}Hotkey`, this.button, '', TEXT_JUSTIFY_BOTTOM, TEXT_JUSTIFY_RIGHT);
        this.hotkeyLabel.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.button, FRAMEPOINT_BOTTOMRIGHT, -0.002, 0.001);
        this.hotkeyLabel.setSize(size, size * 0.4);

        // A panel with its own details pane passes showTooltip=false to avoid a hover box over it
        this.tooltip = showTooltip ? new Tooltip(name, this.button, TOOLTIP_WIDTH) : undefined;

        onClick(this.button, clicker => {
            const player = game.players.get(clicker.id);
            if (player) {
                handler(player);
            }
        });
        trackUiPress(game, this.button);
    }

    /** Local UI only: call for every player, it applies to the local one. */
    public setContent(player: Defender, content: IconButtonContent): void {
        if (!player.isLocal()) {
            return;
        }
        this.frame.setTexture(content.icon, 0, true);
        this.tooltip?.setText(GetLocalizedString(content.title) ?? content.title,
            GetLocalizedString(content.description) ?? content.description, content.goldCost);
    }

    public setVisible(visible: boolean): void {
        this.frame.setVisible(visible);
    }

    /** The key label shown in the corner; the same on every client. */
    public setHotkey(label: string): void {
        this.hotkeyLabel.setText(`|cffffcc00${label}|r`);
    }

    /** Dim the icon, e.g. for an unavailable choice; local UI only. */
    public setDimmed(player: Defender, dimmed: boolean): void {
        if (player.isLocal()) {
            this.frame.setAlpha(dimmed ? 90 : 255);
        }
    }
}
