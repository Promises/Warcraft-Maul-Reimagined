import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Bubbles extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.getBaseDamage(0) <= 4) {
            this.Upgrade(FourCC('n027'));
        } else {
            this.unit.setBaseDamage(0, this.unit.getBaseDamage(0) - 5);
        }
    }

}
