import { AbstractActionButton } from './AbstractActionButton';
import { WarcraftMaul } from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

export class DebugGoldButton extends AbstractActionButton {
    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `goldButton${idx}`, 'UI\\Feedback\\Resources\\ResourceGold.blp', rail, offsetX, size);
    }

    public clickAction(): void {
        this.game.players.get(0)?.giveGold(1000);
    }

}
