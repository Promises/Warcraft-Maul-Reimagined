import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class LowTide extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.mana === 2) {
            this.Upgrade(FourCC('u029'));
        } else {
            this.unit.mana += 1.00;
        }
    }
}
