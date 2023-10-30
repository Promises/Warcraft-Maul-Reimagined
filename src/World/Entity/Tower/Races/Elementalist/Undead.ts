import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Undead extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        this.unit.setBaseDamage(0, this.unit.getBaseDamage(0) + 5);
    }

}
