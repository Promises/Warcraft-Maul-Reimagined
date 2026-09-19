import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {trackHover} from './UiHover';

const TOOLTIP_WIDTH = 0.29;
const TOOLTIP_PADDING = 0.0315;

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
 * Clicks are local frame events: onClick must not touch game state, only send sync messages.
 */
export class IconButton {
    private readonly button: Frame;
    private readonly icon: Frame;
    private readonly tooltip: Frame | undefined;
    private readonly title: Frame | undefined;
    private readonly description: Frame | undefined;
    private readonly goldCost: Frame | undefined;

    constructor(game: WarcraftMaul, name: string, parent: Frame, x: number, y: number, size: number,
                onClick: () => void, showTooltip: boolean = true) {
        this.button = Frame.createType(name, parent, 0, 'BUTTON', 'StandardButtonTemplate')!;
        this.button.setSize(size, size);
        this.button.setAbsPoint(FRAMEPOINT_CENTER, x, y);

        this.icon = Frame.createType(`${name}Icon`, this.button, 0, 'BACKDROP', 'ButtonBackdropTemplate')!;
        this.icon.setAllPoints(this.button);

        // BoxedText comes from war3mapImported\ui\CustomTextButton.fdf: title, description, gold icon, gold value.
        // A panel with its own details pane passes showTooltip=false to avoid a hover box over it.
        this.tooltip = showTooltip ? Frame.create('BoxedText', this.button, 0, 0) : undefined;
        if (this.tooltip) {
            this.tooltip.setPoint(FRAMEPOINT_BOTTOM, this.button, FRAMEPOINT_TOP, 0, 0.006);
            this.button.setTooltip(this.tooltip);
            this.title = this.tooltip.getChild(0);
            this.description = this.tooltip.getChild(1);
            this.goldCost = this.tooltip.getChild(3);
        }

        const trigger = Trigger.create();
        trigger.triggerRegisterFrameEvent(this.button, FRAMEEVENT_CONTROL_CLICK);
        trigger.addAction(() => {
            // Drop keyboard focus so the button does not swallow hotkeys afterwards
            this.button.setEnabled(false);
            this.button.setEnabled(true);
            onClick();
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
