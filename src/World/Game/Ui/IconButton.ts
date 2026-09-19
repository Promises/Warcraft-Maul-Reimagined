import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {GameTowerDef} from '../../Races/HybridRandom.types';
import {trackHover} from '../UiHover';

const TOOLTIP_WIDTH = 0.29;
const TOOLTIP_PADDING = 0.0315;

/**
 * One slot of the hybrid build panel. Content is per player, so it is only ever
 * set for the local player.
 */
export class HybridBuildPanelButton {
    private readonly button: Frame;
    private readonly icon: Frame;
    private readonly tooltip: Frame | undefined;
    private readonly title: Frame | undefined;
    private readonly description: Frame | undefined;
    private readonly goldCost: Frame | undefined;

    constructor(game: WarcraftMaul, name: string, parent: Frame, x: number, y: number, size: number,
                onClick: () => void) {
        this.button = Frame.createType(name, parent, 0, 'BUTTON', 'StandardButtonTemplate')!;
        this.button.setSize(size, size);
        this.button.setAbsPoint(FRAMEPOINT_CENTER, x, y);

        this.icon = Frame.createType(`${name}Icon`, this.button, 0, 'BACKDROP', 'ButtonBackdropTemplate')!;
        this.icon.setAllPoints(this.button);

        // BoxedText comes from war3mapImported\ui\CustomTextButton.fdf: title, description, gold icon, gold value
        this.tooltip = Frame.create('BoxedText', this.button, 0, 0);
        if (this.tooltip) {
            this.tooltip.setPoint(FRAMEPOINT_BOTTOM, this.button, FRAMEPOINT_TOP, 0, 0.006);
            this.button.setTooltip(this.tooltip);
            this.title = this.tooltip.getChild(0);
            this.description = this.tooltip.getChild(1);
            this.goldCost = this.tooltip.getChild(3);
        }

        // Frame events only fire on the clicking client, so onClick must not touch game state
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
    public setTower(player: Defender, tower: GameTowerDef): void {
        if (!player.isLocal()) {
            return;
        }
        this.icon.setTexture(tower.icon ?? '', 0, true);
        this.title?.setText(GetLocalizedString(tower.name) ?? tower.name);
        this.description?.setText(GetLocalizedString(tower.toolTipExtended) ?? tower.toolTipExtended);
        this.goldCost?.setText(`${tower.goldCost}`);
        this.fitTooltip();
    }

    public setStatic(player: Defender, icon: string, title: string, description: string): void {
        if (!player.isLocal()) {
            return;
        }
        this.icon.setTexture(icon, 0, true);
        this.title?.setText(title);
        this.description?.setText(description);
        this.goldCost?.setText('');
        this.fitTooltip();
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
