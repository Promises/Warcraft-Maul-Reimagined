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
        // Opening the panel is local UI; only placing a tower is synced
        this.disable();
        this.game.hybridBuildPanel.toggleLocal();
        this.enable();
    }
}
