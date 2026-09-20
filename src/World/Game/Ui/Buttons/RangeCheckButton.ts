import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

/**
 * Toggles the player's range check mode: while on, selecting a tower draws its attack range.
 * The click fires on every client with the clicking player; the mode is per player and is
 * toggled everywhere (the ring's image handle must exist on every client), and only the
 * icon swap is local.
 */
export class RangeCheckButton extends AbstractActionButton {
    private static readonly offIcon: string = 'ReplaceableTextures\\CommandButtonsDisabled\\DISBTNMarksmanship.blp';
    private static readonly onIcon: string = 'ReplaceableTextures\\CommandButtons\\BTNMarksmanship.blp';
    private readonly toolTip: Frame;

    constructor(game: WarcraftMaul, x: number, y: number, size: number, idx: number = 0) {
        super(game, `rangeCheckButton${idx}`, RangeCheckButton.offIcon, x, y, size);
        this.toolTip = Frame.createType('FaceFrameTooltip', this.backdropHandle, 0, 'TEXT', '')!;
        this.buttonHandle.setTooltip(this.toolTip);
        this.toolTip.setAbsPoint(FRAMEPOINT_CENTER, x, y + 0.025);
        this.toolTip.setText('Show the range of selected towers');
    }

    public clickAction(): void {
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        this.disable();
        const on = player.toggleRangeCheck();
        if (GetTriggerPlayer() === GetLocalPlayer()) {
            this.backdropHandle.setTexture(on ? RangeCheckButton.onIcon : RangeCheckButton.offIcon, 0, true);
        }
        this.enable();
    }
}
