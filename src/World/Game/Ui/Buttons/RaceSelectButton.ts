import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

export class RaceSelectButton extends AbstractActionButton {
    private static Icon: string = 'ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn.blp';
    private readonly toolTip: Frame;

    constructor(game: WarcraftMaul, x: number, y: number, size: number, idx: number = 0) {
        super(game, `raceSelectButton${idx}`, RaceSelectButton.Icon, x, y, size);

        this.toolTip = Frame.createType('FaceFrameTooltip', this.backdropHandle, 0, 'TEXT', '')!;
        this.buttonHandle.setTooltip(this.toolTip);
        this.toolTip.setAbsPoint(FRAMEPOINT_CENTER, x, y + 0.025);
        this.toolTip.setText('Open the race selection');
    }

    public clickAction(): void {
        // Local frame event: the toggle itself runs on every client via PlayerSync
        this.disable();
        this.game.playerSync.send('race-toggle');
        this.enable();
    }
}
