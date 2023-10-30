import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';
import { AttackActionTower } from '../../Specs/AttackActionTower';

export class DormantPheonixEgg extends Tower implements EndOfRoundTower {


    public EndOfRoundAction(): void {
        this.unit.mana += 1.00;
    }
}
