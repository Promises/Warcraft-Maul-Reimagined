import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Sapling extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.mana === 5) {
            this.Upgrade(FourCC('u036'));
        } else {
            this.unit.mana += 1.00;
        }
    }

}
