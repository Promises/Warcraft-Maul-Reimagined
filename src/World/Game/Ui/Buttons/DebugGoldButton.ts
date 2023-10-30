import { AbstractActionButton } from './AbstractActionButton';
import { WarcraftMaul } from '../../../WarcraftMaul';

export class DebugGoldButton extends AbstractActionButton {
    constructor(game: WarcraftMaul, x: number, y: number, size: number, idx: number = 0) {
        super(game, `goldButton${idx}`, 'UI\\Feedback\\Resources\\ResourceGold.blp', x, y, size);
    }

    public clickAction(): void {
        this.disable();
        this.game.players.get(0)?.giveGold(1000);
        this.enable();
    }

}
