import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

export class RaceSelectButton extends AbstractActionButton {
    private static Icon: string = 'ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn.blp';
    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `raceSelectButton${idx}`, RaceSelectButton.Icon, rail, offsetX, size);
        this.setTooltip('Race selection', 'Opens the race panel. |cffffcc00-race|r');
    }

    public clickAction(): void {
        // The click fires on every client; the panel is pure view, so toggle only acts on
        // the clicking player's own client
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        this.game.raceSelectPanel.toggle(player);
    }
}
