import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

export class HybridBuildButton extends AbstractActionButton {
    private static Icon: string = 'ReplaceableTextures\\CommandButtons\\BTNBasicStruct.blp';
    private readonly toolTip: Frame;

    constructor(game: WarcraftMaul, x: number, y: number, size: number, idx: number = 0) {
        super(game, `hybridBuildButton${idx}`, HybridBuildButton.Icon, x, y, size);

        this.toolTip = Frame.createType('FaceFrameTooltip', this.backdropHandle, 0, 'TEXT', '')!;
        this.buttonHandle.setTooltip(this.toolTip);
        this.toolTip.setAbsPoint(FRAMEPOINT_CENTER, x, y + 0.025);
        this.toolTip.setText('Open the hybrid build menu');
    }

    public clickAction(): void {
        // The click fires on every client with the clicking player; the panel toggles for
        // that player everywhere so build-mode handles stay in step (visuals gated inside)
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        this.disable();
        this.game.hybridBuildPanel.toggle(player);
        this.enable();
    }
}
