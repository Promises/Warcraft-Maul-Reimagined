import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Bubbles extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.getBaseDamage(0) <= 4) {
            // Popped: back to an Uncharged Rune, not rock
            this.Upgrade(FourCC('n00A'));
        } else {
            this.unit.setBaseDamage(this.unit.getBaseDamage(0) - 5, 0);
        }
    }

}
