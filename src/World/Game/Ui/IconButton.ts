import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {trackHover} from './UiHover';

const TOOLTIP_WIDTH = 0.29;
const TOOLTIP_PADDING = 0.0315;
const TOOLTIP_LEVEL = 20;

export interface IconButtonContent {
    icon: string;
    title: string;
    description: string;
    /** Shown on the gold line of the tooltip; omit to leave it empty */
    goldCost?: number;
}

/**
 * A square icon button with a BoxedText tooltip (title, description, gold cost).
 * Frames are shared by all clients, so content is only ever set for the local player.
 * A click event fires on every client with the clicking player, so onClick runs everywhere
 * and gets that player: per-player game logic may run directly (it stays in step), but
 * anything visual must be gated to `player.isLocal()`.
 */
export class IconButton {
    private readonly button: Frame;
    private readonly icon: Frame;
    private readonly tooltip: Frame | undefined;
    private readonly title: Frame | undefined;
    private readonly description: Frame | undefined;
    private readonly goldCost: Frame | undefined;
    private readonly hotkeyLabel: Frame;

    constructor(game: WarcraftMaul, name: string, parent: Frame, x: number, y: number, size: number,
                onClick: (this: void, player: Defender) => void, showTooltip: boolean = true) {
        this.button = Frame.createType(name, parent, 0, 'BUTTON', 'StandardButtonTemplate')!;
        this.button.setSize(size, size);
        this.button.setAbsPoint(FRAMEPOINT_CENTER, x, y);

        this.icon = Frame.createType(`${name}Icon`, this.button, 0, 'BACKDROP', 'ButtonBackdropTemplate')!;
        this.icon.setAllPoints(this.button);
        // Overlapping siblings at one level flicker on hover; layers get their own level
        this.icon.setLevel(1);

        // BoxedText comes from war3mapImported\ui\CustomTextButton.fdf: title, description, gold icon, gold value.
        // A panel with its own details pane passes showTooltip=false to avoid a hover box over it.
        this.tooltip = showTooltip ? Frame.create('BoxedText', this.button, 0, 0) : undefined;
        if (this.tooltip) {
            this.tooltip.setPoint(FRAMEPOINT_BOTTOM, this.button, FRAMEPOINT_TOP, 0, 0.006);
            // A tooltip covers the tiles above its button; its own high level keeps the draw order stable
            this.tooltip.setLevel(TOOLTIP_LEVEL);
            this.button.setTooltip(this.tooltip);
            this.title = this.tooltip.getChild(0);
            this.description = this.tooltip.getChild(1);
            this.goldCost = this.tooltip.getChild(3);
        }

        // Hotkey letter in the corner, like the command card's; empty until setHotkey
        this.hotkeyLabel = Frame.createType(`${name}Hotkey`, this.button, 0, 'TEXT', '')!;
        this.hotkeyLabel.setSize(size, size * 0.4);
        this.hotkeyLabel.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.button, FRAMEPOINT_BOTTOMRIGHT, -0.002, 0.001);
        BlzFrameSetTextAlignment(this.hotkeyLabel.handle, TEXT_JUSTIFY_BOTTOM, TEXT_JUSTIFY_RIGHT);
        this.hotkeyLabel.setLevel(2);
        this.hotkeyLabel.setText('');

        const trigger = Trigger.create();
        trigger.triggerRegisterFrameEvent(this.button, FRAMEEVENT_CONTROL_CLICK);
        trigger.addAction(() => {
            // Drop keyboard focus so the button does not swallow hotkeys afterwards
            this.button.setEnabled(false);
            this.button.setEnabled(true);
            const player = game.players.get(GetPlayerId(GetTriggerPlayer()!));
            if (player) {
                onClick(player);
            }
        });
        trackHover(game, this.button);
    }

    /** Local UI only: call for every player, it applies to the local one. */
    public setContent(player: Defender, content: IconButtonContent): void {
        if (!player.isLocal()) {
            return;
        }
        this.icon.setTexture(content.icon, 0, true);
        this.title?.setText(GetLocalizedString(content.title) ?? content.title);
        this.description?.setText(GetLocalizedString(content.description) ?? content.description);
        this.goldCost?.setText(content.goldCost === undefined ? '' : `${content.goldCost}`);
        this.fitTooltip();
    }

    public setVisible(visible: boolean): void {
        this.button.setVisible(visible);
    }

    /** The key label shown in the corner; the same on every client. */
    public setHotkey(label: string): void {
        this.hotkeyLabel.setText(`|cffffcc00${label}|r`);
    }

    /** Dim the icon, e.g. for an unavailable choice; local UI only. */
    public setDimmed(player: Defender, dimmed: boolean): void {
        if (player.isLocal()) {
            this.icon.setAlpha(dimmed ? 90 : 255);
        }
    }

    private fitTooltip(): void {
        if (!this.tooltip) {
            return;
        }
        for (const text of [this.title, this.description, this.goldCost]) {
            text?.setSize(TOOLTIP_WIDTH - 0.01, 0);
        }
        const height = (this.title?.height ?? 0) + (this.description?.height ?? 0) + (this.goldCost?.height ?? 0);
        this.tooltip.setSize(TOOLTIP_WIDTH, height + TOOLTIP_PADDING);
    }
}
