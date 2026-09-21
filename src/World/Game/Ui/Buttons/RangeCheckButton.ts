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
    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `rangeCheckButton${idx}`, RangeCheckButton.offIcon, rail, offsetX, size);
        this.setTooltip('Range check', 'Shows the attack range of every tower you select. |cffffcc00-range|r');
    }

    public clickAction(): void {
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        this.disable();
        const on = player.toggleRangeCheck();
        const local = GetTriggerPlayer() === GetLocalPlayer();
        if (local) {
            this.backdropHandle.setTexture(on ? RangeCheckButton.onIcon : RangeCheckButton.offIcon, 0, true);
        }
        this.setOn(on, local);
        this.enable();
    }
}
